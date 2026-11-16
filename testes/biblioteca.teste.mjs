// 1.22 Biblioteca: estrelas, ordens, .m3u, repetir trecho (A-B) e marcadores
import assert from "node:assert/strict";

// Três músicas importadas de mentira, com nomes de arquivo, durações e datas diferentes
const semear = (p) => p.avaliar(() => {
  const mk = (id, t, a, al, n, d, arquivo, mod) => ({ id, sig: `${arquivo}|100|${mod}`, em: mod, arq: new Blob(["x"], { type: "audio/mpeg" }), capaBlob: null, t, a, al, n, d, c: ["#111", "#222"], letra: "" });
  for (const x of [mk("b1", "Zebra", "Ana", "Disco B", 2, 300, "01 - Zebra.mp3", 3000), mk("b2", "Árvore", "Bia", "Disco A", 1, 100, "Árvore do Sul.mp3", 1000), mk("b3", "Mar", "Ana", "Disco B", 1, 200, "mar (ao vivo).flac", 2000)]) { if (!porId.has(x.id)) { montar(x); adicionarFaixa(x); } }
  cfg.exemplos = false; mudouExemplos(); renderBib();
});
const ordem = (p, k) => p.avaliar((k) => { cfg.ord = k; return ordenar(faixas.filter((x) => !x.demo)).map((x) => x.id).join(","); }, k);

