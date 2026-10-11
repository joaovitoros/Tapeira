// Teste focado: Veia de esmeralda — aparece ~2× menos (peso 1 vs 2) e a
// chance de esmeralda por abate caiu pela metade (0,025).
// Roda direto da fonte (raiz do projeto): node test-veia.js
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

        check("chance de esmeralda por abate caiu pra 0,025", EVENTO_VEIA_CHANCE === 0.025, EVENTO_VEIA_CHANCE);

        // sorteio ponderado: veia entra 1× e os outros 2× no pool
        const nomes = ["comercio", "meteoro", "nevoa", "veia", "inseto", "fissura", "emboscada"];
        const pool = [];
        for (const nome of nomes) {
            const peso = EVENTO_PESOS[nome] || 1;
            for (let i = 0; i < peso; i++) pool.push(nome);
        }
        const contagem = {};
        for (const nome of pool) contagem[nome] = (contagem[nome] || 0) + 1;
        check("veia tem metade do peso dos outros", contagem.veia === 1 && contagem.comercio === 2, contagem.veia + "/" + contagem.comercio);
        check("todos os outros eventos têm peso 2",
            nomes.filter(n => n !== "veia").every(n => contagem[n] === 2), JSON.stringify(contagem));
        check("chance da veia no sorteio = 1/13", Math.abs(contagem.veia / pool.length - 1 / 13) < 1e-9,
            (contagem.veia / pool.length).toFixed(4));

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
