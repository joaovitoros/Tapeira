// Teste focado: chance do Explorador (comp 6) — base por nível (mínimo) e
// bônus quanto mais longe do andar máximo (×(1 + 2% por andar), teto 90%).
// Rode depois de `npm run prepare:web`: node test-explorador.js
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

        // distância 0 = base de hoje (o mínimo)
        lvlComp6 = 1; maxAndar = 100; andar = 100;
        check("distância 0 = base (5% no nível 1)", Math.abs(ChanceExplorador() - 0.05) < 1e-9, ChanceExplorador());

        // +2% relativo por andar de distância
        andar = 50; // distância 50 → fator 2
        check("distância 50 dobra a base (5% → 10%)", Math.abs(ChanceExplorador() - 0.10) < 1e-9, ChanceExplorador());

        lvlComp6 = 6; // base 15%
        check("nível 6 a 50 de distância = 30%", Math.abs(ChanceExplorador() - 0.30) < 1e-9, ChanceExplorador());

        // teto de 90%
        maxAndar = 400; andar = 1; // distância 399
        check("teto de 90%", Math.abs(ChanceExplorador() - 0.90) < 1e-9, ChanceExplorador());
        check("nunca passa de 90% (nível 99)", ChanceExploradorNoNivel(99) <= 0.9, ChanceExploradorNoNivel(99));

        // base nunca abaixo de 5% (com distância 0)
        maxAndar = 100; andar = 100;
        check("nível 0 ainda tem a base de 5%", Math.abs(ChanceExploradorNoNivel(0) - 0.05) < 1e-9, ChanceExploradorNoNivel(0));

        // Status usa a fonte única
        lvlComp6 = 6; maxAndar = 100; andar = 50;
        UI.showStatus();
        const linha = [...document.querySelectorAll("#StatusBody tr")]
            .find(tr => tr.querySelector(".statusNome")?.textContent === "Companheiro 6 — Explorador");
        const valor = linha?.querySelector(".statusValor")?.textContent || "";
        check("Status mostra 30% (com distância)", /30%/.test(valor), valor);

        // preview da loja usa a fonte única
        const texto = PREVIEWS_LOJA.CompraComp6();
        check("preview do Explorador usa a fórmula (30% → 34%)", /Explorador: 30% → 34%/.test(texto), texto);

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
