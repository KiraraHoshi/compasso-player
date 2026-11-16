// Nada estoura em lugar nenhum: cada tela em cada tamanho, sem rolagem para o lado e sem erro no console.
import assert from "node:assert/strict";

const TELAS = ["inicio", "biblioteca", "playlists", "voce", "temas", "tocando"];
const TAMANHOS = [[320, 640], [360, 780], [412, 915], [800, 400], [1280, 800]];

export default TAMANHOS.map(([w, h]) => ({
  nome: `todas as telas em ${w}×${h}`,
  largura: w,
  altura: h,
  rodar: async (p) => {
    for (const tela of TELAS) {
      await p.avaliar((v) => ir(v), tela);
      await p.quadro();
      const r = await p.avaliar(() => ({ pagina: document.documentElement.scrollWidth - innerWidth, main: document.getElementById("main").scrollWidth - document.getElementById("main").clientWidth }));
      await p.print(`geral/${tela}-${w}x${h}`);
      assert.ok(r.pagina <= 0 && r.main <= 0, `${tela} em ${w}×${h} rola para o lado (página +${r.pagina}px, conteúdo +${r.main}px)`);
    }
  },
}));
