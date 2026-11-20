// 1.26.8 Visualizadores: revisão dos atuais (Phonk com mais impacto, Relógio ouvindo a caixa e o prato, "reduzir movimento"
// no laço) e três novos: Galáxia, Túnel e Osciloscópio.
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { BATERIA } from "./bateria.mjs";
import { carregarEN } from "./i18n.teste.mjs";

const NOVOS = { galaxia: "desenharGalaxia", tunel: "desenharTunel", osc: "desenharOsc" };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
// "reduzir movimento" do aparelho: o app lê uma vez, na abertura (const calmo)
const CALMO = `{ const o = window.matchMedia.bind(window); window.matchMedia = (q) => (/reduced-motion/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : o(q)); }`;
// conta quem pede quadro ao navegador e quem cria relógio, por nome da função
const CONTAR_LACOS = `{ window.__lacos = { raf: {}, int: 0 }; const r = window.requestAnimationFrame.bind(window), s = window.setInterval.bind(window);
  window.requestAnimationFrame = (cb) => { const n = cb.name || "anonima"; __lacos.raf[n] = (__lacos.raf[n] || 0) + 1; return r(cb); };
  window.setInterval = (...a) => { __lacos.int++; return s(...a); }; }`;

/* Fotografa o que se mexe no mostrador: a tela de desenho, as variáveis da capa e os tracinhos (sem o progresso, que é informação) */
const FOTO = () => {
  const cv = document.getElementById("viz"), d = document.getElementById("disc").style, D = DIAL.style;
  return [cv.width ? cv.toDataURL() : "", ["--ds", "--tx", "--ty", "--bal", "--cl"].map((v) => d.getPropertyValue(v) + D.getPropertyValue(v)).join(), D.getPropertyValue("--zk"), D.getPropertyValue("--beat"),
    [...document.querySelectorAll("#ticks > line")].map((l) => l.getAttribute("y2")).join(), document.getElementById("p-bate").getAttribute("transform") || ""].join("|");
};
async function cadaVisualParado(p) {
  await p.avaliar(BATERIA);
  const lista = await p.avaliar(() => Object.keys(VISUAIS)), o = {};
  for (const v of lista) {
    await p.avaliar((v) => { cfg.reage = true; cfg.batF = 1; cfg.leve = false; escolherVisual(v); if (!playing) tocar(); __bateria.ligar(); }, v);
    await espera(700); const a = await p.avaliar(FOTO); await espera(450); const b = await p.avaliar(FOTO);
    o[v] = a === b;
  }
  await p.avaliar(() => { __bateria.desligar(); pausar(); });
  return o;
}

