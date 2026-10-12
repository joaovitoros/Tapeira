// ===================== LOJA DE TROFÉUS (Cidade) ==========================
// Destino dos Tickets de Caçador de Mugs — os pontos de habilidade que sobram
// depois que TODAS as skills já estão no máximo (ver progressao.js). Cada
// troféu tem NÍVEIS: o preço em Tickets sobe a cada nível (×1,5) e o bônus
// acumula. Tudo PERMANENTE: não zera no Resetar (só no ZerarTodosSaves).
//
// Cada efeito é ligado "num ponto único" do sistema dono:
//  - dano  → batalha.js (Bater)
//  - gold  → gold.js (AddGold)
//  - XP    → progressao.js (GanhaXP)
//  - CM    → script.js (MultiplicadorCM)
//  - crítico → batalha.js (DanoCritico)
//
// Scripts clássicos: funções globais; o painel é montado no DOM no runtime,
// reusando .ant-collection-overlay/.ant-collection-panel (como os outros
// prédios da Cidade).

const TROFEU_PRECO_BASE = 1;      // o 1º nível de cada troféu custa 1 Ticket
const TROFEU_PRECO_FATOR = 1.5;   // cada nível custa ×1,5 do anterior (1, 2, 3, 4, 6, 8, 12...)
const TROFEU_NIVEL_MAX = 1000;    // teto de sanidade (save/UI)

// id, nome, efeito por nível e COMO o bônus entra no cálculo:
//  - tipo "mult"    → multiplicador (1 + pct×nível); sem troféu = ×1 (não muda nada)
//  - tipo "aditivo" → soma percentual (pct×nível) na chance (0,005 = +0,5 ponto)
// pct = fração por nível; alvo = o que o texto mostra.
const TROFEUS = [
	{ id: "cacador", nome: "Caçador de Mugs", icone: "imagens/hud/ticket.svg",
		tipo: "mult", pct: 0.05, alvo: "dano", desc: "+5% de dano por nível" },
	{ id: "mercador", nome: "Mercador", icone: "imagens/hud/gold.png",
		tipo: "mult", pct: 0.05, alvo: "gold", desc: "+5% de gold por nível" },
	{ id: "sabio", nome: "Sábio", icone: "imagens/hud/sabio.svg",
		tipo: "mult", pct: 0.05, alvo: "XP", desc: "+5% de XP por nível" },
	{ id: "colecionador", nome: "Colecionador", icone: "imagens/hud/colecionador.svg",
		tipo: "mult", pct: 0.02, alvo: "Conhecimento Mug", desc: "+2% de Conhecimento Mug por nível" },
	{ id: "sorte", nome: "Sorte", icone: "imagens/hud/sorte.svg",
		tipo: "aditivo", pct: 0.005, alvo: "crítico", desc: "+0,5% de chance de crítico por nível" }
];

function TrofeuDef(id) {
	return TROFEUS.find(t => t.id === id) || null;
}

// Nível COMPRADO do troféu (0 = nunca comprado), dentro de [0, TROFEU_NIVEL_MAX]
function NivelTrofeu(id) {
	const n = Math.floor(Number(trofeus?.[id]) || 0);
	return Math.max(0, Math.min(TROFEU_NIVEL_MAX, n));
}

// Preço em Tickets do PRÓXIMO nível: base × fator^nível (1, 2, 3, 4, 6, 8, 12...)
// Usa ceil pra a curva ser SOMENTE crescente (round criava empates, tipo 2,25→2).
function CustoTrofeu(id) {
	const custo = Math.ceil(TROFEU_PRECO_BASE * Math.pow(TROFEU_PRECO_FATOR, NivelTrofeu(id)));
	return Math.min(Number.MAX_SAFE_INTEGER, custo);
}

// Bônus numérico do troféu no nível atual (fonte única dos 5 efeitos):
// multiplicador (base 1) para "mult"; fração somada (base 0) para "aditivo".
function TrofeuBonus(id) {
	const def = TrofeuDef(id);
	if (!def) return 1;
	const n = NivelTrofeu(id);
	return def.tipo === "aditivo" ? def.pct * n : 1 + def.pct * n;
}

