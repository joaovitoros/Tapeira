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
	const nomesPrecos = [
		"precoDano", "precoBau", "precoGold", "precoBEspaco", "precoAvan",
		"precoDCrit", "precoVidaInimigo", "precoCCrit", "precoQTDAvanco",
		"precoComp1", "precoAvGold", "precoComp2", "precoComp3", "precoXP",
		"precoEsmCM"
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

	AtualizaMaximosLoja();
}

// Itens com nível máximo: no lugar do preço exibe "Lvl Max" e esconde o
// botão de compra. Espelha os mesmos gates das funções Compra* — quem pode
// comprar continua sendo decidido por elas.
function AtualizaMaximosLoja() {
	const itens = [
		{ preco: "precoBau", max: N(chanceBau) >= 0.75, valor: FormatGold(precoBau) },
		{ preco: "precoAvan", max: N(avanco) >= 0.5, valor: FormatGold(precoAvan) },
		{ preco: "precoVidaInimigo", max: N(lvlSubVida) >= 50, valor: FormatGold(precoVidaInimigo) },
		{ preco: "precoCCrit", max: N(chanceCrit) >= 0.7, valor: FormatGold(precoCCrit) },
		{ preco: "precoBEspaco", max: N(lvlBEspaco) >= 15, valor: FormatGold(precoBEspaco) },
		{ preco: "precoQTDAvan", max: N(lvlQTDAvanco) > 20, valor: FormatGold(precoQTDAvanco) }
	];

	for (const item of itens) {
		const elPreco = document.getElementById(item.preco);
		if (!elPreco) continue;
		// Os botões compartilham o id "btnLoja" (duplicado), então o
		// localizamos pela linha da tabela em que o preço está.
		const linha = elPreco.closest("tr");
		const btn = linha ? linha.querySelector("input[type='button']") : null;
		elPreco.innerHTML = item.max ? '<span class="loja-lvl-max">Lvl Max</span>' : item.valor;
		if (btn) btn.style.display = item.max ? "none" : "";
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
	// crítico não trava mais no teto ×4: cada nível dele também dá +0,1 no teto
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
		// efeito imediato; no reset o Resetar remonta tudo com ×1.01 por nível
		danoJogador = danoJogador * 1.01;
		LimitaDanoCritico();
		if (danoComp1 > 0) danoComp = danoJogador * danoComp1;
	} else if (tipo === "gold") {
		cmNivelGold++;
	} else if (tipo === "xp") {
		cmNivelXp++;
	} else if (tipo === "fuga") {
		cmNivelFuga++;
		tempoAvancoInimigos = tempoAvancoInimigos + 1;
	} else if (tipo === "crit") {
		cmNivelCrit++;
		// o teto sobe ANTES do ×1.01: sem isso o LimitaDanoCritico engoliria
		// o +1% comprado quando o crítico está encostado no teto
		SobeTetoCritico();
		danoCritJogador = danoCritJogador * 1.01;
		LimitaDanoCritico();
	} else if (tipo === "formiga") {
		cmNivelFormiga++;
	} else if (tipo === "duasformigas") {
		cmNivelDuasFormigas++;
	} else if (tipo === "comp") {
		cmNivelComp++;
		// o bônus fica embutido em danoComp1 (permanente: vem no save e não
		// zera no Resetar), então todo recálculo de danoComp já o inclui
		danoComp1 = danoComp1 * 1.01;
		if (lvlComp1 > 0) danoComp = danoJogador * danoComp1;
	} else if (tipo === "goldcomp2") {
		cmNivelGoldComp2++;
		// recompõe do zero (lvlComp2 × mulGold × bônus) — nunca conta em dobro
		if (N(lvlComp2) > 0) goldCompanheiro = N(lvlComp2) * N(mulGold) * MultiplicadorGoldComp2();
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
}

function CompraDano(){
	NormalizaPrecosLoja();

	if(GE(gold, precoDano)){

		PagaLoja(precoDano);

		danoJogador = N(danoJogador) + N(mulDano);
		// Começo mais amigável: os 5 primeiros níveis sobem 40% em vez de 50%
		precoDano = N(precoDano) * (lvlDano < 5 ? 1.4 : 1.5);
		mulDano = N(mulDano) * 1.025;
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

		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraBau(){
	NormalizaPrecosLoja();
	if(N(chanceBau) < 0.75){
		if(GE(gold, N(precoBau))){

			PagaLoja(precoBau);

			chanceBau = N(chanceBau) + 0.05;
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
		MostraInfo("Item no level maximo!");
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

		sobeGold = Math.min(N(sobeGold) + 0.1, 0.3);
		lvlGold++;

		if(lvlComp2 > 0){
			goldCompanheiro = N(lvlComp2) * N(mulGold) * MultiplicadorGoldComp2();
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

	if(N(avanco) < 0.5){
		if(GE(gold, N(precoAvan))){

			PagaLoja(precoAvan);

			avanco = N(avanco) + N(sobeAvanco);
			precoAvan = N(precoAvan) * 2;
			sobeAvanco = N(sobeAvanco) * 1.005;
			lvlAvan++;

			if(avanco > 0.5){
				avanco = 0.5;
			}

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
		MostraInfo("Item no level maximo!");
	}
}

function CompraDCrit(){
	NormalizaPrecosLoja();
	if(GE(gold, N(precoDCrit))){

		PagaLoja(precoDCrit);

		SobeTetoCritico();
		sobeDCrit = N(sobeDCrit) * 1.025;
		danoCritJogador = N(danoCritJogador) + ((N(danoJogador)/2) * (2 + N(sobeDCrit)));
		LimitaDanoCritico();
		precoDCrit = N(precoDCrit) * 1.5;
		lvlDCrit++;

		ChamaSom('audio6');

		document.getElementById("contGold").innerHTML = FormatGold(gold);
		document.getElementById("precoDCrit").innerHTML = FormatGold(precoDCrit);
		document.getElementById("lvlDCrit").innerHTML = lvlDCrit;

		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraSubVida(){
	NormalizaPrecosLoja();
	if(lvlSubVida < 50){
		if(GE(gold, N(precoVidaInimigo))){

			PagaLoja(precoVidaInimigo);

			// Aplica apenas o desconto novo (1%), e não o total acumulado: usar o total
			// multiplicava o desconto em dobro a cada compra e a vida "voltava" no respawn,
			// quando CarregarStatus() recalcula a vida do andar do zero.
			const subAnterior = N(subVidaInimigo);
			subVidaInimigo = subAnterior + 0.01;
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
		MostraInfo("Item no level maximo!");
	}
}

function CompraCCrit(){
	NormalizaPrecosLoja();
	if(N(chanceCrit) < 0.7){
		if(GE(gold, N(precoCCrit))){

			PagaLoja(precoCCrit);

			// a partir de 30% cada compra vale metade do passo (o teto segue 70%)
			const passo = N(sobeCCrit) * (N(chanceCrit) >= 0.3 ? 0.5 : 1);
			chanceCrit = N(chanceCrit) + passo;
			precoCCrit = N(precoCCrit) * 1.5;
			sobeCCrit = N(sobeCCrit) * 1.1;
			lvlCCrit++;

			if(chanceCrit > 0.7){
				chanceCrit = 0.7;
			}

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
		MostraInfo("Item no level maximo!");
	}
}

function CompraBEspaco(){
	NormalizaPrecosLoja();
	if(GE(gold, N(precoBEspaco))){
		if(lvlBEspaco < 15){

			PagaLoja(precoBEspaco);

			MaxValidaBater--;
			precoBEspaco = N(precoBEspaco) * 1.5;
			lvlBEspaco++;
		}

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
	if(lvlQTDAvanco <= 20){
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
		MostraInfo("Item no level maximo!");
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
		goldCompanheiro = N(lvlComp2) * N(mulGold) * MultiplicadorGoldComp2();
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
		const prox = N(danoJogador) + N(mulDano);
		const extra = (N(lvlDano) === 9) ? " · nível 10 dá +20%!" : "";
		return "Dano: " + N(danoJogador).toFixed(2) + " → " + prox.toFixed(2)
			+ " (+" + N(mulDano).toFixed(2) + ")" + extra;
	},
	CompraBau() {
		if (N(chanceBau) >= 0.75) return "Chance de baú: no máximo (75%)";
		return "Chance de baú: " + FormataPct(chanceBau, 0) + " → "
			+ FormataPct(Math.min(0.75, N(chanceBau) + 0.05), 0) + " (máx 75%)";
	},
	CompraBEspaco() {
		if (N(lvlBEspaco) >= 15) return "Recarga do espaço: no nível máximo";
		return "Recarga do espaço: " + N(MaxValidaBater) + " → " + (N(MaxValidaBater) - 1) + " (quanto menor, mais rápido)";
	},
	CompraGold() {
		const prox = N(mulGold) * (1 + N(sobeGold));
		return "Multiplicador gold: " + N(mulGold).toFixed(2) + " → " + prox.toFixed(2);
	},
	CompraAvanco() {
		if (N(avanco) >= 0.5) return "Avanço rápido: no máximo (50%)";
		const prox = Math.min(0.5, N(avanco) + N(sobeAvanco));
		return "Chance de avanço: " + FormataPct(avanco) + " → " + FormataPct(prox) + " (máx 50%)";
	},
	CompraDCrit() {
		const proxMult = N(multiplicadorMaximoDanoCritico) + 0.1;
		const proxSobe = N(sobeDCrit) * 1.025;
		let proxCrit = N(danoCritJogador) + (N(danoJogador) / 2) * (2 + proxSobe);
		proxCrit = Math.min(proxCrit, N(danoJogador) * proxMult);
		return "Dano crítico: " + N(danoCritJogador).toFixed(2) + " → " + proxCrit.toFixed(2)
			+ " (máx ×" + proxMult.toFixed(1) + ")";
	},
	CompraSubVida() {
		if (N(lvlSubVida) >= 50) return "Vida dos inimigos: no nível máximo";
		return "Redução de vida: " + FormataPct(subVidaInimigo, 0) + " → "
			+ FormataPct(Math.min(0.5, N(subVidaInimigo) + 0.01), 0) + " (máx 50%)";
	},
	CompraCCrit() {
		if (N(chanceCrit) >= 0.7) return "Chance crítica: no máximo (70%)";
		const meio = N(chanceCrit) >= 0.3;
		const passo = N(sobeCCrit) * (meio ? 0.5 : 1);
		const prox = Math.min(0.7, N(chanceCrit) + passo);
		return "Chance crítica: " + FormataPct(chanceCrit) + " → " + FormataPct(prox)
			+ " (máx 70%" + (meio ? " · ganho pela metade" : " · a partir de 30% cai pela metade") + ")";
	},
	CompraQTDAvanco() {
		if (N(lvlQTDAvanco) > 20) return "Quantidade de avanço: no nível máximo";
		return "Qtd de avanço: " + N(qtdAvanco) + " → " + (N(qtdAvanco) + 1) + " inimigos";
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
		const prox = (N(lvlComp2) + 1) * N(mulGold) * MultiplicadorGoldComp2();
		return "Gold do companheiro: " + FormatGold(N(goldCompanheiro)) + " → " + FormatGold(prox) + "/seg";
	},
	CompraComp3() {
		return "Tempo bônus do companheiro: " + N(tempoEsperaCompanheiro) + "s → "
			+ (N(tempoEsperaCompanheiro) + N(tempoComp3)) + "s";
	},
	CompraXP() {
		return "Bônus de XP: +" + (N(lvlXP) | 0) + " → +" + ((N(lvlXP) | 0) + 1) + " por abate";
	},
	CompraEsmCM() {
		if (N(lvlEsmCM) >= 1) return "CM ganho: no nível máximo (×2)";
		return "CM ganho no reset: ×" + MultiplicadorCM() + " → ×" + (MultiplicadorCM() * 2);
	}
};

function NomeFuncaoCompra(btn) {
	const attr = btn.getAttribute("onclick") || "";
	const m = attr.match(/^\s*([A-Za-z_$][\w$]*)\s*\(/);
	return m ? m[1] : null;
}

// ids no HTML que não batem com o nome da variável de preço
const ALIAS_PRECO = { precoQTDAvan: "precoQTDAvanco" };

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
		const preco = window[idPreco];
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