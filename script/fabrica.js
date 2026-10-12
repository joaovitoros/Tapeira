// ===================== FÁBRICA (hub da Cidade) ============================
// Complementa itens-build.js e automacao.js:
//  - Forja: junta 2 cópias iguais em 1 "melhorada" (mesmo efeito, 1 slot a
//    menos). O estado da forja é da run (zera junto com a build).
//  - Linha de montagem: cada nível dá +1 auto-compra por segundo (automação).
// O nível da linha é PERMANENTE (não zera no Resetar), como o CM.
// Scripts clássicos: funções globais; painel montado no DOM no runtime.

const FABRICA_MAX_NIVEL = 10;

function FabricaNivelValido(nivel = fabricaNivel) {
	const n = Math.floor(Number(nivel) || 0);
	return Math.max(0, Math.min(FABRICA_MAX_NIVEL, n));
}

// Custo em CM do próximo nível (base 20.000 ×CUSTO_CIDADE_MULT, ×1,6 por nível)
function CustoFabricaNivel(nivel) {
	return Math.round(20000 * CUSTO_CIDADE_MULT * Math.pow(1.6, FabricaNivelValido(nivel)));
}

// Linha de montagem: auto-compras por segundo (1 base + 1 por nível)
function LinhasMontagem(nivel = fabricaNivel) {
	return 1 + FabricaNivelValido(nivel);
}

function CompraFabricaNivel() {
	const nivel = FabricaNivelValido();
	if (nivel >= FABRICA_MAX_NIVEL) {
		UI.showInfo("A Linha de montagem já está no máximo!");
		return false;
	}
	const preco = CustoFabricaNivel(nivel);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	fabricaNivel = nivel + 1;
	UI.showInfo("Linha de montagem nível " + fabricaNivel + " · " + LinhasMontagem() + " auto-compras/s.");
	AutoSaveLocal();
	return true;
}

// Custo em gold de uma forja (escala com o andar): ~80 avanços de andar.
// (Era ×8 — a forja ficava trivial no late game; ×80 faz o custo pesar.)
function CustoForjaItem() {
	return BonusGoldAvanco() * 80;
}

// Forja um item (2 cópias → 1 melhorada) e atualiza a tela. Custa gold.
function ForjaItem(id) {
	const registro = window.Tapeira.ItensBuild.item(id);
	if (!window.Tapeira.ItensBuild.podeForjar(id)) {
		UI.showInfo("Precisa de 2 cópias iguais para forjar.");
		return false;
	}
	const custo = CustoForjaItem();
	if (!GE(gold, custo)) {
		UI.showInfo("Você não tem gold suficiente para forjar (" + FormatGold(custo) + ").");
		return false;
	}
	// gasto direto (não é compra da loja: não conta pra conquista Poupado)
	gold.add(-N(custo));
	AtualizaGoldTela();
	window.Tapeira.ItensBuild.forjar(id);
	UI.showInfo("Forja: " + (registro ? registro.nome : id) + " melhorado (2 cópias → 1) por "
		+ FormatGold(custo) + " gold.");
	AutoSaveLocal();
	return true;
}

// ---- Painel ----
function FecharFabrica() {
	const modal = document.getElementById("fabricaModal");
	if (!modal) return;
	modal.remove();
	UI.syncScreenButtons();
}

function AbrirFabrica() {
	FecharFabrica();

	const overlay = document.createElement("div");
	overlay.id = "fabricaModal";
	overlay.className = "ant-collection-overlay fabrica-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-labelledby", "fabrica-titulo");

	const panel = document.createElement("section");
	panel.className = "ant-collection-panel fabrica-panel";

	const header = document.createElement("header");
	header.className = "fabrica-header";
	const title = document.createElement("h2");
	title.id = "fabrica-titulo";
	title.textContent = "Fábrica";
	const close = document.createElement("button");
	close.type = "button";
	close.className = "fabrica-fechar";
	close.setAttribute("aria-label", "Fechar a Fábrica");
	close.textContent = "×";
	close.addEventListener("click", FecharFabrica);
	header.append(title, CriaInfoTela({
		id: "fabrica-info",
		rotulo: "Sobre a Fábrica",
		html: "<b>Como funciona</b>"
			+ "<p><b>Forja</b>: junta <b>2 cópias iguais</b> de um item em 1 "
			+ "melhorada — mesmo efeito, mas <b>libera 1 slot</b> da build. "
			+ "Custa gold e é da run (zera no reset).</p>"
			+ "<p><b>Linha de montagem</b>: +1 <b>auto-compra</b> da loja por "
			+ "segundo por nível (requer a Auto-compra ligada). Pago em CM e "
			+ "permanente.</p>"
	}), close);

	const corpo = document.createElement("div");
	corpo.className = "fabrica-corpo";
	corpo.id = "fabricaCorpo";

	panel.append(header, corpo);
	overlay.appendChild(panel);
	overlay.addEventListener("click", event => {
		if (event.target === overlay) FecharFabrica();
	});
	overlay.addEventListener("keydown", event => {
		if (event.key === "Escape") FecharFabrica();
	});
	document.body.appendChild(overlay);
	UI.closeOtherPanels("fabrica");
	UI.syncScreenButtons();
	RenderFabricaPainel();
	close.focus();
}

