import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// 1.26.8: pendências que entraram no revamp (estilos da Aura grátis para sempre, Recap novo, texto sem uso)
const textosDoRecap = () => {
  const ditos = [], orig = CanvasRenderingContext2D.prototype.fillText;
  CanvasRenderingContext2D.prototype.fillText = function (t, ...r) { ditos.push(String(t)); return orig.call(this, t, ...r); };
  return desenharRecap().then((r) => { CanvasRenderingContext2D.prototype.fillText = orig; return { textos: ditos.join(" | "), ok: !!r.blob }; });
};

export default [
  {
    nome: "o pincel não fala mais em pacote Apoiador nos estilos da Aura",
    hash: "tocando",
    rodar: async (p) => {
      await p.avaliar(() => { cfg.visual = "aura"; aplicarVisual(); });
      await p.clicar("#b-pincel");
      await p.esperar(() => !!document.querySelector("#sheet [data-estilo]"), 1500);
      assert.doesNotMatch(await p.avaliar(() => document.getElementById("sheet").textContent), /Apoiador|Supporter/);
    },
  },
  {
    nome: "Recap em imagem com o nome Orolon, sem COMPASSO e sem o destaque de offline e sem conta (tema escuro e claro)",
    rodar: async (p) => {
      for (const tema of ["escuro", "claro"]) {
        await p.avaliar((t) => { cfg.tema = t; aplicarTema(); }, tema);
        const r = await p.avaliar(textosDoRecap);
        assert.ok(r.ok, "a imagem não saiu no tema " + tema);
        assert.match(r.textos, /OROLON/);
        assert.doesNotMatch(r.textos, /COMPASSO|offline e sem conta/i);
      }
    },
  },
  {
    nome: "cartão Favoritas do Início: nome e contagem em linhas separadas",
    rodar: async (p) => {
      await p.avaliar(() => { favs.add(faixas[0].id); ir("biblioteca"); ir("inicio"); });
      const [a, b] = await p.avaliar(() => [...document.querySelectorAll("#ini-fav .grow > span")].map((e) => e.getBoundingClientRect().top));
      assert.ok(b > a + 5, `na mesma linha: ${a} / ${b}`);
    },
  },
  {
    nome: "texto antigo sem uso saiu da tradução",
    node: true,
    rodar: async () => assert.doesNotMatch(readFileSync(new URL("../js/i18n.js", import.meta.url), "utf8"), /Os dois botões de cima abrem o GitHub|liberados para teste/),
  },
];
