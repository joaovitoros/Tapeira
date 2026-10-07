// =========================
// SISTEMA / CONFIGURAÇÕES
// =========================

function AbreConfig() {
	const el = document.getElementById("container-SalvaCarrega");
	if (!el) return;

	el.style.visibility =
		el.style.visibility == "hidden" ? "visible" : "hidden";

	if (el.style.visibility === "visible" && !window.matchMedia("(min-width: 1600px)").matches) {
		document.getElementById("DivStatus").style.visibility = "hidden";
	}
	if (el.style.visibility === "visible") {
		UI.closeOtherPanels("config");
	}
	UI.syncScreenButtons();
}

window.addEventListener("resize", () => {
	if (window.matchMedia("(min-width: 1600px)").matches) return;

	const config = document.getElementById("container-SalvaCarrega");
	const status = document.getElementById("DivStatus");
	if (config?.style.visibility === "visible" && status?.style.visibility === "visible") {
		config.style.visibility = "hidden";
		UI.syncScreenButtons();
	}
});

function AutoSalvar() {
	if (saveAnd == andar) {
		saveAnd += 10;
		qtdSave++;
		MostraInfo("Salvamento automático...");
	}
	AutoSaveLocal();
}

// =========================
// SAVE
// =========================

function Salvar() {

	qtdSave++;
	AutoSaveLocal();

	function getRawGold(v) {
		if (!v) return 0;

		// GoldNumber
		if (v instanceof GoldNumber) {
			return Number(v.value) || 0;
		}

		// number
		if (typeof v === "number") {
			return v;
		}

		// string tipo "1.2K" -> remove letras (fallback seguro)
		if (typeof v === "string") {
			let n = v.replace(/[^\d.-]/g, "");
			return Number(n) || 0;
		}

		return 0;
	}

	var save = {

		numInimigosTela,
		andar,
		marcoGoldRun,
		qtdInimigosAndar,
		inimigosDerrotados,
		limiteInimigos,

		gold: {
			m: gold.m,
			e: gold.e
		},
		totalGold: {
			m: totalGold.m,
			e: totalGold.e
		},

		saveAnd,
		qtdSave,
		maxAndar,
		andarVolta,
		gateDanoPago,
		andarMaxRun,
		danoResetQtd,
		perkDano,
		perkEletrica,
		perkGold,
		perkFuga,
		conhecimentoMug,
		derrotadosRun,
		cmNivelDano,
		cmNivelGold,
		cmNivelXp,
		cmNivelFuga,
		cmNivelCrit,
		cmNivelFormiga,
		cmNivelDuasFormigas,
		cmNivelComp,
		cmNivelGoldComp2,
		totalDerrotados,
		nivelJogador,
		xpAtual,
		pontosHabilidade,
		nivelSkillDano,
		nivelSkillEletrica,
		nivelSkillGold,
		nivelSkillFuga,
		formigasVermelhas,
		formigasAmarelas,
		formigasMarrons,
		formigasPretas,
		formigasCinzas,

		danoJogador,
		danoCritJogador,
		multiplicadorMaximoDanoCritico,
		chanceCrit,

		vidaAndar,
		vidaInimigo1,
		vidaInimigo2,
		vidaInimigo3,
		vidaInimigo4,

		mulGold,
		mulGoldAvanco,
		avanco,
		qtdAvanco,

		ValidaBater,
		MaxValidaBater,

		danoComp,
		danoCritComp,
		goldCompanheiro,
		tempoEsperaCompanheiro,

		esmeraldas,
		numVoltas,
		tempoAvancoInimigos,
		andarBoss,
		abatesCorrenteEletrica,
		ataquesCorrenteEletrica,
		abatesBonusGoldAtaque,
		ataquesBonusGold,
		abatesPausaFuga,
		segundosPausaFuga,
		qtdCarregaHabilidade,

		progressoConquistaDano,
		progressoConquistaGold,
		validaConquista,
		totalNiveis,
		bonusCritConquista,

		precoDano,
		mulDano,
		lvlDano,

		precoBEspaco,
		lvlBEspaco,

		precoGold,
		sobeGold,
		lvlGold,

		precoAvan,
		sobeAvanco,
		lvlAvan,

		precoDCrit,
		sobeDCrit,
		lvlDCrit,

		precoCCrit,
		sobeCCrit,
		lvlCCrit,

		precoComp1,
		danoComp1,
		lvlComp1,

		precoAvGold,
		lvlAvGold,

		precoComp2,
		goldComp2,
		lvlComp2,

		precoComp3,
		tempoComp3,
		lvlComp3,

		precoXP,
		lvlXP,

		precoEsmCM,
		lvlEsmCM,

		descontoLoja,
		mulGoldInicial,
		danoBonus,

		precoQTDAvanco,
		lvlQTDAvanco,

		precoVidaInimigo,
		subVidaInimigo,
		lvlSubVida,

		chanceBau,
		chanceEsmeraldaBau,
		precoBau,
		lvlBau,
		progressoBauDourado,
		bauDouradoPendente,
		ultimaAtualizacaoBauDourado
	};

	save.saveFormat = "tapeira-save";
	save.saveVersion = 1;
	save.exportedAt = new Date().toISOString();
	const saveJson = JSON.stringify(save);
	const fileName = "TAPeira-save-" + save.exportedAt.replace(/[:.]/g, "-") + ".json";

	if (window.tapeiraDesktop?.saveJson) {
		window.tapeiraDesktop.saveJson(saveJson, fileName).then(result => {
			MostraInfo(result.canceled ? "Salvamento cancelado." : "Save exportado com sucesso.");
		}).catch(error => {
			console.error("Erro ao exportar o save:", error);
			MostraInfo("Não foi possível exportar o save.");
		});
		return;
	}

	if (typeof window.tapeiraAndroidSave === "function") {
		window.tapeiraAndroidSave(saveJson, fileName).then(() => {
			MostraInfo("Escolha onde salvar ou compartilhar o arquivo JSON.");
		}).catch(error => {
			console.error("Erro ao exportar o save no Android:", error);
			MostraInfo("Não foi possível exportar o save.");
		});
		return;
	}

	saveAs(
		new Blob([saveJson], { type: "application/json;charset=utf-8" }),
		fileName
	);

	MostraInfo("Save exportado.");
}

// =========================
// LOAD
// =========================

function ValidarRecompensasOffline(recompensas, limiteTempo, limiteBaus) {
	if (!recompensas || typeof recompensas !== "object" || Array.isArray(recompensas)) {
		throw new TypeError("As recompensas offline do save são inválidas.");
	}

	for (const key of ["tempoMs", "dano", "gold", "abates", "inimigosTela"]) {
		if (!Number.isFinite(recompensas[key]) || recompensas[key] < 0) {
			throw new TypeError("As recompensas offline do save são inválidas.");
		}
	}
	if (recompensas.tempoMs > limiteTempo
		|| !Number.isInteger(recompensas.abates)
		|| !Number.isInteger(recompensas.inimigosTela)
		|| recompensas.inimigosTela > 4) {
		throw new TypeError("Os limites das recompensas offline do save são inválidos.");
	}

	if (!Array.isArray(recompensas.vidasInimigos) || recompensas.vidasInimigos.length !== 4
		|| recompensas.vidasInimigos.some(vida => !Number.isFinite(vida) || vida < 0)) {
		throw new TypeError("As vidas dos inimigos no progresso offline são inválidas.");
	}

	if (!Array.isArray(recompensas.baus) || recompensas.baus.length > limiteBaus
		|| recompensas.baus.some(bau => !bau || typeof bau !== "object"
			|| !Number.isFinite(bau.gold) || bau.gold < 0
			|| !Number.isInteger(bau.esmeraldas) || bau.esmeraldas < 0)) {
		throw new TypeError("Os baús do progresso offline são inválidos.");
	}
	if (recompensas.formigas !== undefined
		&& (!Array.isArray(recompensas.formigas) || recompensas.formigas.length !== FORMIGAS.length
			|| recompensas.formigas.some(total => !Number.isSafeInteger(total) || total < 0))) {
		throw new TypeError("As formigas do progresso offline são inválidas.");
	}
	if (recompensas.xp !== undefined
		&& (!Number.isSafeInteger(recompensas.xp) || recompensas.xp < 0)) {
		throw new TypeError("A experiência do progresso offline é inválida.");
	}
}

