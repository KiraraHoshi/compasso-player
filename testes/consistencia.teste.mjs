// Travas de entrega: número da versão igual nos três lugares e dicionário EN sem chave repetida.
import { readFileSync } from "node:fs";
import assert from "node:assert/strict";

const raiz = new URL("../", import.meta.url);
const ler = (f) => readFileSync(new URL(f, raiz), "utf8");

/* Chaves que aparecem mais de uma vez num objeto literal de texto: a segunda apaga a primeira sem aviso. */
export function chavesRepetidas(fonte) {
  const vistas = new Map(), repetidas = [];
  const lit = /^\s*("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')\s*:/gm;
  for (const m of fonte.matchAll(lit)) {
    const k = m[1].startsWith('"') ? JSON.parse(m[1]) : m[1].slice(1, -1).replace(/\\'/g, "'");
    if (vistas.has(k)) repetidas.push(k); else vistas.set(k, true);
  }
  return repetidas;
}

export default [
  {
    nome: "a versão é a mesma no app, no cache do site e no topo do histórico",
    node: true,
    rodar: async () => {
      const app = ler("js/app.js").match(/const VERSAO = "([\d.]+)"/)[1];
      const cache = ler("sw.js").match(/const CACHE = "[^"]*?v([\d.]+)"/)[1];
      const historico = ler("CHANGELOG.md").match(/^## ([\d.]+)/m)[1];
      assert.deepEqual({ cache, historico }, { cache: app, historico: app }, `VERSAO no app.js é ${app}: suba também o CACHE do sw.js e escreva o CHANGELOG`);
    },
  },
  {
    nome: "o dicionário em inglês não tem chave repetida (a segunda apagaria a primeira)",
    node: true,
    rodar: async () => {
      assert.deepEqual(chavesRepetidas(`const EN = {\n  "Pasta": "Folder",\n  'Fila': "Queue",\n  "Pasta": "Dir",\n};`), ["Pasta"], "o detector precisa achar a repetida do exemplo");
      assert.deepEqual(chavesRepetidas(ler("js/i18n.js")), []);
    },
  },
];
