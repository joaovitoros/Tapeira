// Monta a BASE do player de customização: pega a toupeira SEM chapéu (recorte
// da folha) e a coloca no MESMO canvas do player atual (1024x1536), alinhada à
// silhueta de hoje (mesma largura útil, pés na mesma altura, centrada) — assim
// a troca não muda o tamanho/posição do bichinho na cena.
//
// Também guarda o player.png antigo e copia os 8 chapéus pra personagens/.
//
// Uso: node scripts/montar-base-customizacao.js
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMAGENS = path.join(RAIZ, "imagens");
const DIR_CUSTOM = path.join(
    DIR_IMAGENS,
    fs.readdirSync(DIR_IMAGENS).find(n => n.toLowerCase().startsWith("customiza"))
);
const PLAYER = path.join(DIR_IMAGENS, "personagens", "player.png");
const BASE = path.join(DIR_CUSTOM, "base", "base-frente.png");
const DIR_CHAPEUS_ORIG = path.join(DIR_CUSTOM, "chapeus");
const DIR_CHAPEUS = path.join(DIR_IMAGENS, "personagens", "chapeus");

const lêB64 = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const r = await page.evaluate(async ({ playerUrl, baseUrl }) => {
        const carrega = u => new Promise((ok, erro) => {
            const i = new Image(); i.onload = () => ok(i); i.onerror = erro; i.src = u;
        });
        const atual = await carrega(playerUrl);
        const nova = await carrega(baseUrl);

        // silhueta (alfa) do player atual
        const cv = document.createElement("canvas");
        cv.width = atual.naturalWidth; cv.height = atual.naturalHeight;
        const cx = cv.getContext("2d", { willReadFrequently: true });
        cx.drawImage(atual, 0, 0);
        const d = cx.getImageData(0, 0, cv.width, cv.height).data;
        let minX = cv.width, minY = cv.height, maxX = -1, maxY = -1;
        for (let y = 0; y < cv.height; y++) {
            for (let x = 0; x < cv.width; x++) {
                if (d[(y * cv.width + x) * 4 + 3] > 12) {
                    if (x < minX) minX = x;
                    if (x > maxX) maxX = x;
                    if (y < minY) minY = y;
                    if (y > maxY) maxY = y;
                }
            }
        }

        // topeira nova: escala pela LARGURA útil (a bichinha nova é mais gorda),
        // pés na mesma linha e centrada no eixo da silhueta atual
        const escala = ((maxX - minX + 1) * 0.99) / nova.naturalWidth;
        const w = Math.round(nova.naturalWidth * escala);
        const h = Math.round(nova.naturalHeight * escala);
        // Canvas na PROPORÇÃO da caixa do player no CSS (10.55 : 13.9): assim a
        // imagem preenche a caixa sem tarja e as âncoras em % valem sempre.
        const larguraCaixa = Math.round(cv.height * (10.55 / 13.9));
        const x = Math.round(larguraCaixa / 2 - w / 2);
        const y = Math.round(maxY - h + 1);

        const saida = document.createElement("canvas");
        saida.width = larguraCaixa; saida.height = cv.height;
        const ox = saida.getContext("2d");
        ox.imageSmoothingEnabled = true;
        ox.imageSmoothingQuality = "high";
        ox.drawImage(nova, x, y, w, h);

        return {
            url: saida.toDataURL("image/png"),
            canvas: { w: cv.width, h: cv.height },
            silhueta: { minX, minY, maxX, maxY, w: maxX - minX + 1, h: maxY - minY + 1 },
            base: { x, y, w, h }
        };
    }, { playerUrl: lêB64(PLAYER), baseUrl: lêB64(BASE) });

    // guarda o player antigo (pra reverter / referência)
    fs.copyFileSync(PLAYER, path.join(DIR_IMAGENS, "personagens", "player-antigo.png"));
    fs.writeFileSync(PLAYER, Buffer.from(r.url.split(",")[1], "base64"));

    fs.mkdirSync(DIR_CHAPEUS, { recursive: true });
    for (const f of fs.readdirSync(DIR_CHAPEUS_ORIG)) {
        fs.copyFileSync(path.join(DIR_CHAPEUS_ORIG, f), path.join(DIR_CHAPEUS, f));
    }

    console.log("canvas: " + r.canvas.w + "x" + r.canvas.h);
    console.log("silhueta antiga: " + JSON.stringify(r.silhueta));
    console.log("toupeira nova colocada em: " + JSON.stringify(r.base));
    console.log("chapéus copiados: " + fs.readdirSync(DIR_CHAPEUS).join(", "));
    await browser.close();
})();
