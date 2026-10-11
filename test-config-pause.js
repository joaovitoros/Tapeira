// Teste focado: Config foi pro menu de pause (ESC/P) e saiu da barra.
// Roda direto da fonte (raiz do projeto): node test-config-pause.js
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
        window.ChamaSom = () => {};
        UI.showInfo = () => {};

        const config = document.getElementById("container-SalvaCarrega");
        const origem = config.parentElement;

        check("botão Config saiu da barra", !document.getElementById("btn-Config"));

        PausarJogo();
        const overlay = document.getElementById("pauseOverlay");
        check("pausar abre o menu", !!overlay);
        check("Config foi pro menu de pause",
            config.parentElement === overlay.querySelector(".pause-panel"), config.parentElement?.className);
        check("Config visível no menu", config.style.visibility === "visible");
        check("menu tem Continuar e Voltar ao menu",
            [...overlay.querySelectorAll(".pause-actions button")].map(b => b.textContent).join(",") === "Continuar,Voltar ao menu");

        AtualizaEstadoPausa(false);
        check("despausar devolve o Config à origem", config.parentElement === origem);
        check("Config volta escondido", config.style.visibility === "hidden");
        check("menu de pause some", !document.getElementById("pauseOverlay"));

        // ESC: 1º fecha o que estiver aberto, 2º abre o menu de pause (com o Config)
        const esc = () => document.dispatchEvent(new KeyboardEvent("keydown", { code: "Escape", key: "Escape", bubbles: true }));
        esc();
        if (!document.getElementById("pauseOverlay")) esc();
        const overlayEsc = document.getElementById("pauseOverlay");
        check("ESC abre o menu de pause", !!overlayEsc);
        check("Config dentro do menu aberto pelo ESC",
            overlayEsc && config.parentElement === overlayEsc.querySelector(".pause-panel"));
        AtualizaEstadoPausa(false);

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
