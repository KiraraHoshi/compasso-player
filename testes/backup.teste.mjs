// Backup e restauração dos ajustes de som da 1.19
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

// Plugin do Android de mentira: guarda as chamadas em window.__ch
const plugFalso = (p) => p.avaliar(() => {
  window.__ch = []; window.__falhar = false;
  window.plug = {
    gravarBackup: async (o) => { __ch.push({ m: "gravar", nome: o.nome, manter: o.manter, uri: o.uri, texto: o.texto }); if (window.__falhar) throw new Error("sem espaço"); },
    compartilhar: async (o) => { __ch.push({ m: "compartilhar", nome: o.nome, texto: o.texto }); },
    escolherPastaBackup: async () => ({ uri: "content://pasta/1", nome: "Backups" }),
    listarBackups: async () => ({ backups: [{ nome: "orolon-backup-2026-11-01.json", doc: "doc-velho", modificado: 100 }, { nome: "orolon-backup-2026-11-15.json", doc: "doc-novo", modificado: 900 }, { nome: "orolon-backup-2026-11-09.json", doc: "doc-meio", modificado: 500 }] }),
    lerBackup: async (o) => { __ch.push({ m: "ler", doc: o.doc }); return { texto: JSON.stringify({ formato: "compasso-backup", versao: 1, playlists: [{ nome: "Da pasta", faixas: ["ex0"] }], ajustes: {} }) }; },
  };
});
const DIA = 86400000;

const EFEITOS = ["amp", "avisoAmp", "reverb", "largura", "apGraves", "apAgudos", "apInt"];

