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
// MENU / INIT
// =========================

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
	intervalos.push(setInterval(TickAutomacao, 1000));
	// seção de especialização da loja: estado refletido a cada 1s (leitura
	// barata de DOM, como os toggles — load, reset e zerada se refletem sozinhos)
	intervalos.push(setInterval(SyncSecaoEspecializacao, 1000));

	// tick do companheiro com intervalo dinâmico (Velocidade do Companheiro):
	// o handle gerenciado é limpo aqui (o intervalos[] não o contém) e recriado
	// com o intervalo certo da velocidade atual
	if (intervaloDanoComp !== null) {
		clearInterval(intervaloDanoComp);
		intervaloDanoComp = null;
	}
	SincronizaIntervaloDanoComp();
	// intervalos dos novos companheiros (Mago do Relógio e
	// Alquimista): handles gerenciados, limpos e recriados aqui
	SincronizaIntervalosNovosCompanheiros();
	// buff do Alquimista não sobrevive ao reset
	buffAtivo = null;
	AtualizaBuffAlquimistaUI();
	// selo do buff: contagem regressiva e limpeza ao expirar (1s)
	intervalos.push(setInterval(AtualizaBuffAlquimistaUI, 1000));
	intervalos.push(setInterval(GoldCompanheiros, 1000));
	intervalos.push(setInterval(HabilidadeDano, 1000));

	if (!saveCarregado) Batalha();
}

//// Resetar
function Resetar() {
	EncerraEvento(true); //evento aleatório não sobrevive ao reset
	recompensasOfflinePendentes = null;
	ultimaDataSaveOffline = Date.now();
	numInimigosTela = 1; //usada para validar quantos inimigos e
	andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
	marcoGoldRun = 0;
	runInicioMs = Date.now(); //nova run: cronômetro da conquista Velocista
	comprasRun = 0; //compras de gold desta run zeram (conquista Poupado)
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
	perkFrenesi = 0;
	// especialização é por run: escolha e trocas zeram no reset
	// (o desbloqueio permanente é a própria andarVolta)
	especializacao = 0;
	especializacaoTrocas = 0;
	// itens da build são por run: zeram no reset (o desbloqueio permanente
	// é o andar 100; os baús voltam a aparecer a cada 10 andares)
	Tapeira.ItensBuild.limpa();
	UI.removeBauBuild?.();
	UI.fechaEscolhaItensBuild?.();
	limiteInimigos = 1; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
	gold = new GoldNumber(0); //quantidade de dinheiro do jogador
	totalGold = new GoldNumber(0); //quantidade total de dinheiro do jogador
	saveAnd = 10; //andar que será efetuado o salvamento automatico
	qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
	danoJogador = 1; //dano atual do jogador
	danoCritJogador = 2; //dano critico atual do jogador
	// teto ×4 + +0,2 por nível do Conhecimento (permanente; o +0,1 da loja de
	// gold é por run e é reconstruído nas compras da run)
	multiplicadorMaximoDanoCritico = Math.round((4 + 0.2 * cmNivelCrit) * 10) / 10;
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
	nivelSkillFrenesi = 0;
	// ramos da árvore são por run: zeram junto com os níveis das skills
	ramoSkillDano = 0;
	ramoSkillEletrica = 0;
	ramoSkillGold = 0;
	ramoSkillFuga = 0;
	ramoSkillFrenesi = 0;
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
	abatesFrenesi = 0;
	ataquesFrenesi = 0;
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
	precoBau = precoBau * (1 - descontoLoja);
	precoBEspaco = precoBEspaco * (1 - descontoLoja);
	precoGold = precoGold * (1 - descontoLoja);
	precoAvan = precoAvan * (1 - descontoLoja);
	precoDCrit = precoDCrit * (1 - descontoLoja);
	precoCCrit = precoCCrit * (1 - descontoLoja);
	precoQTDAvanco = precoQTDAvanco * (1 - descontoLoja);

	chanceBau = 0.1;

	precoEsmBau = 500;
	lvlEsmBau = 0;
	chanceEsmeraldaBau = 0.01;
	// Velocidade do Companheiro volta ao padrão (1 hit/s) e o tick reacomoda
	precoVelComp = 125;
	lvlVelComp = 1;
	velAtaqueComp = 1;
	// Cadeia de Ataques: o stack é por onda e não sobrevive ao reset
	ataquesCadeia = [0, 0, 0, 0, 0];
	// patentes são por run: zeram junto com os itens que destravam
	patenteBau = 0;
	patenteBEspaco = 0;
	patenteQTDAvan = 0;
	patenteCCrit = 0;
	patenteSubVida = 0;
	patenteAvan = 0;
	patenteEsmBau = 0;
	patenteVelComp = 0;
	patenteDano = 0;
	patenteDCrit = 0;
	SincronizaIntervaloDanoComp();

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

	// Loja do Conhecimento: +2% de dano permanente por nível
	if (cmNivelDano > 0 && isFinite(cmNivelDano)) {
		danoJogador = danoJogador * Math.pow(1.02, cmNivelDano);
		LimitaDanoCritico();
	}

	// Crítico das conquistas é permanente: devolve o bônus acumulado (Conquistas()).
	// Base é 2 (valor inicial do reset); os LimitaDanoCritico intermediários podem
	// ter subido o crítico pro piso do dano — recalcular da base evita somar o piso 2x.
	if (bonusCritConquista > 0 && isFinite(bonusCritConquista)) {
		danoCritJogador = 2 + bonusCritConquista;
		LimitaDanoCritico();
	}

	// Loja do Conhecimento: +2% de dano crítico por nível (dentro do teto ×4)
	if (cmNivelCrit > 0 && isFinite(cmNivelCrit)) {
		danoCritJogador = danoCritJogador * Math.pow(1.02, cmNivelCrit);
		LimitaDanoCritico();
	}

	if (lvlComp1 > 0) {
		danoComp = danoJogador * danoComp1;
	}

	Salvar();
}
////

function Batalha() {

	IniciaFundos?.(); // pré-carrega as artes de fundo (idempotente)
	AtualizarTela?.();
	CarregarStatus?.();
	CriarCompanheiros?.();
	CriarInimigos?.();
	MostraStatus?.();
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
