// ===================== APARÊNCIA DA TOUPEIRA (customização) =================
// Primeiro slot: CHAPÉUS. As peças vêm fatiadas das folhas (imagens/
// customização) para imagens/personagens/chapeus/ e são desenhadas por cima da
// base (player.png), DENTRO da caixa do player (.player) — então seguem o idle
// e a investida do ataque sem trabalho extra.
//
// Slots futuros (cachecol, capa, mochila, ferramenta, escudo, cinto) entram do
// mesmo jeito: é só dado (lista + âncora) e a camada no HTML.
//
// Scripts clássicos: funções globais.

// Âncora padrão no canvas do player (1166 x 1536):
//   x = centro do chapéu (% da largura)
//   y = onde a aba encosta na cabeça (base do chapéu, % da altura)
//   largura = largura do chapéu (% da largura)
const APARENCIA_ANCORA_CHAPEU = { x: 46.5, y: 27, largura: 53 };

// id, nome e arquivo (imagens/personagens/chapeus/). "nenhum" = sem chapéu.
const APARENCIA_CHAPEUS = [
    { id: "nenhum", nome: "Sem chapéu" },
    { id: "amarelo", nome: "Capacete amarelo", arquivo: "chapeu-01.png" },
    { id: "escuro", nome: "Capacete escuro", arquivo: "chapeu-02.png" },
    { id: "vermelho", nome: "Capacete vermelho", arquivo: "chapeu-03.png" },
    { id: "verde", nome: "Capacete verde", arquivo: "chapeu-04.png" },
    { id: "viking", nome: "Capacete viking", arquivo: "chapeu-05.png" },
    { id: "mago", nome: "Chapéu de mago", arquivo: "chapeu-06.png" },
    { id: "palha", nome: "Chapéu de palha", arquivo: "chapeu-07.png" },
    { id: "pirata", nome: "Chapéu de pirata", arquivo: "chapeu-08.png" }
];

const APARENCIA_CHAPEUS_DIR = "imagens/personagens/chapeus/";

function AparenciaChapeu(id) {
    return APARENCIA_CHAPEUS.find(c => c.id === id) || APARENCIA_CHAPEUS[0];
}

function AparenciaChapeuIdAtual() {
    return (typeof chapeuEquipado === "string") ? chapeuEquipado : "nenhum";
}

// Aplica o chapéu equipado no sprite do player. Chamado no load e ao trocar.
function AplicaChapeuJogador() {
    const img = document.querySelector(".player__chapeu");
    if (!img) return;
    const chapeu = AparenciaChapeu(AparenciaChapeuIdAtual());
    if (!chapeu.arquivo) {
        img.hidden = true;
        img.removeAttribute("src");
        return;
    }
    const a = Object.assign({}, APARENCIA_ANCORA_CHAPEU, chapeu.ancora || {});
    img.src = APARENCIA_CHAPEUS_DIR + chapeu.arquivo;
    img.hidden = false;
    img.style.left = a.x + "%";
    img.style.top = a.y + "%";
    img.style.width = a.largura + "%";
}

function EquipaChapeu(id) {
    if (!APARENCIA_CHAPEUS.some(c => c.id === id)) return false;
    chapeuEquipado = id;
    AplicaChapeuJogador();
    AutoSaveLocal();
    return true;
}

// ---- Seção "Aparência" (painel da Casa) ----
function CasaSecaoAparencia() {
    const secao = document.createElement("section");
    secao.className = "casa-secao";

    const titulo = document.createElement("h3");
    titulo.className = "casa-secao__titulo";
    titulo.textContent = "Aparência";

    const desc = document.createElement("p");
    desc.className = "casa-secao__desc";
    desc.textContent = "Deixe a toupeira com a sua cara. Por enquanto: chapéus (mais itens vindo).";

    const lista = document.createElement("div");
    lista.className = "aparencia-chapeus";
    const atual = AparenciaChapeuIdAtual();
    for (const chapeu of APARENCIA_CHAPEUS) {
        const ehAtual = atual === chapeu.id;
        const item = document.createElement("button");
        item.type = "button";
        item.className = "aparencia-chapeu" + (ehAtual ? " is-ativo" : "");
        item.setAttribute("aria-pressed", String(ehAtual));
        item.title = chapeu.nome;
        item.setAttribute("aria-label", chapeu.nome + (ehAtual ? " (equipado)" : ""));

        if (chapeu.arquivo) {
            const img = document.createElement("img");
            img.className = "aparencia-chapeu__img";
            img.src = APARENCIA_CHAPEUS_DIR + chapeu.arquivo;
            img.alt = "";
            item.appendChild(img);
        } else {
            const vazio = document.createElement("span");
            vazio.className = "aparencia-chapeu__vazio";
            vazio.textContent = "—";
            item.appendChild(vazio);
        }
        const nome = document.createElement("span");
        nome.className = "aparencia-chapeu__nome";
        nome.textContent = chapeu.nome;
        item.appendChild(nome);

        item.addEventListener("click", () => {
            if (EquipaChapeu(chapeu.id)) RenderCasaPainel();
        });
        lista.appendChild(item);
    }

    secao.append(titulo, desc, lista);
    return secao;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Aparencia = {
    CHAPEUS: APARENCIA_CHAPEUS,
    ANCORA_CHAPEU: APARENCIA_ANCORA_CHAPEU,
    chapeu: AparenciaChapeu,
    chapeuAtual: AparenciaChapeuIdAtual,
    equiparChapeu: EquipaChapeu,
    aplica: AplicaChapeuJogador,
    secaoCasa: CasaSecaoAparencia
};
