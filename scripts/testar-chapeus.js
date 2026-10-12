// Calibra os chapéus: compõe o player.png (base sem chapéu) + cada chapéu, pra
// achar a âncora boa (posição em % do canvas + largura em % do canvas).
// Gera uma tira: C:\Users\...\Temp\opencode\teste-chapeus.png
//
// Uso: node scripts/testar-chapeus.js [x] [y] [largura]
//   x/y = onde a BASE do chapéu encosta (cabeça), em % do canvas
//   largura = largura do chapéu em % do canvas
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMAGENS = path.join(RAIZ, "imagens");
const PLAYER = path.join(DIR_IMAGENS, "personagens", "player.png");
const DIR_CHAPEUS = path.join(DIR_IMAGENS, "personagens", "chapeus");

const ANCHOR = {
    x: Number(process.argv[2] || 52),       // % do canvas
    y: Number(process.argv[3] || 19),       // % do canvas (base do chapéu)
    largura: Number(process.argv[4] || 60)  // % do canvas
};

const CHAPEUS = [
    ["chapeu-01.png", "capacete amarelo"],
    ["chapeu-02.png", "capacete escuro"],
    ["chapeu-03.png", "capacete vermelho"],
    ["chapeu-04.png", "capacete verde"],
    ["chapeu-05.png", "capacete viking"],
    ["chapeu-06.png", "chapéu de mago"],
    ["chapeu-07.png", "chapéu de palha"],
    ["chapeu-08.png", "chapéu de pirata"]
];

const lêB64 = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const base64Player = lêB64(PLAYER);
    const hats = CHAPEUS.map(([arq, nome]) => ({
        nome, url: lêB64(path.join(DIR_CHAPEUS, arq))
    }));
    const url = await page.evaluate(async ({ playerUrl, hats, anchor }) => {
        const carrega = u => new Promise((ok, e) => { const i = new Image(); i.onload = () => ok(i); i.onerror = e; i.src = u; });
        const player = await carrega(playerUrl);
        const itens = [];
        for (const h of hats) itens.push({ nome: h.nome, img: await carrega(h.url) });

        const LARG = 160;
        const painelH = Math.round(LARG * (player.naturalHeight / player.naturalWidth));
        const cv = document.createElement("canvas");
        cv.width = LARG * itens.length; cv.height = painelH;
        const cx = cv.getContext("2d");
        cx.imageSmoothingQuality = "high";

        itens.forEach((it, i) => {
            cx.save();
            cx.translate(i * LARG, 0);
            cx.fillStyle = i % 2 ? "#22303f" : "#1a2230";
            cx.fillRect(0, 0, LARG, painelH);
            cx.drawImage(player, 0, 0, LARG, painelH);
            const hW = LARG * anchor.largura / 100;
            const hH = hW * (it.img.naturalHeight / it.img.naturalWidth);
            const hX = LARG * anchor.x / 100 - hW / 2;
            const hY = painelH * anchor.y / 100 - hH;
            cx.drawImage(it.img, hX, hY, hW, hH);
            cx.fillStyle = "#ffe2a0";
            cx.font = "11px sans-serif";
            cx.textAlign = "center";
            cx.fillText(it.nome, LARG / 2, 14);
            cx.restore();
        });
        return cv.toDataURL("image/png");
    }, { playerUrl: base64Player, hats, anchor: ANCHOR });

    const saida = path.join(process.env.TEMP || ".", "opencode", "teste-chapeus.png");
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, Buffer.from(url.split(",")[1], "base64"));
    console.log("ancora x=" + ANCHOR.x + "% y=" + ANCHOR.y + "% largura=" + ANCHOR.largura + "% -> " + saida);
    await browser.close();
})();
