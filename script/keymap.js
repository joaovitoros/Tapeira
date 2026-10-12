//funçoes de captura de telas

function keyPressed(evt){
    evt = evt || window.event;
    var key = evt.keyCode || evt.which;
    return key; 
}

let attackInterval = null;
let attackPointerId = null;
let jogoPausado = false;
// Inimigo focado pelo último toque/clique (0 = automático: o de número maior).
// Tocar num inimigo específico mantém o ataque nele (inclusive segurando).
let alvoFocado = 0;

// Controles que NÃO devem iniciar ataque quando tocados/clicados (botões,
// painéis, modais, rodapé, cidade, pausa). Tocar fora deles dá um hit.
const SELETOR_SEM_ATAQUE = [
    "button", "a", "input", "select", "textarea", "label",
    "[role='button']", "[role='dialog']",
    "#container-opcoes", "#container-Habilidades", "#logAvisos",
    "#pauseOverlay", "#container-Cidade", "#gameModal",
    "[id$='Modal']", "[id^='container-']"
].join(",");

// Efeito visual de toque/clique (anel que expande e some). Só um efeito de
// DOM; a classe sai sozinha no fim da animação (sem timer órfão).
function MostraEfeitoToque(x, y) {
    const efeito = document.createElement("div");
    efeito.className = "toque-efeito";
    efeito.setAttribute("aria-hidden", "true");
    efeito.style.left = x + "px";
    efeito.style.top = y + "px";
    document.body.appendChild(efeito);
    efeito.addEventListener("animationend", () => efeito.remove(), { once: true });
}
// De onde o painel de Config veio (ele é MOVIDO pro menu de pause e volta aqui)
let pausaConfigOrigem = null;

function AtualizaEstadoPausa(pausado) {
    jogoPausado = pausado;
    const gameRoot = document.getElementById("game-root");
    const button = document.getElementById("btnPause");

    gameRoot?.classList.toggle("game-paused", pausado);
    if (button) {
        const label = pausado ? "Retomar jogo" : "Pausar jogo";
        button.setAttribute("aria-label", label);
        button.setAttribute("title", label);
        button.innerHTML = pausado
            ? '<span class="pause-button-icon" aria-hidden="true">▶</span><span class="pause-button-label">Retomar</span>'
            : '<span class="pause-button-icon" aria-hidden="true">Ⅱ</span><span class="pause-button-label">Pausar</span>';
    }

    if (!pausado) {
        // devolve o painel de Config (movido pro menu de pause) ao lugar de origem
        const config = document.getElementById("container-SalvaCarrega");
        if (config && pausaConfigOrigem) {
            config.style.visibility = "hidden";
            pausaConfigOrigem.appendChild(config);
            pausaConfigOrigem = null;
        }
        document.getElementById("game-root")?.classList.remove("game-paused");
        document.getElementById("pauseOverlay")?.remove();
    }
}

function PausarJogo() {
    if (jogoPausado) return;
    stopPlayerAttack();
    AtualizaEstadoPausa(true);

    const overlay = document.createElement("div");
    overlay.id = "pauseOverlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "pauseTitle");

    const panel = document.createElement("div");
    panel.className = "pause-panel";

    const title = document.createElement("h2");
    title.id = "pauseTitle";
    title.textContent = "Jogo pausado";

    // O conteúdo do Config (salvar/carregar/volumes/tela) vem pra cá: o painel
    // #container-SalvaCarrega é MOVIDO (preserva os listeners registrados) e
    // devolvido ao lugar de origem no resume (AtualizaEstadoPausa(false)).
    const config = document.getElementById("container-SalvaCarrega");
    if (config) {
        pausaConfigOrigem = config.parentElement;
        config.style.visibility = "visible";
    }

    const resume = document.createElement("button");
    resume.type = "button";
    resume.className = "btn-Padrao pause-primary";
    resume.textContent = "Continuar";
    resume.addEventListener("click", () => AtualizaEstadoPausa(false));

    const sair = document.createElement("button");
    sair.type = "button";
    sair.className = "btn-Padrao";
    sair.textContent = "Voltar ao menu";
    sair.addEventListener("click", () => AbrirConfirmacaoSaida());

    const acoes = document.createElement("div");
    acoes.className = "pause-actions";
    acoes.append(resume, sair);

    panel.append(title);
    if (config) panel.appendChild(config);
    panel.appendChild(acoes);
    overlay.appendChild(panel);
    document.getElementById("game-root")?.appendChild(overlay);
    // preventScroll: com o painel agora rolável, focar o botão jogaria a
    // rolagem pro fim e esconderia o título ao abrir.
    resume.focus({ preventScroll: true });
}

function AlternaPausa() {
    if (jogoPausado) {
        AtualizaEstadoPausa(false);
        return;
    }
    PausarJogo();
}

