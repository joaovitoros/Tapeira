// Fatiador dos INIMIGOS novos (one-off, roda com Playwright).
//
// A "Folha de Criaturas MUGI Elementais.png" tem 14 bichos em fundo TRANSPARENTE,
// dispostos numa grade irregular (4 / 5 / 5). Alguns se tocam (pedrinhas, gelo,
// fogo), então componentes conectados não separam — a gente usa as PROJEÇÕES:
//   1) máscara dos pixels opacos (o glow semitransparente não conta, senão vira
//      ponte entre vizinhos);
//   2) projeção em Y acha as FAIXAS (linhas de bichos);
//   3) projeção em X dentro de cada faixa acha as COLUNAS (cada bicho);
//   4) recorta cada célula pela bbox justa + folga, preservando o alfa original.
//
// Uso: node scripts/fatiar-inimigos.js [folha] [pastaSaida]
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const folha = process.argv[2]
    || path.join(RAIZ, "imagens", "inimigos-futuros", "Folha de Criaturas MUGI Elementais.png");
const pastaSaida = process.argv[3] || path.join(RAIZ, "imagens", "inimigos");
const ALFA = Number(process.argv[4] || 128);

// Nomes na ordem em que as criaturas saem (linha por linha, esquerda->direita).
// Confere com a montagem (inimigos-montagem.png). Se a folha mudar, revise.
const NOMES = [
    "gigante", "vegetal", "normal", "normal2", "cristal", "lava", "gelo",
    "toxico", "metalico", "rei-espinhos", "rei-coroa", "madeira", "sombrio", "poeira"
];

