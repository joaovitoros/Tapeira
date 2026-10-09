// =========================
// AUTOMAÇÃO (Tier 3 #2 — princípio 9 "automação é uma recompensa")
// =========================
// Auto-coleta de baús desbloqueia no andar 40 e auto-compra da loja de gold
// no 50, sempre pelo andar máximo já atingido (permanente, como as skills).
// O desbloqueio não gasta campo no save — só o estado ligado/desligado.

const ANDAR_AUTO_COLETA = 40;
const ANDAR_AUTO_COMPRA = 50;
// Auto-gasto de pontos de habilidade e sobra de pontos vira CM — marcos do
// painel de skills, permanentes pelo andar máximo como os dois acima
const ANDAR_AUTO_GASTO = 55;
const ANDAR_SOBRA_CM = 65;

// 1 = ligada (padrão quando desbloqueia), 0 = desligada — persistidas no save
var autoColeta = 1;
var autoCompra = 1;
// Auto-gasto nasce DESLIGADO (opt-in): o gasto é aleatório — quem quiser
// escolher as skills na mão deixa desligado. Persistido, não zera no reset
var autoGasto = 0;

function AutoColetaDesbloqueada() {
	return maxAndar >= ANDAR_AUTO_COLETA;
}

function AutoCompraDesbloqueada() {
	return maxAndar >= ANDAR_AUTO_COMPRA;
}

function AlternaAutoColeta(ligado) {
	autoColeta = ligado ? 1 : 0;
	SyncTogglesAutomacao();
	AutoSaveLocal();
	MostraInfo(ligado ? "Auto-coleta ligada." : "Auto-coleta desligada.");
}

function AlternaAutoCompra(ligado) {
	autoCompra = ligado ? 1 : 0;
	SyncTogglesAutomacao();
	AutoSaveLocal();
	MostraInfo(ligado ? "Auto-compra ligada." : "Auto-compra desligada.");
}

function AutoGastoDesbloqueado() {
	return maxAndar >= ANDAR_AUTO_GASTO;
}

function AlternaAutoGasto(ligado) {
	autoGasto = ligado ? 1 : 0;
	SyncTogglesAutomacao();
	// ligar já gasta o que está parado na mão — cada ponto novo entra gasto
	if (ligado) AutoGastaPontos();
	AutoSaveLocal();
	MostraInfo(ligado
		? "Auto-gasto ligado — cada ponto será gasto na hora numa skill aleatória."
		: "Auto-gasto desligado.");
}

// Gasta todos os pontos de habilidade na mão em skills aleatórias
// desbloqueadas e não-máximo. Só níveis de skill (SKILLS_UPGRADE) — perks e
// ramos da árvore ficam de fora e continuam manuais. Para sozinho quando
// tudo estiver no máx (aí a sobra só acumula, e a partir do andar 65 vira
// +1% de CM no reset).
function AutoGastaPontos() {
	if (autoGasto !== 1 || !AutoGastoDesbloqueado()) return 0;
	let gastos = 0;
	while (pontosHabilidade > 0) {
		const elegiveis = SKILLS_UPGRADE.filter(skill =>
			PisoMaximoAlcancado() >= skill.pisoDesbloqueio
			&& NivelDaSkill(skill.id) < skill.maximo);
		if (!elegiveis.length) break;
		const alvo = elegiveis[Math.floor(Math.random() * elegiveis.length)];
		if (!EvoluiSkill(alvo.id)) break;
		gastos++;
	}
	return gastos;
}

// Estado dos dois toggles: marcado pelo save e travado enquanto o andar
// máximo não chega no piso de desbloqueio. Roda a cada tick — é só leitura
// de dois checkboxes, e assim o load/zerada se refletem sozinhos na tela.
function SyncTogglesAutomacao() {
	const toggles = [
		{
			id: "autoColetaToggle", wrap: "autoColetaWrap",
			ligado: autoColeta === 1, desbloqueado: AutoColetaDesbloqueada(),
			piso: ANDAR_AUTO_COLETA,
			nome: "Auto-coleta de baús",
			dica: "Recolhe os baús do chão e abre o baú dourado sozinho"
		},
		{
			id: "autoCompraToggle", wrap: "autoCompraWrap",
			ligado: autoCompra === 1, desbloqueado: AutoCompraDesbloqueada(),
			piso: ANDAR_AUTO_COMPRA,
			nome: "Auto-compra da loja",
			dica: "A cada segundo compra o item mais barato da loja de gold"
		},
		{
			id: "autoGastoToggle", wrap: "autoGastoWrap",
			ligado: autoGasto === 1, desbloqueado: AutoGastoDesbloqueado(),
			piso: ANDAR_AUTO_GASTO,
			nome: "Auto-gasto de pontos",
			dica: "Cada ponto ganho vira nível na hora em skill aleatória — perks e ramos ficam manuais"
		}
	];

	for (const item of toggles) {
		const el = document.getElementById(item.id);
		if (!el) continue;
		el.checked = item.ligado;
		el.disabled = !item.desbloqueado;
		const wrap = document.getElementById(item.wrap);
		if (wrap) {
			wrap.title = item.desbloqueado
				? item.dica + " — pode desligar quando quiser"
				: item.nome + " desbloqueia no andar " + item.piso;
			wrap.classList.toggle("auto-toggle--locked", !item.desbloqueado);
		}
	}
}

