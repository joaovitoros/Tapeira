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
        ancora: { x: 50, y: 32, largura: 47.5 },
        itens: [
            { id: "amarelo", nome: "Capacete amarelo", arquivo: "chapeu-01.png", flip: true, ancora: { x: 50, y: 32, largura: 47.5 } },
            { id: "escuro", nome: "Capacete escuro", arquivo: "chapeu-02.png", flip: true, ancora: { x: 46.6, y: 29.1, largura: 43 } },
            { id: "vermelho", nome: "Capacete vermelho", arquivo: "chapeu-03.png", flip: true, ancora: { x: 47.2, y: 30.1, largura: 43.5 } },
            { id: "verde", nome: "Capacete verde", arquivo: "chapeu-04.png", flip: true, ancora: { x: 46.6, y: 27.9, largura: 43 } },
            { id: "viking", nome: "Capacete viking", arquivo: "chapeu-05.png", flip: true, ancora: { x: 47.8, y: 30.1, largura: 46 } },
            { id: "mago", nome: "Chapéu de mago", arquivo: "chapeu-06.png", ancora: { x: 44.7, y: 28.2, largura: 43 } },
            { id: "palha", nome: "Chapéu de palha", arquivo: "chapeu-07.png", ancora: { x: 44.1, y: 29.1, largura: 48 } },
            { id: "pirata", nome: "Chapéu de pirata", arquivo: "chapeu-08.png", ancora: { x: 44.7, y: 27.9, largura: 47 } }
        ]
    },
    {
        id: "cachecol",
        nome: "Cachecol",
        dir: "imagens/personagens/cachecois/",
        campo: "cachecolEquipado",
        vazio: "Sem cachecol",
        ancora: { x: 50, y: 74, largura: 40 },
        itens: [
            { id: "roxo", nome: "Cachecol roxo", arquivo: "cachecol-01.png", ancora: { x: 54.7, y: 80.1, largura: 40 }, rot: -12 },
            { id: "xadrez", nome: "Cachecol xadrez", arquivo: "cachecol-02.png", ancora: { x: 54.4, y: 80.4, largura: 40 }, rot: -12 },
            { id: "branco", nome: "Cachecol branco", arquivo: "cachecol-03.png", ancora: { x: 51.2, y: 78.7, largura: 40 }, rot: -8 },
            { id: "preto", nome: "Cachecol preto", arquivo: "cachecol-04.png", ancora: { x: 51.9, y: 76.1, largura: 40 }, rot: -10 },
            { id: "azul", nome: "Cachecol azul", arquivo: "cachecol-05.png", ancora: { x: 48.4, y: 74.2, largura: 37 }, rot: -6 },
            { id: "vermelho", nome: "Cachecol vermelho", arquivo: "cachecol-06.png", ancora: { x: 44.1, y: 73, largura: 40 } }
        ]
    },
    {
        id: "arma",
        nome: "Arma",
        dir: "imagens/personagens/armas/",
        campo: "armaEquipado",
        vazio: "Sem arma",
        ancora: { x: 10, y: 68, largura: 45 },
        itens: [
            { id: "arma-01", nome: "Faca", arquivo: "arma-01.png", flip: true, rot: -16, ancora: { x: 5.6, y: 69.5, largura: 36.5 } },
            { id: "arma-02", nome: "Picareta", arquivo: "arma-02.png", rot: 4, ancora: { x: 9.7, y: 69.7, largura: 40 } },
            { id: "arma-03", nome: "Picareta de gelo", arquivo: "arma-03.png", rot: -1, ancora: { x: 13.8, y: 67.8, largura: 46 } },
            { id: "arma-04", nome: "Picareta", arquivo: "arma-04.png", ancora: { x: 12.8, y: 68.7, largura: 45.5 } },
            { id: "arma-05", nome: "Picareta escura", arquivo: "arma-05.png", ancora: { x: 7.8, y: 67.8, largura: 58.5 } },
            { id: "arma-06", nome: "Picareta dourada", arquivo: "arma-06.png", ancora: { x: 12.5, y: 67.3, largura: 50 } },
            { id: "arma-07", nome: "Picareta vermelha", arquivo: "arma-07.png", rot: 13, ancora: { x: 7.2, y: 67.3, largura: 60.5 } },
            { id: "arma-08", nome: "Lança", arquivo: "arma-08.png", rot: -58, ancora: { x: 41.6, y: 51.2, largura: 66.5 } },
            { id: "arma-09", nome: "Adaga de cristal", arquivo: "arma-09.png", rot: -50, ancora: { x: 37.5, y: 51.7, largura: 63.5 } },
            { id: "arma-10", nome: "Pá", arquivo: "arma-10.png", rot: -57, ancora: { x: 32.8, y: 57.8, largura: 48 } },
            { id: "arma-11", nome: "Espada", arquivo: "arma-11.png", flip: true, rot: -30, ancora: { x: -3.1, y: 61.9, largura: 52.5 } },
            { id: "arma-12", nome: "Machado", arquivo: "arma-12.png", flip: true, rot: -21, ancora: { x: 3.4, y: 64.7, largura: 43.5 } },
            { id: "arma-13", nome: "Maça", arquivo: "arma-13.png", rot: -51, ancora: { x: 37.5, y: 54, largura: 58.5 } },
            { id: "arma-14", nome: "Adaga", arquivo: "arma-14.png", rot: -56, ancora: { x: 42.2, y: 50.9, largura: 73.5 } },
            { id: "arma-15", nome: "Martelo", arquivo: "arma-15.png", rot: -50, ancora: { x: 37.2, y: 52.6, largura: 55.5 } },
            { id: "arma-16", nome: "Varinha mágica", arquivo: "arma-16.png", rot: -60, ancora: { x: 45, y: 57.4, largura: 63.5 } },
            { id: "arma-17", nome: "Espada", arquivo: "arma-17.png", rot: -60, ancora: { x: 32.5, y: 55.9, largura: 44 } }
        ]
    },
    {
        id: "cinto",
        nome: "Cinto",
        dir: "imagens/personagens/cintos/",
        campo: "cintoEquipado",
        vazio: "Sem cinto",
        ancora: { x: 41.9, y: 71.6, largura: 40 },
        itens: [
            { id: "cinto-01", nome: "Bolsa azul", arquivo: "cinto-01.png", oculto: true },
            { id: "cinto-02", nome: "Bolsa creme", arquivo: "cinto-02.png", oculto: true },
            { id: "cinto-03", nome: "Bolsa escura", arquivo: "cinto-03.png", oculto: true },
            { id: "cinto-04", nome: "Cinto de couro", arquivo: "cinto-04.png", ancora: { x: 42.2, y: 80.9, largura: 52 } },
            { id: "cinto-05", nome: "Bolsa verde", arquivo: "cinto-05.png", oculto: true },
            { id: "cinto-06", nome: "Bolsa roxa", arquivo: "cinto-06.png", oculto: true },
            { id: "cinto-07", nome: "Bolsa vermelha", arquivo: "cinto-07.png", oculto: true },
            { id: "cinto-08", nome: "Cinto escuro", arquivo: "cinto-08.png", ancora: { x: 41, y: 83, largura: 58.5 } }
        ]
    },
    {
        id: "escudo",
        nome: "Escudo",
        dir: "imagens/personagens/escudos/",
        campo: "escudoEquipado",
        vazio: "Sem escudo",
        ancora: { x: 71.9, y: 79.2, largura: 40 },
        itens: [
            { id: "escudo-01", nome: "Escudo de ferro", arquivo: "escudo-01.png", ancora: { x: 74.4, y: 80.1, largura: 40 } },
            { id: "escudo-02", nome: "Escudo de folha", arquivo: "escudo-02.png", ancora: { x: 72.8, y: 79.2, largura: 40 } },
            { id: "escudo-03", nome: "Escudo de madeira", arquivo: "escudo-03.png", ancora: { x: 69.7, y: 76.8, largura: 40 } },
            { id: "escudo-04", nome: "Escudo de gema", arquivo: "escudo-04.png", ancora: { x: 71.6, y: 78.2, largura: 40 } },
            { id: "escudo-05", nome: "Escudo redondo", arquivo: "escudo-05.png", ancora: { x: 70.3, y: 76.3, largura: 40 } },
            { id: "escudo-06", nome: "Escudo de fogo", arquivo: "escudo-06.png", ancora: { x: 71.6, y: 82.3, largura: 40 } },
            { id: "escudo-07", nome: "Escudo de estrela", arquivo: "escudo-07.png", ancora: { x: 71.9, y: 81.6, largura: 40 } }
        ]
    }
];

