import assert from "node:assert/strict";

// 1.26.8: o backup automático grava numa pasta "Orolon Player" criada dentro do lugar escolhido (sem permissão nova)
// e o nome das cópias leva a marca do próprio aparelho, não um valor guardado nos dados (que o Android copia para o celular novo).
const plugFalso = (p, o = {}) => p.avaliar((o) => {
  window.__ch = [];
  window.__lista = [];
  window.plug = {
    escolherPastaBackup: async () => ({ uri: "content://pasta/1", nome: o.sub ? "Backups/Orolon Player" : "Backups", ...(o.sub ? { sub: o.sub } : {}) }),
    gravarBackup: async (x) => { __ch.push({ m: "gravar", sub: x.sub, nome: x.nome, grupo: x.grupo }); return o.recriada ? { sub: o.recriada } : {}; },
    listarBackups: async (x) => { __ch.push({ m: "listar", sub: x.sub }); return { backups: window.__lista }; },
    lerBackup: async () => ({ texto: JSON.stringify({ formato: "compasso-backup", versao: 1, ajustes: {} }) }),
    ...(o.marca ? { aparelho: async () => ({ marca: o.marca }) } : {}),
  };
}, o);

export default [
  {
    nome: "pasta nova com subpasta: guarda o sub e manda nas contas de listar e gravar",
    rodar: async (p) => {
      await plugFalso(p, { sub: "S1", marca: "q7x2" });
      await p.avaliar(() => escolherPastaBackup(plug));
      assert.deepEqual(await p.avaliar(() => cfg.bkpPasta), { uri: "content://pasta/1", nome: "Backups/Orolon Player", sub: "S1" });
      assert.deepEqual(await p.avaliar(() => __ch.map((c) => [c.m, c.sub])), [["listar", "S1"], ["gravar", "S1"]]);
    },
  },
  {
    nome: "subpasta recriada na gravação: o app guarda o documento novo",
    rodar: async (p) => {
      await plugFalso(p, { sub: "S1", recriada: "S2", marca: "q7x2" });
      await p.avaliar(() => escolherPastaBackup(plug));
      assert.equal(await p.avaliar(() => cfg.bkpPasta.sub), "S2");
      await p.avaliar(() => backupAutomatico(plug, Date.now() + 2 * 86400000));
      assert.equal(await p.avaliar(() => __ch.filter((c) => c.m === "gravar").pop().sub), "S2");
    },
  },
  {
    nome: "pasta escolhida antes (sem sub) continua no formato antigo",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; });
      await p.avaliar(() => backupAutomatico(plug, Date.now(), true));
      assert.deepEqual(await p.avaliar(() => [cfg.bkpPasta, "sub" in __ch[0] && __ch[0].sub !== undefined]), [{ uri: "content://pasta/1", nome: "Backups" }, false]);
    },
  },
  {
    nome: "marca do aparelho no nome e na limpeza, mesmo com outra marca vinda nos dados restaurados",
    rodar: async (p) => {
      await plugFalso(p, { marca: "q7x2" });
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; cfg.bkpId = "zz99"; }); // zz99 veio do celular antigo pelo backup do Android
      await p.avaliar(() => backupAutomatico(plug, Date.now(), true));
      const g = await p.avaliar(() => __ch[0]);
      assert.match(g.nome, /^orolon-backup-\d{4}-\d{2}-\d{2}-q7x2\.json$/);
      assert.equal(g.grupo, "-q7x2.json", "a limpeza só pode mexer nas cópias deste aparelho");
    },
  },
  {
    nome: "sem a marca do aparelho (navegador), segue a marca sorteada de antes",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; cfg.bkpId = "ab12"; });
      await p.avaliar(() => backupAutomatico(plug, Date.now(), true));
      assert.equal(await p.avaliar(() => __ch[0].grupo), "-ab12.json");
    },
  },
  {
    nome: "folha das cópias marca como deste aparelho as da marca do aparelho",
    rodar: async (p) => {
      await plugFalso(p, { marca: "q7x2" });
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; cfg.bkpId = "zz99"; window.__lista = [{ nome: "orolon-backup-2026-11-20-q7x2.json", doc: "a", modificado: 2 }, { nome: "orolon-backup-2026-11-19-zz99.json", doc: "b", modificado: 1 }]; });
      await p.avaliar(async () => abrirCopiasDaPasta(plug, await copiasDaPasta(plug)));
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#sheet [data-bkp-doc] .sub")].map((e) => e.textContent)), ["deste aparelho", "de outro aparelho"]);
    },
  },
  {
    nome: "a ajuda da pasta do backup explica a pasta Orolon Player",
    script: "window.Capacitor = { isNativePlatform: () => true, getPlatform: () => \"android\", Plugins: { Musicas: new Proxy({}, { get: (o, m) => m === \"then\" ? undefined : m === \"addListener\" ? async () => ({ remove() {} }) : async () => ({}) }) } };", // o app Android (o backup automático só existe lá)
    rodar: async (p) => {
      const txt = await p.avaliar(() => { ir("temas"); abrirPorta("sobre"); return document.getElementById("tm").textContent; });
      assert.match(txt, /pasta "Orolon Player"/);
    },
  },
];
