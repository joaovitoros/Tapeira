//variaveis de regras
var avancoInterval;
var numInimigosTela = 1; //usada para validar quantos inimigos e
var andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
var andarMaxRun = 1; //pico de andar desta run (base dos pontos de perk; zera no reset)
var qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
var inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
var limiteInimigos; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
var gold = new GoldNumber(0); //quantidade de dinheiro do jogador
var saveAnd = 10; //andar que será efetuado o salvamento automatico
var qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
var maxAndar = 0; //andar maximo atingido
var marcoGoldRun = 0; //ultimo marco de 10 andares que deu +10% de gold nesta run
var andarVolta = 15; //andar necessario para que se possa utilizar o reset
var gateDanoPago = 10; //ultimo portão de reset (>= 35) que já pagou o +5% de dano
var danoResetQtd = 0; //quantidade de bonus permanentes de +5% de dano ganhos no reset
var perkDano = 0; //níveis de perk do Dano automático (+25% de dano cada, máx 4)
var perkEletrica = 0; //níveis de perk da Corrente elétrica (+1 inimigo atingido cada, máx 3)
var perkGold = 0; //níveis de perk do Bônus de Gold (+25% no drop do kill com skill ativa cada, máx 4)
var perkFuga = 0; //níveis de perk da Pausa da fuga (10% de restaurar o tempo de fuga cada, máx 50%)
var conhecimentoMug = 0; //moeda permanente da Loja do Conhecimento (1 abate = 1 CM no reset a partir do andar 20)
var derrotadosRun = 0; //abates desde o último reset (base da conversão em Conhecimento Mug)
var cmNivelDano = 0; //níveis da Loja do Conhecimento: +1% de dano permanente cada
var cmNivelGold = 0; //níveis da Loja do Conhecimento: +1% de gold cada
var cmNivelXp = 0; //níveis da Loja do Conhecimento: +1% de XP cada
var cmNivelFuga = 0; //níveis da Loja do Conhecimento: +1 no tempo máximo de fuga cada
var cmNivelCrit = 0; //níveis da Loja do Conhecimento: +1% de dano crítico cada
var cmNivelFormiga = 0; //níveis da Loja do Conhecimento: +1% na chance de drop de formiga por abate (máx 50)
var cmNivelDuasFormigas = 0; //níveis da Loja do Conhecimento: +1% de o drop de formiga sair com 2 (máx 100)
var cmNivelComp = 0; //níveis da Loja do Conhecimento: +1% de dano de companheiro cada (baked em danoComp1)
var cmNivelGoldComp2 = 0; //níveis da Loja do Conhecimento: +1% de gold do companheiro 2 cada
var totalDerrotados = 0; //total de inimigos derrotados durante todo o jogo
var totalGold = new GoldNumber(0); //total de gold coletado durante todo o jogo
var danoJogador = 1; //dano atual do jogador
var danoCritJogador = 2; //dano critico atual do jogador
var chanceCrit = 0.01; //chance em porcentagem de se causar um dano critico
var multiplicadorMaximoDanoCritico = 4;
var vidaAndar; //usado para marcar a vida maximo que os inimigos podem ter no andar atual
var vidaInimigo1; //vida atual do inimigo 1
var vidaInimigo2; //vida atual do inimigo 2
var vidaInimigo3; //vida atual do inimigo 3
var vidaInimigo4; //vida atual do inimigo 4
var mulGold = 0.2; //variavel utilizada para efetuar acrescimo de dinheiro ao derrotar inimigos, avançar de andares, e bonus
var mulGoldAvanco = 1; //variavel utilizada para efetuar acrescimo de dinheiro ao avançar andares
var avanco = 0; //variavel utilizada para calculo de probabilidade de um avanço rapido entre andares
var qtdAvanco = 2;////variavel que determina quantos inimigos serão derrotados noa vanço rapido
var ValidaBater = 30; //tempo atual para que se possa executar um ataque com o espaço
var MaxValidaBater = 30; //tempo maximo para que se possa executar um ataque com o espaço
var tempoAvancoInimigos = 120; //tempo para que o jogar seja obrigado a recuar um andar
var andarBoss = 10; //andar atual onde aparecerão inimigos mais fortes
var progressoConquistaDano = 100; //multiplicador e quantidade necessaria para premiação e conclusão da conquista atual de dano
var progressoConquistaGold = 500; //multiplicador e quantidade necessaria para premiação e conclusão da conquista atual de gold
var validaConquista = 1; //variavel de valdiação para determinar onde será atribuido o bonus de conclusão da conquista (1- dano, 2- gold, 3- dano critico)
var totalNiveis = 0; //total de níveis ganhos acumulado entre resets (conquista de nível: a cada 100 → -1 inimigo para avançar)
var bonusCritConquista = 0; //pontos de dano crítico ganhos por conquistas (permanente)
var missao = Array(" ","Coleta de Gold", "Golpes", "Caça aos Mugs", "Tempo") //vetor usado para listagem das missões
var missaoAtual; //variavel que determina a missão atual (1- coleta de gol, 2- tempo, 3- caça aos mugs)
var missaoColeta = 500, missaoColetaAtual = 0.0; //Gold necessario para completar a missão "Coleta de gold"
var missaoGolpe = 100, missaoGolpeAtual = 0; //Quantidade de golpes necessarios para concluir a missão "Golpes"
var missaoCacaMugs = 50, missaoCacaMugsAtual = 0; //Quantidade de mugs necessarios para completar a missão "Caça aos Mugs"
var missaoTempo = 600, missaoTempoAtual = 0; //segundos necessarios para concluir a missão "Tempo"
var intervaloMissaoTempo = null; //identificador do unico timer da missão Tempo
var qtdMissoes = 5; //Quantidade de missões disponiveis (4 estatísticas + 1 desafio)
var statusMissao = true; //Verifica se a missão pode ser iniciada
var missaoDesafioSub = 0; //tipo do desafio: 1=sem gold, 2=sem habilidades, 3=contra o tempo
var missaoDesafioAlvo = 10, missaoDesafioAtual = 0; //inimigos exigidos / abatidos no desafio
var missaoDesafioTempo = 0; //segundos restantes no desafio contra o tempo
var intervaloDesafio = null; //identificador do unico timer do desafio contra o tempo
var desafioFalhando = false; //evita falha em reentrada durante a troca de missão
var chanceBau = 0.1;
var chanceEsmeraldaBau = 0.01;
var qtdCarregaHabilidade = 0; //Quantidade de inimigos derrotados para carregar Habilidade
var abateshabilidadeDano = 15; //Quantidade necessaria para usar habilidade dano
var tempoHabilidadeDano = 30; // tempo de duraçao da habilidade dano
var verificaHabilidadeDano = false;
var abatesCorrenteEletrica = 0;
var ataquesCorrenteEletrica = 0;
var abatesBonusGoldAtaque = 0;
var ataquesBonusGold = 0;
var abatesPausaFuga = 0;
var segundosPausaFuga = 0;
var nivelJogador = 1;
var xpAtual = 0;
var pontosHabilidade = 0;
var nivelSkillDano = 0;
var nivelSkillEletrica = 0;
var nivelSkillGold = 0;
var nivelSkillFuga = 0;
const NIVEL_MAXIMO_SKILLS = 10;
const SKILLS_UPGRADE = [
	{ id: "damage", nome: "Dano automático", pisoDesbloqueio: 1, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillDano" },
	{ id: "electric", nome: "Corrente elétrica", pisoDesbloqueio: 15, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillEletrica" },
	{ id: "gold", nome: "Bônus de Gold", pisoDesbloqueio: 25, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillGold" },
	{ id: "escape", nome: "Pausa da fuga", pisoDesbloqueio: 35, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillFuga" }
];
// Perks: 1 ponto por portão alcançado no pico de andar desta run (>= 35).
// O nível de perk é por run (zeramos no reset) e independe do nível da skill.
const PERKS = [
	{ skillId: "damage", varName: "perkDano", nome: "Dano automático", efeito: "+25% de dano por nível; no nível máximo a skill ativa sozinha quando carregada", maximo: 4 },
	{ skillId: "electric", varName: "perkEletrica", nome: "Corrente elétrica", efeito: "+1 inimigo atingido por nível", maximo: 3 },
	{ skillId: "gold", varName: "perkGold", nome: "Bônus de Gold", efeito: "+25% no drop do kill feito com a skill ativa por nível; do nível 1 em diante a skill ativa sozinha quando carregada", maximo: 4 },
	{ skillId: "escape", varName: "perkFuga", nome: "Pausa da fuga", efeito: "10% de restaurar o tempo de fuga por nível (máx 50%)", maximo: 5 }
];
var fugaEmAndamento = false;
var maxTempoProgressoOffline = 5 * 60 * 60 * 1000;
var multiplicadorProgressoOffline = 0.25;
var maxBausOffline = 2;
const TEMPO_BAU_DOURADO_JOGO = 20 * 60 * 1000;
const TEMPO_BAU_DOURADO_OFFLINE = 40 * 60 * 1000;
var progressoBauDourado = 0;
var bauDouradoPendente = 0;
var ultimaAtualizacaoBauDourado = Date.now();
var bauDouradoEmJogo = document.visibilityState !== "hidden";
var ultimaDataSaveOffline = 0;
var recompensasOfflinePendentes = null;
var formigasVermelhas = 0;
var formigasAmarelas = 0;
var formigasMarrons = 0;
var formigasPretas = 0;
var formigasCinzas = 0;
var quantidadeBausDisponiveis = 0;
const FORMIGAS = [
	{ id: "vermelhas", nome: "Vermelhas", singular: "vermelha", contador: "formigasVermelhas", cor: "#e94b4b", bonus: "+5% de dano por conjunto de 5" },
	{ id: "amarelas", nome: "Amarelas", singular: "amarela", contador: "formigasAmarelas", cor: "#ffd34f", bonus: "+5% de Gold por conjunto de 5" },
	{ id: "marrons", nome: "Marrons", singular: "marrom", contador: "formigasMarrons", cor: "#9b633f", bonus: "+2% de Gold por baú e +1 ponto percentual de chance de baú extra por conjunto de 5" },
	{ id: "pretas", nome: "Pretas", singular: "preta", contador: "formigasPretas", cor: "#333943", bonus: "+2 minutos no limite de progresso offline por conjunto de 5" },
	{ id: "cinzas", nome: "Cinzas", singular: "cinza", contador: "formigasCinzas", cor: "#aab2bd", bonus: "+1 baú no limite de progresso offline por conjunto de 5" }
];
////

////Variaveis de Reset de jogo
var danoComp = 0; //dano causado pelos companheiros
var danoCritComp = 0; //dano critico causado pelos companheiros
var goldCompanheiro = 0; //dinheiro coletado pelos companheiros
var goldCompanheirosAcumulado = 0;
var ticksGoldCompanheiros = 0;
var tempoEsperaCompanheiro = 0;//Tempo bonus dos companheiros
var esmeraldas = 0; //quantidade de esmeraldos obtidas
var numVoltas = 0; //varaivel utilizada para determinar quantas esmeraldas serão obtidas ao resetar
var danoBonus = 0; //variavel para armazenar os danos bonus
////

function QuantidadeFormigas(id) {
	const formiga = FORMIGAS.find(item => item.id === id);
	return formiga ? Math.max(0, Math.floor(Number(window[formiga.contador]) || 0)) : 0;
}

function ConjuntosFormigas(id) {
	return Math.floor(QuantidadeFormigas(id) / 5);
}

function FormigasDesbloqueadas() {
	return Math.max(andar, maxAndar) >= 20;
}

function MultiplicadorDanoFormigas() {
	return 1 + ConjuntosFormigas("vermelhas") * 0.05;
}

function MultiplicadorGoldFormigas() {
	return 1 + ConjuntosFormigas("amarelas") * 0.05;
}

function MultiplicadorGoldBauFormigas() {
	return 1 + ConjuntosFormigas("marrons") * 0.02;
}

function ChanceBauExtraFormigas() {
	return ConjuntosFormigas("marrons") * 0.01;
}

// =========================
// CONHECIMENTO MUG
// =========================
// Preço dos itens da loja: base 10 CM, escalonado ×1.5 por nível (10, 15, 23, 34...)
function PrecoLojaCM(nivel) {
	return Math.round(10 * Math.pow(1.5, Math.max(0, Number(nivel) || 0)));
}

// +1% de gold por nível — aplicado em todo ganho de gold (AddGold)
function MultiplicadorGoldConhecimento() {
	return 1 + cmNivelGold * 0.01;
}

// +1% de XP por nível — aplicado em toda XP ganha (GanhaXP)
function BonusXPConhecimento() {
	return 1 + cmNivelXp * 0.01;
}

// Tempo máximo do cronômetro de fuga: base 120 + bônus da loja
function TempoFugaMax() {
	return 120 + cmNivelFuga;
}

// Chance de drop de formiga aleatória por abate: 1% base + 1% por nível (máx 51%)
function ChanceDropFormiga() {
	return 0.01 + Math.min(cmNivelFormiga, 50) * 0.01;
}

// +1% de gold do companheiro 2 por nível — aplicado em todo recálculo de goldCompanheiro
function MultiplicadorGoldComp2() {
	return 1 + cmNivelGoldComp2 * 0.01;
}

// Loja de esmeralda "CM em dobro": ×2 no Conhecimento Mug ganho por nível
// (1 nível por enquanto; item permanente da loja de esmeraldas)
function MultiplicadorCM() {
	return Math.pow(2, Math.max(0, Math.floor(Number(lvlEsmCM) || 0)));
}

function LimitaDanoCritico() {
	const danoNormal = Number(danoJogador);
	const danoCritico = Number(danoCritJogador);
	if (!Number.isFinite(danoNormal) || !Number.isFinite(danoCritico)) return;
	danoCritJogador = Math.min(Math.max(danoNormal, danoCritico), danoNormal * multiplicadorMaximoDanoCritico);
}

// Sobe o teto do crítico em +0,1 (loja de gold e Loja do Conhecimento).
// Arredonda pra 1 casa: somar 0,1 repetidamente acumula erro de flutuante.
function SobeTetoCritico() {
	multiplicadorMaximoDanoCritico = Math.round((multiplicadorMaximoDanoCritico + 0.1) * 10) / 10;
}

function LimiteTempoOffline(quantidadePretas = QuantidadeFormigas("pretas")) {
	return maxTempoProgressoOffline + Math.floor(quantidadePretas / 5) * 2 * 60 * 1000;
}

function LimiteBausOffline(quantidadeCinzas = QuantidadeFormigas("cinzas")) {
	return maxBausOffline + Math.floor(quantidadeCinzas / 5);
}

function SorteiaFormigas(abates) {
	const resultado = [0, 0, 0, 0, 0];
	if (!FormigasDesbloqueadas()) return resultado;

	let abatesRestantes = Math.max(0, Math.floor(abates));
	while (abatesRestantes > 0) {
		// mesma chance do drop por abate (1% base + 1% por nível da Loja do Conhecimento)
		const distanciaAteDrop = Math.floor(Math.log1p(-Math.random()) / Math.log(1 - ChanceDropFormiga())) + 1;
		if (distanciaAteDrop > abatesRestantes) break;
		abatesRestantes -= distanciaAteDrop;
		resultado[Math.floor(Math.random() * FORMIGAS.length)]++;
	}
	return resultado;
}

function RegistraDropFormiga() {
	if (!FormigasDesbloqueadas() || Math.random() >= ChanceDropFormiga()) return false;
	const formiga = FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)];
	ConcedeFormigaColecao(formiga);
	// Loja do Conhecimento: +1% por nível de o drop sair com 2 formigas (máx 100)
	if (Math.random() < Math.min(cmNivelDuasFormigas, 100) * 0.01) {
		ConcedeFormigaColecao(FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)]);
	}
	return true;
}

