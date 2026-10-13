// Teste focado: Qualidade (Alta/Média/Baixa) — preferência por aparelho,
// classes no <html>, corte dos filtros do personagem, movimento reduzido na
// Baixa e o seletor montado nas Configurações.
// Roda direto da fonte (raiz do projeto): node test-qualidade.js
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

        const Q = window.Tapeira.Qualidade;
        const raiz = document.documentElement;
        const filtroArte = () => getComputedStyle(document.querySelector(".player__arte")).filter;

        check("módulo de qualidade existe com 3 níveis", Q && Q.QUALIDADES.length === 3, Q ? Q.QUALIDADES.length : "-");
        check("padrão no desktop é Alta", Q.atual() === "alta", Q.atual());

        // Alta: filtro ligado, sem movimento reduzido
        Q.definir("alta");
        check("Alta marca q-alta", raiz.classList.contains("q-alta"));
        check("Alta mantém o filtro do personagem", filtroArte() !== "none", filtroArte().slice(0, 18));
        check("Alta não reduz movimento", !raiz.classList.contains("config-sem-movimento"));

        // Média: sem filtro, ainda com animações
        Q.definir("media");
        check("Média marca q-media", raiz.classList.contains("q-media") && !raiz.classList.contains("q-alta"));
        check("Média corta o filtro do personagem", filtroArte() === "none", filtroArte());
        check("Média mantém as animações", !raiz.classList.contains("config-sem-movimento"));

        // Baixa: sem filtro + movimento reduzido (unificado com o antigo toggle)
        Q.definir("baixa");
        check("Baixa marca q-baixa", raiz.classList.contains("q-baixa"));
        check("Baixa corta o filtro do personagem", filtroArte() === "none", filtroArte());
        check("Baixa reduz o movimento (config-sem-movimento)", raiz.classList.contains("config-sem-movimento"));

        // persistência (por aparelho)
        check("nível persistido no localStorage",
            (localStorage.getItem("tapeira-qualidade") || "") === "baixa",
            localStorage.getItem("tapeira-qualidade"));

        // seletor nas Configurações
        const alvo = document.getElementById("configQualidade");
        const botoes = alvo ? [...alvo.querySelectorAll(".qualidade-btn")] : [];
        check("seletor montado nas Configurações", !!alvo && botoes.length === 3, botoes.length);
        check("nomes dos botões", botoes.map(b => b.textContent).join(",") === "Alta,Média,Baixa",
            botoes.map(b => b.textContent).join(","));
        check("botão do nível atual marcado",
            botoes.find(b => b.textContent === "Baixa")?.classList.contains("is-ativo") === true);
        check("seletor fora do bloco só-do-PC",
            !document.getElementById("divDesktopDisplay")?.contains(alvo));

        // clique real troca o nível ao vivo
        botoes.find(b => b.textContent === "Média").click();
        check("clique troca para Média ao vivo",
            raiz.classList.contains("q-media") && Q.atual() === "media", Q.atual());
        check("clique persistiu", (localStorage.getItem("tapeira-qualidade") || "") === "media");

        // volta pro padrão do desktop pra não vazar estado
        Q.definir("alta");
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
