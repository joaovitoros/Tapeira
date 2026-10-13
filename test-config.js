// Teste focado: menu de Ajustes (preferências do jogador) — persistência,
// UI no painel de Config e os hooks (números de dano, anúncios, movimento).
// Roda direto da fonte (raiz do projeto): node test-config.js
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

        const C = window.Tapeira.Config;
        check("módulo de config existe com 6 itens", C && C.ITENS.length === 6, C ? C.ITENS.length : "-");
        check("padrão: números de dano ligado", C.ativo("numerosDano") === true);
        check("movimento saiu dos ajustes (agora é da Qualidade)",
            !C.ITENS.some(i => i.id === "movimentoReduzido"));

        const div = document.getElementById("divAjustes");
        check("seção Ajustes montada dentro do painel de Config",
            div && document.getElementById("container-SalvaCarrega").contains(div));
        check("6 checkboxes de ajuste",
            div && div.querySelectorAll("input[type=checkbox]").length === 6,
            div ? div.querySelectorAll("input[type=checkbox]").length : "-");

        // hook: números de dano
        const player = document.querySelector(".player");
        C.define("numerosDano", true);
        UI.showDamageNumber(player, 10, false);
        const comNumero = document.querySelectorAll(".damage-number").length;
        C.define("numerosDano", false);
        UI.showDamageNumber(player, 10, false);
        const semNumero = document.querySelectorAll(".damage-number").length;
        check("números de dano: ligado mostra, desligado não",
            comNumero >= 1 && semNumero === comNumero, `${comNumero}/${semNumero}`);

        // hook: anúncios de marco
        C.define("anunciosMarco", false);
        UI.milestoneQueue.length = 0;
        UI.showMilestone("Teste", "x");
        check("anúncios desligados não enfileiram banner", UI.milestoneQueue.length === 0, UI.milestoneQueue.length);
        C.define("anunciosMarco", true);

        // hook: tremor no crítico (a função existe e respeita a config)
        C.define("tremerCritico", false);
        FeedbackCritico();
        check("tremor do crítico desligado não cria o flash", !document.getElementById("critFlash"));
        C.define("tremerCritico", true);

        // movimento: agora quem manda é a Qualidade (ver test-qualidade.js)
        check("config não mexe no movimento reduzido",
            typeof C.valor("movimentoReduzido") === "undefined");

        // persistência
        C.define("efeitosImpacto", false);
        check("preferência persistida no localStorage",
            (localStorage.getItem("tapeiraConfig") || "").includes('"efeitosImpacto":false'),
            localStorage.getItem("tapeiraConfig"));
        C.define("efeitosImpacto", true);

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
