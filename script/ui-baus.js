// ===================== BAUS E ITENS DA BUILD =================================
// Abertura de baus, bau dourado e bau de itens da build.
// Metodos movidos de ui.js; continuam em UI via Object.assign, entao
// this segue sendo UI e nenhuma chamada existente muda.

Object.assign(UI, {
// UI EXTRAS (BAÚ / ETC)
    // =========================

    chestOpeningTimeout: null,

    // O antigo cartão central de abertura de baú saiu. Agora o aviso vira uma
    // linha no log (#logAvisos), com cor pelo tipo de recompensa — nada cobre a
    // arena nem escurece a tela. A assinatura é mantida para os chamadores.
    showChestOpening(chestKind, rewardKind, title, detail) {
        // preferência "Avisos de baú" desligada suprime o aviso
        if (window.Tapeira?.Config && !window.Tapeira.Config.ativo("avisosBau")) return;
        // Chuva de meteoros: nada de aviso de baú (o baú nem fica na arena);
        // cada ramo ainda tem o próprio aviso (showInfo/showMilestone).
        if (eventoAtivo === "meteoro") return;

        const rotulo = chestKind === "golden" ? "Baú dourado" : "Baú encontrado";
        const tipo = rewardKind === "emerald" ? "bau"
            : rewardKind === "skills" ? "skills"
            : rewardKind === "gold" ? "gold"
            : "bau";
        const conteudo = detail || title || "recompensa recebida";
        this.logAviso(tipo, `${rotulo}: ${conteudo}`);
    },

    removeChestOpening() {
        // Sem cartão na tela — o aviso do baú agora vai para o log (#logAvisos).
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

        bau.src = "imagens/hud/bau-aventura.svg";
        bau.className = "bau";
        bau.id = "bau";
        bau.addEventListener("click", () => ColetaBau());
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
		// Dois visuais do mesmo baú, alternados pelo CSS pela largura da tela:
		// PC e tablet (>700px) ficam com o BAÚ NA ARENA — o visual original,
		// um baú de verdade solto perto do player com o selo "ITENS" acima;
		// só o celular (≤700px) usa o CHIP no HUD (#container-Metas >
		// .coluna-rail). Os dois nascem juntos; o display:none tira o outro
		// da jogada — reage ao resize sem novo spawn.
		const rotulo = quantidade === 1
			? "Abrir baú de itens da build"
			: `Abrir ${quantidade} baús de itens da build`;
		const dica = quantidade === 1
			? "Baú de itens da build: escolha 1 de 3"
			: `${quantidade} baús de itens da build pendentes: escolha 1 de 3 por baú`;

		// --- baú na arena (PC/tablet) ---
		const bau = document.createElement("img");
		bau.src = "imagens/hud/bau-aventura.svg";
		bau.className = "bau bau-build";
		bau.id = "bauBuild-arena";
		bau.alt = "";
		bau.setAttribute("role", "button");
		bau.setAttribute("tabindex", "0");
		bau.setAttribute("aria-label", rotulo);
		bau.title = dica;
		bau.addEventListener("click", () => Tapeira.ItensBuild.abreEscolha());
		bau.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				Tapeira.ItensBuild.abreEscolha();
			}
		});
		document.body.appendChild(bau);

		const seloArena = document.createElement("span");
		seloArena.id = "bauBuild-arena-selo";
		seloArena.className = "bau-build-selo";
		seloArena.setAttribute("aria-hidden", "true");
		seloArena.textContent = quantidade > 1 ? `ITENS ×${quantidade}` : "ITENS";
		document.body.appendChild(seloArena);

		const posicionaSeloArena = () => {
			if (!bau.isConnected || !seloArena.isConnected) return;
			const rect = bau.getBoundingClientRect();
			seloArena.style.left = `${rect.left + rect.width / 2}px`;
			seloArena.style.top = `${rect.top - 4}px`;
		};
		if (this.bauBuildResizeHandler) {
			window.removeEventListener("resize", this.bauBuildResizeHandler);
		}
		this.bauBuildResizeHandler = posicionaSeloArena;
		window.addEventListener("resize", posicionaSeloArena);
		posicionaSeloArena();

		// --- chip no HUD (só no celular) ---
		const rail = document.querySelector("#container-Metas > .coluna-rail");
		if (!rail) return;

		const chip = document.createElement("button");
		chip.type = "button";
		chip.id = "bauBuild";
		chip.className = "itens-chip";
		chip.setAttribute("aria-label", rotulo);
		chip.title = dica;

		const icone = document.createElement("img");
		icone.src = "imagens/hud/bau-aventura.svg";
		icone.alt = "";

		const selo = document.createElement("span");
		selo.id = "bauBuild-selo";
		selo.setAttribute("aria-hidden", "true");
		selo.textContent = quantidade > 1 ? `ITENS ×${quantidade}` : "ITENS";

		chip.appendChild(icone);
		chip.appendChild(selo);

		chip.addEventListener("click", () => Tapeira.ItensBuild.abreEscolha());
		chip.addEventListener("keydown", event => {
			if (event.key === "Enter" || event.key === " ") {
				event.preventDefault();
				if (event.repeat) return;
				Tapeira.ItensBuild.abreEscolha();
			}
		});

		rail.appendChild(chip);
	},

	removeBauBuild() {
		if (this.bauBuildResizeHandler) {
			window.removeEventListener("resize", this.bauBuildResizeHandler);
			this.bauBuildResizeHandler = null;
		}
		document.getElementById("bauBuild-arena")?.remove();
		document.getElementById("bauBuild-arena-selo")?.remove();
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

        const limite = Tapeira.ItensBuild.limiteAtual();
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
            const unicos = [...new Set([...Tapeira.ItensBuild.pegaLista(), ...(Tapeira.ItensBuild.idsForjados ? Tapeira.ItensBuild.idsForjados() : [])])];
            corpo += `<div class="itens-build-grade">` + unicos.map(idItem => {
                const registro = Tapeira.ItensBuild.item(idItem);
                const copias = Tapeira.ItensBuild.copias(idItem);
                const forja = Tapeira.ItensBuild.nivelForja ? Tapeira.ItensBuild.nivelForja(idItem) : 0;
                const final = Tapeira.ItensBuild.efeitoFinal ? Tapeira.ItensBuild.efeitoFinal(idItem) : registro.efeito;
                return `<button class="item-build-cartao item-build-sair${forja > 0 ? " item-build-cartao--forjada" : ""}${forja >= Tapeira.ItensBuild.FORJA_MINIMO_PVP ? " item-build-cartao--pvp" : ""}" data-descartar="${idItem}">
                    <img src="${registro.icone}" alt="">
                    <span class="item-build-nome">${registro.nome}</span>
                    <span class="item-build-efeito">${registro.efeito}</span>
                    <span class="item-build-efeito-final">${final}</span>
                    <span class="item-build-meta">${copias > 1 ? "pilha ×" + copias + " · " : ""}${forja > 0 ? "forjada ×" + forja + " · " : ""}sai tudo</span>
                    <span class="item-build-acao">tirar da build</span>
                </button>`;
            }).join("") + `</div>`;
        } else {
            corpo += `<div class="itens-build-grade">` + opcoes.map(idItem => {
                const registro = Tapeira.ItensBuild.item(idItem);
                const copias = Tapeira.ItensBuild.copias(idItem);
                const forja = Tapeira.ItensBuild.nivelForja ? Tapeira.ItensBuild.nivelForja(idItem) : 0;
                const final = Tapeira.ItensBuild.efeitoFinal ? Tapeira.ItensBuild.efeitoFinal(idItem) : registro.efeito;
                return `<button class="item-build-cartao${forja > 0 ? " item-build-cartao--forjada" : ""}${forja >= Tapeira.ItensBuild.FORJA_MINIMO_PVP ? " item-build-cartao--pvp" : ""}" data-item="${idItem}">
                    <img src="${registro.icone}" alt="">
                    <span class="item-build-nome">${registro.nome}</span>
                    <span class="item-build-efeito">${registro.efeito}</span>
                    <span class="item-build-efeito-final">${final}</span>
                    ${copias > 0 ? `<span class="item-build-meta">já na build ×${copias} → ×${copias + 1}</span>` : ""}
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
        } else if (build.contagem() === 0 && (!build.idsForjados || build.idsForjados().length === 0)) {
            subtitulo = `0/${build.limiteAtual()} · baú de itens a cada 5 andares`;
            corpo = `<p class="logs-vazio">Nenhum item na build ainda.</p>`;
        } else {
            subtitulo = build.resumo();
            // um cartão por item único, com a pilha indicada
            const unicos = [...new Set([...build.pegaLista(), ...(build.idsForjados ? build.idsForjados() : [])])];
            corpo = `<div class="itens-build-grade">` + unicos.map(idItem => {
                const registro = build.item(idItem);
                const copias = build.copias(idItem);
                const forja = build.nivelForja ? build.nivelForja(idItem) : 0;
                const final = build.efeitoFinal ? build.efeitoFinal(idItem) : registro.efeito;
                return `<div class="item-build-cartao item-build-cartao--leitura${forja > 0 ? " item-build-cartao--forjada" : ""}${forja >= build.FORJA_MINIMO_PVP ? " item-build-cartao--pvp" : ""}">
                    <img src="${registro.icone}" alt="">
                    <span class="item-build-nome">${registro.nome}</span>
                    <span class="item-build-efeito">${registro.efeito}</span>
                    <span class="item-build-efeito-final">${final}</span>
                    <span class="item-build-meta">${copias > 1 ? "pilha ×" + copias + " · " : ""}${forja > 0 ? "forjada ×" + forja + " · " : ""}efeito ×${build.copiasEfetivas(idItem)}</span>
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

// Baú dourado: abre e mostra a descrição por addEventListener (sem onclick
// inline no HTML). O botão de coleta nasce desabilitado e é ligado pelo jogo
// quando o baú está pronto.
document.addEventListener("DOMContentLoaded", () => {
	const claim = document.getElementById("golden-chest-claim");
	if (claim) claim.addEventListener("click", () => ColetaBauDourado());
	const info = document.getElementById("golden-chest-info");
	if (info) info.addEventListener("click", () => UI.toggleGoldenChestInfo());
	// cabeçalho do log de avisos: recolhe/expande (sem onclick inline)
	const cabecaLog = document.getElementById("logAvisosCabeca");
	if (cabecaLog) cabecaLog.addEventListener("click", () => UI.toggleLogAvisos());
});
