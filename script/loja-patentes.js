// ===================== PATENTES DA LOJA =================================
// Tabela ITENS_PATENTE e regras de ingresso/segmento por patente.
// Funcoes globais movidas de loja.js sem alterar as chamadas.

// ============================================================
// PATENTES DA LOJA DE GOLD (patente 0 = ★I, o teto de hoje)
// ============================================================
// Ao bater no nível máximo o item oferece a próxima patente (★): o ingresso
// custa 30× o preço do próximo nível e destrava mais níveis, com o teto do
// efeito subindo. Saves antigos nascem na patente 0. Os tetos são por item:
// - `tetos`/`passos` — teto do efeito e passo por patente (itens de passo
//   fixo); itens de passo dinâmico (crítico e avanço) não declaram passo e
//   continuam a própria curva, só o teto sobe;
// - `niveis` — teto em níveis quando o gate do item é por nível;
// - `niveisInfinito` — teto de níveis que cresce pra sempre (Qtd Avanço);
// - `taxas` — taxa do passo dinâmico por patente (Dano e Dano Crítico:
//   1,025 na ★I e +0,005 por ★, lida com TaxaPassoLoja).
// Os gates por efeito têm tolerância de 1e-9: 0,01 + 9×0,01 fecha em
// 0,09999999999999999 em float e sem ela o teto nunca "bate" exato.
var ITENS_PATENTE = {
	bau: {
		nome: "Chance Bau", patenteVar: "patenteBau", precoVar: "precoBau",
		tetos: [0.75, 0.95], passos: [0.05, 0.04],
		noTeto: () => N(chanceBau) >= TetoLoja("bau") - 1e-9
	},
	espaco: {
		nome: "Espaço", patenteVar: "patenteBEspaco", precoVar: "precoBEspaco",
		// hoje fecha no nível 15; ★II abre 6 níveis a mais (até 10s)
		niveis: [15, 21],
		noTeto: () => N(lvlBEspaco) >= NiveisLoja("espaco")
	},
	qtdavan: {
		nome: "Qtd Avanço", patenteVar: "patenteQTDAvan", precoVar: "precoQTDAvanco",
		// infinito: cada patente dá +5 níveis (hoje fecha no 21)
		niveisInfinito: p => 21 + 5 * p,
		noTeto: () => N(lvlQTDAvanco) >= NiveisLoja("qtdavan")
	},
	ccrit: {
		nome: "Chance Crítica", patenteVar: "patenteCCrit", precoVar: "precoCCrit",
		tetos: [0.70, 0.80, 0.85, 0.90, 0.95],
		noTeto: () => N(chanceCrit) >= TetoLoja("ccrit") - 1e-9
	},
	subvida: {
		nome: "Vida do Inimigo", patenteVar: "patenteSubVida", precoVar: "precoVidaInimigo",
		tetos: [0.50, 0.60, 0.67, 0.72, 0.76, 0.80],
		passos: [0.01, 0.002, 0.001, 0.0005, 0.0004, 0.0004],
		// gate por nível (o de hoje é 50); o resto da coluna é soma de segmentos
		niveis: [50, 100, 170, 270, 370, 470],
		noTeto: () => N(lvlSubVida) >= NiveisLoja("subvida")
	},
	avan: {
		nome: "Avanço Rápido", patenteVar: "patenteAvan", precoVar: "precoAvan",
		tetos: [0.50, 0.55, 0.60, 0.65, 0.70],
		noTeto: () => N(avanco) >= TetoLoja("avan") - 1e-9
	},
	esmbau: {
		nome: "Esmeralda no Baú", patenteVar: "patenteEsmBau", precoVar: "precoEsmBau",
		tetos: [0.10, 0.15, 0.175, 0.19, 0.20],
		passos: [0.01, 0.005, 0.0025, 0.0015, 0.001],
		noTeto: () => N(chanceEsmeraldaBau) >= TetoLoja("esmbau") - 1e-9
	},
	velcomp: {
		nome: "Velocidade do Companheiro", patenteVar: "patenteVelComp", precoVar: "precoVelComp",
		tetos: [1.6, 1.8, 2.0], passos: [0.2, 0.2, 0.2],
		noTeto: () => N(velAtaqueComp) >= TetoLoja("velcomp") - 1e-9
	},
	dano: {
		nome: "Dano", patenteVar: "patenteDano", precoVar: "precoDano",
		// gate por nível (★I fecha no 50, mesma coluna da Vida do Inimigo);
		// a ★ também acelera a taxa do passo dinâmico: 1,025 → +0,005 por ★
		niveis: [50, 100, 170, 270, 370, 470],
		taxas: [1.025, 1.03, 1.035, 1.04, 1.045, 1.05],
		noTeto: () => N(lvlDano) >= NiveisLoja("dano")
	},
	dcrit: {
		nome: "Dano Crítico", patenteVar: "patenteDCrit", precoVar: "precoDCrit",
		niveis: [50, 100, 170, 270, 370, 470],
		taxas: [1.025, 1.03, 1.035, 1.04, 1.045, 1.05],
		noTeto: () => N(lvlDCrit) >= NiveisLoja("dcrit")
	}
};

