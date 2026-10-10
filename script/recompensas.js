// ===================== RECOMPENSAS ======================================
// Formigas, baus (comum e dourado) e as recompensas que eles concedem.
// APIs globais mantidas para compatibilidade com os scripts classicos.

function QuantidadeFormigas(id) {
	const formiga = FORMIGAS.find(item => item.id === id);
	return formiga ? Math.max(0, Math.floor(Number(window[formiga.contador]) || 0)) : 0;
}

function ConjuntosFormigas(id) {
	return Math.floor(QuantidadeFormigas(id) / 5);
}

function FormigasDesbloqueadas() {
	return Math.max(andar, maxAndar) >= 20;
}

function MultiplicadorDanoFormigas() {
	return 1 + ConjuntosFormigas("vermelhas") * 0.05;
}

function MultiplicadorGoldFormigas() {
	return 1 + ConjuntosFormigas("amarelas") * 0.05;
}

function MultiplicadorGoldBauFormigas() {
	return 1 + ConjuntosFormigas("marrons") * 0.02;
}

function ChanceBauExtraFormigas() {
	return ConjuntosFormigas("marrons") * 0.01;
}

function LimiteTempoOffline(quantidadePretas = QuantidadeFormigas("pretas")) {
	return maxTempoProgressoOffline + Math.floor(quantidadePretas / 5) * 2 * 60 * 1000;
}

function LimiteBausOffline(quantidadeCinzas = QuantidadeFormigas("cinzas")) {
	return maxBausOffline + Math.floor(quantidadeCinzas / 5);
}

function SorteiaFormigas(abates) {
	const resultado = [0, 0, 0, 0, 0];
	if (!FormigasDesbloqueadas()) return resultado;

	let abatesRestantes = Math.max(0, Math.floor(abates));
	while (abatesRestantes > 0) {
		// mesma chance do drop por abate (1% base + 1% por nível da Loja do Conhecimento)
		const distanciaAteDrop = Math.floor(Math.log1p(-Math.random()) / Math.log(1 - ChanceDropFormiga())) + 1;
		if (distanciaAteDrop > abatesRestantes) break;
		abatesRestantes -= distanciaAteDrop;
		resultado[Math.floor(Math.random() * FORMIGAS.length)]++;
	}
	return resultado;
}

function RegistraDropFormiga() {
	if (!FormigasDesbloqueadas() || Math.random() >= ChanceDropFormiga()) return false;
	const formiga = FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)];
	ConcedeFormigaColecao(formiga);
	// Loja do Conhecimento: +1% por nível de o drop sair com 2 formigas (máx 100)
	if (Math.random() < Math.min(cmNivelDuasFormigas, 100) * 0.01) {
		ConcedeFormigaColecao(FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)]);
	}
	return true;
}

function CriaBau(){
	const base = Math.max(0, Math.min(1, Number(chanceBau) || 0));
	// Alquimista: buff de Baú ×3 por 10s; Baú Portátil (itens da build): +15% por cópia
	const chance = Math.min(1, base * MultiplicadorBuffBau() * Tapeira.ItensBuild.multBau());
	if (Math.random() >= chance) return;

	const chanceExtra = ChanceBauExtraFormigas();
	const extrasGarantidos = Math.floor(chanceExtra);
	const extraFracionado = chanceExtra - extrasGarantidos;
	quantidadeBausDisponiveis = 1 + extrasGarantidos
		+ (Math.random() < extraFracionado ? 1 : 0);
	UI.spawnChest(quantidadeBausDisponiveis);
}

function ColetaBau(){
	valida = Math.random();
	quantidadeBausDisponiveis = Math.max(0, quantidadeBausDisponiveis - 1);
	if (quantidadeBausDisponiveis > 0) {
		UI.spawnChest(quantidadeBausDisponiveis);
	} else {
		RemoveBau();
	}
	ChamaSom('audio4');
	// Esmeralda Bruta (itens da build): +50% por cópia na chance de esmeralda
	if(valida<=chanceEsmeraldaBau * Tapeira.ItensBuild.multEsmBau()){
		UI.showChestOpening("normal", "emerald", "Esmeralda encontrada", "+1 Esmeralda", "#72e7c1");
		esmeraldas++;
		document.getElementById("contEmeraldas").innerHTML=esmeraldas;
		UI.showCurrencyReward("emerald", 1);
		UI.showInfo("Recebeu um bonus de 1 esmeralda!");
	}else{
		bonus = ValorGoldBau();
		bonus = AddGold(bonus);
		AddTotalGold(bonus, false);
		UI.showChestOpening("normal", "gold", "Gold encontrado", `+${FormatGold(bonus)} Gold`);
		document.getElementById("contGold").innerHTML = FormatGold(gold);
		UI.showCurrencyReward("gold", bonus);
		UI.showStatus();
		UI.showInfo("Recebeu um bonus de: "+bonus +" gold");
	}
	AutoSaveLocal();
}

