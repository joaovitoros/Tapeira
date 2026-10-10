// Teste focado: animações novas — moeda voadora, poeira da morte e o tremor
// do guardião (todas somem quando a animação termina).
// Roda direto da fonte (raiz do projeto): node test-animacoes.js
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

        const player = document.querySelector(".player").getBoundingClientRect();

        // moeda voadora
        VoaMoeda(player);
        const moeda = document.querySelector(".moeda-voadora");
        check("moeda voadora criada", !!moeda);
        check("moeda tem direção (--dx/--dy)",
            moeda && moeda.style.getPropertyValue("--dx") !== "" && moeda.style.getPropertyValue("--dy") !== "",
            moeda ? moeda.style.getPropertyValue("--dx") + " / " + moeda.style.getPropertyValue("--dy") : "-");

        // poeira da morte
        CriaPoeiraMorte(player);
        check("poeira da morte criada", !!document.querySelector(".morte-poeira"));

        // tremor do guardião (andar múltiplo de 10)
        UI.showFloorTransition(10);
        check("guardião faz a cena tremer", document.documentElement.classList.contains("guardian-rumble"));

        await new Promise(r => setTimeout(r, 800));
        check("tremor do guardião sai no animationend", !document.documentElement.classList.contains("guardian-rumble"));
        check("moeda some quando a animação termina", !document.querySelector(".moeda-voadora"));
        check("poeira some quando a animação termina", !document.querySelector(".morte-poeira"));

        UI.showFloorTransition(7);
        check("andar normal não treme", !document.documentElement.classList.contains("guardian-rumble"));

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
