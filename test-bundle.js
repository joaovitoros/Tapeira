// Teste focado: o bundle minificado do www (menu + caverna) carrega e
// inicializa sem erros. Rode depois de `npm run prepare:web`: node test-bundle.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const resultados = [];
    const check = (nome, ok, detalhe) =>
        resultados.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

    // ---- Caverna (bundle-caverna.js) ----
    {
        const page = await browser.newPage();
        const erros = [];
        page.on('pageerror', e => {
            if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message);
        });
        await page.goto('file://' + path.resolve(__dirname, 'www', 'Caverna.html'));
        await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });
        const r = await page.evaluate(() => ({
            andar: window.andar,
            bater: typeof Bater === "function",
            carregar: typeof Carregar === "function",
            compraLoja: typeof CompraLojaItem === "function",
            evento: typeof MontaPainelEvento === "function",
            ui: typeof UI !== "undefined",
            umaTagDeScript: [...document.querySelectorAll('script[src^="script/"]')].map(s => s.getAttribute('src'))
        }));
        check("Caverna inicia (andar >= 1)", r.andar >= 1, r.andar);
        check("globais do bundle existem (Bater/Carregar/CompraLojaItem/MontaPainelEvento/UI)",
            r.bater && r.carregar && r.compraLoja && r.evento && r.ui);
        check("www usa o bundle (e não os scripts individuais)",
            r.umaTagDeScript.includes("script/bundle-caverna.js")
            && !r.umaTagDeScript.some(s => /script\/(sistema|script|ui|loja|eventos|batalha)\.js$/.test(s)),
            r.umaTagDeScript.join(", "));
        check("Caverna sem erros de pagina", erros.length === 0, erros.join(" | "));
        await page.close();
    }

    // ---- Menu (bundle-index.js) ----
    {
        const page = await browser.newPage();
        const erros = [];
        page.on('pageerror', e => erros.push(e.message));
        await page.goto('file://' + path.resolve(__dirname, 'www', 'index.html'));
        await page.waitForFunction(() => typeof window.PrepararMenu === "function", { timeout: 15000 });
        const titulo = await page.title();
        const scripts = await page.evaluate(() =>
            [...document.querySelectorAll('script[src^="script/"]')].map(s => s.getAttribute('src')));
        check("menu carrega (titulo TAPeira)", titulo === "TAPeira", titulo);
        check("www do menu usa o bundle (1 tag de script local)",
            scripts.length === 1 && /bundle-index\.js$/.test(scripts[0]), scripts.join(", "));
        check("menu sem erros de pagina", erros.length === 0, erros.join(" | "));
        await page.close();
    }

    await browser.close();
    let falhas = 0;
    for (const r of resultados) {
        if (!r.ok) falhas++;
        console.log((r.ok ? "OK   " : "FAIL ") + r.nome + (r.detalhe ? "  (" + r.detalhe + ")" : ""));
    }
    console.log("\n" + (resultados.length - falhas) + "/" + resultados.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
