// Teste focado: BIOMAS — fundo e inimigos por faixa de 10 andares (oficial, só
// visual) + morte animada por criatura. Sem gate de dev.
// Roda direto da fonte (raiz do projeto): node test-biomas.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', e => {
        if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message);
    });
    await page.goto('file://' + path.resolve(__dirname, 'Caverna.html') + '?dev=1');
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

    const resultados = await page.evaluate(async () => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
        window.ChamaSom = () => {};
        UI.showInfo = () => {};

        const B = window.Tapeira.Biomas;
        const fundoAgora = () =>
            getComputedStyle(document.getElementById("fundoA")).getPropertyValue("--fundo-img") + "|" +
            getComputedStyle(document.getElementById("fundoB")).getPropertyValue("--fundo-img");

        check("módulo de biomas existe", !!B);
        check("10 fundos", B.FUNDOS.length === 10, B.FUNDOS.length);
        check("14 inimigos", B.INIMIGOS.length === 14, B.INIMIGOS.length);
        check("13 criaturas com morte própria", Object.keys(B.MORTE).length === 13, Object.keys(B.MORTE).length);

        // faixas de 10 andares
        check("andar 1 -> faixa 0", B.tier(1) === 0, B.tier(1));
        check("andar 10 -> faixa 0", B.tier(10) === 0, B.tier(10));
        check("andar 11 -> faixa 1", B.tier(11) === 1, B.tier(11));
        check("andar 21 -> faixa 2", B.tier(21) === 2, B.tier(21));

        // já vem aplicado (não tem mais toggle): na faixa 0 o inimigo é o "normal"
        andar = 5;
        B.aplicaInimigos();
        check("inimigo da faixa aplicado nos 4",
            [1, 2, 3, 4].every(i => document.getElementById("inimigo" + i).src.includes("inimigos/normal.png")));
        check("criatura guardada no elemento",
            document.getElementById("inimigo1").dataset.criatura === "normal",
            document.getElementById("inimigo1").dataset.criatura);
        check("fundo da faixa aplicado (andar 5)",
            fundoAgora().includes("fundo-cristais-congelados.jpg"), fundoAgora().slice(0, 70));

        // dentro da faixa o fundo NÃO troca; ao mudar de faixa, troca
        const antes = fundoAgora();
        andar = 8; ProximoFundo();
        check("não troca de fundo dentro da faixa", fundoAgora() === antes);
        andar = 11; ProximoFundo();
        const depois = fundoAgora();
        check("troca o fundo ao mudar de faixa",
            depois !== antes && depois.includes("fundo-steampunk.jpg"), depois.slice(0, 70));
        check("inimigo acompanha a faixa nova", B.inimigo().includes("inimigos/vegetal.png"), B.inimigo());

        // surge de inimigo aplica o sprite da faixa
        const el = document.getElementById("inimigo1");
        el.src = "imagens/personagens/inimigo.png";
        SurgeInimigo(el);
        check("SurgeInimigo aplica o sprite da faixa",
            el.src.includes("inimigos/vegetal.png"), el.src.split("/").pop());

        // morte animada POR CRIATURA
        const fr = B.morteFrames(el);
        check("quadros de morte da criatura",
            Array.isArray(fr) && fr.length >= 3 && fr[1].includes("inimigos/morte/vegetal-01.png"),
            fr ? fr.length + " quadros" : "null");
        el.style.visibility = "visible";
        animarMorte(el);
        const anim = document.querySelector(".morteAnim");
        check("morteAnim começa no sprite (transição colada)",
            !!anim && anim.src.includes("vegetal.png"), anim ? anim.src.split("/").pop() : "sem");
        await new Promise(r => setTimeout(r, 220));
        const animMeio = document.querySelector(".morteAnim");
        check("morteAnim passa pros quadros da criatura",
            !!animMeio && animMeio.src.includes("inimigos/morte/vegetal-"),
            animMeio ? animMeio.src.split("/").slice(-2).join("/") : "sem");
        LimpaEfeitosMorte();

        // criatura sem morte própria cai na genérica
        el.dataset.criatura = "madeira";
        check("sem quadros próprios -> null (usa a genérica)", B.morteFrames(el) === null);

        // o painel de dev continua existindo, mas SEM o toggle do teste visual
        check("painel de dev presente", !!document.getElementById("game-dev-tools"));
        check("toggle do teste visual saiu do dev-tools",
            !document.querySelector("#game-dev-tools [data-teste-visual]"));
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
