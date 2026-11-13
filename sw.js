/* Orolon: modo offline. Guarda os arquivos do app no aparelho e abre mesmo sem internet.
   Estratégia: entrega da cópia guardada na hora e atualiza a cópia em segundo plano. */
const CACHE = "compasso-v1.16.0";
const ARQUIVOS = ["./", "index.html", "css/app.css", "js/i18n.js", "js/tags.js", "js/app.js", "manifest.json",
  "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-512.png"];

self.addEventListener("install", (e) => {
  // "reload" ignora a cópia temporária do navegador, para a versão nova não misturar arquivos velhos
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ARQUIVOS.map((u) => new Request(u, { cache: "reload" })))).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const proprio = url.origin === self.location.origin;
  if (!proprio) return;
  e.respondWith(caches.open(CACHE).then(async (c) => {
    const guardada = await c.match(req, { ignoreSearch: proprio });
    const rede = fetch(req, { cache: "no-cache" }).then((r) => { if (r && (r.ok || r.type === "opaque")) c.put(req, r.clone()); return r; }).catch(() => null);
    if (guardada) { e.waitUntil(rede); return guardada; }
    const r = await rede;
    if (r) return r;
    if (req.mode === "navigate") return (await c.match("index.html")) || Response.error();
    return Response.error();
  }));
});
