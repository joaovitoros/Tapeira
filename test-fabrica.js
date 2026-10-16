// Teste focado: Fábrica (hub da Cidade) — Fase 7.
// Forja (2 cópias → 1 melhorada, mesmo efeito e menos slot) + Linha de montagem.
// Roda direto da fonte (raiz do projeto): node test-fabrica.js
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
        const IB = window.Tapeira.ItensBuild;

        res.temApi = !!window.Tapeira?.Fazenda && !!window.Tapeira?.Fabrica;
        res.max = window.Tapeira.Fabrica.MAX_NIVEL;

        // ---- custo / linhas ----
        res.custo0 = CustoFabricaNivel(0);
        fabricaNivel = 0; res.linhas0 = LinhasMontagem();
        fabricaNivel = 3; res.linhas3 = LinhasMontagem();
        res.linhasProx = LinhasMontagem(4); // 5

        // ---- compra ----
        fabricaNivel = 0;
        conhecimentoMug = 0;
        res.semCM = CompraFabricaNivel(); // false
        conhecimentoMug = 1000000;
        res.ok = CompraFabricaNivel();    // true
        res.nivel = fabricaNivel;
        fabricaNivel = FABRICA_MAX_NIVEL;
        conhecimentoMug = 1e9;
        res.noMax = CompraFabricaNivel(); // false

        // ---- forja: adiciona 2 cópias do MESMO item via baú de build ----
        maxAndar = 100; andar = 100;
        let ops = null;
        UI.showEscolhaItensBuild = (o) => { ops = o; };
        UI.spawnBauBuild = () => {};
        UI.removeBauBuild = () => {};
        UI.fechaEscolhaItensBuild = () => {};
        const randOrig = Math.random;
        Math.random = () => 0; // sorteio determinístico (mesmos 3 itens sempre)
        IB.tentaBau();
        IB.abreEscolha();
        const alvo = ops[0];
        IB.escolhe(alvo);
        IB.tentaBau();
        IB.abreEscolha();
        IB.escolhe(alvo);
        Math.random = randOrig;
        res.alvo = alvo;
        res.copias = IB.copias(alvo);            // 2
        res.efetivasAntes = IB.copiasEfetivas(alvo); // 2
        // forja custa gold (escala com o andar)
        andar = 100; mulGold = 1; vidaAndar = 100;
        res.custoForja = CustoForjaItem();
        gold = new GoldNumber(0);
        res.forjaSemGold = ForjaItem(alvo);      // false
        res.copiasIntactas = IB.copias(alvo);    // 2 (não forjou)
        gold = new GoldNumber(res.custoForja * 10);
        const goldAntes = gold.toNumber();
        res.podeForjar = IB.podeForjar(alvo);    // true
        res.forjou = ForjaItem(alvo);            // true
        res.descontouGold = gold.toNumber() < goldAntes;
        res.copiasDepois = IB.copias(alvo);      // 0
        res.forjaNivel = IB.nivelForja(alvo);    // 1
        res.efetivasDepois = IB.copiasEfetivas(alvo); // 2 (mesmo efeito)
        res.podeForjarDepois = IB.podeForjar(alvo); // false (0 cópias)
        res.forjarSemCopias = ForjaItem(alvo);   // false

        // a tela de itens da build mostra a forja
        UI.showItensBuild();
        const view = document.getElementById("modalItensBuildView");
        res.viewForja = /forjada/.test(view?.textContent || "");
        view?.remove();
        res.resumoForja = /forjada/.test(IB.resumo());

        // ---- save ----
        fabricaNivel = 4;
        const obj = CriarObjetoSave();
        res.saveNivel = obj.fabricaNivel;
        res.saveForja = JSON.stringify(obj.forja);
        const clone = (extra) => Object.assign(JSON.parse(JSON.stringify(obj)), extra);
        res.validaOk = (() => { try { ValidarSave(clone({})); return true; } catch { return false; } })();
        res.validaNivelAlto = (() => { try { ValidarSave(clone({ fabricaNivel: FABRICA_MAX_NIVEL + 1 })); return false; } catch { return true; } })();
        res.validaForjaId = (() => { try { ValidarSave(clone({ forja: { xyz: 1 } })); return false; } catch { return true; } })();
        res.validaForjaAlto = (() => { try { ValidarSave(clone({ forja: { [alvo]: 999 } })); return false; } catch { return true; } })();
        res.validaForjaNaoObj = (() => { try { ValidarSave(clone({ forja: [1, 2] })); return false; } catch { return true; } })();

        // ---- Resetar: fabricaNivel permanece; a forja (build) zera ----
        fabricaNivel = 5;
        Resetar();
        res.nivelAposReset = fabricaNivel;
        res.forjaAposReset = IB.nivelForja(alvo);

        return res;
    });

    check("API Tapeira.Fabrica existe", r.temApi === true);
    check("custo do nível 0 = 20000 CM", r.custo0 === 20000, r.custo0);
    check("linha nível 0 = 1 auto-compra/s", r.linhas0 === 1, r.linhas0);
    check("linha nível 3 = 4 auto-compras/s", r.linhas3 === 4, r.linhas3);
    check("linha nível 4 = 5 auto-compras/s", r.linhasProx === 5, r.linhasProx);
    check("compra sem CM falha", r.semCM === false);
    check("compra com CM funciona", r.ok === true && r.nivel === 1, r.nivel);
    check("linha no máximo falha", r.noMax === false);
    check("2 cópias do mesmo item (via baú)", r.copias === 2, r.copias);
    check("forja custa gold (> 0)", r.custoForja > 0, r.custoForja);
    check("sem gold não forja", r.forjaSemGold === false && r.copiasIntactas === 2);
    check("forja desconta o gold", r.descontouGold === true);
    check("forja junta 2 cópias em 1 melhorada", r.forjou === true && r.copiasDepois === 0 && r.forjaNivel === 1, JSON.stringify({ c: r.copiasDepois, f: r.forjaNivel }));
    check("efeito é preservado após a forja (2 cópias efetivas)", r.efetivasAntes === 2 && r.efetivasDepois === 2, r.efetivasAntes + "→" + r.efetivasDepois);
    check("não dá pra forjar sem 2 cópias", r.podeForjarDepois === false && r.forjarSemCopias === false);
    check("tela de itens da build mostra a forja", r.viewForja === true);
    check("resumo da build mostra a forja", r.resumoForja === true);
    check("save grava fabricaNivel", r.saveNivel === 4, r.saveNivel);
    check("save grava a forja", r.saveForja === '{"' + r.alvo + '":1}', r.saveForja);
    check("validação aceita fábrica válida", r.validaOk === true);
    check("validação rejeita nível acima do teto", r.validaNivelAlto === true);
    check("validação rejeita id de forja desconhecido", r.validaForjaId === true);
    check("validação rejeita nível de forja alto", r.validaForjaAlto === true);
    check("validação rejeita forja não-objeto", r.validaForjaNaoObj === true);
    check("Resetar NÃO zera a linha de montagem", r.nivelAposReset === 5, r.nivelAposReset);
    check("Resetar zera a forja (é da build)", r.forjaAposReset === 0, r.forjaAposReset);

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