function AbrirConfirmacaoSaida() {
    if (recompensasOfflinePendentes) return;

    if (!jogoPausado) {
        stopPlayerAttack();
        AtualizaEstadoPausa(true);
    }

    const overlay = document.getElementById("pauseOverlay") || document.createElement("div");
    overlay.id = "pauseOverlay";
    overlay.dataset.dialogType = "exit-confirmation";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-labelledby", "pauseTitle");

    const panel = document.createElement("div");
    panel.className = "pause-panel";

    const title = document.createElement("h2");
    title.id = "pauseTitle";
    title.textContent = "Voltar ao menu?";

    const description = document.createElement("p");
    description.className = "pause-description";
    description.textContent = "Seu progresso será salvo antes de sair da caverna.";

    const error = document.createElement("p");
    error.className = "pause-save-error";
    error.setAttribute("role", "status");
    error.hidden = true;

    const actions = document.createElement("div");
    actions.className = "pause-actions";

    const saveAndReturn = document.createElement("button");
    saveAndReturn.type = "button";
    saveAndReturn.className = "btn-Padrao pause-confirm-button";
    saveAndReturn.textContent = "Salvar e voltar ao menu";
    saveAndReturn.addEventListener("click", () => {
        if (!AutoSaveLocal()) {
            error.textContent = "Não foi possível salvar. Você permanece na caverna.";
            error.hidden = false;
            return;
        }
        window.location.href = "index.html";
    });

    const continueGame = document.createElement("button");
    continueGame.type = "button";
    continueGame.className = "btn-Padrao";
    continueGame.textContent = "Continuar jogando";
    continueGame.addEventListener("click", () => AtualizaEstadoPausa(false));

    actions.append(saveAndReturn, continueGame);
    panel.append(title, description, error, actions);
    overlay.replaceChildren(panel);
    if (!overlay.isConnected) document.getElementById("game-root")?.appendChild(overlay);
    saveAndReturn.focus();
}

function startPlayerAttack() {
    if (jogoPausado || attackInterval !== null) return;

    document.querySelector(".player")?.classList.add("is-auto-attacking");
    DanoAutomatico(true, false);
    attackInterval = window.setInterval(() => DanoAutomatico(true, false), 30);
}

function stopPlayerAttack() {
    if (attackInterval !== null) {
        window.clearInterval(attackInterval);
        attackInterval = null;
    }
    attackPointerId = null;
    document.querySelector(".player")?.classList.remove("is-auto-attacking");
}

// Fecha qualquer janela aberta (painéis, modais, baú, pausa).
// Retorna true se fechou alguma coisa.
function FechaJanelasAbertas() {
    let fechou = false;

    // Balão do ícone de info ("i") das telas complexas (ui-info.js): fecha
    // PRIMEIRO, uma camada por vez — senão o ESC levaria o painel inteiro
    // junto com o balão. Se o painel que segurava o balão foi destruído ou
    // re-renderizado, o balão já não está no DOM: limpa o estado órfão sem
    // consumir o ESC (senão o primeiro ESC faria nada de visível).
    if (typeof infoTelaAtiva !== "undefined" && infoTelaAtiva) {
        if (infoTelaAtiva.balao && infoTelaAtiva.balao.isConnected) {
            FechaInfoTela();
            return true;
        }
        infoTelaAtiva = null;
    }

    // Diálogo de pausa / confirmação de saída
    if (document.getElementById("pauseOverlay")) {
        AtualizaEstadoPausa(false);
        fechou = true;
    }

    // Cidade aberta (tela cheia): ESC volta pra caverna (fecha a Cidade) em
    // vez de abrir o menu de pause.
    if (document.getElementById("container-Cidade")?.hidden === false) {
        window.Tapeira?.Cidade?.fechar?.();
        fechou = true;
    }

    // Painéis abertos por visibility (loja, status, salvar/carregar)
    ["Loja", "LojaEsm", "LojaCM", "DivStatus", "container-SalvaCarrega"].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.style.visibility === "visible") {
            el.style.visibility = "hidden";
            fechou = true;
        }
    });

    // Modais removidos do DOM ao fechar
    ["antCollectionModal", "skillUpgradeModal", "feitosModal", "infoModal", "ramosTreeModal", "casaModal", "fazendaModal", "pesquisaModal", "mercadoModal", "fabricaModal", "cristalModal", "trofeusModal"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
            fechou = true;
        }
    });

    // Telas de itens da build (leitura pelo Status ou escolha do baú de build):
    // fecham pelo método próprio pra também soltar a classe do <body>.
    if (document.getElementById("modalItensBuild")) {
        UI.fechaEscolhaItensBuild();
        fechou = true;
    } else if (document.getElementById("modalItensBuildView")) {
        UI.fechaItensBuildTela();
        fechou = true;
    }

    // Celebração de reset (banner temporário)
    const celebracao = document.getElementById("celebracaoReset");
    if (celebracao) {
        UI.FechaCelebracaoReset();
        fechou = true;
    }

    // Modal de missões/conquistas (aberto com display:flex)
    const gameModal = document.getElementById("gameModal");
    if (gameModal && gameModal.style.display === "flex") {
        gameModal.remove();
        fechou = true;
    }

    // (O antigo cartão de abertura de baú saiu — o aviso vai para o log, que
    // é histórico e não deve ser fechado no ESC.)

    // Balão de descrição do rastreador do baú dourado (ícone de info)
    const descBauDourado = document.getElementById("golden-chest-desc");
    if (descBauDourado && !descBauDourado.hidden) {
        UI.toggleGoldenChestInfo();
        fechou = true;
    }

    // Evento aleatório aberto (comercio, meteoro, névoa): ESC encerra ele
    if (typeof eventoAtivo !== "undefined" && (eventoAtivo || eventoPendente)) {
        EncerraEvento();
        fechou = true;
    }

    if (fechou) UI.syncScreenButtons();
    return fechou;
}

