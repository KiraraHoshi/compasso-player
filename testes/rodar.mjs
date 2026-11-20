// Roda os testes do Orolon: abre o app de verdade num Chrome sem janela e confere o que cada teste pede.
// Uso: node testes/rodar.mjs [testes/arquivo.teste.mjs ...]   (sem argumento, roda todos)
// Não usa nenhuma biblioteca: fala com o Chrome pelo protocolo DevTools com o WebSocket do próprio Node.
import { createServer } from "node:http";
import { readFile, readdir, mkdir, writeFile, mkdtemp, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, extname, resolve } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));
const PRINTS = join(RAIZ, "testes", "prints");
const CHROMES = [process.env.ORO_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml", ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav" };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

/* ---- servidor estático da raiz do repositório ---- */
function servir() {
  const srv = createServer(async (req, res) => {
    let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
    if (p.endsWith("/")) p += "index.html";
    const f = resolve(RAIZ, "." + p);
    if (!f.startsWith(resolve(RAIZ))) { res.writeHead(403); return res.end(); }
    try { const d = await readFile(f); res.writeHead(200, { "content-type": TIPOS[extname(f)] || "application/octet-stream", "cache-control": "no-store" }); res.end(d); }
    catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}

/* ---- Chrome e protocolo DevTools ---- */
async function abrirChrome() {
  const exe = CHROMES.find((c) => existsSync(c));
  if (!exe) throw new Error("Chrome não encontrado. Defina ORO_CHROME com o caminho do executável.");
  const perfil = await mkdtemp(join(tmpdir(), "orolon-teste-"));
  const proc = spawn(exe, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${perfil}`, "--no-first-run", "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required", "--mute-audio", "--lang=pt-BR", "--accept-lang=pt-BR", ...(process.env.CI ? ["--no-sandbox"] : []), "about:blank"], { stdio: "ignore", env: { ...process.env, LANGUAGE: "pt_BR", LANG: "pt_BR.UTF-8" } }); // sempre em português: os testes conferem os textos;  // no GitHub (Linux) o Chrome não abre com a caixa de areia
  const arq = join(perfil, "DevToolsActivePort");
  for (let i = 0; i < 100 && !existsSync(arq); i++) await espera(100);
  const [porta, caminho] = readFileSync(arq, "utf8").trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${porta}${caminho}`);
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = erro; });
  let seq = 0; const pend = new Map(), ouvintes = new Set();
  ws.onmessage = (ev) => {
    const m = JSON.parse(ev.data);
    if (m.id && pend.has(m.id)) { const [ok, erro] = pend.get(m.id); pend.delete(m.id); m.error ? erro(new Error(m.error.message)) : ok(m.result); }
    else for (const f of ouvintes) f(m);
  };
  const enviar = (method, params = {}, sessionId) => new Promise((ok, erro) => { const id = ++seq; pend.set(id, [ok, erro]); ws.send(JSON.stringify({ id, method, params, sessionId })); });
  const fechar = async () => { try { ws.close(); } catch {} proc.kill(); await espera(300); await rm(perfil, { recursive: true, force: true }).catch(() => {}); };
  return { enviar, ouvintes, fechar };
}

