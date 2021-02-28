//variaveis de regras
var numInimigosTela = 1; //usada para validar quantos inimigos e
var andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
var qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
var inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
var limiteInimigos; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
var gold = 0; //quantidade de dinheiro do jogador
var saveAnd = 10; //andar que será efetuado o salvamento automatico
var qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
var maxAndar = 0; //andar maximo atingido
var andarVolta = 20; //andar necessario para que se possa utilizar o reset
var totalDerrotados = 0; //total de inimigos derrotados durante todo o jogo
var totalGold = 0; //total de gold coletado durante todo o jogo
var danoJogador = 1; //dano atual do jogador
var danoCritJogador = 2; //dano critico atual do jogador
var chanceCrit = 0.01; //chance em porcentagem de se causar um dano critico
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
var missao = Array(" ","Coleta de Gold", "Golpes", "Caça aos Mugs", "Tempo") //vetor usado para listagem das missões
var missaoAtual; //variavel que determina a missão atual (1- coleta de gol, 2- tempo, 3- caça aos mugs)
var missaoColeta = 500, missaoColetaAtual = 0.0; //Gold necessario para completar a missão "Coleta de gold"
var missaoGolpe = 100, missaoGolpeAtual = 0; //Quantidade de golpes necessarios para concluir a missão "Golpes"
var missaoCacaMugs = 50, missaoCacaMugsAtual = 0; //Quantidade de mugs necessarios para completar a missão "Caça aos Mugs"
var missaoTempo = 10000, missaoTempoAtual = 0; //tempo em milissegundos necessarios para concluir a missão "Tempo"
var qtdMissoes = 4; //Quantidade de missões disponiveis
var statusMissao = true; //Verifica se a missão pode ser iniciada
var chanceBau = 0.1;
var chanceEsmeraldaBau = 0.01;
var qtdCarregaHabilidade = 0; //Quantidade de inimigos derrotados para carregar Habilidade
var abateshabilidadeDano = 20; //Quantiade necessaria para usar habilidade dano
var tempoHabilidadeDano = 30; // tempo de duraçao da habilidade dano
var verificaHabilidadeDano = false;
////

////Variaveis de Reset de jogo
var danoComp = 0; //dano causado pelos companheiros
var danoCritComp = 0; //dano critico causado pelos companheiros
var goldCompanheiro = 0; //dinheiro coletado pelos companheiros
var tempoEsperaCompanheiro = 0;//Tempo bonus dos companheiros
var esmeraldas = 0; //quantidade de esmeraldos obtidas
var numVoltas = 0; //varaivel utilizada para determinar quantas esmeraldas serão obtidas ao resetar
var danoBonus = 0; //variavel para armazenar os danos bonus
////

//variaveis referentes a loja
var precoDano = 5;
var mulDano = 1;
var lvlDano = 1;

var precoBEspaco = 45;
var lvlBEspaco = 1;

var precoGold = 50;
var sobeGold = 0.05;
var lvlGold = 1;

var precoAvan = 80;
var sobeAvanco = 0.01;
var lvlAvan = 0;

var precoDCrit = 100;
var sobeDCrit = 0.1;
var lvlDCrit = 1;

var precoCCrit = 200;
var sobeCCrit = 0.02;
var lvlCCrit = 1;

var precoQTDAvanco = 200;
var lvlQTDAvanco = 1;

var precoVidaInimigo = 150;
var subVidaInimigo = 0.00;
var lvlSubVida = 0;

var precoBau = 10;
var lvlBau = 1;


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
////

var qtdMusicas = 8;


//funçoes do sistema

function AbreConfig(){
	if(document.getElementById("container-SalvaCarrega").style.visibility=="hidden"){
		document.getElementById("container-SalvaCarrega").style.visibility="visible";		
	}else{
		document.getElementById("container-SalvaCarrega").style.visibility="hidden";
	}
}

function AutoSalvar(){
	if(saveAnd==andar){
		saveAnd = saveAnd+10;
		Salvar();
		MostraInfo("Salvamento Automatico...");
	}
}

function Salvar(){
	qtdSave++;
	var blob = new Blob([numInimigosTela," ", andar, " ", qtdInimigosAndar, " ", inimigosDerrotados, " ", limiteInimigos, " ", gold, " ", saveAnd, " ", qtdSave, " ", maxAndar, " ", andarVolta, " ", totalDerrotados, " ", totalGold, " ", danoJogador, " ", danoCritJogador, " ", chanceCrit, " ", vidaAndar, " ", vidaInimigo1, " ", vidaInimigo2, " ", vidaInimigo3, " ", vidaInimigo4, " ", mulGold, " ", mulGoldAvanco, " ", avanco, " ", qtdAvanco, " ", ValidaBater, " ", MaxValidaBater, " ", danoComp, " ", danoCritComp, " ", goldCompanheiro, " ", tempoEsperaCompanheiro, " ", esmeraldas, " ", numVoltas, " ", tempoAvancoInimigos, " ", andarBoss, " ", progressoConquistaDano , " ", progressoConquistaGold, " ", validaConquista, " ", precoDano, " ", mulDano, " ", lvlDano, " ", precoBEspaco, " ", lvlBEspaco, " ", precoGold, " ", sobeGold, " ", lvlGold, " ", precoAvan, " ", sobeAvanco, " ", lvlAvan," ", precoDCrit, " ", sobeDCrit, " ", lvlDCrit, " ", precoCCrit, " ", sobeCCrit, " ", lvlCCrit, " ", precoComp1, " ", danoComp1, " ", lvlComp1, " ", precoAvGold, " ", lvlAvGold, " ", precoComp2, " ", goldComp2, " ", lvlComp2, " ",precoComp3, " ", tempoComp3, " ", lvlComp3, " ", descontoLoja, " ", mulGoldInicial, " ", danoBonus, " ", precoQTDAvanco, " ", lvlQTDAvanco, " ", precoVidaInimigo, " ", subVidaInimigo, " ", lvlSubVida, " ", chanceBau, " ", chanceEsmeraldaBau, " ", precoBau, " ", lvlBau], { type: "text/plain;charset=utf-8" });
	saveAs(blob, "save.txt");
	MostraInfo("Salvando...");
	
}

