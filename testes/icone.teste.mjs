// Ícone B3 ("O tocando"): capa padrão e arquivos de ícone
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { inflateSync } from "node:zlib";

const png = (f) => {
  const b = readFileSync(new URL("../" + f, import.meta.url));
  return { w: b.readUInt32BE(16), h: b.readUInt32BE(20), tipo: b[25] }; // cabeçalho IHDR
};
// Largura do desenho (pixels não transparentes) em fração do lado. Lê PNG RGBA de 8 bits sem entrelaçamento.
const larguraDesenho = (f) => {
  const b = readFileSync(new URL("../" + f, import.meta.url)), w = b.readUInt32BE(16), h = b.readUInt32BE(20), idat = [];
  for (let o = 8; o < b.length; ) { const n = b.readUInt32BE(o), t = b.toString("ascii", o + 4, o + 8); if (t === "IDAT") idat.push(b.subarray(o + 8, o + 8 + n)); o += 12 + n; }
  const d = inflateSync(Buffer.concat(idat)), bpl = w * 4, lin = Buffer.alloc(bpl), ant = Buffer.alloc(bpl);
  let min = w, max = -1;
  for (let y = 0; y < h; y++) {
    const ft = d[y * (bpl + 1)], src = d.subarray(y * (bpl + 1) + 1, (y + 1) * (bpl + 1));
    for (let i = 0; i < bpl; i++) {
      const a = i >= 4 ? lin[i - 4] : 0, c = i >= 4 ? ant[i - 4] : 0, u = ant[i];
      const pa = Math.abs(u - c), pb = Math.abs(a - c), pc = Math.abs(a + u - 2 * c);
      lin[i] = (src[i] + [0, a, u, (a + u) >> 1, pa <= pb && pa <= pc ? a : pb <= pc ? u : c][ft]) & 255;
    }
    for (let x = 0; x < w; x++) if (lin[x * 4 + 3] > 40) { if (x < min) min = x; if (x > max) max = x; }
    lin.copy(ant);
  }
  return (max - min + 1) / w;
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
  {
    nome: "símbolo do ícone adaptativo grande e dentro da área segura",
    node: true,
    rodar: async () => {
      const l = larguraDesenho("android-assets/icon-foreground.png");
      assert.ok(l >= 0.45 && l <= 0.6, `largura do símbolo = ${l.toFixed(3)} do lado (esperado 0,45 a 0,60)`);
    },
  },
];