// Compat: lista de chapéus (com "nenhum" na frente) usada no save.
const APARENCIA_CHAPEUS = [{ id: "nenhum", nome: "Sem chapéu" }]
    .concat(APARENCIA_SLOTS.find(s => s.id === "chapeu").itens);

function AparenciaSlot(id) {
    return APARENCIA_SLOTS.find(s => s.id === id) || null;
}

// id equipado no slot (id de item conhecido e VISÍVEL, ou "nenhum").
function AparenciaEquipadoId(slot) {
    const v = window[slot.campo];
    return (typeof v === "string" && slot.itens.some(i => i.id === v && !i.oculto)) ? v : "nenhum";
}

// item equipado no slot (ou null para "nenhum").
function AparenciaItem(slot, id) {
    if (!id || id === "nenhum") return null;
    return slot.itens.find(i => i.id === id) || null;
}

// Compat: id do chapéu equipado (usado no load/validação).
function AparenciaChapeuIdAtual() { return AparenciaEquipadoId(AparenciaSlot("chapeu")); }

// Mapa { slotId: itemId } da aparência equipada AGORA.
function AparenciaAtualMapa() {
    const mapa = {};
    for (const slot of APARENCIA_SLOTS) mapa[slot.id] = AparenciaEquipadoId(slot);
    return mapa;
}

