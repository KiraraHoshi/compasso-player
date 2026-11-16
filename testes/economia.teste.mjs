// 1.25.1 Economia de bateria e calor: fluidez máxima é opção, e fora do Tocando agora o app não analisa o som.
import assert from "node:assert/strict";

export default [
  {
    nome: "fluidez máxima: desligada desenha a ~60 por segundo; ligada usa a taxa da tela; o modo leve manda mais",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        const contar = (alvo) => { const R = criarRitmo(); let n = 0; for (let t = 1000; t < 2000; t += 1000 / 120) if (R.pode(t, alvo)) n++; return n; };
        const o = {}; cfg.leve = false;
        cfg.fluido = false; o.normal = contar(alvoQuadro());
        cfg.fluido = true; o.fluido = contar(alvoQuadro());
        cfg.leve = true; o.leve = contar(alvoQuadro()); cfg.leve = false; cfg.fluido = false;
        return o;
      });
      assert.ok(r.normal >= 58 && r.normal <= 62, `normal em tela de 120 Hz: ${r.normal}`);
      assert.ok(r.fluido >= 118, `fluidez máxima em tela de 120 Hz: ${r.fluido}`);
      assert.ok(r.leve <= 62, `com o modo leve a fluidez máxima não vale: ${r.leve}`);
    },
  },
  {
    nome: "fluidez máxima: fica em Ajustes › Aparência, desligada de fábrica, com o aviso do custo",
    hash: "temas",
    rodar: async (p) => {
      await p.clicar('[data-porta="aparencia"]');
      const antes = await p.avaliar(() => ({ cfg: !!cfg.fluido, aviso: document.getElementById("tm").textContent.includes("gasta mais bateria") }));
      assert.deepEqual(antes, { cfg: false, aviso: true });
      await p.clicar("#tm [data-alternar-fluido]");
      assert.deepEqual(await p.avaliar(() => [cfg.fluido, document.querySelector("#tm [data-alternar-fluido]").getAttribute("aria-checked")]), [true, "true"]);
    },
  },
  {
    nome: "fora do Tocando agora o app não analisa o som (é onde a maioria deixa o app enquanto ouve)",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const quadros = (n) => new Promise((ok) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : ok()); f(); });
        tocar(); await quadros(6);
        let n = 0; for (const a of [an, anD]) { const o = a.getByteFrequencyData; a.getByteFrequencyData = function (...x) { n++; return o.apply(this, x); }; }
        await quadros(8); const dentro = n; n = 0;
        ir("inicio"); await quadros(8); const fora = n;
        pausar(); return { dentro, fora };
      });
      assert.ok(r.dentro >= 6, `no Tocando agora o som é analisado: ${r.dentro} leituras`);
      assert.equal(r.fora, 0, "fora do Tocando agora, nenhuma leitura");
    },
  },
  {
    nome: "com o app escondido, o ramo dos desenhos é desligado sem encostar no caminho do som, e volta quando o app aparece",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); const lig = [];
        for (const [no, nome] of [[atrasoViz, "ramo"], [saidaEra, "SOM"]]) for (const m of ["connect", "disconnect"]) { const o = no[m]; no[m] = function (...x) { lig.push(nome + ":" + m); return o.apply(this, x); }; }
        const esconder = (v) => { Object.defineProperty(document, "visibilityState", { configurable: true, get: () => v }); dispatchEvent(new Event("visibilitychange")); };
        esconder("hidden"); const escondido = ramoVizLigado; esconder("hidden"); esconder("visible"); const visivel = ramoVizLigado; esconder("visible");
        return { lig, escondido, visivel };
      });
      assert.deepEqual(r, { lig: ["ramo:disconnect", "ramo:connect"], escondido: false, visivel: true }, "desliga e religa uma vez cada, só no ramo dos desenhos");
    },
  },
  {
    nome: "ao voltar para o app, a escuta espera o som chegar ao ramo dos desenhos (sem soco falso na capa)",
    rodar: async (p) => {
      const r = await p.avaliar(() => {
        prepararAudio(); ligarRamoViz(false); ligarRamoViz(true);
        let n = 0; const o = anD.getByteFrequencyData; anD.getByteFrequencyData = function (...x) { n++; return o.apply(this, x); };
        const agora = performance.now(), g = ouvirBatidas(agora), cedo = n, g2 = ouvirBatidas(agora + 2000);
        return { golpes: g.bumbo + g.caixa + g.prato, cedo, depois: n };
      });
      assert.deepEqual(r, { golpes: 0, cedo: 0, depois: 1 }, "logo depois de religar não lê nem conta golpe; 2 s depois volta a ouvir");
    },
  },
  {
    nome: "com o modo carro por cima do Tocando agora, o som também não é analisado",
    hash: "tocando",
    rodar: async (p) => {
      const r = await p.avaliar(async () => {
        const quadros = (n) => new Promise((ok) => { const f = () => (n-- > 0 ? requestAnimationFrame(f) : ok()); f(); });
        tocar(); await quadros(6); abrirCarro(); await quadros(2);
        let n = 0; for (const a of [an, anD]) { const o = a.getByteFrequencyData; a.getByteFrequencyData = function (...x) { n++; return o.apply(this, x); }; }
        await quadros(8); fecharCarro(); pausar(); return n;
      });
      assert.equal(r, 0);
    },
  },
];
