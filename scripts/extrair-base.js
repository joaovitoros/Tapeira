// Extrai uma base (toupeira) de uma folha com xadrez pintado:
//   - remove o fundo (flood fill das bordas, pixels claros/acizentados);
//   - modo "sheet": pega o 1º componente (topo-esquerda) = toupeira padrão;
//   - modo "single": apara o único desenho;
//   - salva um PNG transparente aparado.
//
// Uso: node scripts/extrair-base.js <folha> <sheet|single> <saida>
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMG = path.join(RAIZ, "imagens");
const dirCustom = fs.readdirSync(DIR_IMG).find(d => d.toLowerCase().startsWith("customiza"));

const folha = process.argv[2];
const modo = (process.argv[3] || "sheet").toLowerCase();
const saida = process.argv[4] || path.join(process.env.TEMP || ".", "opencode", "base-extraida.png");
const arquivo = path.isAbsolute(folha) ? folha : path.join(DIR_IMG, dirCustom, folha);

const dataUrl = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const png = await page.evaluate(async ({ url, modo }) => {
        const img = new Image();
        await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = url; });
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
            return mn > 165 && (mx - mn) < 26;
        };
        const solido = (x, y) => orig[idx(x, y) + 3] > 8 && !ehFundo(x, y);

        const fundo = new Uint8Array(W * H);
        const pilha = [];
        for (let x = 0; x < W; x++) { pilha.push(x, 0, x, H - 1); }
        for (let y = 0; y < H; y++) { pilha.push(0, y, W - 1, y); }
        for (let i = 0; i < pilha.length; i += 2) {
            const x = pilha[i], y = pilha[i + 1], p = y * W + x;
            if (!fundo[p] && ehFundo(x, y)) fundo[p] = 1;
        }
        const empilha = (x, y) => {
            if (x < 0 || y < 0 || x >= W || y >= H) return;
            const p = y * W + x;
            if (fundo[p] || !ehFundo(x, y)) return;
            fundo[p] = 1; pilha.push(x, y);
        };
        while (pilha.length) { const y = pilha.pop(), x = pilha.pop(); empilha(x + 1, y); empilha(x - 1, y); empilha(x, y + 1); empilha(x, y - 1); }

        // componentes conectados
        const visto = new Uint8Array(W * H);
        const comps = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const p = y * W + x;
            if (visto[p] || fundo[p] || !solido(x, y)) continue;
            const fila = [x, y]; visto[p] = 1;
            let minX = x, maxX = x, minY = y, maxY = y, area = 0;
            while (fila.length) {
                const cy = fila.pop(), cxx = fila.pop(); area++;
                if (cxx < minX) minX = cxx; if (cxx > maxX) maxX = cxx;
                if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
                for (const [nx, ny] of [[cxx + 1, cy], [cxx - 1, cy], [cxx, cy + 1], [cxx, cy - 1]]) {
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    const np = ny * W + nx;
                    if (visto[np] || fundo[np] || !solido(nx, ny)) continue;
                    visto[np] = 1; fila.push(nx, ny);
                }
            }
            if (area >= 220) comps.push({ minX, minY, maxX, maxY, area });
        }
        comps.sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));
        let alvo;
        if (modo === "single") {
            // junta tudo (bbox geral)
            alvo = comps.reduce((acc, c) => ({
                minX: Math.min(acc.minX, c.minX), minY: Math.min(acc.minY, c.minY),
                maxX: Math.max(acc.maxX, c.maxX), maxY: Math.max(acc.maxY, c.maxY), area: 0
            }), { minX: 1e9, minY: 1e9, maxX: -1, maxY: -1, area: 0 });
        } else if (modo === "esquerda") {
            // 1º componente da METADE ESQUERDA (topo) = toupeira padrão
            const esq = comps.filter(c => (c.minX + c.maxX) / 2 < W * 0.5);
            esq.sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));
            alvo = esq[0];
        } else {
            alvo = comps[0];
        }
        const w = alvo.maxX - alvo.minX + 1, h = alvo.maxY - alvo.minY + 1;
        const c2 = document.createElement("canvas");
        c2.width = w; c2.height = h;
        const cx2 = c2.getContext("2d");
        const rec = cx2.createImageData(w, h);
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const sx = alvo.minX + x, sy = alvo.minY + y;
            const si = idx(sx, sy), di = (y * w + x) * 4;
            rec.data[di] = orig[si]; rec.data[di + 1] = orig[si + 1];
            rec.data[di + 2] = orig[si + 2];
            rec.data[di + 3] = fundo[sy * W + sx] ? 0 : orig[si + 3];
        }
        cx2.putImageData(rec, 0, 0);
        return { url: c2.toDataURL("image/png"), w, h, area: alvo.area, comps: comps.length };
    }, { url: dataUrl(arquivo), modo });

    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, Buffer.from(png.url.split(",")[1], "base64"));
    console.log("modo=" + modo + " -> " + saida + "  (" + png.w + "x" + png.h + ", " + png.comps + " componentes)");
    await browser.close();
})();
