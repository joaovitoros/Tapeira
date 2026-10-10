// ===================== COMPRAS DA LOJA DE GOLD =================================
// Fluxo de compra de cada item da loja de gold.
// Funcoes globais movidas de loja.js sem alterar as chamadas.

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
