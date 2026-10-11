// Teste focado: bônus de dano por nível do jogador (+15% somado por nível).
// Roda direto da fonte (raiz do projeto): node test-dano-nivel.js
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

        check("constante = +15% por nível", DANO_POR_NIVEL === 0.15 && DANO_POR_NIVEL_PCT === 15, DANO_POR_NIVEL_PCT);

        // Velocista (conquista) multiplica por fora; isolamos o fator de nível
        const conquista = MultiplicadorDanoConquistaComp();
        const mult = n => { nivelJogador = n; return MultiplicadorDanoNivel() / conquista; };

        check("nível 1 = ×1 (sem bônus)", Math.abs(mult(1) - 1) < 1e-9, mult(1));
        check("nível 11 = ×2,5", Math.abs(mult(11) - 2.5) < 1e-9, mult(11));
        check("nível 101 = ×16 (100 × 15%)", Math.abs(mult(101) - 16) < 1e-9, mult(101));
        check("nível 201 = ×31", Math.abs(mult(201) - 31) < 1e-9, mult(201));

        // painel de skills reflete o novo valor
        nivelJogador = 101;
        totalNiveis = 0;
        UI.showSkillUpgradePanel();
        const txt = document.getElementById("skill-player-bonus")?.textContent || "";
        check("painel mostra +1500% de dano (100 níveis × 15%)", txt.includes("+1500% de dano"), txt);

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
