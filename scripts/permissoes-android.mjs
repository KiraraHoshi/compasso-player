// Acrescenta ao AndroidManifest as permissões que o player de mídia em segundo plano exige.
// Sem FOREGROUND_SERVICE_MEDIA_PLAYBACK, o Android 14+ fecha o app ao mostrar a notificação de mídia.
// Também tira a permissão de internet, que o Capacitor põe de fábrica: o Orolon não acessa a rede.
// (as páginas do app são servidas de dentro do próprio aparelho, o que não precisa dessa permissão)
import { readFileSync, writeFileSync } from "node:fs";
const arq = "android/app/src/main/AndroidManifest.xml";
let xml = readFileSync(arq, "utf8");
const perms = [
  "android.permission.FOREGROUND_SERVICE",
  "android.permission.FOREGROUND_SERVICE_MEDIA_PLAYBACK",
  "android.permission.POST_NOTIFICATIONS",
  "android.permission.WAKE_LOCK",
];
const novas = perms.filter((p) => !xml.includes(`"${p}"`))
  .map((p) => `    <uses-permission android:name="${p}" />\n`).join("");
if (novas) xml = xml.replace(/(\s*)<application/, `\n${novas}$1<application`);
if (!xml.includes("xmlns:tools")) xml = xml.replace("<manifest", '<manifest xmlns:tools="http://schemas.android.com/tools"');
xml = xml.replace(/\s*<uses-permission android:name="android\.permission\.INTERNET"[^>]*\/>/g, ""); // a de fábrica e a de uma rodada anterior
xml = xml.replace(/(\s*)<application/, `\n    <uses-permission android:name="android.permission.INTERNET" tools:node="remove" />\n$1<application`); // "remove" vale também para a que as bibliotecas trazem
writeFileSync(arq, xml);
console.log(xml.match(/<uses-permission[^>]*>/g).join("\n"));
