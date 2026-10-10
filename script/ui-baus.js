// ===================== BAUS E ITENS DA BUILD =================================
// Abertura de baus, bau dourado e bau de itens da build.
// Metodos movidos de ui.js; continuam em UI via Object.assign, entao
// this segue sendo UI e nenhuma chamada existente muda.

Object.assign(UI, {
// UI EXTRAS (BAÚ / ETC)
    // =========================

    chestOpeningTimeout: null,

    showChestOpening(chestKind, rewardKind, title, detail, accentColor = "#ffd34f") {
        this.removeChestOpening();
        // Chuva de meteoros: nenhuma tela de abertura de baú — o overlay
        // escurece a arena por 3,5s e esconde os fragmentos no chão. A
        // recompensa já foi creditada pelo chamador e cada ramo tem o próprio
        // aviso (showInfo/milestone/showCurrencyReward), então só a tela some.
        if (eventoAtivo === "meteoro") return;

        const opening = document.createElement("div");
        opening.id = "chestOpening";
        opening.className = `chest-opening chest-opening--${chestKind} chest-opening--reward-${rewardKind}`;
        opening.setAttribute("role", "status");
        opening.setAttribute("aria-live", "polite");
        opening.style.setProperty(
            "--chest-accent",
            chestKind === "golden" ? "#ffd34f" : accentColor
        );
        opening.style.setProperty("--reward-accent", accentColor);

        const card = document.createElement("div");
        card.className = "chest-opening__card";
        const label = document.createElement("span");
        label.className = "chest-opening__label";
        label.textContent = chestKind === "golden" ? "Baú dourado aberto" : "Baú encontrado";

        const stage = document.createElement("div");
        stage.className = "chest-opening__stage";
        const chest = document.createElement("img");
        chest.className = "chest-opening__chest";
        chest.src = chestKind === "golden" ? "imagens/bau-dourado.svg" : "imagens/bau-aventura.svg";
        chest.alt = "";
        stage.appendChild(chest);

        const reward = document.createElement("div");
        reward.className = "chest-opening__reward";
        if (rewardKind === "gold") {
            const icon = document.createElement("span");
            icon.className = "chest-opening__reward-icon chest-opening__reward-icon--gold";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "G";
            reward.appendChild(icon);
        } else if (rewardKind === "emerald") {
            const icon = document.createElement("img");
            icon.className = "chest-opening__reward-icon";
            icon.src = "imagens/esmeralda-recompensa.svg";
            icon.alt = "";
            reward.appendChild(icon);
        } else if (rewardKind === "ant") {
            reward.appendChild(this.createAntSprite(accentColor));
        } else {
            const icon = document.createElement("span");
            icon.className = "chest-opening__reward-icon chest-opening__reward-icon--skills";
            icon.setAttribute("aria-hidden", "true");
            icon.textContent = "✦";
            reward.appendChild(icon);
        }

        const rewardTitle = document.createElement("strong");
        rewardTitle.className = "chest-opening__title";
        rewardTitle.textContent = title;
        const rewardDetail = document.createElement("span");
        rewardDetail.className = "chest-opening__detail";
        rewardDetail.textContent = detail;
        reward.append(rewardTitle, rewardDetail);
        card.append(label, stage, reward);
        opening.appendChild(card);
        document.body.appendChild(opening);

        this.chestOpeningTimeout = setTimeout(() => {
            opening.remove();
            this.chestOpeningTimeout = null;
        }, 3500);
    },

    removeChestOpening() {
        document.getElementById("chestOpening")?.remove();
        clearTimeout(this.chestOpeningTimeout);
        this.chestOpeningTimeout = null;
    },

    updateGoldenChestProgress() {
        const tracker = document.getElementById("golden-chest-tracker");
        const progressText = document.getElementById("golden-chest-progress-text");
        const claim = document.getElementById("golden-chest-claim");
        if (!tracker || !progressText || !claim) return;

        const ready = bauDouradoPendente === 1;
        // O card mostra só o TEMPO QUE FALTA (antes era o decorrido "/ 20:00")
        const restante = ready ? 0 : Math.max(0, TEMPO_BAU_DOURADO_JOGO - progressoBauDourado);
        const minutes = Math.floor(restante / 60000);
        const seconds = Math.floor(restante / 1000) % 60;
        const tempo = `${minutes}:${String(seconds).padStart(2, "0")}`;

        progressText.textContent = tempo;
        claim.disabled = !ready;
        claim.setAttribute("aria-label", ready
            ? "Abrir baú dourado"
            : `Baú dourado carregando, falta ${tempo}`);
        claim.title = ready
            ? "Abrir baú dourado"
            : `Falta ${tempo} para o baú dourado`;
        tracker.classList.toggle("is-ready", ready);
    },

    // Descrição do rastreador: o ícone de info (em cima do baú) abre/fecha
    // este balão. Fecha sozinho no clique fora; o ESC já passa por aqui pelo
    // FechaJanelasAbertas (keymap.js).
    toggleGoldenChestInfo() {
        const desc = document.getElementById("golden-chest-desc");
        const info = document.getElementById("golden-chest-info");
        if (!desc || !info) return;

        const abrir = desc.hidden;
        desc.hidden = !abrir;
        info.setAttribute("aria-expanded", String(abrir));

        if (abrir) {
            this._goldenChestInfoHandler = (evento) => {
                const tracker = document.getElementById("golden-chest-tracker");
                if (tracker && !tracker.contains(evento.target)) {
                    this.toggleGoldenChestInfo();
                }
            };
            // setTimeout: senão o próprio clique que abriu já fecha (o listener
            // nasce depois, mas o evento de abertura ainda está na fila).
            setTimeout(() => {
                if (this._goldenChestInfoHandler) {
                    document.addEventListener("pointerdown", this._goldenChestInfoHandler);
                }
            }, 0);
        } else if (this._goldenChestInfoHandler) {
            document.removeEventListener("pointerdown", this._goldenChestInfoHandler);
            this._goldenChestInfoHandler = null;
        }
    },

    spawnChest(quantity = 1) {
        this.removeChest();
        // Chuva de meteoros: o ícone do baú espera fora da arena (o saldo
        // continua em quantidadeBausDisponiveis) — no meio da chuva ele cairia
        // em cima dos fragmentos e o clique nos coletaria sem querer.
        // EncerraEvento() repõe a ícone quando o evento acaba.
        if (eventoAtivo === "meteoro") return;
        const bau = document.createElement("img");

        bau.src = "imagens/bau-aventura.svg";
        bau.className = "bau";
        bau.id = "bau";
        bau.onclick = ColetaBau;
        bau.alt = "";
        bau.setAttribute("role", "button");
        bau.setAttribute("tabindex", "0");
        bau.setAttribute("aria-label", quantity > 1 ? `Coletar um baú; ${quantity} disponíveis` : "Coletar baú");
        bau.title = quantity > 1 ? `${quantity} baús disponíveis` : "Baú";
        bau.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                ColetaBau();
            }
        });

        document.body.appendChild(bau);

        if (quantity > 1) {
            const count = document.createElement("span");
            count.id = "bau-count";
            count.className = "chest-stack-count";
            count.setAttribute("aria-hidden", "true");
            count.textContent = String(quantity);
            document.body.appendChild(count);
            const posicionaContagem = () => {
                if (!bau.isConnected || !count.isConnected) return;
                const rect = bau.getBoundingClientRect();
                count.style.left = `${rect.right - 18}px`;
                count.style.top = `${rect.top - 8}px`;
            };
            posicionaContagem();
            if (this.chestResizeHandler) {
                window.removeEventListener("resize", this.chestResizeHandler);
            }
            this.chestResizeHandler = posicionaContagem;
            window.addEventListener("resize", posicionaContagem);
            posicionaContagem();
        }
    },

    removeChest() {
        if (this.chestResizeHandler) {
            window.removeEventListener("resize", this.chestResizeHandler);
            this.chestResizeHandler = null;
        }
        const el = document.getElementById("bau");
        if (el) el.remove();
        document.getElementById("bau-count")?.remove();
    },

    // =========================
    // BAÚ DE ITENS DA BUILD
    // =========================
    // Diferente do baú comum, este é MANUAL e persistente: aparece a cada
    // 10 andares depois do desbloqueio (andar 100) e some quando o
    // jogador escolhe um item ou ignora o baú — não é removido na troca
    // de andar nem pela coleta de baús comuns (RemoveBau mexe no id "bau").
	spawnBauBuild() {
		this.removeBauBuild();
		const quantidade = Tapeira.ItensBuild.quantidadeBausPendentes();
		const bau = document.createElement("img");

        bau.src = "imagens/bau-aventura.svg";
        bau.className = "bau bau-build";
        bau.id = "bauBuild";
        bau.alt = "";
        bau.setAttribute("role", "button");
        bau.setAttribute("tabindex", "0");
		bau.setAttribute("aria-label", quantidade === 1
			? "Abrir baú de itens da build"
			: `Abrir ${quantidade} baús de itens da build`);
		bau.title = quantidade === 1
			? "Baú de itens da build: escolha 1 de 3"
			: `${quantidade} baús de itens da build pendentes: escolha 1 de 3 por baú`;
        bau.addEventListener("click", () => Tapeira.ItensBuild.abreEscolha());
		bau.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				if (event.repeat) return;
				Tapeira.ItensBuild.abreEscolha();
			}
        });

        document.body.appendChild(bau);

        const selo = document.createElement("span");
        selo.id = "bauBuild-selo";
        selo.className = "bau-build-selo";
        selo.setAttribute("aria-hidden", "true");
		selo.textContent = quantidade > 1 ? `ITENS ×${quantidade}` : "ITENS";
        document.body.appendChild(selo);

        const posicionaSelo = () => {
            if (!bau.isConnected || !selo.isConnected) return;
            const rect = bau.getBoundingClientRect();
            selo.style.left = `${rect.left + rect.width / 2}px`;
            selo.style.top = `${rect.top - 4}px`;
        };
        if (this.bauBuildResizeHandler) {
            window.removeEventListener("resize", this.bauBuildResizeHandler);
        }
        this.bauBuildResizeHandler = posicionaSelo;
        window.addEventListener("resize", posicionaSelo);
        posicionaSelo();
    },

    removeBauBuild() {
        if (this.bauBuildResizeHandler) {
            window.removeEventListener("resize", this.bauBuildResizeHandler);
            this.bauBuildResizeHandler = null;
        }
        document.getElementById("bauBuild")?.remove();
        document.getElementById("bauBuild-selo")?.remove();
    },

    // =========================
    // COMPANHEIROS (VISUAL)
    // =========================

    // =========================
    // ESCOLHA DE ITEM DA BUILD
    // =========================
    // Modal próprio (não usa o gameModal para não brigar com o toggle).
    // Fluxo: 3 cartões sorteados; se a build já está cheia, o primeiro
    // clique escolhe o item novo e o modal vira "qual item sai" — a
    // pilha inteira do item descartado some (todas as cópias).
    showEscolhaItensBuild(opcoes, escolhendo) {
        this.fechaEscolhaItensBuild();

        const limite = Tapeira.ItensBuild.LIMITE;
        const cheia = Tapeira.ItensBuild.contagem() >= limite;
        const titulo = escolhendo
            ? "Trocar qual item?"
            : cheia
                ? `Build cheia (${limite}/${limite}): qual item entra?`
                : "Baú de itens da build";
        const subtitulo = escolhendo
            ? `Entra: ${Tapeira.ItensBuild.item(escolhendo).nome} — descartar some a pilha inteira do item`
            : cheia
                ? "Escolha um dos 3 e depois qual item sai (a pilha inteira some)"
                : "Escolha 1 de 3 — cópias repetidas ocupam slot próprio e acumulam o bônus";

        let corpo = "";
        if (escolhendo) {
            // um cartão por item único: descartar leva a pilha inteira
            const unicos = [...new Set(Tapeira.ItensBuild.pegaLista())];
            corpo += `<div class="itens-build-grade">` + unicos.map(idItem => {
                const registro = Tapeira.ItensBuild.item(idItem);
                const copias = Tapeira.ItensBuild.copias(idItem);
                return `<button class="item-build-cartao item-build-sair" data-descartar="${idItem}">
                    <img src="${registro.icone}" alt="">
                    <span class="item-build-nome">${registro.nome}</span>
                    <span class="item-build-efeito">${registro.efeito}</span>
                    ${copias > 1 ? `<span class="item-build-copia">pilha ×${copias} — sai tudo</span>` : ""}
                    <span class="item-build-acao">tirar da build</span>
                </button>`;
            }).join("") + `</div>`;
        } else {
            corpo += `<div class="itens-build-grade">` + opcoes.map(idItem => {
                const registro = Tapeira.ItensBuild.item(idItem);
                const copias = Tapeira.ItensBuild.copias(idItem);
                return `<button class="item-build-cartao" data-item="${idItem}">
                    <img src="${registro.icone}" alt="">
                    <span class="item-build-nome">${registro.nome}</span>
                    <span class="item-build-efeito">${registro.efeito}</span>
                    ${copias > 0 ? `<span class="item-build-copia">já na build ×${copias} → ×${copias + 1}</span>` : ""}
                    <span class="item-build-acao">escolher</span>
                </button>`;
            }).join("") + `</div>`;
        }

        const modal = document.createElement("div");
        modal.id = "modalItensBuild";
        modal.className = "modal-itens-build";
        modal.innerHTML = `
            <div class="modal-itens-build-conteudo" role="dialog" aria-modal="true" aria-label="Escolha de item da build">
                <div class="itens-build-cabecalho">
                    <span class="itens-build-titulo">${titulo}</span>
                    <span class="itens-build-subtitulo">${subtitulo}</span>
                </div>
                ${corpo}
                <button type="button" class="btn-Padrao item-build-adiar" data-item-build-skip>
                    Não escolher nenhum item
                </button>
            </div>`;
        // fecha clicando fora (o baú continua pendente: pode reabrir)
        modal.addEventListener("click", (e) => {
            if (e.target === modal) this.fechaEscolhaItensBuild();
        });

        modal.querySelectorAll("[data-item]").forEach(botao => {
            botao.addEventListener("click", () => {
                const idItem = botao.getAttribute("data-item");
                if (Tapeira.ItensBuild.contagem() >= limite) {
                    this.showEscolhaItensBuild(opcoes, idItem); // passo 2: qual sai
                } else {
                    Tapeira.ItensBuild.escolhe(idItem, null);
                }
            });
        });
        modal.querySelectorAll("[data-descartar]").forEach(botao => {
            botao.addEventListener("click", () =>
                Tapeira.ItensBuild.escolhe(escolhendo, botao.getAttribute("data-descartar")));
        });
        modal.querySelector("[data-item-build-skip]").addEventListener("click", () =>
            Tapeira.ItensBuild.descartaBau());

        document.body.appendChild(modal);
        // esconde baú, selo "ITENS" e milestone por trás do modal
        document.body.classList.add("itens-build-tela-aberta");
    },

    // Tela de leitura: os itens atuais da build, no mesmo visual da tela
    // de troca, mas sem ações — aberta pelo botão no painel Status
    showItensBuild() {
        document.getElementById("modalItensBuildView")?.remove();

        const build = Tapeira.ItensBuild;
        let subtitulo;
        let corpo;

        if (!build.desbloqueada()) {
            subtitulo = "Sistema trancado";
            corpo = `<p class="logs-vazio">Desbloqueia ao chegar no andar 100.</p>`;
        } else if (build.contagem() === 0) {
            subtitulo = `0/${build.LIMITE} · baú de itens a cada 10 andares`;
            corpo = `<p class="logs-vazio">Nenhum item na build ainda.</p>`;
        } else {
            subtitulo = build.resumo();
            // um cartão por item único, com a pilha indicada
            const unicos = [...new Set(build.pegaLista())];
            corpo = `<div class="itens-build-grade">` + unicos.map(idItem => {
                const registro = build.item(idItem);
                const copias = build.copias(idItem);
                return `<div class="item-build-cartao item-build-cartao--leitura">
                    <img src="${registro.icone}" alt="">
                    <span class="item-build-nome">${registro.nome}</span>
                    <span class="item-build-efeito">${registro.efeito}</span>
                    ${copias > 1 ? `<span class="item-build-copia">pilha ×${copias}</span>` : ""}
                </div>`;
            }).join("") + `</div>`;
        }

        const modal = document.createElement("div");
        modal.id = "modalItensBuildView";
        modal.className = "modal-itens-build";
        modal.innerHTML = `
            <div class="modal-itens-build-conteudo" role="dialog" aria-modal="true" aria-label="Itens da build">
                <div class="itens-build-cabecalho">
                    <span class="itens-build-titulo">Itens da build</span>
                    <span class="itens-build-subtitulo">${subtitulo}</span>
                </div>
                ${corpo}
            </div>`;
        // fecha clicando fora
        modal.addEventListener("click", (e) => {
            if (e.target === modal) this.fechaItensBuildTela();
        });

        document.body.appendChild(modal);
        // esconde baú, selo "ITENS" e milestone por trás do modal
        document.body.classList.add("itens-build-tela-aberta");
    },

    // fecha a tela de leitura e devolve a visibilidade do baú (mantida se a
    // tela de escolha do baú ainda estiver aberta)
    fechaItensBuildTela() {
        document.getElementById("modalItensBuildView")?.remove();
        if (!document.getElementById("modalItensBuild")) {
            document.body.classList.remove("itens-build-tela-aberta");
        }
    },

    fechaEscolhaItensBuild() {
        document.getElementById("modalItensBuild")?.remove();
        if (!document.getElementById("modalItensBuildView")) {
            document.body.classList.remove("itens-build-tela-aberta");
        }
    }
});
