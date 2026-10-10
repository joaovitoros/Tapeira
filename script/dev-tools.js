(() => {
    if (new URLSearchParams(window.location.search).get("dev") !== "1") return;

    let oneHitKillEnabled = false;
    window.Tapeira = window.Tapeira || {};
    window.Tapeira.DevTools = {
        isOneHitKillEnabled: () => oneHitKillEnabled
    };

    const panel = document.createElement("aside");
    panel.id = "game-dev-tools";
    panel.setAttribute("aria-label", "Ferramentas de desenvolvimento");
    panel.innerHTML = `
        <div class="game-dev-tools__header">
            <span class="game-dev-tools__title">TAPeira Dev Tools</span>
            <button class="game-dev-tools__close" type="button" aria-expanded="true">Ocultar (F2)</button>
        </div>
        <div class="game-dev-tools__section">Animações</div>
        <div class="game-dev-tools__actions">
            <button type="button" data-animation="attack-left">Ataque para a esquerda</button>
            <button type="button" data-animation="attack-right">Ataque para a direita</button>
            <button type="button" data-animation="escape">Testar fuga</button>
        </div>
        <div class="game-dev-tools__section">Cena</div>
        <button class="game-dev-tools__pause" type="button" data-pause>Pausar jogo</button>
        <label class="game-dev-tools__repeat">
            <input type="checkbox" data-repeat>
            Repetir a animação selecionada
        </label>
        <div class="game-dev-tools__section">Eventos especiais</div>
        <div class="game-dev-tools__actions">
            <button type="button" data-forca-evento="comercio">Forçar Comércio</button>
            <button type="button" data-forca-evento="meteoro">Forçar Meteoro</button>
            <button type="button" data-forca-evento="nevoa">Forçar Névoa do CM</button>
            <button type="button" data-forca-evento="veia">Forçar Veia</button>
            <button type="button" data-forca-evento="inseto">Forçar Inseto</button>
            <button type="button" data-forca-evento="fissura">Forçar Fissura</button>
            <button type="button" data-forca-evento="emboscada">Forçar Emboscada</button>
            <button type="button" data-encerra-evento>Encerrar evento</button>
            <button type="button" data-limpa-cooldown-evento>Limpar cooldown</button>
        </div>
        <div class="game-dev-tools__readout" aria-live="polite">
            <span data-evento-status>Evento: -</span>
        </div>
        <div class="game-dev-tools__section">Estado de teste</div>
        <label class="game-dev-tools__repeat">
            <input type="checkbox" data-one-hit-kill>
            Hit kill (matar com um golpe)
        </label>
        <div class="game-dev-tools__setting">
            <label for="dev-gold">Gold atual</label>
            <div class="game-dev-tools__input-row">
                <input id="dev-gold" type="number" min="0" max="9007199254740991" step="any" inputmode="decimal">
                <button type="button" data-set-currency="gold">Definir</button>
            </div>
        </div>
        <div class="game-dev-tools__setting">
            <label for="dev-emeralds">Esmeraldas</label>
            <div class="game-dev-tools__input-row">
                <input id="dev-emeralds" type="number" min="0" max="9007199254740991" step="1" inputmode="numeric">
                <button type="button" data-set-currency="emeralds">Definir</button>
            </div>
        </div>
        <div class="game-dev-tools__setting">
            <label for="dev-cm">Conhecimento Mug</label>
            <div class="game-dev-tools__input-row">
                <input id="dev-cm" type="number" min="0" max="9007199254740991" step="1" inputmode="numeric">
                <button type="button" data-set-currency="cm">Definir</button>
            </div>
        </div>
        <div class="game-dev-tools__setting">
            <label for="dev-floor">Andar</label>
            <div class="game-dev-tools__input-row">
                <input id="dev-floor" type="number" min="1" max="1000000" step="1" inputmode="numeric">
                <button type="button" data-set-floor>Ir</button>
            </div>
        </div>
        <div class="game-dev-tools__section">Progresso</div>
        <div class="game-dev-tools__actions">
            <button type="button" data-recarrega-habilidades>Recarregar habilidades</button>
            <button type="button" data-bau-dourado>Liberar baú dourado</button>
        </div>
        <div class="game-dev-tools__readout" aria-live="polite">
            <span data-playback>Status: pronto</span>
            <span data-frame>Quadro: -</span>
            <span data-game-state aria-live="polite"></span>
            <span data-player>Personagem: -</span>
            <span data-viewport>Tela: -</span>
        </div>
    `;
    document.body.appendChild(panel);

    const closeButton = panel.querySelector(".game-dev-tools__close");
    const repeatInput = panel.querySelector("[data-repeat]");
    const playbackReadout = panel.querySelector("[data-playback]");
    const frameReadout = panel.querySelector("[data-frame]");
    const playerReadout = panel.querySelector("[data-player]");
    const viewportReadout = panel.querySelector("[data-viewport]");
    const pauseButton = panel.querySelector("[data-pause]");
    const animationButtons = [...panel.querySelectorAll("[data-animation]")];
    const goldInput = panel.querySelector("#dev-gold");
    const emeraldsInput = panel.querySelector("#dev-emeralds");
    const floorInput = panel.querySelector("#dev-floor");
    const cmInput = panel.querySelector("#dev-cm");
    const oneHitKillInput = panel.querySelector("[data-one-hit-kill]");
    const eventoStatusReadout = panel.querySelector("[data-evento-status]");
    const gameStateReadout = panel.querySelector("[data-game-state]");
    let playing = false;

    oneHitKillInput.addEventListener("change", () => {
        oneHitKillEnabled = oneHitKillInput.checked;
        reportGameState(oneHitKillEnabled
            ? "Hit kill ativado (somente nesta sessão de debug)."
            : "Hit kill desativado.");
    });

    function reportGameState(message, isError = false) {
        gameStateReadout.textContent = message;
        gameStateReadout.dataset.error = String(isError);
    }

    function updateStateInputs() {
        const goldValue = gold instanceof GoldNumber ? gold.toNumber() : Number(gold);
        goldInput.value = Number.isFinite(goldValue) && goldValue <= Number.MAX_SAFE_INTEGER
            ? String(goldValue)
            : "";
        emeraldsInput.value = String(esmeraldas);
        cmInput.value = String(conhecimentoMug);
        floorInput.value = String(andar);
    }

    function updatePauseButton() {
        const gamePauseButton = document.getElementById("btnPause");
        pauseButton.textContent = gamePauseButton?.getAttribute("aria-label") || "Pausar jogo";
    }

    function setCurrency(input, currency) {
        if (!input.value.trim()) {
            reportGameState("Erro: informe um valor.", true);
            input.focus();
            return;
        }

        const value = input.valueAsNumber;
        if (!Number.isFinite(value) || value < 0 || value > Number.MAX_SAFE_INTEGER) {
            reportGameState("Erro: use um valor entre 0 e 9.007.199.254.740.991.", true);
            input.focus();
            return;
        }
        if ((currency === "emeralds" || currency === "cm") && !Number.isSafeInteger(value)) {
            reportGameState("Erro: esmeraldas e Conhecimento Mug devem ser números inteiros.", true);
            input.focus();
            return;
        }

        if (currency === "gold") {
            gold = new GoldNumber(value);
        } else if (currency === "cm") {
            conhecimentoMug = value;
            if (typeof AtualizaLojaCM === "function") AtualizaLojaCM();
        } else {
            esmeraldas = value;
        }
        UI.updateResources();
        UI.showStatus();
        updateStateInputs();
        const nomeMoeda = currency === "gold" ? "Gold"
            : currency === "cm" ? "Conhecimento Mug" : "Esmeraldas";
        reportGameState(`${nomeMoeda} atualizado.`);
    }

    function setFloor() {
        if (!floorInput.value.trim()) {
            reportGameState("Erro: informe um andar.", true);
            floorInput.focus();
            return;
        }

        const floor = floorInput.valueAsNumber;
        if (!Number.isSafeInteger(floor) || floor < 1 || floor > 1000000) {
            reportGameState("Erro: o andar deve ser um inteiro entre 1 e 1.000.000.", true);
            floorInput.focus();
            return;
        }
        if (fugaEmAndamento || document.querySelector(".escape-sprite-animation")) {
            reportGameState("Aguarde a animação de fuga terminar para trocar de andar.", true);
            return;
        }

        RemoverInimigos();
        RemoveBau();
        andar = floor;
        maxAndar = Math.max(maxAndar, andar);
        andarMaxRun = Math.max(andarMaxRun, andar);
        qtdInimigosAndar = andar;
        inimigosDerrotados = 0;
        tempoAvancoInimigos = TempoFugaMax();
        andarBoss = Math.ceil(andar / 10) * 10;
        CarregarStatus();
        UI.render();
        CriarInimigos();
        updateStateInputs();
        reportGameState(`Alterado para o andar ${andar}.`);
    }

    function updateEventoStatus() {
        if (!eventoStatusReadout || typeof eventoAtivo === "undefined") return;
        let texto;
        if (eventoAtivo) {
            const info = typeof EVENTO_INFO !== "undefined" ? EVENTO_INFO[eventoAtivo] : null;
            const restante = Math.max(0, Math.ceil((eventoFimMs - Date.now()) / 1000));
            texto = `Evento: ${info ? info.titulo : eventoAtivo} · restam ${restante}s`;
        } else if (eventoPendente) {
            texto = "Evento: agendado (iniciando...)";
        } else if (typeof EVENTO_COOLDOWN_MS !== "undefined") {
            const cooldown = Math.max(0, EVENTO_COOLDOWN_MS - (Date.now() - eventoUltimoMs));
            texto = cooldown > 0
                ? `Evento: nenhum · cooldown ${Math.ceil(cooldown / 1000)}s`
                : "Evento: nenhum · pronto pro sorteio";
        } else {
            texto = "Evento: -";
        }
        if (eventoStatusReadout.textContent !== texto) eventoStatusReadout.textContent = texto;
    }

    function forcaEvento(nome) {
        if (typeof IniciaEvento !== "function" || typeof ElegivelEvento !== "function") {
            reportGameState("Erro: sistema de eventos não encontrado.", true);
            return;
        }
        if (jogoPausado) {
            reportGameState("Erro: despause o jogo para forçar um evento.", true);
            return;
        }
        // troca o evento atual (ou limpa o pendente) antes de iniciar outro
        if (eventoAtivo || eventoPendente) EncerraEvento(true);
        // força ignora a elegibilidade (andar mínimo, missão...) — é dev tool
        const elegibilidadeOriginal = ElegivelEvento;
        ElegivelEvento = () => true;
        try {
            IniciaEvento(nome);
        } finally {
            ElegivelEvento = elegibilidadeOriginal;
        }
        updateEventoStatus();
        if (eventoAtivo === nome) {
            const info = typeof EVENTO_INFO !== "undefined" ? EVENTO_INFO[nome] : null;
            reportGameState(`Evento "${info ? info.titulo : nome}" forçado.`);
        } else {
            reportGameState("Erro: o evento não pôde iniciar.", true);
        }
    }

    function encerraEventoAtual() {
        if (typeof EncerraEvento !== "function") {
            reportGameState("Erro: sistema de eventos não encontrado.", true);
            return;
        }
        if (!eventoAtivo && !eventoPendente) {
            reportGameState("Nenhum evento ativo ou pendente.");
            updateEventoStatus();
            return;
        }
        EncerraEvento(true);
        updateEventoStatus();
        reportGameState("Evento encerrado.");
    }

    function updateGeometry() {
        const player = document.querySelector(".player");
        if (!player) {
            playerReadout.textContent = "Personagem: não encontrado";
            viewportReadout.textContent = `Tela: ${window.innerWidth} x ${window.innerHeight}`;
            return;
        }
        const rect = player.getBoundingClientRect();
        playerReadout.textContent =
            `Personagem: ${Math.round(rect.width)} x ${Math.round(rect.height)} em ${Math.round(rect.left)}, ${Math.round(rect.top)}`;
        viewportReadout.textContent = `Tela: ${window.innerWidth} x ${window.innerHeight}`;
    }

    function updateFrame() {
        const frameImage = document.querySelector(
            ".attack-sprite-animation img, .escape-sprite-animation img"
        );
        if (!frameImage) {
            frameReadout.textContent = "Quadro: -";
            return;
        }
        const match = frameImage.src.match(/(?:ataque|fuga)-(\d+)\.png$/);
        const frameNumber = frameImage.dataset.frame || match?.[1];
        const totalFrames = frameImage.src.includes("ataque/") ? 6 : 8;
        frameReadout.textContent = frameNumber
            ? `Quadro: ${frameNumber} / ${totalFrames}`
            : "Quadro: carregando";
    }

    function wait(milliseconds) {
        return new Promise(resolve => window.setTimeout(resolve, milliseconds));
    }

    function targetForDirection(direction) {
        const targetX = direction === "left" ? -1 : window.innerWidth + 1;
        return {
            getBoundingClientRect() {
                return { left: targetX, width: 0 };
            }
        };
    }

    async function playOnce(animation) {
        if (typeof UI === "undefined" || !document.querySelector(".player")) {
            throw new Error("A interface do jogo ainda não está pronta.");
        }
        if (animation === "escape") {
            await UI.playEscapeAnimation();
            return;
        }
        const direction = animation === "attack-left" ? "left" : "right";
        UI.playAttackAnimation(targetForDirection(direction));
        await wait(700);
    }

    async function play(animation) {
        if (playing) return;
        playing = true;
        animationButtons.forEach(button => { button.disabled = true; });
        const animationName = animation === "escape" ? "fuga" : "ataque";
        playbackReadout.textContent = `Status: ${animationName} em execução`;

        try {
            do {
                await playOnce(animation);
                updateFrame();
            } while (repeatInput.checked);
            playbackReadout.textContent = `Status: ${animationName} concluído`;
        } catch (error) {
            playbackReadout.textContent = `Erro: ${error.message}`;
        } finally {
            playing = false;
            animationButtons.forEach(button => { button.disabled = false; });
            updateFrame();
        }
    }

    animationButtons.forEach(button => {
        button.addEventListener("click", () => play(button.dataset.animation));
    });

    pauseButton.addEventListener("click", () => {
        const gamePauseButton = document.getElementById("btnPause");
        if (!gamePauseButton) {
            playbackReadout.textContent = "Erro: controle de pausa não encontrado.";
            return;
        }
        gamePauseButton.click();
        updatePauseButton();
    });

    const inputsMoeda = { gold: goldInput, emeralds: emeraldsInput, cm: cmInput };
    panel.querySelectorAll("[data-set-currency]").forEach(button => {
        button.addEventListener("click", () => {
            const currency = button.dataset.setCurrency;
            setCurrency(inputsMoeda[currency], currency);
        });
    });
    panel.querySelector("[data-set-floor]").addEventListener("click", setFloor);

    panel.querySelectorAll("[data-forca-evento]").forEach(button => {
        button.addEventListener("click", () => forcaEvento(button.dataset.forcaEvento));
    });
    panel.querySelector("[data-encerra-evento]").addEventListener("click", encerraEventoAtual);
    panel.querySelector("[data-limpa-cooldown-evento]").addEventListener("click", () => {
        eventoUltimoMs = 0;
        updateEventoStatus();
        reportGameState("Cooldown de eventos limpo.");
    });
    panel.querySelector("[data-recarrega-habilidades]").addEventListener("click", () => {
        if (typeof CarregaHabilidadesDesbloqueadas !== "function") {
            reportGameState("Erro: função de recarga não encontrada.", true);
            return;
        }
        CarregaHabilidadesDesbloqueadas(false);
        reportGameState("Habilidades desbloqueadas recarregadas.");
    });
    panel.querySelector("[data-bau-dourado]").addEventListener("click", () => {
        if (typeof UI === "undefined" || typeof UI.updateGoldenChestProgress !== "function") {
            reportGameState("Erro: UI do baú não encontrada.", true);
            return;
        }
        bauDouradoPendente = 1;
        progressoBauDourado = TEMPO_BAU_DOURADO_JOGO;
        UI.updateGoldenChestProgress();
        reportGameState("Baú dourado liberado para coleta.");
    });

    closeButton.addEventListener("click", () => {
        panel.hidden = !panel.hidden;
        closeButton.setAttribute("aria-expanded", String(!panel.hidden));
    });

    document.addEventListener("keydown", event => {
        if (event.code !== "F2" || event.repeat) return;
        event.preventDefault();
        panel.hidden = !panel.hidden;
        closeButton.setAttribute("aria-expanded", String(!panel.hidden));
        if (!panel.hidden) updateGeometry();
    });

    window.addEventListener("resize", updateGeometry);
    window.addEventListener("load", () => {
        updateGeometry();
        updatePauseButton();
        updateStateInputs();
    }, { once: true });
    window.setInterval(() => {
        updateFrame();
        updatePauseButton();
    }, 50);
    window.setInterval(updateEventoStatus, 500);
    updateGeometry();
    updatePauseButton();
    updateStateInputs();
    updateEventoStatus();
})();
