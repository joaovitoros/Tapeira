// =========================
// ÁRVORE DE SKILLS COM RAMOS (Tier 3 #3 — princípios 16/20)
// =========================
// Cada skill ganha um fork no nível 5: escolha UM de dois caminhos
// mutuamente exclusivos (grátis — o nível investido é o gate; o outro
// caminho fica selado até o fim da run). O caminho tem 2 nós: o nó 1 é a
// escolha no nível 5 e o nó 2 completa sozinho no nível 10, quando a skill
// bate no máximo. Padrão por skill: caminho 1 = poder/dano, caminho 2 =
// duração/alcance.
//
// Estado por run: `ramoSkill*` (0 = sem caminho, 1/2 = caminho escolhido)
// vai para o save, é validado no ValidarSave (faixa 0–2) e zerado no
// Resetar() junto com os níveis das skills. Os efeitos são funções puras
// lidas em TEMPO DE SORTEIO — nada muta danoJogador, mulGold ou os
// contadores base, então saves/estados nunca ficam incoerentes.

const RAMO_NIVEL_ESCOLHA = 5;
const RAMO_NIVEL_CONCLUSAO = 10;

// por run, zerados no Resetar() — saves antigos nascem sem caminho (0)
var ramoSkillDano = 0;
var ramoSkillEletrica = 0;
var ramoSkillGold = 0;
var ramoSkillFuga = 0;
var ramoSkillFrenesi = 0;

const RAMOS_SKILL = [
	{
		skillId: "damage", ramos: [
			{ id: 1, nome: "Canhão", efeito5: "+50% de dano no hit automático", efeito10: "+50% de novo (×2,25 no total)" },
			{ id: 2, nome: "Rajada", efeito5: "Janela de ativação 50% mais longa", efeito10: "+50% de novo (×2,25 no total)" }
		]
	},
	{
		skillId: "electric", ramos: [
			{ id: 1, nome: "Sobrecarga", efeito5: "+50% de dano na corrente", efeito10: "+50% de novo (×2,25 no total)" },
			{ id: 2, nome: "Rede", efeito5: "+1 inimigo atingido pela corrente", efeito10: "+1 inimigo de novo (máx +2)" }
		]
	},
	{
		skillId: "gold", ramos: [
			{ id: 1, nome: "Veia", efeito5: "+50% no bônus de gold por ataque", efeito10: "+50% de novo (×2,25 no total)" },
			{ id: 2, nome: "Fôlego", efeito5: "Carga vale 40 ataques (era 25)", efeito10: "60 ataques no total" }
		]
	},
	{
		skillId: "escape", ramos: [
			{ id: 1, nome: "Oportunidade", efeito5: "+15% de dano do jogador durante a pausa", efeito10: "+15% de novo (×1,32 no total)" },
			{ id: 2, nome: "Cortina", efeito5: "Pausa da fuga 50% mais longa", efeito10: "+50% de novo (×2,25 no total)" }
		]
	},
	{
		skillId: "frenzy", ramos: [
			{ id: 1, nome: "Calor", efeito5: "+50% no dano da janela", efeito10: "+50% de novo (×2,25 no total)" },
			{ id: 2, nome: "Ímpeto", efeito5: "Janela 50% mais longa", efeito10: "+50% de novo (×2,25 no total)" }
		]
	}
];

// caminho escolhido (0 = nenhum) — só vale com a skill no nível mínimo
function RamoEscolhido(skillId) {
	const skill = SKILLS_UPGRADE.find(item => item.id === skillId);
	if (!skill || NivelDaSkill(skillId) < RAMO_NIVEL_ESCOLHA) return 0;
	const valor = Number(window[skill.ramo]) || 0;
	return valor === 1 || valor === 2 ? valor : 0;
}

// nó do CAMINHO ESCOLHIDO ativo: nó 1 = a escolha no nível 5, nó 2 = a
// conclusão no nível 10 (o índice é do nó dentro do caminho, não o id do
// caminho — quem garante o caminho certo é o chamador/FatorRamo)
function RamoNoAtivo(skillId, no) {
	if (RamoEscolhido(skillId) === 0) return false;
	const minimo = no === 1 ? RAMO_NIVEL_ESCOLHA : RAMO_NIVEL_CONCLUSAO;
	return NivelDaSkill(skillId) >= minimo;
}

