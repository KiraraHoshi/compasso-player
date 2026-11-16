import assert from "node:assert/strict";

const tela = (p) => p.avaliar(() => document.getElementById("app").dataset.view);

export default [
  {
    nome: "abre no Início",
    rodar: async (p) => assert.equal(await tela(p), "inicio"),
  },
  {
    nome: "barra na ordem certa",
    rodar: async (p) => assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#nav button")].map((b) => b.dataset.v)), ["inicio", "biblioteca", "playlists", "voce", "temas"]),
  },
  {
    nome: "hash antigo #tocando ainda abre o Tocando",
    hash: "tocando",
    rodar: async (p) => {
      assert.equal(await tela(p), "tocando");
      assert.equal(await p.avaliar(() => document.querySelector("#nav button.on")), null);
    },
  },
  {
    nome: "hash inválido cai no Início",
    hash: "xyz",
    rodar: async (p) => assert.equal(await tela(p), "inicio"),
  },
  {
    nome: "mini player abre o Tocando e voltar retorna",
    rodar: async (p) => {
      await p.clicar("#mini-open");
      assert.equal(await tela(p), "tocando");
      assert.equal(await p.voltar(), true);
      assert.equal(await tela(p), "inicio");
    },
  },
  {
    nome: "voltar na raiz minimiza",
    rodar: async (p) => assert.equal(await p.voltar(), false),
  },
  {
    nome: "Biblioteca → voltar → Início",
    rodar: async (p) => {
      await p.clicar('#nav [data-v="biblioteca"]');
      assert.equal(await tela(p), "biblioteca");
      assert.equal(await p.voltar(), true);
      assert.equal(await tela(p), "inicio");
    },
  },
];