export default [
  {
    nome: "visuais novos: Galáxia, Túnel e Osciloscópio estão na lista, com nome traduzido",
    rodar: async (p) => {
      const r = await p.avaliar(() => ({ chaves: Object.keys(VISUAIS), nomes: [VISUAIS.galaxia, VISUAIS.tunel, VISUAIS.osc], fns: [typeof desenharGalaxia, typeof desenharTunel, typeof desenharOsc] }));
      for (const k of Object.keys(NOVOS)) assert.ok(r.chaves.includes(k), k + " em VISUAIS");
      assert.deepEqual(r.nomes, ["Galáxia", "Túnel", "Osciloscópio"]);
      assert.deepEqual(r.fns, ["function", "function", "function"]);
      const EN = carregarEN();
      assert.deepEqual([EN["Galáxia"], EN["Túnel"], EN["Osciloscópio"]], ["Galaxy", "Tunnel", "Oscilloscope"]);
    },
  },
  ...[[360, 780, "celular"], [1280, 800, "PC"]].map(([largura, altura, onde]) => ({
    nome: `todos os visuais desenham sem erro no ${onde}, tocando com bateria (os de tela de desenho deixam algo na tela)`,
    hash: "tocando", largura, altura,
    rodar: async (p) => {
      await p.avaliar(BATERIA);
      const lista = await p.avaliar(() => Object.keys(VISUAIS)), o = {};
      for (const v of lista) {
        await p.avaliar((v) => { cfg.reage = true; cfg.batF = 0.7; cfg.leve = false; escolherVisual(v); if (!playing) tocar(); __bateria.ligar(); }, v);
        await espera(500);
        o[v] = await p.avaliar(() => {
          const cv = document.getElementById("viz"); if (getComputedStyle(cv).display === "none") return "sem tela";
          const d = cv.getContext("2d").getImageData(0, 0, cv.width, cv.height).data; let n = 0; for (let i = 3; i < d.length; i += 4) if (d[i] > 8) n++;
          return n > 200 ? "desenhou" : "vazio " + n;
        });
      }
      await p.avaliar(() => { __bateria.desligar(); pausar(); });
      for (const k of Object.keys(NOVOS)) assert.equal(o[k], "desenhou", k);
      for (const k of ["aura", "espectro", "anel", "neon", "barras", "led"]) assert.equal(o[k], "desenhou", k);
    },
  })),
  {
    nome: "visuais novos: com brilho normalmente, sem brilho no modo leve, e não deixam estado para o próximo",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar((NOVOS) => {
        prepararAudio(); brilhoAura.desligado = false; brilhoAura.lento = 0; cfg.leve = false; playing = true; const o = {};
        for (const [nome, fn] of Object.entries(NOVOS)) {
          const cv = document.createElement("canvas"); cv.width = cv.height = 600; const c = cv.getContext("2d");
          let imgs = 0; const orig = c.drawImage; c.drawImage = function (...a) { imgs++; return orig.apply(this, a); };
          tinta = "#8855ff"; c.fillStyle = c.strokeStyle = tinta; window[fn](c, 600, true); const com = imgs;
          const estado = [c.globalCompositeOperation, c.globalAlpha, cfa.filter].join(" ");
          imgs = 0; cfg.leve = true; window[fn](c, 600, true); cfg.leve = false;
          o[nome] = [com, imgs, estado].join(" | ");
        }
        playing = false; return o;
      }, NOVOS);
      for (const k of Object.keys(NOVOS)) assert.equal(r[k], "1 | 0 | source-over 1 none", k);
    },
  },
  {
    nome: "com \"reduzir movimento\" nenhum visual se mexe no laço, mesmo tocando com bateria",
    hash: "tocando", script: CALMO,
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => calmo), true, "o app leu \"reduzir movimento\"");
      const r = await cadaVisualParado(p);
      const mexeu = Object.entries(r).filter(([, parado]) => !parado).map(([v]) => v);
      assert.deepEqual(mexeu, [], "mexeram: " + mexeu.join(", "));
    },
  },
  {
    nome: "controle do anterior: sem \"reduzir movimento\" os mesmos visuais se mexem (o teste acima não passa por acaso)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await cadaVisualParado(p);
      const parados = Object.entries(r).filter(([, parado]) => parado).map(([v]) => v);
      assert.deepEqual(parados, [], "ficaram parados tocando: " + parados.join(", "));
    },
  },
  {
    nome: "um laço só: nenhum visual pede quadro por conta própria nem cria relógio",
    hash: "tocando", script: CONTAR_LACOS,
    rodar: async (p) => {
      await p.avaliar(BATERIA);
      await p.avaliar(() => { prepararAudio(); __bateria.ligar(); tocar(); });
      const lista = await p.avaliar(() => Object.keys(VISUAIS)), fora = [];
      for (const v of lista) {
        await p.avaliar((v) => { escolherVisual(v); __lacos.raf = {}; __lacos.int = 0; }, v);
        await espera(600);
        const l = await p.avaliar(() => __lacos);
        for (const [n, q] of Object.entries(l.raf)) if (n !== "quadro" && q > 5) fora.push(`${v}: ${n} ×${q}`);
        if (l.int) fora.push(`${v}: ${l.int} setInterval`);
        if (!(l.raf.quadro > 10)) fora.push(`${v}: o laço quadro() parou (${l.raf.quadro})`);
      }
      await p.avaliar(() => { __bateria.desligar(); pausar(); });
      assert.deepEqual(fora, []);
      const src = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
      assert.equal((src.match(/requestAnimationFrame\(/g) || []).length, 3, "só o quadro() (duas vezes) e a folha pedem quadro");
    },
  },
  {
    nome: "fora do Tocando agora os visuais novos não desenham nada",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(async (NOVOS) => {
        const o = {}; prepararAudio(); tocar();
        for (const [v, fn] of Object.entries(NOVOS)) {
          escolherVisual(v); ir("inicio"); let n = 0; const orig = window[fn]; window[fn] = (...a) => { n++; return orig(...a); };
          await new Promise((ok) => setTimeout(ok, 300)); window[fn] = orig; o[v] = n; ir("tocando");
        }
        pausar(); return o;
      }, NOVOS);
      assert.deepEqual(r, { galaxia: 0, tunel: 0, osc: 0 });
    },
  },
  {
    nome: "aparelho lento: a Galáxia desenha menos estrelas (mesma medida que desliga o brilho)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); playing = true; cfg.leve = false; const cv = document.createElement("canvas"); cv.width = cv.height = 600; const c = cv.getContext("2d");
        let n = 0; for (const m of ["rect", "arc"]) { const orig = c[m]; c[m] = function (...a) { n++; return orig.apply(this, a); }; }
        brilhoAura.desligado = false; desenharGalaxia(c, 600, true); const normal = n; n = 0;
        brilhoAura.desligado = true; desenharGalaxia(c, 600, true); const lento = n; n = 0; brilhoAura.desligado = false;
        cfg.leve = true; desenharGalaxia(c, 600, true); const leve = n; cfg.leve = false; playing = false;
        return { normal, lento, leve };
      });
      assert.ok(r.normal >= 200, `estrelas normais: ${r.normal}`);
      assert.ok(r.lento <= r.normal * 0.6 && r.leve <= r.normal * 0.5, JSON.stringify(r));
    },
  },
  {
    nome: "Phonk: a separação de cores em volta da capa acompanha a tremida (sai de onde a capa está)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); cfg.visual = "aura"; cfg.auraEst = "phonk"; aplicarVisual(); cfg.reage = true; cfg.batF = 1; cfg.leve = false;
        const cv = document.createElement("canvas"); cv.width = cv.height = 600; const c = cv.getContext("2d"), desl = [];
        const ot = c.translate; c.translate = function (x, y) { desl.push([+x.toFixed(1), +y.toFixed(1)]); return ot.call(this, x, y); };
        escuta.O.caixa.env = 1; fxCapa.x = 4; fxCapa.y = -3; desenharAura(c, 600, true);
        const parada = desl.length; fxCapa.x = fxCapa.y = 0; escuta.O.caixa.env = 0; cfg.auraEst = "padrao"; aplicarVisual();
        return { desl, k: 600 / document.getElementById("viz").clientWidth, parada };
      });
      assert.ok(r.parada >= 2, "duas cópias deslocadas: " + JSON.stringify(r.desl));
      const [a, b] = r.desl;
      const meio = [(a[0] + (a[0] + b[0])) / 2, (a[1] + (a[1] + b[1])) / 2]; // o centro entre as duas cópias
      assert.ok(Math.abs(meio[1] - -3 * r.k) < 0.6 && Math.abs(meio[0] - 4 * r.k) < 0.6, `as cópias se separam em volta da capa deslocada: ${JSON.stringify(r)}`);
    },
  },
  {
    nome: "Phonk: tranco no mostrador inteiro e bordas escuras que pulsam no bumbo; nada disso no Padrão nem no modo leve",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const quadros = (n) => new Promise((ok) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : ok()); f(); });
        const fx = document.getElementById("fx-aura"), ler = () => [parseFloat(DIAL.style.getPropertyValue("--zk")) || 0, fx.style.opacity];
        cfg.visual = "aura"; cfg.auraEst = "phonk"; cfg.reage = true; cfg.batF = 1; cfg.leve = false; aplicarVisual(); tocar(); await quadros(3);
        const o = ouvirBatidas, op = new Set(); let zk = 0;
        ouvirBatidas = (a) => { o(a); escuta.O.bumbo.env = 1; return { bumbo: 1, caixa: 0, prato: 0 }; };
        for (let i = 0; i < 6; i++) { await quadros(1); const [z, v] = ler(); zk = Math.max(zk, z); op.add(v); }
        ouvirBatidas = (a) => { o(a); return SEM_GOLPE; }; // o golpe se apaga aos poucos
        for (let i = 0; i < 30; i++) { await quadros(1); op.add(ler()[1]); }
        const vinheta = getComputedStyle(fx).display !== "none" && getComputedStyle(fx).backgroundImage.includes("radial-gradient");
        const transf = getComputedStyle(DIAL).transform;
        ouvirBatidas = (a) => { o(a); escuta.O.bumbo.env = 1; return { bumbo: 1, caixa: 0, prato: 0 }; };
        cfg.auraEst = "padrao"; aplicarVisual(); await quadros(4); const padrao = ler();
        cfg.auraEst = "phonk"; aplicarVisual(); definirLeve(true); await quadros(4); const leve = [parseFloat(DIAL.style.getPropertyValue("--zk")) || 0, getComputedStyle(fx).display]; definirLeve(false);
        ouvirBatidas = o; cfg.auraEst = "padrao"; aplicarVisual(); pausar();
        return { zk: zk > 0.3, pulsa: op.size >= 3, vinheta, transf: transf !== "none", padrao, leve };
      });
      assert.deepEqual(r, { zk: true, pulsa: true, vinheta: true, transf: true, padrao: [0, ""], leve: [0, "none"] });
    },
  },
  {
    nome: "Relógio: na caixa o ponteiro fino dá um tranco e no prato treme de leve, e os dois voltam ao lugar",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const desvio = (caixa, prato) => { const P = criarPonteiro(); let mx = 0, a = 0; a = P.passo(0, 1, caixa, prato); mx = Math.abs(a); for (let i = 0; i < 60; i++) { a = P.passo(0, 1); mx = Math.max(mx, Math.abs(a)); } return { mx, fim: a }; };
        return { caixa: desvio(1, 0), prato: desvio(0, 1), nada: desvio(0, 0) };
      });
      assert.ok(r.caixa.mx > 1.2 && r.caixa.mx < 4, `tranco da caixa: ${r.caixa.mx.toFixed(2)} graus`);
      assert.ok(r.prato.mx > 0.2 && r.prato.mx < r.caixa.mx * 0.6, `tremida do prato: ${r.prato.mx.toFixed(2)} graus`);
      assert.ok(Math.abs(r.caixa.fim) < 0.05 && Math.abs(r.prato.fim) < 0.05, "volta ao lugar: só o bumbo avança o ponteiro");
      assert.equal(r.nada.mx, 0);
    },
  },
  {
    nome: "Relógio no laço: a caixa e o prato mexem o ponteiro fino; com \"Reagir à batida\" desligado, não",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const quadros = (n) => new Promise((ok) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : ok()); f(); });
        const ang = () => document.getElementById("p-bate").getAttribute("transform") || "";
        cfg.leve = false; escolherVisual("relogio"); tocar(); await quadros(3);
        const o = ouvirBatidas, vistos = new Set();
        ouvirBatidas = (a) => { o(a); return { bumbo: 0, caixa: 1, prato: 1 }; };
        cfg.reage = true; for (let i = 0; i < 12; i++) { await quadros(1); vistos.add(ang()); }
        const comReage = vistos.size; vistos.clear(); cfg.reage = false; await new Promise((ok) => setTimeout(ok, 2500)); // o laço sem janela roda mais rápido que a pintura (~60 por segundo): espera por tempo
        for (let i = 0; i < 12; i++) { await quadros(1); vistos.add(ang()); }
        ouvirBatidas = o; cfg.reage = true; pausar();
        return { comReage, semReage: vistos.size };
      });
      assert.ok(r.comReage >= 3, `o ponteiro mexeu: ${r.comReage} posições`);
      assert.equal(r.semReage, 1, "sem reagir à batida o ponteiro fica parado");
    },
  },
  {
    nome: "Espectro: os agudos aparecem (antes ficavam sempre rentes à capa)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); const cv = document.createElement("canvas"); cv.width = cv.height = 600; const c = cv.getContext("2d");
        const lb = lerBins; lerBins = () => { for (let i = 0; i < bins.length; i++) bins[i] = Math.max(0, 210 - i * 0.7); }; // música comum: os agudos bem mais baixos que os graves
        espNiv.fill(0); for (let i = 0; i < 40; i++) desenharEspectro(c, 600, true);
        lerBins = lb; return { grave: espNiv[5], agudo: espNiv[100] };
      });
      assert.ok(r.agudo > 0.55, `agudo em ${r.agudo.toFixed(2)} (grave ${r.grave.toFixed(2)})`);
    },
  },
];