function ItemPatente(id) {
	return ITENS_PATENTE[id];
}

function PatenteAtual(id) {
	return Math.max(0, Math.floor(N(window[ItemPatente(id).patenteVar])));
}

// Índice da última patente dentro do qual o item pode crescer
function PatenteMaxima(id) {
	const cfg = ItemPatente(id);
	if (cfg.niveisInfinito) return Number.POSITIVE_INFINITY;
	return (cfg.tetos || cfg.niveis).length - 1;
}

function TemProximaPatente(id) {
	return PatenteAtual(id) < PatenteMaxima(id);
}

// Teto do efeito para a patente atual (itens gate por efeito)
function TetoLoja(id) {
	const cfg = ItemPatente(id);
	if (!cfg.tetos) return Number.POSITIVE_INFINITY;
	return cfg.tetos[Math.min(PatenteAtual(id), cfg.tetos.length - 1)];
}

// Teto em níveis (itens gate por nível)
function NiveisLoja(id) {
	const cfg = ItemPatente(id);
	if (cfg.niveisInfinito) return cfg.niveisInfinito(PatenteAtual(id));
	return cfg.niveis[Math.min(PatenteAtual(id), cfg.niveis.length - 1)];
}

// Passo do efeito na patente atual (só itens de passo fixo)
function PassoLoja(id) {
	const cfg = ItemPatente(id);
	if (!cfg.passos) return 0;
	return cfg.passos[Math.min(PatenteAtual(id), cfg.passos.length - 1)];
}

// Taxa de crescimento do passo dinâmico na patente atual (Dano e Dano
// Crítico: ×1,025 na ★I e +0,005 por ★)
function TaxaPassoLoja(id) {
	const cfg = ItemPatente(id);
	if (!cfg.taxas) return 1.025;
	return cfg.taxas[Math.min(PatenteAtual(id), cfg.taxas.length - 1)];
}

// Ingresso da próxima patente: 30× o preço que o próximo nível teria
function PrecoPatenteLoja(id) {
	return N(window[ItemPatente(id).precoVar]) * 30;
}

// Formata um teto de efeito (todos são frações de chance/redutores em %)
function FormataTetoPct(valor) {
	return Math.round(valor * 100) + "%";
}

function Romano(n) {
	const tabela = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X"];
	return tabela[n] || String(n);
}

// Formata uma taxa de crescimento (1.025 → "×1,025")
function FormataTaxa(taxa) {
	return "×" + String(taxa).replace(".", ",");
}

// Ganho da próxima patente (preview): "75% → 95%", "+6 níveis destravados" ou
// o mesmo + a nova taxa do passo (Dano/Dano Crítico); vazio na patente máxima.
function GanhoProximaPatenteTexto(id) {
	const cfg = ItemPatente(id);
	if (!TemProximaPatente(id)) return "";
	const atual = PatenteAtual(id);
	let texto;
	if (cfg.tetos) {
		texto = FormataTetoPct(cfg.tetos[atual]) + " → " + FormataTetoPct(cfg.tetos[atual + 1]);
	} else if (cfg.niveisInfinito) {
		texto = "+" + (cfg.niveisInfinito(atual + 1) - cfg.niveisInfinito(atual)) + " níveis destravados";
	} else {
		texto = "+" + (cfg.niveis[atual + 1] - cfg.niveis[atual]) + " níveis destravados";
	}
	// Dano e Dano Crítico: a ★ também acelera a curva do passo dinâmico
	if (cfg.taxas) {
		texto += " · passo " + FormataTaxa(cfg.taxas[atual]) + " → " + FormataTaxa(cfg.taxas[atual + 1]);
	}
	return texto;
}

// Compra o ingresso da próxima patente de um item no teto. Sempre retorna
// tratado: patente comprada, "sem gold" ou "patente máxima".
function CompraPatenteLoja(id) {
	const cfg = ItemPatente(id);
	if (!TemProximaPatente(id)) {
		MostraInfo("Item no level maximo!");
		return true;
	}
	const preco = PrecoPatenteLoja(id);
	if (!GE(gold, preco)) {
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
		return true;
	}

	// captura o ganho ANTES do incremento: é o que acabou de ser destravado
	const ganho = GanhoProximaPatenteTexto(id);

	PagaLoja(preco);
	window[cfg.patenteVar] = PatenteAtual(id) + 1;

	ChamaSom('audio6');
	document.getElementById("contGold").innerHTML = FormatGold(gold);
	AtualizaLojaGold();
	MostraStatus();
	UI.showMilestone("★ Patente " + Romano(PatenteAtual(id) + 1) + " — " + cfg.nome, ganho);
	return true;
}