//variaveis referentes a loja
var precoDano = 5;
var mulDano = 1;
var lvlDano = 1;

var precoBEspaco = 45;
var lvlBEspaco = 1;

var precoGold = 100;
var sobeGold = 0.3;
var lvlGold = 1;

var precoAvan = 80;
var sobeAvanco = 0.01;
var lvlAvan = 0;

var precoDCrit = 150;
var sobeDCrit = 0.1;
var lvlDCrit = 1;

var precoCCrit = 250;
var sobeCCrit = 0.02;
var lvlCCrit = 1;

var precoQTDAvanco = 200;
var lvlQTDAvanco = 1;

var precoVidaInimigo = 150;
var subVidaInimigo = 0.00;
var lvlSubVida = 0;

var precoBau = 25;
var lvlBau = 1;


var descontoLoja = 0;
var mulGoldInicial = mulGold;
////



//variaveis loja de esmeraldas
var precoComp1 = 1;
var danoComp1 = 0.4;
var lvlComp1 = 0;

var precoAvGold = 2;
var lvlAvGold = 1;

var precoComp2 = 3;
var goldComp2 = 0.5;
var lvlComp2 = 0;

var precoComp3 = 4;
var tempoComp3 = 1;
var lvlComp3 = 0;

var precoXP = 2;
var lvlXP = 0;

