// ui.js
// Responsável apenas pela renderização da interface (DOM)

// Ícones dos nós raízes da árvore de habilidades (assets já existentes no jogo)
const ICONE_SKILL = {
	damage: "imagens/skills/skill-damage.svg",
	electric: "imagens/skills/skill-electric.svg",
	gold: "imagens/skills/skill-gold.svg",
	escape: "imagens/skills/skill-escape.svg",
	frenzy: "imagens/skills/skill-frenzy.svg"
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
        const elTotalAbatidos = document.getElementById("contDerrotados");
        if (elTotalAbatidos) elTotalAbatidos.innerHTML = totalDerrotados;
        document.getElementById("contAndar").innerHTML = andar;
        document.getElementById("contGold").innerHTML = FormatGold(gold);
        document.getElementById("contEmeraldas").innerHTML = esmeraldas;
        AtualizaHUDConhecimento();
        document.getElementById("contTempo").innerHTML = FormataTempoFuga(tempoAvancoInimigos);
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
        // preferência "Anúncios de marco" desligada suprime os avisos
        if (window.Tapeira?.Config && !window.Tapeira.Config.ativo("anunciosMarco")) return;
        const texto = message ? `${title} — ${message}` : title;
        this.logAviso("marco", texto);
    },

    // Escreve uma linha no log de avisos (#logAvisos, canto inferior esquerdo)
    // e no histórico (Tapeira.Logs, que alimenta a tela "Logs"). O `tipo` define
    // a cor: marco | bau | gold | skills | info. Não é chat — só leitura.
    logAviso(tipo, texto) {
        const limpo = typeof texto === "string" ? texto.trim() : "";
        if (!limpo) return;
        window.Tapeira?.Logs?.adiciona?.(limpo);

        const log = document.getElementById("logAvisos");
        const corpo = document.getElementById("logAvisosCorpo");
        if (!log || !corpo) return; // menu não tem o log

        const linha = document.createElement("div");
        linha.className = "log-avisos__linha log-avisos__linha--" + (tipo || "info");
        const hora = document.createElement("span");
        hora.className = "log-avisos__hora";
        hora.textContent = new Date().toTimeString().slice(0, 5);
        const txt = document.createElement("span");
        txt.className = "log-avisos__txt";
        txt.textContent = limpo;
        linha.append(hora, txt);
        corpo.appendChild(linha);

        // mantém só as últimas linhas (o topo some no fade da máscara)
        const LIMITE = 8;
        while (corpo.children.length > LIMITE) corpo.removeChild(corpo.firstElementChild);

        log.hidden = false;
        corpo.scrollTop = corpo.scrollHeight;
    },

    limpaLogAvisos() {
        const log = document.getElementById("logAvisos");
        const corpo = document.getElementById("logAvisosCorpo");
        if (corpo) corpo.replaceChildren();
        if (log) log.hidden = true;
    },

    toggleLogAvisos() {
        const log = document.getElementById("logAvisos");
        if (!log) return;
        const recolhido = log.classList.toggle("log-avisos--recolhido");
        document.getElementById("logAvisosCabeca")?.setAttribute("aria-expanded", String(!recolhido));
    },

    transicaoAndarTimeout: null,
    guardiaoIntroTimeout: null,
    guardiaoAlvoTimeout: null,
    guardiaoAlvoRestoreTimeout: null,
    guardiaoAlvo: null,
    guardiaoAlvoFilter: "",
    guardiaoAlvoTransition: "",

    clearGuardianIntro() {
        clearTimeout(this.guardiaoIntroTimeout);
        clearTimeout(this.guardiaoAlvoTimeout);
        clearTimeout(this.guardiaoAlvoRestoreTimeout);
        this.guardiaoIntroTimeout = null;
        this.guardiaoAlvoTimeout = null;
        this.guardiaoAlvoRestoreTimeout = null;

        if (this.guardiaoAlvo) {
            this.guardiaoAlvo.style.filter = this.guardiaoAlvoFilter;
            this.guardiaoAlvo.style.transition = this.guardiaoAlvoTransition;
            this.guardiaoAlvo.classList.remove("guardiao-intro-alvo");
            this.guardiaoAlvo = null;
        }

        const spotlight = document.getElementById("guardiaoIntroHolofote");
        spotlight?.classList.remove("guardiao-intro-holofote--visivel");
    },

    showFloorTransition(floor) {
        this.clearGuardianIntro();
        clearTimeout(this.transicaoAndarTimeout);
        let transition = document.getElementById("transicaoAndar");
        if (!transition) {
            transition = document.createElement("div");
            transition.id = "transicaoAndar";
            transition.className = "transicao-andar";
            transition.setAttribute("role", "status");
            transition.setAttribute("aria-live", "polite");
            transition.innerHTML = `
                <div class="transicao-andar__emblema">
                    <img class="transicao-andar__escudo" src="imagens/hud/andar-emblema.svg" alt="" aria-hidden="true">
                    <strong class="transicao-andar__numero"></strong>
                </div>
                <span class="transicao-andar__legenda"></span>
            `;
            document.body.appendChild(transition);
        }

        const bossFloor = floor % 10 === 0;
        transition.classList.toggle("transicao-andar--guardiao", bossFloor);
        const escudo = transition.querySelector(".transicao-andar__escudo");
        if (escudo) {
            escudo.src = bossFloor
                ? "imagens/hud/andar-emblema-boss.svg"
                : "imagens/hud/andar-emblema.svg";
        }
        transition.querySelector(".transicao-andar__legenda").textContent =
            bossFloor ? "Um guardião bloqueia o caminho" : "Descendo mais fundo";
        transition.querySelector(".transicao-andar__numero").textContent =
            String(floor);

        transition.classList.remove("transicao-andar--visivel");
        void transition.offsetWidth;
        transition.classList.add("transicao-andar--visivel");
        clearTimeout(this.transicaoAndarTimeout);
        this.transicaoAndarTimeout = setTimeout(() => {
            transition.classList.remove("transicao-andar--visivel");
        }, bossFloor ? 2800 : 1500);

        if (bossFloor) {
            // "rugido" do guardião: tremor curto na cena (só visual; sai no animationend)
            const raiz = document.documentElement;
            raiz.classList.remove("guardiao-tremor");
            void raiz.offsetWidth;
            raiz.classList.add("guardiao-tremor");
            raiz.addEventListener("animationend", () => raiz.classList.remove("guardiao-tremor"), { once: true });

            let spotlight = document.getElementById("guardiaoIntroHolofote");
            if (!spotlight) {
                spotlight = document.createElement("div");
                spotlight.id = "guardiaoIntroHolofote";
                spotlight.className = "guardiao-intro-holofote";
                spotlight.setAttribute("aria-hidden", "true");
                document.body.appendChild(spotlight);
            }

            spotlight.style.setProperty("--guardian-focus-x", "50%");
            spotlight.style.setProperty("--guardian-focus-y", "50%");
            void spotlight.offsetWidth;
            spotlight.classList.add("guardiao-intro-holofote--visivel");
            this.guardiaoIntroTimeout = setTimeout(() => {
                spotlight.classList.remove("guardiao-intro-holofote--visivel");
                this.guardiaoIntroTimeout = null;
            }, 2800);

            this.guardiaoAlvoTimeout = setTimeout(() => {
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
                this.guardiaoAlvo = target;
                this.guardiaoAlvoFilter = target.style.filter;
                this.guardiaoAlvoTransition = target.style.transition;
                target.style.transition = "filter 240ms ease-out";
                target.style.filter = `${getComputedStyle(target).filter} drop-shadow(0 0 20px rgba(255, 220, 153, 0.98))`;
                target.classList.add("guardiao-intro-alvo");
                this.guardiaoAlvoRestoreTimeout = setTimeout(() => {
                    if (this.guardiaoAlvo !== target) return;
                    target.style.filter = this.guardiaoAlvoFilter;
                    target.style.transition = this.guardiaoAlvoTransition;
                    target.classList.remove("guardiao-intro-alvo");
                    this.guardiaoAlvo = null;
                    this.guardiaoAlvoRestoreTimeout = null;
                }, 1900);
            }, 650);
        }
        TocaSomSintetico(bossFloor ? "guardiao" : "andar");

        const floorCounter = document.getElementById("contAndar");
        floorCounter?.classList.remove("contador-andar--mudou");
        if (floorCounter) {
            void floorCounter.offsetWidth;
            floorCounter.classList.add("contador-andar--mudou");
            setTimeout(() => floorCounter.classList.remove("contador-andar--mudou"), 650);
        }
    },

    syncScreenButtons() {
        const states = [
            ["btnStatus", document.getElementById("DivStatus")?.style.visibility === "visible"],
            ["btn-Loja", ["Loja", "LojaEsm", "LojaCM"].some(id =>
                document.getElementById(id)?.style.visibility === "visible"
            )],
            ["btnSkills", !!document.getElementById("feitosModal")],
            ["btnRamos", !!document.getElementById("ramosTreeModal")],
            ["btnCidade", document.getElementById("container-Cidade")?.hidden === false]
        ];

        states.forEach(([id, isOpen]) => {
            const button = document.getElementById(id);
            if (!button) return;
            button.classList.toggle("is-active", isOpen);
            button.setAttribute("aria-expanded", String(isOpen));
        });

        // Painel de HUD aberto (Status/Loja/Config) sobe o contexto do
        // #container-opcoes: acima das habilidades de combate (z 15) e dos
        // efeitos de dano/vida (z 7-8), mas ABAIXO dos overlays de verdade
        // (itens da build z 40, info z 30, modais). Sem mexer no HTML.
        const painelAberto = ["DivStatus", "Loja", "LojaEsm", "LojaCM", "container-SalvaCarrega"]
            .some(id => document.getElementById(id)?.style.visibility === "visible");
        document.getElementById("game-root")?.classList.toggle("hud-painel-aberto", painelAberto);

        // Feitos/Ramos são overlays de TELA CHEIA (z 1000000): o fundo escuro
        // do overlay cobriria a fileira de botões. Como na loja, a navegação
        // sobe acima do FUNDO do overlay — o painel termina acima dela, então
        // nada do painel é encoberto e os botões continuam visíveis/clicáveis.
        const overlayNav = !!document.getElementById("feitosModal")
            || !!document.getElementById("ramosTreeModal");
        document.getElementById("game-root")?.classList.toggle("hud-overlay-nav", overlayNav);
    },

    updateSkillProgress() {
        const level = document.getElementById("skill-player-level");
        const points = document.getElementById("skill-player-points");
        const progress = document.getElementById("skill-player-xp");
        const fill = document.getElementById("skill-player-xp-fill");
        const button = document.getElementById("btnRamos");
        const badge = document.getElementById("skill-point-badge");
        const nextLevelXP = XPNecessarioProximoNivel();
        const percent = Math.max(0, Math.min(100, xpAtual * 100 / nextLevelXP));

        if (level) level.textContent = `Nível ${nivelJogador}`;
        if (points) {
            // Com todas as skills no máximo, o recurso vira "Tickets de Caçador
            // de Mugs" (permanente, pra Cidade) em vez de pontos de habilidade.
            points.textContent = TodasSkillsNoMaximo()
                ? `${ticketsMug} ${ticketsMug === 1 ? "ticket" : "tickets"} de caçador de mugs`
                : `${pontosHabilidade} ${pontosHabilidade === 1 ? "ponto" : "pontos"} de habilidade`;
        }
        if (progress) {
            progress.setAttribute("aria-valuenow", String(Math.min(xpAtual, nextLevelXP)));
            progress.setAttribute("aria-valuemax", String(nextLevelXP));
            progress.setAttribute("aria-valuetext", `${xpAtual} de ${nextLevelXP} XP`);
        }
        if (fill) fill.style.width = `${percent}%`;
        const xpLabel = document.getElementById("skill-player-xp-label");
        if (xpLabel) xpLabel.textContent = `${xpAtual} / ${nextLevelXP} XP para o próximo nível`;
        const niveis = Math.max(0, nivelJogador - 1);
        const reducao = BonusQuotaTotal();
        const bonus = document.getElementById("skill-player-bonus");
        if (bonus) {
            bonus.textContent = `Bônus atual: +${niveis * DANO_POR_NIVEL_PCT}% de dano · −${reducao} ${reducao === 1 ? "inimigo" : "inimigos"} para avançar`;
        }
        // resumo da seção "Progresso e bônus" quando ela está recolhida
        const resumoProgresso = document.getElementById("skill-player-progresso-resumo");
        if (resumoProgresso) {
            const pontosPerk = PontosPerkDisponiveis();
            const texto = `+${niveis * DANO_POR_NIVEL_PCT}% dano · ${reducao} ${reducao === 1 ? "inimigo" : "inimigos"} a menos · ${pontosPerk} ${pontosPerk === 1 ? "ponto" : "pontos"} de perk`;
            if (resumoProgresso.textContent !== texto) resumoProgresso.textContent = texto;
        }
        // A notificação soma os perks e para de contar pontos de habilidade
        // quando todas as skills já estão no máximo (não há mais o que subir).
        const pontosNotificados = PontosNotificadosRamos();
        if (button) button.setAttribute("aria-label", `Ramos, nível ${nivelJogador}, ${pontosNotificados} pontos disponíveis`);
        if (badge) {
            badge.textContent = String(pontosNotificados);
            badge.hidden = pontosNotificados === 0;
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
                : "Reset livre disponível! +" + FormatCM(derrotadosRun * MultiplicadorCM() * BonusCMPontosSobra()) + " CM")
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
        if (cmRecebido > 0) premios.push(`+${FormatCM(cmRecebido)} Conhecimento Mug`);
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
        AtualizaHUDConhecimento();
        document.getElementById("contTempo").innerHTML = FormataTempoFuga(tempoAvancoInimigos);
        this.updateMission();
    },

    // =========================
    // MENSAGENS
    // =========================

    // Aviso rápido na tela (toast): aparece no topo, some sozinho no fim
    // da animação (sem timer novo) e também registra no histórico (Logs).
    // Serve onde uma linha só no histórico passaria despercebida (ex.:
    // import de cartão de batalha já usado com o menu de pausa aberto).
    mostraAvisoRapido(texto) {
        const limpo = typeof texto === "string" ? texto.trim() : "";
        if (!limpo) return;
        window.Tapeira?.Logs?.adiciona?.(limpo);
        document.querySelectorAll(".aviso-rapido").forEach(el => el.remove());
        const div = document.createElement("div");
        div.className = "aviso-rapido";
        div.setAttribute("role", "status");
        div.textContent = limpo;
        div.addEventListener("animationend", () => div.remove(), { once: true });
        document.body.appendChild(div);
    },
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
        // marcador: o CSS da opção "Registros transparentes" age neste
        // modal (o painel "Registro" da arena segue só a classe do <html>)
        document.getElementById("gameModal")?.classList.add("gameModal--logs");

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
        // dano real aplicado no inimigo = base × formigas × nível × itens da
        // build × especialização (os itens entram como no Bater: Adaga no dano,
        // Poção Rubra no crítico, Colar no companheiro)
        const multItensDano = Tapeira.ItensBuild.multDano();
        const multDanoTotal = MultiplicadorDanoFormigas() * MultiplicadorDanoNivel() * multItensDano;
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
            ["Dano", FormatarGold(danoJogador * multDanoTotal * multEspNormal)
                + (especializacao === 5
                    ? " → " + FormatarGold(danoJogador * multDanoTotal * 2.5) + " no cap"
                    : "")],
            // Total abatidos: saiu da faixa de HUD e mora no painel Status
            ["Total abatidos", totalDerrotados],
            ["Multiplicador Gold", FormatarGold(mulGold)],
            ["Gold por inimigo", FormatGold(andar * mulGold * MultiplicadorGoldConhecimento() * MultiplicadorGoldFormigas() * MultiplicadorGoldEspecializacao())],
            ["Gold total", FormatGold(totalGold)],
            ["Bonus avanço", FormatGold(BonusGoldAvanco())],
            ["Chance avanço", (avanco * 100).toFixed(2) + "%"],
            ["Qtd avanço", qtdAvanco],
            ["Dano crítico", FormatarGold(danoCritJogador * Tapeira.ItensBuild.multDanoCrit() * multDanoTotal * multEspCritico)],
            ["Chance crítica", (chanceCrit * 100).toFixed(2) + "%"],
            ["Especialização", especializacao > 0 ? ESPECIALIZACOES[especializacao].nome : "—"],
            // DPS de verdade: a Velocidade do Companheiro multiplica os hits/s
            ["DPS companheiros", FormatarGold(danoComp * Tapeira.ItensBuild.multDanoComp() * multDanoTotal * multEspNormal * N(velAtaqueComp))],
            // Companheiros: nível + efeito vigente de cada um (loja de esmeraldas)
            ["Companheiro 1 — dano", N(lvlComp1) > 0 ? "nível " + (N(lvlComp1) | 0) + ": " + FormataPct(danoComp1, 0) + " do seu dano" : "não comprado"],
            ["Companheiro 2 — gold", N(lvlComp2) > 0 ? "nível " + (N(lvlComp2) | 0) + ": " + FormatGold(goldCompanheiro) + "/s (" + (25 + 10 * (N(lvlComp2) - 1)) + "% do gold de um inimigo)" : "não comprado"],
            ["Companheiro 3 — Mago do Relógio", N(lvlComp3) > 0 ? "nível " + (N(lvlComp3) | 0) + ": +" + (PctCargaMago() * 100).toFixed(0) + "% de uma skill a cada 5s · ao encher a Pausa da fuga, ela liga sozinha (+50%)" : "não comprado"],
            ["Companheiro 4 — Alquimista", N(lvlComp4) > 0 ? "nível " + (N(lvlComp4) | 0) + ": " + buffAlqTxt : "não comprado"],
            ["Companheiro 5 — Assassino", N(lvlComp5) > 0 ? "nível " + (N(lvlComp5) | 0) + ": " + PctTexto(ChanceMorteAssassino(true)) + " de morte instantânea (" + PctTexto(ChanceMorteAssassino(false)) + " em automáticos) · veneno: " + PctTexto(CHANCE_VENENO_ASSASSINO) + " de tirar " + PctTexto(VENENO_ASSASSINO_PCT) + " da vida" : "não comprado"],
            ["Companheiro 6 — Explorador", N(lvlComp6) > 0 ? "nível " + (N(lvlComp6) | 0) + ": " + PctTexto(ChanceExplorador()) + " de avançar " + TextoAndaresExplorador(lvlComp6) : "não comprado"],
            // Conhecimento Mug que vale no reset — recalculado na hora em que
            // o painel abre (base da loja/marcos × resets curtos)
            ["Multiplicador CM", "×" + FormataMultCM()],
            // itens da build: por run (zeram no reset); desbloqueio no andar 100
			["Itens da build", Tapeira.ItensBuild.desbloqueada()
				? ((Tapeira.ItensBuild.contagem() > 0
					? Tapeira.ItensBuild.resumo()
					: "nenhum (baú de itens a cada 5 andares)")
					+ (Tapeira.ItensBuild.quantidadeBausPendentes() > 0
						? ` · ${Tapeira.ItensBuild.quantidadeBausPendentes()} baú(s) pendente(s)`
						: ""))
				: "desbloqueia no andar 100"],
            ["Bônus XP", "+" + BonusXPLoja()],
            ["XP por inimigo", formatNumber(XPPorInimigo() * BonusXPConhecimento())],
            // total do bônus do CM: +5% por nível
            ["Conhecimento gold", "+" + (cmNivelGold * 5) + "%"],
            ["Conhecimento XP", "+" + (cmNivelXp * 5) + "%"],
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
                    <button type="button" class="btn-Padrao btn-status-dano" data-status-dano>
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
            // abre Status: fecha as outras telas de navegação (item 2)
            FechaTelasNavegacao("status");
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

                <div class="infoSecao">Objetivo</div>

                <div class="infoLinha">
                    Destrua os cogumelos para ganhar <b>gold</b> e subir de andar. A cada 10 andares um <b>guardião</b> bloqueia o caminho.
                </div>

                <div class="infoSecao">Atacar</div>

                <div class="infoLinha">
                    <b>No PC:</b> segure <b>Espaço</b> — ou clique/segure em qualquer lugar da cena.
                </div>

                <div class="infoLinha">
                    <b>No celular:</b> toque em qualquer lugar da tela para dar um golpe; <b>segure</b> para atacar sem parar.
                </div>

                <div class="infoLinha">
                    Os golpes vão sempre no inimigo de <b>número maior</b> (o mais forte da tela).
                </div>

                <div class="infoSecao">Telas e atalhos</div>

                <div class="infoLinha">
                    <b>Loja</b> (L) — itens comprados com gold · <b>Status</b> (S) — dano, itens e habilidades.
                </div>

                <div class="infoLinha">
                    <b>Feitos</b> (C) — conquistas e bônus permanentes · <b>Missões</b> (M) · <b>Ramos</b> — árvore de habilidades.
                </div>

                <div class="infoLinha">
                    <b>Cidade</b> — hub de progresso permanente, destrava a partir do andar 80.
                </div>

                <div class="infoLinha">
                    <b>ESC</b> ou <b>P</b> — pausa (salvar, carregar, volumes, sair) · <b>I</b> — esta tela.
                </div>

                <div class="infoLinha">
                    No celular, as telas ficam nos <b>botões do rodapé</b>.
                </div>

                <div class="infoLinha destaqueInfo">
                    Dica: ao chegar no andar ${andarVolta},
                    clique em "Voltar Andar" para ganhar esmeraldas.
                </div>

            </div>

            <button
                class="btn-FecharModal"
                data-info-fechar>

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

            document.getElementById("gameModalClose").addEventListener("click", () => {
                this.closeModal();
            });

            // fecha clicando fora
            modal.addEventListener("click", (e) => {

                if (e.target.id === "gameModal") {
                    this.closeModal();
                }
            });
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