function RenderFabricaPainel() {
	const corpo = document.getElementById("fabricaCorpo");
	if (!corpo) return;
	corpo.replaceChildren(FabricaSecaoForja(), FabricaSecaoMontagem());
}

function FabricaSecaoForja() {
	const secao = document.createElement("section");
	secao.className = "fabrica-secao";

	const titulo = document.createElement("h3");
	titulo.className = "fabrica-secao__titulo";
	titulo.textContent = "Forja";

	const desc = document.createElement("p");
	desc.className = "fabrica-secao__desc";
	desc.textContent = "Junte 2 cópias iguais em 1 melhorada: o efeito é o mesmo, mas libera 1 slot da build. Custa gold (escala com o andar). A forja é da run (zera no reset).";

	const lista = document.createElement("div");
	lista.className = "fabrica-lista";
	let algum = false;

	for (const item of window.Tapeira.ItensBuild.POOL) {
		const copias = window.Tapeira.ItensBuild.copias(item.id);
		const forja = window.Tapeira.ItensBuild.nivelForja(item.id);
		if (copias === 0 && forja === 0) continue;
		algum = true;

		const linha = document.createElement("div");
		linha.className = "fabrica-linha";

		const img = document.createElement("img");
		img.className = "fabrica-linha__icone";
		img.src = item.icone;
		img.alt = "";

		const info = document.createElement("div");
		info.className = "fabrica-linha__info";
		const nome = document.createElement("strong");
		nome.textContent = item.nome;
		const det = document.createElement("span");
		det.className = "fabrica-linha__sub";
		det.textContent = copias + " cópia(s)" + (forja > 0 ? " · " + forja + " melhorada(s) (forja)" : "")
			+ " · efeito ×" + window.Tapeira.ItensBuild.copiasEfetivas(item.id);
		info.append(nome, det);

		const custo = CustoForjaItem();
		const botao = document.createElement("button");
		botao.type = "button";
		botao.className = "fabrica-comprar";
		botao.textContent = "Forjar · " + FormatGold(custo);
		botao.disabled = !window.Tapeira.ItensBuild.podeForjar(item.id) || !GE(gold, custo);
		botao.addEventListener("click", () => { if (ForjaItem(item.id)) RenderFabricaPainel(); });

		linha.append(img, info, botao);
		lista.appendChild(linha);
	}

	if (!algum) {
		const vazio = document.createElement("p");
		vazio.className = "fabrica-vazio";
		vazio.textContent = "Você ainda não tem itens da build para forjar (aparecem a partir do andar 100).";
		secao.append(titulo, desc, vazio);
		return secao;
	}

	secao.append(titulo, desc, lista);
	return secao;
}

function FabricaSecaoMontagem() {
	const nivel = FabricaNivelValido();
	const secao = document.createElement("section");
	secao.className = "fabrica-secao";

	const titulo = document.createElement("h3");
	titulo.className = "fabrica-secao__titulo";
	titulo.textContent = "Linha de montagem";

	const desc = document.createElement("p");
	desc.className = "fabrica-secao__desc";
	desc.textContent = "Acelera a automação: cada nível dá +1 auto-compra da loja por segundo (requer a Auto-compra ligada).";

	const status = document.createElement("p");
	status.className = "fabrica-status";
	status.textContent = "Nível " + nivel + "/" + FABRICA_MAX_NIVEL
		+ " · " + LinhasMontagem() + " auto-compra(s) por segundo";

	secao.append(titulo, desc, status);

	if (nivel >= FABRICA_MAX_NIVEL) {
		const maximo = document.createElement("p");
		maximo.className = "fabrica-max";
		maximo.textContent = "Linha de montagem no máximo!";
		secao.append(maximo);
		return secao;
	}

	const preco = CustoFabricaNivel(nivel);
	const linha = document.createElement("div");
	linha.className = "fabrica-compra";
	const prox = document.createElement("span");
	prox.className = "fabrica-prox";
	prox.textContent = "Próximo nível: " + LinhasMontagem(nivel + 1) + " auto-compra(s)/s";
	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "fabrica-comprar";
	botao.textContent = "Melhorar · " + FormatCM(preco) + " CM";
	botao.disabled = N(conhecimentoMug) < preco;
	botao.addEventListener("click", () => { if (CompraFabricaNivel()) RenderFabricaPainel(); });
	linha.append(prox, botao);
	secao.append(linha);
	return secao;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Fabrica = {
	MAX_NIVEL: FABRICA_MAX_NIVEL,
	nivelValido: FabricaNivelValido,
	custoNivel: CustoFabricaNivel,
	linhasMontagem: LinhasMontagem,
	comprarNivel: CompraFabricaNivel,
	forjarItem: ForjaItem,
	abrir: AbrirFabrica,
	fechar: FecharFabrica,
	render: RenderFabricaPainel
};
