// ===================== MERCADO (hub da Cidade) ============================
// Complementa as lojas e as formigas:
//  - Reputação: desconto nas lojas (Loja do Conhecimento), aplicado num ponto
//    único em PrecoLojaCM (script.js).
//  - Vender excedentes: cópias extras de itens da build (mantém 1 de cada) e
//    formigas fora dos conjuntos de 5 viram gold.
// Tudo PERMANENTE: não zera no Resetar (só no ZerarTodosSaves), como o CM.
// Scripts clássicos: funções globais; painel montado no DOM no runtime.

const REPUTACAO_MAX = 10;
const REPUTACAO_DESCONTO_NIVEL = 0.02; // -2% por nível nas lojas

function ReputacaoValida(nivel = reputacao) {
	const n = Math.floor(Number(nivel) || 0);
	return Math.max(0, Math.min(REPUTACAO_MAX, n));
}

function DescontoReputacao() {
	return REPUTACAO_DESCONTO_NIVEL * ReputacaoValida();
}

// Aplica o desconto a um preço de loja (ponto único; guardado pra carregar no menu)
function PrecoComReputacao(preco) {
	return Math.max(0, Number(preco) || 0) * (1 - DescontoReputacao());
}

// Custo em CM do próximo nível (base 5.000, ×1,6 por nível)
function CustoReputacao(nivel) {
	return Math.round(5000 * Math.pow(1.6, ReputacaoValida(nivel)));
}

function CompraReputacao() {
	const nivel = ReputacaoValida();
	if (nivel >= REPUTACAO_MAX) {
		UI.showInfo("A Reputação já está no máximo!");
		return false;
	}
	const preco = CustoReputacao(nivel);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	reputacao = nivel + 1;
	UI.showInfo("Reputação " + reputacao + " · lojas com -" + Math.round(DescontoReputacao() * 100) + "%.");
	AutoSaveLocal();
	return true;
}

// Valor em gold de um excedente (escala com o andar)
function ValorVendaItem() { return BonusGoldAvanco() * 5; }
function ValorVendaFormiga() { return BonusGoldAvanco(); }

// Formigas "fora do conjunto" (resto de 5) por tipo
function FormigasExcedentes() {
	const excedentes = [];
	FORMIGAS.forEach(formiga => {
		const total = QuantidadeFormigas(formiga.id);
		const resto = total % 5;
		if (resto > 0) excedentes.push({ formiga, qtd: resto });
	});
	return excedentes;
}

// Quantos itens da build têm cópias extras (além da 1ª)
function ItensExcedentes() {
	let extras = 0;
	const vistas = new Set();
	for (const id of window.Tapeira.ItensBuild.pegaLista()) {
		if (vistas.has(id)) { extras++; continue; }
		vistas.add(id);
	}
	return extras;
}

// Vende os excedentes: cópias extras de itens + formigas fora dos conjuntos.
function VenderExcedentes() {
	const itens = window.Tapeira.ItensBuild.vendeDuplicatas();
	const formigas = FormigasExcedentes();
	let totalFormigas = 0;
	formigas.forEach(e => {
		totalFormigas += e.qtd;
		window[e.formiga.contador] = Math.max(0, window[e.formiga.contador] - e.qtd);
	});
	if (itens === 0 && totalFormigas === 0) {
		UI.showInfo("Não há excedentes para vender.");
		return { itens: 0, formigas: 0, gold: 0 };
	}
	const goldGanho = itens * ValorVendaItem() + totalFormigas * ValorVendaFormiga();
	const recebido = AddGold(goldGanho, false);
	AddTotalGold(recebido, false);
	UI.showCurrencyReward("gold", recebido);
	UI.showInfo("Mercado: " + itens + " item(ns) + " + totalFormigas + " formiga(s) → +"
		+ FormatGold(recebido) + " gold.");
	AutoSaveLocal();
	return { itens, formigas: totalFormigas, gold: recebido };
}

// ---- Painel ----
function FecharMercado() {
	const modal = document.getElementById("mercadoModal");
	if (!modal) return;
	modal.remove();
	UI.syncScreenButtons();
}

