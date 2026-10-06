// ui.js
// Responsável apenas pela renderização da interface (DOM)

const UI = {

    // =========================
    // HUD PRINCIPAL
    // =========================

    render() {
        document.getElementById("titulo").innerHTML = "Caverna (Andar: " + andar + ")";
        document.getElementById("contDerrotados").innerHTML = totalDerrotados;
        document.getElementById("contAndar").innerHTML = andar;
        document.getElementById("contGold").innerHTML = FormatGold(gold);
        document.getElementById("contEmeraldas").innerHTML = esmeraldas;
        document.getElementById("contTempo").innerHTML = tempoAvancoInimigos;
        this.updateObjective();
        this.updateMission();
    },

    updateMission() {
        const metaContainer = document.getElementById("container-Metas");
        const container = document.getElementById("container-Missao");
        const description = document.getElementById("missaoDescricao");
        const progress = document.getElementById("missaoProgresso");
        const fill = document.getElementById("missaoProgressoPreenchido");
        const count = document.getElementById("missaoContagem");

        if (!metaContainer || !container || !description || !progress || !fill || !count) return;

        if (andar < 10 || !missaoAtual || !missao[missaoAtual]) {
            container.hidden = true;
            metaContainer.classList.remove("has-mission");
            return;
        }

        let atual = 0;
        let maximo = 0;
        let textoProgresso;

        if (missaoAtual === 1) {
            atual = missaoColetaAtual;
            maximo = missaoColeta;
            textoProgresso = `${FormatGold(atual)} / ${FormatGold(maximo)} Gold`;
        } else if (missaoAtual === 2) {
            atual = missaoGolpeAtual;
            maximo = missaoGolpe;
            textoProgresso = `${Math.floor(atual)} / ${Math.floor(maximo)} golpes`;
        } else if (missaoAtual === 3) {
            atual = missaoCacaMugsAtual;
            maximo = missaoCacaMugs;
            textoProgresso = `${Math.floor(atual)} / ${Math.floor(maximo)} Mugs`;
        } else if (missaoAtual === 4) {
            atual = missaoTempoAtual;
            maximo = missaoTempo;
            textoProgresso = `${Math.floor(atual)} / ${Math.floor(maximo)} seg`;
        } else {
            container.hidden = true;
            metaContainer.classList.remove("has-mission");
            return;
        }

        const total = Math.max(1, Number(maximo) || 1);
        const valorAtual = Math.max(0, Number(atual) || 0);
        const porcentagem = Math.min(100, valorAtual * 100 / total);
        description.textContent = missao[missaoAtual];
        count.textContent = textoProgresso;
        progress.setAttribute("aria-valuemax", String(total));
        progress.setAttribute("aria-valuenow", String(Math.min(valorAtual, total)));
        fill.style.width = `${porcentagem}%`;
        container.hidden = false;
        metaContainer.classList.add("has-mission");
    },

    showMilestone(title, message) {
        this.milestoneQueue.push({ title, message });
        if (!this.milestoneTimeout) this.displayNextMilestone();
    },

    displayNextMilestone() {
        const next = this.milestoneQueue.shift();
        if (!next) {
            this.milestoneTimeout = null;
            return;
        }

        let notice = document.getElementById("gameMilestone");
        if (!notice) {
            notice = document.createElement("div");
            notice.id = "gameMilestone";
            notice.setAttribute("role", "status");
            notice.setAttribute("aria-live", "polite");
            notice.innerHTML = `
                <div id="gameMilestoneTitle"></div>
                <div id="gameMilestoneMessage"></div>
            `;
            document.body.appendChild(notice);
        }

        document.getElementById("gameMilestoneTitle").textContent = next.title;
        document.getElementById("gameMilestoneMessage").textContent = next.message;
        notice.classList.add("game-milestone--visible");

        this.milestoneTimeout = setTimeout(() => {
            notice.classList.remove("game-milestone--visible");
            this.milestoneTimeout = setTimeout(() => {
                this.milestoneTimeout = null;
                this.displayNextMilestone();
            }, 200);
        }, 2600);
    },

    syncScreenButtons() {
        const states = [
            ["btnStatus", document.getElementById("DivStatus")?.style.visibility === "visible"],
            ["btn-Loja", ["Loja", "LojaEsm"].some(id =>
                document.getElementById(id)?.style.visibility === "visible"
            )],
            ["btn-Config", document.getElementById("container-SalvaCarrega")?.style.visibility === "visible"]
        ];

        states.forEach(([id, isOpen]) => {
            const button = document.getElementById(id);
            if (!button) return;
            button.classList.toggle("is-active", isOpen);
            button.setAttribute("aria-expanded", String(isOpen));
        });
    },

    closeOtherPanels(activePanel) {
        const mobileLayout = window.matchMedia(
            "(max-width: 700px), (max-width: 900px) and (max-height: 520px) and (orientation: landscape), (min-width: 1000px) and (max-width: 1500px) and (min-height: 780px) and (max-height: 950px) and (orientation: landscape)"
        ).matches;
        if (!mobileLayout) return;

        if (activePanel !== "status") {
            document.getElementById("DivStatus").style.visibility = "hidden";
        }
        if (activePanel !== "shop") {
            document.getElementById("Loja").style.visibility = "hidden";
            document.getElementById("LojaEsm").style.visibility = "hidden";
        }
        if (activePanel !== "config") {
            document.getElementById("container-SalvaCarrega").style.visibility = "hidden";
        }
    },

    updateHUD() {
        this.render();
    },

    objectiveCompleteTimer: null,
    enemyHealthTimeout: null,
    enemyHealthTarget: null,
    milestoneQueue: [],
    milestoneTimeout: null,

    updateObjective() {
        if (this.objectiveCompleteTimer) return;

        const progress = document.getElementById("objetivoProgresso");
        const fill = document.getElementById("objetivoProgressoPreenchido");
        const count = document.getElementById("objetivoContagem");
        const container = document.getElementById("container-Objetivo");

        if (!progress || !fill || !count || !container) return;

        const total = Math.max(1, qtdInimigosAndar);
        const derrotados = Math.max(0, Math.min(inimigosDerrotados, total));
        const porcentagem = derrotados * 100 / total;

        document.getElementById("objetivoDescricao").textContent = "Limpe a caverna";
        count.textContent = `${derrotados} / ${total} inimigos derrotados`;
        progress.setAttribute("aria-valuemax", String(total));
        progress.setAttribute("aria-valuenow", String(derrotados));
        fill.style.width = `${porcentagem}%`;
        container.classList.remove("objetivo-concluido");
    },

    showObjectiveComplete() {
        const container = document.getElementById("container-Objetivo");
        const description = document.getElementById("objetivoDescricao");
        const progress = document.getElementById("objetivoProgresso");
        const fill = document.getElementById("objetivoProgressoPreenchido");
        const count = document.getElementById("objetivoContagem");

        if (!container || !description || !progress || !fill || !count) return;

        if (this.objectiveCompleteTimer) {
            clearTimeout(this.objectiveCompleteTimer);
        }

        description.textContent = "Andar concluído!";
        count.textContent = "Avançando para o próximo andar";
        progress.setAttribute("aria-valuemax", String(Math.max(1, qtdInimigosAndar)));
        progress.setAttribute("aria-valuenow", String(Math.max(1, qtdInimigosAndar)));
        fill.style.width = "100%";
        container.classList.add("objetivo-concluido");

        this.objectiveCompleteTimer = setTimeout(() => {
            this.objectiveCompleteTimer = null;
            this.updateObjective();
        }, 1000);
    },

    updateResources() {
        document.getElementById("contGold").innerHTML = FormatGold(gold);
        document.getElementById("contEmeraldas").innerHTML = esmeraldas;
        document.getElementById("contTempo").innerHTML = tempoAvancoInimigos;
        this.updateMission();
    },

    // =========================
    // MENSAGENS
    // =========================

    showInfo(mensagem) {
        document.getElementById("Infos").innerHTML = mensagem;
    },

    showDamageNumber(target, damage, critical) {
        if (!target) return;

        const rect = target.getBoundingClientRect();
        const marker = document.createElement("div");
        marker.className = critical
            ? "floating-game-text damage-number damage-number--critical"
            : "floating-game-text damage-number";
        const stack = document.querySelectorAll(".damage-number").length;
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = `${critical ? "CRIT! " : ""}-${FormatGold(damage)}`;
        marker.style.left = `${rect.left + rect.width / 2}px`;
        marker.style.top = `${rect.top + rect.height * 0.18 - stack * 22}px`;
        document.body.appendChild(marker);
        setTimeout(() => marker.remove(), 950);
    },

    showCurrencyReward(type, amount) {
        const target = document.querySelector(".player");
        if (!target || amount <= 0) return;

        const rect = target.getBoundingClientRect();
        const marker = document.createElement("div");
        const stack = document.querySelectorAll(".reward-number").length;
        marker.className = `floating-game-text reward-number reward-number--${type}`;
        marker.setAttribute("aria-hidden", "true");
        if (type === "emerald") {
            const icon = document.createElement("img");
            icon.className = "reward-number__icon";
            icon.src = "imagens/esmeralda-recompensa.svg";
            icon.alt = "";
            marker.appendChild(icon);
        }
        const label = document.createElement("span");
        label.textContent = type === "gold"
            ? `+${FormatGold(amount)} Gold`
            : `+${amount} ${amount === 1 ? "Esmeralda" : "Esmeraldas"}`;
        marker.appendChild(label);
        marker.style.left = `${rect.left + rect.width / 2}px`;
        marker.style.top = `${rect.top + rect.height * 0.2 - stack * 24}px`;
        document.body.appendChild(marker);
        setTimeout(() => marker.remove(), 1100);
    },

    showEnemyHealth(target, health, maxHealth) {
        if (!target || health <= 0) {
            this.hideEnemyHealth();
            return;
        }

        let indicator = document.getElementById("enemyHealthIndicator");
        if (!indicator) {
            indicator = document.createElement("div");
            indicator.id = "enemyHealthIndicator";
            indicator.className = "enemy-health-indicator";
            indicator.setAttribute("role", "group");
            indicator.innerHTML = `
                <div class="enemy-health-label">
                    <span id="enemyHealthName"></span>
                    <span id="enemyHealthValue"></span>
                </div>
                <div id="enemyHealthTrack" role="progressbar" aria-label="Vida do inimigo"
                    aria-valuemin="0" aria-valuemax="100" aria-valuenow="100">
                    <div id="enemyHealthFill"></div>
                </div>
            `;
            document.body.appendChild(indicator);
        }

        if (this.enemyHealthTarget && this.enemyHealthTarget !== target) {
            this.enemyHealthTarget.classList.remove("enemy-targeted");
        }

        this.enemyHealthTarget = target;
        target.classList.add("enemy-targeted");

        const rect = target.getBoundingClientRect();
        indicator.style.left = `${rect.left + rect.width / 2}px`;
        indicator.style.top = `${Math.max(8, rect.top - 48)}px`;

        const percentage = Math.max(0, Math.min(100, health * 100 / maxHealth));
        document.getElementById("enemyHealthName").textContent =
            `Inimigo ${target.id.replace("inimigo", "")}`;
        document.getElementById("enemyHealthValue").textContent =
            `${FormatGold(health)} / ${FormatGold(maxHealth)}`;
        document.getElementById("enemyHealthTrack").setAttribute("aria-valuenow", String(percentage));
        document.getElementById("enemyHealthFill").style.width = `${percentage}%`;
        indicator.classList.add("enemy-health-indicator--visible");

        if (this.enemyHealthTimeout) {
            clearTimeout(this.enemyHealthTimeout);
        }

        this.enemyHealthTimeout = setTimeout(() => {
            this.hideEnemyHealth();
        }, 1200);
    },

    hideEnemyHealth() {
        if (this.enemyHealthTimeout) {
            clearTimeout(this.enemyHealthTimeout);
            this.enemyHealthTimeout = null;
        }

        if (this.enemyHealthTarget) {
            this.enemyHealthTarget.classList.remove("enemy-targeted");
            this.enemyHealthTarget = null;
        }

        const indicator = document.getElementById("enemyHealthIndicator");
        if (indicator) {
            indicator.classList.remove("enemy-health-indicator--visible");
        }
    },

    showStatus() {

        const stats = [
            ["Dano", danoJogador.toFixed(2)],
            ["Multiplicador Gold", mulGold.toFixed(2)],
            ["Gold por inimigo", FormatGold(andar * mulGold)],
            ["Gold total", FormatGold(totalGold)],
            ["Bonus avanço", (((andar * mulGold) + (vidaAndar * mulGold) * mulGoldAvanco)).toFixed(2)],
            ["Chance avanço", (avanco * 100).toFixed(2) + "%"],
            ["Qtd avanço", qtdAvanco],
            ["Dano crítico", danoCritJogador.toFixed(2)],
            ["Chance crítica", (chanceCrit * 100).toFixed(2) + "%"],
            ["DPS companheiros", danoComp.toFixed(2)],
            ["GoldPS companions", goldCompanheiro.toFixed(2)],
            ["Tempo bônus", tempoEsperaCompanheiro + " seg"],
            ["Vida Mug", (subVidaInimigo * 100).toFixed(2) + "%"],
            ["Chance baú", (chanceBau * 100).toFixed(2) + "%"],
            ["Chance esmeralda", (chanceEsmeraldaBau * 100).toFixed(2) + "%"]
        ];

        let html = "";

        stats.forEach(stat => {

            html += `
            <tr>
                <td class="statusNome">${stat[0]}</td>
                <td class="statusValor">${stat[1]}</td>
            </tr>
        `;

        });

        document.getElementById("StatusBody").innerHTML = html;
    },

    toggleStatus() {

        const div = document.getElementById("DivStatus");

        div.style.visibility =
            (div.style.visibility === "hidden")
                ? "visible"
                : "hidden";

        if (div.style.visibility === "visible" && !window.matchMedia("(min-width: 1600px)").matches) {
            document.getElementById("container-SalvaCarrega").style.visibility = "hidden";
        }
        if (div.style.visibility === "visible") {
            this.closeOtherPanels("status");
        }
        this.syncScreenButtons();
    },

    // =========================
    // MODAL INFO / AJUDA
    // =========================

    toggleInfoModal() {

        let modal = document.getElementById("infoModal");

        // toggle
        if (modal) {
            modal.remove();
            return;
        }

        modal = document.createElement("div");

        modal.id = "infoModal";

        modal.innerHTML = `
        <div class="infoModalBox">

            <div class="infoModalTitulo">
                COMO JOGAR
            </div>

            <div class="infoModalConteudo">

                <div class="infoLinha">
                    Clique nos cogumelos para destruí-los e conseguir gold
                </div>

                <div class="infoLinha">
                    Aperte L para abrir a Loja
                </div>

                <div class="infoLinha">
                    Aperte S para abrir seu Status
                </div>

                <div class="infoLinha">
                    Aperte C para abrir as Conquistas e bônus permanentes
                </div>

                <div class="infoLinha">
                    Aperte M para ver as missões atuais
                </div>

                <div class="infoLinha">
                    Segure Espaço ou clique no personagem para atacar inimigos próximos
                </div>

                <div class="infoLinha">
                    Aperte I para rever os controles
                </div>

                <div class="infoLinha">
                    Aperte Esc para salvar e voltar ao menu
                </div>

                <div class="infoLinha destaqueInfo">
                    Dica: ao chegar no andar ${andarVolta},
                    clique em "Voltar Andar" para ganhar esmeraldas.
                </div>

            </div>

            <button
                class="btn-FecharModal"
                onclick="UI.toggleInfoModal()">

                Fechar

            </button>

        </div>
    `;

        document.body.appendChild(modal);
    },

    // =========================
    // VIDA DO INIMIGO (UI)
    // =========================

    updateEnemyHealth(inimigo, vida, vidaMax) {
        const target = document.getElementById("inimigo" + inimigo);
        if (!target || vida <= 0 || vidaMax <= 0) {
            this.hideEnemyHealth();
            return;
        }

        this.showEnemyHealth(target, vida, vidaMax);
    },

    // =========================
    // CRIAÇÃO VISUAL (DOM)
    // =========================

    spawnEnemies() {

        ChamaSom('audio1');

        let limiteInimigos = 1;

        if (andar < 5) {
            limiteInimigos = 1;
        } else if (andar >= 5 && andar <= 14) {
            limiteInimigos = 2;
        } else if (andar >= 15 && andar <= 29) {
            limiteInimigos = 3;
        } else if (andar >= 30) {
            limiteInimigos = 4;
        }

        numInimigosTela = limiteInimigos;

        for (let i = 1; i <= limiteInimigos; i++) {


            const inimigo = document.getElementById("inimigo" + i);

            setTimeout(() => {

                inimigo.style.visibility = "visible";

            }, 600);

  


            /*
                      inimigo.onclick = function () {
                console.log("CLIQUE NO INIMIGO:", i);
                Bater(i, true);
            };
            inimigo.src = "imagens/Inimigo.png";
            inimigo.className = "inimigo" + i;
            inimigo.id = "inimigo" + i;



            document.body.appendChild(inimigo);*/

            if (i === 1 || i === 2) {
                inimigo.style.transform = "scaleX(-1)";
            }

        }

        // limpeza de duplicados (igual original)
        /*
        for (let i = 1; i <= limiteInimigos; i++) {
            if (document.getElementsByClassName("inimigo" + i).length > 1) {
                console.log("removeu" + i);
                document.body.removeChild(document.getElementById("inimigo" + i));
            }
        }
            */
    },

    removeEnemy(i) {
        const el = document.getElementById("inimigo" + i);
        if (el) el.style.visibility = "hidden";
    },

    removeAllEnemies() {
        for (let i = 1; i <= 4; i++) {
            this.removeEnemy(i);
        }
    },

    // =========================
    // UI EXTRAS (BAÚ / ETC)
    // =========================

    spawnChest() {
        const bau = document.createElement("img");

        bau.src = "imagens/bau-aventura.svg";
        bau.className = "bau";
        bau.id = "bau";
        bau.onclick = ColetaBau;

        document.body.appendChild(bau);
    },

    removeChest() {
        const el = document.getElementById("bau");
        if (el) document.body.removeChild(el);
    },

    // =========================
    // COMPANHEIROS (VISUAL)
    // =========================

    spawnCompanion(src, id) {
        const img = document.createElement("img");

        img.src = src;
        img.className = id;
        img.id = id;

        document.body.appendChild(img);
    },

    // =========================
    // HABILIDADE (VISUAL)
    // =========================

    spawnSkill() {
        const habilidade = document.createElement("img");

        habilidade.src = "imagens/espada-habilidade.svg";
        habilidade.className = "habilidade1";
        habilidade.id = "habilidade1";
        habilidade.onclick = UsaHabilidadeDano;

        document.body.appendChild(habilidade);

        ChamaSom("audio7");
    },

    removeSkill() {
        const el = document.getElementById("habilidade1");
        if (el) document.body.removeChild(el);
    },

    // =========================
    // MODAL
    // =========================

    showModal(titulo, conteudo) {

        let modal = document.getElementById("gameModal");

        if (modal) {
            modal.remove();
            return;
        }

        // cria uma única vez
        if (!modal) {

            modal = document.createElement("div");
            modal.id = "gameModal";

            modal.innerHTML = `
            <div id="gameModalContent">

                <div id="gameModalHeader">
                    <span id="gameModalTitle"></span>

                    <button id="gameModalClose">X</button>
                </div>

                <div id="gameModalBody"></div>

            </div>
        `;

            document.body.appendChild(modal);

            document.getElementById("gameModalClose").onclick = () => {
                this.closeModal();
            };

            // fecha clicando fora
            modal.onclick = (e) => {

                if (e.target.id === "gameModal") {
                    this.closeModal();
                }
            };
        }

        document.getElementById("gameModalTitle").innerHTML = titulo;
        document.getElementById("gameModalBody").innerHTML = conteudo;

        modal.style.display = "flex";
    },

    closeModal() {

        const modal = document.getElementById("gameModal");

        if (modal) {
            modal.style.display = "none";
        }
    },
};

