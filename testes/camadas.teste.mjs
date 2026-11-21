// 1.26.10: nos visuais que desenham além do mostrador (Aura, Espectro, Anel, Galáxia, Túnel) o desenho sai 25% para cada lado.
// Ele tem de ficar atrás do título, dos botões e da barra de tempo, nunca na frente (visto na Galáxia, no celular).
import assert from "node:assert/strict";

const LARGOS = ["aura", "espectro", "anel", "galaxia", "tunel"];

/* Para cada parte do Tocando que o desenho alcança, pergunta ao navegador quem está por cima no meio dela.
   O desenho não recebe toque (pointer-events:none); aqui ele passa a receber só para a pergunta. */
const QUEM_COBRE = (v) => {
  escolherVisual(v);
  const cv = document.getElementById("viz"); cv.style.pointerEvents = "auto";
  const r = cv.getBoundingClientRect(), o = { alcanca: [], coberto: [] };
  for (const el of document.querySelectorAll("#v-tocando > :is(.np-meta,.np-bar,.seek,.ctl,.volume)")) {
    const b = el.getBoundingClientRect();
    if (!b.width || !b.height) continue;
    // pontos espalhados pela parte (a borda do desenho pega só o alto do título)
    const pts = [];
    for (const fx of [0.2, 0.5, 0.8]) for (const fy of [0.15, 0.5, 0.85]) pts.push([b.left + b.width * fx, b.top + b.height * fy]);
    const dentro = pts.filter(([x, y]) => x > r.left && x < r.right && y > r.top && y < r.bottom && y < innerHeight);
    if (!dentro.length) continue;
    o.alcanca.push(el.className);
    if (dentro.some(([x, y]) => document.elementFromPoint(x, y) === cv)) o.coberto.push(el.className);
  }
  cv.style.pointerEvents = "";
  return o;
};

export default [
  ...[[360, 780, "celular"], [412, 915, "celular grande"], [1280, 800, "PC"]].map(([largura, altura, onde]) => ({
    nome: `no ${onde}, o desenho dos visuais largos fica atrás do título e dos botões`,
    hash: "tocando", largura, altura,
    rodar: async (p) => {
      let alcancou = 0;
      for (const v of LARGOS) {
        const r = await p.avaliar(QUEM_COBRE, v);
        alcancou += r.alcanca.length;
        assert.deepEqual(r.coberto, [], `${v}: o desenho fica na frente de ${r.coberto.join(", ")}`);
      }
      if (largura === 360) assert.ok(alcancou > 0, "no celular pequeno o desenho alcança o título (senão o teste não prova nada)");
    },
  })),
];
