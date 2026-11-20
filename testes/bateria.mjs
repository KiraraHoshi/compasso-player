// Bateria de teste: bumbo, caixa e chimbal sintetizados dentro da página, a ~100 batidas por minuto.
// Entra no "mestre" (o mesmo caminho da música de exemplo), então passa pela cadeia de som e pela escuta dos desenhos.
// Uso num teste: await p.avaliar(BATERIA); depois, na página, __bateria.ligar() / __bateria.desligar().
export const BATERIA = () => {
  if (window.__bateria) return;
  let id = 0, prox = 0, passo = 0, ruido = null;
  const sd = 60 / 100 / 2; // colcheia
  const som = (montar) => { const g = ctx.createGain(); g.connect(mestre); montar(g); };
  function bumbo(t) {
    som((g) => { const o = ctx.createOscillator(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
      g.gain.setValueAtTime(1.4, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.38); o.connect(g); o.start(t); o.stop(t + 0.4); });
  }
  function chiado(t, tipo, f, vol, dur) {
    som((g) => { const s = ctx.createBufferSource(), b = ctx.createBiquadFilter(); s.buffer = ruido; b.type = tipo; b.frequency.value = f;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); s.connect(b); b.connect(g); s.start(t); s.stop(t + dur + 0.02); });
  }
  function agendar() {
    while (prox < ctx.currentTime + 0.3) {
      const k = passo % 8;
      if (k === 0 || k === 3 || k === 4) bumbo(prox);
      if (k === 2 || k === 6) chiado(prox, "bandpass", 2400, 1.1, 0.2);
      chiado(prox, "highpass", 9000, k % 2 ? 0.25 : 0.45, 0.05);
      prox += sd; passo++;
    }
  }
  window.__bateria = {
    ligar() {
      if (id) return; prepararAudio();
      if (!ruido) { ruido = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const d = ruido.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
      prox = ctx.currentTime + 0.05; agendar(); id = setInterval(agendar, 60);
    },
    desligar() { clearInterval(id); id = 0; },
  };
};