let ultimaAnimacaoAtaque = 0;
let animacoesAtaqueAtivas = 0;

UI.playAttackAnimation = function(inimigoElement) {
    const agora = Date.now();
    if (agora - ultimaAnimacaoAtaque < 450) return;

    const player = document.querySelector(".player");
    if (!player) return;

    ultimaAnimacaoAtaque = agora;
	animacoesAtaqueAtivas++;
	player.classList.add("is-attacking-animation");
    const rect = player.getBoundingClientRect();
    const animation = document.createElement("div");
    animation.className = "game-sprite-animation attack-sprite-animation";
    animation.setAttribute("aria-hidden", "true");
    animation.style.left = `${rect.left + rect.width / 2}px`;
    animation.style.top = `${rect.top + rect.height * 0.52}px`;
    animation.style.width = `${rect.width}px`;
    animation.style.height = `${rect.height}px`;

    // Determinar direção baseada na posição do inimigo
    let faceRight = true; // padrão: player olha para direita
    if (inimigoElement) {
        const inimigoRect = inimigoElement.getBoundingClientRect();
        const playerCenterX = rect.left + rect.width / 2;
        const inimigoCenterX = inimigoRect.left + inimigoRect.width / 2;
        faceRight = inimigoCenterX > playerCenterX;
    }

    if (!faceRight) {
        animation.style.transform = "translate(-50%, -50%) scaleX(-1)";
    }

    const frames = document.createElement("img");
    frames.className = "attack-sprite-frame";
    frames.alt = "";
    frames.src = "imagens/ataque/frames/ataque-1.png";
    animation.appendChild(frames);
    document.body.appendChild(animation);

    let concluded = false;
    let currentFrame = 1;
    const frameTimer = setInterval(() => {
        currentFrame++;
        if (currentFrame <= 6) frames.src = `imagens/ataque/frames/ataque-${currentFrame}.png`;
    }, 108); // 650ms / 6 frames ≈ 108ms per frame

    const finish = () => {
        if (concluded) return;
        concluded = true;
        clearInterval(frameTimer);
        animation.remove();
        animacoesAtaqueAtivas = Math.max(0, animacoesAtaqueAtivas - 1);
        if (animacoesAtaqueAtivas === 0) player.classList.remove("is-attacking-animation");
    };
    setTimeout(finish, 650);
};

