// ============== TESTE VISUAL: fundo + inimigo por faixa de andar ============
// Protótipo SÓ VISUAL, ligado pelo painel de dev (F2, com ?dev=1 na URL).
// A cada 10 andares muda o fundo da caverna e o sprite dos inimigos.
//
// Não muda nenhuma regra de jogo e NÃO entra no save — a preferência fica no
// localStorage do aparelho (como os volumes).
//
// Scripts clássicos: funções globais.

const TESTE_VISUAL_CHAVE = "tapeiraTesteVisual";
const TESTE_VISUAL_ANDARES = 10;   // muda a cada N andares

// Fundos (relativos a imagens/). Os 8 primeiros são os NOVOS; os 2 últimos são
// os que já existiam, pra fechar um ciclo de 100 andares.
const TESTE_VISUAL_FUNDOS = [
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
const TESTE_VISUAL_INIMIGOS = [
    "inimigos/normal.png", "inimigos/vegetal.png", "inimigos/cristal.png",
    "inimigos/gelo.png", "inimigos/metalico.png", "inimigos/toxico.png",
    "inimigos/lava.png", "inimigos/madeira.png", "inimigos/sombrio.png",
    "inimigos/rei-espinhos.png", "inimigos/gigante.png", "inimigos/normal2.png",
    "inimigos/rei-coroa.png", "inimigos/poeira.png"
];

const INIMIGO_PADRAO = "imagens/personagens/inimigo.png";

var testeVisualFundoMostrando = null;

function TesteVisualAtivo() {
    try { return localStorage.getItem(TESTE_VISUAL_CHAVE) === "1"; } catch { return false; }
}

// Índice da faixa: andares 1-10 -> 0, 11-20 -> 1, 21-30 -> 2, ...
function TesteVisualTier(andarAtual) {
    const a = Math.max(1, Math.floor(Number(andarAtual) || 1));
    return Math.floor((a - 1) / TESTE_VISUAL_ANDARES);
}

function TesteVisualAndarDeHoje() {
    return (typeof andar !== "undefined") ? andar : 1;
}

function TesteVisualFundoAtual() {
    const i = TesteVisualTier(TesteVisualAndarDeHoje()) % TESTE_VISUAL_FUNDOS.length;
    return TESTE_VISUAL_FUNDOS[i];
}

function TesteVisualInimigoAtual() {
    const i = TesteVisualTier(TesteVisualAndarDeHoje()) % TESTE_VISUAL_INIMIGOS.length;
    return "imagens/" + TESTE_VISUAL_INIMIGOS[i];
}

// Devolve o fundo quando ele MUDA de faixa (senão null) — assim o fundo só
// troca a cada 10 andares, não a cada andar vencido.
function TesteVisualFundoMudou() {
    const alvo = TesteVisualFundoAtual();
    if (alvo === testeVisualFundoMostrando) return null;
    testeVisualFundoMostrando = alvo;
    return alvo;
}

// Aquece as artes (evita "piscar" na primeira troca de faixa).
function TesteVisualAquece() {
    [...TESTE_VISUAL_FUNDOS, ...TESTE_VISUAL_INIMIGOS].forEach(function (caminho) {
        const img = new Image();
        img.src = "imagens/" + caminho;
    });
}

// Aplica o sprite da faixa nos 4 inimigos (ou volta o padrão, quando desligado).
function TesteVisualAplicaInimigos() {
    const src = TesteVisualAtivo() ? TesteVisualInimigoAtual() : INIMIGO_PADRAO;
    for (let i = 1; i <= 4; i++) {
        const el = document.getElementById("inimigo" + i);
        if (el) el.src = src;
    }
}

// Chamado quando um inimigo surge (ui-combate.js): troca o sprite se o teste
// estiver ligado. Sem teste, não faz nada (o HTML já traz o sprite padrão).
function TesteVisualAplicaInimigo(el) {
    if (!el || !TesteVisualAtivo()) return;
    el.src = TesteVisualInimigoAtual();
}

// Liga/desliga e aplica na hora (fundo + inimigos).
function TesteVisualDefine(ativo) {
    const ligado = ativo === true;
    try { localStorage.setItem(TESTE_VISUAL_CHAVE, ligado ? "1" : "0"); } catch { /* ok */ }
    testeVisualFundoMostrando = null;
    if (ligado) TesteVisualAquece();
    TesteVisualAplicaInimigos();
    if (typeof ProximoFundo === "function") ProximoFundo();
    return ligado;
}

document.addEventListener("DOMContentLoaded", function () {
    if (!TesteVisualAtivo()) return;
    TesteVisualAquece();
    TesteVisualAplicaInimigos();
    // aplica já o fundo da faixa atual (senão só trocaria no 1º andar vencido)
    if (typeof ProximoFundo === "function") ProximoFundo();
});

window.Tapeira = window.Tapeira || {};
window.Tapeira.TesteVisual = {
    ATIVO: TesteVisualAtivo,
    define: TesteVisualDefine,
    tier: TesteVisualTier,
    fundo: TesteVisualFundoAtual,
    inimigo: TesteVisualInimigoAtual,
    aplicaInimigo: TesteVisualAplicaInimigo,
    FUNDOS: TESTE_VISUAL_FUNDOS,
    INIMIGOS: TESTE_VISUAL_INIMIGOS,
    PADRAO: INIMIGO_PADRAO
};