// =========================
// NAVEGAÇÃO ENTRE TELAS (item 2)
// =========================
// Fecha as OUTRAS telas de navegação quando uma abre. Os overlays de tela
// cheia (Feitos/Ramos/Cidade) e os painéis flutuantes (Status/Loja) não se
// misturam — é a fileira de navegação que manda: sem isto, abrir a Loja com
// Ramos/Feitos abertos deixava a Loja escondida atrás do fundo do overlay (e o
// clique seguinte fechava a seção errada). O painel de Configuração NÃO entra
// aqui (ele pode coexistir com o Status em telas largas). Vale em desktop,
// notebook e Android. `exceto` é a tela que está sendo aberta e NÃO deve fechar.
function FechaTelasNavegacao(exceto) {
    const fechar = {
        status: () => {
            const el = document.getElementById("DivStatus");
            if (el) el.style.visibility = "hidden";
        },
        loja: () => {
            ["Loja", "LojaEsm", "LojaCM"].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.style.visibility = "hidden";
            });
        },
        skills: () => document.getElementById("skillUpgradeModal")?.remove(),
        feitos: () => document.getElementById("feitosModal")?.remove(),
        ramos: () => document.getElementById("ramosTreeModal")?.remove(),
        cidade: () => {
            if (document.getElementById("container-Cidade")?.hidden === false) {
                window.Tapeira?.Cidade?.fechar?.();
            }
        }
    };
    for (const chave in fechar) {
        if (chave !== exceto) fechar[chave]();
    }
    UI.syncScreenButtons();
}

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

