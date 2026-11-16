import assert from "node:assert/strict";

const semRolarDeLado = async (p) => {
  for (const w of [320, 360, 412]) {
    await p.tamanho(w, 780);
    assert.ok(await p.avaliar(() => document.documentElement.scrollWidth <= innerWidth && document.getElementById("main").scrollWidth <= document.getElementById("main").clientWidth), `rola para o lado em ${w} px`);
  }
};

export default [
  {
    nome: "seis ferramentas na ordem",
    rodar: async (p) => assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#ini-ferr [data-ferr]")].map((b) => b.dataset.ferr)), ["eq", "sono", "visual", "epoca", "vel", "palco"]),
  },
  {
    nome: "equalizador abre a folha e voltar fecha",
    rodar: async (p) => {
      await p.clicar("[data-ferr=eq]");
      assert.equal(await p.avaliar(() => document.getElementById("sheet").hidden), false);
      assert.equal(await p.voltar(), true);
      await p.esperar(() => document.getElementById("sheet").hidden, 1500); // some depois da animação de fechar
      assert.equal(await p.avaliar(() => document.getElementById("app").dataset.view), "inicio");
    },
  },
  {
    nome: "visual pela folha muda o visual",
    rodar: async (p) => {
      await p.clicar("[data-ferr=visual]");
      await p.clicar("#sheet [data-vis=vinil]");
      assert.equal(await p.avaliar(() => cfg.visual), "vinil");
    },
  },
  {
    nome: "época pela folha muda a época",
    rodar: async (p) => {
      await p.clicar("[data-ferr=epoca]");
      await p.clicar("#sheet [data-epoca='80']");
      assert.equal(await p.avaliar(() => String(cfg.era)), "80");
    },
  },
  {
    nome: "EQ ligado marca a ferramenta",
    rodar: async (p) => {
      await p.avaliar(() => { cfg.eq.on = true; renderFerramentas(); });
      assert.ok(await p.avaliar(() => document.querySelector("[data-ferr=eq]").classList.contains("act")));
    },
  },
  {
    nome: "grade de ferramentas não estoura em 320 px",
    largura: 320,
    rodar: async (p) => assert.ok(await p.avaliar(() => { const g = document.getElementById("ini-ferr"); return g.scrollWidth <= g.clientWidth; })),
  },
  {
    nome: "saudação por hora",
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => saudacao(6, "Jo")), "Bom dia, Jo");
      assert.equal(await p.avaliar(() => saudacao(13, "")), "Boa tarde");
      assert.equal(await p.avaliar(() => saudacao(23, "Jo")), "Boa noite, Jo");
      assert.equal(await p.avaliar(() => saudacao(3, "")), "Boa noite");
    },
  },
  {
    nome: "com exemplos aparece Continuar",
    rodar: async (p) => {
      await p.esperar(() => !!document.querySelector("#ini-cont"));
      const ok = await p.avaliar(() => document.querySelector("#ini-cont").textContent.includes(cur().t));
      assert.ok(ok, "o cartão Continuar não mostra a música atual");
    },
  },
  {
    nome: "Continuar abre o Tocando",
    rodar: async (p) => {
      await p.esperar(() => !!document.querySelector("#ini-cont [data-abrir]"));
      await p.clicar("#ini-cont [data-abrir]");
      assert.equal(await p.avaliar(() => document.getElementById("app").dataset.view), "tocando");
    },
  },
  {
    nome: "biblioteca vazia mostra o convite",
    antes: { "compasso.cfg": { exemplos: false } },
    rodar: async (p) => {
      await p.esperar(() => !!document.querySelector("#ini-vazio"));
      assert.deepEqual(await p.avaliar(() => ["#ini-cont", "#ini-rec", "#ini-fav"].filter((s) => document.querySelector(s))), []);
    },
  },
  {
    nome: "Início sem rolagem lateral em 320, 360 e 412 px",
    rodar: semRolarDeLado,
  },
  {
    nome: "Início em inglês",
    antes: { "compasso.cfg": { lang: "en" } },
    rodar: async (p) => {
      await p.esperar(() => document.getElementById("ini").textContent.trim().length > 0);
      const txt = await p.avaliar(() => document.getElementById("ini").textContent);
      for (const pt of ["Bom dia", "Boa tarde", "Boa noite", "Continuar", "Tocadas há pouco"]) assert.ok(!txt.includes(pt), `texto em português no Início: ${pt}`);
    },
  },
];
