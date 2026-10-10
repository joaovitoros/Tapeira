// Teste focado: camada de ambiente do evento (#eventoAmbiente) — o evento
// ativo aplica a classe, o fim limpa, e a camada nunca captura clique.
// Roda direto da fonte (raiz do projeto): node test-eventos-ambiente.js
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
        UI.showMilestone = () => {};
        UI.showInfo = () => {};
        window.ElegivelEvento = () => true;
        jogoPausado = false;

        IniciaEvento("nevoa");
        const el = document.getElementById("eventoAmbiente");
        check("evento ativo cria a camada com a classe do evento",
            !!el && el.className === "evento-nevoa", el ? el.className : "sem elemento");
        check("camada não captura clique (pointer-events none)",
            el && getComputedStyle(el).pointerEvents === "none", el ? getComputedStyle(el).pointerEvents : "-");
        check("camada fica atrás do HUD (z-index baixo)", el && Number(getComputedStyle(el).zIndex) <= 3,
            el ? getComputedStyle(el).zIndex : "-");

        EncerraEvento(true);
        const elDepois = document.getElementById("eventoAmbiente");
        check("fim do evento limpa a classe", elDepois && elDepois.className === "",
            elDepois ? JSON.stringify(elDepois.className) : "sem elemento");

        // inseto: wrapper com sombra no chão (a imagem fica dentro)
        IniciaEvento("inseto");
        const inseto = document.getElementById("eventoInseto");
        check("inseto usa wrapper com sombra no chão",
            inseto && inseto.classList.contains("evento-inseto-wrap")
            && getComputedStyle(inseto, "::after").content !== "none"
            && !!inseto.querySelector("img.evento-inseto"),
            inseto ? inseto.className : "sem inseto");
        EncerraEvento(true);

        // rastro do meteoro: faixa que cai no ponto onde o fragmento pousou
        CriaRastroMeteoro(document.body, 100, 100);
        check("rastro do meteoro criado", !!document.querySelector(".evento-meteoro-rastro"));

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
