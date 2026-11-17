// Consertos da 1.26.2: retornos de quem usa o app no PC.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const tela = (p) => p.avaliar(() => document.getElementById("app").dataset.view);
const tecla = (p, key) => p.avaliar((k) => { (document.activeElement || document.body).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }, key);
const abrirPincel = async (p) => { await p.clicar("#b-pincel"); await p.esperar(() => !document.getElementById("sheet").hidden && !!document.querySelector("#sheet [data-vis]"), 1500); };

export default [
  {
    nome: "música de exemplo passa para a próxima mesmo com a janela escondida (sem o desenho da tela)",
    rodar: async (p) => {
      const antes = await p.avaliar(() => {
        window.requestAnimationFrame = () => 0; // janela em segundo plano: o navegador para de chamar o desenho
        const id = cur().id; alternar(); buscarSeg(cur().d - 0.4); return { id, prox: queue[qi + 1] };
      });
      await p.esperar((id) => cur().id !== id, 4000, antes.id);
      await new Promise((r) => setTimeout(r, 400));
      assert.equal(await p.avaliar(() => cur().id), antes.prox, "passa para a música seguinte, sem pular nenhuma");
      assert.equal(await p.avaliar(() => playing), true, "continua tocando a próxima");
    },
  },
  {
    nome: "o cartão Continuar acompanha a música: barra e tempo que falta andam",
    rodar: async (p) => {
      await p.esperar(() => !!document.querySelector("#ini-cont .ini-barra i"));
      const ler = () => { const c = document.getElementById("ini-cont"); return c.querySelector(".ini-barra i").style.width + "|" + c.querySelector("[data-ini-falta]").textContent; };
      const antes = await p.avaliar(ler);
      await p.avaliar(() => { alternar(); buscarSeg(20); });
      await p.esperar((a, f) => (0, eval)("(" + f + ")")() !== a, 3000, antes, String(ler));
      const depois = await p.avaliar(ler);
      assert.ok(parseFloat(depois) > parseFloat(antes), "a barra avançou: " + antes + " -> " + depois);
      assert.notEqual(depois.split("|")[1], antes.split("|")[1], "o tempo que falta mudou");
    },
  },
  {
    nome: "no PC a barra de baixo tem o botão de música anterior; no celular ele não aparece",
    largura: 1280, altura: 800,
    rodar: async (p) => {
      const ve = () => document.getElementById("mini-prev").getClientRects().length > 0;
      assert.equal(await p.avaliar(ve), true, "aparece no PC");
      const r = await p.avaliar(() => { const a = cur().id; proxima(); const b = cur().id; document.getElementById("mini-prev").click(); return { a, b, c: cur().id, rot: document.getElementById("mini-prev").getAttribute("aria-label") }; });
      assert.notEqual(r.a, r.b); assert.equal(r.c, r.a, "voltou para a música anterior");
      assert.ok(r.rot, "tem nome para leitor de tela");
      await p.tamanho(360, 780);
      assert.equal(await p.avaliar(ve), false, "no celular a barra continua enxuta");
    },
  },
  {
    nome: "a tela Tocando tem um botão de voltar",
    largura: 1280, altura: 800,
    rodar: async (p) => {
      await p.clicar('#nav button[data-v="biblioteca"]'); await p.clicar("#mini-open");
      assert.equal(await tela(p), "tocando");
      assert.equal(await p.avaliar(() => document.getElementById("b-voltar").getClientRects().length > 0), true);
      await p.clicar("#b-voltar");
      assert.equal(await tela(p), "biblioteca", "volta para a tela de onde veio");
    },
  },
  {
    nome: "Esc volta um passo de cada vez",
    largura: 1280, altura: 800,
    rodar: async (p) => {
      await p.clicar("#mini-open"); await abrirPincel(p);
      await tecla(p, "Escape"); await p.esperar(() => document.getElementById("sheet").hidden, 1500);
      assert.equal(await tela(p), "tocando", "o primeiro Esc só fecha a folha");
      await tecla(p, "Escape");
      assert.equal(await tela(p), "inicio", "o segundo volta para a tela anterior");
      await tecla(p, "Escape");
      assert.equal(await tela(p), "inicio", "na primeira tela o Esc não faz nada");
    },
  },
  {
    nome: "Esc não descarta um tema que está sendo editado",
    rodar: async (p) => {
      await p.avaliar(() => { ir("temas"); editando = { nome: "x" }; });
      await tecla(p, "Escape");
      assert.equal(await p.avaliar(() => !!editando), true);
      await p.avaliar(() => { editando = null; });
    },
  },
  {
    nome: "teclas 1 a 5 trocam de aba e a barra abre a busca; dentro de um campo de texto elas só escrevem",
    largura: 1280, altura: 800,
    rodar: async (p) => {
      const esperado = ["inicio", "biblioteca", "playlists", "voce", "temas"];
      for (let i = 4; i >= 0; i--) { await tecla(p, String(i + 1)); assert.equal(await tela(p), esperado[i], "tecla " + (i + 1)); }
      await tecla(p, "/");
      assert.equal(await tela(p), "biblioteca");
      assert.equal(await p.avaliar(() => document.activeElement.id), "q", "o cursor vai para a busca");
      await tecla(p, "3");
      assert.equal(await tela(p), "biblioteca", "digitar na busca não troca de aba");
      await tecla(p, "Escape");
      assert.equal(await p.avaliar(() => document.activeElement.id !== "q"), true, "Esc sai da busca");
      assert.equal(await tela(p), "biblioteca", "e só depois volta de tela");
      await tecla(p, "Escape");
      assert.notEqual(await tela(p), "biblioteca", "o Esc seguinte volta de tela");
    },
  },
  {
    nome: "nos estilos da Aura com cores próprias, a opção de seguir a capa funciona: começa desligada e, ligada, troca as cores do estilo pelas da capa",
    hash: "tocando",
    rodar: async (p) => {
      await p.avaliar(() => { cfg.visual = "aura"; cfg.auraEst = "phonk"; cfg.corCapa = true; aplicarVisual(); });
      await abrirPincel(p);
      const q = '#sheet [aria-labelledby="pz-l-corCapa"]';
      const ler = (q) => { const b = document.querySelector(q); return { marcado: b.getAttribute("aria-checked"), off: b.disabled || b.getAttribute("aria-disabled") === "true", proprias: !!coresDoEstilo(estiloAura()), nota: !!document.querySelector("[data-nota-cor]") }; };
      assert.deepEqual(await p.avaliar(ler, q), { marcado: "false", off: false, proprias: true, nota: true }, "de fábrica o estilo mantém as cores dele");
      await p.clicar(q);
      assert.deepEqual(await p.avaliar(ler, q), { marcado: "true", off: false, proprias: false, nota: true }, "ligada, a Aura usa as cores da capa");
      assert.deepEqual(await p.avaliar(() => [cfg.auraCorCapa, cfg.corCapa]), [true, true], "a escolha dos estilos é separada da dos outros visuais");
      await p.clicar('#sheet [data-estilo="padrao"]');
      assert.deepEqual(await p.avaliar(ler, q), { marcado: "true", off: false, proprias: false, nota: false }, "no Padrão vale a opção de sempre");
      await p.clicar(q);
      assert.deepEqual(await p.avaliar(() => [cfg.auraCorCapa, cfg.corCapa]), [true, false]);
    },
  },
  {
    nome: "em Ajustes a mesma opção também vale para os estilos com cores próprias",
    rodar: async (p) => {
      const q = '#tm [aria-labelledby="l-corCapa"]';
      const abrir = (q) => { ir("temas"); abrirPorta(null); for (const b of [...document.querySelectorAll("#tm [data-porta]")].map((x) => x.dataset.porta)) { abrirPorta(b); if (document.querySelector(q)) return true; } return false; };
      await p.avaliar(() => { cfg.visual = "aura"; cfg.auraEst = "lofi"; cfg.corCapa = true; aplicarVisual(); });
      assert.equal(await p.avaliar(abrir, q), true, "achei a opção em Ajustes");
      assert.equal(await p.avaliar((q) => document.querySelector(q).getAttribute("aria-checked"), q), "false");
      await p.clicar(q);
      assert.deepEqual(await p.avaliar((q) => [document.querySelector(q).getAttribute("aria-checked"), cfg.auraCorCapa, cfg.corCapa], q), ["true", true, true]);
    },
  },
  {
    nome: "no modo carro as teclas de aba e de busca não mexem na tela de baixo",
    largura: 1280, altura: 800,
    rodar: async (p) => {
      await p.avaliar(() => abrirCarro());
      await tecla(p, "2"); await tecla(p, "/");
      assert.equal(await tela(p), "inicio");
      assert.notEqual(await p.avaliar(() => document.activeElement.id), "q");
      await tecla(p, "Escape");
      assert.equal(await p.avaliar(() => emCarro()), false, "Esc sai do modo carro");
    },
  },
  {
    nome: "tema em edição só segura o Esc na tela de Ajustes; nas outras o Esc volta normalmente",
    rodar: async (p) => {
      await p.avaliar(() => { ir("biblioteca"); ir("tocando"); editando = { nome: "x" }; });
      await tecla(p, "Escape");
      assert.equal(await tela(p), "biblioteca");
      await p.avaliar(() => { editando = null; });
    },
  },
  {
    nome: "Esc com o foco na barra de tempo volta de tela (só campo de texto segura o Esc)",
    hash: "tocando",
    rodar: async (p) => {
      await p.avaliar(() => document.getElementById("seek").focus());
      await tecla(p, "Escape");
      assert.equal(await tela(p), "inicio");
    },
  },
  {
    nome: "fim da fila: volta para a primeira música, pausa e avisa, com botão para tocar de novo",
    rodar: async (p) => {
      await p.avaliar(() => { repeat = "off"; qi = queue.length - 1; carregar(true); buscarSeg(cur().d - 0.4); });
      await p.esperar(() => qi === 0 && !playing, 4000);
      const t = await p.avaliar(() => { const t = document.getElementById("toast"); return { on: t.classList.contains("on"), txt: t.textContent, botao: !!t.querySelector("button") }; });
      assert.ok(t.on && /Fim da fila/.test(t.txt) && t.botao, JSON.stringify(t));
      await p.avaliar(() => document.querySelector("#toast button").click());
      assert.deepEqual(await p.avaliar(() => [qi, playing]), [0, true], "o botão toca a fila de novo");
    },
  },
  {
    nome: "fim da fila com a janela escondida: o aviso espera a pessoa voltar",
    rodar: async (p) => {
      await p.avaliar(() => {
        let v = "hidden"; Object.defineProperty(document, "visibilityState", { get: () => v, configurable: true }); window.__ver = () => { v = "visible"; document.dispatchEvent(new Event("visibilitychange", { bubbles: true })); };
        repeat = "off"; qi = queue.length - 1; carregar(true); buscarSeg(cur().d - 0.4);
      });
      await p.esperar(() => qi === 0 && !playing, 4000);
      assert.equal(await p.avaliar(() => /Fim da fila/.test(document.getElementById("toast").textContent)), false, "escondida, ainda não avisa");
      await p.avaliar(() => window.__ver());
      assert.equal(await p.avaliar(() => { const t = document.getElementById("toast"); return t.classList.contains("on") && /Fim da fila/.test(t.textContent); }), true, "avisa quando a janela volta");
    },
  },
  {
    nome: "celular deitado: a barra lateral não soma de novo o recuo do entalhe (o app já recua a tela inteira)",
    node: true,
    rodar: async () => {
      const css = readFileSync(new URL("../css/app.css", import.meta.url), "utf8");
      const bloco = css.slice(css.indexOf("/* Celular deitado:"), css.indexOf("/* PC ou tablet largo"));
      const nav = bloco.split("\n").find((l) => /^\s*nav\{/.test(l));
      assert.ok(nav, "achei a regra da barra lateral");
      assert.equal(/safe-area-inset-left|--esq/.test(nav), false, nav.trim());
    },
  },
  {
    nome: "celular deitado com entalhe: os nomes das abas cabem na barra lateral e nenhum entra embaixo da barra da música",
    largura: 900, altura: 400,
    rodar: async (p) => {
      await p.avaliar(() => document.documentElement.style.setProperty("--safe-area-inset-left", "44px"));
      await p.quadro();
      const r = await p.avaliar(() => { const n = document.getElementById("nav").getBoundingClientRect(), m = document.querySelector(".mini").getBoundingClientRect(); return { nav: [n.left, n.width], mini: m.left, fora: [...document.querySelectorAll("#nav button")].filter((b) => { const s = b.querySelector("span") || b; const q = document.createRange(); q.selectNodeContents(s); const t = q.getBoundingClientRect(); return t.left < n.left || t.right > n.right; }).map((b) => b.dataset.v) }; });
      assert.deepEqual(r.fora, [], "nomes que saem da barra: " + JSON.stringify(r));
      assert.equal(r.nav[0], 44, "a barra começa depois do entalhe");
      assert.ok(r.mini >= r.nav[0] + r.nav[1], "a barra da música fica ao lado, não por cima");
      await p.print("126-biblioteca-deitado");
    },
  },
  {
    nome: "com repetir a fila ligado não há aviso de fim: a fila recomeça tocando",
    rodar: async (p) => {
      await p.avaliar(() => { repeat = "all"; qi = queue.length - 1; carregar(true); buscarSeg(cur().d - 0.4); });
      await p.esperar(() => qi === 0, 4000);
      assert.deepEqual(await p.avaliar(() => [playing, /Fim da fila/.test(document.getElementById("toast").textContent)]), [true, false]);
    },
  },
];