export default [
  /* ---- estrelas ---- */
  {
    nome: "dar, trocar e tirar a nota",
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => notaDe("ex0")), 0);
      assert.equal(await p.avaliar(() => { darNota("ex0", 4); return notaDe("ex0"); }), 4);
      assert.equal(await p.avaliar(() => { darNota("ex0", 5); return notaDe("ex0"); }), 5);
      assert.equal(await p.avaliar(() => { darNota("ex0", 5); return notaDe("ex0"); }), 0, "tocar na mesma nota tira a nota");
      assert.equal(await p.avaliar(() => { darNota("ex0", 9); return notaDe("ex0"); }), 5, "nota fora da faixa é ajustada");
      assert.equal(await p.avaliar(() => JSON.parse(localStorage.getItem("compasso.notas")).ex0), 5);
    },
  },
  {
    nome: "estrelas no menu da música",
    rodar: async (p) => {
      await p.avaliar(() => menuFaixa("ex1"));
      assert.equal(await p.avaliar(() => document.querySelectorAll("#sheet [data-nota]").length), 5);
      await p.clicar('#sheet [data-nota="3"]');
      assert.equal(await p.avaliar(() => notaDe("ex1")), 3);
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#sheet [data-nota]")].map((b) => b.getAttribute("aria-pressed"))), ["true", "true", "true", "false", "false"]);
      assert.ok(await p.avaliar(() => !document.getElementById("sheet").hidden), "o menu continua aberto depois de dar a nota");
      assert.ok(await p.avaliar(() => [...document.querySelectorAll("#sheet [data-nota]")].every((b) => b.getAttribute("aria-label") && b.getBoundingClientRect().width >= 40)));
    },
  },
  {
    nome: "playlists de estrelas aparecem só quando têm músicas",
    hash: "playlists",
    rodar: async (p) => {
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#pl [data-abrir^='auto:']")].map((b) => b.dataset.abrir)), ["auto:fav", "auto:novas", "auto:recentes", "auto:mais"]);
      await p.avaliar(() => { darNota("ex0", 5); darNota("ex1", 4); darNota("ex2", 3); });
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#pl [data-abrir^='auto:']")].map((b) => b.dataset.abrir).slice(-2)), ["auto:5", "auto:4"]);
      assert.deepEqual(await p.avaliar(() => [idsDe(AUTO.find((a) => a.id === "auto:5")), idsDe(AUTO.find((a) => a.id === "auto:4")).sort()]), [["ex0"], ["ex0", "ex1"]]);
      assert.ok(await p.avaliar(() => document.getElementById("pl").textContent.includes("6 automáticas")));
    },
  },
  {
    nome: "aleatório: sem notas é um embaralhar comum; com notas, as melhores vêm antes mais vezes",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const ids = Array.from({ length: 20 }, (_, i) => "m" + i);
        const s0 = sortear(ids); const mesmo = s0.length === 20 && new Set(s0).size === 20 && ids.every((i) => s0.includes(i));
        notas.m0 = 5; notas.m1 = 1;
        let pos5 = 0, pos1 = 0; for (let k = 0; k < 400; k++) { const s = sortear(ids); pos5 += s.indexOf("m0"); pos1 += s.indexOf("m1"); }
        delete notas.m0; delete notas.m1;
        return { mesmo, pos5: pos5 / 400, pos1: pos1 / 400 };
      });
      assert.equal(r.mesmo, true, "todas as músicas continuam na fila, uma vez cada");
      assert.ok(r.pos5 < 7 && r.pos1 > 12, `posição média: 5★ = ${r.pos5}, 1★ = ${r.pos1} (o meio é 9,5)`);
    },
  },
  {
    nome: "backup leva as notas e os marcadores, e ignora os de músicas que não existem",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        darNota("ex0", 4); adicionarMarca("ex1", 30, "Refrão");
        const b = JSON.parse(JSON.stringify(gerarBackup()));
        darNota("ex0", 0); apagarMarca("ex1", 0);
        b.notas["s:nao-existe"] = 5; b.marcas["s:nao-existe"] = [{ t: 1, n: "x" }];
        restaurarBackup(b);
        return [notaDe("ex0"), marcasDe("ex1"), Object.keys(notas).length, Object.keys(marcas).length];
      });
      assert.deepEqual(r, [4, [{ t: 30, n: "Refrão" }], 1, 1]);
    },
  },
  /* ---- ordens ---- */
  {
    nome: "ordens novas da biblioteca",
    rodar: async (p) => {
      await semear(p);
      assert.equal(await ordem(p, "album"), "b2,b3,b1");
      assert.equal(await ordem(p, "faixa"), "b2,b3,b1");
      assert.equal(await ordem(p, "duracao"), "b1,b3,b2");
      assert.equal(await ordem(p, "arquivo"), "b1,b3,b2");
      await p.avaliar(() => { stats.fx.b3 = { n: 9, s: 1, u: 1 }; stats.fx.b2 = { n: 2, s: 1, u: 1 }; darNota("b2", 5); darNota("b1", 2); });
      assert.equal(await ordem(p, "tocadas"), "b3,b2,b1");
      assert.equal(await ordem(p, "nota"), "b2,b1,b3");
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#ord option")].map((o) => o.value)), ["recentes", "titulo", "artista", "album", "faixa", "duracao", "tocadas", "arquivo", "nota"]);
    },
  },
  /* ---- .m3u ---- */
  {
    nome: "exportar e importar .m3u dá a mesma playlist",
    rodar: async (p) => {
      await semear(p);
      const r = await p.avaliar(() => {
        const pl = novaPlaylist("Viagem", ["b3", "b1", "b2"]), txt = gerarM3U(pl);
        const imp = importarM3U(txt, "x");
        return { txt, nome: imp.p.nome, ids: imp.p.ids, achadas: imp.achadas, total: imp.total };
      });
      assert.ok(r.txt.startsWith("#EXTM3U\n"), "começa com #EXTM3U");
      assert.ok(r.txt.includes("#EXTINF:200,Ana - Mar\nmar (ao vivo).flac"), r.txt);
      assert.deepEqual([r.nome, r.ids, r.achadas, r.total], ["Viagem", ["b3", "b1", "b2"], 3, 3]);
    },
  },
  {
    nome: "importar .m3u de outro player: pastas, %20, acento, linhas vazias e música que não existe",
    rodar: async (p) => {
      await semear(p);
      const r = await p.avaliar(() => {
        const txt = "﻿#EXTM3U\r\n\r\n# comentário\r\n#EXTINF:300,Ana - Zebra\r\nC:\\Músicas\\Rock\\01 - Zebra.mp3\r\n/sdcard/Music/%C3%81rvore%20do%20Sul.mp3\r\n#EXTINF:1,Ninguém - Sumida\r\nsumida.mp3\r\n#EXTINF:200,ana - mar\r\noutra-pasta/arquivo-renomeado.flac\r\n";
        const imp = importarM3U(txt, "Do PC");
        return [imp.p.nome, imp.p.ids, imp.achadas, imp.total];
      });
      assert.deepEqual(r, ["Do PC", ["b1", "b2", "b3"], 3, 4]);
    },
  },
  {
    nome: ".m3u vazio ou sem nada conhecido não cria playlist",
    rodar: async (p) => {
      const r = await p.avaliar(() => { const n = pls.length; const a = importarM3U("#EXTM3U\n", "Vazia"), b = importarM3U("nada.mp3\n", "Nada"); return [a.p, a.total, b.p, b.achadas, b.total, pls.length - n]; });
      assert.deepEqual(r, [null, 0, null, 0, 1, 0]);
    },
  },
  {
    nome: "telas do .m3u: importar na lista e exportar no menu da playlist",
    hash: "playlists",
    rodar: async (p) => {
      assert.ok(await p.avaliar(() => !!document.querySelector("#pl [data-m3u]")));
      await p.avaliar(() => menuPlaylist(pls[0]));
      assert.ok(await p.avaliar(() => !!document.querySelector("#sheet [data-a=m3u]")));
    },
  },
  /* ---- repetir trecho ---- */
  {
    nome: "A-B: marcar, repetir e limpar",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        buscarSeg(10); marcarA(); buscarSeg(20); const ok = marcarB();
        const t = { ...trecho };
        buscarSeg(25); await new Promise((f) => setTimeout(f, 250)); const voltou = posAtual();
        limparTrecho();
        return { ok, a: Math.round(t.a), b: Math.round(t.b), id: t.id === cur().id, voltou, limpo: trecho === null };
      });
      assert.deepEqual([r.ok, r.a, r.b, r.id, r.limpo], [true, 10, 20, true, true]);
      assert.ok(r.voltou >= 10 && r.voltou < 12, `depois de passar de B a posição foi para ${r.voltou}`);
    },
  },
  {
    nome: "A-B: B antes de A ou trecho curto demais não vale; trocar de música limpa",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const o = [];
        buscarSeg(30); marcarA(); buscarSeg(12); o.push(marcarB());
        buscarSeg(30.4); o.push(marcarB());
        buscarSeg(40); o.push(marcarB());
        proxima(); o.push(trecho === null);
        o.push(marcarB()); // sem A não há B
        return o;
      });
      assert.deepEqual(r, [false, false, true, true, false]);
    },
  },
  /* ---- marcadores ---- */
  {
    nome: "marcadores: em ordem de tempo, sem repetir o mesmo segundo, com limite",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        adicionarMarca("ex0", 50, "Fim"); adicionarMarca("ex0", 10.2, ""); adicionarMarca("ex0", 10.7, "Outro"); adicionarMarca("ex0", 30, "Meio");
        const a = marcasDe("ex0").map((m) => [Math.floor(m.t), m.n]);
        apagarMarca("ex0", 1);
        const b = marcasDe("ex0").map((m) => Math.floor(m.t));
        for (let i = 0; i < 80; i++) adicionarMarca("ex2", 100 + i * 2, "");
        return { a, b, limite: marcasDe("ex2").length, guardado: JSON.parse(localStorage.getItem("compasso.marcas")).ex0.length };
      });
      assert.deepEqual(r.a, [[10, "Outro"], [30, "Meio"], [50, "Fim"]]);
      assert.deepEqual(r.b, [10, 50]);
      assert.deepEqual([r.limite, r.guardado], [50, 2]);
    },
  },
  {
    nome: "menu da música tocando tem A-B e Marcadores; as folhas funcionam",
    rodar: async (p) => {
      await p.avaliar(() => menuFaixa(queue[(qi + 1) % queue.length]));
      assert.equal(await p.avaliar(() => !!document.querySelector("#sheet [data-a=trecho]")), false, "só a música que está tocando tem A-B");
      await p.avaliar(() => { fecharFolha(); buscarSeg(15); menuFaixa(cur().id); });
      await p.clicar("#sheet [data-a=marcas]");
      await p.clicar("#sheet [data-marca-nova]");
      assert.deepEqual(await p.avaliar(() => marcasDe(cur().id).map((m) => Math.round(m.t))), [15]);
      await p.avaliar(() => buscarSeg(0));
      await p.clicar("#sheet [data-marca-ir='0']");
      assert.ok(await p.avaliar(() => Math.abs(posAtual() - 15) < 1.5), "tocar no marcador pula para o tempo dele");
      await p.clicar("#sheet [data-marca-x='0']");
      assert.equal(await p.avaliar(() => marcasDe(cur().id).length), 0);
      await p.avaliar(() => { fecharFolha(); menuFaixa(cur().id); });
      await p.clicar("#sheet [data-a=trecho]");
      await p.clicar("#sheet [data-ab=a]");
      await p.avaliar(() => buscarSeg(40));
      await p.clicar("#sheet [data-ab=b]");
      assert.ok(await p.avaliar(() => trecho && Math.round(trecho.b) === 40));
      await p.clicar("#sheet [data-ab=limpar]");
      assert.equal(await p.avaliar(() => trecho), null);
    },
  },
  /* ---- acertos da revisão ---- */
  {
    nome: "A-B continua valendo com a tela apagada (a checagem não depende do desenho da tela)",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio();
        buscarSeg(10); marcarA(); buscarSeg(20); marcarB();
        const semTrecho = (() => { const t = trecho; trecho = null; const v = vigiarTrecho(); trecho = t; return v; })();
        pos = 25; // como se a música tivesse passado de B sem nenhum quadro desenhado
        const voltou = vigiarTrecho();
        return { semTrecho, voltou, pos: Math.round(posAtual()), tempo: els.every((a) => typeof a.ontimeupdate === "function") };
      });
      assert.deepEqual(r, { semTrecho: false, voltou: true, pos: 10, tempo: true });
    },
  },
  {
    nome: "A-B com o temporizador 'ao fim da música': pausa no fim do trecho em vez de tocar a noite toda",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        tocar(); buscarSeg(10); marcarA(); buscarSeg(20); marcarB();
        sono.aoFim = true; pos = 25; posBase = 25; inicioT = ctx.currentTime;
        vigiarTrecho();
        return [playing, sono.aoFim, trecho !== null];
      });
      assert.deepEqual(r, [false, false, true]);
    },
  },
  {
    nome: ".m3u antigo do Windows (sem UTF-8) mantém os acentos",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const latin = (t) => Uint8Array.from([...t].map((c) => c.charCodeAt(0))).buffer; // cada letra em 1 byte, como o Winamp grava
        return [decodificarTexto(latin("#EXTM3U\r\nCoração.mp3\r\n")), decodificarTexto(new TextEncoder().encode("Coração ✓.mp3").buffer)];
      });
      assert.deepEqual(r, ["#EXTM3U\r\nCoração.mp3\r\n", "Coração ✓.mp3"]);
    },
  },
  {
    nome: ".m3u com nomes de arquivo repetidos escolhe a música certa pelo artista, pela pasta ou pela duração",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const mk = (id, t, a, d, pasta) => ({ id, sig: "01 - Intro.mp3|100|" + id.length, em: 1, arq: new Blob(["x"]), capaBlob: null, t, a, al: "", n: 1, d, c: ["#111", "#222"], letra: "", pasta });
        for (const x of [mk("d1", "Intro", "Banda Um", 60, "Musicas/Disco Um/"), mk("d2", "Intro", "Banda Dois", 90, "Musicas/Disco Dois/"), mk("d3", "Abertura", "Banda Três", 120, "Musicas/Disco Tres/")]) { montar(x); adicionarFaixa(x); }
        const um = (txt) => { const i = importarM3U("#EXTM3U\n" + txt + "\n", "T"); return i.p ? i.p.ids.join(",") : ""; };
        return [
          um("#EXTINF:90,Banda Dois - Intro\n01 - Intro.mp3"),            // pelo artista e título
          um("D:\\Musicas\\Disco Tres\\01 - Intro.mp3"),                // pela pasta
          um("#EXTINF:61,Outro nome qualquer\n01 - Intro.mp3"),            // pela duração
        ];
      });
      assert.deepEqual(r, ["d2", "d3", "d1"]);
    },
  },
  {
    nome: "exportar .m3u: quebra de linha no título não parte o arquivo, # no começo do nome não vira comentário, exemplo não entra",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const x = { id: "e1", sig: "#1 Crush.mp3|1|1", em: 1, arq: new Blob(["x"]), capaBlob: null, t: "Linha um\nlinha dois", a: "Ar\r\ntista", al: "", n: 0, d: 5, c: ["#111", "#222"], letra: "" };
        montar(x); adicionarFaixa(x);
        const pl = novaPlaylist("Mista", ["ex0", "e1"]), txt = gerarM3U(pl), imp = importarM3U(txt, "x");
        return { linhas: txt.trim().split("\n"), ids: imp.p.ids };
      });
      assert.deepEqual(r.linhas, ["#EXTM3U", "#PLAYLIST:Mista", "#EXTINF:5,Ar tista - Linha um linha dois", "./#1 Crush.mp3"]);
      assert.deepEqual(r.ids, ["e1"]);
    },
  },
  {
    nome: "marcador: com a folha aberta e a música trocada, não grava na música errada",
    rodar: async (p) => {
      await p.avaliar(() => { buscarSeg(15); abrirMarcadores(); });
      const antiga = await p.avaliar(() => cur().id);
      await p.avaliar(() => proxima());
      await p.clicar("#sheet [data-marca-nova]");
      assert.deepEqual(await p.avaliar((id) => [marcasDe(id).length, marcasDe(cur().id).length], antiga), [0, 0]);
      await p.esperar(() => document.getElementById("sheet").hidden, 1500);
    },
  },
];
