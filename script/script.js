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
var conhecimentoMug = 0; //moeda permanente da Loja do Conhecimento (1 abate = 1 CM no reset a partir do andar 20)
var derrotadosRun = 0; //abates desde o último reset (base da conversão em Conhecimento Mug)
var cmNivelDano = 0; //níveis da Loja do Conhecimento: +2% de dano permanente cada
var cmNivelGold = 0; //níveis da Loja do Conhecimento: +2% de gold cada
var cmNivelXp = 0; //níveis da Loja do Conhecimento: +2% de XP cada
var cmNivelFuga = 0; //níveis da Loja do Conhecimento: +2 no tempo máximo de fuga cada
var cmNivelCrit = 0; //níveis da Loja do Conhecimento: +2% de dano crítico cada
var cmNivelFormiga = 0; //níveis da Loja do Conhecimento: +0,5% na chance de drop de formiga por abate (48 níveis = chance máx 25%)
var cmNivelDuasFormigas = 0; //níveis da Loja do Conhecimento: +1% de o drop de formiga sair com 2 (máx 100)
var cmNivelComp = 0; //níveis da Loja do Conhecimento: +2% de dano de companheiro cada (baked em danoComp1)
var cmNivelGoldComp2 = 0; //níveis da Loja do Conhecimento: +2% de gold do companheiro 2 cada
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
// Conquistas comportamentais (Tier 4 #1): flags permanentes 0..4 por conquista
var conquistasComp = [0, 0, 0, 0, 0]; //nível 0..máx por conquista (não zera no Resetar; save 0/1 antigo vale como nível 1)
var missoesCompletas = 0; //total de missões concluídas (permanente)
var desafiosVencidos = 0; //desafios da missão 5 vencidos (permanente, marcos 1/3/10 do Destemido)
var melhorGoldRun = new GoldNumber(0); //melhor totalGold de uma run (progresso do Milionário)
var runInicioMs = Date.now(); //cronômetro da run atual (conquista Velocista)
var comprasRun = 0; //compras da loja de gold nesta run (conquista Poupado)
var chanceBau = 0.1;
var chanceEsmeraldaBau = 0.01;
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

// =========================
// CONHECIMENTO MUG
// =========================
// Preço dos itens da loja: base 10 CM, escalonado ×1.4 por nível
// (10, 14, 20, 27, 38...). Era ×1.5 e o crescimento ficava grande rápido.
function PrecoLojaCM(nivel) {
	return Math.round(10 * Math.pow(1.4, Math.max(0, Number(nivel) || 0)));
}

// +2% de gold por nível — aplicado em todo ganho de gold (AddGold)
function MultiplicadorGoldConhecimento() {
	return 1 + cmNivelGold * 0.02;
}

// +2% de XP por nível — aplicado em toda XP ganha (GanhaXP)
function BonusXPConhecimento() {
	return 1 + cmNivelXp * 0.02;
}

// Tempo máximo do cronômetro de fuga: base 120 + 2 s por nível da loja. O
// Canhão de Vidro corta o teto pela metade (arredonda pra baixo, nunca acima
// de 50%); como o cronômetro só reabastece na troca de andar/onda, a troca
// de build vale a partir do próximo abastecimento
function TempoFugaMax() {
	const base = 120 + cmNivelFuga * 2;
	const tempo = especializacao === 4 ? Math.floor(base * 0.5) : base;
	// +5 s da conquista Destemido entra por fora (sempre +5, mesmo no ÷2 do Canhão)
	// Relógio de Bolso (itens da build): +10% por cópia no tempo total
	return (tempo + BonusFugaConquistaComp()) * Tapeira.ItensBuild.multFuga();
}

// Chance de drop de formiga aleatória por abate: 1% base + 0,5% por nível da
// loja do Conhecimento (chance máxima 25%, batida no nível 48)
function ChanceDropFormiga() {
	return Math.min(0.25, 0.01 + Math.min(cmNivelFormiga, 48) * 0.005);
}

