// 1.21: pincel no Tocando agora e a folha "Personalizar"
import assert from "node:assert/strict";

const abrir = async (p) => { await p.clicar("#b-pincel"); await p.esperar(() => !document.getElementById("sheet").hidden && !!document.querySelector("#sheet [data-vis]"), 1500); };

export default [
  {
    nome: "pincel à esquerda e tela cheia à direita",
    hash: "tocando", largura: 360, altura: 780,
    rodar: async (p) => {
      const r = await p.avaliar(() => { const a = document.getElementById("b-pincel").getBoundingClientRect(), b = document.getElementById("b-palco").getBoundingClientRect(); return { esq: a.left + a.width / 2, dir: b.left + b.width / 2, alt: Math.abs(a.top - b.top), tam: Math.min(a.width, a.height), rot: document.getElementById("b-pincel").getAttribute("aria-label") }; });
      assert.ok(r.esq < 90 && r.dir > 270, `pincel em x=${r.esq}, tela cheia em x=${r.dir}`);
      assert.ok(r.alt < 4, "pincel e tela cheia na mesma linha");
      assert.ok(r.tam >= 36, `pincel com ${r.tam} px`);
      assert.ok(r.rot, "o pincel precisa de nome para leitor de tela");
    },
  },
  {
    nome: "pincel abre a folha e a miniatura troca o visual ao vivo",
    hash: "tocando",
    rodar: async (p) => {
      await abrir(p);
      assert.equal(await p.avaliar(() => document.querySelectorAll("#sheet [data-vis]").length), await p.avaliar(() => Object.keys(VISUAIS).length));
      await p.clicar("#sheet [data-vis=vinil]");
      assert.equal(await p.avaliar(() => cfg.visual), "vinil");
      assert.equal(await p.avaliar(() => document.getElementById("app").dataset.visual), "vinil");
      assert.equal(await p.avaliar(() => document.getElementById("sheet").hidden), false, "a folha continua aberta para comparar");
      assert.equal(await p.avaliar(() => document.querySelector("#sheet [data-vis=vinil]").getAttribute("aria-pressed")), "true");
    },
  },
  {
    nome: "folha Personalizar é baixa e deixa o mostrador à vista",
    hash: "tocando", largura: 360, altura: 780,
    rodar: async (p) => {
      await abrir(p);
      await p.avaliar(() => new Promise((ok) => setTimeout(ok, 350))); // espera a folha subir
      const r = await p.avaliar(() => ({ topo: document.getElementById("sheet").getBoundingClientRect().top, fundo: getComputedStyle(document.getElementById("scrim")).backgroundColor }));
      assert.ok(r.topo >= 780 * 0.45, `a folha começa em y=${r.topo}; devia deixar 45% da tela livre`);
      assert.ok(/rgba\(.*,\s*0\)|transparent/.test(r.fundo), `o fundo não pode escurecer o mostrador (${r.fundo})`);
      const mini = await p.avaliar(() => document.querySelector("#sheet .mini-v").getBoundingClientRect().height);
      assert.ok(mini >= 56, `miniatura com ${mini} px de altura (espremida)`);
      await p.print("121-personalizar");
    },
  },
  {
    nome: "luz de fundo, batida, formato e cores pela folha",
    hash: "tocando",
    rodar: async (p) => {
      await abrir(p);
      const antes = await p.avaliar(() => [cfg.amb, cfg.reage, cfg.corCapa]);
      await p.clicar("#sheet [data-tg=amb]"); await p.clicar("#sheet [data-tg=reage]"); await p.clicar("#sheet [data-tg=corCapa]");
      assert.deepEqual(await p.avaliar(() => [cfg.amb, cfg.reage, cfg.corCapa]), antes.map((v) => !v));
      await p.clicar("#sheet [data-tg=amb]"); await p.clicar("#sheet [data-tg=reage]");
      await p.avaliar(() => { for (const [k, v] of [["ambF", 0.4], ["batF", 0.9]]) { const r = document.querySelector(`#sheet [data-rg=${k}]`); r.value = v; r.dispatchEvent(new Event("input", { bubbles: true })); } });
      assert.deepEqual(await p.avaliar(() => [cfg.ambF, cfg.batF, getComputedStyle(document.documentElement).getPropertyValue("--ambk").trim()]), [0.4, 0.9, "0.4"]);
      await p.clicar("#sheet [data-forma=redonda]");
      assert.equal(await p.avaliar(() => cfg.formaCapa), "redonda");
    },
  },
  {
    nome: "cores do LED só aparecem no LED",
    hash: "tocando",
    rodar: async (p) => {
      await abrir(p);
      assert.equal(await p.avaliar(() => !!document.querySelector("#sheet [data-ledcor]")), false);
      await p.clicar("#sheet [data-vis=led]");
      await p.clicar("#sheet [data-ledcor=tema]");
      assert.equal(await p.avaliar(() => cfg.ledCor), "tema");
    },
  },
  {
    nome: "pincel some na tela cheia",
    hash: "tocando",
    rodar: async (p) => {
      await p.avaliar(() => alternarPalco(true));
      assert.equal(await p.avaliar(() => getComputedStyle(document.getElementById("b-pincel")).visibility), "hidden");
    },
  },
];
