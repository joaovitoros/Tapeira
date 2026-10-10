// ===================== CONQUISTAS ========================================
// Conquistas classicas e comportamentais e seus multiplicadores.
// APIs globais mantidas para compatibilidade com os scripts classicos.

//funçoes de controle das conquistas
function Conquistas(){
	if(totalDerrotados>=progressoConquistaDano ){
		progressoConquistaDano = progressoConquistaDano*2;
		if(validaConquista==1){
			// ×1.1: +10% sobre o ganho de antes e a 1ª conquista (100 kills, fator 1.0) deixa de ser sem efeito
			const fatorDano = ((1+(totalDerrotados/100))/2) * 1.1;
			danoJogador = danoJogador*fatorDano;
			danoCritJogador = danoCritJogador+(danoJogador*(2+sobeDCrit));
			bonusCritConquista = bonusCritConquista + (danoJogador*(2+sobeDCrit));
			danoBonus = danoBonus + fatorDano;
			if(lvlComp1>0){
				danoComp = danoJogador*danoComp1;
			}
			validaConquista++;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano recebido");
		} else if(validaConquista==2){
			goldAux = gold + BonusGoldAvanco() * 2;
			const bonusGoldConquista = goldAux*(totalDerrotados/100);
			const goldRecebido = AddGold(bonusGoldConquista);
			AddTotalGold(goldRecebido, false);
			UI.showCurrencyReward("gold", goldRecebido);
			validaConquista++;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de gold");
			UI.showMilestone("Conquista desbloqueada", "Bônus de Gold recebido");
		}else{
			// ×0.75: crítico ganha 25% a menos que antes
			const fatorCrit = ((1+(totalDerrotados/100))/2) * 0.75;
			bonusCritConquista = bonusCritConquista + danoCritJogador*(fatorCrit-1);
			danoCritJogador = danoCritJogador*fatorCrit;
			validaConquista = 1;
			UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano critico");
			UI.showMilestone("Conquista desbloqueada", "Bônus de dano crítico recebido");
		}
		LimitaDanoCritico();
		UI.render();
	}
	
	if(totalGold>=progressoConquistaGold){
		progressoConquistaGold = progressoConquistaGold*5;
		
		precoDano = precoDano*0.995;
		precoBau = precoBau*0.995;
		precoBEspaco = precoBEspaco*0.995;
		precoGold = precoGold*0.995;
		precoAvan = precoAvan*0.995;
		precoDCrit = precoDCrit*0.995;
		precoCCrit = precoCCrit*0.995;
		precoQTDAvanco = precoQTDAvanco*0.995;
		UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de -0,5% nos preços da loja!");
		UI.showMilestone("Conquista de Gold", "Desconto de 0,5% liberado na loja");
		descontoLoja = descontoLoja+0.005;
		AbreLoja();
		AbreLoja();
	}
}

// ===== Conquistas comportamentais (Tier 4 #1) =====
// Recompensam estilo de jogo (não totais): desbloqueio único e permanente —
// os flags vivem no save e não zeram no Resetar (só no ZerarTodosSaves);
// runInicioMs/comprasRun são os trackers desta run (zeram no Resetar).
const CONQUISTAS_COMP = [
	{ id: "velocista", nome: "Velocista", desc: "Reset com a run abaixo de 10 minutos no andar 30×nível", recompensa: "+5% de dano permanente por nível", max: 10, passo: 30 },
	{ id: "poupado", nome: "Poupado", desc: "Chegue ao andar 25×nível sem comprar nada na loja de gold", recompensa: "+5% de gold permanente por nível", max: 10, passo: 25 },
	{ id: "missionario", nome: "Missionário", desc: "Conclua 20/50/100 missões", recompensa: "+25% no gold de toda missão por nível", max: 3, marcos: [20, 50, 100] },
	{ id: "destemido", nome: "Destemido", desc: "Vença 1/3/10 desafios da missão 5", recompensa: "+5 s no tempo de fuga por nível", max: 3, marcos: [1, 3, 10] },
	{ id: "milionario", nome: "Milionário", desc: "Acumule 1M/10M/100M de gold numa única run", recompensa: "+10% de XP permanente por nível", max: 3, marcos: [1e6, 1e7, 1e8] },
];

