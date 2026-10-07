//funçoes de captura de telas

function keyPressed(evt){
    evt = evt || window.event;
    var key = evt.keyCode || evt.which;
    return key; 
}

let attackInterval = null;
let attackPointerId = null;
let jogoPausado = false;

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

    const resume = document.createElement("button");
    resume.type = "button";
    resume.className = "btn-Padrao";
    resume.textContent = "Continuar";
    resume.addEventListener("click", () => AtualizaEstadoPausa(false));

    panel.append(title, resume);
    overlay.appendChild(panel);
    document.getElementById("game-root")?.appendChild(overlay);
    resume.focus();
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

    // Diálogo de pausa / confirmação de saída
    if (document.getElementById("pauseOverlay")) {
        AtualizaEstadoPausa(false);
        fechou = true;
    }

    // Painéis abertos por visibility (loja, status, salvar/carregar)
    ["Loja", "LojaEsm", "DivStatus", "container-SalvaCarrega"].forEach(id => {
        const el = document.getElementById(id);
        if (el && el.style.visibility === "visible") {
            el.style.visibility = "hidden";
            fechou = true;
        }
    });

    // Modais removidos do DOM ao fechar
    ["antCollectionModal", "skillUpgradeModal", "infoModal"].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.remove();
            fechou = true;
        }
    });

    // Modal de missões/conquistas (aberto com display:flex)
    const gameModal = document.getElementById("gameModal");
    if (gameModal && gameModal.style.display === "flex") {
        gameModal.remove();
        fechou = true;
    }

    // Animação de abertura de baú
    const chest = document.getElementById("chestOpening");
    if (chest) {
        clearTimeout(UI.chestOpeningTimeout);
        UI.chestOpeningTimeout = null;
        chest.remove();
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
        evt.preventDefault();
        AbrirConfirmacaoSaida();
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
    const player = evt.target instanceof Element ? evt.target.closest(".player") : null;
    // Eventos de toque nÃ£o possuem um botÃ£o do mouse confiÃ¡vel em todos os WebViews.
    if (!player || (evt.pointerType === "mouse" && evt.button !== 0)) return;

    evt.preventDefault();
    if (attackInterval !== null) return;
    if (evt.pointerId !== undefined) {
        attackPointerId = evt.pointerId;
        player.setPointerCapture?.(evt.pointerId);
    }
    startPlayerAttack();
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
