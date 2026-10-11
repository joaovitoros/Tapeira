// ===================== CASA (hub da Cidade) ==============================
// Complementa sistemas que já existem:
//  - Conforto (níveis pagos com CM) → melhora o progresso OFFLINE
//    (+% de recompensa e +limite de tempo), aplicado em progresso-offline.js.
//  - Sala de Troféus → exibe conquistas comportamentais (CONQUISTAS_COMP);
//    cada troféu exibido dá um pequeno bônus de gold (aplicado em AddGold).
// Tudo PERMANENTE: não zera no Resetar (só no ZerarTodosSaves), como o CM.
// Scripts clássicos: funções globais; o painel é montado no DOM no runtime,
// reusando .ant-collection-overlay/.ant-collection-panel (como o painel Feitos).

const CASA_MAX_NIVEL = 10;
const CASA_BONUS_GOLD_NIVEL = 0.06;                 // +6% de recompensa offline por nível
const CASA_BONUS_TEMPO_NIVEL_MS = 20 * 60 * 1000;   // +20 min de limite offline por nível
const CASA_BONUS_TROFEU = 0.02;                     // +2% de gold por troféu exibido

function CasaNivelValido(nivel) {
	const n = Math.floor(Number(nivel) || 0);
	return Math.max(0, Math.min(CASA_MAX_NIVEL, n));
}

// Custo em CM do próximo nível (base 200, ×1,5 por nível)
function CustoConfortoCasa(nivel) {
	return Math.round(200 * Math.pow(1.5, CasaNivelValido(nivel)));
}

function MultiplicadorOfflineCasa() {
	return 1 + CASA_BONUS_GOLD_NIVEL * CasaNivelValido(casaNivel);
}

// Bônus de limite de tempo offline (ms) para um nível — fonte única, usada no
// cálculo (recompensas.js) e na validação do save (validacao-save.js).
function CasaBonusTempoOfflineMs(nivel) {
	return CASA_BONUS_TEMPO_NIVEL_MS * CasaNivelValido(nivel);
}

// ---- Sala de Troféus ----
// trofeusExibidos é um bitmask sobre CONQUISTAS_COMP (bit i = conquista i exibida).
function TrofeuExibido(indice) {
	return ((N(trofeusExibidos) >> indice) & 1) === 1;
}

function TrofeusExibidosContagem() {
	let total = 0;
	for (let i = 0; i < CONQUISTAS_COMP.length; i++) {
		if (TrofeuExibido(i)) total++;
	}
	return total;
}

function MultiplicadorTrofeusCasa() {
	return 1 + CASA_BONUS_TROFEU * TrofeusExibidosContagem();
}

// Só dá pra exibir um troféu de conquista já desbloqueada (nível >= 1)
function TrofeuDisponivel(indice) {
	return NivelConquistaComp(indice) >= 1;
}

function AlternarTrofeuCasa(indice) {
	if (!Number.isInteger(indice) || indice < 0 || indice >= CONQUISTAS_COMP.length) return false;
	if (!TrofeuDisponivel(indice)) return false;
	trofeusExibidos = N(trofeusExibidos) ^ (1 << indice);
	return true;
}

function CompraConfortoCasa() {
	const nivel = CasaNivelValido(casaNivel);
	if (nivel >= CASA_MAX_NIVEL) {
		UI.showInfo("A Casa já está no conforto máximo!");
		return false;
	}
	const preco = CustoConfortoCasa(nivel);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	casaNivel = nivel + 1;
	UI.showInfo("Casa melhorada! Conforto nível " + casaNivel + ".");
	AutoSaveLocal();
	return true;
}

// ---- Painel ----
function FecharCasa() {
	const modal = document.getElementById("casaModal");
	if (!modal) return;
	modal.remove();
	UI.syncScreenButtons();
}

function AbrirCasa() {
	FecharCasa();

	const overlay = document.createElement("div");
	overlay.id = "casaModal";
	overlay.className = "ant-collection-overlay casa-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-labelledby", "casa-titulo");

	const panel = document.createElement("section");
	panel.className = "ant-collection-panel casa-panel";

	const header = document.createElement("header");
	header.className = "casa-header";
	const title = document.createElement("h2");
	title.id = "casa-titulo";
	title.textContent = "Casa";
	const close = document.createElement("button");
	close.type = "button";
	close.className = "casa-fechar";
	close.setAttribute("aria-label", "Fechar a Casa");
	close.textContent = "×";
	close.addEventListener("click", FecharCasa);
	header.append(title, close);

	const corpo = document.createElement("div");
	corpo.className = "casa-corpo";
	corpo.id = "casaCorpo";

	panel.append(header, corpo);
	overlay.appendChild(panel);
	overlay.addEventListener("click", event => {
		if (event.target === overlay) FecharCasa();
	});
	overlay.addEventListener("keydown", event => {
		if (event.key === "Escape") FecharCasa();
	});
	document.body.appendChild(overlay);
	UI.closeOtherPanels("casa");
	UI.syncScreenButtons();
	RenderCasaPainel();
	close.focus();
}

