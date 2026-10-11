// Teste focado: pulso no contador de gold e na barra de XP ao ganhar
// (script/ui-combate.js -> PulsaElemento). Só visual, some quando a animação termina.
// Roda direto da fonte (raiz do projeto): node test-gold-xp-pulso.js
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

    const resultados = await page.evaluate(async () => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

        UI.showCurrencyReward("gold", 5);
        const cont = document.getElementById("contGold");
        check("contador de gold pulsa ao ganhar", cont.classList.contains("contador--pulso"), cont.className);

        UI.showSkillUpgradePanel();
        UI.showXPGain(5);
        const fill = document.getElementById("skill-player-xp-fill");
        check("barra de XP pulsa ao ganhar", fill && fill.classList.contains("xp-fill--pulso"),
            fill ? fill.className : "sem barra");

        await new Promise(r => setTimeout(r, 500));
        check("pulso do gold some quando a animação termina", !cont.classList.contains("contador--pulso"), cont.className);

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