// +2% de gold do companheiro 2 por nível — aplicado em todo recálculo de goldCompanheiro
function MultiplicadorGoldComp2() {
	return 1 + cmNivelGoldComp2 * 0.02;
}

// Gold do Companheiro 2 (GoldPS) por segundo — fonte única da fórmula:
// 25% do gold de um inimigo no nível 1, +10% por upgrade (nível n vale
// 25% + 10%×(n−1) do gold de um inimigo do andar atual), × bônus do CM.
// Como depende do andar e dos bônus, é recomposto a cada tick em
// GoldCompanheiros() e no load.
function GoldCompanheiroPorSegundo(nivel = lvlComp2) {
	const n = N(nivel);
	if (n <= 0) return 0;
	const fracao = 0.25 + 0.10 * (n - 1);
	const goldPorInimigo = N(andar) * N(mulGold) * MultiplicadorGoldConhecimento()
		* MultiplicadorGoldFormigas() * MultiplicadorGoldEspecializacao();
	return goldPorInimigo * fracao * MultiplicadorGoldComp2();
}

// Loja de esmeralda "CM em dobro": ×2 no Conhecimento Mug ganho por nível
// (1 nível por enquanto; item permanente da loja de esmeraldas)
// +1 por marco de 50 níveis do jogador (marcosNivel50, permanente)
// ×1,05 por reset curto (resetsCurtosCM, permanente — o total pode virar
// decimal; FormataMultCM formata os textos que mostram "×N")
function MultiplicadorCM() {
	const item = Math.pow(2, Math.max(0, Math.floor(Number(lvlEsmCM) || 0)));
	return (item + Math.max(0, Math.floor(Number(marcosNivel50) || 0)))
		* BonusCMResetCurto();
}

// Reset curto: reset feito PERTO do recorde — até 10 andares antes dele
// (recorde 97, reset no 88 = 9 → conta; reset no 20 → não) — dá +5%
// permanente no multiplicador de CM — acumulativo (1,05^N), contado no
// VoltaAndar e não zerado no Resetar. O teto 10000 mantém 1,05^N finito.
function BonusCMResetCurto() {
	return Math.pow(1.05, Math.max(0, Math.floor(Number(resetsCurtosCM) || 0)));
}

// Multiplicador de CM em texto legível ("1,00", "1,05", "1,1025") — vírgula
// com no mínimo 2 casas decimais (os resets curtos somam frações pequenas)
// e no máximo 4; os cálculos continuam usando o valor cheio
function FormataMultCM(valor = MultiplicadorCM()) {
	let texto = Number(valor).toFixed(4); // fixa e arredonda em 4 casas
	texto = texto.replace(/0+$/, "").replace(/\.$/, ""); // corta zeros sobrando
	const partes = texto.split(".");
	const decimais = (partes[1] || "").padEnd(2, "0"); // "1" vira "1,00"
	return partes[0] + "," + decimais;
}

