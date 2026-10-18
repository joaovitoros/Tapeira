// Teste focado: HUD no celular. A fileira de habilidades e o menu de pause
// precisam CABER na tela (não estourar as laterais) nos tamanhos de celular.
// Roda direto da fonte (raiz do projeto): node test-mobile.js
const { chromium } = require('playwright');
const path = require('path');

const views = [
    { w: 320, h: 568 },
    { w: 360, h: 780 },
    { w: 390, h: 844 },
    { w: 412, h: 915 }
];

(async () => {
    const browser = await chromium.launch({ headless: true });
    const out = [];
    const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
    const erros = [];

    for (const v of views) {
        const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h }, isMobile: true, hasTouch: true });
        const page = await ctx.newPage();
        page.on('pageerror', e => { if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message); });
        await page.goto('file://' + path.resolve(__dirname, 'Caverna.html'));
        await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

        const r = await page.evaluate(() => {
            window.ChamaSom = () => {};
            maxAndar = 100; andar = 50;
            CarregaHabilidadesDesbloqueadas(false);
            AtualizaHabilidadesCombate();
            UI.removeSkill();
            UI.spawnSkill();

            const vw = window.innerWidth;
            const icone = document.getElementById("habilidade-dano").getBoundingClientRect();
            const botoes = [...document.querySelectorAll(".combate-habilidade")].filter(b => !b.hidden);
            const ultimo = botoes[botoes.length - 1].getBoundingClientRect();

            document.getElementById("infoModal")?.remove();
            PausarJogo();
            const painel = document.querySelector("#pauseOverlay .pause-panel").getBoundingClientRect();

            return {
                vw,
                skillsDentro: icone.left >= -1 && ultimo.right <= vw + 1,
                skills: Math.round(icone.left) + ".." + Math.round(ultimo.right),
                pauseDentro: painel.left >= -1 && painel.right <= vw + 1,
                pause: Math.round(painel.left) + ".." + Math.round(painel.right)
            };
        });

        check("fileira de skills cabe (" + v.w + "px)", r.skillsDentro, r.skills + " de " + r.vw);
        check("menu de pause cabe (" + v.w + "px)", r.pauseDentro, r.pause + " de " + r.vw);
        await ctx.close();
    }

    await browser.close();
    let falhas = 0;
    for (const r of out) {
        if (!r.ok) falhas++;
        console.log((r.ok ? "OK   " : "FAIL ") + r.nome + (r.detalhe ? "  (" + r.detalhe + ")" : ""));
    }
    if (erros.length) { console.log("erros de pagina: " + erros.join(" | ")); falhas++; }
    console.log("\n" + (out.length - falhas) + "/" + out.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
