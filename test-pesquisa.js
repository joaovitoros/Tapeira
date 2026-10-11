// Teste focado: Centro de Pesquisa (hub da Cidade) — Fase 5.
// Pesquisa por item (potencializa o efeito) + análise de inimigos + save.
// Roda direto da fonte (raiz do projeto): node test-pesquisa.js
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

        res.temApi = !!window.Tapeira?.Pesquisa;
        res.itemMax = window.Tapeira.Pesquisa.ITEM_MAX;
        res.inimigoMax = window.Tapeira.Pesquisa.INIMIGO_MAX;

        // ---- bônus ----
        pesquisaItens = {}; pesquisaInimigos = {};
        res.bonus0 = PesquisaBonusItem("adaga");
        res.bonusInim0 = PesquisaBonusInimigo("comuns");
        pesquisaItens = { adaga: 3 };
        pesquisaInimigos = { comuns: 2 };
        res.bonus3 = PesquisaBonusItem("adaga");
        res.bonusInim2 = PesquisaBonusInimigo("comuns");

        // ---- custos ----
        pesquisaItens = {}; pesquisaInimigos = {};
        res.custoItem0 = CustoPesquisaItem("adaga");
        res.custoInim0 = CustoPesquisaInimigo("comuns");

        // ---- item da build: com 0 cópias o bônus NÃO se aplica ----
        pesquisaItens = { adaga: 5 };
        res.multSemCopia = Tapeira.ItensBuild.multDano(); // 1 (sem cópias)

        // ---- tipo do andar ----
        andar = 82; res.tipoComum = TipoInimigoAtual();
        andar = 80; res.tipoGuardiao = TipoInimigoAtual();

        // ---- compra de pesquisa de item ----
        pesquisaItens = {};
        conhecimentoMug = 0;
        res.itemSemCM = CompraPesquisaItem("adaga"); // false
        conhecimentoMug = 100000;
        res.itemOk = CompraPesquisaItem("adaga");    // true
        res.itemNivel = NivelPesquisaItem("adaga");
        pesquisaItens = { adaga: PESQUISA_ITEM_MAX };
        conhecimentoMug = 1e9;
        res.itemNoMax = CompraPesquisaItem("adaga"); // false
        res.itemIdRuim = CompraPesquisaItem("naoExiste"); // false

        // ---- compra de análise de inimigo ----
        pesquisaInimigos = {};
        conhecimentoMug = 100000;
        res.inimOk = CompraPesquisaInimigo("guardioes"); // true
        res.inimNivel = NivelPesquisaInimigo("guardioes");
        pesquisaInimigos = { guardioes: PESQUISA_INIMIGO_MAX };
        res.inimNoMax = CompraPesquisaInimigo("guardioes"); // false

        // ---- save ----
        pesquisaItens = { adaga: 2, moedas: 1 };
        pesquisaInimigos = { comuns: 3 };
        const obj = CriarObjetoSave();
        res.saveItens = JSON.stringify(obj.pesquisaItens);
        res.saveInimigos = JSON.stringify(obj.pesquisaInimigos);
        const clone = (extra) => Object.assign(JSON.parse(JSON.stringify(obj)), extra);
        res.validaOk = (() => { try { ValidarSave(clone({})); return true; } catch { return false; } })();
        res.validaItemAlto = (() => { try { ValidarSave(clone({ pesquisaItens: { adaga: PESQUISA_ITEM_MAX + 1 } })); return false; } catch { return true; } })();
        res.validaItemId = (() => { try { ValidarSave(clone({ pesquisaItens: { xyz: 1 } })); return false; } catch { return true; } })();
        res.validaInimigoAlto = (() => { try { ValidarSave(clone({ pesquisaInimigos: { comuns: PESQUISA_INIMIGO_MAX + 1 } })); return false; } catch { return true; } })();
        res.validaNaoObjeto = (() => { try { ValidarSave(clone({ pesquisaItens: [1, 2] })); return false; } catch { return true; } })();

        // ---- Resetar NÃO zera ----
        pesquisaItens = { adaga: 3 }; pesquisaInimigos = { comuns: 2 };
        Resetar();
        res.itensAposReset = NivelPesquisaItem("adaga");
        res.inimAposReset = NivelPesquisaInimigo("comuns");

        return res;
    });

    check("API Tapeira.Pesquisa existe", r.temApi === true);
    check("item bônus ×1 no nível 0", r.bonus0 === 1, r.bonus0);
    check("item bônus ×1.30 no nível 3", Math.abs(r.bonus3 - 1.30) < 1e-9, r.bonus3);
    check("inimigo bônus ×1.20 no nível 2", Math.abs(r.bonusInim2 - 1.20) < 1e-9, r.bonusInim2);
    check("custo do item nível 0 = 400 CM", r.custoItem0 === 400, r.custoItem0);
    check("custo do inimigo nível 0 = 800 CM", r.custoInim0 === 800, r.custoInim0);
    check("bônus de item não vale sem cópia", r.multSemCopia === 1, r.multSemCopia);
    check("tipo do andar: comuns/guardiões", r.tipoComum === "comuns" && r.tipoGuardiao === "guardioes");
    check("compra de item sem CM falha", r.itemSemCM === false);
    check("compra de item com CM funciona", r.itemOk === true && r.itemNivel === 1, r.itemNivel);
    check("pesquisa de item no máximo falha", r.itemNoMax === false);
    check("pesquisa de item id inválido falha", r.itemIdRuim === false);
    check("compra de análise funciona", r.inimOk === true && r.inimNivel === 1, r.inimNivel);
    check("análise no máximo falha", r.inimNoMax === false);
    check("save grava pesquisaItens", r.saveItens === '{"adaga":2,"moedas":1}', r.saveItens);
    check("save grava pesquisaInimigos", r.saveInimigos === '{"comuns":3}', r.saveInimigos);
    check("validação aceita pesquisa válida", r.validaOk === true);
    check("validação rejeita nível de item alto", r.validaItemAlto === true);
    check("validação rejeita id de item desconhecido", r.validaItemId === true);
    check("validação rejeita nível de inimigo alto", r.validaInimigoAlto === true);
    check("validação rejeita pesquisa não-objeto", r.validaNaoObjeto === true);
    check("Resetar NÃO zera a pesquisa de itens", r.itensAposReset === 3, r.itensAposReset);
    check("Resetar NÃO zera a análise de inimigos", r.inimAposReset === 2, r.inimAposReset);

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
