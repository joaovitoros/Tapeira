// ============== BIOMAS: fundo + inimigos por faixa de andar ================
// A cada 10 andares o jogo troca o FUNDO da caverna e o SPRITE dos inimigos —
// e cada criatura morre com a SUA própria animação. É só visual: nada aqui
// muda regra de jogo nem entra no save.
//
// De onde vêm as artes:
//  - fundos:   imagens/fundos/fundo-*.jpg (novos) + os 2 antigos;
//  - inimigos: imagens/inimigos/*.png (fatiados da folha MUGI por
//              scripts/fatiar-inimigos.js);
//  - mortes:   imagens/inimigos/morte/*.png (fatiados do atlas por
//              scripts/fatiar-morte-inimigos.js).
//
// Scripts clássicos: funções globais.

const BIOMA_ANDARES = 10;   // troca de bioma a cada N andares

// Fundos (relativos a imagens/). Os 8 primeiros são os novos; os 2 últimos são
// os que já existiam, fechando um ciclo de 100 andares.
const BIOMA_FUNDOS = [
    "fundos/fundo-cristais-congelados.jpg",
    "fundos/fundo-steampunk.jpg",
    "fundos/fundo-vulcanica.jpg",
    "fundos/fundo-cogumelos-1.jpg",
    "fundos/fundo-cogumelos-2.jpg",
    "fundos/fundo-cogumelos-mugi.jpg",
    "fundos/fundo-luzes-cristais.jpg",
    "fundos/fundo-cristais-roxos.jpg",
    "fundos/background cristal.png",
    "fundos/background.png"
];

// Inimigos fatiados de "Folha de Criaturas MUGI Elementais.png" (14 tipos).
const BIOMA_INIMIGOS = [
    "inimigos/normal.png", "inimigos/vegetal.png", "inimigos/cristal.png",
    "inimigos/gelo.png", "inimigos/metalico.png", "inimigos/toxico.png",
    "inimigos/lava.png", "inimigos/madeira.png", "inimigos/sombrio.png",
    "inimigos/rei-espinhos.png", "inimigos/gigante.png", "inimigos/normal2.png",
    "inimigos/rei-coroa.png", "inimigos/poeira.png"
];

// Quadros da MORTE de cada criatura. Sem entrada = usa a animação genérica.
function BiomaMorte(nome, n) {
    const out = [];
    for (let i = 1; i <= n; i++) out.push("inimigos/morte/" + nome + "-" + String(i).padStart(2, "0") + ".png");
    return out;
}
const BIOMA_MORTE = {
    normal: BiomaMorte("normal", 14),
    gigante: BiomaMorte("gigante", 14),
    cristal: BiomaMorte("cristal", 15),
    vegetal: BiomaMorte("vegetal", 13),
    metalico: BiomaMorte("metalico", 13),
    lava: BiomaMorte("lava", 14),
    gelo: BiomaMorte("gelo", 14),
    "rei-espinhos": BiomaMorte("rei-espinhos", 15),
    toxico: BiomaMorte("toxico", 13),
    normal2: BiomaMorte("normal2", 5),
    "rei-coroa": BiomaMorte("rei-coroa", 14),
    sombrio: BiomaMorte("sombrio", 14),
    poeira: BiomaMorte("poeira", 5)
    // madeira: sem morte própria (cai na genérica)
};

var biomaFundoMostrando = null;

// Trilha sonora por bioma (loops de 8 compassos escritos em ABC e gerados por
// scripts/abc-para-audio.js em media/musicas/). Andar de GUARDIÃO (múltiplo de
// 10) toca o tema de batalha.
const BIOMA_TEMAS = [
    "mina", "mina-viva", "mina-grave", "caverna", "cristal",
    "mina-viva", "mina-grave", "caverna", "cristal", "mina"
];
const BIOMA_TEMA_GUARDIAO = "batalha";

function BiomaTemaAtual() {
    const a = Math.max(1, Math.floor(Number(BiomaAndarDeHoje()) || 1));
    if (a % 10 === 0) return BIOMA_TEMA_GUARDIAO;
    return BIOMA_TEMAS[BiomaTier(a) % BIOMA_TEMAS.length];
}

