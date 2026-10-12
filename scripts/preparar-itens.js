// Prepara itens de customização a partir das peças fatiadas: copia pra pasta de
// runtime, REMOVENDO ilhas pequenas (fragmentos de vizinhos que o fatiador
// pegou junto) — mantém só o maior componente + os que forem >= 15% dele.
//
// Uso: node scripts/preparar-itens.js <destino> <prefixo> <numeros...>
//   ex.: node scripts/preparar-itens.js imagens/personagens/armas arma 027 028 ...
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMG = path.join(RAIZ, "imagens");
const dirCustom = fs.readdirSync(DIR_IMG).find(d => d.toLowerCase().startsWith("customiza"));
const PECAS = path.join(DIR_IMG, dirCustom, "pecas");

const destino = path.join(RAIZ, process.argv[2]);
const prefixo = process.argv[3];
const numeros = process.argv.slice(4);
if (!numeros.length) { console.error("faltou a lista de números"); process.exit(1); }

const lêB64 = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const indices = JSON.parse(fs.readFileSync(path.join(PECAS, "indice.json"), "utf8"));
    fs.mkdirSync(destino, { recursive: true });
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    let i = 0;
    for (const num of numeros) {
        i++;
        const item = indices.find(p => p.nome.replace(/[^0-9]/g, "") === num);
        if (!item) { console.log("aviso: peça " + num + " não encontrada"); continue; }
        const png = await page.evaluate(async ({ url }) => {
            const img = new Image();
            await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = url; });
            const W = img.naturalWidth, H = img.naturalHeight;
            const cv = document.createElement("canvas");
            cv.width = W; cv.height = H;
            const cx = cv.getContext("2d", { willReadFrequently: true });
            cx.drawImage(img, 0, 0);
            const d = cx.getImageData(0, 0, W, H);
            const px = d.data;
            const visto = new Uint8Array(W * H);
            const comps = [];
            for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
                const p = y * W + x;
                if (visto[p] || px[p * 4 + 3] <= 10) continue;
                const fila = [x, y]; visto[p] = 1;
                let area = 0, minX = x, maxX = x, minY = y, maxY = y;
                while (fila.length) {
                    const cy = fila.pop(), cxx = fila.pop(); area++;
                    if (cxx < minX) minX = cxx; if (cxx > maxX) maxX = cxx;
                    if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
                    for (const [nx, ny] of [[cxx + 1, cy], [cxx - 1, cy], [cxx, cy + 1], [cxx, cy - 1]]) {
                        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                        const np = ny * W + nx;
                        if (visto[np] || px[np * 4 + 3] <= 10) continue;
                        visto[np] = 1; fila.push(nx, ny);
                    }
                }
                comps.push({ area, minX, minY, maxX, maxY, pixels: null });
            }
            const maior = comps.reduce((m, c) => Math.max(m, c.area), 0);
            // apaga as ilhas pequenas (< 15% da maior)
            const manter = comps.filter(c => c.area >= maior * 0.15);
            const remover = comps.filter(c => c.area < maior * 0.15);
            // recolore: apaga os pixels das ilhas pequenas
            // (recomputa por BFS marcando só as ilhas removidas)
            const ehPequena = new Uint8Array(W * H);
            for (const c of remover) {
                const fila = [];
                // reencontra a ilha a partir do canto superior-esquerdo do bbox
                outer:
                for (let y = c.minY; y <= c.maxY; y++) for (let x = c.minX; x <= c.maxX; x++) {
                    if (px[(y * W + x) * 4 + 3] > 10 && !ehPequena[y * W + x]) { fila.push(x, y); break outer; }
                }
                if (!fila.length) continue;
                ehPequena[fila[1] * W + fila[0]] = 1;
                while (fila.length) {
                    const cy = fila.pop(), cxx = fila.pop();
                    for (const [nx, ny] of [[cxx + 1, cy], [cxx - 1, cy], [cxx, cy + 1], [cxx, cy - 1]]) {
                        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                        const np = ny * W + nx;
                        if (ehPequena[np] || px[np * 4 + 3] <= 10) continue;
                        ehPequena[np] = 1; fila.push(nx, ny);
                    }
                }
            }
            let apagados = 0;
            for (let p = 0; p < W * H; p++) if (ehPequena[p]) { px[p * 4 + 3] = 0; apagados++; }

            // apara no maior componente
            const w = manter[0] ? (Math.max(...manter.map(c => c.maxX)) - Math.min(...manter.map(c => c.minX)) + 1) : W;
            const h = manter[0] ? (Math.max(...manter.map(c => c.maxY)) - Math.min(...manter.map(c => c.minY)) + 1) : H;
            const ox = manter[0] ? Math.min(...manter.map(c => c.minX)) : 0;
            const oy = manter[0] ? Math.min(...manter.map(c => c.minY)) : 0;
            const c2 = document.createElement("canvas");
            c2.width = w; c2.height = h;
            const cx2 = c2.getContext("2d");
            const rec = cx2.createImageData(w, h);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const si = ((oy + y) * W + (ox + x)) * 4, di = (y * w + x) * 4;
                rec.data[di] = px[si]; rec.data[di + 1] = px[si + 1]; rec.data[di + 2] = px[si + 2];
                rec.data[di + 3] = px[si + 3];
            }
            cx2.putImageData(rec, 0, 0);
            return { url: c2.toDataURL("image/png"), w, h, apagados, ilhas: remover.length };
        }, { url: lêB64(path.join(PECAS, item.nome)) });

        const nome = prefixo + "-" + String(i).padStart(2, "0") + ".png";
        fs.writeFileSync(path.join(destino, nome), Buffer.from(png.url.split(",")[1], "base64"));
        console.log(nome + " <- " + item.nome + "  (" + png.w + "x" + png.h + ", " + png.ilhas + " ilhas removidas)");
    }
    await browser.close();
})();
