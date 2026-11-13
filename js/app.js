/* Compasso Player: player de música offline com temas customizáveis.
   Tudo fica no aparelho: músicas e playlists no IndexedDB, ajustes e temas no localStorage.
   O app não envia nada para a internet. */
"use strict";

/* ===================== Utilidades ===================== */
const $ = (id) => document.getElementById(id);
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const fmt = (s) => {
  s = Math.max(0, Math.floor(s || 0));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), x = String(s % 60).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${x}` : `${m}:${x}`;
};
const plural = (n, um, varios) => `${n} ${n === 1 ? um : varios}`;
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const mb = (b) => (b >= 1e9 ? (b / 1e9).toFixed(1).replace(".", ",") + " GB" : Math.round(b / 1e6) + " MB");
const guardado = {
  get(k, d) { try { const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* sem armazenamento */ } },
};
function embaralhar(a) {
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

/* ===================== Ícones ===================== */
const tr = (d) => `<path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>`;
const I = {
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>',
  next: '<path d="M6 5l9 7-9 7zM16 5h2.5v14H16z" fill="currentColor"/>',
  prev: '<path d="M18 5l-9 7 9 7zM5.5 5H8v14H5.5z" fill="currentColor"/>',
  shuf: tr("M3 7h3.5c5 0 5.5 10 10.5 10H20M3 17h3.5c2 0 3.2-1.6 4.3-3.5M20 7h-3c-1.4 0-2.5.8-3.4 1.9M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5"),
  rep: tr("M5 12V9.5A2.5 2.5 0 017.5 7H18M19 12v2.5a2.5 2.5 0 01-2.5 2.5H6M15.5 4.5L18 7l-2.5 2.5M8.5 14.5L6 17l2.5 2.5"),
  lib: tr("M5 4v16M10 4v16M14.5 5l4.5 14"),
  now: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' + tr("M12 7.5V12l3 2"),
  pls: tr("M4 7h11M4 12h11M4 17h7M18 10v7.5") + '<circle cx="16.5" cy="17.5" r="1.8" fill="currentColor"/>',
  thm: tr("M12 3.5a8.5 8.5 0 100 17c1.2 0 1.8-.9 1.8-1.8 0-1.7 1-2.2 2.4-2.2h1.3c1.7 0 3-1.3 3-3.2 0-5.4-3.8-9.8-8.5-9.8z") + '<circle cx="8" cy="11" r="1.2" fill="currentColor"/><circle cx="12" cy="8" r="1.2" fill="currentColor"/><circle cx="16" cy="11" r="1.2" fill="currentColor"/>',
  queue: tr("M4 6h12M4 11h12M4 16h7") + '<path d="M16 13.5v6l5-3z" fill="currentColor"/>',
  more: '<circle cx="5.5" cy="12" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/><circle cx="18.5" cy="12" r="1.7" fill="currentColor"/>',
  x: tr("M6 6l12 12M18 6L6 18"),
  grip: '<circle cx="9" cy="7" r="1.5" fill="currentColor"/><circle cx="15" cy="7" r="1.5" fill="currentColor"/><circle cx="9" cy="12" r="1.5" fill="currentColor"/><circle cx="15" cy="12" r="1.5" fill="currentColor"/><circle cx="9" cy="17" r="1.5" fill="currentColor"/><circle cx="15" cy="17" r="1.5" fill="currentColor"/>',
  back: tr("M15 5l-7 7 7 7"),
  plus: tr("M12 5v14M5 12h14"),
  check: tr("M5 12.5l4.5 4.5L19 7"),
  seguir: tr("M4 6h10M4 11h10M4 16h6") + '<path d="M15 12.5l6 4-6 4z" fill="currentColor"/>',
  addq: tr("M4 6h12M4 11h12M4 16h7M18 13v7M14.5 16.5h7"),
  album: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="2.4" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  artist: '<circle cx="12" cy="8" r="3.6" fill="none" stroke="currentColor" stroke-width="1.8"/>' + tr("M5 20c1-3.6 4-5.5 7-5.5s6 1.9 7 5.5"),
  trash: tr("M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12"),
  edit: tr("M5 19h4L19 9l-4-4L5 15zM13 7l4 4"),
  folder: tr("M3 7a2 2 0 012-2h4l2 2h8a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"),
  note: tr("M9 17V6l10-2v11") + '<circle cx="6.8" cy="17" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.8" cy="15" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
};
const ico = (n, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const eqIcone = () => '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';

/* ===================== Ajustes e temas ===================== */
const cfg = Object.assign(
  { tema: null, ajustes: {}, amb: true, ambF: 0.7, reage: true, batF: 0.7, exemplos: true, ord: "recentes" },
  guardado.get("compasso.cfg", {})
);
const salvarCfg = () => guardado.set("compasso.cfg", cfg);

const FONTES = {
  padrao: { n: "Compasso", d: '"Bricolage Grotesque","Trebuchet MS",system-ui,sans-serif', b: '"Figtree",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' },
  sistema: { n: "Do sistema", d: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', b: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' },
  serifada: { n: "Serifada", d: 'Georgia,"Times New Roman",serif', b: 'Georgia,"Times New Roman",serif' },
  mono: { n: "Mono", d: 'ui-monospace,"Cascadia Mono",Consolas,monospace', b: 'ui-monospace,"Cascadia Mono",Consolas,monospace' },
};
const BASE = {
  claro: { id: "claro", nome: "Orologia Claro", fundo: "#F1EFF6", card: "#FFFFFF", texto: "#1D1830", suave: "#6B6580", destaque: "#6A4BD8", secundaria: "#A8743A", raio: 16, fonte: "padrao", fixo: true },
  escuro: { id: "escuro", nome: "Orologia Escuro", fundo: "#14111F", card: "#1E1A2E", texto: "#EFEAF7", suave: "#9A93B0", destaque: "#A98BFF", secundaria: "#D2A067", raio: 16, fonte: "padrao", fixo: true },
};
const CAMPOS = [["fundo", "Fundo"], ["card", "Cartões"], ["texto", "Texto"], ["suave", "Texto suave"], ["destaque", "Destaque"], ["secundaria", "Secundária"]];
const DESTAQUES = {
  claro: [["Violeta", "#6A4BD8"], ["Bronze", "#A8743A"], ["Fogo", "#D2571B"], ["Ciano", "#0E8AA8"], ["Folha", "#4E8A1E"], ["Carmesim", "#C22D52"]],
  escuro: [["Violeta", "#A98BFF"], ["Bronze", "#D2A067"], ["Fogo", "#F2925A"], ["Ciano", "#5CCBE6"], ["Folha", "#A6D15C"], ["Carmesim", "#F0708F"]],
};
const HEX = /^#[0-9a-f]{6}$/i;
let meusTemas = guardado.get("compasso.temas", []);
const salvarTemas = () => guardado.set("compasso.temas", meusTemas);
const todosTemas = () => [BASE.claro, BASE.escuro, ...meusTemas];
const temaPorId = (id) => todosTemas().find((t) => t.id === id);
if (!temaPorId(cfg.tema)) cfg.tema = matchMedia("(prefers-color-scheme: dark)").matches ? "escuro" : "claro";
const temaAtual = () => { const t = temaPorId(cfg.tema) || BASE.claro; return { ...t, ...(t.fixo ? cfg.ajustes[t.id] || {} : {}) }; };

function lum(h) {
  const c = [1, 3, 5].map((i) => { const v = parseInt(h.substr(i, 2), 16) / 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
const contraste = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
const escuro = (t) => lum(t.fundo) < 0.2;

function aplicar(t) {
  const r = document.documentElement.style, e = escuro(t), f = FONTES[t.fonte] || FONTES.padrao;
  const set = (k, v) => r.setProperty(k, v);
  set("--bg", t.fundo); set("--card", t.card); set("--text", t.texto); set("--muted", t.suave);
  set("--accent", t.destaque); set("--accent2", t.secundaria); set("--radius", t.raio + "px");
  set("--on-accent", contraste("#FFFFFF", t.destaque) >= contraste("#14111F", t.destaque) ? "#FFFFFF" : "#14111F");
  set("--line", e ? "rgba(255,255,255,.12)" : "rgba(0,0,0,.10)");
  set("--hover", e ? "rgba(255,255,255,.06)" : "rgba(0,0,0,.045)");
  set("--ok", e ? "#5FD39A" : "#2E7D4F"); set("--warn", e ? "#F0B85A" : "#9A6212");
  set("--display", f.d); set("--body", f.b); set("color-scheme", e ? "dark" : "light");
  aplicarEfeitos();
  const m = document.querySelector('meta[name="theme-color"]'); if (m) m.content = t.fundo;
}
function aplicarEfeitos() {
  const r = document.documentElement.style;
  r.setProperty("--ambk", cfg.amb ? cfg.ambF : 0);
  r.setProperty("--beatk", cfg.reage ? cfg.batF : 0);
}
const aplicarTema = () => { aplicar(temaAtual()); salvarCfg(); };

/* ===================== Biblioteca ===================== */
const NOTAS = [220, 246.94, 261.63, 293.66, 329.63, 349.23, 392];
const ALBUM_EX = { "Relojoaria Lunar": "Engrenagens", "Vento Norte": "Horizonte", "Ateliê Sete": "Sete Chaves" };
const EXEMPLOS = [
  { t: "Ponteiro das Horas", a: "Relojoaria Lunar", d: 134, c: ["#7B5CF0", "#C8965A"], bpm: 84, sc: [0, 2, 4, 6, 4, 2], w: "triangle" },
  { t: "Corda Cheia", a: "Relojoaria Lunar", d: 108, c: ["#C8965A", "#5B3FC4"], bpm: 112, sc: [0, 4, 2, 5, 3, 6], w: "square" },
  { t: "Céu ao Entardecer", a: "Vento Norte", d: 151, c: ["#F08A4B", "#F3D9A4"], bpm: 76, sc: [2, 4, 6, 4, 1, 3], w: "sine" },
  { t: "Maré Ciano", a: "Vento Norte", d: 122, c: ["#22B8D9", "#D6375E"], bpm: 124, sc: [0, 3, 5, 3, 6, 5], w: "triangle" },
  { t: "Jardim de Bronze", a: "Ateliê Sete", d: 97, c: ["#8DBF3F", "#E08A3C"], bpm: 96, sc: [1, 3, 5, 6, 5, 3], w: "sine" },
  { t: "Meia-noite em Ponto", a: "Ateliê Sete", d: 143, c: ["#2B4BC9", "#9A6BFF"], bpm: 68, sc: [0, 2, 3, 5, 3, 2], w: "triangle" },
].map((x, i) => ({ ...x, al: ALBUM_EX[x.a], n: (i % 2) + 1, id: "ex" + i, demo: true, em: 0 }));

let faixas = EXEMPLOS.slice();
const porId = new Map(faixas.map((x) => [x.id, x]));
const visivel = (x) => x && (!x.demo || cfg.exemplos);
const vis = () => faixas.filter(visivel);
const importadas = () => faixas.filter((x) => !x.demo);
function adicionarFaixa(x) { faixas.push(x); porId.set(x.id, x); }

const grad = (c) => `linear-gradient(140deg,${c[0]},${c[1]})`;
const fundoDe = (x) => (x.cover ? `url('${x.cover}') center/cover` : grad(x.c));
const inicial = (s) => esc((String(s || "?").trim()[0] || "?").toUpperCase());
const capa = (x, cls = "thumb") => `<span class="${cls}" style="background:${fundoDe(x)}">${x.cover ? "" : inicial(x.t)}</span>`;
const linha2 = (x) => x.a + (x.al ? " · " + x.al : "");
const duracaoTotal = (lista) => lista.reduce((s, x) => s + (x.d || 0), 0);
function coresDoNome(s) {
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return [`hsl(${h} 62% 52%)`, `hsl(${(h + 48) % 360} 68% 60%)`];
}
async function coresDaCapa(blob) {
  try {
    const bm = await createImageBitmap(blob), cv = document.createElement("canvas");
    cv.width = cv.height = 16;
    const c = cv.getContext("2d"); c.drawImage(bm, 0, 0, 16, 16);
    const d = c.getImageData(0, 0, 16, 16).data, px = [];
    for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2], Math.max(d[i], d[i + 1], d[i + 2]) - Math.min(d[i], d[i + 1], d[i + 2])]);
    px.sort((a, b) => b[3] - a[3]);
    const med = (a) => { const s = [0, 0, 0]; a.forEach((p) => { s[0] += p[0]; s[1] += p[1]; s[2] += p[2]; }); return "rgb(" + s.map((v) => Math.round(v / a.length)).join(",") + ")"; };
    return [med(px.slice(0, 40)), med(px.slice(40, 140))];
  } catch (e) { return null; }
}

/* ---- Banco local (IndexedDB) ---- */
let db = null;
function abrirDB() {
  return new Promise((ok, erro) => {
    try {
      const r = indexedDB.open("compasso", 2);
      r.onupgradeneeded = () => {
        const d = r.result;
        if (!d.objectStoreNames.contains("faixas")) d.createObjectStore("faixas", { keyPath: "id" });
        if (!d.objectStoreNames.contains("playlists")) d.createObjectStore("playlists", { keyPath: "id" });
      };
      r.onsuccess = () => ok(r.result);
      r.onerror = () => erro(r.error);
    } catch (e) { erro(e); }
  });
}
const loja = (nome, modo = "readonly") => db.transaction(nome, modo).objectStore(nome);
function dbPut(nome, v) { if (db) try { loja(nome, "readwrite").put(v); } catch (e) { /* ignora */ } }
function dbDel(nome, k) { if (db) try { loja(nome, "readwrite").delete(k); } catch (e) { /* ignora */ } }
function dbTodos(nome) {
  return new Promise((ok) => {
    if (!db) return ok([]);
    try { const r = loja(nome).getAll(); r.onsuccess = () => ok(r.result || []); r.onerror = () => ok([]); } catch (e) { ok([]); }
  });
}
const salvarFaixa = (x) => dbPut("faixas", { id: x.id, t: x.t, a: x.a, al: x.al, n: x.n, d: x.d, c: x.c, arq: x.arq, capaBlob: x.capaBlob, sig: x.sig, em: x.em });
function montar(x) { x.url = URL.createObjectURL(x.arq); if (x.capaBlob) x.cover = URL.createObjectURL(x.capaBlob); }

/* ---- Importar ---- */
const EXT = /\.(mp3|flac|m4a|aac|ogg|oga|opus|wav|webm)$/i;
const ehAudio = (f) => f && ((f.type && f.type.startsWith("audio/")) || EXT.test(f.name));
function lerDuracao(url) {
  return new Promise((ok) => {
    const a = new Audio(); let feito = false;
    const fim = (v) => { if (feito) return; feito = true; a.removeAttribute("src"); a.load(); ok(v); };
    a.preload = "metadata";
    a.onloadedmetadata = () => fim(isFinite(a.duration) ? a.duration : 0);
    a.onerror = () => fim(0);
    setTimeout(() => fim(0), 6000);
    a.src = url;
  });
}
let importando = false;
async function importar(lista) {
  const fs = [...lista].filter(ehAudio);
  if (!fs.length) { toast("Nenhum arquivo de áudio encontrado"); return; }
  if (importando) { toast("Espere a importação atual terminar"); return; }
  importando = true;
  let novas = 0, repetidas = 0, k = 0;
  const sigs = new Set(importadas().map((x) => x.sig));
  for (const f of fs) {
    k++;
    $("count").textContent = `Importando ${k} de ${fs.length}…`;
    const sig = f.name + "|" + f.size + "|" + f.lastModified;
    if (sigs.has(sig)) { repetidas++; continue; }
    sigs.add(sig);
    const nome = f.name.replace(/\.[^.]+$/, ""), partes = nome.split(" - "), m = await lerTags(f);
    const x = {
      id: uid("f"), sig, em: Date.now(), arq: f, capaBlob: m.capa || null, n: m.n || 0, d: 0, al: m.al || "",
      t: m.t || (partes.length > 1 ? partes.slice(1).join(" - ") : partes[0]).trim() || "Sem título",
      a: m.a || (partes.length > 1 ? partes[0].trim() : "Artista desconhecido"),
    };
    montar(x);
    x.c = (x.capaBlob && (await coresDaCapa(x.capaBlob))) || coresDoNome(x.a + x.al + nome);
    x.d = await lerDuracao(x.url);
    adicionarFaixa(x); salvarFaixa(x); novas++;
    if (k % 8 === 0) renderBib();
  }
  importando = false;
  renderBib(); renderPl();
  if (!queue.length) filaPadrao();
  if (novas) {
    toast(plural(novas, "música importada", "músicas importadas") + (repetidas ? `, ${repetidas} já ${repetidas > 1 ? "estavam" : "estava"} na biblioteca` : ""));
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } else toast(repetidas ? "Essas músicas já estavam na biblioteca" : "Não deu para importar esses arquivos");
}
async function arquivosDoDrop(dt) {
  const entradas = [...(dt.items || [])].map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)).filter(Boolean);
  if (!entradas.length) return [...dt.files];
  const saida = [];
  const ler = async (en) => {
    if (en.isFile) saida.push(await new Promise((ok) => en.file(ok, () => ok(null))));
    else if (en.isDirectory) {
      const r = en.createReader(); let lote;
      do { lote = await new Promise((ok) => r.readEntries(ok, () => ok([]))); for (const c of lote) await ler(c); } while (lote.length);
    }
  };
  for (const en of entradas) await ler(en);
  return saida.filter(Boolean);
}
function removerFaixa(id) {
  const x = porId.get(id); if (!x || x.demo) return;
  const eraAtual = cur() && cur().id === id;
  if (eraAtual && playing) pausar();
  const atualId = cur() && cur().id;
  faixas = faixas.filter((t) => t.id !== id); porId.delete(id);
  const i = queue.indexOf(id);
  if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; }
  if (origem) origem = origem.filter((q) => q !== id);
  for (const p of pls) if (p.ids.includes(id)) { p.ids = p.ids.filter((q) => q !== id); salvarPl(p); }
  URL.revokeObjectURL(x.url); if (x.cover) URL.revokeObjectURL(x.cover);
  dbDel("faixas", id);
  if (!queue.length) filaPadrao();
  else if (eraAtual) { qi = Math.min(qi, queue.length - 1); carregar(false); }
  else qi = Math.max(0, queue.indexOf(atualId));
  renderBib(); renderPl(); renderFilaAberta(); paint();
}

/* ===================== Fila e reprodução ===================== */
let queue = [], qi = 0, playing = false, shuffle = false, repeat = "off", origem = null, contexto = "Biblioteca";
const cur = () => porId.get(queue[qi]);
function filaPadrao() { queue = ordenar(vis()).map((x) => x.id); qi = 0; origem = null; contexto = "Biblioteca"; carregar(false); }
function tocarLista(ids, i, ctx) {
  ids = ids.filter((id) => visivel(porId.get(id)));
  if (!ids.length) return;
  i = Math.max(0, Math.min(i || 0, ids.length - 1));
  contexto = ctx; origem = ids.slice();
  if (shuffle) { const alvo = ids[i], resto = ids.filter((_, j) => j !== i); queue = [alvo, ...embaralhar(resto)]; qi = 0; }
  else { queue = ids.slice(); qi = i; }
  carregar(true);
}
function tocarAleatorio(ids, ctx) {
  shuffle = true;
  tocarLista(ids, Math.floor(Math.random() * ids.length), ctx);
}
function alternarAleatorio() {
  shuffle = !shuffle;
  const id = queue[qi];
  if (shuffle) { origem = queue.slice(); queue = [id, ...embaralhar(queue.filter((_, i) => i !== qi))]; qi = 0; }
  else if (origem) {
    const na = new Set(queue), base = origem.filter((x) => na.has(x)), bs = new Set(base);
    queue = [...base, ...queue.filter((x) => !bs.has(x))]; qi = Math.max(0, queue.indexOf(id));
  }
  paint(); renderFilaAberta(); salvarSessao();
  toast(shuffle ? "Ordem aleatória ligada" : "Ordem aleatória desligada");
}
function alternarRepetir() {
  repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
  paint(); salvarSessao();
  toast({ off: "Repetir desligado", all: "Repetir a fila", one: "Repetir esta música" }[repeat]);
}
function tocarASeguir(id) {
  if (!queue.length) { queue = [id]; qi = 0; carregar(false); }
  if (queue[qi] === id) return toast("Essa música já está tocando");
  const i = queue.indexOf(id);
  if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; }
  queue.splice(qi + 1, 0, id);
  renderFilaAberta(); paint(); salvarSessao();
  toast("Toca em seguida");
}
function adicionarFila(id) {
  if (!queue.length) { queue = [id]; qi = 0; carregar(false); return toast("Adicionada à fila"); }
  if (queue[qi] === id) return toast("Essa música já está tocando");
  const i = queue.indexOf(id);
  if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; }
  queue.push(id);
  renderFilaAberta(); paint(); salvarSessao();
  toast("Adicionada ao fim da fila");
}
function tirarDaFila(i) {
  if (i === qi || i < 0 || i >= queue.length) return;
  queue.splice(i, 1); if (i < qi) qi--;
  renderFilaAberta(); paint(); salvarSessao();
}

/* ---- Áudio ---- */
let ctx, an, mestre, el, bins, relogio, passo = 0, proxT = 0, pos = 0, posBase = 0, inicioT = 0, erros = 0;
function prepararAudio() {
  if (ctx) return;
  ctx = new (window.AudioContext || window.webkitAudioContext)();
  an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.75; an.connect(ctx.destination);
  bins = new Uint8Array(an.frequencyBinCount);
  mestre = ctx.createGain(); mestre.gain.value = 0.5; mestre.connect(an);
  el = new Audio(); el.preload = "auto";
  ctx.createMediaElementSource(el).connect(an);
  el.onended = fimDaFaixa;
  el.onplaying = () => { erros = 0; };
  el.onloadedmetadata = () => { const x = cur(); if (x && !x.demo && el.dataset.id === x.id && isFinite(el.duration)) { x.d = el.duration; paint(); } };
  el.onerror = () => {
    const x = cur(); if (!x || x.demo || el.dataset.id !== x.id || !playing) return;
    erros++;
    toast(`Não deu para tocar "${x.t}"`);
    if (erros < queue.length) setTimeout(() => { qi = (qi + 1) % queue.length; carregar(true); }, 700);
    else { erros = 0; playing = false; paint(); }
  };
}
function nota(f, t, dur, tipo, vol) {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = tipo; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.02); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  o.connect(g); g.connect(mestre); o.start(t); o.stop(t + dur + 0.02);
}
function agendar() {
  const x = cur(); if (!x || !x.demo) return;
  const sd = 30 / x.bpm;
  while (proxT < ctx.currentTime + 0.25) {
    nota(NOTAS[x.sc[passo % x.sc.length]] * (passo % 12 > 5 ? 2 : 1), proxT, sd * 1.8, x.w, 0.16);
    if (passo % 2 === 0) nota((NOTAS[x.sc[0]] / 4) * (passo % 8 < 4 ? 1 : 1.335), proxT, sd * 1.9, "sine", 0.55);
    proxT += sd; passo++;
  }
}
function pararSintese() { clearInterval(relogio); relogio = null; if (mestre) mestre.gain.setTargetAtTime(0, ctx.currentTime, 0.03); }
function tocar() {
  const x = cur(); if (!x) return;
  prepararAudio(); ctx.resume().catch(() => {});
  if (x.demo) {
    el.pause(); clearInterval(relogio);
    const sd = 30 / x.bpm; passo = Math.floor(pos / sd); proxT = ctx.currentTime + 0.05; posBase = pos; inicioT = ctx.currentTime;
    mestre.gain.cancelScheduledValues(ctx.currentTime); mestre.gain.setTargetAtTime(0.5, ctx.currentTime, 0.03);
    relogio = setInterval(agendar, 80); agendar();
  } else {
    pararSintese();
    if (el.dataset.id !== x.id) { el.src = x.url; el.dataset.id = x.id; if (pos) el.currentTime = pos; }
    el.play().catch(() => { playing = false; paint(); });
  }
  playing = true; paint();
}
function pausar() {
  const x = cur();
  if (ctx) { if (x && x.demo) { pos = posAtual(); pararSintese(); } else if (el) { pos = el.currentTime; el.pause(); } }
  playing = false; paint(); salvarSessao();
}
const alternar = () => (playing ? pausar() : tocar());
function posAtual() {
  const x = cur(); if (!x) return 0;
  if (!x.demo) return el && el.dataset.id === x.id ? el.currentTime : pos;
  return playing && ctx ? posBase + (ctx.currentTime - inicioT) : pos;
}
function carregar(auto) {
  const x = cur();
  if (!x) { playing = false; paint(); return; }
  pos = 0;
  if (ctx) { pararSintese(); el.pause(); if (!x.demo) { el.src = x.url; el.dataset.id = x.id; } else el.dataset.id = ""; }
  luz(x.c); metaSessao(x); paint(); marcarAtual(); renderFilaAberta(); salvarSessao();
  if (auto) tocar(); else { playing = false; paint(); }
}
function fimDaFaixa() {
  if (repeat === "one") { pos = 0; if (el) el.currentTime = 0; return tocar(); }
  if (qi < queue.length - 1) { qi++; return carregar(true); }
  if (repeat === "all") { qi = 0; return carregar(true); }
  qi = 0; carregar(false);
}
function proxima() { if (!queue.length) return; qi = (qi + 1) % queue.length; carregar(playing); }
function anterior() {
  if (!queue.length) return;
  if (posAtual() > 3) return buscarSeg(0);
  qi = (qi - 1 + queue.length) % queue.length; carregar(playing);
}
function buscarSeg(s) {
  const x = cur(); if (!x) return;
  s = Math.max(0, Math.min(s, (x.d || 0) - 0.25));
  if (x.demo) { pos = s; if (playing) tocar(); }
  else if (el && el.dataset.id === x.id) el.currentTime = s;
  else pos = s;
}

/* ---- Sessão: volta de onde parou ---- */
let ultimaSessao = 0;
function salvarSessao() {
  ultimaSessao = Date.now();
  guardado.set("compasso.sessao", { queue, atual: queue[qi], pos: posAtual(), contexto, shuffle, repeat, origem });
}
function restaurarSessao() {
  const s = guardado.get("compasso.sessao", null);
  const q = s && Array.isArray(s.queue) ? s.queue.filter((id) => visivel(porId.get(id))) : [];
  if (!q.length) return filaPadrao();
  queue = q; qi = Math.max(0, q.indexOf(s.atual)); contexto = s.contexto || "Biblioteca";
  shuffle = !!s.shuffle; repeat = ["off", "all", "one"].includes(s.repeat) ? s.repeat : "off";
  origem = Array.isArray(s.origem) ? s.origem.filter((id) => porId.has(id)) : null;
  carregar(false);
  pos = cur() && s.atual === cur().id ? Math.max(0, +s.pos || 0) : 0;
}

/* ---- Controles do sistema (tela de bloqueio, fones, teclado de mídia) ---- */
const sessao = "mediaSession" in navigator ? navigator.mediaSession : null;
function metaSessao(x) {
  if (!sessao || typeof MediaMetadata === "undefined") return;
  try {
    sessao.metadata = new MediaMetadata({
      title: x.t, artist: x.a, album: x.al || "",
      artwork: x.cover ? [{ src: x.cover, sizes: "512x512", type: (x.capaBlob && x.capaBlob.type) || "image/jpeg" }]
        : [{ src: "icons/icon-512.png", sizes: "512x512", type: "image/png" }],
    });
  } catch (e) { /* sem suporte */ }
}
if (sessao) {
  const h = (a, f) => { try { sessao.setActionHandler(a, f); } catch (e) { /* ação sem suporte */ } };
  h("play", tocar); h("pause", pausar); h("previoustrack", anterior); h("nexttrack", proxima);
  h("seekto", (d) => buscarSeg(d.seekTime));
  h("seekbackward", (d) => buscarSeg(posAtual() - (d.seekOffset || 10)));
  h("seekforward", (d) => buscarSeg(posAtual() + (d.seekOffset || 10)));
}

/* ===================== Luz de fundo e mostrador ===================== */
let ambAtiva = "A";
function luz(c) {
  const bg = `radial-gradient(60% 42% at 42% 30%,${c[0]},transparent 72%),radial-gradient(52% 40% at 68% 46%,${c[1]},transparent 72%)`;
  const nova = ambAtiva === "A" ? "B" : "A";
  $("amb" + nova).style.background = bg; $("amb" + nova).classList.add("on"); $("amb" + ambAtiva).classList.remove("on");
  ambAtiva = nova;
  document.documentElement.style.setProperty("--g1", c[0]);
  document.documentElement.style.setProperty("--g2", c[1]);
}
(function () {
  let h = "";
  for (let i = 0; i < 60; i++) h += `<line class="${i % 5 === 0 ? "h" : ""}" x1="100" y1="${i % 5 === 0 ? 3 : 6}" x2="100" y2="12" transform="rotate(${i * 6} 100 100)"/>`;
  $("ticks").innerHTML = h;
})();
const linhas = [...$("ticks").children];
let acesas = -1, arrastandoSeek = false, pulso = 0.4, batida = 0, alvoBatida = 0, media = 0, ultimaBatida = 0, ultimoSeg = -1;
const nivel = new Float32Array(60);
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
function quadro() {
  const x = cur();
  if (x) {
    const p = posAtual();
    if (x.demo && playing && p >= x.d) fimDaFaixa();
    else {
      const fr = x.d ? Math.min(1, p / x.d) : 0;
      if (!arrastandoSeek) $("seek").value = Math.round(fr * 1000);
      const seg = Math.floor(p);
      if (seg !== ultimoSeg) {
        ultimoSeg = seg; $("cur").textContent = fmt(p);
        $("mini").style.setProperty("--prog", (fr * 100).toFixed(1) + "%");
        if (sessao && sessao.setPositionState && x.d > 0) try { sessao.setPositionState({ duration: x.d, position: Math.min(p, x.d), playbackRate: 1 }); } catch (e) { /* ignora */ }
        if (playing && Date.now() - ultimaSessao > 5000) salvarSessao();
      }
      const n = Math.round(fr * 60);
      if (n !== acesas) { linhas.forEach((l, i) => l.classList.toggle("on", i < n)); acesas = n; }
    }
  }
  let alvo = 0.4;
  const ativo = playing && an && cfg.reage && !calmo;
  if (ativo) {
    an.getByteFrequencyData(bins);
    let s = 0; for (let i = 1; i < 19; i++) s += bins[i];
    alvo = Math.min(1, s / 18 / 170);
    const g = (bins[0] + bins[1] + bins[2] + bins[3]) / 4, agora = performance.now();
    if (g > media * 1.3 && g > 90 && agora - ultimaBatida > 450) { alvoBatida = 1; ultimaBatida = agora; }
    media += (g - media) * 0.06;
  } else if (!playing) alvo = 0.25;
  alvoBatida *= 0.93; batida += (alvoBatida - batida) * 0.22;
  for (let i = 0; i < 60; i++) {
    const p = (i < 30 ? i : 59 - i) / 29, t = ativo ? (bins[1 + Math.round(60 * p * p)] / 255) * cfg.batF * 1.4 : 0;
    const nv = nivel[i] + (Math.min(1, t) - nivel[i]) * 0.16;
    if (Math.abs(nv - nivel[i]) > 0.004 || (nv < 0.004 && nivel[i] !== 0)) {
      nivel[i] = nv < 0.004 ? 0 : nv;
      linhas[i].setAttribute("y2", (12 + nivel[i] * 7).toFixed(1));
    }
  }
  pulso += (alvo - pulso) * 0.1;
  const r = document.documentElement.style;
  r.setProperty("--beat", batida.toFixed(3)); r.setProperty("--pulse", pulso.toFixed(3));
  requestAnimationFrame(quadro);
}

/* ===================== Tela: Tocando agora e mini player ===================== */
function paint() {
  const x = cur();
  $("b-play").innerHTML = ico(playing ? "pause" : "play", 30); $("b-play").setAttribute("aria-label", playing ? "Pausar" : "Tocar");
  $("mini-play").innerHTML = ico(playing ? "pause" : "play"); $("mini-play").setAttribute("aria-label", playing ? "Pausar" : "Tocar");
  $("b-shuf").classList.toggle("act", shuffle); $("b-shuf").setAttribute("aria-pressed", shuffle);
  $("b-rep").classList.toggle("act", repeat !== "off"); $("b-rep").setAttribute("aria-pressed", repeat !== "off");
  $("b-rep").innerHTML = ico("rep") + (repeat === "one" ? "<b>1</b>" : "");
  $("b-rep").setAttribute("aria-label", { off: "Repetir: desligado", all: "Repetir: fila", one: "Repetir: esta música" }[repeat]);
  document.querySelectorAll(".eq").forEach((e) => e.classList.toggle("paused", !playing));
  if (sessao) try { sessao.playbackState = playing ? "playing" : "paused"; } catch (e) { /* ignora */ }
  $("mini").hidden = !x;
  if (!x) {
    $("np-t").textContent = "Nada tocando"; $("np-a").textContent = "Importe músicas na Biblioteca";
    $("disc").style.background = "var(--card)"; $("disc").textContent = ""; $("b-fila").innerHTML = ico("queue", 18) + "Fila vazia";
    return;
  }
  $("np-ctx").textContent = "Tocando · " + contexto;
  $("np-t").textContent = x.t; $("np-a").textContent = linha2(x) + (x.demo ? " · exemplo" : "");
  $("disc").style.background = fundoDe(x); $("disc").textContent = x.cover ? "" : (x.t[0] || "?").toUpperCase();
  $("mini-th").innerHTML = capa(x); $("mini-t").textContent = x.t; $("mini-a").textContent = x.a;
  $("tot").textContent = fmt(x.d);
  const depois = queue.length - qi - 1;
  $("b-fila").innerHTML = ico("queue", 18) + (depois ? `Fila · ${depois} a seguir` : "Fila · última música");
  $("b-npmais").innerHTML = ico("more", 18);
  document.title = playing ? `${x.t} · Compasso` : "Compasso Player";
}
function marcarAtual() {
  const id = cur() && cur().id;
  document.querySelectorAll(".track[data-row]").forEach((r) => {
    if (r.closest("#sheet-b")) return;
    const on = r.dataset.row === id; r.classList.toggle("cur", on);
    const t = r.querySelector(".t"), e = t && t.querySelector(".eq");
    if (on && t && !e) t.insertAdjacentHTML("afterbegin", eqIcone());
    else if (!on && e) e.remove();
  });
  paint();
}

/* ===================== Tela: Biblioteca ===================== */
let aba = "musicas", aberto = null, listaBib = { ids: [], ctx: "Biblioteca" };
const ORDENS = { recentes: "Recentes", titulo: "Título", artista: "Artista" };
const comparar = (a, b) => a.localeCompare(b, "pt-BR", { sensitivity: "base", numeric: true });
function ordenar(lista) {
  const l = lista.slice();
  if (cfg.ord === "titulo") l.sort((a, b) => comparar(a.t, b.t));
  else if (cfg.ord === "artista") l.sort((a, b) => comparar(a.a, b.a) || comparar(a.al || "", b.al || "") || (a.n || 999) - (b.n || 999));
  else l.sort((a, b) => (b.em || 0) - (a.em || 0));
  return l;
}
const nomeAlbum = (x) => x.al || "Sem álbum";
const porFaixa = (a, b) => (a.n || 999) - (b.n || 999) || comparar(a.t, b.t);
function albuns(lista = vis()) {
  const m = new Map();
  for (const x of lista) { const k = nomeAlbum(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return [...m].map(([n, fx]) => {
    fx.sort(porFaixa);
    return { n, fx, a: new Set(fx.map((x) => x.a)).size > 1 ? "Vários artistas" : fx[0].a, capa: fx.find((x) => x.cover) || fx[0] };
  }).sort((a, b) => comparar(a.n, b.n));
}
function artistas() {
  const m = new Map();
  for (const x of vis()) { if (!m.has(x.a)) m.set(x.a, []); m.get(x.a).push(x); }
  return [...m].map(([n, fx]) => ({ n, fx, albuns: new Set(fx.map(nomeAlbum)).size, capa: fx.find((x) => x.cover) || fx[0] })).sort((a, b) => comparar(a.n, b.n));
}
const capaGrupo = (g, cls = "cover") => `<span class="${cls}" style="background:${fundoDe(g.capa)}">${g.capa.cover ? "" : inicial(g.n)}</span>`;
function linhaFaixa(x, o = {}) {
  const atual = cur() && cur().id === x.id;
  return `<div class="track${atual ? " cur" : ""}" data-row="${x.id}">` +
    (o.grip ? `<button class="grip" data-grip aria-label="Mover ${esc(x.t)}. Use as setas para cima e para baixo">${ico("grip", 20)}</button>` : "") +
    `<button class="tp" data-play="${x.id}">${o.num !== undefined ? `<span class="idx">${o.num || "·"}</span>` : capa(x)}` +
    `<span class="grow"><span class="t clip">${atual ? eqIcone() : ""}${esc(x.t)}</span><span class="sub clip">${esc(o.sub ? o.sub(x) : linha2(x))}</span></span></button>` +
    (x.demo ? '<span class="chip">exemplo</span>' : "") +
    `<span class="dur">${x.d ? fmt(x.d) : ""}</span>` +
    `<button class="ic sm" data-more="${x.id}" aria-label="Opções de ${esc(x.t)}">${ico("more", 20)}</button></div>`;
}
const botoesTocar = (n) => `<div class="btns"><button class="btn sm" data-tudo>${ico("play", 18)}Tocar</button><button class="btn ghost sm" data-aleatorio>${ico("shuf", 18)}Aleatório</button>${n || ""}</div>`;
const vazio = (txt, extra = "") => `<div class="empty"><p>${txt}</p>${extra}</div>`;
function renderBib() {
  const v = vis(), q = $("q").value.trim().toLowerCase(), imp = importadas().length;
  if (!importando) $("count").textContent = v.length ? `${plural(v.length, "música", "músicas")} · ${fmt(duracaoTotal(v))}` + (imp && !db ? " · este navegador não guarda a biblioteca" : "") : "Nenhuma música ainda";
  $("q").hidden = $("seg").hidden = !!aberto;
  document.querySelectorAll("#seg button").forEach((b) => { b.classList.toggle("on", b.dataset.tab === aba); b.setAttribute("aria-pressed", b.dataset.tab === aba); });
  const L = $("lib");
  const casa = (s) => !q || s.toLowerCase().includes(q);
  if (!v.length) {
    L.innerHTML = vazio("Sua biblioteca está vazia. Importe arquivos MP3, FLAC, M4A, OGG ou Opus do seu aparelho.", `<button class="btn" data-importar>${ico("plus", 18)}Importar músicas</button><p class="note">No PC, você também pode arrastar arquivos e pastas para esta janela.</p>`);
    return;
  }
  if (aberto && aberto.tipo === "album") {
    const al = albuns().find((a) => a.n === aberto.nome);
    if (!al) { aberto = null; return renderBib(); }
    listaBib = { ids: al.fx.map((x) => x.id), ctx: "álbum " + al.n };
    L.innerHTML = `<button class="back" data-voltar>${ico("back", 18)}Voltar</button>
      <div class="hero">${capaGrupo(al)}<div class="grow stack"><div><h1>${esc(al.n)}</h1><p class="sub">${esc(al.a)} · ${plural(al.fx.length, "música", "músicas")} · ${fmt(duracaoTotal(al.fx))}</p></div></div></div>
      ${botoesTocar()}<div class="list">${al.fx.map((x) => linhaFaixa(x, { num: x.n, sub: (y) => y.a })).join("")}</div>`;
    return;
  }
  if (aberto && aberto.tipo === "artista") {
    const ar = artistas().find((a) => a.n === aberto.nome);
    if (!ar) { aberto = null; return renderBib(); }
    const als = albuns(ar.fx), ordem = als.flatMap((a) => a.fx);
    listaBib = { ids: ordem.map((x) => x.id), ctx: "artista " + ar.n };
    L.innerHTML = `<button class="back" data-voltar>${ico("back", 18)}Voltar</button>
      <div class="hero">${capaGrupo(ar, "cover round")}<div class="grow"><h1>${esc(ar.n)}</h1><p class="sub">${plural(ar.albuns, "álbum", "álbuns")} · ${plural(ar.fx.length, "música", "músicas")}</p></div></div>
      ${botoesTocar()}
      <p class="sec-t">Álbuns</p><div class="albs">${als.map((a) => `<button class="alb" data-al="${esc(a.n)}">${capaGrupo(a)}<span class="t clip">${esc(a.n)}</span><span class="sub clip">${plural(a.fx.length, "música", "músicas")}</span></button>`).join("")}</div>
      <p class="sec-t">Músicas</p><div class="list">${ordem.map((x) => linhaFaixa(x)).join("")}</div>`;
    return;
  }
  if (aba === "musicas") {
    const f = ordenar(v).filter((x) => casa(x.t + " " + x.a + " " + (x.al || "")));
    listaBib = { ids: f.map((x) => x.id), ctx: q ? "busca" : "Biblioteca" };
    L.innerHTML = `<div class="row"><div class="grow">${f.length ? botoesTocar() : ""}</div>
      <select id="ord" class="mini-sel" aria-label="Ordem das músicas">${Object.entries(ORDENS).map(([k, n]) => `<option value="${k}"${k === cfg.ord ? " selected" : ""}>${n}</option>`).join("")}</select></div>
      ${f.length ? `<div class="list">${f.map((x) => linhaFaixa(x)).join("")}</div>` : vazio("Nada encontrado para essa busca.")}`;
  } else if (aba === "albuns") {
    const f = albuns().filter((a) => casa(a.n + " " + a.a));
    L.innerHTML = f.length ? `<div class="albs">${f.map((a) => `<button class="alb" data-al="${esc(a.n)}">${capaGrupo(a)}<span class="t clip">${esc(a.n)}</span><span class="sub clip">${esc(a.a)} · ${plural(a.fx.length, "música", "músicas")}</span></button>`).join("")}</div>` : vazio("Nenhum álbum encontrado.");
  } else {
    const f = artistas().filter((a) => casa(a.n));
    L.innerHTML = f.length ? `<div class="list">${f.map((a) => `<div class="track"><button class="tp" data-ar="${esc(a.n)}">${capaGrupo(a, "thumb round")}<span class="grow"><span class="t clip">${esc(a.n)}</span><span class="sub clip">${plural(a.albuns, "álbum", "álbuns")} · ${plural(a.fx.length, "música", "músicas")}</span></span></button></div>`).join("")}</div>` : vazio("Nenhum artista encontrado.");
  }
}
function abrirNaBib(tipo, nome) { aberto = { tipo, nome }; ir("biblioteca"); renderBib(); $("main").scrollTop = 0; }
$("q").addEventListener("input", renderBib);
$("seg").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { aba = b.dataset.tab; renderBib(); } });
$("lib").addEventListener("change", (e) => { if (e.target.id === "ord") { cfg.ord = e.target.value; salvarCfg(); renderBib(); } });
$("lib").addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-importar]")) return menuImportar();
  if (t.closest("[data-voltar]")) { aberto = null; renderBib(); return; }
  const al = t.closest("[data-al]"); if (al) return abrirNaBib("album", al.dataset.al);
  const ar = t.closest("[data-ar]"); if (ar) return abrirNaBib("artista", ar.dataset.ar);
  const m = t.closest("[data-more]"); if (m) return menuFaixa(m.dataset.more);
  if (t.closest("[data-tudo]")) return tocarLista(listaBib.ids, 0, listaBib.ctx);
  if (t.closest("[data-aleatorio]")) return tocarAleatorio(listaBib.ids, listaBib.ctx);
  const p = t.closest("[data-play]"); if (p) tocarLista(listaBib.ids, listaBib.ids.indexOf(p.dataset.play), listaBib.ctx);
});
$("b-import").addEventListener("click", menuImportar);
function menuImportar() {
  abrirFolha({
    titulo: "Importar músicas",
    html: `<div class="menu"><button data-i="arquivos">${ico("note")}Escolher arquivos</button><button data-i="pasta">${ico("folder")}Escolher uma pasta inteira</button></div>
      <p class="note" style="padding:0 8px">As músicas ficam guardadas só neste navegador. No PC, você também pode arrastar arquivos e pastas para a janela.</p>`,
    clique(e) { const b = e.target.closest("[data-i]"); if (!b) return; fecharFolha(); $(b.dataset.i === "pasta" ? "folder" : "files").click(); },
  });
}
$("files").addEventListener("change", (e) => { const f = [...e.target.files]; e.target.value = ""; importar(f); });
$("folder").addEventListener("change", (e) => { const f = [...e.target.files]; e.target.value = ""; importar(f); });

/* ===================== Folha inferior, avisos e diálogos ===================== */
let folha = null, focoAntes = null;
function abrirFolha(o) {
  const jaAberta = !!folha;
  folha = o;
  $("sheet-t").textContent = o.titulo; $("sheet-b").innerHTML = o.html;
  $("scrim").hidden = false; $("sheet").hidden = false;
  requestAnimationFrame(() => { $("scrim").classList.add("on"); $("sheet").classList.add("on"); });
  if (!jaAberta) focoAntes = document.activeElement;
  setTimeout(() => { const f = $("sheet-b").querySelector("[autofocus]") || $("sheet-x"); if (f) f.focus(); }, 80);
  if (o.depois) o.depois();
}
function fecharFolha() {
  if (!folha) return;
  folha = null;
  $("scrim").classList.remove("on"); $("sheet").classList.remove("on");
  setTimeout(() => { if (!folha) { $("scrim").hidden = true; $("sheet").hidden = true; $("sheet-b").innerHTML = ""; } }, 260);
  if (focoAntes && focoAntes.isConnected) focoAntes.focus();
}
$("sheet-b").addEventListener("click", (e) => folha && folha.clique && folha.clique(e));
$("sheet-b").addEventListener("input", (e) => folha && folha.entrada && folha.entrada(e));
$("sheet-b").addEventListener("submit", (e) => { e.preventDefault(); if (folha && folha.enviar) folha.enviar(new FormData(e.target)); });
$("scrim").addEventListener("click", fecharFolha);
$("sheet-x").addEventListener("click", fecharFolha);
$("sheet-x").innerHTML = ico("x", 20);
let toastT;
function toast(msg) {
  const t = $("toast"); t.textContent = msg; t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on"), 2200);
}
function perguntar(titulo, rotulo, valor, botao, cb) {
  abrirFolha({
    titulo,
    html: `<form class="stack"><label class="t" for="pg">${esc(rotulo)}</label><input class="field" id="pg" name="v" value="${esc(valor)}" maxlength="60" required autofocus autocomplete="off"><div class="btns"><button class="btn" type="submit">${esc(botao)}</button><button class="btn ghost" type="button" data-cancelar>Cancelar</button></div></form>`,
    enviar(d) { const v = String(d.get("v") || "").trim(); if (!v) return; fecharFolha(); cb(v); },
    clique(e) { if (e.target.closest("[data-cancelar]")) fecharFolha(); },
    depois() { setTimeout(() => { const i = $("pg"); if (i) i.select(); }, 90); },
  });
}
function confirmar(titulo, texto, botao, cb) {
  abrirFolha({
    titulo,
    html: `<p style="padding:0 6px">${esc(texto)}</p><div class="btns"><button class="btn danger" data-sim>${esc(botao)}</button><button class="btn ghost" data-nao autofocus>Cancelar</button></div>`,
    clique(e) { if (e.target.closest("[data-sim]")) { fecharFolha(); cb(); } else if (e.target.closest("[data-nao]")) fecharFolha(); },
  });
}

/* ---- Menu de uma música ---- */
function menuFaixa(id, deLista) {
  const x = porId.get(id); if (!x) return;
  const itens = [["seguir", "Tocar a seguir", "seguir"], ["addq", "Adicionar ao fim da fila", "fila"], ["pls", "Adicionar a uma playlist", "addpl"]];
  if (x.al) itens.push(["album", "Ver álbum", "album"]);
  itens.push(["artist", "Ver artista", "artista"]);
  if (deLista) itens.push(["x", "Tirar desta playlist", "tirarpl"]);
  if (!x.demo) itens.push(["trash", "Remover da biblioteca", "apagar", true]);
  abrirFolha({
    titulo: x.t,
    html: `<p class="sub" style="padding:0 8px;margin-top:-6px">${esc(linha2(x))}</p><div class="menu">${itens.map(([i, n, a, perigo]) => `<button data-a="${a}"${perigo ? ' class="danger"' : ""}>${ico(i)}${n}</button>`).join("")}</div>`,
    clique(e) {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const a = b.dataset.a;
      if (a === "seguir") { fecharFolha(); tocarASeguir(id); }
      else if (a === "fila") { fecharFolha(); adicionarFila(id); }
      else if (a === "addpl") menuAddPlaylist(id);
      else if (a === "album") { fecharFolha(); abrirNaBib("album", nomeAlbum(x)); }
      else if (a === "artista") { fecharFolha(); abrirNaBib("artista", x.a); }
      else if (a === "tirarpl") { fecharFolha(); const p = pls.find((y) => y.id === deLista); if (p) { p.ids = p.ids.filter((q) => q !== id); salvarPl(p); renderPl(); toast("Tirada da playlist"); } }
      else if (a === "apagar") confirmar("Remover da biblioteca?", `"${x.t}" sai do Compasso e de todas as playlists. O arquivo original continua no seu aparelho.`, "Remover", () => { removerFaixa(id); toast("Música removida"); });
    },
  });
}

/* ---- Fila ---- */
function htmlFila() {
  const x = cur();
  if (!x) return vazio("A fila está vazia.");
  const prox = queue.slice(qi + 1).filter((id) => porId.has(id));
  const linhaQ = (y, i, editavel) => `<div class="track${i === qi ? " cur" : ""}" data-row="${y.id}">` +
    (editavel ? `<button class="grip" data-grip aria-label="Mover ${esc(y.t)}. Use as setas para cima e para baixo">${ico("grip", 20)}</button>` : "") +
    `<button class="tp" data-pular="${y.id}">${capa(y)}<span class="grow"><span class="t clip">${i === qi ? eqIcone() : ""}${esc(y.t)}</span><span class="sub clip">${esc(y.a)}</span></span></button>` +
    `<span class="dur">${y.d ? fmt(y.d) : ""}</span>` +
    (editavel ? `<button class="ic sm" data-tirar="${y.id}" aria-label="Tirar ${esc(y.t)} da fila">${ico("x", 18)}</button>` : "") + "</div>";
  return `<p class="sec-t">Tocando agora · ${esc(contexto)}</p><div class="list">${linhaQ(x, qi, false)}</div>
    <div class="row"><p class="sec-t grow">A seguir · ${plural(prox.length, "música", "músicas")} · ${fmt(duracaoTotal(prox.map((id) => porId.get(id))))}</p>${prox.length ? '<button class="btn ghost sm" data-limpar>Limpar</button>' : ""}</div>
    ${prox.length ? `<div class="list" id="fila-prox">${prox.map((id, j) => linhaQ(porId.get(id), qi + 1 + j, true)).join("")}</div>` : vazio(repeat === "all" ? "Esta é a última. Depois a fila recomeça." : "Esta é a última música da fila.")}
    <p class="note" style="padding:0 8px">Arraste pela alça para mudar a ordem.</p>`;
}
function abrirFila() {
  abrirFolha({
    titulo: "Fila", modo: "fila", html: htmlFila(),
    clique(e) {
      const t = e.target;
      const p = t.closest("[data-pular]"); if (p) { const i = queue.indexOf(p.dataset.pular); if (i >= 0 && i !== qi) { qi = i; carregar(true); } return; }
      const r = t.closest("[data-tirar]"); if (r) return tirarDaFila(queue.indexOf(r.dataset.tirar));
      if (t.closest("[data-limpar]")) { queue = queue.slice(0, qi + 1); renderFilaAberta(); paint(); salvarSessao(); }
    },
    depois: ligarArrasteFila,
  });
}
function ligarArrasteFila() {
  ativarArraste($("fila-prox"), (ids) => { queue = queue.slice(0, qi + 1).concat(ids); paint(); salvarSessao(); });
}
let arrastando = false;
function renderFilaAberta() {
  if (!folha || folha.modo !== "fila" || arrastando) return;
  const b = $("sheet-b"), s = b.scrollTop;
  b.innerHTML = htmlFila(); b.scrollTop = s; ligarArrasteFila();
}
$("b-fila").addEventListener("click", abrirFila);
$("b-npmais").addEventListener("click", () => cur() && menuFaixa(cur().id));

/* ---- Arrastar para reordenar (dedo, mouse ou teclado) ---- */
function ativarArraste(lista, aoSoltar) {
  if (!lista) return;
  const ordem = () => [...lista.querySelectorAll(".track")].map((r) => r.dataset.row);
  lista.addEventListener("pointerdown", (e) => {
    const g = e.target.closest("[data-grip]"); if (!g) return;
    e.preventDefault();
    const row = g.closest(".track"), rolagem = lista.closest(".sheet-b") || $("main"), antes = ordem().join();
    try { g.setPointerCapture(e.pointerId); } catch (err) { /* ignora */ }
    row.classList.add("dragging"); arrastando = true;
    const mover = (ev) => {
      const linhasL = [...lista.querySelectorAll(".track")], i = linhasL.indexOf(row), y = ev.clientY;
      const ant = linhasL[i - 1], prox = linhasL[i + 1];
      if (prox) { const r = prox.getBoundingClientRect(); if (y > r.top + r.height / 2) lista.insertBefore(prox, row); }
      if (ant) { const r = ant.getBoundingClientRect(); if (y < r.top + r.height / 2) lista.insertBefore(ant, row.nextSibling); }
      const b = rolagem.getBoundingClientRect();
      if (y < b.top + 48) rolagem.scrollTop -= 10; else if (y > b.bottom - 48) rolagem.scrollTop += 10;
    };
    const fim = () => {
      g.removeEventListener("pointermove", mover); g.removeEventListener("pointerup", fim); g.removeEventListener("pointercancel", fim);
      row.classList.remove("dragging"); arrastando = false;
      if (ordem().join() !== antes) aoSoltar(ordem());
      renderFilaAberta();
    };
    g.addEventListener("pointermove", mover); g.addEventListener("pointerup", fim); g.addEventListener("pointercancel", fim);
  });
  lista.addEventListener("keydown", (e) => {
    const g = e.target.closest("[data-grip]"); if (!g || (e.key !== "ArrowUp" && e.key !== "ArrowDown")) return;
    e.preventDefault();
    const row = g.closest(".track");
    if (e.key === "ArrowUp" && row.previousElementSibling) lista.insertBefore(row, row.previousElementSibling);
    else if (e.key === "ArrowDown" && row.nextElementSibling) lista.insertBefore(row.nextElementSibling, row);
    else return;
    g.focus(); aoSoltar(ordem());
  });
}

/* ===================== Tela: Playlists ===================== */
let pls = [], plAberta = null;
function salvarPl(p) { p.mod = Date.now(); if (db) dbPut("playlists", p); else guardado.set("compasso.pls", pls); }
function apagarPl(p) { pls = pls.filter((y) => y !== p); if (db) dbDel("playlists", p.id); else guardado.set("compasso.pls", pls); }
const idsDe = (p) => p.ids.filter((id) => visivel(porId.get(id)));
function novaPlaylist(nome, ids = []) {
  const p = { id: uid("p"), nome: nome.slice(0, 60), ids, criada: Date.now() };
  pls.push(p); salvarPl(p); renderPl();
  return p;
}
function mosaico(p, cls = "thumb") {
  const fx = idsDe(p).map((id) => porId.get(id));
  if (fx.length >= 4) return `<span class="${cls} mosaic">${fx.slice(0, 4).map((x) => `<span style="background:${fundoDe(x)}"></span>`).join("")}</span>`;
  if (fx.length) return capa({ ...fx[0], t: p.nome }, cls);
  return `<span class="${cls}" style="background:${grad(coresDoNome(p.nome))}">${inicial(p.nome)}</span>`;
}
function renderPl() {
  const L = $("pl");
  const p = plAberta && pls.find((y) => y.id === plAberta);
  if (!p) {
    plAberta = null;
    const lista = pls.slice().sort((a, b) => (b.mod || 0) - (a.mod || 0));
    L.innerHTML = `<div class="row"><div class="grow"><h1>Playlists</h1><p class="sub">${pls.length ? plural(pls.length, "playlist", "playlists") : "Nenhuma playlist ainda"}</p></div><button class="btn" data-nova>${ico("plus", 18)}Nova</button></div>` +
      (lista.length ? lista.map((y) => { const fx = idsDe(y).map((id) => porId.get(id)); return `<div class="card row"><button class="tp" data-abrir="${y.id}">${mosaico(y)}<span class="grow"><span class="t clip">${esc(y.nome)}</span><span class="sub clip">${plural(fx.length, "música", "músicas")} · ${fmt(duracaoTotal(fx))}</span></span></button><button class="ic act" data-tocarpl="${y.id}" aria-label="Tocar ${esc(y.nome)}">${ico("play")}</button></div>`; }).join("")
        : vazio("Crie uma playlist e adicione músicas pelo botão ⋯ de cada uma.", `<button class="btn" data-nova>${ico("plus", 18)}Criar playlist</button>`));
    return;
  }
  const fx = idsDe(p).map((id) => porId.get(id));
  L.innerHTML = `<button class="back" data-voltar>${ico("back", 18)}Playlists</button>
    <div class="hero">${mosaico(p, "cover")}<div class="grow stack"><div><h1>${esc(p.nome)}</h1><p class="sub">${plural(fx.length, "música", "músicas")} · ${fmt(duracaoTotal(fx))}</p></div></div></div>
    ${fx.length ? botoesTocar(`<button class="btn ghost sm" data-addmus>${ico("plus", 18)}Músicas</button><button class="ic sm" data-plmais aria-label="Mais opções da playlist">${ico("more", 20)}</button>`)
      : `<div class="btns"><button class="btn sm" data-addmus>${ico("plus", 18)}Adicionar músicas</button><button class="ic sm" data-plmais aria-label="Mais opções da playlist">${ico("more", 20)}</button></div>`}
    ${fx.length ? `<div class="list" id="pl-lista">${fx.map((x) => linhaFaixa(x, { grip: true })).join("")}</div><p class="note">Arraste pela alça para mudar a ordem.</p>` : vazio("Playlist vazia. Adicione músicas da sua biblioteca.")}`;
  ativarArraste($("pl-lista"), (ids) => { const fora = p.ids.filter((id) => !ids.includes(id)); p.ids = ids.concat(fora); salvarPl(p); });
}
$("pl").addEventListener("click", (e) => {
  const t = e.target, p = plAberta && pls.find((y) => y.id === plAberta);
  if (t.closest("[data-nova]")) return perguntar("Nova playlist", "Nome da playlist", "", "Criar", (n) => { const np = novaPlaylist(n); plAberta = np.id; renderPl(); });
  const ab = t.closest("[data-abrir]"); if (ab) { plAberta = ab.dataset.abrir; renderPl(); $("main").scrollTop = 0; return; }
  const tp = t.closest("[data-tocarpl]"); if (tp) { const y = pls.find((z) => z.id === tp.dataset.tocarpl); if (y && idsDe(y).length) { tocarLista(idsDe(y), 0, "playlist " + y.nome); ir("tocando"); } else toast("Essa playlist está vazia"); return; }
  if (t.closest("[data-voltar]")) { plAberta = null; renderPl(); return; }
  if (!p) return;
  if (t.closest("[data-tudo]")) return tocarLista(idsDe(p), 0, "playlist " + p.nome);
  if (t.closest("[data-aleatorio]")) return tocarAleatorio(idsDe(p), "playlist " + p.nome);
  if (t.closest("[data-addmus]")) return escolherMusicas(p);
  if (t.closest("[data-plmais]")) return menuPlaylist(p);
  const m = t.closest("[data-more]"); if (m) return menuFaixa(m.dataset.more, p.id);
  const pl = t.closest("[data-play]"); if (pl) { const ids = idsDe(p); tocarLista(ids, ids.indexOf(pl.dataset.play), "playlist " + p.nome); }
});
function menuPlaylist(p) {
  abrirFolha({
    titulo: p.nome,
    html: `<div class="menu"><button data-a="seguir">${ico("seguir")}Tocar a seguir</button><button data-a="renomear">${ico("edit")}Renomear</button><button data-a="apagar" class="danger">${ico("trash")}Apagar playlist</button></div>`,
    clique(e) {
      const b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "renomear") perguntar("Renomear playlist", "Nome da playlist", p.nome, "Salvar", (n) => { p.nome = n.slice(0, 60); salvarPl(p); renderPl(); });
      else if (b.dataset.a === "seguir") {
        fecharFolha();
        const ids = idsDe(p).filter((id) => id !== queue[qi]);
        if (!queue.length) return tocarLista(idsDe(p), 0, "playlist " + p.nome);
        queue = queue.filter((id, i) => i === qi || !ids.includes(id)); qi = queue.indexOf(cur() ? cur().id : queue[0]);
        queue.splice(qi + 1, 0, ...ids); paint(); renderFilaAberta(); salvarSessao(); toast("A playlist toca em seguida");
      } else confirmar("Apagar playlist?", `"${p.nome}" será apagada. As músicas continuam na biblioteca.`, "Apagar", () => { apagarPl(p); plAberta = null; renderPl(); toast("Playlist apagada"); });
    },
  });
}
function menuAddPlaylist(id) {
  const html = () => `<div class="menu"><button data-nova>${ico("plus")}Nova playlist</button>${pls.map((p) => { const tem = p.ids.includes(id); return `<button data-pl="${p.id}" aria-pressed="${tem}">${mosaico(p)}<span class="grow"><span class="t clip">${esc(p.nome)}</span><span class="sub">${plural(idsDe(p).length, "música", "músicas")}</span></span>${tem ? `<span style="color:var(--accent)">${ico("check")}</span>` : ""}</button>`; }).join("")}</div>`;
  abrirFolha({
    titulo: "Adicionar a uma playlist", html: html(),
    clique(e) {
      if (e.target.closest("[data-nova]")) return perguntar("Nova playlist", "Nome da playlist", "", "Criar e adicionar", (n) => { novaPlaylist(n, [id]); toast(`Adicionada a "${n}"`); });
      const b = e.target.closest("[data-pl]"); if (!b) return;
      const p = pls.find((y) => y.id === b.dataset.pl); if (!p) return;
      if (p.ids.includes(id)) { p.ids = p.ids.filter((q) => q !== id); toast(`Tirada de "${p.nome}"`); }
      else { p.ids.push(id); toast(`Adicionada a "${p.nome}"`); }
      salvarPl(p); renderPl(); $("sheet-b").innerHTML = html();
    },
  });
}
function escolherMusicas(p) {
  const lista = (q) => {
    const f = ordenar(vis()).filter((x) => !q || (x.t + " " + x.a + " " + (x.al || "")).toLowerCase().includes(q));
    return f.length ? f.map((x) => { const tem = p.ids.includes(x.id); return `<div class="track" data-row="${x.id}"><button class="tp" data-tg="${x.id}" aria-pressed="${tem}">${capa(x)}<span class="grow"><span class="t clip">${esc(x.t)}</span><span class="sub clip">${esc(linha2(x))}</span></span><span class="ic sm"${tem ? ' style="color:var(--accent)"' : ""}>${ico(tem ? "check" : "plus", 20)}</span></button></div>`; }).join("") : vazio("Nada encontrado.");
  };
  abrirFolha({
    titulo: "Adicionar a " + p.nome,
    html: `<input class="search" id="esc-q" type="search" placeholder="Buscar na biblioteca" aria-label="Buscar músicas" autocomplete="off"><div class="list" id="esc-l">${lista("")}</div><button class="btn" data-ok>Pronto</button>`,
    entrada(e) { if (e.target.id === "esc-q") $("esc-l").innerHTML = lista(e.target.value.trim().toLowerCase()); },
    clique(e) {
      if (e.target.closest("[data-ok]")) return fecharFolha();
      const b = e.target.closest("[data-tg]"); if (!b) return;
      const id = b.dataset.tg;
      if (p.ids.includes(id)) p.ids = p.ids.filter((q) => q !== id); else p.ids.push(id);
      salvarPl(p); renderPl();
      $("esc-l").innerHTML = lista($("esc-q").value.trim().toLowerCase());
    },
  });
}

/* ===================== Tela: Temas ===================== */
let editando = null;
function cardTema(t) {
  const sel = t.id === cfg.tema, v = t.fixo ? { ...t, ...(cfg.ajustes[t.id] || {}) } : t;
  return `<div class="th${sel ? " sel" : ""}"><button class="tp" style="flex-direction:column;align-items:stretch;gap:2px" data-tema="${t.id}" aria-pressed="${sel}">
    <span class="prev" style="background:${v.fundo};--r:${v.raio}px"><span style="display:flex;flex-direction:column;gap:5px"><b style="background:${v.texto}"></b><em style="background:${v.suave}"></em></span><s style="background:${v.destaque}"></s></span>
    <span class="t clip">${esc(t.nome)}</span><span class="sub">${t.fixo ? "Grátis" : "Seu tema"}</span></button>
    ${t.fixo ? "" : `<button class="edit" data-editar="${t.id}" aria-label="Editar ${esc(t.nome)}">Editar</button>`}</div>`;
}
const tg = (chave, rotulo) => `<div class="opt"><span id="l-${chave}">${rotulo}</span><button class="tg" data-tg="${chave}" role="switch" aria-checked="${!!cfg[chave]}" aria-labelledby="l-${chave}"></button></div>`;
const faixaAjuste = (chave, rotulo, ligado) => `<div class="opt sub-opt"${ligado ? "" : " hidden"}><label for="r-${chave}">${rotulo}</label><input type="range" id="r-${chave}" data-rg="${chave}" min="0.15" max="1" step="0.05" value="${cfg[chave]}"></div>`;
function renderTemas() {
  if (editando) return renderEditor();
  const t = temaAtual(), cores = DESTAQUES[escuro(t) ? "escuro" : "claro"];
  $("tm").innerHTML = `<div><h1>Temas</h1><p class="sub">Toque num tema para usar. Os temas que você cria ficam salvos neste aparelho.</p></div>
    <div class="themes">${todosTemas().map(cardTema).join("")}<button class="th add" data-criar>${ico("plus")}Criar tema</button></div>
    <div class="card stack"><h2>Ajuste rápido</h2><p class="note">Vale para o tema em uso: ${esc(t.nome)}.</p>
      <div class="sw" role="group" aria-label="Cor de destaque">${cores.map(([n, c]) => `<button data-cor="${c}" title="${n}" aria-label="${n}" aria-pressed="${c.toUpperCase() === t.destaque.toUpperCase()}" class="${c.toUpperCase() === t.destaque.toUpperCase() ? "sel" : ""}" style="background:${c}"></button>`).join("")}</div>
      <div class="opt"><label for="r-raio">Cantos arredondados</label><input id="r-raio" type="range" min="0" max="28" step="2" value="${t.raio}"></div></div>
    <div class="card stack"><h2>Efeitos</h2>
      ${tg("amb", "Luz de fundo com as cores da capa")}${faixaAjuste("ambF", "Intensidade da luz", cfg.amb)}
      ${tg("reage", "Reagir à batida da música")}${faixaAjuste("batF", "Força da batida", cfg.reage)}</div>
    <div class="card stack"><h2>Compartilhar tema</h2><p class="note">Um tema é um arquivo JSON pequeno. Exporte o tema em uso ou importe um de outra pessoa.</p>
      <div class="btns"><button class="btn ghost sm" data-exp="copiar">Copiar JSON</button><button class="btn ghost sm" data-exp="baixar">Baixar .json</button><button class="btn ghost sm" data-imp="arquivo">Abrir .json</button><button class="btn ghost sm" data-imp="colar">Colar JSON</button></div></div>
    <div class="card stack"><h2>Biblioteca</h2>${tg("exemplos", "Mostrar as músicas de exemplo")}
      <p class="note" id="espaco">Calculando o espaço usado…</p>
      ${importadas().length ? '<div class="btns"><button class="btn danger sm" data-limparbib>Apagar todas as músicas importadas</button></div>' : ""}
      <p class="note">Atalhos no PC: espaço toca e pausa, setas ← e → voltam ou avançam 5 segundos, N e P trocam de música.</p></div>`;
  espaco();
}
async function espaco() {
  const imp = importadas(), soma = imp.reduce((s, x) => s + (x.arq ? x.arq.size : 0), 0);
  let txt = imp.length ? `${plural(imp.length, "música importada ocupa", "músicas importadas ocupam")} ${mb(soma)} neste navegador.` : "Nenhuma música importada ainda.";
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); if (e.quota) txt += ` Espaço livre para o app: cerca de ${mb(Math.max(0, e.quota - e.usage))}.`; } } catch (e) { /* sem estimativa */ }
  if (!db) txt += " Este navegador não deixou guardar a biblioteca, então as músicas somem ao fechar.";
  const p = $("espaco"); if (p) p.textContent = txt;
}
function ajustarAtual(mudanca) {
  const t = temaPorId(cfg.tema);
  if (t.fixo) cfg.ajustes[t.id] = { ...(cfg.ajustes[t.id] || {}), ...mudanca };
  else { Object.assign(t, mudanca); salvarTemas(); }
  aplicarTema();
}
const temaJSON = (t) => JSON.stringify({ formato: "orologia-tema", versao: 1, nome: t.nome, fundo: t.fundo, card: t.card, texto: t.texto, suave: t.suave, destaque: t.destaque, secundaria: t.secundaria, raio: t.raio, fonte: t.fonte }, null, 2);
function validarTema(o) {
  if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error("Esse conteúdo não é um tema do Compasso.");
  const t = { nome: String(o.nome || "Tema importado").trim().slice(0, 40) || "Tema importado" };
  for (const [k, n] of CAMPOS) {
    let v = String(o[k] || "").trim();
    if (/^#[0-9a-f]{3}$/i.test(v)) v = "#" + v.slice(1).split("").map((c) => c + c).join("");
    if (!HEX.test(v)) throw new Error(`A cor "${n}" (campo ${k}) precisa estar no formato #RRGGBB.`);
    t[k] = v.toUpperCase();
  }
  t.raio = Math.max(0, Math.min(28, Math.round(Number(o.raio) || 16)));
  t.fonte = FONTES[o.fonte] ? o.fonte : "padrao";
  return t;
}
function importarTema(texto) {
  try {
    const t = validarTema(JSON.parse(texto));
    t.id = uid("t"); meusTemas.push(t); salvarTemas();
    cfg.tema = t.id; aplicarTema(); renderTemas();
    toast(`Tema "${t.nome}" importado`);
    return true;
  } catch (e) {
    toast(e instanceof SyntaxError ? "O texto não é um JSON válido" : e.message);
    return false;
  }
}
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast("Copiado"); }
  catch (e) {
    abrirFolha({ titulo: "Copiar tema", html: `<p class="note">Selecione o texto abaixo e copie.</p><textarea class="field" readonly id="cp">${esc(texto)}</textarea>`, depois() { setTimeout(() => { const a = $("cp"); if (a) a.select(); }, 90); } });
  }
}
$("tm").addEventListener("click", (e) => {
  if (editando) return cliqueEditor(e);
  const t = e.target;
  const ed = t.closest("[data-editar]"); if (ed) { const x = temaPorId(ed.dataset.editar); editando = { id: x.id, rascunho: { ...x } }; renderTemas(); $("main").scrollTop = 0; return; }
  const th = t.closest("[data-tema]"); if (th) { cfg.tema = th.dataset.tema; aplicarTema(); renderTemas(); return; }
  if (t.closest("[data-criar]")) {
    const n = meusTemas.length + 1;
    editando = { id: null, rascunho: { ...temaAtual(), id: undefined, fixo: undefined, nome: "Meu tema " + n } };
    renderTemas(); $("main").scrollTop = 0; return;
  }
  const c = t.closest("[data-cor]"); if (c) { ajustarAtual({ destaque: c.dataset.cor }); renderTemas(); return; }
  const g = t.closest("[data-tg]");
  if (g) {
    const k = g.dataset.tg; cfg[k] = !cfg[k]; salvarCfg(); aplicarEfeitos();
    if (k === "exemplos") mudouExemplos();
    renderTemas(); return;
  }
  const ex = t.closest("[data-exp]");
  if (ex) {
    const at = temaAtual(), json = temaJSON(at);
    if (ex.dataset.exp === "copiar") return copiar(json);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = (at.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "tema") + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return toast("Se o download não começar, use Copiar JSON");
  }
  const im = t.closest("[data-imp]");
  if (im) {
    if (im.dataset.imp === "arquivo") return $("tema-file").click();
    return abrirFolha({
      titulo: "Colar tema",
      html: `<form class="stack"><label class="t" for="cola">Cole o JSON do tema</label><textarea class="field" id="cola" name="v" required autofocus placeholder='{ "nome": "...", "fundo": "#14111F", ... }'></textarea><button class="btn" type="submit">Importar tema</button></form>`,
      enviar(d) { if (importarTema(String(d.get("v") || ""))) fecharFolha(); },
    });
  }
  if (t.closest("[data-limparbib]")) {
    return confirmar("Apagar músicas importadas?", `${plural(importadas().length, "música sai", "músicas saem")} do Compasso. Os arquivos originais continuam no seu aparelho. As playlists ficam, mas sem essas músicas.`, "Apagar tudo", () => {
      importadas().forEach((x) => removerFaixa(x.id));
      renderTemas(); toast("Biblioteca limpa");
    });
  }
});
$("tm").addEventListener("input", (e) => {
  if (editando) return entradaEditor(e);
  const t = e.target;
  if (t.id === "r-raio") ajustarAtual({ raio: +t.value });
  else if (t.dataset.rg) { cfg[t.dataset.rg] = +t.value; salvarCfg(); aplicarEfeitos(); }
});
$("tema-file").addEventListener("change", async (e) => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  if (f.size > 100000) return toast("Esse arquivo é grande demais para ser um tema");
  importarTema(await f.text());
});
function mudouExemplos() {
  if (!cfg.exemplos) {
    const x = cur();
    if (x && x.demo && playing) pausar();
    queue = queue.filter((id) => visivel(porId.get(id)));
    if (origem) origem = origem.filter((id) => visivel(porId.get(id)));
    if (!queue.length) filaPadrao();
    else if (x && x.demo) { qi = 0; carregar(false); }
    else qi = Math.max(0, queue.indexOf(x && x.id));
  } else if (!queue.length) filaPadrao();
  renderBib(); renderPl(); paint();
}

