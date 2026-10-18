// Fatiador das FOLHAS DE MORTE novas (uma imagem = uma animação em linha).
//
// As folhas geradas têm os quadros desenhados lado a lado, em escala
// consistente, com o chão alinhado, mas com espaçamento irregular (às vezes
// dois quadros se tocam). Aqui:
//   1) acha os COMPONENTES conectados (cada cogumelo + a poeira em volta);
//   2) um componente grande = um quadro; a poeira (pequena) é grudada no
//      cogumelo mais próximo; dois cogumelos grudados são separados no vale;
//   3) cada quadro vai pra uma TELA FIXA, ancorado no chão e centralizado —
//      assim o `object-fit: contain` do jogo não muda escala nem pula entre
//      quadros;
//   4) salva como inimigos/morte/<tipo>-01.png ... -NN.png (a contagem entra
//      no BIOMA_MORTE, em biomas.js).
//
// Uso:
//   node scripts/fatiar-morte-sheet.js --tipo rei-espinhos
//   node scripts/fatiar-morte-sheet.js --tipo toxico --folha "<caminho.png>"
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const PASTA_SAIDA = path.join(RAIZ, "imagens", "inimigos", "morte");
const PASTA_CATALOGO = path.join(RAIZ, "imagens", "inimigos-futuros", "catalogo");

const args = process.argv.slice(2);
const arg = (nome, padrao) => {
    const i = args.indexOf("--" + nome);
    return i >= 0 && args[i + 1] ? args[i + 1] : padrao;
};