// Ataque: em vez de esconder o player e tocar a sprite de espadada (por hora
// desativada), um RISCO (faixa) parte do player até o inimigo acertado com um
// splash no impacto, e o player dá uma leve "investida" (squash) sugerindo o
// movimento. Mesma API do antigo (batalha.js e dev-tools seguem iguais).
const DURACAO_ATAQUE_MS = 220;
UI.playAttackAnimation = function (inimigoElement) {
    const player = document.querySelector(".player");
    if (!player || animacaoAtaqueAtiva) return;
    animacaoAtaqueAtiva = true;

    const rect = player.getBoundingClientRect();
    // ponto de partida no centro do corpo (dali sai o "golpe")
    const pcx = rect.left + rect.width * 0.5;
    const pcy = rect.top + rect.height * 0.5;

    let ex = pcx + rect.width * 0.6; // sem alvo: ataca pra frente
    let ey = pcy;
    if (inimigoElement) {
        const r = inimigoElement.getBoundingClientRect();
        ex = r.left + r.width / 2;
        ey = r.top + r.height * 0.5;
    }
    const dx = ex - pcx;
    const dy = ey - pcy;
    const dist = Math.max(28, Math.hypot(dx, dy));
    const ang = Math.atan2(dy, dx) * 180 / Math.PI;
    const paraDireita = dx >= 0;

    // 1) investida do player (distorção leve na direção do golpe)
    const avanco = Math.min(16, dist * 0.08).toFixed(1);
    player.style.setProperty("--investida-x", (paraDireita ? 1 : -1) * avanco + "px");
    player.classList.remove("player--atacando");
    void player.offsetWidth;
    player.classList.add("player--atacando");

    // 2) corte: uma MEIA LUA (lado curvo na frente) voa do player até o inimigo
    const corte = document.createElement("div");
    corte.className = "ataque-corte";
    corte.setAttribute("aria-hidden", "true");
    corte.style.left = pcx + "px";
    corte.style.top = pcy + "px";
    corte.style.transform = `translate(-50%, -50%) rotate(${ang}deg)`;
    corte.style.setProperty("--corte-varre", Math.max(30, dist - 24) + "px");
    const lua = document.createElement("span");
    lua.className = "ataque-corte__lua";
    corte.appendChild(lua);
    document.body.appendChild(corte);

    // 3) sopro no impacto (na posição do inimigo), alinhado à direção do golpe
    const splash = document.createElement("div");
    splash.className = "ataque-splash";
    splash.setAttribute("aria-hidden", "true");
    splash.style.left = ex + "px";
    splash.style.top = ey + "px";
    splash.style.setProperty("--sopro-ang", ang + "deg");
    document.body.appendChild(splash);

    // faíscas: partículas saindo em leque no impacto (estilo "fruit ninja")
    const faiscas = [];
    for (let i = 0; i < 6; i++) {
        const f = document.createElement("span");
        f.className = "ataque-faisca";
        f.setAttribute("aria-hidden", "true");
        const fa = (ang + (Math.random() * 150 - 75)) * Math.PI / 180;
        const fd = 30 + Math.random() * 48;
        f.style.left = ex + "px";
        f.style.top = ey + "px";
        f.style.setProperty("--faisca-x", (Math.cos(fa) * fd).toFixed(1) + "px");
        f.style.setProperty("--faisca-y", (Math.sin(fa) * fd).toFixed(1) + "px");
        document.body.appendChild(f);
        faiscas.push(f);
    }

    let concluiu = false;
    const fim = () => {
        if (concluiu) return;
        concluiu = true;
        corte.remove();
        splash.remove();
        faiscas.forEach(f => f.remove());
        player.classList.remove("player--atacando");
        animacaoAtaqueAtiva = false;
    };
    splash.addEventListener("animationend", fim, { once: true });
    setTimeout(fim, DURACAO_ATAQUE_MS + 200); // fallback (reduced-motion/aba em 2º plano)
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
    frames.src = "imagens/animacoes/fugindo/frames/fuga-1.png";
    animation.appendChild(frames);
    player.classList.add("is-escaping");
    document.body.appendChild(animation);

    return new Promise(resolve => {
        let concluded = false;
        let currentFrame = 1;
        const frameTimer = setInterval(() => {
            currentFrame++;
            if (currentFrame <= 8) frames.src = `imagens/animacoes/fugindo/frames/fuga-${currentFrame}.png`;
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

// Ações de clique delegadas no document: "Logs" (fim do menu de
// configuração), "Ver itens da build" (painel Status) e os botões de
// navegação lateral (Status, Loja, Config, Formigas e Skills). Delegar
// evita depender do momento em que cada painel é montado.
document.addEventListener("click", (e) => {
    if (!(e.target instanceof Element)) return;
    if (e.target.closest("#btnLogs")) {
        UI.showLogs();
        return;
    }
    if (e.target.closest("#btnVerItensBuild")) {
        UI.showItensBuild();
    }
    if (e.target.closest("#btnStatus")) {
        SobeStatus();
        return;
    }
    if (e.target.closest("#btn-Loja")) {
        AbreLoja(true);
        return;
    }
    if (e.target.closest("#btnSkills")) {
        UI.toggleFeitosPanel();
        return;
    }
    if (e.target.closest("#btnRamos")) {
        UI.toggleRamosTreePanel();
        return;
    }
    if (e.target.closest("[data-status-dano]")) {
        MostraDecomposicaoDano();
        return;
    }
    if (e.target.closest("[data-info-fechar]")) {
        UI.toggleInfoModal();
        return;
    }
});

// Clicar/tocar NA CENA fecha o painel aberto pelos botões da #container-Botoes
// (Status, Loja, Feitos, Ramos e Cidade). A "cena" é exatamente a área que dá
// golpe no toque: `SELETOR_SEM_ATAQUE` (keymap.js) exclui controles, painéis e
// modais, então só o clique fora deles cai aqui. Na prática isso age sobre os
// painéis flutuantes (Status, Loja): Feitos/Ramos e Cidade cobrem a tela — os
// dois primeiros fecham no próprio overlay e a Cidade não tem "fora" — então
// entram na lista como rede de segurança.
function PaineisNavAbertos() {
    const abertos = [];
    const visivel = id => document.getElementById(id)?.style.visibility === "visible";
    if (visivel("DivStatus")) abertos.push(() => UI.toggleStatus());
    if (["Loja", "LojaEsm", "LojaCM"].some(visivel)) abertos.push(() => FechaLoja());
    if (document.getElementById("feitosModal")) abertos.push(() => UI.fechaFeitosPanel());
    if (document.getElementById("ramosTreeModal")) abertos.push(() => UI.toggleRamosTreePanel());
    if (document.getElementById("container-Cidade")?.hidden === false) {
        abertos.push(() => window.Tapeira?.Cidade?.fechar?.());
    }
    return abertos;
}

// Capture para rodar antes do ataque (keymap.js, pointerdown em bolha): o
// mesmo toque que fecha o painel não vira golpe. Cliques em controles/painéis/
// modais param em `SELETOR_SEM_ATAQUE` e seguem o fluxo normal.
document.addEventListener("pointerdown", (evt) => {
    if (!(evt.target instanceof Element)) return;
    if (evt.target.closest(SELETOR_SEM_ATAQUE)) return;
    const abertos = PaineisNavAbertos();
    if (!abertos.length) return;
    evt.stopPropagation();
    evt.preventDefault();
    for (const fechar of abertos) fechar();
    UI.syncScreenButtons();
}, true);

function MostraStatus() {
    UI.showStatus();
}

// Saldo de Conhecimento Mug no HUD (#container-GoldEsmeraldas, terceira
// fileira). Fica numa função única para o saldo não ficar velho: quem mexe em
// conhecimentoMug (loja, casa, eventos, reset, load) chama daqui, além do
// UI.render()/UI.updateResources().
function AtualizaHUDConhecimento() {
    const el = document.getElementById("contConhecimento");
    if (el) el.innerHTML = FormatCM(conhecimentoMug);
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
