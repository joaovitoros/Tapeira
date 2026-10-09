// =========================
// HELPERS (NOVO - IMPORTANTE)
// =========================

function N(v){
	if(v == null) return 0;

	if(typeof v === "number") return v;

	if(typeof v === "string") return parseFloat(v) || 0;

	if(typeof v === "object"){
		if("value" in v) return Number(v.value) || 0;
		if("current" in v) return Number(v.current) || 0;
	}

	return 0;
}

function GE(a, b){
    return (a instanceof GoldNumber ? a : new GoldNumber(a))
        .compare(b instanceof GoldNumber ? b : new GoldNumber(b)) >= 0;
}

function NormalizaPrecosLoja() {
	// Item de XP da loja de esmeraldas: base 1 (metade da antiga base 2) com
	// dobra por nível — recalculado do nível, então saves antigos (base 2)
	// migram sozinhos para metade do preço na próxima abertura da loja
	const lvlXPN = Number(lvlXP);
	window.precoXP = Math.pow(2, Math.max(0, Math.floor(Number.isFinite(lvlXPN) ? lvlXPN : 0)));

	const nomesPrecos = [
		"precoDano", "precoBau", "precoGold", "precoBEspaco", "precoAvan",
		"precoDCrit", "precoVidaInimigo", "precoCCrit", "precoQTDAvanco",
		"precoComp1", "precoAvGold", "precoComp2", "precoComp3", "precoXP",
		"precoEsmCM", "precoEsmBau", "precoVelComp"
	];

	nomesPrecos.forEach(nome => {
		const valor = N(window[nome]);
		window[nome] = Number.isFinite(valor) ? Math.max(1, valor) : 1;
	});
}

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

// =========================
// LOJA

// =========================

function AtualizaLojaGold() {
	NormalizaPrecosLoja();
	document.getElementById("precoDano").innerHTML = FormatGold(precoDano);
	document.getElementById("lvlDano").innerHTML = lvlDano;

	document.getElementById("precoBau").innerHTML = FormatGold(precoBau);
	document.getElementById("lvlBau").innerHTML = lvlBau;

	document.getElementById("precoGold").innerHTML = FormatGold(precoGold);
	document.getElementById("lvlGold").innerHTML = lvlGold;

	document.getElementById("precoBEspaco").innerHTML = FormatGold(precoBEspaco);
	document.getElementById("lvlBEspaco").innerHTML = lvlBEspaco;

	document.getElementById("precoAvan").innerHTML = FormatGold(precoAvan);
	document.getElementById("lvlAvan").innerHTML = lvlAvan;

	document.getElementById("precoDCrit").innerHTML = FormatGold(precoDCrit);
	document.getElementById("lvlDCrit").innerHTML = lvlDCrit;

	document.getElementById("precoVidaInimigo").innerHTML = FormatGold(precoVidaInimigo);
	document.getElementById("lvlSubVida").innerHTML = lvlSubVida;

	document.getElementById("precoCCrit").innerHTML = FormatGold(precoCCrit);
	document.getElementById("lvlCCrit").innerHTML = lvlCCrit;

	document.getElementById("precoQTDAvan").innerHTML = FormatGold(precoQTDAvanco);
	document.getElementById("lvlQTDAvan").innerHTML = lvlQTDAvanco;

	document.getElementById("precoEsmBau").innerHTML = FormatGold(precoEsmBau);
	document.getElementById("lvlEsmBau").innerHTML = lvlEsmBau;

	document.getElementById("precoVelComp").innerHTML = FormatGold(precoVelComp);
	document.getElementById("lvlVelComp").innerHTML = lvlVelComp;

	AtualizaMaximosLoja();
}

// Itens com teto: no lugar do preço exibe "Lvl Max" e esconde o botão —
// exceto com patente pendente, quando mostra o preço do ingresso ★ e o botão
// continua à vista. Espelha os mesmos gates das Compra* — quem pode comprar
// continua sendo decidido por elas.
function AtualizaMaximosLoja() {
	// o id de preço nem sempre é o nome da variável (alias do preview)
	const itens = [
		{ id: "dano", preco: "precoDano" },
		{ id: "bau", preco: "precoBau" },
		{ id: "avan", preco: "precoAvan" },
		{ id: "dcrit", preco: "precoDCrit" },
		{ id: "subvida", preco: "precoVidaInimigo" },
		{ id: "ccrit", preco: "precoCCrit" },
		{ id: "espaco", preco: "precoBEspaco" },
		{ id: "qtdavan", preco: "precoQTDAvan" },
		{ id: "esmbau", preco: "precoEsmBau" },
		{ id: "velcomp", preco: "precoVelComp" }
	];

	for (const item of itens) {
		const elPreco = document.getElementById(item.preco);
		if (!elPreco) continue;
		const cfg = ITENS_PATENTE[item.id];
		// Os botões compartilham o id "btnLoja" (duplicado), então o
		// localizamos pela linha da tabela em que o preço está.
		const linha = elPreco.closest("tr");
		const btn = linha ? linha.querySelector("input[type='button']") : null;
		const noTeto = cfg.noTeto();
		const proxima = noTeto && TemProximaPatente(item.id);
		elPreco.innerHTML = !noTeto
			? FormatGold(window[cfg.precoVar])
			: proxima
				? '<span class="loja-patente">★ ' + FormatGold(PrecoPatenteLoja(item.id)) + '</span>'
				: '<span class="loja-lvl-max">Lvl Max</span>';
		if (btn) btn.style.display = (noTeto && !proxima) ? "none" : "";
	}
}