// Toca a trilha do andar atual. Chamado quando a CENA carrega (load e avanço de
// andar) — NÃO no spawn dos inimigos. Só reinicia quando o tema MUDA (mesmo
// bioma segue tocando de onde estava).
function BiomaTocaMusica() {
    const el = document.getElementById("audio1");
    if (!el) return;
    const tema = BiomaTemaAtual();
    if (el.dataset.biomaTema === tema) return;
    el.dataset.biomaTema = tema;
    el.setAttribute("src", "media/musicas/" + tema + ".wav");
    el.loop = true;
    if (typeof ChamaSom === "function") ChamaSom("audio1");
}

// Índice da faixa: andares 1-10 -> 0, 11-20 -> 1, 21-30 -> 2, ...
function BiomaTier(andarAtual) {
    const a = Math.max(1, Math.floor(Number(andarAtual) || 1));
    return Math.floor((a - 1) / BIOMA_ANDARES);
}

function BiomaAndarDeHoje() {
    return (typeof andar !== "undefined") ? andar : 1;
}

function BiomaCriaturaAtual() {
    const i = BiomaTier(BiomaAndarDeHoje()) % BIOMA_INIMIGOS.length;
    return BIOMA_INIMIGOS[i].replace(/^inimigos\//, "").replace(/\.png$/, "");
}

function BiomaInimigoAtual() {
    return "imagens/" + BIOMA_INIMIGOS[BiomaTier(BiomaAndarDeHoje()) % BIOMA_INIMIGOS.length];
}

function BiomaFundoAtual() {
    return BIOMA_FUNDOS[BiomaTier(BiomaAndarDeHoje()) % BIOMA_FUNDOS.length];
}

// Devolve o fundo quando ele MUDA de faixa (senão null) — assim o fundo só
// troca a cada 10 andares, não a cada andar vencido.
function BiomaFundoMudou() {
    const alvo = BiomaFundoAtual();
    if (alvo === biomaFundoMostrando) return null;
    biomaFundoMostrando = alvo;
    return alvo;
}

// Aquece as artes (evita "piscar" na primeira troca de faixa).
function BiomaAquece() {
    const morte = [];
    for (const k in BIOMA_MORTE) morte.push(...BIOMA_MORTE[k]);
    [...BIOMA_FUNDOS, ...BIOMA_INIMIGOS, ...morte].forEach(function (caminho) {
        const img = new Image();
        img.src = "imagens/" + caminho;
    });
}

// Aplica o sprite da faixa nos 4 inimigos.
function BiomaAplicaInimigos() {
    const src = BiomaInimigoAtual();
    const criatura = BiomaCriaturaAtual();
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById("inimigo" + i);
        if (!el) continue;
        el.src = src;
        el.dataset.criatura = criatura;
    }
}

// Chamado quando um inimigo surge (ui-combate.js): garante o sprite da faixa.
function BiomaAplicaInimigo(el) {
    if (!el) return;
    el.src = BiomaInimigoAtual();
    el.dataset.criatura = BiomaCriaturaAtual();
}

// Quadros da morte da criatura que está no elemento (null = usa a genérica).
// O primeiro quadro é o próprio sprite do inimigo, pra a queda começar "colada".
function BiomaMorteFrames(el) {
    if (!el) return null;
    const nome = el.dataset ? el.dataset.criatura : null;
    const lista = nome ? BIOMA_MORTE[nome] : null;
    if (!lista || !lista.length) return null;
    return [el.src].concat(lista.map(c => "imagens/" + c));
}

document.addEventListener("DOMContentLoaded", function () {
    BiomaAquece();
    BiomaAplicaInimigos();
    // aplica já o fundo da faixa atual (senão só trocaria no 1º andar vencido)
    if (typeof ProximoFundo === "function") ProximoFundo();
    // e a trilha da cena
    BiomaTocaMusica();
});

window.Tapeira = window.Tapeira || {};
window.Tapeira.Biomas = {
    ANDARES: BIOMA_ANDARES,
    tier: BiomaTier,
    fundo: BiomaFundoAtual,
    inimigo: BiomaInimigoAtual,
    criatura: BiomaCriaturaAtual,
    morteFrames: BiomaMorteFrames,
    tema: BiomaTemaAtual,
    tocaMusica: BiomaTocaMusica,
    TEMAS: BIOMA_TEMAS,
    aplicaInimigo: BiomaAplicaInimigo,
    aplicaInimigos: BiomaAplicaInimigos,
    FUNDOS: BIOMA_FUNDOS,
    INIMIGOS: BIOMA_INIMIGOS,
    MORTE: BIOMA_MORTE
};
