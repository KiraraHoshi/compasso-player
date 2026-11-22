// Gera o material da Google Play em loja/pt e loja/en: 8 capturas (1080×1920) e a imagem de destaque (1024×500).
// Uso: node scripts/prints-loja.mjs [pt|en] [número do print ...]
// Abre o app de verdade num Chrome sem janela, monta uma biblioteca inventada (músicas, capas e letra criadas aqui,
// nada de terceiros) e fotografa cada tela dentro de uma moldura de celular. Não usa nenhuma biblioteca.
import { createServer } from "node:http";
import { readFile, writeFile, mkdir, mkdtemp, rm } from "node:fs/promises";
import { existsSync, readFileSync } from "node:fs";
import { spawn } from "node:child_process";
import { tmpdir } from "node:os";
import { join, extname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const RAIZ = fileURLToPath(new URL("../", import.meta.url));
const CHROMES = [process.env.ORO_CHROME, "C:/Program Files/Google/Chrome/Application/chrome.exe", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe", "/usr/bin/google-chrome", "/usr/bin/chromium"].filter(Boolean);
const TIPOS = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".svg": "image/svg+xml" };
const espera = (ms) => new Promise((r) => setTimeout(r, ms));
const TELA = { w: 405, h: 720, escala: 1280 / 720 }; // a tela do celular da moldura: 720×1280 na imagem final

/* ---- textos de cada imagem ---- */
const TEXTOS = {
  pt: {
    destaque: ["Orolon Player", "O player de música offline com visuais que reagem ao som", "Sem anúncios · Sem conta · Sem internet"],
    prints: [
      ["aura", "Visuais que dançam com a sua música", "A cor acompanha a capa de cada música"],
      ["biblioteca", "Sua biblioteca, 100% offline", "Sem conta, sem anúncios, sem internet"],
      ["relogio", "Um relógio que marca o compasso", "O ponteiro anda a cada batida"],
      ["personalizar", "Deixe com a sua cara", "Onze mostradores, cores e formatos"],
      ["led", "Painel de LED no ritmo", "Com a arte da capa ou as cores do tema"],
      ["letra", "Letra sincronizada", "Arquivos .lrc entram junto com a música"],
      ["som", "Som do seu jeito", "Equalizador, reverb, efeito 3D e Volume +"],
      ["inicio", "Tudo à mão no Início", "Tema claro, escuro ou criado por você"],
    ],
  },
  en: {
    destaque: ["Orolon Player", "The offline music player with visuals that react to sound", "No ads · No account · No internet"],
    prints: [
      ["aura", "Visuals that dance to your music", "Colors follow each song's cover"],
      ["biblioteca", "Your library, 100% offline", "No account, no ads, no internet"],
      ["relogio", "A clock that keeps the beat", "The hand moves on every beat"],
      ["personalizar", "Make it yours", "Eleven displays, colors and shapes"],
      ["led", "LED panel on the beat", "With the cover art or your theme's colors"],
      ["letra", "Synced lyrics", ".lrc files come in with the song"],
      ["som", "Sound your way", "Equalizer, reverb, 3D effect and Volume +"],
      ["inicio", "Everything at hand on Home", "Light, dark or your own theme"],
    ],
  },
};

/* ---- biblioteca inventada: [artista, álbum, desenho da capa, [títulos pt], [títulos en], minutos:segundos] ---- */
const ALBUNS = [
  { a: "Luna Vale", al: { pt: "Horizonte Âmbar", en: "Amber Horizon" }, arte: "sol", f: [["Ouro de Fim de Tarde", "Late Afternoon Gold", 243], ["Estrada Quente", "Warm Road", 187], ["Último Raio", "Last Ray", 214]] },
  { a: "Maré Alta", al: { pt: "Correntes", en: "Currents" }, arte: "ondas", f: [["Maré Mansa", "Gentle Tide", 214], ["Ilha de Vidro", "Glass Island", 187], ["Sal e Vento", "Salt and Wind", 201]] },
  { a: "Kairo", al: { pt: "Órbita Lenta", en: "Slow Orbit" }, arte: "orbita", f: [["Gravidade Zero", "Zero Gravity", 243], ["Anel de Poeira", "Ring of Dust", 226], ["Sinal Distante", "Distant Signal", 198]] },
  { a: "Clara Neve", al: { pt: "Primeira Luz", en: "First Light" }, arte: "prisma", f: [["Janela Aberta", "Open Window", 176], ["Papel e Tinta", "Paper and Ink", 205], ["Manhã de Linho", "Linen Morning", 232]] },
];
const LETRA = {
  pt: ["O sol desce devagar", "Pinta a estrada de dourado", "Eu levo o dia no bolso", "E o vento canta do meu lado", "Ouro de fim de tarde", "Fica mais um pouco aqui", "Que a noite ainda demora", "E eu não quero me despedir"],
  en: ["The sun goes down so slow", "Paints the road in gold", "I keep the day in my pocket", "And the wind sings as we go", "Late afternoon gold", "Stay a little longer here", "The night is far from coming", "And I don't want to disappear"],
};

/* ---- o que roda dentro da página do app ---- */
async function semear(albuns, lang, letra, tocada) {
  const wav = (seg, bpm, tom) => { // bumbo, caixa, prato e um baixo simples: o bastante para os mostradores reagirem
    const sr = 32000, n = Math.floor(seg * sr), d = new DataView(new ArrayBuffer(44 + n * 2)), passo = 60 / bpm;
    const txt = (o, s) => { for (let i = 0; i < s.length; i++) d.setUint8(o + i, s.charCodeAt(i)); };
    txt(0, "RIFF"); d.setUint32(4, 36 + n * 2, true); txt(8, "WAVEfmt "); d.setUint32(16, 16, true); d.setUint16(20, 1, true); d.setUint16(22, 1, true);
    d.setUint32(24, sr, true); d.setUint32(28, sr * 2, true); d.setUint16(32, 2, true); d.setUint16(34, 16, true); txt(36, "data"); d.setUint32(40, n * 2, true);
    let seed = 7; const ruido = () => ((seed = (seed * 16807) % 2147483647) / 1073741823.5) - 1;
    const notas = [0, 0, 3, 5, 0, 7, 5, 3];
    for (let i = 0; i < n; i++) {
      const t = i / sr, b = t / passo, nb = Math.floor(b), fb = (b - nb) * passo; // tempo dentro da batida
      let v = Math.sin(2 * Math.PI * (48 + 70 * Math.exp(-fb * 28)) * fb) * Math.exp(-fb * 9) * 0.85; // bumbo em toda batida
      if (nb % 2 === 1) v += ruido() * Math.exp(-fb * 18) * 0.42; // caixa nos tempos 2 e 4
      const fh = ((b * 2) % 1) * passo / 2; v += ruido() * Math.exp(-fh * 70) * 0.16 * (i % 2 ? 1 : -1); // prato em colcheias
      const f = tom * Math.pow(2, notas[Math.floor(b / 2) % 8] / 12); v += Math.sin(2 * Math.PI * f * t) * 0.2 + Math.sin(2 * Math.PI * f * 3.01 * t) * 0.07 * (0.5 + 0.5 * Math.sin(t * 1.3));
      d.setInt16(44 + i * 2, Math.max(-1, Math.min(1, v * 0.8)) * 32767, true);
    }
    return d.buffer;
  };
  const capa = (arte) => new Promise((ok) => {
    const c = document.createElement("canvas"); c.width = c.height = 600; const g = c.getContext("2d");
    const deg = (cores, x0, y0, x1, y1) => { const l = g.createLinearGradient(x0, y0, x1, y1); cores.forEach((k, i) => l.addColorStop(i / (cores.length - 1), k)); return l; };
    if (arte === "sol") {
      g.fillStyle = deg(["#F47B5E", "#C4577E", "#5B3A86"], 0, 0, 0, 600); g.fillRect(0, 0, 600, 600);
      g.fillStyle = "#FBCB74"; g.beginPath(); g.arc(300, 340, 150, 0, 7); g.fill();
      g.fillStyle = "#4A2F73"; g.beginPath(); g.moveTo(0, 470); g.lineTo(90, 420); g.lineTo(180, 465); g.lineTo(300, 430); g.lineTo(420, 468); g.lineTo(520, 425); g.lineTo(600, 460); g.lineTo(600, 600); g.lineTo(0, 600); g.fill();
      g.fillStyle = "#6B3F8F"; for (let i = 0; i < 7; i++) g.fillRect(0, 350 + i * 22, 600, 5 + i);
    } else if (arte === "ondas") {
      g.fillStyle = deg(["#1B6FA8", "#1FA6AE", "#16877F"], 0, 0, 600, 600); g.fillRect(0, 0, 600, 600);
      g.lineWidth = 7; g.lineCap = "round";
      for (let i = 0; i < 13; i++) { g.strokeStyle = i % 3 === 1 ? "#F6E7A8" : i % 3 ? "#8FD6E8" : "#5FC1CF"; g.globalAlpha = i % 3 === 1 ? 1 : 0.75; g.beginPath(); for (let x = -10; x <= 610; x += 10) { const y = 60 + i * 42 + Math.sin(x / 70 + i * 0.9) * 20; x < 0 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
      g.globalAlpha = 1;
    } else if (arte === "orbita") {
      g.fillStyle = deg(["#120F2E", "#2A1F66", "#5B2A86"], 0, 0, 600, 600); g.fillRect(0, 0, 600, 600);
      let s = 3; const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
      g.fillStyle = "#fff"; for (let i = 0; i < 90; i++) { g.globalAlpha = 0.25 + r() * 0.6; g.beginPath(); g.arc(r() * 600, r() * 600, 0.8 + r() * 1.8, 0, 7); g.fill(); }
      g.globalAlpha = 1; const p = g.createRadialGradient(260, 260, 20, 300, 300, 150); p.addColorStop(0, "#C9B4FF"); p.addColorStop(1, "#6A4BD8"); g.fillStyle = p; g.beginPath(); g.arc(300, 300, 130, 0, 7); g.fill();
      g.strokeStyle = "#E7B777"; g.lineWidth = 10; g.beginPath(); g.ellipse(300, 300, 240, 62, -0.35, 0.18, Math.PI - 0.18); g.stroke(); g.lineWidth = 4; g.globalAlpha = 0.7; g.beginPath(); g.ellipse(300, 300, 275, 78, -0.35, 0.12, Math.PI - 0.12); g.stroke(); g.globalAlpha = 1;
    } else {
      g.fillStyle = deg(["#F7D9E3", "#D9E6FA", "#BFD7F2"], 0, 0, 600, 600); g.fillRect(0, 0, 600, 600);
      const tri = (pts, cor, a) => { g.globalAlpha = a; g.fillStyle = cor; g.beginPath(); g.moveTo(pts[0], pts[1]); g.lineTo(pts[2], pts[3]); g.lineTo(pts[4], pts[5]); g.fill(); };
      tri([300, 110, 110, 470, 490, 470], "#F28FB1", 0.85); tri([300, 110, 300, 470, 490, 470], "#7FA8F0", 0.8); tri([110, 470, 300, 300, 490, 470], "#FFE08A", 0.75); tri([0, 600, 600, 600, 600, 380], "#ffffff", 0.35); g.globalAlpha = 1;
    }
    c.toBlob(ok, "image/jpeg", 0.92);
  });
  const ritmo = [[96, 55], [108, 49], [122, 58.3], [88, 65.4]], curto = wav(1, 100, 55), arquivos = [], plano = [];
  let k = 0; // só a música que vai tocar na cena tem o som inteiro; as outras levam 1 s e a duração é acertada depois
  for (const A of albuns) {
    const blob = await capa(A.arte);
    A.f.forEach(([pt, en, d], n) => {
      const t = lang === "en" ? en : pt, nome = `${A.a} - ${t}.wav`;
      arquivos.push(new File([n === 0 && k === tocada ? wav(d, ...ritmo[k]) : curto], nome, { type: "audio/wav", lastModified: 1700000000000 + arquivos.length * 60000 }));
      plano.push({ nome, al: A.al[lang], n: n + 1, d, blob });
    });
    k++;
  }
  await importar(arquivos);
  let i = 0;
  for (const x of importadas()) {
    const p = plano.find((q) => x.sig.startsWith(q.nome + "|"));
    x.al = p.al; x.n = p.n; x.d = p.d; x.capaBlob = p.blob; x.c = await coresDaCapa(p.blob); x.em = Date.now() - (++i) * 3600000; acertarCover(x); salvarFaixa(x);
  }
  const por = (t) => importadas().find((x) => x.t === t), nomes = albuns.map((A) => A.f.map((f) => f[lang === "en" ? 1 : 0]));
  por(nomes[0][0]).letra = letra.map((l, j) => `[00:${String(4 + j * 4).padStart(2, "0")}.00]${l}`).join("\n");
  [[nomes[0][0], 5], [nomes[1][0], 5], [nomes[2][0], 4], [nomes[3][0], 4], [nomes[1][1], 3]].forEach(([t, n]) => darNota(por(t).id, n));
  [nomes[0][0], nomes[1][0], nomes[2][0]].forEach((t) => { if (!favs.has(por(t).id)) alternarFav(por(t).id); });
  [nomes[3][1], nomes[2][1], nomes[1][0], nomes[3][0], nomes[2][0], nomes[0][0]].forEach((t, j) => { stats.fx[por(t).id] = { n: 3 + j, s: 600 + j * 200, u: Date.now() - (6 - j) * 900000, y: {} }; });
  stats.dias[hojeStr()] = 2700; stats.desde = Date.now() - 20 * 86400000; salvarStats();
  $("toast").classList.remove("on"); $("toast").style.display = "none";
  renderBib(); renderPl(); renderInicio();
  return nomes;
}
async function tocarMusica(titulo, seg, visual, extra) {
  Object.assign(cfg, { visual, formaCapa: "quadrada", auraEst: "padrao" }, extra || {}); aplicarVisual();
  const ids = ordenar(vis()).map((x) => x.id), i = ids.indexOf(importadas().find((x) => x.t === titulo).id);
  ir("tocando"); tocarLista(ids, i);
  await new Promise((r) => setTimeout(r, 700));
  buscarSeg(seg);
}

/* ---- as oito cenas: cada uma deixa o app na tela que será fotografada ---- */
const CENAS = {
  aura: async (p, N) => { await p.avaliar(tocarMusica, N[0][0], 14, "aura"); },
  biblioteca: async (p, N) => { await p.avaliar(tocarMusica, N[2][0], 20, "aura"); await p.avaliar(() => { ir("biblioteca"); $("main").scrollTop = 0; }); },
  relogio: async (p, N) => { await p.avaliar(tocarMusica, N[2][0], 46, "relogio"); },
  personalizar: async (p, N) => { await p.avaliar(tocarMusica, N[1][0], 18, "anel", { formaCapa: "redonda" }); await espera(1500); await p.avaliar(() => abrirPersonalizar()); },
  led: async (p, N) => { await p.avaliar(tocarMusica, N[0][0], 30, "led", { ledCor: "arte" }); },
  letra: async (p, N) => { await p.avaliar(tocarMusica, N[0][0], 17, "aura"); await p.avaliar(() => { $("b-volpill").click(); $("b-letra").click(); }); },
  som: async (p, N) => { await p.avaliar(tocarMusica, N[1][0], 25, "espectro"); await p.avaliar(() => { escolherReverb("palco"); escolherLargura(60); abrirFolhaEfeitos(); }); },
  inicio: async (p, N) => { await p.avaliar(tocarMusica, N[3][0], 12, "aura"); await p.avaliar(() => { cfg.tema = "claro"; aplicarTema(); ir("inicio"); $("main").scrollTop = 0; }); },
};

/* ---- moldura ---- */
const TOCADA = { aura: 0, biblioteca: 2, relogio: 2, personalizar: 1, led: 0, letra: 0, som: 1, inicio: 3 }; // álbum da música que toca em cada cena
const CSS_BASE = `*{margin:0;box-sizing:border-box}body{font-family:"Segoe UI",system-ui,sans-serif;color:#fff;overflow:hidden;background:radial-gradient(120% 60% at 50% 0%,#3d2c7a 0%,#1d1638 45%,#0d0a18 100%)}
.cel{background:#07060d;border:2px solid #2b2540;box-shadow:0 30px 80px #0009,inset 0 0 0 2px #15121f}.cel img{display:block}`;
const htmlPrint = (img, titulo, sub) => `<!doctype html><meta charset="utf-8"><style>${CSS_BASE}
body{width:1080px;height:1920px;text-align:center}
h1{font-size:86px;line-height:1.06;letter-spacing:-.03em;font-weight:700;padding:126px 70px 0;height:330px;text-wrap:balance}
p{font-size:41px;color:#cfc3f5;letter-spacing:-.01em;padding:0 60px;height:150px;display:flex;align-items:center;justify-content:center}
.cel{width:760px;height:1320px;border-radius:92px;margin:18px auto 0;padding:18px}.cel img{width:720px;height:1280px;border-radius:74px}</style>
<h1>${titulo}</h1><p>${sub}</p><div class="cel"><img src="${img}"></div>`;
const htmlDestaque = (icone, a, b, [nome, frase, selos]) => `<!doctype html><meta charset="utf-8"><style>${CSS_BASE}
body{width:1024px;height:500px;background:radial-gradient(90% 120% at 25% 20%,#42308a 0%,#1d1638 50%,#0d0a18 100%);position:relative}
.ic{position:absolute;left:64px;top:76px;width:112px;height:112px;border-radius:26px;box-shadow:0 12px 30px #0007}
h1{position:absolute;left:64px;top:206px;font-size:62px;letter-spacing:-.03em;font-weight:700;white-space:nowrap}
.f{position:absolute;left:64px;top:294px;width:450px;font-size:24px;line-height:1.3;color:#e4dcfa}.s{position:absolute;left:64px;top:398px;font-size:16.5px;font-weight:600;color:#b9a3ff;white-space:nowrap}
.cel{position:absolute;width:236px;height:412px;border-radius:30px;padding:6px}.cel img{width:220px;height:396px;border-radius:24px;object-fit:cover;object-position:top}
.c1{left:570px;top:70px;transform:rotate(-5deg)}.c2{left:782px;top:36px;transform:rotate(4deg)}</style>
<img class="ic" src="${icone}"><h1>${nome}</h1><div class="f">${frase}</div><div class="s">${selos}</div>
<div class="cel c1"><img src="${a}"></div><div class="cel c2"><img src="${b}"></div>`;

/* ---- servidor, Chrome e páginas (mesmo jeito dos testes) ---- */
function servir() {
  const srv = createServer(async (req, res) => {
    let c = decodeURIComponent(new URL(req.url, "http://x").pathname); if (c.endsWith("/")) c += "index.html";
    const f = resolve(RAIZ, "." + c);
    if (!f.startsWith(resolve(RAIZ))) { res.writeHead(403); return res.end(); }
    try { const d = await readFile(f); res.writeHead(200, { "content-type": TIPOS[extname(f)] || "application/octet-stream", "cache-control": "no-store" }); res.end(d); } catch { res.writeHead(404); res.end(); }
  });
  return new Promise((ok) => srv.listen(0, "127.0.0.1", () => ok(srv)));
}
async function abrirChrome() {
  const exe = CHROMES.find((c) => existsSync(c));
  if (!exe) throw new Error("Chrome não encontrado. Defina ORO_CHROME com o caminho do executável.");
  const perfil = await mkdtemp(join(tmpdir(), "orolon-loja-"));
  const proc = spawn(exe, ["--headless=new", "--remote-debugging-port=0", `--user-data-dir=${perfil}`, "--no-first-run", "--no-default-browser-check", "--autoplay-policy=no-user-gesture-required", "--mute-audio", "--lang=pt-BR", ...(process.env.CI ? ["--no-sandbox"] : []), "about:blank"], { stdio: "ignore" });
  const arq = join(perfil, "DevToolsActivePort");
  for (let i = 0; i < 100 && !existsSync(arq); i++) await espera(100);
  const [porta, caminho] = readFileSync(arq, "utf8").trim().split("\n");
  const ws = new WebSocket(`ws://127.0.0.1:${porta}${caminho}`);
  await new Promise((ok, erro) => { ws.onopen = ok; ws.onerror = erro; });
  let seq = 0; const pend = new Map();
  ws.onmessage = (ev) => { const m = JSON.parse(ev.data); if (m.id && pend.has(m.id)) { const [ok, erro] = pend.get(m.id); pend.delete(m.id); m.error ? erro(new Error(m.error.message)) : ok(m.result); } };
  const enviar = (method, params = {}, sessionId) => new Promise((ok, erro) => { const id = ++seq; pend.set(id, [ok, erro]); ws.send(JSON.stringify({ id, method, params, sessionId })); });
  return { enviar, fechar: async () => { try { ws.close(); } catch {} proc.kill(); await espera(300); await rm(perfil, { recursive: true, force: true }).catch(() => {}); } };
}
async function pagina(cr, w, h, escala, antes) {
  const { browserContextId } = await cr.enviar("Target.createBrowserContext");
  const { targetId } = await cr.enviar("Target.createTarget", { url: "about:blank", browserContextId });
  const { sessionId } = await cr.enviar("Target.attachToTarget", { targetId, flatten: true });
  const s = (m, q) => cr.enviar(m, q, sessionId);
  await s("Runtime.enable"); await s("Page.enable");
  await s("Emulation.setDeviceMetricsOverride", { width: w, height: h, deviceScaleFactor: escala, mobile: w < 900 });
  if (antes) await s("Page.addScriptToEvaluateOnNewDocument", { source: `{ const d = ${JSON.stringify(antes)}; for (const k in d) localStorage.setItem(k, JSON.stringify(d[k])); }` });
  const avaliar = async (fn, ...args) => {
    const r = await s("Runtime.evaluate", { expression: `(${fn})(...${JSON.stringify(args)})`, awaitPromise: true, returnByValue: true });
    if (r.exceptionDetails) throw new Error("na página: " + (r.exceptionDetails.exception?.description || r.exceptionDetails.text));
    return r.result.value;
  };
  return {
    s, avaliar,
    abrir: (url) => s("Page.navigate", { url }),
    conteudo: async (html) => { const { frameTree } = await s("Page.getFrameTree"); await s("Page.setDocumentContent", { frameId: frameTree.frame.id, html }); await avaliar(() => Promise.all([...document.images].map((i) => i.decode()))); await espera(150); },
    foto: async (formato) => (await s("Page.captureScreenshot", formato === "jpeg" ? { format: "jpeg", quality: 93 } : { format: "png" })).data,
    fechar: () => cr.enviar("Target.disposeBrowserContext", { browserContextId }).catch(() => {}),
  };
}

/* ---- execução ---- */
const args = process.argv.slice(2), langs = args.filter((a) => TEXTOS[a]), quais = args.filter((a) => /^\d$/.test(a)).map(Number);
const srv = await servir(), base = `http://127.0.0.1:${srv.address().port}`, cr = await abrirChrome();
const icone = "data:image/png;base64," + (await readFile(join(RAIZ, "icons", "icon-512.png"))).toString("base64");
try {
  for (const lang of langs.length ? langs : ["pt", "en"]) {
    const T = TEXTOS[lang], pasta = join(RAIZ, "loja", lang), telas = {};
    await mkdir(pasta, { recursive: true });
    for (const [i, [cena, titulo, sub]] of T.prints.entries()) {
      if (quais.length && !quais.includes(i + 1)) continue;
      // cada cena começa num app novo, já no idioma certo e sem as músicas de exemplo
      const p = await pagina(cr, TELA.w, TELA.h, TELA.escala, { "compasso.boasvindas": true, "compasso.semente": true, "compasso.cfg": { lang, tema: "escuro", exemplos: false, exemplosMexeu: true, visual: "aura", padroes19: 1 } });
      await p.abrir(`${base}/index.html`);
      for (let k = 0; k < 160; k++) { try { if (await p.avaliar(() => document.querySelectorAll("#nav button").length > 0)) break; } catch {} await espera(50); }
      await espera(300);
      const nomes = await p.avaliar(semear, ALBUNS, lang, LETRA[lang], TOCADA[cena]);
      await CENAS[cena](p, nomes);
      await espera(2600); // a música toca um pouco para o mostrador entrar no ritmo
      telas[cena] = "data:image/png;base64," + (await p.foto("png"));
      await p.fechar();
      const m = await pagina(cr, 1080, 1920, 1);
      await m.conteudo(htmlPrint(telas[cena], titulo, sub));
      await writeFile(join(pasta, `print-${i + 1}-${cena}.jpg`), Buffer.from(await m.foto("jpeg"), "base64"));
      await m.fechar();
      console.log(`${lang}/print-${i + 1}-${cena}.jpg`);
    }
    if (telas.aura && telas.relogio) {
      const m = await pagina(cr, 1024, 500, 1);
      await m.conteudo(htmlDestaque(icone, telas.aura, telas.relogio, T.destaque));
      await writeFile(join(pasta, "destaque-1024x500.jpg"), Buffer.from(await m.foto("jpeg"), "base64"));
      await m.fechar();
      console.log(`${lang}/destaque-1024x500.jpg`);
    }
  }
} finally { await cr.fechar(); srv.close(); }
