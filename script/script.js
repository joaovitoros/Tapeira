//variaveis de regras
var avancoInterval;
var numInimigosTela = 1; //usada para validar quantos inimigos e
var andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
var qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
var inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
var limiteInimigos; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
var gold = new GoldNumber(0); //quantidade de dinheiro do jogador
var saveAnd = 10; //andar que será efetuado o salvamento automatico
var qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
var maxAndar = 0; //andar maximo atingido
var andarVolta = 20; //andar necessario para que se possa utilizar o reset
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
var missao = Array(" ","Coleta de Gold", "Golpes", "Caça aos Mugs", "Tempo") //vetor usado para listagem das missões
var missaoAtual; //variavel que determina a missão atual (1- coleta de gol, 2- tempo, 3- caça aos mugs)
var missaoColeta = 500, missaoColetaAtual = 0.0; //Gold necessario para completar a missão "Coleta de gold"
var missaoGolpe = 100, missaoGolpeAtual = 0; //Quantidade de golpes necessarios para concluir a missão "Golpes"
var missaoCacaMugs = 50, missaoCacaMugsAtual = 0; //Quantidade de mugs necessarios para completar a missão "Caça aos Mugs"
var missaoTempo = 10000, missaoTempoAtual = 0; //tempo em milissegundos necessarios para concluir a missão "Tempo"
var qtdMissoes = 4; //Quantidade de missões disponiveis
var statusMissao = true; //Verifica se a missão pode ser iniciada
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
const NIVEL_MAXIMO_SKILLS = 5;
const SKILLS_UPGRADE = [
	{ id: "damage", nome: "Dano automático", pisoDesbloqueio: 1, maximo: 6, nivel: "nivelSkillDano" },
	{ id: "electric", nome: "Corrente elétrica", pisoDesbloqueio: 15, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillEletrica" },
	{ id: "gold", nome: "Bônus de Gold", pisoDesbloqueio: 25, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillGold" },
	{ id: "escape", nome: "Pausa da fuga", pisoDesbloqueio: 35, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillFuga" }
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

function LimitaDanoCritico() {
	const danoNormal = Number(danoJogador);
	const danoCritico = Number(danoCritJogador);
	if (!Number.isFinite(danoNormal) || !Number.isFinite(danoCritico)) return;
	danoCritJogador = Math.min(Math.max(danoNormal, danoCritico), danoNormal * multiplicadorMaximoDanoCritico);
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
		const distanciaAteDrop = Math.floor(Math.log1p(-Math.random()) / Math.log(0.99)) + 1;
		if (distanciaAteDrop > abatesRestantes) break;
		abatesRestantes -= distanciaAteDrop;
		resultado[Math.floor(Math.random() * FORMIGAS.length)]++;
	}
	return resultado;
}

function RegistraDropFormiga() {
	if (!FormigasDesbloqueadas() || Math.random() >= 0.01) return false;
	const formiga = FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)];
	ConcedeFormigaColecao(formiga);
	return true;
}

//variaveis referentes a loja
var precoDano = 5;
var mulDano = 1;
var lvlDano = 1;

var precoBEspaco = 45;
var lvlBEspaco = 1;

var precoGold = 50;
var sobeGold = 0.1;
var lvlGold = 1;

var precoAvan = 80;
var sobeAvanco = 0.01;
var lvlAvan = 0;

var precoDCrit = 100;
var sobeDCrit = 0.1;
var lvlDCrit = 1;

var precoCCrit = 200;
var sobeCCrit = 0.02;
var lvlCCrit = 1;

var precoQTDAvanco = 200;
var lvlQTDAvanco = 1;

var precoVidaInimigo = 150;
var subVidaInimigo = 0.00;
var lvlSubVida = 0;

var precoBau = 10;
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
////

function CarregarStatus(){
	var pow;
	if(andar>15 && andar<=40){
		pow=1.8;
	}else if (andar>40){
		pow=2.5;
	}else{
		pow=1.25;
	}
	
	
	vidaAndar = Math.pow(andar, pow);
	
	if(vidaAndar<5){
		vidaAndar = vidaAndar*2;
	}

	vidaAndar = vidaAndar*(1-subVidaInimigo);
	
	vidaInimigo1 = vidaAndar;
	vidaInimigo2 = vidaAndar;
	vidaInimigo3 = vidaAndar;
	vidaInimigo4 = vidaAndar;
	
	if(andar>=10){
		Missao();
	}
	
	if(andarBoss==andar){
		vidaAndar = vidaAndar*2;
		vidaInimigo1 = vidaInimigo1*2;
		vidaInimigo2 = vidaInimigo2*2;
		vidaInimigo3 = vidaInimigo3*2;
		vidaInimigo4 = vidaInimigo4*2;
		UI.showInfo("Inimigos mais fortes...");
		andarBoss=andarBoss+10;
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

function ValorGoldBau() {
	return (((andar * mulGold) + (vidaAndar * mulGold) * mulGoldAvanco) * 5)
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
	document.body.removeChild(document.getElementById("habilidade1"));
	ChamaSom('audio5');
	verificaHabilidadeDano = true;
	tempoHabilidadeDano = 30 + NivelDaSkill("damage") * 5;
	qtdCarregaHabilidade = 0;
	UI.updateSkillProgress();
}

const habilidadesCombate = [
	{ id: "electric", unlockFloor: 15, killsRequired: 20 },
	{ id: "gold", unlockFloor: 25, killsRequired: 25 },
	{ id: "escape", unlockFloor: 35, killsRequired: 15 }
];

function PisoMaximoAlcancado() {
	return Math.max(andar, maxAndar);
}

function XPNecessarioProximoNivel(nivel = nivelJogador) {
	return 50 + 25 * Math.max(0, nivel - 1);
}

function XPPorInimigo(piso = andar) {
	return 1 + Math.floor((Math.max(1, piso) - 1) / 10);
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
	const xpBase = xpCalculado;
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
		UI.showMilestone(
			niveisGanhos === 1 ? "Nível aumentado!" : `${niveisGanhos} níveis aumentados!`,
			`Você alcançou o nível ${nivelJogador} e recebeu ${niveisGanhos} ${niveisGanhos === 1 ? "ponto de habilidade" : "pontos de habilidade"}.`
		);
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
	if (id === "gold") return `Gold extra por ataque: ${25 + nivel * 5}% (+5% por nível).`;
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

	if (id === "electric" && abatesCorrenteEletrica >= skill.killsRequired && ataquesCorrenteEletrica === 0) {
		abatesCorrenteEletrica = 0;
		ataquesCorrenteEletrica = 20;
		ChamaSom("audio5");
		UI.showInfo("Corrente elétrica ativa por 20 ataques!");
	} else if (id === "gold" && abatesBonusGoldAtaque >= skill.killsRequired && ataquesBonusGold === 0) {
		abatesBonusGoldAtaque = 0;
		ataquesBonusGold = 25;
		ChamaSom("audio6");
		UI.showInfo("Bônus de Gold ativo por 25 ataques!");
	} else if (id === "escape" && abatesPausaFuga >= skill.killsRequired && segundosPausaFuga === 0 && !fugaEmAndamento) {
		abatesPausaFuga = 0;
		segundosPausaFuga = 10 + NivelDaSkill("escape") * 2;
		ChamaSom("audio7");
		UI.showInfo(`Relógio de fuga pausado por ${segundosPausaFuga} segundos!`);
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
			fugaEmAndamento = true;
			UI.showInfo("Inimigos te alcançaram, fugindo...");
			UI.playEscapeAnimation().then(() => {
				RemoverInimigos();
				andar--;
				inimigosDerrotados = 0;
				qtdInimigosAndar--;
				tempoAvancoInimigos = 120;
				UI.render();
				CarregarStatus();
				UI.spawnEnemies();
				UI.showInfo("Dica: compre Avanço rápido para facilitar os andares");
				fugaEmAndamento = false;
			});
			return;
        }

        tempoAvancoInimigos = 120;
    }
}

function VoltaAndar(){
	console.log("ENTROU NO VOLTA ANDAR");
	if(andar>=andarVolta){
		console.log("PODE VOLTAR");
		let esmeraldasRecebidas;
		if(andar>=maxAndar){
			console.log(numVoltas);
			numVoltas++;
			esmeraldasRecebidas = numVoltas;
			esmeraldas = esmeraldas+numVoltas;
		}else{
			var auxEsmeraldas = Math.round(esmeraldas/andar);
			
			if(auxEsmeraldas<1){
				auxEsmeraldas=1;
			}
			esmeraldasRecebidas = auxEsmeraldas;
			esmeraldas = esmeraldas+auxEsmeraldas;
		}
		
		andarVolta=andarVolta+10;
		
		andar=1;
		qtdInimigosAndar=1;
		console.log("1 "+mulGoldInicial);
		mulGold = mulGoldInicial;
		mulGold = mulGold*1.25;

		if(lvlComp2>0){
			goldCompanheiro = lvlComp2*mulGold;
		}
		
		Resetar();
		RemoverInimigos();
		Batalha();
		UI.showCurrencyReward("emerald", esmeraldasRecebidas);
		UI.showInfo("Voce voltou ao primeiro andar e recebeu " + esmeraldasRecebidas + " esmeraldas.");
	}else{
		UI.showInfo("É necessario chegar no andar "+andarVolta +" para poder voltar");
	}
}

//funçoes de controle das conquistas
function Conquistas(){
	if(totalDerrotados>=progressoConquistaDano ){
		progressoConquistaDano = progressoConquistaDano*2;
		if(validaConquista==1){
			danoJogador = danoJogador*((1+(totalDerrotados/100))/2);
			danoCritJogador = danoCritJogador+(danoJogador*(2+sobeDCrit));
			danoBonus = danoBonus + (1+(totalDerrotados/100))/2;
			if(lvlComp1>0){
				danoComp = danoJogador*danoComp1;
			}
			validaConquista++;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano recebido");
		} else if(validaConquista==2){
			goldAux = gold+(((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco))*2;
			const bonusGoldConquista = goldAux*(totalDerrotados/100);
			const goldRecebido = AddGold(bonusGoldConquista);
			AddTotalGold(goldRecebido, false);
			UI.showCurrencyReward("gold", goldRecebido);
			validaConquista++;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de gold");
			UI.showMilestone("Conquista desbloqueada", "Bônus de Gold recebido");
		}else{
			danoCritJogador = danoCritJogador*((1+(totalDerrotados/100))/2);
			validaConquista = 1;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano critico");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano crítico recebido");
		}
		LimitaDanoCritico();
		UI.render();
	}
	
	if(totalGold>=progressoConquistaGold){
		progressoConquistaGold = progressoConquistaGold*2;
		
		precoDano = precoDano*0.99;
		precoBEspaco = precoBEspaco*0.99;
		precoGold = precoGold*0.99;
		precoAvan = precoAvan*0.99;
		precoDCrit = precoDCrit*0.99;
		precoCCrit = precoCCrit*0.99;
		precoQTDAvanco = precoQTDAvanco*0.99;
		UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de -1% nos preços da loja!");
		UI.showMilestone("Conquista de Gold", "Desconto de 1% liberado na loja");
		descontoLoja = descontoLoja+0.01;
		AbreLoja();
		AbreLoja();
	}
}

//funçoes de controles das missoes
function Missao(){
	if(statusMissao){
		geraMissao = Math.random()*(qtdMissoes-1)+1;
		geraMissao = Math.round(geraMissao);
		missaoAtual = geraMissao;
		statusMissao = false;
	}
	if(missaoAtual==4){
		window.onload = setInterval("MissaoTempo()", 1000);
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
	if(missaoGolpeAtual==missaoGolpe){
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
	if(missaoCacaMugsAtual==missaoCacaMugs){
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
	if(missaoTempoAtual==missaoTempo){
		const goldRecebido = AddGold(missaoTempo / 60);
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Meta de tempo alcançada. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoTempo = missaoTempo*1.5;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}