const TIPO = arg("tipo", "rei-espinhos");
let FOLHA = arg("folha", null);
if (!FOLHA) {
    // a folha mais recente da pasta (o gerador salva uma por vez, com nomes
    // parecidos) — assim o comando não precisa do caminho completo
    const candidatas = fs.readdirSync(PASTA_CATALOGO)
        .filter(n => /esmagamento|morte/i.test(n) && /\.(png|webp|jpe?g)$/i.test(n))
        .map(n => ({ nome: n, quando: fs.statSync(path.join(PASTA_CATALOGO, n)).mtimeMs }))
        .sort((a, b) => b.quando - a.quando);
    if (!candidatas.length) throw new Error("Nenhuma folha encontrada em " + PASTA_CATALOGO);
    FOLHA = path.join(PASTA_CATALOGO, candidatas[0].nome);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const b64 = fs.readFileSync(FOLHA).toString("base64");

    const resultado = await page.evaluate(async (src) => {
        const img = new Image();
        await new Promise((ok, err) => { img.onload = ok; img.onerror = err; img.src = src; });
        const W = img.naturalWidth;
        const H = img.naturalHeight;
        const canvas = document.createElement("canvas");
        canvas.width = W;
        canvas.height = H;
        const g = canvas.getContext("2d", { willReadFrequently: true });
        g.drawImage(img, 0, 0);
        const dados = g.getImageData(0, 0, W, H).data;
        const alpha = (x, y) => dados[(y * W + x) * 4 + 3];
        const solido = (x, y) => alpha(x, y) > 24;

        // --- componentes conectados (8 vizinhos) ---
        const visto = new Uint8Array(W * H);
        const comps = [];
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                const i = y * W + x;
                if (visto[i] || !solido(x, y)) continue;
                const pilha = [i];
                visto[i] = 1;
                let x0 = x, x1 = x, y0 = y, y1 = y, area = 0;
                while (pilha.length) {
                    const p = pilha.pop();
                    const px = p % W, py = (p / W) | 0;
                    area++;
                    if (px < x0) x0 = px;
                    if (px > x1) x1 = px;
                    if (py < y0) y0 = py;
                    if (py > y1) y1 = py;
                    for (let dy = -1; dy <= 1; dy++) {
                        for (let dx = -1; dx <= 1; dx++) {
                            const nx = px + dx, ny = py + dy;
                            if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
                            const ni = ny * W + nx;
                            if (visto[ni] || !solido(nx, ny)) continue;
                            visto[ni] = 1;
                            pilha.push(ni);
                        }
                    }
                }
                if (area >= 20) comps.push({ x0, x1, y0, y1, area });
            }
        }
        comps.sort((a, b) => a.x0 - b.x0);
        if (!comps.length) throw new Error("Folha sem nenhum pixel visível");

        // --- cogumelos (grandes) e poeira (pequena) ---
        const maxArea = Math.max(...comps.map(c => c.area));
        const grandes = comps.filter(c => c.area >= maxArea * 0.12);
        const pequenos = comps.filter(c => c.area < maxArea * 0.12);
        const largMedia = grandes.reduce((s, c) => s + (c.x1 - c.x0 + 1), 0) / grandes.length;

        // dois cogumelos grudados: corta no vale (coluna mais vazia do meio)
        const cogumelos = [];
        for (const c of grandes) {
            const larg = c.x1 - c.x0 + 1;
            if (larg < largMedia * 1.75) {
                cogumelos.push({ ...c, cx: (c.x0 + c.x1) / 2 });
                continue;
            }
            let melhor = -1;
            let melhorVale = Infinity;
            const ini = c.x0 + Math.floor(larg * 0.3);
            const fim = c.x1 - Math.floor(larg * 0.3);
            for (let x = ini; x <= fim; x++) {
                let n = 0;
                for (let y = c.y0; y <= c.y1; y++) if (alpha(x, y) > 24) n++;
                if (n < melhorVale) { melhorVale = n; melhor = x; }
            }
            cogumelos.push({ ...c, x1: melhor, cx: (c.x0 + melhor) / 2 });
            cogumelos.push({ ...c, x0: melhor + 1, cx: (melhor + 1 + c.x1) / 2 });
        }
        cogumelos.sort((a, b) => a.x0 - b.x0);

        // poeira -> cogumelo com maior sobreposição horizontal (ou mais perto)
        for (const p of pequenos) {
            let alvo = cogumelos[0];
            let melhorNota = -Infinity;
            for (const c of cogumelos) {
                const sobre = Math.min(p.x1, c.x1) - Math.max(p.x0, c.x0);
                const centro = (p.x0 + p.x1) / 2;
                const nota = sobre * 1000 - Math.abs(centro - (c.x0 + c.x1) / 2);
                if (nota > melhorNota) { melhorNota = nota; alvo = c; }
            }
            alvo.x0 = Math.min(alvo.x0, p.x0);
            alvo.x1 = Math.max(alvo.x1, p.x1);
            alvo.y0 = Math.min(alvo.y0, p.y0);
            alvo.y1 = Math.max(alvo.y1, p.y1);
        }

        // --- tela fixa: maior largura/altura, chão na base ---
        const largura = Math.max(...cogumelos.map(c => c.x1 - c.x0 + 1)) + 6;
        const altura = Math.max(...cogumelos.map(c => c.y1 - c.y0 + 1)) + 6;
        const quadros = [];
        for (const c of cogumelos) {
            const cw = c.x1 - c.x0 + 1;
            const ch = c.y1 - c.y0 + 1;
            const tela = document.createElement("canvas");
            tela.width = largura;
            tela.height = altura;
            const tg = tela.getContext("2d");
            // centraliza pela BASE do cogumelo (a poeira pode sair pro lado)
            const dx = Math.round(tela.width / 2 - (c.cx - c.x0));
            const dy = tela.height - 3 - ch;
            tg.drawImage(canvas, c.x0, c.y0, cw, ch, dx, dy, cw, ch);
            quadros.push(tela.toDataURL("image/png"));
        }
        return { largura, altura, quadros, total: cogumelos.length };
    }, "data:image/png;base64," + b64);

    await browser.close();

    // apaga os quadros antigos do tipo e grava os novos
    for (const nome of fs.readdirSync(PASTA_SAIDA)) {
        const m = nome.match(/^(.*)-(\d{2})\.png$/);
        if (m && m[1] === TIPO) fs.unlinkSync(path.join(PASTA_SAIDA, nome));
    }
    resultado.quadros.forEach((dataUrl, i) => {
        const nome = `${TIPO}-${String(i + 1).padStart(2, "0")}.png`;
        fs.writeFileSync(path.join(PASTA_SAIDA, nome), Buffer.from(dataUrl.split(",")[1], "base64"));
    });

    console.log(`${path.basename(FOLHA)} -> ${resultado.total} quadros de ${resultado.largura}x${resultado.altura}`);
    console.log(`salvos em imagens/inimigos/morte/${TIPO}-01..${String(resultado.total).padStart(2, "0")}.png`);
    console.log(`BIOMA_MORTE: ${TIPO}: BiomaMorte("${TIPO}", ${resultado.total})`);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
