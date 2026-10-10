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

    skillPanelAberta(chave, padrao) {
        if (!(chave in this.skillPanelSecoes)) this.skillPanelSecoes[chave] = !!padrao;
        return this.skillPanelSecoes[chave];
    },

    alternaSecaoSkill(chave, abrir) {
        this.skillPanelSecoes[chave] = abrir;
        this.showSkillUpgradePanel();
    },

    // seção com cabeçalho-botão (aria-expanded/aria-controls) e resumo do
    // conteúdo recolhido — usado em Progresso, Perks e Árvore de ramos
    criaSecaoRecuavelSkill({ chave, titulo, resumo, aberta, destaque, resumoId }) {
        const id = `skill-secao-${chave.replace(/[^a-zA-Z0-9]+/g, "-")}`;
        const secao = document.createElement("section");
        secao.className = "skill-secao";
        if (destaque) secao.classList.add("skill-secao--destaque");

        const cabecalho = document.createElement("button");
        cabecalho.type = "button";
        cabecalho.className = "skill-secao-cabecalho";
        cabecalho.setAttribute("aria-expanded", String(aberta));
        cabecalho.setAttribute("aria-controls", `${id}-corpo`);
        cabecalho.setAttribute("data-focus-key", `secao:${chave}`);
        const rotulo = document.createElement("span");
        rotulo.className = "skill-secao-titulo";
        rotulo.textContent = titulo;
        const detalhe = document.createElement("span");
        detalhe.className = "skill-secao-resumo";
        detalhe.textContent = resumo;
        if (resumoId) detalhe.id = resumoId;
        const seta = document.createElement("span");
        seta.className = "skill-secao-seta";
        seta.setAttribute("aria-hidden", "true");
        seta.textContent = "▾";
        cabecalho.append(rotulo, detalhe, seta);

        const corpo = document.createElement("div");
        corpo.className = "skill-secao-corpo";
        corpo.id = `${id}-corpo`;
        corpo.hidden = !aberta;
        cabecalho.addEventListener("click", () => this.alternaSecaoSkill(chave, corpo.hidden));
        secao.append(cabecalho, corpo);
        return { secao, corpo };
    },

    showSkillUpgradePanel() {
        // re-renderizações (level-up, compra, perk, ramo, recolher seção) não
        // podem jogar a rolagem pro topo nem tirar o foco do controle ativo:
        // guarda os dois e restaura no painel recém-construído
        const rolagemAnterior =
            document.querySelector("#skillUpgradeModal .skill-upgrade-scroll")?.scrollTop || 0;
        const focoAnterior = document.activeElement instanceof HTMLElement
            ? document.activeElement.dataset.focusKey
            : null;
        document.getElementById("skillUpgradeModal")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "skillUpgradeModal";
        overlay.className = "ant-collection-overlay skill-upgrade-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "skill-upgrade-title");

        // cabeçalho fixo: título e fechar continuam acessíveis mesmo com o
        // conteúdo rolando (o painel inteiro não rola, só .skill-upgrade-scroll)
        const panel = document.createElement("section");
        panel.className = "ant-collection-panel skill-upgrade-panel";
        const header = document.createElement("header");
        header.className = "ant-collection-header";
        const title = document.createElement("h2");
        title.id = "skill-upgrade-title";
        title.textContent = "Árvore de habilidades";
        const close = document.createElement("button");
        close.type = "button";
        close.className = "ant-collection-close";
        close.setAttribute("aria-label", "Fechar habilidades");
        close.setAttribute("data-focus-key", "fechar");
        close.textContent = "×";
        const fechar = () => {
            overlay.remove();
            this.syncScreenButtons();
            document.getElementById("btnSkills")?.focus();
        };
        close.addEventListener("click", fechar);
        header.append(title, close);

        // atalhos no topo do painel para abrir as telas de conquistas, missões e marcos
        const atalhos = document.createElement("div");
        atalhos.className = "skill-upgrade-shortcuts";
        const abreTela = (mostrar) => {
            fechar();
            document.getElementById("gameModal")?.remove();
            mostrar();
        };
        const botaoConquistas = document.createElement("button");
        botaoConquistas.type = "button";
        botaoConquistas.className = "skill-upgrade-shortcut";
        botaoConquistas.textContent = "Conquistas";
        botaoConquistas.setAttribute("aria-label", "Abrir tela de conquistas");
        botaoConquistas.setAttribute("data-focus-key", "atalho:conquistas");
        botaoConquistas.addEventListener("click", () => abreTela(MostraConquista));
        const botaoMissoes = document.createElement("button");
        botaoMissoes.type = "button";
        botaoMissoes.className = "skill-upgrade-shortcut";
        botaoMissoes.textContent = "Missões";
        botaoMissoes.setAttribute("aria-label", "Abrir tela de missões");
        botaoMissoes.setAttribute("data-focus-key", "atalho:missoes");
        botaoMissoes.addEventListener("click", () => abreTela(MostraMissao));
        const botaoMarcos = document.createElement("button");
        botaoMarcos.type = "button";
        botaoMarcos.className = "skill-upgrade-shortcut";
        botaoMarcos.textContent = "Marcos";
        botaoMarcos.setAttribute("aria-label", "Abrir tela de marcos");
        botaoMarcos.setAttribute("data-focus-key", "atalho:marcos");
        botaoMarcos.addEventListener("click", () => abreTela(MostraMarcos));
        atalhos.append(botaoConquistas, botaoMissoes, botaoMarcos);

        // resumo do jogador: nível + pontos em linha compacta (fixo)
        const level = document.createElement("div");
        level.className = "skill-player-summary";
        const levelName = document.createElement("strong");
        levelName.id = "skill-player-level";
        const points = document.createElement("span");
        points.id = "skill-player-points";
        level.append(levelName, points);

        const bonus = document.createElement("div");
        bonus.id = "skill-player-bonus";
        bonus.className = "skill-player-bonus";

        const xpTrack = document.createElement("div");
        xpTrack.id = "skill-player-xp";
        xpTrack.className = "skill-player-xp";
        xpTrack.setAttribute("role", "progressbar");
        xpTrack.setAttribute("aria-label", "Experiência para o próximo nível");
        xpTrack.setAttribute("aria-valuemin", "0");
        xpTrack.setAttribute("aria-describedby", "skill-player-xp-label");
        xpTrack.appendChild(document.createElement("div"));
        xpTrack.firstElementChild.id = "skill-player-xp-fill";
        const xpLabel = document.createElement("span");
        xpLabel.id = "skill-player-xp-label";
        xpLabel.className = "skill-player-xp-label";
        const blocoXp = document.createElement("div");
        blocoXp.className = "skill-player-xp-bloco";
        blocoXp.append(xpTrack, xpLabel);

        // único contêiner de rolagem do painel (cabeçalho/atalhos/resumo ficam fora)
        const rolagem = document.createElement("div");
        rolagem.className = "skill-upgrade-scroll";

        // informações secundárias (bônus e regra de perks) em seção recolhível
        const secaoProgresso = this.criaSecaoRecuavelSkill({
            chave: "progresso:detalhes",
            titulo: "Progresso e bônus",
            resumo: "",
            resumoId: "skill-player-progresso-resumo",
            aberta: this.skillPanelAberta("progresso:detalhes", true)
        });
        const perkLine = document.createElement("div");
        perkLine.id = "skill-player-perk";
        perkLine.className = "skill-player-bonus";
        const perkDisp = PontosPerkDisponiveis();
        const perkGanhos = PontosPerkGanhos();
        perkLine.textContent = `Pontos de perk: ${perkDisp} ${perkDisp === 1 ? "disponível" : "disponíveis"} de ${perkGanhos} · +1 por portão desta run (andar 35+) · zeram no reset`;
        secaoProgresso.corpo.append(bonus, perkLine);

        // ---- árvore de habilidades ----
        // Cada skill é um tronco: nó raiz (a skill), o perk como nó filho e o
        // fork de ramos no nível 5, com dois caminhos lidos na vertical
        // (nó 5 → nó 10). Gastar pontos acontece no nó — mesmas regras
        // (EvoluiSkill/CompraPerk/EscolheRamoSkill), nada de lógica nova aqui.
        const arvore = document.createElement("div");
        arvore.className = "skill-tree";

        for (const skill of SKILLS_UPGRADE) {
            const skillLevel = NivelDaSkill(skill.id);
            const unlocked = PisoMaximoAlcancado() >= skill.pisoDesbloqueio;
            const noMaximo = skillLevel >= skill.maximo;
            const semPontos = pontosHabilidade <= 0;
            const podeMelhorar = unlocked && !noMaximo && !semPontos;
            const icone = ICONE_SKILL[skill.id] || "imagens/espada-habilidade.svg";

            // tronco recolhível: resumo com nível + o que dá para fazer agora
            const resumoTronco = [
                `Nv ${skillLevel}/${skill.maximo}`,
                !unlocked
                    ? `✕ andar ${skill.pisoDesbloqueio}`
                    : noMaximo
                        ? "✓ máximo"
                        : semPontos
                            ? "✕ sem pontos"
                            : "● 1 ponto para subir"
            ].join(" · ");
            const ramoPronto = RamoEscolhido(skill.id) === 0 && unlocked && skillLevel >= RAMO_NIVEL_ESCOLHA;
            const destaqueTronco = podeMelhorar || ramoPronto;
            const tronco = this.criaSecaoRecuavelSkill({
                chave: `skill:${skill.id}`,
                titulo: skill.nome,
                resumo: resumoTronco,
                aberta: this.skillPanelAberta(`skill:${skill.id}`, true),
                destaque: destaqueTronco
            });
            const corpoTronco = tronco.corpo;
            corpoTronco.classList.add("skill-tronco");

            // nó raiz do tronco: a skill. Clicável quando dá para melhorar;
            // travado continua visível com o motivo em texto (nunca só disabled)
            const estadoSkill = !unlocked
                ? { texto: `✕ Desbloqueia no andar ${skill.pisoDesbloqueio}`, classe: "skill-no-estado--bloqueado" }
                : noMaximo
                    ? { texto: "✓ Nível máximo", classe: "skill-no-estado--ok" }
                    : semPontos
                        ? { texto: "✕ Sem pontos de habilidade", classe: "skill-no-estado--bloqueado" }
                        : { texto: "● Pronta para melhorar", classe: "skill-no-estado--ok" };
            const raiz = document.createElement(podeMelhorar ? "button" : "div");
            raiz.className = "skill-no skill-no--raiz"
                + (podeMelhorar
                    ? " skill-no--pronto"
                    : noMaximo
                        ? " skill-no--maximo"
                        : unlocked
                            ? " skill-no--neutro"
                            : " skill-no--travado");
            if (podeMelhorar) {
                raiz.type = "button";
                raiz.setAttribute("data-focus-key", `melhorar:${skill.id}`);
                raiz.addEventListener("click", () => {
                    if (EvoluiSkill(skill.id)) this.showSkillUpgradePanel();
                });
            }

            const iconeEl = document.createElement("img");
            iconeEl.className = "skill-no-icone";
            iconeEl.src = ICONE_SKILL[skill.id] || "imagens/espada-habilidade.svg";
            iconeEl.alt = "";
            iconeEl.setAttribute("aria-hidden", "true");

            const corpoNo = document.createElement("div");
            corpoNo.className = "skill-no-corpo";
            const linhaTopo = document.createElement("div");
            linhaTopo.className = "skill-no-linha";
            const nomeSkill = document.createElement("strong");
            nomeSkill.className = "skill-no-nome";
            nomeSkill.textContent = skill.nome;
            const badgeNivel = document.createElement("span");
            badgeNivel.className = "skill-no-nivel";
            badgeNivel.textContent = `Nv ${skillLevel}/${skill.maximo}`;
            badgeNivel.setAttribute("aria-label", `nível ${skillLevel} de ${skill.maximo}`);
            linhaTopo.append(nomeSkill, badgeNivel);

            const descricao = document.createElement("p");
            descricao.className = "skill-no-desc";
            descricao.textContent = DescricaoEfeitoSkill(skill.id, skillLevel);

            const linhaPe = document.createElement("div");
            linhaPe.className = "skill-no-linha skill-no-pe";
            const estadoEl = document.createElement("span");
            estadoEl.className = `skill-no-estado ${estadoSkill.classe}`;
            estadoEl.textContent = estadoSkill.texto;
            const custoEl = document.createElement("span");
            custoEl.className = "skill-no-custo";
            custoEl.textContent = noMaximo ? "Sem melhoria pendente" : "1 ponto por nível";
            linhaPe.append(estadoEl, custoEl);

            corpoNo.append(linhaTopo, descricao, linhaPe);
            raiz.append(iconeEl, corpoNo);
            raiz.setAttribute("aria-label", podeMelhorar
                ? `Melhorar ${skill.nome} por 1 ponto de habilidade`
                : `${skill.nome}, nível ${skillLevel} de ${skill.maximo} — ${estadoSkill.texto}`);
            corpoTronco.append(raiz);
            const conector = () => {
                const linha = document.createElement("span");
                linha.className = "skill-conector";
                linha.setAttribute("aria-hidden", "true");
                return linha;
            };

            const perk = PERKS.find(item => item.skillId === skill.id);
            if (perk) {
                const perkNivel = Number(window[perk.varName]) || 0;
                const perkNoMaximo = perkNivel >= perk.maximo;
                const semPontoPerk = PontosPerkDisponiveis() <= 0;
                const perkPronto = unlocked && !perkNoMaximo && !semPontoPerk;
                const estadoPerk = !unlocked
                    ? { texto: `✕ Desbloqueia no andar ${skill.pisoDesbloqueio}`, classe: "skill-no-estado--bloqueado" }
                    : perkNoMaximo
                        ? { texto: "✓ Perk no máximo", classe: "skill-no-estado--ok" }
                        : semPontoPerk
                            ? { texto: "✕ Sem pontos de perk", classe: "skill-no-estado--bloqueado" }
                            : { texto: "● Pronto para aplicar", classe: "skill-no-estado--ok" };

                // nó filho: o perk da skill (pontos de perk, não de habilidade)
                const noPerk = document.createElement(perkPronto ? "button" : "div");
                noPerk.className = "skill-no skill-no--perk"
                    + (perkPronto ? " skill-no--pronto" : perkNoMaximo ? " skill-no--maximo" : unlocked ? " skill-no--neutro" : " skill-no--travado");
                if (perkPronto) {
                    noPerk.type = "button";
                    noPerk.setAttribute("data-focus-key", `perk:${skill.id}`);
                    noPerk.addEventListener("click", () => {
                        if (CompraPerk(perk.skillId)) this.showSkillUpgradePanel();
                    });
                }
                const perkGlifo = document.createElement("span");
                perkGlifo.className = "skill-no-glifo";
                perkGlifo.setAttribute("aria-hidden", "true");
                perkGlifo.textContent = "◆";
                const perkCorpo = document.createElement("div");
                perkCorpo.className = "skill-no-corpo";
                const perkTopo = document.createElement("div");
                perkTopo.className = "skill-no-linha";
                const perkNome = document.createElement("strong");
                perkNome.className = "skill-no-nome";
                perkNome.textContent = "Perk";
                const perkBadge = document.createElement("span");
                perkBadge.className = "skill-no-nivel";
                perkBadge.textContent = `Nv ${perkNivel}/${perk.maximo}`;
                perkTopo.append(perkNome, perkBadge);
                const perkEfeito = document.createElement("p");
                perkEfeito.className = "skill-no-desc";
                perkEfeito.textContent = perk.efeito;
                const perkPe = document.createElement("div");
                perkPe.className = "skill-no-linha skill-no-pe";
                const perkEstado = document.createElement("span");
                perkEstado.className = `skill-no-estado ${estadoPerk.classe}`;
                perkEstado.textContent = estadoPerk.texto;
                const perkCusto = document.createElement("span");
                perkCusto.className = "skill-no-custo";
                perkCusto.textContent = perkNoMaximo ? "Sem níveis pendentes" : "1 ponto de perk por nível";
                perkPe.append(perkEstado, perkCusto);
                perkCorpo.append(perkTopo, perkEfeito, perkPe);
                noPerk.append(perkGlifo, perkCorpo);
                noPerk.setAttribute("aria-label", perkPronto
                    ? `Aplicar perk em ${perk.nome} — ${perkNivel}/${perk.maximo} por 1 ponto de perk`
                    : `Perk de ${skill.nome}, ${perkNivel} de ${perk.maximo} — ${estadoPerk.texto}`);
                corpoTronco.append(conector(), noPerk);
            }

            // fork dos ramos no nível 5: dois caminhos, cada um lido na
            // vertical (nó 5 → nó 10). Em telas largas ficam lado a lado.
            const arvoreRamos = RAMOS_SKILL.find(item => item.skillId === skill.id);
            if (arvoreRamos) {
                const escolhido = RamoEscolhido(skill.id);

                const ramificacao = document.createElement("div");
                ramificacao.className = "skill-ramificacao";
                const dica = document.createElement("p");
                dica.className = "skill-ramos-hint";
                dica.textContent = escolhido !== 0
                    ? `Caminho selado: ${arvoreRamos.ramos[escolhido - 1].nome} · zerado no reset`
                    : skillLevel >= RAMO_NIVEL_ESCOLHA && unlocked
                        ? "Escolha um caminho — mutuamente exclusivo nesta run"
                        : unlocked
                            ? `Ramos abrem no nível ${RAMO_NIVEL_ESCOLHA} · zeram no reset`
                            : `Ramos abrem no nível ${RAMO_NIVEL_ESCOLHA} da skill`;
                ramificacao.append(dica);

                const caminhos = document.createElement("div");
                caminhos.className = "skill-caminhos";
                for (const ramo of arvoreRamos.ramos) {
                    const caminho = document.createElement("div");
                    caminho.className = "skill-caminho";
                    if (escolhido !== 0 && escolhido !== ramo.id) caminho.classList.add("skill-caminho--selado");
                    if (escolhido === ramo.id) caminho.classList.add("skill-caminho--ativo");

                    const tituloCaminho = document.createElement("div");
                    tituloCaminho.className = "skill-ramo-cabecalho";
                    const nomeCaminho = document.createElement("span");
                    nomeCaminho.className = "skill-ramo-caminho";
                    nomeCaminho.textContent = ramo.nome;
                    tituloCaminho.append(nomeCaminho);
                    caminho.append(tituloCaminho);

                    // nó 1: a escolha (nível 5) — só é botão quando há escolha
                    const podeEscolher = escolhido === 0 && unlocked && skillLevel >= RAMO_NIVEL_ESCOLHA;
                    const nome1 = document.createElement("span");
                    nome1.className = "skill-ramo-nome";
                    nome1.textContent = `Nv ${RAMO_NIVEL_ESCOLHA}`;
                    const efeito1 = document.createElement("span");
                    efeito1.className = "skill-ramo-efeito";
                    efeito1.textContent = ramo.efeito5;
                    const estado1 = document.createElement("span");
                    estado1.className = "skill-ramo-estado";
                    let no1;
                    let estado1Texto;
                    if (escolhido === ramo.id) {
                        estado1Texto = "✓ escolhido";
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--ativo";
                    } else if (escolhido !== 0) {
                        estado1Texto = "✕ selado";
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--selado";
                    } else if (!unlocked) {
                        estado1Texto = `✕ andar ${skill.pisoDesbloqueio}`;
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--travado";
                    } else if (skillLevel < RAMO_NIVEL_ESCOLHA) {
                        estado1Texto = `✕ nível ${RAMO_NIVEL_ESCOLHA}`;
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--travado";
                    } else {
                        estado1Texto = "● Escolher";
                        no1 = document.createElement("button");
                        no1.type = "button";
                        no1.className = "skill-ramo-no skill-ramo-no--escolhivel";
                        no1.setAttribute("data-focus-key", `ramo:${skill.id}:${ramo.id}`);
                        no1.addEventListener("click", () => {
                            if (EscolheRamoSkill(skill.id, ramo.id)) this.showSkillUpgradePanel();
                        });
                    }
                    estado1.textContent = estado1Texto;
                    no1.append(nome1, efeito1, estado1);
                    no1.setAttribute("aria-label", `${podeEscolher ? "Escolher" : "Caminho"} ${ramo.nome} de ${skill.nome} — ${estado1Texto}`);

                    const seta = document.createElement("span");
                    seta.className = "skill-conector";
                    seta.setAttribute("aria-hidden", "true");

                    // nó 2: conclusão no nível 10 (nunca clicável)
                    const nome2 = document.createElement("span");
                    nome2.className = "skill-ramo-nome";
                    nome2.textContent = `Nv ${RAMO_NIVEL_CONCLUSAO}`;
                    const efeito2 = document.createElement("span");
                    efeito2.className = "skill-ramo-efeito";
                    efeito2.textContent = ramo.efeito10;
                    const estado2 = document.createElement("span");
                    estado2.className = "skill-ramo-estado";
                    const no2 = document.createElement("span");
                    no2.className = "skill-ramo-no";
                    if (escolhido === ramo.id) {
                        if (skillLevel >= RAMO_NIVEL_CONCLUSAO) {
                            no2.classList.add("skill-ramo-no--ativo");
                            estado2.textContent = "✓ ativo";
                        } else {
                            no2.classList.add("skill-ramo-no--pendente");
                            estado2.textContent = `○ falta nível ${RAMO_NIVEL_CONCLUSAO}`;
                        }
                    } else if (escolhido !== 0) {
                        no2.classList.add("skill-ramo-no--selado");
                        estado2.textContent = "✕ selado";
                    } else {
                        no2.classList.add("skill-ramo-no--travado");
                        estado2.textContent = unlocked && skillLevel >= RAMO_NIVEL_ESCOLHA
                            ? "○ após escolher"
                            : `✕ nível ${RAMO_NIVEL_ESCOLHA}`;
                    }
                    no2.setAttribute("aria-label", `Conclusão do caminho ${ramo.nome} — ${estado2.textContent}`);
                    no2.append(nome2, efeito2, estado2);

                    caminho.append(no1, seta, no2);
                    caminhos.append(caminho);
                }
                ramificacao.append(caminhos);
                corpoTronco.append(conector(), ramificacao);
            }
            arvore.appendChild(tronco.secao);
        }

        rolagem.append(secaoProgresso.secao, arvore);

        // Auto-gasto de pontos (andar 55): toggle dentro do painel — gasta na
        // hora cada ponto ganho numa skill aleatória (só níveis; perks e
        // ramos da árvore ficam manuais). Ids batem com a SyncTogglesAutomacao.
        const autoGastoWrap = document.createElement("label");
        autoGastoWrap.className = "auto-toggle skill-auto-gasto";
        autoGastoWrap.id = "autoGastoWrap";
        const autoGastoTexto = document.createElement("span");
        autoGastoTexto.textContent = "auto-gasto de pontos · nível aleatório";
        const autoGastoInput = document.createElement("input");
        autoGastoInput.type = "checkbox";
        autoGastoInput.id = "autoGastoToggle";
        autoGastoInput.setAttribute("aria-label", "Auto-gasto de pontos de habilidade");
        autoGastoInput.addEventListener("change", () => {
            AlternaAutoGasto(autoGastoInput.checked);
            this.showSkillUpgradePanel();
        });
        autoGastoWrap.append(autoGastoTexto, autoGastoInput);

        panel.append(header, atalhos, level, blocoXp, autoGastoWrap, rolagem);
        overlay.appendChild(panel);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) fechar();
        });
        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                fechar();
                return;
            }
            if (event.key !== "Tab") return;
            // foco coerente: Tab circula só entre os controles do modal
            const focaveis = Array.from(overlay.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(el => el.offsetParent !== null);
            if (focaveis.length === 0) return;
            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];
            const atual = document.activeElement;
            if (event.shiftKey && (atual === primeiro || !overlay.contains(atual))) {
                event.preventDefault();
                ultimo.focus();
            } else if (!event.shiftKey && (atual === ultimo || !overlay.contains(atual))) {
                event.preventDefault();
                primeiro.focus();
            }
        });
        document.body.appendChild(overlay);
        // estado travado/marcado do auto-gasto (e re-sync dos outros dois,
        // que só existem fora do painel) — mesmos ids da SyncTogglesAutomacao
        SyncTogglesAutomacao();
        this.updateSkillProgress();
        this.syncScreenButtons();
        // devolve o foco ao controle que originou o re-render (ou ao fechar)
        const alvoFoco = focoAnterior
            ? Array.from(overlay.querySelectorAll("[data-focus-key]"))
                .find(el => el.dataset.focusKey === focoAnterior)
            : null;
        (alvoFoco || close).focus({ preventScroll: true });
        // restaura a rolagem na única área rolável (kill/level-up não sobe a tela)
        rolagem.scrollTop = rolagemAnterior;
    },

    toggleSkillUpgradePanel() {
        if (document.getElementById("skillUpgradeModal")) {
            document.getElementById("skillUpgradeModal").remove();
            this.syncScreenButtons();
            return;
        }
        document.getElementById("antCollectionModal")?.remove();
        this.closeOtherPanels("skills");
        this.showSkillUpgradePanel();
    },

    closeOtherPanels(activePanel) {
        const mobileLayout = window.matchMedia(
            "(max-width: 700px), (min-width: 701px) and (max-width: 900px) and (orientation: portrait), (max-width: 900px) and (max-height: 520px) and (orientation: landscape), (min-width: 1000px) and (max-width: 1500px) and (min-height: 780px) and (max-height: 950px) and (orientation: landscape)"
        ).matches;
        if (!mobileLayout) return;

        if (activePanel !== "status") {
            document.getElementById("DivStatus").style.visibility = "hidden";
        }
        if (activePanel !== "shop") {
            document.getElementById("Loja").style.visibility = "hidden";
            document.getElementById("LojaEsm").style.visibility = "hidden";
            document.getElementById("LojaCM").style.visibility = "hidden";
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

    showAntCollection() {
        document.getElementById("antCollectionModal")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "antCollectionModal";
        overlay.className = "ant-collection-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "ant-collection-title");

        const panel = document.createElement("section");
        panel.className = "ant-collection-panel";

        const header = document.createElement("header");
        header.className = "ant-collection-header";
        const title = document.createElement("h2");
        title.id = "ant-collection-title";
        title.textContent = "Coleção de formigas";
        const close = document.createElement("button");
        close.type = "button";
        close.className = "ant-collection-close";
        close.setAttribute("aria-label", "Fechar coleção");
        close.textContent = "×";
        const fechar = () => {
            overlay.remove();
            this.syncScreenButtons();
            document.getElementById("btn-Formigas")?.focus();
        };
        close.addEventListener("click", fechar);
        header.append(title, close);

        const intro = document.createElement("p");
        intro.className = "ant-collection-intro";
        intro.textContent = FormigasDesbloqueadas()
            ? `Desde que você alcançou o andar 20, inimigos podem deixar uma formiga (${FormataPct(ChanceDropFormiga(), 1).replace(".0%", "%")} por abate), inclusive após o reset. Cada conjunto completo de 5 ativa e acumula seu bônus.`
            : "As formigas começam a aparecer a partir do andar 20. Sua coleção e os bônus desbloqueados são permanentes, inclusive após o reset.";

        const list = document.createElement("div");
        list.className = "ant-collection-list";
        for (const formiga of FORMIGAS) {
            const total = QuantidadeFormigas(formiga.id);
            const sets = Math.floor(total / 5);
            const progress = total % 5;
            const card = document.createElement("article");
            card.className = "ant-collection-card";

            const marker = this.createAntSprite(formiga.cor);
            marker.classList.add("ant-collection-marker");
            const details = document.createElement("div");
            details.className = "ant-collection-details";
            const name = document.createElement("h3");
            name.textContent = `Formigas ${formiga.nome}`;
            const countRow = document.createElement("div");
            countRow.className = "ant-collection-count-row";
            const count = document.createElement("strong");
            count.className = "ant-collection-count";
            count.textContent = String(total);
            count.setAttribute("aria-label", `${total} ${total === 1 ? "formiga coletada" : "formigas coletadas"}`);
            const countLabel = document.createElement("span");
            countLabel.className = "ant-collection-count-label";
            countLabel.textContent = "coletadas";
            const progressLabel = document.createElement("span");
            progressLabel.className = "ant-collection-progress-label";
            progressLabel.textContent = `${progress}/5 no próximo conjunto`;
            const remaining = document.createElement("strong");
            remaining.className = "ant-collection-remaining";
            remaining.textContent = `${5 - progress} para o bônus`;
            remaining.setAttribute("aria-label", `Faltam ${5 - progress} ${5 - progress === 1 ? "formiga" : "formigas"} para o próximo bônus`);
            countRow.append(count, countLabel, progressLabel, remaining);
            const bonus = document.createElement("p");
            bonus.className = "ant-collection-bonus";
            bonus.textContent = this.antBonusDescription(formiga.id, sets);
            details.append(name, countRow, bonus);
            card.append(marker, details);
            list.appendChild(card);
        }

        panel.append(header, intro, list);
        overlay.appendChild(panel);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) {
                fechar();
            }
        });
        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") fechar();
        });
        document.body.appendChild(overlay);
        this.syncScreenButtons();
        close.focus();
    },

    antBonusDescription(id, sets) {
        if (id === "vermelhas") {
            return `Bônus de dano: +${(sets * 5).toFixed(0)}% (${sets} × 5%).`;
        }
        if (id === "amarelas") {
            return `Bônus de ganho de Gold: +${(sets * 5).toFixed(0)}% (${sets} × 5%).`;
        }
        if (id === "marrons") {
            const chanceExtraPontos = (sets * 1).toFixed(0);
            return `Gold recebido dos baús: +${(sets * 2).toFixed(0)}%. Chance de um baú extra por baú encontrado: +${chanceExtraPontos} ponto percentual.`;
        }
        if (id === "pretas") {
            const minutes = Math.floor(LimiteTempoOffline() / 60000);
            return `Limite de progresso offline: ${Math.floor(minutes / 60)}h ${minutes % 60}min (+2 min por conjunto).`;
        }
        return `Limite de baús offline: ${LimiteBausOffline()} (+1 por conjunto).`;
    },

    toggleAntCollection() {
        if (document.getElementById("antCollectionModal")) {
            document.getElementById("antCollectionModal").remove();
            this.syncScreenButtons();
            return;
        }
        document.getElementById("skillUpgradeModal")?.remove();
        this.closeOtherPanels("ants");
        this.showAntCollection();
    },

    showOfflineRewards(rewards, onClaim) {
        const overlay = document.createElement("div");
        overlay.className = "offline-rewards-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "offline-rewards-title");

        const panel = document.createElement("section");
        panel.className = "offline-rewards-panel";

        const title = document.createElement("h2");
        title.id = "offline-rewards-title";
        title.textContent = "Ganhos durante sua ausência";

        const seconds = Math.floor(rewards.tempoMs / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const remainingMinutes = minutes % 60;
        const duration = hours > 0
            ? `${hours}h ${remainingMinutes}min`
            : minutes > 0
                ? `${minutes} min`
                : `${Math.max(1, seconds)} s`;
        const time = document.createElement("p");
        time.className = "offline-rewards-time";
        time.textContent = `Tempo considerado: ${duration}${rewards.tempoMs >= LimiteTempoOffline() ? " (limite máximo)" : ""}`;

        const list = document.createElement("div");
        list.className = "offline-rewards-list";
        const damageRow = document.createElement("p");
        damageRow.textContent = `Dano causado aos inimigos: ${FormatGold(rewards.dano)}`;
        const goldRow = document.createElement("p");
        goldRow.textContent = `Gold recebido: ${FormatGold(rewards.gold)}`;
        const xpRow = document.createElement("p");
        xpRow.textContent = `Experiência recebida: ${rewards.xp ?? Math.min(
            Number.MAX_SAFE_INTEGER - xpAtual,
            rewards.abates * XPPorInimigo(andar)
        )} XP`;
        const linhas = [damageRow, goldRow];
        if (rewards.bonusRetorno) {
            const partesBonus = [];
            if (rewards.bonusRetorno.gold > 0) {
                partesBonus.push(`${FormatGold(rewards.bonusRetorno.gold)} gold`);
            }
            if (rewards.bonusRetorno.esmeraldas > 0) {
                partesBonus.push(`${rewards.bonusRetorno.esmeraldas} ${rewards.bonusRetorno.esmeraldas === 1 ? "esmeralda" : "esmeraldas"}`);
            }
            const bonusRow = document.createElement("p");
            bonusRow.className = "offline-rewards-bonus";
            bonusRow.textContent = `Bônus de retorno (${Math.max(1, Math.round(rewards.bonusRetorno.horas))}h longe): +${partesBonus.join(" e ")}`;
            linhas.push(bonusRow);
        }
        linhas.push(xpRow);
        list.append(...linhas);

        const chestsTitle = document.createElement("p");
        chestsTitle.className = "offline-rewards-chests-title";
        chestsTitle.textContent = `Baús encontrados: ${rewards.baus.length}`;
        list.appendChild(chestsTitle);

        if (rewards.baus.length > 0) {
            const chestList = document.createElement("ul");
            chestList.className = "offline-rewards-chests";
            rewards.baus.forEach((bau, index) => {
                const item = document.createElement("li");
                const rewardsText = [];
                if (bau.gold > 0) rewardsText.push(`${FormatGold(bau.gold)} Gold`);
                if (bau.esmeraldas > 0) {
                    rewardsText.push(`${bau.esmeraldas} ${bau.esmeraldas === 1 ? "esmeralda" : "esmeraldas"}`);
                }
                item.textContent = `Baú ${index + 1}: ${rewardsText.join(" e ")}`;
                chestList.appendChild(item);
            });
            list.appendChild(chestList);
        }
        const formigasRecebidas = rewards.formigas ?? FORMIGAS.map(() => 0);
        const totalFormigas = formigasRecebidas.reduce((total, quantidade) => total + quantidade, 0);
        const antsRow = document.createElement("p");
        antsRow.textContent = totalFormigas > 0
            ? `Formigas adicionadas à coleção: ${formigasRecebidas
                .map((quantidade, index) => quantidade > 0
                    ? `${quantidade} ${FORMIGAS[index].nome.toLowerCase()}`
                    : "")
                .filter(Boolean)
                .join(", ")}`
            : "Formigas encontradas: nenhuma";
        list.appendChild(antsRow);

        const claim = document.createElement("button");
        claim.type = "button";
        claim.className = "btn-Padrao offline-rewards-claim";
        claim.textContent = "Receber";
        claim.addEventListener("click", () => {
            overlay.remove();
            onClaim();
        });

        panel.append(title, time, list, claim);
        overlay.appendChild(panel);
        document.body.appendChild(overlay);
        claim.focus();
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

    showXPGain(amount) {
        const target = document.querySelector(".player");
        if (!target || amount <= 0) return;

        const rect = target.getBoundingClientRect();
        const marker = document.createElement("div");
        const stack = document.querySelectorAll(".reward-number").length;
        marker.className = "floating-game-text reward-number reward-number--xp";
        marker.setAttribute("aria-hidden", "true");
        marker.textContent = `+${amount} XP`;
        marker.style.left = `${rect.left + rect.width / 2}px`;
        marker.style.top = `${rect.top + rect.height * 0.2 - stack * 24}px`;
        document.body.appendChild(marker);
        setTimeout(() => marker.remove(), 1100);
    },

    createAntSprite(color) {
        const sprite = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        sprite.classList.add("ant-sprite");
        sprite.setAttribute("viewBox", "0 0 48 40");
        sprite.setAttribute("aria-hidden", "true");
        sprite.style.setProperty("--ant-color", color);

        const details = document.createElementNS("http://www.w3.org/2000/svg", "path");
        details.setAttribute("class", "ant-sprite__details");
        details.setAttribute("d", "M17 17 10 10m9 7 1-9m5 10 7-8M20 23l-8 1m10 1-8 8m11-8 2 9m-1-11 9 5m-11-7 9-2");
        const abdomen = document.createElementNS("http://www.w3.org/2000/svg", "ellipse");
        abdomen.setAttribute("class", "ant-sprite__abdomen");
        abdomen.setAttribute("cx", "34");
        abdomen.setAttribute("cy", "21");
        abdomen.setAttribute("rx", "8");
        abdomen.setAttribute("ry", "6");
        const thorax = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        thorax.setAttribute("class", "ant-sprite__thorax");
        thorax.setAttribute("cx", "23");
        thorax.setAttribute("cy", "22");
        thorax.setAttribute("r", "4");
        const head = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        head.setAttribute("class", "ant-sprite__head");
        head.setAttribute("cx", "13");
        head.setAttribute("cy", "20");
        head.setAttribute("r", "5");
        sprite.append(details, abdomen, thorax, head);
        return sprite;
    },

    showAntReward(formiga, amount = 1) {
        const target = document.querySelector(".player");
        if (!target || amount <= 0) return;

        const rect = target.getBoundingClientRect();
        const marker = document.createElement("div");
        const stack = document.querySelectorAll(".reward-number").length;
        marker.className = "floating-game-text reward-number reward-number--ant";
        marker.setAttribute("aria-hidden", "true");
        marker.style.setProperty("--ant-color", formiga.cor);
        marker.appendChild(this.createAntSprite(formiga.cor));
        const label = document.createElement("span");
        label.textContent = amount === 1
            ? `+1 Formiga ${formiga.singular}`
            : `+${amount} Formigas ${formiga.nome}`;
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
        // O indicador usa translateX(-50%): "left" é o centro dele. Sem estas margens ele
        // ultrapassava a borda quando o inimigo estava junto nela (cortava o nome e a barra).
        const meioLargura = indicator.offsetWidth / 2;
        const centroMin = meioLargura + 8;
        const centroMax = Math.max(centroMin, window.innerWidth - meioLargura - 8);
        const centro = Math.min(Math.max(rect.left + rect.width / 2, centroMin), centroMax);
        const topoMax = Math.max(8, window.innerHeight - indicator.offsetHeight - 8);
        indicator.style.left = `${centro}px`;
        indicator.style.top = `${Math.min(Math.max(8, rect.top - 48), topoMax)}px`;

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
                ? (Tapeira.ItensBuild.contagem() > 0 ? Tapeira.ItensBuild.resumo() : "nenhum (baú de itens a cada 5 andares)")
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
                inimigo.style.visibility = window["vidaInimigo" + i] > 0
                    ? "visible"
                    : "hidden";

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
    // 5 andares depois do desbloqueio (andar 100) e some só quando o
    // jogador escolhe um item — não é removido na troca de andar nem pela
    // coleta de baús comuns (RemoveBau mexe apenas no id "bau").
    spawnBauBuild() {
        this.removeBauBuild();
        const bau = document.createElement("img");

        bau.src = "imagens/bau-aventura.svg";
        bau.className = "bau bau-build";
        bau.id = "bauBuild";
        bau.alt = "";
        bau.setAttribute("role", "button");
        bau.setAttribute("tabindex", "0");
        bau.setAttribute("aria-label", "Abrir baú de itens da build");
        bau.title = "Baú de itens da build: escolha 1 de 3";
        bau.addEventListener("click", () => Tapeira.ItensBuild.abreEscolha());
        bau.addEventListener("keydown", event => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                Tapeira.ItensBuild.abreEscolha();
            }
        });

        document.body.appendChild(bau);

        const selo = document.createElement("span");
        selo.id = "bauBuild-selo";
        selo.className = "bau-build-selo";
        selo.setAttribute("aria-hidden", "true");
        selo.textContent = "ITENS";
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
    },

    // =========================
    // ESCOLHA DE ITEM DA BUILD
    // =========================
    // Modal próprio (não usa o gameModal para não brigar com o toggle).
    // Fluxo: 3 cartões sorteados; se a build já está cheia, o primeiro
    // clique escolhe o item novo e o modal vira "qual dos atuais sai".
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
            ? `Entra: ${Tapeira.ItensBuild.item(escolhendo).nome} — escolha o que sai`
            : cheia
                ? "Escolha um dos 3 e depois qual dos atuais sai da build"
                : "Escolha 1 de 3 — efeitos acumulam se o item já estiver na build";

        let corpo = "";
        if (escolhendo) {
            corpo += `<div class="itens-build-grade">` + Tapeira.ItensBuild.pegaLista().map((idItem, indice) => {
                const registro = Tapeira.ItensBuild.item(idItem);
                return `<button class="item-build-cartao item-build-sair" data-slot="${indice}">
                    <img src="${registro.icone}" alt="">
                    <span class="item-build-nome">${registro.nome}</span>
                    <span class="item-build-efeito">${registro.efeito}</span>
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
        modal.querySelectorAll("[data-slot]").forEach(botao => {
            botao.addEventListener("click", () =>
                Tapeira.ItensBuild.escolhe(escolhendo, Number(botao.getAttribute("data-slot"))));
        });

        document.body.appendChild(modal);
    },

    fechaEscolhaItensBuild() {
        document.getElementById("modalItensBuild")?.remove();
    },
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

// botão "Logs" (fim do menu de configuração): delegado no document para
// não depender do momento em que o DOM da configuração é montado
document.addEventListener("click", (e) => {
    if (e.target instanceof Element && e.target.closest("#btnLogs")) {
        UI.showLogs();
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

			<div>
				Bônus de dano: ${(Number(danoBonus) || 0) > 0 ? "+" + (Number(danoBonus)).toFixed(2) : "nenhum"}
			</div>

			<div>
				Bônus de crítico: ${(Number(bonusCritConquista) || 0) > 0 ? "+" + (Number(bonusCritConquista)).toFixed(2) : "nenhum"}
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

			<div>
				Bônus de gold: ${(Number(descontoLoja) || 0) > 0 ? "-" + (Number(descontoLoja) * 100).toFixed(1).replace(/\.0$/, "") + "% nos preços" : "nenhum"}
			</div>

		</div>
	`;

    const bonusNivel = Math.floor(Math.max(0, totalNiveis | 0) / 100);

    conquista += `
		<div style="margin-top:1.2em;">

			<div style="color:#8fe6a8;font-weight:bold;">
				Conquista de Nível
			</div>

			<div>
				${totalNiveis} níveis acumulados — a cada 100 níveis: -1 inimigo
			</div>

			<div>
				Progresso: ${totalNiveis % 100}% para o próximo -1
			</div>

			<div>
				Bônus atual: ${bonusNivel > 0 ? "-" + bonusNivel + " " + (bonusNivel === 1 ? "inimigo" : "inimigos") + " para avançar" : "nenhum"}
			</div>

		</div>
	`;

    conquista += `
		<div style="margin-top:1.2em;">

			<div style="color:#d9a7ff;font-weight:bold;">
				Conquistas Comportamentais
			</div>
	`;

    for (let i = 0; i < CONQUISTAS_COMP.length; i++) {
        const c = CONQUISTAS_COMP[i];
        const nivel = NivelConquistaComp(i);
        conquista += `
			<div style="margin-top:0.6em;${nivel > 0 ? "" : "opacity:0.75;"}">
				<div>
					${nivel > 0 ? "✔" : "○"} <b>${c.nome}</b> — ${c.recompensa} (nível ${nivel}/${c.max})
				</div>
				<div style="font-size:0.9em;">
					${c.desc}
				</div>
				<div style="font-size:0.9em;color:${nivel >= c.max ? "#ffd34f" : nivel > 0 ? "#8fe6a8" : "#cfcfcf"};">
					${nivel >= c.max ? "Nível máximo!" : "Progresso: " + ProgressoConquistaComp(i)}
				</div>
			</div>
		`;
    }

    conquista += `
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
    } else if (missaoAtual == 5) {

        progressoAtual = missaoDesafioAtual;
        progressoMax = missaoDesafioAlvo;
    }

    const porcentagem =
        ((progressoAtual * 100) / progressoMax).toFixed(2);

    const regraDesafio = missaoAtual == 5 ? [
        "",
        "Qualquer compra com gold falha o desafio.",
        "Ativar qualquer habilidade de combate falha o desafio.",
        `Faltam ${missaoDesafioTempo} segundos — o tempo zerado falha o desafio.`
    ][missaoDesafioSub] : "";

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

                ${regraDesafio ? `<div class="modal-info">${regraDesafio}</div>` : ""}

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

// Todos os marcos do jogo num lugar só: ouro por andar (por run), portões
// de reset, níveis do jogador (permanente) e desbloqueios por andar.
// As classes modal-* são estilizadas em estilos.css.
function MostraMarcos() {
    const linha = (rotulo, valor, classe) => `
        <div class="modal-linha">
            <span class="modal-label">${rotulo}</span>
            <span class="modal-value${classe ? " " + classe : ""}">${valor}</span>
        </div>`;

    const barra = (progresso) => {
        const largura = Math.max(0, Math.min(100, Number(progresso) || 0));
        return `
        <div class="modal-barra">
            <div class="modal-barra-fill" style="width:${largura}%"></div>
        </div>
        <div class="modal-porcentagem">${largura.toFixed(0)}%</div>`;
    };

    // --- Ouro desta run: +10% de gold a cada 10 andares (zeram no reset) ---
    const marcos = Math.max(0, Math.floor(marcoGoldRun / 10));
    const bonusComposto = (Math.pow(1.1, marcos) - 1) * 100;
    const proximoMarco = marcoGoldRun + 10;
    const faltamGold = Math.max(0, proximoMarco - andar);
    const progressoGold = (andar - marcoGoldRun) * 10;

    const casas = bonusComposto < 100 ? 1 : 0;
    const bonusTexto = marcos === 0
        ? "nenhum"
        : "+" + bonusComposto.toFixed(casas).replace(/\.0$/, "") + "%";

    // lista limitada: últimos marcos atingidos + os próximos
    const inicio = marcoGoldRun > 0 ? Math.max(10, marcoGoldRun - 20) : 10;
    const itens = [];
    if (inicio > 10) itens.push("…");
    for (let m = inicio; m <= marcoGoldRun + 30; m += 10) {
        if (m <= marcoGoldRun) itens.push(m + " ✓");
        else itens.push(m === proximoMarco ? m + " (próximo)" : String(m));
    }

    // --- Portões de reset ---
    const faltamPortao = Math.max(0, andarVolta - andar);
    const portaoEsmeralda = andarVolta % 10 === 5;
    const pagaDanoProximo = andarVolta >= Math.max(35, gateDanoPago + 5);
    const recompensaPortao = [
        portaoEsmeralda ? "esmeralda" : "",
        pagaDanoProximo ? "5% dano" : ""
    ].filter(Boolean).join(" + ") || "avanço";
    const pendentesDano = GatesDanoPendentes(andar);
    const danoPago = Math.max(0, Math.floor(Number(danoResetQtd) || 0));
    const perkGanhosRun = PontosPerkGanhos();
    const perkDisp = PontosPerkDisponiveis();

    // --- Níveis do jogador (permanente) ---
    const nivelAtual = Math.max(1, Math.floor(Number(nivelJogador) || 1));
    const marcosCM = Math.max(0, Math.floor(Number(marcosNivel50) || 0));
    const proximoNivelCM = (marcosCM + 1) * 50;
    const faltamNivelCM = Math.max(0, proximoNivelCM - nivelAtual);
    const progressoNivelCM = (nivelAtual - marcosCM * 50) * 2; // 50 níveis = 100%
    const niveisAcum = Math.max(0, Math.floor(Number(totalNiveis) || 0));
    const bonusNiveis = Math.floor(niveisAcum / 100);
    const proximoNiveis = (bonusNiveis + 1) * 100;
    const faltamNiveis = proximoNiveis - niveisAcum;

    // --- Desbloqueios por andar (andar máximo = permanente) ---
    // especializações 3/4/5 entram pelo `andar` da própria tabela
    const desbloqueios = [
        ...SKILLS_UPGRADE
            .filter(skill => skill.pisoDesbloqueio > 1)
            .map(skill => ({ nome: skill.nome, piso: skill.pisoDesbloqueio })),
        { nome: "Auto-coleta de baús", piso: ANDAR_AUTO_COLETA },
        { nome: "Auto-compra da loja", piso: ANDAR_AUTO_COMPRA },
        { nome: "Auto-gasto de pontos", piso: ANDAR_AUTO_GASTO },
        { nome: "Sobra de pontos vira CM", piso: ANDAR_SOBRA_CM },
        ...ESPECIALIZACOES
            .filter(esp => esp.andar > 0)
            .map(esp => ({ nome: esp.nome, piso: esp.andar }))
    ].sort((a, b) => a.piso - b.piso).map(desbloqueio => {
        const aberto = maxAndar >= desbloqueio.piso;
        return aberto
            ? linha(desbloqueio.nome, "✓ andar " + desbloqueio.piso, "modal-value--ok")
            : linha(desbloqueio.nome, "andar " + desbloqueio.piso + " — faltam " + (desbloqueio.piso - maxAndar), "modal-value--pend");
    }).join("");

    UI.showModal(
        "Marcos",
        `
            <div class="modal-section">
                <div class="modal-titulo">Ouro desta run · a cada 10 andares</div>

                ${linha("Andar atual", andar)}
                ${linha("Marcos atingidos", marcos + " (a cada 10 andares)")}
                ${linha("Bônus desta run", bonusTexto)}
                ${linha("Próximo marco", faltamGold > 0 ? `andar ${proximoMarco} — faltam ${faltamGold}` : `andar ${proximoMarco}`)}
                ${barra(progressoGold)}
                ${linha("Marcos", itens.join(" · "))}

                <div class="modal-info">
                    Cada marco dá +10% de gold multiplicativo nesta run e mostra um
                    aviso na tela. O bônus zera ao resetar.
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-titulo">Portões de reset</div>

                ${linha("Reset livre", andar >= 20 ? "disponível agora" : `libera no andar 20 — faltam ${20 - andar}`)}
                ${linha("Próximo portão", faltamPortao > 0 ? `andar ${andarVolta} — faltam ${faltamPortao}` : `andar ${andarVolta} — disponível`)}
                ${linha("Recompensa do portão", recompensaPortao)}
                ${linha("Dano pendente até aqui", pendentesDano > 0 ? `+${pendentesDano * 5}% se resetar agora` : "nenhum")}
                ${linha("Dano permanente pago", danoPago > 0 ? `${danoPago} portões (+${danoPago * 5}%)` : "nenhum")}
                ${linha("Perks desta run", `${perkDisp} ${perkDisp === 1 ? "disponível" : "disponíveis"} de ${perkGanhosRun}`)}

                <div class="modal-info">
                    Portões terminados em 5 (15, 25, 35, 45…) dão esmeralda; os
                    intermediários (40, 50…) só dano. Cada portão a partir do 35
                    paga +5% de dano permanente uma única vez. A partir do andar 20
                    a troca de andar também gera Conhecimento Mug.
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-titulo">Níveis do jogador · não zera no reset</div>

                ${linha("Nível atual", nivelAtual)}
                ${linha("Próximo marco de 50", `nível ${proximoNivelCM} — faltam ${faltamNivelCM}`)}
                ${barra(progressoNivelCM)}
                ${linha("Marcos de 50 atingidos", marcosCM)}
                ${linha("Multiplicador de CM no reset", "×" + FormataMultCM())}
                ${linha("Resets curtos (+5% cada)", resetsCurtosCM > 0 ? resetsCurtosCM + " → ×" + FormataMultCM() : "nenhum")}
                ${linha("Níveis acumulados", niveisAcum)}
                ${linha("Próximo marco de 100", `${proximoNiveis} — faltam ${faltamNiveis}`)}
                ${barra(niveisAcum % 100)}
                ${linha("Bônus de 100 níveis", bonusNiveis > 0 ? `−${bonusNiveis} inimigo${bonusNiveis === 1 ? "" : "s"} para avançar` : "nenhum")}

                <div class="modal-info">
                    A cada 50 níveis o multiplicador de CM no reset ganha +1 — o
                    mesmo marco não paga de novo depois do reset. A cada 100 níveis
                    acumulados entre resets, 1 inimigo a menos é exigido para avançar.
                    Resetar perto do recorde — até 10 andares antes dele
                    (ex.: reset no 88 com recorde 97) dá +5% permanente
                    nesse multiplicador, e a cada reset curto novo o
                    bônus acumula (multiplicativo). Resetar longe (ex.: no
                    20 com recorde 97) não conta.
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-titulo">Desbloqueios por andar · valem para sempre</div>

                ${desbloqueios}

                <div class="modal-info">
                    O desbloqueio usa o andar máximo já atingido (${maxAndar}) e não
                    é perdido no reset. Andar 40 libera a auto-coleta dos baús e
                    andar 50 a auto-compra da loja (toggles no rastreador do baú
                    dourado e no cabeçalho da loja); andar 55 o auto-gasto de
                    pontos (toggle no painel de skills) e andar 65 a sobra de
                    pontos na mão virar +1% de Conhecimento Mug no reset. As
                    especializações de build
                    abrem pelo mesmo critério: ${ESPECIALIZACOES.filter(esp => esp.andar > 0).map(esp => esp.nome + " (andar " + esp.andar + ")").join(", ")}.
                </div>
            </div>
        `
    );
}

// Tutorial do 1º reset: força a compra do Companheiro de Dano (se ainda não tiver)
function TutorialComp1Pendente() {
    return andarVolta > 15 && N(lvlComp1) === 0;
}

function MostraTutorialComp1() {
    if (!TutorialComp1Pendente()) return;

    const titulo = "Compre o Companheiro de Dano";
    const preco = Math.max(1, N(precoComp1));

    const conteudo = `
            <div class="modal-tutorial-texto">
                O <b>Companheiro de Dano</b> ataca junto com voce em toda batalha
                e é essencial para avançar de andar. Voce ganha esmeraldas a cada
                reset — use-as agora!
            </div>

            <div class="modal-tutorial-info">
                <span>Esmeraldas: <b>${N(esmeraldas)}</b></span>
                <span>Preço: <b>${preco} esmeralda${preco === 1 ? "" : "s"}</b></span>
            </div>

            <button type="button" class="btn-Padrao btn-tutorial-comp1" onclick="CompraTutorialComp1()">
                Comprar Companheiro de Dano (${preco} esmeralda${preco === 1 ? "" : "s"})
            </button>

            <div class="modal-tutorial-dica">
                ESC ou X fecha a janela — ela reabre ao abrir a loja até voce comprar.
            </div>
        `;

    const atual = document.getElementById("gameModal");
    if (atual && atual.style.display === "flex") {
        // já é o nosso modal aberto: atualiza só o conteúdo (valores podem ter mudado);
        // outro modal visível: não interrompe (a condição continua pendente)
        if (document.getElementById("gameModalTitle")?.innerHTML === titulo) {
            document.getElementById("gameModalBody").innerHTML = conteudo;
        }
        return;
    }

    UI.showModal(titulo, conteudo);
}

// Decomposição do dano: de onde sai cada ponto de dano do golpe
function MostraDecomposicaoDano() {
    const multFormigas = MultiplicadorDanoFormigas();
    const multNivel = MultiplicadorDanoNivel();
    const multTotal = multFormigas * multNivel;
    const conjuntos = ConjuntosFormigas("vermelhas");
    const danoEfetivo = N(danoJogador) * multTotal;
    const critEfetivo = N(danoCritJogador) * multTotal;

    const linha = (rotulo, valor) => `
        <div class="decomp-linha">
            <span>${rotulo}</span>
            <span class="decomp-valor">${valor}</span>
        </div>`;

    let html = `
        <div class="decomp-grupo">Por golpe</div>
        ${linha("Dano base da loja (nível " + (N(lvlDano) | 0) + ")", N(danoJogador).toFixed(2))}
        ${linha("× Bônus de nível (nível " + (N(nivelJogador) | 0) + ")", "×" + multNivel.toFixed(2))}
        ${linha("× Formigas vermelhas (" + conjuntos + " conjunto" + (conjuntos === 1 ? "" : "s") + ")", "×" + multFormigas.toFixed(2))}
        <div class="decomp-linha decomp-linha--total">
            <span>= Dano efetivo por golpe</span>
            <span class="decomp-valor">${danoEfetivo.toFixed(2)}</span>
        </div>

        <div class="decomp-grupo">Crítico</div>
        ${linha("Dano crítico efetivo", critEfetivo.toFixed(2))}
        ${linha("Chance crítica", (N(chanceCrit) * 100).toFixed(2) + "%")}
        ${linha("Multiplicador crítico máximo", "×" + N(multiplicadorMaximoDanoCritico).toFixed(1))}
        ${N(bonusCritConquista) > 0 ? linha("Bônus crítico das conquistas", "+" + N(bonusCritConquista).toFixed(2)) : ""}

        <div class="decomp-grupo">Companheiro de dano</div>
    `;

    if (N(lvlComp1) > 0) {
        html += linha("Dano do companheiro (nível " + (N(lvlComp1) | 0) + ")", (N(danoComp) * multTotal).toFixed(2));
        html += linha("= " + (N(danoComp1) * 100).toFixed(0) + "% do seu dano", "×" + N(danoComp1).toFixed(2));
    } else {
        html += `<div class="decomp-nota">Ainda sem companheiro — compre na loja de esmeraldas após o 1º reset.</div>`;
    }

    if (N(danoBonus) > 0 && isFinite(N(danoBonus))) {
        html += `
        <div class="decomp-grupo">Bônus permanente</div>
        ${linha("Bônus das conquistas (reaplicado no reset)", "×" + N(danoBonus).toFixed(2))}
        `;
    }

    if (N(danoResetQtd) > 0) {
        html += `
        <div class="decomp-grupo">Bônus de reset (reaplicado a cada reset)</div>
        ${linha("Portões pagos: " + N(danoResetQtd) + " (+" + (N(danoResetQtd) * 5) + "%)", "×" + Math.pow(1.05, N(danoResetQtd)).toFixed(2))}
        `;
    }

    UI.showModal("Decomposição do dano", html);
}

function MostraInfos() {
    UI.toggleInfoModal();
}
