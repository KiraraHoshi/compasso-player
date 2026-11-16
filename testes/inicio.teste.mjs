import assert from "node:assert/strict";

const semRolarDeLado = async (p) => {
  for (const w of [320, 360, 412]) {
    await p.tamanho(w, 780);
    assert.ok(await p.avaliar(() => document.documentElement.scrollWidth <= innerWidth && document.getElementById("main").scrollWidth <= document.getElementById("main").clientWidth), `rola para o lado em ${w} px`);
  }
};

export default [
  {
    nome: "nove ferramentas na ordem",
    rodar: async (p) => assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#ini-ferr [data-ferr]")].map((b) => b.dataset.ferr)), ["eq", "sono", "volmais", "efeitos", "visual", "epoca", "vel", "carro", "palco"]),
  },
  {
    nome: "Volume + pela folha muda o amplificador",
    rodar: async (p) => {
      await p.clicar("[data-ferr=volmais]");
      await p.clicar('#sheet [data-amp="1.5"]');
      assert.equal(await p.avaliar(() => cfg.amp), 1.5);
      assert.ok(await p.avaliar(() => document.querySelector("[data-ferr=volmais]").classList.contains("act")));
    },
  },
  {
    nome: "Efeitos pela folha liga o reverb e o 3D",
    rodar: async (p) => {
      await p.clicar("[data-ferr=efeitos]");
      await p.clicar("#sheet [data-reverb=sala]");
      assert.equal(await p.avaliar(() => cfg.reverb), "sala");
      await p.avaliar(() => { const r = document.querySelector("#sheet [data-fx=largura]"); r.value = 50; r.dispatchEvent(new Event("input", { bubbles: true })); });
      assert.equal(await p.avaliar(() => cfg.largura), 1.5);
      assert.ok(await p.avaliar(() => document.querySelector("[data-ferr=efeitos]").classList.contains("act")));
    },
  },
  {
    nome: "aprimorador na folha do EQ",
    rodar: async (p) => {
      await p.clicar("[data-ferr=eq]");
      await p.avaliar(() => { const r = document.getElementById("r-apGraves"); r.value = 6; r.dispatchEvent(new Event("input", { bubbles: true })); });
      assert.equal(await p.avaliar(() => cfg.apGraves), 6);
      await p.clicar("#sheet [data-apzerar]");
      assert.deepEqual(await p.avaliar(() => [cfg.apGraves, cfg.apAgudos, cfg.apInt, +document.getElementById("r-apGraves").value]), [0, 0, 0, 0]);
    },
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
    rodar: async (p) => {
      assert.ok(await p.avaliar(() => { const g = document.getElementById("ini-ferr"); return g.scrollWidth <= g.clientWidth; }));
      assert.equal(await p.avaliar(() => new Set([...document.querySelectorAll("#ini-ferr .ini-f")].map((b) => b.offsetTop)).size), 3, "as 9 ferramentas deviam ficar em 3 linhas de 3");
    },
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
