import assert from "node:assert/strict";

const trocarCor = async (p) => {
  // escolhe no Ajuste rápido (porta Aparência) uma cor diferente da atual
  await p.avaliar(() => ir("temas"));
  await p.clicar('[data-porta="aparencia"]');
  await p.avaliar(() => { const b = [...document.querySelectorAll("[data-cor]")].find((x) => x.getAttribute("aria-pressed") !== "true"); b.click(); });
  await p.quadro();
};

export default [
  {
    nome: "mesma chave, mesmo par de cores",
    rodar: async (p) => {
      assert.deepEqual(await p.avaliar(() => coresPadrao("a")), await p.avaliar(() => coresPadrao("a")));
      assert.notDeepEqual(await p.avaliar(() => coresPadrao("a")), await p.avaliar(() => coresPadrao("b")));
    },
  },
  {
    nome: "capa padrão segue a cor do tema, sem recarregar",
    rodar: async (p) => {
      await p.avaliar(() => ir("biblioteca"));
      const antes = await p.avaliar(() => ({ par: coresPadrao("a"), fundo: document.querySelector("#lib .thumb").style.background }));
      await trocarCor(p);
      await p.avaliar(() => ir("biblioteca"));
      const depois = await p.avaliar(() => ({ par: coresPadrao("a"), fundo: document.querySelector("#lib .thumb").style.background }));
      assert.notDeepEqual(depois.par, antes.par, "o par de cores não mudou com o tema");
      assert.notEqual(depois.fundo, antes.fundo, "a capa da lista não mudou com o tema");
    },
  },
  {
    nome: "capa de verdade não muda",
    rodar: async (p) => {
      const capa = "data:image/png;base64,iVBORw0KGgo=";
      assert.ok((await p.avaliar((c) => fundoDe({ cover: c, c: ["#111111", "#222222"], a: "x", al: "", t: "y" }), capa)).startsWith("url("));
      await trocarCor(p);
      assert.ok((await p.avaliar((c) => fundoDe({ cover: c, c: ["#111111", "#222222"], a: "x", al: "", t: "y" }), capa)).startsWith("url("));
    },
  },
  {
    nome: "dados salvos intactos ao trocar o tema",
    rodar: async (p) => {
      const antes = await p.avaliar(() => JSON.stringify(cur().c));
      await trocarCor(p);
      assert.equal(await p.avaliar(() => JSON.stringify(cur().c)), antes);
    },
  },
  {
    nome: "símbolo branco legível na capa padrão (temas claro e escuro)",
    rodar: async (p) => {
      for (const tema of ["claro", "escuro"]) {
        const l = await p.avaliar((tm) => { cfg.tema = tm; aplicarTema(); return coresPadrao("teste").map(lum); }, tema);
        assert.ok(l.every((v) => v <= 0.55), `${tema}: capa clara demais para o símbolo branco (${l})`);
      }
    },
  },
];
