//variaveis de regras
var avancoInterval;
var numInimigosTela = 1; //usada para validar quantos inimigos e
var andar = 1;	//usada para contagem do andar atual do jogo (Necessario para calculos progressivos)
var qtdInimigosAndar = 1; //quantidade necessaria de inimigos que devem ser derrotados para avançar para o proximo andar
var inimigosDerrotados = 0; //quantidade de inimigos derrotados naquele andar
var limiteInimigos; //usada para controlar quantos inimigos podem ser criados na tela ao mesmo tempo
var gold = new GoldNumber(0); //quantidade de dinheiro do jogador
var saveAnd = 10; //andar que será efetuado o salvamento automatico
var qtdSave = 0; //Quantidade de vezes que o jogo foi salvo
var maxAndar = 0; //andar maximo atingido
var andarVolta = 20; //andar necessario para que se possa utilizar o reset
var totalDerrotados = 0; //total de inimigos derrotados durante todo o jogo
var totalGold = new GoldNumber(0); //total de gold coletado durante todo o jogo
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
var abateshabilidadeDano = 15; //Quantidade necessaria para usar habilidade dano
var tempoHabilidadeDano = 30; // tempo de duraçao da habilidade dano
var verificaHabilidadeDano = false;
var fugaEmAndamento = false;
////

////Variaveis de Reset de jogo
var danoComp = 0; //dano causado pelos companheiros
var danoCritComp = 0; //dano critico causado pelos companheiros
var goldCompanheiro = 0; //dinheiro coletado pelos companheiros
var goldCompanheirosAcumulado = 0;
var ticksGoldCompanheiros = 0;
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
var sobeGold = 0.1;
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

