// 1.20 Uso: modo carro, já começar tocando, fone e notificação
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const abrirCarro = async (p) => { await p.clicar("[data-ferr=carro]"); await p.esperar(() => !document.getElementById("carro").hidden, 1500); };
const dentroDaTela = (p) => p.avaliar(() => [...document.querySelectorAll("#carro [data-carro], #carro .carro-t")].every((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.left >= 0 && r.top >= 0 && r.right <= innerWidth + 0.5 && r.bottom <= innerHeight + 0.5; }));

export default [
  {
    nome: "modo carro abre pela ferramenta e o voltar fecha",
    rodar: async (p) => {
      await abrirCarro(p);
      assert.deepEqual(await p.avaliar(() => [...document.querySelectorAll("#carro [data-carro]")].map((b) => b.dataset.carro).sort()), ["next", "play", "prev", "rep", "sair", "shuf"]);
      assert.equal(await p.avaliar(() => emCarro()), true);
      assert.equal(await p.voltar(), true);
      assert.equal(await p.avaliar(() => document.getElementById("carro").hidden), true);
      assert.equal(await p.avaliar(() => document.getElementById("app").dataset.view), "inicio");
    },
  },
  {
    nome: "modo carro mostra a música e toca",
    rodar: async (p) => {
      await abrirCarro(p);
      assert.equal(await p.avaliar(() => document.querySelector("#carro .carro-t").textContent), await p.avaliar(() => cur().t));
      await p.clicar("#carro [data-carro=play]");
      assert.equal(await p.avaliar(() => playing), true);
      await p.clicar("#carro [data-carro=next]");
      assert.equal(await p.avaliar(() => document.querySelector("#carro .carro-t").textContent), await p.avaliar(() => cur().t));
      await p.clicar("#carro [data-carro=play]");
      assert.equal(await p.avaliar(() => playing), false);
    },
  },
  {
    nome: "botões do modo carro são grandes e cabem em pé",
    largura: 360, altura: 780,
    rodar: async (p) => {
      await abrirCarro(p);
      const t = await p.avaliar(() => Object.fromEntries(["prev", "play", "next", "sair"].map((k) => { const r = document.querySelector(`#carro [data-carro=${k}]`).getBoundingClientRect(); return [k, Math.min(r.width, r.height)]; })));
      assert.ok(t.play >= 96, `tocar tem ${t.play} px`);
      assert.ok(t.prev >= 72 && t.next >= 72, `anterior ${t.prev} px, próxima ${t.next} px`);
      assert.ok(t.sair >= 48, `sair tem ${t.sair} px`);
      assert.ok(await dentroDaTela(p), "algo saiu da tela em pé");
      await p.print("120-carro-em-pe");
    },
  },
  {
    nome: "modo carro cabe com o celular deitado",
    largura: 780, altura: 360,
    rodar: async (p) => {
      await abrirCarro(p);
      assert.ok(await dentroDaTela(p), "algo saiu da tela deitado");
      const t = await p.avaliar(() => { const r = document.querySelector("#carro [data-carro=play]").getBoundingClientRect(); return Math.min(r.width, r.height); });
      assert.ok(t >= 88, `tocar tem ${t} px deitado`);
      await p.print("120-carro-deitado");
    },
  },
  {
    nome: "modo carro mantém a tela ligada",
    rodar: async (p) => {
      assert.equal(await p.avaliar(() => querTela()), false);
      await abrirCarro(p);
      assert.equal(await p.avaliar(() => querTela()), true);
    },
  },
];
