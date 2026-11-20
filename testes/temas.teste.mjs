import assert from "node:assert/strict";

// 1.26.8: os 14 temas do Caixinhas, brilho por tema, fonte Orologia e migração dos temas da galeria já adicionados
const BRASA = { nome: "Brasa", fundo: "#17100C", card: "#241812", texto: "#F7EBDD", suave: "#B59E8A", destaque: "#FF8A3D", secundaria: "#F2D7A6", fonte: "padrao" };
const IDS = ["escuro", "claro", "g-brasa", "g-entardecer", "g-folha", "g-mare", "g-meia-noite", "g-papel", "g-ametista", "g-musgo", "g-grafite", "g-areia", "g-nevoa", "g-lirio"];

export default [
  {
    nome: "14 temas de fábrica, com os ids do Caixinhas",
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => meusTemas.length), 0);
      assert.deepEqual(await p.avaliar(() => todosTemas().map((t) => t.id)), IDS);
    },
  },
  {
    nome: "Orologia Escuro e Claro com as cores do Caixinhas e fonte Cinzel",
    rodar: async (p) => {
      const [e, c, f] = await p.avaliar(() => [BASE.escuro, BASE.claro, FONTES.padrao.d]);
      assert.deepEqual([e.fundo, e.card, e.texto, e.suave, e.destaque, e.secundaria, e.raio], ["#110E18", "#1C1827", "#EEEAF5", "#A49EB8", "#9C9BF5", "#E3C98A", 14]);
      assert.deepEqual([c.fundo, c.card, c.texto, c.suave, c.destaque, c.secundaria, c.raio], ["#F2F0F7", "#FFFFFF", "#1E1A2B", "#5E5874", "#5A50D6", "#8C5E14", 14]);
      assert.ok(f.startsWith('"Cinzel"'), f);
    },
  },
  {
    nome: "brilho: aceito quando válido, ignorado quando inválido, exportado só quando próprio",
    rodar: async (p) => {
      assert.equal(await p.avaliar((b) => validarTema({ ...b, brilho: "#123456" }).brilho, BRASA), "#123456");
      assert.equal(await p.avaliar((b) => "brilho" in validarTema({ ...b, brilho: "rosa" }), BRASA), false);
      assert.ok(await p.avaliar(() => temaJSON(temaPorId("g-ametista")).includes('"brilho": "#7E3496"')));
      assert.ok(!(await p.avaliar(() => temaJSON(temaPorId("escuro")).includes("brilho"))));
      assert.equal(await p.avaliar(() => brilhoDe(temaPorId("g-ametista"))), "#7E3496");
      assert.match(await p.avaliar(() => brilhoDe(temaPorId("escuro"))), /^#[0-9A-F]{6}$/i);
    },
  },
  {
    nome: "tema da galeria adicionado antes vira o de fábrica (com o cantos guardado)",
    antes: { "compasso.temas": [{ id: "t1", ...BRASA, raio: 20 }], "compasso.cfg": { tema: "t1", padroes19: 1 } },
    rodar: async (p) => {
      assert.deepEqual(await p.avaliar(() => [meusTemas.length, cfg.tema, cfg.ajustes["g-brasa"] && cfg.ajustes["g-brasa"].raio, temaAtual().raio]), [0, "g-brasa", 20, 20]);
    },
  },
  {
    nome: "tema com o nome da galeria mas cores ou fonte mudadas continua da pessoa",
    antes: { "compasso.temas": [{ id: "t1", ...BRASA, destaque: "#00FF00", raio: 12 }, { id: "t2", ...BRASA, fonte: "mono", raio: 12 }], "compasso.cfg": { tema: "t1", padroes19: 1 } },
    rodar: async (p) => {
      assert.deepEqual(await p.avaliar(() => [meusTemas.map((t) => t.id), cfg.tema]), [["t1", "t2"], "t1"]);
    },
  },
  {
    nome: "restaurar backup antigo com tema da galeria não duplica",
    rodar: async (p) => {
      await p.avaliar((b) => restaurarBackup({ formato: "compasso-backup", temas: [{ ...b, raio: 12 }] }), BRASA);
      assert.equal(await p.avaliar(() => meusTemas.length), 0);
    },
  },
];
