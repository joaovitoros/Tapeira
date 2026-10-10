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
		"precoComp1", "precoAvGold", "precoComp2", "precoComp3", "precoComp4",
		"precoComp5", "precoComp6", "precoXP",
		"precoEsmCM", "precoEsmBau", "precoVelComp"
	];

	nomesPrecos.forEach(nome => {
		const valor = N(window[nome]);
		window[nome] = Number.isFinite(valor) ? Math.max(1, valor) : 1;
	});
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