// Efeitos consumidos pelos pontos de gancho do jogo:
function TrofeuBonusDano() { return TrofeuBonus("cacador"); }
function TrofeuBonusGold() { return TrofeuBonus("mercador"); }
function TrofeuBonusXP() { return TrofeuBonus("sabio"); }
function TrofeuBonusCM() { return TrofeuBonus("colecionador"); }
function TrofeuBonusCrit() { return TrofeuBonus("sorte"); } // soma na chance de crítico

// Texto do bônus atual do troféu ("+5% de dano", "+0,5% de crítico", "+0%").
function TrofeuBonusTexto(id) {
	const def = TrofeuDef(id);
	if (!def) return "";
	const valor = TrofeuBonus(id);
	const pct = def.tipo === "aditivo" ? valor * 100 : (valor - 1) * 100;
	const arredondado = Math.round(pct * 10) / 10;
	const numero = Number.isInteger(arredondado)
		? String(arredondado)
		: arredondado.toFixed(1).replace(".", ",");
	return "+" + numero + "% de " + def.alvo;
}

// Tickets são SEMPRE inteiros: abaixo de 1000 fica sem decimais ("0", "5", "42");
// a partir daí usa os sufixos (K/M/…) como o resto do jogo.
function FormataTickets(n) {
	const valor = Math.max(0, Math.floor(N(n) || 0));
	return valor < 1000 ? String(valor) : formatNumber(valor);
}

// Gasta Tickets do saldo (fonte única). Retorna false se não houver saldo.
function GastarTickets(qtd) {
	const custo = Math.floor(Number(qtd) || 0);
	if (custo <= 0) return false;
	if (N(ticketsMug) < custo) return false;
	ticketsMug = N(ticketsMug) - custo;
	return true;
}

function CompraTrofeu(id) {
	const def = TrofeuDef(id);
	if (!def) return false;
	if (NivelTrofeu(id) >= TROFEU_NIVEL_MAX) {
		UI.showInfo("Este troféu já está no máximo!");
		return false;
	}
	const preco = CustoTrofeu(id);
	if (!GastarTickets(preco)) {
		UI.showInfo("Você não tem Tickets de Caçador de Mugs suficientes!");
		return false;
	}
	const novoNivel = NivelTrofeu(id) + 1;
	trofeus = Object.assign({}, trofeus, { [id]: novoNivel });
	UI.showInfo("Troféu " + def.nome + " nível " + novoNivel + "!");
	AutoSaveLocal();
	return true;
}

// ---- Painel ----
function FecharTrofeus() {
	const modal = document.getElementById("trofeusModal");
	if (!modal) return;
	modal.remove();
	UI.syncScreenButtons();
}

function AbrirTrofeus() {
	FecharTrofeus();

	const overlay = document.createElement("div");
	overlay.id = "trofeusModal";
	overlay.className = "ant-collection-overlay trofeus-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-labelledby", "trofeus-titulo");

	const panel = document.createElement("section");
	panel.className = "ant-collection-panel trofeus-panel";

	const header = document.createElement("header");
	header.className = "trofeus-header";
	const title = document.createElement("h2");
	title.id = "trofeus-titulo";
	title.textContent = "Loja de Troféus";
	const close = document.createElement("button");
	close.type = "button";
	close.className = "trofeus-fechar";
	close.setAttribute("aria-label", "Fechar a Loja de Troféus");
	close.textContent = "×";
	close.addEventListener("click", FecharTrofeus);
	header.append(title, CriaInfoTela({
		id: "trofeus-info",
		rotulo: "Sobre a Loja de Troféus",
		html: "<b>Como funciona</b>"
			+ "<p><b>Tickets de Caçador de Mugs</b> são os pontos de habilidade "
			+ "que sobram quando <b>todas as skills estão no máximo</b> — viram "
			+ "ticket sozinho, a cada nível de jogador.</p>"
			+ "<p>Gaste em <b>troféus permanentes</b> (dano, gold, XP, CM e "
			+ "crítico). O preço sobe a cada nível.</p>"
	}), close);

	const corpo = document.createElement("div");
	corpo.className = "trofeus-corpo";
	corpo.id = "trofeusCorpo";

	panel.append(header, corpo);
	overlay.appendChild(panel);
	overlay.addEventListener("click", event => {
		if (event.target === overlay) FecharTrofeus();
	});
	overlay.addEventListener("keydown", event => {
		if (event.key === "Escape") FecharTrofeus();
	});
	document.body.appendChild(overlay);
	UI.closeOtherPanels("trofeus");
	UI.syncScreenButtons();
	RenderTrofeusPainel();
	close.focus();
}