var precoEsmCM = 10;
var lvlEsmCM = 0; //0/1: item de 1 nível da loja de esmeraldas — duplica o CM ganho no reset
////

function CarregarStatus(){
	// Curva "patamares por década": crescimento contínuo por andar (sem os saltos
	// de expoente do antigo pow, tipo 15→16 ×5 e 40→41 ×14) + degrau a cada 10
	// andares. Andares de chefe (múltiplos de 10) multiplicam a vida por 1,5 no
	// bloco abaixo — ou seja, cada década começa com um degrau visível (patamar
	// ×1.6 e chefe ×1,5 no mesmo andar).
	// Constantes calibram a curva:
	//   BASE_VIDA    = vida no andar 1 (5 = 2,5× o original; o ouro continua
	//                  igual porque BonusGoldAvanco() usa ×0.4 na conversão)
	//   RAZAO_VIDA   = multiplicador por andar (contínuo)
	//   PATAMAR_VIDA = multiplicador extra ao entrar em cada década (10, 20, 30...)
	const BASE_VIDA = 5;
	const RAZAO_VIDA = 1.15;
	const PATAMAR_VIDA = 1.6;

	vidaAndar = BASE_VIDA
		* Math.pow(RAZAO_VIDA, Math.max(0, andar - 1))
		* Math.pow(PATAMAR_VIDA, Math.floor(Math.max(0, andar) / 10));

	vidaAndar = vidaAndar*(1-subVidaInimigo);
	
	vidaInimigo1 = vidaAndar;
	vidaInimigo2 = vidaAndar;
	vidaInimigo3 = vidaAndar;
	vidaInimigo4 = vidaAndar;
	
	if(andar>=10){
		Missao();
	}
	
	// Andares de chefe (múltiplos de 10): o extra de ×1,5 de vida precisa valer em
	// todas as ondas do andar. Antes o boost era aplicado só uma vez, porque andarBoss
	// era incrementado junto, e nos respawns seguintes os inimigos voltavam sem o boost.
	if (andar >= 10 && andar % 10 === 0) {
		vidaAndar = vidaAndar*1.5;
		vidaInimigo1 = vidaInimigo1*1.5;
		vidaInimigo2 = vidaInimigo2*1.5;
		vidaInimigo3 = vidaInimigo3*1.5;
		vidaInimigo4 = vidaInimigo4*1.5;

		if (andarBoss==andar) {
			UI.showInfo("Inimigos mais fortes...");
			andarBoss=andarBoss+10;
		}
	}
}

