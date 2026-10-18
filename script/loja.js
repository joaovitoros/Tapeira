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

	// Item "CM em dobro": preço derivado do nível (base 5, dobra por nível) —
	// saves antigos (base 10, item de 1 nível) migram sozinhos para a curva nova
	window.precoEsmCM = 5 * Math.pow(2, Math.max(0, Math.floor(Number(lvlEsmCM) || 0)));

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
	AtualizaCarteiraLoja();
	AtualizaSaldoBotoesLoja();
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
		// Cada item vive numa linha-card (.loja-item); o botão e o selo MAX
		// ficam na área de ação da própria linha.
		const linha = elPreco.closest(".loja-item");
		const btn = linha ? linha.querySelector(".loja-item__comprar") : null;
		const rotulo = btn ? btn.querySelector(".loja-item__comprar-rotulo") : null;
		const selo = linha ? linha.querySelector(".loja-item__selo") : null;
		const noTeto = cfg.noTeto();
		const proxima = noTeto && TemProximaPatente(item.id);

		if (!noTeto) {
			// preço normal: botão "Comprar" com o preço do próximo nível
			elPreco.innerHTML = FormatGold(window[cfg.precoVar]);
			if (btn) btn.style.display = "";
			if (rotulo) rotulo.textContent = "Comprar";
			if (selo) selo.hidden = true;
			if (linha) linha.classList.remove("loja-item--max", "loja-item--patente");
		} else if (proxima) {
			// no teto com ★ pendente: o botão vira o ingresso da próxima patente
			elPreco.innerHTML = FormatGold(PrecoPatenteLoja(item.id));
			if (btn) btn.style.display = "";
			if (rotulo) rotulo.textContent = "★ Patente";
			if (selo) selo.hidden = true;
			if (linha) {
				linha.classList.add("loja-item--patente");
				linha.classList.remove("loja-item--max");
			}
		} else {
			// patente máxima: sem próxima compra — o botão dá lugar ao selo MAX
			if (btn) btn.style.display = "none";
			if (selo) {
				selo.hidden = false;
				selo.innerHTML = '<span class="loja-lvl-max">MAX</span>';
			}
			if (linha) {
				linha.classList.add("loja-item--max");
				linha.classList.remove("loja-item--patente");
			}
		}
	}

	// descrição do card sempre com o texto calculado do preview (nível/patente)
	SincronizaDescricoesLoja();
}

// Carteira do cabeçalho da loja: espelha as 3 moedas do HUD em qualquer painel
// aberto (os valores são marcados por data-saldo). Só leitura + textContent.
function AtualizaCarteiraLoja() {
	const raiz = document.getElementById("container-Loja");
	if (!raiz) return;
	const valores = {
		gold: FormatGold(gold),
		esmeralda: String(esmeraldas),
		cm: FormatCM(conhecimentoMug)
	};
	raiz.querySelectorAll("[data-saldo]").forEach(el => {
		const v = valores[el.dataset.saldo];
		if (v !== undefined && el.textContent !== v) el.textContent = v;
	});
}