function Carregar(saveArray){
	
	for(i=0;i<saveArray.length;i++){
		saveArray[i] = parseFloat(saveArray[i]);
	}
	
	numInimigosTela = saveArray[0];
	andar = saveArray[1];
	qtdInimigosAndar = saveArray[2];
	inimigosDerrotados = saveArray[3];
	limiteInimigos = saveArray[4];
	gold = saveArray[5];
	saveAnd = saveArray[6];
	qtdSave = saveArray[7];
	maxAndar = saveArray[8];
	andarVolta = saveArray[9];
	totalDerrotados = saveArray[10];
	totalGold = saveArray[11];
	danoJogador = saveArray[12];
	danoCritJogador = saveArray[13];
	chanceCrit = saveArray[14];
	vidaAndar = saveArray[15];
	vidaInimigo1 = saveArray[16];
	vidaInimigo2 = saveArray[17];
	vidaInimigo3 = saveArray[18];
	vidaInimigo4 = saveArray[19];
	mulGold = saveArray[20];
	mulGoldAvanco = saveArray[21];
	avanco = saveArray[22];
	qtdAvanco = saveArray[23];
	ValidaBater = saveArray[24];
	MaxValidaBater = saveArray[25];
	danoComp = saveArray[26];
	danoCritComp = saveArray[27];
	goldCompanheiro = saveArray[28];
	tempoEsperaCompanheiro = saveArray[29];
	esmeraldas = saveArray[30];
	numVoltas = saveArray[31];
	tempoAvancoInimigos = saveArray[32];
	andarBoss = saveArray[33];
	progressoConquistaDano = saveArray[34];
	progressoConquistaGold = saveArray[35];
	validaConquista = saveArray[36];
	precoDano = saveArray[37];
	mulDano = saveArray[38];
	lvlDano = saveArray[39];
	precoBEspaco = saveArray[40];
	lvlBEspaco = saveArray[41];
	precoGold = saveArray[42];
	sobeGold = saveArray[43];
	lvlGold = saveArray[44];
	precoAvan = saveArray[45];
	sobeAvanco = saveArray[46];
	lvlAvan = saveArray[47];
	precoDCrit = saveArray[48];
	sobeDCrit = saveArray[49];
	lvlDCrit = saveArray[50];
	precoCCrit = saveArray[51];
	sobeCCrit = saveArray[52];
	lvlCCrit = saveArray[53];
	precoComp1 = saveArray[54];
	danoComp1 = saveArray[55];
	lvlComp1 = saveArray[56];
	precoAvGold = saveArray[57];
	lvlAvGold = saveArray[58];
	precoComp2 = saveArray[59];
	goldComp2 = saveArray[60];
	lvlComp2 = saveArray[61];
	precoComp3 = saveArray[62];
	tempoComp3 = saveArray[63];
	lvlComp3 = saveArray[64];
	descontoLoja = saveArray[65];
	mulGoldInicial = saveArray[66];
	danoBonus = saveArray[67];
	precoQTDAvanco = saveArray[68];
	lvlQTDAvanco = saveArray[69];
	precoVidaInimigo = saveArray[70];
	subVidaInimigo = saveArray[71];
	lvlSubVida = saveArray[72];
	chanceBau = saveArray[73];
	chanceEsmeraldaBau  = saveArray[73];
	precoBau = saveArray[74];
	lvlBau = saveArray[74];
	
	//limpar e recomeçar possiveis inimigos e intervalos anteriores
	window.onload = clearInterval("AvancoInimigos()");
	RemoverInimigos();
	////
	
	Batalha();
	AbreLoja();
	SobeStatus();
	MostraInfo("Carregou...");
}

function CarregarArquivo () {
     //Check the support for the File API support
     if (window.File && window.FileReader && window.FileList && window.Blob) {
         var fileSelected = document.getElementById('txtfiletoread');
         fileSelected.addEventListener('change', function (e) {
			 //Set the extension for the file
			 var fileExtension = /text.*/;
			 //Get the file object
			 var fileTobeRead = fileSelected.files[0];
			 //Check of the extension match
			 if (fileTobeRead.type.match(fileExtension)) {
				//Initialize the FileReader object to read the 2file
				var fileReader = new FileReader();
				fileReader.onload = function (e) {
					var save = fileReader.result;
									
					saveArray = save.split(" ");
									
					Carregar(saveArray);
				}
				fileReader.readAsText(fileTobeRead);
			 }else{
			   alert("Por favor selecione arquivo texto");
			 }

         }, false);
      }else{
        alert("Arquivo(s) não suportado(s)");
     }
}

function ChamaSom(som){
	document.getElementById(som).play();
}

function AbaixaSom(){
	for(i=1;i<=qtdMusicas;i++){
		document.getElementById('audio'+i).volume-=0.1;
	}
}

function AumentaSom(){
	for(i=1;i<=qtdMusicas;i++){
		document.getElementById('audio'+i).volume+=0.1;
	}
}

////


function Menu(){
    window.location.href="Caverna.html";
}

function PreCarregamento(){
	window.onload = setInterval("DanoCompanheiros()", 1000);
	window.onload = setInterval("GoldCompanheiros()", 1000);
	window.onload = setInterval("TempoCompanheiros()", 10000);
	window.onload = setInterval("HabilidadeDano()", 1000);
	if(qtdSave==0){
		window.onload = setInterval("AvancoInimigos()", 1000);
		window.onload = setInterval("MostraInfo('')", 25000);
	}
	alert("Como jogar: Clique nos cogumelos para destrui-los e conseguir gold\nAperte L para abrir a Loja\nAperte S para abrir seu Status\nAperte C para abrir as Conquistas realizadas e seus bonus permanentes\nAperte M para ver as missoes atuais\nSegure Barra de Espaço para aplicar dano a algum inimigo proximo\nAperte I para rever os controles\nDica: Ao chegar no andar " +andarVolta +" clique em Voltar Andar para recomeçar e conseguir esmeraldas, que vao liberar recompensas especiais!");
	Batalha();
}

function Batalha(){
	AtualizarTela();
	CarregarStatus();
	CriarCompanheiros();
	CriarInimigos();
	MostraStatus();
}


function AtualizarTela(){
	document.getElementById("titulo").innerHTML="Caverna (Andar: "+andar+")";
    document.getElementById("contDerrotados").innerHTML=totalDerrotados;
    document.getElementById("contRestantes").innerHTML=inimigosDerrotados;
    document.getElementById("contIniAndar").innerHTML=qtdInimigosAndar;
    document.getElementById("contAndar").innerHTML=andar;
    document.getElementById("contGold").innerHTML=gold;
	document.getElementById("contEmeraldas").innerHTML=esmeraldas;
	document.getElementById("contTempo").innerHTML=tempoAvancoInimigos;
}

