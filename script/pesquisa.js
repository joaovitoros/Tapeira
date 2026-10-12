// ===================== CENTRO DE PESQUISA (hub da Cidade) =================
// Complementa itens-build.js e o combate:
//  - Pesquisa por item: níveis (pagos em CM) que POTENCIALIZAM o efeito do item
//    da build (+10% por nível). Aplicado num ponto único: ItensBuild.mult.
//  - Análise de inimigos: +10% de dano por nível contra um TIPO (comuns /
//    guardiões). Aplicado num ponto único no combate (batalha.js).
// Tudo PERMANENTE: não zera no Resetar (só no ZerarTodosSaves), como o CM.
// Scripts clássicos: funções globais; o painel é montado no DOM no runtime.

const PESQUISA_ITEM_MAX = 5;
const PESQUISA_INIMIGO_MAX = 5;
const PESQUISA_BONUS_NIVEL = 0.10; // +10% por nível

// Tipos de inimigo: comuns (andares normais) e guardiões (múltiplos de 10)
const PESQUISA_INIMIGOS = [
	{ id: "comuns", nome: "Inimigos comuns", desc: "andares normais" },
	{ id: "guardioes", nome: "Guardiões", desc: "andares múltiplos de 10" }
];

function PesquisaItemValido(id) {
	return !!(window.Tapeira?.ItensBuild?.item?.(id));
}

function PesquisaInimigo(id) {
	return PESQUISA_INIMIGOS.find(t => t.id === id) || null;
}

function NivelPesquisaItem(id) {
	const n = Math.floor(Number(pesquisaItens?.[id]) || 0);
	return Math.max(0, Math.min(PESQUISA_ITEM_MAX, n));
}

function NivelPesquisaInimigo(id) {
	const n = Math.floor(Number(pesquisaInimigos?.[id]) || 0);
	return Math.max(0, Math.min(PESQUISA_INIMIGO_MAX, n));
}

// Custo em CM do próximo nível: item base 20.000 ×CUSTO_CIDADE_MULT (×1,6);
// inimigo base 8.000 ×CUSTO_CIDADE_MULT (×1,8)
function CustoPesquisaItem(id) {
	return Math.round(20000 * CUSTO_CIDADE_MULT * Math.pow(1.6, NivelPesquisaItem(id)));
}

function CustoPesquisaInimigo(id) {
	return Math.round(8000 * CUSTO_CIDADE_MULT * Math.pow(1.8, NivelPesquisaInimigo(id)));
}

// Multiplicador do efeito do item (fonte única, consumida por ItensBuild.mult)
function PesquisaBonusItem(id) {
	return 1 + PESQUISA_BONUS_NIVEL * NivelPesquisaItem(id);
}

// Multiplicador de dano contra o tipo (fonte única, consumida por batalha.js)
function PesquisaBonusInimigo(id) {
	return 1 + PESQUISA_BONUS_NIVEL * NivelPesquisaInimigo(id);
}

// Tipo do inimigo do andar atual (guardiões nos múltiplos de 10)
function TipoInimigoAtual() {
	return (Number(andar) % 10 === 0) ? "guardioes" : "comuns";
}

function CompraPesquisaItem(id) {
	if (!PesquisaItemValido(id)) return false;
	const nivel = NivelPesquisaItem(id);
	if (nivel >= PESQUISA_ITEM_MAX) {
		UI.showInfo("Este item já está com a pesquisa máxima!");
		return false;
	}
	const preco = CustoPesquisaItem(id);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	pesquisaItens = Object.assign({}, pesquisaItens, { [id]: nivel + 1 });
	const registro = window.Tapeira.ItensBuild.item(id);
	UI.showInfo("Pesquisa: " + (registro ? registro.nome : id) + " nível " + (nivel + 1) + ".");
	AutoSaveLocal();
	return true;
}

function CompraPesquisaInimigo(id) {
	if (!PesquisaInimigo(id)) return false;
	const nivel = NivelPesquisaInimigo(id);
	if (nivel >= PESQUISA_INIMIGO_MAX) {
		UI.showInfo("Este tipo já está com a análise máxima!");
		return false;
	}
	const preco = CustoPesquisaInimigo(id);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	pesquisaInimigos = Object.assign({}, pesquisaInimigos, { [id]: nivel + 1 });
	UI.showInfo("Análise de inimigos: nível " + (nivel + 1) + ".");
	AutoSaveLocal();
	return true;
}

// ---- Painel ----
function FecharPesquisa() {
	const modal = document.getElementById("pesquisaModal");
	if (!modal) return;
	modal.remove();
	UI.syncScreenButtons();
}

function AbrirPesquisa() {
	FecharPesquisa();

	const overlay = document.createElement("div");
	overlay.id = "pesquisaModal";
	overlay.className = "ant-collection-overlay pesquisa-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-labelledby", "pesquisa-titulo");

	const panel = document.createElement("section");
	panel.className = "ant-collection-panel pesquisa-panel";

	const header = document.createElement("header");
	header.className = "pesquisa-header";
	const title = document.createElement("h2");
	title.id = "pesquisa-titulo";
	title.textContent = "Centro de Pesquisa";
	const close = document.createElement("button");
	close.type = "button";
	close.className = "pesquisa-fechar";
	close.setAttribute("aria-label", "Fechar o Centro de Pesquisa");
	close.textContent = "×";
	close.addEventListener("click", FecharPesquisa);
	header.append(title, CriaInfoTela({
		id: "pesquisa-info",
		rotulo: "Sobre o Centro de Pesquisa",
		html: "<b>Como funciona</b>"
			+ "<p>Tudo aqui é pago em <b>CM</b> e é <b>permanente</b>.</p>"
			+ "<p><b>Pesquisa de itens</b>: potencializa o efeito do item "
			+ "por nível — <b>só vale se você tiver o item</b> na build.</p>"
			+ "<p><b>Análise de inimigos</b>: +% de dano contra um tipo de "
			+ "inimigo por nível.</p>"
	}), close);

	const corpo = document.createElement("div");
	corpo.className = "pesquisa-corpo";
	corpo.id = "pesquisaCorpo";

	panel.append(header, corpo);
	overlay.appendChild(panel);
	overlay.addEventListener("click", event => {
		if (event.target === overlay) FecharPesquisa();
	});
	overlay.addEventListener("keydown", event => {
		if (event.key === "Escape") FecharPesquisa();
	});
	document.body.appendChild(overlay);
	UI.closeOtherPanels("pesquisa");
	UI.syncScreenButtons();
	RenderPesquisaPainel();
	close.focus();
}

