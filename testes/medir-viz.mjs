// Mede o custo de cada visual (fora da suíte: o nome não termina em .teste.mjs).
// Uso: node testes/rodar.mjs testes/medir-viz.mjs
// Para cada visual, tocando com a bateria de teste: tempo médio de um desenho (ms, no PC; no celular é várias vezes mais),
// desenhos por segundo no laço tocando e pausado, e o mesmo custo no modo leve. Serve para comparar um visual com o outro:
// a Aura (aprovada e medida no celular na 1.24) é a régua.
import { BATERIA } from "./bateria.mjs";

const espera = (ms) => new Promise((r) => setTimeout(r, ms));
export default [[360, 780, "celular"], [1280, 800, "PC"]].map(([largura, altura, onde]) => ({
  nome: `custo dos visuais (${onde})`, hash: "tocando", largura, altura,
  rodar: async (p) => {
    await p.avaliar(BATERIA);
    const lista = await p.avaliar(() => [...Object.keys(VISUAIS).filter((v) => v !== "aura"), "aura:padrao", "aura:phonk", "aura:lofi", "aura:oitenta"]), linhas = [];
    for (const item of lista) {
      const [v, est] = item.split(":");
      await p.avaliar((v, est) => { if (est) cfg.auraEst = est; cfg.reage = true; cfg.batF = 0.7; cfg.leve = false; brilhoAura.desligado = false; brilhoAura.lento = 0; delete APP.dataset.semfx; escolherVisual(v); if (!playing) tocar(); __bateria.ligar(); }, v, est || "");
      await espera(800);
      const r = await p.avaliar(async () => {
        // desenhos por segundo no laço: conta as vezes em que desenharViz passou do limite de ritmo e chegou a desenhar
        const cv = document.getElementById("viz"), g = cv.getContext("2d"); let n = 0; const o = g.clearRect; g.clearRect = function (...a) { n++; return o.apply(this, a); };
        await new Promise((ok) => setTimeout(ok, 2000)); const tocando = n / 2; n = 0;
        pausar(); await new Promise((ok) => setTimeout(ok, 2600)); n = 0; await new Promise((ok) => setTimeout(ok, 2000)); const pausado = n / 2; g.clearRect = o; tocar();
        await new Promise((ok) => setTimeout(ok, 300));
        // custo de um desenho: chama o mesmo caminho do laço muitas vezes (ritmo liberado)
        const custo = (leve) => { cfg.leve = leve; const t0 = performance.now(); let k = 0; while (performance.now() - t0 < 600) { ritmoViz.zerar(); desenharViz(); k++; } cfg.leve = false; return (performance.now() - t0) / k; };
        const ms = custo(false), msLeve = custo(true);
        return { tocando, pausado, ms, msLeve };
      });
      linhas.push(`${item.padEnd(13)} ${r.ms.toFixed(3).padStart(7)} ms  leve ${r.msLeve.toFixed(3).padStart(7)} ms  ${String(r.tocando).padStart(5)}/s tocando  ${String(r.pausado).padStart(5)}/s pausado`);
    }
    await p.avaliar(() => { __bateria.desligar(); pausar(); cfg.auraEst = "padrao"; });
    console.log(`\n    ${onde} (${largura}×${altura}):\n    ` + linhas.join("\n    "));
  },
}));
