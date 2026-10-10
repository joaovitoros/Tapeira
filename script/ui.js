// ui.js
// Responsável apenas pela renderização da interface (DOM)

// Ícones dos nós raízes da árvore de habilidades (assets já existentes no jogo)
const ICONE_SKILL = {
	damage: "imagens/espada-habilidade.svg",
	electric: "imagens/efeito-eletrico.svg",
	gold: "imagens/bau-dourado.svg",
	escape: "imagens/cursor-espada.svg",
	frenzy: "imagens/espada-eletrica.svg"
};

const UI = {


    // =========================
    // HUD PRINCIPAL
    // =========================

    render() {
        const caveRoot = document.getElementById("game-root");
        if (caveRoot) {
            const themes = ["amber", "crimson", "teal", "violet"];
            const theme = themes[Math.floor(Math.max(1, andar) / 10) % themes.length];
            caveRoot.classList.remove(...themes.map(name => `cave-depth--${name}`));
            caveRoot.classList.add(`cave-depth--${theme}`);
            caveRoot.classList.toggle("cave-floor--guardian", andar % 10 === 0);
        }
        document.getElementById("titulo").innerHTML = "Caverna (Andar: " + andar + ")";
        document.getElementById("contDerrotados").innerHTML = totalDerrotados;
        document.getElementById("contAndar").innerHTML = andar;
        document.getElementById("contGold").innerHTML = FormatGold(gold);
        document.getElementById("contEmeraldas").innerHTML = esmeraldas;
        document.getElementById("contTempo").innerHTML = tempoAvancoInimigos;
        this.updateResetAviso();
        this.updateObjective();
        this.updateMission();
        this.updateSkillProgress();
        AtualizaHabilidadesCombate();
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
        } else if (missaoAtual === 5) {
            atual = missaoDesafioAtual;
            maximo = missaoDesafioAlvo;
            textoProgresso = `${Math.floor(atual)} / ${Math.floor(maximo)} inimigos${missaoDesafioSub === 3 ? ` · ${missaoDesafioTempo}s` : ""}`;
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

    floorTransitionTimeout: null,
    guardianIntroTimeout: null,
    guardianTargetTimeout: null,
    guardianTargetRestoreTimeout: null,
    guardianTarget: null,
    guardianTargetFilter: "",
    guardianTargetTransition: "",

    clearGuardianIntro() {
        clearTimeout(this.guardianIntroTimeout);
        clearTimeout(this.guardianTargetTimeout);
        clearTimeout(this.guardianTargetRestoreTimeout);
        this.guardianIntroTimeout = null;
        this.guardianTargetTimeout = null;
        this.guardianTargetRestoreTimeout = null;

        if (this.guardianTarget) {
            this.guardianTarget.style.filter = this.guardianTargetFilter;
            this.guardianTarget.style.transition = this.guardianTargetTransition;
            this.guardianTarget.classList.remove("guardian-intro-target");
            this.guardianTarget = null;
        }

        const spotlight = document.getElementById("guardianIntroSpotlight");
        spotlight?.classList.remove("guardian-intro-spotlight--visible");
    },

    showFloorTransition(floor) {
        this.clearGuardianIntro();
        clearTimeout(this.floorTransitionTimeout);
        let transition = document.getElementById("floorTransition");
        if (!transition) {
            transition = document.createElement("div");
            transition.id = "floorTransition";
            transition.className = "floor-transition";
            transition.setAttribute("role", "status");
            transition.setAttribute("aria-live", "polite");
            transition.innerHTML = `
                <span class="floor-transition__eyebrow"></span>
                <strong class="floor-transition__number"></strong>
            `;
            document.body.appendChild(transition);
        }

        const bossFloor = floor % 10 === 0;
        transition.classList.toggle("floor-transition--boss", bossFloor);
        transition.querySelector(".floor-transition__eyebrow").textContent =
            bossFloor ? "Um guardião bloqueia o caminho" : "Descendo mais fundo";
        transition.querySelector(".floor-transition__number").textContent =
            bossFloor ? `Andar ${floor} · Guardião` : `Andar ${floor}`;

        transition.classList.remove("floor-transition--visible");
        void transition.offsetWidth;
        transition.classList.add("floor-transition--visible");
        clearTimeout(this.floorTransitionTimeout);
        this.floorTransitionTimeout = setTimeout(() => {
            transition.classList.remove("floor-transition--visible");
        }, bossFloor ? 2800 : 1500);

        if (bossFloor) {
            let spotlight = document.getElementById("guardianIntroSpotlight");
            if (!spotlight) {
                spotlight = document.createElement("div");
                spotlight.id = "guardianIntroSpotlight";
                spotlight.className = "guardian-intro-spotlight";
                spotlight.setAttribute("aria-hidden", "true");
                document.body.appendChild(spotlight);
            }

            spotlight.style.setProperty("--guardian-focus-x", "50%");
            spotlight.style.setProperty("--guardian-focus-y", "50%");
            void spotlight.offsetWidth;
            spotlight.classList.add("guardian-intro-spotlight--visible");
            this.guardianIntroTimeout = setTimeout(() => {
                spotlight.classList.remove("guardian-intro-spotlight--visible");
                this.guardianIntroTimeout = null;
            }, 2800);

            this.guardianTargetTimeout = setTimeout(() => {
                const targets = Array.from(document.querySelectorAll(
                    "#inimigo1, #inimigo2, #inimigo3, #inimigo4"
                ));
                const target = targets
                    .filter(enemy => getComputedStyle(enemy).visibility === "visible")
                    .sort((a, b) => Number(b.id.slice(-1)) - Number(a.id.slice(-1)))[0];
                if (!target) return;

                const rect = target.getBoundingClientRect();
                spotlight.style.setProperty(
                    "--guardian-focus-x",
                    `${Math.round((rect.left + rect.width / 2) / window.innerWidth * 100)}%`
                );
                spotlight.style.setProperty(
                    "--guardian-focus-y",
                    `${Math.round((rect.top + rect.height / 2) / window.innerHeight * 100)}%`
                );
                this.guardianTarget = target;
                this.guardianTargetFilter = target.style.filter;
                this.guardianTargetTransition = target.style.transition;
                target.style.transition = "filter 240ms ease-out";
                target.style.filter = `${getComputedStyle(target).filter} drop-shadow(0 0 20px rgba(255, 220, 153, 0.98))`;
                target.classList.add("guardian-intro-target");
                this.guardianTargetRestoreTimeout = setTimeout(() => {
                    if (this.guardianTarget !== target) return;
                    target.style.filter = this.guardianTargetFilter;
                    target.style.transition = this.guardianTargetTransition;
                    target.classList.remove("guardian-intro-target");
                    this.guardianTarget = null;
                    this.guardianTargetRestoreTimeout = null;
                }, 1900);
            }, 650);
        }
        TocaSomSintetico(bossFloor ? "guardiao" : "andar");

        const floorCounter = document.getElementById("contAndar");
        floorCounter?.classList.remove("floor-counter--changed");
        if (floorCounter) {
            void floorCounter.offsetWidth;
            floorCounter.classList.add("floor-counter--changed");
            setTimeout(() => floorCounter.classList.remove("floor-counter--changed"), 650);
        }
    },

    syncScreenButtons() {
        const states = [
            ["btnStatus", document.getElementById("DivStatus")?.style.visibility === "visible"],
            ["btn-Loja", ["Loja", "LojaEsm", "LojaCM"].some(id =>
                document.getElementById(id)?.style.visibility === "visible"
            )],
            ["btn-Config", document.getElementById("container-SalvaCarrega")?.style.visibility === "visible"],
            ["btn-Formigas", !!document.getElementById("antCollectionModal")],
            ["btnSkills", !!document.getElementById("skillUpgradeModal")]
        ];

        states.forEach(([id, isOpen]) => {
            const button = document.getElementById(id);
            if (!button) return;
            button.classList.toggle("is-active", isOpen);
            button.setAttribute("aria-expanded", String(isOpen));
        });
    },

    updateSkillProgress() {
        const level = document.getElementById("skill-player-level");
        const points = document.getElementById("skill-player-points");
        const progress = document.getElementById("skill-player-xp");
        const fill = document.getElementById("skill-player-xp-fill");
        const button = document.getElementById("btnSkills");
        const badge = document.getElementById("skill-point-badge");
        const nextLevelXP = XPNecessarioProximoNivel();
        const percent = Math.max(0, Math.min(100, xpAtual * 100 / nextLevelXP));

        if (level) level.textContent = `Nível ${nivelJogador}`;
        if (points) points.textContent = `${pontosHabilidade} ${pontosHabilidade === 1 ? "ponto" : "pontos"} de habilidade`;
        if (progress) {
            progress.setAttribute("aria-valuenow", String(Math.min(xpAtual, nextLevelXP)));
            progress.setAttribute("aria-valuemax", String(nextLevelXP));
            progress.setAttribute("aria-valuetext", `${xpAtual} de ${nextLevelXP} XP`);
        }
        if (fill) fill.style.width = `${percent}%`;
        const xpLabel = document.getElementById("skill-player-xp-label");
        if (xpLabel) xpLabel.textContent = `${xpAtual} / ${nextLevelXP} XP para o próximo nível`;
        const niveis = Math.max(0, nivelJogador - 1);
        const conquistas = Math.floor(Math.max(0, totalNiveis | 0) / 100);
        const reducao = niveis + conquistas;
        const bonus = document.getElementById("skill-player-bonus");
        if (bonus) {
            bonus.textContent = `Bônus atual: +${niveis * 10}% de dano · −${reducao} ${reducao === 1 ? "inimigo" : "inimigos"} para avançar`;
        }
        // resumo da seção "Progresso e bônus" quando ela está recolhida
        const resumoProgresso = document.getElementById("skill-player-progresso-resumo");
        if (resumoProgresso) {
            const pontosPerk = PontosPerkDisponiveis();
            const texto = `+${niveis * 10}% dano · ${reducao} ${reducao === 1 ? "inimigo" : "inimigos"} a menos · ${pontosPerk} ${pontosPerk === 1 ? "ponto" : "pontos"} de perk`;
            if (resumoProgresso.textContent !== texto) resumoProgresso.textContent = texto;
        }
        if (button) button.setAttribute("aria-label", `Skills, nível ${nivelJogador}, ${pontosHabilidade} pontos disponíveis`);
        if (badge) {
            badge.textContent = String(pontosHabilidade);
            badge.hidden = pontosHabilidade === 0;
        }

    },

    // ---- UI do painel de skills: seções recolhíveis ----
    // O painel é reconstruído a cada compra, perk, ramo, level-up e
    // reabertura, então o estado de recolhimento vive fora do DOM.
    skillPanelSecoes: { progresso: true },

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

        const total = QuotaAndar();
        const derrotados = Math.max(0, Math.min(inimigosDerrotados, total));
        const porcentagem = derrotados * 100 / total;

        document.getElementById("objetivoDescricao").textContent = "Limpe a caverna";
        count.textContent = `${derrotados} / ${total} inimigos derrotados`;
        progress.setAttribute("aria-valuemax", String(total));
        progress.setAttribute("aria-valuenow", String(derrotados));
        fill.style.width = `${porcentagem}%`;
        container.classList.remove("objetivo-concluido");
    },

    updateResetAviso() {
        const aviso = document.getElementById("avisoReset");
        const botao = document.getElementById("btnAndar");
        if (!aviso || !botao) return;

        // reset fica livre a partir do andar 20; o portão continua no seu andar
        const alvo = Math.min(andarVolta, 20);
        const faltam = alvo - andar;
        const pronto = faltam <= 0;

        const danoPct = GatesDanoPendentes(andar) * 5;
        const sufixoDano = danoPct > 0 ? " · +" + danoPct + "% dano" : "";
        const texto = pronto
            ? (andar >= andarVolta
                ? "Reset disponível no botão Voltar andar!" + sufixoDano
                : "Reset livre disponível! +" + Math.round(derrotadosRun * MultiplicadorCM() * BonusCMPontosSobra()) + " CM")
            : "Próximo reset: andar " + alvo + " (faltam " + faltam + ")" + sufixoDano;

        if (aviso.textContent !== texto) aviso.textContent = texto;

        aviso.classList.toggle("aviso-reset--pronto", pronto);
        botao.classList.toggle("btn-reset-pronto", pronto);
    },

    // Celebração pós-reset: banner transitório no topo (some sozinho ou com clique/ESC)
    MostraCelebracaoReset(recebidas, andarAnterior, proximoAndar, danoRecebido = 0, cmRecebido = 0) {
        const antigo = document.getElementById("celebracaoReset");
        if (antigo) antigo.remove();
        if (UI.celebracaoTimeout) {
            clearTimeout(UI.celebracaoTimeout);
            UI.celebracaoTimeout = null;
        }

        const premios = [];
        if (recebidas > 0) premios.push(`+${recebidas} esmeralda${recebidas === 1 ? "" : "s"}`);
        if (danoRecebido > 0) premios.push(`+${danoRecebido}% de dano permanente`);
        if (cmRecebido > 0) premios.push(`+${cmRecebido} Conhecimento Mug`);
        if (premios.length === 0) premios.push("Reset realizado");

        const div = document.createElement("div");
        div.id = "celebracaoReset";
        div.className = "celebracao-reset";
        div.setAttribute("role", "status");
        div.innerHTML = `
            <div class="celebracao-reset-titulo">Reset realizado!</div>
            <div class="celebracao-reset-premio">${premios.join(" · ")}</div>
            <div class="celebracao-reset-info">Andar ${andarAnterior} → 1 · próximo reset no andar ${proximoAndar}</div>
        `;
        div.addEventListener("click", () => UI.FechaCelebracaoReset());
        document.body.appendChild(div);

        UI.celebracaoTimeout = setTimeout(() => UI.FechaCelebracaoReset(), 3400);
    },

    FechaCelebracaoReset() {
        if (UI.celebracaoTimeout) {
            clearTimeout(UI.celebracaoTimeout);
            UI.celebracaoTimeout = null;
        }

        const div = document.getElementById("celebracaoReset");
        if (!div || div.classList.contains("celebracao-reset--saindo")) return;

        div.classList.add("celebracao-reset--saindo");
        setTimeout(() => div.remove(), 380);
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
        progress.setAttribute("aria-valuemax", String(QuotaAndar()));
        progress.setAttribute("aria-valuenow", String(QuotaAndar()));
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
        // a caixa "Infos" saiu da tela: a mensagem vira um registro no
        // histórico, que abre pelo botão "Logs" no menu de configurações
        Tapeira.Logs.adiciona(mensagem);
    },

    // Tela de logs: as últimas 500 mensagens que dariam para a caixa "Infos"
    showLogs() {
        const entradas = Tapeira.Logs.pegaLista().reverse(); // mais recente primeiro
        this.showModal("Logs", entradas.length === 0
            ? `<p class="logs-vazio">Nenhum log nesta sessão.</p>`
            : `<div class="logs-lista" role="log"></div>`);

        const lista = document.querySelector("#gameModalBody .logs-lista");
        if (!lista) return;
        // linhas montadas com textContent: mensagem de jogo nunca vira HTML
        for (const entrada of entradas) {
            const linha = document.createElement("div");
            linha.className = "logs-linha";
            const hora = document.createElement("span");
            hora.className = "logs-hora";
            hora.textContent = entrada.hora;
            const texto = document.createElement("span");
            texto.className = "logs-texto";
            texto.textContent = entrada.texto;
            linha.append(hora, texto);
            lista.appendChild(linha);
        }
    },

    showStatus() {
        // dano real aplicado no inimigo = base × formigas × nível × especialização
        const multDanoTotal = MultiplicadorDanoFormigas() * MultiplicadorDanoNivel();
        const multEspNormal = MultiplicadorDanoEspecializacao(false);
        const multEspCritico = MultiplicadorDanoEspecializacao(true);

        // Alquimista: mostra o buff vigente (senão, o resumo do ciclo de 20s)
        const infoBuff = (typeof buffAtivo !== "undefined" && buffAtivo && Date.now() < buffAtivo.fimMs
            ? BUFFS_ALQUIMISTA.find(b => b.tipo === buffAtivo.tipo)
            : null);
        const buffAlqTxt = infoBuff
            ? "buff ativo: " + infoBuff.nome + " (" + Math.max(0, Math.ceil((buffAtivo.fimMs - Date.now()) / 1000)) + "s)"
            : "buff aleatório a cada " + (IntervaloAlquimistaMs() / 1000) + "s (10s cada)";

        const stats = [
            // Cadeia de Ataques: o valor "no cap" é o golpe cheio com o stack
            // de +400% fechado (base ×0,5 ×5 = ×2,5)
            ["Dano", (danoJogador * multDanoTotal * multEspNormal).toFixed(2)
                + (especializacao === 5
                    ? " → " + (danoJogador * multDanoTotal * 2.5).toFixed(2) + " no cap"
                    : "")],
            ["Multiplicador Gold", mulGold.toFixed(2)],
            ["Gold por inimigo", FormatGold(andar * mulGold * MultiplicadorGoldConhecimento() * MultiplicadorGoldFormigas() * MultiplicadorGoldEspecializacao())],
            ["Gold total", FormatGold(totalGold)],
            ["Bonus avanço", FormatGold(BonusGoldAvanco())],
            ["Chance avanço", (avanco * 100).toFixed(2) + "%"],
            ["Qtd avanço", qtdAvanco],
            ["Dano crítico", (danoCritJogador * multDanoTotal * multEspCritico).toFixed(2)],
            ["Chance crítica", (chanceCrit * 100).toFixed(2) + "%"],
            ["Especialização", especializacao > 0 ? ESPECIALIZACOES[especializacao].nome : "—"],
            // DPS de verdade: a Velocidade do Companheiro multiplica os hits/s
            ["DPS companheiros", (danoComp * multDanoTotal * multEspNormal * N(velAtaqueComp)).toFixed(2)],
            // Companheiros: nível + efeito vigente de cada um (loja de esmeraldas)
            ["Companheiro 1 — dano", N(lvlComp1) > 0 ? "nível " + (N(lvlComp1) | 0) + ": " + FormataPct(danoComp1, 0) + " do seu dano" : "não comprado"],
            ["Companheiro 2 — gold", N(lvlComp2) > 0 ? "nível " + (N(lvlComp2) | 0) + ": " + FormatGold(goldCompanheiro) + "/s (" + (25 + 10 * (N(lvlComp2) - 1)) + "% do gold de um inimigo)" : "não comprado"],
            ["Companheiro 3 — Mago do Relógio", N(lvlComp3) > 0 ? "nível " + (N(lvlComp3) | 0) + ": +" + (PctCargaMago() * 100).toFixed(0) + "% de uma skill a cada 5s" : "não comprado"],
            ["Companheiro 4 — Alquimista", N(lvlComp4) > 0 ? "nível " + (N(lvlComp4) | 0) + ": " + buffAlqTxt : "não comprado"],
            ["Companheiro 5 — Assassino", N(lvlComp5) > 0 ? "nível " + (N(lvlComp5) | 0) + ": " + PctTexto(ChanceMorteAssassino(true)) + " de morte instantânea (" + PctTexto(ChanceMorteAssassino(false)) + " em automáticos)" : "não comprado"],
            ["Companheiro 6 — Explorador", N(lvlComp6) > 0 ? "nível " + (N(lvlComp6) | 0) + ": " + Math.min(50, 5 + 2 * Math.max(0, N(lvlComp6) - 1)) + "% de avançar +1 andar" : "não comprado"],
            // Conhecimento Mug que vale no reset — recalculado na hora em que
            // o painel abre (base da loja/marcos × resets curtos)
            ["Multiplicador CM", "×" + FormataMultCM()],
            // itens da build: por run (zeram no reset); desbloqueio no andar 100
			["Itens da build", Tapeira.ItensBuild.desbloqueada()
				? ((Tapeira.ItensBuild.contagem() > 0
					? Tapeira.ItensBuild.resumo()
					: "nenhum (baú de itens a cada 10 andares)")
					+ (Tapeira.ItensBuild.quantidadeBausPendentes() > 0
						? ` · ${Tapeira.ItensBuild.quantidadeBausPendentes()} baú(s) pendente(s)`
						: ""))
				: "desbloqueia no andar 100"],
            ["Bônus XP", "+" + BonusXPLoja()],
            ["XP por inimigo", (XPPorInimigo() * BonusXPConhecimento()).toFixed(2)],
            // total do bônus do CM: +2% por nível (dobro do +1% original)
            ["Conhecimento gold", "+" + (cmNivelGold * 2) + "%"],
            ["Conhecimento XP", "+" + (cmNivelXp * 2) + "%"],
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

        html += `
            <tr>
                <td colspan="2" class="statusDetalhes">
                    <button type="button" class="btn-Padrao btn-status-dano" onclick="MostraDecomposicaoDano()">
                        Decomposição do dano
                    </button>
                </td>
            </tr>
        `;

        document.getElementById("StatusBody").innerHTML = html;
    },

    toggleStatus() {

        const div = document.getElementById("DivStatus");

        div.style.visibility =
            (div.style.visibility === "hidden")
                ? "visible"
                : "hidden";

        // re-renderiza a cada abertura: senão o painel mostra os valores
        // do momento em que foi montado (compras na loja não apareciam)
        if (div.style.visibility === "visible") {
            this.showStatus();
        }

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

    showModal(titulo, conteudo) {

        let modal = document.getElementById("gameModal");

        if (modal) {
            // visível: nova chamada fecha (toggle). Escondido (fechado com X):
            // remove e recria abaixo, senão a janela nunca reabriria.
            const estavaVisivel = modal.style.display === "flex";
            modal.remove();
            if (estavaVisivel) return;
            modal = null;
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
    }
};



let animacaoAtaqueAtiva = false;

function posicionaAnimacaoPersonagem(animation, player, scale, verticalAnchor) {
    const rect = player.getBoundingClientRect();
    animation.style.left = `${rect.left + rect.width / 2}px`;
    animation.style.top = `${rect.top + rect.height * verticalAnchor}px`;
    animation.style.width = `${rect.width * scale}px`;
    animation.style.height = `${rect.height * scale}px`;
}

function acompanhaTamanhoPersonagem(animation, player, scale, verticalAnchor) {
    const atualizarPosicao = () => posicionaAnimacaoPersonagem(animation, player, scale, verticalAnchor);
    atualizarPosicao();
    window.addEventListener("resize", atualizarPosicao);
    return () => window.removeEventListener("resize", atualizarPosicao);
}

UI.playAttackAnimation = function (inimigoElement) {
    const player = document.querySelector(".player");
    if (!player || animacaoAtaqueAtiva) return;

    animacaoAtaqueAtiva = true;
    player.classList.add("is-attacking-animation");
    const rect = player.getBoundingClientRect();
    const animation = document.createElement("div");
    animation.className = "game-sprite-animation attack-sprite-animation";
    animation.setAttribute("aria-hidden", "true");
    const pararAcompanharTamanho = acompanhaTamanhoPersonagem(animation, player, 1, 0.52);

    let faceRight = true; // padrão: player olha para direita
    if (inimigoElement) {
        const inimigoRect = inimigoElement.getBoundingClientRect();
        const playerCenterX = rect.left + rect.width / 2;
        const inimigoCenterX = inimigoRect.left + inimigoRect.width / 2;
        faceRight = inimigoCenterX > playerCenterX;
    }

    if (!faceRight) animation.classList.add("is-facing-left");

    const frames = document.createElement("img");
    frames.className = "attack-sprite-frame";
    frames.dataset.frame = "1";
    frames.alt = "";
    frames.src = "imagens/ataque/frames/ataque-1.png";
    animation.appendChild(frames);
    document.body.appendChild(animation);

    let concluded = false;
    let currentFrame = 1;
    const frameTimer = setInterval(() => {
        currentFrame++;
        if (currentFrame <= 6) {
            frames.dataset.frame = String(currentFrame);
            frames.src = `imagens/ataque/frames/ataque-${currentFrame}.png`;
        }
    }, 108); // 650ms / 6 frames ≈ 108ms per frame

    const finish = () => {
        if (concluded) return;
        concluded = true;
        clearInterval(frameTimer);
        pararAcompanharTamanho();
        animation.remove();
        animacaoAtaqueAtiva = false;
        player.classList.remove("is-attacking-animation");
    };
    setTimeout(finish, 650);
};

UI.playEscapeAnimation = function () {
    const player = document.querySelector(".player");
    if (!player) return Promise.resolve();

    const animation = document.createElement("div");
    animation.className = "game-sprite-animation escape-sprite-animation";
    animation.setAttribute("aria-hidden", "true");
    const pararAcompanharTamanho = acompanhaTamanhoPersonagem(animation, player, 1.25, 0.48);
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
            if (currentFrame <= 8) frames.src = `imagens/fugindo/frames/fuga-${currentFrame}.png`;
        }, 180);
        const finish = () => {
            if (concluded) return;
            concluded = true;
            clearInterval(frameTimer);
            pararAcompanharTamanho();
            animation.remove();
            player.classList.remove("is-escaping");
            resolve();
        };
        animation.addEventListener("animationend", finish, { once: true });
        setTimeout(finish, 1440);
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

// botões "Logs" (fim do menu de configuração) e "Ver itens da build"
// (painel Status): delegados no document para não depender do momento em
// que o DOM desses painéis é montado
document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest("#btnLogs")) {
        UI.showLogs();
        return;
    }
    if (e.target.closest("#btnVerItensBuild")) {
        UI.showItensBuild();
    }
});

function MostraStatus() {
    UI.showStatus();
}

function SobeStatus() {
    UI.toggleStatus();
}

function RemoverInimigos() {
    LimpaEfeitosMorte();
    UI.removeAllEnemies();
}

function CriarInimigos() {
    // carimbo de onda: eventos (chuva de meteoros) usam pra detectar que a
    // tela mudou no meio de um hit e parar de bater os alvos da onda antiga
    window.ondaAtual = (window.ondaAtual || 0) + 1;

    UI.spawnEnemies();
}
