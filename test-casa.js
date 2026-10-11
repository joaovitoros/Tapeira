// Teste focado: Casa (hub da Cidade) — Fase 3.
// Conforto (offline) + Sala de Troféus (conquistas) + save (5 passos).
// Roda direto da fonte (raiz do projeto): node test-casa.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', e => {
        if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message);
    });
    await page.goto('file://' + path.resolve(__dirname, 'Caverna.html'));
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

    const out = [];
    const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

    const r = await page.evaluate(() => {
        window.ChamaSom = () => {};
        document.getElementById("infoModal")?.remove();
        UI.showInfo = () => {};
        const res = {};

        res.temApi = !!window.Tapeira?.Casa;

        // ---- Conforto: multiplicador e limite ----
        casaNivel = 0;
        const m0 = MultiplicadorOfflineCasa();
        const t0 = LimiteTempoOffline();
        casaNivel = 3;
        const m3 = MultiplicadorOfflineCasa();
        const t3 = LimiteTempoOffline();
        res.mult0 = m0;
        res.mult3 = m3;
        res.tempoCresce = t3 > t0;
        res.custo0 = CustoConfortoCasa(0);
        res.custo1 = CustoConfortoCasa(1);
        res.nivelClamp = CasaNivelValido(99);

        // ---- Compra de conforto ----
        casaNivel = 0;
        conhecimentoMug = 0;
        res.compraSemCM = CompraConfortoCasa(); // false
        conhecimentoMug = 1000;
        res.compraOk = CompraConfortoCasa(); // true
        res.nivelDepois = casaNivel;
        res.cmDepois = conhecimentoMug;
        casaNivel = CASA_MAX_NIVEL;
        conhecimentoMug = 1e9;
        res.compraNoMax = CompraConfortoCasa(); // false
        res.casaMax = CASA_MAX_NIVEL;

        // ---- Sala de Troféus ----
        conquistasComp = [0, 0, 0, 0, 0];
        trofeusExibidos = 0;
        res.trofeuBloqueado = !TrofeuDisponivel(0);
        res.alternarBloqueado = AlternarTrofeuCasa(0); // false
        conquistasComp = [1, 2, 0, 0, 0];
        res.trofeuDisponivel = TrofeuDisponivel(0) && TrofeuDisponivel(1) && !TrofeuDisponivel(2);
        res.alternar0 = AlternarTrofeuCasa(0); // true
        res.alternar1 = AlternarTrofeuCasa(1); // true
        res.contagem = TrofeusExibidosContagem(); // 2
        res.multTrofeus = MultiplicadorTrofeusCasa(); // 1.04
        res.trofeu0Exibido = TrofeuExibido(0);
        res.alternar0off = AlternarTrofeuCasa(0); // true (desliga)
        res.contagemDepois = TrofeusExibidosContagem(); // 1
        res.bitmask = trofeusExibidos;

        // ---- AddGold com troféu ----
        cmNivelGold = 0;
        conquistasComp = [0, 0, 0, 0, 0];
        trofeusExibidos = 0;
        gold = new GoldNumber(0);
        const gSem = AddGold(1000, false);
        trofeusExibidos = (1 << 0) | (1 << 1) | (1 << 2); // 3 troféus
        gold = new GoldNumber(0);
        const gCom = AddGold(1000, false);
        res.goldSem = gSem;
        res.goldCom = gCom;
        res.goldRazao = gCom / gSem;

        // ---- Offline: o conforto multiplica o gold offline (ponto único) ----
        const goldOfflineCom = (nivel) => {
            casaNivel = nivel;
            chanceBau = 0;            // sem baús -> sem aleatoriedade no gold
            andar = 50; mulGold = 1;
            danoJogador = 1e6; danoComp = 0; danoCritJogador = 0; chanceCrit = 0;
            MaxValidaBater = 30;
            vidaAndar = 100; vidaInimigo1 = 100; vidaInimigo2 = 100; vidaInimigo3 = 100; vidaInimigo4 = 100;
            goldCompanheiro = 0;
            recompensasOfflinePendentes = null;
            CalculaProgressoOffline(Date.now() - 3600000);
            const g = recompensasOfflinePendentes ? recompensasOfflinePendentes.gold : 0;
            recompensasOfflinePendentes = null;
            return g;
        };
        res.off0 = goldOfflineCom(0);
        res.off5 = goldOfflineCom(5);
        res.offRazao = res.off5 / res.off0;

        // ---- Save: os dois builders + validação ----
        casaNivel = 5;
        trofeusExibidos = 3;
        const obj = CriarObjetoSave();
        res.saveCasa = obj.casaNivel;
        res.saveTrofeus = obj.trofeusExibidos;
        const clone = (extra) => Object.assign(JSON.parse(JSON.stringify(obj)), extra);
        res.validaOk = (() => { try { ValidarSave(clone({})); return true; } catch { return false; } })();
        res.validaCasaRuim = (() => { try { ValidarSave(clone({ casaNivel: CASA_MAX_NIVEL + 1 })); return false; } catch { return true; } })();
        res.validaCasaNeg = (() => { try { ValidarSave(clone({ casaNivel: -1 })); return false; } catch { return true; } })();
        res.validaTrofeuRuim = (() => { try { ValidarSave(clone({ trofeusExibidos: (1 << CONQUISTAS_COMP.length) })); return false; } catch { return true; } })();
        res.limiteOfflineSalvo = (() => {
            // o limite do save inclui o conforto da Casa (senão um save com
            // recompensas offline grandes seria rejeitado no load)
            const tempo = maxTempoProgressoOffline + CasaBonusTempoOfflineMs(5);
            return tempo > maxTempoProgressoOffline;
        })();

        // ---- Resetar NÃO zera a Casa ----
        casaNivel = 4;
        trofeusExibidos = 2;
        Resetar();
        res.casaAposReset = casaNivel;
        res.trofeusAposReset = trofeusExibidos;

        return res;
    });

    check("API Tapeira.Casa existe", r.temApi === true);
    check("conforto nível 0 = ×1", r.mult0 === 1);
    check("conforto nível 3 = ×1.18", Math.abs(r.mult3 - 1.18) < 1e-9, r.mult3);
    check("limite offline cresce com conforto", r.tempoCresce === true);
    check("custo do conforto (20, 30)", r.custo0 === 20 && r.custo1 === 30, r.custo0 + "/" + r.custo1);
    check("nível é limitado ao máximo", r.nivelClamp === r.casaMax, r.nivelClamp);
    check("compra sem CM falha", r.compraSemCM === false);
    check("compra com CM funciona", r.compraOk === true && r.nivelDepois === 1, r.nivelDepois);
    check("CM é descontado (1000-20)", r.cmDepois === 980, r.cmDepois);
    check("compra no máximo falha", r.compraNoMax === false);

    check("troféu de conquista bloqueada não exibe", r.trofeuBloqueado === true && r.alternarBloqueado === false);
    check("troféu disponível conforme conquista", r.trofeuDisponivel === true);
    check("alternar troféus liga os bits", r.alternar0 === true && r.alternar1 === true);
    check("contagem de troféus exibidos", r.contagem === 2 && r.contagemDepois === 1, r.contagem + "→" + r.contagemDepois);
    check("troféu exibido dá +2% cada", Math.abs(r.multTrofeus - 1.04) < 1e-9, r.multTrofeus);
    check("troféu pode ser desligado", r.trofeu0Exibido === true && r.alternar0off === true && r.bitmask === 2, r.bitmask);

    check("troféu aumenta o gold ganho", Math.abs(r.goldRazao - 1.06) < 1e-9, r.goldRazao);
    check("gold sem troféu = 1000", Math.round(r.goldSem) === 1000, r.goldSem);

    check("conforto multiplica o gold offline (×1.30 no nível 5)",
        r.off0 > 0 && Math.abs(r.offRazao - 1.30) < 1e-6, r.offRazao);
    check("save grava casaNivel", r.saveCasa === 5, r.saveCasa);
    check("save grava trofeusExibidos", r.saveTrofeus === 3, r.saveTrofeus);
    check("validação aceita casa/troféus válidos", r.validaOk === true);
    check("validação rejeita conforto acima do teto", r.validaCasaRuim === true);
    check("validação rejeita conforto negativo", r.validaCasaNeg === true);
    check("validação rejeita troféu fora do bitmask", r.validaTrofeuRuim === true);
    check("limite offline do save inclui o conforto", r.limiteOfflineSalvo === true);

    check("Resetar NÃO zera o conforto", r.casaAposReset === 4, r.casaAposReset);
    check("Resetar NÃO zera os troféus", r.trofeusAposReset === 2, r.trofeusAposReset);

    await browser.close();
    let falhas = 0;
    for (const x of out) {
        if (!x.ok) falhas++;
        console.log((x.ok ? "OK   " : "FAIL ") + x.nome + (x.detalhe ? "  (" + x.detalhe + ")" : ""));
    }
    if (erros.length) { console.log("erros de pagina: " + erros.join(" | ")); falhas++; }
    console.log("\n" + (out.length - falhas) + "/" + out.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