export default [
  {
    nome: "backup leva os efeitos",
    rodar: async (p) => {
      const r = await p.avaliar((chaves) => {
        Object.assign(cfg, { amp: 1.5, avisoAmp: true, reverb: "palco", largura: 1.4, apGraves: 4, apAgudos: -2, apInt: 0.5 });
        const b = JSON.parse(JSON.stringify(gerarBackup())); // como se fosse lido do arquivo
        Object.assign(cfg, { amp: 1, avisoAmp: false, reverb: "nenhum", largura: 1, apGraves: 0, apAgudos: 0, apInt: 0 }); // perfil zerado
        restaurarBackup(b);
        return Object.fromEntries(chaves.map((k) => [k, cfg[k]]));
      }, EFEITOS);
      assert.deepEqual(r, { amp: 1.5, avisoAmp: true, reverb: "palco", largura: 1.4, apGraves: 4, apAgudos: -2, apInt: 0.5 });
    },
  },
  {
    nome: "backup da 1.18 restaura com os padrões",
    rodar: async (p) => {
      const r = await p.avaliar((chaves) => {
        restaurarBackup({ formato: "compasso-backup", versao: 1, ajustes: { vol: 0.5, visual: "vinil" } });
        return Object.fromEntries(chaves.filter((k) => k !== "avisoAmp").map((k) => [k, cfg[k]]));
      }, EFEITOS);
      assert.deepEqual(r, { amp: 1, reverb: "nenhum", largura: 1, apGraves: 0, apAgudos: 0, apInt: 0 });
    },
  },
  {
    nome: "nome do arquivo de backup",
    rodar: async (p) => assert.equal(await p.avaliar(() => nomeBackup(new Date(2026, 10, 6))), "orolon-backup-2026-11-06.json"),
  },
  {
    nome: "backup automático: sem pasta não faz nada",
    rodar: async (p) => {
      await plugFalso(p);
      assert.equal(await p.avaliar(() => backupAutomatico(plug, 1e12)), "sem-pasta");
      assert.equal(await p.avaliar(() => backupAutomatico(null, 1e12)), "sem-pasta");
      assert.equal(await p.avaliar(() => __ch.length), 0);
    },
  },
  {
    nome: "backup automático: grava no máximo uma vez por dia e guarda 5 cópias",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; });
      const t0 = new Date(2026, 10, 16, 10).getTime();
      assert.equal(await p.avaliar((t) => backupAutomatico(plug, t), t0), "feito");
      assert.equal(await p.avaliar((t) => backupAutomatico(plug, t), t0 + 3600000), "cedo");
      assert.equal(await p.avaliar((t) => backupAutomatico(plug, t), t0 + DIA + 60000), "feito");
      const ch = await p.avaliar(() => __ch.map((c) => [c.m, c.nome, c.manter, c.uri, JSON.parse(c.texto).formato]));
      assert.deepEqual(ch, [["gravar", "orolon-backup-2026-11-16.json", 5, "content://pasta/1", "compasso-backup"], ["gravar", "orolon-backup-2026-11-17.json", 5, "content://pasta/1", "compasso-backup"]]);
      assert.equal(await p.avaliar(() => cfg.bkpUltimo), t0 + DIA + 60000);
    },
  },
  {
    nome: "backup automático: falha não trava e fica anotada",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; window.__falhar = true; });
      assert.equal(await p.avaliar(() => backupAutomatico(plug, 1e12)), "falhou");
      assert.deepEqual(await p.avaliar(() => [cfg.bkpFalha, cfg.bkpUltimo || 0]), [true, 0]);
      await p.avaliar(() => { window.__falhar = false; });
      assert.equal(await p.avaliar(() => backupAutomatico(plug, 1e12 + 1000)), "feito", "depois de uma falha, tenta de novo sem esperar um dia");
      assert.equal(await p.avaliar(() => cfg.bkpFalha), false);
    },
  },
  {
    nome: "escolher a pasta já grava o primeiro backup",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => escolherPastaBackup(plug));
      assert.deepEqual(await p.avaliar(() => [cfg.bkpPasta, __ch.map((c) => c.m)]), [{ uri: "content://pasta/1", nome: "Backups" }, ["gravar"]]);
    },
  },
  {
    nome: "enviar backup entrega o arquivo ao compartilhamento",
    rodar: async (p) => {
      await plugFalso(p);
      assert.equal(await p.avaliar(() => podeEnviarBackup(plug)), true);
      await p.avaliar(() => enviarBackup(plug));
      const c = await p.avaliar(() => ({ m: __ch[0].m, nome: __ch[0].nome, formato: JSON.parse(__ch[0].texto).formato, ult: cfg.bkpUltimo > 0 }));
      assert.equal(c.m, "compartilhar"); assert.match(c.nome, /^orolon-backup-\d{4}-\d{2}-\d{2}\.json$/); assert.equal(c.formato, "compasso-backup"); assert.equal(c.ult, true);
    },
  },
  {
    nome: "restaurar da pasta usa a cópia mais recente",
    rodar: async (p) => {
      await plugFalso(p);
      await p.avaliar(() => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; });
      const r = await p.avaliar(() => restaurarDaPasta(plug));
      assert.equal(r.nPl, 1);
      assert.deepEqual(await p.avaliar(() => __ch), [{ m: "ler", doc: "doc-novo" }]);
      assert.ok(await p.avaliar(() => pls.some((x) => x.nome === "Da pasta")));
    },
  },
  {
    nome: "a pasta do backup não viaja dentro do backup",
    rodar: async (p) => {
      const r = await p.avaliar(async () => { cfg.bkpPasta = { uri: "content://pasta/1", nome: "Backups" }; cfg.bkpAutoEm = 5; const a = (await gerarBackupCompleto()).ajustes; return ["bkpPasta" in a, "bkpAutoEm" in a, "bkpFalha" in a, a.vol === cfg.vol, !!cfg.bkpPasta]; });
      assert.deepEqual(r, [false, false, false, true, true]);
    },
  },
  {
    nome: "texto do último backup",
    rodar: async (p) => {
      const agora = new Date(2026, 10, 16, 12).getTime();
      const r = await p.avaliar((agora, DIA) => { const o = []; cfg.bkpUltimo = 0; o.push(textoUltimoBackup(agora)); cfg.bkpUltimo = agora - 3600000; o.push(textoUltimoBackup(agora)); cfg.bkpUltimo = agora - 3 * DIA; o.push(textoUltimoBackup(agora)); return o; }, agora, DIA);
      assert.deepEqual(r, ["Último backup: nunca", "Último backup: hoje", "Último backup: há 3 dias"]);
    },
  },
  {
    nome: "aviso de backup antigo: uma vez, e só para quem tem músicas e não tem backup automático",
    rodar: async (p) => {
      const agora = new Date(2026, 10, 16, 12).getTime();
      assert.equal(await p.avaliar((a, D) => { cfg.bkpDesde = a - 40 * D; return avisoBackup(a); }, agora, DIA), false, "sem músicas importadas não há o que avisar");
      await p.avaliar(() => { const x = { id: "tb1", sig: "tb1|1|1", em: 1, arq: new Blob(["x"]), t: "T", a: "A", al: "", n: 0, d: 1, c: ["#111", "#222"], letra: "" }; montar(x); adicionarFaixa(x); });
      assert.equal(await p.avaliar((a) => avisoBackup(a), agora), true);
      assert.equal(await p.avaliar((a) => avisoBackup(a + 1000), agora), false, "não repete o aviso");
      assert.equal(await p.avaliar((a, D) => { cfg.bkpAvisoEm = 0; cfg.bkpUltimo = a - 2 * D; return avisoBackup(a); }, agora, DIA), false, "com backup recente não avisa");
      assert.equal(await p.avaliar((a) => { cfg.bkpUltimo = 0; cfg.bkpPasta = { uri: "u", nome: "n" }; return avisoBackup(a); }, agora), false, "com backup automático não avisa");
    },
  },
  {
    nome: "Sobre mostra quando foi o último backup",
    hash: "temas",
    rodar: async (p) => {
      await p.clicar('[data-porta="sobre"]');
      assert.ok(await p.avaliar(() => document.getElementById("tm").textContent.includes("Último backup: nunca")));
    },
  },
  {
    nome: "plugin do Android tem as funções de backup",
    node: true,
    rodar: async () => {
      const j = readFileSync(new URL("../android-plugin/MusicasPlugin.java", import.meta.url), "utf8");
      for (const t of ["public void compartilhar", "public void escolherPastaBackup", "public void gravarBackup", "public void listarBackups", "public void lerBackup", "FileProvider.getUriForFile", '".fileprovider"', "FLAG_GRANT_WRITE_URI_PERMISSION", "import androidx.core.content.FileProvider;"]) assert.ok(j.includes(t), "falta no plugin: " + t);
      const semTexto = j.replace(/"(?:[^"\\]|\\.)*"/g, '""').replace(/'(?:[^'\\]|\\.)'/g, "''").replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "");
      for (const [a, b] of ["{}", "()", "[]"]) assert.equal(semTexto.split(a).length, semTexto.split(b).length, `${a} e ${b} desbalanceados no plugin`);
      assert.ok(!/MANAGE_EXTERNAL_STORAGE|WRITE_EXTERNAL_STORAGE/.test(j), "o backup não pode pedir permissão de armazenamento");
    },
  },
];
