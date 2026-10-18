// Fatiador das FOLHAS DE MORTE novas (uma imagem = uma animação em linha).
//
// As folhas geradas têm os quadros desenhados lado a lado, em escala
// consistente, com o chão alinhado, mas com espaçamento irregular: às vezes
// dois quadros se tocam (ou as chamas/fumaça de um encostam no seguinte), e às
// vezes sobra poeira solta no meio. Por isso a divisão NÃO pode ser por
// componentes conectados (as chamas grudam tudo num só) nem por grade fixa
// (o espaçamento não é exato). Aqui:
//   1) o perfil de colunas (quantos pixels visíveis por coluna) é cortado nos
//      VALES — a fatia de limiar que dá quadros mais parecidos de largura;
//   2) sobras de pouco conteúdo (poeira solta) entram no quadro vizinho;
//   3) cada quadro vai pra uma TELA FIXA, ancorado no chão e centralizado no
//      corpo do cogumelo — assim o `object-fit: contain` do jogo não muda
//      escala nem pula entre quadros;
//   4) salva como inimigos/morte/<tipo>-01.png ... -NN.png (a contagem entra
//      no BIOMA_MORTE, em script/biomas.js).
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
    // a folha mais recente da pasta (o gerador salva uma por vez, com nomes que
    // variam: "esmagamento", "derrota", ...) — assim o comando não precisa do
    // caminho completo. Os moldes de 4 poses ficam fora pelo nome.
    const MOLDES = [
        "normal", "gigante", "cristal", "vegetal", "metalico", "terra-vulcanica",
        "neve", "rei", "gelo", "lava", "toxico", "fantasma", "carnivora",
        "sombrio", "_montagem"
    ];
    const imagens = fs.readdirSync(PASTA_CATALOGO).filter(n => /\.(png|webp|jpe?g)$/i.test(n));
    const chave = /esmagamento|derrota|morte|queda|colapso|defeat|death|sprite de|anima/i;
    const porNome = imagens.filter(n => chave.test(n));
    const candidatas = (porNome.length ? porNome : imagens.filter(n =>
        !MOLDES.includes(n.replace(/\.(png|webp|jpe?g)$/i, "").toLowerCase())
    ))
        .map(n => ({ nome: n, quando: fs.statSync(path.join(PASTA_CATALOGO, n)).mtimeMs }))
        .sort((a, b) => b.quando - a.quando);
    if (!candidatas.length) throw new Error("Nenhuma folha encontrada em " + PASTA_CATALOGO);
    FOLHA = path.join(PASTA_CATALOGO, candidatas[0].nome);
}

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const b64 = fs.readFileSync(FOLHA).toString("base64");

    const resultado = await page.evaluate(async ({ src, debug, quadrosForcados }) => {
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

        // ---- XADREZ DE TRANSPARÊNCIA "ASSADO" NA IMAGEM ----
        // Alguns geradores exportam o xadrez do visualizador como pixels em vez
        // de alfa. Aqui isso é detectado pela borda (duas cores neutras e claras
        // alternando em quadrados) e apagado SÓ no que está ligado à borda —
        // assim branco/brilho dentro do desenho não é comido.
        let infoXadrez = null;
        const removeXadrez = () => {
            const cor = (x, y) => { const i = (y * W + x) * 4; return [dados[i], dados[i + 1], dados[i + 2]]; };
            const dist = (a, b) => Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
            const perto = (c, a) => dist(c, a) <= 22;
            const neutra = (c) => Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) <= 22 && Math.min(c[0], c[1], c[2]) >= 150;
            const amostra = [];
            for (let x = 0; x < W; x += 3) { amostra.push([x, 0], [x, H - 1]); }
            for (let y = 0; y < H; y += 3) { amostra.push([0, y], [W - 1, y]); }
            const contagem = new Map();
            for (const [x, y] of amostra) {
                const c = cor(x, y);
                const k = c.map(v => Math.round(v / 8) * 8).join(",");
                contagem.set(k, (contagem.get(k) || 0) + 1);
            }
            const top = [...contagem.entries()].sort((a, b) => b[1] - a[1]).slice(0, 2);
            if (top.length < 2) { infoXadrez = { parou: "sem 2 cores" }; return false; }
            const c0 = top[0][0].split(",").map(Number);
            const c1 = top[1][0].split(",").map(Number);
            const claras = amostra.filter(([x, y]) => {
                const c = cor(x, y);
                return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) <= 34 && Math.min(c[0], c[1], c[2]) >= 195;
            }).length;
            infoXadrez = { c0, c1, dist: dist(c0, c1), claras, amostra: amostra.length };
            // A borda da folha é CLARA e NEUTRA = é o xadrez de transparência.
            // Sem modelo de grade: o xadrez pode estar fora de fase com a origem
            // ou ter sido redimensionado e "derrapar" (aí a paridade não fecha).
            // Com fundo transparente de verdade, a borda é escura/alfa 0 e isso
            // não passa — então não há risco de comer desenho à toa.
            if (claras < amostra.length * 0.9) { infoXadrez.parou = "borda nao e clara/neutra"; return false; }
            // apaga em onda a partir das bordas. A borda do xadrez tem pixels de
            // transição (cinza claro neutro), então a onda aceita qualquer
            // "quase-branco neutro" — assim ela não para nos degraus do xadrez.
            const fundoFundo = (c) => {
                const max = Math.max(c[0], c[1], c[2]);
                const min = Math.min(c[0], c[1], c[2]);
                return (max - min) <= 34 && min >= 195;
            };
            const visto = new Uint8Array(W * H);
            const pilha = [];
            const empilha = (x, y) => {
                const i = y * W + x;
                if (!visto[i] && fundoFundo(cor(x, y))) { visto[i] = 1; pilha.push(i); }
            };
            for (let x = 0; x < W; x++) { empilha(x, 0); empilha(x, H - 1); }
            for (let y = 0; y < H; y++) { empilha(0, y); empilha(W - 1, y); }
            let apagados = 0;
            while (pilha.length) {
                const p = pilha.pop();
                dados[p * 4 + 3] = 0;
                apagados++;
                const px = p % W, py = (p / W) | 0;
                if (px > 0) empilha(px - 1, py);
                if (px < W - 1) empilha(px + 1, py);
                if (py > 0) empilha(px, py - 1);
                if (py < H - 1) empilha(px, py + 1);
            }
            // Bolsões de xadrez FECHADOS entre as chamas/fumaça: a onda da borda
            // não chega neles. São reconhecidos pelo PRÓPRIO padrão (as duas cores
            // alternando nas posições do quadrado) — o branco do desenho é
            // sombreado, então não casa com o padrão e não é apagado.
            const visitado = new Uint8Array(W * H);
            const apagaBolsao = (inicio) => {
                const comp = [];
                const fila = [inicio];
                visitado[inicio] = 1;
                while (fila.length) {
                    const p = fila.pop();
                    comp.push(p);
                    const px = p % W, py = (p / W) | 0;
                    const viz = [];
                    if (px > 0) viz.push(p - 1);
                    if (px < W - 1) viz.push(p + 1);
                    if (py > 0) viz.push(p - W);
                    if (py < H - 1) viz.push(p + W);
                    for (const q of viz) {
                        if (visitado[q]) continue;
                        const qx = q % W, qy = (q / W) | 0;
                        if (fundoFundo(cor(qx, qy))) { visitado[q] = 1; fila.push(q); }
                    }
                }
                let pertoC0 = 0;
                let pertoC1 = 0;
                for (const p of comp) {
                    const px = p % W, py = (p / W) | 0;
                    const c = cor(px, py);
                    if (dist(c, c0) <= 10) pertoC0++;
                    else if (dist(c, c1) <= 10) pertoC1++;
                }
                // xadrez = as DUAS cores do fundo aparecem no bolsão; um brilho
                // branco do próprio desenho tem só uma delas
                const frac0 = pertoC0 / comp.length;
                const frac1 = pertoC1 / comp.length;
                if (comp.length < 40 || frac0 < 0.15 || frac1 < 0.15 || (frac0 + frac1) < 0.6) return 0;
                for (const p of comp) dados[p * 4 + 3] = 0;
                return comp.length;
            };
            for (let i = 0; i < W * H; i++) {
                if (visitado[i] || dados[i * 4 + 3] === 0) continue;
                const x = i % W, y = (i / W) | 0;
                if (fundoFundo(cor(x, y))) apagados += apagaBolsao(i);
            }
            return apagados > (W * H) * 0.1;
        };
        const tirouXadrez = removeXadrez();
        // a limpeza foi feita na CÓPIA dos pixels: devolve pro canvas, senão o
        // recorte continuaria pegando o fundo original
        if (tirouXadrez) g.putImageData(new ImageData(dados, W, H), 0, 0);

        const solido = (x, y) => dados[(y * W + x) * 4 + 3] > 24;

        // ---- perfis de colunas (pixels visíveis) ----
        // Dois perfis: o de TUDO e o da BASE (a faixa de baixo, onde fica o corpo
        // do cogumelo). Fumaça, chamas ou poeira que atravessam por cima dos
        // quadros vizinhos aparecem no perfil de tudo e atrapalham o corte; na
        // faixa de baixo os corpos estão separados. O corte usa o perfil que der
        // os quadros mais parecidos de largura.
        let gy0 = H;
        let gy1 = -1;
        for (let y = 0; y < H; y++) {
            for (let x = 0; x < W; x++) {
                if (!solido(x, y)) continue;
                if (y < gy0) gy0 = y;
                if (y > gy1) gy1 = y;
                break;
            }
        }
        if (gy1 < 0) throw new Error("Folha sem nenhum pixel visível");
        const perfilDe = (de, ate, teste) => {
            const testePx = teste || solido;
            const arr = new Uint32Array(W);
            let max = 0;
            for (let x = 0; x < W; x++) {
                let n = 0;
                for (let y = de; y <= ate; y++) if (testePx(x, y)) n++;
                arr[x] = n;
                if (n > max) max = n;
            }
            return { arr, max };
        };
        // "núcleo" = pixel escuro ou saturado (o CORPO do bicho, os contornos, a
        // faixa do MUGI). Fumaça/chamas claras ficam de fora — é o que permite
        // cortar folhas em que a fumaça atravessa o quadro inteiro (metalico).
        const nucleo = (x, y) => {
            if (!solido(x, y)) return false;
            const i = (y * W + x) * 4;
            const r = dados[i], g = dados[i + 1], b = dados[i + 2];
            const max = Math.max(r, g, b);
            return max < 185 || (max - Math.min(r, g, b)) > 45;
        };
        // "escuro" = só o que é escuro de verdade (o chapéu, os contornos). Serve
        // pra folhas em que um brilho claro E saturado (a aura verde do vegetal)
        // liga os quadros: o brilho tem cor forte, então "saturado" não separa.
        const escuro = (x, y) => {
            if (!solido(x, y)) return false;
            const i = (y * W + x) * 4;
            return Math.max(dados[i], dados[i + 1], dados[i + 2]) < 150;
        };
        const alturaConteudo = gy1 - gy0 + 1;
        const yBase = Math.max(gy0, gy1 - Math.round(alturaConteudo * 0.4));
        // "maior run": o maior trecho CONTÍNUO de pixels visíveis numa coluna.
        // Halos/brilhos finos (a aura verde do vegetal, a fumaça rala) somam
        // pouco; o corpo do cogumelo dá um run comprido. É o perfil que separa
        // folhas em que um brilho fino atravessa e liga todos os quadros.
        const perfilRun = (teste) => {
            const testePx = teste || solido;
            const arr = new Uint32Array(W);
            let max = 0;
            for (let x = 0; x < W; x++) {
                let melhorRun = 0;
                let atual = 0;
                for (let y = 0; y < H; y++) {
                    if (testePx(x, y)) { atual++; if (atual > melhorRun) melhorRun = atual; }
                    else atual = 0;
                }
                arr[x] = melhorRun;
                if (melhorRun > max) max = melhorRun;
            }
            return { arr, max };
        };
        const perfis = [
            { nome: "tudo", ...perfilDe(0, H - 1) },
            { nome: "base", ...perfilDe(yBase, gy1) },
            { nome: "nucleo", ...perfilDe(0, H - 1, nucleo) },
            { nome: "base+nucleo", ...perfilDe(yBase, gy1, nucleo) },
            { nome: "maiorRun", ...perfilRun() },
            { nome: "run+nucleo", ...perfilRun(nucleo) },
            { nome: "escuro", ...perfilDe(0, H - 1, escuro) },
            { nome: "run+escuro", ...perfilRun(escuro) }
        ].filter(p => p.max > 0);
        const proj = perfis[0].arr;
        const maxProj = perfis[0].max;

        // ---- corta nos vales: testa limiares e fica com os quadros mais parecidos ----
        const mediana = (arr) => {
            const o = Array.from(arr).sort((a, b) => a - b);
            return o[Math.floor(o.length / 2)];
        };
        // ---- largura típica do quadro (pitch) ----
        // A repetição dos quadros aparece como um pico na autocorrelação da
        // silhueta. O placar do corte usa esse pitch: sem ele, uma divisão
        // degenerada (4 quadros larguíssimos, todos "iguais") ganhava de uma
        // divisão certa de 14 quadros.
        const achaPitch = () => {
            const seco = perfis.find(p => p.nome === "escuro") || perfis.find(p => p.nome === "nucleo") || perfis[0];
            const lim = Math.max(2, Math.round(seco.max * 0.2));
            const v = new Uint8Array(W);
            for (let x = 0; x < W; x++) v[x] = seco.arr[x] > lim ? 1 : 0;
            const maxP = Math.floor(W / 3);
            const corr = new Float64Array(maxP + 1);
            let melhorCorr = 0;
            for (let p = 40; p <= maxP; p++) {
                let s = 0;
                for (let x = 0; x + p < W; x++) if (v[x] && v[x + p]) s++;
                corr[p] = s;
                if (s > melhorCorr) melhorCorr = s;
            }
            if (!melhorCorr) return 0;
            // o MENOR atraso com correlação alta (perto do pico) é o pitch — o
            // pico de 2x o pitch também é alto, mas o primeiro é o certo
            for (let p = 40; p <= maxP; p++) if (corr[p] >= melhorCorr * 0.85) return p;
            return 0;
        };
        const pitch = achaPitch();
        const nEsperado = pitch ? Math.max(2, Math.round(W / pitch)) : 0;

        // ---- corte por QUANTIDADE informada (--quadros N) ----
        // Saída determinística pras folhas difíceis (brilho/fumaça ligando os
        // quadros): divide em N, mas encaixa cada corte no vale mais próximo da
        // silhueta "seca", em vez de cortar no meio do bicho.
        const cortaEmN = (n) => {
            const seco = perfis.find(p => p.nome === "escuro") || perfis.find(p => p.nome === "nucleo") || perfis[0];
            const combinado = new Float64Array(W);
            for (const p of perfis) {
                let maxP = 0;
                for (let x = 0; x < W; x++) if (p.arr[x] > maxP) maxP = p.arr[x];
                if (!maxP) continue;
                for (let x = 0; x < W; x++) combinado[x] += p.arr[x] / maxP;
            }
            const segs = [];
            let x0 = 0;
            const passo = W / n;
            for (let k = 1; k < n; k++) {
                const alvo = Math.round(k * passo);
                // janela generosa: numa folha com aura/fumaça ligando os quadros a
                // divisória real pode estar bem longe da fatia igual (no vegetal a
                // última estava 30px adiante) e o corte entrava dentro do bicho
                const jan = Math.max(4, Math.round(passo * 0.35));
                let corte = alvo;
                let menor = Infinity;
                for (let x = Math.max(x0 + 4, alvo - jan); x <= Math.min(W - 2, alvo + jan); x++) {
                    if (combinado[x] < menor) { menor = combinado[x]; corte = x; }
                }
                if (corte <= x0) continue;
                segs.push({ x0, x1: corte - 1 });
                x0 = corte;
            }
            if (x0 <= W - 1) segs.push({ x0, x1: W - 1 });
            return segs;
        };
        const nForcado = Number(quadrosForcados) || 0;
        const segmentar = (limite, arr) => {
            const segs = [];
            let x0 = null;
            for (let x = 0; x < W; x++) {
                if (arr[x] > limite) { if (x0 === null) x0 = x; }
                else if (x0 !== null) { segs.push({ x0, x1: x - 1 }); x0 = null; }
            }
            if (x0 !== null) segs.push({ x0, x1: W - 1 });
            return segs;
        };
        const areaSeg = (s, arr) => { let a = 0; for (let x = s.x0; x <= s.x1; x++) a += arr[x]; return a; };
        let melhor = null;
        const tabela = [];
        const resumoPerfis = [];
        for (const perfil of perfis) {
            let melhorDoPerfil = null;
            for (let passo = 1; passo <= 48; passo++) {
                const limite = Math.floor(perfil.max * passo / 48);
                const segs = segmentar(limite, perfil.arr);
                if (debug) tabela.push({ perfil: perfil.nome, limite, n: segs.length, larg: segs.slice(0, 4).map(s => s.x1 - s.x0 + 1) });
                if (segs.length < 4) continue;
                const larguras = segs.map(s => s.x1 - s.x0 + 1);
                const med = mediana(larguras);
                const bons = larguras.filter(w => w >= med * 0.55 && w <= med * 1.9).length;
                // uniformidade do corte, corrigida pela quantidade esperada de
                // quadros (pitch): desempata a favor do corte com o "tamanho
                // natural" de quadro
                const uniformidade = bons / larguras.length;
                const desvio = nEsperado ? Math.min(1, Math.abs(segs.length - nEsperado) / nEsperado) : 0;
                const nota = uniformidade - 0.35 * desvio;
                if (!melhorDoPerfil || nota > melhorDoPerfil.nota + 0.001) melhorDoPerfil = { limite, n: segs.length, nota, uniformidade };
                // empate: fica com o limiar mais baixo (menos cortes arriscados)
                // e com o perfil "tudo" (o primeiro testado)
                if (!melhor || nota > melhor.nota + 0.001) melhor = { perfil, limite, segs, nota, uniformidade };
            }
            if (debug) resumoPerfis.push({ perfil: perfil.nome, ...(melhorDoPerfil || { nota: 0, n: 0, limite: 0 }) });
        }
        if (nForcado > 0) {
            melhor = { perfil: perfis[0], limite: 0, segs: cortaEmN(nForcado), nota: 1, uniformidade: 1, forcado: true };
            melhor.perfil.arr = melhor.perfil.arr; // (mantém o perfil "tudo" pra refinar)
        }
        if (!melhor) {
            if (debug) return { erro: "Não consegui separar os quadros", tabela, tirouXadrez, W, H, maxProj, infoXadrez };
            throw new Error("Não consegui separar os quadros");
        }
        let segs = melhor.segs;
        const projCorte = melhor.perfil.arr;

        // ---- sobras de pouco conteúdo entram no vizinho maior ----
        const areas = segs.map(s => areaSeg(s, projCorte));
        const medArea = mediana(areas);
        let mudou = !melhor.forcado;
        while (mudou && segs.length > 4) {
            mudou = false;
            for (let i = 0; i < segs.length; i++) {
                if (areaSeg(segs[i], projCorte) >= medArea * 0.25) continue;
                const esq = segs[i - 1];
                const dir = segs[i + 1];
                const alvo = (!esq && dir) || (dir && esq && areaSeg(dir, projCorte) >= areaSeg(esq, projCorte)) ? dir : esq;
                if (!alvo) continue;
                alvo.x0 = Math.min(alvo.x0, segs[i].x0);
                alvo.x1 = Math.max(alvo.x1, segs[i].x1);
                segs.splice(i, 1);
                mudou = true;
                break;
            }
        }
        segs.sort((a, b) => a.x0 - b.x0);

        // ---- segmento largo demais = vários quadros grudados (as chamas
        //      encostam um no outro): separa no vale interno, quantas vezes
        //      precisar. O limite é relativo à largura mediana, então um quadro
        //      naturalmente largo (a nuvem de poeira do fim) não é cortado. ----
        let mudouSplit = !melhor.forcado;
        while (mudouSplit) {
            mudouSplit = false;
            const med = mediana(segs.map(s => s.x1 - s.x0 + 1));
            for (let i = 0; i < segs.length; i++) {
                const s = segs[i];
                const larg = s.x1 - s.x0 + 1;
                if (larg < med * 1.6) continue;
                let corte = -1;
                let menor = Infinity;
                const ini = s.x0 + Math.floor(larg * 0.2);
                const fim = s.x1 - Math.floor(larg * 0.2);
                for (let x = ini; x <= fim; x++) if (projCorte[x] < menor) { menor = projCorte[x]; corte = x; }
                if (corte <= s.x0 || corte >= s.x1) continue;
                segs.splice(i, 1, { x0: s.x0, x1: corte }, { x0: corte + 1, x1: s.x1 });
                mudouSplit = true;
                break;
            }
        }
        segs.sort((a, b) => a.x0 - b.x0);

        // ---- caixa de cada quadro (dentro da fatia) ----
        // A âncora horizontal é o CENTRO DA BASE (a faixa de baixo, no chão):
        // as chamas e os respingos balançam em cima e, se a âncora fosse a
        // coluna mais cheia, o corpo escorregava de um lado pro outro entre os
        // quadros. O chão não se mexe em nenhum quadro.
        const quadrosInfo = segs.map((s) => {
            let x0 = s.x1, x1 = s.x0, y0 = H, y1 = -1;
            for (let x = s.x0; x <= s.x1; x++) {
                for (let y = 0; y < H; y++) {
                    if (!solido(x, y)) continue;
                    if (x < x0) x0 = x;
                    if (x > x1) x1 = x;
                    if (y < y0) y0 = y;
                    if (y > y1) y1 = y;
                }
            }
            if (y1 < 0) return null;
            const alturaBase = Math.max(4, Math.round((y1 - y0 + 1) * 0.22));
            const xs = [];
            for (let x = x0; x <= x1; x++) {
                for (let y = Math.max(y0, y1 - alturaBase + 1); y <= y1; y++) {
                    if (solido(x, y)) { xs.push(x + 0.5); break; }
                }
            }
            // MEDIANA (não média): os respingos/fumaça que saem para um lado são
            // minoria e não puxam a âncora
            xs.sort((a, b) => a - b);
            const cx = xs.length ? xs[xs.length >> 1] : (x0 + x1) / 2;
            return { x0, x1, y0, y1, cx };
        }).filter(Boolean);

        // ---- tela fixa ----
        // Mesma proporção da caixa do inimigo no jogo (120:130), com o chão no
        // pé: o jogo desenha o quadro com `object-fit: contain` e CENTRALIZA. Se
        // a tela tiver outra proporção, o quadro baixinho (a pilha) aparece no
        // meio da caixa, flutuando — e o bicho "pula" de altura entre os
        // quadros. Com a proporção igual, o contain preenche a caixa exata e o
        // chão cai no lugar certo.
        const RAZAO_CAIXA = 120 / 130;
        const MARGEM = 4;
        let largura = Math.max(...quadrosInfo.map(q => q.x1 - q.x0 + 1)) + MARGEM * 2;
        let altura = Math.round(largura / RAZAO_CAIXA);
        const alturaMinima = Math.max(...quadrosInfo.map(q => q.y1 - q.y0 + 1)) + MARGEM * 2;
        if (altura < alturaMinima) {
            altura = alturaMinima;
            largura = Math.round(altura * RAZAO_CAIXA);
        }
        const quadros = quadrosInfo.map((q) => {
            const cw = q.x1 - q.x0 + 1;
            const ch = q.y1 - q.y0 + 1;
            const tela = document.createElement("canvas");
            tela.width = largura;
            tela.height = altura;
            const tg = tela.getContext("2d");
            // centraliza pelo CORPO do cogumelo (a poeira pode sair pro lado) e
            // ancora o chão sempre na mesma linha
            const dx = Math.round(tela.width / 2 - (q.cx - q.x0));
            const dy = tela.height - MARGEM - ch;
            tg.drawImage(canvas, q.x0, q.y0, cw, ch, dx, dy, cw, ch);
            return tela.toDataURL("image/png");
        });
        return { largura, altura, quadros, total: quadros.length, limiar: melhor.limite, perfil: melhor.perfil.nome, nota: melhor.nota, tirouXadrez, resumoPerfis: debug ? resumoPerfis : null };
    }, { src: "data:image/png;base64," + b64, debug: args.includes("--debug"), quadrosForcados: Number(arg("quadros", 0)) || 0 });

    await browser.close();

    if (resultado.erro) {
        console.log(`${path.basename(FOLHA)}: ${resultado.erro}  (${resultado.W}x${resultado.H}, perfil max ${resultado.maxProj}` +
            `${resultado.tirouXadrez ? ", xadrez removido" : ""})`);
        if (resultado.infoXadrez) console.log("detecção do xadrez:", JSON.stringify(resultado.infoXadrez));
        process.exit(1);
    }

    // apaga os quadros antigos do tipo e grava os novos
    let antigos = 0;
    for (const nome of fs.readdirSync(PASTA_SAIDA)) {
        const m = nome.match(/^(.*)-(\d{2})\.png$/);
        if (m && m[1] === TIPO) { fs.unlinkSync(path.join(PASTA_SAIDA, nome)); antigos++; }
    }
    resultado.quadros.forEach((dataUrl, i) => {
        const nome = `${TIPO}-${String(i + 1).padStart(2, "0")}.png`;
        fs.writeFileSync(path.join(PASTA_SAIDA, nome), Buffer.from(dataUrl.split(",")[1], "base64"));
    });

    console.log(`${path.basename(FOLHA)} -> ${resultado.total} quadros de ${resultado.largura}x${resultado.altura}` +
        ` (limiar ${resultado.limiar}, uniformidade ${resultado.nota.toFixed(2)}; ${antigos} antigos apagados)` +
        (resultado.tirouXadrez ? " [xadrez de fundo removido]" : ""));
    console.log(`salvos em imagens/inimigos/morte/${TIPO}-01..${String(resultado.total).padStart(2, "0")}.png`);
    if (resultado.resumoPerfis) {
        console.log("debug - melhor corte por perfil (perfil / quadros / limiar / uniformidade):");
        resultado.resumoPerfis.forEach(p => console.log(
            `  ${String(p.perfil).padEnd(12)} ${String(p.n).padStart(3)}  limiar ${String(p.limite).padStart(4)}  uniformidade ${p.nota.toFixed(2)}`));
    }
    console.log(`BIOMA_MORTE: ${TIPO}: BiomaMorte("${TIPO}", ${resultado.total})`);
})().catch(err => {
    console.error(err);
    process.exit(1);
});
