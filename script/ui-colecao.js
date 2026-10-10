// ===================== COLECAO E OFFLINE =================================
// Colecao de formigas e tela de recompensas offline.
// Metodos movidos de ui.js; continuam em UI via Object.assign, entao
// this segue sendo UI e nenhuma chamada existente muda.

Object.assign(UI, {
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
    }
});