function AbreLoja(exibirTutorial){
	if(document.getElementById("Loja").style.visibility=="hidden"){
		document.getElementById("Loja").style.visibility="visible";
	}else{
		document.getElementById("Loja").style.visibility="hidden";
	}
	AtualizaLojaGold();

	if(document.getElementById("LojaEsm").style.visibility=="visible"){
		document.getElementById("LojaEsm").style.visibility="hidden";
	}
	if(document.getElementById("LojaCM").style.visibility=="visible"){
		document.getElementById("LojaCM").style.visibility="hidden";
	}
	if(document.getElementById("Loja").style.visibility=="visible"){
		UI.closeOtherPanels("shop");
	}
	UI.syncScreenButtons();

	// Tutorial do comp1: só quando o jogador abre a loja (não em chamadas internas)
	if(exibirTutorial && document.getElementById("Loja").style.visibility=="visible"){
		MostraTutorialComp1();
	}
}

function FechaLoja(){
	document.getElementById("Loja").style.visibility="hidden";
	document.getElementById("LojaEsm").style.visibility="hidden";
	document.getElementById("LojaCM").style.visibility="hidden";
	UI.syncScreenButtons();
}

// Mantém o × de fechar fixo no topo do painel mesmo quando a loja rola
document.addEventListener("DOMContentLoaded", () => {
	["Loja", "LojaEsm", "LojaCM"].forEach(id => {
		const painel = document.getElementById(id);
		if (!painel) return;
		painel.addEventListener("scroll", () => {
			const btn = painel.querySelector(".btnLojaFechar");
			if (btn) btn.style.top = (painel.scrollTop + 5) + "px";
		}, { passive: true });
	});
});

// =========================
// LOJA DO CONHECIMENTO MUG
// =========================
// Navegação em cadeia: Loja → Loja de Esmeralda → Loja do Conhecimento (setas do cabeçalho)
function LojaConhecimento() {
	const painel = document.getElementById("LojaCM");
	if (!painel) return;
	if (painel.style.visibility === "hidden") {
		document.getElementById("Loja").style.visibility = "hidden";
		document.getElementById("LojaEsm").style.visibility = "hidden";
		painel.style.visibility = "visible";
		AtualizaLojaCM();
		UI.closeOtherPanels("shop");
		UI.syncScreenButtons();
	}
}

// Volta da Loja do Conhecimento para a Loja de Esmeralda (que fica visível de novo)
function FechaLojaCM() {
	document.getElementById("LojaCM").style.visibility = "hidden";
	LojaEsmeralda();
	UI.syncScreenButtons();
}

function AtualizaLojaCM() {
	const saldo = document.getElementById("lojaCMsaldo");
	if (saldo) saldo.innerHTML = conhecimentoMug;

	const itens = [
		{ nivel: cmNivelDano, preco: "precoCMDano", lvl: "lvlCMDano" },
		{ nivel: cmNivelGold, preco: "precoCMGold", lvl: "lvlCMGold" },
		{ nivel: cmNivelXp, preco: "precoCMXp", lvl: "lvlCMXp" },
		{ nivel: cmNivelFuga, preco: "precoCMFuga", lvl: "lvlCMFuga" },
		{ nivel: cmNivelCrit, preco: "precoCMCrit", lvl: "lvlCMCrit" },
		{ nivel: cmNivelFormiga, preco: "precoCMFormiga", lvl: "lvlCMFormiga" },
		{ nivel: cmNivelDuasFormigas, preco: "precoCMDuas", lvl: "lvlCMDuas" },
		{ nivel: cmNivelComp, preco: "precoCMComp", lvl: "lvlCMComp" },
		{ nivel: cmNivelGoldComp2, preco: "precoCMGoldComp2", lvl: "lvlCMGoldComp2" }
	];

	for (const item of itens) {
		const elPreco = document.getElementById(item.preco);
		const elLvl = document.getElementById(item.lvl);
		if (elPreco) elPreco.innerHTML = PrecoLojaCM(item.nivel);
		if (elLvl) elLvl.innerHTML = item.nivel;
	}
}

