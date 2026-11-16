// 1.25 Mostradores refinados: Relógio redondo com ponteiros, Espectro, Anel, Neon e Barras.
import assert from "node:assert/strict";

export default [
  {
    nome: "pico: segura um instante e depois cai acelerando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const nv = new Float32Array([1]), pk = new Float32Array(1), pv = new Float32Array(1), h = [];
        passoPicos(nv, pk, pv, 1, 1); nv[0] = 0;
        for (let i = 0; i < 45; i++) { passoPicos(nv, pk, pv, 1, 1); h.push(pk[0]); }
        return { segura: h[7], cedo: h[14] - h[22], tarde: h[30] - h[38], fim: h[44] };
      });
      assert.equal(r.segura, 1, "nos primeiros quadros o pico fica onde chegou");
      assert.ok(r.tarde > r.cedo * 1.5, `cai acelerando: ${r.cedo.toFixed(3)} e depois ${r.tarde.toFixed(3)}`);
      assert.ok(r.fim < 0.7);
    },
  },
  {
    nome: "Relógio: a capa é sempre redonda; nos outros o formato escolhido continua valendo",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        cfg.formaCapa = "quadrada"; const o = [];
        for (const v of ["relogio", "aura", "espectro", "anel"]) { escolherVisual(v); o.push(APP.dataset.capa); }
        escolherVisual("relogio"); o.push(getComputedStyle(document.getElementById("disc")).borderRadius);
        return o;
      });
      assert.deepEqual(r, ["", "quadrada", "quadrada", "quadrada", "50%"]);
    },
  },
  {
    nome: "Relógio: o ponteiro fino anda um tracinho por batida, com o tranco de relógio",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const P = criarPonteiro(); let max = 0, a = 0;
        a = P.passo(1, 1); for (let i = 0; i < 40; i++) { a = P.passo(0, 1); max = Math.max(max, a); }
        const um = a; P.passo(0.6, 1); for (let i = 0; i < 40; i++) a = P.passo(0, 1);
        return { um, max, dois: a };
      });
      assert.ok(Math.abs(r.um - 6) < 0.05, `parou em ${r.um.toFixed(2)} graus (um tracinho são 6)`);
      assert.ok(r.max > 6.1, `passou um pouco do ponto e voltou (máximo ${r.max.toFixed(2)})`);
      assert.ok(Math.abs(r.dois - 12) < 0.05);
    },
  },
  {
    nome: "Relógio: ponteiro âmbar marca quanto da música passou; o da batida some no modo leve; no Vinil não há ponteiros",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        escolherVisual("relogio"); cfg.leve = false; APP.dataset.leve = "";
        const vis = (id) => getComputedStyle(document.getElementById(id)).display !== "none";
        pintarPonteiroTempo(0.25); const giro = document.getElementById("p-tempo").getAttribute("transform");
        document.querySelector(".dial").dataset.bate = "1";
        const o = { giro, tempo: vis("p-tempo"), bate: vis("p-bate") };
        APP.dataset.leve = "1"; o.bateLeve = vis("p-bate"); o.tempoLeve = vis("p-tempo"); APP.dataset.leve = "";
        escolherVisual("vinil"); o.vinil = vis("ponteiros"); escolherVisual("relogio");
        return o;
      });
      assert.deepEqual(r, { giro: "rotate(90.0 100 100)", tempo: true, bate: true, bateLeve: false, tempoLeve: true, vinil: false });
    },
  },
  {
    nome: "Relógio: o bumbo corre pelos tracinhos, de cima para baixo, em vez de empurrar todos",
    rodar: async (p) => {
      const r = await p.avaliar(() => ({
        cedoTopo: ondaNoTraco(3, [{ t: 0.1, f: 1 }]), cedoBase: ondaNoTraco(26, [{ t: 0.1, f: 1 }]),
        tardeTopo: ondaNoTraco(3, [{ t: 0.75, f: 1 }]), tardeBase: ondaNoTraco(25, [{ t: 0.75, f: 1 }]), nada: ondaNoTraco(10, []),
      }));
      assert.ok(r.cedoTopo > 0.3 && r.cedoBase < 0.01, `no começo: topo ${r.cedoTopo.toFixed(2)}, base ${r.cedoBase.toFixed(2)}`);
      assert.ok(r.tardeBase > r.tardeTopo * 5 && r.tardeBase > 0.05, `depois: topo ${r.tardeTopo.toFixed(3)}, base ${r.tardeBase.toFixed(3)}`);
      assert.equal(r.nada, 0);
    },
  },
  {
    nome: "Espectro, Anel, Neon e Barras: desenham com brilho, sem brilho no modo leve, e não deixam estado para o próximo",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); brilhoAura.desligado = false; brilhoAura.lento = 0; cfg.leve = false;
        const o = {};
        for (const [nome, fn] of [["espectro", desenharEspectro], ["anel", desenharAnel], ["neon", desenharNeon], ["barras", desenharBarras]]) {
          const cv = document.createElement("canvas"); cv.width = cv.height = 600; const c = cv.getContext("2d");
          let imgs = 0; const orig = c.drawImage; c.drawImage = function (...a) { imgs++; return orig.apply(this, a); };
          tinta = "#8855ff"; c.fillStyle = c.strokeStyle = tinta; fn(c, 600, true); const com = imgs;
          const estado = [c.globalCompositeOperation, c.globalAlpha, cfa.filter].join(" ");
          imgs = 0; cfg.leve = true; fn(c, 600, true); cfg.leve = false;
          o[nome] = [com, imgs, estado].join(" | ");
        }
        return o;
      });
      for (const k of ["espectro", "anel", "neon", "barras"]) assert.equal(r[k], "1 | 0 | source-over 1 none", k);
    },
  },
  {
    nome: "Anel gira devagar e ganha impulso no bumbo; Barras ganham tampinha de pico",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); playing = true; cfg.reage = true; fqV = 1;
        const cv = document.createElement("canvas"); cv.width = cv.height = 400; const c = cv.getContext("2d");
        escuta.O.bumbo.env = 0; let a0 = anelGiro; desenharAnel(c, 400, true); const calmo_ = anelGiro - a0;
        escuta.O.bumbo.env = 1; a0 = anelGiro; desenharAnel(c, 400, true); const bumbo = anelGiro - a0; escuta.O.bumbo.env = 0;
        nivelViz.fill(0.8); barPk.fill(0); barPv.fill(0); desenharBarras(c, 400, false); // sem som: os níveis descem, as tampinhas ficam
        for (let i = 0; i < 6; i++) desenharBarras(c, 400, false);
        playing = false;
        return { calmo_, bumbo, nivel: nivelViz[5], pico: barPk[5] };
      });
      assert.ok(r.calmo_ > 0 && r.bumbo > r.calmo_ * 4, `giro parado ${r.calmo_}, no bumbo ${r.bumbo}`);
      assert.ok(r.pico > r.nivel + 0.2, `tampinha em ${r.pico.toFixed(2)}, barra em ${r.nivel.toFixed(2)}`);
    },
  },
  {
    nome: "economia: ~60 desenhos por segundo em tela de 60, 90, 120 e 144 Hz, sem perder quadro com tranco, e ~10 com a música pausada",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const contar = (passos, alvo) => { const R = criarRitmo(); let n = 0, t = 1000, k = 0; while (t < 2000) { if (R.pode(t, alvo)) n++; t += passos[k++ % passos.length]; } return n; };
        return { hz60: contar([1000 / 60], 16.67), hz90: contar([1000 / 90], 16.67), hz120: contar([1000 / 120], 16.67), hz144: contar([1000 / 144], 16.67), tranco: contar([21.4, 11.9], 16.67), pausado: contar([1000 / 60], 100) };
      });
      assert.ok(r.hz60 >= 59, `a 60 Hz desenha todos os quadros: ${r.hz60}`);
      for (const k of ["hz90", "hz120", "hz144"]) assert.ok(r[k] >= 56 && r[k] <= 63, `${k}: ${r[k]} desenhos num segundo`);
      assert.ok(r.tranco >= 59, `tela de 60 Hz com quadros irregulares não pode perder desenho: ${r.tranco} de 60`);
      assert.ok(r.pausado >= 9 && r.pausado <= 11, `pausado: ${r.pausado}`);
    },
  },
  {
    nome: "Neon: na caixa as duas cores saem de lugares diferentes (a forma é refeita depois de deslocar)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); cfg.leve = true; cfg.reage = true; escuta.O.caixa.env = 1;
        const cv = document.createElement("canvas"); cv.width = cv.height = 400; const c = cv.getContext("2d"), seq = [];
        for (const m of ["translate", "beginPath", "fill"]) { const o = c[m]; c[m] = function (...a) { seq.push(m[0]); return o.apply(this, a); }; }
        tinta = "#8855ff"; desenharNeon(c, 400, true); escuta.O.caixa.env = 0; cfg.leve = false;
        return seq.join("");
      });
      assert.equal((r.match(/t/g) || []).length, 2, "duas cópias deslocadas: " + r);
      assert.ok(!r.includes("tf"), "pintar logo depois de deslocar usa a forma antiga, no mesmo lugar: " + r);
    },
  },
  {
    nome: "Vinil não mudou: os tracinhos levam o empurrão de sempre; só no Relógio o bumbo corre",
    rodar: async (p) => {
      const r = await p.avaliar(() => { batida = 1; ondasBumbo.length = 0; const o = [reforcoTraco(5, "vinil"), reforcoTraco(5, "relogio")]; batida = 0; return o; });
      assert.deepEqual(r, [0.35, 0]);
    },
  },
  {
    nome: "ligar o modo leve tira da tela as ondas e os pontinhos que estavam no meio do caminho",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        escolherVisual("relogio"); ondasBumbo.push({ t: 0.3, f: 1 }); nivPk.fill(0.5); ultPk.fill("20.2"); pontos.forEach((q) => q.setAttribute("visibility", "visible"));
        definirLeve(true);
        const o = { ondas: ondasBumbo.length, pico: nivPk[3], ponto: pontos[3].getAttribute("visibility") };
        definirLeve(false); return o;
      });
      assert.deepEqual(r, { ondas: 0, pico: 0, ponto: "hidden" });
    },
  },
  {
    nome: "economia: o desfoque do brilho é refeito quadro sim, quadro não (no outro reaproveita a imagem)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); brilhoAura.desligado = false; brilhoAura.lento = 0; cfg.leve = false;
        const cv = document.createElement("canvas"); cv.width = cv.height = 600; const c = cv.getContext("2d");
        let imgs = 0, refez = 0; const oi = c.drawImage, ol = cfa.clearRect;
        c.drawImage = function (...a) { imgs++; return oi.apply(this, a); }; cfa.clearRect = function (...a) { refez++; return ol.apply(this, a); };
        tinta = "#8855ff"; for (let i = 0; i < 6; i++) desenharEspectro(c, 600, true);
        const esp = [imgs, refez]; imgs = refez = 0; desenharAnel(c, 600, true); const troca = [imgs, refez];
        cfa.clearRect = ol; return { esp, troca };
      });
      assert.deepEqual(r.esp, [6, 3], "6 quadros: o brilho aparece nos 6, mas só é refeito em 3");
      assert.deepEqual(r.troca, [1, 1], "ao trocar de mostrador o brilho é refeito na hora");
    },
  },
  {
    nome: "as ondas do bumbo valem para todos os mostradores e não rodam no modo leve",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const quadros = (n) => new Promise((ok) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : ok()); f(); });
        ondasBumbo.length = 0; ondasBumbo.push({ t: 0, f: 1 }); cfg.leve = false; await quadros(10); const andou = ondasBumbo.length ? ondasBumbo[0].t : 1;
        ondasBumbo.length = 0; ondasBumbo.push({ t: 0, f: 1 }); cfg.leve = true; await quadros(10); const leve = ondasBumbo.length ? ondasBumbo[0].t : 1; cfg.leve = false; ondasBumbo.length = 0;
        return { andou, leve };
      });
      assert.ok(r.andou > 0.01, `a onda andou ${r.andou}`);
      assert.equal(r.leve, 0, "no modo leve a onda fica parada (ninguém desenha)");
    },
  },
];
