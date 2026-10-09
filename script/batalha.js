function Bater(inimigo, validaDano, aplicaNovasHabilidades = true) {
	if (jogoPausado || fugaEmAndamento) return;

	const inimigoElement = document.getElementById("inimigo" + inimigo);
	if (!inimigoElement) return;

	var dano;
	var danoCritico;

	if (validaDano) {
		dano = danoJogador;
		danoCritico = danoCritJogador;
	} else {
		dano = danoComp;
		danoCritico = danoCritJogador * danoComp1;
	}

	const ataqueJogador = validaDano && aplicaNovasHabilidades;
	const ataqueCorrenteEletrica = ataquesCorrenteEletrica > 0;
	const vidaAnterior = window["vidaInimigo" + inimigo];
	if (vidaAnterior <= 0) return;
	// especialização Cadeia de Ataques: este golpe conta pro stack do alvo
	// (16 acertos fecham o cap; os contadores zeram em cada onda nova)
	if (especializacao === 5) ataquesCadeia[inimigo] = N(ataquesCadeia[inimigo]) + 1;

	if (missaoAtual == 2) {
		MissaoGolpes();
	}

	const critico = DanoCritico(danoCritico);
	if (critico) {
		dano = danoCritico;
	}
	// perk do Dano automático: +25% por nível no hit da habilidade (não afeta cliques nem companheiro)
	if (validaDano && !aplicaNovasHabilidades) {
		if (perkDano > 0) dano = dano * (1 + 0.25 * perkDano);
		// ramo Canhão da árvore: +50% por nó (nv 5 e nv 10) no mesmo hit
		dano *= MultiplicadorRamoDanoAutomatico();
	}
	// ramo Oportunidade da árvore: golpes do jogador valem mais enquanto
	// a fuga está pausada pela skill de escape
	if (ataqueJogador && segundosPausaFuga > 0) {
		dano *= MultiplicadorDanoDurantePausaFuga();
	}
	// Toque Frenético: o toque do jogador vale ×N durante a janela (multiplicador
	// lido ANTES do toque ser consumido); o mesmo toque carrega/consome a janela
	if (ataqueJogador) {
		if (ataquesFrenesi > 0) dano *= MultiplicadorToqueFrenesi();
		RegistraToqueFrenesi();
	}
	TocaSomSintetico(critico ? "critico" : "impacto");
	dano *= MultiplicadorDanoFormigas();
	dano *= MultiplicadorDanoNivel();
	// especialização: buff/nerf aplicado no tempo do hit (não muta danoJogador)
	dano *= MultiplicadorDanoEspecializacao(critico);
	// Cadeia de Ataques: dano extra por ataque acumulado no MESMO alvo
	dano *= MultiplicadorCadeiaAtaques(inimigo);

	if (validaDano) UI.playAttackAnimation(inimigoElement);

	const danoBaseAtaque = dano;
	let chainTargets = [];
	if (ataqueCorrenteEletrica) {
		const targetRect = inimigoElement.getBoundingClientRect();
		const targetCenterX = targetRect.left + targetRect.width / 2;
		const targetCenterY = targetRect.top + targetRect.height / 2;
		const candidatos = [];

		for (let candidate = 1; candidate <= 4; candidate++) {
			if (candidate === inimigo || window["vidaInimigo" + candidate] <= 0) continue;
			const candidateElement = document.getElementById("inimigo" + candidate);
			if (!candidateElement || getComputedStyle(candidateElement).visibility !== "visible") continue;

			const rect = candidateElement.getBoundingClientRect();
			const distance = Math.hypot(
				rect.left + rect.width / 2 - targetCenterX,
				rect.top + rect.height / 2 - targetCenterY
			);
			candidatos.push({ id: candidate, element: candidateElement, distance: distance });
		}

		// perk da Corrente elétrica: 1 alvo base + 1 por nível (máx 3 = todos na tela);
		// ramo Rede da árvore: +1 alvo por nó (nv 5 e nv 10)
		candidatos.sort((a, b) => a.distance - b.distance);
		chainTargets = candidatos.slice(0, 1 + perkEletrica + RamoAlvosCorrente());

		if (chainTargets.length === 0) {
			// ramo Sobrecarga amplia o bônus quando não há alvo pra encadear
			dano *= 1 + ((10 + NivelDaSkill("electric") * 2) / 100) * MultiplicadorRamoCorrente();
		}
		ChamaSom("audio5");
	}

	// perk do Bônus de Gold nível 1+: o companheiro também usa a skill ativa
	// (gera o bônus de gold e consome os ataques, igual ao clique do jogador;
	// o hit da skill Dano automático não conta). A ativação é só pelo botão —
	// no desafio "sem habilidades" só a ativação real falha, como sempre.
	const usaSkillGold = ataquesBonusGold > 0
		&& (ataqueJogador || (perkGold >= 1 && !validaDano));

	// perk do Bônus de Gold: o kill feito com o golpe da skill ativa dropa +25% por nível
	const killComSkillGold = usaSkillGold && perkGold > 0;

	if (usaSkillGold) {
		// ramo Veia da árvore: +50% por nó no bônus de gold por ataque
		const bonusGold = ((andar * mulGold) + 1) * ((35 + NivelDaSkill("gold") * 5) / 100)
			* MultiplicadorRamoBonusGold();
		const goldRecebido = AddGold(bonusGold);
		AddTotalGold(goldRecebido, false);
		UI.showCurrencyReward("gold", goldRecebido);
	}

	if (ataqueCorrenteEletrica || usaSkillGold) {
		ConsomeAtaqueHabilidades(ataqueCorrenteEletrica, usaSkillGold);
	}

	ChamaSom(critico ? "audio8" : "audio3");
	let vidaAtual = vidaAnterior - dano;
	window["vidaInimigo" + inimigo] = vidaAtual;
	UI.showDamageNumber(inimigoElement, dano, critico);

	if (chainTargets.length > 0) {
		// ramo Sobrecarga da árvore: +50% por nó no dano da cadeia
		const chainDamage = danoBaseAtaque * ((25 + NivelDaSkill("electric") * 5) / 100)
			* MultiplicadorRamoCorrente();
		for (const alvo of chainTargets) {
			const chainHealth = Math.max(0, window["vidaInimigo" + alvo.id] - chainDamage);
			window["vidaInimigo" + alvo.id] = chainHealth;
			UI.showDamageNumber(alvo.element, chainDamage, false);
			animarEfeitoEletrico(alvo.element);
			if (chainHealth > 0) {
				animarImpacto(alvo.element, false, true);
			} else {
				animarMorte(alvo.element);
				alvo.element.style.visibility = "hidden";
			}
		}
	}
	if (vidaAtual > 0) {
		animarImpacto(inimigoElement, critico);
	}
	if (vidaAtual <= 0) {
		animarMorte(inimigoElement);
	}

	const derrotados = [];
	if (vidaAtual <= 0) derrotados.push(inimigo);
	for (const alvo of chainTargets) {
		if (window["vidaInimigo" + alvo.id] <= 0) derrotados.push(alvo.id);
	}

	let formigaObtida = false;
	for (const inimigoDerrotado of derrotados) {
		ChamaSom("audio2");
		formigaObtida = RegistraDropFormiga() || formigaObtida;
		const avancoAbates = Avancar();
		GanhaXP(avancoAbates, andar);
		inimigosDerrotados += avancoAbates;
		totalDerrotados += avancoAbates;
		derrotadosRun += avancoAbates; //base da conversão em Conhecimento Mug no reset
		EventoAbateCM(avancoAbates); //Névoa do CM: +CM imediato durante o evento
		EventoAbateVeia(avancoAbates); //Veia de esmeralda: chance de esmeralda por abate
		numInimigosTela--;
		qtdCarregaHabilidade++;
		VerificaHabilidade();
		RegistrarAbateHabilidades();

		let recompensaGold = ((andar * mulGold) * avancoAbates) + 1;
		if (inimigoDerrotado === inimigo && killComSkillGold) {
			// perk do Bônus de Gold: +25% por nível no drop do kill feito com a skill ativa
			recompensaGold = recompensaGold * (1 + 0.25 * perkGold);
		}
		const goldRecebido = AddGold(recompensaGold);
		AddTotalGold(goldRecebido, false);
		UI.showCurrencyReward("gold", goldRecebido);
		EventoAbateEmboscada(inimigoDerrotado, recompensaGold); //Emboscada: alvo morto + ouro em dobro (bruto, sem bônus)

		if (missaoAtual == 3) MissaoCaca();
		if (missaoAtual == 1) MissaoColetaGold(andar * mulGold);
		if (missaoAtual == 5) MissaoDesafio();
	}

	if (inimigosDerrotados >= QuotaAndar()) {
		UI.showObjectiveComplete();
	} else {
		UI.updateObjective();
	}

	DesceVida(inimigo);
	for (const alvo of chainTargets) DesceVida(alvo.id);

	// UI separada (agora ideal mover pra ui.js depois)
	if (typeof MostraStatus === "function") MostraStatus();
	if (typeof Conquistas === "function") Conquistas();
	if (typeof ConquistasComportamentais === "function") ConquistasComportamentais();

	const elTotalAbatidos = document.getElementById("contDerrotados");
	if (elTotalAbatidos) elTotalAbatidos.innerHTML = totalDerrotados;
	UI.updateObjective();

	// nova wave
	if (numInimigosTela <= 0) {
		RemoverInimigos();
		CarregarStatus();
		CriarInimigos();
	}

	// subir andar
	if (inimigosDerrotados >= QuotaAndar()) {

		if (document.getElementById("manterAndar")?.checked && andar > 4) {
			inimigosDerrotados = 0;
		} else {

			andar++;

			if (andar > maxAndar) {
				const maxAndarAnterior = maxAndar;
				maxAndar = andar;
				// desbloqueios de automação (pisos 40 e 50) comemoram na hora
				VerificaDesbloqueioAutomacao(maxAndarAnterior, maxAndar);
			}
			andarMaxRun = Math.max(andarMaxRun, andar); //pico da run (base dos pontos de perk)

			// Marco a cada 10 andares: +10% de gold nesta run (não re-dispara se o jogador fugir e subir de novo)
			if (andar % 10 === 0 && andar > marcoGoldRun) {
				marcoGoldRun = andar;
				mulGold = N(mulGold) * 1.1;
				if (lvlComp2 > 0) {
					goldCompanheiro = GoldCompanheiroPorSegundo();
				}
				UI.showMilestone("Marco do andar " + andar, "+10% de gold nesta run");
			}

			// fundo da caverna gira a cada andar vencido (crossfade ~1,2s)
			ProximoFundo?.();

			RemoverInimigos();
			RemoveBau();

			let bonusAndar = BonusGoldAvanco();

			const goldRecebido = AddGold(bonusAndar);
			AddTotalGold(goldRecebido, false);
			UI.showCurrencyReward("gold", goldRecebido);

			const elAndar = document.getElementById("contAndar");
			const elTitulo = document.getElementById("titulo");

			if (elAndar) elAndar.innerHTML = andar;
			if (elTitulo) elTitulo.innerHTML = "Caverna (Andar: " + andar + ")";
			UI.showFloorTransition(andar);

			qtdInimigosAndar++;

			inimigosDerrotados = 0;

			AutoSalvar();

			Conquistas();
			ConquistasComportamentais();
			CriaBau();

			if (missaoAtual == 1) {
				MissaoColetaGold(bonusAndar * 2);
			}

			MostraStatus?.();

			CarregarStatus();
			CriarInimigos();

			TentaEventoAndar(); //eventos aleatórios rolam só ao subir de andar
		}

		// O cronometro continua ativo no proximo andar. Cancela-lo aqui fazia
		// o contador reiniciar em 120 e permanecer parado.
		tempoAvancoInimigos = TempoFugaMax();
		UI.render();
	}
	AtualizaHabilidadesCombate();
	if (formigaObtida && !AutoSaveLocal()) {
		UI.showInfo("A formiga foi coletada, mas não foi possível salvar a coleção localmente.");
	}
}

