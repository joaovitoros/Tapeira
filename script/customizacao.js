// ===================== APARÊNCIA DA TOUPEIRA (customização) =================
// Camadas por cima da base (player.png), desenhadas DENTRO da caixa
// `.player__arte` — então seguem o idle e a investida do ataque sem trabalho
// extra, e valem tanto no jogo quanto no preview da Casa.
//
// Cada SLOT tem: id, nome, pasta das imagens de runtime, âncora (x/y/largura em
// % do canvas 1166x1536) e a lista de itens. Um item pode ter `flip` (espelha na
// horizontal) e `ancora` (sobrepõe a âncora do slot).
// Âncora: x = centro da peça; y = BASE da peça (onde ela encosta); largura em %.
//
// Para adicionar um slot novo: é só dado (mais um objeto na lista) + a camada no
// HTML do player (e o campo no save). Nada de lógica nova.
//
// Scripts clássicos: funções globais.

const APARENCIA_SLOTS = [
    {
        id: "chapeu",
        nome: "Chapéu",
        dir: "imagens/personagens/chapeus/",
        campo: "chapeuEquipado",
        vazio: "Sem chapéu",
        ancora: { x: 50, y: 30, largura: 53 },
        itens: [
            { id: "amarelo", nome: "Capacete amarelo", arquivo: "chapeu-01.png", flip: true },
            { id: "escuro", nome: "Capacete escuro", arquivo: "chapeu-02.png", flip: true },
            { id: "vermelho", nome: "Capacete vermelho", arquivo: "chapeu-03.png", flip: true },
            { id: "verde", nome: "Capacete verde", arquivo: "chapeu-04.png", flip: true },
            { id: "viking", nome: "Capacete viking", arquivo: "chapeu-05.png", flip: true },
            { id: "mago", nome: "Chapéu de mago", arquivo: "chapeu-06.png", flip: true },
            { id: "palha", nome: "Chapéu de palha", arquivo: "chapeu-07.png" },
            { id: "pirata", nome: "Chapéu de pirata", arquivo: "chapeu-08.png", flip: true }
        ]
    },
    {
        id: "cachecol",
        nome: "Cachecol",
        dir: "imagens/personagens/cachecois/",
        campo: "cachecolEquipado",
        vazio: "Sem cachecol",
        ancora: { x: 50, y: 68, largura: 33 },
        itens: [
            { id: "roxo", nome: "Cachecol roxo", arquivo: "cachecol-01.png" },
            { id: "xadrez", nome: "Cachecol xadrez", arquivo: "cachecol-02.png" },
            { id: "branco", nome: "Cachecol branco", arquivo: "cachecol-03.png" },
            { id: "preto", nome: "Cachecol preto", arquivo: "cachecol-04.png" },
            { id: "azul", nome: "Cachecol azul", arquivo: "cachecol-05.png" },
            { id: "vermelho", nome: "Cachecol vermelho", arquivo: "cachecol-06.png" }
        ]
    }
];

// Compat: lista de chapéus (com "nenhum" na frente) usada no save.
const APARENCIA_CHAPEUS = [{ id: "nenhum", nome: "Sem chapéu" }]
    .concat(APARENCIA_SLOTS.find(s => s.id === "chapeu").itens);

function AparenciaSlot(id) {
    return APARENCIA_SLOTS.find(s => s.id === id) || null;
}

// id equipado no slot (id de item conhecido, ou "nenhum").
function AparenciaEquipadoId(slot) {
    const v = window[slot.campo];
    return (typeof v === "string" && slot.itens.some(i => i.id === v)) ? v : "nenhum";
}

// item equipado no slot (ou null para "nenhum").
function AparenciaItem(slot, id) {
    if (!id || id === "nenhum") return null;
    return slot.itens.find(i => i.id === id) || null;
}

// Compat: id do chapéu equipado (usado no load/validação).
function AparenciaChapeuIdAtual() { return AparenciaEquipadoId(AparenciaSlot("chapeu")); }

