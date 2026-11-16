import assert from "node:assert/strict";

// Controles da tela de Ajustes da 1.17.3 (contados antes de dividir): 57, incluindo o seletor de idioma
const CONTROLES = "#tm :is(select, input, [role=switch], [data-vis], [data-epoca], [data-cor], [data-forma], [data-ledcor], button):not([data-porta], [data-porta-voltar])";
// 1.19: + 10 no cartão Efeitos da porta Som (5 chips do amplificador, 4 do reverb e a faixa do efeito 3D)
const TOTAL_1173 = 57 + 10;
const textoH2 = (p) => p.avaliar(() => [...document.querySelectorAll("#tm h2, #tm .t, #tm label, #tm .sec-t")].map((e) => e.textContent).join(" | "));
const abrir = async (p, id) => { await p.clicar(`[data-porta="${id}"]`); };

export default [
  {
    nome: "raiz tem idioma e quatro portas",
    hash: "temas",
    rodar: async (p) => {
      assert.ok(await p.avaliar(() => !!document.getElementById("s-lang")));
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("[data-porta]")].map((b) => b.dataset.porta)), ["aparencia", "som", "reproducao", "sobre"]);
    },
  },
  {
    nome: "raiz é curta",
    hash: "temas",
    rodar: async (p) => assert.ok(await p.avaliar(() => { const m = document.getElementById("main"); return m.scrollHeight <= m.clientHeight * 1.2; }), "a raiz de Ajustes ainda rola demais"),
  },
  {
    nome: "cada porta tem seus cartões",
    hash: "temas",
    rodar: async (p) => {
      const esperado = { aparencia: ["Ajuste rápido", "Efeitos"], som: ["Época do som", "Efeitos", "Amplificador", "Reverb"], reproducao: ["Botão Anterior", "Biblioteca"], sobre: ["Backup", "Sobre"] };
      const ids = { som: "#s-xfade", reproducao: "#s-anterior" };
      for (const [porta, textos] of Object.entries(esperado)) {
        await abrir(p, porta);
        const t = await textoH2(p);
        for (const x of textos) assert.ok(t.includes(x), `porta ${porta} sem "${x}"`);
        if (ids[porta]) assert.ok(await p.avaliar((s) => !!document.querySelector(s), ids[porta]), `porta ${porta} sem ${ids[porta]}`);
        await p.voltar();
      }
    },
  },
  {
    nome: "nenhum controle se perdeu",
    hash: "temas",
    rodar: async (p) => {
      let soma = await p.avaliar((s) => document.querySelectorAll(s).length, CONTROLES);
      for (const porta of ["aparencia", "som", "reproducao", "sobre"]) {
        await abrir(p, porta);
        soma += await p.avaliar((s) => document.querySelectorAll(s).length, CONTROLES);
        await p.voltar();
      }
      assert.equal(soma, TOTAL_1173);
    },
  },
  {
    nome: "voltar sai da porta, depois vai ao Início",
    hash: "temas",
    rodar: async (p) => {
      await abrir(p, "som");
      assert.equal(await p.voltar(), true);
      assert.equal(await p.avaliar(() => document.querySelectorAll("[data-porta]").length), 4);
      assert.equal(await p.avaliar(() => document.getElementById("app").dataset.view), "temas");
      assert.equal(await p.voltar(), true);
      assert.equal(await p.avaliar(() => document.getElementById("app").dataset.view), "inicio");
    },
  },
  {
    nome: "editor de tema volta para Aparência",
    hash: "temas",
    rodar: async (p) => {
      await abrir(p, "aparencia");
      await p.clicar("[data-criar]");
      assert.equal(await p.voltar(), true);
      assert.ok(await p.avaliar(() => !!document.querySelector("[data-porta-voltar]") && (document.querySelector("#tm").textContent.includes("Ajuste rápido"))), "não voltou para a porta Aparência");
    },
  },
  {
    nome: "trocar idioma na raiz traduz as portas",
    hash: "temas",
    rodar: async (p) => {
      await p.avaliar(() => { const s = document.getElementById("s-lang"); s.value = "en"; s.dispatchEvent(new Event("change", { bubbles: true })); });
      await p.quadro();
      const t = await p.avaliar(() => [...document.querySelectorAll("[data-porta]")].map((b) => b.textContent).join(" "));
      assert.ok(t.includes("Appearance") && t.includes("Sound"), t);
    },
  },
  {
    nome: "nenhum aviso aponta caminho antigo de Ajustes",
    node: true,
    rodar: async () => {
      const { readFileSync } = await import("node:fs");
      const a = readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
      for (const velho of ["Ajustes › Pastas do aparelho", "Ajustes › Biblioteca"]) assert.ok(!a.includes(velho), `ainda aponta para "${velho}"`);
    },
  },
];
