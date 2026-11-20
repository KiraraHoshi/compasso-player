import assert from "node:assert/strict";
import { readFileSync, existsSync } from "node:fs";

// 1.26.8, depois do teste no M52: engrenagem igual à do Caixinhas, rótulos dos atalhos sem palavra partida e a fonte Cinzel dentro do app
const raiz = new URL("../", import.meta.url);

export default [
  {
    nome: "engrenagem do topo é a mesma do Caixinhas: círculo no meio e dentes centrados nele",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const b = document.querySelector("#v-inicio [data-ajustes] svg");
        const c = b.querySelector("circle"), dentes = [...b.querySelectorAll("path")].map((x) => x.getBBox());
        const d = dentes[dentes.length - 1];
        return { circulo: c ? [c.getAttribute("cx"), c.getAttribute("cy"), c.getAttribute("r")] : null, centro: [d.x + d.width / 2, d.y + d.height / 2] };
      });
      assert.deepEqual(r.circulo, ["12", "12", "3"]);
      assert.ok(Math.abs(r.centro[0] - 12) < 0.1 && Math.abs(r.centro[1] - 12) < 0.1, "dentes fora do centro: " + r.centro.join(", "));
    },
  },
  {
    nome: "atalho com nome comprido não parte a palavra (Temporizad/or): a letra diminui até caber",
    largura: 412,
    rodar: async (p) => {
      // fonte larga como a do Android com letra grande: o rótulo começa maior do que cabe
      await p.avaliar(() => { const st = document.createElement("style"); st.textContent = "#ini-ferr .ini-f span{font-size:16px;font-family:Verdana,sans-serif}"; document.head.appendChild(st); renderFerramentas(); });
      await new Promise((r) => setTimeout(r, 100));
      const r = await p.avaliar(() => [...document.querySelectorAll("#ini-ferr .ini-f span")].map((s) => ({ t: s.textContent, sobra: s.scrollWidth - s.clientWidth, quebra: getComputedStyle(s).overflowWrap })));
      for (const x of r) {
        assert.notEqual(x.quebra, "anywhere", "rótulo pode partir palavra no meio");
        assert.ok(x.sobra <= 1, `"${x.t}" não cabe (${x.sobra}px a mais)`);
      }
    },
  },
  {
    nome: "fonte Cinzel vem dentro do app (sem internet) e entra no cache do site",
    node: true,
    rodar: async () => {
      const css = readFileSync(new URL("css/app.css", raiz), "utf8"), sw = readFileSync(new URL("sw.js", raiz), "utf8");
      const m = css.match(/@font-face\s*\{[^}]*font-family:\s*"Cinzel"[^}]*url\(["']?([^"')]+)["']?\)/);
      assert.ok(m, "sem @font-face da Cinzel no css/app.css");
      const arq = new URL("css/" + m[1], raiz);
      assert.ok(existsSync(arq), "arquivo da fonte não existe: " + m[1]);
      assert.equal(readFileSync(arq).subarray(0, 4).toString(), "wOF2");
      assert.ok(sw.includes('"css/' + m[1] + '"'), "a fonte não está na lista do sw.js");
      assert.ok(existsSync(new URL("css/fontes/OFL.txt", raiz)), "falta a licença da fonte (OFL)");
    },
  },
  {
    nome: "títulos usam a Cinzel de verdade (fonte carregada, não a reserva do aparelho)",
    rodar: async (p) => {
      const ok = await p.avaliar(async () => { await document.fonts.load('700 28px "Cinzel"'); return document.fonts.check('700 28px "Cinzel"') && [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Cinzel" && f.status === "loaded"); });
      assert.equal(ok, true);
    },
  },
  {
    nome: "fonte Figtree (texto) vem dentro do app, com licença e no cache do site",
    node: true,
    rodar: async () => {
      const css = readFileSync(new URL("css/app.css", raiz), "utf8"), sw = readFileSync(new URL("sw.js", raiz), "utf8");
      const m = css.match(/@font-face\s*\{[^}]*font-family:\s*"Figtree"[^}]*url\(["']?([^"')]+)["']?\)/);
      assert.ok(m, "sem @font-face da Figtree no css/app.css");
      assert.equal(readFileSync(new URL("css/" + m[1], raiz)).subarray(0, 4).toString(), "wOF2");
      assert.ok(sw.includes('"css/' + m[1] + '"'), "a Figtree não está na lista do sw.js");
      assert.ok(existsSync(new URL("css/fontes/OFL-figtree.txt", raiz)), "falta a licença da Figtree");
    },
  },
  {
    nome: "texto comum usa a Figtree de verdade (carregada do app)",
    rodar: async (p) => {
      const ok = await p.avaliar(async () => { await document.fonts.load('600 15px "Figtree"'); return [...document.fonts].some((f) => f.family.replace(/"/g, "") === "Figtree" && f.status === "loaded"); });
      assert.equal(ok, true);
    },
  },
];
