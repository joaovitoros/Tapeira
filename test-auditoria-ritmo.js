// ============================================================================
// BOT DE AUDITORIA DE RITMO (backlog item 14 — balanceamento)
// ----------------------------------------------------------------------------
// Roda o JOGO REAL (Caverna.html, direto da fonte) num Chromium headless e
// deixa o bot jogar sozinho, usando as PRÓPRIAS funções do jogo:
//   • ataque: chama DanoAutomatico(true,false) contando os ticks de 30 ms
//     (o ritmo de verdade: 1 golpe a cada MaxValidaBater ticks);
//   • avanço de andar: acontece sozinho dentro da Bater();
//   • loja: chama CompraDano/CompraSubVida/CompraBEspaco/... de verdade;
//   • baús: ColetaBau() quando há baú na tela;
//   • fim da run: quando o cronômetro de fuga (tempoAvancoInimigos) zera —
//     aí reseta com VoltaAndar() (portões +5%, CM, esmeraldas de verdade).
// A cada run registra: recorde, ritmo (segundos por andar), compras e o
// multiplicador permanente. No fim imprime a curva e onde o ritmo trava.
//
// Uso:  node test-auditoria-ritmo.js [resets=12] [politica=valor|dano] [seed=1]
// Nada de aleatório no resultado: o Math.random do jogo é semeado.
// ============================================================================
const { chromium } = require('playwright');
const path = require('path');

const arg = (nome, padrao) => {
    const a = process.argv.find(x => x.startsWith(nome + '='));
    return a ? a.split('=')[1] : padrao;
};
const RESETS = Number(arg('resets', 12));
const POLITICA = arg('politica', 'valor');
const SEED = Number(arg('seed', 1));

// Ordem de compra por política (todas as funções existem no jogo).
const POLITICAS = {
    // "valor": o item mais forte do jogo primeiro (corta vida), depois o CM
    // (dano/crítico compostos e +2 s de fundo), depois dano/crítico, ritmo e economia.
    valor: ['CompraSubVida', 'CompraCM:dano', 'CompraDano', 'CompraCM:crit', 'CompraDCrit',
        'CompraCM:comp', 'CompraComp1', 'CompraBEspaco', 'CompraCCrit', 'CompraCM:fuga',
        'CompraGold', 'CompraQTDAvanco', 'CompraAvanco', 'CompraCM:gold', 'CompraXP',
        'CompraVelComp', 'CompraAvGold', 'CompraEsmCM', 'CompraBau'],
    // "dano": um jogador que só investe em dano direto (pra comparar).
    dano: ['CompraDano', 'CompraDCrit', 'CompraCM:dano', 'CompraSubVida', 'CompraBEspaco',
        'CompraCCrit', 'CompraQTDAvanco', 'CompraAvanco', 'CompraGold', 'CompraBau']
};

// id do ITENS_PATENTE de cada compra (pra não comprar patente no meio do teste)
const PATENTE_DA_COMPRA = {
    CompraDano: 'dano', CompraDCrit: 'dcrit', CompraBEspaco: 'espaco', CompraCCrit: 'ccrit',
    CompraQTDAvanco: 'qtdavan', CompraSubVida: 'subvida', CompraAvanco: 'avan',
    CompraBau: 'bau', CompraVelComp: 'velcomp', CompraEsmBau: 'esmbau'
};