// Itens da loja de gold que a auto-compra pode evoluir (esmeralda e Conhecimento
// Mug ficam de fora: são escolhas estratégicas). Os itens com teto entram pela
// tabela ITENS_PATENTE — no teto eles candidatam pelo preço do ingresso da
// próxima patente, e só ficam de fora na patente máxima. Quem efetiva a
// compra continua sendo a Compra*.
const ITENS_AUTO_COMPRA = [
	{ fn: CompraDano, preco: "precoDano", teto: "dano" },
	{ fn: CompraBau, preco: "precoBau", teto: "bau" },
	{ fn: CompraBEspaco, preco: "precoBEspaco", teto: "espaco" },
	{ fn: CompraGold, preco: "precoGold" },
	{ fn: CompraAvanco, preco: "precoAvan", teto: "avan" },
	{ fn: CompraDCrit, preco: "precoDCrit", teto: "dcrit" },
	{ fn: CompraSubVida, preco: "precoVidaInimigo", teto: "subvida" },
	{ fn: CompraCCrit, preco: "precoCCrit", teto: "ccrit" },
	{ fn: CompraQTDAvanco, preco: "precoQTDAvanco", teto: "qtdavan" },
	{ fn: CompraEsmBau, preco: "precoEsmBau", teto: "esmbau" },
	{ fn: CompraVelComp, preco: "precoVelComp", teto: "velcomp" }
];

// Uma compra por tick, sempre no item mais barato que couber no gold (o
// "compre o mais barato" clássico do idle). No desafio "sem gold" qualquer
// compra falharia a missão — mesma condição do PagaLoja — então fica parada;
// o aviso "não tem gold" da rodada é silenciado pelo wrap (mesma técnica do
// hold-to-buy), porque a candidatura já checou saldo e nível máximo.
function AutoCompraMaisBarato() {
	if (missaoAtual === 5 && missaoDesafioSub === 1) return;

	NormalizaPrecosLoja();

	let alvo = null;
	let alvoPreco = 0;
	for (const item of ITENS_AUTO_COMPRA) {
		let preco;
		if (item.teto && ITENS_PATENTE[item.teto].noTeto()) {
			if (!TemProximaPatente(item.teto)) continue; // patente máxima
			preco = PrecoPatenteLoja(item.teto); // ingresso da próxima ★
		} else {
			preco = N(window[item.preco]);
		}
		if (!(preco > 0) || !GE(gold, preco)) continue;
		if (!alvo || preco < alvoPreco) {
			alvo = item;
			alvoPreco = preco;
		}
	}
	if (!alvo) return;

	const infoOriginal = MostraInfo;
	MostraInfo = function () {};
	try {
		alvo.fn();
	} finally {
		MostraInfo = infoOriginal;
	}
}

// Tick de 1s registrado no PreCarregamento. Primeiro coleta (o prêmio entra
// no gold e pode liberar a compra do mesmo tick), depois tenta comprar.
// Tudo parado com o jogo pausado — inclusive atrás do modal de recompensas
// offline, que pausa o jogo.
function TickAutomacao() {
	SyncTogglesAutomacao();
	if (jogoPausado) return;

	if (autoColeta === 1 && AutoColetaDesbloqueada()) {
		if (bauDouradoPendente === 1) {
			ColetaBauDourado();
		} else if (document.getElementById("bau")) {
			ColetaBau();
		}
	}

	if (autoCompra === 1 && AutoCompraDesbloqueada()) {
		AutoCompraMaisBarato();
	}
}

// Chamado quando o andar máximo sobe (batalha.js): celebra o desbloqueio na
// hora — como o toggle já nasce ligado, a recompensa começa a agir no tick
// seguinte.
function VerificaDesbloqueioAutomacao(anterior, novo) {
	if (anterior < ANDAR_AUTO_COLETA && novo >= ANDAR_AUTO_COLETA) {
		UI.showMilestone(
			"Auto-coleta desbloqueada",
			"O rastreador do baú dourado agora recolhe os baús sozinho"
		);
	}
	if (anterior < ANDAR_AUTO_COMPRA && novo >= ANDAR_AUTO_COMPRA) {
		UI.showMilestone(
			"Auto-compra desbloqueada",
			"A loja agora compra sozinha o item mais barato a cada segundo"
		);
	}
	if (anterior < ANDAR_AUTO_GASTO && novo >= ANDAR_AUTO_GASTO) {
		UI.showMilestone(
			"Auto-gasto de pontos desbloqueado",
			"Ligue no painel de skills: cada ponto vira nível na hora em skill aleatória (perks e ramos ficam manuais)"
		);
	}
	if (anterior < ANDAR_SOBRA_CM && novo >= ANDAR_SOBRA_CM) {
		UI.showMilestone(
			"Sobra de pontos vira CM",
			"Cada ponto de habilidade na mão dá +1% de Conhecimento Mug no reset"
		);
	}
	SyncTogglesAutomacao();
}