function RenderCasaPainel() {
	const corpo = document.getElementById("casaCorpo");
	if (!corpo) return;
	corpo.replaceChildren(CasaSecaoConforto(), CasaSecaoTrofeus());
}

function CasaSecaoConforto() {
	const nivel = CasaNivelValido(casaNivel);
	const secao = document.createElement("section");
	secao.className = "casa-secao";

	const titulo = document.createElement("h3");
	titulo.className = "casa-secao__titulo";
	titulo.textContent = "Conforto";

	const desc = document.createElement("p");
	desc.className = "casa-secao__desc";
	desc.textContent = "Uma casa mais confortável rende mais quando você volta: +"
		+ Math.round(CASA_BONUS_GOLD_NIVEL * 100) + "% de recompensa offline e +"
		+ Math.round(CASA_BONUS_TEMPO_NIVEL_MS / 60000) + " min no limite, por nível.";

	const status = document.createElement("p");
	status.className = "casa-conforto__status";
	status.textContent = "Nível " + nivel + "/" + CASA_MAX_NIVEL
		+ " · hoje: +" + Math.round((MultiplicadorOfflineCasa() - 1) * 100)
		+ "% de recompensa e +" + Math.round(CasaBonusTempoOfflineMs(nivel) / 60000) + " min de limite";

	secao.append(titulo, desc, status);

	if (nivel >= CASA_MAX_NIVEL) {
		const maximo = document.createElement("p");
		maximo.className = "casa-conforto__max";
		maximo.textContent = "Conforto máximo alcançado!";
		secao.append(maximo);
		return secao;
	}

	const preco = CustoConfortoCasa(nivel);
	const linha = document.createElement("div");
	linha.className = "casa-conforto__compra";

	const proximo = document.createElement("span");
	proximo.className = "casa-conforto__prox";
	proximo.textContent = "Próximo nível: +" + Math.round(CASA_BONUS_GOLD_NIVEL * 100 * (nivel + 1))
		+ "% de recompensa e +" + Math.round(CasaBonusTempoOfflineMs(nivel + 1) / 60000) + " min de limite";

	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "casa-comprar";
	botao.textContent = "Melhorar · " + FormatCM(preco) + " CM";
	botao.disabled = N(conhecimentoMug) < preco;
	botao.addEventListener("click", () => {
		if (CompraConfortoCasa()) RenderCasaPainel();
	});

	linha.append(proximo, botao);
	secao.append(linha);
	return secao;
}

function CasaSecaoTrofeus() {
	const secao = document.createElement("section");
	secao.className = "casa-secao";

	const titulo = document.createElement("h3");
	titulo.className = "casa-secao__titulo";
	titulo.textContent = "Sala de Troféus";

	const desc = document.createElement("p");
	desc.className = "casa-secao__desc";
	desc.textContent = "Exiba suas conquistas comportamentais: cada troféu exibido dá +"
		+ Math.round(CASA_BONUS_TROFEU * 100) + "% de gold.";

	const lista = document.createElement("div");
	lista.className = "casa-trofeus";

	CONQUISTAS_COMP.forEach((conquista, indice) => {
		const nivel = NivelConquistaComp(indice);
		const disponivel = nivel >= 1;
		const exibido = TrofeuExibido(indice);

		const item = document.createElement("button");
		item.type = "button";
		item.className = "casa-trofeu"
			+ (exibido ? " is-exibido" : "")
			+ (disponivel ? "" : " is-bloqueado");
		item.disabled = !disponivel;
		item.setAttribute("aria-pressed", String(exibido));

		const nome = document.createElement("span");
		nome.className = "casa-trofeu__nome";
		nome.textContent = conquista.nome + (nivel > 1 ? " (nível " + nivel + ")" : "");

		const estado = document.createElement("span");
		estado.className = "casa-trofeu__estado";
		estado.textContent = !disponivel ? "bloqueado" : (exibido ? "exibido ✓" : "exibir");

		item.append(nome, estado);
		item.addEventListener("click", () => {
			if (AlternarTrofeuCasa(indice)) RenderCasaPainel();
		});
		lista.appendChild(item);
	});

	const total = document.createElement("p");
	total.className = "casa-trofeus__total";
	total.textContent = TrofeusExibidosContagem() + " de " + CONQUISTAS_COMP.length + " exibidos · +"
		+ Math.round((MultiplicadorTrofeusCasa() - 1) * 100) + "% de gold";

	secao.append(titulo, desc, lista, total);
	return secao;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Casa = {
	MAX_NIVEL: CASA_MAX_NIVEL,
	nivelValido: CasaNivelValido,
	custoConforto: CustoConfortoCasa,
	multiplicadorOffline: MultiplicadorOfflineCasa,
	bonusTempoOfflineMs: CasaBonusTempoOfflineMs,
	trofeuExibido: TrofeuExibido,
	trofeusExibidosContagem: TrofeusExibidosContagem,
	multiplicadorTrofeus: MultiplicadorTrofeusCasa,
	trofeuDisponivel: TrofeuDisponivel,
	alternarTrofeu: AlternarTrofeuCasa,
	comprarConforto: CompraConfortoCasa,
	abrir: AbrirCasa,
	fechar: FecharCasa,
	render: RenderCasaPainel
};
