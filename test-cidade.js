// Teste focado: aba "Cidade" (Fase 1 — esqueleto). Só navegação: cada prédio
// abre um painel que JÁ existe. Gate: andar máximo >= 80.
// Roda direto da fonte (raiz do projeto): node test-cidade.js
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

    const out = [];
    const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

    const r = await page.evaluate(() => {
        window.ChamaSom = () => {};
        document.getElementById("infoModal")?.remove();
        UI.showInfo = () => {};
        const res = {};

        maxAndar = 79;
        window.Tapeira.Cidade.sincroniza();
        res.escondidaAntes = document.getElementById("btnCidade").hidden;

        maxAndar = 80;
        window.Tapeira.Cidade.sincroniza();
        res.visivelDepois = !document.getElementById("btnCidade").hidden;

        window.Tapeira.Cidade.abrir();
        res.aberta = !document.getElementById("container-Cidade").hidden;

        const limpa = () => {
            ["DivStatus", "Loja", "LojaEsm", "LojaCM", "container-SalvaCarrega"].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.visibility = "hidden";
            });
            ["ramosTreeModal", "antCollectionModal", "modalItensBuildView", "feitosModal", "skillUpgradeModal"].forEach(id => {
                document.getElementById(id)?.remove();
            });
        };
        const abre = (id) => {
            limpa();
            window.Tapeira.Cidade.abrir();
            document.querySelector('[data-cidade="' + id + '"]').click();
            return {
                cidadeFechada: document.getElementById("container-Cidade").hidden,
                status: document.getElementById("DivStatus")?.style.visibility === "visible",
                loja: ["Loja", "LojaEsm", "LojaCM"].some(x => document.getElementById(x)?.style.visibility === "visible"),
                ramos: !!document.getElementById("ramosTreeModal"),
                formigas: !!document.getElementById("antCollectionModal"),
                itens: !!document.getElementById("modalItensBuildView")
            };
        };
        res.casa = abre("casa");
        res.mercado = abre("mercado");
        res.pesquisa = abre("pesquisa");
        res.fazenda = abre("fazenda");
        res.fabrica = abre("fabrica");

        // fechar pelo ×
        window.Tapeira.Cidade.abrir();
        document.querySelector('[data-cidade="fechar"]').click();
        res.fechouPeloX = document.getElementById("container-Cidade").hidden;

        return res;
    });

    check("aba escondida antes do andar 80", r.escondidaAntes === true);
    check("aba aparece no andar 80", r.visivelDepois === true);
    check("abre a Cidade", r.aberta === true);
    check("Casa abre o Status", r.casa.status && r.casa.cidadeFechada, JSON.stringify(r.casa));
    check("Mercado abre a Loja", r.mercado.loja && r.mercado.cidadeFechada, JSON.stringify(r.mercado));
    check("Pesquisa abre Ramos", r.pesquisa.ramos && r.pesquisa.cidadeFechada, JSON.stringify(r.pesquisa));
    check("Fazenda abre as Formigas", r.fazenda.formigas && r.fazenda.cidadeFechada, JSON.stringify(r.fazenda));
    check("Fábrica abre os itens da build", r.fabrica.itens && r.fabrica.cidadeFechada, JSON.stringify(r.fabrica));
    check("fecha pelo ×", r.fechouPeloX === true);

    await browser.close();
    let falhas = 0;
    for (const x of out) {
        if (!x.ok) falhas++;
        console.log((x.ok ? "OK   " : "FAIL ") + x.nome + (x.detalhe ? "  (" + x.detalhe + ")" : ""));
    }
    if (erros.length) { console.log("erros de pagina: " + erros.join(" | ")); falhas++; }
    console.log("\n" + (out.length - falhas) + "/" + out.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
