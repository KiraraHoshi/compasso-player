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
  {
    nome: "reverb decai",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const b = impulsoReverb(new OfflineAudioContext(2, 1, 44100), 2, 3), d = b.getChannelData(0), n = d.length, k = Math.floor(n / 10);
        const rms = (a, z) => { let s = 0; for (let i = a; i < z; i++) s += d[i] * d[i]; return Math.sqrt(s / (z - a)); };
        return { canais: b.numberOfChannels, seg: n / 44100, ini: rms(0, k), fim: rms(n - k, n) };
      });
      assert.equal(r.canais, 2);
      assert.ok(Math.abs(r.seg - 2) < 0.01, `duração ${r.seg}`);
      assert.ok(r.ini > 20 * r.fim, `começo ${r.ini}, fim ${r.fim}`);
    },
  },
  {
    nome: "3D alarga o estéreo e deixa o mono igual",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const passar = async (esq, dir) => {
          const c = new OfflineAudioContext(2, 4410, 44100), b = c.createBuffer(2, 4410, 44100);
          for (let i = 0; i < 4410; i++) { const v = Math.sin((2 * Math.PI * 440 * i) / 44100) * 0.5; b.getChannelData(0)[i] = v * esq; b.getChannelData(1)[i] = v * dir; }
          const s = c.createBufferSource(), l = criarLargura(c, 2); s.buffer = b;
          s.connect(l.entrada); l.saida.connect(c.destination); s.start();
          const o = await c.startRendering(), L = o.getChannelData(0), R = o.getChannelData(1);
          let dif = 0, difIn = 0; for (let i = 0; i < 4410; i++) { dif = Math.max(dif, Math.abs(L[i] - R[i])); difIn = Math.max(difIn, Math.abs(b.getChannelData(0)[i] - b.getChannelData(1)[i])); }
          return { dif, difIn };
        };
        return { lado: await passar(1, 0), mono: await passar(1, 1) };
      });
      assert.ok(r.lado.dif > r.lado.difIn * 1.5, `diferença L−R: entrada ${r.lado.difIn}, saída ${r.lado.dif}`);
      assert.ok(r.mono.dif < 1e-4, `mono ficou com L−R = ${r.mono.dif}`);
    },
  },
  {
    nome: "aprimorador neutro não muda o som",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const c = new OfflineAudioContext(2, 44100, 44100), o = c.createOscillator(), a = criarAprimorador(c, 0, 0, 0);
        o.frequency.value = 440; o.connect(a.entrada); a.saida.connect(c.destination); o.start();
        const d = (await c.startRendering()).getChannelData(0); let s = 0; for (let i = 4410; i < d.length; i++) s += d[i] * d[i];
        return Math.sqrt(s / (d.length - 4410));
      });
      assert.ok(Math.abs(r - Math.SQRT1_2) / Math.SQRT1_2 < 0.01, `RMS ${r} (entrada ${Math.SQRT1_2})`);
    },
  },
  {
    nome: "graves +9 dB reforçam o grave",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const rms = async (g) => {
          const c = new OfflineAudioContext(2, 44100, 44100), o = c.createOscillator(), a = criarAprimorador(c, g, 0, 0);
          o.frequency.value = 60; o.connect(a.entrada); a.saida.connect(c.destination); o.start();
          const d = (await c.startRendering()).getChannelData(0); let s = 0; for (let i = 4410; i < d.length; i++) s += d[i] * d[i];
          return Math.sqrt(s / (d.length - 4410));
        };
        return [await rms(0), await rms(9)];
      });
      assert.ok(r[1] >= 2 * r[0], `RMS sem reforço ${r[0]}, com +9 dB ${r[1]}`);
    },
  },
  {
    nome: "trocar efeito com música tocando não duplica nós",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); cfg.reverb = "sala"; montarFiltros(); const um = efeitosNos.length;
        for (let k = 0; k < 5; k++) { cfg.reverb = k % 2 ? "sala" : "nenhum"; montarFiltros(); }
        cfg.reverb = "sala"; montarFiltros();
        return { um, depois: efeitosNos.length };
      });
      assert.ok(r.um > 0, "o reverb não entrou na cadeia");
      assert.equal(r.depois, r.um);
    },
  },
  {
    nome: "efeitos neutros não entram na cadeia",
    rodar: async (p) => assert.equal(await p.avaliar(() => { prepararAudio(); return efeitosNos.length; }), 0),
  },
  {
    nome: "crossfade segue funcionando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const lig = []; const orig = AudioNode.prototype.connect;
        AudioNode.prototype.connect = function (d, ...x) { lig.push([this, d]); return orig.call(this, d, ...x); };
        cfg.xfade = 2; cfg.reverb = "palco"; prepararAudio();
        AudioNode.prototype.connect = orig;
        return {
          tocadores: ganhos.map((g) => lig.filter(([a]) => a === g).map(([, d]) => d === entrada)),
          diretoNaEra: lig.some(([a, d]) => ganhos.includes(a) && d === eraIn),
          efeitosAntesDaEra: lig.some(([a, d]) => efeitosNos.includes(a) && d === eraIn),
        };
      });
      assert.deepEqual(r.tocadores, [[true], [true]]);
      assert.equal(r.diretoNaEra, false);
      assert.equal(r.efeitosAntesDaEra, true);
    },
  },
  {
    nome: "limitador com os valores planejados",
    rodar: async (p) => {
      const r = await p.avaliar(() => { const l = montarLimitador(new OfflineAudioContext(2, 1, 44100)); return [l.ratio.value, +l.attack.value.toFixed(4), +l.release.value.toFixed(3), l.knee.value]; });
      assert.deepEqual(r, [20, 0.002, 0.12, 0]);
    },
  },
  {
    nome: "limitador segura batidas secas a 200%",
    rodar: async (p) => {
      const pico = await p.avaliar(async () => {
        const c = new OfflineAudioContext(2, 88200, 44100), b = c.createBuffer(2, 88200, 44100);
        for (let ch = 0; ch < 2; ch++) { const d = b.getChannelData(ch); for (let i = 0; i < d.length; i++) { const t = i % 11025; d[i] = t < 2205 ? Math.sin((2 * Math.PI * 90 * i) / 44100) * Math.exp(-t / 900) : Math.sin((2 * Math.PI * 700 * i) / 44100) * 0.15; } } // bumbo forte a cada 250 ms sobre um som baixo
        const s = c.createBufferSource(), g = c.createGain(); s.buffer = b; g.gain.value = 2;
        s.connect(g); g.connect(montarLimitador(c)).connect(c.destination); s.start();
        const o = await c.startRendering(); let m = 0;
        for (let ch = 0; ch < 2; ch++) { const d = o.getChannelData(ch); for (let i = 0; i < d.length; i++) m = Math.max(m, Math.abs(d[i])); }
        return m;
      });
      assert.ok(pico <= 1.0, `pico = ${pico}`);
    },
  },
  {
    nome: "intensidade encorpa sem cavar buracos no som",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const rms = async (f, int) => {
          const c = new OfflineAudioContext(2, 44100, 44100), o = c.createOscillator(), g = c.createGain(), a = criarAprimorador(c, 0, 0, int);
          o.frequency.value = f; g.gain.value = 0.02; // som baixo: abaixo do limiar do compressor, o caminho paralelo soma inteiro
          o.connect(g); g.connect(a.entrada); a.saida.connect(c.destination); o.start();
          const d = (await c.startRendering()).getChannelData(0); let s = 0; for (let i = 8820; i < d.length; i++) s += d[i] * d[i];
          return Math.sqrt(s / (d.length - 8820));
        };
        const out = {};
        for (const f of [83.33, 250, 416.67, 1000, 3000]) out[f] = (await rms(f, 1)) / (await rms(f, 0)); // 83, 250 e 417 Hz seriam buracos com um atraso de 6 ms sem compensar
        return out;
      });
      for (const [f, q] of Object.entries(r)) assert.ok(q >= 1, `${f} Hz ficou ${q.toFixed(2)}× com a intensidade no máximo (devia reforçar)`);
    },
  },
  {
    nome: "trocar de reverb abaixa a saída antes de remontar e volta depois",
    rodar: async (p) => {
      await ligarAudio(p);
      await p.avaliar(() => { cfg.reverb = "catedral"; montarFiltros(); });
      await p.avaliar(async () => {
        const orig = montarFiltros; window.__visto = null;
        montarFiltros = function () { window.__visto = eraIn.gain.value; montarFiltros = orig; orig(); };
        cfg.reverb = "nenhum"; trocarEfeitos();
      });
      await p.esperar(() => window.__visto !== null, 2000);
      assert.ok(await p.avaliar(() => window.__visto) < 0.05, "a cadeia foi remontada com a saída ainda aberta (cortaria a cauda do reverb com estalo)");
      await p.esperar(() => eraIn.gain.value > 0.95, 2000);
      assert.equal(await p.avaliar(() => efeitosNos.length), 0);
    },
  },
  {
    nome: "impulso do reverb é gerado uma vez por tipo",
    rodar: async (p) => {
      const r = await p.avaliar(() => { const c = new OfflineAudioContext(2, 1, 44100); return criarReverb(c, "sala").nos[2].buffer === criarReverb(c, "sala").nos[2].buffer; });
      assert.equal(r, true);
    },
  },
];
