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
      assert.equal(await p.avaliar(() => getComputedStyle(document.documentElement).getPropertyValue("--brilho").trim().toUpperCase()), "#7E3496");
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
