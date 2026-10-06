(() => {
    if (new URLSearchParams(window.location.search).get("dev") !== "1") return;

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
        <div class="game-dev-tools__section">Estado de teste</div>
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
            <label for="dev-floor">Andar</label>
            <div class="game-dev-tools__input-row">
                <input id="dev-floor" type="number" min="1" max="1000000" step="1" inputmode="numeric">
                <button type="button" data-set-floor>Ir</button>
            </div>
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
    const gameStateReadout = panel.querySelector("[data-game-state]");
    let playing = false;

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
        if (currency === "emeralds" && !Number.isSafeInteger(value)) {
            reportGameState("Erro: esmeraldas devem ser um número inteiro.", true);
            input.focus();
            return;
        }

        if (currency === "gold") {
            gold = new GoldNumber(value);
        } else {
            esmeraldas = value;
        }
        UI.updateResources();
        UI.showStatus();
        updateStateInputs();
        reportGameState(`${currency === "gold" ? "Gold" : "Esmeraldas"} atualizado.`);
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
        qtdInimigosAndar = andar;
        inimigosDerrotados = 0;
        tempoAvancoInimigos = 120;
        andarBoss = Math.ceil(andar / 10) * 10;
        CarregarStatus();
        UI.render();
        CriarInimigos();
        updateStateInputs();
        reportGameState(`Alterado para o andar ${andar}.`);
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

    panel.querySelectorAll("[data-set-currency]").forEach(button => {
        button.addEventListener("click", () => {
            setCurrency(button.dataset.setCurrency === "gold" ? goldInput : emeraldsInput, button.dataset.setCurrency);
        });
    });
    panel.querySelector("[data-set-floor]").addEventListener("click", setFloor);

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
    updateGeometry();
    updatePauseButton();
    updateStateInputs();
})();