function AbrirMercado() {
	FecharMercado();

	const overlay = document.createElement("div");
	overlay.id = "mercadoModal";
	overlay.className = "ant-collection-overlay mercado-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-labelledby", "mercado-titulo");

	const panel = document.createElement("section");
	panel.className = "ant-collection-panel mercado-panel";

	const header = document.createElement("header");
	header.className = "mercado-header";
	const title = document.createElement("h2");
	title.id = "mercado-titulo";
	title.textContent = "Mercado";
	const close = document.createElement("button");
	close.type = "button";
	close.className = "mercado-fechar";
	close.setAttribute("aria-label", "Fechar o Mercado");
	close.textContent = "×";
	close.addEventListener("click", FecharMercado);
	header.append(title, close);

	const corpo = document.createElement("div");
	corpo.className = "mercado-corpo";
	corpo.id = "mercadoCorpo";

	panel.append(header, corpo);
	overlay.appendChild(panel);
	overlay.addEventListener("click", event => {
		if (event.target === overlay) FecharMercado();
	});
	overlay.addEventListener("keydown", event => {
		if (event.key === "Escape") FecharMercado();
	});
	document.body.appendChild(overlay);
	UI.closeOtherPanels("mercado");
	UI.syncScreenButtons();
	RenderMercadoPainel();
	close.focus();
}

function RenderMercadoPainel() {
	const corpo = document.getElementById("mercadoCorpo");
	if (!corpo) return;
	corpo.replaceChildren(MercadoSecaoReputacao(), MercadoSecaoExcedentes());
}

function MercadoSecaoReputacao() {
	const nivel = ReputacaoValida();
	const secao = document.createElement("section");
	secao.className = "mercado-secao";

	const titulo = document.createElement("h3");
	titulo.className = "mercado-secao__titulo";
	titulo.textContent = "Reputação";

	const desc = document.createElement("p");
	desc.className = "mercado-secao__desc";
	desc.textContent = "Sua fama no submundo dá desconto nas lojas: -"
		+ Math.round(REPUTACAO_DESCONTO_NIVEL * 100) + "% no preço da Loja de Conhecimento por nível.";

	const status = document.createElement("p");
	status.className = "mercado-status";
	status.textContent = "Nível " + nivel + "/" + REPUTACAO_MAX
		+ " · desconto atual: -" + Math.round(DescontoReputacao() * 100) + "%";

	secao.append(titulo, desc, status);

	if (nivel >= REPUTACAO_MAX) {
		const maximo = document.createElement("p");
		maximo.className = "mercado-max";
		maximo.textContent = "Reputação no máximo!";
		secao.append(maximo);
		return secao;
	}

	const preco = CustoReputacao(nivel);
	const linha = document.createElement("div");
	linha.className = "mercado-compra";
	const prox = document.createElement("span");
	prox.className = "mercado-prox";
	prox.textContent = "Próximo nível: -" + Math.round(REPUTACAO_DESCONTO_NIVEL * 100 * (nivel + 1)) + "% nas lojas";
	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "mercado-comprar";
	botao.textContent = "Melhorar · " + FormatCM(preco) + " CM";
	botao.disabled = N(conhecimentoMug) < preco;
	botao.addEventListener("click", () => { if (CompraReputacao()) RenderMercadoPainel(); });
	linha.append(prox, botao);
	secao.append(linha);
	return secao;
}

function MercadoSecaoExcedentes() {
	const secao = document.createElement("section");
	secao.className = "mercado-secao";

	const titulo = document.createElement("h3");
	titulo.className = "mercado-secao__titulo";
	titulo.textContent = "Vender excedentes";

	const desc = document.createElement("p");
	desc.className = "mercado-secao__desc";
	desc.textContent = "Vende as cópias extras dos itens da build (mantém 1 de cada) e as formigas que sobraram fora dos conjuntos de 5. Vira gold.";

	const itens = ItensExcedentes();
	const formigas = FormigasExcedentes().reduce((t, e) => t + e.qtd, 0);
	const total = itens + formigas;

	const status = document.createElement("p");
	status.className = "mercado-status";
	status.textContent = "Excedentes: " + itens + " item(ns) e " + formigas + " formiga(s)"
		+ " · ~" + FormatGold(itens * ValorVendaItem() + formigas * ValorVendaFormiga()) + " gold";

	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "mercado-comprar";
	botao.textContent = "Vender excedentes";
	botao.disabled = total === 0;
	botao.addEventListener("click", () => { VenderExcedentes(); RenderMercadoPainel(); });

	secao.append(titulo, desc, status, botao);
	return secao;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Mercado = {
	REPUTACAO_MAX: REPUTACAO_MAX,
	reputacaoValida: ReputacaoValida,
	desconto: DescontoReputacao,
	precoComReputacao: PrecoComReputacao,
	custoReputacao: CustoReputacao,
	comprarReputacao: CompraReputacao,
	valorItem: ValorVendaItem,
	valorFormiga: ValorVendaFormiga,
	formigasExcedentes: FormigasExcedentes,
	itensExcedentes: ItensExcedentes,
	venderExcedentes: VenderExcedentes,
	abrir: AbrirMercado,
	fechar: FecharMercado,
	render: RenderMercadoPainel
};
