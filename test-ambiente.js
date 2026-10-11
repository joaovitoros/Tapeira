// Teste focado: ambiente da caverna (poeira/atmosfera da arena) — o keyframe
// cave-atmosphere-drift estava aninhado dentro de outro (CSS inválido) e a
// camada nunca se movia. Aqui garantimos que as animações estão aplicadas.
// Roda direto da fonte (raiz do projeto): node test-ambiente.js
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

        const raiz = document.getElementById("game-root");
        const after = getComputedStyle(raiz, "::after");
        check("atmosfera tem o drift (keyframe próprio, não aninhado)",
            after.animationName.includes("cave-atmosphere-drift"), after.animationName);
        check("atmosfera cintila (twinkle)",
            after.animationName.includes("cave-atmosphere-twinkle"), after.animationName);

        const before = getComputedStyle(raiz, "::before");
        check("luz ambiente continua animando",
            before.animationName.includes("cave-ambient-light"), before.animationName);

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