/* ---- Editor de tema ---- */
function htmlContraste(d) {
  const linha = (rot, a, b, min) => { const r = contraste(a, b), ok = r >= min; return `<div class="row"><span class="grow note">${rot}</span><span class="chip ${ok ? "ok" : "warn"}">${r.toFixed(1).replace(".", ",")}:1 · ${ok ? "legível" : "fraco"}</span></div>`; };
  return linha("Texto sobre o fundo", d.texto, d.fundo, 4.5) + linha("Texto sobre os cartões", d.texto, d.card, 4.5) + linha("Texto suave sobre o fundo", d.suave, d.fundo, 4.5) + linha("Destaque sobre o fundo", d.destaque, d.fundo, 3);
}
function renderEditor() {
  const d = editando.rascunho;
  $("tm").innerHTML = `<button class="back" data-voltar>${ico("back", 18)}Temas</button>
    <div><h1>${editando.id ? "Editar tema" : "Novo tema"}</h1><p class="sub">O app inteiro mostra o tema enquanto você edita.</p></div>
    <div class="card stack"><label class="t" for="e-nome">Nome</label><input class="field" id="e-nome" value="${esc(d.nome)}" maxlength="40" autocomplete="off"></div>
    <div class="card stack"><h2>Cores</h2>
      ${CAMPOS.map(([k, n]) => `<label class="color-row" for="e-${k}"><span class="grow">${n}</span><code id="x-${k}">${d[k]}</code><input type="color" id="e-${k}" data-campo="${k}" value="${d[k].toLowerCase()}"></label>`).join("")}
      <div class="stack" id="e-contraste" style="gap:6px">${htmlContraste(d)}</div></div>
    <div class="card stack"><div class="opt"><label for="e-raio">Cantos arredondados</label><input type="range" id="e-raio" min="0" max="28" step="2" value="${d.raio}"></div></div>
    <div class="card stack"><h2>Fonte</h2><div class="fonts">${Object.entries(FONTES).map(([k, f]) => `<button data-fonte="${k}" aria-pressed="${d.fonte === k}" class="${d.fonte === k ? "on" : ""}" style="font-family:${esc(f.b)}"><b style="font-family:${esc(f.d)}">Aa</b>${f.n}</button>`).join("")}</div></div>
    <div class="btns"><button class="btn" data-salvar>Salvar tema</button><button class="btn ghost" data-voltar>Cancelar</button>${editando.id ? '<button class="btn danger" data-apagar>Apagar tema</button>' : ""}</div>`;
  aplicar(d);
}
function entradaEditor(e) {
  const t = e.target, d = editando.rascunho;
  if (t.id === "e-nome") { d.nome = t.value; return; }
  if (t.id === "e-raio") d.raio = +t.value;
  else if (t.dataset.campo) { d[t.dataset.campo] = t.value.toUpperCase(); $("x-" + t.dataset.campo).textContent = d[t.dataset.campo]; $("e-contraste").innerHTML = htmlContraste(d); }
  aplicar(d);
}
function cliqueEditor(e) {
  const t = e.target, d = editando.rascunho;
  const f = t.closest("[data-fonte]");
  if (f) { d.fonte = f.dataset.fonte; document.querySelectorAll("[data-fonte]").forEach((b) => { const on = b === f; b.classList.toggle("on", on); b.setAttribute("aria-pressed", on); }); aplicar(d); return; }
  if (t.closest("[data-voltar]")) { editando = null; aplicarTema(); renderTemas(); return; }
  if (t.closest("[data-salvar]")) {
    const novo = validarTema({ ...d, nome: (d.nome || "").trim() || "Meu tema" });
    if (editando.id) { const i = meusTemas.findIndex((x) => x.id === editando.id); novo.id = editando.id; meusTemas[i] = novo; }
    else { novo.id = uid("t"); meusTemas.push(novo); }
    salvarTemas(); cfg.tema = novo.id; editando = null; aplicarTema(); renderTemas(); toast("Tema salvo");
    return;
  }
  if (t.closest("[data-apagar]")) {
    const id = editando.id;
    confirmar("Apagar tema?", `"${d.nome}" será apagado deste aparelho.`, "Apagar", () => {
      meusTemas = meusTemas.filter((x) => x.id !== id); salvarTemas();
      if (cfg.tema === id) cfg.tema = escuro(d) ? "escuro" : "claro";
      editando = null; aplicarTema(); renderTemas(); toast("Tema apagado");
    });
  }
}