function CarregarStatus(){
	var pow;
	if(andar>15 && andar<=40){
		pow=1.8;
	}else if (andar>40){
		pow=2.5;
	}else{
		pow=1.5;
	}
	
	
	vidaAndar = Math.pow(andar, pow);
	
	if(vidaAndar<5){
		vidaAndar = vidaAndar*2;
	}

	vidaAndar = vidaAndar*(1-subVidaInimigo);
	
	vidaInimigo1 = vidaAndar;
	vidaInimigo2 = vidaAndar;
	vidaInimigo3 = vidaAndar;
	vidaInimigo4 = vidaAndar;
	
	if(andar>=10){
		Missao();
	}
	
	if(andarBoss==andar){
		vidaAndar = vidaAndar*2;
		vidaInimigo1 = vidaInimigo1*2;
		vidaInimigo2 = vidaInimigo2*2;
		vidaInimigo3 = vidaInimigo3*2;
		vidaInimigo4 = vidaInimigo4*2;
		MostraInfo("Inimigos mais fortes...");
		andarBoss=andarBoss+10;
	}
}

function CriarInimigos(){
	ChamaSom('audio1');
	
    if(andar<5){
        limiteInimigos = 1;
    }else if(andar>=5 && andar<=14){
        limiteInimigos = 2;
    }else if(andar>=15 && andar<=29){
        limiteInimigos = 3;
    }else if(andar>=30){
        limiteInimigos = 4;
    }
    
    numInimigosTela = limiteInimigos;
	
    for(i=1;i<=limiteInimigos;i++){
        inimigo = document.createElement("img");
        att1 = document.createAttribute("src");
        att2 = document.createAttribute("class");
        att3 = document.createAttribute("onclick");
        att4 = document.createAttribute("id");
		att1.value = "imagens/Inimigo.png";
        att2.value = "inimigo"+i;
        att3.value = "Bater('"+i+"', 'true')";
        att4.value = "inimigo"+i;
        inimigo.setAttributeNode(att1);
        inimigo.setAttributeNode(att2);
        inimigo.setAttributeNode(att3);
        inimigo.setAttributeNode(att4);
        document.body.appendChild(inimigo);
		if(i==1 || i==2){
			document.getElementById("inimigo"+i).style.transform= "scaleX(-1)";
		}
    }
	
	for(i=1;i<=limiteInimigos;i++){
		if(document.getElementsByClassName("inimigo"+i).length>1){
			console.log("removeu"+i);
			document.body.removeChild(document.getElementById("inimigo"+i));
		}
	}
}

function RemoverInimigos(){
	try {
		document.body.removeChild(document.getElementById("inimigo1"));
		document.body.removeChild(document.getElementById("inimigo2"));
		document.body.removeChild(document.getElementById("inimigo3"));
		document.body.removeChild(document.getElementById("inimigo4"));
	} catch (error) {
		console.log(error);
	}
}

