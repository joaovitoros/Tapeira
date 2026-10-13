// Teste focado: TESTE VISUAL (dev) — fundos e inimigos novos por faixa de 10
// andares. Ligado pelo painel de dev (?dev=1), só visual.
// Roda direto da fonte (raiz do projeto): node test-teste-visual.js
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

        const TV = window.Tapeira.TesteVisual;
        const fundoAgora = () =>
            getComputedStyle(document.getElementById("fundoA")).getPropertyValue("--fundo-img") + "|" +
            getComputedStyle(document.getElementById("fundoB")).getPropertyValue("--fundo-img");

        check("módulo existe", !!TV);
        check("10 fundos", TV.FUNDOS.length === 10, TV.FUNDOS.length);
        check("14 inimigos", TV.INIMIGOS.length === 14, TV.INIMIGOS.length);
        check("padrão: desligado", TV.ATIVO() === false);

        // faixas de 10 andares
        check("andar 1 -> faixa 0", TV.tier(1) === 0, TV.tier(1));
        check("andar 10 -> faixa 0", TV.tier(10) === 0, TV.tier(10));
        check("andar 11 -> faixa 1", TV.tier(11) === 1, TV.tier(11));
        check("andar 20 -> faixa 1", TV.tier(20) === 1, TV.tier(20));
        check("andar 21 -> faixa 2", TV.tier(21) === 2, TV.tier(21));

        // o checkbox vive no painel de dev
        const chk = document.querySelector("#game-dev-tools [data-teste-visual]");
        check("checkbox no painel de dev", !!chk);

        // ligar pela API
        andar = 12; // faixa 1
        TV.define(true);
        check("ligou", TV.ATIVO() === true);
        check("inimigo da faixa aplicado nos 4",
            [1, 2, 3, 4].every(i => document.getElementById("inimigo" + i).src.includes("inimigos/" + TV.INIMIGOS[1].split("/")[1])));
        check("fundo da faixa aplicado", fundoAgora().includes(TV.FUNDOS[1].split("/")[1]));

        // dentro da mesma faixa o fundo NÃO troca
        const antes = fundoAgora();
        andar = 15; ProximoFundo();
        check("não troca de fundo dentro da faixa", fundoAgora() === antes);

        // ao mudar de faixa, troca
        andar = 21; ProximoFundo();
        const depois = fundoAgora();
        check("troca o fundo ao mudar de faixa",
            depois !== antes && depois.includes(TV.FUNDOS[2].split("/")[1]), depois.slice(0, 60));
        check("inimigo acompanha a faixa nova", TV.inimigo().includes(TV.INIMIGOS[2].split("/")[1]));

        // surge de inimigo aplica o sprite da faixa
        const el = document.getElementById("inimigo1");
        el.src = "imagens/personagens/inimigo.png";
        SurgeInimigo(el);
        check("SurgeInimigo troca o sprite", el.src.includes("inimigos/" + TV.INIMIGOS[2].split("/")[1]));

        // ---- morte animada POR CRIATURA ----
        const criaturaEsperada = TV.INIMIGOS[2].split("/")[1].replace(".png", "");
        check("o elemento guarda a criatura", el.dataset.criatura === criaturaEsperada, el.dataset.criatura);
        const fr = TV.morteFrames(el);
        check("quadros de morte da criatura",
            Array.isArray(fr) && fr.length >= 3 && fr[1].includes("inimigos/morte/" + criaturaEsperada + "-01.png"),
            fr ? fr.length + " quadros" : "null");
        el.style.visibility = "visible";
        animarMorte(el);
        const anim = document.querySelector(".morteAnim");
        check("morteAnim começa no sprite (transição colada)",
            !!anim && anim.src.includes(criaturaEsperada + ".png"),
            anim ? anim.src.split("/").slice(-2).join("/") : "sem");
        await new Promise(r => setTimeout(r, 220));
        const animMeio = document.querySelector(".morteAnim");
        check("morteAnim passa pros quadros da criatura",
            !!animMeio && animMeio.src.includes("inimigos/morte/" + criaturaEsperada + "-"),
            animMeio ? animMeio.src.split("/").slice(-2).join("/") : "sem");
        LimpaEfeitosMorte();

        // sem o teste, a morte volta a ser a genérica
        TV.define(false);
        el.style.visibility = "visible";
        animarMorte(el);
        const anim2 = document.querySelector(".morteAnim");
        check("desligado usa a morte genérica",
            !!anim2 && anim2.src.includes("animacoes/morte/"),
            anim2 ? anim2.src.split("/").slice(-2).join("/") : "sem");
        LimpaEfeitosMorte();
        TV.define(true);
        andar = 12;

        // desligar volta tudo ao padrão
        TV.define(false);
        check("desligou", TV.ATIVO() === false);
        check("inimigo volta ao padrão",
            [1, 2, 3, 4].every(i => document.getElementById("inimigo" + i).src.includes("personagens/inimigo.png")));
        check("preferência persistida no localStorage",
            (localStorage.getItem("tapeiraTesteVisual") || "") === "0", localStorage.getItem("tapeiraTesteVisual"));

        // sem o teste ligado, SurgeInimigo não mexe no sprite
        el.src = "imagens/personagens/inimigo.png";
        SurgeInimigo(el);
        check("desligado: SurgeInimigo não troca", el.src.includes("personagens/inimigo.png"));
        return out;
    });

    // o checkbox do painel liga/desliga de verdade (via evento, sem depender do
    // clique — o #infoModal pode aparecer por cima e interceptar)
    const alternaCheckbox = (ligar) => page.evaluate((v) => {
        const chk = document.querySelector("#game-dev-tools [data-teste-visual]");
        chk.checked = v;
        chk.dispatchEvent(new Event("change", { bubbles: true }));
    }, ligar);
    await alternaCheckbox(true);
    const ligado = await page.evaluate(() => window.Tapeira.TesteVisual.ATIVO());
    await alternaCheckbox(false);
    const desligado = await page.evaluate(() => window.Tapeira.TesteVisual.ATIVO());
    resultados.push({ nome: "checkbox do painel liga", ok: ligado === true, detalhe: String(ligado) });
    resultados.push({ nome: "checkbox do painel desliga", ok: desligado === false, detalhe: String(desligado) });

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
