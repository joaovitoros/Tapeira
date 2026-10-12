// ===================== AUTO SAVE (LOCAL STORAGE) =====================
// CriarObjetoSave, AutoSaveLocal, CarregarAutoSave e LimparAutoSave
// gravam/leem o save em localStorage. APIs globais mantidas.

// Se um autosave existente falhar na validação, não o substitui silenciosamente
// pela sessão nova no andar 1. Um JSON válido importado libera o salvamento de novo.
let autoSaveBloqueadoPorIncompatibilidade = false;

function CriarObjetoSave(incluirOffline = true) {

	const save = {

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
		ticketsMug,
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
		// ids de cartões de batalha já duelados e ids de cartões que eu
		// exportei (anti-farm do PvP) — permanentes, não zera no Resetar
		pvpCartoesUsados,
		pvpCartoesExportados,
		// nome do jogador (Casa) — identidade permanente exibida nos duelos
		nomeJogador,
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
		casaNivel,
		trofeusExibidos,
		fazendaNivel,
		fazendaRainha,
		pesquisaItens,
		pesquisaInimigos,
		trofeus,
		chapeuEquipado,
		cachecolEquipado,
		ofertasDia,
		ofertasDiaCompradas,
		reputacao,
		fabricaNivel,
		cristalNivel,
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

	if (!incluirOffline) {
		delete save.offlineLastSavedAt;
		delete save.offlinePendingRewards;
	}

	return save;
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
}
