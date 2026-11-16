import assert from "node:assert/strict";

export default [
  {
    nome: "abre sem erros em 360 px",
    largura: 360,
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => document.querySelectorAll("#nav button").length), 5);
      assert.ok(await p.avaliar(() => document.documentElement.scrollWidth <= innerWidth), "a página rola para o lado");
    },
  },
];
