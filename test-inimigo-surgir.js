// Teste focado: inimigo "materializando" ao nascer (SurgeInimigo) — fade-in no
// sprite + anel no chão, ambos somem quando a animação termina.
// Roda direto da fonte (raiz do projeto): node test-inimigo-surgir.js
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
    // deixa o spawn inicial do jogo terminar (senão ele re-materializa no meio do teste)
    await page.waitForTimeout(1200);

    const resultados = await page.evaluate(async () => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

        UI.spawnEnemies = () => {}; // isola: nada re-spawna durante o teste

        const el = document.getElementById("inimigo1");
        el.style.visibility = "visible";
        SurgeInimigo(el);
        check("sprite recebe a classe de surgimento", el.classList.contains("inimigo--surgindo"), el.className);
        const anel = document.querySelector(".inimigo-surgir-anel");
        check("anel de surgimento criado", !!anel);
        check("anel não captura clique", anel && getComputedStyle(anel).pointerEvents === "none",
            anel ? getComputedStyle(anel).pointerEvents : "-");

        await new Promise(r => setTimeout(r, 650));
        check("classe some quando a animação termina", !el.classList.contains("inimigo--surgindo"), el.className);
        check("anel some quando a animação termina", !document.querySelector(".inimigo-surgir-anel"));

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
