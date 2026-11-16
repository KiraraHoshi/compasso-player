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
];
