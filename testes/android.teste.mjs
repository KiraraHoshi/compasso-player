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
function montarActivity() { // roda o preparo do plugin num projeto Android mínimo e devolve a MainActivity gerada
  const dir = mkdtempSync(join(tmpdir(), "orolon-activity-")), pasta = join(dir, "android/app/src/main/java/com/joah/orolon");
  try {
    mkdirSync(pasta, { recursive: true });
    writeFileSync(join(pasta, "MainActivity.java"), "package com.joah.orolon;\n\nimport com.getcapacitor.BridgeActivity;\n\npublic class MainActivity extends BridgeActivity {}\n");
    writeFileSync(join(dir, "android/app/src/main/AndroidManifest.xml"), MODELO);
    mkdirSync(join(dir, "android-plugin")); cpSync(join(RAIZ, "android-plugin/MusicasPlugin.java"), join(dir, "android-plugin/MusicasPlugin.java"));
    execFileSync(process.execPath, [join(RAIZ, "scripts/musicas-android.mjs")], { cwd: dir, stdio: "pipe" });
    return readFileSync(join(pasta, "MainActivity.java"), "utf8");
  } finally { rmSync(dir, { recursive: true, force: true }); }
}

// Finge o app Android: todo plugin aceita qualquer chamada e anota o que recebeu em window.__log
const FINGIR_ANDROID = `
window.__log = [];
const plugin = (nome) => new Proxy({}, { get: (o, m) => m === "then" ? undefined
  : m === "addListener" ? async () => ({ remove() {} })
  : async (a) => { __log.push(nome + "." + String(m) + (a && a.cor ? ":" + a.cor : "")); return {}; } });
window.Capacitor = { isNativePlatform: () => true, getPlatform: () => "android",
  Plugins: { SystemBars: plugin("SystemBars"), Musicas: plugin("Musicas"), MediaSession: plugin("MediaSession"), App: plugin("App") } };
`;

export default [
  {
    nome: "Android com WebView antigo: o espaço das barras do sistema ganha a cor do fundo do tema, sempre depois de o SystemBars repintar (antes ficava uma faixa cinza em cima e embaixo; visto num Galaxy M52)",
    script: FINGIR_ANDROID,
    rodar: async (p) => {
      const ultimaCor = () => p.avaliar(() => { const l = window.__log, i = l.map((x) => x.startsWith("Musicas.corDaJanela")).lastIndexOf(true), j = l.lastIndexOf("SystemBars.setStyle"); return { cor: i >= 0 ? l[i] : null, depois: i > j }; });
      await p.esperar(() => window.__log.some((x) => x.startsWith("Musicas.corDaJanela")), 4000);
      // o tema de fábrica segue o modo do sistema (no GitHub o Chrome abre no claro): vale a cor do tema em uso
      const [inicial, outra] = await p.avaliar(() => [temaAtual().fundo, temaAtual().fundo === BASE.claro.fundo ? BASE.escuro.fundo : BASE.claro.fundo]);
      assert.deepEqual(await ultimaCor(), { cor: "Musicas.corDaJanela:" + inicial, depois: true }, "tema de fábrica");
      await p.avaliar((c) => aplicar(c === BASE.claro.fundo ? BASE.claro : BASE.escuro), outra);
      await p.esperar((c) => window.__log.includes("Musicas.corDaJanela:" + c), 4000, outra);
      assert.deepEqual(await ultimaCor(), { cor: "Musicas.corDaJanela:" + outra, depois: true }, "trocar de tema troca a cor");
      // girar o celular: o SystemBars repinta a janela com a cor padrão do Android; o app pinta de novo
      await p.avaliar(() => { window.__log.length = 0; window.__log.push("SystemBars.setStyle"); dispatchEvent(new Event("resize")); });
      await p.esperar((c) => window.__log.includes("Musicas.corDaJanela:" + c), 4000, outra);
    },
  },
  {
    nome: "o plugin pinta a janela por trás das barras só com cor válida (#RRGGBB), sem derrubar o app",
    node: true,
    rodar: async () => {
      const j = ler("android-plugin/MusicasPlugin.java");
      const m = j.match(/public void corDaJanela\(PluginCall call\) \{[\s\S]*?\n    \}/);
      assert.ok(m, "existe o método corDaJanela");
      assert.match(m[0], /\^#\[0-9A-Fa-f\]\{6\}\$/, "confere o formato da cor");
      assert.match(m[0], /getDecorView\(\)\.setBackgroundColor\(Color\.parseColor\(cor\)\)/);
      assert.match(m[0], /runOnUiThread/);
      assert.match(j, /^import android\.graphics\.Color;/m);
    },
  },
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
      assert.ok(ler("js/app.js").includes("notaAtualizacao(NATIVO, DA_LOJA)"), "a tela Sobre usa a marca da versão da loja");
      assert.match(montarWww({}), /^const DA_LOJA = false;/m);
      assert.match(montarWww({ OROLON_LOJA: "1" }), /^const DA_LOJA = true;/m);
      assert.match(ler(".github/workflows/android-loja.yml"), /OROLON_LOJA=1 npm run www/);
      assert.ok(!/OROLON_LOJA/.test(ler(".github/workflows/android.yml")), "o APK de teste não é versão da loja");
    },
  },
  {
    nome: "o app desenha de ponta a ponta em todo Android, e só liga isso depois de o Capacitor montar a tela (antes, a janela nascia com o tema da abertura e a imagem dela virava uma faixa no topo)",
    node: true,
    rodar: async () => {
      const j = montarActivity();
      assert.match(j, /import androidx\.activity\.EdgeToEdge;/);
      const e2e = j.indexOf("EdgeToEdge.enable(this);"), sup = j.indexOf("super.onCreate(");
      assert.ok(e2e > 0, "chama EdgeToEdge.enable(this)");
      assert.ok(e2e > sup, "depois de o Capacitor trocar o tema da abertura e montar a tela");
      assert.match(j, /registerPlugin\(MusicasPlugin\.class\);/, "o plugin continua registrado");
    },
  },
  {
    nome: "o Capacitor cuida das barras do sistema sem passar o recuo de novo para o CSS (em WebView antigo ele já afasta a tela)",
    node: true,
    rodar: async () => { assert.equal(JSON.parse(ler("capacitor.config.json")).plugins.SystemBars.insetsHandling, "native"); },
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
