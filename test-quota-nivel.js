// Teste focado: a quota do andar reduz inimigos com custo crescente por nível
// (base −1 por nível; a cada 5 inimigos o próximo −1 exige +1 nível por inimigo).
// Roda direto da fonte (raiz do projeto): node test-quota-nivel.js
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

    const resultados = await page.evaluate(() => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

        // ---- curva de custo crescente (nível → inimigos reduzidos) ----
        const tabela = [
            [1, 1], [4, 4], [5, 5], [7, 6], [10, 7], [15, 10], [20, 11], [30, 15],
            [50, 20], [75, 25], [100, 29], [150, 36], [300, 52], [500, 68]
        ];
        for (const [nivel, esperado] of tabela) {
            check(`BonusQuotaNivel(${nivel}) = −${esperado}`,
                BonusQuotaNivel(nivel) === esperado, BonusQuotaNivel(nivel));
        }

        // ---- nunca diminui quando o nível sobe ----
        let monotono = true;
        for (let n = 0; n < 600; n++) {
            if (BonusQuotaNivel(n + 1) < BonusQuotaNivel(n)) { monotono = false; break; }
        }
        check("curva é monótona (nunca reduz menos ao subir de nível)", monotono);

        // ---- QuotaAndar aplica o bônus de nível ----
        totalNiveis = 0;
        nivelJogador = 50;
        qtdInimigosAndar = 100;
        check("QuotaAndar no nível 50 (100 − 20)", QuotaAndar() === 80, QuotaAndar());

        nivelJogador = 1;
        check("QuotaAndar no nível 1 (100 − 1)", QuotaAndar() === 99, QuotaAndar());

        // ---- mínimo de 1 mesmo com bônus enorme ----
        nivelJogador = 100000;
        qtdInimigosAndar = 3;
        check("nunca avança sem ao menos um abate (mínimo 1)", QuotaAndar() === 1, QuotaAndar());

        // ---- total exibido no painel bate com o QuotaAndar ----
        nivelJogador = 29;      // BonusQuotaNivel(29) = 14
        totalNiveis = 1600;     // conquista = floor(1600/100) = 16
        check("BonusQuotaConquista = conquista de nível", BonusQuotaConquista() === 16, BonusQuotaConquista());
        check("BonusQuotaTotal = nível + conquista (14 + 16)", BonusQuotaTotal() === 30, BonusQuotaTotal());
        qtdInimigosAndar = 100;
        check("QuotaAndar usa o mesmo total (100 − 30)", QuotaAndar() === 70, QuotaAndar());

        UI.showSkillUpgradePanel();
        const bonusTxt = document.getElementById("skill-player-bonus")?.textContent || "";
        check("painel de skills mostra −30 inimigos (mesma fonte do QuotaAndar)", bonusTxt.includes("30 inimigos para avançar"), bonusTxt);

        return out;
    });

    await browser.close();
    let falhas = 0;
    for (const r of resultados) {
        if (!r.ok) falhas++;
        console.log((r.ok ? "OK   " : "FAIL ") + r.nome + (r.detalhe ? "  (" + r.detalhe + ")" : ""));
    }
    if (erros.length) { console.log("erros de pagina: " + erros.join(" | ")); falhas++; }
    console.log("\n" + (resultados.length - falhas) + "/" + resultados.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
