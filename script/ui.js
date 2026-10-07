// ui.js
// Responsável apenas pela renderização da interface (DOM)

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
            ["btn-Loja", ["Loja", "LojaEsm"].some(id =>
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
        const bonus = document.getElementById("skill-player-bonus");
        if (bonus) {
            const niveis = Math.max(0, nivelJogador - 1);
            const conquistas = Math.floor(Math.max(0, totalNiveis | 0) / 100);
            const reducao = niveis + conquistas;
            bonus.textContent = `Bônus atual: +${niveis * 10}% de dano · −${reducao} ${reducao === 1 ? "inimigo" : "inimigos"} para avançar`;
        }
        if (button) button.setAttribute("aria-label", `Skills, nível ${nivelJogador}, ${pontosHabilidade} pontos disponíveis`);
        if (badge) {
            badge.textContent = String(pontosHabilidade);
            badge.hidden = pontosHabilidade === 0;
        }

    },

    showSkillUpgradePanel() {
        document.getElementById("skillUpgradeModal")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "skillUpgradeModal";
        overlay.className = "ant-collection-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "skill-upgrade-title");

        const panel = document.createElement("section");
        panel.className = "ant-collection-panel skill-upgrade-panel";
        const header = document.createElement("header");
        header.className = "ant-collection-header";
        const title = document.createElement("h2");
        title.id = "skill-upgrade-title";
        title.textContent = "Nível e habilidades";
        const close = document.createElement("button");
        close.type = "button";
        close.className = "ant-collection-close";
        close.setAttribute("aria-label", "Fechar habilidades");
        close.textContent = "×";
        const fechar = () => {
            overlay.remove();
            this.syncScreenButtons();
            document.getElementById("btnSkills")?.focus();
        };
        close.addEventListener("click", fechar);
        header.append(title, close);

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

        const skillList = document.createElement("div");
        skillList.className = "skill-upgrade-list";
        for (const skill of SKILLS_UPGRADE) {
            const skillLevel = NivelDaSkill(skill.id);
            const unlocked = PisoMaximoAlcancado() >= skill.pisoDesbloqueio;
            const card = document.createElement("article");
            card.className = "skill-upgrade-card";
            const details = document.createElement("div");
            details.className = "skill-upgrade-details";
            const name = document.createElement("h3");
            name.textContent = `${skill.nome} · Nv. ${skillLevel}/${skill.maximo}`;
            const description = document.createElement("p");
            description.textContent = DescricaoEfeitoSkill(skill.id, skillLevel);
            const requirement = document.createElement("span");
            requirement.className = "skill-upgrade-requirement";
            requirement.textContent = unlocked
                ? skillLevel >= skill.maximo
                    ? "Nível máximo"
                    : "1 ponto por nível"
                : `Desbloqueia no andar ${skill.pisoDesbloqueio}`;
            details.append(name, description, requirement);

            const upgrade = document.createElement("button");
            upgrade.type = "button";
            upgrade.className = "skill-upgrade-button";
            upgrade.textContent = "Melhorar";
            upgrade.disabled = !unlocked || pontosHabilidade === 0 || skillLevel >= skill.maximo;
            upgrade.setAttribute("aria-label", `Melhorar ${skill.nome}`);
            upgrade.addEventListener("click", () => {
                if (EvoluiSkill(skill.id)) this.showSkillUpgradePanel();
            });
            card.append(details, upgrade);
            skillList.appendChild(card);
        }

        panel.append(header, level, bonus, xpLabel, xpTrack, skillList);
        overlay.appendChild(panel);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) fechar();
        });
        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") fechar();
        });
        document.body.appendChild(overlay);
        this.updateSkillProgress();
        this.syncScreenButtons();
        close.focus();
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
            ? "Desde que você alcançou o andar 20, inimigos podem deixar uma formiga (1% por abate), inclusive após o reset. Cada conjunto completo de 5 ativa e acumula seu bônus."
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
        list.append(damageRow, goldRow, xpRow);

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
        // dano real aplicado no inimigo = base × multiplicador de formigas × bônus de nível
        const multDanoTotal = MultiplicadorDanoFormigas() * MultiplicadorDanoNivel();

        const stats = [
            ["Dano", (danoJogador * multDanoTotal).toFixed(2)],
            ["Multiplicador Gold", mulGold.toFixed(2)],
            ["Gold por inimigo", FormatGold(andar * mulGold)],
            ["Gold total", FormatGold(totalGold)],
            ["Bonus avanço", (((andar * mulGold) + (vidaAndar * mulGold) * mulGoldAvanco)).toFixed(2)],
            ["Chance avanço", (avanco * 100).toFixed(2) + "%"],
            ["Qtd avanço", qtdAvanco],
            ["Dano crítico", (danoCritJogador * multDanoTotal).toFixed(2)],
            ["Chance crítica", (chanceCrit * 100).toFixed(2) + "%"],
            ["DPS companheiros", (danoComp * multDanoTotal).toFixed(2)],
            ["GoldPS companions", goldCompanheiro.toFixed(2)],
            ["Tempo bônus", tempoEsperaCompanheiro + " seg"],
            ["Bônus XP", "+" + Math.max(0, lvlXP | 0)],
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
        const previous = document.getElementById("chestOpening");
        if (previous) previous.remove();
        clearTimeout(this.chestOpeningTimeout);

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

    updateGoldenChestProgress() {
        const tracker = document.getElementById("golden-chest-tracker");
        const progress = document.getElementById("golden-chest-progress");
        const fill = document.getElementById("golden-chest-progress-fill");
        const progressText = document.getElementById("golden-chest-progress-text");
        const claim = document.getElementById("golden-chest-claim");
        if (!tracker || !progress || !fill || !progressText || !claim) return;

        const percent = Math.max(0, Math.min(
            100,
            progressoBauDourado * 100 / TEMPO_BAU_DOURADO_JOGO
        ));
        const minutes = Math.floor(progressoBauDourado / 60000);
        const seconds = Math.floor(progressoBauDourado / 1000) % 60;
        const current = `${minutes}:${String(seconds).padStart(2, "0")}`;
        const ready = bauDouradoPendente === 1;
        fill.style.width = `${percent}%`;
        progress.setAttribute("aria-valuenow", String(Math.round(percent)));
        progress.setAttribute("aria-valuetext", ready
            ? "Baú dourado pronto para abrir"
            : `${Math.floor(percent)}% concluído`);
        progressText.textContent = ready ? "Recompensa disponível!" : `${current} / 20:00`;
        claim.disabled = !ready;
        claim.setAttribute("aria-label", ready ? "Abrir baú dourado" : "Baú dourado ainda carregando");
        tracker.classList.toggle("is-ready", ready);
    },

    spawnChest(quantity = 1) {
        this.removeChest();
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

UI.playAttackAnimation = function(inimigoElement) {
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

UI.playEscapeAnimation = function() {
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
				Bônus de gold: ${(Number(descontoLoja) || 0) > 0 ? "-" + (Number(descontoLoja) * 100).toFixed(0) + "% nos preços" : "nenhum"}
			</div>

		</div>
	`;

    const bonusNivel = Math.floor(Math.max(0, totalNiveis | 0) / 100);

    conquista += `
		<div style="margin-top:1.2em;">

			<div style="color:#8fe6a8;font-weight:bold;">
				Conquista de Nível (permanente)
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