function CriarCompanheiros(){
	if(lvlComp1>0){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiro1.png";
		att2.value = "companheiro1";
		att3.value = "companheiro1";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	if(lvlComp2>0){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiro2.png";
		att2.value = "companheiro2";
		att3.value = "companheiro2";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	if(lvlComp3>0){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiro3.png";
		att2.value = "companheiro3";
		att3.value = "companheiro3";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
}



function CriaBau(){
	const chance = Math.max(0, Math.min(1, Number(chanceBau) || 0));
	if (Math.random() >= chance) return;

	const chanceExtra = ChanceBauExtraFormigas();
	const extrasGarantidos = Math.floor(chanceExtra);
	const extraFracionado = chanceExtra - extrasGarantidos;
	quantidadeBausDisponiveis = 1 + extrasGarantidos
		+ (Math.random() < extraFracionado ? 1 : 0);
	UI.spawnChest(quantidadeBausDisponiveis);
}

function ColetaBau(){
	valida = Math.random();
	quantidadeBausDisponiveis = Math.max(0, quantidadeBausDisponiveis - 1);
	if (quantidadeBausDisponiveis > 0) {
		UI.spawnChest(quantidadeBausDisponiveis);
	} else {
		RemoveBau();
	}
	ChamaSom('audio4');
	if(valida<=chanceEsmeraldaBau){
		UI.showChestOpening("normal", "emerald", "Esmeralda encontrada", "+1 Esmeralda", "#72e7c1");
		esmeraldas++;
		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		UI.showCurrencyReward("emerald", 1);
		UI.showInfo("Recebeu um bonus de 1 esmeralda!");
	}else{
		bonus = ValorGoldBau();
		bonus = AddGold(bonus);
		AddTotalGold(bonus, false);
		UI.showChestOpening("normal", "gold", "Gold encontrado", `+${FormatGold(bonus)} Gold`);
		document.getElementById("contGold").innerHTML = FormatGold(gold);
		UI.showCurrencyReward("gold", bonus);
		UI.showStatus();
		UI.showInfo("Recebeu um bonus de: "+bonus +" gold");
	}
	AutoSaveLocal();
}

// Bônus base de gold do avanço/baú: gold fixo do andar + (vida do andar que vira
// gold). A vida saiu de 2 para 5 (2,5×) e a fração 0.4 mantém o gold exatamente
// igual ao de antes (×2,5 ×0,4 = 1) — único lugar para tunar isso.
function BonusGoldAvanco(){
	const FRACAO_VIDA_GOLD = 0.4;
	return ((andar * mulGold) + (vidaAndar * mulGold) * FRACAO_VIDA_GOLD * mulGoldAvanco);
}

function ValorGoldBau() {
	return (BonusGoldAvanco() * 5)
		* MultiplicadorGoldBauFormigas();
}

function ConcedeFormigaColecao(formiga) {
	window[formiga.contador] = Math.min(Number.MAX_SAFE_INTEGER, window[formiga.contador] + 1);
	UI.showAntReward(formiga);
	UI.showInfo(`Uma formiga ${formiga.singular} entrou para sua coleção!`);
	UI.showMilestone("Nova formiga encontrada", `Formiga ${formiga.singular} adicionada à coleção`);
	if (document.getElementById("antCollectionModal")) UI.showAntCollection();
}

function CarregaHabilidadesDesbloqueadas() {
	qtdCarregaHabilidade = abateshabilidadeDano;
	VerificaHabilidade();

	habilidadesCombate.forEach(skill => {
		if (maxAndar < skill.unlockFloor) return;
		if (skill.id === "electric") abatesCorrenteEletrica = skill.killsRequired;
		if (skill.id === "gold") abatesBonusGoldAtaque = skill.killsRequired;
		if (skill.id === "escape") abatesPausaFuga = skill.killsRequired;
	});
	AtualizaHabilidadesCombate();
	UI.showInfo("Todas as habilidades desbloqueadas estão carregadas!");
	UI.showMilestone("Baú dourado", "Todas as habilidades desbloqueadas foram carregadas");
}

function ColetaBauDourado() {
	if (bauDouradoPendente !== 1) return;

	bauDouradoPendente = 0;
	progressoBauDourado = 0;
	ultimaAtualizacaoBauDourado = Date.now();
	UI.updateGoldenChestProgress();
	ChamaSom("audio4");

	const sorteio = Math.random();
	const formigasDesbloqueadas = FormigasDesbloqueadas();
	const chanceGold = formigasDesbloqueadas ? 0.5 : 0.5 / 0.7;
	const chanceFormiga = formigasDesbloqueadas ? 0.3 : 0;
	if (sorteio < chanceGold) {
		const bonus = ValorGoldBau() * 5;
		const goldRecebido = AddGold(bonus);
		AddTotalGold(goldRecebido, false);
		UI.showChestOpening("golden", "gold", "Grande recompensa!", `+${FormatGold(goldRecebido)} Gold`);
		UI.showCurrencyReward("gold", goldRecebido);
		UI.showInfo(`O baú dourado rendeu ${FormatGold(goldRecebido)} Gold!`);
	} else if (sorteio < chanceGold + chanceFormiga) {
		const formiga = FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)];
		UI.showChestOpening("golden", "ant", "Nova formiga!", `Formiga ${formiga.singular}`, formiga.cor);
		ConcedeFormigaColecao(formiga);
	} else {
		UI.showChestOpening("golden", "skills", "Skills recarregadas", "Todas as habilidades desbloqueadas estão prontas");
		CarregaHabilidadesDesbloqueadas();
	}

	if (!AutoSaveLocal()) {
		UI.showInfo("A recompensa do baú dourado foi recebida, mas não foi possível salvar o progresso.");
	}
}

function RemoveBau(){
	quantidadeBausDisponiveis = 0;
	UI.removeChest();
}

//Funçoes de habildiades

function VerificaHabilidade(){
	if(qtdCarregaHabilidade==abateshabilidadeDano && !document.getElementById("habilidade1")){
		// perk do Dano automático no nível máximo: ativa sozinha quando carregada
		if (PerkNoMaximo("damage")) {
			UsaHabilidadeDano();
			return;
		}
		habilidade = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att4 = document.createAttribute("onClick");
		att1.value = "imagens/espada-habilidade.svg";
		att2.value = "habilidade1";
		att3.value = "habilidade1";
		att4.value = "UsaHabilidadeDano()";
		habilidade.setAttributeNode(att1);
		habilidade.setAttributeNode(att2);
		habilidade.setAttributeNode(att3);
		habilidade.setAttributeNode(att4);
		document.body.appendChild(habilidade);
		ChamaSom('audio7');
	}
	if(qtdCarregaHabilidade>abateshabilidadeDano){
		qtdCarregaHabilidade=abateshabilidadeDano;
	}
}

function AtualizaQTDHabildiade1(){

	aux = abateshabilidadeDano;
	aux = aux-qtdCarregaHabilidade;

	porcentagem = aux * 100 / abateshabilidadeDano;
	
	document.getElementById("BaraQTDHab1").style.height=Math.max(0, Math.min(100, porcentagem))+"%";
	document.getElementById("QTDTempoHab1").innerHTML=qtdCarregaHabilidade;
	document.getElementById("BaraQTDHab1").style.color="#fff";
}

function UsaHabilidadeDano(){
	// ícone pode não existir quando a ativação é automática (perk no máximo)
	document.getElementById("habilidade1")?.remove();
	ChamaSom('audio5');
	verificaHabilidadeDano = true;
	tempoHabilidadeDano = 30 + NivelDaSkill("damage") * 5;
	qtdCarregaHabilidade = 0;
	UI.updateSkillProgress();
}

const habilidadesCombate = [
	{ id: "electric", unlockFloor: 15, killsRequired: 20 },
	{ id: "gold", unlockFloor: 25, killsRequired: 30 },
	{ id: "escape", unlockFloor: 35, killsRequired: 15 }
];

function PisoMaximoAlcancado() {
	return Math.max(andar, maxAndar);
}

function XPNecessarioProximoNivel(nivel = nivelJogador) {
	return 50 + 25 * Math.max(0, nivel - 1);
}

// Bônus por nível do jogador: a cada nível ganho, +10% de dano e
// −1 inimigo exigido para avançar de andar (quota mínima de 1).
function MultiplicadorDanoNivel() {
	return 1 + Math.max(0, nivelJogador - 1) * 0.1;
}

function QuotaAndar() {
	const bonusNivel = Math.max(0, nivelJogador - 1);
	const bonusConquista = Math.floor(Math.max(0, totalNiveis | 0) / 100);
	// mínimo de 1: mesmo com bônus acumulados, nunca avança sem pelo menos um abate
	return Math.max(1, qtdInimigosAndar - bonusNivel - bonusConquista);
}

function XPPorInimigo(piso = andar) {
	// bônus da loja de esmeraldas: +1 de XP por abate a cada nível do item
	return Math.max(0, lvlXP | 0) + 1 + Math.floor((Math.max(1, piso) - 1) / 10);
}

function GanhaXP(abates, piso = andar, xpFixo) {
	if (!Number.isFinite(piso) || piso < 1
		|| (xpFixo === undefined && (!Number.isSafeInteger(abates) || abates < 0))) {
		throw new TypeError("Abates e andar precisam ser inteiros válidos para calcular experiência.");
	}
	const limiteXP = Number.MAX_SAFE_INTEGER - xpAtual;
	const xpPorAbate = XPPorInimigo(piso);
	const xpCalculado = xpFixo !== undefined
		? xpFixo
		: abates >= Math.ceil(limiteXP / xpPorAbate)
			? limiteXP
			: abates * xpPorAbate;
	// +1% de XP por nível da Loja do Conhecimento (arredonda pra baixo e
	// respeita o teto de XP restante — nunca estoura o limite seguro)
	const xpBase = Math.min(limiteXP, Math.floor(xpCalculado * BonusXPConhecimento()));
	if (!Number.isSafeInteger(xpBase) || xpBase < 0) {
		throw new TypeError("A quantidade de experiência precisa ser um inteiro não negativo.");
	}
	const xpGanho = Math.min(limiteXP, xpBase);
	if (xpGanho <= 0) return 0;

	const xpDisponivel = xpAtual + xpGanho;
	const coeficienteLinear = 2 * nivelJogador + 1;
	let niveisGanhos = Math.max(0, Math.floor(
		(Math.sqrt(coeficienteLinear ** 2 + 8 * xpDisponivel / 25) - coeficienteLinear) / 2
	));
	const custoNiveis = quantidade =>
		12.5 * quantidade * (2 * nivelJogador + quantidade + 1);
	while (niveisGanhos > 0 && custoNiveis(niveisGanhos) > xpDisponivel) niveisGanhos--;
	while (custoNiveis(niveisGanhos + 1) <= xpDisponivel) niveisGanhos++;

	xpAtual = xpDisponivel - custoNiveis(niveisGanhos);
	if (niveisGanhos > 0) {
		nivelJogador = Math.min(Number.MAX_SAFE_INTEGER, nivelJogador + niveisGanhos);
		pontosHabilidade = Math.min(Number.MAX_SAFE_INTEGER, pontosHabilidade + niveisGanhos);
		const conquistaAntes = Math.floor(Math.max(0, totalNiveis | 0) / 100);
		totalNiveis = Math.min(Number.MAX_SAFE_INTEGER, (totalNiveis | 0) + niveisGanhos);
		UI.showMilestone(
			niveisGanhos === 1 ? "Nível aumentado!" : `${niveisGanhos} níveis aumentados!`,
			`Você alcançou o nível ${nivelJogador} e recebeu ${niveisGanhos} ${niveisGanhos === 1 ? "ponto de habilidade" : "pontos de habilidade"}. Bônus: +${niveisGanhos * 10}% de dano e −${niveisGanhos} ${niveisGanhos === 1 ? "inimigo" : "inimigos"} para avançar.`
		);
		if (Math.floor(totalNiveis / 100) > conquistaAntes) {
			UI.showInfo("Conquista desbloqueada!\nA cada 100 níveis: -1 inimigo necessário para avançar!");
		}
		UI.updateObjective();
	}

	UI.showXPGain(xpGanho);
	UI.updateSkillProgress();
	if (document.getElementById("skillUpgradeModal")) UI.showSkillUpgradePanel();
	return xpGanho;
}

function NivelDaSkill(id) {
	const skill = SKILLS_UPGRADE.find(item => item.id === id);
	return skill ? Math.max(0, Math.floor(Number(window[skill.nivel]) || 0)) : 0;
}

function DescricaoEfeitoSkill(id, nivel = NivelDaSkill(id)) {
	if (id === "damage") return `Duração: ${30 + nivel * 5} s (+5 s por nível).`;
	if (id === "electric") {
		return `Dano encadeado: ${25 + nivel * 5}% · bônus sem alvo próximo: ${10 + nivel * 2}%.`;
	}
	if (id === "gold") return `Gold extra por ataque: ${35 + nivel * 5}% (+5% por nível).`;
	return `Pausa da fuga: ${10 + nivel * 2} s (+2 s por nível).`;
}

function EvoluiSkill(id) {
	const skill = SKILLS_UPGRADE.find(item => item.id === id);
	if (!skill || PisoMaximoAlcancado() < skill.pisoDesbloqueio
		|| pontosHabilidade <= 0 || NivelDaSkill(id) >= skill.maximo) return false;

	window[skill.nivel]++;
	pontosHabilidade--;
	UI.updateSkillProgress();
	UI.showInfo(`${skill.nome} melhorada para o nível ${NivelDaSkill(id)}.`);
	if (!AutoSaveLocal()) {
		UI.showInfo("A melhoria foi aplicada, mas não foi possível salvar o progresso localmente.");
	}
	return true;
}

// true se o perk da skill está no nível máximo
function PerkNoMaximo(skillId){
	const perk = PERKS.find(item => item.skillId === skillId);
	return !!perk && (Number(window[perk.varName]) || 0) >= perk.maximo;
}

// Aplica 1 ponto de perk na skill (por run; pontos vêm do pico de andar desta run >= 35)
function CompraPerk(skillId){
	const perk = PERKS.find(item => item.skillId === skillId);
	if (!perk) return false;
	const nivel = Number(window[perk.varName]) || 0;
	if (nivel >= perk.maximo || PontosPerkDisponiveis() <= 0) return false;

	window[perk.varName] = nivel + 1;
	// perk do Dano automático chegou no máximo com a skill já carregada: ativa na hora
	if (perk.varName === "perkDano" && PerkNoMaximo("damage")
		&& qtdCarregaHabilidade >= abateshabilidadeDano) {
		UsaHabilidadeDano();
	}
	UI.showInfo(`${perk.nome}: perk de nível ${nivel + 1}/${perk.maximo} aplicado! (${perk.efeito})`);
	if (!AutoSaveLocal()) {
		UI.showInfo("O perk foi aplicado, mas não foi possível salvar o progresso localmente.");
	}
	return true;
}

function AtualizaHabilidadesCombate() {
	const panel = document.getElementById("skill-unlock-panel");
	if (!panel) return;

	const unlockedSkills = habilidadesCombate.filter(skill => maxAndar >= skill.unlockFloor);
	panel.hidden = unlockedSkills.length === 0;

	habilidadesCombate.forEach(skill => {
		const button = document.getElementById(`skill-${skill.id}`);
		const progress = document.getElementById(`skill-${skill.id}-progress`);
		const meter = document.getElementById(`skill-${skill.id}-meter`);
		if (!button || !progress || !meter) return;

		const unlocked = maxAndar >= skill.unlockFloor;
		button.hidden = !unlocked;
		button.disabled = !unlocked || (skill.id === "electric" && ataquesCorrenteEletrica > 0)
			|| (skill.id === "gold" && ataquesBonusGold > 0)
			|| (skill.id === "escape" && segundosPausaFuga > 0)
			|| (skill.id === "escape" && fugaEmAndamento);

		if (!unlocked) return;

		const kills = skill.id === "electric" ? abatesCorrenteEletrica
			: skill.id === "gold" ? abatesBonusGoldAtaque
				: abatesPausaFuga;
		const active = skill.id === "electric" ? ataquesCorrenteEletrica
			: skill.id === "gold" ? ataquesBonusGold
				: segundosPausaFuga;
		const activeDuration = skill.id === "electric" ? 20
			: skill.id === "gold" ? 25
				: 10 + NivelDaSkill("escape") * 2;
		const meterPercent = active > 0
			? active / activeDuration * 100
			: kills / skill.killsRequired * 100;
		const meterValue = Math.max(0, Math.min(100, Math.round(meterPercent)));
		const meterTrack = meter.parentElement;
		meter.style.height = `${meterValue}%`;
		meterTrack.setAttribute("aria-valuenow", meterValue);
		meterTrack.setAttribute("aria-valuetext", active > 0
			? skill.id === "escape" ? `Ativa por ${active} segundos` : `Ativa por ${active} ataques`
			: `${kills} de ${skill.killsRequired} abates`);

		if (active > 0) {
			progress.textContent = skill.id === "escape"
				? `Ativa: ${active}s`
				: `Ativa: ${active} ataques`;
			button.classList.add("is-active");
		} else {
			progress.textContent = kills >= skill.killsRequired
				? "Pronta!"
				: `${kills}/${skill.killsRequired} abates`;
			button.classList.remove("is-active");
		}
	});
}

function RegistrarAbateHabilidades() {
	habilidadesCombate.forEach(skill => {
		if (maxAndar < skill.unlockFloor) return;
		if (skill.id === "electric" && abatesCorrenteEletrica < skill.killsRequired) {
			abatesCorrenteEletrica++;
		} else if (skill.id === "gold" && abatesBonusGoldAtaque < skill.killsRequired) {
			abatesBonusGoldAtaque++;
		} else if (skill.id === "escape" && abatesPausaFuga < skill.killsRequired) {
			abatesPausaFuga++;
		}
	});
	AtualizaHabilidadesCombate();
}

function AtivaHabilidadeCombate(id) {
	const skill = habilidadesCombate.find(item => item.id === id);
	if (!skill || maxAndar < skill.unlockFloor) return;

	let habilidadeAtivada = false;
	if (id === "electric" && abatesCorrenteEletrica >= skill.killsRequired && ataquesCorrenteEletrica === 0) {
		habilidadeAtivada = true;
		abatesCorrenteEletrica = 0;
		ataquesCorrenteEletrica = 20;
		ChamaSom("audio5");
		UI.showInfo("Corrente elétrica ativa por 20 ataques!");
	} else if (id === "gold" && abatesBonusGoldAtaque >= skill.killsRequired && ataquesBonusGold === 0) {
		habilidadeAtivada = true;
		abatesBonusGoldAtaque = 0;
		ataquesBonusGold = 25;
		ChamaSom("audio6");
		UI.showInfo("Bônus de Gold ativo por 25 ataques!");
	} else if (id === "escape" && abatesPausaFuga >= skill.killsRequired && segundosPausaFuga === 0 && !fugaEmAndamento) {
		habilidadeAtivada = true;
		abatesPausaFuga = 0;
		segundosPausaFuga = 10 + NivelDaSkill("escape") * 2;
		ChamaSom("audio7");
		UI.showInfo(`Relógio de fuga pausado por ${segundosPausaFuga} segundos!`);
	}

	//desafio "sem habilidades": só ativar de verdade falha (tentativa sem carga não conta)
	if (habilidadeAtivada && missaoAtual === 5 && missaoDesafioSub === 2) {
		FalhaDesafio("Habilidade ativada");
	}

	AtualizaHabilidadesCombate();
}

function ConsomeAtaqueHabilidades(consomeCorrenteEletrica, consomeBonusGold) {
	if (consomeCorrenteEletrica && ataquesCorrenteEletrica > 0) ataquesCorrenteEletrica--;
	if (consomeBonusGold && ataquesBonusGold > 0) ataquesBonusGold--;
	AtualizaHabilidadesCombate();
}

function AtualizaRelogioHabilidade() {
	if (segundosPausaFuga <= 0) return false;
	segundosPausaFuga--;
	AtualizaHabilidadesCombate();
	return true;
}

function HabilidadeDano(){
	if (jogoPausado) return;

	AtualizaHabilidadesCombate();
	AtualizaQTDHabildiade1();
	if(verificaHabilidadeDano){
		DanoAutomatico(false,true);
		document.getElementById("QTDTempoHab1").innerHTML=tempoHabilidadeDano--;
		document.getElementById("BaraQTDHab1").style.color="#f00";
		if(tempoHabilidadeDano==0){
			verificaHabilidadeDano=false;
			tempoHabilidadeDano = 30 + NivelDaSkill("damage") * 5;
			document.getElementById("QTDTempoHab1").innerHTML=qtdCarregaHabilidade;
		}
	} 	
}

//funçoes de parceiros
function DanoCompanheiros(){
	if (jogoPausado) return;
	if(danoComp>0){
		DanoAutomatico(false,false);
	}
}

function GoldCompanheiros(){
	if (jogoPausado) return;
	const goldRecebido = goldCompanheiro * MultiplicadorGoldFormigas();
	AddGold(goldRecebido, false);
	AddTotalGold(goldRecebido, false);

	document.getElementById("contGold").innerHTML = FormatGold(gold);

	if (goldRecebido > 0) {
		goldCompanheirosAcumulado += goldRecebido;
		ticksGoldCompanheiros++;
		if (ticksGoldCompanheiros >= 10) {
			UI.showCurrencyReward("gold", goldCompanheirosAcumulado);
			goldCompanheirosAcumulado = 0;
			ticksGoldCompanheiros = 0;
		}
	} else {
		goldCompanheirosAcumulado = 0;
		ticksGoldCompanheiros = 0;
	}
}

function TempoCompanheiros(){
	if (jogoPausado) return;
	tempoAvancoInimigos=tempoAvancoInimigos+tempoEsperaCompanheiro;
	document.getElementById("contTempo").innerHTML=tempoAvancoInimigos;
	if(tempoEsperaCompanheiro>0){
		UI.showInfo("Ganhou "+tempoEsperaCompanheiro +" segundos");
	}
}
////



function AvancoInimigos() {
	if (jogoPausado || fugaEmAndamento) return;
	if (AtualizaRelogioHabilidade()) return;

    tempoAvancoInimigos--;
    document.getElementById("contTempo").innerHTML = tempoAvancoInimigos;

	// Lógica de avanço dos inimigos
/*
    for (let i = 1; i <= numInimigosTela; i++) {

        const el = document.getElementById("inimigo" + i);
        if (!el) continue;

        if (i === 1 || i === 2) {
            el.style.left = (380 - tempoAvancoInimigos * 3) + "px";
        } else {
            el.style.left = (820 + tempoAvancoInimigos * 3) + "px";
        }
    }
*/
    if (tempoAvancoInimigos <= 0) {
        if (andar > 1) {
			// perk da Pausa da fuga: chance de não fugir — o tempo do andar volta ao máximo
			const chancePerkFuga = Math.min(50, perkFuga * 10);
			if (chancePerkFuga > 0 && Math.random() * 100 < chancePerkFuga) {
				tempoAvancoInimigos = TempoFugaMax();
				document.getElementById("contTempo").innerHTML = tempoAvancoInimigos;
				UI.showInfo("O tempo para fugir deste andar voltou ao máximo! (chance de perk: " + chancePerkFuga + "%)");
				return;
			}
			fugaEmAndamento = true;
			UI.showInfo("Inimigos te alcançaram, fugindo...");
			UI.playEscapeAnimation().then(() => {
				RemoverInimigos();
				andar--;
				inimigosDerrotados = 0;
				qtdInimigosAndar--;
				tempoAvancoInimigos = TempoFugaMax();
				UI.render();
				CarregarStatus();
				UI.spawnEnemies();
				UI.showInfo("Dica: compre Avanço rápido para facilitar os andares");
				fugaEmAndamento = false;
			});
			return;
        }

        tempoAvancoInimigos = TempoFugaMax();
    }
}

// Portões de dano permanente: múltiplos de 5 a partir do andar 35. Cada portão
// paga +5% UMA única vez — gateDanoPago só avança, então nunca se paga de novo.
function GatesDanoPendentes(piso){
	const primeiro = Math.max(35, gateDanoPago + 5);
	const ate = Math.floor(piso / 5) * 5;
	if (ate < primeiro) return 0;
	return Math.floor((ate - primeiro) / 5) + 1;
}

// Paga de uma vez todos os portões não reivindicados até o piso do reset
// (resetar no 45 com o 40 pendente = +10%; os dois ficam gastos pra sempre)
function PagaDanoReset(piso){
	const qtd = GatesDanoPendentes(piso);
	if (qtd <= 0) return 0;
	const primeiro = Math.max(35, gateDanoPago + 5);
	gateDanoPago = primeiro + (qtd - 1) * 5;
	danoResetQtd = danoResetQtd + qtd;
	return qtd * 5;
}

// Pontos de perk (por run): 1 por portão alcançado no pico de andar desta run
// (>= 35). O pico não cai quando você foge, e tudo zera no reset.
function PontosPerkGanhos(){
	const picoRun = Math.max(Number(andarMaxRun) || 1, Number(andar) || 1);
	if (picoRun < 35) return 0;
	return Math.floor((picoRun - 35) / 5) + 1;
}

function PontosPerkDisponiveis(){
	const gastos = perkDano + perkEletrica + perkGold + perkFuga;
	return Math.max(0, PontosPerkGanhos() - gastos);
}

// Esmeraldas neste reset? Portões de esmeralda (≡5 em 10: 15/25/35/45/55...)
// continuam iguais; intermediários (40, 50...) só dão dano. Se o reset cobre
// 2+ portões, algum é de esmeralda ⇒ dá esmeraldas (nunca se perde).
function EhPortaoEsmeralda(piso){
	const primeiro = Math.max(35, gateDanoPago + 5);
	const ate = Math.floor(piso / 5) * 5;
	if (ate < primeiro) return andarVolta % 10 === 5; // fase antiga: 15/25/35
	if (ate === primeiro) return ate % 10 === 5;
	return true;
}

function VoltaAndar(){
	console.log("ENTROU NO VOLTA ANDAR");
	// reset livre a partir do andar 20; portão de reset quando andar >= andarVolta
	if(andar>=Math.min(andarVolta, 20)){
		console.log("PODE VOLTAR");
		const andarAnterior = andar;
		const ehPortao = andar >= andarVolta;
		// bônus de dano: cada portão >= 35 paga +5% uma vez só (com acumulado)
		// reset livre (sem portão) não reivindica esmeralda nem dano
		const ehPortaoEsmeralda = ehPortao && EhPortaoEsmeralda(andar);
		const danoRecebido = ehPortao ? PagaDanoReset(andar) : 0;
		let esmeraldasRecebidas = 0;
		if(ehPortaoEsmeralda && andar>=maxAndar){
			console.log(numVoltas);
			numVoltas++;
			esmeraldasRecebidas = numVoltas;
			esmeraldas = esmeraldas+numVoltas;
		}else if(ehPortaoEsmeralda){
			var auxEsmeraldas = Math.round(esmeraldas/andar);
			
			if(auxEsmeraldas<1){
				auxEsmeraldas=1;
			}
			esmeraldasRecebidas = auxEsmeraldas;
			esmeraldas = esmeraldas+auxEsmeraldas;
		}
		
		// portão avança: pós-35 = próximo portão não reivindicado (+5); antes = +10.
		// reset livre mantém andarVolta como está (o portão continua pendente)
		if (ehPortao) {
			if (danoRecebido > 0) {
				andarVolta = gateDanoPago + 5;
			} else {
				andarVolta = andarVolta + 10;
			}
		}
		
		// Conhecimento Mug: a partir do andar 20, 1 abate desta run = 1 CM
		// (o item da loja de esmeraldas "CM em dobro" duplica o ganho)
		let cmRecebido = 0;
		if (andarAnterior >= 20) {
			cmRecebido = Math.round(derrotadosRun * MultiplicadorCM());
			conhecimentoMug = conhecimentoMug + cmRecebido;
		}
		
		andar=1;
		qtdInimigosAndar=1;
		console.log("1 "+mulGoldInicial);
		mulGold = mulGoldInicial;
		mulGold = mulGold*1.25;

		if(lvlComp2>0){
			goldCompanheiro = lvlComp2*mulGold*MultiplicadorGoldComp2();
		}
		
		Resetar(); // zera derrotadosRun (a conversão em CM já foi feita acima)
		RemoverInimigos();
		Batalha();
		if (esmeraldasRecebidas > 0) UI.showCurrencyReward("emerald", esmeraldasRecebidas);
		if (cmRecebido > 0) UI.showInfo("Você ganhou " + cmRecebido + " Conhecimento Mug!");
		UI.MostraCelebracaoReset(esmeraldasRecebidas, andarAnterior, andarVolta, danoRecebido, cmRecebido);
		UI.updateResetAviso();
		if (TutorialComp1Pendente()) MostraTutorialComp1();
	}else{
		UI.showInfo("É necessario chegar no andar "+Math.min(andarVolta, 20)+" para poder voltar");
	}
}

// Pede confirmação antes de resetar; se ainda não pode voltar, só avisa (fluxo antigo)
function PedeReset() {
	if (andar < Math.min(andarVolta, 20)) {
		VoltaAndar();
		return;
	}

	const ehPortao = andar >= andarVolta;
	const ehPortaoEsmeralda = ehPortao && EhPortaoEsmeralda(andar);
	let premio = 0;
	if (ehPortaoEsmeralda) {
		if (andar >= maxAndar) {
			// recorde: recompensa igual à que VoltaAndar vai dar (numVoltas + 1)
			premio = numVoltas + 1;
		} else {
			premio = Math.max(1, Math.round(N(esmeraldas) / andar));
		}
	}

	const total = N(esmeraldas) + premio;
	const pendentes = GatesDanoPendentes(andar);
	const danoPendente = pendentes * 5;
	const cmRecebido = andar >= 20 ? Math.round(derrotadosRun * MultiplicadorCM()) : 0;
	// próximo portão; o reset fica livre a partir do andar 20 em qualquer run
	const proximoPortao = pendentes > 0
		? Math.max(35, gateDanoPago + 5) + danoPendente
		: (ehPortao ? andarVolta + 10 : andarVolta);

	UI.showModal("Voltar ao 1º andar?", `
		<div class="modal-tutorial-texto">
			Você está no andar <b>${andar}</b> e voltará para o <b>1º andar</b>
			${ehPortaoEsmeralda ? "ganhando esmeraldas no caminho" : ehPortao ? "coletando o bônus de dano permanente" : "convertendo seus abates em Conhecimento Mug"}.
		</div>

		<div class="modal-tutorial-info">
			<span>Recompensa: <b>${premio > 0 ? "+" + premio + " esmeralda" + (premio === 1 ? "" : "s") : ehPortao ? "sem esmeraldas (portão intermediário)" : "sem esmeraldas (reset livre)"}</b></span>
			${danoPendente > 0 ? `<span>Bônus: <b>+${danoPendente}% de dano permanente</b></span>` : ""}
			${cmRecebido > 0 ? `<span>Conhecimento Mug: <b>+${cmRecebido} CM</b> (${derrotadosRun} abates × ${MultiplicadorCM()})</span>` : ""}
			<span>Total de esmeraldas: <b>${total}</b></span>
		</div>

		<div class="reset-confirm-lista">
			<div><span class="reset-tag reset-tag--reseta">Reseta</span> gold, loja de gold, nível/XP, habilidades e perks</div>
			<div><span class="reset-tag reset-tag--fica">Fica</span> esmeraldas, loja de esmeraldas, conquistas, conhecimento mug e bônus de dano de reset · base de gold +25%</div>
			<div><span class="reset-tag reset-tag--prox">Próximo</span> reset livre no andar 20${proximoPortao > 20 ? " · portão no andar " + proximoPortao : ""}</div>
		</div>

		<div class="reset-confirm-acoes">
			<button type="button" class="btn-Padrao btn-reset-confirmar" onclick="ConfirmaReset()">Confirmar reset</button>
			<button type="button" class="btn-Padrao btn-reset-cancelar" onclick="UI.closeModal()">Cancelar</button>
		</div>
	`);
}

function ConfirmaReset() {
	const modal = document.getElementById("gameModal");
	if (modal) modal.remove();
	VoltaAndar();
}

//funçoes de controle das conquistas
function Conquistas(){
	if(totalDerrotados>=progressoConquistaDano ){
		progressoConquistaDano = progressoConquistaDano*2;
		if(validaConquista==1){
			// ×1.1: +10% sobre o ganho de antes e a 1ª conquista (100 kills, fator 1.0) deixa de ser sem efeito
			const fatorDano = ((1+(totalDerrotados/100))/2) * 1.1;
			danoJogador = danoJogador*fatorDano;
			danoCritJogador = danoCritJogador+(danoJogador*(2+sobeDCrit));
			bonusCritConquista = bonusCritConquista + (danoJogador*(2+sobeDCrit));
			danoBonus = danoBonus + fatorDano;
			if(lvlComp1>0){
				danoComp = danoJogador*danoComp1;
			}
			validaConquista++;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano recebido");
		} else if(validaConquista==2){
			goldAux = gold + BonusGoldAvanco() * 2;
			const bonusGoldConquista = goldAux*(totalDerrotados/100);
			const goldRecebido = AddGold(bonusGoldConquista);
			AddTotalGold(goldRecebido, false);
			UI.showCurrencyReward("gold", goldRecebido);
			validaConquista++;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de gold");
			UI.showMilestone("Conquista desbloqueada", "Bônus de Gold recebido");
		}else{
			// ×0.75: crítico ganha 25% a menos que antes
			const fatorCrit = ((1+(totalDerrotados/100))/2) * 0.75;
			bonusCritConquista = bonusCritConquista + danoCritJogador*(fatorCrit-1);
			danoCritJogador = danoCritJogador*fatorCrit;
			validaConquista = 1;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano critico");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano crítico recebido");
		}
		LimitaDanoCritico();
		UI.render();
	}
	
	if(totalGold>=progressoConquistaGold){
		progressoConquistaGold = progressoConquistaGold*5;
		
		precoDano = precoDano*0.995;
		precoBEspaco = precoBEspaco*0.995;
		precoGold = precoGold*0.995;
		precoAvan = precoAvan*0.995;
		precoDCrit = precoDCrit*0.995;
		precoCCrit = precoCCrit*0.995;
		precoQTDAvanco = precoQTDAvanco*0.995;
		UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de -0,5% nos preços da loja!");
		UI.showMilestone("Conquista de Gold", "Desconto de 0,5% liberado na loja");
		descontoLoja = descontoLoja+0.005;
		AbreLoja();
		AbreLoja();
	}
}

