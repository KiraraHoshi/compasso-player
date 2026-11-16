// Achados da revisão final da 1.18
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

export default [
  {
    nome: "app instalado (PWA) abre no Início",
    node: true,
    rodar: async () => {
      const m = JSON.parse(readFileSync(new URL("../manifest.json", import.meta.url), "utf8"));
      assert.ok(["./", "./#inicio"].includes(m.start_url), `start_url ainda é ${m.start_url}`);
    },
  },
  {
    nome: "convite de biblioteca vazia não pisca enquanto a biblioteca carrega",
    antes: { "compasso.cfg": { exemplos: false } },
    rodar: async (p) => {
      const pisca = await p.avaliar(() => { carregado = false; renderInicio(); const r = !!document.querySelector("#ini-vazio"); carregado = true; renderInicio(); return r; });
      assert.equal(pisca, false, "mostrou 'Traga suas músicas' antes de terminar de carregar");
      assert.ok(await p.avaliar(() => !!document.querySelector("#ini-vazio")), "depois de carregar, o convite deveria aparecer");
    },
  },
  {
    nome: "Início não mostra <unknown> no lugar do artista",
    rodar: async (p) => {
      const txt = await p.avaliar(() => { const x = cur(); x.a = "<unknown>"; x.pasta = "Music/Download"; renderInicio(); return document.getElementById("ini-cont").textContent; });
      assert.ok(!txt.includes("<unknown>"), txt);
      assert.ok(txt.includes("Download"), txt);
    },
  },
];
