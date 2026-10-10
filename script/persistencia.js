// ===================== PERSISTÊNCIA DO JOGO =============================
// Exportação/importação JSON, validação e auto save local.
// Mantém APIs globais durante a migração dos scripts clássicos.

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
		perkFrenesi,
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
		nivelSkillFrenesi,
		ramoSkillDano,
		ramoSkillEletrica,
		ramoSkillGold,
		ramoSkillFuga,
		ramoSkillFrenesi,
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

		conquistasComp,
		missoesCompletas,
		desafiosVencidos,
		melhorGoldRun: {
			m: melhorGoldRun.m,
			e: melhorGoldRun.e
		},
		runInicioMs,
		comprasRun,

		precoDano,
		mulDano,
		lvlDano,
		patenteDano,

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
		patenteDCrit,

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

		precoComp4,
		lvlComp4,

		precoComp5,
		lvlComp5,

		precoComp6,
		lvlComp6,

		precoXP,
		lvlXP,
		marcosNivel50,
		resetsCurtosCM,

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
		precoEsmBau,
		lvlEsmBau,
		patenteBau,
		patenteBEspaco,
		patenteQTDAvan,
		patenteCCrit,
		patenteSubVida,
		patenteAvan,
		patenteEsmBau,
		progressoBauDourado,
		bauDouradoPendente,
		ultimaAtualizacaoBauDourado,
		autoColeta,
		autoCompra,
		autoGasto,
		autoItensLoja,
		precoVelComp,
		lvlVelComp,
		velAtaqueComp,
		patenteVelComp,
		especializacao,
		especializacaoTrocas,

		// itens da build e opções do baú atual (estado por run)
		...Tapeira.ItensBuild.serializa()
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

