// 1.19 Som: amplificador, reverb, efeito 3D e aprimorador.
// Os efeitos são montados por funções que aceitam qualquer contexto de áudio, então dá para medir o som de verdade num OfflineAudioContext.
import assert from "node:assert/strict";

// Liga o áudio do app com um oscilador de 1 kHz na entrada (no lugar de uma música)
const ligarAudio = (p) => p.avaliar(async () => {
  prepararAudio(); await ctx.resume();
  const o = ctx.createOscillator(); o.frequency.value = 1000; o.connect(entrada); o.start(); window.__osc = o;
  return ctx.state;
});
// Pico (em dB) do tom de 1 kHz visto pelo analisador. A suavização do analisador vale por leitura, não por tempo:
// as primeiras leituras ainda estão subindo do zero, então lê várias vezes e fica com a última.
const picoAnalisador = (p) => p.avaliar(async () => {
  await new Promise((ok) => setTimeout(ok, 300));
  const f = new Float32Array(an.frequencyBinCount);
  for (let k = 0; k < 25; k++) { an.getFloatFrequencyData(f); await new Promise((ok) => setTimeout(ok, 30)); }
  return Math.max(...f);
});

export default [
  {
    nome: "limitador segura 200% sem passar de 0 dBFS",
    rodar: async (p) => {
      const pico = await p.avaliar(async () => {
        const c = new OfflineAudioContext(2, 44100, 44100), o = c.createOscillator(), g = c.createGain();
        o.frequency.value = 1000; g.gain.value = 2;
        o.connect(g); g.connect(montarLimitador(c)).connect(c.destination); o.start();
        const b = await c.startRendering();
        let m = 0; for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 2205; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); }
        return m;
      });
      assert.ok(pico <= 1.0, `pico = ${pico}`);
    },
  },
  {
    nome: "amp aplica no ganho do volume",
    rodar: async (p) => {
      await ligarAudio(p);
      await p.avaliar(() => { cfg.vol = 1; cfg.mudo = false; escolherAmp(1.5); });
      await p.esperar(() => Math.abs(volNo.gain.value - 1.5) < 0.05, 2000);
      assert.equal(await p.avaliar(() => cfg.amp), 1.5);
    },
  },
  {
    nome: "analisador fica antes do amplificador",
    rodar: async (p) => {
      await ligarAudio(p);
      await p.avaliar(() => { cfg.vol = 1; escolherAmp(1); });
      const a1 = await picoAnalisador(p);
      await p.avaliar(() => escolherAmp(2));
      const a2 = await picoAnalisador(p);
      assert.ok(a1 > -80, `o analisador não recebeu som (pico ${a1} dB)`);
      assert.ok(Math.abs(a2 - a1) < 1, `pico com amp 1 = ${a1.toFixed(2)} dB, com amp 2 = ${a2.toFixed(2)} dB (depois do amplificador seria +6 dB)`);
    },
  },
];
