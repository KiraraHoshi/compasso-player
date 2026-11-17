// Consertos da 1.26.2: retornos de quem usa o app no PC.
import assert from "node:assert/strict";

const tela = (p) => p.avaliar(() => document.getElementById("app").dataset.view);
const tecla = (p, key) => p.avaliar((k) => { (document.activeElement || document.body).dispatchEvent(new KeyboardEvent("keydown", { key: k, bubbles: true, cancelable: true })); }, key);
const abrirPincel = async (p) => { await p.clicar("#b-pincel"); await p.esperar(() => !document.getElementById("sheet").hidden && !!document.querySelector("#sheet [data-vis]"), 1500); };

export default [
  {
    nome: "música de exemplo passa para a próxima mesmo com a janela escondida (sem o desenho da tela)",
    rodar: async (p) => {
      const antes = await p.avaliar(() => {
        window.requestAnimationFrame = () => 0; // janela em segundo plano: o navegador para de chamar o desenho
        const id = cur().id; alternar(); buscarSeg(cur().d - 0.4); return id;
      });
      await p.esperar((id) => cur().id !== id, 4000, antes);
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
    },
  },
  {
    nome: "nos estilos da Aura com cores próprias, a opção de seguir a capa fica desativada e explica por quê",
    hash: "tocando",
    rodar: async (p) => {
      await p.avaliar(() => { cfg.visual = "aura"; cfg.auraEst = "phonk"; cfg.corCapa = true; aplicarVisual(); });
      await abrirPincel(p);
      const ler = () => { const b = document.querySelector('#sheet [data-tg="corCapa"]'); return { off: b.disabled, marcado: b.getAttribute("aria-checked"), nota: !!document.querySelector("#sheet [data-nota-cor]") }; };
      assert.deepEqual(await p.avaliar(ler), { off: true, marcado: "false", nota: true });
      assert.equal(await p.avaliar(() => cfg.corCapa), true, "a escolha da pessoa fica guardada para os outros estilos");
      await p.clicar('#sheet [data-estilo="padrao"]');
      assert.deepEqual(await p.avaliar(ler), { off: false, marcado: "true", nota: false });
    },
  },
];
