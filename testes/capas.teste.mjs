// 1.21: recorte de imagem (perfil e capas) e capa personalizada
import assert from "node:assert/strict";

// Entrega uma imagem de teste a um <input type="file">, como se a pessoa tivesse escolhido um arquivo
const escolherImagem = (p, idInput, cor = "#c0392b", w = 400, h = 300) => p.avaliar(async (idInput, cor, w, h) => {
  const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
  const c = cv.getContext("2d"); c.fillStyle = cor; c.fillRect(0, 0, w, h);
  const blob = await new Promise((ok) => cv.toBlob(ok, "image/png"));
  const dt = new DataTransfer(); dt.items.add(new File([blob], "imagem.png", { type: "image/png" }));
  const inp = document.getElementById(idInput); inp.files = dt.files;
  if (inp.onchange) await inp.onchange(); else inp.dispatchEvent(new Event("change"));
}, idInput, cor, w, h);

// Duas músicas importadas de mentira no mesmo álbum: a primeira tem capa no arquivo, a segunda não
const semear = (p) => p.avaliar(async () => {
  window.imagemTeste = async (cor) => { const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d"); c.fillStyle = cor; c.fillRect(0, 0, 64, 64); return new Promise((ok) => cv.toBlob(ok, "image/png")); };
  for (const [id, t, comCapa] of [["tc1", "Com capa", true], ["tc2", "Sem capa", false]]) {
    if (porId.has(id)) continue;
    const x = { id, sig: id + "|1|1", em: Date.now(), arq: new Blob(["x"], { type: "audio/mpeg" }), capaBlob: comCapa ? await imagemTeste("#2ecc71") : null, t, a: "Artista T", al: "Álbum T", n: 0, d: 10, c: ["#111", "#222"], letra: "" };
    montar(x); adicionarFaixa(x); salvarFaixa(x);
  }
  renderBib();
});
const recarregar = async (p) => { await p.avaliar(() => new Promise((ok) => setTimeout(ok, 300))); await p.avaliar(() => { location.reload(); }).catch(() => {}); await p.esperar(() => typeof carregado !== "undefined" && carregado && porId.has("tc2"), 8000); };

export default [
  {
    nome: "perfil: escolher, recortar e salvar a foto",
    rodar: async (p) => {
      await p.avaliar(() => editarPerfil());
      await p.clicar("#sheet [data-foto]");
      await escolherImagem(p, "perfil-file");
      await p.esperar(() => !!document.getElementById("corte-cv"), 3000);
      await p.avaliar(() => { const z = document.getElementById("corte-z"); z.value = 2; z.dispatchEvent(new Event("input", { bubbles: true })); });
      await p.clicar("#sheet [data-corte-ok]");
      await p.esperar(() => !document.getElementById("corte-cv") && !!document.querySelector("#sheet form"), 3000);
      await p.avaliar(() => { document.getElementById("pf-nome").value = "Jo"; document.querySelector("#sheet form").requestSubmit(); });
      await p.esperar(() => perfil.nome === "Jo", 2000);
      assert.ok(await p.avaliar(() => perfil.foto.startsWith("data:image/jpeg")), "a foto recortada não foi salva");
    },
  },
  {
    nome: "perfil: cancelar o recorte volta ao formulário sem foto",
    rodar: async (p) => {
      await p.avaliar(() => editarPerfil());
      await p.clicar("#sheet [data-foto]");
      await escolherImagem(p, "perfil-file");
      await p.esperar(() => !!document.getElementById("corte-cv"), 3000);
      await p.clicar("#sheet [data-corte-x]");
      await p.esperar(() => !!document.querySelector("#sheet form"), 2000);
      assert.equal(await p.avaliar(() => !!document.querySelector("#sheet .avatar[style*='data:image']")), false);
    },
  },
  {
    nome: "capa de música: definir e tirar",
    rodar: async (p) => {
      await semear(p);
      assert.equal(await p.avaliar(() => temCapa(porId.get("tc2"))), false);
      await p.avaliar(async () => definirCapaFaixa(porId.get("tc2"), await imagemTeste("#e74c3c")));
      assert.deepEqual(await p.avaliar(() => { const x = porId.get("tc2"); return [temCapa(x), !!x.cover, !!blobCapa(x), document.querySelector("#lib").innerHTML.includes(x.cover)]; }), [true, true, true, true]);
      await p.avaliar(() => definirCapaFaixa(porId.get("tc2"), null));
      assert.deepEqual(await p.avaliar(() => { const x = porId.get("tc2"); return [temCapa(x), !!x.cover, blobCapa(x)]; }), [false, false, null]);
    },
  },
  {
    nome: "capa de música ganha da capa do arquivo, e tirar devolve a do arquivo",
    rodar: async (p) => {
      await semear(p);
      const antes = await p.avaliar(() => porId.get("tc1").cover);
      await p.avaliar(async () => definirCapaFaixa(porId.get("tc1"), await imagemTeste("#e74c3c")));
      assert.notEqual(await p.avaliar(() => porId.get("tc1").cover), antes);
      await p.avaliar(() => definirCapaFaixa(porId.get("tc1"), null));
      assert.equal(await p.avaliar(() => blobCapa(porId.get("tc1")) === porId.get("tc1").capaBlob), true);
    },
  },
  {
    nome: "capa de álbum vale para as músicas sem capa e na grade, não para a que tem capa própria",
    rodar: async (p) => {
      await semear(p);
      const propria = await p.avaliar(() => porId.get("tc1").cover);
      await p.avaliar(async () => definirCapaAlbum("Álbum T", await imagemTeste("#3498db")));
      const r = await p.avaliar(() => { const u = capasAlbum.get("Álbum T").url; return { sem: porId.get("tc2").cover === u, com: porId.get("tc1").cover, grade: albuns().find((a) => a.n === "Álbum T").capa.cover === u, tem: temCapa(porId.get("tc2")) }; });
      assert.deepEqual(r, { sem: true, com: propria, grade: true, tem: true });
      await p.avaliar(() => definirCapaAlbum("Álbum T", null));
      assert.deepEqual(await p.avaliar(() => [temCapa(porId.get("tc2")), capasAlbum.has("Álbum T"), porId.get("tc1").cover]), [false, false, propria]);
    },
  },
  {
    nome: "capas personalizadas sobrevivem a fechar e abrir o app",
    rodar: async (p) => {
      await semear(p);
      await p.avaliar(async () => { await definirCapaFaixa(porId.get("tc1"), await imagemTeste("#e74c3c")); await definirCapaAlbum("Álbum T", await imagemTeste("#3498db")); });
      await recarregar(p);
      assert.deepEqual(await p.avaliar(() => [!!porId.get("tc1").capaUser, !!porId.get("tc1").cover, capasAlbum.has("Álbum T"), porId.get("tc2").cover === capasAlbum.get("Álbum T").url]), [true, true, true, true]);
    },
  },
  {
    nome: "backup leva e devolve as capas personalizadas",
    rodar: async (p) => {
      await semear(p);
      await p.avaliar(async () => { await definirCapaFaixa(porId.get("tc1"), await imagemTeste("#e74c3c")); await definirCapaAlbum("Álbum T", await imagemTeste("#3498db")); });
      const b = await p.avaliar(async () => { window.__b = JSON.parse(JSON.stringify(await gerarBackupCompleto())); return { fx: __b.capas.faixas.length, al: __b.capas.albuns.map((a) => a.nome), img: __b.capas.faixas[0].img.slice(0, 15) }; });
      assert.deepEqual(b, { fx: 1, al: ["Álbum T"], img: "data:image/jpeg" });
      await p.avaliar(async () => { await definirCapaFaixa(porId.get("tc1"), null); await definirCapaAlbum("Álbum T", null); __b.capas.albuns.push({ nome: "Álbum que não existe", img: __b.capas.albuns[0].img }); __b.capas.faixas.push({ chave: "s:nao-existe", img: __b.capas.faixas[0].img }); restaurarBackup(__b); });
      await p.esperar(() => !!porId.get("tc1").capaUser && capasAlbum.has("Álbum T"), 4000);
      assert.equal(await p.avaliar(() => capasAlbum.has("Álbum que não existe")), false, "capa de álbum que não existe no aparelho não deve ser guardada");
    },
  },
  {
    nome: "trocar capa pelo menu da música (com recorte)",
    rodar: async (p) => {
      await semear(p);
      await p.avaliar(() => menuFaixa("tc2"));
      await p.clicar("#sheet [data-a=capa]");
      await p.clicar("#sheet [data-capa-escolher]");
      await escolherImagem(p, "capa-file", "#8e44ad", 600, 400);
      await p.esperar(() => !!document.getElementById("corte-cv"), 3000);
      assert.ok(await p.avaliar(() => document.querySelector("#sheet .corte").classList.contains("quad")), "o recorte da capa é quadrado");
      await p.clicar("#sheet [data-corte-ok]");
      await p.esperar(() => !!porId.get("tc2").capaUser, 3000);
      assert.equal(await p.avaliar(async () => { const bm = await createImageBitmap(porId.get("tc2").capaUser); return bm.width + "x" + bm.height; }), "512x512");
    },
  },
  {
    nome: "músicas de exemplo não têm trocar capa; a tela do álbum tem",
    rodar: async (p) => {
      await semear(p);
      await p.avaliar(() => menuFaixa(faixas.find((x) => x.demo).id));
      assert.equal(await p.avaliar(() => !!document.querySelector("#sheet [data-a=capa]")), false);
      await p.avaliar(() => { fecharFolha(); abrirNaBib("album", "Álbum T"); });
      await p.clicar("#lib [data-capa-album]");
      assert.equal(await p.avaliar(() => !!document.querySelector("#sheet [data-capa-escolher]")), true);
      assert.equal(await p.avaliar(() => !!document.querySelector("#sheet [data-capa-tirar]")), false, "sem capa personalizada não há o que tirar");
    },
  },
];