//funçoes de controles das missoes
function AlternaManterAndar(){
	const chk = document.getElementById("manterAndar");
	if(!chk) return;
	if(chk.checked && andar <= 4){
		chk.checked = false;
		UI.showInfo("Só pode ser ativado a partir do andar 5");
		return;
	}
	UI.showInfo(chk.checked ? "Manter no andar ativado: voce vai ficar farmando neste andar." : "Manter no andar desativado: avanco automatico reativado.");
}

function Missao(){
	if(statusMissao){
		//sorteio uniforme entre 1..qtdMissoes (o arredondamento antigo dava meio peso nas pontas)
		geraMissao = Math.floor(Math.random() * qtdMissoes) + 1;
		missaoAtual = geraMissao;
		statusMissao = false;
		//nova missao comeca do zero
		missaoColetaAtual = 0;
		missaoGolpeAtual = 0;
		missaoCacaMugsAtual = 0;
		missaoTempoAtual = 0;
		missaoDesafioAtual = 0;
		if (missaoAtual === 5) SorteiaDesafio();
	}
	if(missaoAtual==4 && !intervaloMissaoTempo){
		intervaloMissaoTempo = setInterval(MissaoTempo, 1000);
	}
	if(missaoAtual===5 && missaoDesafioSub===3 && !intervaloDesafio){
		intervaloDesafio = setInterval(TickDesafio, 1000);
	}
	UI.updateMission();
}