function Carregar(saveData, calculaOffline = false) {

	var save = JSON.parse(saveData);
	ValidarSave(save);
	EncerraEvento(true); //estado transitório de evento não atravessa o load
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
	perkFrenesi = save.perkFrenesi ?? 0;
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
	nivelSkillFrenesi = save.nivelSkillFrenesi ?? 0;
	// árvore de ramos: save antigo nasce sem caminho (0); o saneamento
	// derruba caminho escolhido com a skill abaixo do nível mínimo
	ramoSkillDano = save.ramoSkillDano ?? 0;
	ramoSkillEletrica = save.ramoSkillEletrica ?? 0;
	ramoSkillGold = save.ramoSkillGold ?? 0;
	ramoSkillFuga = save.ramoSkillFuga ?? 0;
	ramoSkillFrenesi = save.ramoSkillFrenesi ?? 0;
	ConfereRamosSave();
	formigasVermelhas = save.formigasVermelhas ?? 0;
	formigasAmarelas = save.formigasAmarelas ?? 0;
	formigasMarrons = save.formigasMarrons ?? 0;
	formigasPretas = save.formigasPretas ?? 0;
	formigasCinzas = save.formigasCinzas ?? 0;

	danoJogador = save.danoJogador ?? 1;
	danoCritJogador = save.danoCritJogador ?? 2;
	multiplicadorMaximoDanoCritico = save.multiplicadorMaximoDanoCritico ?? 4;
	// saves antigos compraram crítico do CM antes do teto virar item do CM:
	// garante o piso (4 + +0,2 por nível); o valor salvo vale se for maior
	// (inclui os +0,1 da loja de gold comprados nesta run)
	multiplicadorMaximoDanoCritico = Math.max(
		multiplicadorMaximoDanoCritico,
		Math.round((4 + 0.2 * cmNivelCrit) * 10) / 10);
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
	// migração: o comp 3 (Mago do Relógio) não dá mais tempo extra —
	// o tempo acumulado em saves antigos é descartado
	tempoEsperaCompanheiro = 0;

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
	// goldCompanheiro gravado é decorrência da fórmula: recompõe no load
	// (saves antigos já nascem com o gold do companheiro em dobro)
	goldCompanheiro = GoldCompanheiroPorSegundo();

	precoComp3 = save.precoComp3 ?? 4;
	tempoComp3 = save.tempoComp3 ?? 1;
	lvlComp3 = save.lvlComp3 ?? 0;

	precoComp4 = save.precoComp4 ?? 6;
	lvlComp4 = save.lvlComp4 ?? 0;

	precoComp5 = save.precoComp5 ?? 8;
	lvlComp5 = save.lvlComp5 ?? 0;

	precoComp6 = save.precoComp6 ?? 10;
	lvlComp6 = save.lvlComp6 ?? 0;

	precoXP = save.precoXP ?? 1;
	lvlXP = save.lvlXP ?? 0;
	marcosNivel50 = save.marcosNivel50 ?? 0;
	resetsCurtosCM = save.resetsCurtosCM ?? 0;
	// saves antigos do recurso (nível já >= 50 antes do recurso existir):
	// reivindica os marcos pendentes sem nunca repetir os já pagos
	ConfereMarcosNivel50();

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

	precoEsmBau = save.precoEsmBau ?? 500;
	lvlEsmBau = save.lvlEsmBau ?? 0;
	// Velocidade do Companheiro: saves antigos nascem na base (1 hit/s)
	precoVelComp = save.precoVelComp ?? 125;
	lvlVelComp = save.lvlVelComp ?? 1;
	velAtaqueComp = save.velAtaqueComp ?? 1;
	// Conquistas comportamentais: permanentes (ausentes = nenhuma desbloqueada).
	// Saves antigos já passando do andar 25 nascem como "comprou": sem histórico
	// de compras no save não dá pra provar o contrário — sem unlock de graça.
	conquistasComp = Array.isArray(save.conquistasComp) ? save.conquistasComp.slice() : [0, 0, 0, 0, 0];
	missoesCompletas = save.missoesCompletas ?? 0;
	desafiosVencidos = save.desafiosVencidos ?? 0;
	melhorGoldRun = GoldNumber.fromMantissaExponent(save.melhorGoldRun?.m ?? 0, save.melhorGoldRun?.e ?? 0);
	runInicioMs = save.runInicioMs ?? Date.now();
	comprasRun = save.comprasRun ?? (andar >= 25 ? 1 : 0);
	// patentes ausentes = 0 (★I): saves de antes da feature nascem na base
	patenteBau = save.patenteBau ?? 0;
	patenteBEspaco = save.patenteBEspaco ?? 0;
	patenteQTDAvan = save.patenteQTDAvan ?? 0;
	patenteCCrit = save.patenteCCrit ?? 0;
	patenteSubVida = save.patenteSubVida ?? 0;
	patenteAvan = save.patenteAvan ?? 0;
	patenteEsmBau = save.patenteEsmBau ?? 0;
	patenteVelComp = save.patenteVelComp ?? 0;
	patenteDano = save.patenteDano ?? 0;
	patenteDCrit = save.patenteDCrit ?? 0;
	// tick do companheiro reacomoda com a velocidade carregada (o bloco de
	// intervalos do PreCarregamento limpa e recria logo em seguida)
	SincronizaIntervaloDanoComp();
	// intervalos dos novos companheiros (Mago do Relógio e
	// Alquimista) também iniciam no load
	SincronizaIntervalosNovosCompanheiros();

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
	// automação: ausentes em saves antigos nascem ligadas (o desbloqueio é o
	// próprio maxAndar — salvo quem já passou dos pisos 40/50 ganha na hora)
	autoColeta = save.autoColeta ?? 1;
	autoCompra = save.autoCompra ?? 1;
	autoGasto = save.autoGasto ?? 0; // nasce desligado (opt-in)
	autoItensLoja = Array.isArray(save.autoItensLoja) ? save.autoItensLoja.slice() : [];
	// especialização: save antigo nasce sem build (o desbloqueio é a andarVolta)
	especializacao = save.especializacao ?? 0;
	especializacaoTrocas = save.especializacaoTrocas ?? 0;
	// itens da build: save antigo nasce vazio; ids desconhecidos são ignorados
	Tapeira.ItensBuild.carrega(save);
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
	// baú de itens da build pendente sobrevive ao reload: repõe o ícone
	if (Tapeira.ItensBuild.pendente()) UI.spawnBauBuild();

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
			// Valida antes de liberar o auto save: um JSON incompatível não pode
			// substituir nem desbloquear o progresso local que falhou no load.
			ValidarSave(JSON.parse(reader.result));
			autoSaveBloqueadoPorIncompatibilidade = false;
			const autoSaveAtualizado = Carregar(reader.result);
			MostraInfo(autoSaveAtualizado
				? "Save importado e progresso local atualizado."
				: "Save importado, mas não foi possível atualizar o auto save local.");
		} catch (error) {
			console.error("Não foi possível importar o save:", error);
			MostraInfo(`Save inválido ou incompatível: ${error.message} O progresso atual foi mantido.`);
		}
	};
	reader.onerror = function () {
		console.error("Não foi possível ler o arquivo de save:", reader.error);
		MostraInfo("Não foi possível ler o arquivo de save.");
	};
	reader.readAsText(file);
}

