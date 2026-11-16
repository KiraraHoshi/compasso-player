// Ícone B3 ("O tocando"): capa padrão e arquivos de ícone
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const png = (f) => {
  const b = readFileSync(new URL("../" + f, import.meta.url));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), tipo: b[25] }; // cabeçalho IHDR
};
const TAMANHOS = {
  "icons/icon-192.png": 192, "icons/icon-512.png": 512, "icons/maskable-512.png": 512, "loja/icone-512.png": 512,
  "android-assets/icon-only.png": 1024, "android-assets/icon-foreground.png": 1024, "android-assets/icon-background.png": 1024,
  "android-assets/splash.png": 2732, "android-assets/splash-dark.png": 2732,
};

export default [
  {
    nome: "capa padrão usa o símbolo B3",
    hash: "biblioteca",
    rodar: async (p) => {
      const r = await p.avaliar(() => { const m = document.querySelector("#lib .thumb .marca"); return { rect: m.querySelectorAll("rect").length, line: m.querySelectorAll("line").length }; });
      assert.deepEqual(r, { rect: 3, line: 0 });
    },
  },
  {
    nome: "arquivos de ícone com o tamanho certo",
    node: true,
    rodar: async () => {
      for (const [f, t] of Object.entries(TAMANHOS)) { const i = png(f); assert.deepEqual([i.w, i.h], [t, t], f); }
      assert.equal(png("android-assets/icon-foreground.png").tipo, 6, "icon-foreground precisa ter fundo transparente (RGBA)");
    },
  },
];
