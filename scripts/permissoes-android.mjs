// Acrescenta ao AndroidManifest as permissões que o player de mídia em segundo plano exige.
// Sem FOREGROUND_SERVICE_MEDIA_PLAYBACK, o Android 14+ fecha o app ao mostrar a notificação de mídia.
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
writeFileSync(arq, xml);
console.log(xml.match(/<uses-permission[^>]*>/g).join("\n"));
