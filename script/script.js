//variaveis de regras
var avancoInterval;
var numInimigosTela = 1; //usada para validar quantos inimigos e
var andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
var andarMaxRun = 1; //pico de andar desta run (base dos pontos de perk; zera no reset)
var qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
var inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
var limiteInimigos = 1; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
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
var cmNivelDano = 0; //níveis da Loja do Conhecimento: +5% de dano permanente cada
var cmNivelGold = 0; //níveis da Loja do Conhecimento: +5% de gold cada
var cmNivelXp = 0; //níveis da Loja do Conhecimento: +5% de XP cada
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
var tempoAvancoInimigos = 90; //tempo para que o jogar seja obrigado a recuar um andar
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
// Casa (hub da Cidade): conforto melhora o progresso offline; troféus são as
// conquistas comportamentais exibidas (bitmask). Permanentes: NÃO zeram no
// Resetar (só no ZerarTodosSaves), como o Conhecimento Mug.
var casaNivel = 0;
var trofeusExibidos = 0;
// Fazenda de Formigas (Cidade): nível = velocidade da produção passiva;
// Rainha = multiplica a produção. Permanentes (não zeram no reset).
var fazendaNivel = 0;
var fazendaRainha = 0;
var intervaloFazenda = null; // handle do timer de produção da Fazenda
// Centro de Pesquisa (Cidade): nível por item da build e por tipo de inimigo.
// Permanentes (não zeram no reset). Objetos { id: nível }.
var pesquisaItens = {};
var pesquisaInimigos = {};
// Mercado (Cidade): reputação = desconto nas lojas. Permanente.
var reputacao = 0;
// Fábrica (Cidade): nível da linha de montagem (auto-compra por segundo). Permanente.
var fabricaNivel = 0;
// Cristal (Cidade): amplia os rendimentos conforme a profundidade do reset. Permanente.
var cristalNivel = 0;
// Loja de Troféus (Cidade): nível por troféu, comprado com Tickets de Caçador
// de Mugs (os pontos de habilidade que sobram). Permanente (não zera no
// reset). Objeto { trofeuId: nível } — ver trofeus.js.
var trofeus = {};
// Mercado (Cidade): Ofertas do dia. `ofertasDia` é o stamp do dia local da
// última rotação (ano*10000+mês*100+dia) e `ofertasDiaCompradas` é um bitmask
// das ofertas já compradas (bit i = oferta i). Giram à meia-noite; não zeram
// no reset (ver mercado.js).
var ofertasDia = 0;
var ofertasDiaCompradas = 0;

// Nome do jogador — identidade escolhida na Casa (casa.js) e exibida nos
// duelos da Batalha-fantasma (ficha, corrida e resultado). PERMANENTE: não
// zera no Resetar (só no ZerarTodosSaves), como o CM e os troféus.
var nomeJogador = "Tapeira";
const NOME_JOGADOR_MAX = 20;

// Fonte única do nome exibido: tira caracteres de controle e espaços duplos,
// corta no teto e nunca devolve vazio (o padrão é "Tapeira").
function NormalizaNomeJogador(valor) {
	const limpo = String(valor === undefined || valor === null ? "" : valor)
		.replace(/[\u0000-\u001f\u007f]/g, " ")
		.replace(/\s+/g, " ")
		.trim()
		.slice(0, NOME_JOGADOR_MAX);
	return limpo || "Tapeira";
}

// O nome que o jogo mostra — sempre normalizado, mesmo se o save veio
// editado à mão ou o campo nem existir (save antigo).
function NomeJogador() {
	return NormalizaNomeJogador(nomeJogador);
}

// Multiplicador global dos custos em CM da CIDADE (todos os prédios). Um botão
// só pra recalibrar — nasceu do rebalance de ×10 pedido pelo jogador.
const CUSTO_CIDADE_MULT = 10;

// Aparência (customização): id do item equipado em cada slot (ver
// customizacao.js). PERMANENTE — não zera no Resetar. Ausente em save antigo =
// "nenhum".
var chapeuEquipado = "nenhum";
var cachecolEquipado = "nenhum";
var armaEquipado = "nenhum";
var cintoEquipado = "nenhum";
var escudoEquipado = "nenhum";
// Aparência: usar a imagem CLÁSSICA (com capacete/picareta) em vez da
// customização. Antes da Cidade (andar 80) o player é sempre clássico.
var aparenciaClassica = false;
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
	{ id: "vermelhas", nome: "Vermelhas", singular: "vermelha", contador: "formigasVermelhas", cor: "#e94b4b", bonus: "+5% de dano por conjunto de 10" },
	{ id: "amarelas", nome: "Amarelas", singular: "amarela", contador: "formigasAmarelas", cor: "#ffd34f", bonus: "+5% de Gold por conjunto de 10" },
	{ id: "marrons", nome: "Marrons", singular: "marrom", contador: "formigasMarrons", cor: "#9b633f", bonus: "+2% de Gold por baú e +1 ponto percentual de chance de baú extra por conjunto de 10" },
	{ id: "pretas", nome: "Pretas", singular: "preta", contador: "formigasPretas", cor: "#333943", bonus: "+2 minutos no limite de progresso offline por conjunto de 10" },
	{ id: "cinzas", nome: "Cinzas", singular: "cinza", contador: "formigasCinzas", cor: "#aab2bd", bonus: "+1 baú no limite de progresso offline por conjunto de 10" }
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
// Preço dos itens da loja: base 10 CM, escalonado ×1.25 por nível
// (10, 13, 16, 20, 24...). Era ×1.4 — e antes ×1.5. A renda de CM cresce
// ~linear com os abates do reset, então ×1.4 travava a loja no meio do jogo
// (a auditoria de ritmo flagrou: o bot parava de comprar CM no nível ~18).
function PrecoLojaCM(nivel) {
	const base = 10 * Math.pow(1.25, Math.max(0, Number(nivel) || 0));
	// Mercado (Cidade): a reputação dá desconto na Loja do Conhecimento
	const preco = (typeof PrecoComReputacao === "function") ? PrecoComReputacao(base) : base;
	return Math.round(preco);
}