function NivelConquistaComp(indice) {
	const v = conquistasComp[indice];
	return Number.isInteger(v) && v > 0 ? v : 0;
}

function TemConquistaComp(indice) {
	return NivelConquistaComp(indice) > 0;
}

// Recompensas — cada uma aplicada num único ponto de fórmula, escalando
// linear por nível (save 0/1 antigo = nível 1 = efeito igual ao de antes):
function MultiplicadorDanoConquistaComp() { return 1 + 0.05 * NivelConquistaComp(0); } //Velocista → MultiplicadorDanoNivel
function MultiplicadorGoldConquistaComp() { return 1 + 0.05 * NivelConquistaComp(1); } //Poupado → AddGold
function MultiplicadorMissaoConquistaComp() { return 1 + 0.25 * NivelConquistaComp(2); } //Missionário → MissaoRecompensaGold
function BonusFugaConquistaComp() { return 5 * NivelConquistaComp(3); } //Destemido → TempoFugaMax
function MultiplicadorXPConquistaComp() { return 1 + 0.10 * NivelConquistaComp(4); } //Milionário → GanhaXP

// Sobe a conquista até o nível alvo (um milestone por nível novo; idempotente
// — quem já tem o save 0/1 antigo mantém o que tinha e sobe pelos marcos)
function SobeNivelConquistaComp(indice, nivelAlvo) {
	const c = CONQUISTAS_COMP[indice];
	const atual = NivelConquistaComp(indice);
	const alvo = Math.min(Math.max(0, Math.floor(nivelAlvo)), c.max);
	if (alvo <= atual) return false;
	conquistasComp[indice] = alvo;
	if (atual === 0) {
		UI.showInfo("Conquista desbloqueada!\n" + c.nome + ": " + c.recompensa);
	}
	for (let n = atual + 1; n <= alvo; n++) {
		UI.showMilestone("Conquista: " + c.nome + " — nível " + n, c.recompensa);
	}
	return true;
}

// Checagens periódicas (roda junto com Conquistas(), a cada golpe e subida de andar)
function ConquistasComportamentais() {
	if (GE(totalGold, melhorGoldRun)) melhorGoldRun = new GoldNumber(totalGold);
	// Poupado: andar 25×nível sem nenhuma compra de gold na run
	if (comprasRun === 0 && andar >= 25) SobeNivelConquistaComp(1, Math.floor(andar / 25));
	// Milionário: 1M/10M/100M de gold numa run — a melhor run serve de base,
	// então marcos já vencidos no passado contam no primeiro golpe pós-load
	if (GE(melhorGoldRun, 1e6))
		SobeNivelConquistaComp(4, GE(melhorGoldRun, 1e8) ? 3 : GE(melhorGoldRun, 1e7) ? 2 : 1);
}

// Texto de progresso da tela de Conquistas para as conquistas ainda não no máximo
function ProgressoConquistaComp(indice) {
	const c = CONQUISTAS_COMP[indice];
	const nivel = NivelConquistaComp(indice);
	if (nivel >= c.max) return "nível máximo";
	if (indice === 0) {
		const minutos = Math.max(0, (Date.now() - runInicioMs) / 60000);
		return "próximo nível: reset abaixo de 10 min no andar " + (c.passo * (nivel + 1))
			+ " · run atual em " + minutos.toFixed(1) + " min"
			+ (minutos >= 10 ? " (nesta run já passou do tempo)" : "");
	}
	if (indice === 1) {
		return "próximo nível: andar " + (c.passo * (nivel + 1)) + " sem comprar · nesta run: andar "
			+ andar + " · " + comprasRun + " compra(s)" + (comprasRun > 0 ? " (quebra nesta run)" : "");
	}
	if (indice === 2) return missoesCompletas + " de " + c.marcos[nivel] + " missões concluídas";
	if (indice === 3) return desafiosVencidos + " de " + c.marcos[nivel] + " desafios vencidos";
	if (indice === 4) return "melhor run: " + FormatGold(melhorGoldRun) + " de " + FormatGold(c.marcos[nivel]);
	return "";
}
