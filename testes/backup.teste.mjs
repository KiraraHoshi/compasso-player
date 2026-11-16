// Backup e restauração dos ajustes de som da 1.19
import assert from "node:assert/strict";

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
];
