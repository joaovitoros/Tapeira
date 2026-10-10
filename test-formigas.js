// Teste focado: buff das formigas (dano/gold compostas ×1,05 por conjunto) e
// da Adaga Sombria (+25% por cópia).
// Roda direto da fonte (raiz do projeto): node test-formigas.js
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
        const perto = (a, b) => Math.abs(a - b) < 1e-9;

        // ---- formigas compostas: ×1,05 por conjunto de 5 ----
        formigasVermelhas = 208; // 41 conjuntos
        formigasAmarelas = 243;  // 48 conjuntos
        check("41 conjuntos vermelhos = ×1,05^41 (×7,39)",
            perto(MultiplicadorDanoFormigas(), Math.pow(1.05, 41)), MultiplicadorDanoFormigas());
        check("48 conjuntos amarelos = ×1,05^48 (×10,40)",
            perto(MultiplicadorGoldFormigas(), Math.pow(1.05, 48)), MultiplicadorGoldFormigas());
        check("composto supera o antigo +5% somado (×7,39 > ×3,05)",
            MultiplicadorDanoFormigas() > 1 + 41 * 0.05, MultiplicadorDanoFormigas());

        formigasVermelhas = 0; formigasAmarelas = 0;
        check("sem formigas o multiplicador é 1",
            MultiplicadorDanoFormigas() === 1 && MultiplicadorGoldFormigas() === 1);

        // ---- Adaga Sombria: ×1,25 por cópia ----
        const build = Tapeira.ItensBuild;
        build.carrega({ itensBuild: ["adaga", "adaga"], bauBuildPendente: false });
        check("2 cópias de Adaga = ×1,5625", perto(build.multDano(), Math.pow(1.25, 2)), build.multDano());
        check("item da Adaga anuncia +25% de dano",
            build.item("adaga").efeito.includes("+25%"), build.item("adaga").efeito);

        // ---- painel das formigas reflete o composto ----
        const texto = UI.antBonusDescription("vermelhas", 41);
        check("painel mostra ×7,39 (composto)", texto.includes("7,39") || texto.includes("7.39"), texto);

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
