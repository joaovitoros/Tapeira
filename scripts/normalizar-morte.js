// Normaliza sequências de morte já fatiadas numa TELA FIXA: chão na base e
// corpo centralizado em TODOS os quadros.
//
// Por que: o jogo desenha cada quadro com `object-fit: contain` dentro da caixa
// do inimigo. Se os quadros têm tamanhos de tela e âncoras diferentes (as
// sequências antigas, recortadas justas do atlas), cada quadro é escalado e
// centralizado de um jeito — e o bicho "treme" de um lado pro outro.
//
// Uso:
//   node scripts/normalizar-morte.js normal2 poeira
//   node scripts/normalizar-morte.js            (todos)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const PASTA = path.join(__dirname, "..", "imagens", "inimigos", "morte");
// A caixa do inimigo no jogo é 120x130 e o quadro é desenhado com
// `object-fit: contain` (centralizado). Se a tela do quadro tiver OUTRA
// proporção, o navegador deixa tarja e CENTRALIZA o desenho — um quadro
// baixinho (a pilha) aparece no meio da caixa, flutuando, e o bicho "pula"
// de altura. Com a tela na mesma proporção (120:130) e o chão no pé, o
// contain preenche a caixa exata e o chão cai no lugar certo.
const RAZAO_CAIXA = 120 / 130;
const MARGEM_LATERAL = 4;
const MARGEM_BASE = 2;
const MARGEM_TOPO = 4;

const pedidos = process.argv.slice(2).filter(a => !a.startsWith("--"));
const tipos = pedidos.length
    ? pedidos
    : [...new Set(fs.readdirSync(PASTA).filter(n => /-\d\d\.png$/i.test(n)).map(n => n.replace(/-\d\d\.png$/i, "")))];

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    for (const tipo of tipos) {
        const arquivos = fs.readdirSync(PASTA).filter(n => n.startsWith(tipo + "-") && n.endsWith(".png")).sort();
        if (arquivos.length < 2) { console.log(`${tipo}: ${arquivos.length} quadro(s), pulando`); continue; }

        // 1) mede cada quadro (tela, caixa do desenho, chão e centro da base)
        const medidas = [];
        for (const nome of arquivos) {
            const b64 = fs.readFileSync(path.join(PASTA, nome)).toString("base64");
            const m = await page.evaluate(async (src) => {
                const img = new Image();
                await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = src; });
                const W = img.naturalWidth, H = img.naturalHeight;
                const c = document.createElement("canvas");
                c.width = W; c.height = H;
                const g = c.getContext("2d", { willReadFrequently: true });
                g.drawImage(img, 0, 0);
                const d = g.getImageData(0, 0, W, H).data;
                let x0 = W, x1 = -1, y0 = H, y1 = -1;
                for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                    if (d[(y * W + x) * 4 + 3] > 24) {
                        if (x < x0) x0 = x; if (x > x1) x1 = x;
                        if (y < y0) y0 = y; if (y > y1) y1 = y;
                    }
                }
                if (y1 < 0) return null;
                const faixa = Math.max(4, Math.round((y1 - y0 + 1) * 0.22));
                const xs = [];
                for (let x = x0; x <= x1; x++) {
                    for (let y = Math.max(0, y1 - faixa + 1); y <= y1; y++) {
                        if (d[(y * W + x) * 4 + 3] > 24) { xs.push(x + 0.5); break; }
                    }
                }
                xs.sort((a, b) => a - b);
                return { W, H, x0, x1, y0, y1, base: xs.length ? xs[xs.length >> 1] : (x0 + x1) / 2, img: src };
            }, "data:image/png;base64," + b64);
            medidas.push(m);
        }
        if (medidas.some(m => !m)) { console.log(`${tipo}: quadro vazio, pulando`); continue; }

        // 2) tela com a razão da caixa do jogo: maior desenho + margens, e a
        //    proporção 120:130 (cresce a largura se o desenho for alto demais)
        let largura = Math.max(...medidas.map(m => m.x1 - m.x0 + 1)) + MARGEM_LATERAL * 2;
        let altura = Math.round(largura / RAZAO_CAIXA);
        const altMinima = Math.max(...medidas.map(m => m.y1 - m.y0 + 1)) + MARGEM_BASE + MARGEM_TOPO;
        if (altura < altMinima) {
            altura = altMinima;
            largura = Math.round(altura * RAZAO_CAIXA);
        }

        // 3) recompoe tudo e grava por cima
        let trocados = 0;
        for (let i = 0; i < medidas.length; i++) {
            const m = medidas[i];
            const dataUrl = await page.evaluate(async ({ img, tela, margem }) => {
                const im = new Image();
                await new Promise((ok, err) => { im.onload = ok; im.onerror = err; im.src = img; });
                const c = document.createElement("canvas");
                c.width = im.naturalWidth; c.height = im.naturalHeight;
                const g = c.getContext("2d");
                g.drawImage(im, 0, 0);
                const desenho = document.createElement("canvas");
                desenho.width = tela.largura;
                desenho.height = tela.altura;
                const dg = desenho.getContext("2d");
                const cw = tela.x1 - tela.x0 + 1;
                const ch = tela.y1 - tela.y0 + 1;
                const dx = Math.round(desenho.width / 2 - (tela.base - tela.x0));
                const dy = desenho.height - margem - ch;
                dg.drawImage(c, tela.x0, tela.y0, cw, ch, dx, dy, cw, ch);
                return desenho.toDataURL("image/png");
            }, { img: m.img, tela: { largura, altura, x0: m.x0, x1: m.x1, y0: m.y0, y1: m.y1, base: m.base }, margem: MARGEM_BASE });
            const antes = medidas[i];
            // só regrava se mudou de verdade
            if (antes.W !== largura || antes.H !== altura || antes.y1 !== altura - MARGEM_BASE - 1) {
                fs.writeFileSync(path.join(PASTA, arquivos[i]), Buffer.from(dataUrl.split(",")[1], "base64"));
                trocados++;
            }
        }
        console.log(`${tipo}: ${arquivos.length} quadros -> tela ${largura}x${altura} (${trocados} regravados)`);
    }

    await browser.close();
})();