// Estado "saldo insuficiente" por linha: apaga o botão quando não dá para
// pagar. Roda no tick de 1s (junto da automação) e na abertura — só lê o
// estado e troca uma classe, então o custo é desprezível.
function AtualizaSaldoBotoesLoja() {
	const painelGold = document.getElementById("Loja");
	if (painelGold && painelGold.style.visibility === "visible") {
		for (const item of ITENS_AUTO_COMPRA) {
			const btn = painelGold.querySelector('.loja-item__comprar[data-compra="' + item.id + '"]');
			if (!btn) continue;
			let preco;
			if (item.teto && ITENS_PATENTE[item.teto].noTeto()) {
				if (!TemProximaPatente(item.teto)) {
					btn.classList.remove("loja-item__comprar--off");
					continue;
				}
				preco = PrecoPatenteLoja(item.teto);
			} else {
				preco = N(window[item.preco]);
			}
			btn.classList.toggle("loja-item__comprar--off", !GE(gold, preco));
		}
	}

	const painelEsm = document.getElementById("LojaEsm");
	if (painelEsm && painelEsm.style.visibility === "visible") {
		const itens = [
			{ id: "comp1", preco: "precoComp1" }, { id: "avgold", preco: "precoAvGold" },
			{ id: "comp2", preco: "precoComp2" }, { id: "comp3", preco: "precoComp3" },
			{ id: "comp4", preco: "precoComp4" }, { id: "comp5", preco: "precoComp5" },
			{ id: "comp6", preco: "precoComp6" }, { id: "xp", preco: "precoXP" },
			{ id: "esmcm", preco: "precoEsmCM" }
		];
		for (const item of itens) {
			const btn = painelEsm.querySelector('.loja-item__comprar[data-compra="' + item.id + '"]');
			if (!btn) continue;
			btn.classList.toggle("loja-item__comprar--off", !(N(esmeraldas) >= N(window[item.preco])));
		}
		const IB = window.Tapeira && window.Tapeira.ItensBuild;
		const btnSlot = painelEsm.querySelector("[data-compra-slot-build]");
		if (btnSlot && IB) {
			const noLimite = IB.slotsExtras() >= IB.LIMITE_EXTRAS;
			btnSlot.classList.toggle("loja-item__comprar--off", noLimite || !(N(esmeraldas) >= IB.precoSlotExtra()));
		}
	}

	const painelCM = document.getElementById("LojaCM");
	if (painelCM && painelCM.style.visibility === "visible") {
		const itens = [
			{ id: "dano", nivel: cmNivelDano }, { id: "gold", nivel: cmNivelGold },
			{ id: "xp", nivel: cmNivelXp }, { id: "fuga", nivel: cmNivelFuga },
			{ id: "crit", nivel: cmNivelCrit }, { id: "formiga", nivel: cmNivelFormiga },
			{ id: "duasformigas", nivel: cmNivelDuasFormigas }, { id: "comp", nivel: cmNivelComp },
			{ id: "goldcomp2", nivel: cmNivelGoldComp2 }
		];
		for (const item of itens) {
			const btn = painelCM.querySelector('.loja-item__comprar[data-compra-cm="' + item.id + '"]');
			if (!btn) continue;
			btn.classList.toggle("loja-item__comprar--off", !(conhecimentoMug >= PrecoLojaCM(item.nivel, item.id)));
		}
	}
}

function AbreLoja(exibirTutorial){
	// O botão da loja alterna sobre QUALQUER painel da loja (Gold, Esmeralda
	// ou Conhecimento). Antes ele só olhava o #Loja: na aba do Conhecimento o
	// ouro fica `hidden`, então "fechar" de novo REABRIA a loja de Gold em vez
	// de fechar a loja.
	const lojaAberta = ["Loja", "LojaEsm", "LojaCM"].some(id => {
		const el = document.getElementById(id);
		return el && el.style.visibility === "visible";
	});

	if (lojaAberta) {
		document.getElementById("Loja").style.visibility = "hidden";
	} else {
		document.getElementById("Loja").style.visibility = "visible";
	}
	document.getElementById("LojaEsm").style.visibility = "hidden";
	document.getElementById("LojaCM").style.visibility = "hidden";
	AtualizaLojaGold();

	if (!lojaAberta) {
		UI.closeOtherPanels("shop");
		FechaTelasNavegacao("loja");
	}
	UI.syncScreenButtons();

	// Tutorial do comp1: só quando o jogador abre a loja (não em chamadas internas)
	if(exibirTutorial && !lojaAberta){
		MostraTutorialComp1();
	}
}

function FechaLoja(){
	document.getElementById("Loja").style.visibility="hidden";
	document.getElementById("LojaEsm").style.visibility="hidden";
	document.getElementById("LojaCM").style.visibility="hidden";
	UI.syncScreenButtons();
}

// Abre a Loja de Gold a partir de qualquer painel (aba de moeda do rodapé)
function LojaGold(){
	const painel = document.getElementById("Loja");
	if(!painel) return;
	painel.style.visibility = "visible";
	document.getElementById("LojaEsm").style.visibility = "hidden";
	document.getElementById("LojaCM").style.visibility = "hidden";
	AtualizaLojaGold();
	UI.closeOtherPanels("shop");
	FechaTelasNavegacao("loja");
	UI.syncScreenButtons();
}

// =========================
// COMPRAS E NAVEGAÇÃO DA LOJA (SEM onclick INLINE)
// =========================
// O HTML marca cada botão de compra com data-compra (loja de gold e de
// esmeralda), data-compra-cm (loja do Conhecimento) ou data-loja (navegação
// e fechar). O clique é ligado por addEventListener no DOMContentLoaded.
function CompraLojaFuncao(id) {
	const acoes = {
		dano: CompraDano, bau: CompraBau, esmbau: CompraEsmBau, bespaco: CompraBEspaco,
		gold: CompraGold, avanco: CompraAvanco, dcrit: CompraDCrit, subvida: CompraSubVida,
		ccrit: CompraCCrit, qtdavanco: CompraQTDAvanco, velcomp: CompraVelComp,
		comp1: CompraComp1, avgold: CompraAvGold, comp2: CompraComp2, comp3: CompraComp3,
		comp4: CompraComp4, comp5: CompraComp5, comp6: CompraComp6, xp: CompraXP,
		esmcm: CompraEsmCM
	};
	return acoes[id] || null;
}

