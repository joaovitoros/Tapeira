// Teste focado: no PC/tablet a Loja NÃO pode invadir a faixa de Objetivo/Missão
// (que fica no topo-direito). Roda direto da fonte: node test-loja-layout.js
const { chromium } = require('playwright');
const path = require('path');

const views = [
    { w: 1920, h: 1080 }, { w: 1600, h: 900 }, { w: 1440, h: 900 }, { w: 1400, h: 900 },
    { w: 1366, h: 768 }, { w: 1280, h: 800 }, { w: 1280, h: 720 }, { w: 1200, h: 900 },
    { w: 1100, h: 800 }, { w: 1024, h: 768 }, { w: 900, h: 700 }, { w: 850, h: 1000 }, { w: 800, h: 600 }
];

(async () => {
    const browser = await chromium.launch({ headless: true });
    const out = [];
    const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
    const erros = [];

    for (const v of views) {
        const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
        const page = await ctx.newPage();
        page.on('pageerror', e => { if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message); });
        await page.goto('file://' + path.resolve(__dirname, 'Caverna.html'));
        await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

        const r = await page.evaluate(() => {
            window.ChamaSom = () => {};
            document.getElementById("infoModal")?.remove();
            andar = 12; maxAndar = 12;
            // missão ativa deixa o card mais alto (pior caso)
            missaoAtual = 2; missaoGolpeAtual = 0; missaoGolpe = 10;
            UI.updateMission();
            AbreLoja(false);
            const loja = document.getElementById("container-Loja").getBoundingClientRect();
            const metas = document.getElementById("container-Metas").getBoundingClientRect();
            const sobrepoe = !(loja.left >= metas.right || loja.right <= metas.left || loja.top >= metas.bottom || loja.bottom <= metas.top);
            return {
                sobrepoe,
                lojaTop: Math.round(loja.top),
                metasBottom: Math.round(metas.bottom),
                folga: Math.round(loja.top - metas.bottom)
            };
        });

        check("Loja nao invade Objetivo/Missao (" + v.w + "x" + v.h + ")",
            !r.sobrepoe, "loja.top=" + r.lojaTop + " metas.bottom=" + r.metasBottom + " folga=" + r.folga);
        await ctx.close();
    }

    await browser.close();
    let falhas = 0;
    for (const r of out) {
        if (!r.ok) falhas++;
        console.log((r.ok ? "OK   " : "FAIL ") + r.nome + (r.detalhe ? "  (" + r.detalhe + ")" : ""));
    }
    if (erros.length) { console.log("erros de pagina: " + erros.join(" | ")); falhas++; }
    console.log("\n" + (out.length - falhas) + "/" + out.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
