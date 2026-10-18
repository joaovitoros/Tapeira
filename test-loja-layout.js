// Teste focado: a Loja é um OVERLAY de tela cheia (fade + painel centrado).
// O que precisa valer em qualquer resolução:
//   1. o PAINEL (#container-Loja > #Loja) cabe inteiro na tela;
//   2. o painel respeita os máximos do desenho (1300x850);
//   3. o fade (::before) cobre a viewport quando a loja está aberta;
//   4. a área do overlay (#container-Loja) vai do topo até acima da faixa
//      inferior (não estoura o rodapé).
// Roda direto da fonte: node test-loja-layout.js
//
// Reescrito em 13/10/2026: o teste antigo media #container-Loja como se fosse o
// painel — desde o redesign "LOJA (overlay + painel)" (css/estilos.css ~13979)
// o container é a ÁREA do overlay e o painel é o filho #Loja.
const { chromium } = require('playwright');
const path = require('path');

const views = [
    { w: 1920, h: 1080 }, { w: 1600, h: 900 }, { w: 1440, h: 900 }, { w: 1400, h: 900 },
    { w: 1366, h: 768 }, { w: 1280, h: 800 }, { w: 1280, h: 720 }, { w: 1200, h: 900 },
    { w: 1100, h: 800 }, { w: 1024, h: 768 }, { w: 900, h: 700 }, { w: 850, h: 1000 }, { w: 800, h: 600 }
];

const MAX_W = 1300, MAX_H = 850;

(async () => {
    const browser = await chromium.launch({ headless: true });
    const out = [];
    const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
    const erros = [];

    for (const v of views) {
        const ctx = await browser.newContext({ viewport: { width: v.w, height: v.h } });
        const page = await ctx.newPage();
        page.on('pageerror', e => { if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message); });
        await page.goto('file://' + path.resolve(__dirname, 'Caverna.html'));
        await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

        const r = await page.evaluate((MAX) => {
            window.ChamaSom = () => {};
            document.getElementById("infoModal")?.remove();
            andar = 12; maxAndar = 12;
            // missão ativa deixa o card do topo mais alto (pior caso)
            missaoAtual = 2; missaoGolpeAtual = 0; missaoGolpe = 10;
            UI.updateMission();
            AbreLoja(false);
            const caixa = (el) => { const b = el.getBoundingClientRect(); return { top: b.top, bottom: b.bottom, left: b.left, right: b.right, w: b.width, h: b.height }; };
            const area = document.getElementById("container-Loja");
            const painel = document.querySelector("#container-Loja > #Loja");
            const a = caixa(area);
            const p = painel ? caixa(painel) : null;
            const antes = getComputedStyle(area, "::before");
            const visivel = painel
                ? (getComputedStyle(painel).visibility === "visible" && p.h > 0 && p.w > 0)
                : false;
            return {
                vw: window.innerWidth, vh: window.innerHeight,
                area: a, painel: p, visivel,
                fadePosition: antes.position,
                fadeTop: antes.top, fadeLeft: antes.left,
                fadeImagem: antes.backgroundImage
            };
        }, { MAX_W, MAX_H });

        const rotulo = " (" + v.w + "x" + v.h + ")";
        const p = r.painel;
        const detalhePainel = p ? ("painel=" + Math.round(p.left) + "," + Math.round(p.top) + " " +
            Math.round(p.w) + "x" + Math.round(p.h)) : "painel ausente";

        check("Painel da Loja visível" + rotulo, r.visivel, "painel=" + JSON.stringify(p));
        check("Painel da Loja cabe na tela" + rotulo,
            !!p && p.top >= -1 && p.left >= -1 && p.bottom <= r.vh + 1 && p.right <= r.vw + 1,
            detalhePainel + " vw=" + r.vw + " vh=" + r.vh);
        check("Painel da Loja respeita os máximos " + MAX_W + "x" + MAX_H + rotulo,
            !!p && p.w <= MAX_W + 1 && p.h <= MAX_H + 1,
            detalhePainel);
        check("Fade da Loja cobre a viewport" + rotulo,
            r.fadePosition === "fixed" && r.fadeTop === "0px" && r.fadeLeft === "0px" && r.fadeImagem !== "none",
            "position=" + r.fadePosition + " top=" + r.fadeTop + " left=" + r.fadeLeft + " bg=" + (r.fadeImagem === "none" ? "none" : "sim"));
        check("Área do overlay vai do topo até a faixa inferior" + rotulo,
            r.area.top <= 24 && r.area.bottom <= r.vh + 1 && r.area.h >= 0.5 * r.vh,
            "area=" + Math.round(r.area.top) + ".." + Math.round(r.area.bottom) + " vh=" + r.vh);

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