function CarregarStatus(){
	var pow;
	if(andar>15 && andar<=40){
		pow=1.8;
	}else if (andar>40){
		pow=2.5;
	}else{
		pow=1.25;
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
		UI.showInfo("Inimigos mais fortes...");
		andarBoss=andarBoss+10;
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



function CriaBau(){
	valida = Math.random();

	if(valida<=chanceBau){
		bau = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att4 = document.createAttribute("onClick");
		att1.value = "imagens/bau-aventura.svg";
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
		UI.showCurrencyReward("emerald", 1);
		UI.showInfo("Recebeu um bonus de 1 esmeralda!");
	}else{
		bonus = (((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco));
		bonus = bonus*5;
		gold.add(bonus);
		document.getElementById("contGold").innerHTML = FormatGold(gold);
		UI.showCurrencyReward("gold", bonus);
		UI.showStatus();
		UI.showInfo("Recebeu um bonus de: "+bonus +" gold");
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
		att1.value = "imagens/espada-habilidade.svg";
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

	porcentagem = aux * 100 / abateshabilidadeDano;
	
	document.getElementById("BaraQTDHab1").style.height=Math.max(0, Math.min(100, porcentagem))+"%";
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
	if (jogoPausado) return;

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

//funçoes de parceiros
function DanoCompanheiros(){
	if (jogoPausado) return;
	if(danoComp>0){
		DanoAutomatico(false,false);
	}
}

function GoldCompanheiros(){
	if (jogoPausado) return;
	gold.add(goldCompanheiro);
	totalGold.add(goldCompanheiro);

	document.getElementById("contGold").innerHTML = FormatGold(gold);

	if (goldCompanheiro > 0) {
		goldCompanheirosAcumulado += goldCompanheiro;
		ticksGoldCompanheiros++;
		if (ticksGoldCompanheiros >= 10) {
			UI.showCurrencyReward("gold", goldCompanheirosAcumulado);
			goldCompanheirosAcumulado = 0;
			ticksGoldCompanheiros = 0;
		}
	} else {
		goldCompanheirosAcumulado = 0;
		ticksGoldCompanheiros = 0;
	}
}

function TempoCompanheiros(){
	if (jogoPausado) return;
	tempoAvancoInimigos=tempoAvancoInimigos+tempoEsperaCompanheiro;
	document.getElementById("contTempo").innerHTML=tempoAvancoInimigos;
	if(tempoEsperaCompanheiro>0){
		UI.showInfo("Ganhou "+tempoEsperaCompanheiro +" segundos");
	}
}
////



function AvancoInimigos() {
	if (jogoPausado) return;

    tempoAvancoInimigos--;
    document.getElementById("contTempo").innerHTML = tempoAvancoInimigos;

	// Lógica de avanço dos inimigos
/*
    for (let i = 1; i <= numInimigosTela; i++) {

        const el = document.getElementById("inimigo" + i);
        if (!el) continue;

        if (i === 1 || i === 2) {
            el.style.left = (380 - tempoAvancoInimigos * 3) + "px";
        } else {
            el.style.left = (820 + tempoAvancoInimigos * 3) + "px";
        }
    }
*/
    if (tempoAvancoInimigos <= 0) {
		if (fugaEmAndamento) return;

        if (andar > 1) {
			fugaEmAndamento = true;
			UI.showInfo("Inimigos te alcançaram, fugindo...");
			// gatilho da animação de fuga removido (imagens em imagens/fugindo/frames mantidas)
			RemoverInimigos();
			andar--;
			inimigosDerrotados = 0;
			qtdInimigosAndar--;
			tempoAvancoInimigos = 120;
			UI.render();
			CarregarStatus();
			UI.spawnEnemies();
			UI.showInfo("Dica: compre Avanço rápido para facilitar os andares");
			fugaEmAndamento = false;
			return;
        }

        tempoAvancoInimigos = 120;
    }
}

function VoltaAndar(){
	console.log("ENTROU NO VOLTA ANDAR");
	if(andar>=andarVolta){
		console.log("PODE VOLTAR");
		let esmeraldasRecebidas;
		if(andar>=maxAndar){
			console.log(numVoltas);
			numVoltas++;
			esmeraldasRecebidas = numVoltas;
			esmeraldas = esmeraldas+numVoltas;
		}else{
			var auxEsmeraldas = Math.round(esmeraldas/andar);
			
			if(auxEsmeraldas<1){
				auxEsmeraldas=1;
			}
			esmeraldasRecebidas = auxEsmeraldas;
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
		
		Resetar();
		RemoverInimigos();
		Batalha();
		UI.showCurrencyReward("emerald", esmeraldasRecebidas);
		UI.showInfo("Voce voltou ao primeiro andar e recebeu " + esmeraldasRecebidas + " esmeraldas.");
	}else{
		UI.showInfo("É necessario chegar no andar "+andarVolta +" para poder voltar");
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
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano recebido");
		} else if(validaConquista==2){
			goldAux = gold+(((andar*mulGold)+(vidaAndar*mulGold)*mulGoldAvanco))*2;
			const bonusGoldConquista = goldAux*(totalDerrotados/100);
			gold.add(bonusGoldConquista);
			totalGold = totalGold+bonusGoldConquista;
			UI.showCurrencyReward("gold", bonusGoldConquista);
			validaConquista++;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de gold");
			UI.showMilestone("Conquista desbloqueada", "Bônus de Gold recebido");
		}else{
			danoCritJogador = danoCritJogador*((1+(totalDerrotados/100))/2);
			validaConquista = 1;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano critico");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano crítico recebido");
		}
		UI.render();
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
		UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de -1% nos preços da loja!");
		UI.showMilestone("Conquista de Gold", "Desconto de 1% liberado na loja");
		descontoLoja = descontoLoja+0.01;
		AbreLoja();
		AbreLoja();
	}
}

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
	UI.updateMission();
}

function MissaoColetaGold(AuxMissao){
	//Verificação de conclusão da missão Coleta de gold
	missaoColetaAtual = missaoColetaAtual+AuxMissao;
	if(missaoColetaAtual>=missaoColeta){
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoColeta/2+" de gold");
		UI.showMilestone("Missão concluída", "Bônus de Gold recebido");
		gold.add(missaoColeta / 2);
		totalGold.add(missaoColeta / 2);
		UI.showCurrencyReward("gold", missaoColeta / 2);
		missaoColeta = missaoColeta*2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

function MissaoGolpes(){
	//Verificação de conclusão da missão Golpes
	missaoGolpeAtual++;
	if(missaoGolpeAtual==missaoGolpe){
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoGolpe+" de gold");
		UI.showMilestone("Missão concluída", "Meta de golpes alcançada. Bônus de Gold recebido");
		gold.add(missaoGolpe);
		totalGold.add(missaoGolpe);
		UI.showCurrencyReward("gold", missaoGolpe);
		missaoGolpe = missaoGolpe*2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

function MissaoCaca(){
	//Verificação de conclusão da missão Golpes
	missaoCacaMugsAtual++;
	if(missaoCacaMugsAtual==missaoCacaMugs){
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoCacaMugs+" de gold");
		UI.showMilestone("Missão concluída", "Meta de Mugs derrotados. Bônus de Gold recebido");
		gold.add(missaoCacaMugs);
		totalGold.add(missaoCacaMugs);
		UI.showCurrencyReward("gold", missaoCacaMugs);
		missaoCacaMugs = missaoCacaMugs*2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

function MissaoTempo(){
	if (jogoPausado) return;

	if(missaoAtual==4){
		missaoTempoAtual++;
	}
	if(missaoTempoAtual==missaoTempo){
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+missaoTempo/60+" de gold");
		UI.showMilestone("Missão concluída", "Meta de tempo alcançada. Bônus de Gold recebido");
		gold.add(missaoTempo/60);
		totalGold.add(missaoTempo/60);
		UI.showCurrencyReward("gold", missaoTempo/60);
		missaoTempo = missaoTempo*1.5;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}