function DanoAutomatico(indentificador, habilidade) {
	if (jogoPausado) return;

	// false = dano companheiro
	// true = habilidade

	if (!indentificador) {
		ValidaBater = 0;
	}

	if (ValidaBater == 0) {

		ValidaBater = MaxValidaBater;

		if (habilidade) {
			indentificador = true;
		}

		if (andar < 5) {

			if (vidaInimigo1 > 0) {
				Bater(1, indentificador, !habilidade);
			} else {
				CarregarStatus();
				CriarInimigos();
			}

		} else if (andar >= 5 && andar <= 14) {

			if (vidaInimigo2 > 0) {
				Bater(2, indentificador, !habilidade);
			} else {
				Bater(1, indentificador, !habilidade);
			}

		} else if (andar >= 15 && andar <= 29) {

			if (vidaInimigo3 > 0) {
				Bater(3, indentificador, !habilidade);
			} else if (vidaInimigo2 > 0) {
				Bater(2, indentificador, !habilidade);
			} else {
				Bater(1, indentificador, !habilidade);
			}

		} else if (andar >= 30) {

			if (vidaInimigo4 > 0) {
				Bater(4, indentificador, !habilidade);
			} else if (vidaInimigo3 > 0) {
				Bater(3, indentificador, !habilidade);
			} else if (vidaInimigo2 > 0) {
				Bater(2, indentificador, !habilidade);
			} else {
				Bater(1, indentificador, !habilidade);
			}
		}

	} else {
		ValidaBater--;
	}
}

