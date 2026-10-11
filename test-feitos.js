// Teste focado: painel "Feitos" (Conquistas/Missões/Marcos embutidos).
// Roda direto da fonte (raiz do projeto): node test-feitos.js
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
        UI.showMilestone = () => {};

        const botao = document.getElementById("btnSkills");
        check("botão se chama Feitos", botao.textContent.includes("Feitos"), botao.textContent.replace(/\s+/g, " ").trim());

        botao.click();
        const modal = document.getElementById("feitosModal");
        check("clique abre o painel Feitos", !!modal);
        const abas = [...modal.querySelectorAll(".feitos-aba")].map(b => b.textContent);
        check("4 abas (Conquistas/Missões/Marcos/Formigas)",
            abas.join(",") === "Conquistas,Missões,Marcos,Formigas", abas.join(","));
        check("conteúdo de Conquistas renderizado",
            modal.querySelector(".feitos-corpo").textContent.includes("Conquista"),
            modal.querySelector(".feitos-corpo").textContent.replace(/\s+/g, " ").trim().slice(0, 40));

        [...modal.querySelectorAll(".feitos-aba")].find(b => b.textContent === "Marcos").click();
        const modal2 = document.getElementById("feitosModal");
        check("aba Marcos renderiza o conteúdo de marcos",
            modal2.querySelector(".feitos-corpo").textContent.includes("Portões de reset"));
        check("aba ativa marcada", modal2.querySelector(".feitos-aba--ativa").textContent === "Marcos");

        [...modal2.querySelectorAll(".feitos-aba")].find(b => b.textContent === "Formigas").click();
        const modal3 = document.getElementById("feitosModal");
        check("aba Formigas renderiza os cartões",
            modal3.querySelectorAll(".ant-collection-card").length > 0,
            modal3.querySelectorAll(".ant-collection-card").length);

        // clicar fora fecha
        modal2.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        check("clique fora fecha", !document.getElementById("feitosModal"));

        // ESC fecha
        botao.click();
        FechaJanelasAbertas();
        check("ESC fecha o painel", !document.getElementById("feitosModal"));

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
