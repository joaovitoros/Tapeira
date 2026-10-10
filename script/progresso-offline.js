// ===================== PROGRESSO OFFLINE ================================
// Simulação de combate e entrega das recompensas acumuladas offline.
// Scripts clássicos: APIs globais mantidas para compatibilidade.

function SimulaDanoOffline(dano) {
	const limite = andar < 5 ? 1 : andar <= 14 ? 2 : andar <= 29 ? 3 : 4;
	const vidaMaxima = Number(vidaAndar);
	const vidas = [1, 2, 3, 4].map(indice => {
		if (indice > limite) return 0;
		const vida = Number(window["vidaInimigo" + indice]);
		return Number.isFinite(vida) ? Math.max(0, vida) : 0;
	});
	let restante = dano;
	let abates = 0;

	for (let indice = limite - 1; indice >= 0 && restante > 0; indice--) {
		const danoNoInimigo = Math.min(restante, vidas[indice]);
		vidas[indice] -= danoNoInimigo;
		restante -= danoNoInimigo;
		if (vidas[indice] <= 0 && danoNoInimigo > 0) {
			vidas[indice] = 0;
			abates++;
		}
	}

	const restaurarOnda = () => {
		for (let indice = 0; indice < 4; indice++) {
			vidas[indice] = indice < limite ? vidaMaxima : 0;
		}
	};

	if (dano > 0 && vidas.slice(0, limite).every(vida => vida <= 0)) {
		restaurarOnda();
	}

	if (restante > 0 && Number.isFinite(vidaMaxima) && vidaMaxima > 0) {
		const danoPorOnda = vidaMaxima * limite;
		if (Number.isFinite(danoPorOnda) && danoPorOnda > 0) {
			const ondasCompletas = Math.floor(restante / danoPorOnda);
			abates += ondasCompletas * limite;
			restante -= ondasCompletas * danoPorOnda;

			if (ondasCompletas > 0) restaurarOnda();

			for (let indice = limite - 1; indice >= 0 && restante > 0; indice--) {
				const danoNoInimigo = Math.min(restante, vidas[indice]);
				vidas[indice] -= danoNoInimigo;
				restante -= danoNoInimigo;
				if (vidas[indice] <= 0 && danoNoInimigo > 0) {
					vidas[indice] = 0;
					abates++;
				}
			}

			if (vidas.slice(0, limite).every(vida => vida <= 0)) {
				restaurarOnda();
			}
		}
	}

	return {
		vidasInimigos: vidas,
		abates,
		inimigosTela: vidas.slice(0, limite).filter(vida => vida > 0).length
	};
}

function ContaAvancosVirtuais(abates) {
	const abatesParaProximoAndar = Math.max(1, Math.ceil(QuotaAndar() - inimigosDerrotados));
	const b = 2 * abatesParaProximoAndar - 1;
	const avancos = Math.floor((Math.sqrt(b * b + 8 * abates) - b) / 2);
	return Number.isFinite(avancos) ? Math.max(0, avancos) : Number.MAX_SAFE_INTEGER;
}

function CriaBausOffline(avancos) {
	const baus = [];
	let tentativasRestantes = Math.floor(avancos);
	const chanceBauSegura = Math.max(0, Math.min(1, Number(chanceBau)));
	const chanceEsmeraldaSegura = Math.max(0, Math.min(1, Number(chanceEsmeraldaBau)));
	const limiteBaus = LimiteBausOffline();
	const chanceExtra = ChanceBauExtraFormigas();
	const extrasGarantidos = Math.floor(chanceExtra);
	const chanceExtraFracionada = chanceExtra - extrasGarantidos;
	const bonusGoldBau = Math.max(0, (BonusGoldAvanco() * 5)
		* MultiplicadorGoldBauFormigas() * MultiplicadorGoldFormigas()
		* multiplicadorProgressoOffline);

	while (tentativasRestantes > 0 && baus.length < limiteBaus && chanceBauSegura > 0) {
		const aleatorio = Math.max(Number.EPSILON, Math.random());
		const distancia = chanceBauSegura >= 1
			? 1
			: Math.floor(Math.log(aleatorio) / Math.log(1 - chanceBauSegura)) + 1;
		if (distancia > tentativasRestantes) break;

		tentativasRestantes -= distancia;
		const quantidade = 1 + extrasGarantidos
			+ (Math.random() < chanceExtraFracionada ? 1 : 0);
		for (let indice = 0; indice < quantidade && baus.length < limiteBaus; indice++) {
			const esmeralda = Math.random() < chanceEsmeraldaSegura;
			baus.push({
				gold: esmeralda ? 0 : bonusGoldBau,
				esmeraldas: esmeralda ? 1 : 0
			});
		}
	}

	return baus;
}