function CompraCM(tipo) {
	const niveis = {
		dano: cmNivelDano, gold: cmNivelGold, xp: cmNivelXp,
		fuga: cmNivelFuga, crit: cmNivelCrit,
		formiga: cmNivelFormiga, duasformigas: cmNivelDuasFormigas,
		comp: cmNivelComp, goldcomp2: cmNivelGoldComp2
	};
	const nivel = niveis[tipo];
	if (nivel === undefined) return;

	// tetos: formiga 48 níveis (chance de drop máx 25%), duas formigas 100 níveis.
	// crítico não trava mais no teto ×4: cada nível dele também dá +0,2 no teto
	if (tipo === "formiga" && nivel >= 48) {
		MostraInfo("Item no nível máximo!");
		return;
	}
	if (tipo === "duasformigas" && nivel >= 100) {
		MostraInfo("Item no nível máximo!");
		return;
	}

	const preco = PrecoLojaCM(nivel);
	if (conhecimentoMug < preco) {
		MostraInfo("Você não tem Conhecimento Mug suficiente!");
		return;
	}

	conhecimentoMug = conhecimentoMug - preco;
	if (tipo === "dano") {
		cmNivelDano++;
		// efeito imediato; no reset o Resetar remonta tudo com ×1.02 por nível
		danoJogador = danoJogador * 1.02;
		LimitaDanoCritico();
		if (danoComp1 > 0) danoComp = danoJogador * danoComp1;
	} else if (tipo === "gold") {
		cmNivelGold++;
	} else if (tipo === "xp") {
		cmNivelXp++;
	} else if (tipo === "fuga") {
		cmNivelFuga++;
		tempoAvancoInimigos = tempoAvancoInimigos + 2;
	} else if (tipo === "crit") {
		cmNivelCrit++;
		// o teto sobe ANTES do ×1.02: sem isso o LimitaDanoCritico engoliria
		// o +2% comprado quando o crítico está encostado no teto
		SobeTetoCritico(0.2);
		danoCritJogador = danoCritJogador * 1.02;
		LimitaDanoCritico();
	} else if (tipo === "formiga") {
		cmNivelFormiga++;
	} else if (tipo === "duasformigas") {
		cmNivelDuasFormigas++;
	} else if (tipo === "comp") {
		cmNivelComp++;
		// o bônus fica embutido em danoComp1 (permanente: vem no save e não
		// zera no Resetar), então todo recálculo de danoComp já o inclui
		danoComp1 = danoComp1 * 1.02;
		if (lvlComp1 > 0) danoComp = danoJogador * danoComp1;
	} else if (tipo === "goldcomp2") {
		cmNivelGoldComp2++;
		// recompõe do zero (lvlComp2 × mulGold × bônus) — nunca conta em dobro
		if (N(lvlComp2) > 0) goldCompanheiro = GoldCompanheiroPorSegundo();
	}

	ChamaSom('audio6');
	AtualizaLojaCM();
	document.getElementById("contTempo").innerHTML = tempoAvancoInimigos;
	MostraStatus();
	AutoSaveLocal();
}

//Deduz o gold de uma compra da loja; no desafio "sem gold" a compra falha o desafio
function PagaLoja(preco) {
	if (missaoAtual === 5 && missaoDesafioSub === 1) FalhaDesafio("Gold gasto na loja");
	gold.add(-N(preco));
	comprasRun++; //conquista Poupado: qualquer compra desta run quebra o "sem comprar"
}