// Pico de andar da run: fonte dos pontos de perk. Saves antigos, sem o campo,
// valem pelo portão pago (a mesma regra antiga dos pontos).
function PicoRunDoSave(save) {
	const pico = save.andarMaxRun !== undefined
		? save.andarMaxRun
		: Math.max(save.andar ?? 1, save.gateDanoPago ?? ((save.andarVolta ?? 1) - 5));
	return Math.max(pico, save.andar ?? 1, 1);
}

function ValidarSave(save) {
	if (!save || typeof save !== "object" || Array.isArray(save)) {
		throw new TypeError("O arquivo não contém um save válido.");
	}

	if (save.saveFormat !== undefined && save.saveFormat !== "tapeira-save") {
		throw new TypeError("Este arquivo não é um save do TAPeira.");
	}

	if (save.saveFormat === "tapeira-save" && save.saveVersion === undefined) {
		throw new TypeError("A versão do save não foi informada.");
	}

	if (save.saveVersion !== undefined) {
		if (!Number.isInteger(save.saveVersion) || save.saveVersion < 1) {
			throw new TypeError("A versão do save é inválida.");
		}
		if (save.saveVersion > 1) {
			throw new TypeError("Este save foi criado por uma versão mais nova do TAPeira.");
		}
		if (save.saveFormat !== "tapeira-save") {
			throw new TypeError("O formato do save é inválido.");
		}
	}

	if (save.exportedAt !== undefined && typeof save.exportedAt !== "string") {
		throw new TypeError("A data de exportação do save é inválida.");
	}

	if (!Number.isFinite(save.andar) || save.andar < 1) {
		throw new TypeError("O save não contém um andar válido.");
	}

	if (save.marcoGoldRun !== undefined
		&& (!Number.isSafeInteger(save.marcoGoldRun) || save.marcoGoldRun < 0
			|| save.marcoGoldRun % 10 !== 0)) {
		throw new TypeError("O marco de gold da run no save é inválido.");
	}

	if (save.gateDanoPago !== undefined
		&& (!Number.isSafeInteger(save.gateDanoPago) || save.gateDanoPago < 5
			|| save.gateDanoPago % 5 !== 0)) {
		throw new TypeError("O portão de dano do reset no save é inválido.");
	}

	if (save.andarMaxRun !== undefined
		&& (!Number.isSafeInteger(save.andarMaxRun) || save.andarMaxRun < 1)) {
		throw new TypeError("O pico de andar da run no save é inválido.");
	}

	if (save.danoResetQtd !== undefined
		&& (!Number.isSafeInteger(save.danoResetQtd) || save.danoResetQtd < 0
			|| save.danoResetQtd > 10000)) {
		throw new TypeError("O bônus de dano de reset no save é inválido.");
	}

	// coerência: pós-35 o portão pago é sempre o anterior ao próximo reset
	// (impede "reivindicar" um portão antigo de novo editando o save)
	if (save.gateDanoPago >= 35 && save.andarVolta !== save.gateDanoPago + 5) {
		throw new TypeError("O portão de dano não bate com o próximo reset do save.");
	}
	if (save.gateDanoPago < 35 && save.andarVolta > 35) {
		throw new TypeError("O portão de dano não bate com o próximo reset do save.");
	}

	// perks: inteiros dentro do teto de cada um; gastos não podem exceder os
	// pontos do pico de andar desta run (1 ponto por portão >= 35 alcançado)
	const perkKeys = [
		["perkDano", 0, 4],
		["perkEletrica", 0, 3],
		["perkGold", 0, 4],
		["perkFuga", 0, 5]
	];
	let perkGastos = 0;
	for (const [key, minimo, maximo] of perkKeys) {
		const valor = save[key];
		if (valor === undefined) continue;
		if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
			throw new TypeError("Os níveis de perk do save são inválidos.");
		}
		perkGastos = perkGastos + valor;
	}
	if (perkGastos > 0) {
		const picoRun = PicoRunDoSave(save);
		const perkGanhos = picoRun >= 35 ? Math.floor((picoRun - 35) / 5) + 1 : 0;
		if (perkGastos > perkGanhos) {
			throw new TypeError("Os perks do save excedem os pontos do pico da run.");
		}
	}

	// item de 1 nível da loja de esmeraldas: dobra o CM ganho (0 ou 1)
	if (save.lvlEsmCM !== undefined
		&& (!Number.isSafeInteger(save.lvlEsmCM) || save.lvlEsmCM < 0 || save.lvlEsmCM > 1)) {
		throw new TypeError("O nível do item de CM da loja de esmeraldas é inválido.");
	}

	// Conhecimento Mug: inteiros não negativos; níveis respeitam o teto de cada item
	const cmKeys = [
		["conhecimentoMug", 0, 1000000000],
		["derrotadosRun", 0, 1000000000],
		["cmNivelDano", 0, 10000],
		["cmNivelGold", 0, 10000],
		["cmNivelXp", 0, 10000],
		["cmNivelFuga", 0, 10000],
		["cmNivelCrit", 0, 10000],
		["cmNivelFormiga", 0, 50],
		["cmNivelDuasFormigas", 0, 100],
		["cmNivelComp", 0, 10000],
		["cmNivelGoldComp2", 0, 10000]
	];
	for (const [key, minimo, maximo] of cmKeys) {
		const valor = save[key];
		if (valor === undefined) continue;
		if (!Number.isSafeInteger(valor) || valor < minimo || valor > maximo) {
			throw new TypeError("Os dados de Conhecimento Mug do save são inválidos.");
		}
	}
	// anti-cheat: os abates desta run não podem superar o total de abates
	if (save.derrotadosRun !== undefined && save.totalDerrotados !== undefined
		&& save.derrotadosRun > save.totalDerrotados) {
		throw new TypeError("Os abates da run do save excedem o total de abates.");
	}

	for (const key of ["gold", "totalGold"]) {
		const currency = save[key];
		if (!currency || typeof currency !== "object"
			|| !Number.isFinite(currency.m) || !Number.isFinite(currency.e)) {
			throw new TypeError("O save não contém dados de gold válidos.");
		}
	}

	const formigaKeys = [
		"formigasVermelhas", "formigasAmarelas", "formigasMarrons",
		"formigasPretas", "formigasCinzas"
	];
	for (const key of formigaKeys) {
		if (save[key] !== undefined && (!Number.isSafeInteger(save[key]) || save[key] < 0)) {
			throw new TypeError("A coleção permanente de formigas do save é inválida.");
		}
	}
	const xpKeys = [
		["nivelJogador", 1, Number.MAX_SAFE_INTEGER],
		["xpAtual", 0, Number.MAX_SAFE_INTEGER],
		["pontosHabilidade", 0, Number.MAX_SAFE_INTEGER],
		["nivelSkillDano", 0, NIVEL_MAXIMO_SKILLS],
		["nivelSkillEletrica", 0, NIVEL_MAXIMO_SKILLS],
		["nivelSkillGold", 0, NIVEL_MAXIMO_SKILLS],
		["nivelSkillFuga", 0, NIVEL_MAXIMO_SKILLS]
	];
	for (const [key, minimo, maximo] of xpKeys) {
		if (save[key] !== undefined
			&& (!Number.isSafeInteger(save[key]) || save[key] < minimo || save[key] > maximo)) {
			throw new TypeError("Os dados de experiência ou habilidades do save são inválidos.");
		}
	}
	if (save.progressoBauDourado !== undefined
		&& (!Number.isFinite(save.progressoBauDourado)
			|| save.progressoBauDourado < 0
			|| save.progressoBauDourado > TEMPO_BAU_DOURADO_JOGO)) {
		throw new TypeError("O progresso do baú dourado no save é inválido.");
	}
	if (save.bauDouradoPendente !== undefined
		&& (!Number.isInteger(save.bauDouradoPendente)
			|| save.bauDouradoPendente < 0
			|| save.bauDouradoPendente > 1)) {
		throw new TypeError("O estado do baú dourado no save é inválido.");
	}
	if (save.ultimaAtualizacaoBauDourado !== undefined
		&& (!Number.isFinite(save.ultimaAtualizacaoBauDourado)
			|| save.ultimaAtualizacaoBauDourado < 0)) {
		throw new TypeError("A data do progresso do baú dourado no save é inválida.");
	}
	if (save.multiplicadorMaximoDanoCritico !== undefined
		&& (!Number.isFinite(save.multiplicadorMaximoDanoCritico)
			|| save.multiplicadorMaximoDanoCritico < 4)) {
		throw new TypeError("O limite de dano crítico no save é inválido.");
	}
	const limiteTempoSalvo = maxTempoProgressoOffline
		+ Math.floor((save.formigasPretas ?? 0) / 5) * 2 * 60 * 1000;
	const limiteBausSalvo = maxBausOffline + Math.floor((save.formigasCinzas ?? 0) / 5);
	if (save.offlineLastSavedAt !== undefined
		&& (!Number.isFinite(save.offlineLastSavedAt) || save.offlineLastSavedAt < 0)) {
		throw new TypeError("A data do último salvamento offline é inválida.");
	}
	if (save.offlinePendingRewards !== undefined && save.offlinePendingRewards !== null) {
		ValidarRecompensasOffline(save.offlinePendingRewards, limiteTempoSalvo, limiteBausSalvo);
	}

	for (const [key, value] of Object.entries(save)) {
		if (["saveFormat", "saveVersion", "exportedAt", "gold", "totalGold", "offlinePendingRewards"].includes(key)) continue;
		if (typeof value !== "number" || !Number.isFinite(value)) {
			throw new TypeError("O save contém dados inválidos.");
		}
	}
}

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
	const danoMedioCompanheirosPorSegundo = danoBaseCompanheiro > 0
		? (danoBaseCompanheiro * (1 - chanceCritica))
			+ (danoCriticoCompanheiro * chanceCritica)
		: 0;
	const danoMedioJogadorPorAtaque = (Math.max(0, Number(danoJogador)) * (1 - chanceCritica))
		+ (Math.max(0, Number(danoCritJogador)) * chanceCritica);
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

	recompensasOfflinePendentes = {
		tempoMs,
		dano: danoOffline,
		gold: goldOffline,
		abates: simulacao.abates,
		inimigosTela: simulacao.inimigosTela,
		vidasInimigos: simulacao.vidasInimigos,
		baus,
		formigas: SorteiaFormigas(simulacao.abates),
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
	if (recompensas.gold > 0) {
		AddGold(recompensas.gold, false);
		AddTotalGold(recompensas.gold, false);
		UI.showCurrencyReward("gold", recompensas.gold);
	}
	const esmeraldasRecebidas = recompensas.baus.reduce((total, bau) => total + bau.esmeraldas, 0);
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

	recompensasOfflinePendentes = null;
	UI.render();
	MostraStatus?.();
	if (typeof AtualizaEstadoPausa === "function") AtualizaEstadoPausa(false);
	if (!AutoSaveLocal()) {
		UI.showInfo("As recompensas offline foram recebidas, mas não foi possível salvá-las localmente.");
	}
}

