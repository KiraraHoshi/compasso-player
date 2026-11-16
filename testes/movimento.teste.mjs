// 1.23 Movimento: escuta de batidas (bumbo, caixa, prato), andamento e a capa com mola.
// O detector e a mola são contas puras: entram números, saem golpes. Dá para testar sem som.
import assert from "node:assert/strict";

/* Roda a escuta sobre uma "música" de mentira. eventos: [tempo em ms, força de 0 a 1].
   Cada evento faz a energia da faixa subir de repente e cair aos poucos, como um golpe de bateria. */
const simular = (p, opcoes) => p.avaliar(({ dur, bumbo, caixa, prato, piso, ruido, semAndamento, pausa }) => {
  const E = criarEscuta({ andamento: !semAndamento }), dt = 1000 / 60, env = { bumbo: 0, caixa: 0, prato: 0 }, fila = { bumbo: (bumbo || []).slice(), caixa: (caixa || []).slice(), prato: (prato || []).slice() };
  const golpes = { bumbo: [], caixa: [], prato: [] };
  let semente = 7, relogio = 1000, pausou = false; const sorte = () => (semente = (semente * 16807) % 2147483647) / 2147483647; // "acaso" repetível
  for (let t = 1000; t < 1000 + dur; t += dt, relogio += dt) {
    if (pausa && !pausou && t - 1000 >= pausa[0]) { pausou = true; E.soltarAndamento(); relogio += pausa[1]; } // a música para; o relógio do aparelho continua
    for (const k in env) { env[k] *= 0.55; while (fila[k].length && fila[k][0][0] + 1000 <= t) env[k] = Math.max(env[k], fila[k].shift()[1]); }
    const g = E.passo(relogio, { bumbo: (piso || 0) * (1 + (ruido || 0) * (sorte() * 2 - 1)) + env.bumbo * 0.6, caixa: env.caixa * 0.6, prato: env.prato * 0.6 }, 1);
    for (const k in golpes) if (g[k]) golpes[k].push([Math.round(t - 1000), +g[k].toFixed(2)]);
  }
  return { golpes, P: E.GR.P, conf: +E.GR.conf.toFixed(2) };
}, opcoes);
const cada = (passo, dur, forca = 1, desvio = 0) => { const l = []; for (let t = 200 + desvio; t < dur; t += passo) l.push([t, forca]); return l; };