function CompraDano(){
	NormalizaPrecosLoja();

	if(!ITENS_PATENTE.dano.noTeto()){
		if(GE(gold, precoDano)){

			PagaLoja(precoDano);

			danoJogador = N(danoJogador) + N(mulDano);
			// Começo mais amigável: os 5 primeiros níveis sobem 40% em vez de 50%
			precoDano = N(precoDano) * (lvlDano < 5 ? 1.4 : 1.5);
			// Passo dinâmico: ×1,025 na ★I e +0,005 por patente (ITENS_PATENTE.dano.taxas)
			mulDano = N(mulDano) * TaxaPassoLoja("dano");
			danoCritJogador = N(danoCritJogador) + ((N(danoJogador)/2)*(2+N(sobeDCrit)));
			lvlDano++;

			if(lvlDano==10){
				danoJogador = N(danoJogador) * 1.2;
				danoCritJogador = N(danoCritJogador) + ((N(danoJogador)/2)*(2+N(sobeDCrit)));
			}
			LimitaDanoCritico();

			if(lvlComp1>0){
				danoComp = N(danoJogador) * N(danoComp1);
			}

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoDano").innerHTML = FormatGold(precoDano);
			document.getElementById("lvlDano").innerHTML = lvlDano;
			// no nível do teto a célula vira o ingresso ★ na hora
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("dano");
	}
}

function CompraBau(){
	NormalizaPrecosLoja();
	if(!ITENS_PATENTE.bau.noTeto()){
		if(GE(gold, N(precoBau))){

			PagaLoja(precoBau);

			chanceBau = Math.min(N(chanceBau) + PassoLoja("bau"), TetoLoja("bau"));
			precoBau = N(precoBau) * 2.2;
			lvlBau++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoBau").innerHTML = FormatGold(precoBau);
			document.getElementById("lvlBau").innerHTML = lvlBau;
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("bau");
	}
}

function CompraGold(){
	NormalizaPrecosLoja();
	if(GE(gold, N(precoGold))){

		PagaLoja(precoGold);

		mulGold = N(mulGold) * (1 + N(sobeGold));
		if(lvlGold<= 5){
			precoGold = N(precoGold) * 1.50;
		}else if(lvlGold > 5 && lvlGold <= 10){
			precoGold = N(precoGold) * 2;
		}else{
			precoGold = N(precoGold) * 3;
		} 

		// Curva progressiva: as 2 primeiras compras seguem ×1,3 (o valor de
		// sempre), depois sobe ×1,4 e trava em ×1,5. Antes o passo nascia já
		// no cap de 0,3 e o crescimento nunca acontecia.
		if (N(lvlGold) >= 2) {
			sobeGold = Math.min(N(sobeGold) + 0.1, 0.5);
		}
		lvlGold++;

		if(lvlComp2 > 0){
			goldCompanheiro = GoldCompanheiroPorSegundo();
		}

		ChamaSom('audio6');

		document.getElementById("contGold").innerHTML = FormatGold(gold);
		document.getElementById("precoGold").innerHTML = FormatGold(precoGold);
		document.getElementById("lvlGold").innerHTML = lvlGold;

		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraAvanco(){
	NormalizaPrecosLoja();

	if(!ITENS_PATENTE.avan.noTeto()){
		if(GE(gold, N(precoAvan))){

			PagaLoja(precoAvan);

			avanco = Math.min(N(avanco) + N(sobeAvanco), TetoLoja("avan"));
			precoAvan = N(precoAvan) * 2;
			sobeAvanco = N(sobeAvanco) * 1.005;
			lvlAvan++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoAvan").innerHTML = FormatGold(precoAvan);
			document.getElementById("lvlAvan").innerHTML = lvlAvan;
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("avan");
	}
}

function CompraDCrit(){
	NormalizaPrecosLoja();
	if(!ITENS_PATENTE.dcrit.noTeto()){
		if(GE(gold, N(precoDCrit))){

			PagaLoja(precoDCrit);

			SobeTetoCritico();
			// Passo dinâmico: ×1,025 na ★I e +0,005 por patente (ITENS_PATENTE.dcrit.taxas)
			sobeDCrit = N(sobeDCrit) * TaxaPassoLoja("dcrit");
			danoCritJogador = N(danoCritJogador) + ((N(danoJogador)/2) * (2 + N(sobeDCrit)));
			LimitaDanoCritico();
			precoDCrit = N(precoDCrit) * 1.5;
			lvlDCrit++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoDCrit").innerHTML = FormatGold(precoDCrit);
			document.getElementById("lvlDCrit").innerHTML = lvlDCrit;
			// no nível do teto a célula vira o ingresso ★ na hora
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("dcrit");
	}
}

function CompraSubVida(){
	NormalizaPrecosLoja();
	if(!ITENS_PATENTE.subvida.noTeto()){
		if(GE(gold, N(precoVidaInimigo))){

			PagaLoja(precoVidaInimigo);

			// Aplica apenas o desconto novo (1%), e não o total acumulado: usar o total
			// multiplicava o desconto em dobro a cada compra e a vida "voltava" no respawn,
			// quando CarregarStatus() recalcula a vida do andar do zero.
			const subAnterior = N(subVidaInimigo);
			subVidaInimigo = Math.min(subAnterior + PassoLoja("subvida"), TetoLoja("subvida"));
			const fatorDesconto = (1 - N(subVidaInimigo)) / (1 - subAnterior);

			vidaAndar = N(vidaAndar) * fatorDesconto;

			// Reduz também os inimigos vivos, senão a compra não tem efeito real até a próxima onda
			let inimigoAtualizado = 0;
			for (let i = 1; i <= 4; i++) {
				const chave = "vidaInimigo" + i;
				const vidaAtual = N(window[chave]);
				if (vidaAtual > 0) {
					window[chave] = Math.max(0, vidaAtual * fatorDesconto);
					if (!inimigoAtualizado) inimigoAtualizado = i;
				}
			}

			precoVidaInimigo = N(precoVidaInimigo) * 1.25;
			lvlSubVida++;

			ChamaSom('audio6');

			if (inimigoAtualizado) DesceVida(inimigoAtualizado);

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoVidaInimigo").innerHTML = FormatGold(precoVidaInimigo);
			document.getElementById("lvlSubVida").innerHTML = lvlSubVida;
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("subvida");
	}
}

function CompraCCrit(){
	NormalizaPrecosLoja();
	if(!ITENS_PATENTE.ccrit.noTeto()){
		if(GE(gold, N(precoCCrit))){

			PagaLoja(precoCCrit);

			// a partir de 30% cada compra vale metade do passo (o teto segue o da patente)
			const passo = N(sobeCCrit) * (N(chanceCrit) >= 0.3 ? 0.5 : 1);
			chanceCrit = Math.min(N(chanceCrit) + passo, TetoLoja("ccrit"));
			precoCCrit = N(precoCCrit) * 1.5;
			sobeCCrit = N(sobeCCrit) * 1.1;
			lvlCCrit++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoCCrit").innerHTML = FormatGold(precoCCrit);
			document.getElementById("lvlCCrit").innerHTML = lvlCCrit;
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("ccrit");
	}
}

function CompraBEspaco(){
	NormalizaPrecosLoja();
	if(ITENS_PATENTE.espaco.noTeto()){
		CompraPatenteLoja("espaco");
		return;
	}
	if(GE(gold, N(precoBEspaco))){

		PagaLoja(precoBEspaco);

		MaxValidaBater--;
		precoBEspaco = N(precoBEspaco) * 1.5;
		lvlBEspaco++;

		ChamaSom('audio6');

		document.getElementById("contGold").innerHTML = FormatGold(gold);
		document.getElementById("precoBEspaco").innerHTML = FormatGold(precoBEspaco);
		document.getElementById("lvlBEspaco").innerHTML = lvlBEspaco;
		AtualizaMaximosLoja();

		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraQTDAvanco(){
	NormalizaPrecosLoja();
	if(!ITENS_PATENTE.qtdavan.noTeto()){
		if(GE(gold, N(precoQTDAvanco))){

			PagaLoja(precoQTDAvanco);

			qtdAvanco++;
			precoQTDAvanco = N(precoQTDAvanco) * 2;
			lvlQTDAvanco++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoQTDAvan").innerHTML = FormatGold(precoQTDAvanco);
			document.getElementById("lvlQTDAvan").innerHTML = lvlQTDAvanco;
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("qtdavan");
	}
}

// Item novo: chance de esmeralda ao abrir cada baú (o teto sobe por patente)
function CompraEsmBau(){
	NormalizaPrecosLoja();
	if(!ITENS_PATENTE.esmbau.noTeto()){
		if(GE(gold, N(precoEsmBau))){

			PagaLoja(precoEsmBau);

			chanceEsmeraldaBau = Math.min(N(chanceEsmeraldaBau) + PassoLoja("esmbau"), TetoLoja("esmbau"));
			precoEsmBau = N(precoEsmBau) * 2;
			lvlEsmBau++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoEsmBau").innerHTML = FormatGold(precoEsmBau);
			document.getElementById("lvlEsmBau").innerHTML = lvlEsmBau;
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("esmbau");
	}
}

// Item novo: velocidade de ataque do companheiro (+20% por nível, cap por
// patente) — cada compra reacomoda o intervalo do tick do DanoCompanheiros
function CompraVelComp(){
	NormalizaPrecosLoja();
	if(!ITENS_PATENTE.velcomp.noTeto()){
		if(GE(gold, N(precoVelComp))){

			PagaLoja(precoVelComp);

			// arredonda no passo de 0,2 antes do clamp: sem isso a soma
			// acumulada fecha em 1,9999999999999998 no teto (ruído de float)
			velAtaqueComp = Math.min(Math.round((N(velAtaqueComp) + PassoLoja("velcomp")) * 10) / 10, TetoLoja("velcomp"));
			precoVelComp = N(precoVelComp) * 1.5;
			lvlVelComp++;
			SincronizaIntervaloDanoComp();

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoVelComp").innerHTML = FormatGold(precoVelComp);
			document.getElementById("lvlVelComp").innerHTML = lvlVelComp;
			AtualizaMaximosLoja();

			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		CompraPatenteLoja("velcomp");
	}
}

function LojaEsmeralda(){
	NormalizaPrecosLoja();
	if(document.getElementById("LojaEsm").style.visibility=="hidden"){
		document.getElementById("Loja").style.visibility="hidden";
		document.getElementById("LojaEsm").style.visibility="visible";

		document.getElementById("precoComp1").innerHTML=precoComp1;
		document.getElementById("lvlComp1").innerHTML=lvlComp1;

		document.getElementById("precoAvGold").innerHTML=precoAvGold;
		document.getElementById("lvlAvGold").innerHTML=lvlAvGold;

		document.getElementById("precoComp2").innerHTML=precoComp2;
		document.getElementById("lvlComp2").innerHTML=lvlComp2;

		document.getElementById("precoComp3").innerHTML=precoComp3;
		document.getElementById("lvlComp3").innerHTML=lvlComp3;

		document.getElementById("precoXP").innerHTML=precoXP;
		document.getElementById("lvlXP").innerHTML=lvlXP;

		document.getElementById("precoEsmCM").innerHTML=precoEsmCM;
		document.getElementById("lvlEsmCM").innerHTML=lvlEsmCM;

	}else{
		document.getElementById("LojaEsm").style.visibility="hidden";
		document.getElementById("Loja").style.visibility="visible";
	}
}

function CompraComp1(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoComp1)){
		esmeraldas = N(esmeraldas) - N(precoComp1);
		danoComp1 = N(danoComp1) + 0.1;
		danoComp = N(danoJogador) * N(danoComp1);
		precoComp1 = N(precoComp1) * 2;
		lvlComp1++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoComp1").innerHTML=precoComp1;
		document.getElementById("lvlComp1").innerHTML=lvlComp1;

		MostraStatus();
		CriarCompanheiros();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// Botão do tutorial: compra o comp1 e só fecha a janela se a compra deu certo
function CompraTutorialComp1(){
	const antes = N(lvlComp1);
	CompraComp1();

	if(N(lvlComp1) > antes){
		const modal = document.getElementById("gameModal");
		if(modal) modal.remove();
	}
}

function CompraAvGold(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoAvGold)){
		esmeraldas = N(esmeraldas) - N(precoAvGold);
		mulGoldAvanco = N(mulGoldAvanco) * 1.1;
		precoAvGold = N(precoAvGold) * 2;
		lvlAvGold++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=N(esmeraldas);
		document.getElementById("precoAvGold").innerHTML=N(precoAvGold);
		document.getElementById("lvlAvGold").innerHTML=lvlAvGold;

		MostraStatus();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

function CompraComp2(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoComp2)){
		esmeraldas = N(esmeraldas) - N(precoComp2);
		lvlComp2++;
		goldCompanheiro = GoldCompanheiroPorSegundo();
		precoComp2 = N(precoComp2) * 2;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoComp2").innerHTML=precoComp2;
		document.getElementById("lvlComp2").innerHTML=lvlComp2;

		MostraStatus();
		CriarCompanheiros();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

function CompraComp3(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoComp3)){
		esmeraldas = N(esmeraldas) - N(precoComp3);
		tempoEsperaCompanheiro = N(tempoEsperaCompanheiro) + N(tempoComp3);
		precoComp3 = N(precoComp3) * 2;
		lvlComp3++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoComp3").innerHTML=precoComp3;
		document.getElementById("lvlComp3").innerHTML=lvlComp3;

		MostraStatus();
		CriarCompanheiros();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

function CompraXP(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoXP)){
		esmeraldas = N(esmeraldas) - N(precoXP);
		precoXP = N(precoXP) * 2;
		lvlXP++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=N(esmeraldas);
		document.getElementById("precoXP").innerHTML=N(precoXP);
		document.getElementById("lvlXP").innerHTML=lvlXP;

		MostraStatus();
		CriarCompanheiros();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// Item de 1 nível: duplica a quantidade de Conhecimento Mug ganha no reset
function CompraEsmCM(){
	NormalizaPrecosLoja();
	if(N(lvlEsmCM) >= 1){
		MostraInfo("Item no nível máximo!");
		return;
	}
	if(N(esmeraldas) >= N(precoEsmCM)){
		esmeraldas = N(esmeraldas) - N(precoEsmCM);
		lvlEsmCM = 1;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=N(esmeraldas);
		document.getElementById("precoEsmCM").innerHTML=N(precoEsmCM);
		document.getElementById("lvlEsmCM").innerHTML=lvlEsmCM;

		MostraStatus();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// =========================
// PREVIEW DE COMPRA (hover/foco nos botões da loja)
// =========================

function FormataPct(x, casas) {
	return (N(x) * 100).toFixed(casas === undefined ? 2 : casas) + "%";
}

const PREVIEWS_LOJA = {
	CompraDano() {
		if (ITENS_PATENTE.dano.noTeto()) return "Dano — ★ " + (GanhoProximaPatenteTexto("dano") || "patente máxima");
		const prox = N(danoJogador) + N(mulDano);
		const extra = (N(lvlDano) === 9) ? " · nível 10 dá +20%!" : "";
		return "Dano: " + N(danoJogador).toFixed(2) + " → " + prox.toFixed(2)
			+ " (+" + N(mulDano).toFixed(2) + ")" + extra;
	},
	CompraBau() {
		if (ITENS_PATENTE.bau.noTeto()) return "Chance de baú — ★ " + (GanhoProximaPatenteTexto("bau") || "patente máxima");
		return "Chance de baú: " + FormataPct(chanceBau, 0) + " → "
			+ FormataPct(Math.min(TetoLoja("bau"), N(chanceBau) + PassoLoja("bau")), 0)
			+ " (máx " + FormataTetoPct(TetoLoja("bau")) + ")";
	},
	CompraBEspaco() {
		if (ITENS_PATENTE.espaco.noTeto()) return "Recarga do espaço — ★ " + (GanhoProximaPatenteTexto("espaco") || "patente máxima");
		return "Recarga do espaço: " + N(MaxValidaBater) + " → " + (N(MaxValidaBater) - 1) + " (quanto menor, mais rápido)";
	},
	CompraGold() {
		const prox = N(mulGold) * (1 + N(sobeGold));
		return "Multiplicador gold: " + N(mulGold).toFixed(2) + " → " + prox.toFixed(2);
	},
	CompraAvanco() {
		if (ITENS_PATENTE.avan.noTeto()) return "Avanço rápido — ★ " + (GanhoProximaPatenteTexto("avan") || "patente máxima");
		const prox = Math.min(TetoLoja("avan"), N(avanco) + N(sobeAvanco));
		return "Chance de avanço: " + FormataPct(avanco) + " → " + FormataPct(prox)
			+ " (máx " + FormataTetoPct(TetoLoja("avan")) + ")";
	},
	CompraDCrit() {
		if (ITENS_PATENTE.dcrit.noTeto()) return "Dano crítico — ★ " + (GanhoProximaPatenteTexto("dcrit") || "patente máxima");
		const proxMult = N(multiplicadorMaximoDanoCritico) + 0.1;
		const proxSobe = N(sobeDCrit) * TaxaPassoLoja("dcrit");
		let proxCrit = N(danoCritJogador) + (N(danoJogador) / 2) * (2 + proxSobe);
		proxCrit = Math.min(proxCrit, N(danoJogador) * proxMult);
		return "Dano crítico: " + N(danoCritJogador).toFixed(2) + " → " + proxCrit.toFixed(2)
			+ " (máx ×" + proxMult.toFixed(1) + ")";
	},
	CompraSubVida() {
		if (ITENS_PATENTE.subvida.noTeto()) return "Vida dos inimigos — ★ " + (GanhoProximaPatenteTexto("subvida") || "patente máxima");
		return "Redução de vida: " + FormataPct(subVidaInimigo, 0) + " → "
			+ FormataPct(Math.min(TetoLoja("subvida"), N(subVidaInimigo) + PassoLoja("subvida")), 0)
			+ " (máx " + FormataTetoPct(TetoLoja("subvida")) + ")";
	},
	CompraCCrit() {
		if (ITENS_PATENTE.ccrit.noTeto()) return "Chance crítica — ★ " + (GanhoProximaPatenteTexto("ccrit") || "patente máxima");
		const meio = N(chanceCrit) >= 0.3;
		const passo = N(sobeCCrit) * (meio ? 0.5 : 1);
		const prox = Math.min(TetoLoja("ccrit"), N(chanceCrit) + passo);
		return "Chance crítica: " + FormataPct(chanceCrit) + " → " + FormataPct(prox)
			+ " (máx " + FormataTetoPct(TetoLoja("ccrit")) + (meio ? " · ganho pela metade" : " · a partir de 30% cai pela metade") + ")";
	},
	CompraQTDAvanco() {
		if (ITENS_PATENTE.qtdavan.noTeto()) return "Quantidade de avanço — ★ " + (GanhoProximaPatenteTexto("qtdavan") || "patente máxima");
		return "Qtd de avanço: " + N(qtdAvanco) + " → " + (N(qtdAvanco) + 1) + " inimigos";
	},
	CompraEsmBau() {
		if (ITENS_PATENTE.esmbau.noTeto()) return "Esmeralda no baú — ★ " + (GanhoProximaPatenteTexto("esmbau") || "patente máxima");
		return "Chance de esmeralda: " + FormataPct(chanceEsmeraldaBau, 0) + " → "
			+ FormataPct(Math.min(TetoLoja("esmbau"), N(chanceEsmeraldaBau) + PassoLoja("esmbau")), 0)
			+ " (máx " + FormataTetoPct(TetoLoja("esmbau")) + ")";
	},
	CompraComp1() {
		const prox = N(danoComp1) + 0.1;
		return "Dano do companheiro: " + FormataPct(danoComp1, 0) + " → "
			+ FormataPct(prox, 0) + " do seu dano";
	},
	CompraAvGold() {
		const prox = N(mulGoldAvanco) * 1.1;
		return "Bônus de gold do avanço: " + N(mulGoldAvanco).toFixed(2) + " → " + prox.toFixed(2);
	},
	CompraComp2() {
		const prox = GoldCompanheiroPorSegundo(N(lvlComp2) + 1);
		return "Gold do companheiro: " + FormatGold(N(goldCompanheiro)) + " → " + FormatGold(prox) + "/seg";
	},
	CompraComp3() {
		return "Tempo bônus do companheiro: " + N(tempoEsperaCompanheiro) + "s → "
			+ (N(tempoEsperaCompanheiro) + N(tempoComp3)) + "s";
	},
	CompraXP() {
		const n = Math.max(0, N(lvlXP) | 0);
		return "Bônus de XP: +" + BonusXPLoja(n) + " → +" + BonusXPLoja(n + 1) + " por abate";
	},
	CompraEsmCM() {
		if (N(lvlEsmCM) >= 1) return "CM ganho: no nível máximo (×2 do item)";
		// o item dobra só a parte dele (2^nível); os marcos de 50 níveis e o
		// bônus de resets curtos multiplicam por fora e não dobram
		const atual = MultiplicadorCM();
		const prox = atual + Math.pow(2, Math.max(0, Math.floor(Number(lvlEsmCM) || 0))) * BonusCMResetCurto();
		return "CM ganho no reset: ×" + FormataMultCM(atual) + " → ×" + FormataMultCM(prox);
	},
	CompraVelComp() {
		if (ITENS_PATENTE.velcomp.noTeto()) {
			return "Velocidade do companheiro — ★ " + (GanhoProximaPatenteTexto("velcomp") || "patente máxima");
		}
		const prox = Math.min(TetoLoja("velcomp"), N(velAtaqueComp) + PassoLoja("velcomp"));
		return "Ataques do companheiro: " + N(velAtaqueComp).toFixed(1) + "/s → "
			+ prox.toFixed(1) + "/s (máx " + TetoLoja("velcomp").toFixed(1) + "/s)";
	}
};

function NomeFuncaoCompra(btn) {
	const attr = btn.getAttribute("onclick") || "";
	const m = attr.match(/^\s*([A-Za-z_$][\w$]*)\s*\(/);
	return m ? m[1] : null;
}

// ids no HTML que não batem com o nome da variável de preço
const ALIAS_PRECO = { precoQTDAvan: "precoQTDAvanco" };

// Localiza o item de patente pela variável de preço da sua linha
function ItemPorPrecoVar(varPreco) {
	for (const [id, cfg] of Object.entries(ITENS_PATENTE)) {
		if (cfg.precoVar === varPreco) return { id, cfg };
	}
	return null;
}

function MostraPreviewCompra(btn) {
	const nome = NomeFuncaoCompra(btn);
	const calc = PREVIEWS_LOJA[nome];
	const painel = btn.closest("#Loja, #LojaEsm");
	if (!calc || !painel) return;

	const div = painel.querySelector(".preview-compra");
	if (!div) return;

	div.textContent = calc();
	div.hidden = false;

	// cor: dá para pagar?
	let podePagar = true;
	const linha = btn.closest("tr");
	const celulaPreco = linha ? linha.querySelector("td:nth-child(2) > div") : null;
	const idPreco = celulaPreco ? (ALIAS_PRECO[celulaPreco.id] || celulaPreco.id) : "";
	if (/^preco/.test(idPreco) && window[idPreco] !== undefined) {
		// no teto com patente pendente a célula mostra o ingresso, não o nível
		const item = ItemPorPrecoVar(idPreco);
		const preco = (item && item.cfg.noTeto()) ? PrecoPatenteLoja(item.id) : window[idPreco];
		podePagar = (painel.id === "LojaEsm")
			? N(esmeraldas) >= N(preco)
			: GE(gold, preco);
	}
	div.classList.toggle("preview-compra--nao-pode", !podePagar);
}

document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("#Loja input.Loja, #LojaEsm input.Loja").forEach(btn => {
		const mostrar = () => MostraPreviewCompra(btn);
		btn.addEventListener("mouseenter", mostrar);
		btn.addEventListener("focus", mostrar);
		// após o clique inline (compra já aplicada), atualiza o preview
		btn.addEventListener("click", mostrar);
	});
});

// ============================================================
// HOLD PRA COMPRAR (loja de gold): segurar o "Evoluir" repete a compra
// ============================================================
// Late game: segurar o botão compra nível atrás de nível até o gold acabar
// (ou até o nível máximo). A primeira falha encerra o hold com UM aviso do
// próprio jogo — sem spam de toast. Clique normal e teclado seguem iguais:
// um clique, uma compra (o clique sintético pós-pointerdown é engolido).

var holdCompraTimer = null;
var holdCompraBotao = null;
var holdCompraInfoOriginal = null;
var holdCompraCliquePendente = null;

function HoldCompraPara() {
	if (holdCompraTimer) {
		clearInterval(holdCompraTimer);
		holdCompraTimer = null;
	}
	if (holdCompraInfoOriginal) {
		MostraInfo = holdCompraInfoOriginal;
		holdCompraInfoOriginal = null;
	}
	holdCompraBotao = null;
}

function HoldCompraTenta() {
	const btn = holdCompraBotao;
	if (!btn || !btn.isConnected) {
		HoldCompraPara();
		return;
	}
	// lê o onclick inline (CompraDano(), CompraGold(), ...) e chama de volta
	const chamada = (btn.getAttribute("onclick") || "").trim();
	const m = /^([A-Za-z_$][\w$]*)\s*\(\s*\)$/.exec(chamada);
	if (!m || typeof window[m[1]] !== "function") {
		HoldCompraPara();
		return;
	}
	// sem gold ou nível máximo: o jogo chama MostraInfo, que neste momento é
	// o interceptor — ele restaura tudo e avisa uma única vez
	window[m[1]]();
	if (holdCompraBotao) MostraPreviewCompra(btn); // preview do Tier1 #5 em dia
}

function HoldCompraInicia(btn) {
	HoldCompraPara();
	holdCompraBotao = btn;

	// intercepta o aviso da compra: 1ª falha = fim do hold, um aviso só
	const avisoOriginal = MostraInfo;
	holdCompraInfoOriginal = avisoOriginal;
	MostraInfo = function (msg) {
		HoldCompraPara();
		avisoOriginal(msg);
	};

	HoldCompraTenta(); // resposta imediata no pointerdown
	if (holdCompraBotao) holdCompraTimer = setInterval(HoldCompraTenta, 100);
}

// Delegado no document: não depende de quando o DOM da loja é montado
document.addEventListener("pointerdown", (e) => {
	if (e.pointerType === "mouse" && e.button !== 0) return;
	const btn = e.target && e.target.closest ? e.target.closest("#Loja input.Loja[onclick]") : null;
	if (!btn) return;
	if (holdCompraBotao === btn && holdCompraTimer) return; // já segurando
	HoldCompraInicia(btn);
	btn.focus({ preventScroll: true });
	e.preventDefault(); // segurar não vira clique/arraste do navegador
});

// o clique que o navegador ainda emitir depois do hold não compra de novo
document.addEventListener("click", (e) => {
	if (!holdCompraCliquePendente || e.target !== holdCompraCliquePendente) return;
	holdCompraCliquePendente = null;
	e.preventDefault();
	e.stopPropagation();
}, true);

window.addEventListener("pointerup", () => {
	const btn = holdCompraBotao;
	if (btn) {
		holdCompraCliquePendente = btn;
		setTimeout(() => {
			if (holdCompraCliquePendente === btn) holdCompraCliquePendente = null;
		}, 400);
	}
	HoldCompraPara();
});
window.addEventListener("pointercancel", HoldCompraPara);
window.addEventListener("blur", HoldCompraPara);