function Carregar(saveData, calculaOffline = false) {

	var save = JSON.parse(saveData);
	ValidarSave(save);
	const vidasSalvas = [save.vidaInimigo1, save.vidaInimigo2, save.vidaInimigo3, save.vidaInimigo4];

	function safeNumber(v) {
		v = Number(v);
		return isFinite(v) ? v : 0;
	}

	numInimigosTela = save.numInimigosTela ?? 1;
	andar = save.andar ?? 1;
	// marcos de gold desta run: vêm no save (não regredir ao fugir e recarregar);
	// saves antigos caem na derivação pelo andar
	marcoGoldRun = save.marcoGoldRun ?? Math.floor(Math.max(1, andar) / 10) * 10;
	qtdInimigosAndar = save.qtdInimigosAndar ?? 1;
	inimigosDerrotados = save.inimigosDerrotados ?? 0;
	limiteInimigos = save.limiteInimigos ?? 1;

	console.log("1 " + save.gold, save.totalGold);

	// 🔥 GARANTIA ABSOLUTA
	gold = GoldNumber.fromMantissaExponent(
		save.gold?.m ?? 0,
		save.gold?.e ?? 0
	);

	totalGold = GoldNumber.fromMantissaExponent(
		save.totalGold?.m ?? 0,
		save.totalGold?.e ?? 0
	);

	saveAnd = save.saveAnd ?? 10;
	qtdSave = save.qtdSave ?? 0;
	maxAndar = save.maxAndar ?? 0;
	andarVolta = save.andarVolta ?? 15;
	if (andarVolta === 20) andarVolta = 15; // saves antigos: 20 era o gate do 1º reset (agora é 15)
	// saves antigos: começa a contar do portão atual (sem bônus retroativo)
	gateDanoPago = save.gateDanoPago ?? (andarVolta - 5);
	danoResetQtd = save.danoResetQtd ?? 0;
	// perks: valem para a run (zeram no Resetar; dentro da run ficam no save)
	perkDano = save.perkDano ?? 0;
	perkEletrica = save.perkEletrica ?? 0;
	perkGold = save.perkGold ?? 0;
	perkFuga = save.perkFuga ?? 0;
	// pico de andar da run (base dos pontos de perk; saves antigos valem pelo portão pago)
	andarMaxRun = PicoRunDoSave(save);
	// Conhecimento Mug: moeda e níveis permanentes (não zeram no reset)
	conhecimentoMug = save.conhecimentoMug ?? 0;
	derrotadosRun = save.derrotadosRun ?? 0;
	cmNivelDano = save.cmNivelDano ?? 0;
	cmNivelGold = save.cmNivelGold ?? 0;
	cmNivelXp = save.cmNivelXp ?? 0;
	cmNivelFuga = save.cmNivelFuga ?? 0;
	cmNivelCrit = save.cmNivelCrit ?? 0;
	cmNivelFormiga = save.cmNivelFormiga ?? 0;
	cmNivelDuasFormigas = save.cmNivelDuasFormigas ?? 0;
	cmNivelComp = save.cmNivelComp ?? 0;
	cmNivelGoldComp2 = save.cmNivelGoldComp2 ?? 0;
	totalDerrotados = save.totalDerrotados ?? 0;
	nivelJogador = save.nivelJogador ?? 1;
	xpAtual = save.xpAtual ?? 0;
	pontosHabilidade = save.pontosHabilidade ?? 0;
	nivelSkillDano = save.nivelSkillDano ?? 0;
	nivelSkillEletrica = save.nivelSkillEletrica ?? 0;
	nivelSkillGold = save.nivelSkillGold ?? 0;
	nivelSkillFuga = save.nivelSkillFuga ?? 0;
	formigasVermelhas = save.formigasVermelhas ?? 0;
	formigasAmarelas = save.formigasAmarelas ?? 0;
	formigasMarrons = save.formigasMarrons ?? 0;
	formigasPretas = save.formigasPretas ?? 0;
	formigasCinzas = save.formigasCinzas ?? 0;

	danoJogador = save.danoJogador ?? 1;
	danoCritJogador = save.danoCritJogador ?? 2;
	multiplicadorMaximoDanoCritico = save.multiplicadorMaximoDanoCritico ?? 4;
	// saves antigos compraram crítico do CM antes do teto virar item do CM:
	// garante o piso (4 + +0,1 por nível); o valor salvo vale se for maior
	// (inclui os +0,1 da loja de gold comprados nesta run)
	multiplicadorMaximoDanoCritico = Math.max(
		multiplicadorMaximoDanoCritico,
		Math.round((4 + 0.1 * cmNivelCrit) * 10) / 10);
	LimitaDanoCritico();
	chanceCrit = save.chanceCrit ?? 0.01;

	vidaAndar = save.vidaAndar ?? 0;
	vidaInimigo1 = save.vidaInimigo1 ?? 0;
	vidaInimigo2 = save.vidaInimigo2 ?? 0;
	vidaInimigo3 = save.vidaInimigo3 ?? 0;
	vidaInimigo4 = save.vidaInimigo4 ?? 0;

	mulGold = save.mulGold ?? 0.2;
	mulGoldAvanco = save.mulGoldAvanco ?? 1;

	avanco = save.avanco ?? 0;
	qtdAvanco = save.qtdAvanco ?? 2;

	ValidaBater = save.ValidaBater ?? 30;
	MaxValidaBater = save.MaxValidaBater ?? 30;

	danoComp = save.danoComp ?? 0;
	danoCritComp = save.danoCritComp ?? 0;
	goldCompanheiro = save.goldCompanheiro ?? 0;
	tempoEsperaCompanheiro = save.tempoEsperaCompanheiro ?? 0;

	esmeraldas = save.esmeraldas ?? 0;
	numVoltas = save.numVoltas ?? 0;

	tempoAvancoInimigos = save.tempoAvancoInimigos ?? TempoFugaMax();
	andarBoss = save.andarBoss ?? 10;
	abatesCorrenteEletrica = save.abatesCorrenteEletrica ?? 0;
	ataquesCorrenteEletrica = save.ataquesCorrenteEletrica ?? 0;
	abatesBonusGoldAtaque = save.abatesBonusGoldAtaque ?? 0;
	ataquesBonusGold = save.ataquesBonusGold ?? 0;
	abatesPausaFuga = save.abatesPausaFuga ?? 0;
	segundosPausaFuga = save.segundosPausaFuga ?? 0;
	qtdCarregaHabilidade = save.qtdCarregaHabilidade ?? 0;
	if (qtdCarregaHabilidade >= abateshabilidadeDano) {
		qtdCarregaHabilidade = abateshabilidadeDano;
		VerificaHabilidade();
	}

	progressoConquistaDano = save.progressoConquistaDano ?? 100;
	progressoConquistaGold = save.progressoConquistaGold ?? 500;
	validaConquista = save.validaConquista ?? 1;
	// conquista de nível: total acumulado entre resets; saves antigos usam o nível do run atual como base
	totalNiveis = save.totalNiveis ?? Math.max(0, nivelJogador - 1);
	bonusCritConquista = save.bonusCritConquista ?? 0;

	precoDano = save.precoDano ?? 5;
	mulDano = save.mulDano ?? 1;
	lvlDano = save.lvlDano ?? 1;

	precoBEspaco = save.precoBEspaco ?? 45;
	lvlBEspaco = save.lvlBEspaco ?? 1;

	precoGold = save.precoGold ?? 100;
	sobeGold = 0.3; // mult gold fixo em 0.3 em todo save (nerf médio pedido pelo jogador)
	lvlGold = save.lvlGold ?? 1;

	precoAvan = save.precoAvan ?? 80;
	sobeAvanco = save.sobeAvanco ?? 0.01;
	lvlAvan = save.lvlAvan ?? 0;

	precoDCrit = save.precoDCrit ?? 150;
	sobeDCrit = save.sobeDCrit ?? 0.1;
	lvlDCrit = save.lvlDCrit ?? 1;

	precoCCrit = save.precoCCrit ?? 250;
	sobeCCrit = save.sobeCCrit ?? 0.02;
	lvlCCrit = save.lvlCCrit ?? 1;

	precoComp1 = save.precoComp1 ?? 0;
	danoComp1 = save.danoComp1 ?? 0.4;
	lvlComp1 = save.lvlComp1 ?? 0;

	precoAvGold = save.precoAvGold ?? 2;
	lvlAvGold = save.lvlAvGold ?? 1;
	//repara saves antigos: resets anteriores apagavam mulGoldAvanco mas mantinham lvlAvGold
	if (Number(mulGoldAvanco) < Math.pow(1.1, Math.max(0, lvlAvGold - 1))) {
		mulGoldAvanco = Math.pow(1.1, Math.max(0, lvlAvGold - 1));
	}

	precoComp2 = save.precoComp2 ?? 3;
	goldComp2 = save.goldComp2 ?? 0.5;
	lvlComp2 = save.lvlComp2 ?? 0;

	precoComp3 = save.precoComp3 ?? 4;
	tempoComp3 = save.tempoComp3 ?? 1;
	lvlComp3 = save.lvlComp3 ?? 0;

	precoXP = save.precoXP ?? 2;
	lvlXP = save.lvlXP ?? 0;

	precoEsmCM = save.precoEsmCM ?? 10;
	lvlEsmCM = save.lvlEsmCM ?? 0;

	descontoLoja = save.descontoLoja ?? 0;
	mulGoldInicial = save.mulGoldInicial ?? mulGold;
	danoBonus = save.danoBonus ?? 0;

	precoQTDAvanco = save.precoQTDAvanco ?? 200;
	lvlQTDAvanco = save.lvlQTDAvanco ?? 1;

	precoVidaInimigo = save.precoVidaInimigo ?? 150;
	subVidaInimigo = save.subVidaInimigo ?? 0;
	lvlSubVida = save.lvlSubVida ?? 0;

	chanceBau = save.chanceBau ?? 0.1;
	chanceEsmeraldaBau = save.chanceEsmeraldaBau ?? 0.01;
	precoBau = save.precoBau ?? 25;
	lvlBau = save.lvlBau ?? 1;

	RemoverInimigos();
	AbreLoja();
	Batalha?.();
	const limiteInimigosAtuais = andar < 5 ? 1 : andar <= 14 ? 2 : andar <= 29 ? 3 : 4;
	for (let indice = 0; indice < vidasSalvas.length; indice++) {
		if (indice >= limiteInimigosAtuais) {
			window["vidaInimigo" + (indice + 1)] = 0;
		} else if (Number.isFinite(vidasSalvas[indice])) {
			window["vidaInimigo" + (indice + 1)] = Math.max(0, vidasSalvas[indice]);
		}
	}
	if (vidasSalvas.some(Number.isFinite)) {
		const limite = limiteInimigosAtuais;
		numInimigosTela = window["vidaInimigo1"] > 0 ? 1 : 0;
		for (let indice = 2; indice <= limite; indice++) {
			if (window["vidaInimigo" + indice] > 0) numInimigosTela++;
		}
		if (numInimigosTela === 0) {
			CarregarStatus();
			numInimigosTela = limite;
		}
		let inimigoComVida = 0;
		for (let indice = 1; indice <= 4; indice++) {
			const vida = window["vidaInimigo" + indice];
			if (vida > 0 && indice <= limite) {
				inimigoComVida = indice;
			} else {
				UI.removeEnemy(indice);
			}
		}
		if (inimigoComVida) {
			DesceVida(inimigoComVida);
		} else {
			UI.updateEnemyHealth(0, 0, vidaAndar);
		}
	}

	recompensasOfflinePendentes = calculaOffline ? save.offlinePendingRewards ?? null : null;
	progressoBauDourado = save.progressoBauDourado ?? 0;
	bauDouradoPendente = save.bauDouradoPendente ?? 0;
	ultimaDataSaveOffline = calculaOffline
		? (save.offlineLastSavedAt ?? Date.now())
		: Date.now();
	bauDouradoEmJogo = false;
	ultimaAtualizacaoBauDourado = calculaOffline
		? (save.ultimaAtualizacaoBauDourado ?? Date.now())
		: Date.now();
	if (calculaOffline && save.ultimaAtualizacaoBauDourado !== undefined) {
		AtualizaProgressoBauDourado();
	}
	bauDouradoEmJogo = document.visibilityState !== "hidden";
	if (calculaOffline) CalculaProgressoOffline(ultimaDataSaveOffline);
	UI.updateGoldenChestProgress();
	UI.updateSkillProgress();

	const salvou = AutoSaveLocal();
	if (recompensasOfflinePendentes) {
		if (typeof AtualizaEstadoPausa === "function") AtualizaEstadoPausa(true);
		UI.showOfflineRewards(recompensasOfflinePendentes, RecebeProgressoOffline);
	}
	return salvou;
}

