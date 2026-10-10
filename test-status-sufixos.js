// Teste focado: os valores de dano do painel de Status usam os sufixos
// (K/M/B/T/Qa/Qi/Sx…) em vez de números crus.
// Roda direto da fonte (raiz do projeto): node test-status-sufixos.js
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

        // neutraliza os multiplicadores para prever o texto exato
        nivelJogador = 1;
        conquistasComp = [0, 0, 0, 0, 0];
        formigasVermelhas = 0;
        Tapeira.ItensBuild.limpa();
        especializacao = 0;
        danoJogador = 1e6;        // 1.00M
        danoCritJogador = 5e8;    // 500.00M
        mulGold = 2.4e9;          // 2.40B

        UI.showStatus();
        const valorDe = nome => [...document.querySelectorAll("#StatusBody tr")]
            .find(tr => tr.querySelector(".statusNome")?.textContent === nome)
            ?.querySelector(".statusValor")?.textContent;

        check("Dano com sufixo (1.00M)", valorDe("Dano") === "1.00M", valorDe("Dano"));
        check("Dano crítico com sufixo (500.00M)", valorDe("Dano crítico") === "500.00M", valorDe("Dano crítico"));
        check("Multiplicador Gold com sufixo (2.40B)", valorDe("Multiplicador Gold") === "2.40B", valorDe("Multiplicador Gold"));

        // valor pequeno continua com 2 casas (não ganha sufixo)
        danoJogador = 12.5;
        UI.showStatus();
        check("Dano pequeno segue 12.50", valorDe("Dano") === "12.50", valorDe("Dano"));

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