async function novaPagina(cr, base, t) {
  const { browserContextId } = await cr.enviar("Target.createBrowserContext"); // armazenamento isolado por teste
  const { targetId } = await cr.enviar("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await cr.enviar("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, p) => cr.enviar(m, p, sessionId);
  const erros = [];
  const ouvir = (m) => {
    if (m.sessionId !== sessionId) return;
    if (m.method === "Runtime.exceptionThrown") erros.push("exceção: " + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
    if (m.method === "Runtime.consoleAPICalled" && m.params.type === "error") erros.push("console.error: " + m.params.args.map((a) => a.value ?? a.description).join(" "));
  };
  cr.ouvintes.add(ouvir);
  await s("Runtime.enable"); await s("Page.enable");
  const largura = t.largura || 360, altura = t.altura || 780;
  await s("Emulation.setDeviceMetricsOverride", { width: largura, height: altura, deviceScaleFactor: 1, mobile: largura < 900 });
  // por padrão as boas-vindas já foram vistas (senão a folha abre sozinha e atrapalha o teste); um teste pode mudar isso
  const antes = { "compasso.boasvindas": true, ...(t.antes || {}) };
  // 1.26.8: a medição da abertura liga o modo leve sozinha em aparelho lento; o computador dos testes (sobretudo no GitHub) pode parecer lento, então ela fica desligada (os testes dela chamam decidirLeve direto)
  antes["compasso.cfg"] = { leveAuto: "nao", ...(typeof antes["compasso.cfg"] === "string" ? JSON.parse(antes["compasso.cfg"]) : antes["compasso.cfg"] || {}) };
  {
    const dados = Object.fromEntries(Object.entries(antes).map(([k, v]) => [k, typeof v === "string" ? v : JSON.stringify(v)]));
    await s("Page.addScriptToEvaluateOnNewDocument", { source: `if (!sessionStorage.getItem("__semeado")) { const d = ${JSON.stringify(dados)}; for (const k in d) localStorage.setItem(k, d[k]); sessionStorage.setItem("__semeado", "1"); }` });
  }
  if (t.script) await s("Page.addScriptToEvaluateOnNewDocument", { source: t.script }); // ex.: fingir o Capacitor do app Android
  await s("Page.navigate", { url: `${base}/index.html${t.hash ? "#" + t.hash : ""}` });

  const avaliar = async (fn, ...args) => {
    const r = await s("Runtime.evaluate", { expression: `(${fn})(...${JSON.stringify(args)})`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("na página: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  const quadro = () => avaliar(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(() => ok()))));
  const esperar = async (fn, ms = 3000, ...args) => {
    const fim = Date.now() + ms;
    for (;;) { try { if (await avaliar(fn, ...args)) return; } catch {} if (Date.now() > fim) throw new Error("tempo esgotado esperando: " + String(fn).slice(0, 120)); await espera(50); }
  };
  const p = {
    largura, altura, erros, avaliar, esperar, quadro,
    clicar: async (sel) => { await avaliar((q) => { const e = document.querySelector(q); if (!e) throw new Error("não achei " + q); e.click(); }, sel); await quadro(); },
    voltar: async () => { const r = await avaliar(() => voltarUmPasso()); await quadro(); return r; },
    print: async (nome) => { const { data } = await s("Page.captureScreenshot", { format: "png" }); const f = join(PRINTS, nome + ".png"); await mkdir(join(f, ".."), { recursive: true }); await writeFile(f, Buffer.from(data, "base64")); return f; },
    tamanho: async (w, h) => { await s("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: 1, mobile: w < 900 }); await espera(150); await quadro(); },
  };
  await esperar(() => document.querySelectorAll("#nav button").length > 0, 8000);
  await espera(250); // deixa o app terminar de montar (IndexedDB, primeira pintura)
  const fechar = async () => { cr.ouvintes.delete(ouvir); await cr.enviar("Target.disposeBrowserContext", { browserContextId }).catch(() => {}); };
  return { p, fechar };
}

/* ---- execução ---- */
const args = process.argv.slice(2);
const arquivos = args.length ? args.map((a) => resolve(a)) : (await readdir(join(RAIZ, "testes"))).filter((f) => f.endsWith(".teste.mjs")).sort().map((f) => join(RAIZ, "testes", f));
const srv = await servir();
const base = `http://127.0.0.1:${srv.address().port}`;
let cr = null, ok = 0, falhas = 0;
for (const arq of arquivos) {
  const testes = (await import(pathToFileURL(arq).href)).default;
  console.log("\n" + arq.replace(RAIZ, ""));
  for (const t of testes) {
    try {
      if (t.node) await t.rodar();
      else {
        cr ||= await abrirChrome();
        const { p, fechar } = await novaPagina(cr, base, t);
        try { await t.rodar(p); await espera(50); if (p.erros.length) throw new Error(p.erros.join("\n")); } finally { await fechar(); }
      }
      ok++; console.log("  ✓ " + t.nome);
    } catch (e) { falhas++; console.log("  ✗ " + t.nome + "\n      " + String(e.message || e).split("\n").join("\n      ")); }
  }
}
if (cr) await cr.fechar();
srv.close();
console.log(`\n${ok} passaram, ${falhas} falharam`);
process.exit(falhas ? 1 : 0);
