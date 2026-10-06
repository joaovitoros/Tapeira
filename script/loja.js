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
		"precoComp1", "precoAvGold", "precoComp2", "precoComp3"
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
}

function AbreLoja(){
	if(document.getElementById("Loja").style.visibility=="hidden"){
		document.getElementById("Loja").style.visibility="visible";
	}else{
		document.getElementById("Loja").style.visibility="hidden";
	}
	AtualizaLojaGold();

	if(document.getElementById("LojaEsm").style.visibility=="visible"){
		document.getElementById("LojaEsm").style.visibility="hidden";
	}
	if(document.getElementById("Loja").style.visibility=="visible"){
		UI.closeOtherPanels("shop");
	}
	UI.syncScreenButtons();
}

function CompraDano(){
	NormalizaPrecosLoja();

	if(GE(gold, precoDano)){

		gold.add(-N(precoDano));

		danoJogador = N(danoJogador) + N(mulDano);
		precoDano = N(precoDano) * 1.5;
		mulDano = N(mulDano) * 1.02;
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

			gold.add(-N(precoBau));

			chanceBau = N(chanceBau) + 0.05;
			precoBau = N(precoBau) * 2;
			lvlBau++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoBau").innerHTML = FormatGold(precoBau);
			document.getElementById("lvlBau").innerHTML = lvlBau;

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

		gold.add(-N(precoGold));

		mulGold = N(mulGold) * (1 + N(sobeGold));
		if(lvlGold> 10){
			precoGold = N(precoGold) * 1.25;
		}else{
			precoGold = N(precoGold) * 1.75;
		}
		sobeGold = Math.min(N(sobeGold) + 0.1, 0.5);
		lvlGold++;

		if(lvlComp2 > 0){
			goldCompanheiro = N(lvlComp2) * N(mulGold);
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

			gold.add(-N(precoAvan));

			avanco = N(avanco) + N(sobeAvanco);
			precoAvan = N(precoAvan) * 1.2;
			sobeAvanco = N(sobeAvanco) * 1.005;
			lvlAvan++;

			if(avanco > 0.5){
				avanco = 0.5;
			}

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoAvan").innerHTML = FormatGold(precoAvan);
			document.getElementById("lvlAvan").innerHTML = lvlAvan;

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

		gold.add(-N(precoDCrit));

		multiplicadorMaximoDanoCritico += 0.05;
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
	if(lvlSubVida < 25){
		if(GE(gold, N(precoVidaInimigo))){

			gold.add(-N(precoVidaInimigo));

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

			precoVidaInimigo = N(precoVidaInimigo) * 1.5;
			lvlSubVida++;

			ChamaSom('audio6');

			if (inimigoAtualizado) DesceVida(inimigoAtualizado);

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoVidaInimigo").innerHTML = FormatGold(precoVidaInimigo);
			document.getElementById("lvlSubVida").innerHTML = lvlSubVida;

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

			gold.add(-N(precoCCrit));

			chanceCrit = N(chanceCrit) + N(sobeCCrit);
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

			gold.add(-N(precoBEspaco));

			MaxValidaBater--;
			precoBEspaco = N(precoBEspaco) * 1.5;
			lvlBEspaco++;
		}

		ChamaSom('audio6');

		document.getElementById("contGold").innerHTML = FormatGold(gold);
		document.getElementById("precoBEspaco").innerHTML = FormatGold(precoBEspaco);
		document.getElementById("lvlBEspaco").innerHTML = lvlBEspaco;

		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraQTDAvanco(){
	NormalizaPrecosLoja();
	if(lvlQTDAvanco <= 20){
		if(GE(gold, N(precoQTDAvanco))){

			gold.add(-N(precoQTDAvanco));

			qtdAvanco++;
			precoQTDAvanco = N(precoQTDAvanco) * 1.5;
			lvlQTDAvanco++;

			ChamaSom('audio6');

			document.getElementById("contGold").innerHTML = FormatGold(gold);
			document.getElementById("precoQTDAvan").innerHTML = FormatGold(precoQTDAvanco);
			document.getElementById("lvlQTDAvan").innerHTML = lvlQTDAvanco;

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

	}else{
		document.getElementById("LojaEsm").style.visibility="hidden";
		document.getElementById("Loja").style.visibility="visible";
	}
}

function CompraComp1(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoComp1)){
		esmeraldas = N(esmeraldas) - N(precoComp1);
		danoComp1 = N(danoComp1) + 0.05;
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
		goldCompanheiro = N(lvlComp2) * N(mulGold);
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