// ESC fecha janelas; a confirmação de saída só abre sem nenhuma janela na tela.
// Capture para rodar antes dos handlers internos dos modais e do handler do ESC abaixo.
document.addEventListener("keydown", function(evt) {
    if (evt.code !== "Escape" || evt.repeat) return;
    if (!FechaJanelasAbertas()) return;
    evt.preventDefault();
    evt.stopPropagation();
}, { capture: true });

document.addEventListener("keydown", function(evt) {
    if ((evt.ctrlKey || evt.metaKey) && evt.key.toLowerCase() === "a") {
        evt.preventDefault();
        return;
    }
    if (evt.code === "Escape" && !evt.repeat) {
        // ESC abre o menu de pause (que agora carrega o Config); o "voltar ao
        // menu" vive dentro dele. O capture handler acima já fechou as janelas.
        evt.preventDefault();
        PausarJogo();
        return;
    }
    if (evt.code === "KeyP" && !evt.repeat) {
        evt.preventDefault();
        AlternaPausa();
        return;
    }
    if (evt.code === "Space") {
        evt.preventDefault();
        if (!jogoPausado) startPlayerAttack();
    }
});

document.addEventListener("keyup", function(evt) {
    if (evt.code === "Space") {
        stopPlayerAttack();
    }
});

document.addEventListener("pointerdown", function(evt) {
    const alvo = evt.target instanceof Element ? evt.target : null;
    const player = alvo ? alvo.closest(".player") : null;
    // Eventos de toque nÃ£o possuem um botÃ£o do mouse confiÃ¡vel em todos os WebViews.
    // ataca tocando/clicando em qualquer lugar da cena, EXCETO em controles
    // (botões/painéis/modais): o toque fora deles dá um hit
    // Só o botão esquerdo do mouse.
    if (evt.pointerType === "mouse" && evt.button !== 0) return;

    // TOQUE (Android): ataca tocando em qualquer lugar da cena, EXCETO em
    // controles (botões/painéis/modais). MOUSE (PC): continua como sempre —
    // ataca segurando/clicando no personagem.
    const ehToque = evt.pointerType === "touch";
    if (!ehToque && !player) return;
    if (ehToque && !player && !!alvo && !!alvo.closest(SELETOR_SEM_ATAQUE)) return;

    if (ehToque) {
        const inimigoEl = alvo ? alvo.closest("[id^='inimigo']") : null;
        alvoFocado = inimigoEl ? (parseInt(inimigoEl.id.replace("inimigo", ""), 10) || 0) : 0;
    }

    evt.preventDefault();
    if (attackInterval !== null) return;
    if (evt.pointerId !== undefined) {
        attackPointerId = evt.pointerId;
        // setPointerCapture pode lançar (ponteiro já inativo / WebView antigo) —
        // nunca deixar isso abortar o ataque.
        try {
            player?.setPointerCapture?.(evt.pointerId);
        } catch (erro) {
            // segue sem capturar o ponteiro
        }
    }
    startPlayerAttack();
    // efeito de toque (anel) no ponto tocado — só no toque (modo Android)
    if (ehToque) MostraEfeitoToque(evt.clientX, evt.clientY);
});

window.addEventListener("pointerup", function(evt) {
    if (attackPointerId !== null && evt.pointerId === attackPointerId) stopPlayerAttack();
});
window.addEventListener("pointercancel", function(evt) {
    if (attackPointerId !== null && evt.pointerId === attackPointerId) stopPlayerAttack();
});
window.addEventListener("blur", function() {
    attackPointerId = null;
    stopPlayerAttack();
});

document.onkeypress = function(evt) {
    var comando = keyPressed(evt);
	
	if(comando==32){
		return;
	}else if(comando==108){
		AbreLoja(true);
	}else if(comando==115){
		UI.toggleStatus();
	}else if(comando==99){
		MostraConquista();
	}else if(comando==109){
		MostraMissao();
	}else if(comando==105){
		MostraInfos();
	}
};
////

// Botão de pausa por addEventListener (sem onclick inline no HTML).
document.addEventListener("DOMContentLoaded", () => {
	const pausar = document.getElementById("btnPause");
	if (pausar) pausar.addEventListener("click", () => AlternaPausa());
});