// =========================
// AUTO SAVE (LOCAL STORAGE)
// =========================

// Se um autosave existente falhar na validação, não o substitui silenciosamente
// pela sessão nova no andar 1. Um JSON válido importado libera o salvamento de novo.
let autoSaveBloqueadoPorIncompatibilidade = false;

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
		perkFrenesi,
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
		nivelSkillFrenesi,
		ramoSkillDano,
		ramoSkillEletrica,
		ramoSkillGold,
		ramoSkillFuga,
		ramoSkillFrenesi,
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

		conquistasComp,
		missoesCompletas,
		desafiosVencidos,
		melhorGoldRun: {
			m: melhorGoldRun.m,
			e: melhorGoldRun.e
		},
		runInicioMs,
		comprasRun,

		precoDano,
		mulDano,
		lvlDano,
		patenteDano,

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
		patenteDCrit,

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

		precoComp4,
		lvlComp4,

		precoComp5,
		lvlComp5,

		precoComp6,
		lvlComp6,

		precoXP,
		lvlXP,
		marcosNivel50,
		resetsCurtosCM,

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
		precoEsmBau,
		lvlEsmBau,
		patenteBau,
		patenteBEspaco,
		patenteQTDAvan,
		patenteCCrit,
		patenteSubVida,
		patenteAvan,
		patenteEsmBau,
		offlineLastSavedAt: ultimaDataSaveOffline,
		offlinePendingRewards: recompensasOfflinePendentes,
		progressoBauDourado,
		bauDouradoPendente,
		ultimaAtualizacaoBauDourado,
		autoColeta,
		autoCompra,
		autoGasto,
		autoItensLoja,
		precoVelComp,
		lvlVelComp,
		velAtaqueComp,
		patenteVelComp,
		especializacao,
		especializacaoTrocas,

		// itens da build e opções do baú atual (estado por run)
		...Tapeira.ItensBuild.serializa()
	};
}

function AutoSaveLocal() {

	// Zerando o jogo: o save está sendo apagado de propósito e não pode ser regravado
	// (o reload dispara pagehide/visibilitychange, que chamam esta função).
	if (jogoSendoZerado) return true;
	if (autoSaveBloqueadoPorIncompatibilidade) return false;

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
		autoSaveBloqueadoPorIncompatibilidade = true;
		MostraInfo?.(`O auto save é inválido ou incompatível: ${e.message} Ele foi preservado; importe um JSON válido para continuar salvando.`);

		return false;
	}
}

function LimparAutoSave() {

	localStorage.removeItem("autoSaveCaverna");
	autoSaveBloqueadoPorIncompatibilidade = false;

	console.log("Auto Save removido");
}
