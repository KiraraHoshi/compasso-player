/* Orolon Player: player de música offline com temas customizáveis.
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
const plural = (n, um, varios) => `${n} ${T(n === 1 ? um : varios)}`;
const uid = (p) => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
const mb = (b) => (b >= 1e9 ? decimal((b / 1e9).toFixed(1)) + " GB" : Math.round(b / 1e6) + " MB");
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
  menos10: tr("M5.2 9.5A7.3 7.3 0 1 1 4.8 14M4.5 5v4.6h4.6") + '<text x="12" y="15.4" text-anchor="middle" font-size="6.6" font-weight="700" fill="currentColor" font-family="system-ui,sans-serif">10</text>',
  mais10: tr("M18.8 9.5A7.3 7.3 0 1 0 19.2 14M19.5 5v4.6h-4.6") + '<text x="12" y="15.4" text-anchor="middle" font-size="6.6" font-weight="700" fill="currentColor" font-family="system-ui,sans-serif">10</text>',
  play: '<path d="M8 5v14l11-7z" fill="currentColor"/>',
  pause: '<path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor"/>',
  next: '<path d="M6 5l9 7-9 7zM16 5h2.5v14H16z" fill="currentColor"/>',
  prev: '<path d="M18 5l-9 7 9 7zM5.5 5H8v14H5.5z" fill="currentColor"/>',
  shuf: tr("M3 7h3.5c5 0 5.5 10 10.5 10H20M3 17h3.5c2 0 3.2-1.6 4.3-3.5M20 7h-3c-1.4 0-2.5.8-3.4 1.9M17.5 4.5L20 7l-2.5 2.5M17.5 14.5L20 17l-2.5 2.5"),
  rep: tr("M5 12V9.5A2.5 2.5 0 017.5 7H18M19 12v2.5a2.5 2.5 0 01-2.5 2.5H6M15.5 4.5L18 7l-2.5 2.5M8.5 14.5L6 17l2.5 2.5"),
  ondas: tr("M2.5 12c1.6-3.2 3.2-3.2 4.8 0s3.2 3.2 4.8 0 3.2-3.2 4.8 0 3.2 3.2 4.8 0") + tr("M6 5.8a9 9 0 0 1 12 0M6 18.2a9 9 0 0 0 12 0"),
  carro: tr("M5 11.5l1.5-4.3A2 2 0 0 1 8.4 5.8h7.2a2 2 0 0 1 1.9 1.4l1.5 4.3M4 11.5h16v6H4zM6.5 17.5v1.7M17.5 17.5v1.7M7 14.5h.5M16.5 14.5h.5"),
  dial: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
  radio: tr("M4 9.5h16v10H4zM8 9.5l9-5") + '<circle cx="15" cy="14.5" r="2.3" fill="none" stroke="currentColor" stroke-width="1.8"/>' + tr("M6.5 13h3M6.5 16h3"),
  info: '<circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="1.8"/>' + tr("M12 11v5.5") + '<circle cx="12" cy="7.8" r="1.2" fill="currentColor"/>',
  chev: tr("M9.5 6l6 6-6 6"),
  home: tr("M4 11l8-6.5 8 6.5M6.5 9.5V19h11V9.5M10 19v-5h4v5"),
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
  heart: tr("M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.2a4.3 4.3 0 017.5 2.6C19.5 15.4 12 20 12 20z"),
  heartOn: '<path d="M12 20s-7.5-4.6-7.5-10.2A4.3 4.3 0 0112 7.2a4.3 4.3 0 017.5 2.6C19.5 15.4 12 20 12 20z" fill="currentColor"/>',
  timer: '<circle cx="12" cy="13.5" r="7.2" fill="none" stroke="currentColor" stroke-width="1.8"/>' + tr("M12 9.8v3.9l2.5 1.6M9.5 3.5h5"),
  sliders: tr("M5 7h14M5 12h14M5 17h14") + '<circle cx="9" cy="7" r="2.1" fill="currentColor"/><circle cx="15.5" cy="12" r="2.1" fill="currentColor"/><circle cx="8" cy="17" r="2.1" fill="currentColor"/>',
  user: '<circle cx="12" cy="8.5" r="3.8" fill="none" stroke="currentColor" stroke-width="1.8"/>' + tr("M4.5 20c1.2-3.8 4.2-5.6 7.5-5.6s6.3 1.8 7.5 5.6"),
  stats: tr("M5 20V11M12 20V5M19 20v-7"),
  lyrics: tr("M5 6h14M5 10.5h14M5 15h9M5 19.5h6") + '<circle cx="18" cy="17.5" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
  eyeoff: tr("M4 4l16 16M10.6 6.2A9.7 9.7 0 0112 6c5 0 8.5 4.3 9.5 6-.5.9-1.6 2.4-3.1 3.7M6.6 8C4.7 9.3 3.2 11 2.5 12c1 1.7 4.5 6 9.5 6 1.6 0 3-.4 4.3-1.1M9.9 9.9a3 3 0 004.2 4.2"),
  image: '<rect x="3.5" y="5" width="17" height="14" rx="2" fill="none" stroke="currentColor" stroke-width="1.8"/>' + tr("M3.5 16l5-5 4 4 3-3 5 5") + '<circle cx="15.5" cy="9.5" r="1.6" fill="currentColor"/>',
  expand: tr("M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"),
  vol: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' + tr("M15.5 9a4 4 0 010 6M18 6.5a7.5 7.5 0 010 11"),
  vol1: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' + tr("M15.5 9a4 4 0 010 6"),
  vol0: '<path d="M4 9.5h3.5L12 5.5v13l-4.5-4H4z" fill="currentColor"/>' + tr("M16 9.5l5 5M21 9.5l-5 5"),
  note: tr("M9 17V6l10-2v11") + '<circle cx="6.8" cy="17" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/><circle cx="16.8" cy="15" r="2.2" fill="none" stroke="currentColor" stroke-width="1.8"/>',
};
/* App Android (Capacitor): esconde o que só faz sentido no navegador e liga os controles de mídia nativos */
const NATIVO = !!(window.Capacitor && window.Capacitor.isNativePlatform && window.Capacitor.isNativePlatform());
// os plugins nativos podem estar em Capacitor.Plugins ou precisar ser registrados por nome (depende da versão)
const pegarPlugin = (n) => { if (!NATIVO) return null; try { const P = window.Capacitor.Plugins; if (P && P[n]) return P[n]; if (window.Capacitor.registerPlugin) return window.Capacitor.registerPlugin(n); } catch (e) { /* sem o plugin */ } return null; };
const PLUG = { MediaSession: pegarPlugin("MediaSession"), SystemBars: pegarPlugin("SystemBars"), App: pegarPlugin("App"), Musicas: pegarPlugin("Musicas") };
if (NATIVO) document.documentElement.classList.add("nativo");
// Chamadas para o lado nativo nunca podem derrubar o app: algumas devolvem promessa, outras um código, outras falham na hora
function nat(f) { try { const r = f(); if (r && typeof r.catch === "function") r.catch(() => {}); return r; } catch (e) { return null; } }
// No app de teste, um erro aparece na tela em vez de deixar tudo em branco
if (NATIVO) addEventListener("error", (e) => {
  try { const d = document.createElement("div"); d.style.cssText = "position:fixed;left:8px;right:8px;bottom:90px;z-index:99;background:#B3261E;color:#fff;padding:10px 12px;border-radius:12px;font:12px/1.4 monospace"; d.textContent = "Erro: " + (e.message || e) + " (" + (e.filename || "").split("/").pop() + ":" + (e.lineno || "") + ")"; document.body.append(d); setTimeout(() => d.remove(), 12000); } catch (x) { /* sem tela ainda */ }
});
const ico = (n, s = 24) => `<svg width="${s}" height="${s}" viewBox="0 0 24 24" aria-hidden="true">${I[n]}</svg>`;
const eqIcone = () => '<span class="eq" aria-hidden="true"><i></i><i></i><i></i></span>';

/* ===================== Ajustes e temas ===================== */
const cfg = Object.assign(
  { tema: null, ajustes: {}, amb: true, ambF: 0.7, reage: true, batF: 0.7, exemplos: true, ord: "recentes", fade: true, tela: false, anterior: "reiniciar", autoTocar: false, tocarFone: false, pausarFone: true, vol: 0.8, amp: 1, reverb: "nenhum", largura: 1, apGraves: 0, apAgudos: 0, apInt: 0, mudo: false, coracoes: true, aura: true, era: "off", eraRuido: true, visual: "relogio", xfade: 0, vel: 1, nivelar: false, corCapa: true, formaCapa: "quadrada", ledCor: "arte" },
  guardado.get("compasso.cfg", {})
);
const salvarCfg = () => guardado.set("compasso.cfg", cfg);
if (cfg.padroes19 !== 1) { cfg.corCapa = true; cfg.formaCapa = "quadrada"; cfg.padroes19 = 1; salvarCfg(); } // novos padrões da 1.9.4

const FONTES = {
  padrao: { n: T("Orolon"), d: '"Bricolage Grotesque","Trebuchet MS",system-ui,sans-serif', b: '"Figtree",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' },
  sistema: { n: T("Do sistema"), d: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif', b: 'system-ui,-apple-system,"Segoe UI",Roboto,sans-serif' },
  serifada: { n: T("Serifada"), d: 'Georgia,"Times New Roman",serif', b: 'Georgia,"Times New Roman",serif' },
  mono: { n: T("Mono"), d: 'ui-monospace,"Cascadia Mono",Consolas,monospace', b: 'ui-monospace,"Cascadia Mono",Consolas,monospace' },
};
const BASE = {
  claro: { id: "claro", nome: T("Orologia Claro"), fundo: "#F1EFF6", card: "#FFFFFF", texto: "#1D1830", suave: "#6B6580", destaque: "#6A4BD8", secundaria: "#A8743A", raio: 16, fonte: "padrao", fixo: true },
  escuro: { id: "escuro", nome: T("Orologia Escuro"), fundo: "#14111F", card: "#1E1A2E", texto: "#EFEAF7", suave: "#9A93B0", destaque: "#A98BFF", secundaria: "#D2A067", raio: 16, fonte: "padrao", fixo: true },
};
const CAMPOS = [["fundo", T("Fundo")], ["card", T("Cartões")], ["texto", T("Texto")], ["suave", T("Texto suave")], ["destaque", T("Destaque")], ["secundaria", T("Secundária")]];
const DESTAQUES = {
  claro: [[T("Violeta"), "#6A4BD8"], [T("Bronze"), "#A8743A"], [T("Fogo"), "#D2571B"], [T("Ciano"), "#0E8AA8"], [T("Folha"), "#4E8A1E"], [T("Carmesim"), "#C22D52"]],
  escuro: [[T("Violeta"), "#A98BFF"], [T("Bronze"), "#D2A067"], [T("Fogo"), "#F2925A"], [T("Ciano"), "#5CCBE6"], [T("Folha"), "#A6D15C"], [T("Carmesim"), "#F0708F"]],
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

let corViz = "#6A4BD8", tinta = "#6A4BD8";
/* Cor dos visuais: a do tema ou, com a opção ligada, uma cor tirada da capa (ajustada para dar contraste) */
function paraRgb(s) {
  s = String(s || "").trim(); let m;
  if ((m = s.match(/^#([0-9a-f]{6})$/i))) return [0, 2, 4].map((i) => parseInt(m[1].substr(i, 2), 16));
  if ((m = s.match(/^rgb\(\s*(\d+)\D+(\d+)\D+(\d+)/i))) return [+m[1], +m[2], +m[3]];
  if ((m = s.match(/^hsl\(\s*([\d.]+)\D+([\d.]+)%\D+([\d.]+)%/i))) return hslRgb(+m[1] / 360, +m[2] / 100, +m[3] / 100);
  return null;
}
function rgbHsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255; const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; let h = 0, s = 0;
  if (mx !== mn) { const d = mx - mn; s = l > 0.5 ? d / (2 - mx - mn) : d / (mx + mn); h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; h /= 6; }
  return [h, s, l];
}
function hslRgb(h, s, l) {
  const f = (n) => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)))); };
  return [f(0), f(8), f(4)];
}
const hex = (rgb) => "#" + rgb.map((v) => v.toString(16).padStart(2, "0")).join("");
const ajustarL = (hsl, t, s0 = 0.5) => { const e = escuro(t), l = e ? Math.min(0.78, Math.max(0.6, hsl[2])) : Math.min(0.48, Math.max(0.32, hsl[2])); return hex(hslRgb(hsl[0], Math.max(s0, hsl[1]), l)); };
const NEUTRO = (t) => (escuro(t) ? ["#E4E4EA", "#8E8E9A"] : ["#2C2C33", "#74747E"]); // capa em preto e branco: prata ou grafite
/* As duas cores que mais aparecem na capa (contando só as que têm cor de verdade). Fica guardado por música. */
async function paletaDaCapa(x, t) {
  if (x._paleta) return x._paleta;
  let res = null;
  if (x.capaBlob) try {
    const bm = await createImageBitmap(x.capaBlob), cv = document.createElement("canvas"); cv.width = cv.height = 32;
    const g = cv.getContext("2d"); g.drawImage(bm, 0, 0, 32, 32);
    const d = g.getImageData(0, 0, 32, 32).data, baldes = Array.from({ length: 12 }, () => ({ p: 0, r: 0, g: 0, b: 0, n: 0 }));
    for (let i = 0; i < d.length; i += 4) {
      const hsl = rgbHsl([d[i], d[i + 1], d[i + 2]]); if (hsl[1] < 0.22 || hsl[2] < 0.12 || hsl[2] > 0.92) continue;
      const bk = baldes[Math.floor(hsl[0] * 12) % 12]; bk.p += hsl[1]; bk.r += d[i]; bk.g += d[i + 1]; bk.b += d[i + 2]; bk.n++;
    }
    const top = baldes.filter((q) => q.n).sort((a, b) => b.p - a.p);
    if (!top.length || top[0].p < 1024 * 0.035) res = { neutro: true };
    else {
      const med = (q) => rgbHsl([q.r / q.n, q.g / q.n, q.b / q.n].map(Math.round));
      const h1 = med(top[0]), h2 = top[1] && top[1].p > top[0].p * 0.25 ? med(top[1]) : [(h1[0] + 0.07) % 1, h1[1], h1[2] + (escuro(t) ? 0.12 : -0.1)];
      res = { h1, h2 };
    }
  } catch (e) { res = null; }
  if (!res) { // sem capa: usa as cores do tema (capa padrão); não guarda, porque muda junto com o tema
    const cs = coresDe(x).map(paraRgb).filter(Boolean).map(rgbHsl);
    return cs.length ? { h1: cs[0], h2: cs[1] || cs[0] } : { neutro: true };
  }
  x._paleta = res; return res;
}
let corViz2 = null;
async function atualizarCorViz(t) {
  t = t || temaAtual();
  let x = null; try { x = cfg.corCapa ? cur() : null; } catch (e) { /* ainda carregando */ }
  corViz = t.destaque; corViz2 = null;
  if (x) {
    const p = await paletaDaCapa(x, t); if (cur() !== x || !cfg.corCapa) return;
    if (p.neutro) [corViz, corViz2] = NEUTRO(t); else { corViz = ajustarL(p.h1, t); corViz2 = ajustarL(p.h2, t, 0.4); }
  }
  document.documentElement.style.setProperty("--viz", corViz);
}
function aplicar(t) {
  atualizarCorViz(t);
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
  if (PLUG.SystemBars) nat(() => PLUG.SystemBars.setStyle({ style: e ? "DARK" : "LIGHT" })); // ícones claros no tema escuro e vice-versa
}
function aplicarEfeitos() {
  const r = document.documentElement.style;
  r.setProperty("--ambk", cfg.amb ? cfg.ambF : 0);
  r.setProperty("--beatk", cfg.reage ? cfg.batF : 0);
}
let coresAplicadas = "";
const aplicarTema = () => {
  const t = temaAtual(); aplicar(t); salvarCfg();
  const chave = t.destaque + t.secundaria + t.fundo;
  if (chave === coresAplicadas) return; // só os cantos ou a fonte mudaram: as capas continuam iguais
  coresAplicadas = chave;
  if (typeof renderBib !== "function" || !faixas.length) return; // ainda carregando
  renderBib(); renderPl(); paint();
  const x = cur(); if (x && !temCapa(x)) { luz(coresDe(x)); ledId = null; if (cfg.visual === "led") prepararLed(x); }
};

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
const pastaFora = (x) => !!(x && x.mid && (cfg.pastasFora || []).includes(x.pasta || ""));
const visivel = (x) => x && !x.oculta && !pastaFora(x) && (!x.demo || cfg.exemplos);
const vis = () => faixas.filter(visivel);
const importadas = () => faixas.filter((x) => !x.demo);
function adicionarFaixa(x) { faixas.push(x); porId.set(x.id, x); }

const grad = (c) => `linear-gradient(140deg,${c[0]},${c[1]})`;
/* Capa padrão (música sem capa): degradê nas cores do tema em uso, com uma variação pequena e fixa por música.
   Calculada na hora de desenhar; o x.c salvo não muda, então trocar de tema não mexe nos dados. */
function coresPadrao(chave) {
  const t = temaAtual(); let h = 0;
  for (const ch of String(chave || "")) h = (h * 31 + ch.charCodeAt(0)) % 100003;
  const dh = ((h % 25) - 12) / 360, dl = ((Math.floor(h / 25) % 13) - 6) / 100; // até ±12° de matiz e ±6% de luz
  const tom = (cor, mais) => {
    const [H, S, L] = rgbHsl(paraRgb(cor) || [128, 128, 128]);
    let l = Math.min(0.6, Math.max(0.3, L + dl + mais)), c = hex(hslRgb((H + dh + 1) % 1, Math.max(0.35, S), l));
    while (lum(c) > 0.55 && l > 0.1) { l -= 0.04; c = hex(hslRgb((H + dh + 1) % 1, Math.max(0.35, S), l)); } // o símbolo branco precisa aparecer
    return c;
  };
  return [tom(t.destaque, 0), tom(t.secundaria, 0.04)];
}
const temCapa = (x) => !!(x && (x.cover || x.capaBlob));
const coresDe = (x) => (temCapa(x) ? x.c : coresPadrao((x.a || "") + (x.al || "") + (x.t || "")));
const fundoDe = (x) => (x.cover ? `url('${x.cover}') center/cover` : grad(coresDe(x)));
const inicial = (s) => esc((String(s || "?").trim()[0] || "?").toUpperCase());
/* Símbolo do Orolon ("O tocando": anel que é barra de progresso, com equalizador no centro), em branco por cima
   do degradê nas cores do tema: usado quando a música não tem capa. É o mesmo desenho de icons/orolon.svg. */
const MARCA = (() => {
  const f = (v) => v.toFixed(1), fim = 1.55 * Math.PI, ex = 50 + Math.sin(fim) * 30, ey = 50 - Math.cos(fim) * 30;
  const barras = [[42, 12], [50, 20], [58, 14]].map(([x, h]) => `<rect x="${x - 2.6}" y="${50 - h / 2}" width="5.2" height="${h}" rx="2.6"/>`).join("");
  return `<svg class="marca" viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="30" fill="none" stroke="#fff" stroke-opacity=".3" stroke-width="13"/><path d="M50 20 A30 30 0 1 1 ${f(ex)} ${f(ey)}" fill="none" stroke="#fff" stroke-width="13" stroke-linecap="round"/><circle cx="${f(ex)}" cy="${f(ey)}" r="7" fill="#fff"/><g fill="#fff">${barras}</g></svg>`;
})();
const capa = (x, cls = "thumb") => `<span class="${cls}" style="background:${fundoDe(x)}">${x.cover ? "" : MARCA}</span>`;
const semArtista = (a) => desconhecido(a) || a === T("Artista desconhecido") || a === "Artista desconhecido";
const artistaDe = (x) => (semArtista(x.a) && x.pasta ? ultimaPasta(x.pasta) : desconhecido(x.a) ? T("Artista desconhecido") : x.a);
const linha2 = (x) => artistaDe(x) + (x.al ? " · " + x.al : "");
/* Formato sem perdas (FLAC, WAV, AIFF): ganha a etiqueta no app */
function semPerdas(x) {
  if (!x || x.demo) return "";
  const nome = (x.arq && x.arq.name) || (x.sig || "").split("|")[0] || "", tipo = (x.arq && x.arq.type) || x.tipo || "";
  if (/\.flac$/i.test(nome) || /flac/i.test(tipo)) return "FLAC";
  if (/\.wav$/i.test(nome) || /wav/i.test(tipo)) return "WAV";
  if (/\.aiff?$/i.test(nome) || /aiff/i.test(tipo)) return "AIFF";
  return "";
}
const duracaoTotal = (lista) => lista.reduce((s, x) => s + (x.d || 0), 0);
function coresDoNome(s) {
  let h = 0; for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return [`hsl(${h} 62% 52%)`, `hsl(${(h + 48) % 360} 68% 60%)`];
}
/* Capas tiradas de vídeo (miniatura do YouTube): corta as faixas pretas e, se sobrar um retângulo,
   fica com o quadrado do meio, onde normalmente está a arte do álbum. Devolve null se a capa já está boa. */
async function cortarCapa(blob) {
  try {
    const bm = await createImageBitmap(blob), W0 = bm.width, H0 = bm.height;
    if (!W0 || !H0) return null;
    const esc = Math.min(1, 160 / Math.max(W0, H0)), w = Math.max(1, Math.round(W0 * esc)), h = Math.max(1, Math.round(H0 * esc));
    const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
    const c = cv.getContext("2d"); c.drawImage(bm, 0, 0, w, h);
    const d = c.getImageData(0, 0, w, h).data;
    const px = (x, y) => { const i = (y * w + x) * 4; return d[i] * 0.3 + d[i + 1] * 0.59 + d[i + 2] * 0.11; };
    const faixaVazia = (vals) => { let s = 0, mx = 0; for (const v of vals) { s += v; mx = Math.max(mx, v); } return s / vals.length < 22 && mx < 60; };
    const linha = (y) => Array.from({ length: w }, (_, x) => px(x, y)), coluna = (x) => Array.from({ length: h }, (_, y) => px(x, y));
    let t = 0, b = h - 1, l = 0, r = w - 1;
    while (t < h / 3 && faixaVazia(linha(t))) t++;
    while (b > (h * 2) / 3 && faixaVazia(linha(b))) b--;
    while (l < w / 3 && faixaVazia(coluna(l))) l++;
    while (r > (w * 2) / 3 && faixaVazia(coluna(r))) r--;
    let x0 = l / esc, y0 = t / esc, cw = (r - l + 1) / esc, ch = (b - t + 1) / esc;
    if (cw / ch > 1.12) { x0 += (cw - ch) / 2; cw = ch; } // mais larga que alta: o quadrado do meio
    else if (ch / cw > 1.12) { y0 += (ch - cw) / 2; ch = cw; }
    if (x0 < 2 && y0 < 2 && Math.abs(cw - W0) < 3 && Math.abs(ch - H0) < 3) return null; // já era quadrada e sem faixas
    const lado = Math.min(640, Math.round(Math.min(cw, ch))), out = document.createElement("canvas");
    out.width = out.height = lado;
    out.getContext("2d").drawImage(bm, x0, y0, cw, ch, 0, 0, lado, lado);
    return await new Promise((ok) => out.toBlob((bl) => ok(bl), "image/jpeg", 0.9));
  } catch (e) { return null; }
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
const salvarFaixa = (x) => dbPut("faixas", { id: x.id, t: x.t, a: x.a, al: x.al, n: x.n, d: x.d, c: x.c, arq: x.arq, uri: x.uri, mid: x.mid, orig: x.orig, doc: x.doc, alId: x.alId, tipo: x.tipo, capaBlob: x.capaBlob, sig: x.sig, em: x.em, letra: x.letra || "", pasta: x.pasta || "", oculta: !!x.oculta });
function montar(x) { x.url = x.uri ? window.Capacitor.convertFileSrc(x.uri) : URL.createObjectURL(x.arq); if (x.capaBlob) x.cover = URL.createObjectURL(x.capaBlob); }

/* ---- Importar ---- */
const EXT = /\.(mp3|flac|m4a|aac|ogg|oga|opus|wav|aif|aiff|webm|mp4|m4v|mov)$/i;
const EXT_VIDEO = /\.(mp4|m4v|mov|webm)$/i;
// vídeos entram como música: o app toca só o áudio deles
const ehAudio = (f) => f && ((f.type && (f.type.startsWith("audio/") || /^video\/(mp4|webm|quicktime)$/.test(f.type))) || EXT.test(f.name));
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
const pastaDe = (f) => f._pasta || (f.webkitRelativePath ? f.webkitRelativePath.split("/").slice(0, -1).join("/") : "");
const semExt = (n) => n.replace(/\.[^.]+$/, "").toLowerCase();
async function importar(lista) {
  const todos = [...lista].filter(Boolean), fs = todos.filter(ehAudio);
  const letras = new Map(todos.filter((f) => /\.(lrc|txt)$/i.test(f.name)).map((f) => [semExt(f.name), f]));
  if (!fs.length && letras.size) { // só letras: liga cada uma à música com o mesmo nome
    let n = 0;
    for (const x of importadas()) {
      const f = letras.get(semExt((x.sig || "").split("|")[0] || ""));
      if (f && f.size < 512000) { x.letra = (await f.text()).trim(); salvarFaixa(x); n++; }
    }
    if (modoLetra) renderLetra();
    toast(n ? plural(n, "letra adicionada", "letras adicionadas") : T("Nenhuma música com o mesmo nome dessas letras"));
    return;
  }
  if (!fs.length) { toast(T("Nenhum arquivo de áudio encontrado")); return; }
  if (importando) { toast(T("Espere a importação atual terminar")); return; }
  importando = true;
  let novas = 0, repetidas = 0, k = 0;
  const sigs = new Set(importadas().map((x) => x.sig));
  for (const f of fs) {
    k++;
    $("count").textContent = T("Importando {0} de {1}…", k, fs.length);
    const sig = f.name + "|" + f.size + "|" + f.lastModified;
    if (sigs.has(sig)) { repetidas++; continue; }
    sigs.add(sig);
    const nome = f.name.replace(/\.[^.]+$/, ""), partes = nome.split(" - "), m = await lerTags(f);
    const x = {
      id: uid("f"), sig, em: Date.now(), arq: f, capaBlob: (m.capa && (await cortarCapa(m.capa))) || m.capa || null, n: m.n || 0, d: 0, al: m.al || "",
      t: m.t || (partes.length > 1 ? partes.slice(1).join(" - ") : partes[0]).trim() || T("Sem título"),
      a: m.a || (partes.length > 1 ? partes[0].trim() : T("Artista desconhecido")),
      letra: m.letra || "", pasta: pastaDe(f),
    };
    const lf = letras.get(semExt(f.name));
    if (lf && lf.size < 512000) try { x.letra = (await lf.text()).trim(); } catch (e) { /* letra ilegível: ignora */ }
    montar(x);
    x.c = (x.capaBlob && (await coresDaCapa(x.capaBlob))) || coresDoNome(x.a + x.al + nome);
    x.d = await lerDuracao(x.url);
    adicionarFaixa(x); salvarFaixa(x); novas++;
    if (k % 8 === 0) renderBib();
  }
  importando = false;
  renderBib(); renderPl();
  if (!queue.length) filaPadrao();
  let semEx = "";
  if (novas && cfg.exemplos && !cfg.exemplosMexeu) { // primeira importação: as músicas de exemplo saem de cena
    cfg.exemplos = false; cfg.exemplosMexeu = true; salvarCfg(); mudouExemplos();
    semEx = T(". Os exemplos foram escondidos");
  }
  if (novas) {
    toast(plural(novas, "música importada", "músicas importadas") + semEx + (repetidas ? T(repetidas > 1 ? ", {0} já estavam na biblioteca" : ", {0} já estava na biblioteca", repetidas) : ""),
      [T("Ver"), () => { plAberta = "auto:novas"; ir("playlists"); renderPl(); }]);
    if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(() => {});
  } else toast(repetidas ? T("Essas músicas já estavam na biblioteca") : T("Não deu para importar esses arquivos"));
}
/* ---- Músicas do aparelho (app Android) ----
   Lê a biblioteca de mídia do Android, a mesma do atalho "Áudio" do seletor de arquivos e dos outros players.
   Nada é copiado: o app guarda só o endereço e toca direto do arquivo. Tudo continua offline. */
const MUS = PLUG.Musicas;
const OCULTAR_PASTA = /whatsapp|telegram|voice ?notes?|recordings?|grava[cç]|chamada|call ?rec|notifica|ringtone|alarm/i;
let procurando = false;
const desconhecido = (v) => !v || /^<unknown>$/i.test(v);
const ultimaPasta = (p) => String(p || "").replace(/\/+$/, "").split("/").pop();
const albumDe = (al, pasta) => (desconhecido(al) || al.trim().toLowerCase() === ultimaPasta(pasta).toLowerCase() ? "" : al.trim());
const chaveArq = (nome, tam) => (nome || "") + "|" + (tam || 0);
function b64Blob(b64) { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: "image/jpeg" }); }
async function procurarNoAparelho(manual) {
  if (!MUS || procurando || importando) return;
  let st = { estado: "denied" };
  try { st = await MUS.permissao(); } catch (e) { /* plugin indisponível */ }
  if (st.estado !== "granted") {
    if (!manual) return;
    try { st = await MUS.pedir(); } catch (e) { st = { estado: "denied" }; }
    if (st.estado !== "granted") { toast(T("Sem permissão para ler as músicas. Libere em Configurações do Android › Apps › Orolon › Permissões › Músicas e áudio.")); return; }
  }
  procurando = true;
  if (manual) $("count").textContent = T("Procurando músicas no aparelho…");
  let lista = [];
  try { lista = ((await MUS.listar()) || {}).musicas || []; }
  catch (e) { procurando = false; renderBib(); if (manual) toast(T("Não deu para ler as músicas do aparelho")); return; }
  const primeira = !cfg.aparelho;
  cfg.aparelho = true;
  // pastas de áudio de conversa e gravações começam desligadas (dá para ligar em Ajustes › Reprodução e biblioteca › Pastas do aparelho)
  const vistas = new Set(cfg.pastasVistas || []), fora = new Set(cfg.pastasFora || []);
  for (const m of lista) { const p = m.pasta || ""; if (!vistas.has(p)) { vistas.add(p); if (OCULTAR_PASTA.test(p)) fora.add(p); } }
  cfg.pastasVistas = [...vistas]; cfg.pastasFora = [...fora]; salvarCfg();
  const ignoradas = new Set(cfg.ignoradas || []);
  const doAparelho = new Map(importadas().filter((x) => x.mid && x.mid[0] === "m").map((x) => [x.mid, x]));
  const copias = new Set(importadas().filter((x) => !x.mid || x.mid[0] !== "m").map((x) => (x.sig || "").split("|").slice(0, 2).join("|")));
  const achadas = new Set(), novasFaixas = [];
  for (const m of lista) {
    const mid = "m" + m.id; achadas.add(mid);
    const ja = doAparelho.get(mid);
    if (ja) { if (ja.uri !== m.uri) { ja.uri = m.uri; montar(ja); salvarFaixa(ja); } continue; }
    if (ignoradas.has(mid) || copias.has((m.nome || "") + "|" + m.tamanho)) continue; // removida pela pessoa ou já importada como cópia
    const base = (m.nome || "").replace(/\.[^.]+$/, ""), partes = base.split(" - ");
    const x = {
      id: uid("f"), mid, uri: m.uri, alId: m.albumId ? "a" + m.albumId : "", tipo: m.mime || "",
      sig: (m.nome || "") + "|" + m.tamanho + "|" + (m.modificado || 0) * 1000, em: Date.now(),
      t: (!desconhecido(m.titulo) ? m.titulo : (partes.length > 1 ? partes.slice(1).join(" - ") : partes[0])).trim() || T("Sem título"),
      a: !desconhecido(m.artista) ? m.artista : (partes.length > 1 ? partes[0].trim() : T("Artista desconhecido")),
      al: albumDe(m.album, m.pasta), n: (m.faixa || 0) % 1000, d: (m.duracao || 0) / 1000, letra: "", pasta: m.pasta || "", capaBlob: null,
    };
    x.c = coresDoNome(x.a + x.al + base);
    montar(x); adicionarFaixa(x); salvarFaixa(x); novasFaixas.push(x);
  }
  let sumiram = 0;
  for (const [mid, x] of doAparelho) if (!achadas.has(mid)) { removerFaixa(x.id, true); sumiram++; }
  procurando = false;
  renderBib(); renderPl();
  if (!queue.length || (queue.every((id) => (porId.get(id) || {}).demo) && novasFaixas.length)) filaPadrao();
  if (novasFaixas.length && cfg.exemplos && !cfg.exemplosMexeu) { cfg.exemplos = false; cfg.exemplosMexeu = true; salvarCfg(); mudouExemplos(); }
  if (manual || novasFaixas.length || sumiram) {
    const partesMsg = [];
    if (novasFaixas.length) partesMsg.push(plural(novasFaixas.length, "música nova encontrada", "músicas novas encontradas"));
    if (sumiram) partesMsg.push(plural(sumiram, "música saiu porque não está mais no aparelho", "músicas saíram porque não estão mais no aparelho"));
    toast(partesMsg.length ? partesMsg.join(". ") : (lista.length ? T("Nenhuma música nova") : T("Nenhuma música encontrada no aparelho")),
      novasFaixas.length ? [T("Ver"), () => { plAberta = "auto:novas"; ir("playlists"); renderPl(); }] : undefined);
  }
  if (primeira && fora.size && novasFaixas.length) setTimeout(() => toast(T("Algumas pastas de áudios de conversa e gravações ficaram de fora. Mude em Ajustes › Reprodução e biblioteca › Pastas do aparelho.")), 4200);
  let refazer = novasFaixas;
  if (cfg.apVer !== 2) { // 1.17.0 dava a mesma capa a músicas sem álbum da mesma pasta: corrige uma vez
    cfg.apVer = 2; salvarCfg();
    for (const x of doAparelho.values()) if (porId.has(x.id)) { const al = albumDe(x.al, x.pasta); if (al !== x.al) { x.al = al; } x.capaBlob = null; x.cover = null; x.c = coresDoNome(x.a + x.al + x.t); salvarFaixa(x); }
    refazer = [...doAparelho.values()].filter((x) => porId.has(x.id)).concat(novasFaixas);
    renderBib();
  }
  await procurarNasPastas();
  if (refazer.length) capasDoAparelho(refazer);
}
async function capasDoAparelho(lista) {
  const grupos = new Map();
  for (const x of lista) { const k = x.al && x.alId ? x.alId : x.mid; if (!grupos.has(k)) grupos.set(k, []); grupos.get(k).push(x); } // só agrupa álbuns de verdade
  let n = 0;
  for (const g of grupos.values()) {
    let b64 = null;
    try { b64 = ((await MUS.capa({ uri: g[0].uri, tamanho: 512 })) || {}).base64; } catch (e) { /* sem capa */ }
    if (!b64) continue;
    try {
      const bruto = b64Blob(b64), capaBlob = (await cortarCapa(bruto)) || bruto, c = await coresDaCapa(capaBlob);
      for (const x of g) { if (!porId.has(x.id)) continue; x.capaBlob = capaBlob; x.cover = URL.createObjectURL(capaBlob); if (c) x.c = c; salvarFaixa(x); }
    } catch (e) { /* capa ilegível */ }
    if (++n % 12 === 0) { renderBib(); paint(); }
  }
  renderBib(); renderPl(); paint();
}
/* ---- Pastas escolhidas pela pessoa ---- */
async function escolherPastaAparelho() {
  if (!MUS || !MUS.escolherPasta) return;
  let r; try { r = await MUS.escolherPasta(); } catch (e) { toast(T("Não deu para abrir as pastas do aparelho")); return; }
  if (!r || r.cancelado || !r.uri) return;
  const ps = cfg.pastasEscolhidas || [];
  if (!ps.some((p) => p.uri === r.uri)) { ps.push({ uri: r.uri, nome: r.nome || T("Pasta") }); cfg.pastasEscolhidas = ps; salvarCfg(); }
  await procurarNasPastas(true, r.uri);
}
async function procurarNasPastas(manual, so) {
  if (!MUS || !MUS.listarPasta) return;
  const ps = (cfg.pastasEscolhidas || []).filter((p) => !so || p.uri === so);
  const ignoradas = new Set(cfg.ignoradas || []);
  let novas = [], sumiram = 0, semAcesso = [];
  for (const p of ps) {
    const daPasta = importadas().filter((x) => x.orig === p.uri);
    let lista;
    try { if (manual) $("count").textContent = T("Procurando músicas em {0}…", p.nome); lista = ((await MUS.listarPasta({ uri: p.uri, conhecidos: daPasta.map((x) => x.doc) })) || {}).musicas || []; }
    catch (e) { semAcesso.push(p.nome); continue; }
    const porDoc = new Map(daPasta.map((x) => [x.doc, x])), achados = new Set();
    const outras = new Set(importadas().filter((x) => x.orig !== p.uri).map((x) => (x.sig || "").split("|").slice(0, 2).join("|")));
    for (const m of lista) {
      achados.add(m.doc);
      const ja = porDoc.get(m.doc);
      if (ja) { if (ja.uri !== m.uri) { ja.uri = m.uri; montar(ja); salvarFaixa(ja); } continue; }
      const mid = "d" + (m.mediaId || m.doc);
      if (ignoradas.has(mid) || outras.has(chaveArq(m.nome, m.tamanho))) continue; // removida pela pessoa ou já está na biblioteca
      const base = (m.nome || "").replace(/\.[^.]+$/, ""), partes = base.split(" - "), pasta = (p.nome + "/" + (m.pasta || "")).replace(/\/+$/, "/");
      const x = {
        id: uid("f"), mid, uri: m.uri, doc: m.doc, orig: p.uri, alId: "", tipo: m.mime || "",
        sig: chaveArq(m.nome, m.tamanho) + "|" + (m.modificado || 0) * 1000, em: Date.now(),
        t: (!desconhecido(m.titulo) ? m.titulo : (partes.length > 1 ? partes.slice(1).join(" - ") : partes[0])).trim() || T("Sem título"),
        a: !desconhecido(m.artista) ? m.artista : (partes.length > 1 ? partes[0].trim() : T("Artista desconhecido")),
        al: albumDe(m.album, pasta), n: m.faixa || 0, d: (m.duracao || 0) / 1000, letra: "", pasta, capaBlob: null,
      };
      x.c = coresDoNome(x.a + x.al + base);
      montar(x); adicionarFaixa(x); salvarFaixa(x); novas.push(x);
    }
    for (const x of daPasta) if (!achados.has(x.doc)) { removerFaixa(x.id, true); sumiram++; }
  }
  if (!ps.length) return;
  renderBib(); renderPl();
  if (novas.length && (!queue.length || queue.every((id) => (porId.get(id) || {}).demo))) filaPadrao();
  if (novas.length && cfg.exemplos && !cfg.exemplosMexeu) { cfg.exemplos = false; cfg.exemplosMexeu = true; salvarCfg(); mudouExemplos(); }
  if (manual || novas.length || sumiram || semAcesso.length) {
    const msg = [];
    if (novas.length) msg.push(plural(novas.length, "música nova encontrada", "músicas novas encontradas"));
    if (sumiram) msg.push(plural(sumiram, "música saiu porque não está mais no aparelho", "músicas saíram porque não estão mais no aparelho"));
    if (semAcesso.length) msg.push(T("Sem acesso a {0}. Escolha a pasta de novo em Importar.", semAcesso.join(", ")));
    if (msg.length || manual) toast(msg.length ? msg.join(". ") : T("Nenhuma música nova"));
  }
  if (novas.length) capasDoAparelho(novas);
}
function menuPastasEscolhidas() {
  const html = () => {
    const ps = cfg.pastasEscolhidas || [];
    return `<p class="note" style="padding:0 8px">${T("O Orolon procura músicas novas nestas pastas sempre que abre. Tirar uma pasta não apaga os arquivos.")}</p><div class="stack">${ps.map((p, i) => `<div class="opt"><span>${esc(p.nome)} <span class="note">· ${importadas().filter((x) => x.orig === p.uri).length}</span></span><button class="btn ghost sm" data-tirarpasta="${i}">${T("Tirar")}</button></div>`).join("") || `<p class="note">${T("Nenhuma pasta escolhida.")}</p>`}</div><div class="btns"><button class="btn sm" data-novapasta>${ico("folder", 18)}${T("Escolher uma pasta")}</button></div>`;
  };
  abrirFolha({
    titulo: T("Pastas escolhidas"), html: html(),
    clique(e) {
      if (e.target.closest("[data-novapasta]")) { fecharFolha(); return escolherPastaAparelho(); }
      const b = e.target.closest("[data-tirarpasta]"); if (!b) return;
      const ps = cfg.pastasEscolhidas || [], p = ps[+b.dataset.tirarpasta]; if (!p) return;
      importadas().filter((x) => x.orig === p.uri).forEach((x) => removerFaixa(x.id, true));
      cfg.pastasEscolhidas = ps.filter((q) => q !== p); salvarCfg(); nat(() => MUS.soltarPasta({ uri: p.uri }));
      $("sheet-b").innerHTML = html(); renderTemas(); toast(T("Pasta tirada do Orolon"));
    },
  });
}
function menuPastasAparelho() {
  const cont = new Map();
  for (const x of importadas()) if (x.mid) cont.set(x.pasta || "", (cont.get(x.pasta || "") || 0) + 1);
  if (!cont.size) { toast(T("Nenhuma música do aparelho ainda")); return; }
  const html = () => `<p class="note" style="padding:0 8px">${T("Desligue as pastas que não são de música, como áudios de conversa. Os arquivos não são apagados.")}</p><div class="stack">${[...cont].sort((a, b) => comparar(a[0], b[0])).map(([p, n], i) =>
    `<div class="opt"><span id="l-pasta${i}">${esc(p.replace(/\/$/, "") || T("Sem pasta"))} <span class="note">· ${n}</span></span><button class="tg" data-pasta="${esc(p)}" role="switch" aria-checked="${!(cfg.pastasFora || []).includes(p)}" aria-labelledby="l-pasta${i}"></button></div>`).join("")}</div>`;
  abrirFolha({
    titulo: T("Pastas do aparelho"), html: html(),
    clique(e) {
      const b = e.target.closest("[data-pasta]"); if (!b) return;
      const p = b.dataset.pasta, f = new Set(cfg.pastasFora || []);
      if (f.has(p)) f.delete(p); else f.add(p);
      cfg.pastasFora = [...f]; salvarCfg();
      $("sheet-b").innerHTML = html();
      const atual = cur(); renderBib(); renderPl(); if (atual && !visivel(atual) && !playing) filaPadrao();
    },
  });
}
async function arquivosDoDrop(dt) {
  const entradas = [...(dt.items || [])].map((i) => (i.webkitGetAsEntry ? i.webkitGetAsEntry() : null)).filter(Boolean);
  if (!entradas.length) return [...dt.files];
  const saida = [];
  const ler = async (en) => {
    if (en.isFile) {
      const f = await new Promise((ok) => en.file(ok, () => ok(null)));
      if (f) { try { f._pasta = en.fullPath.split("/").slice(1, -1).join("/"); } catch (e) { /* sem caminho */ } saida.push(f); }
    }
    else if (en.isDirectory) {
      const r = en.createReader(); let lote;
      do { lote = await new Promise((ok) => r.readEntries(ok, () => ok([]))); for (const c of lote) await ler(c); } while (lote.length);
    }
  };
  for (const en of entradas) await ler(en);
  return saida.filter(Boolean);
}
function removerFaixa(id, sumiu) {
  const x = porId.get(id); if (!x || x.demo) return;
  if (x.mid && !sumiu) { cfg.ignoradas = [...new Set([...(cfg.ignoradas || []), x.mid])]; salvarCfg(); }
  const eraAtual = cur() && cur().id === id;
  if (eraAtual && playing) pausar();
  const atualId = cur() && cur().id;
  faixas = faixas.filter((t) => t.id !== id); porId.delete(id);
  const i = queue.indexOf(id);
  if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; }
  if (origem) origem = origem.filter((q) => q !== id);
  for (const p of pls) if (p.ids.includes(id)) { p.ids = p.ids.filter((q) => q !== id); salvarPl(p); }
  if (!x.uri) URL.revokeObjectURL(x.url); if (x.cover) URL.revokeObjectURL(x.cover);
  dbDel("faixas", id);
  if (!queue.length) filaPadrao();
  else if (eraAtual) { qi = Math.min(qi, queue.length - 1); carregar(false); }
  else qi = Math.max(0, queue.indexOf(atualId));
  renderBib(); renderPl(); renderFilaAberta(); paint();
}

