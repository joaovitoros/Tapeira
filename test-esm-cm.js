// Teste focado: "CM em dobro" da loja de esmeraldas - 4 níveis (×4/×8/×16/×32),
// preço base 5 dobrando (5/10/20/40). Rode depois de `npm run prepare:web`:
// node test-esm-cm.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', e => {
        if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message);
    });
    await page.goto('file://' + path.resolve(__dirname, 'www', 'Caverna.html'));
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

    const resultados = await page.evaluate(() => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
        UI.showInfo = () => {};
        UI.showMilestone = () => {};
        window.MostraStatus = () => {};
        window.ChamaSom = () => {};
        window.AtualizaLojaEsmSlotBuild = () => {};

        lvlEsmCM = 0; precoEsmCM = 5; esmeraldas = 1000; marcosNivel50 = 0; resetsCurtosCM = 0;
        NormalizaPrecosLoja();
        check("preço base 5 no nível 0", precoEsmCM === 5, precoEsmCM);

        const precos = [];
        for (let i = 0; i < 4; i++) { precos.push(precoEsmCM); CompraEsmCM(); }
        check("chega a 4 níveis", lvlEsmCM === 4, lvlEsmCM);
        check("preços 5/10/20/40", JSON.stringify(precos) === "[5,10,20,40]", JSON.stringify(precos));
        check("efeito ×32 no nível 4 (base ×2 do item)", Math.abs(MultiplicadorCM() - 32) < 1e-9, MultiplicadorCM());

        const esmAntes = esmeraldas;
        CompraEsmCM();
        check("no nível máximo não compra mais", lvlEsmCM === 4 && esmeraldas === esmAntes, lvlEsmCM + " / " + esmeraldas);

        const base = { andar: 1, andarVolta: 15, gold: { m: 0, e: 0 }, totalGold: { m: 0, e: 0 } };
        let aceitou4 = true, erro4 = "";
        try { ValidarSave({ ...base, lvlEsmCM: 4 }); } catch (e) { aceitou4 = false; erro4 = e.message; }
        let rejeitou5 = false;
        try { ValidarSave({ ...base, lvlEsmCM: 5 }); } catch { rejeitou5 = true; }
        check("ValidarSave aceita nível 4", aceitou4, erro4);
        check("ValidarSave rejeita nível 5", rejeitou5);

        const previewMax = PREVIEWS_LOJA.CompraEsmCM();
        check("preview no máximo cita ×32", /×32/.test(previewMax), previewMax);

        // migração de save antigo: preço derivado do nível
        lvlEsmCM = 1; NormalizaPrecosLoja();
        check("preço derivado do nível (nível 1 → 10)", precoEsmCM === 10, precoEsmCM);

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
