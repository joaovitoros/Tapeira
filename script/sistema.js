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
		totalDerrotados,

		danoJogador,
		danoCritJogador,
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

		progressoConquistaDano,
		progressoConquistaGold,
		validaConquista,

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
		lvlBau
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

	for (const key of ["gold", "totalGold"]) {
		const currency = save[key];
		if (!currency || typeof currency !== "object"
			|| !Number.isFinite(currency.m) || !Number.isFinite(currency.e)) {
			throw new TypeError("O save não contém dados de gold válidos.");
		}
	}

	for (const [key, value] of Object.entries(save)) {
		if (["saveFormat", "saveVersion", "exportedAt", "gold", "totalGold"].includes(key)) continue;
		if (typeof value !== "number" || !Number.isFinite(value)) {
			throw new TypeError("O save contém dados inválidos.");
		}
	}
}

function Carregar(saveData) {

	var save = JSON.parse(saveData);
	ValidarSave(save);

	function safeNumber(v) {
		v = Number(v);
		return isFinite(v) ? v : 0;
	}

	numInimigosTela = save.numInimigosTela ?? 1;
	andar = save.andar ?? 1;
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
	andarVolta = save.andarVolta ?? 20;
	totalDerrotados = save.totalDerrotados ?? 0;

	danoJogador = save.danoJogador ?? 1;
	danoCritJogador = save.danoCritJogador ?? 2;
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

	tempoAvancoInimigos = save.tempoAvancoInimigos ?? 120;
	andarBoss = save.andarBoss ?? 10;

	progressoConquistaDano = save.progressoConquistaDano ?? 100;
	progressoConquistaGold = save.progressoConquistaGold ?? 500;
	validaConquista = save.validaConquista ?? 1;

	precoDano = save.precoDano ?? 5;
	mulDano = save.mulDano ?? 1;
	lvlDano = save.lvlDano ?? 1;

	precoBEspaco = save.precoBEspaco ?? 45;
	lvlBEspaco = save.lvlBEspaco ?? 1;

	precoGold = save.precoGold ?? 50;
	sobeGold = save.sobeGold ?? 0.05;
	lvlGold = save.lvlGold ?? 1;

	precoAvan = save.precoAvan ?? 80;
	sobeAvanco = save.sobeAvanco ?? 0.01;
	lvlAvan = save.lvlAvan ?? 0;

	precoDCrit = save.precoDCrit ?? 100;
	sobeDCrit = save.sobeDCrit ?? 0.1;
	lvlDCrit = save.lvlDCrit ?? 1;

	precoCCrit = save.precoCCrit ?? 200;
	sobeCCrit = save.sobeCCrit ?? 0.02;
	lvlCCrit = save.lvlCCrit ?? 1;

	precoComp1 = save.precoComp1 ?? 0;
	danoComp1 = save.danoComp1 ?? 0.4;
	lvlComp1 = save.lvlComp1 ?? 0;

	precoAvGold = save.precoAvGold ?? 2;
	lvlAvGold = save.lvlAvGold ?? 1;

	precoComp2 = save.precoComp2 ?? 3;
	goldComp2 = save.goldComp2 ?? 0.5;
	lvlComp2 = save.lvlComp2 ?? 0;

	precoComp3 = save.precoComp3 ?? 4;
	tempoComp3 = save.tempoComp3 ?? 1;
	lvlComp3 = save.lvlComp3 ?? 0;

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
	precoBau = save.precoBau ?? 10;
	lvlBau = save.lvlBau ?? 1;

	RemoverInimigos();
	CarregarStatus();
	CriarInimigos();
	AbreLoja();

	Batalha?.();
	return AutoSaveLocal();
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
		if (!el.muted) el.play();
	}
}

let volumeAtual = 0.05;

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

function PrepararMenu() {
	PrepararDesktop();
	const status = document.getElementById("menu-save-status");
	const details = document.getElementById("menu-save-details");
	if (!status || !details) return;

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

	// tenta carregar auto save
	CarregarAutoSave();

	const volumeSalvo = localStorage.getItem("volumeJogo");
	if (volumeSalvo !== null) {
		const percentual = Number(volumeSalvo);
		if (Number.isFinite(percentual) && percentual >= 0 && percentual <= 100) {
			volumeAtual = percentual / 100;
		}
	}
	AtualizaVolume(volumeAtual * 100);

	// Reinicializa os temporizadores do jogo sem criar uma segunda contagem de avanço.
	intervalos.forEach(clearInterval);
	intervalos = [];
	if (avancoInterval) clearInterval(avancoInterval);
	avancoInterval = setInterval(AvancoInimigos, 1000);
	intervalos.push(setInterval(AutoSaveLocal, 30000));

	intervalos.push(setInterval(DanoCompanheiros, 1000));
	intervalos.push(setInterval(GoldCompanheiros, 1000));
	intervalos.push(setInterval(TempoCompanheiros, 10000));
	intervalos.push(setInterval(HabilidadeDano, 1000));

	if (qtdSave == 0) {
		intervalos.push(setInterval(() => MostraInfo(''), 25000));
	}

	Batalha();
}

