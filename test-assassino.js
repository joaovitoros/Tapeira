// Teste focado: Assassino (comp 5) — hit kill dobrado (1% + 0,1%/nível manual;
// metade nos automáticos) e passiva de veneno (1% dos golpes tira 3% da vida
// máxima do andar), com efeitos visuais. Rode após `npm run prepare:web`:
// node test-assassino.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', e => {
        if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message);
    });
    await page.goto('file://' + path.resolve(__dirname, 'www', 'Caverna.html'));
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

    const resultados = await page.evaluate(() => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
        UI.showInfo = () => {};

        // ---- hit kill dobrado ----
        lvlComp5 = 1;
        check("hit kill manual base 1%", Math.abs(ChanceMorteAssassino(true) - 0.01) < 1e-9, ChanceMorteAssassino(true));
        check("hit kill automático base 0,5%", Math.abs(ChanceMorteAssassino(false) - 0.005) < 1e-9, ChanceMorteAssassino(false));
        lvlComp5 = 3;
        check("+0,1%/nível manual (nível 3 = 1,2%)", Math.abs(ChanceMorteAssassino(true) - 0.012) < 1e-9, ChanceMorteAssassino(true));

        // ---- veneno: constantes ----
        check("veneno 1% / 3%", CHANCE_VENENO_ASSASSINO === 0.01 && VENENO_ASSASSINO_PCT === 0.03);

        // ---- prepara um golpe controlado ----
        const prepara = () => {
            lvlComp5 = 1;
            vidaAndar = 1000;
            danoJogador = 1;
            danoCritJogador = 2;
            chanceCrit = 0;
            nivelJogador = 1;
            especializacao = 0;
            ataquesFrenesi = 0;
            formigasVermelhas = formigasAmarelas = formigasMarrons = formigasPretas = formigasCinzas = 0;
            Tapeira.ItensBuild.limpa();
            jogoPausado = false; fugaEmAndamento = false; missaoAtual = 0;
            andar = 7;
            window.vidaInimigo1 = 1000;
            window.ondaAtual = 1;
        };
        const comRandom = (seq, fn) => {
            const orig = Math.random;
            let i = 0;
            Math.random = () => (i < seq.length ? seq[i++] : 0.9);
            try { fn(); } finally { Math.random = orig; }
        };

        // ---- veneno dispara: dano extra de 3% (30) + efeito visual ----
        prepara();
        comRandom([0.9, 0.005, 0.9], () => Bater(1, true, true));
        check("veneno tirou 3% da vida máxima (1000 → 969)", Math.abs(window.vidaInimigo1 - 969) < 0.01, window.vidaInimigo1);
        check("efeito visual do veneno (.poison-number)", !!document.querySelector(".poison-number"));
        check("burst verde do veneno", !!document.querySelector(".enemy-impact-burst--veneno"));

        // ---- hit kill dispara: abate na hora + efeito visual ----
        prepara();
        const derrotadosAntes = N(totalDerrotados);
        comRandom([0.005], () => Bater(1, true, true));
        check("hit kill abate o inimigo na hora", N(totalDerrotados) > derrotadosAntes, N(totalDerrotados) - derrotadosAntes);
        check("efeito visual do hit kill (.hitkill-number)", !!document.querySelector(".hitkill-number"));
        check("burst vermelho do hit kill", !!document.querySelector(".enemy-impact-burst--hitkill"));

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
