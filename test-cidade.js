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
            ["ramosTreeModal", "antCollectionModal", "modalItensBuildView", "feitosModal", "skillUpgradeModal", "casaModal"].forEach(id => {
                document.getElementById(id)?.remove();
            });
        };
        const abre = (id) => {
            limpa();
            window.Tapeira.Cidade.abrir();
            document.querySelector('[data-cidade="' + id + '"]').click();
            return {
                cidadeFechada: document.getElementById("container-Cidade").hidden,
                casa: !!document.getElementById("casaModal"),
                status: document.getElementById("DivStatus")?.style.visibility === "visible",
                loja: ["Loja", "LojaEsm", "LojaCM"].some(x => document.getElementById(x)?.style.visibility === "visible"),
                ramos: !!document.getElementById("ramosTreeModal"),
                formigas: !!document.getElementById("antCollectionModal"),
                itens: !!document.getElementById("modalItensBuildView")
            };
        };
        // para testar que cada prédio abre o painel, destrava todos (andar 120)
        maxAndar = 120;
        window.Tapeira.Cidade.sincroniza();
        res.casa = abre("casa");
        res.mercado = abre("mercado");
        res.pesquisa = abre("pesquisa");
        res.fazenda = abre("fazenda");
        res.fabrica = abre("fabrica");

        // fechar pelo ×
        window.Tapeira.Cidade.abrir();
        document.querySelector('[data-cidade="fechar"]').click();
        res.fechouPeloX = document.getElementById("container-Cidade").hidden;

        // decoração da cena: chão presente e todas as imagens de prop carregadas
        res.chao = !!document.querySelector("#container-Cidade .cidade-chao");
        res.decorTotal = document.querySelectorAll("#container-Cidade .cidade-decor").length;
        const decorImgs = [...document.querySelectorAll(
            "#container-Cidade img.cidade-decor, #container-Cidade .cidade-decor img"
        )];
        res.decorImgs = decorImgs.length;
        res.decorImgsOk = decorImgs.length > 0 && decorImgs.every(i => i.complete && i.naturalWidth > 0);
        res.decorQuebradas = decorImgs.filter(i => !(i.complete && i.naturalWidth > 0)).map(i => i.getAttribute("src"));

        // Fase 2: gates por andar (bate com a tabela do CIDADE.md)
        res.gates = window.Tapeira.Cidade.GATES;
        const trancados = (m) => {
            maxAndar = m;
            window.Tapeira.Cidade.sincroniza();
            const t = (id) => window.Tapeira.Cidade.travado(id);
            return { casa: t("casa"), fazenda: t("fazenda"), mercado: t("mercado"), fabrica: t("fabrica"), pesquisa: t("pesquisa") };
        };
        res.g84 = trancados(84);
        res.g90 = trancados(90);
        res.g100 = trancados(100);
        res.g110 = trancados(110);

        // clicar num prédio trancado NÃO abre o painel (a Cidade continua aberta)
        limpa();
        maxAndar = 84;
        window.Tapeira.Cidade.sincroniza();
        window.Tapeira.Cidade.abrir();
        document.querySelector('[data-cidade="fazenda"]').click();
        res.trancadoNaoAbre = !document.getElementById("container-Cidade").hidden
            && !document.getElementById("antCollectionModal");

        // e o selo "trancado" aparece no DOM
        maxAndar = 84;
        window.Tapeira.Cidade.sincroniza();
        res.seloFazenda = (document.querySelector('[data-cidade="fazenda"] .cidade-predio__lock')?.textContent || "").trim();

        return res;
    });

    check("aba escondida antes do andar 80", r.escondidaAntes === true);
    check("aba aparece no andar 80", r.visivelDepois === true);
    check("abre a Cidade", r.aberta === true);
    check("Casa abre o painel da Casa", r.casa.casa && r.casa.cidadeFechada, JSON.stringify(r.casa));
    check("Mercado abre a Loja", r.mercado.loja && r.mercado.cidadeFechada, JSON.stringify(r.mercado));
    check("Pesquisa abre Ramos", r.pesquisa.ramos && r.pesquisa.cidadeFechada, JSON.stringify(r.pesquisa));
    check("Fazenda abre as Formigas", r.fazenda.formigas && r.fazenda.cidadeFechada, JSON.stringify(r.fazenda));
    check("Fábrica abre os itens da build", r.fabrica.itens && r.fabrica.cidadeFechada, JSON.stringify(r.fabrica));
    check("fecha pelo ×", r.fechouPeloX === true);
    check("cena tem chão", r.chao === true);
    check("cena tem props de decoração", r.decorTotal >= 10, r.decorTotal);
    check("imagens de decoração carregam", r.decorImgsOk === true, "quebradas: " + JSON.stringify(r.decorQuebradas));

    check("gates batem com a tabela", JSON.stringify(r.gates) === JSON.stringify({ casa: 80, fazenda: 85, mercado: 90, fabrica: 100, pesquisa: 110 }), JSON.stringify(r.gates));
    check("andar 84: só a Casa livre", r.g84.casa === false && r.g84.fazenda && r.g84.mercado && r.g84.fabrica && r.g84.pesquisa, JSON.stringify(r.g84));
    check("andar 90: Casa+Fazenda+Mercado livres", r.g90.casa === false && r.g90.fazenda === false && r.g90.mercado === false && r.g90.fabrica && r.g90.pesquisa, JSON.stringify(r.g90));
    check("andar 100: só a Pesquisa trancada", r.g100.pesquisa === true && !r.g100.fabrica && !r.g100.casa, JSON.stringify(r.g100));
    check("andar 110: tudo livre", !r.g110.casa && !r.g110.fazenda && !r.g110.mercado && !r.g110.fabrica && !r.g110.pesquisa, JSON.stringify(r.g110));
    check("prédio trancado não abre o painel", r.trancadoNaoAbre === true);
    check("selo de trancado mostra o requisito", /Andar 85/.test(r.seloFazenda), r.seloFazenda);

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