// =========================
// CARREGAR ARQUIVO
// =========================

function CarregarArquivo(input) {
	const fileInput = input || document.getElementById("txtfiletoread");
	const file = fileInput?.files?.[0];
	if (!file) return;

	fileInput.value = "";
	if (!file.name.toLowerCase().endsWith(".json")) {
		MostraInfo("Selecione um arquivo de save .json.");
		return;
	}

	const reader = new FileReader();
	reader.onload = function () {
		try {
			const autoSaveAtualizado = Carregar(reader.result);
			MostraInfo(autoSaveAtualizado
				? "Save importado e progresso local atualizado."
				: "Save importado, mas não foi possível atualizar o auto save local.");
		} catch (error) {
			console.error("Não foi possível importar o save:", error);
			MostraInfo("Save inválido ou incompatível. O progresso atual foi mantido.");
		}
	};
	reader.onerror = function () {
		console.error("Não foi possível ler o arquivo de save:", reader.error);
		MostraInfo("Não foi possível ler o arquivo de save.");
	};
	reader.readAsText(file);
}

// =========================
// SONS / MENU / INIT
// =========================

function ChamaSom(som) {
	const el = document.getElementById(som);
	if (el) {
		el.volume = volumeAtual;
		el.muted = volumeAtual === 0;
		if (!el.muted) {
			el.currentTime = 0;
			el.play();
		}
	}
}