function RenderPesquisaPainel() {
	const corpo = document.getElementById("pesquisaCorpo");
	if (!corpo) return;
	corpo.replaceChildren(PesquisaSecaoItens(), PesquisaSecaoInimigos());
}

function PesquisaLinha(nome, sub, nivel, max, preco, compra, icone) {
	const linha = document.createElement("div");
	linha.className = "pesquisa-linha" + (nivel >= max ? " is-max" : "");

	if (icone) {
		const img = document.createElement("img");
		img.className = "pesquisa-linha__icone";
		img.src = icone;
		img.alt = "";
		linha.append(img);
	}

	const info = document.createElement("div");
	info.className = "pesquisa-linha__info";
	const titulo = document.createElement("strong");
	titulo.textContent = nome;
	const det = document.createElement("span");
	det.className = "pesquisa-linha__sub";
	det.textContent = sub;
	info.append(titulo, det);

	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "pesquisa-comprar";
	if (nivel >= max) {
		botao.textContent = "Máximo";
		botao.disabled = true;
	} else {
		botao.textContent = "Nível " + (nivel + 1) + " · " + FormatCM(preco) + " CM";
		botao.disabled = N(conhecimentoMug) < preco;
		botao.addEventListener("click", () => { if (compra()) RenderPesquisaPainel(); });
	}

	linha.append(info, botao);
	return linha;
}

function PesquisaSecaoItens() {
	const secao = document.createElement("section");
	secao.className = "pesquisa-secao";
	const titulo = document.createElement("h3");
	titulo.className = "pesquisa-secao__titulo";
	titulo.textContent = "Pesquisa de itens";
	const desc = document.createElement("p");
	desc.className = "pesquisa-secao__desc";
	desc.textContent = "Potencializa o efeito dos itens da build: +" + Math.round(PESQUISA_BONUS_NIVEL * 100) + "% por nível de pesquisa (só vale se você tiver o item).";
	secao.append(titulo, desc);

	const lista = document.createElement("div");
	lista.className = "pesquisa-lista";
	for (const item of window.Tapeira.ItensBuild.POOL) {
		const nivel = NivelPesquisaItem(item.id);
		const copias = window.Tapeira.ItensBuild.copias(item.id);
		const sub = item.efeito + " · nível " + nivel + "/" + PESQUISA_ITEM_MAX
			+ " · bônus ×" + PesquisaBonusItem(item.id).toFixed(2)
			+ (copias > 0 ? " · você tem " + copias : " · você não tem");
		lista.append(PesquisaLinha(item.nome, sub, nivel, PESQUISA_ITEM_MAX,
			CustoPesquisaItem(item.id), () => CompraPesquisaItem(item.id), item.icone));
	}
	secao.append(lista);
	return secao;
}

function PesquisaSecaoInimigos() {
	const secao = document.createElement("section");
	secao.className = "pesquisa-secao";
	const titulo = document.createElement("h3");
	titulo.className = "pesquisa-secao__titulo";
	titulo.textContent = "Análise de inimigos";
	const desc = document.createElement("p");
	desc.className = "pesquisa-secao__desc";
	desc.textContent = "Aumenta o dano contra um tipo de inimigo: +" + Math.round(PESQUISA_BONUS_NIVEL * 100) + "% por nível.";

	const tipoAtual = TipoInimigoAtual();
	const lista = document.createElement("div");
	lista.className = "pesquisa-lista";
	for (const tipo of PESQUISA_INIMIGOS) {
		const nivel = NivelPesquisaInimigo(tipo.id);
		const sub = tipo.desc + " · nível " + nivel + "/" + PESQUISA_INIMIGO_MAX
			+ " · dano ×" + PesquisaBonusInimigo(tipo.id).toFixed(2)
			+ (tipo.id === tipoAtual ? " · andar atual" : "");
		lista.append(PesquisaLinha(tipo.nome, sub, nivel, PESQUISA_INIMIGO_MAX,
			CustoPesquisaInimigo(tipo.id), () => CompraPesquisaInimigo(tipo.id)));
	}
	secao.append(titulo, desc, lista);
	return secao;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Pesquisa = {
	ITEM_MAX: PESQUISA_ITEM_MAX,
	INIMIGO_MAX: PESQUISA_INIMIGO_MAX,
	INIMIGOS: PESQUISA_INIMIGOS,
	nivelItem: NivelPesquisaItem,
	nivelInimigo: NivelPesquisaInimigo,
	custoItem: CustoPesquisaItem,
	custoInimigo: CustoPesquisaInimigo,
	bonusItem: PesquisaBonusItem,
	bonusInimigo: PesquisaBonusInimigo,
	tipoAtual: TipoInimigoAtual,
	comprarItem: CompraPesquisaItem,
	comprarInimigo: CompraPesquisaInimigo,
	abrir: AbrirPesquisa,
	fechar: FecharPesquisa,
	render: RenderPesquisaPainel
};
