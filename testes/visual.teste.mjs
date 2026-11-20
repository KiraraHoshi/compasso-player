import assert from "node:assert/strict";

// 1.26.8: linguagem do Caixinhas 2.0 (vidro, brilho, barra flutuante) e Ajustes na engrenagem do topo
const visivel = (sel) => { const e = document.querySelector(sel); return !!e && e.offsetParent !== null && getComputedStyle(e).visibility !== "hidden"; };
const TELAS = ["inicio", "biblioteca", "playlists", "voce", "temas"];

export default [
  {
    nome: "no celular, Ajustes sai da barra e vai para a engrenagem do topo",
    rodar: async (p) => {
      assert.equal(await p.avaliar(visivel, '#nav [data-v="temas"]'), false);
      assert.equal(await p.avaliar(() => document.querySelectorAll("#nav button").length - [...document.querySelectorAll("#nav button")].filter((b) => b.offsetParent === null).length), 4);
      for (const v of ["inicio", "biblioteca", "playlists", "voce"]) {
        await p.avaliar((x) => ir(x), v);
        assert.ok(await p.avaliar((x) => !!document.querySelector(`#v-${x} [data-ajustes]`) && document.querySelector(`#v-${x} [data-ajustes]`).offsetParent !== null, v), "sem engrenagem em " + v);
      }
      await p.avaliar(() => ir("inicio"));
      await p.clicar("#v-inicio [data-ajustes]");
      assert.equal(await p.avaliar(() => APP.dataset.view), "temas");
      await p.voltar();
      assert.equal(await p.avaliar(() => APP.dataset.view), "inicio");
    },
  },
  {
    nome: "no PC, Ajustes continua na barra lateral e a engrenagem some",
    largura: 1280, altura: 800,
    rodar: async (p) => {
      assert.equal(await p.avaliar(visivel, '#nav [data-v="temas"]'), true);
      assert.equal(await p.avaliar(visivel, "#v-inicio [data-ajustes]"), false);
    },
  },
  {
    nome: "brilho do tema vai para --brilho",
    rodar: async (p) => {
      await p.avaliar(() => { cfg.tema = "g-ametista"; aplicarTema(); });
      await new Promise((r) => setTimeout(r, 750)); // a cor pode estar passando suavemente desde a abertura
      assert.equal(await p.avaliar(() => hex(paraRgb(getComputedStyle(document.documentElement).getPropertyValue("--brilho").trim())).toUpperCase()), "#7E3496");
    },
  },
  {
    nome: "cartões de vidro sem desfoque; barra e mini player com desfoque, que o modo leve tira",
    rodar: async (p) => {
      await p.avaliar(() => { cfg.tema = "escuro"; aplicarTema(); ir("temas"); });
      const card = await p.avaliar(() => { const c = getComputedStyle(document.querySelector("#tm .card")); return [c.backgroundColor, c.backdropFilter]; });
      assert.match(card[0], /rgba?\(.*,\s*0?\.\d+\)|color\(srgb .* \/ 0?\.\d+\)/, "cartão sem transparência: " + card[0]);
      assert.equal(card[1], "none");
      assert.notEqual(await p.avaliar(() => getComputedStyle(document.getElementById("nav")).backdropFilter), "none");
      await p.avaliar(() => { cfg.leve = true; aplicarEfeitos(); APP.dataset.leve = "1"; });
      assert.equal(await p.avaliar(() => getComputedStyle(document.getElementById("nav")).backdropFilter), "none");
    },
  },
  {
    nome: "abertura lenta: conta só os quadros acima de 50 ms (30 por segundo da economia de bateria não conta)",
    rodar: async (p) => {
      const r = await p.avaliar(() => [avaliarAbertura(Array(40).fill(16)), avaliarAbertura(Array(40).fill(33)), avaliarAbertura([...Array(30).fill(16), ...Array(12).fill(80)]), avaliarAbertura([])]);
      assert.deepEqual(r, [false, false, true, false]);
    },
  },
  {
    nome: "aparelho lento liga o visual leve sozinho uma vez, avisa, e não religa se a pessoa desligar",
    antes: { "compasso.cfg": { leveAuto: null } }, // o rodador desliga a medição por padrão
    rodar: async (p) => {
      const lento = [...Array(20).fill(16), ...Array(20).fill(90)];
      assert.equal(await p.avaliar((t) => decidirLeve(t), lento), true);
      assert.deepEqual(await p.avaliar(() => [cfg.leve, cfg.leveAuto, APP.dataset.leve, document.getElementById("toast").textContent.length > 0]), [true, true, "1", true]);
      await p.avaliar(() => { ir("temas"); abrirPorta("aparencia"); });
      await p.clicar("[data-alternar-leve]");
      assert.deepEqual(await p.avaliar(() => [cfg.leve, cfg.leveAuto]), [false, "nao"]);
      assert.equal(await p.avaliar((t) => decidirLeve(t), lento), false);
      assert.equal(await p.avaliar(() => cfg.leve), false);
    },
  },
  {
    nome: "modo leve ligado sozinho é medido de novo: em aparelho rápido (celular novo restaurado) ele desliga",
    antes: { "compasso.cfg": { leve: true, leveAuto: true } },
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => decidirLeve(Array(60).fill(16))), true, "devia mudar algo");
      assert.deepEqual(await p.avaliar(() => [cfg.leve, "leveAuto" in cfg, APP.dataset.leve]), [false, false, ""]);
    },
  },
  {
    nome: "modo leve ligado à mão nunca é desligado pela medição",
    antes: { "compasso.cfg": { leve: true, leveAuto: null } }, // sem a marca "nao" que o rodador põe
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => decidirLeve(Array(60).fill(16))), false);
      assert.equal(await p.avaliar(() => cfg.leve), true);
    },
  },
  {
    nome: "a medição da abertura só começa depois de a biblioteca carregar",
    node: true,
    rodar: async () => {
      const src = (await import("node:fs")).readFileSync(new URL("../js/app.js", import.meta.url), "utf8");
      const i = src.indexOf("const medir = "), j = src.lastIndexOf("carregado = true", src.length);
      assert.ok(i > 0 && /function medirAbertura\(/.test(src) && /carregado = true;[^\n]*\r?\n?[^\n]*medirAbertura\(\)|medirAbertura\(\)/.test(src.slice(j)), "medirAbertura() devia ser chamada depois de carregado = true");
    },
  },
  {
    nome: "aparelho rápido não liga o visual leve",
    antes: { "compasso.cfg": { leveAuto: null } }, // o rodador desliga a medição por padrão
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => decidirLeve(Array(60).fill(16))), false);
      assert.equal(await p.avaliar(() => !!cfg.leve), false);
    },
  },
  {
    nome: "nada rola para o lado e a barra não cobre o fim da lista (celular, deitado e PC)",
    rodar: async (p) => {
      for (const [w, h] of [[320, 640], [360, 780], [412, 915], [800, 400], [1280, 800]]) {
        await p.tamanho(w, h);
        for (const v of TELAS) {
          await p.avaliar((x) => ir(x), v);
          assert.ok(await p.avaliar(() => document.documentElement.scrollWidth <= innerWidth && document.getElementById("main").scrollWidth <= document.getElementById("main").clientWidth), `rola para o lado: ${v} em ${w}x${h}`);
          const ok = await p.avaliar(() => { const m = document.getElementById("main"); m.scrollTop = m.scrollHeight; const ult = [...document.querySelector(".view.on").querySelectorAll("*")].filter((e) => e.offsetParent !== null).pop(); if (!ult) return true; const b = ult.getBoundingClientRect().bottom, mb = m.getBoundingClientRect().bottom; return b <= mb + 1; });
          assert.ok(ok, `fim da tela coberto: ${v} em ${w}x${h}`);
        }
      }
    },
  },
];