function CriarCompanheiros(){
	if(lvlComp1>0){
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
	if(lvlComp2>0){
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
	if(lvlComp3>0){
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
}

function Bater(inimigo, validaDano){
	var dano;
	var danoCritico;
	var goldAux;
	
	if(validaDano){
		dano = danoJogador;
		danoCritico = danoCritJogador;
	}else{
		dano = danoComp;
		danoCritico = danoCritJogador*danoComp1;
	}
	
	//Se a missão "Golpes" estiver iniciada, será computado o golpe
	if(missaoAtual==2){
		MissaoGolpes();
	}

	if(DanoCritico(danoCritico)){
		dano = danoCritico;
		ChamaSom('audio8');
	}else{
		ChamaSom('audio3');
	}
	
    if(inimigo==1){
		if(vidaInimigo1>0){
			vidaInimigo1 = vidaInimigo1 - dano;
		}
        if(vidaInimigo1<=0){
			document.body.removeChild(document.getElementById("inimigo1"));
			ChamaSom('audio2');
            av = Avancar();
            inimigosDerrotados = inimigosDerrotados+av;
            totalDerrotados = totalDerrotados+av;
            numInimigosTela--;
			gold = gold+((andar*mulGold)*av);
			totalGold = totalGold+((andar*mulGold)*av);
            document.getElementById("contGold").innerHTML=gold.toFixed(2);
			if(missaoAtual==3){
				MissaoCaca();
			}
			//se a missão "Coleta gold" estiver ativada vai somar
			if(missaoAtual==1){
				goldAux = (andar*mulGold);
				MissaoColetaGold(goldAux);
			}
			qtdCarregaHabilidade++;
			VerificaHabilidade();
        }
		DesceVida(1);
    }else if (inimigo==2){
		if(vidaInimigo2>0){
			vidaInimigo2 = vidaInimigo2 - dano;
		}
        if(vidaInimigo2<=0){
			document.body.removeChild(document.getElementById("inimigo2"));
			ChamaSom('audio2');
			av = Avancar();
            inimigosDerrotados = inimigosDerrotados+av;
            totalDerrotados = totalDerrotados+av;
            numInimigosTela--;
			gold = gold+((andar*mulGold)*av);
			totalGold = totalGold+((andar*mulGold)*av);
            document.getElementById("contGold").innerHTML=gold.toFixed(2);
			if(missaoAtual==3){
				MissaoCaca();
			}
			//se a missão "Coleta gold" estiver ativada vai somar
			if(missaoAtual==1){
				goldAux = (andar*mulGold);
				MissaoColetaGold(goldAux);
			}
			qtdCarregaHabilidade++;
			VerificaHabilidade();
        }
		DesceVida(2);
    }else if (inimigo==3){
		if(vidaInimigo3>0){
			vidaInimigo3 = vidaInimigo3 - dano;
		}
        if(vidaInimigo3<=0){
			document.body.removeChild(document.getElementById("inimigo3"));
			ChamaSom('audio2');
            av = Avancar();
            inimigosDerrotados = inimigosDerrotados+av;
            totalDerrotados = totalDerrotados+av;
            numInimigosTela--;
			gold = gold+((andar*mulGold)*av);
			totalGold = totalGold+((andar*mulGold)*av);
            document.getElementById("contGold").innerHTML=gold.toFixed(2);
			if(missaoAtual==3){
				MissaoCaca();
			}
			//se a missão "Coleta gold" estiver ativada vai somar
			if(missaoAtual==1){
				goldAux = (andar*mulGold);
				MissaoColetaGold(goldAux);
			}
			qtdCarregaHabilidade++;
			VerificaHabilidade();
        }
		DesceVida(3);
    }else{
		if(vidaInimigo4>0){
			vidaInimigo4 = vidaInimigo4 - dano;
		}
        if(vidaInimigo4<=0){
			document.body.removeChild(document.getElementById("inimigo4"));
			ChamaSom('audio2');
            av = Avancar();
            inimigosDerrotados = inimigosDerrotados+av;
            totalDerrotados = totalDerrotados+av;
            numInimigosTela--;
			gold = gold+((andar*mulGold)*av);
			totalGold = totalGold+((andar*mulGold)*av);
            document.getElementById("contGold").innerHTML=gold.toFixed(2);
			if(missaoAtual==3){
				MissaoCaca();
			}
			//se a missão "Coleta gold" estiver ativada vai somar
			if(missaoAtual==1){
				goldAux = (andar*mulGold);
				MissaoColetaGold(goldAux);
			}
			qtdCarregaHabilidade++;
			VerificaHabilidade();
        }
		DesceVida(4);
    }
	MostraStatus();
	Conquistas();
	
    document.getElementById("contRestantes").innerHTML=inimigosDerrotados;
    document.getElementById("contDerrotados").innerHTML=totalDerrotados;
    if(numInimigosTela==0){
		RemoverInimigos();
        CarregarStatus();
        CriarInimigos();
    }
    if(inimigosDerrotados>=qtdInimigosAndar){
		
		if(document.getElementById("manterAndar").checked == true && andar>4){
			inimigosDerrotados = 0;
		}else{
			andar++;
			if(andar>maxAndar){
				maxAndar=andar;
			}
			RemoverInimigos();
			RemoveBau();
			gold = gold+(((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco));
			totalGold = totalGold+(((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco));
			document.getElementById("contGold").innerHTML=gold.toFixed(2);
			document.getElementById("contAndar").innerHTML=andar;
			document.getElementById("titulo").innerHTML="Caverna (Andar: "+andar+")";
			qtdInimigosAndar++;
			document.getElementById("contIniAndar").innerHTML=qtdInimigosAndar;
			inimigosDerrotados = 0;
			document.getElementById("contRestantes").innerHTML=inimigosDerrotados;
			AutoSalvar();
			Conquistas();
			CriaBau();
			//se a missão "Coleta gold" estiver ativada vai somar
			if(missaoAtual==1){
				goldAux = (((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco))*2;
				MissaoColetaGold(goldAux);
			}
			MostraStatus();
			CarregarStatus();
			CriarInimigos();
		}
		window.onload = clearInterval("AvancoInimigos()");
		tempoAvancoInimigos = 120;
    }
}

function CriaBau(){
	valida = Math.random();

	if(valida<=chanceBau){
		bau = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att4 = document.createAttribute("onClick");
		att1.value = "imagens/bau.png";
		att2.value = "bau";
		att3.value = "bau";
		att4.value = "ColetaBau()";
		bau.setAttributeNode(att1);
		bau.setAttributeNode(att2);
		bau.setAttributeNode(att3);
		bau.setAttributeNode(att4);
		document.body.appendChild(bau);
	}
}

function ColetaBau(){
	valida = Math.random();
	RemoveBau();
	ChamaSom('audio4');
	if(valida<=chanceEsmeraldaBau){
		esmeraldas++;
		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		MostraInfo("Recebeu um bonus de 1 esmeralda!");
	}else{
		bonus = (((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco));
		bonus = bonus*5;
		gold = gold+bonus;
		document.getElementById("contGold").innerHTML=gold.toFixed(2);
		MostraStatus();
		MostraInfo("Recebeu um bonus de: "+bonus +" gold");
	}
}

function RemoveBau(){
	try {
		document.body.removeChild(document.getElementById("bau"));
	} catch (error) {
		console.log(error);
	}
}

//Funçoes de habildiades

function VerificaHabilidade(){
	if(qtdCarregaHabilidade==abateshabilidadeDano){
		habilidade = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att4 = document.createAttribute("onClick");
		att1.value = "imagens/habilidade1.png";
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

	porcentagem = aux*100/20;
	
	document.getElementById("BaraQTDHab1").style.height=Math.round(porcentagem)+"px";
	document.getElementById("QTDTempoHab1").innerHTML=qtdCarregaHabilidade;
	document.getElementById("BaraQTDHab1").style.color="#fff";
}

function UsaHabilidadeDano(){
	document.body.removeChild(document.getElementById("habilidade1"));
	ChamaSom('audio5');
	verificaHabilidadeDano = true;
	qtdCarregaHabilidade = 0;
}

function HabilidadeDano(){
	AtualizaQTDHabildiade1();
	if(verificaHabilidadeDano){
		DanoAutomatico(false,true);
		document.getElementById("QTDTempoHab1").innerHTML=tempoHabilidadeDano--;
		document.getElementById("BaraQTDHab1").style.color="#f00";
		if(tempoHabilidadeDano==0){
			verificaHabilidadeDano=false;
			tempoHabilidadeDano = 30;
			document.getElementById("QTDTempoHab1").innerHTML=qtdCarregaHabilidade;
		}
	} 	
}

////
function Avancar(){
	valida = Math.random();
	
	if(valida<=avanco){
		MostraInfo("Avanço de "+qtdAvanco+" no andar: " +andar);
		return qtdAvanco;
	}else{
		return 1;
	}
}

function DanoCritico(critico){
	valida = Math.random();

	if(valida<=chanceCrit){
		MostraInfo("Dano critico de: " +critico);
		return true;
	}else{
		return false;
	}
}

function MostraInfo(mensagem){
	document.getElementById("Infos").innerHTML=mensagem;
}

function MostraStatus(){
	
	var msg = "Dano: "+danoJogador.toFixed(2) +"\nMultiplicador de Gold: "+mulGold.toFixed(2) + "\nGold por inimigo derrotado: "+(andar*mulGold).toFixed(2)+"\nTotal de gold coletado: "+totalGold.toFixed(2)+"\nBonus de gold a cada andar:"+((((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco))).toFixed(2)+"\nChance de Avanço Rapido: "+(avanco*100).toFixed(2)+"%"+"\nQuantidade de avanço rapido: "+qtdAvanco +"\nDano critico em: " +danoCritJogador.toFixed(2) +"\nChance de dano critico em: " +(chanceCrit*100).toFixed(2)+"%" +"\nDPS de companheiros: "+danoComp.toFixed(2)+"\nGoldPS de companheiros: "+goldCompanheiro.toFixed(2) + "\nTempo bonus de companheiro: "+tempoEsperaCompanheiro+" seg\nVida Mug - "+(subVidaInimigo*100).toFixed(2)+" %\nChance de surgir bau: "+(chanceBau*100).toFixed(2) +"%\nChance de esmeralda em bau: "+(chanceEsmeraldaBau*100).toFixed(2)+"%";
	
	document.getElementById("Status").innerHTML=msg;
}

function SobeStatus(){
	if(document.getElementById("DivStatus").style.visibility=="hidden"){
		document.getElementById("DivStatus").style.visibility="visible";
	}else{
		document.getElementById("DivStatus").style.visibility="hidden";
	}
}

function DesceVida(inimigo){
	var vida;
	if(inimigo==1){
		vida = vidaInimigo1;
	}else if(inimigo==2){
		vida = vidaInimigo2;
	}else if(inimigo==3){
		vida = vidaInimigo3;
	}else{
		vida = vidaInimigo4;
	}

	porcentagem = vida*100/vidaAndar;
	
	document.getElementById("VidaInimigo").style.width=Math.round(porcentagem)+"px";
	document.getElementById("VidaInimigo").innerHTML=vida.toFixed(2);
}

//funçoes de captura de telas

function keyPressed(evt){
    evt = evt || window.event;
    var key = evt.keyCode || evt.which;
    return key; 
}

document.onkeypress = function(evt) {
    var comando = keyPressed(evt);
	
	if(comando==32){
		DanoAutomatico(true, false);
	}else if(comando==108){
		AbreLoja();
	}else if(comando==115){
		SobeStatus();
	}else if(comando==99){
		MostraConquista();
	}else if(comando==109){
		MostraMissao();
	}else if(comando==112){
		alert("Pause...")
	}else if(comando==105){
		alert("Como jogar: Clique nos cogumelos para destrui-los e conseguir gold\nAperte L para abrir a Loja\nAperte S para abrir seu Status\nAperte C para abrir as Conquistas realizadas e seus bonus permanentes\nAperte M para ver as missoes atuais\nSegure Barra de Espaço para aplicar dano a algum inimigo proximo\nAperte I para rever os controles\nDica: Ao chegar no andar " +andarVolta +" clique em Voltar Andar para recomeçar e conseguir esmeraldas, que vao liberar recompensas especiais!");
	}else{
		alert(comando);
	}
};
////

function DanoAutomatico(indentificador, habilidade){

	//indentificador = false: Quando é o dano causado pelo companheiro
	//Habilidade = true: dizendo ao jogo que o dano esta sendo atravez de uma habilidade

	if(!indentificador){
		ValidaBater=0;
	}
	
	if(ValidaBater==0){
			ValidaBater=MaxValidaBater;

			if(habilidade){
				indentificador = true;
			}
	
			if(andar<5){
				if(vidaInimigo1>0){
					Bater(1,indentificador);
				}else{
					CarregarStatus();
					CriarInimigos();
				}
			}else if(andar>=5 && andar<=14){
				if(vidaInimigo2>0){
					Bater(2,indentificador);
				}else{
					Bater(1,indentificador);
				}
			}else if(andar>=15 && andar<=29){
				if(vidaInimigo3>0){
					Bater(3,indentificador);
				}else if(vidaInimigo2>0){
					Bater(2,indentificador);
				}else{
					Bater(1,indentificador);
				}
			}else if(andar>=30){
				if(vidaInimigo4>0){
					Bater(4,indentificador);
				}else if(vidaInimigo3>0){
					Bater(3,indentificador);
				}else if(vidaInimigo2>0){
					Bater(2,indentificador);
				}else{
					Bater(1,indentificador);
				}
			}
		}else{
			ValidaBater--;
		}
}


//funçoes de parceiros
function DanoCompanheiros(){
	if(danoComp>0){
		DanoAutomatico(false,false);
	}
}

function GoldCompanheiros(){
	gold=gold+goldCompanheiro;
	totalGold = totalGold+goldCompanheiro;
	document.getElementById("contGold").innerHTML=gold.toFixed(2);
}

function TempoCompanheiros(){
	tempoAvancoInimigos=tempoAvancoInimigos+tempoEsperaCompanheiro;
	document.getElementById("contTempo").innerHTML=tempoAvancoInimigos;
	if(tempoEsperaCompanheiro>0){
		MostraInfo("Ganhou "+tempoEsperaCompanheiro +" segundos");
	}
}
////



function AvancoInimigos(){
	tempoAvancoInimigos--;
	document.getElementById("contTempo").innerHTML=tempoAvancoInimigos;
	
	for(i=1;i<=limiteInimigos;i++){
		if(i==1 || i==2){
			try {
				document.getElementById("inimigo"+i).style.left = 380+(-tempoAvancoInimigos*3)+"px";
			} catch (error) {
				console.log(error);
			}
		}else{
			try {
				document.getElementById("inimigo"+i).style.left = 820+(tempoAvancoInimigos*3)+"px";
			} catch (error) {
				console.log(error);
			}
		}
    }
	
	if(tempoAvancoInimigos<=0){
		if(andar>1){
			window.onload = clearInterval("AvancoInimigos()");
			RemoverInimigos();
			MostraInfo("Inimigos te alcançaram, recuando...");
			andar--;
			inimigosDerrotados=0;
			qtdInimigosAndar--;
			AtualizarTela();
			CarregarStatus();
			CriarInimigos();
			MostraInfo("Dica: Se estiver com dificudlade para avançar compre o item Avanço rapido para ter mais faclidade durante os andares");
		}
		tempoAvancoInimigos=120;
	}
}

function VoltaAndar(){
	if(andar>=andarVolta){
		if(andar>=maxAndar){
			console.log(numVoltas);
			numVoltas++;
			esmeraldas = esmeraldas+numVoltas;
		}else{
			var auxEsmeraldas = Math.round(esmeraldas/andar);
			
			if(auxEsmeraldas<1){
				auxEsmeraldas=1;
			}
			esmeraldas = esmeraldas+auxEsmeraldas;
		}
		
		andarVolta=andarVolta+10;
		
		andar=1;
		qtdInimigosAndar=1;
		console.log("1 "+mulGoldInicial);
		mulGold = mulGoldInicial;
		mulGold = mulGold*1.25;

		if(lvlComp2>0){
			goldCompanheiro = lvlComp2*mulGold;
		}
		
		alert("Voce voltou, e vai ganhar "+esmeraldas+ " esmeraldas!");
		Resetar();
		RemoverInimigos();
		Batalha();
	}else{
		MostraInfo("É necessario chegar no andar "+andarVolta +" para poder voltar");
	}
}

//funçoes de controle das conquistas
function Conquistas(){
	if(totalDerrotados>=progressoConquistaDano ){
		progressoConquistaDano = progressoConquistaDano*2;
		if(validaConquista==1){
			danoJogador = danoJogador*((1+(totalDerrotados/100))/2);
			danoCritJogador = danoCritJogador+(danoJogador*(2+sobeDCrit));
			danoBonus = danoBonus + (1+(totalDerrotados/100))/2;
			if(lvlComp1>0){
				danoComp = danoJogador*danoComp1;
			}
			validaConquista++;
			MostraInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano");
		} else if(validaConquista==2){
			goldAux = gold+(((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco))*2;
			gold = gold+(goldAux*(totalDerrotados/100));
			totalGold = totalGold+(goldAux*(totalDerrotados/100));
			validaConquista++;
			MostraInfo("Conquista desbloqueada!\nVoce recebeu um bonus de gold");
		}else{
			danoCritJogador = danoCritJogador*((1+(totalDerrotados/100))/2);
			validaConquista = 1;
			MostraInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano critico");
		}
		AtualizarTela();
	}
	
	if(totalGold>=progressoConquistaGold){
		progressoConquistaGold = progressoConquistaGold*2;
		
		precoDano = precoDano*0.99;
		precoBEspaco = precoBEspaco*0.99;
		precoGold = precoGold*0.99;
		precoAvan = precoAvan*0.99;
		precoDCrit = precoDCrit*0.99;
		precoCCrit = precoCCrit*0.99;
		precoQTDAvanco = precoQTDAvanco*0.99;
		MostraInfo("Conquista desbloqueada!\nVoce recebeu um bonus de -1% nos preços da loja!");
		descontoLoja = descontoLoja+0.01;
		AbreLoja();
		AbreLoja();
	}
}

function MostraConquista(){
	var conquista;
	
	conquista = "Situação da conquista de dano atual\n"+totalDerrotados+" inimigos derrotados de "+progressoConquistaDano +" necessarios para receber bonus de ";
	if(validaConquista==1){
		conquista+="dano ("+(totalDerrotados*100/progressoConquistaDano).toFixed(2)+"%)";
	}else if(validaConquista==2){
		conquista+="gold ("+(totalDerrotados*100/progressoConquistaDano).toFixed(2)+"%)";
	}else if (validaConquista==3){
		conquista+="dano critico ("+(totalDerrotados*100/progressoConquistaDano).toFixed(2)+"%)";
	}
	
	conquista+="\nSituação da conquista de gold atual\n"+totalGold.toFixed(2)+ " gold coletado de "+progressoConquistaGold+" necessarios para receber bonus ("+(totalGold*100/progressoConquistaGold).toFixed(2)+"%)";
	alert(conquista);
}
////




//funçoes de controles das missoes
function Missao(){
	if(statusMissao){
		geraMissao = Math.random()*(qtdMissoes-1)+1;
		geraMissao = Math.round(geraMissao);
		missaoAtual = geraMissao;
		statusMissao = false;
	}
	if(missaoAtual==4){
		window.onload = setInterval("MissaoTempo()", 1000);
	}
}

function MissaoColetaGold(AuxMissao){
	//Verificação de conclusão da missão Coleta de gold
	missaoColetaAtual = missaoColetaAtual+AuxMissao;
	if(missaoColetaAtual>=missaoColeta){
		MostraInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoColeta/2+" de gold");
		gold = gold+(missaoColeta/2);
		totalGold = totalGold+(missaoColeta/2);
		missaoColeta = missaoColeta*2;
		AtualizarTela();
		statusMissao = true;
		Missao();
	}
}

function MissaoGolpes(){
	//Verificação de conclusão da missão Golpes
	missaoGolpeAtual++;
	if(missaoGolpeAtual==missaoGolpe){
		MostraInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoGolpe+" de gold");
		gold = gold+missaoGolpe;
		totalGold = totalGold+missaoGolpe;
		missaoGolpe = missaoGolpe*2;
		AtualizarTela();
		statusMissao = true;
		Missao();
	}
}

function MissaoCaca(){
	//Verificação de conclusão da missão Golpes
	missaoCacaMugsAtual++;
	if(missaoCacaMugsAtual==missaoCacaMugs){
		MostraInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoCacaMugs+" de gold");
		gold = gold+missaoCacaMugs;
		totalGold = totalGold+missaoCacaMugs;
		missaoCacaMugs = missaoCacaMugs*2;
		AtualizarTela();
		statusMissao = true;
		Missao();
	}
}

function MissaoTempo(){
	if(missaoAtual==4){
		missaoTempoAtual++;
	}
	if(missaoTempoAtual==missaoTempo){
		MostraInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoTempo/60+" de gold");
		gold = gold+missaoTempo/60;
		totalGold = totalGold+missaoTempo/60;
		missaoTempo = missaoTempo*1.5;
		AtualizarTela();
		statusMissao = true;
		Missao();
	}
}

function MostraMissao(){
	if(andar<10){
		alert("Missões só serão liberadas a partir do andar 10");
	}else{
		var msg = "Missão atual '"+missao[missaoAtual]+"' ";
		
		if(missaoAtual==1){
			msg+="\nProgresso: "+ missaoColetaAtual +" de " +missaoColeta + " (" +missaoColetaAtual*100/missaoColeta+"%)";
		} else if(missaoAtual==2){
			msg+="\nProgresso: "+ missaoGolpeAtual +" de " +missaoGolpe + " (" +missaoGolpeAtual*100/missaoGolpe+"%)";
		} else if(missaoAtual==3){
			msg+="\nProgresso: "+ missaoCacaMugsAtual +" de " +missaoCacaMugs + " (" +missaoCacaMugsAtual*100/missaoCacaMugs+"%)";
		} else if(missaoAtual==4){
			msg+="\nProgresso: "+ missaoTempoAtual +" de " +missaoTempo + " (" +missaoTempoAtual*100/missaoTempo+"%)";
		}
		alert(msg);
	}
}
////





//funçoes da loja
function AbreLoja(){
	if(document.getElementById("Loja").style.visibility=="hidden"){
		document.getElementById("Loja").style.visibility="visible";
		
		document.getElementById("precoDano").innerHTML=precoDano.toFixed(2);
		document.getElementById("lvlDano").innerHTML=lvlDano;

		document.getElementById("precoBau").innerHTML=precoBau.toFixed(2);
		document.getElementById("lvlBau").innerHTML=lvlBau;
		
		document.getElementById("precoGold").innerHTML=precoGold.toFixed(2);
		document.getElementById("lvlGold").innerHTML=lvlGold;
		
		document.getElementById("precoBEspaco").innerHTML=precoBEspaco.toFixed(2);
		document.getElementById("lvlBEspaco").innerHTML=lvlBEspaco;
		
		document.getElementById("precoAvan").innerHTML=precoAvan.toFixed(2);
		document.getElementById("lvlAvan").innerHTML=lvlAvan;
		
		document.getElementById("precoDCrit").innerHTML=precoDCrit.toFixed(2);
		document.getElementById("lvlDCrit").innerHTML=lvlDCrit;
		
		document.getElementById("precoVidaInimigo").innerHTML=precoVidaInimigo.toFixed(2);
		document.getElementById("lvlSubVida").innerHTML=lvlSubVida;

		document.getElementById("precoCCrit").innerHTML=precoCCrit.toFixed(2);
		document.getElementById("lvlCCrit").innerHTML=lvlCCrit;
		
		document.getElementById("precoQTDAvan").innerHTML=precoQTDAvanco.toFixed(2);
		document.getElementById("lvlQTDAvan").innerHTML=lvlQTDAvanco;
	}else{
		document.getElementById("Loja").style.visibility="hidden";
	}

	if(document.getElementById("LojaEsm").style.visibility=="visible"){
		document.getElementById("LojaEsm").style.visibility="hidden";
	}
}

function CompraDano(){
	if(gold>=precoDano){
		gold = gold-precoDano;
		danoJogador = danoJogador+mulDano;
		precoDano = precoDano*1.5;
		mulDano = mulDano*1.02;
		danoCritJogador = danoCritJogador+((danoJogador/2)*(2+sobeDCrit));
		lvlDano++;

		if(lvlDano==10){
			danoJogador = danoJogador*1.2;
			danoCritJogador = danoCritJogador+((danoJogador/2)*(2+sobeDCrit));
		}
		
		if(lvlComp1>0){
			danoComp = danoJogador*danoComp1;
		}
		ChamaSom('audio6');
		document.getElementById("contGold").innerHTML=gold.toFixed(2);
		document.getElementById("precoDano").innerHTML=precoDano.toFixed(2);
		document.getElementById("lvlDano").innerHTML=lvlDano;
		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraBau(){
	if(chanceBau<0.75){
		if(gold>=precoBau){
			gold = gold-precoBau;
			chanceBau = chanceBau+0.05;
			precoBau = precoBau*2;
			lvlBau++;

			ChamaSom('audio6');
			document.getElementById("contGold").innerHTML=gold.toFixed(2);
			document.getElementById("precoBau").innerHTML=precoBau.toFixed(2);
			document.getElementById("lvlBau").innerHTML=lvlBau;
			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		MostraInfo("Item no level maximo!");
	}
}

function CompraGold(){
	if(gold>=precoGold){
		gold = gold-precoGold;
		mulGold = mulGold+(mulGold*sobeGold);
		precoGold = precoGold*1.5;
		sobeGold = sobeGold*2;
		lvlGold++;

		if(lvlComp2>0){
			goldCompanheiro = lvlComp2*mulGold;
		}
		
		ChamaSom('audio6');
		document.getElementById("contGold").innerHTML=gold.toFixed(2);
		document.getElementById("precoGold").innerHTML=precoGold.toFixed(2);
		document.getElementById("lvlGold").innerHTML=lvlGold;
		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraAvanco(){

	if(avanco<0.5){
		if(gold>=precoAvan){
			gold = gold-precoAvan;
			avanco = avanco+sobeAvanco;
			precoAvan = precoAvan*1.2;
			sobeAvanco = sobeAvanco*1.005;
			lvlAvan++;

			if(avanco>0.5){
				avanco=0.5;
			}
			
			ChamaSom('audio6');
			document.getElementById("contGold").innerHTML=gold.toFixed(2);
			document.getElementById("precoAvan").innerHTML=precoAvan.toFixed(2);
			document.getElementById("lvlAvan").innerHTML=lvlAvan;
			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		MostraInfo("Item no level maximo!");
	}
}

function CompraDCrit(){
	if(gold>=precoDCrit){
		gold = gold-precoDCrit;
		sobeDCrit = sobeDCrit*1.05;
		danoCritJogador = danoCritJogador+((danoJogador/2)*(2+sobeDCrit));
		precoDCrit = precoDCrit*1.5;
		lvlDCrit++;
		
		ChamaSom('audio6');
		document.getElementById("contGold").innerHTML=gold.toFixed(2);
		document.getElementById("precoDCrit").innerHTML=precoDCrit.toFixed(2);
		document.getElementById("lvlDCrit").innerHTML=lvlDCrit;
		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraSubVida(){
	if(lvlSubVida<25){
		if(gold>=precoVidaInimigo){
			gold = gold-precoVidaInimigo;
			subVidaInimigo = subVidaInimigo+0.01;
			vidaAndar = vidaAndar*(1-subVidaInimigo);
			precoVidaInimigo = precoVidaInimigo*1.5;
			lvlSubVida++

			ChamaSom('audio6');
			document.getElementById("contGold").innerHTML=gold.toFixed(2);
			document.getElementById("precoVidaInimigo").innerHTML=precoVidaInimigo.toFixed(2);
			document.getElementById("lvlSubVida").innerHTML=lvlSubVida;
			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		MostraInfo("Item no level maximo!");
	}
}

function CompraCCrit(){
	if(chanceCrit<0.7){
		if(gold>=precoCCrit){
			gold = gold-precoCCrit;
			chanceCrit = chanceCrit+sobeCCrit;
			precoCCrit = precoCCrit*1.5;
			sobeCCrit = sobeCCrit*1.1;
			lvlCCrit++;

			if(chanceCrit>0.7){
				chanceCrit=0.7;
			}
			
			ChamaSom('audio6');
			document.getElementById("contGold").innerHTML=gold.toFixed(2);
			document.getElementById("precoCCrit").innerHTML=precoCCrit.toFixed(2);
			document.getElementById("lvlCCrit").innerHTML=lvlCCrit;
			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		MostraInfo("Item no level maximo!");
	}
}

function CompraBEspaco(){
	if(gold>=precoBEspaco){
		if(lvlBEspaco<15){
			gold = gold-precoBEspaco;
			MaxValidaBater--;
			precoBEspaco = precoBEspaco*1.5;
			lvlBEspaco++;
		}

		ChamaSom('audio6');
		document.getElementById("contGold").innerHTML=gold.toFixed(2);
		document.getElementById("precoBEspaco").innerHTML=precoBEspaco.toFixed(2);
		document.getElementById("lvlBEspaco").innerHTML=lvlBEspaco;
		MostraStatus();
	}else{
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
	}
}

function CompraQTDAvanco(){
	if(lvlQTDAvanco<=20){
		if(gold>=precoQTDAvanco){
			gold = gold-precoQTDAvanco;
			qtdAvanco++;
			precoQTDAvanco = precoQTDAvanco*1.5;
			lvlQTDAvanco++;
			

			ChamaSom('audio6');
			document.getElementById("contGold").innerHTML=gold.toFixed(2);
			document.getElementById("precoQTDAvan").innerHTML=precoQTDAvanco.toFixed(2);
			document.getElementById("lvlQTDAvan").innerHTML=lvlQTDAvanco;
			MostraStatus();
		}else{
			MostraInfo("Voce não tem gold o suficiente para essa compra!");
		}
	}else{
		MostraInfo("Item no level maximo!");
	}
}

function LojaEsmeralda(){
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
	if(esmeraldas>=precoComp1){
		esmeraldas = esmeraldas-precoComp1;
		danoComp1 = danoComp1+0.05;
		danoComp = danoJogador*danoComp1;
		precoComp1 = precoComp1*2;
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
	if(esmeraldas>=precoAvGold){
		esmeraldas = esmeraldas-precoAvGold;
		mulGoldAvanco = mulGoldAvanco*1.1;
		precoAvGold = precoAvGold*2;
		lvlAvGold++;
		
		ChamaSom('audio6');
		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		document.getElementById("precoAvGold").innerHTML=precoAvGold;
		document.getElementById("lvlAvGold").innerHTML=lvlAvGold;
		MostraStatus();
	}else{
		MostraInfo("Voce não tem esmeraldas o suficiente para essa compra!");
	}
}

function CompraComp2(){
	if(esmeraldas>=precoComp2){
		esmeraldas = esmeraldas-precoComp2;
		lvlComp2++;
		goldCompanheiro = lvlComp2*mulGold;
		precoComp2 = precoComp2*2;
		
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
	if(esmeraldas>=precoComp3){
		esmeraldas = esmeraldas-precoComp3;
		tempoEsperaCompanheiro = tempoEsperaCompanheiro+tempoComp3;
		precoComp3 = precoComp3*2;
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

//// Resetar
function Resetar(){
	numInimigosTela = 1; //usada para validar quantos inimigos e
	andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
	qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
	inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
	limiteInimigos; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
	gold = 0; //quantidade de dinheiro do jogador
	saveAnd = 10; //andar que será efetuado o salvamento automatico
	qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
	danoJogador = 1; //dano atual do jogador
	danoCritJogador = 2; //dano critico atual do jogador
	chanceCrit = 0.01; //chance em porcentagem de se causar um dano critico
	vidaAndar; //usado para marcar a vida maximo que os inimigos podem ter no andar atual
	vidaInimigo1; //vida atual do inimigo 1
	vidaInimigo2; //vida atual do inimigo 2
	vidaInimigo3; //vida atual do inimigo 3
	vidaInimigo4; //vida atual do inimigo 4
	mulGoldAvanco = 1; //variavel utilizada para efetuar acrescimo de dinheiro ao avançar andares
	avanco = 0; //variavel utilizada para calculo de probabilidade de um avanço rapido entre andares
	qtdAvanco = 2;////variavel que determina quantos inimigos serão derrotados noa vanço rapido
	ValidaBater = 30; //tempo atual para que se possa executar um ataque com o espaço
	MaxValidaBater = 30; //tempo maximo para que se possa executar um ataque com o espaço
	
	tempoAvancoInimigos = 120; //tempo para que o jogar seja obrigado a recuar um andar
	andarBoss = 10; //andar atual onde aparecerão inimigos mais fortes
	missao = Array(" ","Coleta de Gold", "Golpes", "Caça aos Mugs", "Tempo") //vetor usado para listagem das missões
	missaoAtual; //variavel que determina a missão atual (1- coleta de gol, 2- tempo, 3- caça aos mugs)
	missaoColeta = 500, missaoColetaAtual = 0.0; //Gold necessario para completar a missão "Coleta de gold"
	missaoGolpe = 100, missaoGolpeAtual = 0; //Quantidade de golpes necessarios para concluir a missão "Golpes"
	missaoCacaMugs = 50, missaoCacaMugsAtual = 0; //Quantidade de mugs necessarios para completar a missão "Caça aos Mugs"
	missaoTempo = 10000, missaoTempoAtual = 0; //tempo em milissegundos necessarios para concluir a missão "Tempo"
	qtdMissoes = 4; //Quantidade de missões disponiveis
	statusMissao = true; //Verifica se a missão pode ser iniciada
	////

	//variaveis referentes a loja
	precoDano = 5;
	mulDano = 1;
	lvlDano = 1;

	precoBEspaco = 45;
	lvlBEspaco = 1;

	precoGold = 50;
	sobeGold = 0.05;
	lvlGold = 1;

	precoAvan = 80;
	sobeAvanco = 0.01;
	lvlAvan = 0;

	precoDCrit = 100;
	sobeDCrit = 0.2;
	lvlDCrit = 1;

	precoCCrit = 200;
	sobeCCrit = 0.02;
	lvlCCrit = 1;

	precoQTDAvanco = 200;
	lvlQTDAvanco = 1;

	precoVidaInimigo = 150;
	subVidaInimigo = 0.01;
	lvlSubVida = 0;

	precoBau = 10;
	lvlBau = 1;

	precoDano = precoDano*(1-descontoLoja);
	precoBEspaco = precoBEspaco*(1-descontoLoja);
	precoGold = precoGold*(1-descontoLoja);
	precoAvan = precoAvan*(1-descontoLoja);
	precoDCrit = precoDCrit*(1-descontoLoja);
	precoCCrit = precoCCrit*(1-descontoLoja);
	precoQTDAvanco = precoQTDAvanco*(1-descontoLoja);

	chanceBau = 0.1;

	mulGoldInicial = mulGold;
	console.log("2 "+mulGoldInicial);

	////
	if(danoBonus!=0 && !isNaN(danoBonus)){
		danoJogador = danoJogador*danoBonus;
	}

	if(lvlComp1>0){
		danoComp = danoJogador*danoComp1;
	}

	Salvar();
}
////