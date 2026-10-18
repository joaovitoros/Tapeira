// ===================== QUALIDADE (alta / media / baixa / personalizada) =====
// Configuração POR APARELHO (localStorage): cada um escolhe o que roda melhor.
// Aplica classes no <html> e o CSS corta os efeitos caros.
//
// São duas coisas separadas:
//   - o NÍVEL (alta/media/baixa) — um preset pronto; e "personalizada", em que
//     o jogador liga/desliga cada otimização da lista;
//   - as OTIMIZAÇÕES (OTIMIZACOES) — cada uma é um efeito caro que pode ser
//     desligado, e vira uma classe "config-sem-*" no <html>.
//
// Assim o preset e a escolha manual compartilham o MESMO conjunto de flags: o
// preset só é um atalho que liga um grupo delas.
//
// Medido (CPU 6x mais lento, simulando tablet): tirar os filtros do personagem
// dá ~+8 FPS e some o engasgo. Por isso Média/Baixa já vêm sem eles. Desligar
// a fumaça da Cidade (filter: blur) dá ~+5 FPS com a Cidade aberta, e o
// desfoque dos painéis (Loja/Ramos/Feitos) é o que mais pesa ao ABRIR a loja
// no celular — o fundo do painel já é quase opaco, então tirar o desfoque não
// muda o visual.
//
// Scripts clássicos: funções globais.

const QUALIDADES = [
    { id: "alta", nome: "Alta", desc: "Todos os efeitos — melhor visual (PC/desktop)." },
    { id: "media", nome: "Média", desc: "Sem os filtros do personagem e sem a fumaça da Cidade — mais leve (celular/tablet)." },
    { id: "baixa", nome: "Baixa", desc: "Sem filtros, sem efeitos da Cidade e com menos animações — pra aparelhos fracos." },
    { id: "personalizada", nome: "Personalizada", desc: "Você escolhe cada otimização da lista abaixo." }
];

// Cada tópico é um efeito caro que pode ser desligado. `classe` é a classe que
// liga o corte no CSS (estilos.css) quando a otimização está ATIVA.
const OTIMIZACOES = [
    { id: "filtrosPlayer", nome: "Filtros do personagem", desc: "Brilho/sombra do personagem — é o que mais pesa no combate.", classe: "config-sem-filtros-player" },
    { id: "fumacaCidade", nome: "Fumaça da Cidade", desc: "Fumaça animada dos prédios — a mais cargada (usa desfoque).", classe: "config-sem-fumaca-cidade" },
    { id: "particulasCidade", nome: "Partículas e lampiões da Cidade", desc: "Poeira, faíscas e o brilho dos lampiões.", classe: "config-sem-particulas-cidade" },
    { id: "animacoes", nome: "Animações e transições", desc: "Reduz o movimento da tela (equivale a \"reduzir movimento\").", classe: "config-sem-movimento" },
    { id: "desfoquePaineis", nome: "Desfoque dos painéis", desc: "Desfoque do fundo atrás da Loja, dos Feitos e da pausa — pesa ao abrir.", classe: "config-sem-desfoque-paineis" },
    { id: "desfoqueHud", nome: "Desfoque do HUD", desc: "Desfoque dos cartões fixos da tela (andar, moedas, objetivo, missão).", classe: "config-sem-desfoque-hud" }
];

// O que cada NÍVEL pronto desliga (os ids de OTIMIZACOES).
const PRESETS_QUALIDADE = {
    alta: {},
    media: { filtrosPlayer: true, fumacaCidade: true, desfoquePaineis: true, desfoqueHud: true },
    baixa: { filtrosPlayer: true, fumacaCidade: true, particulasCidade: true, animacoes: true, desfoquePaineis: true, desfoqueHud: true }
};

const CHAVE_QUALIDADE = "tapeira-qualidade";
const CHAVE_QUALIDADE_OPCOES = "tapeira-qualidade-opcoes";

function QualidadeAtual() {
    try {
        const v = localStorage.getItem(CHAVE_QUALIDADE);
        if (QUALIDADES.some(q => q.id === v)) return v;
    } catch { /* sem localStorage */ }
    // padrão: mobile começa em Média (mais leve)
    return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? "media" : "alta";
}

