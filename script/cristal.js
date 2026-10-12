// ===================== CRISTAL (hub da Cidade) ============================
// Fecha a Cidade: quanto mais FUNDO o reset (andarVolta), mais a Cidade rende.
// Não cria moeda nova — só AMPLIA o que já existe. Aplicado em pontos únicos:
//  - gold (AddGold), XP (GanhaXP) e produção da Fazenda (IntervaloFazendaMs).
// O nível é PERMANENTE (não zera no Resetar), como o CM.
// Scripts clássicos: funções globais; painel montado no DOM no runtime.

const CRISTAL_MAX_NIVEL = 10;
const CRISTAL_BONUS_NIVEL = 0.02;      // +2% por nível (× profundidade)
const CRISTAL_PROFUNDIDADE_MAX = 5;    // teto do fator de profundidade

function CristalNivelValido(nivel = cristalNivel) {
	const n = Math.floor(Number(nivel) || 0);
	return Math.max(0, Math.min(CRISTAL_MAX_NIVEL, n));
}

// Fator de profundidade: 1 no reset base (andar 15) e até 5 (reset no 75+)
function CristalProfundidade() {
	return Math.min(CRISTAL_PROFUNDIDADE_MAX, Math.max(1, (Number(andarVolta) || 15) / 15));
}

// Multiplicador dos rendimentos da Cidade (fonte única)
function MultiplicadorCristal() {
	const nivel = CristalNivelValido();
	if (nivel <= 0) return 1;
	return 1 + CRISTAL_BONUS_NIVEL * nivel * CristalProfundidade();
}

// Custo em CM do próximo nível (base 100.000 ×CUSTO_CIDADE_MULT, ×1,65 por nível)
function CustoCristalNivel(nivel) {
	return Math.round(100000 * CUSTO_CIDADE_MULT * Math.pow(1.65, CristalNivelValido(nivel)));
}

function CompraCristalNivel() {
	const nivel = CristalNivelValido();
	if (nivel >= CRISTAL_MAX_NIVEL) {
		UI.showInfo("O Cristal já está no nível máximo!");
		return false;
	}
	const preco = CustoCristalNivel(nivel);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	cristalNivel = nivel + 1;
	UI.showInfo("Cristal nível " + cristalNivel + " · rendimentos da Cidade ×"
		+ MultiplicadorCristal().toFixed(2) + ".");
	AutoSaveLocal();
	return true;
}

// ---- Painel ----
function FecharCristal() {
	const modal = document.getElementById("cristalModal");
	if (!modal) return;
	modal.remove();
	UI.syncScreenButtons();
}

function AbrirCristal() {
	FecharCristal();

	const overlay = document.createElement("div");
	overlay.id = "cristalModal";
	overlay.className = "ant-collection-overlay cristal-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-labelledby", "cristal-titulo");

	const panel = document.createElement("section");
	panel.className = "ant-collection-panel cristal-panel";

	const header = document.createElement("header");
	header.className = "cristal-header";
	const title = document.createElement("h2");
	title.id = "cristal-titulo";
	title.textContent = "Cristal";
	const close = document.createElement("button");
	close.type = "button";
	close.className = "cristal-fechar";
	close.setAttribute("aria-label", "Fechar o Cristal");
	close.textContent = "×";
	close.addEventListener("click", FecharCristal);
	header.append(title, CriaInfoTela({
		id: "cristal-info",
		rotulo: "Sobre o Cristal",
		html: "<b>Como funciona</b>"
			+ "<p>Quanto <b>mais fundo</b> você reseta (andar de volta maior), "
			+ "mais o Cristal rende — o bônus escala com a <b>profundidade</b> "
			+ "do reset.</p>"
			+ "<p>Ele amplia <b>gold, XP e a produção da Fazenda</b>. Nível "
			+ "máximo " + CRISTAL_MAX_NIVEL + ", pago em CM e "
			+ "<b>permanente</b>.</p>"
	}), close);

	const corpo = document.createElement("div");
	corpo.className = "cristal-corpo";
	corpo.id = "cristalCorpo";

	panel.append(header, corpo);
	overlay.appendChild(panel);
	overlay.addEventListener("click", event => {
		if (event.target === overlay) FecharCristal();
	});
	overlay.addEventListener("keydown", event => {
		if (event.key === "Escape") FecharCristal();
	});
	document.body.appendChild(overlay);
	UI.closeOtherPanels("cristal");
	UI.syncScreenButtons();
	RenderCristalPainel();
	close.focus();
}

function RenderCristalPainel() {
	const corpo = document.getElementById("cristalCorpo");
	if (!corpo) return;
	corpo.replaceChildren(CristalSecao());
}

function CristalSecao() {
	const nivel = CristalNivelValido();
	const secao = document.createElement("section");
	secao.className = "cristal-secao";

	const titulo = document.createElement("h3");
	titulo.className = "cristal-secao__titulo";
	titulo.textContent = "Poder do Cristal";

	const desc = document.createElement("p");
	desc.className = "cristal-secao__desc";
	desc.textContent = "Quanto mais fundo você reseta, mais o Cristal rende. Ele amplia o gold, o XP e a produção da Fazenda — sem moeda nova.";

	const status = document.createElement("p");
	status.className = "cristal-status";
	status.textContent = "Nível " + nivel + "/" + CRISTAL_MAX_NIVEL
		+ " · rendimentos ×" + MultiplicadorCristal().toFixed(2)
		+ " (profundidade ×" + CristalProfundidade().toFixed(2) + " no reset do andar " + (Number(andarVolta) || 15) + ")";

	const alvos = document.createElement("p");
	alvos.className = "cristal-secao__desc";
	alvos.textContent = "Amplia: gold ganho · XP por abate · produção de formigas da Fazenda.";

	secao.append(titulo, desc, status, alvos);

	if (nivel >= CRISTAL_MAX_NIVEL) {
		const maximo = document.createElement("p");
		maximo.className = "cristal-max";
		maximo.textContent = "Cristal no nível máximo!";
		secao.append(maximo);
		return secao;
	}

	const preco = CustoCristalNivel(nivel);
	const linha = document.createElement("div");
	linha.className = "cristal-compra";
	const prox = document.createElement("span");
	prox.className = "cristal-prox";
	prox.textContent = "Próximo nível: rendimentos ×"
		+ (1 + CRISTAL_BONUS_NIVEL * (nivel + 1) * CristalProfundidade()).toFixed(2);
	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "cristal-comprar";
	botao.textContent = "Melhorar · " + FormatCM(preco) + " CM";
	botao.disabled = N(conhecimentoMug) < preco;
	botao.addEventListener("click", () => { if (CompraCristalNivel()) RenderCristalPainel(); });
	linha.append(prox, botao);
	secao.append(linha);
	return secao;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Cristal = {
	MAX_NIVEL: CRISTAL_MAX_NIVEL,
	nivelValido: CristalNivelValido,
	profundidade: CristalProfundidade,
	multiplicador: MultiplicadorCristal,
	custoNivel: CustoCristalNivel,
	comprarNivel: CompraCristalNivel,
	abrir: AbrirCristal,
	fechar: FecharCristal,
	render: RenderCristalPainel
};
