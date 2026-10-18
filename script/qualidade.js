// ===================== QUALIDADE (alta / media / baixa) =====================
// Configuração POR APARELHO (localStorage): cada um escolhe o que roda melhor.
// Aplica uma classe no <html> (q-alta/q-media/q-baixa) e o CSS corta os efeitos
// caros nos níveis menores.
//
// Medido (CPU 6x mais lento, simulando tablet): tirar os filtros do personagem
// dá ~+8 FPS e some o engasgo. Por isso Média/Baixa já vêm sem eles.
//
// Scripts clássicos: funções globais.

const QUALIDADES = [
    { id: "alta", nome: "Alta", desc: "Todos os efeitos — melhor visual (PC/desktop)." },
    { id: "media", nome: "Média", desc: "Sem filtros no personagem — mais leve (celular/tablet)." },
    { id: "baixa", nome: "Baixa", desc: "Sem filtros e com menos animações — pra aparelhos fracos." }
];
const CHAVE_QUALIDADE = "tapeira-qualidade";

function QualidadeAtual() {
    try {
        const v = localStorage.getItem(CHAVE_QUALIDADE);
        if (QUALIDADES.some(q => q.id === v)) return v;
    } catch { /* sem localStorage */ }
    // padrão: mobile começa em Média (mais leve)
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "media" : "alta";
}

function AplicaQualidade() {
    const q = QualidadeAtual();
    const raiz = document.documentElement;
    raiz.classList.remove("q-alta", "q-media", "q-baixa");
    raiz.classList.add("q-" + q);
    raiz.dataset.qualidade = q;
    // Unificado com o antigo "Reduzir movimento": a Qualidade Baixa também
    // corta as animações (equivale ao prefers-reduced-motion, por escolha).
    raiz.classList.toggle("config-sem-movimento", q === "baixa");
    AtualizaSeletorQualidade();
    return q;
}

// Redesenha o seletor montado (se houver) pra marcar o nível atual.
function AtualizaSeletorQualidade() {
    const alvo = document.getElementById("configQualidade");
    if (alvo && alvo.childElementCount) alvo.replaceChildren(QualidadeSeletor());
}

function DefineQualidade(id) {
    if (!QUALIDADES.some(q => q.id === id)) return false;
    try { localStorage.setItem(CHAVE_QUALIDADE, id); } catch { /* ok */ }
    AplicaQualidade();
    return true;
}

// Seletor (3 botões) — pra encaixar nas Configurações / Aparência.
function QualidadeSeletor() {
    const bloco = document.createElement("div");
    bloco.className = "qualidade-seletor";

    const rotulo = document.createElement("div");
    rotulo.className = "qualidade-seletor__rotulo";
    rotulo.textContent = "Qualidade (por aparelho)";

    const linha = document.createElement("div");
    linha.className = "qualidade-seletor__linha";
    const atual = QualidadeAtual();
    for (const q of QUALIDADES) {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "qualidade-btn" + (atual === q.id ? " is-ativo" : "");
        btn.textContent = q.nome;
        btn.title = q.desc;
        btn.setAttribute("aria-pressed", String(atual === q.id));
        btn.addEventListener("click", () => DefineQualidade(q.id));
        linha.appendChild(btn);
    }

    const nota = document.createElement("p");
    nota.className = "casa-secao__desc";
    const info = QUALIDADES.find(q => q.id === atual) || QUALIDADES[0];
    nota.textContent = info.desc;

    bloco.append(rotulo, linha, nota);
    return bloco;
}

// aplica já no load e encaixa o seletor nas Configurações (painel do pause)
AplicaQualidade();
document.addEventListener("DOMContentLoaded", () => {
    AplicaQualidade();
    const alvo = document.getElementById("configQualidade");
    if (alvo && !alvo.childElementCount) alvo.appendChild(QualidadeSeletor());
});

window.Tapeira = window.Tapeira || {};
window.Tapeira.Qualidade = {
    QUALIDADES: QUALIDADES,
    atual: QualidadeAtual,
    definir: DefineQualidade,
    aplica: AplicaQualidade,
    seletor: QualidadeSeletor
};
