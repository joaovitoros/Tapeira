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
// Uso:  node test-auditoria-ritmo.js [resets=12] [politica=valor|dano|patente|cidade] [seed=1]
//         [cmStep=1.15] [cmBase=2] [fusao=fixo] [danoPreco=1.5] [danoTaxa=1.025]
// Nada de aleatório no resultado: o Math.random do jogo é semeado.
//
// POLÍTICA REALISTA: `patente` — o jogador compra o ingresso ★ quando o item bate
// no teto. A `valor`/`dano` PULAM o item no teto (podeComprar), e isso custa ~7
// andares no platô: com o ★ o teto sobe (subvida 60->118, recarga 16->10 ticks).
// Medido: patente 92 vs valor 85 no reset 8 (mesmo seed).
//
// O ANDAR É MEDIDO ATÉ O FIM: quem decide a parede é o cronômetro de fuga (teto de
// 750 s simulados por andar). A trava de tempo real (200 s) é só segurança — quando
// ela dispara, a linha sai truncada e não vale como parede do jogo.
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
// Cenários de balanceamento (opcional): sobrescrevem o jogo NA PÁGINA, sem tocar
// no código — pra medir antes/depois com o mesmo seed.
//   cmStep=1.4|1.25  → passo do preço da Loja do Conhecimento (padrão: o do jogo)
//   cmBase=1|2       → multiplicador de CM ganho no reset (1 = o do jogo)
const CM_STEP = arg('cmStep', '');
const CM_BASE = Number(arg('cmBase', 0));
// fusao=fixo → desliga o escalonamento do fundo com os abates (mede o efeito
// do escalonamento isolado, já que as SKILLS agora estão modeladas).
const FUSAO_FIXA = arg('fusao', '') === 'fixo';
// danoPreco=1.5 → devolve o passo antigo do preço do Dano (mede o antes/depois).
const DANO_PRECO = Number(arg('danoPreco', 0));
// danoTaxa=1.025 → devolve a taxa antiga do incremento do Dano (mede o antes/depois).
const DANO_TAXA = Number(arg('danoTaxa', 0));