let volumeAtual = 0.05;
let volumeAmbiente = 0.3;
let contextoAudioJogo = null;
let ganhoMestreAmbiente = null;
let ambienteAudioAtivado = false;
let eventosAudioJogoRegistrados = false;

function CriaContextoAudioJogo() {
	if (contextoAudioJogo) return contextoAudioJogo;

	const AudioContextJogo = window.AudioContext || window.webkitAudioContext;
	if (!AudioContextJogo) {
		console.warn("Web Audio não está disponível; áudio ambiente e efeitos sintetizados foram desativados.");
		return null;
	}

	contextoAudioJogo = new AudioContextJogo();
	const context = contextoAudioJogo;
	ganhoMestreAmbiente = context.createGain();
	ganhoMestreAmbiente.gain.value = volumeAmbiente * 0.4;
	ganhoMestreAmbiente.connect(context.destination);

	const buffer = context.createBuffer(1, context.sampleRate * 5, context.sampleRate);
	const samples = buffer.getChannelData(0);
	const fadeSamples = Math.floor(context.sampleRate * 0.2);
	for (let index = 0; index < samples.length; index++) {
		const edgeFade = Math.min(1, index / fadeSamples, (samples.length - index - 1) / fadeSamples);
		samples[index] = (Math.random() * 2 - 1) * 0.7 * edgeFade;
	}
	const noise = context.createBufferSource();
	noise.buffer = buffer;
	noise.loop = true;
	const lowPass = context.createBiquadFilter();
	lowPass.type = "lowpass";
	lowPass.frequency.value = 420;
	const noiseGain = context.createGain();
	noiseGain.gain.value = 0.18;
	noise.connect(lowPass);
	lowPass.connect(noiseGain);
	noiseGain.connect(ganhoMestreAmbiente);
	noise.start();

	[54, 81].forEach((frequency, index) => {
		const drone = context.createOscillator();
		const droneGain = context.createGain();
		drone.type = "sine";
		drone.frequency.value = frequency;
		droneGain.gain.value = index === 0 ? 0.06 : 0.03;
		drone.connect(droneGain);
		droneGain.connect(ganhoMestreAmbiente);
		drone.start();
	});

	return context;
}

function AtivaAudioDoJogo() {
	try {
		const context = CriaContextoAudioJogo();
		if (!context) return;
		ambienteAudioAtivado = true;
		if (context.state === "suspended") {
			context.resume().catch(error => {
				console.warn("Não foi possível iniciar o áudio do jogo:", error);
			});
		}
	} catch (error) {
		console.error("Não foi possível iniciar o áudio do jogo:", error);
	}
}

function RegistraEventosAudioJogo() {
	if (eventosAudioJogoRegistrados) return;
	document.addEventListener("pointerdown", AtivaAudioDoJogo, { once: true });
	document.addEventListener("keydown", AtivaAudioDoJogo, { once: true });
	document.addEventListener("visibilitychange", () => {
		if (!contextoAudioJogo) return;
		if (document.visibilityState === "hidden") {
			contextoAudioJogo.suspend().catch(error => {
				console.warn("Não foi possível pausar o áudio em segundo plano:", error);
			});
		} else if (ambienteAudioAtivado) {
			AtivaAudioDoJogo();
		}
	});
	eventosAudioJogoRegistrados = true;
}

function AtualizaVolumeAmbiente(percentual) {
	const novoVolume = Number(percentual);
	if (!Number.isFinite(novoVolume)) {
		throw new TypeError("O volume ambiente precisa ser um número válido.");
	}

	volumeAmbiente = Math.max(0, Math.min(100, novoVolume)) / 100;
	const controle = document.getElementById("volumeAmbienteControle");
	const valor = document.getElementById("volumeAmbienteValor");
	if (controle) controle.value = String(Math.round(volumeAmbiente * 100));
	if (valor) valor.value = `${Math.round(volumeAmbiente * 100)}%`;
	if (ganhoMestreAmbiente && contextoAudioJogo) {
		ganhoMestreAmbiente.gain.setTargetAtTime(
			volumeAmbiente * 0.4,
			contextoAudioJogo.currentTime,
			0.08
		);
	}
	localStorage.setItem("volumeAmbienteJogo", String(Math.round(volumeAmbiente * 100)));
}

function TocaSomSintetico(tipo) {
	const context = contextoAudioJogo;
	if (!context || context.state !== "running" || volumeAtual <= 0) return;

	const agora = context.currentTime;
	if (tipo === "impacto" || tipo === "critico") {
		const buffer = context.createBuffer(1, Math.floor(context.sampleRate * 0.075), context.sampleRate);
		const samples = buffer.getChannelData(0);
		for (let index = 0; index < samples.length; index++) {
			samples[index] = (Math.random() * 2 - 1) * (1 - index / samples.length);
		}
		const source = context.createBufferSource();
		const filter = context.createBiquadFilter();
		const gain = context.createGain();
		source.buffer = buffer;
		filter.type = "lowpass";
		filter.frequency.value = tipo === "critico" ? 520 : 340;
		gain.gain.setValueAtTime(volumeAtual * (tipo === "critico" ? 0.55 : 0.34), agora);
		gain.gain.exponentialRampToValueAtTime(0.001, agora + 0.075);
		source.connect(filter);
		filter.connect(gain);
		gain.connect(context.destination);
		source.start(agora);
		source.onended = () => {
			source.disconnect();
			filter.disconnect();
			gain.disconnect();
		};

		if (tipo === "critico") {
			const tone = context.createOscillator();
			const toneGain = context.createGain();
			tone.type = "triangle";
			tone.frequency.setValueAtTime(740, agora);
			tone.frequency.exponentialRampToValueAtTime(230, agora + 0.12);
			toneGain.gain.setValueAtTime(volumeAtual * 0.2, agora);
			toneGain.gain.exponentialRampToValueAtTime(0.001, agora + 0.12);
			tone.connect(toneGain);
			toneGain.connect(context.destination);
			tone.start(agora);
			tone.stop(agora + 0.13);
			tone.onended = () => {
				tone.disconnect();
				toneGain.disconnect();
			};
		}
		return;
	}

	if (tipo === "andar") {
		[392, 523.25, 659.25].forEach((frequency, index) => {
			const tone = context.createOscillator();
			const gain = context.createGain();
			const start = agora + index * 0.085;
			tone.type = "triangle";
			tone.frequency.value = frequency;
			gain.gain.setValueAtTime(0.001, start);
			gain.gain.linearRampToValueAtTime(volumeAtual * 0.22, start + 0.025);
			gain.gain.exponentialRampToValueAtTime(0.001, start + 0.24);
			tone.connect(gain);
			gain.connect(context.destination);
			tone.start(start);
			tone.stop(start + 0.25);
			tone.onended = () => {
				tone.disconnect();
				gain.disconnect();
			};
		});
	}

	if (tipo === "guardiao") {
		[196, 146.83, 110].forEach((frequency, index) => {
			const tone = context.createOscillator();
			const gain = context.createGain();
			const start = agora + index * 0.12;
			tone.type = "triangle";
			tone.frequency.setValueAtTime(frequency, start);
			tone.frequency.exponentialRampToValueAtTime(frequency * 0.72, start + 0.3);
			gain.gain.setValueAtTime(0.001, start);
			gain.gain.linearRampToValueAtTime(volumeAtual * 0.28, start + 0.035);
			gain.gain.exponentialRampToValueAtTime(0.001, start + 0.32);
			tone.connect(gain);
			gain.connect(context.destination);
			tone.start(start);
			tone.stop(start + 0.33);
			tone.onended = () => {
				tone.disconnect();
				gain.disconnect();
			};
		});
	}
}