function CompraLojaItem(id) {
	const acao = CompraLojaFuncao(id);
	if (acao) acao();
}

function ExecutaLojaNavegacao(acao) {
	const acoes = {
		fechar: FechaLoja,
		gold: LojaGold,
		esmeralda: LojaEsmeralda,
		conhecimento: LojaConhecimento,
		"fechar-cm": FechaLojaCM
	};
	const fn = acoes[acao];
	if (fn) fn();
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

// Liga os botões da loja por addEventListener. Roda antes do DOMContentLoaded
// de loja-preview.js (este arquivo carrega primeiro), então a compra dispara
// antes de o preview atualizar no mesmo clique.
document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("[data-compra]").forEach(botao => {
		botao.addEventListener("click", () => CompraLojaItem(botao.dataset.compra));
	});
	document.querySelectorAll("[data-compra-cm]").forEach(botao => {
		botao.addEventListener("click", () => CompraCM(botao.dataset.compraCm));
	});
	document.querySelectorAll("[data-loja]").forEach(botao => {
		botao.addEventListener("click", () => ExecutaLojaNavegacao(botao.dataset.loja));
	});
	document.querySelectorAll("[data-esp]").forEach(botao => {
		botao.addEventListener("click", () => EscolheEspecializacao(Number(botao.dataset.esp)));
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
		FechaTelasNavegacao("loja");
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
	if (saldo) saldo.innerHTML = FormatCM(conhecimentoMug);

	const itens = [
		{ id: "dano", nivel: cmNivelDano, preco: "precoCMDano", lvl: "lvlCMDano" },
		{ id: "gold", nivel: cmNivelGold, preco: "precoCMGold", lvl: "lvlCMGold" },
		{ id: "xp", nivel: cmNivelXp, preco: "precoCMXp", lvl: "lvlCMXp" },
		{ id: "fuga", nivel: cmNivelFuga, preco: "precoCMFuga", lvl: "lvlCMFuga" },
		{ id: "crit", nivel: cmNivelCrit, preco: "precoCMCrit", lvl: "lvlCMCrit" },
		{ id: "formiga", nivel: cmNivelFormiga, preco: "precoCMFormiga", lvl: "lvlCMFormiga" },
		{ id: "duasformigas", nivel: cmNivelDuasFormigas, preco: "precoCMDuas", lvl: "lvlCMDuas" },
		{ id: "comp", nivel: cmNivelComp, preco: "precoCMComp", lvl: "lvlCMComp" },
		{ id: "goldcomp2", nivel: cmNivelGoldComp2, preco: "precoCMGoldComp2", lvl: "lvlCMGoldComp2" }
	];

	for (const item of itens) {
		const elPreco = document.getElementById(item.preco);
		const elLvl = document.getElementById(item.lvl);
		if (elPreco) elPreco.innerHTML = FormatCM(PrecoLojaCM(item.nivel, item.id));
		if (elLvl) elLvl.innerHTML = item.nivel;
	}

	AtualizaCarteiraLoja();
	AtualizaSaldoBotoesLoja();
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

	const preco = PrecoLojaCM(nivel, tipo);
	if (conhecimentoMug < preco) {
		MostraInfo("Você não tem Conhecimento Mug suficiente!");
		return;
	}

	conhecimentoMug = conhecimentoMug - preco;
	if (tipo === "dano") {
		cmNivelDano++;
		// efeito imediato; no reset o Resetar remonta tudo com ×1.05 por nível
		danoJogador = danoJogador * 1.05;
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
	AtualizaHUDConhecimento();
	document.getElementById("contTempo").innerHTML = FormataTempoFuga(tempoAvancoInimigos);
	MostraStatus();
	AutoSaveLocal();
}

//Deduz o gold de uma compra da loja; no desafio "sem gold" a compra falha o desafio
function PagaLoja(preco) {
	if (missaoAtual === 5 && missaoDesafioSub === 1) FalhaDesafio("Gold gasto na loja");
	gold.add(-N(preco));
	comprasRun++; //conquista Poupado: qualquer compra desta run quebra o "sem comprar"
}