// Ordem de compra por política (todas as funções existem no jogo).
const POLITICAS = {
    // "valor": o item mais forte do jogo primeiro (corta vida), depois o CM
    // (dano/crítico compostos e +2 s de fundo), depois dano/crítico, ritmo e economia.
    valor: ['CompraSubVida', 'CompraCM:dano', 'CompraDano', 'CompraCM:crit', 'CompraDCrit',
        'CompraCM:comp', 'CompraComp1', 'CompraComp3', 'CompraBEspaco', 'CompraCCrit',
        'CompraCM:fuga', 'CompraComp6',
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
    // Progresso AO VIVO: o bot emite uma linha por run. Sem isso, um run longo é
    // uma caixa preta (não dá pra saber se está na run 3 ou na 12, nem se travou).
    page.on('console', m => {
        const t = m.text();
        if (t.startsWith('AUDIT-RUN ')) console.log("  " + t.slice('AUDIT-RUN '.length));
    });

    await page.goto('file://' + path.resolve(__dirname, 'Caverna.html'));
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });
    // cmReset=1.25 → bônus do reset curto ×1.25 por reset (o jogo usa ×1.05).
    // Mede o lado da RENDA da escada do CM: o platô é limitado pela renda, não pelo
    // preço (medido: cmStep 1.25->1.15 adianta os níveis e depois converge).
    const CM_RESET = Number(arg('cmReset', 0));
    await page.evaluate(({ step, base, cmReset, fusaoFixa, danoPreco, danoTaxa }) => { window.__CM_STEP__ = step; window.__CM_BASE__ = base; window.__CM_RESET__ = cmReset; window.__FUSAO_FIXA__ = fusaoFixa; window.__DANO_PRECO__ = danoPreco; window.__DANO_TAXA__ = danoTaxa; },
        { step: CM_STEP ? Number(CM_STEP) : 0, base: CM_BASE || 0, cmReset: CM_RESET || 0, fusaoFixa: FUSAO_FIXA, danoPreco: DANO_PRECO || 0, danoTaxa: DANO_TAXA || 0 });

    const saida = await page.evaluate(async ({ RESETS, ORDEM, PATENTE_DA_COMPRA, SEED, COMPRAR_PATENTE, CIDADE_PRIMEIRO }) => {
        // ---------- cenário de balanceamento (opcional) ----------
        if (window.__CM_STEP__) {
            const passo = window.__CM_STEP__;
            PrecoLojaCM = (nivel) => Math.round(10 * Math.pow(passo, Math.max(0, Number(nivel) || 0)));
        }
        if (window.__CM_BASE__ && window.__CM_BASE__ !== 1) {
            const base = window.__CM_BASE__, original = MultiplicadorCM;
            MultiplicadorCM = () => base * original();
        }
        if (window.__CM_RESET__ && window.__CM_RESET__ !== 1.05) {
            // Troca SÓ o fator do reset curto dentro do MultiplicadorCM (o jogo usa
            // ×1.05 por reset curto): divide o antigo e multiplica o novo.
            const novo = window.__CM_RESET__, original = MultiplicadorCM;
            const curtos = () => Math.max(0, Math.floor(Number(resetsCurtosCM) || 0));
            MultiplicadorCM = () => original() / Math.pow(1.05, curtos()) * Math.pow(novo, curtos());
        }
        if (window.__DANO_PRECO__) PASSO_PRECO_DANO = window.__DANO_PRECO__;
        if (window.__DANO_TAXA__) {
            const t = ITENS_PATENTE.dano.taxas;
            for (let i = 0; i < t.length; i++) t[i] = window.__DANO_TAXA__ + 0.005 * i;
        }
        if (window.__FUSAO_FIXA__) {
            TempoFugaMax = () => {
                const base = 90 + cmNivelFuga * 2;
                const tempo = especializacao === 4 ? Math.floor(base * 0.2) : base;
                return (tempo + BonusFugaConquistaComp()) * Tapeira.ItensBuild.multFuga();
            };
        }
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
        // Em vez de engolir as mensagens do jogo, guarda (deduplicadas no fim):
        // é o que revela POR QUE a Cidade não compra.
        const mensagens = [];
        const captura = (...a) => { const t = a.map(v => String(v)).join(" "); if (mensagens.length < 500) mensagens.push(t); };
        MostraInfo = captura; window.MostraInfo = captura;
        if (typeof UI === "object" && UI) UI.showInfo = captura;
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
            // politica "patente": não pula o item no teto — a própria CompraX
            // roteia pro CompraPatenteLoja(id) e sobe a ★
            if (COMPRAR_PATENTE) return true;
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
        // ---- Cidade (destrava no andar 80): usa os prédios pelas APIs deles ----
        const errosCidade = [];
        const estadoCidade = { temObjeto: null, temAPIs: null, desbloqueada: null, erro: null, flagCidadePrimeiro: null, goldNaTentativa: null, custoPesquisa: null, tentativas: 0 };
        estadoCidade.flagCidadePrimeiro = !!CIDADE_PRIMEIRO;
        const cidadeAberta = () => {
            try {
                if (estadoCidade.desbloqueada === null && Number(maxAndar) >= 80) {
                    estadoCidade.temObjeto = !!(window.Tapeira && window.Tapeira.Cidade);
                    estadoCidade.temAPIs = !!(window.Tapeira && window.Tapeira.Pesquisa
                        && typeof window.Tapeira.Pesquisa.comprarItem === "function");
                    estadoCidade.desbloqueada = window.Tapeira?.Cidade?.desbloqueada
                        ? String(window.Tapeira.Cidade.desbloqueada()) : "sem funcao";
                }
                return !!(window.Tapeira && window.Tapeira.Cidade && window.Tapeira.Cidade.desbloqueada && window.Tapeira.Cidade.desbloqueada());
            } catch (e) {
                estadoCidade.erro = String((e && e.message) || e);
                return false;
            }
        };
        const comprarCidade = () => {
            const C = window.Tapeira || {};
            let fez = false;
            estadoCidade.tentativas++;
            if (estadoCidade.goldNaTentativa === null) {
                estadoCidade.goldNaTentativa = Number(gold);
                estadoCidade.custoPesquisa = (C.Pesquisa && typeof C.Pesquisa.custoItem === "function")
                    ? Number(C.Pesquisa.custoItem(0)) : "sem custoItem";
            }
            const tenta = (f) => {
                try {
                    const g0 = Number(gold), e0 = Number(esmeraldas), m0 = Number(conhecimentoMug), t0 = Number(ticketsMug);
                    f();
                    const mudou = Number(gold) !== g0 || Number(esmeraldas) !== e0 || Number(conhecimentoMug) !== m0 || Number(ticketsMug) !== t0;
                    if (mudou) estadoCidade.compras = (estadoCidade.compras || 0) + 1;
                    return mudou;
                } catch (e) {
                    if (errosCidade.length < 6) errosCidade.push(String((e && e.message) || e));
                    return false;
                }
            };
            if (C.Pesquisa && typeof C.Pesquisa.comprarItem === "function") {
                // Os ids da Pesquisa são os dos ITENS DE BUILD (12) e o nível máx é
                // PESQUISA_ITEM_MAX = 5. O custo é em CONHECIMENTO MUG (não ouro).
                const idsItens = ["adaga", "escudo", "moedas", "mapa", "relogio", "grimorio",
                    "pocaoVerde", "pocaoRubra", "lanterna", "colarFormigas", "bauPortatil", "esmeralda"];
                for (const id of idsItens) if (tenta(() => C.Pesquisa.comprarItem(id))) fez = true;
                for (const ini of (C.Pesquisa.INIMIGOS || [])) {
                    if (tenta(() => C.Pesquisa.comprarInimigo(ini.id))) fez = true;
                }
            }
            if (C.Cristal && typeof C.Cristal.comprarNivel === 'function' && tenta(() => C.Cristal.comprarNivel())) fez = true;
            if (C.Fabrica && typeof C.Fabrica.comprarNivel === 'function' && tenta(() => C.Fabrica.comprarNivel())) fez = true;
            if (C.Mercado && typeof C.Mercado.comprarReputacao === 'function' && tenta(() => C.Mercado.comprarReputacao())) fez = true;
            if (C.Casa && typeof C.Casa.comprarConforto === 'function' && tenta(() => C.Casa.comprarConforto())) fez = true;
            if (C.Trofeus && typeof C.Trofeus.comprar === 'function') {
                for (let i = 0; i < 10; i++) if (tenta(() => C.Trofeus.comprar(i))) fez = true;
            }
            if (C.Fazenda && typeof C.Fazenda.coletar === 'function') { try { C.Fazenda.coletar(); } catch (e) { } }
            return fez;
        };

        const comprar = () => {
            let comprou = true;
            while (comprou) {
                comprou = false;
                if (CIDADE_PRIMEIRO && cidadeAberta() && comprarCidade()) comprou = true;
                for (const nome of ORDEM) { if (tentar(nome)) { comprou = true; break; } }
                // Especialização (build): Força Bruta (+40% de dano) — troca barata,
                // desbloqueia depois do 1º reset e zera no Resetar (recompra por run).
                if (especializacao === 0 && typeof EspecializacaoDesbloqueada === 'function'
                    && EspecializacaoDesbloqueada(1) && gold >= PrecoEspecializacao()) {
                    const g0 = Number(gold);
                    EscolheEspecializacao(1);
                    if (Number(gold) !== g0) comprou = true;
                }
                if (!CIDADE_PRIMEIRO && cidadeAberta() && comprarCidade()) comprou = true;
                // Skills e perks: gasta os pontos em escolhas ALEATÓRIAS (modela
                // um jogador típico). É daqui que sai o perkFuga (o que restaura
                // o cronômetro de fuga) e o perk de dano.
                let treinou = false;
                if (typeof pontosHabilidade !== "undefined" && pontosHabilidade > 0 && typeof EvoluiSkill === "function") {
                    const ids = (typeof habilidadesCombate !== "undefined" && habilidadesCombate.length)
                        ? habilidadesCombate.map(s => s.id) : [];
                    for (let k = 0; k < 40 && pontosHabilidade > 0 && ids.length; k++) {
                        const id = ids[Math.floor(Math.random() * ids.length)];
                        try { if (EvoluiSkill(id)) treinou = true; else break; } catch (e) { break; }
                    }
                }
                if (typeof PontosPerkDisponiveis === "function" && typeof CompraPerk === "function"
                    && PontosPerkDisponiveis() > 0) {
                    const perks = ["dano", "escape", "gold", "electric", "frenzy"];
                    for (let k = 0; k < 20 && PontosPerkDisponiveis() > 0; k++) {
                        const id = perks[Math.floor(Math.random() * perks.length)];
                        try { if (CompraPerk(id)) treinou = true; else break; } catch (e) { break; }
                    }
                }
                if (treinou) comprou = true;
                if (quantidadeBausDisponiveis > 0) ColetaBau();
            }
        };

        // ---------- uma run ----------
        function rodaRun(limiteAndar) {
            const porAndar = [];
            let parede = false, motivoParede = null, snapshotParede = null;
            // Foto do INSTANTE da parede: é o que diz POR QUE o andar foi perdido
            // (fuga zerada = DPS insuficiente; ticks = andar infinito; tempo-real = artefato).
            const tiraFoto = (motivo, ticks) => {
                let vidaMax = 0, vidaSoma = 0;
                for (let e = 1; e <= 4; e++) {
                    const v = Number(window["vidaInimigo" + e]) || 0;
                    if (v > vidaMax) vidaMax = v;
                    vidaSoma += v;
                }
                return {
                    andar: Number(andar), motivo,
                    derrotados: Number(inimigosDerrotados), quota: Number(QuotaAndar()),
                    segNoAndar: Math.round(ticks * 30 / 1000),
                    danoJogador: Number(danoJogador), vidaMax, vidaSoma,
                    fugaMax: Number(TempoFugaMax()), fugaRestante: Number(tempoAvancoInimigos),
                    recarga: Number(MaxValidaBater), qtd: Number(qtdAvanco),
                    subVida: Number(subVidaInimigo), cmFuga: Number(cmNivelFuga), cmDano: Number(cmNivelDano)
                };
            };
            for (let i = 0; i < limiteAndar && !parede; i++) {
                comprar();
                const andarInicio = andar;
                const t0 = Date.now();
                let ticks = 0, ms = 0;
                // Orçamento do andar: no máximo 25000 ticks = 750 s simulados. O
                // simulador é ~30x mais lento que o relógio do jogo, então este é o
                // teto que cabe no tempo real — e cobre o cronômetro de fuga dos
                // andares que o bot alcança (fuga ~700 s no andar 95).
                const ticksMaxAndar = 25000;
                while (andar === andarInicio) {
                    DanoAutomatico(true, false);
                    if (quantidadeBausDisponiveis > 0) ColetaBau();
                    // Skill "Pausa da fuga" (libera no andar 35): enquanto ativa o
                    // cronômetro NÃO corre. A própria função do jogo decide se está
                    // pronta (abates >= exigido) — chamar sempre é seguro.
                    if (typeof AtivaHabilidadeCombate === "function") {
                        try { AtivaHabilidadeCombate("escape"); } catch (e) { }
                    }
                    ticks++; ms += 30;
                    if (ms >= 1000) {
                        ms -= 1000;
                        // a pausa da fuga impede o tique do cronômetro
                        if (typeof AtualizaRelogioHabilidade !== "function" || !AtualizaRelogioHabilidade()) tempoAvancoInimigos--;
                    }
                    if (ticks % 100 === 0) comprar();
                    if (tempoAvancoInimigos <= 0) {
                        // perkFuga (até 50%): restaura o fundo ao máximo em vez de fugir
                        const chance = Math.min(50, Number(typeof perkFuga !== "undefined" ? perkFuga : 0) * 10);
                        if (chance > 0 && Math.random() * 100 < chance) tempoAvancoInimigos = TempoFugaMax();
                        else {
                            parede = true; motivoParede = "fuga zerada (DPS insuficiente)";
                            snapshotParede = tiraFoto(motivoParede, ticks); break;
                        }
                    }
                    if (ticks > ticksMaxAndar) {                          // prazo da fuga (2x) esgotado
                        parede = true; motivoParede = "prazo da fuga esgotado (" + Math.round(ticksMaxAndar * 0.03) + " s)";
                        snapshotParede = tiraFoto(motivoParede, ticks); break;
                    }
                }
                porAndar.push({ andar: andarInicio, seg: ticks * 30 / 1000, fim: parede });
                if (Date.now() - t0 > 200000) {                      // trava de segurança (200 s reais)
                    parede = true;
                    if (!motivoParede) {
                        motivoParede = "trava de tempo real da simulacao (200 s)";
                        snapshotParede = tiraFoto(motivoParede, ticks);
                    }
                }
            }
            return { porAndar, recorde: Math.max(andar, ...porAndar.map(p => p.andar)), parede, motivoParede, snapshotParede };
        }

        const runs = [];
        for (let r = 1; r <= RESETS; r++) {
            const { porAndar, recorde, snapshotParede } = rodaRun(300);
            runs.push({
                run: r, recorde,
                porAndar, snapshotParede,
                nivel: Number(nivelJogador),
                lvDano: Number(lvlDano), lvSub: Number(lvlSubVida), lvEspaco: Number(lvlBEspaco),
                maxBater: Number(MaxValidaBater), lvCCrit: Number(lvlCCrit), qtd: Number(qtdAvanco),
                avanco: Number(avanco), lvComp1: Number(lvlComp1), lvGold: Number(lvlGold),
                esmeraldas: Number(esmeraldas), cm: Number(conhecimentoMug), cmDano: Number(cmNivelDano),
                cmCrit: Number(cmNivelCrit), cmFuga: Number(cmNivelFuga),
                danoReset: Number(danoResetQtd), mulGold: Number(mulGold),
                danoJogador: Number(danoJogador), vidaAndar: Number(vidaAndar)
            });
            // Linha de progresso por run (o Node imprime ao vivo via page.on('console')).
            console.log("AUDIT-RUN run " + r + "/" + RESETS + " | recorde " + recorde + " | " +
                (snapshotParede
                    ? snapshotParede.derrotados + "/" + snapshotParede.quota + " abates (" + snapshotParede.motivo + ")"
                    : "passou os 300 andares"));
            // reset de verdade (portões +5%, CM, esmeraldas)
            if (andar >= Math.min(andarVolta, 20)) VoltaAndar();
            if (andar > 5) { andar = 1; CarregarStatus(); CriarInimigos(); }  // rede de segurança
        }
        return { runs, errosPagina: [], errosCidade, estadoCidade, mensagens };
    }, { RESETS, ORDEM: POLITICAS[POLITICA] || POLITICAS.valor, PATENTE_DA_COMPRA, SEED, COMPRAR_PATENTE: POLITICA === "patente", CIDADE_PRIMEIRO: POLITICA === "cidade" });

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

    // POR QUE parou: a foto do andar perdido em cada run. É o diagnóstico do teto.
    console.log("\n-- por que parou (foto do andar perdido, por run) --");
    for (const r of saida.runs) {
        const s = r.snapshotParede;
        if (!s) { console.log("  run " + String(r.run).padStart(2) + ": NAO parou (passou os 300 andares do teste)"); continue; }
        const golpes = (s.danoJogador > 0 && s.vidaMax > 0) ? (s.vidaMax / s.danoJogador).toFixed(0) : "?";
        console.log("  run " + String(r.run).padStart(2) + ": andar " + String(s.andar).padStart(3) +
            " | " + s.motivo + " | abates " + s.derrotados + "/" + s.quota + " em " + s.segNoAndar + "s" +
            " | fuga " + s.fugaMax + "s | dano " + f(s.danoJogador) + " vs vida " + f(s.vidaMax) +
            " (" + golpes + " golpes p/ matar) | CMdano " + s.cmDano + " CMfuga " + s.cmFuga);
    }
    console.log("\ncidade: " + JSON.stringify(saida.estadoCidade) + " | erros das compras: " + (saida.errosCidade.length ? saida.errosCidade.join(" | ") : "nenhum"));
    const contagem = new Map();
    for (const m of (saida.mensagens || [])) contagem.set(m, (contagem.get(m) || 0) + 1);
    const top = [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
    console.log("\nmensagens do jogo (top 12, deduplicadas):");
    for (const par of top) console.log("  (" + par[1] + "x) " + par[0].slice(0, 120));
    if (erros.length) console.log("erros de pagina: " + erros.slice(0, 3).join(" | "));
})();
