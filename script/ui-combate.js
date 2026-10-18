// ===================== COMBATE E SPRITES =================================
// Feedbacks de dano/recompensa, inimigos e sprites do personagem.
// Metodos movidos de ui.js; continuam em UI via Object.assign, entao
// this segue sendo UI e nenhuma chamada existente muda.

Object.assign(UI, {
    showDamageNumber(target, damage, critical) {
        if (!target) return;
        // preferência "Números de dano" desligada suprime os números flutuantes
        if (window.Tapeira?.Config && !window.Tapeira.Config.ativo("numerosDano")) return;

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
        if (type === "gold") {
            PulsaElemento(document.getElementById("contGold"), "contador--pulso");
            VoaMoeda(rect);
        }
        if (type === "emerald") {
            const icon = document.createElement("img");
            icon.className = "reward-number__icon";
            icon.src = "imagens/hud/esmeralda-recompensa.svg";
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
        PulsaElemento(document.getElementById("skill-player-xp-fill"), "xp-fill--pulso");
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

        // a trilha é tocada quando a CENA carrega (script/biomas.js), não aqui

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
                const visivel = window["vidaInimigo" + i] > 0;
                inimigo.style.visibility = visivel ? "visible" : "hidden";
                if (visivel) SurgeInimigo(inimigo);

            }, 600);




            /*
                      inimigo.onclick = function () {
                console.log("CLIQUE NO INIMIGO:", i);
                Bater(i, true);
            };
            inimigo.src = "imagens/personagens/inimigo.png";
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

    // O botão do "Dano automático" (#habilidade-dano) agora é FIXO no HTML (item 1):
    // não some ao ativar, mostra a carga sobre o próprio ícone. spawnSkill /
    // removeSkill ficaram como compatibilidade (alguns testes/dev usam) e só
    // re-sincronizam o estado visual.
    spawnSkill() {
        AtualizaHabilidadesCombate();
    },

    removeSkill() {
        // nada a remover: o botão é fixo no HTML
    },

    // =========================
    // MODAL
    // =========================
});

// Materializa o inimigo ao entrar na arena: fade-in no sprite + anel de
// "surgimento" no chão. Só visual; some no animationend (sem timer novo).
function SurgeInimigo(el) {
	if (!el) return;
	// Biomas: garante o sprite da criatura da faixa atual.
	if (typeof BiomaAplicaInimigo === "function") BiomaAplicaInimigo(el);
	el.classList.remove("inimigo--surgindo");
	void el.offsetWidth;
	el.classList.add("inimigo--surgindo");
	el.getAnimations().forEach(anim =>
		anim.finished.then(() => el.classList.remove("inimigo--surgindo")).catch(() => {})
	);

	const rect = el.getBoundingClientRect();
	const anel = document.createElement("div");
	anel.className = "inimigo-surgir-anel";
	anel.setAttribute("aria-hidden", "true");
	anel.style.left = `${rect.left + rect.width / 2}px`;
	anel.style.top = `${rect.top + rect.height * 0.86}px`;
	anel.style.width = `${rect.width}px`;
	anel.style.height = `${rect.width * 0.42}px`;
	document.body.appendChild(anel);
	anel.getAnimations().forEach(anim =>
		anim.finished.then(() => anel.remove()).catch(() => {})
	);
}

// Pulsa um elemento (classe + fim da animação) — feedback rápido de ganho,
// sem timer novo. Guarda contra elemento ausente (ex.: painel fechado).
function PulsaElemento(el, classe) {
	if (!el) return;
	el.classList.remove(classe);
	void el.offsetWidth;
	el.classList.add(classe);
	el.getAnimations().forEach(anim =>
		anim.finished.then(() => el.classList.remove(classe)).catch(() => {})
	);
}

// Moeda voando do ponto do ganho até o contador de gold (só visual; some no
// animationend). A direção vai nas custom properties --dx/--dy.
function VoaMoeda(origem) {
	const alvo = document.getElementById("contGold");
	if (!alvo || !origem) return;
	const destino = alvo.getBoundingClientRect();
	const x0 = origem.left + origem.width / 2;
	const y0 = origem.top + origem.height * 0.2;
	const moeda = document.createElement("img");
	moeda.className = "moeda-voadora";
	moeda.src = "imagens/hud/gold.png";
	moeda.alt = "";
	moeda.setAttribute("aria-hidden", "true");
	moeda.style.left = `${x0}px`;
	moeda.style.top = `${y0}px`;
	moeda.style.setProperty("--dx", `${destino.left + destino.width / 2 - x0}px`);
	moeda.style.setProperty("--dy", `${destino.top + destino.height / 2 - y0}px`);
	document.body.appendChild(moeda);
	moeda.addEventListener("animationend", () => moeda.remove(), { once: true });
}

// Brilho dos cristais: pontinhos que cintilam sobre a caverna (só visual).
// Criado uma vez; posições/tempos fixos (sem Math.random no load).
function CriaBrilhoCristais() {
	if (!document.getElementById("game-root")) return;
	if (document.getElementById("cristaisCintilam")) return;
	const camada = document.createElement("div");
	camada.id = "cristaisCintilam";
	camada.setAttribute("aria-hidden", "true");
	const pontos = [
		[12, 30, 0], [22, 62, 1.2], [38, 24, 2.4], [52, 70, 0.6],
		[64, 34, 1.8], [76, 58, 3.0], [86, 28, 0.9], [30, 82, 2.1],
		[70, 84, 1.5], [92, 66, 2.7]
	];
	for (const [x, y, delay] of pontos) {
		const ponto = document.createElement("span");
		ponto.className = "cintilar";
		ponto.style.left = x + "%";
		ponto.style.top = y + "%";
		ponto.style.animationDelay = delay + "s";
		camada.appendChild(ponto);
	}
	document.body.appendChild(camada);
}

document.addEventListener("DOMContentLoaded", CriaBrilhoCristais);
