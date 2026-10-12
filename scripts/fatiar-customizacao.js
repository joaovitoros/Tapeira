// Fatiador da CUSTOMIZAÇÃO (one-off, roda com Playwright).
//
// As folhas vieram com um "xadrez" de transparência PINTADO (alfa opaca). Aqui
// a gente:
//   1) remove o fundo: preenchimento (flood fill) a partir das BORDAS da folha,
//      apagando os pixels claros/cinzas conectados (o xadrez + as emendas);
//   2) separa as PEÇAS: componentes conectados dos pixels que sobraram;
//   3) recorta e salva cada peça aparada.
//
// Uso: node scripts/fatiar-customizacao.js
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMAGENS = path.join(RAIZ, "imagens");
const DIR_CUSTOM = path.join(
    DIR_IMAGENS,
    fs.readdirSync(DIR_IMAGENS).find(n => n.toLowerCase().startsWith("customiza"))
);
const FOLHA_PECAS = "Mole Mineiro_ Equipamentos e Acessórios.png";
const FOLHA_POSES = "Folha de sprites do mineiro toupeira.png";

function dataUrl(arquivo) {
    return "data:image/png;base64," + fs.readFileSync(arquivo).toString("base64");
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    // ---------- 1) PEÇAS (componentes conectados da folha de equipamentos) ----
    const achadas = await page.evaluate(async ({ url }) => {
        const img = new Image();
        await new Promise((ok, erro) => { img.onload = ok; img.onerror = erro; img.src = url; });
        const W = img.naturalWidth, H = img.naturalHeight;
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        const orig = cx.getImageData(0, 0, W, H).data;
        const idx = (x, y) => (y * W + x) * 4;
        const ehFundo = (x, y) => {
            const i = idx(x, y);
            const r = orig[i], g = orig[i + 1], b = orig[i + 2], a = orig[i + 3];
            if (a <= 8) return true;
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            return mn > 165 && (mx - mn) < 26;   // claro e acinzentado (xadrez)
        };
        const solido = (x, y) => {
            const i = idx(x, y);
            return orig[i + 3] > 8 && !ehFundo(x, y);
        };

        // 1a) fundo: flood fill a partir de todas as bordas
        const fundo = new Uint8Array(W * H);
        const pilha = [];
        for (let x = 0; x < W; x++) { pilha.push(x, 0, x, H - 1); }
        for (let y = 0; y < H; y++) { pilha.push(0, y, W - 1, y); }
        const empilha = (x, y) => {
            if (x < 0 || y < 0 || x >= W || y >= H) return;
            const p = y * W + x;
            if (fundo[p]) return;
            if (!ehFundo(x, y)) return;
            fundo[p] = 1;
            pilha.push(x, y);
        };
        for (let i = 0; i < pilha.length; i += 2) {
            const x = pilha[i], y = pilha[i + 1];
            const p = y * W + x;
            if (!fundo[p] && ehFundo(x, y)) fundo[p] = 1;
        }
        while (pilha.length) {
            const y = pilha.pop(), x = pilha.pop();
            empilha(x + 1, y); empilha(x - 1, y); empilha(x, y + 1); empilha(x, y - 1);
        }

        // 1b) peças: componentes conectados do que NÃO é fundo
        const visto = new Uint8Array(W * H);
        const pecas = [];
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const p = y * W + x;
                if (visto[p] || fundo[p] || !solido(x, y)) continue;
                // percorre o componente
                const fila = [x, y];
                visto[p] = 1;
                let minX = x, maxX = x, minY = y, maxY = y, area = 0;
                while (fila.length) {
                    const cy = fila.pop(), cxx = fila.pop();
                    area++;
                    if (cxx < minX) minX = cxx; if (cxx > maxX) maxX = cxx;
                    if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
                    const viz = [[cxx + 1, cy], [cxx - 1, cy], [cxx, cy + 1], [cxx, cy - 1]];
                    for (const [nx, ny] of viz) {
                        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                        const np = ny * W + nx;
                        if (visto[np] || fundo[np] || !solido(nx, ny)) continue;
                        visto[np] = 1;
                        fila.push(nx, ny);
                    }
                }
                if (area >= 220) pecas.push({ minX, minY, maxX, maxY, area });
            }
        }
        // ordena por linha (topo) e depois por x
        pecas.sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));

        // recorta cada peça (já sem fundo) e devolve o png
        const saida = [];
        for (const pe of pecas) {
            const w = pe.maxX - pe.minX + 1, h = pe.maxY - pe.minY + 1;
            const recorte = cx.createImageData(w, h);
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const sx = pe.minX + x, sy = pe.minY + y;
                    const si = idx(sx, sy), di = (y * w + x) * 4;
                    recorte.data[di] = orig[si];
                    recorte.data[di + 1] = orig[si + 1];
                    recorte.data[di + 2] = orig[si + 2];
                    recorte.data[di + 3] = fundo[sy * W + sx] ? 0 : orig[si + 3];
                }
            }
            const c2 = document.createElement("canvas");
            c2.width = w; c2.height = h;
            c2.getContext("2d").putImageData(recorte, 0, 0);
            saida.push({ url: c2.toDataURL("image/png"), minX: pe.minX, minY: pe.minY, w, h, area: pe.area });
        }
        return saida;
    }, { url: dataUrl(path.join(DIR_CUSTOM, FOLHA_PECAS)) });

    const dirPecas = path.join(DIR_CUSTOM, "pecas");
    fs.mkdirSync(dirPecas, { recursive: true });
    const indice = achadas.map((p, i) => {
        const nome = "peca-" + String(i + 1).padStart(3, "0") + ".png";
        fs.writeFileSync(path.join(dirPecas, nome), Buffer.from(p.url.split(",")[1], "base64"));
        return { nome, x: p.minX, y: p.minY, w: p.w, h: p.h, area: p.area };
    });
    fs.writeFileSync(path.join(dirPecas, "indice.json"), JSON.stringify(indice, null, 1));
    console.log("PEÇAS: " + indice.length + " componentes (por linha):");
    let linhaAtual = null;
    for (const p of indice) {
        if (linhaAtual === null || Math.abs(p.y - linhaAtual) > 40) {
            linhaAtual = p.y;
            console.log("  -- linha y~" + p.y + " --");
        }
        console.log("    " + p.nome + "  " + p.w + "x" + p.h + "  (x " + p.x + ", y " + p.y + ", area " + p.area + ")");
    }

    // ---------- 2) BASE (a pose de frente da folha de poses, sem xadrez) -----
    const base = await page.evaluate(async ({ url, reg }) => {
        const img = new Image();
        await new Promise((ok, erro) => { img.onload = ok; img.onerror = erro; img.src = url; });
        const W = img.naturalWidth, H = img.naturalHeight;
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        const orig = cx.getImageData(0, 0, W, H).data;
        const ehFundo = (x, y) => {
            const i = (y * W + x) * 4;
            const r = orig[i], g = orig[i + 1], b = orig[i + 2], a = orig[i + 3];
            if (a <= 8) return true;
            const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
            return mn > 165 && (mx - mn) < 26;
        };
        // flood fill do fundo só dentro da região (mais rápido e evita vazar)
        const x0 = reg.x, y0 = reg.y, x1 = reg.x + reg.w, y1 = reg.y + reg.h;
        const fundo = new Set();
        const pilha = [];
        for (let x = x0; x < x1; x++) { pilha.push(x, y0, x, y1 - 1); }
        for (let y = y0; y < y1; y++) { pilha.push(x0, y, x1 - 1, y); }
        while (pilha.length) {
            const y = pilha.pop(), x = pilha.pop();
            if (x < x0 || y < y0 || x >= x1 || y >= y1) continue;
            const chave = y * W + x;
            if (fundo.has(chave) || !ehFundo(x, y)) continue;
            fundo.add(chave);
            pilha.push(x + 1, y, x - 1, y, x, y + 1, x, y - 1);
        }
        let minX = x1, minY = y1, maxX = x0, maxY = y0;
        for (let y = y0; y < y1; y++) {
            for (let x = x0; x < x1; x++) {
                if (fundo.has(y * W + x) || orig[(y * W + x) * 4 + 3] <= 8) continue;
                if (x < minX) minX = x; if (x > maxX) maxX = x;
                if (y < minY) minY = y; if (y > maxY) maxY = y;
            }
        }
        const w = maxX - minX + 1, h = maxY - minY + 1;
        const recorte = cx.createImageData(w, h);
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const sx = minX + x, sy = minY + y;
                const si = (sy * W + sx) * 4, di = (y * w + x) * 4;
                recorte.data[di] = orig[si];
                recorte.data[di + 1] = orig[si + 1];
                recorte.data[di + 2] = orig[si + 2];
                recorte.data[di + 3] = fundo.has(sy * W + sx) ? 0 : orig[si + 3];
            }
        }
        const c2 = document.createElement("canvas");
        c2.width = w; c2.height = h;
        c2.getContext("2d").putImageData(recorte, 0, 0);
        return { url: c2.toDataURL("image/png"), w, h };
    }, { url: dataUrl(path.join(DIR_CUSTOM, FOLHA_POSES)), reg: { x: 175, y: 55, w: 170, h: 240 } });

    const dirBase = path.join(DIR_CUSTOM, "base");
    fs.mkdirSync(dirBase, { recursive: true });
    fs.writeFileSync(path.join(dirBase, "base-frente.png"), Buffer.from(base.url.split(",")[1], "base64"));
    console.log("\nBASE: base-frente.png  " + base.w + "x" + base.h);

    await browser.close();
})();