// fator acumulado do caminho escolhido: nó 1 (nv 5) e nó 2 (nv 10) empilham
function FatorRamo(skillId, caminho, fatorNo) {
	if (RamoEscolhido(skillId) !== caminho) return 1;
	let fator = RamoNoAtivo(skillId, 1) ? fatorNo : 1;
	if (RamoNoAtivo(skillId, 2)) fator *= fatorNo;
	return fator;
}

// sela um caminho (grátis, uma vez por run — o outro fica indisponível)
function EscolheRamoSkill(skillId, caminho) {
	const skill = SKILLS_UPGRADE.find(item => item.id === skillId);
	const arvore = RAMOS_SKILL.find(item => item.skillId === skillId);
	if (!skill || !arvore || (caminho !== 1 && caminho !== 2)) return false;
	if (PisoMaximoAlcancado() < skill.pisoDesbloqueio
		|| NivelDaSkill(skillId) < RAMO_NIVEL_ESCOLHA
		|| RamoEscolhido(skillId) !== 0) return false;

	window[skill.ramo] = caminho;
	const ramo = arvore.ramos[caminho - 1];
	ChamaSom('audio6');
	UI.showInfo(`${ramo.nome} selado em ${skill.nome} — o outro caminho ficou indisponível nesta run.`);
	if (!AutoSaveLocal()) {
		UI.showInfo("O caminho foi escolhido, mas não foi possível salvar o progresso localmente.");
	}
	return true;
}

// saneamento no load: caminho só vale com a skill no nível mínimo (save
// editado ou futuro rebalance de custo)
function ConfereRamosSave() {
	for (const skill of SKILLS_UPGRADE) {
		if (NivelDaSkill(skill.id) < RAMO_NIVEL_ESCOLHA) window[skill.ramo] = 0;
	}
}

// ---------- efeitos (funções puras lidas no tempo do sorteio) ----------

// Canhão (caminho 1): dano do hit do Dano automático (mesmo sítio do perk)
function MultiplicadorRamoDanoAutomatico() {
	return FatorRamo("damage", 1, 1.5);
}

// Rajada (caminho 2): janela de ativação da skill (UsaHabilidadeDano e o
// reset do relógio em HabilidadeDano)
function DuracaoHabilidadeDano() {
	return Math.round((30 + NivelDaSkill("damage") * 5) * FatorRamo("damage", 2, 1.5));
}

// Sobrecarga (caminho 1): dano da cadeia e o bônus quando não há alvo
// pra encadear
function MultiplicadorRamoCorrente() {
	return FatorRamo("electric", 1, 1.5);
}

// Rede (caminho 2): alvos da cadeia além da base (1) e do perk (+1/ nível)
function RamoAlvosCorrente() {
	if (RamoEscolhido("electric") !== 2) return 0;
	let alvos = RamoNoAtivo("electric", 1) ? 1 : 0;
	if (RamoNoAtivo("electric", 2)) alvos += 1;
	return alvos;
}

// Veia (caminho 1): bônus de gold por ataque enquanto a skill está ativa
function MultiplicadorRamoBonusGold() {
	return FatorRamo("gold", 1, 1.5);
}

// Fôlego (caminho 2): duração da carga em ataques (25 → 40 → 60)
function DuracaoSkillGold() {
	if (RamoEscolhido("gold") !== 2) return 25;
	return RamoNoAtivo("gold", 2) ? 60 : 40;
}

// Cortina (caminho 2): duração da pausa do relógio de fuga
function DuracaoPausaFuga() {
	return Math.round((10 + NivelDaSkill("escape") * 2) * FatorRamo("escape", 2, 1.5));
}

// Oportunidade (caminho 1): golpes do jogador enquanto a fuga está pausada
function MultiplicadorDanoDurantePausaFuga() {
	return FatorRamo("escape", 1, 1.15);
}

// Ímpeto (caminho 2): duração da janela do Toque Frenético em toques
// (30..50 base por nível × 1,5 por nó do ramo 2; medida em toques, não em s)
function DuracaoJanelaFrenesi() {
	return Math.round((30 + NivelDaSkill("frenzy") * 2) * FatorRamo("frenzy", 2, 1.5));
}