//// Resetar
function Resetar() {
	numInimigosTela = 1; //usada para validar quantos inimigos e
	andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
	qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
	inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
	limiteInimigos; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
	gold = new GoldNumber(0); //quantidade de dinheiro do jogador
	totalGold = new GoldNumber(0); //quantidade total de dinheiro do jogador
	saveAnd = 10; //andar que será efetuado o salvamento automatico
	qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
	danoJogador = 1; //dano atual do jogador
	danoCritJogador = 2; //dano critico atual do jogador
	chanceCrit = 0.01; //chance em porcentagem de se causar um dano critico
	vidaAndar; //usado para marcar a vida maximo que os inimigos podem ter no andar atual
	vidaInimigo1; //vida atual do inimigo 1
	vidaInimigo2; //vida atual do inimigo 2
	vidaInimigo3; //vida atual do inimigo 3
	vidaInimigo4; //vida atual do inimigo 4
	mulGoldAvanco = 1; //variavel utilizada para efetuar acrescimo de dinheiro ao avançar andares
	avanco = 0; //variavel utilizada para calculo de probabilidade de um avanço rapido entre andares
	qtdAvanco = 2;////variavel que determina quantos inimigos serão derrotados noa vanço rapido
	ValidaBater = 30; //tempo atual para que se possa executar um ataque com o espaço
	MaxValidaBater = 30; //tempo maximo para que se possa executar um ataque com o espaço

	tempoAvancoInimigos = 120; //tempo para que o jogar seja obrigado a recuar um andar
	andarBoss = 10; //andar atual onde aparecerão inimigos mais fortes
	missao = Array(" ", "Coleta de Gold", "Golpes", "Caça aos Mugs", "Tempo") //vetor usado para listagem das missões
	missaoAtual; //variavel que determina a missão atual (1- coleta de gol, 2- tempo, 3- caça aos mugs)
	missaoColeta = 500, missaoColetaAtual = 0.0; //Gold necessario para completar a missão "Coleta de gold"
	missaoGolpe = 100, missaoGolpeAtual = 0; //Quantidade de golpes necessarios para concluir a missão "Golpes"
	missaoCacaMugs = 50, missaoCacaMugsAtual = 0; //Quantidade de mugs necessarios para completar a missão "Caça aos Mugs"
	missaoTempo = 10000, missaoTempoAtual = 0; //tempo em milissegundos necessarios para concluir a missão "Tempo"
	qtdMissoes = 4; //Quantidade de missões disponiveis
	statusMissao = true; //Verifica se a missão pode ser iniciada
	////

	//variaveis referentes a loja
	precoDano = 5;
	mulDano = 1;
	lvlDano = 1;

	precoBEspaco = 45;
	lvlBEspaco = 1;

	precoGold = 50;
	sobeGold = 0.05;
	lvlGold = 1;

	precoAvan = 80;
	sobeAvanco = 0.01;
	lvlAvan = 0;

	precoDCrit = 100;
	sobeDCrit = 0.2;
	lvlDCrit = 1;

	precoCCrit = 200;
	sobeCCrit = 0.02;
	lvlCCrit = 1;

	precoQTDAvanco = 200;
	lvlQTDAvanco = 1;

	precoVidaInimigo = 150;
	subVidaInimigo = 0.01;
	lvlSubVida = 0;

	precoBau = 10;
	lvlBau = 1;

	precoDano = precoDano * (1 - descontoLoja);
	precoBEspaco = precoBEspaco * (1 - descontoLoja);
	precoGold = precoGold * (1 - descontoLoja);
	precoAvan = precoAvan * (1 - descontoLoja);
	precoDCrit = precoDCrit * (1 - descontoLoja);
	precoCCrit = precoCCrit * (1 - descontoLoja);
	precoQTDAvanco = precoQTDAvanco * (1 - descontoLoja);

	chanceBau = 0.1;

	mulGoldInicial = mulGold;
	console.log("2 " + mulGoldInicial);

	////
	if (danoBonus != 0 && !isNaN(danoBonus)) {
		danoJogador = danoJogador * danoBonus;
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
		totalDerrotados,

		danoJogador,
		danoCritJogador,
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

		progressoConquistaDano,
		progressoConquistaGold,
		validaConquista,

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
		lvlBau
	};
}

function AutoSaveLocal() {

	try {

		const save = CriarObjetoSave();

		localStorage.setItem(
			"autoSaveCaverna",
			JSON.stringify(save)
		);

		console.log("Auto Save realizado");
		return true;

	} catch (e) {

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

		Carregar(save);

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