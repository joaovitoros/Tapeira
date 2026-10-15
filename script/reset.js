// ===================== RESET / PORTÕES DE ANDAR =====================
// Portões de dano permanente (múltiplos de 5 a partir do 35), o reset
// (VoltaAndar), o modal de confirmação (PedeReset/ConfirmaReset) e o painel
// "manter no andar". Extraído de script.js byte a byte (ver REFATORACAO.md).
// ====================================================================
// Portões de dano permanente: múltiplos de 5 a partir do andar 35. Cada portão
// paga +5% UMA única vez — gateDanoPago só avança, então nunca se paga de novo.
function GatesDanoPendentes(piso){
	const primeiro = Math.max(35, gateDanoPago + 5);
	const ate = Math.floor(piso / 5) * 5;
	if (ate < primeiro) return 0;
	return Math.floor((ate - primeiro) / 5) + 1;
}

// Paga de uma vez todos os portões não reivindicados até o piso do reset
// (resetar no 45 com o 40 pendente = +10%; os dois ficam gastos pra sempre)
function PagaDanoReset(piso){
	const qtd = GatesDanoPendentes(piso);
	if (qtd <= 0) return 0;
	const primeiro = Math.max(35, gateDanoPago + 5);
	gateDanoPago = primeiro + (qtd - 1) * 5;
	danoResetQtd = danoResetQtd + qtd;
	return Math.round(qtd * PORTAO_BONUS * 100);
}

// Esmeraldas neste reset? Portões de esmeralda (≡5 em 10: 15/25/35/45/55...)
// continuam iguais; intermediários (40, 50...) só dão dano. Se o reset cobre
// 2+ portões, algum é de esmeralda ⇒ dá esmeraldas (nunca se perde).
function EhPortaoEsmeralda(piso){
	const primeiro = Math.max(35, gateDanoPago + 5);
	const ate = Math.floor(piso / 5) * 5;
	if (ate < primeiro) return andarVolta % 10 === 5; // fase antiga: 15/25/35
	if (ate === primeiro) return ate % 10 === 5;
	return true;
}

function VoltaAndar(){
	// reset livre a partir do andar 20; portão de reset quando andar >= andarVolta
	if(andar>=Math.min(andarVolta, 20)){
		const andarAnterior = andar;
		const ehPortao = andar >= andarVolta;
		// bônus de dano: cada portão >= 35 paga +5% uma vez só (com acumulado)
		// reset livre (sem portão) não reivindica esmeralda nem dano
		const ehPortaoEsmeralda = ehPortao && EhPortaoEsmeralda(andar);
		const danoRecebido = ehPortao ? PagaDanoReset(andar) : 0;
		let esmeraldasRecebidas = 0;
		if(ehPortaoEsmeralda && andar>=maxAndar){
			numVoltas++;
			esmeraldasRecebidas = numVoltas;
			esmeraldas = esmeraldas+numVoltas;
		}else if(ehPortaoEsmeralda){
			var auxEsmeraldas = Math.round(esmeraldas/andar);
			
			if(auxEsmeraldas<1){
				auxEsmeraldas=1;
			}
			esmeraldasRecebidas = auxEsmeraldas;
			esmeraldas = esmeraldas+auxEsmeraldas;
		}
		
		// portão avança: pós-35 = próximo portão não reivindicado (+5); antes = +10.
		// reset livre mantém andarVolta como está (o portão continua pendente)
		if (ehPortao) {
			if (danoRecebido > 0) {
				andarVolta = gateDanoPago + 5;
			} else {
				andarVolta = andarVolta + 10;
			}
		}
		
		// Conhecimento Mug: a partir do andar 20, 1 abate desta run = 1 CM
		// (o item da loja de esmeraldas "CM em dobro" duplica o ganho)
		let cmRecebido = 0;
		if (andarAnterior >= 20) {
			// sobra de pontos (andar 65+): ×(1 + 1% por ponto na mão) — feito
			// AQUI, antes do Resetar zerar pontosHabilidade
			cmRecebido = Math.round(derrotadosRun * MultiplicadorCM() * BonusCMPontosSobra());
			conhecimentoMug = conhecimentoMug + cmRecebido;
			AtualizaHUDConhecimento();
		}
		// Reset curto: reset feito PERTO do recorde — até 10 andares antes
		// dele (recorde 97, reset no 88 = 9 andares → conta; no 20 → não) —
		// dá +5% no multiplicador de CM, permanente e acumulativo, mas só a
		// partir do PRÓXIMO reset (a conversão acima já usou o valor anterior)
		const resetCurto = maxAndar - andarAnterior <= 10;
		if (resetCurto) resetsCurtosCM = Math.min(10000, resetsCurtosCM + 1);
		
		andar=1;
		qtdInimigosAndar=1;
		mulGold = mulGoldInicial;
		mulGold = mulGold*1.25;

		if(lvlComp2>0){
			goldCompanheiro = GoldCompanheiroPorSegundo();
		}
		
		// conquista Velocista: reset feito com a run abaixo de 10 minutos no
		// andar 30×nível — um reset profundo carrega todos os níveis de uma
		// vez (o Resetar logo abaixo reinicia o cronômetro da nova run)
		if (Date.now() - runInicioMs < 10 * 60 * 1000 && andarAnterior >= 30)
			SobeNivelConquistaComp(0, Math.floor(andarAnterior / 30));
		Resetar(); // zera derrotadosRun (a conversão em CM já foi feita acima)
		RemoverInimigos();
		Batalha();
		if (esmeraldasRecebidas > 0) UI.showCurrencyReward("emerald", esmeraldasRecebidas);
		if (cmRecebido > 0) UI.showInfo("Você ganhou " + cmRecebido + " Conhecimento Mug!");
		if (resetCurto) UI.showMilestone("Reset curto!", "+5% permanente no multiplicador de CM (agora ×" + FormataMultCM() + ")");
		UI.MostraCelebracaoReset(esmeraldasRecebidas, andarAnterior, andarVolta, danoRecebido, cmRecebido);
		UI.updateResetAviso();
		if (TutorialComp1Pendente()) MostraTutorialComp1();
	}else{
		UI.showInfo("É necessario chegar no andar "+Math.min(andarVolta, 20)+" para poder voltar");
	}
}

