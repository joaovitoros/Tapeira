// ===================== LOJA DE ESMERALDAS =================================
// Abertura e compras da loja de esmeraldas (companheiros e bônus).
// Funcoes globais movidas de loja.js sem alterar as chamadas.

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

		document.getElementById("precoComp4").innerHTML=precoComp4;
		document.getElementById("lvlComp4").innerHTML=lvlComp4;

		document.getElementById("precoComp5").innerHTML=precoComp5;
		document.getElementById("lvlComp5").innerHTML=lvlComp5;

		document.getElementById("precoComp6").innerHTML=precoComp6;
		document.getElementById("lvlComp6").innerHTML=lvlComp6;

		document.getElementById("precoXP").innerHTML=precoXP;
		document.getElementById("lvlXP").innerHTML=lvlXP;

		document.getElementById("precoEsmCM").innerHTML=precoEsmCM;
		document.getElementById("lvlEsmCM").innerHTML=lvlEsmCM;

		AtualizaLojaEsmSlotBuild();

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
		precoComp3 = N(precoComp3) * 2;
		lvlComp3++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoComp3").innerHTML=precoComp3;
		document.getElementById("lvlComp3").innerHTML=lvlComp3;

		MostraStatus();
		CriarCompanheiros();
		SincronizaIntervalosNovosCompanheiros();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// Companheiro 4 (Alquimista): buff aleatório a cada 20s
function CompraComp4(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoComp4)){
		esmeraldas = N(esmeraldas) - N(precoComp4);
		precoComp4 = N(precoComp4) * 2;
		lvlComp4++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoComp4").innerHTML=precoComp4;
		document.getElementById("lvlComp4").innerHTML=lvlComp4;

		MostraStatus();
		CriarCompanheiros();
		SincronizaIntervalosNovosCompanheiros();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// Companheiro 5 (Assassino): passiva de morte instantânea
function CompraComp5(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoComp5)){
		esmeraldas = N(esmeraldas) - N(precoComp5);
		precoComp5 = N(precoComp5) * 2;
		lvlComp5++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoComp5").innerHTML=precoComp5;
		document.getElementById("lvlComp5").innerHTML=lvlComp5;

		MostraStatus();
		CriarCompanheiros();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// Companheiro 6 (Explorador do mapa): chance de avançar mais de um andar
function CompraComp6(){
	NormalizaPrecosLoja();
	if(N(esmeraldas) >= N(precoComp6)){
		esmeraldas = N(esmeraldas) - N(precoComp6);
		precoComp6 = N(precoComp6) * 2;
		lvlComp6++;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoComp6").innerHTML=precoComp6;
		document.getElementById("lvlComp6").innerHTML=lvlComp6;

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

// Item "CM em dobro": cada nível dobra o Conhecimento Mug ganho no reset
// (×2/×4/×8/×16). Preço base 5, dobrando por nível.
function CompraEsmCM(){
	NormalizaPrecosLoja();
	if(N(lvlEsmCM) >= MAX_ESM_CM){
		MostraInfo("Item no nível máximo!");
		return;
	}
	if(N(esmeraldas) >= N(precoEsmCM)){
		esmeraldas = N(esmeraldas) - N(precoEsmCM);
		lvlEsmCM = N(lvlEsmCM) + 1;
		precoEsmCM = N(precoEsmCM) * 2;

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=N(esmeraldas);
		document.getElementById("precoEsmCM").innerHTML=N(precoEsmCM);
		document.getElementById("lvlEsmCM").innerHTML=lvlEsmCM;

		MostraStatus();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// Espaço extra de build: +1 slot por nível, preço dobra a cada compra.
// Só aparece depois do andar 100 (mesmo destrave do sistema de build) e a
// compra é permanente — só os itens da build zeram no reset, o espaço não.
function AtualizaLojaEsmSlotBuild(){
	const IB = window.Tapeira && window.Tapeira.ItensBuild;
	const linha = document.getElementById("linhaEsmSlotBuild");
	if(!IB || !linha) return;
	linha.hidden = !IB.desbloqueada();
	document.getElementById("precoEsmSlotBuild").innerHTML=IB.precoSlotExtra();
	document.getElementById("lvlEsmSlotBuild").innerHTML=IB.slotsExtras();
}

function CompraEsmSlotBuild(){
	const IB = window.Tapeira && window.Tapeira.ItensBuild;
	if(!IB) return;
	NormalizaPrecosLoja();
	if(!IB.desbloqueada()){
		MostraInfo("Espaço extra de build só pode ser comprado depois do andar 100!");
		return;
	}
	if(IB.slotsExtras() >= IB.LIMITE_EXTRAS){
		MostraInfo("Item no nível máximo!");
		return;
	}
	const preco = IB.precoSlotExtra();
	if(N(esmeraldas) >= preco){
		esmeraldas = N(esmeraldas) - preco;
		IB.compraSlotExtra();

		ChamaSom('audio6');

		document.getElementById("contEmeraldas").innerHTML=N(esmeraldas);
		AtualizaLojaEsmSlotBuild();

		MostraStatus();
		AutoSalvar();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

// Sem handler inline (AGENTS.md): o botão da linha usa data-compra-slot-build
// e o clique é delegado no document, independente da ordem dos scripts.
document.addEventListener("click", (evento) => {
	const alvo = evento.target && evento.target.closest
		? evento.target.closest("[data-compra-slot-build]")
		: null;
	if(!alvo) return;
	CompraEsmSlotBuild();
});