function Avancar() {

	valida = Math.random();

	if (valida <= avanco) {
		MostraInfo("Avanço de " + qtdAvanco + " no andar: " + andar);
		return qtdAvanco;
	} else {
		return 1;
	}
}

function animarImpacto(el, critico, eletrico = false) {
	const rect = el.getBoundingClientRect();
	const recuoBase = eletrico ? 18 : 12;
	const recuo = rect.left + rect.width / 2 < window.innerWidth / 2 ? -recuoBase : recuoBase;
	const facing = getComputedStyle(el).getPropertyValue("--facing").trim() || "1";
	const frames = [
		{ transform: `translateX(0) scaleX(${facing}) scaleY(1) rotate(0)` },
		{
			transform: `translateX(${recuo}px) scaleX(${facing}) scaleY(${eletrico ? 0.76 : 0.82}) rotate(${recuo / 4}deg)`,
			offset: 0.35
		},
		{ transform: `translateX(0) scaleX(${facing}) scaleY(1) rotate(0)` }
	];

	if (eletrico) {
		frames[1].filter = "brightness(1.8) saturate(2.2) hue-rotate(145deg)";
		frames[2].filter = "brightness(1) saturate(1) hue-rotate(0deg)";
	}

	el.animate(frames, {
		duration: eletrico ? 390 : 260,
		easing: "ease-out"
	});

	const olhos = document.createElement("div");
	olhos.className = "enemy-hit-eyes";
	olhos.setAttribute("aria-hidden", "true");
	olhos.style.left = rect.left + "px";
	olhos.style.top = rect.top + "px";
	olhos.style.width = rect.width + "px";
	olhos.style.height = rect.height + "px";
	olhos.style.transform = `scaleX(${facing})`;
	olhos.innerHTML = "<span></span><span></span>";
	document.body.appendChild(olhos);
	olhos.addEventListener("animationend", () => olhos.remove(), { once: true });

	const impacto = document.createElement("div");
	impacto.className = critico
		? "enemy-hit-smoke enemy-hit-smoke--critical"
		: "enemy-hit-smoke";
	impacto.setAttribute("aria-hidden", "true");
	impacto.style.left = rect.left + rect.width / 2 + "px";
	impacto.style.top = rect.top + rect.height * 0.62 + "px";
	document.body.appendChild(impacto);
	impacto.addEventListener("animationend", () => impacto.remove(), { once: true });

	const burst = document.createElement("div");
	burst.className = critico
		? "enemy-impact-burst enemy-impact-burst--critical"
		: "enemy-impact-burst";
	burst.setAttribute("aria-hidden", "true");
	burst.style.left = `${rect.left + rect.width / 2}px`;
	burst.style.top = `${rect.top + rect.height * 0.58}px`;
	document.body.appendChild(burst);
	burst.addEventListener("animationend", () => burst.remove(), { once: true });
}

