// Liga o plugin "Musicas" (android-plugin/MusicasPlugin.java) ao projeto Android gerado pelo Capacitor:
// 1. copia o plugin para o pacote do app; 2. registra o plugin na MainActivity; 3. acrescenta a permissão de ler músicas.
import { readFileSync, writeFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const raiz = "android/app/src/main/java";
function achar(dir, nome) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { const r = achar(p, nome); if (r) return r; }
    else if (f === nome) return p;
  }
  return null;
}
const main = achar(raiz, "MainActivity.java");
if (!main) { console.error("MainActivity.java não encontrada em " + raiz); process.exit(1); }
const pacote = (readFileSync(main, "utf8").match(/^package\s+([\w.]+);/m) || [])[1];
if (!pacote) { console.error("Pacote da MainActivity não encontrado"); process.exit(1); }

// 1. plugin
const pasta = main.replace(/MainActivity\.java$/, "");
writeFileSync(pasta + "MusicasPlugin.java", readFileSync("android-plugin/MusicasPlugin.java", "utf8").replace("package PACOTE;", `package ${pacote};`));

// 2. MainActivity: registra o plugin antes de o Capacitor iniciar
writeFileSync(main, `package ${pacote};

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(MusicasPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`);

// 3. permissões: Android 13+ usa READ_MEDIA_AUDIO; até o 12, READ_EXTERNAL_STORAGE
const arq = "android/app/src/main/AndroidManifest.xml";
let xml = readFileSync(arq, "utf8");
const linhas = [];
if (!xml.includes('"android.permission.READ_MEDIA_AUDIO"')) linhas.push('    <uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />');
if (!xml.includes('"android.permission.READ_EXTERNAL_STORAGE"')) linhas.push('    <uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />');
if (linhas.length) xml = xml.replace(/(\s*)<application/, `\n${linhas.join("\n")}\n$1<application`);
writeFileSync(arq, xml);
console.log("Plugin Musicas ligado em " + pacote);
