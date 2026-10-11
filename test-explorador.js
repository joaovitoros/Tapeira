// Teste focado: Explorador (comp 6) — a chance vem SÓ da distância
// (5% fixo ×(1 + 2% por andar abaixo de maxAndar), teto 90%) e o NÍVEL
// comprado é a QUANTIDADE de andares pulados por ativação.
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

        // distância 0 = 5% fixo, em qualquer nível
        maxAndar = 100; andar = 100;
        lvlComp6 = 1;
        check("distância 0 = 5% (nível 1)", Math.abs(ChanceExplorador() - 0.05) < 1e-9, ChanceExplorador());
        lvlComp6 = 6;
        check("nível não muda a chance (nv6 = nv1)", Math.abs(ChanceExplorador() - 0.05) < 1e-9, ChanceExplorador());
        lvlComp6 = 99;
        check("nível 99 também = 5% na distância 0", Math.abs(ChanceExplorador() - 0.05) < 1e-9, ChanceExplorador());

        // +2% relativo por andar de distância
        andar = 50; // distância 50 → fator 2
        check("distância 50 dobra a base (5% → 10%)", Math.abs(ChanceExplorador() - 0.10) < 1e-9, ChanceExplorador());

        // teto de 90%
        maxAndar = 900; andar = 1; // distância 899 → 0,05 × 18,98 > 90% → teto
        check("teto de 90%", Math.abs(ChanceExplorador() - 0.90) < 1e-9, ChanceExplorador());

        // quantidade = nível comprado (com trava de segurança em 50)
        maxAndar = 100; andar = 100;
        lvlComp6 = 0;
        check("nível 0 pula 0 andares", AndaresPuladosExplorador() === 0, AndaresPuladosExplorador());
        lvlComp6 = 3;
        check("nível 3 = +3 andares", AndaresPuladosExplorador() === 3, AndaresPuladosExplorador());
        lvlComp6 = 9999;
        check("trava de segurança em 50 andares", AndaresPuladosExplorador() === 50, AndaresPuladosExplorador());

        // pulo real: rolagem garantida pula N andares (= nível)
        lvlComp6 = 3; andar = 10; maxAndar = 50;
        const randomReal = Math.random;
        const eventoReal = window.TentaEventoAndar;
        window.TentaEventoAndar = () => {}; // isola o pulo dos eventos de andar
        // rolagem < chance mínima (5%) → sempre pula
        Math.random = () => 0.0001;
        let pulados = -1;
        try { pulados = TentaPuloExplorador(); } finally {
            Math.random = randomReal;
            window.TentaEventoAndar = eventoReal;
        }
        check("ativação pula 3 andares (= nível)", pulados === 3 && andar === 13,
            "pulou " + pulados + ", andar " + andar);

        // sem nível comprado não há pulo
        lvlComp6 = 0; andar = 13; maxAndar = 50;
        window.TentaEventoAndar = () => {};
        Math.random = () => 0.0001;
        let puladosSemNivel = -1;
        try { puladosSemNivel = TentaPuloExplorador(); } finally {
            Math.random = randomReal;
            window.TentaEventoAndar = eventoReal;
        }
        check("sem nível comprado não pula", puladosSemNivel === 0 && andar === 13,
            "pulou " + puladosSemNivel + ", andar " + andar);

        // Status usa a fonte única (chance + quantidade do nível)
        lvlComp6 = 3; maxAndar = 100; andar = 50; // distância 50 → 10%
        UI.showStatus();
        const linha = [...document.querySelectorAll("#StatusBody tr")]
            .find(tr => tr.querySelector(".statusNome")?.textContent === "Companheiro 6 — Explorador");
        const valor = linha?.querySelector(".statusValor")?.textContent || "";
        check("Status mostra 10% e +3 andares", /10%/.test(valor) && /\+3 andares/.test(valor), valor);

        // preview da loja: chance única + progressão da quantidade
        const texto = PREVIEWS_LOJA.CompraComp6();
        check("preview mostra 10% e +3 andares → +4 andares",
            /Explorador: 10% de avançar \+3 andares → \+4 andares/.test(texto), texto);

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