export default [
  {
    nome: "bumbo firme: um golpe por bumbo e o andamento certo",
    rodar: async (p) => {
      const r = await simular(p, { dur: 8000, bumbo: cada(500, 8000) });
      assert.ok(r.golpes.bumbo.length >= 14 && r.golpes.bumbo.length <= 16, `golpes: ${r.golpes.bumbo.length} para 16 bumbos`);
      assert.ok(Math.abs(r.P - 500) <= 10, `andamento estimado: ${r.P} ms por batida (o certo é 500)`);
      assert.ok(r.conf > 0.8, `confiança ${r.conf}`);
    },
  },
  {
    nome: "nota de baixo e voz (subidas fracas) não viram soco na capa",
    rodar: async (p) => {
      const fracas = []; for (let t = 290; t < 8000; t += 187) fracas.push([t, 0.25]); // 41 notas graves fracas, fora do tempo
      const r = await simular(p, { dur: 8000, bumbo: [...cada(500, 8000), ...fracas].sort((a, b) => a[0] - b[0]) });
      assert.ok(r.golpes.bumbo.length <= 18, `foram ${r.golpes.bumbo.length} socos para 16 bumbos e 41 notas fracas`);
      assert.ok(r.golpes.bumbo.length >= 13, `sumiram bumbos de verdade: ${r.golpes.bumbo.length}`);
    },
  },
  {
    nome: "com andamento firme, grave forte fora do tempo bate mais fraco que o do tempo",
    rodar: async (p) => {
      const fora = []; for (let t = 200 + 4000 + 250; t < 10000; t += 1500) fora.push([t, 0.9]); // depois de 4 s de ritmo firme, bem no meio entre dois bumbos
      const musica = { dur: 10000, bumbo: [...cada(500, 10000), ...fora].sort((a, b) => a[0] - b[0]) };
      const r = await simular(p, musica), semFiltro = await simular(p, { ...musica, semAndamento: true });
      const noTempo = (t) => Math.abs(((t - 200) % 500 + 500) % 500 - 0) < 60 || Math.abs(((t - 200) % 500) - 500) < 60;
      const dentro = r.golpes.bumbo.filter(([t]) => t > 4000 && noTempo(t)).map((g) => g[1]), foraG = r.golpes.bumbo.filter(([t]) => t > 4000 && !noTempo(t)).map((g) => g[1]);
      const media = (l) => (l.length ? l.reduce((a, b) => a + b, 0) / l.length : 0);
      assert.ok(dentro.length >= 9, `poucos golpes no tempo: ${dentro.length}`);
      assert.ok(foraG.length <= 1, `fora do tempo passaram ${foraG.length} golpes de força média ${media(foraG).toFixed(2)}`);
      const foraSem = semFiltro.golpes.bumbo.filter(([t]) => t > 4000 && !noTempo(t));
      assert.ok(foraSem.length >= 3, `sem o andamento, esses golpes deviam passar (passaram ${foraSem.length}): é o andamento que segura, não o intervalo mínimo`);
    },
  },
  {
    nome: "ritmo quebrado: sem andamento firme, a capa segue cada bumbo",
    rodar: async (p) => {
      const b = []; let t = 200; for (const d of [310, 520, 410, 690, 350, 560, 430, 720, 380, 610, 290, 650, 470, 540, 330, 700, 420, 580]) { b.push([t, 1]); t += d; }
      const r = await simular(p, { dur: t + 300, bumbo: b });
      assert.ok(r.golpes.bumbo.length >= b.length - 2, `${r.golpes.bumbo.length} socos para ${b.length} bumbos`);
    },
  },
  {
    nome: "depois de pausar, a capa volta a pulsar logo no primeiro bumbo",
    rodar: async (p) => {
      const r = await simular(p, { dur: 9000, bumbo: cada(500, 9000), pausa: [6000, 3230] }); // 3,23 s de pausa: o tempo forte muda de lugar no relógio
      const depois = r.golpes.bumbo.filter(([t]) => t > 6000);
      assert.ok(depois.length && depois[0][0] < 6700, `primeiro soco depois da pausa em ${depois.length ? depois[0][0] : "nunca"} ms (a música voltou em 6000)`);
      assert.ok(depois.length >= 5, `só ${depois.length} socos nos 3 s depois da pausa (são 6 bumbos)`);
    },
  },
  {
    nome: "grave contínuo que oscila um pouco (órgão, ambiente) não vira soco; bumbo por cima dele continua valendo",
    rodar: async (p) => {
      const so = await simular(p, { dur: 15000, piso: 0.4, ruido: 0.05 });
      assert.ok(so.golpes.bumbo.length <= 2, `${so.golpes.bumbo.length} socos em 15 s de grave contínuo sem bateria`);
      const com = await simular(p, { dur: 8000, piso: 0.3, ruido: 0.05, bumbo: cada(500, 8000) });
      assert.ok(com.golpes.bumbo.length >= 13 && com.golpes.bumbo.length <= 17, `${com.golpes.bumbo.length} socos para 16 bumbos sobre o grave contínuo`);
    },
  },
  {
    nome: "som parado (grave contínuo, sem subida) não gera golpe",
    rodar: async (p) => {
      const r = await simular(p, { dur: 4000, piso: 0.4 });
      assert.deepEqual([r.golpes.caixa.length, r.golpes.prato.length], [0, 0]);
      assert.ok(r.golpes.bumbo.length <= 1, `golpes com som parado: ${r.golpes.bumbo.length} (só a entrada do som pode contar)`);
    },
  },
  {
    nome: "dois golpes colados contam como um; caixa e prato têm escutas próprias",
    rodar: async (p) => {
      const r = await simular(p, { dur: 3000, bumbo: [[500, 1], [560, 1], [1500, 1]], caixa: [[1000, 1], [2000, 1]], prato: [[250, 1], [500, 1], [750, 1], [1000, 1]] });
      assert.equal(r.golpes.bumbo.length, 2);
      assert.equal(r.golpes.caixa.length, 2);
      assert.equal(r.golpes.prato.length, 4);
    },
  },
  {
    nome: "energia da faixa: som alto pesa muito mais que som baixo",
    rodar: async (p) => {
      const r = await p.avaliar(() => { const b = new Uint8Array(1024); b.fill(255, 2, 6); const alto = energiaFaixa(b, 2, 5); b.fill(128, 2, 6); return [alto, energiaFaixa(b, 2, 5), faixaEmBins(38, 115, 48000, 2048)]; });
      assert.equal(r[0], 1);
      assert.ok(r[1] > 0.1 && r[1] < 0.14, `metade do volume deu ${r[1]} (o esperado é perto de 1/8)`);
      assert.deepEqual(r[2], [2, 5]);
    },
  },
  /* ---- capa com mola ---- */
  {
    nome: "mola: o soco estica a capa e ela volta ao lugar, sem ficar tremendo",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const M = criarMola(); let max = 1, min = 1, t = 0;
        max = Math.max(max, M.passo(1, 1, 0, t, 1));
        const serie = []; for (let i = 0; i < 90; i++) { t += 16.67; const e = M.passo(0, 1, 0, t, 1); max = Math.max(max, e); min = Math.min(min, e); serie.push(e); }
        return { max, min, fim: serie[89], meio: serie[20] };
      });
      assert.ok(r.max > 1.012 && r.max < 1.1, `pico da capa: ${r.max}`);
      assert.ok(r.min > 0.985, `a capa encolheu demais na volta: ${r.min}`);
      assert.ok(Math.abs(r.fim - 1) < 0.002, `1,5 s depois a capa ainda está em ${r.fim}`);
    },
  },
  {
    nome: "mola: soco logo depois de outro sai mais fraco; sem batida ligada a capa não se mexe",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const pico = (intervalo) => { const M = criarMola(); let t = 0, max = 1; M.passo(1, 1, 0, t, 1); for (let i = 0; i < 300; i++) { t += 16.67; const g = Math.abs(t - 2000 - intervalo) < 8.4 || Math.abs(t - 2000) < 8.4 ? 1 : 0; const e = M.passo(g, 1, 0, t, 1); if (t > 2000 + intervalo - 8) max = Math.max(max, e); } return max - 1; };
        const parado = (() => { const M = criarMola(); let m = 0; for (let i = 0; i < 60; i++) m = Math.max(m, Math.abs(M.passo(i % 20 === 0 ? 1 : 0, 0, 0.8, i * 16.67, 1) - 1)); return m; })();
        return { colado: pico(120), solto: pico(900), parado };
      });
      assert.ok(r.colado < r.solto * 1.6, `segundo soco colado somou demais: ${r.colado} contra ${r.solto} de um soco sozinho`);
      assert.equal(r.parado, 0);
    },
  },
  /* ---- ligação com o app ---- */
  {
    nome: "a escuta das batidas é um ramo só para os desenhos: o som não passa pelo atraso",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const lig = []; const orig = AudioNode.prototype.connect;
        AudioNode.prototype.connect = function (d, ...x) { lig.push([this, d]); return orig.call(this, d, ...x); };
        prepararAudio();
        AudioNode.prototype.connect = orig;
        const para = (n) => lig.filter(([a]) => a === n).map(([, d]) => d);
        return {
          escuta: anD.fftSize === 2048 && anD.smoothingTimeConstant === 0,
          somDireto: para(saidaEra).includes(volNo),
          desenhoComAtraso: para(saidaEra).includes(atrasoViz) && para(atrasoViz).includes(an) && para(an).includes(anD),
          semVolta: !para(an).includes(volNo) && !para(anD).length && !para(atrasoViz).includes(volNo),
          atraso: atrasoViz.delayTime.value <= 0.4,
        };
      });
      assert.deepEqual(r, { escuta: true, somDireto: true, desenhoComAtraso: true, semVolta: true, atraso: true });
    },
  },
  {
    nome: "pausar e pular na música soltam o andamento; o modo leve devolve a capa ao tamanho normal",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const o = [];
        escuta.GR.P = 500; escuta.GR.conf = 0.9; tocar(); pausar(); o.push(escuta.GR.P);
        escuta.GR.P = 500; buscarSeg(20); o.push(escuta.GR.P);
        document.querySelector(".dial").style.setProperty("--ds", "1.030"); definirLeve(true);
        o.push(getComputedStyle(document.querySelector(".dial")).getPropertyValue("--ds").trim());
        return o;
      });
      assert.deepEqual(r, [0, 0, "1"]);
    },
  },
  {
    nome: "a cadeia do som termina na saída certa (senão o app ficaria mudo)",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio();
        const lig = []; const orig = AudioNode.prototype.connect;
        AudioNode.prototype.connect = function (d, ...x) { lig.push([this, d]); return orig.call(this, d, ...x); };
        cfg.era = "80"; montarEra(); cfg.era = "off"; montarEra();
        AudioNode.prototype.connect = orig;
        return { naSaida: lig.filter(([, d]) => d === saidaEra).length, noAnalisador: lig.filter(([, d]) => d === an).length };
      });
      assert.ok(r.naSaida >= 3, `ligações na saída do som: ${r.naSaida}`);
      assert.equal(r.noAnalisador, 0, "nada deve se ligar direto no analisador dos desenhos");
    },
  },
  {
    nome: "modo leve: a capa fica parada mesmo com batida",
    hash: "tocando",
    rodar: async (p) => {
      await p.avaliar(() => { definirLeve(true); });
      await p.avaliar(() => new Promise((ok) => setTimeout(ok, 200)));
      const a = await p.avaliar(() => getComputedStyle(document.querySelector(".dial")).getPropertyValue("--ds").trim());
      await p.avaliar(() => { molaCapa.passo(1, 1, 0, performance.now(), 1); });
      await p.avaliar(() => new Promise((ok) => setTimeout(ok, 200)));
      assert.equal(await p.avaliar(() => getComputedStyle(document.querySelector(".dial")).getPropertyValue("--ds").trim()), a);
    },
  },
];