UI.playEscapeAnimation = function() {
    const player = document.querySelector(".player");
    if (!player) return Promise.resolve();

    const rect = player.getBoundingClientRect();
    const animation = document.createElement("div");
    animation.className = "game-sprite-animation escape-sprite-animation";
    animation.setAttribute("aria-hidden", "true");
    animation.style.left = `${rect.left + rect.width / 2}px`;
    animation.style.top = `${rect.top + rect.height * 0.42}px`;
    animation.style.width = `${rect.width}px`;
    animation.style.height = `${rect.height}px`;
    const frames = document.createElement("img");
    frames.className = "escape-sprite-frame";
    frames.alt = "";
    frames.src = "imagens/fugindo/frames/fuga-1.png";
    animation.appendChild(frames);
    player.classList.add("is-escaping");
    document.body.appendChild(animation);

    return new Promise(resolve => {
        let concluded = false;
        let currentFrame = 1;
        const frameTimer = setInterval(() => {
            currentFrame++;
            if (currentFrame <= 7) frames.src = `imagens/fugindo/frames/fuga-${currentFrame}.png`;
        }, 180);
        const finish = () => {
            if (concluded) return;
            concluded = true;
            clearInterval(frameTimer);
            animation.remove();
            player.classList.remove("is-escaping");
            resolve();
        };
        animation.addEventListener("animationend", finish, { once: true });
        setTimeout(finish, 1400);
    });
};

