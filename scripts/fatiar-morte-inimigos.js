// Fatiador da MORTE por criatura (one-off, roda com Playwright).
//
// O "Atlas de Animações" tem uma linha por criatura e 14 colunas de quadros
// (parado → ataque → morte → pilha esmagada). Aqui:
//   1) acha as LINHAS (faixas com vale; faixa alta demais é cortada no meio);
//   2) usa a GRADE de 14 colunas e mede a ALTURA de cada quadro — os quadros de
//      morte são os "baixinhos" do fim da linha;
//   3) casa cada linha com uma criatura pela COR (matiz média), que é o que
//      importa visualmente (cristal morre azul, gelo branco, lava laranja…),
//      evitando repetir a mesma criatura;
//   4) salva a sequência de morte de cada criatura, recortada e com alfa.
//
// Uso: node scripts/fatiar-morte-inimigos.js
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_INIMIGOS = path.join(RAIZ, "imagens", "inimigos");
const PASTA_SAIDA = path.join(DIR_INIMIGOS, "morte");
const ATLAS = path.join(RAIZ, "imagens", "inimigos-futuros", "Atlas de Animações de Cogumelos Elementais.png");
const COLUNAS = 14;
const MAX_MORTE = 8;
const ALTURA_DE_PE = 0.72;   // quadro "de pé" = >= 72% da altura da linha

// Mapa linha do Atlas (y) -> criatura. Fixado por inspeção da montagem
// (atlas-linhas.png): o matiz separa as famílias de cor, mas dentro dos
// "marrons" o casamento automático é ambíguo. `null` = linha repetida, ignorada.
const FORCAR = {
    6: "normal",        // marrom pequeno
    81: "gigante",      // marrom maior
    167: "cristal",     // azul
    245: "vegetal",     // verde
    311: "metalico",    // cinza
    384: "lava",        // laranja
    463: "gelo",        // branco/azul
    532: "rei-espinhos",// vermelho espinhoso
    598: "toxico",      // roxo/verde
    657: "normal2",     // marrom (variante)
    718: null,          // gelo repetido
    774: "rei-coroa",   // rei com coroa e capa
    838: "sombrio",     // roxo
    927: "poeira",      // marrom empoeirado
    973: null           // roxo repetido
};

