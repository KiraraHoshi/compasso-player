// Monta a pasta www/ com os arquivos do app para o Capacitor (o mesmo app do site, sem o service worker).
import { cpSync, mkdirSync, rmSync } from "node:fs";
rmSync("www", { recursive: true, force: true });
mkdirSync("www");
for (const item of ["index.html", "manifest.json", "css", "js", "icons", "temas"]) cpSync(item, "www/" + item, { recursive: true });
// O service worker não entra: no app Android tudo já vem dentro do aplicativo (o app.js não o registra quando window.Capacitor existe).
console.log("www/ pronta");
