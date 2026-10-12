// Teste focado: Mercado (hub da Cidade) — Fase 6.
// Reputação (desconto nas lojas) + vender excedentes (itens/formigas) + save.
// Roda direto da fonte (raiz do projeto): node test-mercado.js
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
        UI.showCurrencyReward = () => {};
        const res = {};

        res.temApi = !!window.Tapeira?.Mercado;
        res.max = window.Tapeira.Mercado.REPUTACAO_MAX;

        // ---- desconto ----
        reputacao = 0;
        res.preco0 = PrecoComReputacao(100);
        reputacao = 5;
        res.preco5 = PrecoComReputacao(100);
        res.cm0 = (reputacao = 0, PrecoLojaCM(0));
        res.cm10 = (reputacao = 10, PrecoLojaCM(0));

        // ---- custo/compra ----
        reputacao = 0;
        res.custo0 = CustoReputacao(0);
        conhecimentoMug = 0;
        res.semCM = CompraReputacao(); // false
        conhecimentoMug = 100000;
        res.ok = CompraReputacao();    // true
        res.nivel = reputacao;
        reputacao = REPUTACAO_MAX;
        conhecimentoMug = 1e9;
        res.noMax = CompraReputacao(); // false

        // ---- excedentes (formigas fora dos conjuntos de 10) ----
        formigasVermelhas = 17; formigasAmarelas = 3; formigasMarrons = 0; formigasPretas = 0; formigasCinzas = 0;
        res.excedentes = FormigasExcedentes().reduce((t, e) => t + e.qtd, 0); // 7 + 3 = 10
        andar = 82; mulGold = 1; vidaAndar = 0;
        const venda = VenderExcedentes();
        res.vendaOk = venda.formigas === 10 && venda.gold > 0;
        res.restoVermelhas = formigasVermelhas; // 10
        res.restoAmarelas = formigasAmarelas;   // 0

        // ---- vender sem excedentes ----
        const vazio = VenderExcedentes();
        res.vazio = vazio.itens === 0 && vazio.formigas === 0 && vazio.gold === 0;

        // ---- itens: sem build, 0 excedentes ----
        res.itensExcedentes = ItensExcedentes(); // 0
        res.vendeuItens = Tapeira.ItensBuild.vendeDuplicatas(); // 0

        // ---- save ----
        reputacao = 4;
        const obj = CriarObjetoSave();
        res.saveRep = obj.reputacao;
        const clone = (extra) => Object.assign(JSON.parse(JSON.stringify(obj)), extra);
        res.validaOk = (() => { try { ValidarSave(clone({})); return true; } catch { return false; } })();
        res.validaAlto = (() => { try { ValidarSave(clone({ reputacao: REPUTACAO_MAX + 1 })); return false; } catch { return true; } })();
        res.validaNeg = (() => { try { ValidarSave(clone({ reputacao: -1 })); return false; } catch { return true; } })();

        // ---- Resetar NÃO zera ----
        reputacao = 3;
        Resetar();
        res.aposReset = reputacao;

        return res;
    });

    check("API Tapeira.Mercado existe", r.temApi === true);
    check("sem reputação o preço não muda", r.preco0 === 100, r.preco0);
    check("reputação 5 → -10% (90)", Math.abs(r.preco5 - 90) < 1e-9, r.preco5);
    check("PrecoLojaCM sem reputação = 10", r.cm0 === 10, r.cm0);
    check("PrecoLojaCM reputação máx = 8 (-20%)", r.cm10 === 8, r.cm10);
    check("custo da reputação nível 0 = 50000 CM", r.custo0 === 50000, r.custo0);
    check("compra sem CM falha", r.semCM === false);
    check("compra com CM funciona", r.ok === true && r.nivel === 1, r.nivel);
    check("reputação no máximo falha", r.noMax === false);
    check("formigas fora do conjunto contam", r.excedentes === 10, r.excedentes);
    check("vender excedentes credita gold e sobra só os conjuntos", r.vendaOk === true, JSON.stringify({ restoV: r.restoVermelhas, restoA: r.restoAmarelas }));
    check("sobra 10 vermelhas (1 conjunto) e 0 amarelas", r.restoVermelhas === 10 && r.restoAmarelas === 0);
    check("vender sem excedentes não credita", r.vazio === true);
    check("sem build não há itens excedentes", r.itensExcedentes === 0 && r.vendeuItens === 0);
    check("save grava reputacao", r.saveRep === 4, r.saveRep);
    check("validação aceita reputação válida", r.validaOk === true);
    check("validação rejeita reputação acima do teto", r.validaAlto === true);
    check("validação rejeita reputação negativa", r.validaNeg === true);
    check("Resetar NÃO zera a reputação", r.aposReset === 3, r.aposReset);

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
