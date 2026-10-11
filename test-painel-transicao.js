// Teste focado: transição de abrir/fechar dos painéis.
// Os painéis de visibility (Status/Config/Loja) animam por CSS casando o
// atributo style; os modais Formigas/Skills animam ao nascer.
// Roda direto da fonte (raiz do projeto): node test-painel-transicao.js
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

        const loja = document.getElementById("Loja");
        check("painel da loja tem transição de opacity/visibility",
            getComputedStyle(loja).transitionProperty.includes("opacity")
            && getComputedStyle(loja).transitionProperty.includes("visibility"),
            getComputedStyle(loja).transitionProperty);

        AbreLoja(false);
        await new Promise(r => setTimeout(r, 300));
        check("loja aberta fica opaca (opacity 1)", getComputedStyle(loja).opacity === "1", getComputedStyle(loja).opacity);

        FechaLoja();
        await new Promise(r => setTimeout(r, 400));
        check("loja fechada fica transparente (opacity 0)", getComputedStyle(loja).opacity === "0", getComputedStyle(loja).opacity);

        UI.showSkillUpgradePanel();
        const ov = document.getElementById("skillUpgradeModal");
        check("modal de skills anima na entrada",
            ov && getComputedStyle(ov).animationName.includes("painel-overlay-abre"),
            ov ? getComputedStyle(ov).animationName : "sem modal");
        const painel = ov && ov.querySelector(".ant-collection-panel");
        check("conteúdo do modal anima na entrada",
            painel && getComputedStyle(painel).animationName.includes("painel-conteudo-abre"),
            painel ? getComputedStyle(painel).animationName : "sem painel");

        // re-renderização (compra/level-up) NÃO replaya a entrada
        UI.showSkillUpgradePanel();
        const ov2 = document.getElementById("skillUpgradeModal");
        const painel2 = ov2.querySelector(".ant-collection-panel");
        check("re-render do painel não replaya a entrada",
            ov2.classList.contains("sem-entrada")
            && getComputedStyle(ov2).animationName === "none"
            && getComputedStyle(painel2).animationName === "none",
            ov2.className + " / " + getComputedStyle(ov2).animationName + " / " + getComputedStyle(painel2).animationName);

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
