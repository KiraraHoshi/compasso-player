// Prints dos visuais do mostrador tocando com batida (fora da suíte: o nome não termina em .teste.mjs).
// Uso: node testes/rodar.mjs testes/prints-viz.mjs      → testes/prints/viz-<visual>[-<estilo>]-<celular|pc>.png
// Filtro opcional: ORO_VIZ=aura,onda node testes/rodar.mjs testes/prints-viz.mjs
// A música de exemplo não tem bateria: aqui uma bateria é sintetizada dentro da página (bumbo, caixa e chimbal)
// e entra no mesmo caminho do som da música, então a escuta das batidas e os desenhos reagem de verdade.
import { BATERIA } from "./bateria.mjs";

const TODOS = [
  ["relogio"], ["vinil"], ["aura", "padrao"], ["aura", "phonk"], ["aura", "lofi"], ["aura", "oitenta"],
  ["espectro"], ["anel"], ["neon"], ["barras"], ["led"], ["cassete"], ["radio"],
  ["galaxia"], ["tunel"], ["osc"],
];
const filtro = (process.env.ORO_VIZ || "").split(",").filter(Boolean);
const lista = TODOS.filter(([v, e]) => !filtro.length || filtro.includes(v) || filtro.includes(e));
const TAMANHOS = [["celular", 360, 780], ["pc", 1280, 800]];
const TEMA = process.env.ORO_TEMA || ""; // ex.: ORO_TEMA=claro → prints com sufixo -claro

export default TAMANHOS.map(([nomeT, largura, altura]) => ({
  nome: `prints dos visuais (${nomeT})`, hash: "tocando", largura, altura,
  rodar: async (p) => {
    await p.avaliar(BATERIA);
    if (TEMA) await p.avaliar((t) => { cfg.tema = t; aplicarTema(); }, TEMA);
    for (const [v, est] of lista) {
      const ok = await p.avaliar((v, est) => {
        if (est) cfg.auraEst = est;
        cfg.visual = v; cfg.reage = true; cfg.batF = 0.7; cfg.leve = false;
        aplicarVisual();
        if (APP.dataset.visual !== v) { APP.dataset.visual = v; pintarCena(); ajustarDial(); } // Cassete e Rádio ficam fora de VISUAIS
        if (!playing) tocar();
        __bateria.ligar();
        return APP.dataset.visual === v;
      }, v, est || "");
      if (!ok) continue;
      await new Promise((r) => setTimeout(r, 2600)); // tempo para a escuta achar o andamento
      // espera o instante logo depois de um bumbo, que é o que mais mostra o efeito
      await p.esperar(() => escuta.O.bumbo.env > 0.75, 4000).catch(() => {});
      await new Promise((r) => setTimeout(r, 40));
      await p.print(`viz-${v}${est ? "-" + est : ""}-${nomeT}${TEMA ? "-" + TEMA : ""}`);
    }
    await p.avaliar(() => { __bateria.desligar(); pausar(); cfg.auraEst = "padrao"; });
  },
}));
