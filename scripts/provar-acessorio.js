// Calibra QUALQUER acessório: compõe o player.png (base) + peças numa âncora,
// mostrando uma GRADE de % pra medir a posição certa (pescoço, cintura etc.).
//
// Uso:
//   node scripts/provar-acessorio.js <numeros> [x] [y] [largura] [frente|tras]
//   <numeros> = números das peças separados por vírgula (ex.: 012,013,017)
//   x         = centro da peça (% do canvas)
//   y         = ponto de ancoragem vertical (% do canvas) — o topo da peça fica aqui
//   largura   = largura da peça (% do canvas)
//   frente    = desenha POR CIMA da base (padrão) | tras = por baixo
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const DIR_IMG = path.join(RAIZ, "imagens");
const dirCustom = fs.readdirSync(DIR_IMG).find(d => d.startsWith("customiza"));
const DIR_PECAS = path.join(DIR_IMG, dirCustom, "pecas");
const PLAYER = path.join(DIR_IMG, "personagens", "player.png");

const numeros = String(process.argv[2] || "012").split(",").map(s => s.trim()).filter(Boolean);
const YS = String(process.argv[4] || 40).split(",").map(Number);
const ROTS = String(process.argv[7] || 0).split(",").map(Number);
const ROT = ROTS[0];
const FLIP = Number(process.argv[8] || 1);
const ANCHOR = {
    x: Number(process.argv[3] || 50),
    y: YS[0],
    largura: Number(process.argv[5] || 40)
};
const CAMADA = (process.argv[6] || "frente").toLowerCase();

const lêB64 = p => "data:image/png;base64," + fs.readFileSync(p).toString("base64");
const DIR_CHAPEUS = path.join(DIR_IMG, "personagens", "chapeus");

(async () => {
    const indices = JSON.parse(fs.readFileSync(path.join(DIR_PECAS, "indice.json"), "utf8"));
    const pecas = numeros.map(n => {
        const chapeu = /^chapeu-(\d+)/.exec(n);
        if (chapeu) {
            const arq = "chapeu-" + chapeu[1].padStart(2, "0") + ".png";
            const p = path.join(DIR_CHAPEUS, arq);
            if (!fs.existsSync(p)) throw new Error("chapéu não encontrado: " + arq);
            return { nome: "chapeu-" + chapeu[1], url: lêB64(p) };
        }
        const item = indices.find(p => p.nome.replace(/[^0-9]/g, "") === n);
        if (!item) throw new Error("peça não encontrada: " + n);
        return { nome: n, url: lêB64(path.join(DIR_PECAS, item.nome)) };
    });

    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const url = await page.evaluate(async ({ playerUrl, pecas, anchor, camada, ys, rots, flip }) => {
        const carrega = u => new Promise((ok, e) => { const i = new Image(); i.onload = () => ok(i); i.onerror = e; i.src = u; });
        const player = await carrega(playerUrl);
        const itens = [];
        if (rots && rots.length > 1) {
            for (const r of rots) itens.push({ nome: "rot=" + r, img: await carrega(pecas[0].url), rot: r });
        } else if (ys && ys.length > 1) {
            for (const y of ys) itens.push({ nome: "y=" + y, img: await carrega(pecas[0].url), y });
        } else {
            for (const p of pecas) itens.push({ nome: p.nome, img: await carrega(p.url) });
        }

        const LARG = 320;
        const H = Math.round(LARG * (player.naturalHeight / player.naturalWidth));
        const cv = document.createElement("canvas");
        cv.width = LARG * itens.length; cv.height = H;
        const cx = cv.getContext("2d");
        cx.imageSmoothingQuality = "high";

        const desenhaPeca = (img, painelX, yBase, rot, flip) => {
            const w = LARG * anchor.largura / 100;
            const h = w * (img.naturalHeight / img.naturalWidth);
            const x = painelX + LARG * anchor.x / 100 - w / 2;
            const y = H * yBase / 100 - h;   // y = BASE da peça (igual ao jogo)
            cx.save();
            cx.translate(x + w / 2, y + h);          // pivô = base-centro
            cx.rotate((rot || 0) * Math.PI / 180);
            cx.scale(flip || 1, 1);                   // espelha na horizontal
            cx.drawImage(img, -w / 2, -h, w, h);
            cx.restore();
            // contorno tracejado da caixa da peça
            cx.save();
            cx.setLineDash([4, 3]);
            cx.strokeStyle = "rgba(126,224,160,0.85)";
            cx.lineWidth = 1;
            cx.strokeRect(x, y, w, h);
            cx.restore();
        };

        itens.forEach((it, i) => {
            cx.save();
            cx.translate(i * LARG, 0);
            cx.fillStyle = i % 2 ? "#22303f" : "#1a2230";
            cx.fillRect(0, 0, LARG, H);
            if (camada === "tras") desenhaPeca(it.img, 0, it.y ?? anchor.y, it.rot ?? rots[0], flip);
            cx.drawImage(player, 0, 0, LARG, H);
            if (camada !== "tras") desenhaPeca(it.img, 0, it.y ?? anchor.y, it.rot ?? rots[0], flip);
            // grade de % (linhas a cada 10%) por cima
            cx.strokeStyle = "rgba(255,255,255,0.16)";
            cx.fillStyle = "rgba(255,226,160,0.9)";
            cx.font = "9px monospace";
            cx.lineWidth = 1;
            for (let p = 10; p < 100; p += 10) {
                const gy = H * p / 100;
                cx.beginPath(); cx.moveTo(0, gy); cx.lineTo(LARG, gy); cx.stroke();
                cx.fillText(p, 2, gy - 2);
                const gx = LARG * p / 100;
                cx.beginPath(); cx.moveTo(gx, 0); cx.lineTo(gx, H); cx.stroke();
                cx.fillText(p, gx + 1, 10);
            }
            cx.fillStyle = "#7ee0a0";
            cx.font = "bold 12px sans-serif";
            cx.fillText("peça " + it.nome, 6, H - 6);
            cx.restore();
        });
        return cv.toDataURL("image/png");
    }, { playerUrl: lêB64(PLAYER), pecas, anchor: ANCHOR, camada: CAMADA, ys: YS, rots: ROTS, flip: FLIP });

    const saida = path.join(process.env.TEMP || ".", "opencode", "provar-acessorio.png");
    fs.mkdirSync(path.dirname(saida), { recursive: true });
    fs.writeFileSync(saida, Buffer.from(url.split(",")[1], "base64"));
    console.log("pecas=" + numeros.join(",") + " x=" + ANCHOR.x + "% y=" + ANCHOR.y + "% largura=" + ANCHOR.largura + "% camada=" + CAMADA + " -> " + saida);
    await browser.close();
})();