(async () => {
    const browser = await chromium.launch({ headless: true });
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await ctx.newPage();
    const erros = [];
    page.on('pageerror', e => { if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message); });

    await page.goto('file://' + path.resolve(__dirname, 'Caverna.html'));
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

    const saida = await page.evaluate(async ({ RESETS, ORDEM, PATENTE_DA_COMPRA, SEED }) => {
        // ---------- ambiente determinístico e silencioso ----------
        let semente = SEED >>> 0;
        Math.random = () => { semente = (semente * 1664525 + 1013904223) >>> 0; return semente / 4294967296; };

        const nada = () => { };
        ChamaSom = nada; MostraInfo = nada; window.MostraInfo = nada;
        const stubs = ['showInfo', 'showMilestone', 'showDamageNumber', 'showCurrencyReward',
            'showChestOpening', 'showAntReward', 'showFloorTransition', 'showObjectiveComplete',
            'updateObjective', 'updateMission', 'render', 'spawnChest', 'updateGoldenChestProgress',
            'updateResetAviso', 'MostraCelebracaoReset', 'showModal', 'closeModal', 'updateLoja',
            'showAntCollection', 'showStatus', 'updateResources', 'updateHud', 'updateSkillProgress',
            'updateObjective', 'showSkillUpgradePanel'];
        for (const s of stubs) if (typeof UI[s] === 'function') UI[s] = nada;
        for (const g of ['animarImpacto', 'animarMorte', 'animarEfeitoEletrico', 'animarHitKill',
            'animarVeneno', 'MostraStatus', 'AtualizaLojaGold', 'AtualizaMaximosLoja',
            'AutoSalvar', 'Salvar', 'TentaEventoAndar', 'MostraTutorialComp1', 'SincronizaIntervaloDanoComp']) {
            if (typeof window[g] === 'function') window[g] = nada;
        }
        AutoSaveLocal = () => true;
        TutorialComp1Pendente = () => false;
        // as funções de conquista rodam 1x a cada 400 golpes (as reais continuam valendo)
        for (const g of ['Conquistas', 'ConquistasComportamentais']) {
            if (typeof window[g] === 'function') {
                const real = window[g]; let n = 0;
                window[g] = () => { if (++n % 400 === 0) real(); };
            }
        }
        // mata os timers reais (o bot dirige o relógio)
        try { intervalos.forEach(clearInterval); intervalos.length = 0; } catch (e) { }
        jogoPausado = false;
        const chk = document.getElementById('manterAndar'); if (chk) chk.checked = false;
        const info = document.getElementById('infoModal'); if (info) info.remove();

        // ---------- helpers ----------
        const podeComprar = (nome) => {
            const id = PATENTE_DA_COMPRA[nome];
            if (!id) return true;
            const cfg = ITENS_PATENTE[id];
            return cfg && !cfg.noTeto();
        };
        const tentar = (nome) => {
            const partes = nome.split(':');
            const fn = partes[0], arg = partes[1];
            if (!podeComprar(fn)) return false;
            const f = window[fn];
            if (typeof f !== 'function') return false;
            const g0 = Number(gold), e0 = Number(esmeraldas), c0 = Number(conhecimentoMug);
            f(arg);
            return Number(gold) !== g0 || Number(esmeraldas) !== e0 || Number(conhecimentoMug) !== c0;
        };
        const comprar = () => {
            let comprou = true;
            while (comprou) {
                comprou = false;
                for (const nome of ORDEM) { if (tentar(nome)) { comprou = true; break; } }
                if (quantidadeBausDisponiveis > 0) ColetaBau();
            }
        };

        // ---------- uma run ----------
        function rodaRun(limiteAndar) {
            const porAndar = [];
            let parede = false;
            for (let i = 0; i < limiteAndar && !parede; i++) {
                comprar();
                const andarInicio = andar;
                const t0 = Date.now();
                let ticks = 0, ms = 0;
                while (andar === andarInicio) {
                    DanoAutomatico(true, false);
                    if (quantidadeBausDisponiveis > 0) ColetaBau();
                    ticks++; ms += 30;
                    if (ms >= 1000) { ms -= 1000; tempoAvancoInimigos--; }
                    if (ticks % 100 === 0) comprar();
                    if (tempoAvancoInimigos <= 0) { parede = true; break; }
                    if (ticks > 400000) { parede = true; break; }   // guarda
                }
                porAndar.push({ andar: andarInicio, seg: ticks * 30 / 1000, fim: parede });
                if (Date.now() - t0 > 20000) { parede = true; }      // guarda de tempo real
            }
            return { porAndar, recorde: Math.max(andar, ...porAndar.map(p => p.andar)), parede };
        }

        const runs = [];
        for (let r = 1; r <= RESETS; r++) {
            const { porAndar, recorde } = rodaRun(300);
            runs.push({
                run: r, recorde,
                porAndar,
                nivel: Number(nivelJogador),
                lvDano: Number(lvlDano), lvSub: Number(lvlSubVida), lvEspaco: Number(lvlBEspaco),
                maxBater: Number(MaxValidaBater), lvCCrit: Number(lvlCCrit), qtd: Number(qtdAvanco),
                avanco: Number(avanco), lvComp1: Number(lvlComp1), lvGold: Number(lvlGold),
                esmeraldas: Number(esmeraldas), cm: Number(conhecimentoMug), cmDano: Number(cmNivelDano),
                cmCrit: Number(cmNivelCrit), cmFuga: Number(cmNivelFuga),
                danoReset: Number(danoResetQtd), mulGold: Number(mulGold),
                danoJogador: Number(danoJogador), vidaAndar: Number(vidaAndar)
            });
            // reset de verdade (portões +5%, CM, esmeraldas)
            if (andar >= Math.min(andarVolta, 20)) VoltaAndar();
            if (andar > 5) { andar = 1; CarregarStatus(); CriarInimigos(); }  // rede de segurança
        }
        return { runs, errosPagina: [] };
    }, { RESETS, ORDEM: POLITICAS[POLITICA] || POLITICAS.valor, PATENTE_DA_COMPRA, SEED });

    await browser.close();

    // ---------- relatório ----------
    const f = (x) => x >= 1e6 ? x.toExponential(2) : x >= 1000 ? Math.round(x).toLocaleString('pt-BR') : String(Math.round(x * 100) / 100);
    console.log("BOT DE AUDITORIA — politica=" + POLITICA + "  resets=" + RESETS + "  seed=" + SEED + "\n");
    console.log("run | recorde | ritmo no topo (s/andar, ultimos 5) | nivel | dano | subvida | recarga | qtd | CM | CMdano | CMcrit | CMfuga | +portoes");
    for (const r of saida.runs) {
        const topo = r.porAndar.slice(-5).map(p => p.seg.toFixed(0)).join("/");
        console.log(
            String(r.run).padStart(3) + " | " + String(r.recorde).padStart(7) + " | " + topo.padStart(31) + " | " +
            String(r.nivel).padStart(5) + " | " + String(r.lvDano).padStart(4) + " | " + String(r.lvSub).padStart(7) + " | " +
            String(r.maxBater).padStart(7) + " | " + String(r.qtd).padStart(3) + " | " +
            String(r.cm).padStart(6) + " | " + String(r.cmDano).padStart(6) + " | " + String(r.cmCrit).padStart(6) + " | " +
            String(r.cmFuga).padStart(6) + " | " + String(r.danoReset).padStart(8));
    }
    console.log("\n-- curva de ritmo da 1ª run (segundos por andar) --");
    const p1 = saida.runs[0].porAndar;
    console.log("  " + p1.filter((_, i) => i % 3 === 0).map(p => p.andar + ":" + p.seg.toFixed(0)).join("  "));

    const marcos = [20, 25, 30, 35, 40, 50, 60, 80, 100];
    console.log("\n-- em que reset cada recorde foi atingido --");
    for (const m of marcos) {
        const r = saida.runs.find(x => x.recorde >= m);
        console.log("  andar " + String(m).padStart(3) + ": " + (r ? ("reset #" + r.run + "  (dano " + f(r.danoJogador) + ", subvida " + r.lvSub + " lv, recarga " + r.maxBater + ", qtd " + r.qtd + ")") : "NAO atingido em " + RESETS + " resets"));
    }
    const parede = saida.runs.find(x => x.recorde < saida.runs[saida.runs.length - 1].recorde);
    console.log("\n-- travamento --");
    console.log("  recorde final: andar " + saida.runs[saida.runs.length - 1].recorde +
        " | resets parados no mesmo recorde: " + (saida.runs.filter(x => x.recorde === saida.runs[saida.runs.length - 1].recorde).length));
    if (erros.length) console.log("erros de pagina: " + erros.slice(0, 3).join(" | "));
})();
