// Teste focado: bug da auto-compra seletiva (andar 100+).
// Antes: seleção vazia = não comprava NADA (a auto-compra parava no andar 100)
// e a seleção esparsa virava null no save (rejeitado no load).
// Roda direto da fonte (raiz do projeto): node test-auto-compra.js
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

        window.MostraInfo = () => {};
        window.MostraStatus = () => {};
        window.ChamaSom = () => {};
        window.AutoSaveLocal = () => true;
        window.AtualizaMaximosLoja = () => {};
        UI.showInfo = () => {};
        UI.updateSkillProgress = () => {};

        missaoAtual = 0;
        maxAndar = 100;
        andar = 100;
        autoCompra = 1;
        precoDano = precoBEspaco = precoGold = precoAvan = 1000;
        precoDCrit = precoVidaInimigo = precoCCrit = 1000;
        precoQTDAvanco = precoEsmBau = precoVelComp = 1000;
        lvlBau = 1;

        // 1) seleção vazia (padrão) compra tudo (era o bug: não comprava nada)
        autoItensLoja = [];
        gold = new GoldNumber(10);
        precoBau = 5;
        AutoCompraMaisBarato();
        check("seleção vazia (padrão) compra o mais barato", lvlBau === 2, lvlBau);

        // 2) item desmarcado (0) fica de fora
        autoItensLoja = [];
        autoItensLoja[1] = 0; // índice 1 = baú
        gold = new GoldNumber(10);
        precoBau = 5;
        const nivel = lvlBau;
        AutoCompraMaisBarato();
        check("item desmarcado não é comprado", lvlBau === nivel, lvlBau);

        // 3) normalização: array completo 0/1 (nunca esparso → nunca null no JSON)
        autoItensLoja = [];
        NormalizaSelecaoAutoLoja();
        check("normaliza vazio → tudo 1 (tamanho certo)",
            autoItensLoja.length === ITENS_AUTO_COMPRA.length && autoItensLoja.every(v => v === 1), autoItensLoja.join(","));
        autoItensLoja = [];
        autoItensLoja[1] = 0;
        NormalizaSelecaoAutoLoja();
        check("normaliza preserva o 0 explícito",
            autoItensLoja[1] === 0 && autoItensLoja[0] === 1 && autoItensLoja.every(v => v === 0 || v === 1), autoItensLoja.join(","));

        // 4) ligar/desligar NÃO apaga a seleção
        autoItensLoja = [];
        autoItensLoja[1] = 0;
        NormalizaSelecaoAutoLoja();
        AlternaAutoCompra(false);
        AlternaAutoCompra(true);
        check("toggle geral não apaga a seleção individual", autoItensLoja[1] === 0, autoItensLoja.join(","));

        // 5) save antigo com null na seleção é aceito (compat com arrays esparsos)
        // O ValidarSave genérico depende de um save completo; aqui validamos só
        // que o null não adiciona uma rejeição específica da seleção.
        const saveBase = CriarObjetoSave(false);
        const veredito = valor => {
            try {
                const s = { ...saveBase, autoItensLoja: valor };
                ValidarSave(s);
                return "ok";
            } catch (e) {
                return e.message;
            }
        };
        check("null na seleção não rejeita por si só (mesmo veredito do 0/1)",
            veredito([null, 1]) === veredito([0, 1]), veredito([null, 1]) + " / " + veredito([0, 1]));

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