function animarEfeitoEletrico(el) {
	const rect = el.getBoundingClientRect();
	const effect = document.createElement("img");
	effect.className = "enemy-electric-impact";
	effect.src = "imagens/efeito-eletrico.svg";
	effect.alt = "";
	effect.setAttribute("aria-hidden", "true");
	effect.style.left = `${rect.left + window.scrollX + rect.width * 0.08}px`;
	effect.style.top = `${rect.top + window.scrollY + rect.height * 0.04}px`;
	effect.style.width = `${rect.width * 0.84}px`;
	effect.style.height = `${rect.height * 0.84}px`;
	document.body.appendChild(effect);
	effect.addEventListener("animationend", () => effect.remove(), { once: true });
}

function DanoCritico(critico) {

	valida = Math.random();

	if (valida <= chanceCrit) {
		MostraInfo("Dano critico de: " + critico);
		return true;
	} else {
		return false;
	}
}

function DesceVida(inimigo) {

	var vida;

	if (inimigo == 1) {
		vida = vidaInimigo1;
	} else if (inimigo == 2) {
		vida = vidaInimigo2;
	} else if (inimigo == 3) {
		vida = vidaInimigo3;
	} else {
		vida = vidaInimigo4;
	}

	UI.updateEnemyHealth(inimigo, vida, vidaAndar);
}

