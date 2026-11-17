// Preparo do Android: o app não acessa a internet, então o pacote não pode levar a permissão de internet.
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync, cpSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));
const ler = (f) => readFileSync(join(RAIZ, f), "utf8");
// manifesto como o Capacitor cria: já vem com a permissão de internet
const MODELO = `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application android:label="@string/app_name">
    </application>
    <!-- Permissions -->
    <uses-permission android:name="android.permission.INTERNET" />
</manifest>
`;
function preparar(vezes = 1) {
  const dir = mkdtempSync(join(tmpdir(), "orolon-manifesto-")), arq = join(dir, "android/app/src/main/AndroidManifest.xml");
  try {
    mkdirSync(join(arq, ".."), { recursive: true }); writeFileSync(arq, MODELO);
    for (let i = 0; i < vezes; i++) execFileSync(process.execPath, [join(RAIZ, "scripts/permissoes-android.mjs")], { cwd: dir, stdio: "pipe" });
    return readFileSync(arq, "utf8");
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
function montarWww(env) { // roda o preparo da pasta www numa cópia mínima do app e devolve o app.js que iria para o Android
  const dir = mkdtempSync(join(tmpdir(), "orolon-www-"));
  try {
    for (const p of ["css", "js", "icons", "temas"]) mkdirSync(join(dir, p));
    for (const f of ["index.html", "manifest.json"]) writeFileSync(join(dir, f), "");
    cpSync(join(RAIZ, "js/app.js"), join(dir, "js/app.js"));
    execFileSync(process.execPath, [join(RAIZ, "scripts/preparar-www.mjs")], { cwd: dir, stdio: "pipe", env: { ...process.env, OROLON_LOJA: "", ...env } });
    return readFileSync(join(dir, "www/js/app.js"), "utf8");
  } finally { rmSync(dir, { recursive: true, force: true }); }
}
const permissoes = (xml) => (xml.match(/<uses-permission[^>]*>/g) || []);

export default [
  {
    nome: "a versão da Google Play não manda baixar APK do GitHub; a de teste continua mandando",
    rodar: async (p) => {
      const r = await p.avaliar(() => ({ loja: notaAtualizacao(true, true), teste: notaAtualizacao(true, false), site: notaAtualizacao(false, false) }));
      assert.ok(!/github|apk/i.test(r.loja), "na versão da loja não há link nem menção a APK: " + r.loja);
      assert.match(r.loja, /Google Play/);
      assert.match(r.teste, /releases\/tag\/android-teste/);
      assert.ok(!/releases/.test(r.site) && /navegador/.test(r.site), "no site continua o aviso dos botões que abrem o navegador");
    },
  },
  {
    nome: "só o envio da loja marca o app como versão da Google Play",
    node: true,
    rodar: async () => {
      assert.match(montarWww({}), /^const DA_LOJA = false;/m);
      assert.match(montarWww({ OROLON_LOJA: "1" }), /^const DA_LOJA = true;/m);
      assert.match(ler(".github/workflows/android-loja.yml"), /OROLON_LOJA=1 npm run www/);
      assert.ok(!/OROLON_LOJA/.test(ler(".github/workflows/android.yml")), "o APK de teste não é versão da loja");
    },
  },
  {
    nome: "o preparo do Android tira a permissão de internet e mantém as de tocar em segundo plano",
    node: true,
    rodar: async () => {
      const xml = preparar(), p = permissoes(xml), internet = p.filter((l) => l.includes("android.permission.INTERNET"));
      assert.equal(internet.length, 1, "sobra só a linha que manda remover");
      assert.match(internet[0], /tools:node="remove"/, "a linha de internet manda remover a permissão (inclusive a que as bibliotecas trazem)");
      assert.match(xml, /<manifest[^>]*xmlns:tools="http:\/\/schemas\.android\.com\/tools"/, "o manifesto declara o tools");
      for (const nome of ["FOREGROUND_SERVICE", "FOREGROUND_SERVICE_MEDIA_PLAYBACK", "POST_NOTIFICATIONS", "WAKE_LOCK"]) assert.ok(p.some((l) => l.includes(`"android.permission.${nome}"`)), "falta " + nome);
    },
  },
  {
    nome: "rodar o preparo duas vezes não repete nenhuma permissão",
    node: true,
    rodar: async () => { const p = permissoes(preparar(2)); assert.equal(new Set(p).size, p.length); assert.equal(p.filter((l) => l.includes("INTERNET")).length, 1); },
  },
  {
    nome: "os dois envios do Android (teste e loja) falham se a permissão de internet voltar",
    node: true,
    rodar: async () => {
      for (const f of [".github/workflows/android.yml", ".github/workflows/android-loja.yml"]) {
        const y = ler(f);
        assert.match(y, /merged_manifests/, f + ": confere o manifesto final");
        assert.match(y, /grep -q 'android\.permission\.INTERNET"' "\$M"; then echo "::error[^\n]*exit 1/, f + ": falha se a internet estiver lá");
      }
    },
  },
];
