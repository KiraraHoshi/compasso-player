import assert from "node:assert/strict";

// 1.26.10: no Android, "Salvar backup" grava a cópia na pasta escolhida na hora (antes abria o compartilhamento, igual ao "Enviar backup")
const plugFalso = (p, o = {}) => p.avaliar((o) => {
  window.__ch = [];
  window.plug = {
    escolherPastaBackup: async () => { __ch.push("escolher"); return { uri: "content://pasta/1", nome: "Backups/Orolon Player", sub: "S1" }; },
    gravarBackup: async (x) => { __ch.push("gravar"); if (o.falha) throw new Error("sem pasta"); return {}; },
    listarBackups: async () => { __ch.push("listar"); return { backups: o.copias || [] }; },
    lerBackup: async () => ({ texto: "{}" }),
    compartilhar: async () => { __ch.push("compartilhar"); },
    aparelho: async () => ({ marca: "q7x2" }),
  };
  if (o.semPasta) delete window.plug.gravarBackup;
}, o);
const toastTexto = (p) => p.avaliar(() => document.getElementById("toast").textContent);

export default [
  {
    nome: "com a pasta escolhida, Salvar backup grava nela agora e não abre o compartilhamento",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups/Orolon Player", sub: "S1" }; cfg.bkpAutoEm = Date.now(); }); // a cópia do dia já saiu: o salvar manual grava mesmo assim
      await p.avaliar(() => salvarBackup(plug));
      assert.deepEqual(await p.avaliar(() => __ch), ["gravar"]);
      assert.match(await toastTexto(p), /salvo na pasta/i);
    },
  },
  {
    nome: "pasta que falhou: avisa que não gravou",
    rodar: async (p) => {
      await plugFalso(p, { falha: true });
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; });
      await p.avaliar(() => salvarBackup(plug));
      assert.match(await toastTexto(p), /Não deu para gravar/);
      assert.equal(await p.avaliar(() => __ch.includes("compartilhar")), false);
    },
  },
  {
    nome: "sem pasta escolhida, Salvar backup pede a pasta (e grava nela) em vez de compartilhar",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => { delete cfg.bkpPasta; });
      await p.avaliar(() => salvarBackup(plug));
      assert.deepEqual(await p.avaliar(() => __ch), ["escolher", "listar", "gravar"]);
    },
  },
  {
    nome: "pasta com backups ainda sem decisão: mostra as cópias para escolher, nada é gravado",
    rodar: async (p) => {
      await plugFalso(p, { copias: [{ nome: "orolon-backup-2026-11-01-ab12.json", doc: "d1" }] });
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; cfg.bkpPendente = true; });
      await p.avaliar(() => salvarBackup(plug));
      assert.equal(await p.avaliar(() => __ch.includes("gravar")), false);
      assert.equal(await p.avaliar(() => !!document.querySelector("#sheet-b [data-bkp-doc]")), true, "a folha com as cópias devia abrir");
    },
  },
  {
    nome: "app Android sem gravação em pasta (plugin antigo): continua pelo compartilhamento",
    rodar: async (p) => {
      await plugFalso(p, { semPasta: true });
      await p.avaliar(() => salvarBackup(plug));
      assert.deepEqual(await p.avaliar(() => __ch), ["compartilhar"]);
    },
  },
];
