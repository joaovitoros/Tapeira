// Teste focado: cada patente ★ do Dano dá um bônus único de +25% no ganho por
// nível (mulDano). Rode depois de `npm run prepare:web`: node test-patente-dano.js
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
        window.AtualizaLojaGold = () => {};

        // ---- ★I: Dano no teto da patente 0 ----
        gold = new GoldNumber(1e30);
        lvlDano = NiveisLoja("dano"); // teto da ★0
        mulDano = 10;
        const antes = { patente: PatenteAtual("dano"), ganho: mulDano };

        CompraDano(); // no teto → compra a patente
        check("compra no teto sobe a patente (★0 → ★1)",
            PatenteAtual("dano") === antes.patente + 1, antes.patente + "→" + PatenteAtual("dano"));
        check("ganho por nível +25% na ★I (10 → 12,5)",
            Math.abs(mulDano - 12.5) < 1e-9, mulDano);

        // ---- ★II: mesma regra (acumula) ----
        lvlDano = NiveisLoja("dano"); // teto da ★1
        const g1 = mulDano;
        CompraDano();
        check("segunda patente também +25% (compõe)",
            Math.abs(mulDano - g1 * 1.25) < 1e-9, mulDano);

        // ---- preview cita o bônus ----
        const texto = GanhoProximaPatenteTexto("dano");
        check("preview da patente cita '+25% no ganho por nível'",
            /\+25% no ganho/.test(texto), texto);

        // ---- outro item NÃO mexe no ganho do Dano ----
        const ganhoAntesDCrit = mulDano;
        lvlDCrit = NiveisLoja("dcrit");
        CompraDCrit(); // patente do Dano Crítico
        check("patente do Dano Crítico não altera o ganho do Dano",
            mulDano === ganhoAntesDCrit, mulDano);

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
