// 1.24 Aura refinada: brilho macio, poeira com profundidade, onda do bumbo, fio de luz na caixa e troca de música.
import assert from "node:assert/strict";

export default [
  {
    nome: "onda do bumbo: sai rápido e freia; no máximo 4 ao mesmo tempo",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const l = []; passoOndas(l, 0.8, 1); const f = l[0].f;
        for (let i = 0; i < 6; i++) passoOndas(l, 1, 1);
        const max = l.length; for (let i = 0; i < 60; i++) passoOndas(l, 0, 1);
        return { f, max, depois: l.length, cedo: saidaOnda(0.2), tarde: saidaOnda(0.8) };
      });
      assert.equal(r.f, 0.8, "a força da onda é a do golpe");
      assert.equal(r.max, 4);
      assert.equal(r.depois, 0, "as ondas somem sozinhas");
      assert.ok(r.cedo > 0.45, `em 20% do tempo já andou ${r.cedo.toFixed(2)} do caminho`);
      assert.ok(r.tarde > 0.99);
    },
  },
  {
    nome: "brilho: desliga sozinho se o aparelho não dá conta, mas não a 30 quadros (economia de bateria)",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        brilhoAura.lento = 0; brilhoAura.desligado = false; cfg.leve = false;
        for (let i = 0; i < 300; i++) vigiarBrilho(2); // 10 s a 30 quadros por segundo
        const a30 = usarBrilho();
        for (let i = 0; i < 100; i++) vigiarBrilho(3.2); // ~5 s a menos de 20 quadros
        const lento = usarBrilho();
        brilhoAura.desligado = false; cfg.leve = true; const leve = usarBrilho(); cfg.leve = false;
        return { a30, lento, leve };
      });
      assert.deepEqual(r, { a30: true, lento: false, leve: false });
    },
  },
  {
    nome: "troca de música: as cores passam aos poucos de uma para a outra",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        corAura[0] = [255, 0, 0]; corAura[1] = [255, 0, 0]; corViz = "#0000ff"; corViz2 = null;
        fqV = 1; passoCorAura(); const logo = corAura[0][2];
        for (let i = 0; i < 90; i++) passoCorAura();
        return { logo, depois: corAura[0][2], seg: corAura[1][2] };
      });
      assert.ok(r.logo > 0 && r.logo < 120, `no primeiro quadro já virou ${r.logo.toFixed(0)} de azul`);
      assert.ok(r.depois > 245 && r.seg > 245, `depois de 1,5 s: ${r.depois.toFixed(0)}`);
    },
  },
  {
    nome: "troca de música: a Aura recolhe e abre de novo; a capa entra (só na Aura)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        cfg.visual = "aura"; APP.dataset.visual = "aura"; auraPres = 1;
        const t0 = performance.now(); recolherAura(t0, 1);
        for (let i = 1; i <= 14; i++) passoPres(t0 + i * 16.7, 1); const recolhida = auraPres;
        for (let i = 15; i <= 90; i++) passoPres(t0 + i * 16.7, 1); const aberta = auraPres;
        const disc = document.getElementById("disc"), minhas = () => disc.getAnimations().filter((a) => !(a instanceof CSSAnimation));
        const animAura = minhas().length; minhas().forEach((a) => a.cancel());
        cfg.visual = "vinil"; APP.dataset.visual = "vinil"; recolherAura(performance.now(), 1);
        const animVinil = minhas().length;
        return { recolhida, aberta, animAura, animVinil };
      });
      assert.ok(r.recolhida < 0.4, `recolheu até ${r.recolhida.toFixed(2)}`);
      assert.ok(r.aberta > 0.95, `abriu até ${r.aberta.toFixed(2)}`);
      assert.equal(r.animAura, 1, "a capa entra na Aura");
      assert.equal(r.animVinil, 0, "no Vinil a capa não ganha animação (ela gira)");
    },
  },
  {
    nome: "a troca de música chama a Aura (e a anterior entra pelo outro lado)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const vistos = []; const orig = recolherAura; recolherAura = (t, d) => vistos.push(d);
        proxima(); anterior(); proxima();
        recolherAura = orig; return vistos;
      });
      assert.deepEqual(r, [1, -1, 1], "depois de voltar, a próxima entra de novo pelo lado de sempre");
    },
  },
  {
    nome: "Aura desenha com brilho; no modo leve, sem brilho; o prato faz a poeira cintilar",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); cfg.visual = "aura"; cfg.leve = false; brilhoAura.desligado = false; brilhoAura.lento = 0;
        const cv = document.createElement("canvas"); cv.width = cv.height = 600; const c = cv.getContext("2d");
        let imgs = 0; const orig = c.drawImage; c.drawImage = function (...a) { imgs++; return orig.apply(this, a); };
        golpesQ.prato = 1; desenharAura(c, 600, true); golpesQ.prato = 0;
        const brilhou = imgs, larg = foraAura.width, cintila = poeiraAura.filter((q) => q.br > 0.5).length;
        const estado = [c.globalCompositeOperation, c.globalAlpha, cfa.filter].join(" ");
        imgs = 0; cfg.leve = true; desenharAura(c, 600, true); cfg.leve = false;
        return { brilhou, larg, cintila, leve: imgs, estado };
      });
      assert.equal(r.brilhou, 1, "o brilho é uma imagem esticada por cima");
      assert.equal(r.larg, 150, "o brilho é pintado com um quarto do tamanho");
      assert.ok(r.cintila >= 3, `${r.cintila} grãos de poeira cintilando`);
      assert.equal(r.leve, 0, "no modo leve não há brilho");
      assert.equal(r.estado, "source-over 1 none", "a Aura não deixa estado de desenho para o próximo mostrador");
    },
  },
  {
    nome: "modo leve não desliga o brilho para sempre (lá o desenho roda a cada dois quadros)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); brilhoAura.desligado = false; brilhoAura.lento = 0; cfg.leve = true;
        const cv = document.createElement("canvas"); cv.width = cv.height = 300; const c = cv.getContext("2d");
        fqV = 4; for (let i = 0; i < 300; i++) desenharAura(c, 300, true);
        cfg.leve = false; const volta = usarBrilho(); brilhoAura.desligado = false; brilhoAura.lento = 0; return volta;
      });
      assert.equal(r, true);
    },
  },
  {
    nome: "WebView antigo (sem getAnimations): a troca de música continua funcionando",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        escolherVisual("aura"); const orig = Element.prototype.getAnimations; delete Element.prototype.getAnimations;
        let erro = ""; try { proxima(); proxima(); } catch (e) { erro = String(e); }
        Element.prototype.getAnimations = orig; escolherVisual("relogio"); return erro;
      });
      assert.equal(r, "");
    },
  },
  {
    nome: "modo leve: a capa não ganha animação na troca e a cor troca na hora",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        escolherVisual("aura"); cfg.leve = true;
        const d = document.getElementById("disc"); d.getAnimations().forEach((a) => a.cancel());
        recolherAura(performance.now(), 1); const anim = d.getAnimations().length;
        corAura[0] = [255, 0, 0]; corViz = "#0000ff"; corViz2 = null; passoCorAura(); const azul = corAura[0][2];
        cfg.leve = false; escolherVisual("relogio"); return { anim, azul };
      });
      assert.deepEqual(r, { anim: 0, azul: 255 });
    },
  },
];
