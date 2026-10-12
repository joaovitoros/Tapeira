// Teste focado: Fazenda de Formigas (hub da Cidade) — Fase 4.
// Produção passiva (reusa o drop) + Rainha + save (5 passos).
// Roda direto da fonte (raiz do projeto): node test-fazenda.js
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
        UI.showMilestone = () => {};
        UI.showAntReward = () => {};
        const res = {};
        const totalFormigas = () => FORMIGAS.reduce((t, f) => t + (Number(window[f.contador]) || 0), 0);

        res.temApi = !!window.Tapeira?.Fazenda;
        res.maxNivel = window.Tapeira.Fazenda.MAX_NIVEL;
        res.maxRainha = window.Tapeira.Fazenda.RAINHA_MAX;

        // ---- Intervalo por nível ----
        res.iv0 = IntervaloFazendaMs(0, 0);       // Infinity (não construída)
        res.iv1 = IntervaloFazendaMs(1, 0);       // 90 s
        res.iv10 = IntervaloFazendaMs(10, 0);     // 36 s (90 − 6×9)
        res.multR0 = MultiplicadorRainhaFazenda(0);
        res.multR5 = MultiplicadorRainhaFazenda(5);
        res.ivRainha = IntervaloFazendaMs(1, 5);  // 90000 / 2.5 = 36000

        // ---- Custos ----
        res.custo0 = CustoFazendaNivel(0);
        res.custoR0 = CustoFazendaRainha(0);

        // ---- Compra de nível ----
        fazendaNivel = 0; fazendaRainha = 0;
        conhecimentoMug = 0;
        res.compraSemCM = CompraFazendaNivel(); // false
        conhecimentoMug = 100000;
        res.compraOk = CompraFazendaNivel();    // true
        res.nivelDepois = fazendaNivel;
        res.timerCriado = intervaloFazenda !== null;
        fazendaNivel = FAZENDA_MAX_NIVEL;
        conhecimentoMug = 1e9;
        res.compraNoMax = CompraFazendaNivel(); // false
        fazendaNivel = 0; SincronizaIntervaloFazenda();
        res.timerSemNivel = intervaloFazenda;

        // ---- Compra de Rainha ----
        fazendaRainha = 0;
        conhecimentoMug = 100000;
        res.rainhaOk = CompraFazendaRainha();   // true
        res.rainhaDepois = fazendaRainha;
        fazendaRainha = FAZENDA_RAINHA_MAX;
        res.rainhaNoMax = CompraFazendaRainha(); // false

        // ---- Produção (reusa o drop) ----
        fazendaNivel = 1; fazendaRainha = 0;
        jogoPausado = false; andar = 85; maxAndar = 120;
        const antes = totalFormigas();
        res.produzOk = ProduzFormigasFazenda();  // true
        res.produziu = totalFormigas() - antes;  // 1
        jogoPausado = true;
        const antesPausa = totalFormigas();
        res.produzPausado = ProduzFormigasFazenda(); // false
        res.naoProduziuPausado = totalFormigas() === antesPausa;
        jogoPausado = false;
        fazendaNivel = 0;
        res.produzSemNivel = ProduzFormigasFazenda(); // false
        fazendaNivel = 1;

        // ---- Save: os dois builders + validação ----
        fazendaNivel = 5; fazendaRainha = 3;
        const obj = CriarObjetoSave();
        res.saveNivel = obj.fazendaNivel;
        res.saveRainha = obj.fazendaRainha;
        const clone = (extra) => Object.assign(JSON.parse(JSON.stringify(obj)), extra);
        res.validaOk = (() => { try { ValidarSave(clone({})); return true; } catch { return false; } })();
        res.validaNivelRuim = (() => { try { ValidarSave(clone({ fazendaNivel: FAZENDA_MAX_NIVEL + 1 })); return false; } catch { return true; } })();
        res.validaNivelNeg = (() => { try { ValidarSave(clone({ fazendaNivel: -1 })); return false; } catch { return true; } })();
        res.validaRainhaRuim = (() => { try { ValidarSave(clone({ fazendaRainha: FAZENDA_RAINHA_MAX + 1 })); return false; } catch { return true; } })();

        // ---- Resetar NÃO zera a Fazenda ----
        fazendaNivel = 4; fazendaRainha = 2;
        Resetar();
        res.nivelAposReset = fazendaNivel;
        res.rainhaAposReset = fazendaRainha;

        return res;
    });

    check("API Tapeira.Fazenda existe", r.temApi === true);
    check("nível 0 não produz (intervalo infinito)", r.iv0 === null || !isFinite(r.iv0), r.iv0);
    check("intervalo nível 1 = 90 s", r.iv1 === 90000, r.iv1);
    check("intervalo nível 10 = 36 s", r.iv10 === 36000, r.iv10);
    check("Rainha: ×1 no 0 e ×2.5 no 5", r.multR0 === 1 && Math.abs(r.multR5 - 2.5) < 1e-9, r.multR0 + "/" + r.multR5);
    check("Rainha encurta o intervalo (90s → 36s)", r.ivRainha === 36000, r.ivRainha);
    check("custo do nível 0 = 3000 CM", r.custo0 === 3000, r.custo0);
    check("custo da Rainha 0 = 6000 CM", r.custoR0 === 6000, r.custoR0);
    check("compra sem CM falha", r.compraSemCM === false);
    check("compra com CM funciona", r.compraOk === true && r.nivelDepois === 1, r.nivelDepois);
    check("timer é criado ao construir", r.timerCriado === true);
    check("compra no máximo falha", r.compraNoMax === false);
    check("timer some sem nível", r.timerSemNivel === null);
    check("compra da Rainha funciona", r.rainhaOk === true && r.rainhaDepois === 1, r.rainhaDepois);
    check("Rainha no máximo falha", r.rainhaNoMax === false);
    check("produção reusa o drop (+1 formiga)", r.produzOk === true && r.produziu === 1, r.produziu);
    check("não produz com o jogo pausado", r.produzPausado === false && r.naoProduziuPausado === true);
    check("não produz sem nível", r.produzSemNivel === false);
    check("save grava fazendaNivel", r.saveNivel === 5, r.saveNivel);
    check("save grava fazendaRainha", r.saveRainha === 3, r.saveRainha);
    check("validação aceita fazenda válida", r.validaOk === true);
    check("validação rejeita nível acima do teto", r.validaNivelRuim === true);
    check("validação rejeita nível negativo", r.validaNivelNeg === true);
    check("validação rejeita Rainha acima do teto", r.validaRainhaRuim === true);
    check("Resetar NÃO zera o nível da Fazenda", r.nivelAposReset === 4, r.nivelAposReset);
    check("Resetar NÃO zera a Rainha", r.rainhaAposReset === 2, r.rainhaAposReset);

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
