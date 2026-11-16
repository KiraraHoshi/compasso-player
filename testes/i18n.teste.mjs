// Confere que todo texto em português usado no app.js tem tradução no dicionário EN de js/i18n.js.
import { readFileSync } from "node:fs";
import vm from "node:vm";
import assert from "node:assert/strict";

const raiz = new URL("../", import.meta.url);
const ler = (f) => readFileSync(new URL(f, raiz), "utf8");

export function carregarEN() {
  const ctx = {
    localStorage: { getItem: () => null },
    navigator: { language: "pt-BR", languages: ["pt-BR"] },
    document: { documentElement: {} },
  };
  vm.createContext(ctx);
  vm.runInContext(ler("js/i18n.js") + "\n;globalThis.__EN = EN;", ctx);
  return ctx.__EN;
}

/* Literais passados para T("…") e os dois textos de plural(n, "um", "vários") */
export function textosDoApp(fonte) {
  const achados = new Set();
  const lit = String.raw`"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)'`;
  // aspas duplas vêm como estão; simples precisam escapar as duplas de dentro antes do JSON.parse
  const desfaz = (duplas, simples) => JSON.parse('"' + (duplas ?? simples.replace(/\\'/g, "'").replace(/"/g, '\\"')) + '"');
  for (const m of fonte.matchAll(new RegExp(String.raw`\bT\(\s*(?:${lit})`, "g"))) achados.add(desfaz(m[1], m[2]));
  for (const m of fonte.matchAll(new RegExp(String.raw`\bplural\([^,()]+,\s*(?:${lit})\s*,\s*(?:${lit})`, "g"))) {
    achados.add(desfaz(m[1], m[2]));
    achados.add(desfaz(m[3], m[4]));
  }
  return achados;
}

export default [
  {
    nome: "todo texto do app tem tradução em inglês",
    node: true,
    rodar: async () => {
      const EN = carregarEN();
      const faltam = [...textosDoApp(ler("js/app.js"))].filter((s) => EN[s] === undefined);
      assert.deepEqual(faltam, [], "Sem tradução no EN:\n  " + faltam.join("\n  "));
    },
  },
];
