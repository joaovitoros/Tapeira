// ===================== HABILIDADES E PROGRESSAO ========================
// Dados e regras de XP, habilidades de combate e perks.
// APIs globais mantidas para compatibilidade com scripts classicos.

var perkDano = 0; //níveis de perk do Dano automático (+25% de dano cada, máx 4)
var perkEletrica = 0; //níveis de perk da Corrente elétrica (+1 inimigo atingido cada, máx 3)
var perkGold = 0; //níveis de perk do Bônus de Gold (+25% no drop do kill com skill ativa cada, máx 4)
var perkFuga = 0; //níveis de perk da Pausa da fuga (10% de restaurar o tempo de fuga cada, máx 50%)
var perkFrenesi = 0; //níveis de perk do Toque Frenético (+25% no dano do toque durante a janela cada, máx 4)

var qtdCarregaHabilidade = 0; //Quantidade de inimigos derrotados para carregar Habilidade
var abateshabilidadeDano = 15; //Quantidade necessaria para usar habilidade dano
var tempoHabilidadeDano = 30; // tempo de duraçao da habilidade dano
var verificaHabilidadeDano = false;
var abatesCorrenteEletrica = 0;
var ataquesCorrenteEletrica = 0;
var abatesBonusGoldAtaque = 0;
var ataquesBonusGold = 0;
var abatesPausaFuga = 0;
var segundosPausaFuga = 0;
var abatesFrenesi = 0; //toques que carregam o Toque Frenético (só cliques do jogador; não são abates)
var ataquesFrenesi = 0; //toques restantes da janela ativa do Toque Frenético
var nivelJogador = 1;
var xpAtual = 0;
var pontosHabilidade = 0;
var nivelSkillDano = 0;
var nivelSkillEletrica = 0;
var nivelSkillGold = 0;
var nivelSkillFuga = 0;
var nivelSkillFrenesi = 0;
const NIVEL_MAXIMO_SKILLS = 10;
const SKILLS_UPGRADE = [
	{ id: "damage", nome: "Dano automático", pisoDesbloqueio: 1, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillDano", ramo: "ramoSkillDano" },
	{ id: "electric", nome: "Corrente elétrica", pisoDesbloqueio: 15, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillEletrica", ramo: "ramoSkillEletrica" },
	{ id: "gold", nome: "Bônus de Gold", pisoDesbloqueio: 25, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillGold", ramo: "ramoSkillGold" },
	{ id: "escape", nome: "Pausa da fuga", pisoDesbloqueio: 35, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillFuga", ramo: "ramoSkillFuga" },
	{ id: "frenzy", nome: "Toque Frenético", pisoDesbloqueio: 45, maximo: NIVEL_MAXIMO_SKILLS, nivel: "nivelSkillFrenesi", ramo: "ramoSkillFrenesi" }
];
// Perks: 1 ponto por portão alcançado no pico de andar desta run (>= 35).
// O nível de perk é por run (zeramos no reset) e independe do nível da skill.
const PERKS = [
	{ skillId: "damage", varName: "perkDano", nome: "Dano automático", efeito: "+25% de dano por nível; no nível máximo a skill ativa sozinha quando carregada", maximo: 4 },
	{ skillId: "electric", varName: "perkEletrica", nome: "Corrente elétrica", efeito: "+1 inimigo atingido por nível", maximo: 3 },
	{ skillId: "gold", varName: "perkGold", nome: "Bônus de Gold", efeito: "+25% no drop do kill feito com a skill ativa por nível; do nível 1 em diante o companheiro também usa a skill ativa", maximo: 4 },
	{ skillId: "escape", varName: "perkFuga", nome: "Pausa da fuga", efeito: "10% de restaurar o tempo de fuga por nível (máx 50%)", maximo: 5 },
	{ skillId: "frenzy", varName: "perkFrenesi", nome: "Toque Frenético", efeito: "+25% no dano do toque durante a janela por nível", maximo: 4 }
];

// +1 no MultiplicadorCM a cada 50 níveis do jogador. marcosNivel50 guarda
// quantos marcos já foram reivindicados e NÃO zera no Resetar: resetar e
// chegar de novo no mesmo marco não paga de novo — só o próximo múltiplo
// de 50 (100, 150, ...) paga. Retorna quantos marcos foram reivindicados.
function ConfereMarcosNivel50() {
	const atual = Math.max(0, Math.floor(Number(marcosNivel50) || 0));
	const alvo = Math.floor(Math.max(1, Math.floor(Number(nivelJogador) || 1)) / 50);
	if (alvo <= atual) return 0;
	marcosNivel50 = alvo;
	return alvo - atual;
}

function LimitaDanoCritico() {
	const danoNormal = Number(danoJogador);
	const danoCritico = Number(danoCritJogador);
	if (!Number.isFinite(danoNormal) || !Number.isFinite(danoCritico)) return;
	danoCritJogador = Math.min(Math.max(danoNormal, danoCritico), danoNormal * multiplicadorMaximoDanoCritico);
}

// Sobe o teto do crítico — passo parametrizado: a loja de gold sobe +0,1 por
// compra (default) e a Loja do Conhecimento sobe +0,2 por nível.
// Arredonda pra 1 casa: somar 0,1 repetidamente acumula erro de flutuante.
function SobeTetoCritico(passo = 0.1) {
	multiplicadorMaximoDanoCritico = Math.round((multiplicadorMaximoDanoCritico + passo) * 10) / 10;
}

//Funçoes de habildiades

function VerificaHabilidade(){
	if(qtdCarregaHabilidade==abateshabilidadeDano && !document.getElementById("habilidade1")){
		// perk do Dano automático no nível máximo: ativa sozinha quando carregada
		if (PerkNoMaximo("damage")) {
			UsaHabilidadeDano();
			return;
		}
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
	// ícone pode não existir quando a ativação é automática (perk no máximo)
	document.getElementById("habilidade1")?.remove();
	ChamaSom('audio5');
	verificaHabilidadeDano = true;
	tempoHabilidadeDano = DuracaoHabilidadeDano();
	qtdCarregaHabilidade = 0;
	UI.updateSkillProgress();
}

const habilidadesCombate = [
	{ id: "electric", unlockFloor: 15, killsRequired: 20 },
	{ id: "gold", unlockFloor: 25, killsRequired: 30 },
	{ id: "escape", unlockFloor: 35, killsRequired: 15 },
	// frenzy: "killsRequired" na verdade é a carga em TOQUES (Bater() com
	// ataqueJogador) — 40 cliques manuais carregam a janela do Toque Frenético
	{ id: "frenzy", unlockFloor: 45, killsRequired: 40 }
];

function PisoMaximoAlcancado() {
	return Math.max(andar, maxAndar);
}

function XPNecessarioProximoNivel(nivel = nivelJogador) {
	return 50 + 25 * Math.max(0, nivel - 1);
}

// Bônus por nível do jogador: a cada nível ganho, +10% de dano e
// −1 inimigo exigido para avançar de andar (quota mínima de 1).
// ×1,05 da conquista Velocista entra no mesmo ponto único (status, DPS e
// golpes saem sempre coerentes).
function MultiplicadorDanoNivel() {
	return (1 + Math.max(0, nivelJogador - 1) * 0.1) * MultiplicadorDanoConquistaComp();
}

function QuotaAndar() {
	const bonusNivel = Math.max(0, nivelJogador - 1);
	const bonusConquista = Math.floor(Math.max(0, totalNiveis | 0) / 100);
	// mínimo de 1: mesmo com bônus acumulados, nunca avança sem pelo menos um abate
	return Math.max(1, qtdInimigosAndar - bonusNivel - bonusConquista);
}

// Bônus do item de XP da loja de esmeraldas: cada nível soma o próprio
// número no XP por abate (nível 1 = +1, nível 2 = +2 a mais → +3,
// nível 3 = +6 … = 1+2+…+N)
function BonusXPLoja(nivel = lvlXP) {
	const n = Math.max(0, Math.floor(Number(nivel) || 0));
	return n * (n + 1) / 2;
}

function XPPorInimigo(piso = andar) {
	// bônus acumulado da loja de esmeraldas + base + piso
	return BonusXPLoja() + 1 + Math.floor((Math.max(1, piso) - 1) / 10);
}

function GanhaXP(abates, piso = andar, xpFixo) {
	if (!Number.isFinite(piso) || piso < 1
		|| (xpFixo === undefined && (!Number.isSafeInteger(abates) || abates < 0))) {
		throw new TypeError("Abates e andar precisam ser inteiros válidos para calcular experiência.");
	}
	const limiteXP = Number.MAX_SAFE_INTEGER - xpAtual;
	const xpPorAbate = XPPorInimigo(piso);
	const xpCalculado = xpFixo !== undefined
		? xpFixo
		: abates >= Math.ceil(limiteXP / xpPorAbate)
			? limiteXP
			: abates * xpPorAbate;
	// +2% de XP por nível da Loja do Conhecimento e +10% da conquista
	// Milionário (arredonda pra baixo e respeita o teto de XP restante)
	// Grimório Estelar (itens da build): +20% por cópia no XP por abate
	const xpBase = Math.min(limiteXP, Math.floor(xpCalculado * BonusXPConhecimento() * MultiplicadorXPConquistaComp() * Tapeira.ItensBuild.multXP()));
	if (!Number.isSafeInteger(xpBase) || xpBase < 0) {
		throw new TypeError("A quantidade de experiência precisa ser um inteiro não negativo.");
	}
	const xpGanho = Math.min(limiteXP, xpBase);
	if (xpGanho <= 0) return 0;

	const xpDisponivel = xpAtual + xpGanho;
	const coeficienteLinear = 2 * nivelJogador + 1;
	let niveisGanhos = Math.max(0, Math.floor(
		(Math.sqrt(coeficienteLinear ** 2 + 8 * xpDisponivel / 25) - coeficienteLinear) / 2
	));
	const custoNiveis = quantidade =>
		12.5 * quantidade * (2 * nivelJogador + quantidade + 1);
	while (niveisGanhos > 0 && custoNiveis(niveisGanhos) > xpDisponivel) niveisGanhos--;
	while (custoNiveis(niveisGanhos + 1) <= xpDisponivel) niveisGanhos++;

	xpAtual = xpDisponivel - custoNiveis(niveisGanhos);
	if (niveisGanhos > 0) {
		nivelJogador = Math.min(Number.MAX_SAFE_INTEGER, nivelJogador + niveisGanhos);
		pontosHabilidade = Math.min(Number.MAX_SAFE_INTEGER, pontosHabilidade + niveisGanhos);
		const marcosGanhos = ConfereMarcosNivel50();
		const conquistaAntes = Math.floor(Math.max(0, totalNiveis | 0) / 100);
		totalNiveis = Math.min(Number.MAX_SAFE_INTEGER, (totalNiveis | 0) + niveisGanhos);
		UI.showMilestone(
			niveisGanhos === 1 ? "Nível aumentado!" : `${niveisGanhos} níveis aumentados!`,
			`Você alcançou o nível ${nivelJogador} e recebeu ${niveisGanhos} ${niveisGanhos === 1 ? "ponto de habilidade" : "pontos de habilidade"}. Bônus: +${niveisGanhos * 10}% de dano e −${niveisGanhos} ${niveisGanhos === 1 ? "inimigo" : "inimigos"} para avançar.`
		);
		if (marcosGanhos > 0) {
			UI.showInfo(`Marco de 50 níveis!\n+${marcosGanhos} no multiplicador de CM no reset (×${FormataMultCM()}).`);
		}
		if (Math.floor(totalNiveis / 100) > conquistaAntes) {
			UI.showInfo("Conquista desbloqueada!\nA cada 100 níveis: -1 inimigo necessário para avançar!");
		}
		// Auto-gasto (andar 55+): o ponto que acabou de entrar já sai gasto
		// numa skill aleatória — sem o toggle nada muda (função é no-op)
		AutoGastaPontos();
		UI.updateObjective();
	}

	UI.showXPGain(xpGanho);
	UI.updateSkillProgress();
	// com o painel de skills aberto, só re-renderiza quando o level sobe
	// (muda pontos e botões); matar inimigo sem subir não pode resetar a
	// tela — e mesmo no re-render a rolagem é preservada (ver ui.js)
	if (niveisGanhos > 0 && document.getElementById("skillUpgradeModal")) UI.showSkillUpgradePanel();
	return xpGanho;
}

function NivelDaSkill(id) {
	const skill = SKILLS_UPGRADE.find(item => item.id === id);
	return skill ? Math.max(0, Math.floor(Number(window[skill.nivel]) || 0)) : 0;
}

// efeito atual da skill no nível informado, já com o bônus do ramo da
// árvore escolhido (nível + ramo vêm do estado real da run)
function DescricaoEfeitoSkill(id, nivel = NivelDaSkill(id)) {
	if (id === "damage") return `Duração: ${Math.round((30 + nivel * 5) * FatorRamo("damage", 2, 1.5))} s (+5 s por nível).`;
	if (id === "electric") {
		const fator = FatorRamo("electric", 1, 1.5);
		const alvos = 1 + perkEletrica + RamoAlvosCorrente();
		return `Dano encadeado: ${Math.round((25 + nivel * 5) * fator)}% em ${alvos} ${alvos === 1 ? "alvo" : "alvos"} · bônus sem alvo próximo: ${Math.round((10 + nivel * 2) * fator)}%.`;
	}
	if (id === "gold") return `Gold extra por ataque: ${Math.round((35 + nivel * 5) * FatorRamo("gold", 1, 1.5))}% · carga: ${DuracaoSkillGold()} ataques.`;
	if (id === "frenzy") return `Multiplicador do toque: ×${(2 + nivel * 0.15).toFixed(2).replace(".", ",")} · janela: ${DuracaoJanelaFrenesi()} toques.`;
	return `Pausa da fuga: ${Math.round((10 + nivel * 2) * FatorRamo("escape", 2, 1.5))} s (+2 s por nível).`;
}

// Toque Frenético: multiplicador do toque durante a janela, lido no tempo do
// golpe. Base 2 + 0,15 por nível (×2,15 no nv1 … ×3,50 no nv10), ×1,5 por nó
// do ramo 1 (Calor) e +25% por nível do perk (máx 4) — tudo multiplicativo.
function MultiplicadorToqueFrenesi() {
	return (2 + NivelDaSkill("frenzy") * 0.15) * FatorRamo("frenzy", 1, 1.5) * (1 + 0.25 * perkFrenesi);
}

function EvoluiSkill(id) {
	const skill = SKILLS_UPGRADE.find(item => item.id === id);
	if (!skill || PisoMaximoAlcancado() < skill.pisoDesbloqueio
		|| pontosHabilidade <= 0 || NivelDaSkill(id) >= skill.maximo) return false;

	window[skill.nivel]++;
	pontosHabilidade--;
	UI.updateSkillProgress();
	UI.showInfo(`${skill.nome} melhorada para o nível ${NivelDaSkill(id)}.`);
	if (!AutoSaveLocal()) {
		UI.showInfo("A melhoria foi aplicada, mas não foi possível salvar o progresso localmente.");
	}
	return true;
}

// true se o perk da skill está no nível máximo
function PerkNoMaximo(skillId){
	const perk = PERKS.find(item => item.skillId === skillId);
	return !!perk && (Number(window[perk.varName]) || 0) >= perk.maximo;
}

// Aplica 1 ponto de perk na skill (por run; pontos vêm do pico de andar desta run >= 35)
function CompraPerk(skillId){
	const perk = PERKS.find(item => item.skillId === skillId);
	if (!perk) return false;
	const nivel = Number(window[perk.varName]) || 0;
	if (nivel >= perk.maximo || PontosPerkDisponiveis() <= 0) return false;

	window[perk.varName] = nivel + 1;
	// perk do Dano automático chegou no máximo com a skill já carregada: ativa na hora
	if (perk.varName === "perkDano" && PerkNoMaximo("damage")
		&& qtdCarregaHabilidade >= abateshabilidadeDano) {
		UsaHabilidadeDano();
	}
	UI.showInfo(`${perk.nome}: perk de nível ${nivel + 1}/${perk.maximo} aplicado! (${perk.efeito})`);
	if (!AutoSaveLocal()) {
		UI.showInfo("O perk foi aplicado, mas não foi possível salvar o progresso localmente.");
	}
	return true;
}

function AtualizaHabilidadesCombate() {
	const panel = document.getElementById("skill-unlock-panel");
	if (!panel) return;

	const unlockedSkills = habilidadesCombate.filter(skill => maxAndar >= skill.unlockFloor);
	panel.hidden = unlockedSkills.length === 0;

	habilidadesCombate.forEach(skill => {
		const button = document.getElementById(`skill-${skill.id}`);
		const progress = document.getElementById(`skill-${skill.id}-progress`);
		const meter = document.getElementById(`skill-${skill.id}-meter`);
		if (!button || !progress || !meter) return;

		const unlocked = maxAndar >= skill.unlockFloor;
		button.hidden = !unlocked;
		button.disabled = !unlocked || (skill.id === "electric" && ataquesCorrenteEletrica > 0)
			|| (skill.id === "gold" && ataquesBonusGold > 0)
			|| (skill.id === "escape" && segundosPausaFuga > 0)
			|| (skill.id === "escape" && fugaEmAndamento)
			|| (skill.id === "frenzy" && ataquesFrenesi > 0);

		if (!unlocked) return;

		const kills = skill.id === "electric" ? abatesCorrenteEletrica
			: skill.id === "gold" ? abatesBonusGoldAtaque
				: skill.id === "frenzy" ? abatesFrenesi
					: abatesPausaFuga;
		const active = skill.id === "electric" ? ataquesCorrenteEletrica
			: skill.id === "gold" ? ataquesBonusGold
				: skill.id === "frenzy" ? ataquesFrenesi
					: segundosPausaFuga;
		const activeDuration = skill.id === "electric" ? 20
			: skill.id === "gold" ? DuracaoSkillGold()
				: skill.id === "frenzy" ? DuracaoJanelaFrenesi()
					: DuracaoPausaFuga();
		const meterPercent = active > 0
			? active / activeDuration * 100
			: kills / skill.killsRequired * 100;
		const meterValue = Math.max(0, Math.min(100, Math.round(meterPercent)));
		const meterTrack = meter.parentElement;
		meter.style.height = `${meterValue}%`;
		meterTrack.setAttribute("aria-valuenow", meterValue);
		meterTrack.setAttribute("aria-valuetext", active > 0
			? skill.id === "escape" ? `Ativa por ${active} segundos`
				: skill.id === "frenzy" ? `Ativa por ${active} toques` : `Ativa por ${active} ataques`
			: skill.id === "frenzy" ? `${kills} de ${skill.killsRequired} toques`
				: `${kills} de ${skill.killsRequired} abates`);

		// ícone só aparece quando a skill está carregada (pronta ou ativa);
		// enquanto carrega, o botão mostra apenas a barra de progresso
		button.classList.toggle("is-charging", active === 0 && kills < skill.killsRequired);

		if (active > 0) {
			progress.textContent = skill.id === "escape"
				? `Ativa: ${active}s`
				: skill.id === "frenzy" ? `Ativa: ${active} toques`
					: `Ativa: ${active} ataques`;
			button.classList.add("is-active");
		} else {
			progress.textContent = kills >= skill.killsRequired
				? "Pronta!"
				: skill.id === "frenzy" ? `${kills}/${skill.killsRequired} toques`
					: `${kills}/${skill.killsRequired} abates`;
			button.classList.remove("is-active");
		}
	});
}

function RegistrarAbateHabilidades() {
	habilidadesCombate.forEach(skill => {
		if (maxAndar < skill.unlockFloor) return;
		if (skill.id === "electric" && abatesCorrenteEletrica < skill.killsRequired) {
			abatesCorrenteEletrica++;
		} else if (skill.id === "gold" && abatesBonusGoldAtaque < skill.killsRequired) {
			abatesBonusGoldAtaque++;
		} else if (skill.id === "escape" && abatesPausaFuga < skill.killsRequired) {
			abatesPausaFuga++;
		}
	});
	AtualizaHabilidadesCombate();
}

// Toque Frenético: só o toque manual do jogador carrega e consome a janela.
// Fora da janela o toque enche a carga (killsRequired = 40 toques); dentro
// dela o toque consome 1 da janela ativa (o multiplicador já foi lido antes).
function RegistraToqueFrenesi() {
	const skill = habilidadesCombate.find(item => item.id === "frenzy");
	if (!skill || maxAndar < skill.unlockFloor) return;
	if (ataquesFrenesi > 0) {
		ataquesFrenesi--;
	} else if (abatesFrenesi < skill.killsRequired) {
		abatesFrenesi++;
	}
	AtualizaHabilidadesCombate();
}

function AtivaHabilidadeCombate(id) {
	const skill = habilidadesCombate.find(item => item.id === id);
	if (!skill || maxAndar < skill.unlockFloor) return;

	let habilidadeAtivada = false;
	if (id === "electric" && abatesCorrenteEletrica >= skill.killsRequired && ataquesCorrenteEletrica === 0) {
		habilidadeAtivada = true;
		abatesCorrenteEletrica = 0;
		ataquesCorrenteEletrica = 20;
		ChamaSom("audio5");
		UI.showInfo("Corrente elétrica ativa por 20 ataques!");
	} else if (id === "gold" && abatesBonusGoldAtaque >= skill.killsRequired && ataquesBonusGold === 0) {
		habilidadeAtivada = true;
		abatesBonusGoldAtaque = 0;
		ataquesBonusGold = DuracaoSkillGold();
		ChamaSom("audio6");
		UI.showInfo(`Bônus de Gold ativo por ${ataquesBonusGold} ataques!`);
	} else if (id === "escape" && abatesPausaFuga >= skill.killsRequired && segundosPausaFuga === 0 && !fugaEmAndamento) {
		habilidadeAtivada = true;
		abatesPausaFuga = 0;
		segundosPausaFuga = DuracaoPausaFuga();
		ChamaSom("audio7");
		UI.showInfo(`Relógio de fuga pausado por ${segundosPausaFuga} segundos!`);
	} else if (id === "frenzy" && abatesFrenesi >= skill.killsRequired && ataquesFrenesi === 0) {
		habilidadeAtivada = true;
		abatesFrenesi = 0;
		ataquesFrenesi = DuracaoJanelaFrenesi();
		ChamaSom("audio5");
		UI.showInfo(`Toque Frenético ativo por ${ataquesFrenesi} toques!`);
	}

	//desafio "sem habilidades": só ativar de verdade falha (tentativa sem carga não conta)
	if (habilidadeAtivada && missaoAtual === 5 && missaoDesafioSub === 2) {
		FalhaDesafio("Habilidade ativada");
	}

	AtualizaHabilidadesCombate();
}

function ConsomeAtaqueHabilidades(consomeCorrenteEletrica, consomeBonusGold) {
	if (consomeCorrenteEletrica && ataquesCorrenteEletrica > 0) ataquesCorrenteEletrica--;
	if (consomeBonusGold && ataquesBonusGold > 0) ataquesBonusGold--;
	AtualizaHabilidadesCombate();
}

function AtualizaRelogioHabilidade() {
	if (segundosPausaFuga <= 0) return false;
	segundosPausaFuga--;
	AtualizaHabilidadesCombate();
	return true;
}

function HabilidadeDano(){
	if (jogoPausado) return;

	AtualizaHabilidadesCombate();
	AtualizaQTDHabildiade1();
	if(verificaHabilidadeDano){
		DanoAutomatico(false,true);
		// Alquimista: buff de Velocidade ×2 — golpe extra no mesmo tick
		if (MultiplicadorBuffVelocidade() > 1) {
			DanoAutomatico(false,true);
		}
		document.getElementById("QTDTempoHab1").innerHTML=tempoHabilidadeDano--;
		document.getElementById("BaraQTDHab1").style.color="#f00";
		if(tempoHabilidadeDano==0){
			verificaHabilidadeDano=false;
			tempoHabilidadeDano = DuracaoHabilidadeDano();
			document.getElementById("QTDTempoHab1").innerHTML=qtdCarregaHabilidade;
		}
	} 	
}

// Pontos de perk (por run): 1 por portão alcançado no pico de andar desta run
// (>= 35). O pico não cai quando você foge, e tudo zera no reset.
function PontosPerkGanhos(){
	const picoRun = Math.max(Number(andarMaxRun) || 1, Number(andar) || 1);
	if (picoRun < 35) return 0;
	return Math.floor((picoRun - 35) / 5) + 1;
}

function PontosPerkDisponiveis(){
	const gastos = perkDano + perkEletrica + perkGold + perkFuga;
	return Math.max(0, PontosPerkGanhos() - gastos);
}