// Sobra de pontos vira CM (andar 65+): cada ponto de habilidade ainda na
// mão dá +1% no Conhecimento Mug do reset — lido no VoltaAndar ANTES do
// Resetar zerar pontosHabilidade. Sem campo no save: depende só de
// maxAndar e dos pontos que sobrarem na hora do reset.
function BonusCMPontosSobra() {
	return maxAndar >= ANDAR_SOBRA_CM ? 1 + 0.01 * Math.max(0, pontosHabilidade) : 1;
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
var sobeCCrit = 0.02; //passo da chance crítica (cresce ×1,1 por compra; de 30% em diante só metade é aplicada)
var lvlCCrit = 1;

var precoQTDAvanco = 200;
var lvlQTDAvanco = 1;

var precoVidaInimigo = 150;
var subVidaInimigo = 0.00;
var lvlSubVida = 0;

var precoBau = 25;
var lvlBau = 1;

// Item novo da loja de gold: chance de esmeralda ao abrir cada baú
var precoEsmBau = 500;
var lvlEsmBau = 0;

// Item novo da loja de gold: velocidade de ataque do companheiro — +20% por
// nível a partir de 1 hit/s, com teto por patente (1,6 → 1,8 → 2,0 hits/s).
// O tick do DanoCompanheiros escala junto (SincronizaIntervaloDanoComp)
var precoVelComp = 125;
var lvlVelComp = 1;
var velAtaqueComp = 1;

// Patentes da loja de gold (0 = ★I, a base de hoje): ao bater no nível máximo
// o ingresso destrava o próximo segmento de níveis com o teto do efeito
// subindo. São por run — zeram no reset junto com os itens que destravam.
var patenteBau = 0;
var patenteBEspaco = 0;
var patenteQTDAvan = 0;
var patenteCCrit = 0;
var patenteSubVida = 0;
var patenteAvan = 0;
var patenteEsmBau = 0;
var patenteVelComp = 0;
// Dano e Dano Crítico: gate por nível (★I fecha no 50) e a ★ acelera a taxa
// do passo dinâmico (1,025 → +0,005 por patente)
var patenteDano = 0;
var patenteDCrit = 0;

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

// Companheiro 4 (Alquimista): a cada 20s sorteia um buff aleatório por 10s
var precoComp4 = 6;
var lvlComp4 = 0;

// Companheiro 5 (Assassino): passiva de morte instantânea
var precoComp5 = 8;
var lvlComp5 = 0;

// Companheiro 6 (Explorador do mapa): chance de avançar mais de um andar
var precoComp6 = 10;
var lvlComp6 = 0;

// Buffs do Alquimista (comp 4): sorteia um dos 4 a cada 20s, vale por 10s.
// buffAtivo guarda o tipo e o timestamp (ms) de fim.
var buffAtivo = null; // { tipo: "dano"|"gold"|"velocidade"|"bau", fimMs }
// Handles dos intervalos dos novos companheiros (gerenciados: criados na
// compra/load e limpos no PreCarregamento junto com os demais intervalos)
var intervaloMagoRelogio = null; // comp 3: carrega skill a cada 5s
var intervaloAlquimista = null;  // comp 4: sorteia buff a cada 20s −1s por nível

var precoXP = 1;
var lvlXP = 0;
// marcos de 50 níveis do jogador já reivindicados (+1 cada no MultiplicadorCM)
// permanente: não zera no Resetar, então o mesmo marco não paga duas vezes
var marcosNivel50 = 0;
// resets feitos perto do recorde (até 10 andares antes do maxAndar): +5%
// permanente no MultiplicadorCM cada — acumulativo (1,05^N), não zera no Resetar
var resetsCurtosCM = 0;

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

	// Cadeia de Ataques: o stack é por inimigo e por onda — onda/andar novo
	// zera os contadores (mesmo spawn que dá vida nova aos4 inimigos)
	ataquesCadeia = [0, 0, 0, 0, 0];
	
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

// ---------- Fundo da caverna ----------
// Duas camadas fixas (#fundoA/#fundoB) se cruzam (crossfade ~1,2s; corte seco
// em reduced-motion) a cada andar vencido. Novo fundo = jogar o PNG em imagens/
// e listar o nome aqui. Cosmético: não vai pro save.
var FUNDOS_CAVERNA = ['background cristal.png', 'background.png'];
var fundoIdxAtual = 0;
var fundoA = null, fundoB = null, fundoAtiva = null;

function IniciaFundos() {
	if (fundoAtiva) return; // idempotente (Batalha roda a cada load/onda)
	fundoA = document.getElementById('fundoA');
	fundoB = document.getElementById('fundoB');
	if (!fundoA || !fundoB) return;
	fundoAtiva = fundoA;
	// aquece as duas artes: a primeira troca não pode "piscar"
	FUNDOS_CAVERNA.forEach(function (nome) {
		var img = new Image();
		img.src = 'imagens/' + nome;
	});
}

function ProximoFundo() {
	if (!fundoAtiva) IniciaFundos();
	if (!fundoAtiva) return;
	fundoIdxAtual = (fundoIdxAtual + 1) % FUNDOS_CAVERNA.length;
	var oculta = fundoAtiva === fundoA ? fundoB : fundoA;
	// andares muito rápidos: conclui na hora qualquer crossfade em voo
	fundoAtiva.style.transition = 'none';
	fundoAtiva.style.opacity = '1';
	oculta.style.transition = 'none';
	oculta.style.opacity = '0';
	void oculta.offsetHeight; // aplica os estados finais sem transição
	// a camada oculta recebe a próxima arte; as duas se cruzam (~1,2s)
	// URL absoluta: URL relativa dentro de var() resolveria contra estilos.css (css/imagens/… = 404)
	oculta.style.setProperty('--fundo-img', "url('" + new URL('imagens/' + FUNDOS_CAVERNA[fundoIdxAtual], document.baseURI).href + "')");
	fundoAtiva.style.transition = '';
	oculta.style.transition = '';
	void oculta.offsetHeight; // reativa a transição antes de mexer no opacity
	oculta.style.opacity = '1';
	fundoAtiva.style.opacity = '0';
	fundoAtiva = oculta;
}

function AvancoInimigos() {
	if (jogoPausado || fugaEmAndamento) return;
	if (AtualizaRelogioHabilidade()) return;
	// Fissura temporal: congela só o cronômetro de fuga (a pausa da skill de
	// escape acima continua sendo consumida e os demais ticks seguem)
	if (typeof eventoAtivo !== "undefined" && eventoAtivo === "fissura") return;

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
			// sobra de pontos (andar 65+): ×(1 + 1% por ponto na mão) — feito
			// AQUI, antes do Resetar zerar pontosHabilidade
			cmRecebido = Math.round(derrotadosRun * MultiplicadorCM() * BonusCMPontosSobra());
			conhecimentoMug = conhecimentoMug + cmRecebido;
		}
		// Reset curto: reset feito PERTO do recorde — até 10 andares antes
		// dele (recorde 97, reset no 88 = 9 andares → conta; no 20 → não) —
		// dá +5% no multiplicador de CM, permanente e acumulativo, mas só a
		// partir do PRÓXIMO reset (a conversão acima já usou o valor anterior)
		const resetCurto = maxAndar - andarAnterior <= 10;
		if (resetCurto) resetsCurtosCM = Math.min(10000, resetsCurtosCM + 1);
		
		andar=1;
		qtdInimigosAndar=1;
		console.log("1 "+mulGoldInicial);
		mulGold = mulGoldInicial;
		mulGold = mulGold*1.25;

		if(lvlComp2>0){
			goldCompanheiro = GoldCompanheiroPorSegundo();
		}
		
		// conquista Velocista: reset feito com a run abaixo de 10 minutos no
		// andar 30×nível — um reset profundo carrega todos os níveis de uma
		// vez (o Resetar logo abaixo reinicia o cronômetro da nova run)
		if (Date.now() - runInicioMs < 10 * 60 * 1000 && andarAnterior >= 30)
			SobeNivelConquistaComp(0, Math.floor(andarAnterior / 30));
		Resetar(); // zera derrotadosRun (a conversão em CM já foi feita acima)
		RemoverInimigos();
		Batalha();
		if (esmeraldasRecebidas > 0) UI.showCurrencyReward("emerald", esmeraldasRecebidas);
		if (cmRecebido > 0) UI.showInfo("Você ganhou " + cmRecebido + " Conhecimento Mug!");
		if (resetCurto) UI.showMilestone("Reset curto!", "+5% permanente no multiplicador de CM (agora ×" + FormataMultCM() + ")");
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
	const cmRecebido = andar >= 20 ? Math.round(derrotadosRun * MultiplicadorCM() * BonusCMPontosSobra()) : 0;
	// sobra de pontos (andar 65+): o × extra aparece na linha do preview
	const bonusPontosCM = BonusCMPontosSobra();
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
			${cmRecebido > 0 ? `<span>Conhecimento Mug: <b>+${cmRecebido} CM</b> (${derrotadosRun} abates × ${FormataMultCM()}${bonusPontosCM > 1 ? " × " + bonusPontosCM.toFixed(2).replace(".", ",") + " pela sobra de pontos" : ""})</span>` : ""}
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