// Aplica as camadas equipadas em todos os sprites de aparência dentro de `raiz`.
function AparenciaAplicaEm(raiz) {
    for (const slot of APARENCIA_SLOTS) {
        const item = AparenciaItem(slot, AparenciaEquipadoId(slot));
        const camadas = raiz.querySelectorAll('[data-aparencia-slot="' + slot.id + '"]');
        camadas.forEach(img => {
            if (!item) {
                img.hidden = true;
                img.removeAttribute("src");
                img.classList.remove("is-espelhado");
                return;
            }
            const a = Object.assign({}, slot.ancora, item.ancora || {});
            img.src = slot.dir + item.arquivo;
            img.hidden = false;
            img.style.left = a.x + "%";
            img.style.top = a.y + "%";
            img.style.width = a.largura + "%";
            img.classList.toggle("is-espelhado", !!item.flip);
            img.classList.toggle("is-atras", !!item.tras);
        });
    }
}

// Aplica em tudo (o sprite do jogo e o preview da Casa).
function AparenciaAplica() { AparenciaAplicaEm(document); }

// Compat: o load (persistencia-carregar) chama AplicaChapeuJogador.
function AplicaChapeuJogador() { AparenciaAplica(); }

function AparenciaEquipa(slotId, itemId) {
    const slot = AparenciaSlot(slotId);
    if (!slot) return false;
    if (itemId !== "nenhum" && !slot.itens.some(i => i.id === itemId)) return false;
    window[slot.campo] = itemId;
    AparenciaAplica();
    if (typeof AutoSaveLocal === "function") AutoSaveLocal();
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
    desc.textContent = "Deixe a toupeira com a sua cara. Toque num item pra vestir.";

    // Preview ao vivo: a mesma montagem do player (base + camadas), só que parada.
    const preview = document.createElement("div");
    preview.className = "aparencia-preview";
    const arte = document.createElement("div");
    arte.className = "player__arte";
    const baseImg = document.createElement("img");
    baseImg.className = "player__base";
    baseImg.src = "imagens/personagens/player.png";
    baseImg.alt = "";
    arte.appendChild(baseImg);
    for (const slot of APARENCIA_SLOTS) {
        const img = document.createElement("img");
        img.className = "player__camada";
        img.setAttribute("data-aparencia-slot", slot.id);
        img.alt = "";
        img.hidden = true;
        arte.appendChild(img);
    }
    preview.appendChild(arte);
    secao.append(titulo, desc, preview);

    for (const slot of APARENCIA_SLOTS) secao.appendChild(CasaBlocoAparencia(slot));

    // reflete o estado atual no preview (a seção pode ainda não estar no DOM)
    AparenciaAplicaEm(secao);
    return secao;
}

function CasaBlocoAparencia(slot) {
    const bloco = document.createElement("div");
    bloco.className = "aparencia-bloco";

    const rotulo = document.createElement("h4");
    rotulo.className = "aparencia-bloco__titulo";
    rotulo.textContent = slot.nome;

    const lista = document.createElement("div");
    lista.className = "aparencia-lista";
    const atual = AparenciaEquipadoId(slot);

    const opcoes = [{ id: "nenhum", nome: slot.vazio }].concat(slot.itens);
    for (const item of opcoes) {
        const ehAtual = atual === item.id;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "aparencia-item" + (ehAtual ? " is-ativo" : "");
        btn.setAttribute("aria-pressed", String(ehAtual));
        btn.title = item.nome;
        btn.setAttribute("aria-label", item.nome + (ehAtual ? " (equipado)" : ""));
        if (item.arquivo) {
            const img = document.createElement("img");
            img.className = "aparencia-item__img";
            img.src = slot.dir + item.arquivo;
            img.alt = "";
            if (item.flip) img.classList.add("is-espelhado");
            btn.appendChild(img);
        } else {
            const vazio = document.createElement("span");
            vazio.className = "aparencia-item__vazio";
            vazio.textContent = "—";
            btn.appendChild(vazio);
        }
        const nome = document.createElement("span");
        nome.className = "aparencia-item__nome";
        nome.textContent = item.nome;
        btn.appendChild(nome);
        btn.addEventListener("click", () => {
            if (AparenciaEquipa(slot.id, item.id)) RenderCasaPainel();
        });
        lista.appendChild(btn);
    }

    bloco.append(rotulo, lista);
    return bloco;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Aparencia = {
    SLOTS: APARENCIA_SLOTS,
    slot: AparenciaSlot,
    equipadoId: AparenciaEquipadoId,
    item: AparenciaItem,
    equipar: AparenciaEquipa,
    aplica: AparenciaAplica,
    secaoCasa: CasaSecaoAparencia
};