function AtualizaVolume(percentual) {
	const novoVolume = Number(percentual);
	if (!Number.isFinite(novoVolume)) {
		throw new TypeError("O volume precisa ser um número válido.");
	}

	volumeAtual = Math.max(0, Math.min(100, novoVolume)) / 100;

	document.querySelectorAll("audio").forEach(audio => {
		audio.volume = volumeAtual;
		audio.muted = volumeAtual === 0;
	});

	const controle = document.getElementById("volumeControle");
	const valor = document.getElementById("volumeValor");
	if (controle) controle.value = String(Math.round(volumeAtual * 100));
	if (valor) valor.value = Math.round(volumeAtual * 100) + "%";

	localStorage.setItem("volumeJogo", String(Math.round(volumeAtual * 100)));
}

function PrepararDesktop() {
	if (!window.tapeiraDesktop) return;

	document.body.classList.add("desktop-app");
	const exitButton = document.getElementById("btn-SairJogo");
	if (exitButton) exitButton.hidden = false;

	const displaySettings = document.getElementById("divDesktopDisplay");
	if (displaySettings) {
		displaySettings.hidden = false;
		window.tapeiraDesktop.getDisplaySettings().then(settings => {
			const resolution = document.getElementById("resolucaoJogo");
			const fullscreen = document.getElementById("telaCheiaJogo");
			if (resolution) resolution.value = settings.resolution;
			if (fullscreen) fullscreen.checked = settings.fullscreen;
		}).catch(error => {
			console.error("Não foi possível carregar as configurações de tela:", error);
			MostraInfo?.("Não foi possível carregar as configurações de tela.");
		});
	}
}

async function AtualizaConfiguracaoTela() {
	if (!window.tapeiraDesktop) return;

	const resolution = document.getElementById("resolucaoJogo")?.value;
	const fullscreen = document.getElementById("telaCheiaJogo")?.checked;
	const status = document.getElementById("desktopDisplayStatus");
	try {
		const settings = await window.tapeiraDesktop.setDisplaySettings({ resolution, fullscreen });
		if (status) status.textContent = settings.fullscreen
			? "Tela cheia ativada."
			: `Janela ajustada para ${settings.resolution}.`;
	} catch (error) {
		console.error("Não foi possível atualizar as configurações de tela:", error);
		if (status) status.textContent = "Não foi possível aplicar essa configuração.";
	}
}

function SairDoJogo() {
	if (window.tapeiraDesktop?.quit) {
		window.tapeiraDesktop.quit().catch(error => {
			console.error("Não foi possível fechar o jogo:", error);
		});
	}
}

function Menu() {
	window.location.href = "Caverna.html";
}

let menuOfflineTimer = null;

function AtualizaProgressoBauDourado(agora = Date.now()) {
	if (!Number.isFinite(ultimaAtualizacaoBauDourado) || ultimaAtualizacaoBauDourado <= 0) {
		ultimaAtualizacaoBauDourado = agora;
		UI.updateGoldenChestProgress();
		return false;
	}

	const progressoAnterior = progressoBauDourado;
	const tempoDecorrido = Math.max(0, agora - ultimaAtualizacaoBauDourado);
	ultimaAtualizacaoBauDourado = agora;

	if (bauDouradoPendente === 1) {
		progressoBauDourado = TEMPO_BAU_DOURADO_JOGO;
	} else {
		const multiplicadorTempo = bauDouradoEmJogo
			? 1
			: TEMPO_BAU_DOURADO_JOGO / TEMPO_BAU_DOURADO_OFFLINE;
		progressoBauDourado = Math.min(
			TEMPO_BAU_DOURADO_JOGO,
			Math.max(0, progressoBauDourado) + tempoDecorrido * multiplicadorTempo
		);
		if (progressoBauDourado >= TEMPO_BAU_DOURADO_JOGO) {
			bauDouradoPendente = 1;
			UI.showMilestone("Baú dourado disponível", "Abra o baú para receber sua recompensa!");
		}
	}

	UI.updateGoldenChestProgress();
	return progressoAnterior < TEMPO_BAU_DOURADO_JOGO
		&& progressoBauDourado >= TEMPO_BAU_DOURADO_JOGO;
}

function AtualizaModoBauDourado() {
	AtualizaProgressoBauDourado();
	bauDouradoEmJogo = document.visibilityState !== "hidden";
	if (!AutoSaveLocal()) {
		UI.showInfo("Não foi possível salvar o progresso do baú dourado.");
	}
}

function TickBauDourado() {
	if (AtualizaProgressoBauDourado() && !AutoSaveLocal()) {
		UI.showInfo("O baú dourado ficou pronto, mas não foi possível salvar o progresso.");
	}
}

let eventosBauDouradoRegistrados = false;

function AtualizaTempoOfflineMenu(timestampSalvo, quantidadeFormigasPretas = 0) {
	const offlineTime = document.getElementById("menu-offline-time");
	if (!offlineTime) return;

	if (!Number.isFinite(timestampSalvo) || timestampSalvo <= 0) {
		offlineTime.textContent = "O tempo offline começará a ser contado ao entrar na aventura.";
		offlineTime.hidden = false;
		return;
	}

	const limiteTempoOffline = LimiteTempoOffline(quantidadeFormigasPretas);
	const tempoMs = Math.min(
		limiteTempoOffline,
		Math.max(0, Date.now() - timestampSalvo)
	);
	const formatarDuracao = valor => {
		const minutosTotais = Math.floor(valor / 60000);
		const horas = Math.floor(minutosTotais / 60);
		const minutos = minutosTotais % 60;
		const segundos = Math.floor(valor / 1000) % 60;
		if (horas > 0) return minutos > 0 ? `${horas}h ${minutos}min` : `${horas}h`;
		if (minutos > 0) return `${minutos}min ${segundos}s`;
		return `${segundos}s`;
	};
	const limiteAtingido = tempoMs >= limiteTempoOffline;
	const tempoFormatado = formatarDuracao(tempoMs);
	const limiteFormatado = formatarDuracao(limiteTempoOffline);

	offlineTime.textContent = limiteAtingido
		? `Tempo offline acumulado: ${tempoFormatado} (limite máximo de ${limiteFormatado})`
		: `Tempo offline acumulado: ${tempoFormatado} / ${limiteFormatado}`;
	offlineTime.hidden = false;
}

function PrepararMenu() {
	PrepararDesktop();
	const status = document.getElementById("menu-save-status");
	const details = document.getElementById("menu-save-details");
	if (!status || !details) return;

	if (menuOfflineTimer !== null) clearInterval(menuOfflineTimer);
	const saveData = localStorage.getItem("autoSaveCaverna");
	if (!saveData) return;

	try {
		const save = JSON.parse(saveData);
		if (!Number.isFinite(Number(save.andar)) || !Number.isFinite(Number(save.totalDerrotados))) {
			throw new TypeError("O save não contém dados válidos de progresso.");
		}

		status.textContent = "Aventura salva encontrada";
		details.textContent =
			`Andar ${save.andar} · ${save.totalDerrotados} inimigos derrotados`;
		const formigasPretasSalvas = save.formigasPretas ?? 0;
		AtualizaTempoOfflineMenu(save.offlineLastSavedAt, formigasPretasSalvas);
		menuOfflineTimer = setInterval(
			() => AtualizaTempoOfflineMenu(save.offlineLastSavedAt, formigasPretasSalvas),
			1000
		);
		document.getElementById("menu-save-card").classList.add("menu-save-card--active");
		document.getElementById("btn-Jogar").textContent = "Continuar aventura";
	} catch (error) {
		console.error("Não foi possível ler o progresso salvo no menu:", error);
		status.textContent = "Save encontrado, mas não foi possível ler o progresso";
		details.textContent = "Entre na caverna para tentar carregar a aventura.";
	}
}