// +5% de gold por nível — aplicado em todo ganho de gold (AddGold)
function MultiplicadorGoldConhecimento() {
	return 1 + cmNivelGold * 0.05;
}

// +5% de XP por nível — aplicado em toda XP ganha (GanhaXP)
function BonusXPConhecimento() {
	return 1 + cmNivelXp * 0.05;
}

// Tempo máximo do cronômetro de fuga: base 90 + 2 s por nível da loja. O
// Canhão de Vidro corta 80% do teto (sobra 20%, arredondado pra baixo); como o
// cronômetro só reabastece na troca de andar/onda, a troca de build vale a
// partir do próximo abastecimento
function TempoFugaMax() {
	const base = 90 + cmNivelFuga * 2;
	const tempo = especializacao === 4 ? Math.floor(base * 0.2) : base;
	// +5 s da conquista Destemido entra por fora (sempre +5, mesmo no −80% do Canhão)
	// Relógio de Bolso (itens da build): +10% por cópia no tempo total
	return (tempo + BonusFugaConquistaComp()) * Tapeira.ItensBuild.multFuga();
}

// Texto do cronômetro de fuga no HUD: no máximo 2 casas decimais. A
// multiplicação do TempoFugaMax (Relógio de Bolso ×1,1) deixa lixo de ponto
// flutuante (117.0500000000003) e era isso que aparecia na tela.
function FormataTempoFuga(tempo) {
	if (!Number.isFinite(tempo)) return "0";
	const texto = (Math.round(tempo * 100) / 100).toFixed(2);
	return texto.replace(/(\.\d*?)0+$/, "$1").replace(/\.$/, "");
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
// Base: ×2 desde o começo (auditoria de ritmo — o começo era o trecho mais
// árido, e medido no bot o ×2 adianta ~1 reset por marco no early/mid sem
// mexer no teto: lá quem manda é o preço do CM e o bônus de reset curto).
// O "CM em dobro" da loja de esmeraldas dobra A PARTIR daqui (×2 → ×4 ...).
const CM_MULT_BASE = 2;

function MultiplicadorCM() {
	const item = CM_MULT_BASE * Math.pow(2, Math.max(0, Math.floor(Number(lvlEsmCM) || 0)));
	// Loja de Troféus (Cidade): +% de CM por nível do troféu Colecionador
	const trofeuCM = (typeof TrofeuBonusCM === "function") ? TrofeuBonusCM() : 1;
	return (item + Math.max(0, Math.floor(Number(marcosNivel50) || 0)))
		* BonusCMResetCurto() * trofeuCM;
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

// Quanto CM as ofertas que COMPRAM Conhecimento Mug concedem: escala com o
// andar (20 × andar). O preço dessas ofertas também escala com o andar e o CM
// por reset cresce com o número de abates, então a oferta continua valendo no
// late game. Fonte única: evento Comércio + Ofertas do Mercado.
function CMCompraOferta(andarAtual = andar) {
	return Math.max(15, Math.round(20 * (Number(andarAtual) || 0)));
}

// Sobra de pontos vira CM (andar 65+): cada ponto de habilidade ainda na
// mão dá +1% no Conhecimento Mug do reset - lido no VoltaAndar ANTES do
// Resetar zerar pontosHabilidade. Conta também os Tickets de Caçador de Mugs
// (o que virou ticket não pode mais subir skill, mas continua valendo CM).
// Sem campo no save: depende só de maxAndar e dos pontos que sobrarem.
function BonusCMPontosSobra() {
	if (maxAndar < ANDAR_SOBRA_CM) return 1;
	const restantes = Math.max(0, pontosHabilidade) + Math.max(0, ticketsMug);
	return 1 + 0.01 * restantes;
}

//variaveis da loja de gold e de esmeraldas
// (movidas para script/loja-variaveis.js — carregado logo depois deste arquivo)
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
// (movido para script/fundos.js — carregado logo depois deste arquivo)

// AvancoInimigos (avanço/fuga do andar) foi movido para
// script/avanco-inimigos.js

// Portões de dano, VoltaAndar, PedeReset/ConfirmaReset e o painel
// "manter no andar" foram movidos para script/reset.js