/* ===================== Navegação ===================== */
const TELAS = [["biblioteca", "Biblioteca", "lib"], ["tocando", "Tocando", "now"], ["playlists", "Playlists", "pls"], ["temas", "Temas", "thm"]];
$("nav").innerHTML = TELAS.map((v) => `<button data-v="${v[0]}">${ico(v[2])}<span>${v[1]}</span></button>`).join("");
function ir(v) {
  if (!TELAS.some((x) => x[0] === v)) v = "biblioteca";
  $("app").dataset.view = v;
  document.querySelectorAll(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
  document.querySelectorAll("nav button").forEach((b) => { const on = b.dataset.v === v; b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  $("main").scrollTop = 0;
  if (location.hash.slice(1) !== v) try { history.replaceState(null, "", "#" + v); } catch (e) { /* ignora */ }
}
$("nav").addEventListener("click", (e) => {
  const b = e.target.closest("[data-v]"); if (!b) return;
  const v = b.dataset.v;
  if ($("app").dataset.view === v) { // tocar de novo na aba atual volta ao início dela
    if (v === "biblioteca" && aberto) { aberto = null; renderBib(); }
    if (v === "playlists" && plAberta) { plAberta = null; renderPl(); }
    if (v === "temas" && editando) { editando = null; aplicarTema(); renderTemas(); }
  }
  ir(v);
});
addEventListener("hashchange", () => ir(location.hash.slice(1)));

/* ===================== Controles ===================== */
$("seek").addEventListener("input", () => { arrastandoSeek = true; const x = cur(); if (x) $("cur").textContent = fmt(($("seek").value / 1000) * x.d); });
$("seek").addEventListener("change", (e) => { arrastandoSeek = false; const x = cur(); if (x) buscarSeg((e.target.value / 1000) * x.d); });
$("b-play").addEventListener("click", alternar);
$("mini-play").addEventListener("click", alternar);
$("b-next").addEventListener("click", proxima);
$("mini-next").addEventListener("click", proxima);
$("b-prev").addEventListener("click", anterior);
$("b-shuf").addEventListener("click", alternarAleatorio);
$("b-rep").addEventListener("click", alternarRepetir);
$("mini-open").addEventListener("click", () => ir("tocando"));
$("b-shuf").innerHTML = ico("shuf"); $("b-prev").innerHTML = ico("prev", 28); $("b-next").innerHTML = ico("next", 28); $("mini-next").innerHTML = ico("next", 22);

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && folha) return fecharFolha();
  const alvo = e.target, tag = alvo.tagName;
  if (folha || e.ctrlKey || e.metaKey || e.altKey || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || alvo.isContentEditable) return;
  if (e.key === " " && tag !== "BUTTON") { e.preventDefault(); alternar(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); buscarSeg(posAtual() + 5); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); buscarSeg(posAtual() - 5); }
  else if (e.key === "n" || e.key === "N") proxima();
  else if (e.key === "p" || e.key === "P") anterior();
});