/* ===================== Fila e reprodução ===================== */
let queue = [], qi = 0, playing = false, shuffle = false, repeat = "off", origem = null, contexto = T("Biblioteca");
const cur = () => porId.get(queue[qi]);
function filaPadrao() { queue = ordenar(vis()).map((x) => x.id); qi = 0; origem = null; contexto = T("Biblioteca"); carregar(false); }
function tocarLista(ids, i, ctx) {
  ids = ids.filter((id) => visivel(porId.get(id)));
  if (!ids.length) return;
  i = Math.max(0, Math.min(i || 0, ids.length - 1));
  contexto = ctx || T("Biblioteca"); origem = ids.slice();
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
  toast(shuffle ? T("Ordem aleatória ligada") : T("Ordem aleatória desligada"));
}
function alternarRepetir() {
  repeat = repeat === "off" ? "all" : repeat === "all" ? "one" : "off";
  paint(); salvarSessao();
  toast({ off: T("Repetir desligado"), all: T("Repetir a fila"), one: T("Repetir esta música") }[repeat]);
}
function tocarASeguir(id) {
  if (!queue.length) { queue = [id]; qi = 0; carregar(false); }
  if (queue[qi] === id) return toast(T("Essa música já está tocando"));
  const i = queue.indexOf(id);
  if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; }
  queue.splice(qi + 1, 0, id);
  renderFilaAberta(); paint(); salvarSessao();
  toast(T("Toca em seguida"));
}
function adicionarFila(id) {
  if (!queue.length) { queue = [id]; qi = 0; carregar(false); return toast(T("Adicionada à fila")); }
  if (queue[qi] === id) return toast(T("Essa música já está tocando"));
  const i = queue.indexOf(id);
  if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; }
  queue.push(id);
  renderFilaAberta(); paint(); salvarSessao();
  toast(T("Adicionada ao fim da fila"));
}
function tirarDaFila(i) {
  if (i === qi || i < 0 || i >= queue.length) return;
  queue.splice(i, 1); if (i < qi) qi--;
  renderFilaAberta(); paint(); salvarSessao();
}

/* ---- Áudio ---- */
let ctx, an, mestre, el, bins, relogio, filtros, entrada, ganhoEl, pausaPend, passo = 0, proxT = 0, pos = 0, posBase = 0, inicioT = 0, erros = 0;
let volNo = null, els = [], ganhos = [], elAtivo = 0, trocando = null, eraIn, eraNos = [], ruido = null, comp = null, ondas, efeitosNos = [];
function usarEl(i) { elAtivo = i; el = els[i]; ganhoEl = ganhos[i]; }
const VELS = [0.75, 1, 1.25, 1.5, 2];
function aplicarVel() {
  els.forEach((a) => { a.defaultPlaybackRate = a.playbackRate = cfg.vel || 1; });
  const b = $("b-vel"); if (b) { b.textContent = decimal(String(cfg.vel || 1)) + "×"; b.classList.toggle("act", (cfg.vel || 1) !== 1); b.setAttribute("aria-label", T("Velocidade {0}×. Toque para mudar", decimal(String(cfg.vel || 1)))); }
}
function cancelarTroca() { if (trocando) { clearTimeout(trocando.t); trocando.sai.pause(); trocando = null; } }
function prepararAudio() {
  if (ctx) return;
  // "playback" pede um buffer de áudio maior: no celular isso evita falhas e engasgos no som
  const AC = window.AudioContext || window.webkitAudioContext;
  try { ctx = new AC({ latencyHint: "balanced" }); } catch (e) { ctx = new AC(); }
  an = ctx.createAnalyser(); an.fftSize = 512; an.smoothingTimeConstant = 0.55; an.minDecibels = -95; an.maxDecibels = -16; // mais folga em cima: os graves das músicas altas não batem no teto
  volNo = ctx.createGain(); an.connect(volNo); volNo.connect(montarLimitador(ctx)).connect(ctx.destination); aplicarVolume(true); // o analisador fica antes do volume: os visuais não mudam com o amplificador
  bins = new Uint8Array(an.frequencyBinCount); ondas = new Uint8Array(an.fftSize);
  entrada = ctx.createGain(); eraIn = ctx.createGain();
  mestre = ctx.createGain(); mestre.gain.value = 0.5; mestre.connect(entrada);
  for (let i = 0; i < 2; i++) { // dois tocadores: um toca, o outro já deixa a próxima música pronta
    const a = new Audio(), g = ctx.createGain();
    a.preload = "auto"; g.gain.value = i ? 0 : 1;
    ctx.createMediaElementSource(a).connect(g); g.connect(entrada);
    a.onended = () => { if (a === el) fimDaFaixa(); };
    a.onplaying = () => { if (a === el) erros = 0; };
    a.onloadedmetadata = () => { const x = cur(); if (a === el && x && !x.demo && a.dataset.id === x.id && isFinite(a.duration)) { x.d = a.duration; paint(); } };
    a.onerror = () => {
      const x = cur(); if (a !== el || !x || x.demo || a.dataset.id !== x.id || !playing) return;
      erros++;
      toast(T('Não deu para tocar "{0}"', x.t));
      if (erros < queue.length) setTimeout(() => { qi = (qi + 1) % queue.length; carregar(true); }, 700);
      else { erros = 0; playing = false; paint(); }
    };
    els.push(a); ganhos.push(g);
  }
  usarEl(0); aplicarVel(); montarFiltros();
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
  clearTimeout(pausaPend);
  if (x.demo) {
    el.pause(); clearInterval(relogio);
    const sd = 30 / x.bpm; passo = Math.floor(pos / sd); proxT = ctx.currentTime + 0.05; posBase = pos; inicioT = ctx.currentTime;
    mestre.gain.cancelScheduledValues(ctx.currentTime); mestre.gain.setTargetAtTime(0.5, ctx.currentTime, 0.03);
    relogio = setInterval(agendar, 80); agendar();
  } else {
    pararSintese();
    if (el.dataset.id !== x.id) { el.src = x.url; el.dataset.id = x.id; if (pos) el.currentTime = pos; }
    aplicarVel();
    const g = ganhoEl.gain, t0 = ctx.currentTime;
    g.cancelScheduledValues(t0);
    if (cfg.fade && !playing) { g.setValueAtTime(0, t0); g.linearRampToValueAtTime(1, t0 + 0.45); } else g.setValueAtTime(1, t0);
    el.play().catch(() => { playing = false; paint(); });
  }
  playing = true; paint();
}
function pausar() {
  const x = cur();
  if (ctx) {
    if (x && x.demo) { pos = posAtual(); pararSintese(); }
    else if (el) {
      pos = el.currentTime; cancelarTroca();
      if (cfg.fade && playing && ganhoEl) {
        const g = ganhoEl.gain, t0 = ctx.currentTime;
        g.cancelScheduledValues(t0); g.setValueAtTime(g.value, t0); g.linearRampToValueAtTime(0, t0 + 0.3);
        const e0 = el; clearTimeout(pausaPend); pausaPend = setTimeout(() => e0.pause(), 320);
      } else el.pause();
    }
  }
  playing = false; paint(); salvarSessao();
}
const alternar = () => (playing ? pausar() : tocar());
function posAtual() {
  const x = cur(); if (!x) return 0;
  if (!x.demo) return el && el.dataset.id === x.id ? el.currentTime : pos;
  return playing && ctx ? posBase + (ctx.currentTime - inicioT) : pos;
}
function aoTrocar(x) { renderInicio(); luz(coresDe(x)); atualizarCorViz(); if (cfg.visual === "led") prepararLed(x); metaSessao(x); paint(); marcarAtual(); renderFilaAberta(); salvarSessao(); renderLetra(); pintarCena(); }
function carregar(auto) {
  const x = cur();
  if (!x) { playing = false; paint(); return; }
  pos = 0; novaEscuta(); clearTimeout(pausaPend);
  if (ctx) {
    pararSintese(); cancelarTroca(); els.forEach((a) => a.pause());
    if (!x.demo) {
      const o = 1 - elAtivo;
      if (els[o].dataset.id === x.id && els[o].readyState >= 1) { usarEl(o); try { el.currentTime = 0; } catch (e) { /* ainda carregando */ } }
      else { el.src = x.url; el.dataset.id = x.id; }
      const go = ganhos[1 - elAtivo].gain; go.cancelScheduledValues(ctx.currentTime); go.setValueAtTime(0, ctx.currentTime);
    } else el.dataset.id = "";
  }
  const guardada = ehLonga(x) ? posicoes[x.id] || 0 : 0;
  if (guardada > 15 && guardada < x.d - 15) {
    pos = guardada;
    if (el && el.dataset.id === x.id) try { el.currentTime = guardada; } catch (e) { /* aplica ao tocar */ }
    if (!restaurando) toast(T("Continuando de {0}", fmt(guardada)), [T("Do início"), () => { esquecerPosicao(x.id); buscarSeg(0); pos = 0; }]);
  }
  aoTrocar(x);
  if (auto) tocar(); else { playing = false; paint(); }
}
/* Troca sem pausa e crossfade: a próxima música é carregada no segundo tocador antes de a atual acabar */
function proximoIdx() {
  if (repeat === "one") return -1;
  if (qi < queue.length - 1) return qi + 1;
  return repeat === "all" && queue.length > 1 ? 0 : -1;
}
function vigiarTroca(x, p) {
  if (!playing || !x || x.demo || !ctx || trocando || sono.aoFim) return;
  const ni = proximoIdx(); if (ni < 0) return;
  const nx = porId.get(queue[ni]); if (!nx || nx.demo) return;
  const resta = (x.d || 0) - p, o = els[1 - elAtivo];
  if (resta < 20 && o.dataset.id !== nx.id) { o.src = nx.url; o.dataset.id = nx.id; o.load(); }
  const xf = +cfg.xfade || 0;
  if (xf > 0 && x.d > xf * 3 && resta <= xf && resta > 0.25 && o.dataset.id === nx.id && o.readyState >= 2) iniciarTroca(ni, Math.min(xf, resta));
}
function iniciarTroca(ni, dur) {
  const sai = el, gSai = ganhoEl.gain, t0 = ctx.currentTime;
  if (cur()) esquecerPosicao(cur().id);
  usarEl(1 - elAtivo); aplicarVel();
  try { el.currentTime = 0; } catch (e) { /* ignora */ }
  ganhoEl.gain.cancelScheduledValues(t0); ganhoEl.gain.setValueAtTime(0, t0); ganhoEl.gain.linearRampToValueAtTime(1, t0 + dur);
  gSai.cancelScheduledValues(t0); gSai.setValueAtTime(gSai.value, t0); gSai.linearRampToValueAtTime(0, t0 + dur);
  el.play().catch(() => {});
  trocando = { sai, t: setTimeout(() => { sai.pause(); trocando = null; }, dur * 1000 + 150) };
  qi = ni; pos = 0; novaEscuta(); aoTrocar(cur());
}
function fimDaFaixa() {
  if (cur()) esquecerPosicao(cur().id);
  if (sono.aoFim) { sono.aoFim = false; if (qi < queue.length - 1) qi++; carregar(false); paintSono(); toast(T("Temporizador: música pausada")); return; }
  if (repeat === "one") { pos = 0; novaEscuta(); if (el) el.currentTime = 0; return tocar(); }
  if (qi < queue.length - 1) { qi++; return carregar(true); }
  if (repeat === "all") { qi = 0; return carregar(true); }
  qi = 0; carregar(false);
}
function proxima() { if (!queue.length) return; qi = (qi + 1) % queue.length; carregar(playing); }
function anterior() {
  if (!queue.length) return;
  if (cfg.anterior !== "sempre" && posAtual() > 3) return buscarSeg(0);
  qi = (qi - 1 + queue.length) % queue.length; carregar(playing);
}
function buscarSeg(s) {
  const x = cur(); if (!x) return;
  s = Math.max(0, Math.min(s, (x.d || 0) - 0.25));
  if (x.demo) { pos = s; if (playing) tocar(); }
  else if (el && el.dataset.id === x.id) el.currentTime = s;
  else pos = s;
}

/* ---- Músicas longas (audiolivros, podcasts, mixes) continuam de onde pararam ---- */
const LONGA = 600; // 10 minutos ou mais
let posicoes = guardado.get("compasso.posicoes", {});
const ehLonga = (x) => x && !x.demo && (x.d || 0) >= LONGA;
function lembrarPosicao() {
  const x = cur(); if (!ehLonga(x)) return;
  const p = posAtual();
  if (p > 15 && p < x.d - 15) {
    if (Math.abs((posicoes[x.id] || 0) - p) < 1) return;
    posicoes[x.id] = Math.round(p);
    const ids = Object.keys(posicoes); if (ids.length > 200) delete posicoes[ids[0]];
    guardado.set("compasso.posicoes", posicoes);
  }
}
function esquecerPosicao(id) { if (id && posicoes[id] !== undefined) { delete posicoes[id]; guardado.set("compasso.posicoes", posicoes); } }

/* ---- Sessão: volta de onde parou ---- */
let ultimaSessao = 0, restaurando = false;
function salvarSessao() {
  ultimaSessao = Date.now(); lembrarPosicao();
  guardado.set("compasso.sessao", { queue, atual: queue[qi], pos: posAtual(), contexto, shuffle, repeat, origem });
}
function restaurarSessao() {
  const s = guardado.get("compasso.sessao", null);
  const q = s && Array.isArray(s.queue) ? s.queue.filter((id) => visivel(porId.get(id))) : [];
  if (!q.length) return filaPadrao();
  queue = q; qi = Math.max(0, q.indexOf(s.atual)); contexto = s.contexto || T("Biblioteca");
  shuffle = !!s.shuffle; repeat = ["off", "all", "one"].includes(s.repeat) ? s.repeat : "off";
  origem = Array.isArray(s.origem) ? s.origem.filter((id) => porId.has(id)) : null;
  restaurando = true; carregar(false); restaurando = false;
  pos = cur() && s.atual === cur().id ? Math.max(0, +s.pos || 0) : 0;
}

