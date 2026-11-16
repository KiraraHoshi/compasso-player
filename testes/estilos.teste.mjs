// 1.26 Estilos da Aura: Padrão, Phonk, Lo-fi e Anos 80 (liberados para teste; depois entram no pacote Apoiador).
import assert from "node:assert/strict";

const abrir = async (p) => { await p.clicar("#b-pincel"); await p.esperar(() => !document.getElementById("sheet").hidden && !!document.querySelector("#sheet [data-vis]"), 1500); };

export default [
  {
    nome: "o pincel mostra o Estilo da Aura só com a Aura, e a escolha vale na hora",
    hash: "tocando",
    rodar: async (p) => {
      await abrir(p);
      await p.clicar("#sheet [data-vis=relogio]");
      assert.equal(await p.avaliar(() => document.querySelectorAll("#sheet [data-estilo]").length), 0, "no Relógio não há estilo");
      await p.clicar("#sheet [data-vis=aura]");
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#sheet [data-estilo]")].map((b) => b.dataset.estilo + ":" + b.getAttribute("aria-pressed"))), ["padrao:true", "phonk:false", "lofi:false", "oitenta:false"]);
      await p.clicar("#sheet [data-estilo=phonk]");
      assert.deepEqual(await p.avaliar(() => [cfg.auraEst, APP.dataset.estilo, document.querySelector("#sheet [data-estilo=phonk]").getAttribute("aria-pressed")]), ["phonk", "phonk", "true"]);
      await p.clicar("#sheet [data-vis=espectro]");
      assert.deepEqual(await p.avaliar(() => [APP.dataset.estilo, cfg.auraEst]), ["", "phonk"], "fora da Aura o estilo não vale, mas a escolha fica guardada");
    },
  },
  {
    nome: "estilo desconhecido (backup antigo ou mexido) cai no Padrão, e fora da Aura vale sempre o Padrão",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        cfg.visual = "aura"; cfg.auraEst = "xyz"; aplicarVisual(); const ruim = [estiloAura() === ESTILOS_AURA.padrao, APP.dataset.estilo];
        cfg.auraEst = "lofi"; aplicarVisual(); const bom = [estiloAura() === ESTILOS_AURA.lofi, APP.dataset.estilo];
        cfg.visual = "anel"; aplicarVisual(); const fora = estiloAura() === ESTILOS_AURA.padrao;
        cfg.visual = "aura"; cfg.auraEst = "padrao"; aplicarVisual();
        return { ruim, bom, fora, padrao: APP.dataset.estilo };
      });
      assert.deepEqual(r, { ruim: [true, ""], bom: [true, "lofi"], fora: true, padrao: "" });
    },
  },
  {
    nome: "o soco da capa muda com o estilo: Phonk mais forte, Lo-fi mais leve, Padrão como era",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const pico = (soco) => { const m = criarMola(); let mx = 1; for (let i = 0; i < 40; i++) mx = Math.max(mx, soco === undefined ? m.passo(i ? 0 : 1, 0.7, 0, 5000 + i * 16, 1) : m.passo(i ? 0 : 1, 0.7, 0, 5000 + i * 16, 1, soco)); return mx - 1; };
        return { antes: pico(), padrao: pico(ESTILOS_AURA.padrao.soco), phonk: pico(ESTILOS_AURA.phonk.soco), lofi: pico(ESTILOS_AURA.lofi.soco) };
      });
      assert.equal(r.padrao, r.antes, "o Padrão não muda");
      assert.equal(await p.avaliar(() => ESTILOS_AURA.padrao.soco), 0.05, "o soco do Padrão é o da 1.25");
      assert.ok(r.phonk > r.padrao * 1.8, `phonk ${r.phonk} x padrão ${r.padrao}`);
      assert.ok(r.lofi < r.padrao * 0.6, `lofi ${r.lofi} x padrão ${r.padrao}`);
    },
  },
  {
    nome: "Phonk: a capa treme no bumbo e para sozinha; nos outros estilos e sem reagir à batida não treme",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const t = criarTremida(), E = ESTILOS_AURA;
        const g = t.passo(E.phonk, 1, 0.7, 1), golpe = Math.hypot(g.x, g.y) > 0 && Math.abs(g.x) <= 7 * 0.7 && Math.abs(g.y) <= 7 * 0.7;
        for (let i = 0; i < 40; i++) t.passo(E.phonk, 0, 0.7, 1);
        const fim = [t.passo(E.phonk, 0, 0.7, 1).x, t.passo(E.phonk, 0, 0.7, 1).y];
        t.passo(E.phonk, 1, 0.7, 1); const troca = t.passo(E.padrao, 1, 0.7, 1), trocou = [troca.x, troca.y];
        const sem = t.passo(E.phonk, 1, 0, 1), semK = [sem.x, sem.y];
        const lo = t.passo(E.lofi, 1, 0.7, 1), lofi = [lo.x, lo.y];
        return { golpe, fim, trocou, semK, lofi };
      });
      assert.deepEqual(r, { golpe: true, fim: [0, 0], trocou: [0, 0], semK: [0, 0], lofi: [0, 0] });
    },
  },
  {
    nome: "Phonk em tela de 120 Hz: a tremida vai e volta também quando só um quadro sim, um não chega à tela",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const t = criarTremida(), E = ESTILOS_AURA.phonk, vistos = [];
        t.passo(E, 1, 1, 0.5);
        for (let i = 0; i < 12; i++) { const v = t.passo(E, 0, 1, 0.5); if (i % 2) vistos.push(Math.abs(v.x) > Math.abs(v.y) ? v.x : v.y); } // a tela só mostra metade das contas
        let trocas = 0; for (let i = 1; i < vistos.length; i++) if (vistos[i] * vistos[i - 1] < 0) trocas++;
        return { n: vistos.length, trocas };
      });
      assert.deepEqual(r, { n: 6, trocas: 5 }, "cada quadro mostrado fica do lado oposto do anterior");
    },
  },
  {
    nome: "cores: o estilo tem as cores dele; no Padrão (e fora da Aura) a cor continua seguindo a capa",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const ir1 = () => { for (let i = 0; i < 400; i++) passoCorAura(); return [corAura[0].map(Math.round), corAura[1].map(Math.round)]; };
        corViz = "#0000ff"; corViz2 = null; cfg.visual = "aura";
        cfg.auraEst = "phonk"; aplicarVisual(); const phonk = ir1();
        cfg.auraEst = "oitenta"; aplicarVisual(); const oitenta = ir1();
        cfg.auraEst = "padrao"; aplicarVisual(); const padrao = ir1();
        cfg.auraEst = "phonk"; cfg.visual = "anel"; aplicarVisual(); const anel = ir1();
        cfg.visual = "aura"; cfg.auraEst = "padrao"; aplicarVisual();
        return { phonk, oitenta, padrao, anel };
      });
      assert.deepEqual(r.phonk, [[255, 45, 70], [138, 16, 36]]);
      assert.deepEqual(r.oitenta, [[255, 79, 216], [61, 232, 255]]);
      assert.deepEqual(r.padrao, [[0, 0, 255], [0, 0, 255]]);
      assert.deepEqual(r.anel, [[0, 0, 255], [0, 0, 255]], "no Anel o estilo da Aura não pinta nada");
    },
  },
  {
    nome: "grão do Lo-fi e linhas de varredura do Anos 80: só com a Aura no Tocando agora, nunca no modo leve, e sem atrapalhar os toques",
    hash: "tocando", largura: 360, altura: 780,
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const fx = document.getElementById("fx-aura"), ve = () => fx.getClientRects().length > 0, o = {};
        cfg.visual = "aura"; cfg.auraEst = "padrao"; aplicarVisual(); o.padrao = ve(); const larg = DIAL.offsetWidth;
        cfg.auraEst = "lofi"; aplicarVisual(); o.lofi = ve(); o.mesmoTamanho = DIAL.offsetWidth === larg && larg > 200;
        { const cs = getComputedStyle(fx), a = APP.getBoundingClientRect(); o.barato = cs.mixBlendMode === "normal" && cs.position === "absolute"; o.dentro = cs.overflow !== undefined && getComputedStyle(APP).overflow === "hidden" && a.width > 0; } o.grao = getComputedStyle(fx).backgroundImage.startsWith("url("); o.toque = getComputedStyle(fx).pointerEvents;
        o.alvo = document.elementFromPoint(innerWidth / 2, innerHeight / 2) !== fx;
        cfg.auraEst = "oitenta"; aplicarVisual(); o.oitenta = ve(); o.linhas = getComputedStyle(fx).backgroundImage.includes("repeating-linear-gradient");
        definirLeve(true); o.leve = ve(); definirLeve(false);
        cfg.visual = "barras"; aplicarVisual(); o.barras = ve();
        cfg.visual = "aura"; aplicarVisual(); ir("inicio"); o.inicio = ve();
        cfg.auraEst = "padrao"; aplicarVisual();
        return o;
      });
      assert.deepEqual(r, { padrao: false, lofi: true, mesmoTamanho: true, barato: true, dentro: true, grao: true, toque: "none", alvo: true, oitenta: true, linhas: true, leve: false, barras: false, inicio: false });
    },
  },
  {
    nome: "no laço: com Phonk tocando a capa ganha tremida e clarão; ao voltar para o Padrão tudo zera",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const quadros = (n) => new Promise((ok) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : ok()); f(); });
        const lerFx = () => ["--tx", "--ty", "--bal", "--cl"].map((v) => parseFloat(document.getElementById("disc").style.getPropertyValue(v)) || 0);
        cfg.visual = "aura"; cfg.auraEst = "phonk"; cfg.reage = true; cfg.batF = 1; aplicarVisual(); tocar(); await quadros(4);
        const o = ouvirBatidas; let mx = [0, 0, 0, 0];
        ouvirBatidas = (a) => { const g = o(a); escuta.O.caixa.env = 0.9; return { bumbo: 1, caixa: 1, prato: 0 }; };
        for (let i = 0; i < 6; i++) { await quadros(1); mx = lerFx().map((v, j) => Math.max(mx[j], Math.abs(v))); }
        cfg.auraEst = "lofi"; aplicarVisual(); let bal = 0; for (let i = 0; i < 30; i++) { await quadros(1); bal = Math.max(bal, Math.abs(lerFx()[2])); }
        const lofiTrem = lerFx().slice(0, 2);
        pausar(); await quadros(90); const balPausado = Math.abs(lerFx()[2]); tocar(); await quadros(2);
        ouvirBatidas = o; cfg.auraEst = "padrao"; aplicarVisual(); await quadros(6); const fim = lerFx();
        pausar(); cfg.batF = 0.7;
        return { trem: mx[0] + mx[1] > 0.5, cl: mx[3] > 0.1, bal: bal > 0 && bal <= 1.7, lofiTrem, balPausado: balPausado < 0.1, fim, noDial: DIAL.style.getPropertyValue("--tx") };
      });
      assert.deepEqual(r, { trem: true, cl: true, bal: true, lofiTrem: [0, 0], balPausado: true, fim: [0, 0, 0, 0], noDial: "" });
    },
  },
  {
    nome: "a Aura desenha nos quatro estilos sem erro (riscos do Phonk, vagalumes do Lo-fi, neon do Anos 80)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const cv = document.createElement("canvas"); cv.width = cv.height = 300; const c = cv.getContext("2d"), o = {};
        cfg.visual = "aura"; escuta.O.caixa.env = 0.8;
        for (const e of ["padrao", "phonk", "lofi", "oitenta"]) {
          cfg.auraEst = e; aplicarVisual(); c.clearRect(0, 0, 300, 300);
          try { for (let i = 0; i < 3; i++) desenharAura(c, 300, false); o[e] = c.getImageData(0, 0, 300, 300).data.some((v, i) => i % 4 === 3 && v > 0); } catch (err) { o[e] = String(err); }
        }
        escuta.O.caixa.env = 0; cfg.auraEst = "padrao"; aplicarVisual();
        return o;
      });
      assert.deepEqual(r, { padrao: true, phonk: true, lofi: true, oitenta: true });
    },
  },
  {
    nome: "o estilo da Aura entra no backup",
    rodar: async () => {
      const fs = await import("node:fs"); const src = fs.readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
      const linha = src.split(/\r?\n/).find((l) => l.includes('"formaCapa", "ledCor"') && l.includes("if (k in aj)"));
      assert.ok(linha && linha.includes('"auraEst"'), "auraEst na lista de ajustes que o backup restaura");
    },
  },
];