// Bônus base de gold do avanço/baú: gold fixo do andar + (vida do andar que vira
// gold). A vida saiu de 2 para 5 (2,5×) e a fração 0.4 mantém o gold exatamente
// igual ao de antes (×2,5 ×0,4 = 1) — único lugar para tunar isso.
function BonusGoldAvanco(){
	const FRACAO_VIDA_GOLD = 0.4;
	return ((andar * mulGold) + (vidaAndar * mulGold) * FRACAO_VIDA_GOLD * mulGoldAvanco);
}

function ValorGoldBau() {
	return (BonusGoldAvanco() * 5)
		* MultiplicadorGoldBauFormigas();
}

function ConcedeFormigaColecao(formiga) {
	window[formiga.contador] = Math.min(Number.MAX_SAFE_INTEGER, window[formiga.contador] + 1);
	UI.showAntReward(formiga);
	UI.showInfo(`Uma formiga ${formiga.singular} entrou para sua coleção!`);
	UI.showMilestone("Nova formiga encontrada", `Formiga ${formiga.singular} adicionada à coleção`);
	if (document.getElementById("antCollectionModal")) UI.showAntCollection();
}

// notificar=false pula os avisos (usado pelo comerciante dos eventos aleatórios)
function CarregaHabilidadesDesbloqueadas(notificar = true) {
	qtdCarregaHabilidade = abateshabilidadeDano;
	VerificaHabilidade();

	habilidadesCombate.forEach(skill => {
		if (maxAndar < skill.unlockFloor) return;
		if (skill.id === "electric") abatesCorrenteEletrica = skill.killsRequired;
		if (skill.id === "gold") abatesBonusGoldAtaque = skill.killsRequired;
		if (skill.id === "escape") abatesPausaFuga = skill.killsRequired;
		if (skill.id === "frenzy") abatesFrenesi = skill.killsRequired;
	});
	AtualizaHabilidadesCombate();
	if (!notificar) return;
	UI.showInfo("Todas as habilidades desbloqueadas estão carregadas!");
	UI.showMilestone("Baú dourado", "Todas as habilidades desbloqueadas foram carregadas");
}

function ColetaBauDourado() {
	if (bauDouradoPendente !== 1) return;

	bauDouradoPendente = 0;
	progressoBauDourado = 0;
	ultimaAtualizacaoBauDourado = Date.now();
	UI.updateGoldenChestProgress();
	ChamaSom("audio4");

	const sorteio = Math.random();
	const formigasDesbloqueadas = FormigasDesbloqueadas();
	const chanceGold = formigasDesbloqueadas ? 0.5 : 0.5 / 0.7;
	const chanceFormiga = formigasDesbloqueadas ? 0.3 : 0;
	if (sorteio < chanceGold) {
		const bonus = ValorGoldBau() * 5;
		const goldRecebido = AddGold(bonus);
		AddTotalGold(goldRecebido, false);
		UI.showChestOpening("golden", "gold", "Grande recompensa!", `+${FormatGold(goldRecebido)} Gold`);
		UI.showCurrencyReward("gold", goldRecebido);
		UI.showInfo(`O baú dourado rendeu ${FormatGold(goldRecebido)} Gold!`);
	} else if (sorteio < chanceGold + chanceFormiga) {
		const formiga = FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)];
		UI.showChestOpening("golden", "ant", "Nova formiga!", `Formiga ${formiga.singular}`, formiga.cor);
		ConcedeFormigaColecao(formiga);
	} else {
		UI.showChestOpening("golden", "skills", "Skills recarregadas", "Todas as habilidades desbloqueadas estão prontas");
		CarregaHabilidadesDesbloqueadas();
	}

	if (!AutoSaveLocal()) {
		UI.showInfo("A recompensa do baú dourado foi recebida, mas não foi possível salvar o progresso.");
	}
}

function RemoveBau(){
	quantidadeBausDisponiveis = 0;
	UI.removeChest();
}