// =========================
// COMPATIBILIDADE LEGACY
// =========================

function AtualizarTela() {
    UI.render();
}

function MostraInfo(msg) {
    UI.showInfo(msg);
}

function MostraStatus() {
    UI.showStatus();
}

function SobeStatus() {
    UI.toggleStatus();
}

function RemoverInimigos() {
    UI.removeAllEnemies();
}

function CriarInimigos() {

    UI.spawnEnemies();
}

function MostraConquista() {

    let conquista = "";

    conquista += `
		<div style="margin-bottom:1.2em;">

			<div style="color:#ffcc66;font-weight:bold;">
				Conquista Atual
			</div>

			<div>
				${totalDerrotados} inimigos derrotados de
				${progressoConquistaDano}
			</div>
	`;

    if (validaConquista == 1) {

        conquista += `
			<div>
				Recompensa: Bonus de dano
			</div>
		`;

    } else if (validaConquista == 2) {

        conquista += `
			<div>
				Recompensa: Bonus de gold
			</div>
		`;

    } else if (validaConquista == 3) {

        conquista += `
			<div>
				Recompensa: Bonus de dano crítico
			</div>
		`;
    }

    conquista += `
			<div>
				Progresso:
				${(totalDerrotados * 100 / progressoConquistaDano).toFixed(2)}%
			</div>

		</div>
	`;

    conquista += `
		<div>

			<div style="color:#ffd84a;font-weight:bold;">
				Conquista de Gold
			</div>

			<div>
				${FormatGold(totalGold)} gold coletado de
				${progressoConquistaGold}
			</div>

			<div>
				Progresso:
				${(totalGold * 100 / progressoConquistaGold).toFixed(2)}%
			</div>

		</div>
	`;

    UI.showModal("Conquistas", conquista);
}