const dataUrl = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    const criaturas = fs.readdirSync(DIR_INIMIGOS)
        .filter(n => n.toLowerCase().endsWith(".png"))
        .map(n => ({ nome: n.replace(/\.png$/i, ""), url: dataUrl(path.join(DIR_INIMIGOS, n)) }));

    const saida = await page.evaluate(async ({ atlasUrl, criaturas, colunas, maxMorte, alturaDePe }) => {
        const carrega = async (url) => {
            const img = new Image();
            await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = url; });
            return img;
        };
        const pixels = (img) => {
            const c = document.createElement("canvas");
            c.width = img.naturalWidth; c.height = img.naturalHeight;
            c.getContext("2d").drawImage(img, 0, 0);
            return c.getContext("2d").getImageData(0, 0, c.width, c.height).data;
        };

        // --- cor (matiz média dos pixels opacos e coloridos) ---
        const corDe = (dados) => {
            let sx = 0, sy = 0, n = 0, lum = 0, tot = 0;
            for (let i = 0; i < dados.length; i += 4) {
                if (dados[i + 3] < 128) continue;
                const r = dados[i] / 255, g = dados[i + 1] / 255, b = dados[i + 2] / 255;
                const mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
                tot++; lum += (r + g + b) / 3;
                const s = mx > 0 ? dd / mx : 0;
                if (s > 0.18) {
                    let hh = 0;
                    if (dd > 0) {
                        if (mx === r) hh = ((g - b) / dd) % 6;
                        else if (mx === g) hh = (b - r) / dd + 2;
                        else hh = (r - g) / dd + 4;
                        hh *= 60; if (hh < 0) hh += 360;
                    }
                    sx += Math.cos(hh * Math.PI / 180); sy += Math.sin(hh * Math.PI / 180); n++;
                }
            }
            return {
                hue: n >= 40 ? Math.round(((Math.atan2(sy / n, sx / n) * 180 / Math.PI) + 360) % 360) : -1,
                sat: tot ? +(n / tot).toFixed(2) : 0,
                lum: tot ? +(lum / tot).toFixed(2) : 0
            };
        };
        const distancia = (a, b) => {
            if (a.hue < 0 || b.hue < 0) return 140 + Math.abs(a.lum - b.lum) * 300;
            let d = Math.abs(a.hue - b.hue);
            if (d > 180) d = 360 - d;
            return d + Math.abs(a.sat - b.sat) * 80 + Math.abs(a.lum - b.lum) * 40;
        };

        // --- atlas ---
        const atlas = await carrega(atlasUrl);
        const W = atlas.naturalWidth, H = atlas.naturalHeight;
        const d = pixels(atlas);
        const idx = (x, y) => (y * W + x) * 4;
        const sol = new Uint8Array(W * H);
        for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) if (d[idx(x, y) + 3] >= 128) sol[y * W + x] = 1;
        const projY = new Int32Array(H);
        for (let y = 0; y < H; y++) { let c = 0; for (let x = 0; x < W; x++) if (sol[y * W + x]) c++; projY[y] = c; }

        const achaFaixas = (proj, n, minVao, minTam) => {
            const out = []; let ini = -1;
            for (let i = 0; i <= n; i++) {
                const vazio = i < n ? proj[i] <= minVao : true;
                if (!vazio && ini < 0) ini = i;
                else if (vazio && ini >= 0) { if (i - ini >= minTam) out.push([ini, i - 1]); ini = -1; }
            }
            return out;
        };
        const faixas = [];
        for (const [y0, y1] of achaFaixas(projY, H, 30, 40)) {
            if (y1 - y0 + 1 <= 110) { faixas.push([y0, y1]); continue; }
            let melhorY = -1, menor = Infinity;
            for (let y = y0 + 30; y <= y1 - 30; y++) if (projY[y] < menor) { menor = projY[y]; melhorY = y; }
            faixas.push([y0, melhorY - 1], [melhorY, y1]);
        }

        const passo = W / colunas;
        const bboxQuadro = (y0, y1, col) => {
            const x0 = Math.round(col * passo), x1 = Math.round((col + 1) * passo) - 1;
            let mnX = 1e9, mxX = -1, mnY = 1e9, mxY = -1, area = 0;
            for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
                if (!sol[y * W + x]) continue;
                area++;
                if (x < mnX) mnX = x; if (x > mxX) mxX = x;
                if (y < mnY) mnY = y; if (y > mxY) mxY = y;
            }
            return { mnX, mxX, mnY, mxY, area, h: mxY >= mnY ? mxY - mnY + 1 : 0 };
        };
        const recorta = (q, pad, soMaior = false) => {
            if (q.mxX < 0) return null;
            const x0 = Math.max(0, q.mnX - pad), y0 = Math.max(0, q.mnY - pad);
            const x1 = Math.min(W - 1, q.mxX + pad), y1 = Math.min(H - 1, q.mxY + pad);
            const w = x1 - x0 + 1, h = y1 - y0 + 1;
            // opcional: mantém só a "mancha" principal (evita vazamento da linha
            // vizinha quando duas linhas se encostam no atlas)
            let mask = null;
            if (soMaior) {
                mask = new Uint8Array(w * h);
                for (let y = 0; y < h; y++) for (let x = 0; x < w; x++)
                    if (d[idx(x0 + x, y0 + y) + 3] >= 128) mask[y * w + x] = 1;
                const visto = new Uint8Array(w * h);
                const comps = [];
                for (let i = 0; i < w * h; i++) {
                    if (visto[i] || !mask[i]) continue;
                    const fila = [i]; visto[i] = 1; const px = [];
                    while (fila.length) {
                        const p = fila.pop(); px.push(p);
                        const x = p % w, y = (p - x) / w;
                        for (const [nx, ny] of [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]]) {
                            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
                            const np = ny * w + nx;
                            if (visto[np] || !mask[np]) continue;
                            visto[np] = 1; fila.push(np);
                        }
                    }
                    comps.push(px);
                }
                comps.sort((a, b) => b.length - a.length);
                const lim = comps.length ? comps[0].length * 0.15 : 0;
                const manter = new Uint8Array(w * h);
                for (const c of comps) if (c.length >= lim) for (const p of c) manter[p] = 1;
                mask = manter;
            }
            const c2 = document.createElement("canvas"); c2.width = w; c2.height = h;
            const cx2 = c2.getContext("2d");
            const rec = cx2.createImageData(w, h);
            for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
                const si = idx(x0 + x, y0 + y), di = (y * w + x) * 4;
                rec.data[di] = d[si]; rec.data[di + 1] = d[si + 1];
                rec.data[di + 2] = d[si + 2];
                rec.data[di + 3] = mask ? (mask[y * w + x] ? d[si + 3] : 0) : d[si + 3];
            }
            cx2.putImageData(rec, 0, 0);
            return { url: c2.toDataURL("image/png"), w, h };
        };

        // --- cores das criaturas ---
        const cores = [];
        for (const c of criaturas) {
            const img = await carrega(c.url);
            cores.push({ nome: c.nome, cor: corDe(pixels(img)) });
        }

        // --- por linha: quadros, morte e casamento ---
        const usados = new Set();
        const resultados = [];
        for (const [y0, y1] of faixas) {
            const quadros = [];
            for (let col = 0; col < colunas; col++) quadros.push(bboxQuadro(y0, y1, col));
            const maxH = Math.max(...quadros.map(q => q.h));
            let ultimoDePe = 0;
            for (let i = quadros.length - 1; i >= 0; i--) {
                if (quadros[i].h >= maxH * alturaDePe && quadros[i].area > 400) { ultimoDePe = i; break; }
            }
            let morte = quadros.slice(ultimoDePe + 1).filter(q => q.area > 250).slice(0, maxMorte);
            if (morte.length < 3) morte = quadros.slice(Math.max(0, colunas - 4)).filter(q => q.area > 250).slice(0, maxMorte);
            const idle = recorta(quadros[0], 2);
            const corLinha = idle ? corDe(pixels(await carrega(idle.url))) : { hue: -1, sat: 0, lum: 0 };
            // casamento por cor, sem repetir
            let melhor = null;
            for (const c of cores) {
                const dist = distancia(corLinha, c.cor) + (usados.has(c.nome) ? 22 : 0);
                if (!melhor || dist < melhor.dist) melhor = { nome: c.nome, dist: +dist.toFixed(1) };
            }
            usados.add(melhor.nome);
            resultados.push({
                y: y0, altura: y1 - y0 + 1, maxH, ultimoDePe,
                cor: corLinha, criatura: melhor.nome, dist: melhor.dist,
                idle: idle ? idle.url : null,
                morte: morte.map(q => recorta(q, 4, true)).filter(Boolean)
            });
        }
        return { resultados };
    }, {
        atlasUrl: dataUrl(ATLAS), criaturas, colunas: COLUNAS,
        maxMorte: MAX_MORTE, alturaDePe: ALTURA_DE_PE
    });

    fs.mkdirSync(PASTA_SAIDA, { recursive: true });
    for (const n of fs.readdirSync(PASTA_SAIDA)) fs.unlinkSync(path.join(PASTA_SAIDA, n));

    const gravados = [];
    for (const l of saida.resultados) {
        const nome = (l.y in FORCAR) ? FORCAR[l.y] : l.criatura;
        if (!nome) { console.log("  y" + String(l.y).padStart(4) + "  (linha ignorada)"); continue; }
        const arquivos = [];
        l.morte.forEach((q, i) => {
            const f = `${nome}-${String(i + 1).padStart(2, "0")}.png`;
            fs.writeFileSync(path.join(PASTA_SAIDA, f), Buffer.from(q.url.split(",")[1], "base64"));
            arquivos.push(q.url);
        });
        gravados.push({ criatura: nome, n: arquivos.length, quadros: arquivos, idle: l.idle });
        console.log("  y" + String(l.y).padStart(4) + " h" + String(l.altura).padStart(3)
            + "  matiz " + String(l.cor.hue).padStart(3) + " (sat " + l.cor.sat + ", lum " + l.cor.lum + ")"
            + "  ->  " + nome.padEnd(14) + " dist " + String(l.dist).padStart(6)
            + "  quadros de morte: " + arquivos.length);
    }
    console.log("\nlinhas: " + saida.resultados.length + " | criaturas: " + gravados.length);
    const faltando = criaturas.map(c => c.nome).filter(n => !gravados.some(g => g.criatura === n));
    if (faltando.length) console.log("sem morte propria: " + faltando.join(", "));

    // montagem: idle + morte por criatura
    const mont = await page.evaluate(async (linhas) => {
        const cell = 100, cols = 9;
        const c = document.createElement("canvas");
        c.width = cols * cell; c.height = Math.max(1, linhas.length) * cell;
        const cx = c.getContext("2d");
        cx.fillStyle = "#101820"; cx.fillRect(0, 0, c.width, c.height);
        cx.font = "bold 11px sans-serif";
        for (let i = 0; i < linhas.length; i++) {
            const l = linhas[i], y = i * cell;
            cx.fillStyle = "#ffd66f"; cx.fillText(l.criatura + " (" + l.n + ")", 4, y + 12);
            cx.strokeStyle = "rgba(255,255,255,0.16)"; cx.strokeRect(1, y + 1, c.width - 2, cell - 2);
            const imgs = [l.idle, ...l.quadros];
            for (let k = 0; k < imgs.length && k < cols; k++) {
                if (!imgs[k]) continue;
                const img = new Image();
                await new Promise(ok => { img.onload = ok; img.onerror = ok; img.src = imgs[k]; });
                const esc = Math.min((cell - 20) / img.height, (cell - 6) / img.width, 1);
                cx.drawImage(img, k * cell + (cell - img.width * esc) / 2, y + 16 + (cell - 20 - img.height * esc) / 2, img.width * esc, img.height * esc);
            }
        }
        return c.toDataURL("image/png");
    }, gravados);

    const dir = path.join(process.env.TEMP || ".", "opencode");
    fs.writeFileSync(path.join(dir, "mortes-montagem.png"), Buffer.from(mont.split(",")[1], "base64"));
    console.log("montagem: " + path.join(dir, "mortes-montagem.png"));
    await browser.close();
})();
