// Gera todos os ícones do Orolon a partir de icons/orolon.svg, com o Chrome do PC (sem dependências).
// Uso: node scripts/gerar-icones.mjs     (defina ORO_CHROME se o Chrome estiver em outro lugar)
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));
const CHROME = [process.env.ORO_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean).find((c) => existsSync(c));
if (!CHROME) throw new Error("Chrome não encontrado. Defina ORO_CHROME.");

const svg = readFileSync(join(RAIZ, "icons/orolon.svg"), "utf8").replace(/<!--[\s\S]*?-->/g, "");
const FUNDO = "radial-gradient(70% 70% at 28% 18%, #2A2140 0%, #14111F 72%)";
const ARQUIVOS = [
  // [caminho, tamanho, fundo, tamanho do símbolo em fração do lado]
  ["icons/icon-192.png", 192, FUNDO, 0.88],
  ["icons/icon-512.png", 512, FUNDO, 0.88],
  ["loja/icone-512.png", 512, FUNDO, 0.88],
  ["icons/maskable-512.png", 512, FUNDO, 0.8], // o anel (73% do símbolo) cabe no círculo seguro de 80%
  ["android-assets/icon-only.png", 1024, FUNDO, 0.82],
  ["android-assets/icon-foreground.png", 1024, "transparent", 0.68], // anel com 50% do lado, dentro da área segura de 61%
  ["android-assets/icon-background.png", 1024, FUNDO, 0],
  ["android-assets/splash.png", 2732, "#14111F", 0.2],
  ["android-assets/splash-dark.png", 2732, "#14111F", 0.2],
];

const tmp = mkdtempSync(join(tmpdir(), "orolon-icones-"));
try {
  for (const [arq, lado, fundo, frac] of ARQUIVOS) {
    const pagina = join(tmp, "p.html");
    const s = Math.round(lado * frac);
    writeFileSync(pagina, `<!doctype html><meta charset="utf-8"><style>html,body{margin:0;width:${lado}px;height:${lado}px;overflow:hidden;background:${fundo}}
      div{position:absolute;left:${(lado - s) / 2}px;top:${(lado - s) / 2}px;width:${s}px;height:${s}px}svg{width:100%;height:100%;display:block}</style><body>${frac ? `<div>${svg}</div>` : ""}</body>`);
    const r = spawnSync(CHROME, ["--headless=new", "--disable-gpu", "--hide-scrollbars", "--force-device-scale-factor=1", `--window-size=${lado},${lado}`,
      "--default-background-color=00000000", `--user-data-dir=${join(tmp, "perfil")}`, `--screenshot=${join(RAIZ, arq)}`, pathToFileURL(pagina).href], { stdio: "ignore" });
    if (r.status !== 0) throw new Error(`Falhou ao gerar ${arq}`);
    console.log("✓", arq, `${lado}×${lado}`);
  }
} finally { rmSync(tmp, { recursive: true, force: true }); }