function MostraMissao() {

    // toggle da modal
    const modalExistente = document.getElementById("ui-modal-overlay");

    if (modalExistente) {
        UI.closeModal();
        return;
    }

    if (andar < 10) {

        UI.showModal(
            "Missões",
            `
                <div class="modal-info">
                    Missões só serão liberadas a partir do andar 10
                </div>
            `
        );

        return;
    }

    let progressoAtual = 0;
    let progressoMax = 0;

    if (missaoAtual == 1) {

        progressoAtual = missaoColetaAtual;
        progressoMax = missaoColeta;

    } else if (missaoAtual == 2) {

        progressoAtual = missaoGolpeAtual;
        progressoMax = missaoGolpe;

    } else if (missaoAtual == 3) {

        progressoAtual = missaoCacaMugsAtual;
        progressoMax = missaoCacaMugs;

    } else if (missaoAtual == 4) {

        progressoAtual = missaoTempoAtual;
        progressoMax = missaoTempo;
    }

    const porcentagem =
        ((progressoAtual * 100) / progressoMax).toFixed(2);

    UI.showModal(
        "Missões",
        `
            <div class="modal-section">

                <div class="modal-linha">
                    <span class="modal-label">Missão Atual:</span>
                    <span class="modal-value">
                        ${missao[missaoAtual]}
                    </span>
                </div>

                <div class="modal-linha">
                    <span class="modal-label">Progresso:</span>
                    <span class="modal-value">
                        ${progressoAtual} / ${progressoMax}
                    </span>
                </div>

                <div class="modal-barra">
                    <div 
                        class="modal-barra-fill"
                        style="width:${Math.min(porcentagem, 100)}%">
                    </div>
                </div>

                <div class="modal-porcentagem">
                    ${porcentagem}%
                </div>

            </div>
        `
    );
}

function MostraInfos() {
    UI.toggleInfoModal();
}
