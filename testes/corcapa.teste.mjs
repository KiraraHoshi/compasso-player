import assert from "node:assert/strict";

// 1.26.8: cores da capa em três níveis — desligado (tudo no tema), no Tocando agora (mostrador e botões) e no app inteiro (opção nova)
const LARANJA = { h1: [0.07, 0.9, 0.5], h2: [0.42, 0.6, 0.4] }; // capa laranja e verde
const preparar = (pal, corCapa, capaApp) => {
  const x = cur(); x._paleta = pal; cfg.corCapa = corCapa; cfg.capaApp = capaApp; cfg.visual = "relogio";
  if (!document.getElementById("sonda")) { const d = document.createElement("i"); d.id = "sonda"; d.style.color = "var(--accent)"; document.body.append(d); }
  return atualizarCorViz().then(() => new Promise((r) => setTimeout(r, 750))); // espera a passagem suave (0,6 s) que a abertura do app pode ter começado
};
const ler = () => ({ play: getComputedStyle(document.getElementById("b-play")).backgroundColor, app: getComputedStyle(document.getElementById("sonda")).color, tema: (() => { const d = document.createElement("i"); d.style.color = temaAtual().destaque; document.body.append(d); const c = getComputedStyle(d).color; d.remove(); return c; })() });

export default [
  {
    nome: "desligado: Tocando e app na cor do tema",
    rodar: async (p) => {
      await p.avaliar(preparar, LARANJA, false, false);
      const c = await p.avaliar(ler);
      assert.equal(c.play, c.tema); assert.equal(c.app, c.tema);
    },
  },
  {
    nome: "no Tocando: o botão de tocar pega a cor da capa e o resto do app fica no tema",
    rodar: async (p) => {
      await p.avaliar(preparar, LARANJA, true, false);
      const c = await p.avaliar(ler);
      assert.notEqual(c.play, c.tema, "o botão de tocar devia seguir a capa"); assert.equal(c.app, c.tema);
    },
  },
  {
    nome: "no app inteiro: o destaque de todas as telas segue a capa",
    rodar: async (p) => {
      await p.avaliar(preparar, LARANJA, true, true);
      const c = await p.avaliar(ler);
      assert.notEqual(c.app, c.tema); assert.equal(c.play, c.app);
      await p.avaliar(preparar, LARANJA, true, false);
      assert.equal((await p.avaliar(ler)).app, (await p.avaliar(ler)).tema, "desligar devolve a cor do tema");
    },
  },
  {
    nome: "no app inteiro, tema claro com capa clara: o texto do botão continua legível",
    rodar: async (p) => {
      await p.avaliar(() => { cfg.tema = "claro"; aplicarTema(); });
      await p.avaliar(preparar, { h1: [0.15, 0.9, 0.85], h2: [0.15, 0.5, 0.9] }, true, true);
      const r = await p.avaliar(() => { const s = getComputedStyle(document.documentElement); const h = (v) => hex(paraRgb(v.trim())); return contraste(h(s.getPropertyValue("--accent")), h(s.getPropertyValue("--on-accent"))); });
      assert.ok(r >= 3, "contraste " + r);
    },
  },
  {
    nome: "editor de tema mostra as cores do próprio tema mesmo com a capa no app inteiro",
    rodar: async (p) => {
      await p.avaliar(preparar, LARANJA, true, true);
      await p.avaliar(() => { ir("temas"); abrirPorta("aparencia"); });
      await p.clicar("[data-criar]");
      const c = await p.avaliar(() => [hex(paraRgb(getComputedStyle(document.documentElement).getPropertyValue("--accent").trim())).toUpperCase(), editando.rascunho.destaque.toUpperCase()]);
      assert.equal(c[0], c[1]);
    },
  },
  {
    nome: "a opção do app inteiro está em Aparência e no pincel, e entra no backup",
    hash: "tocando",
    rodar: async (p) => {
      await p.clicar("#b-pincel");
      await p.esperar(() => !!document.querySelector("#sheet [data-tg=capaApp]"), 1500);
      await p.clicar("#sheet [data-tg=capaApp]");
      assert.equal(await p.avaliar(() => cfg.capaApp), true);
      await p.avaliar(() => { fecharFolha(); ir("temas"); abrirPorta("aparencia"); });
      assert.ok(await p.avaliar(() => !!document.querySelector("#tm [data-tg=capaApp]")));
      await p.avaliar(() => restaurarBackup({ formato: "compasso-backup", ajustes: { capaApp: "sim" } }));
      assert.equal(await p.avaliar(() => cfg.capaApp), true, "valor estragado não muda nada");
      await p.avaliar(() => restaurarBackup({ formato: "compasso-backup", ajustes: { capaApp: false } }));
      assert.equal(await p.avaliar(() => cfg.capaApp), false);
    },
  },
];
