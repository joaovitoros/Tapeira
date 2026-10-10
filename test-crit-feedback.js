// Teste focado: feedback do crítico (#critFlash + tremor da cena) — só visual,
// sem capturar clique e com a classe do tremor saindo no animationend.
// Roda direto da fonte (raiz do projeto): node test-crit-feedback.js
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

        FeedbackCritico();
        const flash = document.getElementById("critFlash");
        check("flash criado no crítico", !!flash);
        check("flash não captura clique", flash && getComputedStyle(flash).pointerEvents === "none", flash ? getComputedStyle(flash).pointerEvents : "-");
        check("flash recebe a classe de animação", flash && flash.classList.contains("crit-flash--on"), flash ? flash.className : "-");
        check("cena treme (classe no <html>)", document.documentElement.classList.contains("crit-shake"));

        // a classe do tremor sai sozinha no animationend
        await new Promise(r => setTimeout(r, 400));
        check("tremor sai no animationend", !document.documentElement.classList.contains("crit-shake"));

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