function SalvarEVoltarMenu() {
	if (!AutoSaveLocal()) {
		MostraInfo("Não foi possível salvar. Você permanece na caverna.");
		return;
	}

	window.location.href = "index.html";
}

let intervalos = [];

function PreCarregamento() {
	PrepararDesktop();
	RegistraEventosAudioJogo();
	bauDouradoEmJogo = document.visibilityState !== "hidden";
	if (!eventosBauDouradoRegistrados) {
		document.addEventListener("visibilitychange", AtualizaModoBauDourado);
		window.addEventListener("pagehide", AtualizaModoBauDourado);
		eventosBauDouradoRegistrados = true;
	}

	// tenta carregar auto save
	const saveCarregado = CarregarAutoSave();

	const volumeSalvo = localStorage.getItem("volumeJogo");
	if (volumeSalvo !== null) {
		const percentual = Number(volumeSalvo);
		if (Number.isFinite(percentual) && percentual >= 0 && percentual <= 100) {
			volumeAtual = percentual / 100;
		}
	}
	AtualizaVolume(volumeAtual * 100);
	const volumeAmbienteSalvo = localStorage.getItem("volumeAmbienteJogo");
	if (volumeAmbienteSalvo !== null) {
		const percentual = Number(volumeAmbienteSalvo);
		if (Number.isFinite(percentual) && percentual >= 0 && percentual <= 100) {
			volumeAmbiente = percentual / 100;
		}
	}
	AtualizaVolumeAmbiente(volumeAmbiente * 100);

	// Reinicializa os temporizadores do jogo sem criar uma segunda contagem de avanço.
	intervalos.forEach(clearInterval);
	intervalos = [];
	if (avancoInterval) clearInterval(avancoInterval);
	avancoInterval = setInterval(AvancoInimigos, 1000);
	intervalos.push(setInterval(AutoSaveLocal, 30000));
	intervalos.push(setInterval(TickBauDourado, 1000));

	intervalos.push(setInterval(DanoCompanheiros, 1000));
	intervalos.push(setInterval(GoldCompanheiros, 1000));
	intervalos.push(setInterval(TempoCompanheiros, 10000));
	intervalos.push(setInterval(HabilidadeDano, 1000));

	if (qtdSave == 0) {
		intervalos.push(setInterval(() => MostraInfo(''), 25000));
	}

	if (!saveCarregado) Batalha();
}

//// Resetar
function Resetar() {
	recompensasOfflinePendentes = null;
	ultimaDataSaveOffline = Date.now();
	numInimigosTela = 1; //usada para validar quantos inimigos e
	andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
	marcoGoldRun = 0;
	qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
	inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
	derrotadosRun = 0; //abates da run zerados (a conversão em CM acontece antes, no VoltaAndar)
	// perks são por run: níveis e pontos zeram a cada reset
	// (o +5% de dano por portão >= 35 continua permanente — gateDanoPago)
	andarMaxRun = 1;
	perkDano = 0;
	perkEletrica = 0;
	perkGold = 0;
	perkFuga = 0;
	limiteInimigos = 1; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
	gold = new GoldNumber(0); //quantidade de dinheiro do jogador
	totalGold = new GoldNumber(0); //quantidade total de dinheiro do jogador
	saveAnd = 10; //andar que será efetuado o salvamento automatico
	qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
	danoJogador = 1; //dano atual do jogador
	danoCritJogador = 2; //dano critico atual do jogador
	// teto ×4 + +0,1 por nível do Conhecimento (permanente; o +0,1 da loja de
	// gold é por run e é reconstruído nas compras da run)
	multiplicadorMaximoDanoCritico = Math.round((4 + 0.1 * cmNivelCrit) * 10) / 10;
	chanceCrit = 0.01; //chance em porcentagem de se causar um dano critico
	//as vidas dos inimigos sao recalculadas por CarregarStatus logo apos o reset
	//mulGoldAvanco NAO e mais zerado aqui: e um item permanente da loja de esmeraldas
	avanco = 0; //variavel utilizada para calculo de probabilidade de um avanço rapido entre andares
	qtdAvanco = 2;////variavel que determina quantos inimigos serão derrotados noa vanço rapido
	ValidaBater = 30; //tempo atual para que se possa executar um ataque com o espaço
	MaxValidaBater = 30; //tempo maximo para que se possa executar um ataque com o espaço

	tempoAvancoInimigos = TempoFugaMax(); //tempo para que o jogar seja obrigado a recuar um andar (base 120 + bônus do Conhecimento)
	nivelJogador = 1;
	xpAtual = 0;
	pontosHabilidade = 0;
	nivelSkillDano = 0;
	nivelSkillEletrica = 0;
	nivelSkillGold = 0;
	nivelSkillFuga = 0;
	tempoHabilidadeDano = 30;
	verificaHabilidadeDano = false;
	qtdCarregaHabilidade = 0;
	document.getElementById("habilidade1")?.remove();
	const chkManterAndar = document.getElementById("manterAndar");
	if (chkManterAndar) chkManterAndar.checked = false;
	abatesCorrenteEletrica = 0;
	ataquesCorrenteEletrica = 0;
	abatesBonusGoldAtaque = 0;
	ataquesBonusGold = 0;
	abatesPausaFuga = 0;
	segundosPausaFuga = 0;
	andarBoss = 10; //andar atual onde aparecerão inimigos mais fortes
	missao = Array(" ", "Coleta de Gold", "Golpes", "Caça aos Mugs", "Tempo") //vetor usado para listagem das missões
	missaoAtual = 0; //nenhuma missao ativa ate o proximo sorteio
	missaoColeta = 500, missaoColetaAtual = 0.0; //Gold necessario para completar a missão "Coleta de gold"
	missaoGolpe = 100, missaoGolpeAtual = 0; //Quantidade de golpes necessarios para concluir a missão "Golpes"
	missaoCacaMugs = 50, missaoCacaMugsAtual = 0; //Quantidade de mugs necessarios para completar a missão "Caça aos Mugs"
	missaoTempo = 600, missaoTempoAtual = 0; //segundos necessarios para concluir a missão "Tempo"
	missaoDesafioSub = 0;
	missaoDesafioAlvo = 10, missaoDesafioAtual = 0;
	missaoDesafioTempo = 0;
	desafioFalhando = false;
	qtdMissoes = 5; //Quantidade de missões disponiveis (4 estatísticas + 1 desafio)
	statusMissao = true; //Verifica se a missão pode ser iniciada
	////

	//variaveis referentes a loja
	precoDano = 5;
	mulDano = 1;
	lvlDano = 1;

	precoBEspaco = 45;
	lvlBEspaco = 1;

	precoGold = 100;
	sobeGold = 0.3;
	lvlGold = 1;

	precoAvan = 80;
	sobeAvanco = 0.01;
	lvlAvan = 0;

	precoDCrit = 150;
	sobeDCrit = 0.2;
	lvlDCrit = 1;

	precoCCrit = 250;
	sobeCCrit = 0.02;
	lvlCCrit = 1;

	precoQTDAvanco = 200;
	lvlQTDAvanco = 1;

	precoVidaInimigo = 150;
	subVidaInimigo = 0.01;
	lvlSubVida = 0;

	precoBau = 25;
	lvlBau = 1;

	precoDano = precoDano * (1 - descontoLoja);
	precoBEspaco = precoBEspaco * (1 - descontoLoja);
	precoGold = precoGold * (1 - descontoLoja);
	precoAvan = precoAvan * (1 - descontoLoja);
	precoDCrit = precoDCrit * (1 - descontoLoja);
	precoCCrit = precoCCrit * (1 - descontoLoja);
	precoQTDAvanco = precoQTDAvanco * (1 - descontoLoja);

	chanceBau = 0.1;

	AtualizaLojaGold();
	UI.updateSkillProgress();
	if (document.getElementById("skillUpgradeModal")) UI.showSkillUpgradePanel();

	mulGoldInicial = mulGold;
	console.log("2 " + mulGoldInicial);

	////
	if (danoBonus != 0 && !isNaN(danoBonus)) {
		danoJogador = danoJogador * danoBonus;
		LimitaDanoCritico();
	}

	// Bônus permanente de dano dos resets (+5% por portão >= 35, único por portão)
	if (danoResetQtd > 0 && isFinite(danoResetQtd)) {
		danoJogador = danoJogador * Math.pow(1.05, danoResetQtd);
		LimitaDanoCritico();
	}

	// Loja do Conhecimento: +1% de dano permanente por nível
	if (cmNivelDano > 0 && isFinite(cmNivelDano)) {
		danoJogador = danoJogador * Math.pow(1.01, cmNivelDano);
		LimitaDanoCritico();
	}

	// Crítico das conquistas é permanente: devolve o bônus acumulado (Conquistas()).
	// Base é 2 (valor inicial do reset); os LimitaDanoCritico intermediários podem
	// ter subido o crítico pro piso do dano — recalcular da base evita somar o piso 2x.
	if (bonusCritConquista > 0 && isFinite(bonusCritConquista)) {
		danoCritJogador = 2 + bonusCritConquista;
		LimitaDanoCritico();
	}

	// Loja do Conhecimento: +1% de dano crítico por nível (dentro do teto ×4)
	if (cmNivelCrit > 0 && isFinite(cmNivelCrit)) {
		danoCritJogador = danoCritJogador * Math.pow(1.01, cmNivelCrit);
		LimitaDanoCritico();
	}

	if (lvlComp1 > 0) {
		danoComp = danoJogador * danoComp1;
	}

	Salvar();
}
////