/* ---- Controles do sistema (tela de bloqueio, fones, teclado de mídia) ---- */
const sessao = "mediaSession" in navigator ? navigator.mediaSession : null;
/* No Android a WebView não mostra os controles de mídia: o plugin nativo cria a notificação com capa e botões */
const MS = PLUG.MediaSession || null;
const capaPequena = new Map();
async function capaParaNotificacao(x) {
  if (!x.capaBlob) return null;
  if (capaPequena.has(x.id)) return capaPequena.get(x.id);
  try {
    const bm = await createImageBitmap(x.capaBlob), cv = document.createElement("canvas"); cv.width = cv.height = 384;
    cv.getContext("2d").drawImage(bm, 0, 0, 384, 384);
    const url = cv.toDataURL("image/jpeg", 0.85); capaPequena.set(x.id, url); return url;
  } catch (e) { return null; }
}
let msEstado = "";
function estadoNativo() {
  if (!MS) return; const e = playing ? "playing" : cur() ? "paused" : "none";
  if (e !== msEstado) { msEstado = e; nat(() => MS.setPlaybackState({ playbackState: e })); }
}
if (MS) {
  const h = (a, f) => nat(() => MS.setActionHandler({ action: a }, f));
  h("play", () => tocar()); h("pause", () => pausar()); h("previoustrack", () => anterior()); h("nexttrack", () => proxima());
  h("seekto", (d) => d && d.seekTime !== undefined && buscarSeg(d.seekTime));
  h("seekbackward", () => buscarSeg(posAtual() - 10)); h("seekforward", () => buscarSeg(posAtual() + 10));
  h("stop", () => pausar());
}
function metaSessao(x) {
  if (MS) capaParaNotificacao(x).then((art) => nat(() => MS.setMetadata({ title: x.t, artist: x.a, album: x.al || "", artwork: art ? [{ src: art, sizes: "384x384", type: "image/jpeg" }] : [] })));
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

/* ---- Volume próprio (soma com o volume do aparelho) ---- */
const ganhoVol = () => (cfg.mudo ? 0 : Math.pow(Math.max(0, Math.min(1, +cfg.vol)), 2)); // curva quadrática: soa mais natural
/* ---- Amplificador (acima de 100%) com limitador no fim: a saída nunca passa de 0 dBFS ---- */
const AMPS = [1, 1.25, 1.5, 1.75, 2];
const ganhoAmp = () => Math.max(1, Math.min(2, +cfg.amp || 1));
const LIMIAR_LIMITADOR = -3;
function montarLimitador(c) {
  const l = c.createDynamicsCompressor();
  // limiar abaixo de −1: o compressor do navegador soma um ganho de compensação, e com −1 o pico passava de 0 dBFS
  l.threshold.value = LIMIAR_LIMITADOR; l.knee.value = 0; l.ratio.value = 20; l.attack.value = 0.002; l.release.value = 0.12;
  return l;
}
function escolherAmp(v) {
  cfg.amp = Math.max(1, Math.min(2, +v || 1));
  if (cfg.amp > 1 && !cfg.avisoAmp) { cfg.avisoAmp = true; toast(T("Volume acima de 100% pode cansar os ouvidos. Use com moderação.")); }
  salvarCfg(); aplicarVolume(); marcarFerramentas();
}
function aplicarVolume(agora) {
  if (volNo) volNo.gain.setTargetAtTime(ganhoVol() * ganhoAmp(), ctx.currentTime, agora ? 0 : 0.03);
  const v = cfg.mudo ? 0 : Math.round(cfg.vol * 100), b = $("b-vol"), r = $("vol");
  b.innerHTML = ico(v === 0 ? "vol0" : v < 50 ? "vol1" : "vol", 20);
  const bp = $("b-volpill"); if (bp) bp.innerHTML = ico(v === 0 ? "vol0" : v < 50 ? "vol1" : "vol", 18) + `<span class="pill-t">${T("Volume")}</span>`;
  b.setAttribute("aria-label", cfg.mudo ? T("Tirar do mudo") : T("Deixar mudo"));
  b.setAttribute("aria-pressed", !!cfg.mudo);
  if (document.activeElement !== r) r.value = Math.round(cfg.vol * 100);
  r.style.setProperty("--v", (cfg.mudo ? 0 : cfg.vol * 100) + "%");
  r.setAttribute("aria-valuetext", cfg.mudo ? T("Mudo") : v + "%");
  $("vol-n").textContent = cfg.mudo ? T("Mudo") : v + "%";
}
function mudarVolume(v, salvar = true) {
  cfg.vol = Math.max(0, Math.min(1, v)); if (cfg.vol > 0) cfg.mudo = false;
  aplicarVolume(); if (salvar) salvarCfg();
}
$("vol").addEventListener("input", (e) => mudarVolume(e.target.value / 100, false));
$("vol").addEventListener("change", () => salvarCfg());
$("vol").addEventListener("wheel", (e) => { e.preventDefault(); mudarVolume(cfg.vol + (e.deltaY < 0 ? 0.05 : -0.05)); }, { passive: false });
function aplicarVolRec() { const r = !!cfg.volRec; $("volume").dataset.rec = r ? "1" : ""; const b = $("b-volpill"); b.setAttribute("aria-expanded", String(!r)); b.setAttribute("aria-label", (r ? T("Mostrar o volume") : T("Recolher o volume")) + T(". Segure para deixar mudo")); b.classList.toggle("on", !r); ajustarDial(); }
/* Botão de volume da fileira de baixo: um toque mostra/esconde a barra; segurar (~1 s) deixa mudo ou devolve o som */
let volSegura = null, volSegurou = false;
function alternarMudo() {
  cfg.mudo = !cfg.mudo; if (!cfg.mudo && cfg.vol === 0) cfg.vol = 0.5;
  aplicarVolume(); salvarCfg(); nat(() => navigator.vibrate && navigator.vibrate(25));
  toast(cfg.mudo ? T("Mudo") : T("Volume {0}%", Math.round(cfg.vol * 100)));
}
const soltarVol = () => { clearTimeout(volSegura); volSegura = null; };
$("b-volpill").addEventListener("pointerdown", (e) => { if (e.button > 0) return; volSegurou = false; soltarVol(); volSegura = setTimeout(() => { volSegurou = true; volSegura = null; alternarMudo(); }, 800); });
["pointerup", "pointerleave", "pointercancel"].forEach((ev) => $("b-volpill").addEventListener(ev, soltarVol));
$("b-volpill").addEventListener("contextmenu", (e) => e.preventDefault());
$("b-volpill").addEventListener("click", (e) => { if (volSegurou) { volSegurou = false; e.preventDefault(); return; } cfg.volRec = !cfg.volRec; aplicarVolRec(); salvarCfg(); });
$("b-vol").addEventListener("click", () => { cfg.mudo = !cfg.mudo; if (!cfg.mudo && cfg.vol === 0) cfg.vol = 0.5; aplicarVolume(); salvarCfg(); });

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
const APP = $("app"), AMB = $("amb"), DIAL = document.querySelector(".dial");
let ultPulso = "", ultBatida = "", quadros = 0, ultSeek = -1;
const SEEK = $("seek");
/* Se o aparelho não dá conta das animações, sugere o modo leve uma vez */
const amostra = { t0: 0, n: 0 };
function medirQuadro() {
  if (cfg.leve || cfg.leveSugerido || document.visibilityState !== "visible") return;
  const t = performance.now();
  if (!amostra.t0 || t - amostra.ult > 400) { amostra.t0 = t; amostra.n = 0; }
  amostra.ult = t; amostra.n++;
  if (t - amostra.t0 > 6000) {
    const fps = (amostra.n * 1000) / (t - amostra.t0);
    amostra.t0 = 0;
    if (fps < 24) { cfg.leveSugerido = true; salvarCfg(); sugerirLeve(); } // abaixo de 30, para não confundir com a economia de bateria
  }
}
function sugerirLeve() {
  if (folha) return;
  abrirFolha({
    titulo: T("O app está lento aqui?"),
    html: `<p class="note" style="padding:0 6px">${T("As animações parecem pesadas para este aparelho. O modo leve desliga os efeitos que mais pesam e deixa a rolagem mais solta. Dá para mudar depois em Ajustes.")}</p>
      <div class="btns"><button class="btn" data-leve-sim>${T("Ligar o modo leve")}</button><button class="btn ghost" data-leve-nao>${T("Agora não")}</button></div>`,
    clique(e) { if (e.target.closest("[data-leve-sim]")) { fecharFolha(); definirLeve(true); } else if (e.target.closest("[data-leve-nao]")) fecharFolha(); },
  });
}
function definirLeve(on) {
  cfg.leve = !!on; salvarCfg();
  APP.dataset.leve = cfg.leve ? "1" : "";
  if (cfg.leve) { // volta tudo ao repouso
    nivel.fill(0); linhas.forEach((l) => l.setAttribute("y2", "12"));
    AMB.style.setProperty("--pulse", "0.4"); DIAL.style.setProperty("--pulse", "0.4"); DIAL.style.setProperty("--beat", "0");
    ultPulso = ultBatida = "";
  }
  if (APP.dataset.view === "temas" && !editando) renderTemas();
  toast(cfg.leve ? T("Modo leve ligado") : T("Modo leve desligado"));
}
/* As animações seguem o tempo real, e não o número de quadros: assim um monitor de 144 Hz e um celular a 60 Hz (ou 30 Hz na economia de bateria) reagem igual */
let fqQ = 1, fqV = 1, ultQ = 0, ultV = 0, nQuadro = 0, binsLidos = -1;
const passoT = (agora, ult) => (ult ? Math.min(4, Math.max(0.25, (agora - ult) / 16.667)) : 1);
const sq = (k) => 1 - Math.pow(1 - k, fqQ), sv = (k) => 1 - Math.pow(1 - k, fqV); // suavização por quadro de 60 Hz, ajustada ao tempo
// curva suave: realça o meio e comprime o topo sem achatar, para os picos ainda irem até onde "pretendiam"
const CURVA_BINS = Uint8Array.from({ length: 256 }, (_, v) => Math.round((255 * Math.tanh((1.5 * v) / 255)) / Math.tanh(1.5)));
function lerBins() { if (binsLidos !== nQuadro) { an.getByteFrequencyData(bins); for (let i = 0; i < bins.length; i++) bins[i] = CURVA_BINS[bins[i]]; binsLidos = nQuadro; } } // uma leitura por quadro
let acesas = -1, arrastandoSeek = false, pulso = 0.4, graveEnv = 0, gravePiso = 0, escDisco = 1, ultEsc = "", batida = 0, alvoBatida = 0, media = 0, ultimaBatida = 0, ultimoSeg = -1;
const nivel = new Float32Array(60);
const calmo = matchMedia("(prefers-reduced-motion: reduce)").matches;
function quadro() {
  { const ag = performance.now(); fqQ = passoT(ag, ultQ); ultQ = ag; nQuadro++; }
  const x = cur();
  if (x) {
    const p = posAtual();
    if (x.demo && playing && p >= x.d) fimDaFaixa();
    else {
      const fr = x.d ? Math.min(1, p / x.d) : 0;
      const sv = Math.round(fr * 1000);
      if (!arrastandoSeek && sv !== ultSeek && APP.dataset.view === "tocando") { ultSeek = sv; SEEK.value = sv; }
      seguirLetra(p); vigiarTroca(x, p);
      const seg = Math.floor(p);
      if (seg !== ultimoSeg) {
        ultimoSeg = seg; $("cur").textContent = fmt(p);
        $("mini").style.setProperty("--prog", (fr * 100).toFixed(1) + "%");
        if (MS && x.d > 0) nat(() => MS.setPositionState({ duration: x.d, position: Math.min(p, x.d), playbackRate: x.demo ? 1 : cfg.vel || 1 }));
        if (sessao && sessao.setPositionState && x.d > 0) try { sessao.setPositionState({ duration: x.d, position: Math.min(p, x.d), playbackRate: x.demo ? 1 : cfg.vel || 1 }); } catch (e) { /* ignora */ }
        if (playing && Date.now() - ultimaSessao > 5000) salvarSessao();
        const ag = document.getElementById("agulha"); if (ag) ag.setAttribute("transform", `translate(${(30 + fr * 140).toFixed(1)} 0)`);
      }
      const n = Math.round(fr * 60);
      if (n !== acesas) { linhas.forEach((l, i) => l.classList.toggle("on", i < n)); acesas = n; }
    }
  }
  let alvo = 0.4;
  const ativo = playing && an && cfg.reage && !calmo;
  if (ativo) {
    lerBins();
    let s = 0; for (let i = 1; i < 19; i++) s += bins[i];
    alvo = Math.min(1, s / 18 / 170);
    const g = (bins[0] + bins[1] + bins[2] + bins[3]) / 4, agora = performance.now();
    if (g > media * 1.3 && g > 90 && agora - ultimaBatida > 450) { alvoBatida = 1; ultimaBatida = agora; }
    media += (g - media) * sq(0.06);
    // pulso da capa: segue a força dos graves acima do nível médio da música, para pulsar mesmo em músicas altas
    const gv = g / 255; graveEnv += (gv - graveEnv) * sq(gv > graveEnv ? 0.35 : 0.1); gravePiso += (graveEnv - gravePiso) * sq(0.015);
  } else { if (!playing) alvo = 0.25; graveEnv *= Math.pow(0.92, fqQ); }
  alvoBatida *= Math.pow(0.93, fqQ); batida += (alvoBatida - batida) * sq(0.22);
  const naTela = APP.dataset.view === "tocando", leve = !!cfg.leve;
  // os tracinhos só se mexem quando o mostrador de relógio está na tela
  // os tracinhos se mexem no Relógio e no Vinil: seguem a frequência de cada lado e ganham um empurrão em cada batida
  if (naTela && !leve && (APP.dataset.visual === "relogio" || APP.dataset.visual === "vinil") && APP.dataset.letra !== "1") for (let i = 0; i < 60; i++) {
    const p = (i < 30 ? i : 59 - i) / 29, t = ativo ? Math.pow(bins[1 + Math.round(60 * p * p)] / 255, 1.6) * cfg.batF * 1.5 + batida * 0.35 * cfg.batF : 0;
    const nv = nivel[i] + (Math.min(1, t) - nivel[i]) * sq(t > nivel[i] ? 0.4 : 0.13);
    if (Math.abs(nv - nivel[i]) > 0.004 || (nv < 0.004 && nivel[i] !== 0)) {
      nivel[i] = nv < 0.004 ? 0 : nv;
      linhas[i].setAttribute("y2", (12 + nivel[i] * 12).toFixed(1));
    }
  }
  pulso += (alvo - pulso) * sq(0.1);
  // As variáveis ficam só nos elementos que as usam (e só mudam quando o valor muda),
  // para o navegador não recalcular o estilo da página inteira a cada quadro.
  if (!leve && naTela) { // fora do Tocando agora a luz de fundo fica parada
    const pv = pulso.toFixed(2), bv = batida.toFixed(2);
    if (pv !== ultPulso) { ultPulso = pv; AMB.style.setProperty("--pulse", pv); DIAL.style.setProperty("--pulse", pv); }
    if (bv !== ultBatida) { ultBatida = bv; DIAL.style.setProperty("--beat", bv); }
    const k = cfg.reage ? cfg.batF : 0, env = Math.max(0, Math.min(1, (graveEnv - gravePiso * 0.88) / Math.max(0.12, 1 - gravePiso * 0.88)));
    escDisco = 1 + k * (0.07 * env + 0.03 * batida);
    const ev = escDisco.toFixed(3); if (ev !== ultEsc) { ultEsc = ev; DIAL.style.setProperty("--ds", ev); }
  }
  if (naTela && playing) medirQuadro();
  if (!leve || (quadros++ & 1)) desenharViz();
  requestAnimationFrame(quadro);
}

/* ===================== Tela: Tocando agora e mini player ===================== */
function paint() {
  const x = cur();
  $("app").dataset.playing = playing ? "1" : ""; ajustarRuido(); estadoNativo();
  $("b-play").innerHTML = ico(playing ? "pause" : "play", 30); $("b-play").setAttribute("aria-label", playing ? T("Pausar") : T("Tocar"));
  $("mini-play").innerHTML = ico(playing ? "pause" : "play");
  marcarFerramentas(); pintarCarro();
  { const ip = document.querySelector("[data-ini-tocar]"); if (ip) { ip.innerHTML = ico(playing ? "pause" : "play", 26); ip.setAttribute("aria-label", playing ? T("Pausar") : T("Tocar")); } } $("mini-play").setAttribute("aria-label", playing ? T("Pausar") : T("Tocar"));
  $("b-shuf").classList.toggle("act", shuffle); $("b-shuf").setAttribute("aria-pressed", shuffle);
  $("b-rep").classList.toggle("act", repeat !== "off"); $("b-rep").setAttribute("aria-pressed", repeat !== "off");
  $("b-rep").innerHTML = ico("rep") + (repeat === "one" ? "<b>1</b>" : "");
  $("b-rep").setAttribute("aria-label", { off: T("Repetir: desligado"), all: T("Repetir: fila"), one: T("Repetir: esta música") }[repeat]);
  document.querySelectorAll(".eq").forEach((e) => e.classList.toggle("paused", !playing));
  if (sessao) try { sessao.playbackState = playing ? "playing" : "paused"; } catch (e) { /* ignora */ }
  $("mini").hidden = !x;
  if (!x) {
    $("np-t").textContent = T("Nada tocando"); $("np-a").textContent = T("Importe músicas na Biblioteca");
    $("selo").style.background = "var(--card)"; $("selo").textContent = ""; { const tx = T("Fila vazia"); $("b-fila").innerHTML = ico("queue", 18) + `<span class="pill-t">${tx}</span>`; $("b-fila").setAttribute("aria-label", tx); }
    return;
  }
  $("np-ctx").textContent = T("Tocando · {0}", contexto);
  $("np-t").textContent = x.t; $("np-a").textContent = linha2(x) + (x.demo ? T(" · exemplo") : semPerdas(x) ? " · " + semPerdas(x) : "");
  $("selo").style.background = fundoDe(x); $("selo").innerHTML = x.cover ? "" : MARCA;
  $("mini-th").innerHTML = capa(x); $("mini-t").textContent = x.t; $("mini-a").textContent = x.a;
  $("tot").textContent = fmt(x.d);
  const depois = queue.length - qi - 1;
  { const tx = depois ? T("Fila · {0}", depois) : T("Fila · última"); $("b-fila").innerHTML = ico("queue", 18) + `<span class="pill-t">${esc(tx)}</span>`; $("b-fila").setAttribute("aria-label", tx); }
  $("b-npmais").innerHTML = ico("more", 18) + `<span class="pill-t">${T("Mais")}</span>`;
  const fav = ehFav(x.id), bf = $("b-fav");
  bf.innerHTML = ico(fav ? "heartOn" : "heart"); bf.classList.toggle("act", fav); bf.setAttribute("aria-pressed", fav);
  bf.setAttribute("aria-label", fav ? T("Tirar das favoritas") : T("Adicionar às favoritas"));
  const mf = $("mini-fav");
  mf.innerHTML = ico(fav ? "heartOn" : "heart", 22); mf.classList.toggle("act", fav); mf.setAttribute("aria-pressed", fav);
  mf.setAttribute("aria-label", fav ? T("Tirar das favoritas") : T("Adicionar às favoritas"));
  $("b-eq").innerHTML = ico("sliders", 18) + `<span class="pill-t">${T("EQ")}</span>`; $("b-eq").classList.toggle("act", !!cfg.eq.on);
  paintSono(); atualizarTela();
  document.title = playing ? `${x.t} · Orolon` : T("Orolon Player");
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
let aba = "musicas", aberto = null, listaBib = { ids: [], ctx: T("Biblioteca") };
const ORDENS = { recentes: T("Recentes"), titulo: T("Título"), artista: T("Artista") };
const comparar = (a, b) => a.localeCompare(b, LOCALE(), { sensitivity: "base", numeric: true });
function ordenar(lista) {
  const l = lista.slice();
  if (cfg.ord === "titulo") l.sort((a, b) => comparar(a.t, b.t));
  else if (cfg.ord === "artista") l.sort((a, b) => comparar(a.a, b.a) || comparar(a.al || "", b.al || "") || (a.n || 999) - (b.n || 999));
  else l.sort((a, b) => (b.em || 0) - (a.em || 0));
  return l;
}
const nomeAlbum = (x) => x.al || T("Sem álbum");
const porFaixa = (a, b) => (a.n || 999) - (b.n || 999) || comparar(a.t, b.t);
function albuns(lista = vis()) {
  const m = new Map();
  for (const x of lista) { const k = nomeAlbum(x); if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  return [...m].map(([n, fx]) => {
    fx.sort(porFaixa);
    return { n, fx, a: new Set(fx.map((x) => x.a)).size > 1 ? T("Vários artistas") : fx[0].a, capa: fx.find((x) => x.cover) || fx[0] };
  }).sort((a, b) => comparar(a.n, b.n));
}
function artistas() {
  const m = new Map();
  for (const x of vis()) { if (!m.has(x.a)) m.set(x.a, []); m.get(x.a).push(x); }
  return [...m].map(([n, fx]) => ({ n, fx, albuns: new Set(fx.map(nomeAlbum)).size, capa: fx.find((x) => x.cover) || fx[0] })).sort((a, b) => comparar(a.n, b.n));
}
const capaGrupo = (g, cls = "cover") => `<span class="${cls}" style="background:${fundoDe(g.capa)}">${g.capa.cover ? "" : MARCA}</span>`;
function linhaFaixa(x, o = {}) {
  const atual = cur() && cur().id === x.id;
  return `<div class="track${atual ? " cur" : ""}" data-row="${x.id}">` +
    (o.grip ? `<button class="grip" data-grip aria-label="${T("Mover {0}. Use as setas para cima e para baixo", esc(x.t))}">${ico("grip", 20)}</button>` : "") +
    `<button class="tp" data-play="${x.id}">${o.num !== undefined ? `<span class="idx">${o.num || "·"}</span>` : capa(x)}` +
    `<span class="grow"><span class="t clip">${atual ? eqIcone() : ""}${cfg.coracoes !== false && ehFav(x.id) ? `<span class="fav-mini" aria-label="${T("Favorita")}">${ico("heartOn", 13)}</span>` : ""}${esc(x.t)}</span><span class="sub clip">${esc(o.sub ? o.sub(x) : linha2(x))}</span></span></button>` +
    (x.demo ? `<span class="chip">${T("exemplo")}</span>` : semPerdas(x) ? `<span class="chip hq" title="${T("Sem perda de qualidade")}">${semPerdas(x)}</span>` : "") +
    `<span class="dur">${x.d ? fmt(x.d) : ""}</span>` +
    `<button class="ic sm" data-more="${x.id}" aria-label="${T("Opções de {0}", esc(x.t))}">${ico("more", 20)}</button></div>`;
}
const botoesTocar = (n) => `<div class="btns"><button class="btn sm" data-tudo>${ico("play", 18)}${T("Tocar")}</button><button class="btn ghost sm" data-aleatorio aria-label="${T("Aleatório")}">${ico("shuf", 18)}<span class="rot">${T("Aleatório")}</span></button>${n || ""}</div>`;
const vazio = (txt, extra = "") => `<div class="empty"><p>${txt}</p>${extra}</div>`;
function renderBib() {
  const v = vis(), q = $("q").value.trim().toLowerCase(), imp = importadas().length;
  if (!importando) $("count").textContent = v.length ? `${plural(v.length, "música", "músicas")} · ${fmt(duracaoTotal(v))}` + (imp && !db ? T(" · este navegador não guarda a biblioteca") : "") : T("Nenhuma música ainda");
  $("q").hidden = !!aberto; $("seg").hidden = !!aberto || !!q;
  document.querySelectorAll("#seg button").forEach((b) => { b.classList.toggle("on", b.dataset.tab === aba); b.setAttribute("aria-pressed", b.dataset.tab === aba); });
  const L = $("lib");
  const casa = (s) => !q || s.toLowerCase().includes(q);
  if (!v.length) {
    L.innerHTML = vazio(T("Sua biblioteca está vazia. Importe arquivos MP3, FLAC, M4A, OGG ou Opus do seu aparelho."), `<button class="btn" data-importar>${ico("plus", 18)}${T("Importar músicas")}</button>${NATIVO ? "" : `<p class="note">${T("No PC, você também pode arrastar arquivos e pastas para esta janela.")}</p>`}`);
    return;
  }
  if (aberto && aberto.tipo === "album") {
    const al = albuns().find((a) => a.n === aberto.nome);
    if (!al) { aberto = null; return renderBib(); }
    listaBib = { ids: al.fx.map((x) => x.id), ctx: T("álbum {0}", al.n) };
    L.innerHTML = `<button class="back" data-voltar>${ico("back", 18)}${T("Voltar")}</button>
      <div class="hero">${capaGrupo(al)}<div class="grow stack"><div><h1>${esc(al.n)}</h1><p class="sub">${esc(al.a)} · ${plural(al.fx.length, "música", "músicas")} · ${fmt(duracaoTotal(al.fx))}</p></div></div></div>
      ${botoesTocar()}<div class="list">${al.fx.map((x) => linhaFaixa(x, { num: x.n, sub: (y) => y.a })).join("")}</div>`;
    return;
  }
  if (aberto && aberto.tipo === "artista") {
    const ar = artistas().find((a) => a.n === aberto.nome);
    if (!ar) { aberto = null; return renderBib(); }
    const als = albuns(ar.fx), ordem = als.flatMap((a) => a.fx);
    listaBib = { ids: ordem.map((x) => x.id), ctx: T("artista {0}", ar.n) };
    L.innerHTML = `<button class="back" data-voltar>${ico("back", 18)}${T("Voltar")}</button>
      <div class="hero">${capaGrupo(ar, "cover round")}<div class="grow"><h1>${esc(ar.n)}</h1><p class="sub">${plural(ar.albuns, "álbum", "álbuns")} · ${plural(ar.fx.length, "música", "músicas")}</p></div></div>
      ${botoesTocar()}
      <p class="sec-t">${T("Álbuns")}</p><div class="albs">${als.map((a) => `<button class="alb" data-al="${esc(a.n)}">${capaGrupo(a)}<span class="t clip">${esc(a.n)}</span><span class="sub clip">${plural(a.fx.length, "música", "músicas")}</span></button>`).join("")}</div>
      <p class="sec-t">${T("Músicas")}</p><div class="list">${ordem.map((x) => linhaFaixa(x)).join("")}</div>`;
    return;
  }
  if (aberto && aberto.tipo === "pasta") {
    const pa = pastas().find((g) => g.k === aberto.nome);
    if (!pa) { aberto = null; return renderBib(); }
    listaBib = { ids: pa.fx.map((x) => x.id), ctx: T("pasta {0}", pa.n) };
    L.innerHTML = `<button class="back" data-voltar>${ico("back", 18)}${T("Voltar")}</button>
      <div class="hero"><span class="cover folder">${ico("folder", 52)}</span><div class="grow"><h1>${esc(pa.n)}</h1><p class="sub">${pa.k ? esc(pa.k) + " · " : ""}${plural(pa.fx.length, "música", "músicas")} · ${fmt(duracaoTotal(pa.fx))}</p></div></div>
      ${botoesTocar()}<div class="list">${pa.fx.map((x) => linhaFaixa(x)).join("")}</div>`;
    return;
  }
  if (q) { // busca geral: músicas, álbuns, artistas e playlists de uma vez
    const fm = ordenar(v).filter((x) => casa(x.t + " " + x.a + " " + (x.al || ""))), fa = albuns().filter((a) => casa(a.n + " " + a.a)), fr = artistas().filter((a) => casa(a.n)), fp = pls.filter((p) => casa(p.nome));
    listaBib = { ids: fm.map((x) => x.id), ctx: T("busca") }; sel = null;
    if (!fm.length && !fa.length && !fr.length && !fp.length) { L.innerHTML = vazio(T("Nada encontrado para essa busca.")); return; }
    L.innerHTML = (fm.length ? `<p class="sec-t">${T("Músicas")} · ${fm.length}</p><div class="list">${fm.slice(0, 40).map((x) => linhaFaixa(x)).join("")}</div>${fm.length > 40 ? `<p class="note">${T("Mostrando as 40 primeiras. Digite mais para afinar a busca.")}</p>` : ""}` : "") +
      (fa.length ? `<p class="sec-t">${T("Álbuns")} · ${fa.length}</p><div class="albs poucos">${fa.slice(0, 6).map((a) => `<button class="alb" data-al="${esc(a.n)}">${capaGrupo(a)}<span class="t clip">${esc(a.n)}</span><span class="sub clip">${esc(a.a)}</span></button>`).join("")}</div>` : "") +
      (fr.length ? `<p class="sec-t">${T("Artistas")} · ${fr.length}</p><div class="list">${fr.slice(0, 6).map((a) => `<div class="track"><button class="tp" data-ar="${esc(a.n)}">${capaGrupo(a, "thumb round")}<span class="grow"><span class="t clip">${esc(a.n)}</span><span class="sub clip">${plural(a.fx.length, "música", "músicas")}</span></span></button></div>`).join("")}</div>` : "") +
      (fp.length ? `<p class="sec-t">${T("Playlists")} · ${fp.length}</p><div class="list">${fp.slice(0, 6).map((p) => `<div class="track"><button class="tp" data-irpl="${p.id}">${mosaico(p)}<span class="grow"><span class="t clip">${esc(p.nome)}</span><span class="sub clip">${plural(idsDe(p).length, "música", "músicas")}</span></span></button></div>`).join("")}</div>` : "");
    return;
  }
  if (aba === "pastas") {
    const f = pastas().filter((g) => casa(g.k + " " + g.n));
    L.innerHTML = f.length ? `<div class="list">${f.map((g) => `<div class="track"><button class="tp" data-pasta="${esc(g.k)}"><span class="thumb folder">${ico("folder", 22)}</span><span class="grow"><span class="t clip">${esc(g.n)}</span><span class="sub clip">${g.k && g.k !== g.n ? esc(g.k) + " · " : ""}${plural(g.fx.length, "música", "músicas")}</span></span></button></div>`).join("")}</div><p class="note">${T("As pastas aparecem quando você importa uma pasta inteira ou arrasta pastas para a janela.")}</p>`
      : vazio(importadas().length ? T("Nenhuma pasta encontrada.") : T("As pastas aparecem quando você importa uma pasta inteira. As músicas de exemplo não ficam em pastas."));
    return;
  }
  if (aba === "musicas") {
    const f = ordenar(v).filter((x) => casa(x.t + " " + x.a + " " + (x.al || "")));
    listaBib = { ids: f.map((x) => x.id), ctx: q ? T("busca") : T("Biblioteca") };
    const nEx = v.filter((x) => x.demo).length;
    L.innerHTML = (nEx && !q ? `<div class="card row aviso-ex"><span class="grow note">${T("As {0} músicas marcadas como exemplo servem só para testar o app.", nEx)}</span><button class="btn ghost sm" data-esconder-ex>${T("Esconder")}</button></div>` : "") + `<div class="row bib-acoes"><div class="grow">${f.length && !sel ? botoesTocar(`<button class="btn ghost sm so-ic" data-selecionar aria-label="${T("Selecionar")}" title="${T("Selecionar")}">${ico("check", 18)}</button>`) : ""}</div>
      <select id="ord" class="mini-sel" aria-label="${T("Ordem das músicas")}">${Object.entries(ORDENS).map(([k, n]) => `<option value="${k}"${k === cfg.ord ? " selected" : ""}>${n}</option>`).join("")}</select></div>
      ${f.length ? `<div class="list">${f.map((x) => (sel ? linhaSel(x) : linhaFaixa(x))).join("")}</div>` : vazio(T("Nada encontrado para essa busca."))}${sel ? barraSel(f.length) : ""}`;
  } else if (aba === "albuns") {
    const f = albuns().filter((a) => casa(a.n + " " + a.a));
    L.innerHTML = f.length ? `<div class="albs">${f.map((a) => `<button class="alb" data-al="${esc(a.n)}">${capaGrupo(a)}<span class="t clip">${esc(a.n)}</span><span class="sub clip">${esc(a.a)} · ${plural(a.fx.length, "música", "músicas")}</span></button>`).join("")}</div>` : vazio(T("Nenhum álbum encontrado."));
  } else {
    const f = artistas().filter((a) => casa(a.n));
    L.innerHTML = f.length ? `<div class="list">${f.map((a) => `<div class="track"><button class="tp" data-ar="${esc(a.n)}">${capaGrupo(a, "thumb round")}<span class="grow"><span class="t clip">${esc(a.n)}</span><span class="sub clip">${plural(a.albuns, "álbum", "álbuns")} · ${plural(a.fx.length, "música", "músicas")}</span></span></button></div>`).join("")}</div>` : vazio(T("Nenhum artista encontrado."));
  }
}
function pastas() {
  const m = new Map();
  for (const x of vis()) { if (x.demo) continue; const k = x.pasta || ""; if (!m.has(k)) m.set(k, []); m.get(k).push(x); }
  const nomeArq = (x) => (x.sig || x.t).split("|")[0];
  return [...m].map(([k, fx]) => ({ k, n: k ? k.split("/").pop() : T("Arquivos avulsos"), fx: fx.sort((a, b) => (a.al === b.al ? (a.n || 999) - (b.n || 999) : 0) || comparar(nomeArq(a), nomeArq(b))) }))
    .sort((a, b) => (!a.k) - (!b.k) || comparar(a.k, b.k));
}
function abrirNaBib(tipo, nome) { aberto = { tipo, nome }; ir("biblioteca"); renderBib(); $("main").scrollTop = 0; }
$("q").addEventListener("input", renderBib);
$("seg").addEventListener("click", (e) => { const b = e.target.closest("[data-tab]"); if (b) { aba = b.dataset.tab; sel = null; renderBib(); } });
$("lib").addEventListener("change", (e) => { if (e.target.id === "ord") { cfg.ord = e.target.value; salvarCfg(); renderBib(); } });
$("lib").addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-importar]")) return menuImportar();
  if (t.closest("[data-selecionar]")) { sel = new Set(); return renderBib(); }
  const sa = t.closest("[data-selacao]"); if (sa && sel) return acaoSel(sa.dataset.selacao);
  const si = t.closest("[data-sel-id]"); if (si && sel) { const id = si.dataset.selId; if (sel.has(id)) sel.delete(id); else sel.add(id); return renderBib(); }
  const ip = t.closest("[data-irpl]"); if (ip) { plAberta = ip.dataset.irpl; return ir("playlists"); }
  if (t.closest("[data-esconder-ex]")) { cfg.exemplos = false; cfg.exemplosMexeu = true; salvarCfg(); mudouExemplos(); return toast(T("Exemplos escondidos. Para ver de novo: Ajustes › Reprodução e biblioteca")); }
  if (t.closest("[data-voltar]")) { aberto = null; renderBib(); return; }
  const al = t.closest("[data-al]"); if (al) return abrirNaBib("album", al.dataset.al);
  const ar = t.closest("[data-ar]"); if (ar) return abrirNaBib("artista", ar.dataset.ar);
  const pa = t.closest("[data-pasta]"); if (pa) return abrirNaBib("pasta", pa.dataset.pasta);
  const m = t.closest("[data-more]"); if (m) return menuFaixa(m.dataset.more);
  if (t.closest("[data-tudo]")) return tocarLista(listaBib.ids, 0, listaBib.ctx);
  if (t.closest("[data-aleatorio]")) return tocarAleatorio(listaBib.ids, listaBib.ctx);
  const p = t.closest("[data-play]"); if (p) tocarLista(listaBib.ids, listaBib.ids.indexOf(p.dataset.play), listaBib.ctx);
});
$("b-import").addEventListener("click", menuImportar);
function menuImportar() {
  abrirFolha({
    titulo: T("Importar músicas"),
    html: `<div class="menu">${MUS ? `<button data-i="aparelho">${ico("folder")}${T("Procurar músicas no aparelho")}</button>` : ""}${MUS ? `<button data-i="pastaap">${ico("folder")}${T("Escolher uma pasta")}</button>` : ""}<button data-i="arquivos">${ico("note")}${MUS ? T("Escolher arquivos (cópia dentro do app)") : T("Escolher arquivos")}</button>${NATIVO ? "" : `<button data-i="pasta">${ico("folder")}${T("Escolher uma pasta inteira")}</button>`}</div>
      ${MUS ? `<p class="note" style="padding:0 8px">${T("“Procurar músicas no aparelho” encontra as músicas que o Android já conhece (pasta Música, Downloads e outras), sem copiar nada: o app toca direto do arquivo. “Escolher uma pasta” usa só a pasta que você indicar; o Android decide quais pastas podem ser abertas.")}</p>` : ""}
      <p class="note" style="padding:0 8px">${NATIVO ? T("As músicas ficam guardadas só neste aparelho. Letras em .lrc com o mesmo nome da música entram junto.") : T("As músicas ficam guardadas só neste navegador. Letras em .lrc com o mesmo nome da música entram junto. No PC, você também pode arrastar arquivos e pastas para a janela.")}</p>`,
    clique(e) { const b = e.target.closest("[data-i]"); if (!b) return; fecharFolha(); if (b.dataset.i === "aparelho") return procurarNoAparelho(true); if (b.dataset.i === "pastaap") return escolherPastaAparelho(); $(b.dataset.i === "pasta" ? "folder" : "files").click(); },
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
  marcarFerramentas(); // o EQ ou o temporizador podem ter mudado dentro da folha
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
function toast(msg, acao) { // acao opcional: [rótulo, função] vira um botão no aviso
  const t = $("toast"); t.textContent = msg; t.classList.toggle("acao", !!acao);
  if (acao) { const b = document.createElement("button"); b.type = "button"; b.textContent = acao[0]; b.onclick = () => { t.classList.remove("on", "acao"); acao[1](); }; t.append(b); }
  t.classList.add("on");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("on", "acao"), acao ? 5000 : 2200);
}
function perguntar(titulo, rotulo, valor, botao, cb) {
  abrirFolha({
    titulo,
    html: `<form class="stack"><label class="t" for="pg">${esc(rotulo)}</label><input class="field" id="pg" name="v" value="${esc(valor)}" maxlength="60" required autofocus autocomplete="off"><div class="btns"><button class="btn" type="submit">${esc(botao)}</button><button class="btn ghost" type="button" data-cancelar>${T("Cancelar")}</button></div></form>`,
    enviar(d) { const v = String(d.get("v") || "").trim(); if (!v) return; fecharFolha(); cb(v); },
    clique(e) { if (e.target.closest("[data-cancelar]")) fecharFolha(); },
    depois() { setTimeout(() => { const i = $("pg"); if (i) i.select(); }, 90); },
  });
}
function confirmar(titulo, texto, botao, cb) {
  abrirFolha({
    titulo,
    html: `<p style="padding:0 6px">${esc(texto)}</p><div class="btns"><button class="btn danger" data-sim>${esc(botao)}</button><button class="btn ghost" data-nao autofocus>${T("Cancelar")}</button></div>`,
    clique(e) { if (e.target.closest("[data-sim]")) { fecharFolha(); cb(); } else if (e.target.closest("[data-nao]")) fecharFolha(); },
  });
}

/* ---- Menu de uma música ---- */
function menuFaixa(id, deLista) {
  const x = porId.get(id); if (!x) return;
  const itens = [[ehFav(id) ? "heartOn" : "heart", ehFav(id) ? T("Tirar das favoritas") : T("Adicionar às favoritas"), "fav"], ["seguir", T("Tocar a seguir"), "seguir"], ["addq", T("Adicionar ao fim da fila"), "fila"], ["pls", T("Adicionar a uma playlist"), "addpl"]];
  if (x.al) itens.push(["album", T("Ver álbum"), "album"]);
  itens.push(["artist", T("Ver artista"), "artista"]);
  if (deLista) itens.push(["x", T("Tirar desta playlist"), "tirarpl"]);
  if (!x.demo) itens.push(["lyrics", x.letra ? T("Ver ou editar letra") : T("Adicionar letra"), "letra"], ["edit", T("Editar informações"), "editar"], ["eyeoff", T("Ocultar da biblioteca"), "ocultar"], ["trash", T("Remover da biblioteca"), "apagar", true]);
  abrirFolha({
    titulo: x.t,
    html: `<p class="sub" style="padding:0 8px;margin-top:-6px">${esc(linha2(x))}</p><div class="menu">${itens.map(([i, n, a, perigo]) => `<button data-a="${a}"${perigo ? ' class="danger"' : ""}>${ico(i)}${n}</button>`).join("")}</div>`,
    clique(e) {
      const b = e.target.closest("[data-a]"); if (!b) return;
      const a = b.dataset.a;
      if (a === "fav") { fecharFolha(); alternarFav(id); }
      else if (a === "seguir") { fecharFolha(); tocarASeguir(id); }
      else if (a === "fila") { fecharFolha(); adicionarFila(id); }
      else if (a === "addpl") menuAddPlaylist(id);
      else if (a === "album") { fecharFolha(); abrirNaBib("album", nomeAlbum(x)); }
      else if (a === "artista") { fecharFolha(); abrirNaBib("artista", x.a); }
      else if (a === "tirarpl") { fecharFolha(); const p = pls.find((y) => y.id === deLista); if (p) { p.ids = p.ids.filter((q) => q !== id); salvarPl(p); renderPl(); toast(T("Tirada da playlist")); } }
      else if (a === "letra") editarLetra(x);
      else if (a === "editar") editarInfo(x);
      else if (a === "ocultar") { fecharFolha(); ocultar(id, true); }
      else if (a === "apagar") confirmar(T("Remover da biblioteca?"), T('"{0}" sai do Orolon e de todas as playlists. O arquivo original continua no seu aparelho.', x.t), T("Remover"), () => { removerFaixa(id); toast(T("Música removida")); });
    },
  });
}

/* ---- Fila ---- */
function htmlFila() {
  const x = cur();
  if (!x) return vazio(T("A fila está vazia."));
  const prox = queue.slice(qi + 1).filter((id) => porId.has(id));
  const linhaQ = (y, i, editavel) => `<div class="track${i === qi ? " cur" : ""}" data-row="${y.id}">` +
    (editavel ? `<button class="grip" data-grip aria-label="${T("Mover {0}. Use as setas para cima e para baixo", esc(y.t))}">${ico("grip", 20)}</button>` : "") +
    `<button class="tp" data-pular="${y.id}">${capa(y)}<span class="grow"><span class="t clip">${i === qi ? eqIcone() : ""}${esc(y.t)}</span><span class="sub clip">${esc(y.a)}</span></span></button>` +
    `<span class="dur">${y.d ? fmt(y.d) : ""}</span>` +
    (editavel ? `<button class="ic sm" data-tirar="${y.id}" aria-label="${T("Tirar {0} da fila", esc(y.t))}">${ico("x", 18)}</button>` : "") + "</div>";
  return `<p class="sec-t">${T("Tocando agora")} · ${esc(contexto)}</p><div class="list">${linhaQ(x, qi, false)}</div>
    <div class="row"><p class="sec-t grow">${T("A seguir")} · ${plural(prox.length, "música", "músicas")} · ${fmt(duracaoTotal(prox.map((id) => porId.get(id))))}</p>${prox.length ? `<button class="btn ghost sm" data-limpar>${T("Limpar")}</button>` : ""}</div>
    ${prox.length ? `<div class="list" id="fila-prox">${prox.map((id, j) => linhaQ(porId.get(id), qi + 1 + j, true)).join("")}</div>` : vazio(repeat === "all" ? T("Esta é a última. Depois a fila recomeça.") : T("Esta é a última música da fila."))}
    <p class="note" style="padding:0 8px">${T("Arraste pela alça para mudar a ordem.")}</p>`;
}
function abrirFila() {
  abrirFolha({
    titulo: T("Fila"), modo: "fila", html: htmlFila(),
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
const idsDe = (p) => (p.auto ? p.ids() : p.ids.filter((id) => visivel(porId.get(id))));
const plPorId = (id) => (id ? AUTO.find((a) => a.id === id) || pls.find((p) => p.id === id) : null);
function novaPlaylist(nome, ids = []) {
  const p = { id: uid("p"), nome: nome.slice(0, 60), ids, criada: Date.now() };
  pls.push(p); salvarPl(p); renderPl();
  return p;
}
function mosaico(p, cls = "thumb") {
  const fx = idsDe(p).map((id) => porId.get(id));
  if (fx.length >= 4) return `<span class="${cls} mosaic">${fx.slice(0, 4).map((x) => `<span style="background:${fundoDe(x)}"></span>`).join("")}</span>`;
  if (fx.length) return capa({ ...fx[0], t: p.nome }, cls);
  if (p.auto) return `<span class="${cls} auto-ic">${ico(p.ic, cls === "thumb" ? 22 : 44)}</span>`;
  return `<span class="${cls}" style="background:${grad(coresPadrao(p.nome))}">${inicial(p.nome)}</span>`;
}
function renderPl() {
  renderInicio(); // o Início mostra recentes e favoritas: acompanha toda mudança na biblioteca
  const L = $("pl");
  const p = plPorId(plAberta);
  if (!p) {
    plAberta = null;
    const lista = pls.slice().sort((a, b) => (b.mod || 0) - (a.mod || 0));
    L.innerHTML = `<div><h1>${T("Playlists")}</h1><p class="sub">${plural(pls.length, "playlist sua", "playlists suas")} ${T("e 4 automáticas")}</p></div>
      <div class="autos">${AUTO.map((a) => { const n = idsDe(a).length; return `<button class="auto" data-abrir="${a.id}"><span class="auto-ic">${ico(a.ic, 20)}</span><span class="t">${a.nome}</span><span class="sub">${plural(n, "música", "músicas")}</span></button>`; }).join("")}</div>
      <div class="row"><p class="sec-t grow">${T("Suas playlists")}</p><button class="btn sm" data-nova>${ico("plus", 18)}${T("Nova")}</button></div>` +
      (lista.length ? lista.map((y) => { const fx = idsDe(y).map((id) => porId.get(id)); return `<div class="card row"><button class="tp" data-abrir="${y.id}">${mosaico(y)}<span class="grow"><span class="t clip">${esc(y.nome)}</span><span class="sub clip">${plural(fx.length, "música", "músicas")} · ${fmt(duracaoTotal(fx))}</span></span></button><button class="ic act" data-tocarpl="${y.id}" aria-label="${T("Tocar {0}", esc(y.nome))}">${ico("play")}</button></div>`; }).join("")
        : vazio(T("Crie uma playlist e adicione músicas pelo botão ⋯ de cada uma."), `<button class="btn" data-nova>${ico("plus", 18)}${T("Criar playlist")}</button>`));
    return;
  }
  const fx = idsDe(p).map((id) => porId.get(id));
  const extra = p.auto ? "" : `<button class="btn ghost sm" data-addmus>${ico("plus", 18)}${T("Músicas")}</button><button class="ic sm" data-plmais aria-label="${T("Mais opções da playlist")}">${ico("more", 20)}</button>`;
  L.innerHTML = `<button class="back" data-voltar>${ico("back", 18)}${T("Playlists")}</button>
    <div class="hero">${mosaico(p, "cover")}<div class="grow stack"><div><h1>${esc(p.nome)}</h1><p class="sub">${plural(fx.length, "música", "músicas")} · ${fmt(duracaoTotal(fx))}${p.auto ? T(" · automática") : ""}</p></div></div></div>
    ${fx.length ? botoesTocar(extra) : p.auto ? "" : `<div class="btns"><button class="btn sm" data-addmus>${ico("plus", 18)}${T("Adicionar músicas")}</button><button class="ic sm" data-plmais aria-label="${T("Mais opções da playlist")}">${ico("more", 20)}</button></div>`}
    ${fx.length ? `<div class="list" id="pl-lista">${fx.map((x) => linhaFaixa(x, { grip: !p.auto })).join("")}</div>${p.auto ? "" : `<p class="note">${T("Arraste pela alça para mudar a ordem.")}</p>`}` : vazio(p.auto ? p.vazio : T("Playlist vazia. Adicione músicas da sua biblioteca."))}`;
  if (!p.auto) ativarArraste($("pl-lista"), (ids) => { const fora = p.ids.filter((id) => !ids.includes(id)); p.ids = ids.concat(fora); salvarPl(p); });
}
$("pl").addEventListener("click", (e) => {
  const t = e.target, p = plPorId(plAberta);
  if (t.closest("[data-nova]")) return perguntar(T("Nova playlist"), T("Nome da playlist"), "", T("Criar"), (n) => { const np = novaPlaylist(n); plAberta = np.id; renderPl(); });
  const ab = t.closest("[data-abrir]"); if (ab) { plAberta = ab.dataset.abrir; renderPl(); $("main").scrollTop = 0; return; }
  const tp = t.closest("[data-tocarpl]"); if (tp) { const y = plPorId(tp.dataset.tocarpl); if (y && idsDe(y).length) { tocarLista(idsDe(y), 0, T("playlist {0}", y.nome)); ir("tocando"); } else toast(T("Essa playlist está vazia")); return; }
  if (t.closest("[data-voltar]")) { plAberta = null; renderPl(); return; }
  if (!p) return;
  if (t.closest("[data-tudo]")) return tocarLista(idsDe(p), 0, T("playlist {0}", p.nome));
  if (t.closest("[data-aleatorio]")) return tocarAleatorio(idsDe(p), T("playlist {0}", p.nome));
  if (t.closest("[data-addmus]")) return escolherMusicas(p);
  if (t.closest("[data-plmais]")) return menuPlaylist(p);
  const m = t.closest("[data-more]"); if (m) return menuFaixa(m.dataset.more, p.auto ? null : p.id);
  const pl = t.closest("[data-play]"); if (pl) { const ids = idsDe(p); tocarLista(ids, ids.indexOf(pl.dataset.play), T("playlist {0}", p.nome)); }
});
function menuPlaylist(p) {
  abrirFolha({
    titulo: p.nome,
    html: `<div class="menu"><button data-a="seguir">${ico("seguir")}${T("Tocar a seguir")}</button><button data-a="renomear">${ico("edit")}${T("Renomear")}</button><button data-a="apagar" class="danger">${ico("trash")}${T("Apagar playlist")}</button></div>`,
    clique(e) {
      const b = e.target.closest("[data-a]"); if (!b) return;
      if (b.dataset.a === "renomear") perguntar(T("Renomear playlist"), T("Nome da playlist"), p.nome, T("Salvar"), (n) => { p.nome = n.slice(0, 60); salvarPl(p); renderPl(); });
      else if (b.dataset.a === "seguir") {
        fecharFolha();
        const ids = idsDe(p).filter((id) => id !== queue[qi]);
        if (!queue.length) return tocarLista(idsDe(p), 0, T("playlist {0}", p.nome));
        queue = queue.filter((id, i) => i === qi || !ids.includes(id)); qi = queue.indexOf(cur() ? cur().id : queue[0]);
        queue.splice(qi + 1, 0, ...ids); paint(); renderFilaAberta(); salvarSessao(); toast(T("A playlist toca em seguida"));
      } else confirmar(T("Apagar playlist?"), T('"{0}" será apagada. As músicas continuam na biblioteca.', p.nome), T("Apagar"), () => { apagarPl(p); plAberta = null; renderPl(); toast(T("Playlist apagada")); });
    },
  });
}
function menuAddPlaylist(id) {
  const html = () => `<div class="menu"><button data-nova>${ico("plus")}${T("Nova playlist")}</button>${pls.map((p) => { const tem = p.ids.includes(id); return `<button data-pl="${p.id}" aria-pressed="${tem}">${mosaico(p)}<span class="grow"><span class="t clip">${esc(p.nome)}</span><span class="sub">${plural(idsDe(p).length, "música", "músicas")}</span></span>${tem ? `<span style="color:var(--accent)">${ico("check")}</span>` : ""}</button>`; }).join("")}</div>`;
  abrirFolha({
    titulo: T("Adicionar a uma playlist"), html: html(),
    clique(e) {
      if (e.target.closest("[data-nova]")) return perguntar(T("Nova playlist"), T("Nome da playlist"), "", T("Criar e adicionar"), (n) => { novaPlaylist(n, [id]); toast(T('Adicionada a "{0}"', n)); });
      const b = e.target.closest("[data-pl]"); if (!b) return;
      const p = pls.find((y) => y.id === b.dataset.pl); if (!p) return;
      if (p.ids.includes(id)) { p.ids = p.ids.filter((q) => q !== id); toast(T('Tirada de "{0}"', p.nome)); }
      else { p.ids.push(id); toast(T('Adicionada a "{0}"', p.nome)); }
      salvarPl(p); renderPl(); $("sheet-b").innerHTML = html();
    },
  });
}
function escolherMusicas(p) {
  const lista = (q) => {
    const f = ordenar(vis()).filter((x) => !q || (x.t + " " + x.a + " " + (x.al || "")).toLowerCase().includes(q));
    return f.length ? f.map((x) => { const tem = p.ids.includes(x.id); return `<div class="track" data-row="${x.id}"><button class="tp" data-tg="${x.id}" aria-pressed="${tem}">${capa(x)}<span class="grow"><span class="t clip">${esc(x.t)}</span><span class="sub clip">${esc(linha2(x))}</span></span><span class="ic sm"${tem ? ' style="color:var(--accent)"' : ""}>${ico(tem ? "check" : "plus", 20)}</span></button></div>`; }).join("") : vazio(T("Nada encontrado."));
  };
  abrirFolha({
    titulo: T("Adicionar a {0}", p.nome),
    html: `<input class="search" id="esc-q" type="search" placeholder="${T("Buscar na biblioteca")}" aria-label="${T("Buscar músicas")}" autocomplete="off"><div class="list" id="esc-l">${lista("")}</div><button class="btn" data-ok>${T("Pronto")}</button>`,
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
    <span class="t clip">${esc(t.nome)}</span><span class="sub">${t.fixo ? T("Grátis") : T("Seu tema")}</span></button>
    ${t.fixo ? "" : `<button class="edit" data-editar="${t.id}" aria-label="${T("Editar {0}", esc(t.nome))}">${T("Editar")}</button>`}</div>`;
}
const tg = (chave, rotulo) => `<div class="opt"><span id="l-${chave}">${rotulo}</span><button class="tg" data-tg="${chave}" role="switch" aria-checked="${!!cfg[chave]}" aria-labelledby="l-${chave}"></button></div>`;
const faixaAjuste = (chave, rotulo, ligado) => `<div class="opt sub-opt"${ligado ? "" : " hidden"}><label for="r-${chave}">${rotulo}</label><input type="range" id="r-${chave}" data-rg="${chave}" min="0.15" max="1" step="0.05" value="${cfg[chave]}"></div>`;
/* Ajustes em quatro portas: a raiz é curta (idioma + portas) e cada porta abre uma tela própria */
let porta = null;
const PORTAS = [
  ["aparencia", T("Aparência"), T("Temas, cores e visual"), "thm"],
  ["som", T("Som"), T("Equalizador, época e efeitos"), "sliders"],
  ["reproducao", T("Reprodução e biblioteca"), T("Como as músicas tocam e onde ficam"), "lib"],
  ["sobre", T("Sobre"), T("Backup, versão e privacidade"), "info"],
];
function abrirPorta(id) { porta = id; renderTemas(); $("main").scrollTop = 0; }
function renderTemas() {
  if (editando) return renderEditor();
  const t = temaAtual(), cores = DESTAQUES[escuro(t) ? "escuro" : "claro"];
  if (!porta) {
    $("tm").innerHTML = `<div><h1>${T("Ajustes")}</h1><p class="sub">${T("Temas, efeitos e reprodução. Tudo fica salvo neste aparelho.")}</p></div>
    <div class="card opt"><label class="t" for="s-lang">${T("Idioma")}</label><select id="s-lang" class="mini-sel" data-lang>${Object.entries(IDIOMAS).map(([k, n]) => `<option value="${k}"${k === LANG ? " selected" : ""}>${n}</option>`).join("")}</select></div>
    <div class="stack portas">${PORTAS.map(([id, nome, resumo, ic]) => `<button class="card row porta" data-porta="${id}"><span class="porta-ic">${ico(ic, 22)}</span><span class="grow"><span class="t clip">${nome}</span><span class="sub clip">${resumo}</span></span><span class="chev">${ico("chev", 18)}</span></button>`).join("")}</div>`;
    return;
  }
  const cab = `<div class="row porta-h"><button class="ic sm" data-porta-voltar aria-label="${T("Voltar")}">${ico("back", 22)}</button><h1 class="grow clip">${PORTAS.find((p) => p[0] === porta)[1]}</h1></div>`;
  const partes = {
    aparencia: `
    <p class="sec-t">${T("Temas")}</p>
    <div class="themes">${todosTemas().map(cardTema).join("")}<button class="th add" data-criar>${ico("plus")}${T("Criar tema")}</button></div>
    <p class="sec-t">${T("Galeria")}</p>
    <div class="galeria">${GALERIA.map((g, i) => { const tem = meusTemas.some((m) => m.nome === g.nome); return `<div class="gal"><span class="gal-c" style="background:${g.fundo}"><i style="background:${g.card}"></i><i style="background:${g.destaque}"></i><i style="background:${g.secundaria}"></i></span><span class="t clip grow">${esc(g.nome)}</span><button class="btn ghost sm" data-galeria="${i}"${tem ? " disabled" : ""}>${tem ? T("Adicionado") : T("Adicionar")}</button></div>`; }).join("")}</div>
    <div class="card stack"><h2>${T("Ajuste rápido")}</h2><p class="note">${T("Vale para o tema em uso: {0}.", esc(t.nome))}</p>
      <div class="sw" role="group" aria-label="${T("Cor de destaque")}">${cores.map(([n, c]) => `<button data-cor="${c}" title="${n}" aria-label="${n}" aria-pressed="${c.toUpperCase() === t.destaque.toUpperCase()}" class="${c.toUpperCase() === t.destaque.toUpperCase() ? "sel" : ""}" style="background:${c}"></button>`).join("")}</div>
      <div class="opt"><label for="r-raio">${T("Cantos arredondados")}</label><input id="r-raio" type="range" min="0" max="28" step="2" value="${t.raio}"></div></div>
    <div class="card stack"><h2>${T("Efeitos")}</h2>
      <div class="opt"><span id="l-leve">${T("Modo leve")}</span><button class="tg" data-alternar-leve role="switch" aria-checked="${!!cfg.leve}" aria-labelledby="l-leve"></button></div>
      <p class="note">${T("Desliga as animações que mais pesam. Bom para celulares mais simples ou se a rolagem estiver travando.")}</p>
      ${tg("amb", T("Luz de fundo com as cores da capa"))}${faixaAjuste("ambF", T("Intensidade da luz"), cfg.amb)}
      ${tg("reage", T("Reagir à batida da música"))}${faixaAjuste("batF", T("Força da batida"), cfg.reage)}
      <div class="opt"><span>${T("Imagem de fundo")}</span><div class="btns"><button class="btn ghost sm" data-fundo>${ico("image", 18)}${temFundo() ? T("Trocar") : T("Escolher")}</button>${temFundo() ? `<button class="btn ghost sm" data-semfundo>${T("Tirar")}</button>` : ""}</div></div>
      ${temFundo() ? `<div class="opt sub-opt"><label for="r-blur">${T("Desfoque")}</label><input type="range" id="r-blur" data-rgx="fundoBlur" min="0" max="24" step="1" value="${cfg.fundoBlur}"></div>
      <div class="opt sub-opt"><label for="r-veu">${T("Cor do tema por cima")}</label><input type="range" id="r-veu" data-rgx="fundoVeu" min="0.15" max="0.9" step="0.05" value="${cfg.fundoVeu}"></div>` : ""}
      <p class="note">${T("A imagem fica só neste aparelho e não entra no JSON do tema.")}</p></div>
    <div class="card stack"><h2>${T("Tocando agora")}</h2>
      <p class="t">${T("Visual do mostrador")}</p><div class="chips" role="group" aria-label="${T("Visual do mostrador")}">${Object.entries(VISUAIS).map(([k, n]) => `<button data-vis="${k}" aria-pressed="${cfg.visual === k}" class="${cfg.visual === k ? "on" : ""}">${n}</button>`).join("")}</div>
      ${cfg.visual === "led" ? `<p class="t">${T("Cores do LED")}</p><div class="chips" role="group" aria-label="${T("Cores do LED")}">${[["arte", T("Arte da capa")], ["capa", T("Cores da capa")], ["tema", T("Cores do tema")], ["classico", T("Clássico")]].map(([k, n]) => `<button data-ledcor="${k}" aria-pressed="${cfg.ledCor === k}" class="${cfg.ledCor === k ? "on" : ""}">${n}</button>`).join("")}</div>` : ""}
      <p class="t">${T("Formato da capa")}</p><div class="chips" role="group" aria-label="${T("Formato da capa")}">${[["quadrada", T("Quadrada")], ["redonda", T("Redonda")]].map(([k, n]) => `<button data-forma="${k}" aria-pressed="${cfg.formaCapa === k}" class="${cfg.formaCapa === k ? "on" : ""}">${n}</button>`).join("")}</div>
      <p class="note">${T("Vale para Relógio, Aura, Espectro e Anel. No Vinil a capa é sempre redonda.")}</p>
      ${tg("corCapa", T("Cores do visual seguem a capa da música"))}</div>
    <div class="card stack"><h2>${T("Compartilhar tema")}</h2><p class="note">${T("Um tema é um arquivo JSON pequeno. Exporte o tema em uso ou importe um de outra pessoa.")}</p>
      <div class="btns"><button class="btn ghost sm" data-exp="copiar">${T("Copiar JSON")}</button><button class="btn ghost sm" data-exp="baixar">${T("Baixar .json")}</button><button class="btn ghost sm" data-imp="arquivo">${T("Abrir .json")}</button><button class="btn ghost sm" data-imp="colar">${T("Colar JSON")}</button></div></div>`,
    som: `
    <div class="card stack"><h2>${T("Época do som")}</h2><div class="chips" role="group" aria-label="${T("Época do som")}">${Object.entries(ERAS).map(([k, [n]]) => `<button data-epoca="${k}" aria-pressed="${String(cfg.era) === k}" class="${String(cfg.era) === k ? "on" : ""}">${n}</button>`).join("")}</div>
      <p class="note">${ERA_DESC[cfg.era] || ERA_DESC.off} ${T("Cada época também troca o visual, e você pode escolher outro depois.")}</p>
      ${cfg.era !== "off" && cfg.era !== "90" ? tg("eraRuido", T("Chiado e estalos")) : ""}</div>
    <div class="card stack"><h2>${T("Efeitos")}</h2>
      <p class="t">${T("Amplificador")}</p>${htmlAmp()}
      <p class="t">${T("Reverb")}</p>${htmlReverb()}
      ${htmlLargura("r-largura")}
      <p class="note">${T("O amplificador passa de 100% com um limitador que segura os picos. O efeito 3D fica melhor com fone.")}</p></div>
    <div class="card stack"><h2>${T("Ajustes do som")}</h2>
      <div class="opt"><label for="s-xfade">${T("Crossfade entre músicas")}</label><select id="s-xfade" class="mini-sel" data-sel="xfade">${[[0, T("Desligado")], [2, T("2 segundos")], [4, T("4 segundos")], [6, T("6 segundos")], [8, T("8 segundos")]].map(([v, n]) => `<option value="${v}"${+cfg.xfade === v ? " selected" : ""}>${n}</option>`).join("")}</select></div>
      <div class="opt"><label for="s-vel">${T("Velocidade")}</label><select id="s-vel" class="mini-sel" data-sel="vel">${[0.75, 1, 1.25, 1.5, 2].map((v) => `<option value="${v}"${+cfg.vel === v ? " selected" : ""}>${decimal(String(v))}×</option>`).join("")}</select></div>
      ${tg("nivelar", T("Nivelar o volume entre as músicas"))}
      <div class="btns"><button class="btn ghost sm" data-abrireq>${ico("sliders", 18)}${T("Equalizador")}</button></div></div>`,
    reproducao: `
    <div class="card stack"><h2>${T("Reprodução")}</h2>
      ${tg("fade", T("Suavizar o volume ao pausar e tocar"))}
      ${tg("tela", T("Manter a tela ligada em Tocando agora"))}
      ${NATIVO ? tg("autoTocar", T("Já começar tocando ao abrir o app")) + tg("pausarFone", T("Pausar ao tirar o fone")) + tg("tocarFone", T("Tocar ao conectar o fone")) + `<p class="note">${T("Tocar ao conectar o fone só funciona com o Orolon aberto ou em segundo plano.")}</p>` : ""}
      <div class="opt"><label for="s-anterior">${T("Botão Anterior")}</label><select id="s-anterior" class="mini-sel" data-sel="anterior"><option value="reiniciar"${cfg.anterior !== "sempre" ? " selected" : ""}>${T("Recomeça a música")}</option><option value="sempre"${cfg.anterior === "sempre" ? " selected" : ""}>${T("Volta para a anterior")}</option></select></div>
      <p class="note">${T("Com \"Recomeça a música\", o Anterior volta para o começo se já passaram 3 segundos, e só então para a música anterior.")}</p>
      <div class="btns"><button class="btn ghost sm" data-abrirsono>${ico("timer", 18)}${T("Temporizador")}</button></div></div>
    <div class="card stack"><h2>${T("Biblioteca")}</h2>${tg("exemplos", T("Mostrar as músicas de exemplo"))}${tg("coracoes", T("Mostrar o coração das favoritas nas listas"))}
      ${faixas.some((x) => x.oculta) ? `<div class="opt"><span>${plural(faixas.filter((x) => x.oculta).length, "música oculta", "músicas ocultas")}</span><button class="btn ghost sm" data-verocultas>${T("Ver")}</button></div>` : ""}
      ${MUS ? `<div class="btns"><button class="btn ghost sm" data-aparelho>${T("Procurar novas músicas no aparelho")}</button>${importadas().some((x) => x.mid) ? `<button class="btn ghost sm" data-pastasap>${T("Pastas do aparelho")}</button>` : ""}<button class="btn ghost sm" data-pastasesc>${T("Pastas escolhidas")}${(cfg.pastasEscolhidas || []).length ? " · " + cfg.pastasEscolhidas.length : ""}</button></div>` : ""}
      <p class="note" id="espaco">${T("Calculando o espaço usado…")}</p>
      ${importadas().length ? `<div class="btns"><button class="btn danger sm" data-limparbib>${T("Apagar todas as músicas importadas")}</button></div>` : ""}
      ${NATIVO ? "" : `<p class="note">${T("Atalhos no PC: espaço toca e pausa, setas ← e → voltam ou avançam 5 segundos, N e P trocam de música, F favorita, ↑ e ↓ mudam o volume, M deixa mudo.")}</p>`}</div>`,
    sobre: `
    <div class="card stack"><h2>${T("Backup")}</h2><p class="note">${T("Guarda num arquivo as playlists, favoritas, estatísticas, letras, perfil, temas e ajustes. As músicas não entram: no aparelho novo, importe as músicas primeiro e depois restaure.")}</p>
      <div class="btns"><button class="btn ghost sm" data-bkp>${T("Salvar backup")}</button><button class="btn ghost sm" data-rst>${T("Restaurar backup")}</button></div></div>
    <div class="card stack"><h2>${T("Sobre")}</h2><p class="note">${NATIVO ? T("Orolon Player {0}. Sem anúncios, sem conta e sem coleta de dados: tudo o que você guarda fica neste aparelho.", VERSAO) : T("Orolon Player {0}. Código aberto, sem anúncios e sem conta. Se o app te ajuda, apoiar o projeto mantém ele assim.", VERSAO)}</p>
      ${NATIVO ? "" : `<div class="btns"><a class="btn sm" href="https://github.com/sponsors/KiraraHoshi" target="_blank" rel="noopener">${ico("heartOn", 18)}${T("Apoiar o projeto")}</a><a class="btn ghost sm" href="https://github.com/KiraraHoshi/compasso-player" target="_blank" rel="noopener">${T("Código no GitHub")}</a></div>`}
      <div class="btns">${instalado() ? "" : `<button class="btn ghost sm" data-instalar>${T("Instalar como app")}</button>`}<button class="btn ghost sm" data-boasvindas>${T("Ver as boas-vindas")}</button><a class="btn ghost sm" href="${linkPrivacidade()}" target="_blank" rel="noopener">${T("Política de privacidade")}</a></div>
      ${NATIVO ? `<p class="note">${T("Enquanto o Orolon não está na Google Play, as versões novas ficam no GitHub. Baixe o APK e instale por cima deste: suas músicas, playlists e ajustes continuam. O app não procura atualizações sozinho, porque não usa a internet.")}</p><div class="btns"><a class="btn ghost sm" href="https://github.com/KiraraHoshi/compasso-player/releases/tag/android-teste" target="_blank" rel="noopener">${T("Ver se há versão nova")}</a></div>` : `<p class="note">${T("Os dois botões de cima e o da política de privacidade abrem o navegador. O app em si não se conecta a nada.")}</p>`}</div>`,
  };
  $("tm").innerHTML = cab + partes[porta];
  if (porta === "reproducao") espaco();
}
async function espaco() {
  const imp = importadas().filter((x) => x.arq), soma = imp.reduce((s, x) => s + x.arq.size, 0), ap = importadas().filter((x) => x.mid).length;
  let txt = imp.length ? `${plural(imp.length, "música importada ocupa", "músicas importadas ocupam")} ${mb(soma)}${NATIVO ? T(" neste aparelho.") : T(" neste navegador.")}` : (ap ? "" : T("Nenhuma música importada ainda."));
  if (ap) txt = (txt ? txt + " " : "") + T("{0} do aparelho tocam direto do arquivo e não ocupam espaço extra.", plural(ap, "música", "músicas"));
  try { if (navigator.storage && navigator.storage.estimate) { const e = await navigator.storage.estimate(); if (e.quota) txt += T(" Espaço livre para o app: cerca de {0}.", mb(Math.max(0, e.quota - e.usage))); } } catch (e) { /* sem estimativa */ }
  if (!db) txt += " " + T("Este navegador não deixou guardar a biblioteca, então as músicas somem ao fechar.");
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
  if (!o || typeof o !== "object" || Array.isArray(o)) throw new Error(T("Esse conteúdo não é um tema do Orolon."));
  const t = { nome: String(o.nome || T("Tema importado")).trim().slice(0, 40) || T("Tema importado") };
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
    toast(T('Tema "{0}" importado', t.nome));
    return true;
  } catch (e) {
    toast(e instanceof SyntaxError ? T("O texto não é um JSON válido") : e.message);
    return false;
  }
}
async function copiar(texto) {
  try { await navigator.clipboard.writeText(texto); toast(T("Copiado")); }
  catch (e) {
    abrirFolha({ titulo: T("Copiar tema"), html: `<p class="note">${T("Selecione o texto abaixo e copie.")}</p><textarea class="field" readonly id="cp">${esc(texto)}</textarea>`, depois() { setTimeout(() => { const a = $("cp"); if (a) a.select(); }, 90); } });
  }
}
$("tm").addEventListener("click", (e) => {
  { const pt = e.target.closest("[data-porta]"); if (pt) return abrirPorta(pt.dataset.porta); if (e.target.closest("[data-porta-voltar]")) return abrirPorta(null); }
  if (editando) return cliqueEditor(e);
  const t = e.target;
  const ed = t.closest("[data-editar]"); if (ed) { const x = temaPorId(ed.dataset.editar); editando = { id: x.id, rascunho: { ...x } }; renderTemas(); $("main").scrollTop = 0; return; }
  const th = t.closest("[data-tema]"); if (th) { cfg.tema = th.dataset.tema; aplicarTema(); renderTemas(); return; }
  if (t.closest("[data-criar]")) {
    const n = meusTemas.length + 1;
    editando = { id: null, rascunho: { ...temaAtual(), id: undefined, fixo: undefined, nome: T("Meu tema {0}", n) } };
    renderTemas(); $("main").scrollTop = 0; return;
  }
  const c = t.closest("[data-cor]"); if (c) { ajustarAtual({ destaque: c.dataset.cor }); renderTemas(); return; }
  const g = t.closest("[data-tg]");
  if (g) {
    const k = g.dataset.tg; cfg[k] = !cfg[k]; salvarCfg(); aplicarEfeitos();
    if (k === "exemplos") { cfg.exemplosMexeu = true; salvarCfg(); mudouExemplos(); }
    if (k === "tela") atualizarTela();
    if (k === "nivelar" && ctx) trocarEfeitos();
    if (k === "eraRuido") ajustarRuido();
    if (k === "coracoes") { renderBib(); renderPl(); }
    if (k === "corCapa") atualizarCorViz();
    renderTemas(); return;
  }
  if (t.closest("[data-alternar-leve]")) return definirLeve(!cfg.leve);
  const ga = t.closest("[data-galeria]");
  if (ga) { const n = validarTema(GALERIA[+ga.dataset.galeria]); n.id = uid("t"); meusTemas.push(n); salvarTemas(); cfg.tema = n.id; aplicarTema(); renderTemas(); return toast(T('Tema "{0}" adicionado', n.nome)); }
  if (t.closest("[data-instalar]")) return pedirInstalacao();
  if (t.closest("[data-boasvindas]")) return boasVindas();
  if (t.closest("[data-aparelho]")) return procurarNoAparelho(true);
  if (t.closest("[data-pastasap]")) return menuPastasAparelho();
  if (t.closest("[data-pastasesc]")) return menuPastasEscolhidas();
  const lc = t.closest("[data-ledcor]"); if (lc) { cfg.ledCor = lc.dataset.ledcor; salvarCfg(); ledId = null; prepararLed(cur()); return renderTemas(); }
  const fo = t.closest("[data-forma]"); if (fo) { cfg.formaCapa = fo.dataset.forma; salvarCfg(); aplicarVisual(); return renderTemas(); }
  const vi = t.closest("[data-vis]"); if (vi) { escolherVisual(vi.dataset.vis); return renderTemas(); }
  const ep = t.closest("[data-epoca]"); if (ep) { escolherEpoca(ep.dataset.epoca); return renderTemas(); }
  const am = t.closest("[data-amp]"); if (am) { escolherAmp(+am.dataset.amp); return renderTemas(); }
  const rv = t.closest("[data-reverb]"); if (rv) { escolherReverb(rv.dataset.reverb); return renderTemas(); }
  if (t.closest("[data-abrireq]")) return abrirEQ();
  if (t.closest("[data-bkp]")) return salvarBackup();
  if (t.closest("[data-rst]")) return $("backup-file").click();
  if (t.closest("[data-fundo]")) return escolherFundo();
  if (t.closest("[data-semfundo]")) { try { localStorage.removeItem("compasso.fundo"); } catch (err) { /* ignora */ } aplicarFundo(); renderTemas(); return toast(T("Imagem de fundo removida")); }
  if (t.closest("[data-verocultas]")) return verOcultas();
  if (t.closest("[data-abrirsono]")) return abrirSono();
  const ex = t.closest("[data-exp]");
  if (ex) {
    const at = temaAtual(), json = temaJSON(at);
    if (ex.dataset.exp === "copiar") return copiar(json);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    a.download = (at.nome.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "tema") + ".json";
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
    return toast(T("Se o download não começar, use Copiar JSON"));
  }
  const im = t.closest("[data-imp]");
  if (im) {
    if (im.dataset.imp === "arquivo") return $("tema-file").click();
    return abrirFolha({
      titulo: T("Colar tema"),
      html: `<form class="stack"><label class="t" for="cola">${T("Cole o JSON do tema")}</label><textarea class="field" id="cola" name="v" required autofocus placeholder='{ "nome": "...", "fundo": "#14111F", ... }'></textarea><button class="btn" type="submit">${T("Importar tema")}</button></form>`,
      enviar(d) { if (importarTema(String(d.get("v") || ""))) fecharFolha(); },
    });
  }
  if (t.closest("[data-limparbib]")) {
    return confirmar(T("Apagar músicas importadas?"), plural(importadas().length, "música sai", "músicas saem") + T(" do Orolon. Os arquivos originais continuam no seu aparelho. As playlists ficam, mas sem essas músicas."), T("Apagar tudo"), () => {
      importadas().forEach((x) => removerFaixa(x.id, true));
      (cfg.pastasEscolhidas || []).forEach((p) => nat(() => MUS && MUS.soltarPasta({ uri: p.uri }))); cfg.pastasEscolhidas = [];
      cfg.aparelho = false; salvarCfg(); // não procura de novo sozinho; o botão "Procurar" traz tudo de volta
      renderTemas(); toast(T("Biblioteca limpa"));
    });
  }
});
$("tm").addEventListener("input", (e) => {
  if (editando) return entradaEditor(e);
  const t = e.target;
  if (t.id === "r-raio") ajustarAtual({ raio: +t.value });
  else if (t.dataset.rg) { cfg[t.dataset.rg] = +t.value; salvarCfg(); aplicarEfeitos(); }
  else if (t.dataset.rgx) { cfg[t.dataset.rgx] = +t.value; salvarCfg(); aplicarFundo(); }
  else if (t.dataset.fx === "largura") escolherLargura(t.value);
});
$("tm").addEventListener("change", (e) => {
  if (e.target.id === "s-lang") return mudarIdioma(e.target.value);
  const k = e.target.dataset.sel; if (!k) return;
  cfg[k] = k === "xfade" || k === "vel" ? +e.target.value : e.target.value; salvarCfg();
  if (k === "vel") aplicarVel();
});
$("backup-file").addEventListener("change", async (e) => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  try {
    const r = restaurarBackup(JSON.parse(await f.text()));
    toast(T("Backup restaurado: {0}", plural(r.nPl, "playlist", "playlists")) + (r.total ? T(", {0} de {1} músicas encontradas", r.achadas, r.total) : ""));
    if (r.total > r.achadas) setTimeout(() => toast(T("Importe as músicas que faltam e restaure de novo para completar")), 2600);
  } catch (err) { toast(err instanceof SyntaxError ? T("O arquivo não é um JSON válido") : err.message); }
});
$("tema-file").addEventListener("change", async (e) => {
  const f = e.target.files[0]; e.target.value = ""; if (!f) return;
  if (f.size > 100000) return toast(T("Esse arquivo é grande demais para ser um tema"));
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
  const linha = (rot, a, b, min) => { const r = contraste(a, b), ok = r >= min; return `<div class="row"><span class="grow note">${rot}</span><span class="chip ${ok ? "ok" : "warn"}">${decimal(r.toFixed(1))}:1 · ${ok ? T("legível") : T("fraco")}</span></div>`; };
  return linha(T("Texto sobre o fundo"), d.texto, d.fundo, 4.5) + linha(T("Texto sobre os cartões"), d.texto, d.card, 4.5) + linha(T("Texto suave sobre o fundo"), d.suave, d.fundo, 4.5) + linha(T("Destaque sobre o fundo"), d.destaque, d.fundo, 3);
}
function renderEditor() {
  const d = editando.rascunho;
  $("tm").innerHTML = `<button class="back" data-voltar>${ico("back", 18)}${T("Temas")}</button>
    <div><h1>${editando.id ? T("Editar tema") : T("Novo tema")}</h1><p class="sub">${T("O app inteiro mostra o tema enquanto você edita.")}</p></div>
    <div class="card stack"><label class="t" for="e-nome">${T("Nome")}</label><input class="field" id="e-nome" value="${esc(d.nome)}" maxlength="40" autocomplete="off"></div>
    <div class="card stack"><h2>${T("Cores")}</h2>
      ${CAMPOS.map(([k, n]) => `<label class="color-row" for="e-${k}"><span class="grow">${n}</span><code id="x-${k}">${d[k]}</code><input type="color" id="e-${k}" data-campo="${k}" value="${d[k].toLowerCase()}"></label>`).join("")}
      <div class="stack" id="e-contraste" style="gap:6px">${htmlContraste(d)}</div></div>
    <div class="card stack"><div class="opt"><label for="e-raio">${T("Cantos arredondados")}</label><input type="range" id="e-raio" min="0" max="28" step="2" value="${d.raio}"></div></div>
    <div class="card stack"><h2>${T("Fonte")}</h2><div class="fonts">${Object.entries(FONTES).map(([k, f]) => `<button data-fonte="${k}" aria-pressed="${d.fonte === k}" class="${d.fonte === k ? "on" : ""}" style="font-family:${esc(f.b)}"><b style="font-family:${esc(f.d)}">Aa</b>${f.n}</button>`).join("")}</div></div>
    <div class="btns"><button class="btn" data-salvar>${T("Salvar tema")}</button><button class="btn ghost" data-voltar>${T("Cancelar")}</button>${editando.id ? `<button class="btn danger" data-apagar>${T("Apagar tema")}</button>` : ""}</div>`;
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
    salvarTemas(); cfg.tema = novo.id; editando = null; aplicarTema(); renderTemas(); toast(T("Tema salvo"));
    return;
  }
  if (t.closest("[data-apagar]")) {
    const id = editando.id;
    confirmar(T("Apagar tema?"), T('"{0}" será apagado deste aparelho.', d.nome), T("Apagar"), () => {
      meusTemas = meusTemas.filter((x) => x.id !== id); salvarTemas();
      if (cfg.tema === id) cfg.tema = escuro(d) ? "escuro" : "claro";
      editando = null; aplicarTema(); renderTemas(); toast(T("Tema apagado"));
    });
  }
}


/* ===================== Equalizador ===================== */
const EQ5 = [60, 230, 910, 3600, 14000], EQ10 = [31, 62, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];
const rotHz = (f) => (f >= 1000 ? decimal(String(f / 1000)) + " kHz" : f + " Hz");
const EQ_P = { // predefinições em 5 bandas; a versão de 10 bandas é calculada a partir delas
  normal: [T("Normal"), [0, 0, 0, 0, 0]], graves: [T("Mais graves"), [6, 4, 0, 0, 0]], rock: [T("Rock"), [5, 3, -1, 3, 5]],
  pop: [T("Pop"), [-1, 2, 4, 2, -1]], hiphop: [T("Hip-hop"), [5, 4, 0, 1, 3]], funk: [T("Funk"), [6, 4, 0, 1, 2]],
  jazz: [T("Jazz"), [3, 2, -1, 2, 3]], classica: [T("Clássica"), [4, 2, -1, 2, 4]], acustico: [T("Acústico"), [3, 1, 1, 2, 3]],
  eletronica: [T("Eletrônica"), [5, 3, 0, 2, 4]], vocal: [T("Vocal e podcast"), [-2, -1, 3, 4, 1]],
  agudos: [T("Mais agudos"), [0, 0, 0, 3, 6]], lofi: [T("Lo-fi"), [3, 1, 0, -3, -6]], baixo: [T("Volume baixo"), [5, 2, 0, 1, 4]],
  noite: [T("Noite (suave)"), [2, 1, 0, -2, -4]],
};
function interp(fs, gs, f) { // interpolação em escala logarítmica de frequência
  if (f <= fs[0]) return gs[0];
  if (f >= fs[fs.length - 1]) return gs[gs.length - 1];
  let i = 0; while (fs[i + 1] < f) i++;
  const t = (Math.log(f) - Math.log(fs[i])) / (Math.log(fs[i + 1]) - Math.log(fs[i]));
  return Math.round(gs[i] + (gs[i + 1] - gs[i]) * t);
}
cfg.eq = Object.assign({ on: false, modo: 5, g: [0, 0, 0, 0, 0], g10: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0], p: "normal" }, cfg.eq || {});
if (!Array.isArray(cfg.eq.g) || cfg.eq.g.length !== 5) cfg.eq.g = [0, 0, 0, 0, 0];
if (!Array.isArray(cfg.eq.g10) || cfg.eq.g10.length !== 10) cfg.eq.g10 = EQ10.map((f) => interp(EQ5, cfg.eq.g, f));
if (cfg.eq.modo !== 10) cfg.eq.modo = 5;
const eqBandas = () => (cfg.eq.modo === 10 ? EQ10 : EQ5);
const eqGanhos = () => (cfg.eq.modo === 10 ? cfg.eq.g10 : cfg.eq.g);
/* ---- Efeitos (1.19): aprimorador, 3D e reverb. Cada construtora aceita qualquer contexto de áudio (os testes usam um OfflineAudioContext) ---- */
const REVERBS = { nenhum: null, sala: [1.2, 3], palco: [2.2, 2.5], catedral: [4.5, 2] }; // [segundos, quão rápido decai]
function impulsoReverb(c, segundos, decai) { // ruído estéreo que some aos poucos: gerado no aparelho, sem arquivo
  const n = Math.max(1, Math.round(c.sampleRate * segundos)), b = c.createBuffer(2, n, c.sampleRate);
  for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, decai); }
  return b;
}
const impulsos = {};
function criarReverb(c, tipo) {
  const r = REVERBS[tipo]; if (!r) return null;
  const entrada = c.createGain(), saida = c.createGain(), seco = c.createGain(), molhado = c.createGain(), conv = c.createConvolver();
  const chave = tipo + "@" + c.sampleRate; // gerar o impulso custa caro no celular: faz uma vez por tipo
  seco.gain.value = 0.9; molhado.gain.value = 0.28; conv.buffer = impulsos[chave] || (impulsos[chave] = impulsoReverb(c, r[0], r[1]));
  entrada.connect(seco).connect(saida); entrada.connect(conv).connect(molhado).connect(saida);
  return { entrada, saida, nos: [entrada, seco, conv, molhado, saida] };
}
function criarLargura(c, largura) { // meio/lado: o "lado" (diferença entre L e R) é multiplicado; o mono (L = R) não muda
  const entrada = c.createGain(), sep = c.createChannelSplitter(2), meio = c.createGain(), lado = c.createGain(), invR = c.createGain(), invLado = c.createGain(), saida = c.createChannelMerger(2);
  entrada.channelCount = 2; entrada.channelCountMode = "explicit"; entrada.channelInterpretation = "speakers"; // mono vira estéreo antes de separar
  meio.gain.value = 0.5; lado.gain.value = 0.5 * Math.max(1, Math.min(2, largura)); invR.gain.value = -1; invLado.gain.value = -1;
  entrada.connect(sep);
  sep.connect(meio, 0); sep.connect(meio, 1); sep.connect(lado, 0); sep.connect(invR, 1); invR.connect(lado);
  meio.connect(saida, 0, 0); meio.connect(saida, 0, 1); lado.connect(saida, 0, 0); lado.connect(invLado); invLado.connect(saida, 0, 1);
  return { entrada, saida, lado, nos: [entrada, sep, meio, lado, invR, invLado, saida] };
}
const ATRASO_COMPRESSOR = 0.006; // o compressor do navegador "olha à frente" 6 ms e entrega o som com esse atraso
function criarAprimorador(c, graves, agudos, intensidade) {
  const lim = (v) => Math.max(-6, Math.min(9, +v || 0));
  const entrada = c.createBiquadFilter(), ag = c.createBiquadFilter(), saida = c.createGain(), cp = c.createDynamicsCompressor(), mix = c.createGain(), direto = c.createDelay(0.05);
  direto.delayTime.value = ATRASO_COMPRESSOR; // sem isso, a soma dos dois caminhos cava buracos no som (filtro pente)
  entrada.type = "lowshelf"; entrada.frequency.value = 110; entrada.gain.value = lim(graves);
  ag.type = "highshelf"; ag.frequency.value = 7000; ag.gain.value = lim(agudos);
  cp.threshold.value = -30; cp.ratio.value = 4; mix.gain.value = Math.max(0, Math.min(1, +intensidade || 0)) * 0.6; // compressão paralela: encorpa sem achatar
  entrada.connect(ag); ag.connect(direto).connect(saida); ag.connect(cp).connect(mix).connect(saida);
  return { entrada, saida, graves: entrada, agudos: ag, mix, nos: [entrada, ag, direto, cp, mix, saida] };
}
let efeitosVivos = null;
const assinaturaEfeitos = () => [!!(+cfg.apGraves || +cfg.apAgudos || +cfg.apInt), +cfg.largura > 1, REVERBS[cfg.reverb] ? cfg.reverb : "nenhum"].join("|");
function montarEfeitos(depois) { // aprimorador → 3D → reverb; efeito no valor neutro não entra na cadeia
  efeitosNos.forEach((n) => n.disconnect()); efeitosNos = [];
  const blocos = [], ap = (+cfg.apGraves || +cfg.apAgudos || +cfg.apInt) ? criarAprimorador(ctx, cfg.apGraves, cfg.apAgudos, cfg.apInt) : null, lg = +cfg.largura > 1 ? criarLargura(ctx, +cfg.largura) : null;
  if (ap) blocos.push(ap);
  if (lg) blocos.push(lg);
  const rv = criarReverb(ctx, cfg.reverb); if (rv) blocos.push(rv);
  efeitosVivos = { assin: assinaturaEfeitos(), ap, lg };
  return blocos.reduce((a, b) => { a.connect(b.entrada); efeitosNos.push(...b.nos); return b.saida; }, depois);
}
function atualizarEfeitos() { // os mesmos efeitos continuam ligados? só muda o valor (arrastar a faixa não corta o som); senão remonta
  if (!ctx) return;
  const v = efeitosVivos, t = ctx.currentTime;
  if (!v || v.assin !== assinaturaEfeitos()) return trocarEfeitos();
  if (v.lg) v.lg.lado.gain.setTargetAtTime(0.5 * Math.max(1, Math.min(2, +cfg.largura)), t, 0.03);
  if (v.ap) {
    v.ap.graves.gain.setTargetAtTime(Math.max(-6, Math.min(9, +cfg.apGraves || 0)), t, 0.03);
    v.ap.agudos.gain.setTargetAtTime(Math.max(-6, Math.min(9, +cfg.apAgudos || 0)), t, 0.03);
    v.ap.mix.gain.setTargetAtTime(Math.max(0, Math.min(1, +cfg.apInt || 0)) * 0.6, t, 0.03);
  }
}
const NOMES_REVERB = { nenhum: T("Nenhum"), sala: T("Sala"), palco: T("Palco"), catedral: T("Catedral") };
const htmlAmp = () => chipsDe(AMPS.map((v) => [String(v), Math.round(v * 100) + "%"]), String(ganhoAmp()), "data-amp");
const htmlReverb = () => chipsDe(Object.keys(REVERBS).map((k) => [k, NOMES_REVERB[k]]), REVERBS[cfg.reverb] ? cfg.reverb : "nenhum", "data-reverb");
const htmlLargura = (id) => `<div class="opt"><label for="${id}">${T("Efeito 3D")}</label><input type="range" id="${id}" data-fx="largura" min="0" max="100" step="5" value="${Math.round((Math.max(1, Math.min(2, +cfg.largura || 1)) - 1) * 100)}"></div>`;
function escolherReverb(k) { cfg.reverb = REVERBS[k] ? k : "nenhum"; salvarCfg(); atualizarEfeitos(); marcarFerramentas(); }
function escolherLargura(pct) { cfg.largura = 1 + Math.max(0, Math.min(100, +pct || 0)) / 100; salvarCfg(); atualizarEfeitos(); marcarFerramentas(); }
function escolherAprimorador(k, v) { if (k === "apInt") v = Math.max(0, Math.min(100, +v || 0)) / 100; cfg[k] = +v || 0; salvarCfg(); atualizarEfeitos(); }
let trocaPend = 0;
function trocarEfeitos() { // troca sem estalo: fecha a saída dos efeitos (a cauda do reverb some junto), remonta a cadeia e reabre
  if (!ctx || trocaPend) return; // já há uma troca a caminho: ela vai ler os valores mais novos
  eraIn.gain.setTargetAtTime(0, ctx.currentTime, 0.008);
  trocaPend = setTimeout(() => { trocaPend = 0; montarFiltros(); eraIn.gain.setTargetAtTime(1, ctx.currentTime, 0.03); }, 45);
}
function montarFiltros() {
  if (!ctx) return;
  if (filtros) { entrada.disconnect(); filtros.forEach((f) => f.disconnect()); }
  if (comp) { comp.forEach((n) => n.disconnect()); comp = null; }
  const F = eqBandas();
  filtros = F.map((f, i) => {
    const b = ctx.createBiquadFilter();
    b.type = i === 0 ? "lowshelf" : i === F.length - 1 ? "highshelf" : "peaking";
    b.frequency.value = f; b.Q.value = F.length === 10 ? 1.4 : 1.1;
    return b;
  });
  let fim = filtros.reduce((a, b) => (a.connect(b), b), entrada);
  if (cfg.nivelar) { // compressor suave: aproxima o volume das músicas baixas e altas
    const c = ctx.createDynamicsCompressor(), m = ctx.createGain();
    c.threshold.value = -24; c.knee.value = 24; c.ratio.value = 3; c.attack.value = 0.01; c.release.value = 0.3; m.gain.value = 1.5;
    fim.connect(c); c.connect(m); comp = [c, m]; fim = m;
  }
  montarEfeitos(fim).connect(eraIn);
  montarEra(); aplicarEQ();
}
function aplicarEQ() {
  if (!filtros) return;
  const g = cfg.eq.on ? eqGanhos() : eqGanhos().map(() => 0), t = ctx.currentTime;
  filtros.forEach((f, i) => f.gain.setTargetAtTime(g[i] || 0, t, 0.05));
  const pico = Math.max(0, ...g); // abaixa o volume de entrada para o reforço não distorcer
  entrada.gain.setTargetAtTime(Math.pow(10, (-pico * 0.6) / 20), t, 0.05);
}
const dB = (v) => (v > 0 ? "+" : v < 0 ? "−" : "") + Math.abs(v) + " dB";
function htmlEQ() {
  const F = eqBandas(), G = eqGanhos();
  return `<div class="opt"><span id="l-eqon">${T("Equalizador ligado")}</span><button class="tg" data-eqon role="switch" aria-checked="${cfg.eq.on}" aria-labelledby="l-eqon"></button></div>
    <div class="seg" role="group" aria-label="${T("Quantidade de bandas")}"><button data-eqmodo="5" class="${cfg.eq.modo === 5 ? "on" : ""}" aria-pressed="${cfg.eq.modo === 5}">${T("5 bandas")}</button><button data-eqmodo="10" class="${cfg.eq.modo === 10 ? "on" : ""}" aria-pressed="${cfg.eq.modo === 10}">${T("10 bandas")}</button></div>
    <div class="chips" role="group" aria-label="${T("Predefinições")}">${Object.entries(EQ_P).map(([k, [n]]) => `<button data-eqp="${k}" aria-pressed="${cfg.eq.p === k}" class="${cfg.eq.p === k ? "on" : ""}">${n}</button>`).join("")}</div>
    ${F.map((f, i) => `<div class="eqrow"><label for="eq${i}" class="note">${rotHz(f)}</label><input type="range" id="eq${i}" data-eqb="${i}" min="-12" max="12" step="1" value="${G[i]}"><span class="dur" id="eqv${i}">${dB(G[i])}</span></div>`).join("")}
    <p class="note">${T("Vale para todas as músicas. Mexer numa faixa liga o equalizador sozinho.")}</p>
    <h3 class="sec-t">${T("Aprimorador")}</h3>
    <div class="eqrow"><label for="r-apGraves" class="note">${T("Graves")}</label><input type="range" id="r-apGraves" data-ap="apGraves" min="-6" max="9" step="1" value="${+cfg.apGraves || 0}"><span class="dur" id="apv-apGraves">${dB(+cfg.apGraves || 0)}</span></div>
    <div class="eqrow"><label for="r-apAgudos" class="note">${T("Agudos")}</label><input type="range" id="r-apAgudos" data-ap="apAgudos" min="-6" max="9" step="1" value="${+cfg.apAgudos || 0}"><span class="dur" id="apv-apAgudos">${dB(+cfg.apAgudos || 0)}</span></div>
    <div class="eqrow"><label for="r-apInt" class="note">${T("Intensidade")}</label><input type="range" id="r-apInt" data-ap="apInt" min="0" max="100" step="5" value="${Math.round((+cfg.apInt || 0) * 100)}"><span class="dur" id="apv-apInt">${Math.round((+cfg.apInt || 0) * 100)}%</span></div>
    <div class="btns"><button class="btn ghost sm" data-apzerar>${T("Zerar")}</button></div>
    <p class="note">${T("Reforça graves e agudos e deixa o som mais encorpado, sem mexer no equalizador.")}</p>`;
}
function abrirEQ() {
  abrirFolha({
    titulo: T("Equalizador"), modo: "eq", html: htmlEQ(),
    clique(e) {
      const on = e.target.closest("[data-eqon]");
      if (on) { cfg.eq.on = !cfg.eq.on; on.setAttribute("aria-checked", cfg.eq.on); }
      const p = e.target.closest("[data-eqp]");
      if (p) { cfg.eq.p = p.dataset.eqp; cfg.eq.g = EQ_P[cfg.eq.p][1].slice(); cfg.eq.g10 = EQ10.map((f) => interp(EQ5, cfg.eq.g, f)); cfg.eq.on = true; }
      const m = e.target.closest("[data-eqmodo]");
      if (m && +m.dataset.eqmodo !== cfg.eq.modo) {
        if (cfg.eq.modo === 5) cfg.eq.g10 = EQ10.map((f) => interp(EQ5, cfg.eq.g, f));
        else cfg.eq.g = EQ5.map((f) => interp(EQ10, cfg.eq.g10, f));
        cfg.eq.modo = +m.dataset.eqmodo; trocarEfeitos();
      }
      if (e.target.closest("[data-apzerar]")) { cfg.apGraves = cfg.apAgudos = cfg.apInt = 0; salvarCfg(); atualizarEfeitos(); $("sheet-b").innerHTML = htmlEQ(); return; }
      if (p || m) $("sheet-b").innerHTML = htmlEQ();
      if (on || p || m) { salvarCfg(); aplicarEQ(); paint(); }
    },
    entrada(e) {
      const ap = e.target.dataset.ap;
      if (ap) { escolherAprimorador(ap, +e.target.value); $("apv-" + ap).textContent = ap === "apInt" ? e.target.value + "%" : dB(+e.target.value); return; }
      const i = e.target.dataset.eqb; if (i === undefined) return;
      eqGanhos()[i] = +e.target.value; cfg.eq.p = "personalizado";
      $("eqv" + i).textContent = dB(eqGanhos()[i]);
      if (!cfg.eq.on) { cfg.eq.on = true; const t = $("sheet-b").querySelector("[data-eqon]"); if (t) t.setAttribute("aria-checked", "true"); }
      $("sheet-b").querySelectorAll("[data-eqp]").forEach((b) => { b.classList.remove("on"); b.setAttribute("aria-pressed", "false"); });
      salvarCfg(); aplicarEQ(); paint();
    },
  });
}

/* ===================== Favoritas e estatísticas ===================== */
let favs = new Set(guardado.get("compasso.fav", []));
const ehFav = (id) => favs.has(id);
function alternarFav(id) {
  if (!id) return;
  if (favs.has(id)) { favs.delete(id); toast(T("Tirada das favoritas")); } else { favs.add(id); toast(T("Adicionada às favoritas")); }
  guardado.set("compasso.fav", [...favs]);
  paint(); renderBib(); renderPl(); if ($("app").dataset.view === "voce") renderVoce();
}
let stats = guardado.get("compasso.stats", null);
if (!stats || typeof stats !== "object" || !stats.fx) stats = { fx: {}, dias: {}, desde: 0 };
let contado = false, ouvido = 0, ultimoTick = 0, statsSujo = false, statsSalvo = 0;
const hojeStr = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
function salvarStats() { statsSujo = false; statsSalvo = Date.now(); guardado.set("compasso.stats", stats); }
function registrarEscuta(x, dt) {
  if (!dt || !x) return;
  const f = stats.fx[x.id] || (stats.fx[x.id] = { n: 0, s: 0, u: 0, y: {} }), ano = new Date().getFullYear();
  f.s += dt; f.u = Date.now(); f.y = f.y || {}; f.y[ano] = (f.y[ano] || 0) + dt;
  const d = hojeStr(); stats.dias[d] = (stats.dias[d] || 0) + dt;
  if (!stats.desde) stats.desde = Date.now();
  ouvido += dt;
  if (!contado && ouvido >= Math.min(30, (x.d || 60) * 0.5)) { contado = true; f.n++; }
  statsSujo = true;
}
function novaEscuta() { contado = false; ouvido = 0; }
/* Nos quadrinhos do Você não cabe "menos de 1 min": lá aparece "0 min" */
const fmtTempoCurto = (s) => (s < 60 ? T("{0} min", 0) : fmtTempo(s));
const fmtTempo = (s) => (s < 60 ? T("menos de 1 min") : s < 3600 ? T("{0} min", Math.round(s / 60)) : T("{0} h", decimal((s / 3600).toFixed(1))));

/* ===================== Temporizador de sono ===================== */
const sono = { fim: 0, aoFim: false };
if (cfg.sonoTerminar === undefined) cfg.sonoTerminar = true;
function verificarSono() {
  if (!sono.fim || Date.now() < sono.fim) return;
  sono.fim = 0;
  if (cfg.sonoTerminar && playing) { sono.aoFim = true; return; }
  if (playing) pausar();
  toast(T("Temporizador: música pausada"));
}
function textoSono() {
  if (sono.aoFim) return T("Ao fim da música");
  if (sono.fim) return fmt((sono.fim - Date.now()) / 1000);
  return "";
}
function htmlSono() {
  const ops = [[0, T("Desligado")], [15, T("15 minutos")], [30, T("30 minutos")], [45, T("45 minutos")], [60, T("1 hora")], [-1, T("Ao fim desta música")], [-2, T("Outro tempo…")]];
  const ativo = sono.aoFim ? -1 : sono.fim ? 1 : 0;
  return `<p class="note" style="padding:0 8px" id="sono-st">${sono.fim ? T("Pausa em {0}.", fmt((sono.fim - Date.now()) / 1000)) : sono.aoFim ? T("Pausa quando esta música acabar.") : T("Escolha quando a música deve pausar.")}</p>
    <div class="menu">${ops.map(([m, n]) => `<button data-sono="${m}"${(m === 0 && !ativo) || (m === -1 && ativo === -1) ? ' aria-pressed="true"' : ""}>${ico(m === 0 ? "x" : "timer")}${n}</button>`).join("")}</div>
    ${tg("sonoTerminar", T("Deixar a música terminar antes de pausar"))}`;
}
function abrirSono() {
  abrirFolha({
    titulo: T("Temporizador"), modo: "timer", html: htmlSono(),
    clique(e) {
      const t = e.target.closest("[data-tg]");
      if (t) { cfg.sonoTerminar = !cfg.sonoTerminar; salvarCfg(); t.setAttribute("aria-checked", cfg.sonoTerminar); return; }
      const b = e.target.closest("[data-sono]"); if (!b) return;
      const m = +b.dataset.sono;
      if (m === -2) return perguntar(T("Temporizador"), T("Pausar daqui a quantos minutos?"), "20", T("Ligar"), (v) => {
        const n = Math.round(parseFloat(String(v).replace(",", ".")));
        if (!(n > 0 && n <= 600)) return toast(T("Use um número de 1 a 600"));
        sono.fim = Date.now() + n * 60000; sono.aoFim = false; paintSono(); toast(T("Pausa em {0} min", n));
      });
      sono.fim = m > 0 ? Date.now() + m * 60000 : 0; sono.aoFim = m === -1;
      fecharFolha(); paintSono();
      toast(m > 0 ? T("Pausa em {0} min", m) : m === -1 ? T("Pausa ao fim desta música") : T("Temporizador desligado"));
    },
  });
}
function paintSono() {
  marcarFerramentas();
  const b = $("b-timer"); if (!b) return;
  const txt = textoSono();
  b.innerHTML = ico("timer", 18) + `<span class="pill-t">${txt || T("Timer")}</span>`;
  b.setAttribute("aria-label", txt ? T("Temporizador: {0}", txt) : T("Temporizador de sono"));
  b.classList.toggle("act", !!(sono.fim || sono.aoFim));
  if (folha && folha.modo === "timer") { const s = $("sono-st"); if (s && sono.fim) s.textContent = T("Pausa em {0}.", fmt((sono.fim - Date.now()) / 1000)); }
}

/* ===================== Uso: já começar tocando, fone e notificação (os dois últimos chegam do plugin do Android) ===================== */
function autoTocar(nativo = NATIVO) { // no navegador o som é bloqueado sem um toque, então só vale no app
  if (!cfg.autoTocar || !nativo || !cur() || playing) return false;
  tocar(); return true;
}
function aoFone(ligado) {
  if (!ligado) {
    if (!cfg.pausarFone || !playing) return;
    const f = cfg.fade; cfg.fade = false; // sem suavizar: o som não pode vazar pelo alto-falante
    try { pausar(); } finally { cfg.fade = f; }
  } else if (cfg.tocarFone && !playing && cur()) tocar();
}
function aoAbrirNotificacao() {
  if (emCarro()) return; // no modo carro, a tela continua a mesma
  if (folha) fecharFolha();
  if ($("app").dataset.view !== "tocando") ir("tocando");
}
if (MUS && MUS.addListener) {
  nat(() => MUS.addListener("fone", (d) => aoFone(!!(d && d.ligado))));
  nat(() => MUS.addListener("notificacao", () => aoAbrirNotificacao()));
}

/* ===================== Modo carro: tela cheia com botões enormes ===================== */
const CARRO = $("carro");
const emCarro = () => !CARRO.hidden;
function pintarCarro() {
  if (!emCarro()) return;
  const x = cur(), rep = { off: T("Repetir: desligado"), all: T("Repetir: fila"), one: T("Repetir: esta música") }[repeat];
  CARRO.setAttribute("aria-label", T("Modo carro"));
  CARRO.innerHTML = `<button class="carro-sair" data-carro="sair">${ico("x", 22)}<span>${T("Sair")}</span></button>
    <div class="carro-info">${x ? capa(x, "cover carro-capa") : ""}<div class="carro-txt"><p class="carro-t">${esc(x ? x.t : T("Nada tocando"))}</p><p class="carro-a">${esc(x ? artistaDe(x) : "")}</p></div></div>
    <div class="carro-ctl"><button data-carro="prev" aria-label="${T("Anterior")}">${ico("prev", 44)}</button><button class="carro-play" data-carro="play" aria-label="${playing ? T("Pausar") : T("Tocar")}">${ico(playing ? "pause" : "play", 60)}</button><button data-carro="next" aria-label="${T("Próxima")}">${ico("next", 44)}</button></div>
    <div class="carro-extra"><button data-carro="shuf" class="${shuffle ? "act" : ""}" aria-pressed="${shuffle}">${ico("shuf", 26)}<span>${T("Aleatório")}</span></button><button data-carro="rep" class="${repeat !== "off" ? "act" : ""}" aria-pressed="${repeat !== "off"}" aria-label="${rep}">${ico("rep", 26)}${repeat === "one" ? "<b>1</b>" : ""}<span>${T("Repetir")}</span></button></div>`;
}
function abrirCarro() { CARRO.hidden = false; pintarCarro(); atualizarTela(); const b = CARRO.querySelector("[data-carro=play]"); if (b) b.focus(); }
function fecharCarro() { CARRO.hidden = true; CARRO.innerHTML = ""; atualizarTela(); }
CARRO.addEventListener("click", (e) => {
  const b = e.target.closest("[data-carro]"); if (!b) return;
  const a = { prev: anterior, play: alternar, next: proxima, shuf: alternarAleatorio, rep: alternarRepetir, sair: fecharCarro }[b.dataset.carro];
  if (a) a();
  if (emCarro()) { pintarCarro(); const n = CARRO.querySelector(`[data-carro="${b.dataset.carro}"]`); if (n) n.focus(); }
});

/* ===================== Tela ligada ===================== */
let trava = null, pedindoTrava = false;
const querTela = () => document.visibilityState === "visible" && (emCarro() || ($("app").dataset.view === "tocando" && (emPalco() || !!(cfg.tela && playing))));
async function atualizarTela() {
  const quer = querTela();
  try {
    if (quer && !trava && !pedindoTrava && navigator.wakeLock) {
      pedindoTrava = true; trava = await navigator.wakeLock.request("screen"); pedindoTrava = false;
      trava.addEventListener("release", () => { trava = null; });
    } else if (!quer && trava) { const t = trava; trava = null; await t.release(); }
  } catch (e) { pedindoTrava = false; trava = null; }
}

/* Relógio de 1 segundo: estatísticas, temporizador e tela ligada (continua mesmo com a aba em segundo plano) */
setInterval(() => {
  const agora = Date.now(), x = cur();
  if (playing && x && ultimoTick) registrarEscuta(x, Math.min(65, (agora - ultimoTick) / 1000));
  ultimoTick = playing ? agora : 0;
  verificarSono(); paintSono(); atualizarHora();
  if (playing && x) vigiarTroca(x, posAtual());
  if (statsSujo && agora - statsSalvo > 10000) salvarStats();
}, 1000);
addEventListener("visibilitychange", () => {
  if (document.visibilityState === "hidden") { if (statsSujo) salvarStats(); if (cur()) salvarSessao(); } // se o Android fechar o app em segundo plano, ele volta de onde parou
  else if (playing && ctx && ctx.state === "suspended") ctx.resume().catch(() => {}); // depois de uma ligação, por exemplo
  atualizarTela();
});
addEventListener("pagehide", () => { if (statsSujo) salvarStats(); });

/* ===================== Tela: Você (perfil e estatísticas) ===================== */
let perfil = Object.assign({ nome: "", foto: "" }, guardado.get("compasso.perfil", {}));
function avatar(cls = "avatar") {
  const nome = perfil.nome || T("Você");
  return perfil.foto ? `<span class="${cls}" style="background-image:url('${perfil.foto}')" role="img" aria-label="${T("Foto de {0}", esc(nome))}"></span>`
    : `<span class="${cls}" style="background:${grad(coresPadrao(nome))}" aria-hidden="true">${inicial(nome)}</span>`;
}
function rankFaixas(chave, ano) {
  return Object.entries(stats.fx).map(([id, f]) => [porId.get(id), f]).filter(([x]) => visivel(x))
    .map(([x, f]) => ({ x, n: f.n || 0, s: ano ? (f.y && f.y[ano]) || 0 : f.s || 0, u: f.u || 0 }))
    .filter((r) => r[chave] > 0).sort((a, b) => b[chave] - a[chave]);
}
function rankArtistas(ano) {
  const m = new Map();
  for (const r of rankFaixas("s", ano)) m.set(r.x.a, (m.get(r.x.a) || 0) + r.s);
  return [...m].map(([n, s]) => ({ n, s, capa: vis().find((x) => x.a === n && x.cover) || vis().find((x) => x.a === n) })).sort((a, b) => b.s - a.s);
}
let topVoce = [];
/* ===================== Início ===================== */
/* "Bom dia" das 5h às 11h59, "Boa tarde" até 17h59 e "Boa noite" no resto; com o nome do perfil quando houver */
function saudacao(hora, nome) {
  const s = hora >= 5 && hora < 12 ? T("Bom dia") : hora >= 12 && hora < 18 ? T("Boa tarde") : T("Boa noite");
  return nome ? T("{0}, {1}", s, nome) : s;
}
let recIni = [];
let carregado = false; // vira true quando a biblioteca termina de carregar do IndexedDB
function escolherVisual(k) { cfg.visual = k; salvarCfg(); aplicarVisual(); if (cfg.visual === "led") prepararLed(cur()); marcarFerramentas(); }
function escolherEpoca(k) { cfg.era = k; cfg.visual = ERAS[cfg.era][1]; salvarCfg(); aplicarVisual(); if (ctx) montarEra(); marcarFerramentas(); }
/* Ferramentas a um toque no Início. A 1.19 e a 1.20 acrescentam itens só aqui. */
const FERRAMENTAS = [
  { id: "eq", nome: T("Equalizador"), ic: "sliders", abrir: () => abrirEQ(), ativo: () => !!cfg.eq.on },
  { id: "sono", nome: T("Temporizador"), ic: "timer", abrir: () => abrirSono(), ativo: () => !!(sono.fim || sono.aoFim) },
  { id: "volmais", nome: T("Volume +"), ic: "vol", abrir: () => abrirFolhaVolumeMais(), ativo: () => ganhoAmp() > 1 },
  { id: "efeitos", nome: T("Efeitos 3D"), ic: "ondas", abrir: () => abrirFolhaEfeitos(), ativo: () => !!REVERBS[cfg.reverb] || +cfg.largura > 1 },
  { id: "visual", nome: T("Visual"), ic: "dial", abrir: () => abrirFolhaVisual() },
  { id: "epoca", nome: T("Época do som"), ic: "radio", abrir: () => abrirFolhaEpoca(), ativo: () => String(cfg.era) !== "off" },
  { id: "vel", nome: T("Velocidade"), ic: "", abrir: () => { $("b-vel").click(); marcarFerramentas(); }, ativo: () => (+cfg.vel || 1) !== 1 },
  { id: "carro", nome: T("Modo carro"), ic: "carro", abrir: () => abrirCarro() },
  { id: "palco", nome: T("Tela cheia"), ic: "expand", abrir: () => { ir("tocando"); alternarPalco(true); } },
];
function renderFerramentas() {
  const g = $("ini-ferr"); if (!g) return;
  g.innerHTML = FERRAMENTAS.map((f) => `<button class="ini-f" data-ferr="${f.id}">${f.ic ? ico(f.ic, 22) : `<b class="ini-vel"></b>`}<span>${f.nome}</span></button>`).join("");
  marcarFerramentas();
}
function marcarFerramentas() {
  const g = $("ini-ferr"); if (!g || !g.firstChild) return;
  for (const f of FERRAMENTAS) { const b = g.querySelector(`[data-ferr="${f.id}"]`); if (b) { const on = !!(f.ativo && f.ativo()); b.classList.toggle("act", on); b.setAttribute("aria-pressed", on); } }
  const v = g.querySelector(".ini-vel"); if (v) v.textContent = decimal(String(+cfg.vel || 1)) + "×";
}
const chipsDe = (lista, sel, attr) => `<div class="chips" role="group">${lista.map(([k, n]) => `<button ${attr}="${k}" aria-pressed="${sel === k}" class="${sel === k ? "on" : ""}">${n}</button>`).join("")}</div>`;
function abrirFolhaVisual() {
  const html = () => chipsDe(Object.entries(VISUAIS), cfg.visual, "data-vis") + `<p class="note">${T("Mais opções do mostrador em Ajustes › Aparência.")}</p>`;
  abrirFolha({ titulo: T("Visual do mostrador"), html: html(), clique(e) { const b = e.target.closest("[data-vis]"); if (b) { escolherVisual(b.dataset.vis); $("sheet-b").innerHTML = html(); } } });
}
function abrirFolhaVolumeMais() {
  const html = () => htmlAmp() + `<p class="note">${T("Aumenta o volume além de 100% para músicas baixas. Um limitador segura os picos para o som não estourar.")}</p>`;
  abrirFolha({ titulo: T("Volume +"), html: html(), clique(e) { const b = e.target.closest("[data-amp]"); if (b) { escolherAmp(+b.dataset.amp); $("sheet-b").innerHTML = html(); } } });
}
function abrirFolhaEfeitos() {
  const html = () => `<p class="t">${T("Reverb")}</p>${htmlReverb()}${htmlLargura("f-largura")}<p class="note">${T("O efeito 3D abre o som para os lados. Fica melhor com fone.")}</p>`;
  abrirFolha({
    titulo: T("Efeitos 3D"), html: html(),
    clique(e) { const b = e.target.closest("[data-reverb]"); if (b) { escolherReverb(b.dataset.reverb); $("sheet-b").innerHTML = html(); } },
    entrada(e) { if (e.target.dataset.fx === "largura") escolherLargura(e.target.value); },
  });
}
function abrirFolhaEpoca() {
  const html = () => chipsDe(Object.entries(ERAS).map(([k, [n]]) => [k, n]), String(cfg.era), "data-epoca") + `<p class="note">${ERA_DESC[cfg.era] || ERA_DESC.off} ${T("Cada época também troca o visual, e você pode escolher outro depois.")}</p>`;
  abrirFolha({ titulo: T("Época do som"), html: html(), clique(e) { const b = e.target.closest("[data-epoca]"); if (b) { escolherEpoca(b.dataset.epoca); $("sheet-b").innerHTML = html(); } } });
}
function renderInicio() {
  const I0 = $("ini"); if (!I0 || $("app").dataset.view !== "inicio") return;
  const vis = faixas.filter(visivel), x = cur();
  const cab = `<div><h1 class="clip">${esc(saudacao(new Date().getHours(), perfil.nome))}</h1><p class="sub">${plural(vis.length, "música", "músicas")}</p></div>`;
  const ferr = `<div class="ini-ferr" id="ini-ferr"></div>`;
  if (!carregado) { I0.innerHTML = `<div><h1 class="clip">${esc(saudacao(new Date().getHours(), perfil.nome))}</h1></div>` + ferr; renderFerramentas(); return; } // sem piscar o convite enquanto carrega
  if (!vis.length) {
    I0.innerHTML = cab + `<div class="card stack" id="ini-vazio"><h2>${T("Traga suas músicas")}</h2><p class="note">${T("Elas ficam guardadas só neste aparelho. Servem MP3, FLAC, M4A, OGG e Opus.")}</p><div class="btns"><button class="btn sm" data-ini-importar>${ico("note", 18)}${T("Importar músicas")}</button></div></div>` + ferr;
    if (typeof renderFerramentas === "function") renderFerramentas();
    return;
  }
  let cont = "";
  if (x) {
    const d = x.d || 0, p = Math.min(d, posAtual() || 0), falta = Math.max(0, d - p);
    cont = `<div class="card ini-cont" id="ini-cont"><button class="tp row grow" data-abrir>${capa(x, "thumb ini-capa")}<span class="grow"><span class="sub clip">${T("Continuar de onde parou")}</span><span class="t clip">${esc(x.t)}</span><span class="sub clip">${esc(artistaDe(x))}${d ? " · " + T("faltam {0}", fmt(falta)) : ""}</span><span class="ini-barra"><i style="width:${d ? ((p / d) * 100).toFixed(1) : 0}%"></i></span></span></button><button class="ic big ini-play" data-ini-tocar aria-label="${playing ? T("Pausar") : T("Tocar")}">${ico(playing ? "pause" : "play", 26)}</button></div>`;
  }
  const recA = AUTO.find((a) => a.id === "auto:recentes");
  recIni = (recA ? recA.ids() : []).filter((id) => visivel(porId.get(id))).slice(0, 10);
  const rec = recIni.length ? `<div class="stack" id="ini-rec"><p class="sec-t">${T("Tocadas há pouco")}</p><div class="ini-fileira">${recIni.map((id, i) => { const y = porId.get(id); return `<button class="alb ini-alb" data-ini-rec="${i}">${capa(y, "cover")}<span class="t clip">${esc(y.t)}</span><span class="sub clip">${esc(artistaDe(y))}</span></button>`; }).join("")}</div></div>` : "";
  const nFav = AUTO.find((a) => a.id === "auto:fav").ids().length;
  const fav = nFav ? `<button class="card row ini-fav" id="ini-fav" data-ini-fav><span class="thumb ini-favic">${ico("heartOn", 22)}</span><span class="grow"><span class="t">${T("Favoritas")}</span><span class="sub">${plural(nFav, "música", "músicas")}</span></span><span class="chev">${ico("chev", 18)}</span></button>` : "";
  I0.innerHTML = cab + cont + ferr + rec + fav;
  if (typeof renderFerramentas === "function") renderFerramentas();
}
$("ini").addEventListener("click", (e) => {
  const t = e.target;
  const f = t.closest("[data-ferr]"); if (f) { const it = FERRAMENTAS.find((x) => x.id === f.dataset.ferr); if (it) it.abrir(); return; }
  if (t.closest("[data-ini-tocar]")) return alternar();
  if (t.closest("[data-abrir]")) return ir("tocando");
  if (t.closest("[data-ini-importar]")) return menuImportar();
  const r = t.closest("[data-ini-rec]"); if (r) { tocarLista(recIni, +r.dataset.iniRec, T("Tocadas recentemente")); return ir("tocando"); }
  if (t.closest("[data-ini-fav]")) { plAberta = "auto:fav"; ir("playlists"); renderPl(); }
});

function renderVoce() {
  const V = $("vc"), total = Object.values(stats.fx).reduce((s, f) => s + (f.s || 0), 0);
  const plays = Object.values(stats.fx).reduce((s, f) => s + (f.n || 0), 0), diasOuvindo = Object.values(stats.dias).filter((s) => s >= 30).length;
  const dias = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - 6 + i); return { d, s: stats.dias[hojeStr(d)] || 0 }; });
  const maxDia = Math.max(60, ...dias.map((d) => d.s));
  const top = rankFaixas("s").slice(0, 5), arts = rankArtistas().slice(0, 5);
  topVoce = top.map((r) => r.x.id);
  const desde = stats.desde ? new Date(stats.desde).toLocaleDateString(LOCALE(), { day: "numeric", month: "long", year: "numeric" }) : "";
  V.innerHTML = `<div class="perfil">${avatar()}<div class="grow"><h1 class="clip">${esc(perfil.nome || T("Você"))}</h1><p class="sub">${desde ? T("Ouvindo no Orolon desde {0}", desde) : T("Suas estatísticas aparecem aqui conforme você ouve.")}</p></div>
      <button class="btn ghost sm" data-editarperfil>${ico("edit", 18)}${T("Editar")}</button></div>
    <div class="tiles"><div class="tile"><b>${fmtTempoCurto(total)}</b><span class="sub">${T("de escuta")}</span></div><div class="tile"><b>${plays}</b><span class="sub">${plays === 1 ? T("reprodução") : T("reproduções")}</span></div><div class="tile"><b>${diasOuvindo}</b><span class="sub">${diasOuvindo === 1 ? T("dia ouvindo") : T("dias ouvindo")}</span></div></div>
    <div class="card stack"><div class="row"><h2 class="grow">${T("Últimos 7 dias")}</h2><span class="sub">${fmtTempo(dias.reduce((s, d) => s + d.s, 0))}</span></div>
      <div class="bars" role="img" aria-label="${T("Minutos ouvidos por dia nos últimos 7 dias")}">${dias.map((d, i) => `<div class="${i === 6 ? "hoje" : ""}"><em>${d.s >= 60 ? Math.round(d.s / 60) : ""}</em><i style="height:${Math.max(3, (d.s / maxDia) * 100).toFixed(1)}%"></i><span>${i === 6 ? T("hoje") : d.d.toLocaleDateString(LOCALE(), { weekday: "short" }).replace(".", "")}</span></div>`).join("")}</div></div>
    <button class="recap-btn" data-recap><span class="grow"><span class="t">${T("Seu {0} em música", new Date().getFullYear())}</span><span class="sub">${T("Seu resumo do ano, guardado só neste aparelho")}</span></span>${ico("next", 20)}</button>
    <div class="stack"><p class="sec-t">${T("Mais ouvidas")}</p>${top.length ? `<div class="list">${top.map((r, i) => linhaFaixa(r.x, { num: i + 1, sub: (x) => `${x.a} · ${plural(r.n, "vez", "vezes")} · ${fmtTempo(r.s)}` })).join("")}</div>` : vazio(T("Ouça algumas músicas e as suas preferidas aparecem aqui."))}</div>
    ${arts.length ? `<div class="stack"><p class="sec-t">${T("Artistas mais ouvidos")}</p><div class="list">${arts.map((a) => `<div class="track"><button class="tp" data-art="${esc(a.n)}">${a.capa ? `<span class="thumb round" style="background:${fundoDe(a.capa)}">${a.capa.cover ? "" : inicial(a.n)}</span>` : ""}<span class="grow"><span class="t clip">${esc(a.n)}</span><span class="sub">${fmtTempo(a.s)}</span></span></button></div>`).join("")}</div></div>` : ""}
    <p class="note">${T("As estatísticas ficam só neste aparelho. Uma música conta como reproduzida depois de 30 segundos (ou metade, se for curta).")}</p>
    ${total ? `<div class="btns"><button class="btn danger sm" data-zerar>${T("Apagar estatísticas")}</button></div>` : ""}`;
}
$("vc").addEventListener("click", (e) => {
  const t = e.target;
  if (t.closest("[data-editarperfil]")) return editarPerfil();
  if (t.closest("[data-recap]")) return abrirRecap();
  if (t.closest("[data-zerar]")) return confirmar(T("Apagar estatísticas?"), T("O tempo de escuta, as reproduções e o Recap voltam a zero. Suas músicas, playlists e favoritas continuam."), T("Apagar"), () => { stats = { fx: {}, dias: {}, desde: 0 }; salvarStats(); renderVoce(); renderPl(); toast(T("Estatísticas apagadas")); });
  const a = t.closest("[data-art]"); if (a) return abrirNaBib("artista", a.dataset.art);
  const m = t.closest("[data-more]"); if (m) return menuFaixa(m.dataset.more);
  const p = t.closest("[data-play]"); if (p) tocarLista(topVoce, topVoce.indexOf(p.dataset.play), T("suas mais ouvidas"));
});
/* ---- Recorte de imagem (foto do perfil e capas): arrastar para posicionar, pinça/rolagem/controle para aproximar ---- */
async function abrirImagem(arquivo) {
  let bm = await createImageBitmap(arquivo);
  if (Math.max(bm.width, bm.height) > 2400) { // foto grande de celular: reduz antes, para o recorte ficar leve
    const k = 2400 / Math.max(bm.width, bm.height), menor = await createImageBitmap(bm, { resizeWidth: Math.round(bm.width * k), resizeHeight: Math.round(bm.height * k), resizeQuality: "high" });
    bm.close(); bm = menor;
  }
  return bm;
}
function criarRecorte(V = 240) { // V: tamanho do quadro de recorte, em px
  let corte = null; // x e y são o centro do quadro em pixels da imagem; z é o zoom além do "preencher"
  const escala = () => (V / Math.min(corte.w, corte.h)) * corte.z;
  function limitar() {
    const m = V / 2 / escala();
    corte.x = Math.min(corte.w - m, Math.max(m, corte.x));
    corte.y = Math.min(corte.h - m, Math.max(m, corte.y));
  }
  function desenhar() {
    const cv = $("corte-cv"); if (!cv || !corte) return;
    const c = cv.getContext("2d"), k = cv.width / V, sc = escala();
    limitar();
    c.clearRect(0, 0, cv.width, cv.height);
    c.drawImage(corte.bm, (V / 2 - corte.x * sc) * k, (V / 2 - corte.y * sc) * k, corte.w * sc * k, corte.h * sc * k);
  }
  function zoom(z, foco) {
    if (!corte) return;
    const antes = escala();
    corte.z = Math.min(4, Math.max(1, z));
    if (foco) { // mantém parado o ponto sob o dedo ou o mouse
      const depois = escala();
      corte.x += (foco.x - V / 2) / antes - (foco.x - V / 2) / depois;
      corte.y += (foco.y - V / 2) / antes - (foco.y - V / 2) / depois;
    }
    const r = $("corte-z"); if (r) r.value = corte.z;
    desenhar();
  }
  function ligar() {
    const cv = $("corte-cv"), dedos = new Map(); let dist0 = 0, z0 = 1;
    if (!cv || !corte) return;
    const ponto = (e) => { const b = cv.getBoundingClientRect(); return { x: ((e.clientX - b.left) / b.width) * V, y: ((e.clientY - b.top) / b.height) * V }; };
    cv.addEventListener("pointerdown", (e) => { cv.setPointerCapture(e.pointerId); dedos.set(e.pointerId, ponto(e)); if (dedos.size === 2) { const [a, b] = [...dedos.values()]; dist0 = Math.hypot(a.x - b.x, a.y - b.y); z0 = corte.z; } });
    cv.addEventListener("pointermove", (e) => {
      if (!dedos.has(e.pointerId) || !corte) return;
      const ant = dedos.get(e.pointerId), p = ponto(e); dedos.set(e.pointerId, p);
      if (dedos.size === 2) { const [a, b] = [...dedos.values()]; if (dist0) zoom(z0 * (Math.hypot(a.x - b.x, a.y - b.y) / dist0), { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }); }
      else { const sc = escala(); corte.x -= (p.x - ant.x) / sc; corte.y -= (p.y - ant.y) / sc; desenhar(); }
    });
    const solta = (e) => { dedos.delete(e.pointerId); dist0 = 0; };
    cv.addEventListener("pointerup", solta); cv.addEventListener("pointercancel", solta);
    cv.addEventListener("wheel", (e) => { e.preventDefault(); zoom(corte.z * (e.deltaY < 0 ? 1.1 : 1 / 1.1), ponto(e)); }, { passive: false });
    cv.addEventListener("keydown", (e) => {
      if (!corte) return;
      const passo = 12 / escala(), mapa = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] };
      if (mapa[e.key]) { e.preventDefault(); corte.x += mapa[e.key][0] * passo; corte.y += mapa[e.key][1] * passo; desenhar(); }
      else if (e.key === "+" || e.key === "=") { e.preventDefault(); zoom(corte.z * 1.1); }
      else if (e.key === "-" || e.key === "−") { e.preventDefault(); zoom(corte.z / 1.1); }
    });
    desenhar(); setTimeout(() => cv.focus(), 60);
  }
  return {
    ativo: () => !!corte,
    abrir(bm) { corte = { bm, w: bm.width, h: bm.height, x: bm.width / 2, y: bm.height / 2, z: 1 }; },
    html: (textoOk, quadrado) => `<div class="stack corte-box"><p class="note">${T("Arraste para posicionar e use o controle para aproximar.")}</p>
      <div class="corte${quadrado ? " quad" : ""}"><canvas id="corte-cv" width="${V * 2}" height="${V * 2}" tabindex="0" aria-label="${T("Recorte da foto. Use as setas para mover e + ou − para aproximar.")}"></canvas></div>
      <div class="opt"><label for="corte-z">${T("Zoom")}</label><input type="range" id="corte-z" min="1" max="4" step="0.01" value="${corte.z}"></div>
      <div class="btns"><button class="btn" type="button" data-corte-ok>${textoOk}</button><button class="btn ghost" type="button" data-corte-x>${T("Cancelar")}</button></div></div>`,
    ligar, zoom,
    usar(lado) { // devolve a imagem recortada num canvas quadrado e encerra o recorte
      const sc = escala(), l = V / sc, out = document.createElement("canvas");
      limitar();
      out.width = out.height = lado;
      out.getContext("2d").drawImage(corte.bm, corte.x - l / 2, corte.y - l / 2, l, l, 0, 0, lado, lado);
      this.fechar();
      return out;
    },
    fechar() { if (corte && corte.bm.close) corte.bm.close(); corte = null; },
  };
}
function editarPerfil() {
  let foto = perfil.foto;
  const rec = criarRecorte();
  const html = () => rec.ativo() ? rec.html(T("Usar esta foto")) : `<form class="stack"><div class="row">${foto ? `<span class="avatar" style="background-image:url('${foto}')"></span>` : avatar()}<div class="btns grow"><button class="btn ghost sm" type="button" data-foto>${T("Escolher foto")}</button>${foto ? `<button class="btn ghost sm" type="button" data-semfoto>${T("Tirar foto")}</button>` : ""}</div></div>
    <label class="t" for="pf-nome">${T("Seu nome ou apelido")}</label><input class="field" id="pf-nome" name="v" value="${esc(nomeRasc)}" maxlength="30" autocomplete="off" placeholder="${T("Por exemplo: Jo")}">
    <button class="btn" type="submit">${T("Salvar perfil")}</button><p class="note">${T("Seu perfil fica só neste aparelho. Não existe conta nem nada online.")}</p></form>`;
  let nomeRasc = perfil.nome;
  const redesenhar = () => { if ($("pf-nome")) nomeRasc = $("pf-nome").value; $("sheet-b").innerHTML = html(); if (rec.ativo()) rec.ligar(); };
  abrirFolha({
    titulo: T("Seu perfil"), html: html(),
    clique(e) {
      if (e.target.closest("[data-semfoto]")) { foto = ""; redesenhar(); }
      if (e.target.closest("[data-corte-ok]")) { foto = rec.usar(320).toDataURL("image/jpeg", 0.86); return redesenhar(); }
      if (e.target.closest("[data-corte-x]")) { rec.fechar(); return redesenhar(); }
      if (e.target.closest("[data-foto]")) {
        const inp = $("perfil-file");
        inp.onchange = async () => {
          const f = inp.files[0]; inp.value = ""; if (!f) return;
          try {
            const bm = await abrirImagem(f);
            if ($("pf-nome")) nomeRasc = $("pf-nome").value;
            rec.abrir(bm); redesenhar();
          } catch (err) { toast(T("Não deu para abrir essa imagem")); }
        };
        inp.click();
      }
    },
    entrada(e) { if (e.target.id === "corte-z" && rec.ativo()) rec.zoom(+e.target.value); },
    enviar(d) {
      perfil = { nome: String(d.get("v") || "").trim().slice(0, 30), foto };
      try { localStorage.setItem("compasso.perfil", JSON.stringify(perfil)); } catch (err) { toast(T("Não deu para guardar a foto neste navegador")); }
      fecharFolha(); renderVoce(); toast(T("Perfil salvo"));
    },
  });
}
function abrirRecap() {
  const ano = new Date().getFullYear(), pre = ano + "-";
  const diasAno = Object.entries(stats.dias).filter(([d]) => d.startsWith(pre));
  const totalAno = diasAno.reduce((s, [, v]) => s + v, 0);
  const meses = {}; diasAno.forEach(([d, v]) => { const m = +d.slice(5, 7); meses[m] = (meses[m] || 0) + v; });
  const mesTop = Object.entries(meses).sort((a, b) => b[1] - a[1])[0];
  const diaTop = diasAno.slice().sort((a, b) => b[1] - a[1])[0];
  const fx = rankFaixas("s", ano), art = rankArtistas(ano);
  const nomeMes = (m) => new Date(ano, m - 1, 1).toLocaleDateString(LOCALE(), { month: "long" });
  const bloco = (rot, val, extra = "") => `<div class="recap"><span class="sub">${rot}</span><b>${val}</b>${extra ? `<span>${extra}</span>` : ""}</div>`;
  abrirFolha({
    titulo: T("Seu {0} em música", ano),
    clique(e) { if (e.target.closest("[data-recapimg]")) imagemRecap(); },
    html: totalAno < 60 ? vazio(T("Ainda não tem música suficiente para o Recap deste ano. Ouça mais um pouco e volte aqui.")) :
      `<div class="stack">${bloco(T("Você ouviu"), fmtTempo(totalAno), T("em {0}", plural(diasAno.length, "dia", "dias")))}
      ${fx[0] ? bloco(T("Música do ano"), esc(fx[0].x.t), `${esc(fx[0].x.a)} · ${fmtTempo(fx[0].s)}`) : ""}
      ${art[0] ? bloco(T("Artista do ano"), esc(art[0].n), fmtTempo(art[0].s)) : ""}
      ${mesTop ? bloco(T("Mês que você mais ouviu"), nomeMes(+mesTop[0]), fmtTempo(mesTop[1])) : ""}
      ${diaTop ? bloco(T("Dia mais musical"), new Date(diaTop[0] + "T12:00").toLocaleDateString(LOCALE(), { day: "numeric", month: "long" }), fmtTempo(diaTop[1])) : ""}
      <button class="btn" data-recapimg>${ico("image", 18)}${T("Criar imagem para compartilhar")}</button>
      ${fx.length > 1 ? `<p class="sec-t">${T("Top 5 do ano")}</p><div class="list">${fx.slice(0, 5).map((r, i) => `<div class="track"><span class="idx">${i + 1}</span>${capa(r.x)}<span class="grow"><span class="t clip">${esc(r.x.t)}</span><span class="sub clip">${esc(r.x.a)} · ${fmtTempo(r.s)}</span></span></div>`).join("")}</div>` : ""}</div>`,
  });
}


/* ===================== Recap como imagem ===================== */
function dadosRecap() {
  const ano = new Date().getFullYear(), pre = ano + "-";
  const diasAno = Object.entries(stats.dias).filter(([d]) => d.startsWith(pre));
  const totalAno = diasAno.reduce((s, [, v]) => s + v, 0);
  const meses = {}; diasAno.forEach(([d, v]) => { const m = +d.slice(5, 7); meses[m] = (meses[m] || 0) + v; });
  const mesTop = Object.entries(meses).sort((a, b) => b[1] - a[1])[0];
  const diaTop = diasAno.slice().sort((a, b) => b[1] - a[1])[0];
  const nomeMes = (m) => new Date(ano, m - 1, 1).toLocaleDateString(LOCALE(), { month: "long" });
  return { ano, diasAno, totalAno, mesTop, diaTop, nomeMes, fx: rankFaixas("s", ano), art: rankArtistas(ano) };
}
function desenharRecap() {
  const R = dadosRecap(), W = 1080, H = 1920, cv = document.createElement("canvas");
  cv.width = W; cv.height = H;
  const c = cv.getContext("2d"), css = getComputedStyle(document.documentElement);
  const v = (k) => css.getPropertyValue(k).trim();
  const display = v("--display") || "system-ui, sans-serif", corpo = v("--body") || "system-ui, sans-serif";
  const g = c.createLinearGradient(0, 0, W, H);
  g.addColorStop(0, v("--accent") || "#6A4BD8"); g.addColorStop(1, v("--accent2") || "#A8743A");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = "rgba(10,8,20,.42)"; c.fillRect(0, 0, W, H);
  // mostrador de relógio de fundo, a marca do Orolon
  c.save(); c.translate(W - 170, 300); c.strokeStyle = "rgba(255,255,255,.18)"; c.lineCap = "round";
  for (let i = 0; i < 60; i++) { c.lineWidth = i % 5 ? 5 : 9; c.beginPath(); c.moveTo(0, -(i % 5 ? 230 : 210)); c.lineTo(0, -250); c.stroke(); c.rotate(Math.PI / 30); }
  c.restore();
  const corta = (txt, fonte, max) => { c.font = fonte; let t = String(txt); if (c.measureText(t).width <= max) return t; while (t.length > 1 && c.measureText(t + "…").width > max) t = t.slice(0, -1); return t + "…"; };
  const texto = (txt, x, y, fonte, cor = "#fff", max = W - 160) => { c.font = fonte; c.fillStyle = cor; c.fillText(corta(txt, fonte, max), x, y); };
  const X = 80; let y = 150;
  texto(`COMPASSO · RECAP ${R.ano}`, X, y, `700 34px ${corpo}`, "rgba(255,255,255,.8)");
  y += 90; texto(perfil.nome ? T("O ano de {0}", perfil.nome) : T("Meu ano em música"), X, y, `700 64px ${display}`);
  y += 230; texto(fmtTempo(R.totalAno), X, y, `800 190px ${display}`);
  y += 70; texto(T("de música em {0}", plural(R.diasAno.length, "dia", "dias")), X, y, `500 44px ${corpo}`, "rgba(255,255,255,.88)");
  const bloco = (rot, val, sub) => {
    y += 120; texto(rot.toUpperCase(), X, y, `700 30px ${corpo}`, "rgba(255,255,255,.7)");
    y += 70; texto(val, X, y, `700 62px ${display}`);
    if (sub) { y += 52; texto(sub, X, y, `500 38px ${corpo}`, "rgba(255,255,255,.85)"); }
  };
  if (R.fx[0]) bloco(T("Música do ano"), R.fx[0].x.t, R.fx[0].x.a);
  if (R.art[0]) bloco(T("Artista do ano"), R.art[0].n, fmtTempo(R.art[0].s));
  if (R.mesTop) bloco(T("Mês mais musical"), R.nomeMes(+R.mesTop[0]), fmtTempo(R.mesTop[1]));
  if (R.fx.length > 1) {
    y += 120; texto("TOP 5", X, y, `700 30px ${corpo}`, "rgba(255,255,255,.7)");
    R.fx.slice(0, 5).forEach((r, i) => { y += 66; texto(`${i + 1}`, X, y, `800 44px ${display}`, "rgba(255,255,255,.65)"); texto(`${r.x.t} · ${r.x.a}`, X + 70, y, `600 42px ${corpo}`, "#fff", W - 230); });
  }
  texto(T("Feito no Orolon Player · offline e sem conta"), X, H - 90, `500 32px ${corpo}`, "rgba(255,255,255,.75)");
  return new Promise((ok) => cv.toBlob((b) => ok({ blob: b, ano: R.ano }), "image/png"));
}
async function imagemRecap() {
  toast(T("Criando a imagem…"));
  const { blob, ano } = await desenharRecap();
  if (!blob) return toast(T("Não deu para criar a imagem"));
  const url = URL.createObjectURL(blob), nome = `recap-${ano}.png`, arquivo = new File([blob], nome, { type: "image/png" });
  const podeCompartilhar = !!(navigator.canShare && navigator.canShare({ files: [arquivo] }));
  abrirFolha({
    titulo: T("Seu Recap em imagem"),
    html: `<img class="recap-img" src="${url}" alt="${T("Imagem do seu Recap {0}", ano)}"><div class="btns">${podeCompartilhar ? `<button class="btn" data-rshare>${T("Compartilhar")}</button>` : ""}<button class="btn ${podeCompartilhar ? "ghost" : ""}" data-rbaixar>${T("Baixar imagem")}</button></div>
      <p class="note">${T("A imagem é criada aqui no aparelho. Ela só sai dele se você compartilhar.")}</p>`,
    async clique(e) {
      if (e.target.closest("[data-rshare]")) { try { await navigator.share({ files: [arquivo], title: T("Meu {0} em música", ano) }); } catch (err) { /* cancelado */ } }
      if (e.target.closest("[data-rbaixar]")) baixar(blob, nome);
    },
  });
}
function baixar(blob, nome) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob); a.download = nome;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
  toast(T("Se o download não começar, abra o app instalado ou no navegador"));
}

/* ===================== Backup ===================== */
const chaveDe = (x) => (x.demo ? x.id : "s:" + x.sig);
function gerarBackup() {
  const k = (id) => { const x = porId.get(id); return x ? chaveDe(x) : null; };
  return {
    formato: "compasso-backup", versao: 1, criado: new Date().toISOString(),
    playlists: pls.map((p) => ({ nome: p.nome, criada: p.criada, faixas: p.ids.map(k).filter(Boolean) })),
    favoritas: [...favs].map(k).filter(Boolean),
    estatisticas: { desde: stats.desde, dias: stats.dias, fx: Object.fromEntries(Object.entries(stats.fx).map(([id, f]) => [k(id), f]).filter(([c]) => c)) },
    faixas: importadas().map((x) => ({ chave: chaveDe(x), t: x.t, a: x.a, al: x.al || "", n: x.n || 0, letra: x.letra || "", oculta: !!x.oculta })),
    perfil, temas: meusTemas, ajustes: cfg,
  };
}
function salvarBackup() {
  const json = JSON.stringify(gerarBackup());
  baixar(new Blob([json], { type: "application/json" }), `compasso-backup-${hojeStr()}.json`);
}
function restaurarBackup(o) {
  if (!o || o.formato !== "compasso-backup") throw new Error(T("Esse arquivo não é um backup do Orolon."));
  const mapa = new Map(faixas.map((x) => [chaveDe(x), x.id]));
  const id = (c) => mapa.get(c);
  let achadas = 0, total = 0;
  for (const m of o.faixas || []) {
    total++; const x = porId.get(id(m.chave)); if (!x) continue; achadas++;
    Object.assign(x, { t: m.t || x.t, a: m.a || x.a, al: m.al ?? x.al, n: m.n || 0, letra: m.letra || x.letra || "", oculta: !!m.oculta });
    salvarFaixa(x);
  }
  let nPl = 0;
  for (const p of o.playlists || []) {
    const ids = (p.faixas || []).map(id).filter(Boolean), ex = pls.find((y) => y.nome === p.nome);
    if (ex) { for (const i of ids) if (!ex.ids.includes(i)) ex.ids.push(i); salvarPl(ex); } else novaPlaylist(String(p.nome || "Playlist").slice(0, 60), ids);
    nPl++;
  }
  (o.favoritas || []).map(id).filter(Boolean).forEach((i) => favs.add(i));
  guardado.set("compasso.fav", [...favs]);
  const e = o.estatisticas || {};
  for (const [c, f] of Object.entries(e.fx || {})) {
    const i = id(c); if (!i || !f) continue;
    const a = stats.fx[i];
    if (!a) stats.fx[i] = f;
    else { a.n = Math.max(a.n || 0, f.n || 0); a.s = Math.max(a.s || 0, f.s || 0); a.u = Math.max(a.u || 0, f.u || 0); a.y = a.y || {}; for (const [ano, s] of Object.entries(f.y || {})) a.y[ano] = Math.max(a.y[ano] || 0, s); }
  }
  for (const [d, s] of Object.entries(e.dias || {})) stats.dias[d] = Math.max(stats.dias[d] || 0, s);
  if (e.desde) stats.desde = stats.desde ? Math.min(stats.desde, e.desde) : e.desde;
  salvarStats();
  if (o.perfil && (o.perfil.nome || o.perfil.foto)) { perfil = { nome: String(o.perfil.nome || "").slice(0, 30), foto: String(o.perfil.foto || "") }; guardado.set("compasso.perfil", perfil); }
  for (const t of o.temas || []) { try { const v = validarTema(t); if (!meusTemas.some((m) => m.nome === v.nome)) { v.id = uid("t"); meusTemas.push(v); } } catch (err) { /* tema inválido: pula */ } }
  salvarTemas();
  const aj = o.ajustes || {};
  for (const k of ["amb", "ambF", "reage", "batF", "fade", "tela", "anterior", "ord", "exemplos", "exemplosMexeu", "sonoTerminar", "fundoBlur", "fundoVeu", "era", "eraRuido", "visual", "xfade", "vel", "nivelar", "vol", "mudo", "volRec", "leve", "coracoes", "corCapa", "formaCapa", "ledCor", "amp", "avisoAmp", "reverb", "largura", "apGraves", "apAgudos", "apInt", "autoTocar", "tocarFone", "pausarFone"]) if (k in aj) cfg[k] = aj[k];
  if (aj.eq && Array.isArray(aj.eq.g)) cfg.eq = Object.assign(cfg.eq, aj.eq);
  if (aj.tema && temaPorId(aj.tema)) cfg.tema = aj.tema;
  if (aj.ajustes) cfg.ajustes = aj.ajustes;
  salvarCfg(); aplicarTema(); aplicarFundo(); aplicarVisual(); aplicarVel(); aplicarVolume(); if (ctx) montarFiltros();
  mudouExemplos(); marcarFerramentas(); renderBib(); renderPl(); renderTemas(); paint();
  return { achadas, total, nPl };
}

/* ===================== Playlists automáticas ===================== */
const AUTO = [
  { id: "auto:fav", nome: T("Favoritas"), ic: "heartOn", vazio: T("Toque no coração na tela Tocando agora para guardar suas favoritas aqui."), ids: () => [...favs].filter((id) => visivel(porId.get(id))) },
  { id: "auto:novas", nome: T("Adicionadas recentemente"), ic: "plus", vazio: T("As músicas que você importar aparecem aqui."), ids: () => importadas().filter(visivel).sort((a, b) => (b.em || 0) - (a.em || 0)).slice(0, 50).map((x) => x.id) },
  { id: "auto:recentes", nome: T("Tocadas recentemente"), ic: "now", vazio: T("Ouça algumas músicas e elas aparecem aqui."), ids: () => rankFaixas("u").slice(0, 50).map((r) => r.x.id) },
  { id: "auto:mais", nome: T("Mais tocadas"), ic: "stats", vazio: T("Ouça algumas músicas e as mais tocadas aparecem aqui."), ids: () => rankFaixas("n").slice(0, 50).map((r) => r.x.id) },
].map((a) => ({ ...a, auto: true }));


/* ===================== Letras ===================== */
let modoLetra = false, letraCache = null, letraIdx = -1, letraMexeu = 0;
function parseLetra(txt) {
  const linhas = []; let off = 0;
  for (const bruta of String(txt || "").replace(/\r/g, "").split("\n")) {
    const mo = bruta.match(/^\s*\[offset:\s*([+-]?\d+)\s*\]/i); if (mo) { off = +mo[1] / 1000; continue; }
    const ts = [...bruta.matchAll(/\[(\d{1,3}):(\d{1,2}(?:[.:]\d{1,3})?)\]/g)];
    const texto = bruta.replace(/\[[^\]]*\]/g, "").trim();
    if (ts.length) ts.forEach((m) => linhas.push({ t: +m[1] * 60 + parseFloat(m[2].replace(":", ".")) - off, txt: texto }));
    else if (!/^\s*\[[a-z]+:.*\]\s*$/i.test(bruta)) linhas.push({ t: null, txt: bruta.trim() });
  }
  const sinc = linhas.filter((l) => l.t !== null);
  if (sinc.length >= 2) return { sinc: true, linhas: sinc.sort((a, b) => a.t - b.t) };
  const soltas = linhas.map((l) => ({ t: null, txt: l.txt }));
  while (soltas.length && !soltas[0].txt) soltas.shift();
  return { sinc: false, linhas: soltas };
}
function renderLetra() {
  const P = $("letra"), x = cur();
  letraIdx = -1;
  $("b-letra").innerHTML = ico("lyrics", 18) + `<span class="pill-t">${T("Letra")}</span>`; $("b-letra").setAttribute("aria-label", modoLetra ? T("Esconder a letra") : T("Mostrar a letra")); $("b-letra").classList.toggle("act", modoLetra); $("b-letra").setAttribute("aria-pressed", modoLetra);
  if (!modoLetra || !x) return;
  if (x.demo) { letraCache = null; P.innerHTML = vazio(T("As músicas de exemplo não têm letra.")); return; }
  if (!x.letra) {
    letraCache = null;
    P.innerHTML = vazio(T("Esta música ainda não tem letra."), `<div class="btns" style="justify-content:center"><button class="btn sm" data-letra-arq>${T("Abrir .lrc ou .txt")}</button><button class="btn ghost sm" data-letra-ed>${T("Colar letra")}</button><button class="btn ghost sm" data-letra-reler>${T("Procurar no arquivo de novo")}</button></div><p class="note">${T("Dica: um arquivo .lrc com o mesmo nome da música entra sozinho ao importar, inclusive arrastando só o .lrc.")}</p>`);
    return;
  }
  letraCache = { id: x.id, ...parseLetra(x.letra) };
  P.innerHTML = `<div class="l-pad"></div>${letraCache.linhas.map((l, i) => `<p class="l${letraCache.sinc ? " s" : ""}${l.txt ? "" : " vazia"}" data-li="${i}">${esc(l.txt) || "♪"}</p>`).join("")}<div class="l-pad"></div>
    <div class="btns" style="justify-content:center"><button class="btn ghost sm" data-letra-ed>${ico("edit", 18)}${T("Editar letra")}</button></div>`;
  P.scrollTop = 0;
}
function seguirLetra(p) {
  if (!modoLetra || !letraCache || !letraCache.sinc || letraCache.id !== (cur() && cur().id)) return;
  const L = letraCache.linhas; let i = -1;
  for (let k = 0; k < L.length; k++) { if (L[k].t <= p + 0.15) i = k; else break; }
  if (i === letraIdx) return;
  letraIdx = i;
  const P = $("letra");
  P.querySelectorAll(".l").forEach((el, k) => { el.classList.toggle("on", k === i); el.classList.toggle("foi", k < i); });
  const alvo = P.querySelector(`[data-li="${Math.max(0, i)}"]`);
  if (alvo && Date.now() - letraMexeu > 3500) P.scrollTo({ top: alvo.offsetTop - P.clientHeight / 2 + alvo.offsetHeight / 2, behavior: calmo || cfg.leve ? "auto" : "smooth" });
}
function editarLetra(x) {
  if (!x || x.demo) return;
  abrirFolha({
    titulo: T("Letra · {0}", x.t),
    html: `<form class="stack"><textarea class="field letra-ed" name="v" id="le-txt" placeholder="${T("Cole a letra aqui. Para sincronizar, use o formato .lrc: [00:12.50]Primeira linha")}">${esc(x.letra || "")}</textarea>
      <div class="btns"><button class="btn" type="submit">${T("Salvar letra")}</button><button class="btn ghost" type="button" data-letra-arq>${T("Abrir arquivo")}</button>${x.letra ? `<button class="btn danger" type="button" data-letra-del>${T("Apagar letra")}</button>` : ""}</div>
      <p class="note">${T("Linhas com tempo no formato [mm:ss.xx] acompanham a música. Sem tempo, a letra aparece inteira para rolar.")}</p></form>`,
    enviar(d) { x.letra = String(d.get("v") || "").trim(); salvarFaixa(x); fecharFolha(); renderLetra(); toast(x.letra ? T("Letra salva") : T("Letra apagada")); },
    clique(e) {
      if (e.target.closest("[data-letra-arq]")) abrirArquivoLetra(x, (txt) => { $("le-txt").value = txt; });
      if (e.target.closest("[data-letra-del]")) { x.letra = ""; salvarFaixa(x); fecharFolha(); renderLetra(); toast(T("Letra apagada")); }
    },
  });
}
function abrirArquivoLetra(x, depois) {
  const inp = $("letra-file");
  inp.onchange = async () => {
    const f = inp.files[0]; inp.value = ""; if (!f) return;
    if (f.size > 512000) return toast(T("Esse arquivo é grande demais para ser uma letra"));
    const txt = await f.text();
    if (depois) depois(txt); else { x.letra = txt.trim(); salvarFaixa(x); renderLetra(); toast(T("Letra adicionada")); }
  };
  inp.click();
}
$("b-letra").addEventListener("click", () => { modoLetra = !modoLetra; $("app").dataset.letra = modoLetra ? "1" : ""; renderLetra(); if (modoLetra) seguirLetra(posAtual()); ajustarDial(); });
$("letra").addEventListener("click", (e) => {
  const x = cur(); if (!x) return;
  if (e.target.closest("[data-letra-ed]")) return editarLetra(x);
  if (e.target.closest("[data-letra-arq]")) return abrirArquivoLetra(x);
  if (e.target.closest("[data-letra-reler]")) return procurarLetra(x);
  const l = e.target.closest(".l.s"); if (l && letraCache) { letraMexeu = 0; buscarSeg(letraCache.linhas[+l.dataset.li].t); if (!playing) tocar(); }
});
["wheel", "touchmove", "pointerdown"].forEach((ev) => $("letra").addEventListener(ev, () => { letraMexeu = Date.now(); }, { passive: true }));

/* O leitor de etiquetas aprendeu a achar letras em mais lugares (1.6.1):
   relê uma vez as músicas importadas que ficaram sem letra. */
async function relerLetras() {
  let n = 0;
  for (const x of importadas()) {
    if (x.letra || !x.arq) continue;
    try { const m = await lerTags(x.arq); if (m.letra) { x.letra = m.letra; salvarFaixa(x); n++; } } catch (e) { /* arquivo ilegível: pula */ }
  }
  cfg.tagsVer = 2; salvarCfg();
  if (n) { toast(T("Letras encontradas em {0}", plural(n, "música", "músicas"))); if (modoLetra) renderLetra(); }
}
/* Uma vez: recorta as capas que já estavam na biblioteca */
async function acertarCapas() {
  let n = 0;
  for (const x of importadas()) {
    if (!x.capaBlob) continue;
    const nova = await cortarCapa(x.capaBlob); if (!nova) continue;
    if (x.cover) URL.revokeObjectURL(x.cover);
    x.capaBlob = nova; x.cover = URL.createObjectURL(nova); x._paleta = null;
    x.c = (await coresDaCapa(nova)) || x.c; salvarFaixa(x); n++;
    await new Promise((ok) => setTimeout(ok, 30));
  }
  cfg.capasVer = 1; salvarCfg();
  if (n) { renderBib(); renderPl(); paint(); const x = cur(); if (x) { luz(coresDe(x)); atualizarCorViz(); } }
}
async function procurarLetra(x) {
  if (!x || !x.arq) return;
  let m = {};
  try { m = await lerTags(x.arq); } catch (e) { /* arquivo ilegível */ }
  if (m.letra) previaLetra(x, m.letra);
  else toast(T("O arquivo não tem letra guardada"));
}
/* Mostra a letra encontrada antes de salvar: Aplicar ou Descartar */
function previaLetra(x, letra) {
  const l = parseLetra(letra), txt = l.linhas.map((q) => q.txt).filter(Boolean).join("\n");
  abrirFolha({
    titulo: T("Letra encontrada"),
    html: `<p class="note">${l.sinc ? T("Sincronizada: acompanha a música linha por linha.") : T("Sem tempo marcado: aparece inteira para rolar.")}</p>
      <div class="previa">${esc(txt.slice(0, 4000))}${txt.length > 4000 ? "…" : ""}</div>
      <div class="btns"><button class="btn" data-aplicar>${T("Aplicar")}</button><button class="btn ghost" data-descartar>${T("Descartar")}</button></div>`,
    clique(e) {
      if (e.target.closest("[data-aplicar]")) { x.letra = letra; salvarFaixa(x); fecharFolha(); renderLetra(); toast(T("Letra adicionada")); }
      else if (e.target.closest("[data-descartar]")) fecharFolha();
    },
  });
}

/* ===================== Editar informações e ocultar ===================== */
function editarInfo(x) {
  if (!x || x.demo) return;
  abrirFolha({
    titulo: T("Editar informações"),
    html: `<form class="stack">
      <label class="t" for="ed-t">${T("Título")}</label><input class="field" id="ed-t" name="t" value="${esc(x.t)}" maxlength="150" required autocomplete="off">
      <label class="t" for="ed-a">${T("Artista")}</label><input class="field" id="ed-a" name="a" value="${esc(x.a)}" maxlength="150" autocomplete="off">
      <label class="t" for="ed-al">${T("Álbum")}</label><input class="field" id="ed-al" name="al" value="${esc(x.al || "")}" maxlength="150" autocomplete="off">
      <label class="t" for="ed-n">${T("Número da faixa")}</label><input class="field" id="ed-n" name="n" type="number" min="0" max="999" inputmode="numeric" value="${x.n || ""}">
      <button class="btn" type="submit">${T("Salvar")}</button><p class="note">${T("Muda só dentro do Orolon. O arquivo original continua igual.")}</p></form>`,
    enviar(d) {
      x.t = String(d.get("t") || "").trim() || x.t;
      x.a = String(d.get("a") || "").trim() || T("Artista desconhecido");
      x.al = String(d.get("al") || "").trim();
      x.n = Math.max(0, Math.min(999, parseInt(d.get("n")) || 0));
      salvarFaixa(x); fecharFolha();
      renderBib(); renderPl(); marcarAtual(); if (cur() === x) metaSessao(x);
      toast(T("Informações salvas"));
    },
  });
}
function ocultar(id, sim) {
  const x = porId.get(id); if (!x || x.demo) return;
  if (sim) {
    const eraAtual = cur() && cur().id === id, atualId = cur() && cur().id;
    if (eraAtual && playing) pausar();
    x.oculta = true;
    const i = queue.indexOf(id);
    if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; }
    if (origem) origem = origem.filter((q) => q !== id);
    if (!queue.length) filaPadrao();
    else if (eraAtual) { qi = Math.min(qi, queue.length - 1); carregar(false); }
    else qi = Math.max(0, queue.indexOf(atualId));
  } else x.oculta = false;
  salvarFaixa(x);
  renderBib(); renderPl(); renderFilaAberta(); paint();
  if ($("app").dataset.view === "temas" && !editando) renderTemas();
  toast(sim ? T("Música oculta. Para mostrar de novo: Ajustes › Reprodução e biblioteca") : T("A música voltou para a biblioteca"));
}
function verOcultas() {
  const html = () => { const o = faixas.filter((x) => x.oculta); return o.length ? `<div class="list">${o.map((x) => `<div class="track">${capa(x)}<span class="grow"><span class="t clip">${esc(x.t)}</span><span class="sub clip">${esc(linha2(x))}</span></span><button class="btn ghost sm" data-mostrar="${x.id}">${T("Mostrar")}</button></div>`).join("")}</div>` : vazio(T("Nenhuma música oculta.")); };
  abrirFolha({ titulo: T("Músicas ocultas"), html: html(), clique(e) { const b = e.target.closest("[data-mostrar]"); if (b) { ocultar(b.dataset.mostrar, false); $("sheet-b").innerHTML = html(); } } });
}

/* ===================== Imagem de fundo ===================== */
if (cfg.fundoBlur === undefined) cfg.fundoBlur = 6;
if (cfg.fundoVeu === undefined) cfg.fundoVeu = 0.55;
function aplicarFundo() {
  let img = ""; try { img = localStorage.getItem("compasso.fundo") || ""; } catch (e) { /* sem armazenamento */ }
  const b = $("bgimg");
  b.hidden = !img; b.style.backgroundImage = img ? `url('${img}')` : "";
  document.documentElement.style.setProperty("--blur", cfg.fundoBlur + "px");
  document.documentElement.style.setProperty("--veu", cfg.fundoVeu);
}
const temFundo = () => { try { return !!localStorage.getItem("compasso.fundo"); } catch (e) { return false; } };
function escolherFundo() {
  const inp = $("fundo-file");
  inp.onchange = async () => {
    const f = inp.files[0]; inp.value = ""; if (!f) return;
    try {
      const bm = await createImageBitmap(f), k = Math.min(1, 1440 / Math.max(bm.width, bm.height)), cv = document.createElement("canvas");
      cv.width = Math.round(bm.width * k); cv.height = Math.round(bm.height * k);
      cv.getContext("2d").drawImage(bm, 0, 0, cv.width, cv.height);
      localStorage.setItem("compasso.fundo", cv.toDataURL("image/jpeg", 0.82));
      aplicarFundo(); renderTemas(); toast(T("Imagem de fundo aplicada"));
    } catch (e) { toast(T("Não deu para usar essa imagem")); }
  };
  inp.click();
}


/* ===================== Épocas (som) e visuais do mostrador ===================== */
const ERAS = { off: [T("Desligado"), "relogio"], 60: [T("Anos 60"), "vinil"], 70: [T("Anos 70"), "vinil"], 80: [T("Anos 80"), "neon"], 90: [T("Anos 90"), "barras"] };
const ERA_DESC = { off: T("Som original, sem efeito."), 60: T("Rádio valvulado: mono, abafado e com chiado."), 70: T("Vinil: graves quentes, estalos de agulha e leve oscilação."), 80: T("Fita cassete: chiado de fita e velocidade oscilando de leve."), 90: T("CD player: som limpo com graves e brilho reforçados.") };
const VISUAIS = { relogio: T("Relógio"), vinil: T("Vinil"), aura: T("Aura"), espectro: T("Espectro"), anel: T("Anel"), neon: T("Neon"), barras: T("Barras"), led: T("LED") };
function curvaSat(k) { const n = 1024, c = new Float32Array(n); for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = Math.tanh(k * x) / Math.tanh(k); } return c; }
function bufRuido(tipo) {
  const sr = ctx.sampleRate, n = sr * 4, b = ctx.createBuffer(1, n, sr), d = b.getChannelData(0);
  if (tipo === "estalos") {
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * 0.03;
    for (let k = 0; k < 26; k++) { const p = Math.floor(Math.random() * (n - 40)), amp = 0.25 + Math.random() * 0.75, len = 3 + Math.floor(Math.random() * 16); for (let j = 0; j < len; j++) d[p + j] += (Math.random() * 2 - 1) * amp * (1 - j / len); }
  } else for (let i = 0; i < n; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function montarEra() {
  if (!ctx) return;
  eraIn.disconnect();
  eraNos.forEach((n) => { try { if (n.stop) n.stop(); } catch (e) { /* já parado */ } n.disconnect(); });
  eraNos = []; ruido = null;
  const era = String(cfg.era || "off"), N = (n) => (eraNos.push(n), n);
  const bq = (tipo, f, g, q) => { const b = N(ctx.createBiquadFilter()); b.type = tipo; b.frequency.value = f; if (g !== undefined) b.gain.value = g; if (q) b.Q.value = q; return b; };
  const sat = (k) => { const w = N(ctx.createWaveShaper()); w.curve = curvaSat(k); w.oversample = "2x"; return w; };
  const wow = (...lfos) => { // oscilação de velocidade: um atraso curto que varia devagar
    const d = N(ctx.createDelay(0.1)); d.delayTime.value = 0.012;
    for (let i = 0; i < lfos.length; i += 2) { const o = N(ctx.createOscillator()), g = N(ctx.createGain()); o.frequency.value = lfos[i]; g.gain.value = lfos[i + 1]; o.connect(g); g.connect(d.delayTime); o.start(); }
    return d;
  };
  let cadeia = [], chiado = null;
  if (era === "60") {
    const mono = N(ctx.createGain()); mono.channelCount = 1; mono.channelCountMode = "explicit";
    cadeia = [mono, bq("highpass", 170), bq("peaking", 1800, 4, 0.8), bq("lowpass", 4300), sat(2.2)]; chiado = ["chiado", 0.011, ["bandpass", 2600, 0.5]];
  } else if (era === "70") { cadeia = [bq("lowshelf", 140, 3.5), bq("peaking", 3000, -1.5, 0.7), bq("lowpass", 12500), wow(0.55, 0.0009)]; chiado = ["estalos", 0.2]; }
  else if (era === "80") { cadeia = [bq("highpass", 45), bq("lowshelf", 110, 2), bq("lowpass", 9000), sat(1.4), wow(0.9, 0.0013, 6.3, 0.00016)]; chiado = ["chiado", 0.012, ["highpass", 3200]]; }
  else if (era === "90") cadeia = [bq("lowshelf", 85, 3), bq("highshelf", 9500, 2)];
  cadeia.reduce((a, b) => (a.connect(b), b), eraIn).connect(an);
  if (chiado) {
    const src = N(ctx.createBufferSource()), g = N(ctx.createGain());
    src.buffer = bufRuido(chiado[0]); src.loop = true; g.gain.value = 0;
    (chiado[2] ? src.connect(bq(chiado[2][0], chiado[2][1], undefined, chiado[2][2])) : src).connect(g); g.connect(an);
    src.start(); ruido = { g, nivel: chiado[1] };
  }
  ajustarRuido();
}
function ajustarRuido() { if (ruido && ctx) ruido.g.gain.setTargetAtTime(playing && cfg.eraRuido ? ruido.nivel : 0, ctx.currentTime, 0.12); }
function aplicarVisual() {
  const a = $("app");
  a.dataset.visual = VISUAIS[cfg.visual] ? cfg.visual : "relogio";
  capaQuad = cfg.formaCapa !== "redonda" && ["relogio", "aura", "espectro", "anel"].includes(a.dataset.visual);
  a.dataset.capa = capaQuad ? "quadrada" : "";
  a.dataset.era = cfg.era && cfg.era !== "off" ? cfg.era : "";
  pintarCena();
}
function pintarCena() {
  const C = $("cena"), x = cur(), v = cfg.visual; if (!C) return;
  const t = esc(x ? (x.t.length > 24 ? x.t.slice(0, 23) + "…" : x.t) : T("Orolon")), a = esc(x ? (x.a.length > 30 ? x.a.slice(0, 29) + "…" : x.a) : "");
  const rolo = (cx) => `<g class="rolo"><circle cx="${cx}" cy="96" r="12" fill="none" stroke="var(--text)" stroke-width="3"/><path d="M${cx} 86v20M${cx - 8.7} 91l17.4 10M${cx - 8.7} 101l17.4-10" stroke="var(--text)" stroke-width="2.4" stroke-linecap="round" fill="none"/></g>`;
  if (v === "cassete") C.innerHTML = `<svg viewBox="0 0 200 200"><rect x="8" y="40" width="184" height="122" rx="11" fill="var(--card)" stroke="var(--muted)" stroke-width="1.5"/>
    <rect x="19" y="50" width="162" height="70" rx="6" fill="var(--accent)"/><text x="100" y="65" text-anchor="middle" font-size="9.500" font-weight="700" fill="var(--on-accent)" font-family="var(--body)">${t}</text><text x="100" y="75.500" text-anchor="middle" font-size="6.500" fill="var(--on-accent)" opacity=".85" font-family="var(--body)">${a}</text>
    <rect x="46" y="80" width="108" height="32" rx="16" fill="var(--bg)"/>${rolo(66)}${rolo(134)}<rect x="88" y="88" width="24" height="16" rx="2" fill="var(--card)" opacity=".6"/>
    <path d="M38 162l9-28h106l9 28" fill="none" stroke="var(--muted)" stroke-width="1.500"/><circle cx="64" cy="149" r="3.200" fill="var(--muted)"/><circle cx="136" cy="149" r="3.200" fill="var(--muted)"/><circle cx="18" cy="151" r="2" fill="var(--muted)"/><circle cx="182" cy="151" r="2" fill="var(--muted)"/></svg>`;
  else if (v === "radio") {
    let esc_ = ""; for (let i = 0; i <= 28; i++) esc_ += `<rect x="${30 + i * 5 - 0.4}" y="${i % 4 ? 70 : 66}" width=".8" height="${i % 4 ? 6 : 10}" fill="var(--text)" opacity=".7"/>`;
    let furos = ""; for (let r = 0; r < 4; r++) for (let c = 0; c < 15; c++) furos += `<circle cx="${37 + c * 9}" cy="${112 + r * 9}" r="2.300" fill="var(--text)" opacity=".28"/>`;
    C.innerHTML = `<svg viewBox="0 0 200 200"><rect x="10" y="36" width="180" height="128" rx="16" fill="var(--card)" stroke="var(--muted)" stroke-width="1.500"/>
      <rect x="22" y="48" width="156" height="48" rx="7" fill="var(--bg)"/><rect class="brilho" x="22" y="48" width="156" height="48" rx="7" fill="var(--accent2)"/>
      <text x="30" y="60" font-size="6" fill="var(--text)" opacity=".8" font-family="var(--body)">AM · FM · ${t}</text>${esc_}
      <rect id="agulha" x="-1.200" y="62" width="2.400" height="30" rx="1" fill="var(--accent)" transform="translate(30 0)"/>${furos}
      <circle cx="176" cy="152" r="0" /></svg>`;
  } else C.innerHTML = "";
}
let nivelViz = new Float32Array(28);
/* Capa quadrada de cantos arredondados: a borda é uma superelipse, e a Aura e o Espectro seguem esse contorno */
let capaQuad = false;
const SE_N = 6, LADO_Q = 0.32; // meia largura da capa quadrada, em fração do mostrador
// distância do centro até a borda de um quadrado de cantos arredondados (o mesmo do CSS: raio = 24% do lado), em frações da meia largura
const RC_Q = 0.48;
const seR = (ang) => {
  const dx = Math.abs(Math.cos(ang)), dy = Math.abs(Math.sin(ang)), m = Math.max(dx, dy), t = 1 / m, o = Math.min(dx, dy) * t;
  if (o <= 1 - RC_Q) return t; // bate no lado reto
  const cc = 1 - RC_Q, dc = (dx + dy) * cc; // bate no canto arredondado (círculo de centro (cc, cc))
  return dc + Math.sqrt(Math.max(0, dc * dc - 2 * cc * cc + RC_Q * RC_Q));
};
const baseR = (W, ang, off) => (capaQuad ? W * LADO_Q * escDisco * seR(ang) : W * 0.34 * escDisco) + off;
function contornoCapa(c, W, cx, off, inverso) { // contorno da capa (mais um afastamento), como caminho
  if (!capaQuad) { const r = W * 0.34 * escDisco + off; c.moveTo(cx + r, cx); c.arc(cx, cx, r, 0, Math.PI * 2, !!inverso); return; }
  const N = 160;
  for (let j = 0; j <= N; j++) {
    const ang = ((inverso ? N - j : j) / N) * Math.PI * 2, r = baseR(W, ang, off);
    const x = cx + Math.cos(ang) * r, y = cx + Math.sin(ang) * r; if (j) c.lineTo(x, y); else c.moveTo(x, y);
  }
  c.closePath();
}
const FOLGA_VIZ = 1.5; // Aura e Espectro desenham numa área 50% maior que o mostrador
let auraNiv = new Float32Array(64), ondinhas = [], ultOndinha = 0, auraLimpa = true;
/* Aura: um anel suave em volta da capa (Relógio e Vinil) que respira com a música, sem exagero */
const temAura = (v) => v === "aura" && APP.dataset.letra !== "1";
function desenharViz() {
  const v = cfg.visual, aura = temAura(v);
  if ((v !== "barras" && v !== "onda" && v !== "espectro" && v !== "anel" && v !== "neon" && v !== "led" && !aura) || $("app").dataset.view !== "tocando") {
    if (!aura && !auraLimpa && (v === "relogio" || v === "vinil")) { const cv = $("viz"); cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); auraLimpa = true; }
    return;
  }
  const cv = $("viz"), w = cv.clientWidth, dpr = Math.min(2, window.devicePixelRatio || 1); if (!w) return;
  const hc = v === "led" ? cv.clientHeight || w : w;
  if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(hc * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(hc * dpr); }
  { const ag = performance.now(); fqV = passoT(ag, ultV); ultV = ag; }
  const c = cv.getContext("2d"), W = cv.width, H = cv.height, vivo = playing && an && !calmo;
  c.clearRect(0, 0, W, H);
  if (corViz2) { tinta = c.createLinearGradient(0, 0, W, W); tinta.addColorStop(0.15, corViz); tinta.addColorStop(0.85, corViz2); } else tinta = corViz;
  c.fillStyle = c.strokeStyle = tinta;
  if (aura) { auraLimpa = false; return desenharAura(c, W, vivo); }
  if (v === "espectro") return desenharEspectro(c, W, vivo);
  if (v === "anel") return desenharAnel(c, W, vivo);
  if (v === "neon") return desenharNeon(c, W, vivo);
  if (v === "led") return desenharLed(c, W, vivo, H);
  if (v === "barras") {
    if (vivo) lerBins();
    const n = 28, vao = W * 0.012, bw = (W - vao * (n - 1)) / n;
    for (let i = 0; i < n; i++) {
      const p = i / (n - 1), alvo = vivo ? bins[1 + Math.round(70 * p * p)] / 255 : 0;
      nivelViz[i] += (alvo - nivelViz[i]) * sv(0.25);
      const h = Math.max(bw, nivelViz[i] * W * 0.8);
      c.globalAlpha = 0.45 + nivelViz[i] * 0.55; c.beginPath();
      if (c.roundRect) c.roundRect(i * (bw + vao), (W - h) / 2, bw, h, bw / 2); else c.rect(i * (bw + vao), (W - h) / 2, bw, h);
      c.fill();
    }
    c.globalAlpha = 1;
  } else {
    if (vivo) an.getByteTimeDomainData(ondas);
    c.lineWidth = W * 0.014; c.lineJoin = c.lineCap = "round"; c.beginPath();
    for (let i = 0; i <= 96; i++) { const val = vivo ? (ondas[Math.floor((i * (ondas.length - 1)) / 96)] - 128) / 128 : 0, y = W / 2 + val * W * 0.42; if (i) c.lineTo((i / 96) * W, y); else c.moveTo(0, y); }
    c.stroke();
  }
}
/* Espectro: anel fino com picos para fora e poeira que acelera nas batidas */
const espNiv = new Float32Array(110), poeira = Array.from({ length: 42 }, () => ({ a: Math.random() * Math.PI * 2, d: Math.random(), v: 0.6 + Math.random(), t: 0.5 + Math.random() * 1.5 }));
// poeira: sai do anel e se afasta devagar; nas batidas corre um pouco mais
function desenharPoeira(c, W, R, k, graves, Wc = W, riscos = false) {
  const cx = Wc / 2, vel = 0.0016 * (1 + batida * 4 * k + graves);
  c.fillStyle = tinta;
  for (const q of poeira) {
    q.d += vel * q.v * fqV; if (q.d > 1) { q.d = 0; q.a = Math.random() * Math.PI * 2; }
    const r = R + q.d * (Wc * 0.48 - R), al = Math.sin(q.d * Math.PI) * 0.55;
    if (riscos) { // risquinhos que esticam com a velocidade, como detritos voando
      const L = W * (0.01 + vel * 9) * q.v, co = Math.cos(q.a), si = Math.sin(q.a);
      c.globalAlpha = al; c.lineWidth = W * 0.0028 * q.t; c.beginPath(); c.moveTo(cx + co * r, cx + si * r); c.lineTo(cx + co * (r + L), cx + si * (r + L)); c.stroke();
    } else { c.globalAlpha = al; c.beginPath(); c.arc(cx + Math.cos(q.a) * r, cx + Math.sin(q.a) * r, W * 0.0035 * q.t, 0, Math.PI * 2); c.fill(); }
  }
}
function desenharEspectro(c, Wc, vivo) {
  const W = Wc / FOLGA_VIZ, n = espNiv.length, k = cfg.reage ? cfg.batF : 0.3, cx = Wc / 2; // a tela de desenho é maior que o mostrador
  if (vivo) lerBins();
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1), alvo = vivo ? bins[3 + Math.round(150 * Math.pow(p, 1.3))] / 255 : 0;
    espNiv[i] += (alvo - espNiv[i]) * sv(alvo > espNiv[i] ? 0.6 : 0.16);
  }
  const graves = vivo ? (bins[1] + bins[2] + bins[3]) / 765 : 0;
  const R = W * 0.34 * escDisco + W * 0.01, A = W * 0.1 * (0.45 + k * 0.75), N = n * 2;
  desenharPoeira(c, W, R, k, graves, Wc);
  // picos: uma linha quebrada (não suavizada), espelhada entre a esquerda e a direita
  c.beginPath();
  for (let j = 0; j <= N; j++) {
    const jj = j % N, ang = (jj / N) * Math.PI * 2 - Math.PI / 2, nv = espNiv[jj < n ? jj : N - 1 - jj], r = Math.min(Wc / 2 - 3, baseR(W, ang, 0) + Math.pow(nv, 3) * A);
    const x = cx + Math.cos(ang) * r, y = cx + Math.sin(ang) * r; if (j) c.lineTo(x, y); else c.moveTo(x, y);
  }
  c.lineJoin = "miter"; c.globalAlpha = 0.07; c.fill();
  c.globalAlpha = 0.85; c.lineWidth = W * 0.003; c.stroke();
  c.globalAlpha = 0.55 + batida * 0.4 * k; c.lineWidth = W * (0.005 + batida * 0.004 * k); c.beginPath(); contornoCapa(c, W, cx, 0); c.stroke();
  c.globalAlpha = 1;
}
/* Anel: barrinhas finas saindo de um anel fino em volta da capa, com riscos voando (estilo dos vídeos tipo Trap Nation) */
const anelNiv = new Float32Array(72);
function desenharAnel(c, Wc, vivo) {
  const W = Wc / FOLGA_VIZ, n = anelNiv.length, k = cfg.reage ? cfg.batF : 0.3, cx = Wc / 2;
  if (vivo) lerBins();
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1), alvo = vivo ? bins[3 + Math.round(140 * Math.pow(p, 1.35))] / 255 : 0;
    anelNiv[i] += (alvo - anelNiv[i]) * sv(alvo > anelNiv[i] ? 0.6 : 0.2);
  }
  const graves = vivo ? (bins[1] + bins[2] + bins[3]) / 765 : 0, gap = W * 0.022, A = W * 0.15 * (0.45 + k * 0.75), N = n * 2;
  desenharPoeira(c, W, W * 0.36, k, graves, Wc, true);
  c.lineCap = "round"; c.lineWidth = W * 0.0042; c.globalAlpha = 0.9; c.beginPath();
  for (let j = 0; j < N; j++) {
    const ang = (j / N) * Math.PI * 2 - Math.PI / 2, nv = anelNiv[j < n ? j : N - 1 - j];
    const r0 = baseR(W, ang, gap), r1 = Math.min(Wc / 2 - 3, r0 + W * 0.005 + Math.pow(nv, 3.2) * A * 1.25), co = Math.cos(ang), si = Math.sin(ang);
    c.moveTo(cx + co * r0, cx + si * r0); c.lineTo(cx + co * r1, cx + si * r1);
  }
  c.stroke();
  c.globalAlpha = 0.6 + batida * 0.35 * k; c.lineWidth = W * (0.0035 + batida * 0.003 * k); c.beginPath(); contornoCapa(c, W, cx, gap * 0.45); c.stroke();
  c.globalAlpha = 1; c.lineCap = "butt";
}
/* Cores do LED: clássico (azul ao vermelho), cores da capa, cores do tema ou a própria arte da capa em mosaico */
let ledArte = null, ledPal = null, ledId = null, ledGrad = null;
const mistura = (a, b, t) => { const x = paraRgb(a) || [128, 128, 128], y = paraRgb(b) || x; return `rgb(${x.map((v, i) => Math.round(v + (y[i] - v) * t)).join(",")})`; };
async function prepararLed(x) {
  if (!x) return; const t = temaAtual(), chave = x.id + "|" + t.id;
  if (ledId === chave) return; ledId = chave; ledArte = null; ledPal = null;
  const p = await paletaDaCapa(x, t);
  ledPal = p.neutro ? NEUTRO(t).slice().reverse() : [ajustarL(p.h2, t, 0.4), ajustarL(p.h1, t)];
  // degradê na diagonal, como o da Aura: cor principal em cima à esquerda, a segunda embaixo à direita
  ledGrad = new Array(LED_N * LED_S);
  for (let j = 0; j < LED_S; j++) for (let i = 0; i < LED_N; i++) ledGrad[j * LED_N + i] = mistura(ledPal[1], ledPal[0], Math.min(1, Math.max(0, ((i / (LED_N - 1)) + (1 - j / (LED_S - 1))) / 2 * 1.4 - 0.2)));
  if (x.capaBlob) try {
    const bm = await createImageBitmap(x.capaBlob), cv = document.createElement("canvas"); cv.width = LED_N; cv.height = LED_S;
    const g = cv.getContext("2d"), alvo = LED_N / LED_S, w = bm.width, h = bm.height;
    let sw = w, sh = w / alvo; if (sh > h) { sh = h; sw = h * alvo; } // recorte do meio da capa no formato do painel
    g.drawImage(bm, (w - sw) / 2, (h - sh) / 2, sw, sh, 0, 0, LED_N, LED_S);
    const d = g.getImageData(0, 0, LED_N, LED_S).data, arte = new Array(LED_N * LED_S);
    for (let j = 0; j < LED_S; j++) for (let i = 0; i < LED_N; i++) {
      const k = ((LED_S - 1 - j) * LED_N + i) * 4, hsl = rgbHsl([d[k], d[k + 1], d[k + 2]]); // linha 0 é a de baixo
      arte[j * LED_N + i] = mistura(hex(hslRgb(hsl[0], Math.min(1, hsl[1] * 1.15), Math.min(0.85, Math.max(0.22, hsl[2] * 1.12)))), ledGrad[j * LED_N + i], 0.35); // a arte puxada para o degradê
    }
    if (cur() === x) ledArte = arte;
  } catch (e) { /* capa ilegível: fica o degradê */ }
}
const corLedFileira = (j) => {
  const p = j / (LED_S - 1), m = cfg.ledCor;
  if (m === "tema") { const t = temaAtual(); return mistura(t.secundaria, t.destaque, p); }
  if (m === "arte" && ledPal) return mistura(ledPal[0], ledPal[1], p);
  return LED_COR[j];
};
/* LED: equalizador clássico em blocos, do azul ao vermelho, com o pico caindo devagar e reflexo embaixo */
const LED_N = 32; let LED_S = 18; const ledNiv = new Float32Array(LED_N), ledPico = new Float32Array(LED_N), ledEspera = new Float32Array(LED_N);
const corPadraoLed = () => Array.from({ length: LED_S }, (_, j) => { const p = j / (LED_S - 1); return `hsl(${Math.round(205 - 205 * Math.pow(p, 1.25))} 88% ${52 + p * 6}%)`; });
let LED_COR = corPadraoLed();
function fileirasLed(n) { // o LED largo do celular ganha fileiras para usar a altura livre com blocos quadrados
  if (n === LED_S) return;
  LED_S = n; LED_COR = corPadraoLed(); ledArte = ledGrad = null; ledId = null;
  if (cfg.visual === "led") prepararLed(cur());
}
function desenharLed(c, W, vivo, H = W) {
  { const largo = c.canvas.parentNode && c.canvas.parentNode.style.aspectRatio === "auto";
    fileirasLed(largo ? Math.max(18, Math.min(44, Math.round((H * 0.86) / ((W * 0.94) / LED_N)))) : 18); }
  if (vivo) lerBins();
  for (let i = 0; i < LED_N; i++) {
    const p = i / (LED_N - 1), alvo = vivo ? Math.min(1, (bins[2 + Math.round(150 * Math.pow(p, 1.5))] / 255) * (1 + p * 0.45)) : 0; // agudos ganham um pouco, para a direita não ficar sempre baixa
    ledNiv[i] += (alvo - ledNiv[i]) * sv(alvo > ledNiv[i] ? 0.55 : 0.18);
    if (ledNiv[i] >= ledPico[i]) { ledPico[i] = ledNiv[i]; ledEspera[i] = 18; } // o pico segura um instante e depois cai
    else if ((ledEspera[i] -= fqV) <= 0) ledPico[i] = Math.max(ledNiv[i], ledPico[i] - 0.012 * fqV);
  }
  const x0 = W * 0.03, larg = W * 0.94, quad = !(c.canvas.parentNode && c.canvas.parentNode.style.aspectRatio === "auto"), base = quad ? W * 0.66 : H * 0.92, alt = quad ? W * 0.56 : H * 0.86, bw = larg / LED_N, vao = bw * 0.22, sh = alt / LED_S, sg = sh * 0.24; // largo (celular): colado embaixo, perto da barra de progresso
  const arte = (cfg.ledCor === "arte" && ledArte) || (cfg.ledCor === "capa" && ledGrad); // os dois pintam bloco a bloco
  if (arte) { // a capa vira um mosaico: cada bloco aceso mostra a cor daquele pedaço da arte (os apagados não aparecem)
    for (let j = 0; j < LED_S; j++) { const lim = (j + 0.5) / LED_S; for (let i = 0; i < LED_N; i++) {
      if (ledNiv[i] < lim) continue;
      c.fillStyle = arte[j * LED_N + i]; c.globalAlpha = 1; // (no modo Cores da capa, "arte" é o degradê)
      c.fillRect(x0 + i * bw + vao / 2, base - (j + 1) * sh + sg / 2, bw - vao, sh - sg);
      if (j < 7) { c.globalAlpha = 0.2 * (1 - j / 7); c.fillRect(x0 + i * bw + vao / 2, base + j * sh * 0.8 + sg, bw - vao, sh * 0.8 - sg); }
    } }
  } else for (let j = 0; j < LED_S; j++) { // uma cor por fileira: poucas trocas de cor por quadro
    c.fillStyle = corLedFileira(j); const lim = (j + 0.5) / LED_S;
    c.globalAlpha = 1; c.beginPath();
    for (let i = 0; i < LED_N; i++) if (ledNiv[i] >= lim) c.rect(x0 + i * bw + vao / 2, base - (j + 1) * sh + sg / 2, bw - vao, sh - sg);
    c.fill();
    if (j < 7) { // reflexo, cada vez mais apagado
      c.globalAlpha = 0.2 * (1 - j / 7); c.beginPath();
      for (let i = 0; i < LED_N; i++) if (ledNiv[i] >= lim) c.rect(x0 + i * bw + vao / 2, base + j * sh * 0.8 + sg, bw - vao, sh * 0.8 - sg);
      c.fill();
    }
  }
  c.globalAlpha = 0.9; c.fillStyle = "#fff";
  for (let i = 0; i < LED_N; i++) if (ledPico[i] > 0.04) c.fillRect(x0 + i * bw + vao / 2, base - ledPico[i] * alt - sh * 0.35, bw - vao, Math.max(1.5, sh * 0.16));
  c.globalAlpha = 1;
}
/* Neon: onda espelhada de ponta a ponta, mais forte no centro, com brilho */
const neonNiv = new Float32Array(80);
function desenharNeon(c, W, vivo) {
  const n = neonNiv.length, k = cfg.reage ? cfg.batF : 0.3, cy = W / 2;
  if (vivo) lerBins();
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1), alvo = vivo ? bins[2 + Math.round(130 * Math.pow(p, 1.4))] / 255 : 0;
    neonNiv[i] += (alvo - neonNiv[i]) * sv(alvo > neonNiv[i] ? 0.5 : 0.14);
  }
  const A = W * 0.17 * (0.5 + k * 0.7) * (1 + batida * 0.15 * k), M = n * 2 - 1, pts = [];
  for (let j = 0; j <= M; j++) {
    const i = Math.abs(n - 1 - j), borda = Math.sin((j / M) * Math.PI); // os graves no meio, a onda morre nas pontas
    pts.push([(j / M) * W, Math.pow(neonNiv[i], 2.2) * A * borda + W * 0.003]);
  }
  const forma = (esc) => {
    c.beginPath(); c.moveTo(0, cy);
    for (const [x, h] of pts) c.lineTo(x, cy - h * esc);
    for (let j = pts.length - 1; j >= 0; j--) c.lineTo(pts[j][0], cy + pts[j][1] * esc);
    c.closePath();
  };
  c.fillStyle = tinta;
  c.strokeStyle = tinta; c.lineJoin = "round";
  c.globalAlpha = 0.1; forma(1.5); c.fill();
  c.globalAlpha = 0.22; forma(1.18); c.fill();
  c.globalAlpha = 0.5; forma(1); c.fill();
  c.globalAlpha = 0.95; c.lineWidth = W * 0.004; c.stroke();
  c.globalAlpha = 0.9; c.fillStyle = "#fff"; c.fillRect(0, cy - W * 0.0018, W, W * 0.0036);
  c.globalAlpha = 1;
}
/* Aura: uma forma macia que envolve a capa e flui com a música, no estilo dos visualizadores tipo Trap Nation:
   reação rápida, forma suavizada entre vizinhos (parece líquido) e duas camadas de eco atrás que acompanham com atraso */
const AURA_N = 64, auraEco1 = new Float32Array(AURA_N), auraEco2 = new Float32Array(AURA_N), auraTmp = new Float32Array(AURA_N);
let auraGiro = 0;
function curvaAura(c, niv, W, off, A, cx, giro, buraco) {
  const n = niv.length, N = n * 2, pts = [], teto = cx - 4; // nunca encosta na borda da tela de desenho
  for (let j = 0; j < N; j++) {
    const angP = (j / N) * Math.PI * 2 - Math.PI / 2 + giro, nv = niv[j < n ? j : N - 1 - j], r0 = baseR(W, angP, off) + Math.pow(nv, 1.7) * A, r = r0 < teto * 0.9 ? r0 : teto * 0.9 + (teto * 0.1) * Math.tanh((r0 - teto * 0.9) / (teto * 0.1)), ang = (j / N) * Math.PI * 2 - Math.PI / 2 + giro;
    pts.push([cx + Math.cos(ang) * r, cx + Math.sin(ang) * r]);
  }
  c.beginPath();
  for (let j = 0; j <= N; j++) { // curva suave pelos pontos médios
    const p0 = pts[j % N], p1 = pts[(j + 1) % N], mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2;
    if (j === 0) c.moveTo(mx, my); else c.quadraticCurveTo(p0[0], p0[1], mx, my);
  }
  if (buraco) contornoCapa(c, W, cx, -0.5, true); // não pinta por cima da capa
}
function desenharAura(c, Wc, vivo) {
  const W = Wc / FOLGA_VIZ, n = AURA_N, k = cfg.reage ? cfg.batF : 0.3, cx = Wc / 2; // a tela de desenho é maior que o mostrador
  if (vivo) lerBins();
  for (let i = 0; i < n; i++) {
    const p = i / (n - 1), alvo = vivo ? bins[2 + Math.round(110 * Math.pow(p, 1.5))] / 255 : 0;
    auraTmp[i] = alvo;
  }
  // suaviza entre vizinhos (3 passadas): os picos viram ondas, como um líquido
  for (let pass = 0; pass < 3; pass++) for (let i = 0; i < n; i++) {
    const a = auraTmp[Math.max(0, i - 1)], b = auraTmp[Math.min(n - 1, i + 1)];
    auraTmp[i] = auraTmp[i] * 0.5 + (a + b) * 0.25;
  }
  for (let i = 0; i < n; i++) {
    const alvo = auraTmp[i];
    auraNiv[i] += (alvo - auraNiv[i]) * sv(alvo > auraNiv[i] ? 0.55 : 0.18); // sobe na hora, desce rápido
    auraEco1[i] += (auraNiv[i] - auraEco1[i]) * sv(0.12);
    auraEco2[i] += (auraEco1[i] - auraEco2[i]) * sv(0.08);
  }
  const graves = vivo ? (bins[1] + bins[2] + bins[3]) / 765 : 0;
  auraGiro += (0.0012 + batida * 0.004 * k) * fqV; // gira bem devagar, um pouco mais nas batidas
  const R = W * 0.34 * escDisco + W * 0.01, A = W * 0.13 * (0.45 + k * 0.75);
  desenharPoeira(c, W, R, k, graves, Wc);
  c.lineJoin = "round"; c.fillStyle = c.strokeStyle = tinta;
  // ecos atrás: maiores, mais transparentes e atrasados
  const off = 0;
  curvaAura(c, auraEco2, W, off, A * 1.25, cx, -auraGiro * 0.6, true); c.globalAlpha = 0.08; c.fill("evenodd");
  curvaAura(c, auraEco1, W, off, A * 1.12, cx, auraGiro * 0.5, true); c.globalAlpha = 0.12; c.fill("evenodd");
  curvaAura(c, auraEco1, W, off, A * 1.12, cx, auraGiro * 0.5); c.globalAlpha = 0.3; c.lineWidth = W * 0.003; c.stroke();
  // camada principal
  curvaAura(c, auraNiv, W, off, A, cx, auraGiro, true);
  c.globalAlpha = 0.16 + batida * 0.08 * k; c.fill("evenodd");
  curvaAura(c, auraNiv, W, off, A, cx, auraGiro);
  c.globalAlpha = 0.07 + batida * 0.07 * k; c.fill(); // véu leve da cor por cima da capa, mais forte nas batidas
  c.globalAlpha = 0.18; c.lineWidth = W * 0.022; c.stroke();
  c.globalAlpha = 0.85; c.lineWidth = W * 0.005; c.stroke();
  // uma onda sai da capa em cada batida forte
  if (vivo && ultimaBatida !== ultOndinha && performance.now() - ultimaBatida < 60) { ultOndinha = ultimaBatida; if (ondinhas.length < 3) ondinhas.push(0); }
  c.lineWidth = W * 0.005;
  for (let i = ondinhas.length - 1; i >= 0; i--) {
    const t = (ondinhas[i] += 0.022 * fqV); if (t >= 1) { ondinhas.splice(i, 1); continue; }
    c.globalAlpha = 0.3 * (1 - t) * k; c.beginPath(); contornoCapa(c, W, cx, t * W * 0.14); c.stroke();
  }
  c.globalAlpha = 1;
}
/* Tela cheia: o mostrador vira um relógio que toca */
const emPalco = () => $("app").dataset.palco === "1";
async function alternarPalco(forcar) {
  const on = forcar !== undefined ? forcar : !emPalco();
  $("app").dataset.palco = on ? "1" : "";
  $("b-palco").innerHTML = ico(on ? "x" : "expand", 20); $("b-palco").setAttribute("aria-label", on ? T("Sair da tela cheia") : T("Tela cheia"));
  try { if (on && document.documentElement.requestFullscreen) await document.documentElement.requestFullscreen(); else if (!on && document.fullscreenElement) await document.exitFullscreen(); } catch (e) { /* sem tela cheia aqui: fica o modo ampliado */ }
  atualizarHora(); atualizarTela(); ajustarDial();
}
function atualizarHora() { if (emPalco()) $("hora").textContent = new Date().toLocaleTimeString(LOCALE(), { hour: "2-digit", minute: "2-digit" }); }
document.addEventListener("fullscreenchange", () => { if (!document.fullscreenElement && emPalco()) alternarPalco(false); });
$("b-palco").addEventListener("click", () => alternarPalco());
$("b-palco").innerHTML = ico("expand", 20);


/* ===================== Seleção múltipla ===================== */
let sel = null;
function linhaSel(x) {
  const on = sel.has(x.id);
  return `<div class="track"><button class="tp" data-sel-id="${x.id}" role="checkbox" aria-checked="${on}"><span class="cx${on ? " on" : ""}">${on ? ico("check", 16) : ""}</span>${capa(x)}<span class="grow"><span class="t clip">${esc(x.t)}</span><span class="sub clip">${esc(linha2(x))}</span></span></button><span class="dur">${x.d ? fmt(x.d) : ""}</span></div>`;
}
function barraSel(total) {
  const n = sel.size;
  return `<div class="selbar"><div class="row"><span class="t grow">${plural(n, "selecionada", "selecionadas")}</span><button class="btn ghost sm" data-selacao="todas">${n === total ? T("Nenhuma") : T("Todas")}</button><button class="btn ghost sm" data-selacao="cancelar">${T("Cancelar")}</button></div>
    <div class="btns"><button class="btn sm" data-selacao="playlist"${n ? "" : " disabled"}>${ico("pls", 18)}Playlist</button><button class="btn ghost sm" data-selacao="fila"${n ? "" : " disabled"}>${ico("addq", 18)}${T("Fila")}</button><button class="btn ghost sm" data-selacao="ocultar"${n ? "" : " disabled"}>${ico("eyeoff", 18)}${T("Ocultar")}</button><button class="btn danger sm" data-selacao="remover"${n ? "" : " disabled"}>${ico("trash", 18)}${T("Remover")}</button></div></div>`;
}
function acaoSel(a) {
  const ids = [...sel].filter((id) => porId.has(id));
  if (a === "cancelar") { sel = null; return renderBib(); }
  if (a === "todas") { sel = sel.size === listaBib.ids.length ? new Set() : new Set(listaBib.ids); return renderBib(); }
  if (!ids.length) return;
  if (a === "fila") {
    for (const id of ids) { if (queue[qi] === id) continue; const i = queue.indexOf(id); if (i >= 0) { queue.splice(i, 1); if (i < qi) qi--; } queue.push(id); }
    if (!cur()) { qi = 0; carregar(false); }
    sel = null; renderBib(); renderFilaAberta(); paint(); salvarSessao();
    return toast(plural(ids.length, "música foi", "músicas foram") + T(" para o fim da fila"));
  }
  if (a === "playlist") {
    const html = () => `<div class="menu"><button data-nova>${ico("plus")}${T("Nova playlist")}</button>${pls.map((p) => `<button data-pl="${p.id}">${mosaico(p)}<span class="grow"><span class="t clip">${esc(p.nome)}</span><span class="sub">${plural(idsDe(p).length, "música", "músicas")}</span></span></button>`).join("")}</div>`;
    const fim = (p) => { let n = 0; for (const id of ids) if (!p.ids.includes(id)) { p.ids.push(id); n++; } salvarPl(p); sel = null; fecharFolha(); renderBib(); renderPl(); toast(`${plural(n, "música adicionada", "músicas adicionadas")} a "${p.nome}"`); };
    return abrirFolha({
      titulo: `${T("Adicionar")} ${plural(ids.length, "música", "músicas")}`, html: html(),
      clique(e) {
        if (e.target.closest("[data-nova]")) return perguntar(T("Nova playlist"), T("Nome da playlist"), "", T("Criar e adicionar"), (n) => fim(novaPlaylist(n)));
        const b = e.target.closest("[data-pl]"), p = b && pls.find((y) => y.id === b.dataset.pl); if (p) fim(p);
      },
    });
  }
  const reais = ids.filter((id) => !porId.get(id).demo);
  if (!reais.length) return toast(T("As músicas de exemplo não podem ser ocultadas nem removidas aqui"));
  if (a === "ocultar") { reais.forEach((id) => ocultar(id, true)); sel = null; renderBib(); return toast(plural(reais.length, "música oculta", "músicas ocultas") + T(". Para mostrar de novo: Ajustes › Reprodução e biblioteca")); }
  if (a === "remover") confirmar(T("Remover da biblioteca?"), plural(reais.length, "música sai", "músicas saem") + T(" do Orolon e das playlists. Os arquivos originais continuam no seu aparelho."), T("Remover"), () => { reais.forEach(removerFaixa); sel = null; renderBib(); toast(plural(reais.length, "música removida", "músicas removidas")); });
}

/* ===================== Boas-vindas, instalação e sobre ===================== */
const VERSAO = "1.20.0";
const linkPrivacidade = () => "https://kirarahoshi.github.io/compasso-player/privacidade.html" + (LANG === "en" ? "#en" : "#pt");
let instalar = null;
const instalado = () => NATIVO || matchMedia("(display-mode: standalone)").matches || navigator.standalone === true;
addEventListener("beforeinstallprompt", (e) => { e.preventDefault(); instalar = e; if ($("app").dataset.view === "temas" && !editando) renderTemas(); });
addEventListener("appinstalled", () => { instalar = null; toast(T("Orolon instalado")); });
async function pedirInstalacao() {
  if (!instalar) return toast(T("No menu do navegador, toque em Instalar app ou Adicionar à tela inicial"));
  instalar.prompt(); try { await instalar.userChoice; } catch (e) { /* fechado */ }
  instalar = null;
}
function boasVindas() {
  guardado.set("compasso.boasvindas", true);
  const html = () => `<p class="note" style="padding:0 6px">${NATIVO ? T("Um player de música que funciona sem internet, sem conta e sem anúncios. Dois passos e está pronto.") : T("Um player de música que funciona sem internet, sem conta e sem anúncios. Três passos e está pronto.")}</p>
    <div class="card stack"><div class="row"><span class="passo">1</span><h2 class="grow">${T("Traga suas músicas")}</h2></div><p class="note">${T("Elas ficam guardadas só neste aparelho. Servem MP3, FLAC, M4A, OGG e Opus.")}</p>
      <div class="btns">${MUS ? `<button class="btn sm" data-bv="aparelho">${ico("folder", 18)}${T("Procurar no aparelho")}</button>` : ""}<button class="btn ${MUS ? "ghost " : ""}sm" data-bv="arquivos">${ico("note", 18)}${T("Escolher arquivos")}</button>${NATIVO ? "" : `<button class="btn ghost sm" data-bv="pasta">${ico("folder", 18)}${T("Escolher pasta")}</button>`}</div></div>
    <div class="card stack"><div class="row"><span class="passo">2</span><h2 class="grow">${T("Escolha o visual")}</h2></div>
      <div class="btns">${["claro", "escuro"].map((k) => `<button class="btn ${cfg.tema === k ? "" : "ghost"} sm" data-bv-tema="${k}" aria-pressed="${cfg.tema === k}">${BASE[k].nome}</button>`).join("")}</div><p class="note">${T("Em Ajustes você cria seus temas, muda o mostrador e liga o som de época (rádio, vinil, fita e CD).")}</p></div>
    ${instalado() ? "" : `<div class="card stack"><div class="row"><span class="passo">3</span><h2 class="grow">${T("Instale como app")}</h2></div>${instalar ? `<div class="btns"><button class="btn sm" data-bv="instalar">${T("Instalar o Orolon")}</button></div>` : `<p class="note">${T("No menu do navegador, toque em <b>Instalar app</b> ou <b>Adicionar à tela inicial</b>. Ele abre em tela cheia e funciona offline.")}</p>`}</div>`}
    <button class="btn" data-bv="fechar">${T("Começar")}</button>`;
  abrirFolha({
    titulo: T("Bem-vindo ao Orolon"), html: html(),
    clique(e) {
      const t = e.target.closest("[data-bv-tema]"); if (t) { cfg.tema = t.dataset.bvTema; aplicarTema(); $("sheet-b").innerHTML = html(); return; }
      const b = e.target.closest("[data-bv]"); if (!b) return;
      const a = b.dataset.bv;
      if (a === "instalar") return pedirInstalacao();
      fecharFolha();
      if (a === "aparelho") procurarNoAparelho(true); else if (a === "arquivos") $("files").click(); else if (a === "pasta") $("folder").click();
    },
  });
}

/* ===================== Galeria de temas ===================== */
const GALERIA = [{"nome": T("Entardecer"), "fundo": "#0E1119", "card": "#1A1F2B", "texto": "#F4EEE6", "suave": "#A9A39A", "destaque": "#EDA36D", "secundaria": "#F7D9A5", "raio": 16, "fonte": "padrao"}, {"nome": T("Brasa"), "fundo": "#17100C", "card": "#241812", "texto": "#F7EBDD", "suave": "#B59E8A", "destaque": "#FF8A3D", "secundaria": "#F2D7A6", "raio": 12, "fonte": "padrao"}, {"nome": T("Maré"), "fundo": "#0A1418", "card": "#12222A", "texto": "#E6F4F6", "suave": "#8FB0B8", "destaque": "#4FD1E0", "secundaria": "#F06A86", "raio": 20, "fonte": "padrao"}, {"nome": T("Meia-noite"), "fundo": "#000000", "card": "#101014", "texto": "#F2F2F5", "suave": "#9A9AA8", "destaque": "#7C9BFF", "secundaria": "#E3C98A", "raio": 14, "fonte": "sistema"}, {"nome": T("Folha"), "fundo": "#F1F4EA", "card": "#FFFFFF", "texto": "#1C2414", "suave": "#5F6B52", "destaque": "#3F7A14", "secundaria": "#B5560F", "raio": 18, "fonte": "padrao"}, {"nome": T("Papel"), "fundo": "#F3F1EC", "card": "#FFFEFB", "texto": "#22201C", "suave": "#6B665C", "destaque": "#2F5FA8", "secundaria": "#9A4B2F", "raio": 6, "fonte": "serifada"}];

/* ===================== Navegação ===================== */
/* O Tocando agora não fica na barra: abre pelo mini player, pelo Continuar do Início e ao tocar uma lista */
const TELAS = [["inicio", T("Início"), "home"], ["biblioteca", T("Biblioteca"), "lib"], ["playlists", T("Playlists"), "pls"], ["voce", T("Você"), "user"], ["temas", T("Ajustes"), "thm"]];
const TELAS_VALIDAS = [...TELAS.map((x) => x[0]), "tocando"];
const montarNav = () => { $("nav").innerHTML = TELAS.map((v) => `<button data-v="${v[0]}">${ico(v[2])}<span>${v[1]}</span></button>`).join(""); };
montarNav();
let historico = [], rolagens = {}; // telas visitadas, para o voltar refazer o caminho
function ir(v, voltando) {
  if (!TELAS_VALIDAS.includes(v)) v = "inicio";
  const antes = $("app").dataset.view;
  if (antes === "temas" && v !== "temas") porta = null; // Ajustes reabre na raiz
  if (antes && antes !== v) { rolagens[antes] = $("main").scrollTop; if (!voltando) { historico.push(antes); if (historico.length > 30) historico.shift(); } }
  $("app").dataset.view = v;
  document.querySelectorAll(".view").forEach((s) => s.classList.toggle("on", s.id === "v-" + v));
  document.querySelectorAll("nav button").forEach((b) => { const on = b.dataset.v === v; b.classList.toggle("on", on); if (on) b.setAttribute("aria-current", "page"); else b.removeAttribute("aria-current"); });
  if (v === "voce") renderVoce();
  if (v === "inicio") renderInicio();
  ultSeek = -1;
  if (v === "playlists") renderPl();
  if (v !== "tocando" && emPalco()) alternarPalco(false);
  if (v === "temas" && !editando) renderTemas();
  atualizarTela();
  ajustarDial();
  if (location.hash.slice(1) !== v) try { history.replaceState(null, "", "#" + v); } catch (e) { /* ignora */ }
  $("main").scrollTop = voltando ? rolagens[v] || 0 : 0;
}
/* No celular em pé, o mostrador encolhe o que for preciso para todos os controles caberem na tela sem rolar */
const DUAS_COLUNAS = matchMedia("(min-width:1000px) and (min-aspect-ratio:4/3), (orientation:landscape) and (max-height:560px) and (min-width:560px)");
function ajustarDial() {
  const dial = document.querySelector("#v-tocando .dial"), vw = $("v-tocando"), m = $("main");
  if (!dial) return;
  const largo = APP.dataset.visual === "led";
  const meta = vw.querySelector(".np-meta");
  dial.style.marginTop = meta.style.marginTop = ""; // o LED largo (celular) desce até perto do título; o espaço que sobra fica em cima
  if (APP.dataset.view !== "tocando" || DUAS_COLUNAS.matches || emPalco() || APP.dataset.letra === "1") { dial.style.width = dial.style.height = dial.style.aspectRatio = ""; vw.style.rowGap = ""; return; }
  const cs = getComputedStyle(m), H = m.clientHeight - parseFloat(cs.paddingTop) - parseFloat(cs.paddingBottom);
  vw.style.rowGap = "";
  let outros = 0, n = 0;
  for (const el of vw.children) { if (el === dial || el.offsetParent === null) continue; outros += el.offsetHeight; n++; }
  let livre = H - outros - (parseFloat(getComputedStyle(vw).rowGap) || 0) * n - 4;
  if (livre < 220) { vw.style.rowGap = "8px"; livre = H - outros - 8 * n - 4; } // tela baixa: aperta os espaços antes de encolher mais o mostrador
  if (largo) { dial.style.width = "100%"; dial.style.aspectRatio = "auto"; dial.style.height = Math.floor(Math.max(140, Math.min(livre, 620))) + "px"; dial.style.marginTop = "auto"; meta.style.marginTop = "0"; return; }
  dial.style.height = dial.style.aspectRatio = "";
  const w = Math.max(140, Math.min(innerWidth * 0.8, 400, livre));
  dial.style.width = Math.floor(w) + "px";
}
if (window.ResizeObserver) { const ro = new ResizeObserver(() => ajustarDial()); ro.observe($("main")); ro.observe(document.querySelector("#v-tocando .np-meta")); }
DUAS_COLUNAS.addEventListener?.("change", ajustarDial);
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


/* ===================== Trocar idioma sem recarregar (a música continua) ===================== */
const TEXTOS_FIXOS = [];
(function marcar() {
  const visitar = (o) => {
    if (!o || typeof o !== "object") return;
    for (const k of Object.keys(o)) {
      const v = o[k];
      if (typeof v === "string") { const pt = chavePt(v); if (pt !== undefined) TEXTOS_FIXOS.push([o, k, pt]); }
      else if (typeof v === "object" && typeof v !== "function") visitar(v);
    }
  };
  [FONTES, BASE, CAMPOS, DESTAQUES, ORDENS, EQ_P, AUTO, ERAS, ERA_DESC, VISUAIS, GALERIA, TELAS, PORTAS, FERRAMENTAS, NOMES_REVERB].forEach(visitar);
})();
function mudarIdioma(l) {
  if (!IDIOMAS[l] || l === LANG) return;
  const ctxPt = chavePt(contexto), bibPt = chavePt(listaBib.ctx);
  LANG = l; cfg.lang = l; salvarCfg();
  document.documentElement.lang = l === "en" ? "en" : "pt-BR";
  for (const [o, k, pt] of TEXTOS_FIXOS) o[k] = T(pt);
  if (ctxPt !== undefined) contexto = T(ctxPt);
  if (bibPt !== undefined) listaBib.ctx = T(bibPt);
  if (folha) fecharFolha();
  traduzirPagina(document.body);
  montarNav();
  const v = $("app").dataset.view;
  renderBib(); renderPl(); renderTemas(); renderLetra(); paint();
  if (v === "voce") renderVoce();
  document.querySelectorAll("nav button").forEach((b) => b.classList.toggle("on", b.dataset.v === v));
  const nb = document.querySelector(`nav button[data-v="${v}"]`); if (nb) nb.setAttribute("aria-current", "page");
  toast(T("Idioma: {0}", IDIOMAS[l]));
}

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
$("b-fav").addEventListener("click", () => cur() && alternarFav(cur().id));
$("mini-fav").addEventListener("click", () => cur() && alternarFav(cur().id));
$("b-timer").addEventListener("click", abrirSono);
$("b-menos10").addEventListener("click", () => buscarSeg(posAtual() - 10));
$("b-mais10").addEventListener("click", () => buscarSeg(posAtual() + 10));
$("b-menos10").innerHTML = ico("menos10", 24); $("b-mais10").innerHTML = ico("mais10", 24);
$("b-vel").addEventListener("click", () => {
  cfg.vel = VELS[(VELS.indexOf(+cfg.vel || 1) + 1) % VELS.length]; salvarCfg(); aplicarVel();
  const x = cur(); toast(x && x.demo ? T("Velocidade {0}×. As músicas de exemplo tocam sempre em 1×", decimal(String(cfg.vel))) : T("Velocidade {0}×", decimal(String(cfg.vel))));
  if ($("app").dataset.view === "temas") renderTemas();
});
$("b-eq").addEventListener("click", abrirEQ);
$("b-shuf").innerHTML = ico("shuf"); $("b-prev").innerHTML = ico("prev", 28); $("b-next").innerHTML = ico("next", 28); $("mini-next").innerHTML = ico("next", 22);

/* O app tem layout fixo (nada rola na página), então o zoom de pinça só deixaria tudo cortado e travando: bloqueado aqui, no CSS e na tela */
for (const ev of ["gesturestart", "gesturechange", "gestureend"]) document.addEventListener(ev, (e) => e.preventDefault(), { passive: false });
document.addEventListener("touchmove", (e) => { if (e.touches.length > 1 && !e.target.closest(".corte")) e.preventDefault(); }, { passive: false });
document.addEventListener("wheel", (e) => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });

/* Botão voltar do Android: desfaz um passo de cada vez, como nos outros apps; na tela inicial, só minimiza (a música continua) */
function voltarUmPasso() {
  if (folha) { fecharFolha(); return true; }
  if (emCarro()) { fecharCarro(); return true; }
  if (emPalco()) { alternarPalco(false); return true; }
  if (modoLetra && APP.dataset.view === "tocando") { $("b-letra").click(); return true; }
  const v = APP.dataset.view;
  if (v === "biblioteca" && sel) { sel = null; renderBib(); return true; }
  if (v === "biblioteca" && aberto) { aberto = null; renderBib(); return true; }
  if (v === "playlists" && plAberta) { plAberta = null; renderPl(); return true; }
  if (v === "temas" && editando) { editando = null; aplicarTema(); renderTemas(); return true; }
  if (v === "temas" && porta) { abrirPorta(null); return true; }
  while (historico.length) { const p = historico.pop(); if (p !== v) { ir(p, true); return true; } } // volta para a tela anterior, não para a primeira
  if (v !== "inicio") { ir("inicio", true); return true; }
  return false;
}
if (PLUG.App) nat(() => PLUG.App.addListener("backButton", () => { if (!voltarUmPasso()) nat(() => PLUG.App.minimizeApp()); }));

document.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && folha) return fecharFolha();
  if (e.key === "Escape" && emCarro()) return fecharCarro();
  if (e.key === "Escape" && emPalco()) return alternarPalco(false);
  if (e.key === "Escape" && APP.dataset.view === "temas" && porta && !editando) return abrirPorta(null);
  const alvo = e.target, tag = alvo.tagName;
  if (folha || e.ctrlKey || e.metaKey || e.altKey || tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || alvo.isContentEditable) return;
  if (e.key === " " && tag !== "BUTTON") { e.preventDefault(); alternar(); }
  else if (e.key === "ArrowRight") { e.preventDefault(); buscarSeg(posAtual() + 5); }
  else if (e.key === "ArrowLeft") { e.preventDefault(); buscarSeg(posAtual() - 5); }
  else if (e.key === "n" || e.key === "N") proxima();
  else if (e.key === "p" || e.key === "P") anterior();
  else if ((e.key === "f" || e.key === "F") && cur()) alternarFav(cur().id);
  else if (e.key === "ArrowUp") { e.preventDefault(); mudarVolume(cfg.vol + 0.05); toast(T("Volume {0}%", Math.round(cfg.vol * 100))); }
  else if (e.key === "ArrowDown") { e.preventDefault(); mudarVolume(cfg.vol - 0.05); toast(T("Volume {0}%", Math.round(cfg.vol * 100))); }
  else if (e.key === "m" || e.key === "M") { $("b-vol").click(); toast(cfg.mudo ? T("Mudo") : T("Volume {0}%", Math.round(cfg.vol * 100))); }
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
traduzirPagina(document.body);
APP.dataset.leve = cfg.leve ? "1" : "";
aplicarVolume(true); aplicarVolRec(); aplicarVel();
aplicarTema(); aplicarFundo(); aplicarVisual(); renderLetra();
ir(location.hash.slice(1) || "inicio");
renderBib(); renderTemas(); paint();
requestAnimationFrame(quadro);

(async function iniciar() {
  try { db = await abrirDB(); } catch (e) { db = null; }
  for (const x of await dbTodos("faixas")) {
    try { if (!x.arq && !(x.uri && NATIVO)) continue; montar(x); adicionarFaixa(x); } catch (e) { /* registro com defeito: ignora */ }
  }
  pls = db ? await dbTodos("playlists") : guardado.get("compasso.pls", []);
  if (!pls.length && !guardado.get("compasso.semente", false)) {
    novaPlaylist("Para focar", ["ex0", "ex2", "ex5"]);
    novaPlaylist("Para acordar", ["ex1", "ex3", "ex4"]);
  }
  guardado.set("compasso.semente", true);
  restaurarSessao();
  carregado = true;
  renderBib(); renderPl(); renderTemas(); paint();
  if (cfg.tagsVer !== 2) setTimeout(relerLetras, 1500);
  if (cfg.capasVer !== 1) setTimeout(acertarCapas, 2500);
  if (!guardado.get("compasso.boasvindas", false) && !importadas().length) boasVindas();
  autoTocar();
  if (MUS && cfg.aparelho) setTimeout(() => procurarNoAparelho(false), 1500);
  else if (MUS && (cfg.pastasEscolhidas || []).length) setTimeout(() => procurarNasPastas(false), 1500);
})();

if (!window.Capacitor && "serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost" || location.hostname === "127.0.0.1")) {
  navigator.serviceWorker.register("sw.js").catch(() => { /* sem modo offline aqui (por exemplo, dentro de outra página) */ });
}