function CalculaProgressoOffline(ultimaDataSalva) {
	const agora = Date.now();
	const dataAnterior = Number.isFinite(ultimaDataSalva) ? ultimaDataSalva : agora;
	ultimaDataSaveOffline = agora;
	if (recompensasOfflinePendentes) return;

	const tempoMs = Math.min(
		LimiteTempoOffline(),
		Math.max(0, agora - dataAnterior)
	);
	if (tempoMs <= 0) return;

	const chanceCritica = Math.max(0, Math.min(1, Number(chanceCrit)));
	const danoCriticoCompanheiro = Math.max(0, Number(danoCritJogador) * Number(danoComp1));
	const danoBaseCompanheiro = Math.max(0, Number(danoComp));
	// especialização: mesmo tratamento do Bater — normal e crítico levam
	// multiplicadores diferentes no Olho de Águia (o gold offline é pego
	// no AddGold da entrega)
	const multEspNormal = MultiplicadorDanoEspecializacao(false);
	const multEspCritico = MultiplicadorDanoEspecializacao(true);
	const danoMedioCompanheirosPorSegundo = danoBaseCompanheiro > 0
		? ((danoBaseCompanheiro * (1 - chanceCritica) * multEspNormal)
			+ (danoCriticoCompanheiro * chanceCritica * multEspCritico))
			// Velocidade do Companheiro: os hits por segundo multiplicam
			// o dano médio do companheiro (1,0 = o valor de sempre)
			* N(velAtaqueComp)
		: 0;
	const danoMedioJogadorPorAtaque = (Math.max(0, Number(danoJogador)) * (1 - chanceCritica) * multEspNormal)
		+ (Math.max(0, Number(danoCritJogador)) * chanceCritica * multEspCritico);
	const intervaloAtaqueJogadorMs = Math.max(1, Number(MaxValidaBater)) * 30;
	const ataquesJogadorPorSegundo = 1000 / intervaloAtaqueJogadorMs;
	const danoMedioPorSegundo = danoMedioCompanheirosPorSegundo
		+ danoMedioJogadorPorAtaque * ataquesJogadorPorSegundo;
	const danoOffline = danoMedioPorSegundo * (tempoMs / 1000)
		* multiplicadorProgressoOffline * MultiplicadorDanoFormigas();
	if (!Number.isFinite(danoOffline) || danoOffline < 0) {
		console.error("Não foi possível calcular o dano offline com os valores atuais.");
		UI.showInfo("Não foi possível calcular o progresso offline. Verifique os atributos dos companheiros.");
		return;
	}

	const simulacao = SimulaDanoOffline(danoOffline);
	if (!Number.isFinite(simulacao.abates)
		|| simulacao.vidasInimigos.some(vida => !Number.isFinite(vida))) {
		console.error("O dano offline excede os limites numéricos suportados.");
		UI.showInfo("O progresso offline não pôde ser calculado devido ao limite numérico dos atributos.");
		return;
	}
	const avancosVirtuais = ContaAvancosVirtuais(simulacao.abates);
	const baus = CriaBausOffline(avancosVirtuais);
	const goldPorAbate = (andar * mulGold) + 1;
	const goldPassivo = Number(goldCompanheiro) * (tempoMs / 1000);
	const goldDosBaus = baus.reduce((total, bau) => total + bau.gold, 0);
	const goldOffline = (goldPassivo + simulacao.abates * goldPorAbate)
		* multiplicadorProgressoOffline * MultiplicadorGoldFormigas() + goldDosBaus;
	if (!Number.isFinite(goldOffline) || goldOffline < 0) {
		console.error("Não foi possível calcular o Gold offline com os valores atuais.");
		UI.showInfo("Não foi possível calcular o Gold offline. Verifique os bônus dos companheiros.");
		return;
	}

	// Bônus de retorno (princípio 35): presente para quem volta depois de ≥2h.
	// Escala com a ausência REAL (o teto do progresso offline não conta):
	// +25% no gold a cada 4h até +150% em 12h, e 1 esmeralda a cada 4h até
	// 6 em 24h. Usa o mesmo relógio do progresso offline (atualizado a cada
	// autosave) — nasce e morre com recompensasOfflinePendentes, sem campo
	// novo no save.
	const horasFora = Math.min(24, Math.max(0, (agora - dataAnterior) / 3600000));
	let bonusRetorno;
	if (horasFora >= 2) {
		const bonusGold = goldOffline * Math.min(horasFora / 8, 1.5);
		const bonusEsmeraldas = Math.floor(horasFora / 4);
		if (bonusGold > 0 || bonusEsmeraldas > 0) {
			bonusRetorno = { horas: horasFora, gold: bonusGold, esmeraldas: bonusEsmeraldas };
		}
	}

	recompensasOfflinePendentes = {
		tempoMs,
		dano: danoOffline,
		gold: goldOffline,
		abates: simulacao.abates,
		inimigosTela: simulacao.inimigosTela,
		vidasInimigos: simulacao.vidasInimigos,
		baus,
		formigas: SorteiaFormigas(simulacao.abates),
		bonusRetorno,
		xp: Math.min(
			Number.MAX_SAFE_INTEGER - xpAtual,
			simulacao.abates * XPPorInimigo(andar)
		)
	};
}

