// Teste focado: Cristal (hub da Cidade) — Fase 8.
// Amplia gold/XP/produção conforme a profundidade do reset + save.
// Roda direto da fonte (raiz do projeto): node test-cristal.js
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
        UI.showCurrencyReward = () => {};
        const res = {};

        res.temApi = !!window.Tapeira?.Cristal;
        res.max = window.Tapeira.Cristal.MAX_NIVEL;

        // ---- multiplicador e profundidade ----
        cristalNivel = 0; andarVolta = 15;
        res.m0 = MultiplicadorCristal();
        cristalNivel = 5; andarVolta = 15;
        res.m5base = MultiplicadorCristal();   // 1 + 0.02*5*1 = 1.10
        andarVolta = 75;
        res.m5fundo = MultiplicadorCristal();  // 1 + 0.02*5*5 = 1.50
        res.profFundo = CristalProfundidade(); // 5

        // ---- custo/compra ----
        cristalNivel = 0; andarVolta = 15;
        res.custo0 = CustoCristalNivel(0);
        conhecimentoMug = 0;
        res.semCM = CompraCristalNivel(); // false
        conhecimentoMug = 100000;
        res.ok = CompraCristalNivel();    // true
        res.nivel = cristalNivel;
        cristalNivel = CRISTAL_MAX_NIVEL;
        conhecimentoMug = 1e9;
        res.noMax = CompraCristalNivel(); // false

        // ---- aplica no gold (AddGold) ----
        cmNivelGold = 0; conquistasComp = [0, 0, 0, 0, 0]; especializacao = 0;
        andarVolta = 15;
        cristalNivel = 0; gold = new GoldNumber(0);
        const g0 = AddGold(1000, false);
        cristalNivel = 5; gold = new GoldNumber(0);
        const g5 = AddGold(1000, false);
        res.goldRazao = g5 / g0; // 1.10

        // ---- aplica na produção da Fazenda ----
        cristalNivel = 0; res.iv0 = IntervaloFazendaMs(1, 0);
        cristalNivel = 5; res.iv5 = IntervaloFazendaMs(1, 0);

        // ---- aplica no XP ----
        cristalNivel = 0; nivelJogador = 1; xpAtual = 0;
        const xp0 = GanhaXP(10, 50, 1000);
        cristalNivel = 5; nivelJogador = 1; xpAtual = 0;
        const xp5 = GanhaXP(10, 50, 1000);
        res.xp0 = xp0; res.xp5 = xp5; res.xpMaior = xp5 > xp0;

        // ---- save ----
        cristalNivel = 4;
        const obj = CriarObjetoSave();
        res.save = obj.cristalNivel;
        const clone = (extra) => Object.assign(JSON.parse(JSON.stringify(obj)), extra);
        res.validaOk = (() => { try { ValidarSave(clone({})); return true; } catch { return false; } })();
        res.validaAlto = (() => { try { ValidarSave(clone({ cristalNivel: CRISTAL_MAX_NIVEL + 1 })); return false; } catch { return true; } })();
        res.validaNeg = (() => { try { ValidarSave(clone({ cristalNivel: -1 })); return false; } catch { return true; } })();

        // ---- Resetar NÃO zera ----
        cristalNivel = 3;
        Resetar();
        res.aposReset = cristalNivel;

        return res;
    });

    check("API Tapeira.Cristal existe", r.temApi === true);
    check("nível 0 não altera nada (×1)", r.m0 === 1, r.m0);
    check("nível 5 no reset base = ×1.10", Math.abs(r.m5base - 1.10) < 1e-9, r.m5base);
    check("nível 5 com reset fundo = ×1.50", Math.abs(r.m5fundo - 1.50) < 1e-9, r.m5fundo);
    check("profundidade satura em ×5", r.profFundo === 5, r.profFundo);
    check("custo do nível 0 = 25000 CM", r.custo0 === 25000, r.custo0);
    check("compra sem CM falha", r.semCM === false);
    check("compra com CM funciona", r.ok === true && r.nivel === 1, r.nivel);
    check("Cristal no máximo falha", r.noMax === false);
    check("gold ganho é ampliado (×1.10)", Math.abs(r.goldRazao - 1.10) < 1e-9, r.goldRazao);
    check("produção da Fazenda acelera", r.iv5 < r.iv0, r.iv0 + "→" + r.iv5);
    check("XP ganho é ampliado", r.xpMaior === true, r.xp0 + "→" + r.xp5);
    check("save grava cristalNivel", r.save === 4, r.save);
    check("validação aceita Cristal válido", r.validaOk === true);
    check("validação rejeita nível acima do teto", r.validaAlto === true);
    check("validação rejeita nível negativo", r.validaNeg === true);
    check("Resetar NÃO zera o Cristal", r.aposReset === 3, r.aposReset);

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