const dataUrl = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    await page.addInitScript(({ am, g }) => { window.__AREAMIN = am; window.__GAP = g; },
        { am: Number(process.argv[5] || 3000), g: Number(process.argv[6] || 8) });

    const saida = await page.evaluate(async ({ url, alfa }) => {
        const img = new Image();
        await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = url; });
        const W = img.naturalWidth, H = img.naturalHeight;
        const cv = document.createElement("canvas");
        cv.width = W; cv.height = H;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(img, 0, 0);
        const orig = cx.getImageData(0, 0, W, H).data;
        const idx = (x, y) => (y * W + x) * 4;

        // 1) máscara dos opacos
        const sol = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            if (orig[idx(x, y) + 3] >= alfa) sol[y * W + x] = 1;
        }

        // 2) componentes conectados (só pixels opacos; o glow não conecta)
        const AREA_MIN = Number(window.__AREAMIN ?? 3000);
        const GAP = Number(window.__GAP ?? 8);
        const visto = new Uint8Array(W * H);
        const comps = [];
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
            const p = y * W + x;
            if (visto[p] || !sol[p]) continue;
            const fila = [x, y]; visto[p] = 1;
            let minX = x, maxX = x, minY = y, maxY = y, area = 0;
            while (fila.length) {
                const cy = fila.pop(), cxx = fila.pop(); area++;
                if (cxx < minX) minX = cxx; if (cxx > maxX) maxX = cxx;
                if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
                for (const [nx, ny] of [[cxx + 1, cy], [cxx - 1, cy], [cxx, cy + 1], [cxx, cy - 1]]) {
                    if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                    const np = ny * W + nx;
                    if (visto[np] || !sol[np]) continue;
                    visto[np] = 1; fila.push(nx, ny);
                }
            }
            if (area >= AREA_MIN) comps.push({ minX, minY, maxX, maxY, area });
        }

        // 3) merge só de detrito colado (gap pequeno)
        const pai = comps.map((_, i) => i);
        const acha = i => (pai[i] === i ? i : (pai[i] = acha(pai[i])));
        const junta = (a, b) => { a = acha(a); b = acha(b); if (a !== b) pai[b] = a; };
        const perto = (a, b) => !(a.maxX + GAP < b.minX || b.maxX + GAP < a.minX || a.maxY + GAP < b.minY || b.maxY + GAP < a.minY);
        for (let i = 0; i < comps.length; i++)
            for (let j = i + 1; j < comps.length; j++)
                if (perto(comps[i], comps[j])) junta(i, j);

        const mapa = new Map();
        comps.forEach((c, i) => {
            const r = acha(i);
            const g = mapa.get(r);
            if (!g) mapa.set(r, { ...c });
            else {
                g.minX = Math.min(g.minX, c.minX); g.maxX = Math.max(g.maxX, c.maxX);
                g.minY = Math.min(g.minY, c.minY); g.maxY = Math.max(g.maxY, c.maxY);
                g.area += c.area;
            }
        });

        // 4) divide regiões grudadas no "vale" (linha/coluna com menos pixels)
        const LIMIAR = Number(window.__LIMIAR ?? 0.30);
        const contaCol = (r, x) => { let c = 0; for (let y = r.minY; y <= r.maxY; y++) if (sol[y * W + x]) c++; return c; };
        const contaLin = (r, y) => { let c = 0; for (let x = r.minX; x <= r.maxX; x++) if (sol[y * W + x]) c++; return c; };
        const divide = (r) => {
            if ((r.maxX - r.minX) < 140 && (r.maxY - r.minY) < 140) return [r];
            let melhor = null;
            for (let x = r.minX + 60; x <= r.maxX - 60; x++) {
                const c = contaCol(r, x) / (r.maxY - r.minY + 1);
                if (!melhor || c < melhor.c) melhor = { tipo: "v", pos: x, c };
            }
            for (let y = r.minY + 60; y <= r.maxY - 60; y++) {
                const c = contaLin(r, y) / (r.maxX - r.minX + 1);
                if (!melhor || c < melhor.c) melhor = { tipo: "h", pos: y, c };
            }
            if (!melhor || melhor.c > LIMIAR) return [r];
            const a = { ...r }, b = { ...r };
            if (melhor.tipo === "v") { a.maxX = melhor.pos - 1; b.minX = melhor.pos; }
            else { a.maxY = melhor.pos - 1; b.minY = melhor.pos; }
            return [...divide(a), ...divide(b)];
        };

        const regioes = [];
        for (const g of mapa.values()) regioes.push(...divide(g));

        // bbox justa + área de cada região final
        const celulas = regioes.map(r => {
            let a = 0, mnX = 1e9, mxX = -1, mnY = 1e9, mxY = -1;
            for (let y = r.minY; y <= r.maxY; y++) for (let x = r.minX; x <= r.maxX; x++) {
                if (!sol[y * W + x]) continue;
                a++;
                if (x < mnX) mnX = x; if (x > mxX) mxX = x;
                if (y < mnY) mnY = y; if (y > mxY) mxY = y;
            }
            return { minX: mnX, minY: mnY, maxX: mxX, maxY: mxY, area: a };
        }).filter(g => g.area >= AREA_MIN && g.maxX > 0
            && (g.maxX - g.minX) >= 220 && (g.maxY - g.minY) >= 220)
            .sort((a, b) => (a.minY - b.minY) || (a.minX - b.minX));

        // 3) recorta (folga pra manter o glow; alfa original preservado)
        const PAD = 12;
        const recortes = celulas.map(g => {
            const x0 = Math.max(0, g.minX - PAD), y0 = Math.max(0, g.minY - PAD);
            const x1 = Math.min(W - 1, g.maxX + PAD), y1 = Math.min(H - 1, g.maxY + PAD);
            const w = x1 - x0 + 1, h = y1 - y0 + 1;
            const c2 = document.createElement("canvas");
            c2.width = w; c2.height = h;
            const cx2 = c2.getContext("2d");
            const rec = cx2.createImageData(w, h);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const si = idx(x0 + x, y0 + y), di = (y * w + x) * 4;
                rec.data[di] = orig[si]; rec.data[di + 1] = orig[si + 1];
                rec.data[di + 2] = orig[si + 2]; rec.data[di + 3] = orig[si + 3];
            }
            cx2.putImageData(rec, 0, 0);
            return { url: c2.toDataURL("image/png"), w, h, area: g.area };
        });

        // montagem de conferência
        const cols = 5, cell = 240;
        const linhas = Math.ceil(recortes.length / cols);
        const mont = document.createElement("canvas");
        mont.width = cols * cell; mont.height = Math.max(1, linhas) * cell;
        const mx = mont.getContext("2d");
        mx.fillStyle = "#101820"; mx.fillRect(0, 0, mont.width, mont.height);
        mx.fillStyle = "#ffd66f"; mx.font = "bold 18px sans-serif";
        for (let i = 0; i < recortes.length; i++) {
            const r = recortes[i];
            const cxx = (i % cols) * cell, cyy = Math.floor(i / cols) * cell;
            mx.strokeStyle = "rgba(255,255,255,0.25)"; mx.strokeRect(cxx + 1, cyy + 1, cell - 2, cell - 2);
            mx.fillText(String(i + 1).padStart(2, "0"), cxx + 8, cyy + 22);
            const im = new Image();
            await new Promise(ok => { im.onload = ok; im.src = r.url; });
            const esc = Math.min((cell - 30) / im.width, (cell - 40) / im.height, 1);
            mx.drawImage(im, cxx + (cell - im.width * esc) / 2, cyy + 30 + (cell - 40 - im.height * esc) / 2, im.width * esc, im.height * esc);
        }
        return { recortes, montagem: mont.toDataURL("image/png") };
    }, { url: dataUrl(folha), alfa: ALFA });

    fs.mkdirSync(pastaSaida, { recursive: true });
    saida.recortes.forEach((r, i) => {
        const nome = NOMES[i] || `inimigo-${String(i + 1).padStart(2, "0")}`;
        fs.writeFileSync(path.join(pastaSaida, nome + ".png"), Buffer.from(r.url.split(",")[1], "base64"));
    });
    const dirMont = path.join(process.env.TEMP || ".", "opencode");
    fs.mkdirSync(dirMont, { recursive: true });
    fs.writeFileSync(path.join(dirMont, "inimigos-montagem.png"), Buffer.from(saida.montagem.split(",")[1], "base64"));
    console.log("inimigos fatiados: " + saida.recortes.length);
    saida.recortes.forEach((r, i) => console.log("  " + (NOMES[i] || "inimigo-" + (i + 1)).padEnd(14) + " -> " + r.w + "x" + r.h));
    console.log("montagem: " + path.join(dirMont, "inimigos-montagem.png"));
    await browser.close();
})();
