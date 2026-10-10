// ===================== MISSOES ===========================================
// Estado temporario e regras das missoes normais e do desafio.
// APIs globais mantidas para compatibilidade com scripts classicos.

var missao = Array(" ","Coleta de Gold", "Golpes", "Caça aos Mugs", "Tempo") //vetor usado para listagem das missões
var missaoAtual; //variavel que determina a missão atual (1- coleta de gol, 2- tempo, 3- caça aos mugs)
var missaoColeta = 500, missaoColetaAtual = 0.0; //Gold necessario para completar a missão "Coleta de gold"
var missaoGolpe = 100, missaoGolpeAtual = 0; //Quantidade de golpes necessarios para concluir a missão "Golpes"
var missaoCacaMugs = 50, missaoCacaMugsAtual = 0; //Quantidade de mugs necessarios para completar a missão "Caça aos Mugs"
var missaoTempo = 600, missaoTempoAtual = 0; //segundos necessarios para concluir a missão "Tempo"
var intervaloMissaoTempo = null; //identificador do unico timer da missão Tempo
var qtdMissoes = 5; //Quantidade de missões disponiveis (4 estatísticas + 1 desafio)
var statusMissao = true; //Verifica se a missão pode ser iniciada
var missaoDesafioSub = 0; //tipo do desafio: 1=sem gold, 2=sem habilidades, 3=contra o tempo
var missaoDesafioAlvo = 10, missaoDesafioAtual = 0; //inimigos exigidos / abatidos no desafio
var missaoDesafioTempo = 0; //segundos restantes no desafio contra o tempo
var intervaloDesafio = null; //identificador do unico timer do desafio contra o tempo
var desafioFalhando = false; //evita falha em reentrada durante a troca de missão

// Registra a conclusão de uma missão e devolve a recompensa com o bônus do
// Missionário — o desbloqueio do marco acontece ANTES do cálculo, então a
// própria missão do marco já paga o bônus do nível novo (20/50/100)
function MissaoRecompensaGold(valor) {
	missoesCompletas++;
	if (missoesCompletas >= 20)
		SobeNivelConquistaComp(2, missoesCompletas >= 100 ? 3 : missoesCompletas >= 50 ? 2 : 1);
	return valor * MultiplicadorMissaoConquistaComp();
}

function Missao(){
	if(statusMissao){
		//sorteio uniforme entre 1..qtdMissoes (o arredondamento antigo dava meio peso nas pontas)
		geraMissao = Math.floor(Math.random() * qtdMissoes) + 1;
		missaoAtual = geraMissao;
		statusMissao = false;
		//nova missao comeca do zero
		missaoColetaAtual = 0;
		missaoGolpeAtual = 0;
		missaoCacaMugsAtual = 0;
		missaoTempoAtual = 0;
		missaoDesafioAtual = 0;
		if (missaoAtual === 5) SorteiaDesafio();
	}
	if(missaoAtual==4 && !intervaloMissaoTempo){
		intervaloMissaoTempo = setInterval(MissaoTempo, 1000);
	}
	if(missaoAtual===5 && missaoDesafioSub===3 && !intervaloDesafio){
		intervaloDesafio = setInterval(TickDesafio, 1000);
	}
	UI.updateMission();
}

function MissaoColetaGold(AuxMissao){
	//Verificação de conclusão da missão Coleta de gold
	missaoColetaAtual = missaoColetaAtual+AuxMissao;
	if(missaoColetaAtual>=missaoColeta){
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoColeta / 2));
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
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
	if(missaoGolpeAtual>=missaoGolpe){
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoGolpe));
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Meta de golpes alcançada. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
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
	if(missaoCacaMugsAtual>=missaoCacaMugs){
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoCacaMugs));
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Meta de Mugs derrotados. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
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
	if(missaoTempoAtual>=missaoTempo){
		const goldRecebido = AddGold(MissaoRecompensaGold(missaoTempo / 4));
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Missao Concluida!\nVoce recebeu um bonus de "+FormatGold(goldRecebido)+" de gold");
		UI.showMilestone("Missão concluída", "Meta de tempo alcançada. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoTempo = Math.ceil(missaoTempo*1.5);
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

// ===== Missão 5: desafio com restrição (violou = troca de missão sem recompensa) =====

//Sorteia o tipo do desafio e monta o texto
function SorteiaDesafio() {
	missaoDesafioSub = Math.floor(Math.random() * 3) + 1; //1=sem gold, 2=sem habilidades, 3=contra o tempo
	missaoDesafioTempo = missaoDesafioAlvo * 60; //60 segundos por inimigo exigido
	if (missaoDesafioSub === 1) {
		missao[5] = "Desafio sem gold";
	} else if (missaoDesafioSub === 2) {
		missao[5] = "Desafio sem habilidades";
	} else {
		missao[5] = "Desafio contra o tempo";
	}
}

//Progresso do desafio: contado por abate (igual à Caça aos Mugs)
function MissaoDesafio() {
	if (missaoAtual !== 5) return;
	missaoDesafioAtual++;
	if (missaoDesafioAtual >= missaoDesafioAlvo) {
		//recompensa escala com o andar: mesma base do bônus de avanço ×5 (≈ 5 baús)
		const goldRecebido = AddGold(MissaoRecompensaGold(BonusGoldAvanco() * 5));
		// conquista Destemido: cada desafio vencido conta (marcos 1/3/10)
		desafiosVencidos++;
		SobeNivelConquistaComp(3, desafiosVencidos >= 10 ? 3 : desafiosVencidos >= 3 ? 2 : 1);
		AddTotalGold(goldRecebido, false);
		UI.showInfo("Desafio concluído!\nVoce recebeu um bonus de " + FormatGold(goldRecebido) + " de gold");
		UI.showMilestone("Desafio concluído", "Restrição cumprida. Bônus de Gold recebido");
		UI.showCurrencyReward("gold", goldRecebido);
		missaoDesafioAlvo *= 2;
		UI.render();
		statusMissao = true;
		Missao();
	}
	UI.updateMission();
}

//Falha do desafio: troca a missão sem recompensa (guarda contra reentrada)
function FalhaDesafio(motivo) {
	if (missaoAtual !== 5 || desafioFalhando) return;
	desafioFalhando = true;
	UI.showMilestone("Desafio falhou", motivo + " — nova missão sorteada");
	statusMissao = true;
	Missao();
	desafioFalhando = false;
}

//Timer do desafio contra o tempo (subtipo 3)
function TickDesafio() {
	if (jogoPausado || missaoAtual !== 5 || missaoDesafioSub !== 3) return;
	missaoDesafioTempo--;
	if (missaoDesafioTempo <= 0) {
		FalhaDesafio("Tempo esgotado");
	} else {
		UI.updateMission();
	}
}
