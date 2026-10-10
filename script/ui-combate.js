// ===================== COMBATE E SPRITES =================================
// Feedbacks de dano/recompensa, inimigos e sprites do personagem.
// Metodos movidos de ui.js; continuam em UI via Object.assign, entao
// this segue sendo UI e nenhuma chamada existente muda.

Object.assign(UI, {
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
});
