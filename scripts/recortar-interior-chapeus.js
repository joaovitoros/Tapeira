// Corta o INTERIOR do chapéu: apaga os pixels ESCUROS na faixa de baixo (a
// "boca" do chapéu) — o dourado e as cores claras sobrevivem. Assim a cabeça
// aparece por dentro em vez do vazio escuro.
//
// Uso: node scripts/recortar-interior-chapeus.js [limiar] [faixa] [numeros...]
//   limiar  = luminância abaixo da qual o pixel é "escuro" (padrão 100)
//   faixa   = fração da altura a partir da qual apaga (padrão 0.80)
//   numeros = quais chapéus (padrão: 01 05 06)
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMG = path.join(RAIZ, "imagens");
const dirCustom = fs.readdirSync(DIR_IMG).find(d => d.toLowerCase().startsWith("customiza"));
const ORIG = path.join(DIR_IMG, dirCustom, "chapeus");
const DEST = path.join(DIR_IMG, "personagens", "chapeus");

const limiar = Number(process.argv[2] || 100);
const faixa = Number(process.argv[3] || 0.80);
const alvos = (process.argv.slice(4).length ? process.argv.slice(4) : ["01", "05", "06"])
    .map(n => "chapeu-" + String(n).padStart(2, "0") + ".png");

const lêB64 = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    for (const arq of alvos) {
        const src = path.join(ORIG, arq);
        const png = await page.evaluate(async ({ url, limiar, faixa }) => {
            const img = new Image();
            await new Promise((ok, e) => { img.onload = ok; img.onerror = e; img.src = url; });
            const W = img.naturalWidth, H = img.naturalHeight;
            const cv = document.createElement("canvas");
            cv.width = W; cv.height = H;
            const cx = cv.getContext("2d", { willReadFrequently: true });
            cx.drawImage(img, 0, 0);
            const d = cx.getImageData(0, 0, W, H);
            const px = d.data;
            const escuro = (x, y) => {
                const i = (y * W + x) * 4;
                if (px[i + 3] <= 8) return false;
                const lum = 0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2];
                return lum < limiar;
            };
            let cortados = 0;
            for (let y = Math.floor(H * faixa); y < H; y++) {
                for (let x = 0; x < W; x++) {
                    if (escuro(x, y)) { px[(y * W + x) * 4 + 3] = 0; cortados++; }
                }
            }
            cx.putImageData(d, 0, 0);
            return { url: cv.toDataURL("image/png"), cortados, W, H };
        }, { url: lêB64(src), limiar, faixa });

        fs.writeFileSync(path.join(DEST, arq), Buffer.from(png.url.split(",")[1], "base64"));
        console.log(arq + ": " + png.cortados + " px removidos (" + png.W + "x" + png.H + ")");
    }
    await browser.close();
})();