function RecebeProgressoOffline() {
	const recompensas = recompensasOfflinePendentes;
	if (!recompensas) return;

	let inimigoComVida = 0;
	recompensas.vidasInimigos.forEach((vida, indice) => {
		window["vidaInimigo" + (indice + 1)] = vida;
		const inimigo = document.getElementById("inimigo" + (indice + 1));
		const ativo = indice < (andar < 5 ? 1 : andar <= 14 ? 2 : andar <= 29 ? 3 : 4);
		if (vida <= 0 || !ativo) {
			UI.removeEnemy(indice + 1);
		} else if (inimigo) {
			inimigo.style.visibility = "visible";
			inimigoComVida = indice + 1;
		}
	});
	if (inimigoComVida) {
		DesceVida(inimigoComVida);
	} else {
		UI.updateEnemyHealth(0, 0, vidaAndar);
	}

	numInimigosTela = recompensas.inimigosTela;
	totalDerrotados += recompensas.abates;
	const xpOffline = recompensas.xp ?? Math.min(
		Number.MAX_SAFE_INTEGER - xpAtual,
		recompensas.abates * XPPorInimigo(andar)
	);
	const xpRecebido = GanhaXP(recompensas.abates, andar, xpOffline);
	// bônus de retorno (presente por tempo fora): entra no mesmo popup do
	// gold base e das esmeraldas dos baús
	const bonusRetorno = recompensas.bonusRetorno ?? null;
	const goldRecebido = recompensas.gold + (bonusRetorno ? bonusRetorno.gold : 0);
	if (goldRecebido > 0) {
		AddGold(goldRecebido, false);
		AddTotalGold(goldRecebido, false);
		UI.showCurrencyReward("gold", goldRecebido);
	}
	const esmeraldasRecebidas = recompensas.baus.reduce((total, bau) => total + bau.esmeraldas, 0)
		+ (bonusRetorno ? bonusRetorno.esmeraldas : 0);
	if (esmeraldasRecebidas > 0) {
		esmeraldas += esmeraldasRecebidas;
		UI.showCurrencyReward("emerald", esmeraldasRecebidas);
	}
	const formigasRecebidas = recompensas.formigas ?? FORMIGAS.map(() => 0);
	formigasRecebidas.forEach((total, indice) => {
		const formiga = FORMIGAS[indice];
		window[formiga.contador] = Math.min(
			Number.MAX_SAFE_INTEGER,
			window[formiga.contador] + total
		);
	});
	const totalFormigasRecebidas = formigasRecebidas.reduce((total, quantidade) => total + quantidade, 0);
	if (totalFormigasRecebidas > 0) {
		formigasRecebidas.forEach((quantidade, indice) => {
			if (quantidade > 0) UI.showAntReward(FORMIGAS[indice], quantidade);
		});
		UI.showMilestone("Formigas encontradas", `${totalFormigasRecebidas} adicionadas à coleção permanente`);
	}
	if (xpRecebido > 0) UI.showMilestone("Experiência recebida", `+${xpRecebido} XP durante sua ausência`);
	if (bonusRetorno) {
		const partesBonus = [];
		if (bonusRetorno.gold > 0) partesBonus.push(`+${FormatGold(bonusRetorno.gold)} gold`);
		if (bonusRetorno.esmeraldas > 0) {
			partesBonus.push(`+${bonusRetorno.esmeraldas} ${bonusRetorno.esmeraldas === 1 ? "esmeralda" : "esmeraldas"}`);
		}
		UI.showMilestone(
			"Bônus de retorno",
			`${partesBonus.join(" e ")} por ${Math.max(1, Math.round(bonusRetorno.horas))}h longe`
		);
	}

	recompensasOfflinePendentes = null;
	UI.render();
	MostraStatus?.();
	if (typeof AtualizaEstadoPausa === "function") AtualizaEstadoPausa(false);
	if (!AutoSaveLocal()) {
		UI.showInfo("As recompensas offline foram recebidas, mas não foi possível salvá-las localmente.");
	}
}
