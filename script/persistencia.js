// ===================== PERSISTÊNCIA DO JOGO =============================
// Exportação/importação do save em arquivo JSON.
// A montagem do estado (Carregar) ficou em persistencia-carregar.js e o
// auto save local em persistencia-autosave.js. APIs globais mantidas.


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