// HTML de um sprite (base + camadas) a partir de um mapa { slotId: itemId } —
// pra usar em innerHTML (ex.: a ficha do duelo PvP mostrar o fantasma com as
// customizações dele). Ids desconhecidos são ignorados.
function AparenciaHtmlArte(mapa) {
    const m = (mapa && typeof mapa === "object") ? mapa : {};
    let camadas = "";
    for (const slot of APARENCIA_SLOTS) {
        const item = AparenciaItem(slot, m[slot.id]);
        if (!item) continue;
        const a = Object.assign({}, slot.ancora, item.ancora || {});
        const tf = "translate(-50%,-100%)"
            + (item.flip ? " scaleX(-1)" : "")
            + (item.rot ? " rotate(" + item.rot + "deg)" : "");
        camadas += `<img class="player__camada${item.tras ? " is-atras" : ""}" src="${slot.dir}${item.arquivo}" alt="" style="left:${a.x}%;top:${a.y}%;width:${a.largura}%;transform:${tf}">`;
    }
    return `<div class="player__arte"><img class="player__base" src="imagens/personagens/player.png" alt="">${camadas}</div>`;
}

// --- imagem CLÁSSICA (a toupeira com capacete e picareta) ---
// Antes de destravar a Cidade (andar 80) o player é SEMPRE a imagem clássica.
// Depois, a Casa deixa escolher voltar pra ela (sem customização).
const APARENCIA_IMG_CLASSICA = "imagens/personagens/player-classico.png";
const APARENCIA_ANDAR_CIDADE = 80;

function AparenciaCidadeLiberada() {
    return (Number(window.maxAndar) || 0) >= APARENCIA_ANDAR_CIDADE;
}

function AparenciaUsaClassica() {
    if (!AparenciaCidadeLiberada()) return true;          // antes da Cidade: sempre clássico
    return window.aparenciaClassica === true;             // opção da Casa
}

// Aplica as camadas equipadas em todos os sprites de aparência dentro de `raiz`.
function AparenciaAplicaEm(raiz) {
    // clássico x customizado (troca a imagem base e esconde as camadas)
    const classico = AparenciaUsaClassica();
    raiz.querySelectorAll(".player__arte").forEach(arte => {
        const imgClassico = arte.querySelector(".player__classico");
        const base = arte.querySelector(".player__base");
        if (imgClassico) imgClassico.hidden = !classico;
        if (base) base.hidden = classico;
    });
    if (classico) {
        raiz.querySelectorAll("[data-aparencia-slot]").forEach(img => { img.hidden = true; });
        return;
    }
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
            img.style.transform = "translate(-50%, -100%)"
                + (item.flip ? " scaleX(-1)" : "")
                + (item.rot ? " rotate(" + item.rot + "deg)" : "");
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

    // opção: usar a imagem CLÁSSICA (sem customização) — só depois da Cidade
    if (AparenciaCidadeLiberada()) {
        const linha = document.createElement("label");
        linha.className = "aparencia-classica";
        const check = document.createElement("input");
        check.type = "checkbox";
        check.checked = window.aparenciaClassica === true;
        check.addEventListener("change", () => {
            window.aparenciaClassica = check.checked;
            AparenciaAplica();
            if (typeof AutoSaveLocal === "function") AutoSaveLocal();
            RenderCasaPainel();
        });
        const txt = document.createElement("span");
        txt.textContent = "Usar a imagem clássica (com capacete e picareta, sem customização)";
        linha.append(check, txt);
        secao.appendChild(linha);
    }

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

    const opcoes = [{ id: "nenhum", nome: slot.vazio }]
        .concat(slot.itens.filter(i => !i.oculto));
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
    usaClassica: AparenciaUsaClassica,
    cidadeLiberada: AparenciaCidadeLiberada,
    secaoCasa: CasaSecaoAparencia
};
