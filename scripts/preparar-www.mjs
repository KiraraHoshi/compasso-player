// Monta a pasta www/ com os arquivos do app para o Capacitor (o mesmo app do site, sem o service worker).
import { cpSync, mkdirSync, rmSync, readFileSync, writeFileSync } from "node:fs";
rmSync("www", { recursive: true, force: true });
mkdirSync("www");
for (const item of ["index.html", "manifest.json", "css", "js", "icons", "temas"]) cpSync(item, "www/" + item, { recursive: true });
// O service worker não entra: no app Android tudo já vem dentro do aplicativo (o app.js não o registra quando window.Capacitor existe).
if (process.env.OROLON_LOJA === "1") { // pacote da Google Play: o app fica sabendo que as atualizações vêm da loja
  const f = "www/js/app.js", a = readFileSync(f, "utf8"), marca = "const DA_LOJA = false;";
  if (a.split(marca).length !== 2) throw new Error("não achei a marca da versão da loja no app.js");
  writeFileSync(f, a.replace(marca, "const DA_LOJA = true;"));
}
console.log("www/ pronta" + (process.env.OROLON_LOJA === "1" ? " (versão da Google Play)" : ""));