// Pede confirmação antes de resetar; se ainda não pode voltar, só avisa (fluxo antigo)
function PedeReset() {
	if (andar < Math.min(andarVolta, 20)) {
		VoltaAndar();
		return;
	}

	const ehPortao = andar >= andarVolta;
	const ehPortaoEsmeralda = ehPortao && EhPortaoEsmeralda(andar);
	let premio = 0;
	if (ehPortaoEsmeralda) {
		if (andar >= maxAndar) {
			// recorde: recompensa igual à que VoltaAndar vai dar (numVoltas + 1)
			premio = numVoltas + 1;
		} else {
			premio = Math.max(1, Math.round(N(esmeraldas) / andar));
		}
	}

	const total = N(esmeraldas) + premio;
	const pendentes = GatesDanoPendentes(andar);
	const danoPendente = Math.round(pendentes * PORTAO_BONUS * 100);
	const cmRecebido = andar >= 20 ? Math.round(derrotadosRun * MultiplicadorCM() * BonusCMPontosSobra()) : 0;
	// sobra de pontos (andar 65+): o × extra aparece na linha do preview
	const bonusPontosCM = BonusCMPontosSobra();
	// próximo portão; o reset fica livre a partir do andar 20 em qualquer run
	const proximoPortao = pendentes > 0
		? Math.max(35, gateDanoPago + 5) + danoPendente
		: (ehPortao ? andarVolta + 10 : andarVolta);

	UI.showModal("Voltar ao 1º andar?", `
		<div class="modal-tutorial-texto">
			Você está no andar <b>${andar}</b> e voltará para o <b>1º andar</b>
			${ehPortaoEsmeralda ? "ganhando esmeraldas no caminho" : ehPortao ? "coletando o bônus de dano permanente" : "convertendo seus abates em Conhecimento Mug"}.
		</div>

		<div class="modal-tutorial-info">
			<span>Recompensa: <b>${premio > 0 ? "+" + premio + " esmeralda" + (premio === 1 ? "" : "s") : ehPortao ? "sem esmeraldas (portão intermediário)" : "sem esmeraldas (reset livre)"}</b></span>
			${danoPendente > 0 ? `<span>Bônus: <b>+${danoPendente}% de dano permanente</b></span>` : ""}
			${cmRecebido > 0 ? `<span>Conhecimento Mug: <b>+${cmRecebido} CM</b> (${derrotadosRun} abates × ${FormataMultCM()}${bonusPontosCM > 1 ? " × " + bonusPontosCM.toFixed(2).replace(".", ",") + " pela sobra de pontos" : ""})</span>` : ""}
			<span>Total de esmeraldas: <b>${total}</b></span>
		</div>

		<div class="reset-confirm-lista">
			<div><span class="reset-tag reset-tag--reseta">Reseta</span> gold, loja de gold, nível/XP, habilidades e perks</div>
			<div><span class="reset-tag reset-tag--fica">Fica</span> esmeraldas, loja de esmeraldas, conquistas, conhecimento mug e bônus de dano de reset · base de gold +25%</div>
			<div><span class="reset-tag reset-tag--prox">Próximo</span> reset livre no andar 20${proximoPortao > 20 ? " · portão no andar " + proximoPortao : ""}</div>
		</div>

		<div class="reset-confirm-acoes">
			<button type="button" class="btn-Padrao btn-reset-confirmar" data-reset-confirmar>Confirmar reset</button>
			<button type="button" class="btn-Padrao btn-reset-cancelar" data-reset-cancelar>Cancelar</button>
		</div>
	`);
}

function ConfirmaReset() {
	const modal = document.getElementById("gameModal");
	if (modal) modal.remove();
	VoltaAndar();
}

//funçoes de controles das missoes
function AlternaManterAndar(){
	const chk = document.getElementById("manterAndar");
	if(!chk) return;
	if(chk.checked && andar <= 4){
		chk.checked = false;
		UI.showInfo("Só pode ser ativado a partir do andar 5");
		return;
	}
	UI.showInfo(chk.checked ? "Manter no andar ativado: voce vai ficar farmando neste andar." : "Manter no andar desativado: avanco automatico reativado.");
}

// Painel de reset: checkbox "manter no andar" e botão "voltar andar" por
// addEventListener (sem onclick inline no HTML).
document.addEventListener("DOMContentLoaded", () => {
	const manter = document.getElementById("manterAndar");
	if (manter) manter.addEventListener("change", () => AlternaManterAndar());
	const voltar = document.getElementById("btnAndar");
	if (voltar) voltar.addEventListener("click", () => PedeReset());
});

// Botões do modal de reset (markup dinâmico): delegados no document.
document.addEventListener("click", (e) => {
	if (!(e.target instanceof Element)) return;
	if (e.target.closest("[data-reset-confirmar]")) {
		ConfirmaReset();
		return;
	}
	if (e.target.closest("[data-reset-cancelar]")) UI.closeModal();
});

