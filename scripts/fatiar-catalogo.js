// Fatiador do CATÁLOGO de monstros (one-off, roda com Playwright).
//
// A "Catálogo de Monstros Cogumelo MUGI.png" tem 14 TIPOS numa grade 2 colunas x
// 7 linhas (1..7 na esquerda, 9..15 na direita) e cada tipo ocupa UMA LINHA com 4
// POSES (parado, ataque, dano, morte). O rótulo ("1. Normal") fica no canto
// superior esquerdo da célula.
//
// Saída: UMA TIRA POR TIPO (as 4 poses juntas), preservando o fundo original.
// O corte é por PROJEÇÃO dentro de cada célula:
//   1) a máscara de "conteúdo" é o alfa (se a folha tiver transparência) ou o
//      que não é preto (se o fundo for preto opaco);
//   2) a projeção em Y acha a FAIXA dos sprites (o rótulo é uma faixa fina
//      separada por um vão -> o maior bloco contíguo é a dos sprites);
//   3) a projeção em X dentro da faixa acha as poses; a tira vai da 1ª à última.
//
// Uso: node scripts/fatiar-catalogo.js [folha] [pastaSaida]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const folha = process.argv[2]
    || path.join(RAIZ, "imagens", "inimigos-futuros", "Catálogo de Monstros Cogumelo MUGI.png");
const pastaSaida = process.argv[3] || path.join(RAIZ, "imagens", "inimigos-futuros", "catalogo");

// Nomes por LINHA da grade: esquerda (1..7) e direita (9..15), de cima pra baixo.
const ESQUERDA = ["normal", "gigante", "cristal", "vegetal", "metalico", "terra-vulcanica", "neve"];
const DIREITA  = ["rei", "gelo", "lava", "toxico", "fantasma", "carnivora", "sombrio"];
const COLUNAS = 2, LINHAS = 7;