/* Arrastar arquivos e pastas para a janela (PC) */
let arrastos = 0;
const temArquivos = (e) => e.dataTransfer && [...e.dataTransfer.types].includes("Files");
addEventListener("dragenter", (e) => { if (!temArquivos(e)) return; e.preventDefault(); arrastos++; $("drop").hidden = false; });
addEventListener("dragover", (e) => { if (temArquivos(e)) e.preventDefault(); });
addEventListener("dragleave", () => { arrastos = Math.max(0, arrastos - 1); if (!arrastos) $("drop").hidden = true; });
addEventListener("drop", async (e) => {
  if (!temArquivos(e)) return;
  e.preventDefault(); arrastos = 0; $("drop").hidden = true;
  importar(await arquivosDoDrop(e.dataTransfer));
});

/* ===================== Início ===================== */
aplicarTema();
ir(location.hash.slice(1) || "biblioteca");
renderBib(); renderTemas(); paint();
requestAnimationFrame(quadro);

(async function iniciar() {
  try { db = await abrirDB(); } catch (e) { db = null; }
  for (const x of await dbTodos("faixas")) {
    try { if (!x.arq) continue; montar(x); adicionarFaixa(x); } catch (e) { /* registro com defeito: ignora */ }
  }
  pls = db ? await dbTodos("playlists") : guardado.get("compasso.pls", []);
  if (!pls.length && !guardado.get("compasso.semente", false)) {
    novaPlaylist("Para focar", ["ex0", "ex2", "ex5"]);
    novaPlaylist("Para acordar", ["ex1", "ex3", "ex4"]);
  }
  guardado.set("compasso.semente", true);
  restaurarSessao();
  renderBib(); renderPl(); renderTemas(); paint();
})();

if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* sem modo offline aqui (por exemplo, dentro de outra página) */ });
}
