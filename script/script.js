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
var perkFrenesi = 0; //níveis de perk do Toque Frenético (+25% no dano do toque durante a janela cada, máx 4)
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
var abatesFrenesi = 0; //toques que carregam o Toque Frenético (só cliques do jogador; não são abates)
var ataquesFrenesi = 0; //toques restantes da janela ativa do Toque Frenético
var nivelJogador = 1;
var xpAtual = 0;
var pontosHabilidade = 0;
var nivelSkillDano = 0;
var nivelSkillEletrica = 0;
var nivelSkillGold = 0;
var nivelSkillFuga = 0;
var nivelSkillFrenesi = 0;
const NIVEL_MAXIMO_SKILLS = 10;
const SKILLS_UPGRADE = [
	{ id: "damage", nome: "Dano automático", pisoDesbloqueio: 1, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillDano", ramo: "ramoSkillDano" },
	{ id: "electric", nome: "Corrente elétrica", pisoDesbloqueio: 15, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillEletrica", ramo: "ramoSkillEletrica" },
	{ id: "gold", nome: "Bônus de Gold", pisoDesbloqueio: 25, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillGold", ramo: "ramoSkillGold" },
	{ id: "escape", nome: "Pausa da fuga", pisoDesbloqueio: 35, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillFuga", ramo: "ramoSkillFuga" },
	{ id: "frenzy", nome: "Toque Frenético", pisoDesbloqueio: 45, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillFrenesi", ramo: "ramoSkillFrenesi" }
];
// Perks: 1 ponto por portão alcançado no pico de andar desta run (>= 35).
// O nível de perk é por run (zeramos no reset) e independe do nível da skill.
const PERKS = [
	{ skillId: "damage", varName: "perkDano", nome: "Dano automático", efeito: "+25% de dano por nível; no nível máximo a skill ativa sozinha quando carregada", maximo: 4 },
	{ skillId: "electric", varName: "perkEletrica", nome: "Corrente elétrica", efeito: "+1 inimigo atingido por nível", maximo: 3 },
	{ skillId: "gold", varName: "perkGold", nome: "Bônus de Gold", efeito: "+25% no drop do kill feito com a skill ativa por nível; do nível 1 em diante o companheiro também usa a skill ativa", maximo: 4 },
	{ skillId: "escape", varName: "perkFuga", nome: "Pausa da fuga", efeito: "10% de restaurar o tempo de fuga por nível (máx 50%)", maximo: 5 },
	{ skillId: "frenzy", varName: "perkFrenesi", nome: "Toque Frenético", efeito: "+25% no dano do toque durante a janela por nível", maximo: 4 }
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
	return tempo + BonusFugaConquistaComp();
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

// ============================================================
// NOVOS COMPANHEIROS (Fauna Fantástica)
// ============================================================
// Companheiro 3 (Mago do Relógio): a cada 5s enche 10% da barra de
// uma skill aleatória (substituiu o bônus de tempo).
// Companheiro 4 (Alquimista): a cada 20s sorteia um buff por 10s.
// Companheiro 5 (Assassino): passiva — ataque tem chance de matar
//   instantaneamente (0,5% manual; metade em automáticos/companheiro).
// Companheiro 6 (Explorador do mapa): chance de avançar mais de um
//   andar por vez (escala com o nível: 5% + 2% por nível).

// Buffs do Alquimista: tipo → multiplicador e nome amigável
const BUFFS_ALQUIMISTA = [
	{ tipo: "dano",     mult: 2,   nome: "Dano ×2" },
	{ tipo: "gold",     mult: 2,   nome: "Gold ×2" },
	{ tipo: "velocidade", mult: 2, nome: "Velocidade ×2" },
	{ tipo: "bau",      mult: 3,   nome: "Baú ×3" }
];
const DURACAO_BUFF_MS = 10000; // 10s

// Verifica se o buff do tipo está vigente (e limpa o expirado)
function BuffAtivo(tipo) {
	if (!buffAtivo) return false;
	if (Date.now() >= buffAtivo.fimMs) {
		buffAtivo = null;
		return false;
	}
	return buffAtivo.tipo === tipo;
}

function MultiplicadorBuffDano() { return BuffAtivo("dano") ? 2 : 1; }
function MultiplicadorBuffGold() { return BuffAtivo("gold") ? 2 : 1; }
function MultiplicadorBuffVelocidade() { return BuffAtivo("velocidade") ? 2 : 1; }
function MultiplicadorBuffBau() { return BuffAtivo("bau") ? 3 : 1; }

// Sorteia e aplica um buff aleatório (chamado a cada 20s pelo Alquimista)
function SorteiaBuffAlquimista() {
	if (jogoPausado || fugaEmAndamento) return;
	if (lvlComp4 <= 0) return;
	const sorteado = BUFFS_ALQUIMISTA[Math.floor(Math.random() * BUFFS_ALQUIMISTA.length)];
	buffAtivo = { tipo: sorteado.tipo, fimMs: Date.now() + DURACAO_BUFF_MS };
	UI.showInfo("Alquimista: " + sorteado.nome + " por 10s!");
	AtualizaBuffAlquimistaUI();
}

// Indicador do buff ativo no HUD (cria/atualiza/remove o selo)
function AtualizaBuffAlquimistaUI() {
	let selo = document.getElementById("buffAlquimista");
	if (!buffAtivo || Date.now() >= buffAtivo.fimMs) {
		selo?.remove();
		return;
	}
	const info = BUFFS_ALQUIMISTA.find(b => b.tipo === buffAtivo.tipo);
	if (!info) return;
	if (!selo) {
		selo = document.createElement("div");
		selo.id = "buffAlquimista";
		selo.className = "buff-alquimista";
		document.body.appendChild(selo);
	}
	const resta = Math.max(0, Math.ceil((buffAtivo.fimMs - Date.now()) / 1000));
	selo.innerHTML = "🧪 " + info.nome + " (" + resta + "s)";
}

// ---- Efeitos por nível dos novos companheiros (3, 4 e 5) ----
// Mago: fatia da skill preenchida por disparo — 10% no nv1, +2% por nível
// (teto 50%)
function PctCargaMago() {
	return Math.min(0.50, 0.10 + 0.02 * Math.max(0, Math.floor(Number(lvlComp3) || 0) - 1));
}

// Alquimista: intervalo entre buffs — 20s no nv1, −1s por nível (mín 10s)
function IntervaloAlquimistaMs() {
	return Math.max(10000, 20000 - 1000 * Math.max(0, Math.floor(Number(lvlComp4) || 0) - 1));
}

// Assassino: chance de morte instantânea — 0,5% no nv1, +0,05% por nível;
// a metade (0,25% +0,025%) vale nos golpes automáticos e do companheiro
function ChanceMorteAssassino(manual) {
	const n = Math.max(0, Math.floor(Number(lvlComp5) || 0) - 1);
	return (manual ? 0.005 : 0.0025) + (manual ? 0.0005 : 0.00025) * n;
}

// Mago do Relógio: enche uma fatia da barra de uma skill aleatória.
// Considera só as skills desbloqueadas e que ainda não estão cheias.
function CarregaSkillAleatoriaMago() {
	if (jogoPausado || fugaEmAndamento) return;
	if (lvlComp3 <= 0) return;

	// skill de Dano (barra própria: qtdCarregaHabilidade/abateshabilidadeDano)
	const candidatas = [];
	if (qtdCarregaHabilidade < abateshabilidadeDano) candidatas.push("dano");
	habilidadesCombate.forEach(skill => {
		if (maxAndar < skill.unlockFloor) return;
		const atual = ContagemSkill(skill.id);
		if (atual < skill.killsRequired) candidatas.push(skill.id);
	});
	if (candidatas.length === 0) return;

	const escolhida = candidatas[Math.floor(Math.random() * candidatas.length)];
	const teto = TetoSkill(escolhida);
	// PctCargaMago() do teto, arredondado para cima e no mínimo 1
	const quanto = Math.max(1, Math.ceil(teto * PctCargaMago()));
	AdicionaCargaSkill(escolhida, quanto);
}

// Leitura/escrita uniforme da carga das skills de combate
function ContagemSkill(id) {
	if (id === "dano") return qtdCarregaHabilidade;
	if (id === "electric") return abatesCorrenteEletrica;
	if (id === "gold") return abatesBonusGoldAtaque;
	if (id === "escape") return abatesPausaFuga;
	if (id === "frenzy") return abatesFrenesi;
	return 0;
}
function TetoSkill(id) {
	if (id === "dano") return abateshabilidadeDano;
	const skill = habilidadesCombate.find(s => s.id === id);
	return skill ? skill.killsRequired : 0;
}
function AdicionaCargaSkill(id, quanto) {
	const teto = TetoSkill(id);
	if (id === "dano") {
		qtdCarregaHabilidade = Math.min(teto, qtdCarregaHabilidade + quanto);
		AtualizaQTDHabildiade1();
		VerificaHabilidade();
	} else if (id === "electric") {
		abatesCorrenteEletrica = Math.min(teto, abatesCorrenteEletrica + quanto);
	} else if (id === "gold") {
		abatesBonusGoldAtaque = Math.min(teto, abatesBonusGoldAtaque + quanto);
	} else if (id === "escape") {
		abatesPausaFuga = Math.min(teto, abatesPausaFuga + quanto);
	} else if (id === "frenzy") {
		abatesFrenesi = Math.min(teto, abatesFrenesi + quanto);
	}
	AtualizaHabilidadesCombate();
}

// Handles gerenciados dos intervalos dos novos companheiros.
// Criados no load e na compra; limpos no PreCarregamento.
function SincronizaIntervalosNovosCompanheiros() {
	if (intervaloMagoRelogio !== null) clearInterval(intervaloMagoRelogio);
	intervaloMagoRelogio = null;
	if (intervaloAlquimista !== null) clearInterval(intervaloAlquimista);
	intervaloAlquimista = null;

	if (lvlComp3 > 0) intervaloMagoRelogio = setInterval(CarregaSkillAleatoriaMago, 5000);
	// intervalo do Alquimista encurta com o nível (20s −1s/nv, mín 10s) —
	// por isso é recriado aqui a cada compra/load em vez de fixo
	if (lvlComp4 > 0) intervaloAlquimista = setInterval(SorteiaBuffAlquimista, IntervaloAlquimistaMs());
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

// +1 no MultiplicadorCM a cada 50 níveis do jogador. marcosNivel50 guarda
// quantos marcos já foram reivindicados e NÃO zera no Resetar: resetar e
// chegar de novo no mesmo marco não paga de novo — só o próximo múltiplo
// de 50 (100, 150, ...) paga. Retorna quantos marcos foram reivindicados.
function ConfereMarcosNivel50() {
	const atual = Math.max(0, Math.floor(Number(marcosNivel50) || 0));
	const alvo = Math.floor(Math.max(1, Math.floor(Number(nivelJogador) || 1)) / 50);
	if (alvo <= atual) return 0;
	marcosNivel50 = alvo;
	return alvo - atual;
}

function LimitaDanoCritico() {
	const danoNormal = Number(danoJogador);
	const danoCritico = Number(danoCritJogador);
	if (!Number.isFinite(danoNormal) || !Number.isFinite(danoCritico)) return;
	danoCritJogador = Math.min(Math.max(danoNormal, danoCritico), danoNormal * multiplicadorMaximoDanoCritico);
}

// Sobe o teto do crítico — passo parametrizado: a loja de gold sobe +0,1 por
// compra (default) e a Loja do Conhecimento sobe +0,2 por nível.
// Arredonda pra 1 casa: somar 0,1 repetidamente acumula erro de flutuante.
function SobeTetoCritico(passo = 0.1) {
	multiplicadorMaximoDanoCritico = Math.round((multiplicadorMaximoDanoCritico + passo) * 10) / 10;
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

function CriarCompanheiros(){
	// guarda por id: chamada a cada compra e no load — sem ela as imagens empilhavam
	if(lvlComp1>0 && !document.getElementById("companheiro1")){
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
	if(lvlComp2>0 && !document.getElementById("companheiro2")){
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
	if(lvlComp3>0 && !document.getElementById("companheiro3")){
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
	// Companheiro 4 (Alquimista): buff aleatório a cada 20s
	if(lvlComp4>0 && !document.getElementById("companheiro4")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiro4.png";
		att2.value = "companheiro4";
		att3.value = "companheiro4";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	// Companheiro 5 (Assassino): morte instantânea passiva
	if(lvlComp5>0 && !document.getElementById("companheiro5")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiro5.png";
		att2.value = "companheiro5";
		att3.value = "companheiro5";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	// Companheiro 6 (Explorador do mapa): avança mais de um andar
	if(lvlComp6>0 && !document.getElementById("companheiro6")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiro6.png";
		att2.value = "companheiro6";
		att3.value = "companheiro6";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	// item 5 da loja de esmeraldas: o mago só entra na tela com o bônus comprado
	if(lvlXP>0 && !document.getElementById("companheiroXP")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiroXP.png";
		att2.value = "companheiroXP";
		att3.value = "companheiroXP";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
}



function CriaBau(){
	const base = Math.max(0, Math.min(1, Number(chanceBau) || 0));
	// Alquimista: buff de Baú ×3 por 10s
	const chance = Math.min(1, base * MultiplicadorBuffBau());
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

// notificar=false pula os avisos (usado pelo comerciante dos eventos aleatórios)
function CarregaHabilidadesDesbloqueadas(notificar = true) {
	qtdCarregaHabilidade = abateshabilidadeDano;
	VerificaHabilidade();

	habilidadesCombate.forEach(skill => {
		if (maxAndar < skill.unlockFloor) return;
		if (skill.id === "electric") abatesCorrenteEletrica = skill.killsRequired;
		if (skill.id === "gold") abatesBonusGoldAtaque = skill.killsRequired;
		if (skill.id === "escape") abatesPausaFuga = skill.killsRequired;
		if (skill.id === "frenzy") abatesFrenesi = skill.killsRequired;
	});
	AtualizaHabilidadesCombate();
	if (!notificar) return;
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
	tempoHabilidadeDano = DuracaoHabilidadeDano();
	qtdCarregaHabilidade = 0;
	UI.updateSkillProgress();
}

const habilidadesCombate = [
	{ id: "electric", unlockFloor: 15, killsRequired: 20 },
	{ id: "gold", unlockFloor: 25, killsRequired: 30 },
	{ id: "escape", unlockFloor: 35, killsRequired: 15 },
	// frenzy: "killsRequired" na verdade é a carga em TOQUES (Bater() com
	// ataqueJogador) — 40 cliques manuais carregam a janela do Toque Frenético
	{ id: "frenzy", unlockFloor: 45, killsRequired: 40 }
];

function PisoMaximoAlcancado() {
	return Math.max(andar, maxAndar);
}

function XPNecessarioProximoNivel(nivel = nivelJogador) {
	return 50 + 25 * Math.max(0, nivel - 1);
}

// Bônus por nível do jogador: a cada nível ganho, +10% de dano e
// −1 inimigo exigido para avançar de andar (quota mínima de 1).
// ×1,05 da conquista Velocista entra no mesmo ponto único (status, DPS e
// golpes saem sempre coerentes).
function MultiplicadorDanoNivel() {
	return (1 + Math.max(0, nivelJogador - 1) * 0.1) * MultiplicadorDanoConquistaComp();
}

function QuotaAndar() {
	const bonusNivel = Math.max(0, nivelJogador - 1);
	const bonusConquista = Math.floor(Math.max(0, totalNiveis | 0) / 100);
	// mínimo de 1: mesmo com bônus acumulados, nunca avança sem pelo menos um abate
	return Math.max(1, qtdInimigosAndar - bonusNivel - bonusConquista);
}

// Bônus do item de XP da loja de esmeraldas: cada nível soma o próprio
// número no XP por abate (nível 1 = +1, nível 2 = +2 a mais → +3,
// nível 3 = +6 … = 1+2+…+N)
function BonusXPLoja(nivel = lvlXP) {
	const n = Math.max(0, Math.floor(Number(nivel) || 0));
	return n * (n + 1) / 2;
}

function XPPorInimigo(piso = andar) {
	// bônus acumulado da loja de esmeraldas + base + piso
	return BonusXPLoja() + 1 + Math.floor((Math.max(1, piso) - 1) / 10);
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
	// +2% de XP por nível da Loja do Conhecimento e +10% da conquista
	// Milionário (arredonda pra baixo e respeita o teto de XP restante)
	const xpBase = Math.min(limiteXP, Math.floor(xpCalculado * BonusXPConhecimento() * MultiplicadorXPConquistaComp()));
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
		const marcosGanhos = ConfereMarcosNivel50();
		const conquistaAntes = Math.floor(Math.max(0, totalNiveis | 0) / 100);
		totalNiveis = Math.min(Number.MAX_SAFE_INTEGER, (totalNiveis | 0) + niveisGanhos);
		UI.showMilestone(
			niveisGanhos === 1 ? "Nível aumentado!" : `${niveisGanhos} níveis aumentados!`,
			`Você alcançou o nível ${nivelJogador} e recebeu ${niveisGanhos} ${niveisGanhos === 1 ? "ponto de habilidade" : "pontos de habilidade"}. Bônus: +${niveisGanhos * 10}% de dano e −${niveisGanhos} ${niveisGanhos === 1 ? "inimigo" : "inimigos"} para avançar.`
		);
		if (marcosGanhos > 0) {
			UI.showInfo(`Marco de 50 níveis!\n+${marcosGanhos} no multiplicador de CM no reset (×${FormataMultCM()}).`);
		}
		if (Math.floor(totalNiveis / 100) > conquistaAntes) {
			UI.showInfo("Conquista desbloqueada!\nA cada 100 níveis: -1 inimigo necessário para avançar!");
		}
		// Auto-gasto (andar 55+): o ponto que acabou de entrar já sai gasto
		// numa skill aleatória — sem o toggle nada muda (função é no-op)
		AutoGastaPontos();
		UI.updateObjective();
	}

	UI.showXPGain(xpGanho);
	UI.updateSkillProgress();
	// com o painel de skills aberto, só re-renderiza quando o level sobe
	// (muda pontos e botões); matar inimigo sem subir não pode resetar a
	// tela — e mesmo no re-render a rolagem é preservada (ver ui.js)
	if (niveisGanhos > 0 && document.getElementById("skillUpgradeModal")) UI.showSkillUpgradePanel();
	return xpGanho;
}

function NivelDaSkill(id) {
	const skill = SKILLS_UPGRADE.find(item => item.id === id);
	return skill ? Math.max(0, Math.floor(Number(window[skill.nivel]) || 0)) : 0;
}

// efeito atual da skill no nível informado, já com o bônus do ramo da
// árvore escolhido (nível + ramo vêm do estado real da run)
function DescricaoEfeitoSkill(id, nivel = NivelDaSkill(id)) {
	if (id === "damage") return `Duração: ${Math.round((30 + nivel * 5) * FatorRamo("damage", 2, 1.5))} s (+5 s por nível).`;
	if (id === "electric") {
		const fator = FatorRamo("electric", 1, 1.5);
		const alvos = 1 + perkEletrica + RamoAlvosCorrente();
		return `Dano encadeado: ${Math.round((25 + nivel * 5) * fator)}% em ${alvos} ${alvos === 1 ? "alvo" : "alvos"} · bônus sem alvo próximo: ${Math.round((10 + nivel * 2) * fator)}%.`;
	}
	if (id === "gold") return `Gold extra por ataque: ${Math.round((35 + nivel * 5) * FatorRamo("gold", 1, 1.5))}% · carga: ${DuracaoSkillGold()} ataques.`;
	if (id === "frenzy") return `Multiplicador do toque: ×${(2 + nivel * 0.15).toFixed(2).replace(".", ",")} · janela: ${DuracaoJanelaFrenesi()} toques.`;
	return `Pausa da fuga: ${Math.round((10 + nivel * 2) * FatorRamo("escape", 2, 1.5))} s (+2 s por nível).`;
}

// Toque Frenético: multiplicador do toque durante a janela, lido no tempo do
// golpe. Base 2 + 0,15 por nível (×2,15 no nv1 … ×3,50 no nv10), ×1,5 por nó
// do ramo 1 (Calor) e +25% por nível do perk (máx 4) — tudo multiplicativo.
function MultiplicadorToqueFrenesi() {
	return (2 + NivelDaSkill("frenzy") * 0.15) * FatorRamo("frenzy", 1, 1.5) * (1 + 0.25 * perkFrenesi);
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
			|| (skill.id === "escape" && fugaEmAndamento)
			|| (skill.id === "frenzy" && ataquesFrenesi > 0);

		if (!unlocked) return;

		const kills = skill.id === "electric" ? abatesCorrenteEletrica
			: skill.id === "gold" ? abatesBonusGoldAtaque
				: skill.id === "frenzy" ? abatesFrenesi
					: abatesPausaFuga;
		const active = skill.id === "electric" ? ataquesCorrenteEletrica
			: skill.id === "gold" ? ataquesBonusGold
				: skill.id === "frenzy" ? ataquesFrenesi
					: segundosPausaFuga;
		const activeDuration = skill.id === "electric" ? 20
			: skill.id === "gold" ? DuracaoSkillGold()
				: skill.id === "frenzy" ? DuracaoJanelaFrenesi()
					: DuracaoPausaFuga();
		const meterPercent = active > 0
			? active / activeDuration * 100
			: kills / skill.killsRequired * 100;
		const meterValue = Math.max(0, Math.min(100, Math.round(meterPercent)));
		const meterTrack = meter.parentElement;
		meter.style.height = `${meterValue}%`;
		meterTrack.setAttribute("aria-valuenow", meterValue);
		meterTrack.setAttribute("aria-valuetext", active > 0
			? skill.id === "escape" ? `Ativa por ${active} segundos`
				: skill.id === "frenzy" ? `Ativa por ${active} toques` : `Ativa por ${active} ataques`
			: skill.id === "frenzy" ? `${kills} de ${skill.killsRequired} toques`
				: `${kills} de ${skill.killsRequired} abates`);

		// ícone só aparece quando a skill está carregada (pronta ou ativa);
		// enquanto carrega, o botão mostra apenas a barra de progresso
		button.classList.toggle("is-charging", active === 0 && kills < skill.killsRequired);

		if (active > 0) {
			progress.textContent = skill.id === "escape"
				? `Ativa: ${active}s`
				: skill.id === "frenzy" ? `Ativa: ${active} toques`
					: `Ativa: ${active} ataques`;
			button.classList.add("is-active");
		} else {
			progress.textContent = kills >= skill.killsRequired
				? "Pronta!"
				: skill.id === "frenzy" ? `${kills}/${skill.killsRequired} toques`
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

// Toque Frenético: só o toque manual do jogador carrega e consome a janela.
// Fora da janela o toque enche a carga (killsRequired = 40 toques); dentro
// dela o toque consome 1 da janela ativa (o multiplicador já foi lido antes).
function RegistraToqueFrenesi() {
	const skill = habilidadesCombate.find(item => item.id === "frenzy");
	if (!skill || maxAndar < skill.unlockFloor) return;
	if (ataquesFrenesi > 0) {
		ataquesFrenesi--;
	} else if (abatesFrenesi < skill.killsRequired) {
		abatesFrenesi++;
	}
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
		ataquesBonusGold = DuracaoSkillGold();
		ChamaSom("audio6");
		UI.showInfo(`Bônus de Gold ativo por ${ataquesBonusGold} ataques!`);
	} else if (id === "escape" && abatesPausaFuga >= skill.killsRequired && segundosPausaFuga === 0 && !fugaEmAndamento) {
		habilidadeAtivada = true;
		abatesPausaFuga = 0;
		segundosPausaFuga = DuracaoPausaFuga();
		ChamaSom("audio7");
		UI.showInfo(`Relógio de fuga pausado por ${segundosPausaFuga} segundos!`);
	} else if (id === "frenzy" && abatesFrenesi >= skill.killsRequired && ataquesFrenesi === 0) {
		habilidadeAtivada = true;
		abatesFrenesi = 0;
		ataquesFrenesi = DuracaoJanelaFrenesi();
		ChamaSom("audio5");
		UI.showInfo(`Toque Frenético ativo por ${ataquesFrenesi} toques!`);
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
		// Alquimista: buff de Velocidade ×2 — golpe extra no mesmo tick
		if (MultiplicadorBuffVelocidade() > 1) {
			DanoAutomatico(false,true);
		}
		document.getElementById("QTDTempoHab1").innerHTML=tempoHabilidadeDano--;
		document.getElementById("BaraQTDHab1").style.color="#f00";
		if(tempoHabilidadeDano==0){
			verificaHabilidadeDano=false;
			tempoHabilidadeDano = DuracaoHabilidadeDano();
			document.getElementById("QTDTempoHab1").innerHTML=qtdCarregaHabilidade;
		}
	} 	
}

//funçoes de parceiros
function DanoCompanheiros(){
	if (jogoPausado) return;
	if(danoComp>0){
		DanoAutomatico(false,false);
		// Alquimista: buff de Velocidade ×2 — golpe extra no mesmo tick
		if (MultiplicadorBuffVelocidade() > 1) {
			DanoAutomatico(false,false);
		}
	}
}

// Velocidade do companheiro: o tick de ataque roda a cada 1000ms ÷ o
// multiplicador (1,0 = 1 hit/s; 2,0 = 2 hits/s no teto ★III). O handle é
// gerenciado — recriado na compra, no load e no reset — e o PreCarregamento
// limpa ele junto com os outros intervalos antes de recriar.
var intervaloDanoComp = null;
function IntervaloAtaqueComp() {
	const vel = N(velAtaqueComp);
	return 1000 / (vel > 0 ? vel : 1);
}
function SincronizaIntervaloDanoComp() {
	if (intervaloDanoComp !== null) clearInterval(intervaloDanoComp);
	intervaloDanoComp = setInterval(DanoCompanheiros, IntervaloAtaqueComp());
}

function GoldCompanheiros(){
	if (jogoPausado) return;
	// fórmula nova depende do andar e dos bônus: recompõe a cada tick
	// (o MultiplicadorGoldFormigas já está dentro de GoldCompanheiroPorSegundo)
	goldCompanheiro = GoldCompanheiroPorSegundo();
	const goldRecebido = goldCompanheiro;
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
	// Fissura temporal: congela o cronômetro junto com o ganho de segundos
	if (typeof eventoAtivo !== "undefined" && eventoAtivo === "fissura") return;
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
		precoBau = precoBau*0.995;
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

// ===== Conquistas comportamentais (Tier 4 #1) =====
// Recompensam estilo de jogo (não totais): desbloqueio único e permanente —
// os flags vivem no save e não zeram no Resetar (só no ZerarTodosSaves);
// runInicioMs/comprasRun são os trackers desta run (zeram no Resetar).
const CONQUISTAS_COMP = [
	{ id: "velocista", nome: "Velocista", desc: "Reset com a run abaixo de 10 minutos no andar 30×nível", recompensa: "+5% de dano permanente por nível", max: 10, passo: 30 },
	{ id: "poupado", nome: "Poupado", desc: "Chegue ao andar 25×nível sem comprar nada na loja de gold", recompensa: "+5% de gold permanente por nível", max: 10, passo: 25 },
	{ id: "missionario", nome: "Missionário", desc: "Conclua 20/50/100 missões", recompensa: "+25% no gold de toda missão por nível", max: 3, marcos: [20, 50, 100] },
	{ id: "destemido", nome: "Destemido", desc: "Vença 1/3/10 desafios da missão 5", recompensa: "+5 s no tempo de fuga por nível", max: 3, marcos: [1, 3, 10] },
	{ id: "milionario", nome: "Milionário", desc: "Acumule 1M/10M/100M de gold numa única run", recompensa: "+10% de XP permanente por nível", max: 3, marcos: [1e6, 1e7, 1e8] },
];

function NivelConquistaComp(indice) {
	const v = conquistasComp[indice];
	return Number.isInteger(v) && v > 0 ? v : 0;
}

function TemConquistaComp(indice) {
	return NivelConquistaComp(indice) > 0;
}

// Recompensas — cada uma aplicada num único ponto de fórmula, escalando
// linear por nível (save 0/1 antigo = nível 1 = efeito igual ao de antes):
function MultiplicadorDanoConquistaComp() { return 1 + 0.05 * NivelConquistaComp(0); } //Velocista → MultiplicadorDanoNivel
function MultiplicadorGoldConquistaComp() { return 1 + 0.05 * NivelConquistaComp(1); } //Poupado → AddGold
function MultiplicadorMissaoConquistaComp() { return 1 + 0.25 * NivelConquistaComp(2); } //Missionário → MissaoRecompensaGold
function BonusFugaConquistaComp() { return 5 * NivelConquistaComp(3); } //Destemido → TempoFugaMax
function MultiplicadorXPConquistaComp() { return 1 + 0.10 * NivelConquistaComp(4); } //Milionário → GanhaXP

// Sobe a conquista até o nível alvo (um milestone por nível novo; idempotente
// — quem já tem o save 0/1 antigo mantém o que tinha e sobe pelos marcos)
function SobeNivelConquistaComp(indice, nivelAlvo) {
	const c = CONQUISTAS_COMP[indice];
	const atual = NivelConquistaComp(indice);
	const alvo = Math.min(Math.max(0, Math.floor(nivelAlvo)), c.max);
	if (alvo <= atual) return false;
	conquistasComp[indice] = alvo;
	if (atual === 0) {
		UI.showInfo("Conquista desbloqueada!\n" + c.nome + ": " + c.recompensa);
	}
	for (let n = atual + 1; n <= alvo; n++) {
		UI.showMilestone("Conquista: " + c.nome + " — nível " + n, c.recompensa);
	}
	return true;
}

// Registra a conclusão de uma missão e devolve a recompensa com o bônus do
// Missionário — o desbloqueio do marco acontece ANTES do cálculo, então a
// própria missão do marco já paga o bônus do nível novo (20/50/100)
function MissaoRecompensaGold(valor) {
	missoesCompletas++;
	if (missoesCompletas >= 20)
		SobeNivelConquistaComp(2, missoesCompletas >= 100 ? 3 : missoesCompletas >= 50 ? 2 : 1);
	return valor * MultiplicadorMissaoConquistaComp();
}

// Checagens periódicas (roda junto com Conquistas(), a cada golpe e subida de andar)
function ConquistasComportamentais() {
	if (GE(totalGold, melhorGoldRun)) melhorGoldRun = new GoldNumber(totalGold);
	// Poupado: andar 25×nível sem nenhuma compra de gold na run
	if (comprasRun === 0 && andar >= 25) SobeNivelConquistaComp(1, Math.floor(andar / 25));
	// Milionário: 1M/10M/100M de gold numa run — a melhor run serve de base,
	// então marcos já vencidos no passado contam no primeiro golpe pós-load
	if (GE(melhorGoldRun, 1e6))
		SobeNivelConquistaComp(4, GE(melhorGoldRun, 1e8) ? 3 : GE(melhorGoldRun, 1e7) ? 2 : 1);
}

// Texto de progresso da tela de Conquistas para as conquistas ainda não no máximo
function ProgressoConquistaComp(indice) {
	const c = CONQUISTAS_COMP[indice];
	const nivel = NivelConquistaComp(indice);
	if (nivel >= c.max) return "nível máximo";
	if (indice === 0) {
		const minutos = Math.max(0, (Date.now() - runInicioMs) / 60000);
		return "próximo nível: reset abaixo de 10 min no andar " + (c.passo * (nivel + 1))
			+ " · run atual em " + minutos.toFixed(1) + " min"
			+ (minutos >= 10 ? " (nesta run já passou do tempo)" : "");
	}
	if (indice === 1) {
		return "próximo nível: andar " + (c.passo * (nivel + 1)) + " sem comprar · nesta run: andar "
			+ andar + " · " + comprasRun + " compra(s)" + (comprasRun > 0 ? " (quebra nesta run)" : "");
	}
	if (indice === 2) return missoesCompletas + " de " + c.marcos[nivel] + " missões concluídas";
	if (indice === 3) return desafiosVencidos + " de " + c.marcos[nivel] + " desafios vencidos";
	if (indice === 4) return "melhor run: " + FormatGold(melhorGoldRun) + " de " + FormatGold(c.marcos[nivel]);
	return "";
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
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoColeta / 2));
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
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoGolpe));
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
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoCacaMugs));
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
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoTempo / 4));
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
		const goldRecebido = AddGold(MissaoRecompensaGold(BonusGoldAvanco() * 5));
		// conquista Destemido: cada desafio vencido conta (marcos 1/3/10)
		desafiosVencidos++;
		SobeNivelConquistaComp(3, desafiosVencidos >= 10 ? 3 : desafiosVencidos >= 3 ? 2 : 1);
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