function OpcoesQualidadeSalvas() {
    try {
        const bruto = JSON.parse(localStorage.getItem(CHAVE_QUALIDADE_OPCOES) || "{}");
        return (bruto && typeof bruto === "object") ? bruto : {};
    } catch { return {}; }
}

// Flags que estão valendo agora: o preset do nível, ou a escolha guardada da
// Personalizada. Sempre devolve TODOS os ids (os ausentes = desligados).
function OpcoesQualidade() {
    const q = QualidadeAtual();
    const base = q === "personalizada" ? OpcoesQualidadeSalvas() : (PRESETS_QUALIDADE[q] || {});
    const flags = {};
    for (const t of OTIMIZACOES) flags[t.id] = base[t.id] === true;
    return flags;
}

function AplicaQualidade() {
    const q = QualidadeAtual();
    const flags = OpcoesQualidade();
    const raiz = document.documentElement;
    if (!raiz) return q;
    raiz.classList.remove("q-alta", "q-media", "q-baixa", "q-personalizada");
    raiz.classList.add("q-" + q);
    raiz.dataset.qualidade = q;
    // a classe liga o corte no CSS (ver estilos.css)
    for (const t of OTIMIZACOES) raiz.classList.toggle(t.classe, flags[t.id]);
    AtualizaSeletorQualidade();
    return q;
}

// Redesenha o seletor montado (se houver) pra marcar o nível atual.
function AtualizaSeletorQualidade() {
    const alvo = document.getElementById("configQualidade");
    if (alvo && alvo.childElementCount) alvo.replaceChildren(QualidadeSeletor());
}

function GravaQualidade(id) {
    try { localStorage.setItem(CHAVE_QUALIDADE, id); } catch { /* ok */ }
}

function DefineQualidade(id) {
    if (!QUALIDADES.some(q => q.id === id)) return false;
    // entrar na Personalizada parte do que já está valendo (do preset atual)
    if (id === "personalizada") {
        try { localStorage.setItem(CHAVE_QUALIDADE_OPCOES, JSON.stringify(OpcoesQualidade())); } catch { /* ok */ }
    }
    GravaQualidade(id);
    AplicaQualidade();
    return true;
}

// Liga/desliga UMA otimização. Mexer na lista passa a qualidade pra
// "Personalizada" automaticamente (partindo do que está valendo agora).
function DefineOtimizacao(id, valor) {
    if (!OTIMIZACOES.some(t => t.id === id)) return false;
    const flags = OpcoesQualidade();
    flags[id] = valor === true;
    try { localStorage.setItem(CHAVE_QUALIDADE_OPCOES, JSON.stringify(flags)); } catch { /* ok */ }
    GravaQualidade("personalizada");
    AplicaQualidade();
    return true;
}

// Seletor (4 botões + a lista de otimizações quando em Personalizada) — pra
// encaixar nas Configurações / Aparência.
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

    if (atual === "personalizada") bloco.appendChild(QualidadeLista());
    return bloco;
}

// Lista das otimizações (só na Personalizada): cada linha liga/desliga um
// efeito. Reusa o visual de Ajustes (.config-item) pra ficar igual ao resto.
function QualidadeLista() {
    const lista = document.createElement("div");
    lista.className = "qualidade-opcoes";

    const flags = OpcoesQualidade();
    for (const t of OTIMIZACOES) {
        const item = document.createElement("label");
        item.className = "config-item";
        const texto = document.createElement("span");
        texto.className = "config-item__texto";
        const nome = document.createElement("b");
        nome.textContent = t.nome;
        const desc = document.createElement("span");
        desc.textContent = t.desc;
        texto.append(nome, desc);
        const chk = document.createElement("input");
        chk.type = "checkbox";
        chk.setAttribute("data-otimizacao", t.id);
        chk.setAttribute("aria-label", t.nome);
        chk.checked = flags[t.id];
        chk.addEventListener("change", () => DefineOtimizacao(t.id, chk.checked));
        item.append(texto, chk);
        lista.appendChild(item);
    }
    return lista;
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
    OTIMIZACOES: OTIMIZACOES,
    PRESETS: PRESETS_QUALIDADE,
    atual: QualidadeAtual,
    opcoes: OpcoesQualidade,
    definir: DefineQualidade,
    definirOtimizacao: DefineOtimizacao,
    aplica: AplicaQualidade,
    seletor: QualidadeSeletor
};