function RenderTrofeusPainel() {
	const corpo = document.getElementById("trofeusCorpo");
	if (!corpo) return;
	corpo.replaceChildren(TrofeusSaldo(), TrofeusSecao());
}

// Saldo de Tickets de Caçador de Mugs (a moeda da loja) bem visível no topo.
function TrofeusSaldo() {
	const saldo = Math.max(0, Math.floor(N(ticketsMug) || 0));
	const caixa = document.createElement("div");
	caixa.className = "trofeus-saldo";

	const img = document.createElement("img");
	img.className = "trofeus-saldo__icone";
	img.src = "imagens/hud/ticket.svg";
	img.alt = "";
	img.setAttribute("aria-hidden", "true");

	const texto = document.createElement("span");
	texto.className = "trofeus-saldo__texto";
	texto.textContent = FormataTickets(saldo) + (saldo === 1 ? " Ticket" : " Tickets")
		+ " de Caçador de Mugs";

	caixa.append(img, texto);
	return caixa;
}

function TrofeusSecao() {
	const secao = document.createElement("section");
	secao.className = "trofeus-secao";

	const desc = document.createElement("p");
	desc.className = "trofeus-secao__desc";
	desc.textContent = "Troféus permanentes comprados com Tickets de Caçador de Mugs — "
		+ "os pontos de habilidade que sobram depois que todas as skills fecham. "
		+ "Cada nível custa mais e o bônus acumula. Os Tickets continuam valendo CM no reset.";

	const lista = document.createElement("div");
	lista.className = "trofeus-lista";
	for (const def of TROFEUS) {
		lista.appendChild(TrofeuLinha(def));
	}

	secao.append(desc, lista);
	return secao;
}

function TrofeuLinha(def) {
	const nivel = NivelTrofeu(def.id);
	const maximo = nivel >= TROFEU_NIVEL_MAX;
	const preco = CustoTrofeu(def.id);

	const linha = document.createElement("div");
	linha.className = "trofeus-linha" + (maximo ? " is-max" : "");

	if (def.icone) {
		const img = document.createElement("img");
		img.className = "trofeus-linha__icone";
		img.src = def.icone;
		img.alt = "";
		img.setAttribute("aria-hidden", "true");
		linha.append(img);
	}

	const info = document.createElement("div");
	info.className = "trofeus-linha__info";
	const titulo = document.createElement("strong");
	titulo.textContent = def.nome + " · nível " + nivel;
	const det = document.createElement("span");
	det.className = "trofeus-linha__sub";
	det.textContent = def.desc + " · hoje " + TrofeuBonusTexto(def.id);
	info.append(titulo, det);

	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "trofeus-comprar";
	if (maximo) {
		botao.textContent = "Máximo";
		botao.disabled = true;
	} else {
		botao.textContent = "Nível " + (nivel + 1) + " · " + FormataTickets(preco)
			+ (preco === 1 ? " ticket" : " tickets");
		botao.disabled = N(ticketsMug) < preco;
		botao.addEventListener("click", () => {
			if (CompraTrofeu(def.id)) RenderTrofeusPainel();
		});
	}

	linha.append(info, botao);
	return linha;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Trofeus = {
	LISTA: TROFEUS,
	PRECO_BASE: TROFEU_PRECO_BASE,
	PRECO_FATOR: TROFEU_PRECO_FATOR,
	NIVEL_MAX: TROFEU_NIVEL_MAX,
	def: TrofeuDef,
	nivel: NivelTrofeu,
	custo: CustoTrofeu,
	bonus: TrofeuBonus,
	bonusDano: TrofeuBonusDano,
	bonusGold: TrofeuBonusGold,
	bonusXP: TrofeuBonusXP,
	bonusCM: TrofeuBonusCM,
	bonusCrit: TrofeuBonusCrit,
	bonusTexto: TrofeuBonusTexto,
	gastarTickets: GastarTickets,
	comprar: CompraTrofeu,
	abrir: AbrirTrofeus,
	fechar: FecharTrofeus,
	render: RenderTrofeusPainel
};