const dataUrl = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const saida = await page.evaluate(async ({ url, colunas, linhas }) => {
        const img = new Image();
        await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = url; });
        const W = img.naturalWidth, H = img.naturalHeight;
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        const orig = cx.getImageData(0, 0, W, H).data;
        const at = (x, y) => (y * W + x) * 4;

        // 1) máscara de conteúdo: transparência (alfa) ou "não-preto"
        let transparente = 0;
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (orig[at(x, y) + 3] < 128) transparente++;
        const usaAlfa = transparente > (W * H) * 0.05;
        const conteudo = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const i = at(x, y);
            const ok = usaAlfa
                ? orig[i + 3] >= 128
                : (orig[i] + orig[i + 1] + orig[i + 2]) > 40; // preto ~0
            if (ok) conteudo[y * W + x] = 1;
        }

        const cw = Math.floor(W / colunas), ch = Math.floor(H / linhas);
        const tiras = [];

        // As linhas do catálogo têm ALTURAS DIFERENTES (a grade H/7 desalinha) e
        // na coluna direita duas linhas chegam a se tocar. Solução em 2 passos:
        //   1) divisórias = os VÃOS reais (linhas quase vazias da projeção Y);
        //   2) se ainda faltar linha, divide a faixa mais alta no seu vale
        //      interno (o ponto de menor conteúdo).
        const faixasPorColuna = [];
        for (let c = 0; c < colunas; c++) {
            const cx0 = c * cw, cx1 = Math.min(W, cx0 + cw);
            const projY = [];
            for (let y = 0; y < H; y++) {
                let n = 0;
                for (let x = cx0; x < cx1; x++) if (conteudo[y * W + x]) n++;
                projY.push(n);
            }
            const vazios = [];
            let ini = -1;
            for (let y = 0; y < H; y++) {
                const v = projY[y] <= 3;
                if (v) { if (ini < 0) ini = y; }
                else if (ini >= 0) { if (y - ini >= 4) vazios.push({ y0: ini, y1: y - 1 }); ini = -1; }
            }
            if (ini >= 0 && H - ini >= 4) vazios.push({ y0: ini, y1: H - 1 });

            const brutas = [];
            let y = 0;
            for (const v of vazios) {
                if (v.y0 > y) brutas.push({ y0: y, y1: v.y0 - 1 });
                y = Math.max(y, v.y1 + 1);
            }
            if (y <= H - 1) brutas.push({ y0: y, y1: H - 1 });

            // junta faixas-fragmento (pouco conteúdo) na anterior
            const faixas = [];
            for (const f of brutas) {
                let alt = 0;
                for (let yy = f.y0; yy <= f.y1; yy++) if (projY[yy] > 3) alt++;
                if (faixas.length && alt < 40) faixas[faixas.length - 1].y1 = f.y1;
                else faixas.push({ y0: f.y0, y1: f.y1 });
            }

            while (faixas.length < linhas && faixas.length > 0) {
                let idx = 0, alt = -1;
                faixas.forEach((f, i) => { const a = f.y1 - f.y0; if (a > alt) { alt = a; idx = i; } });
                if (alt < 40) break;
                const f = faixas[idx];
                const a0 = f.y0 + Math.floor((f.y1 - f.y0) * 0.3);
                const a1 = f.y0 + Math.floor((f.y1 - f.y0) * 0.7);
                let corte = a0, minimo = Infinity;
                for (let yy = a0; yy <= a1; yy++) if (projY[yy] < minimo) { minimo = projY[yy]; corte = yy; }
                faixas.splice(idx, 1, { y0: f.y0, y1: corte }, { y0: corte + 1, y1: f.y1 });
            }
            faixasPorColuna.push({ cx0, cx1, faixas });
        }

        for (let c = 0; c < colunas; c++) {
            const { cx0, cx1, faixas } = faixasPorColuna[c];
            faixas.forEach((fx, l) => {
                // aperta a faixa no conteúdo real
                let y0 = -1, y1 = -1, x0 = -1, x1 = -1;
                for (let y = fx.y0; y <= fx.y1; y++) {
                    let achou = false;
                    for (let x = cx0; x < cx1; x++) {
                        if (!conteudo[y * W + x]) continue;
                        achou = true;
                        if (x0 < 0 || x < x0) x0 = x;
                        if (x > x1) x1 = x;
                    }
                    if (achou) { if (y0 < 0) y0 = y; y1 = y; }
                }
                if (y0 < 0) return;
                tiras.push({ c, l, x0, y0, x1, y1 });
            });
        }

        // recorta (fundo original preservado)
        const PAD = 6;
        const recortes = tiras.map(t => {
            const a = Math.max(0, t.x0 - PAD), b = Math.max(0, t.y0 - PAD);
            const x1 = Math.min(W - 1, t.x1 + PAD), y1 = Math.min(H - 1, t.y1 + PAD);
            const w = x1 - a + 1, h = y1 - b + 1;
            const c2 = document.createElement("canvas");
            c2.width = w; c2.height = h;
            const cx2 = c2.getContext("2d");
            const rec = cx2.createImageData(w, h);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const si = at(a + x, b + y), di = (y * w + x) * 4;
                rec.data[di] = orig[si]; rec.data[di + 1] = orig[si + 1];
                rec.data[di + 2] = orig[si + 2]; rec.data[di + 3] = orig[si + 3];
            }
            cx2.putImageData(rec, 0, 0);
            return { url: c2.toDataURL("image/png"), w, h, c: t.c, l: t.l };
        });

        // montagem de conferência (2 colunas x 7 linhas, com o nº da célula)
        const cell = 300;
        const mont = document.createElement("canvas");
        mont.width = colunas * cell; mont.height = linhas * cell;
        const mx = mont.getContext("2d");
        mx.fillStyle = "#101820"; mx.fillRect(0, 0, mont.width, mont.height);
        mx.fillStyle = "#ffd66f"; mx.font = "bold 18px sans-serif";
        for (const r of recortes) {
            const cxx = r.c * cell, cyy = r.l * cell;
            mx.strokeStyle = "rgba(255,255,255,0.25)"; mx.strokeRect(cxx + 1, cyy + 1, cell - 2, cell - 2);
            mx.fillText((r.c === 0 ? "E" : "D") + (r.l + 1), cxx + 8, cyy + 22);
            const im = new Image();
            await new Promise(ok => { im.onload = ok; im.src = r.url; });
            const esc = Math.min((cell - 24) / im.width, (cell - 44) / im.height, 1);
            mx.drawImage(im, cxx + (cell - im.width * esc) / 2, cyy + 30 + (cell - 44 - im.height * esc) / 2, im.width * esc, im.height * esc);
        }
        return { recortes, montagem: mont.toDataURL("image/png"), usaAlfa, W, H };
    }, { url: dataUrl(folha), colunas: COLUNAS, linhas: LINHAS });

    fs.mkdirSync(pastaSaida, { recursive: true });
    // ordena por coluna e linha (esquerda 1..7, direita 9..15) e nomeia
    const ordenado = saida.recortes.slice().sort((a, b) => (a.c - b.c) || (a.l - b.l));
    const nomes = [];
    for (let c = 0; c < COLUNAS; c++) for (let l = 0; l < LINHAS; l++) nomes.push(c === 0 ? ESQUERDA[l] : DIREITA[l]);
    ordenado.forEach((r, i) => {
        const nome = nomes[i] || `tipo-${i + 1}`;
        fs.writeFileSync(path.join(pastaSaida, nome + ".png"), Buffer.from(r.url.split(",")[1], "base64"));
        console.log(`${String(i + 1).padStart(2)}  ${nome.padEnd(18)} ${r.w}x${r.h}  (célula ${r.c === 0 ? "E" : "D"}${r.l + 1})`);
    });
    fs.writeFileSync(path.join(pastaSaida, "_montagem.png"), Buffer.from(saida.montagem.split(",")[1], "base64"));
    await browser.close();
    console.log(`\nfolha ${saida.W}x${saida.H} · fundo ${saida.usaAlfa ? "transparente" : "preto"} · ${saida.recortes.length} tiras em ${pastaSaida}`);
})();
