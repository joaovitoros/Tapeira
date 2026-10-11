// Teste focado do balanceamento da loja de patentes (opções 3 e 4):
// ingresso ★ mais barato (10×), teto ★I do Dano/Dano Crítico em 75 níveis
// e Vida do Inimigo indo além de −50% já na ★I (−60%).
// Roda direto da fonte (raiz do projeto): node test-patentes.js
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

        // ---- ingresso ★ a 10× o próximo nível ----
        precoDano = 100;
        check("ingresso ★ do Dano = 10× o preço do nível", PrecoPatenteLoja("dano") === 1000, PrecoPatenteLoja("dano"));

        // ---- teto ★I do Dano e do Dano Crítico em 75 níveis ----
        patenteDano = 0;
        check("★I do Dano fecha no nível 75", NiveisLoja("dano") === 75, NiveisLoja("dano"));
        patenteDCrit = 0;
        check("★I do Dano Crítico fecha no nível 75", NiveisLoja("dcrit") === 75, NiveisLoja("dcrit"));
        patenteDano = 1;
        check("★II do Dano destrava até o nível 150", NiveisLoja("dano") === 150, NiveisLoja("dano"));

        // ---- Vida do Inimigo vai além de −50% já na ★I ----
        patenteSubVida = 0;
        check("★I da Vida do Inimigo chega a −60%", Math.abs(TetoLoja("subvida") - 0.60) < 1e-9, TetoLoja("subvida"));
        check("★I da Vida do Inimigo libera 60 níveis", NiveisLoja("subvida") === 60, NiveisLoja("subvida"));
        patenteSubVida = 5;
        check("patente máxima da Vida do Inimigo chega a −90%", Math.abs(TetoLoja("subvida") - 0.90) < 1e-9, TetoLoja("subvida"));

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