function MissaoColetaGold(AuxMissao){
	//Verificação de conclusão da missão Coleta de gold
	missaoColetaAtual = missaoColetaAtual+AuxMissao;
	if(missaoColetaAtual>=missaoColeta){
		const goldRecebido = AddGold(missaoColeta / 2);
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoColeta = missaoColeta*2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

function MissaoGolpes(){
	//Verificação de conclusão da missão Golpes
	missaoGolpeAtual++;
	if(missaoGolpeAtual>=missaoGolpe){
		const goldRecebido = AddGold(missaoGolpe);
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Meta de golpes alcançada. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoGolpe = missaoGolpe*2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

function MissaoCaca(){
	//Verificação de conclusão da missão Golpes
	missaoCacaMugsAtual++;
	if(missaoCacaMugsAtual>=missaoCacaMugs){
		const goldRecebido = AddGold(missaoCacaMugs);
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Meta de Mugs derrotados. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoCacaMugs = missaoCacaMugs*2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

function MissaoTempo(){
	if (jogoPausado) return;

	if(missaoAtual==4){
		missaoTempoAtual++;
	}
	if(missaoTempoAtual>=missaoTempo){
		const goldRecebido = AddGold(missaoTempo / 4);
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Meta de tempo alcançada. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoTempo = Math.ceil(missaoTempo*1.5);
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

// ===== Missão 5: desafio com restrição (violou = troca de missão sem recompensa) =====

//Sorteia o tipo do desafio e monta o texto
function SorteiaDesafio() {
	missaoDesafioSub = Math.floor(Math.random() * 3) + 1; //1=sem gold, 2=sem habilidades, 3=contra o tempo
	missaoDesafioTempo = missaoDesafioAlvo * 60; //60 segundos por inimigo exigido
	if (missaoDesafioSub === 1) {
		missao[5] = "Desafio sem gold";
	} else if (missaoDesafioSub === 2) {
		missao[5] = "Desafio sem habilidades";
	} else {
		missao[5] = "Desafio contra o tempo";
	}
}

//Progresso do desafio: contado por abate (igual à Caça aos Mugs)
function MissaoDesafio() {
	if (missaoAtual !== 5) return;
	missaoDesafioAtual++;
	if (missaoDesafioAtual >= missaoDesafioAlvo) {
		//recompensa escala com o andar: mesma base do bônus de avanço ×5 (≈ 5 baús)
		const goldRecebido = AddGold(BonusGoldAvanco() * 5);
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Desafio concluído!\nVoce recebeu um bonus de " + FormatGold(goldRecebido) + " de gold");
		UI.showMilestone("Desafio concluído", "Restrição cumprida. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoDesafioAlvo *= 2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

//Falha do desafio: troca a missão sem recompensa (guarda contra reentrada)
function FalhaDesafio(motivo) {
	if (missaoAtual !== 5 || desafioFalhando) return;
	desafioFalhando = true;
	UI.showMilestone("Desafio falhou", motivo + " — nova missão sorteada");
	statusMissao = true;
	Missao();
	desafioFalhando = false;
}

//Timer do desafio contra o tempo (subtipo 3)
function TickDesafio() {
	if (jogoPausado || missaoAtual !== 5 || missaoDesafioSub !== 3) return;
	missaoDesafioTempo--;
	if (missaoDesafioTempo <= 0) {
		FalhaDesafio("Tempo esgotado");
	} else {
		UI.updateMission();
	}
}
