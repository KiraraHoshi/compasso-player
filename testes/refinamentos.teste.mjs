import assert from "node:assert/strict";

export default [
  {
    nome: "botões da Biblioteca numa linha (360 px)",
    hash: "biblioteca",
    rodar: async (p) => {
      const tops = await p.avaliar(() => ["[data-tudo]", "[data-aleatorio]", "[data-selecionar]", "#ord"].map((s) => { const e = document.querySelector("#lib " + s); return e ? Math.round(e.getBoundingClientRect().top + e.offsetHeight / 2) : null; }));
      assert.ok(tops.every((t) => t !== null), "falta algum botão: " + tops);
      assert.ok(Math.max(...tops) - Math.min(...tops) <= 4, "botões em linhas diferentes: " + tops);
    },
  },
  {
    nome: "quadrinho do Você em 0 min e numa linha só",
    hash: "voce",
    rodar: async (p) => {
      const r = await p.avaliar(() => { const b = document.querySelector("#vc .tile b"); const lh = parseFloat(getComputedStyle(b).lineHeight); return { txt: b.textContent, h: b.offsetHeight, lh }; });
      assert.equal(r.txt, "0 min");
      assert.ok(r.h <= r.lh * 1.6, `quebrou em mais de uma linha (${r.h}px para linha de ${r.lh}px)`);
    },
  },
  {
    nome: "pasta no lugar de artista desconhecido",
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => linha2({ a: T("Artista desconhecido"), al: "", pasta: "Music/Download" })), "Download");
      assert.equal(await p.avaliar(() => linha2({ a: "", al: "Álbum X", pasta: "Musicas/Rock" })), "Rock · Álbum X");
      assert.equal(await p.avaliar(() => linha2({ a: "Ado", al: "unravel", pasta: "X" })), "Ado · unravel");
      assert.equal(await p.avaliar(() => linha2({ a: T("Artista desconhecido"), al: "", pasta: "" })), "Artista desconhecido");
    },
  },
  {
    nome: "Tocando com nomes nos botões e sem estourar (320, 360, 412 px)",
    hash: "tocando",
    rodar: async (p) => {
      for (const w of [320, 360, 412]) {
        await p.tamanho(w, w === 320 ? 640 : 780);
        const r = await p.avaliar(() => {
          const bar = document.querySelector("#v-tocando .np-bar"), pills = [...bar.querySelectorAll(".pill")];
          const semNome = pills.filter((b) => { const t = b.querySelector(".pill-t"); return !t || !t.offsetWidth || !t.textContent.trim(); }).map((b) => b.id);
          const play = document.getElementById("b-play").getBoundingClientRect();
          return { semNome, estoura: bar.scrollWidth > bar.clientWidth, playFora: play.bottom > innerHeight, lado: document.documentElement.scrollWidth > innerWidth };
        });
        assert.deepEqual(r.semNome, [], `${w}px: botões sem nome visível`);
        assert.equal(r.estoura, false, `${w}px: a barra estoura`);
        assert.equal(r.playFora, false, `${w}px: o botão tocar saiu da tela`);
        assert.equal(r.lado, false, `${w}px: a página rola para o lado`);
      }
    },
  },
];