function Batalha() {

	AtualizarTela?.();
	CarregarStatus?.();
	CriarCompanheiros?.();
	CriarInimigos?.();
	MostraStatus?.();
}

// =========================
// AUTO SAVE (LOCAL STORAGE)
// =========================

function CriarObjetoSave() {

	console.log(gold, totalGold);

	return {

		numInimigosTela,
		andar,
		marcoGoldRun,
		qtdInimigosAndar,
		inimigosDerrotados,
		limiteInimigos,

		gold: {
			m: gold.m,
			e: gold.e
		},

		totalGold: {
			m: totalGold.m,
			e: totalGold.e
		},

		saveAnd,
		qtdSave,
		maxAndar,
		andarVolta,
		gateDanoPago,
		andarMaxRun,
		danoResetQtd,
		perkDano,
		perkEletrica,
		perkGold,
		perkFuga,
		conhecimentoMug,
		derrotadosRun,
		cmNivelDano,
		cmNivelGold,
		cmNivelXp,
		cmNivelFuga,
		cmNivelCrit,
		cmNivelFormiga,
		cmNivelDuasFormigas,
		cmNivelComp,
		cmNivelGoldComp2,
		totalDerrotados,
		nivelJogador,
		xpAtual,
		pontosHabilidade,
		nivelSkillDano,
		nivelSkillEletrica,
		nivelSkillGold,
		nivelSkillFuga,
		formigasVermelhas,
		formigasAmarelas,
		formigasMarrons,
		formigasPretas,
		formigasCinzas,

		danoJogador,
		danoCritJogador,
		multiplicadorMaximoDanoCritico,
		chanceCrit,

		vidaAndar,
		vidaInimigo1,
		vidaInimigo2,
		vidaInimigo3,
		vidaInimigo4,

		mulGold,
		mulGoldAvanco,
		avanco,
		qtdAvanco,

		ValidaBater,
		MaxValidaBater,

		danoComp,
		danoCritComp,
		goldCompanheiro,
		tempoEsperaCompanheiro,

		esmeraldas,
		numVoltas,
		tempoAvancoInimigos,
		andarBoss,
		abatesCorrenteEletrica,
		ataquesCorrenteEletrica,
		abatesBonusGoldAtaque,
		ataquesBonusGold,
		abatesPausaFuga,
		segundosPausaFuga,
		qtdCarregaHabilidade,

		progressoConquistaDano,
		progressoConquistaGold,
		validaConquista,
		totalNiveis,
		bonusCritConquista,

		precoDano,
		mulDano,
		lvlDano,

		precoBEspaco,
		lvlBEspaco,

		precoGold,
		sobeGold,
		lvlGold,

		precoAvan,
		sobeAvanco,
		lvlAvan,

		precoDCrit,
		sobeDCrit,
		lvlDCrit,

		precoCCrit,
		sobeCCrit,
		lvlCCrit,

		precoComp1,
		danoComp1,
		lvlComp1,

		precoAvGold,
		lvlAvGold,

		precoComp2,
		goldComp2,
		lvlComp2,

		precoComp3,
		tempoComp3,
		lvlComp3,

		precoXP,
		lvlXP,

		precoEsmCM,
		lvlEsmCM,

		descontoLoja,
		mulGoldInicial,
		danoBonus,

		precoQTDAvanco,
		lvlQTDAvanco,

		precoVidaInimigo,
		subVidaInimigo,
		lvlSubVida,

		chanceBau,
		chanceEsmeraldaBau,
		precoBau,
		lvlBau,
		offlineLastSavedAt: ultimaDataSaveOffline,
		offlinePendingRewards: recompensasOfflinePendentes,
		progressoBauDourado,
		bauDouradoPendente,
		ultimaAtualizacaoBauDourado
	};
}

function AutoSaveLocal() {

	// Zerando o jogo: o save está sendo apagado de propósito e não pode ser regravado
	// (o reload dispara pagehide/visibilitychange, que chamam esta função).
	if (jogoSendoZerado) return true;

	const ultimaDataAnterior = ultimaDataSaveOffline;
	try {

		AtualizaProgressoBauDourado();
		ultimaDataSaveOffline = Date.now();
		const save = CriarObjetoSave();

		localStorage.setItem(
			"autoSaveCaverna",
			JSON.stringify(save)
		);

		console.log("Auto Save realizado");
		return true;

	} catch (e) {

		ultimaDataSaveOffline = ultimaDataAnterior;
		console.error("Erro Auto Save:", e);
		return false;
	}
}

function CarregarAutoSave() {

	try {

		const save = localStorage.getItem("autoSaveCaverna");

		if (!save) {
			console.log("Nenhum Auto Save encontrado");
			MostraInfos();
			return false;
		}

		Carregar(save, true);

		MostraInfo?.("Auto Save carregado!");

		return true;

	} catch (e) {

		console.error("Erro ao carregar Auto Save:", e);

		return false;
	}
}

function LimparAutoSave() {

	localStorage.removeItem("autoSaveCaverna");

	console.log("Auto Save removido");
}

// Apaga todos os saves e faz o jogo voltar ao zero
var confirmacaoZerarJogo = null;
var jogoSendoZerado = false;

function ZerarTodosSaves() {

	const botao = document.getElementById("btnZerarJogo");
	if (!botao) return;

	// Sem diálogo nativo: o primeiro clique arma a confirmação e o segundo (em até 5s)
	// executa, para funcionar igual no PC, no navegador e no Android.
	if (confirmacaoZerarJogo === null) {
		botao.value = "Confirmar? Apaga tudo";
		MostraInfo?.("Todos os saves serão apagados e o jogo volta ao zero. Clique de novo para confirmar.");

		confirmacaoZerarJogo = setTimeout(() => {
			confirmacaoZerarJogo = null;
			botao.value = "Apagar todos os saves";
		}, 5000);
		return;
	}

	clearTimeout(confirmacaoZerarJogo);
	confirmacaoZerarJogo = null;

	try {
		// Bloqueia o AutoSaveLocal até a página recarregar, senão o save seria
		// regravado no momento do reload e o jogo não zerava.
		jogoSendoZerado = true;
		localStorage.removeItem("autoSaveCaverna");
	} catch (e) {
		jogoSendoZerado = false;
		console.error("Erro ao apagar os saves:", e);
		MostraInfo?.("Não foi possível apagar os saves.");
		botao.value = "Apagar todos os saves";
		return;
	}

	// Recarrega a caverna sem save: começa do zero (andar 1, gold 0, loja zerada)
	window.location.reload();
}