const efeitosMorteAtivos = new Map();

function LimpaEfeitosMorte() {
	for (const [elemento, animacao] of efeitosMorteAtivos) {
		clearInterval(animacao.intervalo);
		clearTimeout(animacao.limite);
		elemento.remove();
	}
	efeitosMorteAtivos.clear();
}

function animarMorte(el) {
	const rect = el.getBoundingClientRect();
	const morte = document.createElement("img");
	morte.className = "morteAnim";
	morte.src = "imagens/morte/frame12.png";
	morte.style.left = `${rect.left}px`;
	morte.style.top = `${rect.top}px`;
	morte.style.width = `${rect.width}px`;
	morte.style.height = `${rect.height}px`;
	morte.style.transform = el.style.transform;
	morte.style.filter = getComputedStyle(el).filter;
	document.body.appendChild(morte);
	el.style.visibility = "hidden";

	const frames = [
		"imagens/morte/frame12.png",
		"imagens/morte/frame11.png",
		"imagens/morte/frame10.png",
		"imagens/morte/frame9.png",
		"imagens/morte/frame8.png",
		"imagens/morte/frame7.png",
		"imagens/morte/frame6.png",
		"imagens/morte/frame5.png",
		"imagens/morte/frame4.png",
		"imagens/morte/frame3.png",
		"imagens/morte/frame2.png",
		"imagens/morte/frame1.png"
	];

	let frame = 0;
	const limpa = () => {
		const animacao = efeitosMorteAtivos.get(morte);
		if (!animacao) return;
		clearInterval(animacao.intervalo);
		clearTimeout(animacao.limite);
		efeitosMorteAtivos.delete(morte);
		morte.remove();
	};
	const intervalo = setInterval(() => {
		frame++;
		if (frame >= frames.length) {
			limpa();
			return;
		}
		morte.src = frames[frame];
	}, 80);
	const limite = setTimeout(limpa, 1200);
	efeitosMorteAtivos.set(morte, { intervalo, limite });
}
