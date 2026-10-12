// ===================== FAZENDA DE FORMIGAS (hub da Cidade) ================
// Complementa recompensas.js (formigas): produção passiva num timer que reusa
// ConcedeFormigaColecao (o MESMO drop), e a Rainha multiplica a produção.
// Tudo PERMANENTE: não zera no Resetar (só no ZerarTodosSaves), como o CM.
// Scripts clássicos: funções globais; o painel é montado no DOM no runtime,
// reusando .ant-collection-overlay/.ant-collection-panel.

const FAZENDA_MAX_NIVEL = 10;
const FAZENDA_RAINHA_MAX = 5;

// Estado do PAINEL (não vai pro save): quando o ciclo atual começou (barra de
// progresso), o tick do painel enquanto aberto, o aviso da última produção e
// os timeouts das animações (limpos ao fechar).
let inicioCicloFazendaMs = Date.now();
let intervaloFazendaPainel = null;
let seqProducaoFazenda = 0;
let ultimaProducaoFazenda = null;
let seqVistoPainelFazenda = 0;
let timeoutsPainelFazenda = [];

function FazendaNivelValido(nivel) {
	const n = Math.floor(Number(nivel) || 0);
	return Math.max(0, Math.min(FAZENDA_MAX_NIVEL, n));
}

function FazendaRainhaValida(nivel) {
	const n = Math.floor(Number(nivel) || 0);
	return Math.max(0, Math.min(FAZENDA_RAINHA_MAX, n));
}

// Custo em CM: nível base 3.000 (×1,45 por nível); Rainha base 6.000 (×1,8 por nível)
function CustoFazendaNivel(nivel) {
	return Math.round(3000 * Math.pow(1.45, FazendaNivelValido(nivel)));
}

function CustoFazendaRainha(nivel) {
	return Math.round(6000 * Math.pow(1.8, FazendaRainhaValida(nivel)));
}

// Intervalo base por nível: 90 s no nível 1, −6 s por nível (mín 30 s).
// Nível 0 = sem produção.
function IntervaloFazendaBaseMs(nivel = fazendaNivel) {
	const n = FazendaNivelValido(nivel);
	if (n <= 0) return Infinity;
	return Math.max(30000, 90000 - 6000 * (n - 1));
}

// A Rainha multiplica a produção: encurta o intervalo efetivo (+30% por nível)
function MultiplicadorRainhaFazenda(rainha = fazendaRainha) {
	return 1 + 0.3 * FazendaRainhaValida(rainha);
}

function IntervaloFazendaMs(nivel = fazendaNivel, rainha = fazendaRainha) {
	const base = IntervaloFazendaBaseMs(nivel);
	if (!Number.isFinite(base)) return Infinity;
	// Cristal (Cidade): amplia a produção da Fazenda (intervalo mais curto)
	const cristal = (typeof MultiplicadorCristal === "function") ? MultiplicadorCristal() : 1;
	return Math.max(12000, Math.round(base / MultiplicadorRainhaFazenda(rainha) / cristal));
}

// Formigas por minuto (rótulo do painel)
function FormigasPorMinutoFazenda(nivel = fazendaNivel, rainha = fazendaRainha) {
	const ms = IntervaloFazendaMs(nivel, rainha);
	return Number.isFinite(ms) && ms > 0 ? 60000 / ms : 0;
}

// Um ciclo: 1 formiga aleatória entra na coleção (reusa o drop existente)
function ProduzFormigasFazenda() {
	if (jogoPausado) return false;
	if (N(fazendaNivel) <= 0) return false;
	if (!FormigasDesbloqueadas()) return false;
	const formiga = FORMIGAS[Math.floor(Math.random() * FORMIGAS.length)];
	ConcedeFormigaColecao(formiga);
	// marca a produção (o painel usa pra pulsar o cartão certo) e reinicia o ciclo
	seqProducaoFazenda += 1;
	ultimaProducaoFazenda = { id: formiga.id, seq: seqProducaoFazenda };
	inicioCicloFazendaMs = Date.now();
	return true;
}

// Handle gerenciado: limpo e recriado no load/reset e a cada compra
function SincronizaIntervaloFazenda() {
	if (intervaloFazenda !== null) clearInterval(intervaloFazenda);
	intervaloFazenda = null;
	const ms = IntervaloFazendaMs();
	inicioCicloFazendaMs = Date.now();
	if (Number.isFinite(ms) && ms > 0) intervaloFazenda = setInterval(ProduzFormigasFazenda, ms);
}

function CompraFazendaNivel() {
	const nivel = FazendaNivelValido(fazendaNivel);
	if (nivel >= FAZENDA_MAX_NIVEL) {
		UI.showInfo("A Fazenda já está no nível máximo!");
		return false;
	}
	const preco = CustoFazendaNivel(nivel);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	fazendaNivel = nivel + 1;
	SincronizaIntervaloFazenda();
	UI.showInfo("Fazenda melhorada! Nível " + fazendaNivel + ".");
	AutoSaveLocal();
	return true;
}

function CompraFazendaRainha() {
	const nivel = FazendaRainhaValida(fazendaRainha);
	if (nivel >= FAZENDA_RAINHA_MAX) {
		UI.showInfo("A Rainha já está no nível máximo!");
		return false;
	}
	const preco = CustoFazendaRainha(nivel);
	if (N(conhecimentoMug) < preco) {
		UI.showInfo("Você não tem Conhecimento Mug suficiente!");
		return false;
	}
	conhecimentoMug = N(conhecimentoMug) - preco;
	fazendaRainha = nivel + 1;
	SincronizaIntervaloFazenda();
	UI.showInfo("Rainha evoluída! Nível " + fazendaRainha + ".");
	AutoSaveLocal();
	return true;
}

// ---- Painel: barra de progresso + feedback de produção ----
// O tick roda só com o painel aberto e se encerra sozinho se o modal sumir
// (ele pode ser fechado por outro caminho, ex.: ESC).
function PararTickPainelFazenda() {
	if (intervaloFazendaPainel !== null) clearInterval(intervaloFazendaPainel);
	intervaloFazendaPainel = null;
	timeoutsPainelFazenda.forEach(clearTimeout);
	timeoutsPainelFazenda = [];
}

function IniciaTickPainelFazenda() {
	PararTickPainelFazenda();
	// parte do estado atual: não dispara o pulso de uma produção antiga
	seqVistoPainelFazenda = ultimaProducaoFazenda ? ultimaProducaoFazenda.seq : 0;
	intervaloFazendaPainel = setInterval(TickPainelFazenda, 250);
	TickPainelFazenda();
}

function TickPainelFazenda() {
	if (!document.getElementById("fazendaModal")) { PararTickPainelFazenda(); return; }

	// produção nova? re-renderiza (números atualizados) e pulsa o cartão
	const seq = ultimaProducaoFazenda ? ultimaProducaoFazenda.seq : 0;
	if (seq !== seqVistoPainelFazenda) {
		const produzida = ultimaProducaoFazenda ? ultimaProducaoFazenda.id : null;
		seqVistoPainelFazenda = seq;
		RenderFazendaPainel();
		if (produzida) FeedbackProducaoFazenda(produzida);
	}

	// barra de progresso do próximo ciclo
	const fill = document.getElementById("fazendaBarraFill");
	const tempo = document.getElementById("fazendaTempo");
	if (!fill) return;
	const ms = IntervaloFazendaMs();
	if (!Number.isFinite(ms) || ms <= 0) {
		fill.style.width = "0%";
		if (tempo) tempo.textContent = "sem produção";
		return;
	}
	const decorrido = Math.max(0, Date.now() - inicioCicloFazendaMs);
	const pct = Math.max(0, Math.min(1, decorrido / ms));
	fill.style.width = (pct * 100).toFixed(1) + "%";
	if (tempo) {
		tempo.textContent = jogoPausado
			? "produção pausada"
			: "Próxima formiga em " + Math.max(0, Math.ceil((ms - decorrido) / 1000)) + " s";
	}
}

// Pulsa o cartão da cor produzida e solta um "+1 <cor>" flutuante na produção
function FeedbackProducaoFazenda(id) {
	const modal = document.getElementById("fazendaModal");
	if (!modal) return;
	const card = modal.querySelector('.ant-collection-card[data-formiga="' + id + '"]');
	if (card) {
		card.classList.add("is-produzindo");
		timeoutsPainelFazenda.push(setTimeout(() => card.classList.remove("is-produzindo"), 900));
	}
	const secao = document.getElementById("fazendaProducaoBarra")
		|| document.getElementById("fazendaProducaoSecao");
	if (secao) {
		const formiga = FORMIGAS.find(f => f.id === id);
		const flutua = document.createElement("span");
		flutua.className = "fazenda-mais1";
		flutua.textContent = "+1" + (formiga ? " " + formiga.nome.toLowerCase() : "");
		secao.appendChild(flutua);
		timeoutsPainelFazenda.push(setTimeout(() => flutua.remove(), 1300));
	}
}

// ---- Painel ----
function FecharFazenda() {
	const modal = document.getElementById("fazendaModal");
	if (!modal) return;
	PararTickPainelFazenda();
	modal.remove();
	UI.syncScreenButtons();
}

function AbrirFazenda() {
	FecharFazenda();

	const overlay = document.createElement("div");
	overlay.id = "fazendaModal";
	overlay.className = "ant-collection-overlay fazenda-overlay";
	overlay.setAttribute("role", "dialog");
	overlay.setAttribute("aria-modal", "true");
	overlay.setAttribute("aria-labelledby", "fazenda-titulo");

	const panel = document.createElement("section");
	panel.className = "ant-collection-panel fazenda-panel";

	const header = document.createElement("header");
	header.className = "fazenda-header";
	const title = document.createElement("h2");
	title.id = "fazenda-titulo";
	title.textContent = "Fazenda de Formigas";
	const close = document.createElement("button");
	close.type = "button";
	close.className = "fazenda-fechar";
	close.setAttribute("aria-label", "Fechar a Fazenda");
	close.textContent = "×";
	close.addEventListener("click", FecharFazenda);
	header.append(title, close);

	const corpo = document.createElement("div");
	corpo.className = "fazenda-corpo";
	corpo.id = "fazendaCorpo";

	panel.append(header, corpo);
	overlay.appendChild(panel);
	overlay.addEventListener("click", event => {
		if (event.target === overlay) FecharFazenda();
	});
	overlay.addEventListener("keydown", event => {
		if (event.key === "Escape") FecharFazenda();
	});
	document.body.appendChild(overlay);
	UI.closeOtherPanels("fazenda");
	UI.syncScreenButtons();
	RenderFazendaPainel();
	IniciaTickPainelFazenda();
	close.focus();
}

function RenderFazendaPainel() {
	const corpo = document.getElementById("fazendaCorpo");
	if (!corpo) return;
	corpo.replaceChildren(
		FazendaSecaoProducao(),
		FazendaSecaoRainha(),
		FazendaSecaoColecao()
	);
}

function FazendaBotaoCompra(texto, preco, compra) {
	const botao = document.createElement("button");
	botao.type = "button";
	botao.className = "fazenda-comprar";
	botao.textContent = texto + " · " + FormatCM(preco) + " CM";
	botao.disabled = N(conhecimentoMug) < preco;
	botao.addEventListener("click", () => {
		if (compra()) RenderFazendaPainel();
	});
	return botao;
}

// Barra de progresso do próximo ciclo (o TickPainelFazenda preenche)
function FazendaBarraProducao() {
	const caixa = document.createElement("div");
	caixa.className = "fazenda-producao";
	caixa.id = "fazendaProducaoBarra";

	const trilha = document.createElement("div");
	trilha.className = "fazenda-producao__trilha";
	const fill = document.createElement("span");
	fill.className = "fazenda-producao__fill";
	fill.id = "fazendaBarraFill";
	trilha.appendChild(fill);

	const tempo = document.createElement("span");
	tempo.className = "fazenda-producao__tempo";
	tempo.id = "fazendaTempo";

	caixa.append(trilha, tempo);
	return caixa;
}

function FazendaSecaoProducao() {
	const nivel = FazendaNivelValido(fazendaNivel);
	const secao = document.createElement("section");
	secao.className = "fazenda-secao";
	secao.id = "fazendaProducaoSecao";

	const titulo = document.createElement("h3");
	titulo.className = "fazenda-secao__titulo";
	titulo.textContent = "Produção";

	const desc = document.createElement("p");
	desc.className = "fazenda-secao__desc";
	desc.textContent = "A Fazenda produz sozinha: 1 formiga aleatória por ciclo entra direto na sua coleção permanente.";

	const status = document.createElement("p");
	status.className = "fazenda-status";
	if (nivel <= 0) {
		status.textContent = "Ainda não construída — compre o nível 1 para começar a produção.";
	} else {
		status.textContent = "Nível " + nivel + "/" + FAZENDA_MAX_NIVEL
			+ " · 1 formiga a cada " + Math.round(IntervaloFazendaMs() / 1000) + " s (~"
			+ FormigasPorMinutoFazenda().toFixed(1) + "/min)";
	}

	secao.append(titulo, desc, status);
	if (nivel > 0) secao.append(FazendaBarraProducao());

	if (nivel >= FAZENDA_MAX_NIVEL) {
		const maximo = document.createElement("p");
		maximo.className = "fazenda-max";
		maximo.textContent = "Produção no nível máximo!";
		secao.append(maximo);
		return secao;
	}

	const linha = document.createElement("div");
	linha.className = "fazenda-compra";
	const prox = document.createElement("span");
	prox.className = "fazenda-prox";
	prox.textContent = "Próximo nível: 1 formiga a cada "
		+ Math.round(IntervaloFazendaMs(nivel + 1, fazendaRainha) / 1000) + " s";
	linha.append(prox, FazendaBotaoCompra("Construir/Melhorar", CustoFazendaNivel(nivel), CompraFazendaNivel));
	secao.append(linha);
	return secao;
}

function FazendaSecaoRainha() {
	const nivel = FazendaRainhaValida(fazendaRainha);
	const secao = document.createElement("section");
	secao.className = "fazenda-secao";

	const titulo = document.createElement("h3");
	titulo.className = "fazenda-secao__titulo";
	titulo.textContent = "Rainha";

	const desc = document.createElement("p");
	desc.className = "fazenda-secao__desc";
	desc.textContent = "A Rainha multiplica a colônia: +30% de produção (intervalo mais curto) por nível.";

	const status = document.createElement("p");
	status.className = "fazenda-status";
	status.textContent = "Nível " + nivel + "/" + FAZENDA_RAINHA_MAX
		+ " · produção ×" + MultiplicadorRainhaFazenda().toFixed(2);

	secao.append(titulo, desc, status);

	if (nivel >= FAZENDA_RAINHA_MAX) {
		const maximo = document.createElement("p");
		maximo.className = "fazenda-max";
		maximo.textContent = "Rainha no nível máximo!";
		secao.append(maximo);
		return secao;
	}

	const linha = document.createElement("div");
	linha.className = "fazenda-compra";
	const prox = document.createElement("span");
	prox.className = "fazenda-prox";
	prox.textContent = "Próximo nível: produção ×" + MultiplicadorRainhaFazenda(nivel + 1).toFixed(2);
	linha.append(prox, FazendaBotaoCompra("Evoluir Rainha", CustoFazendaRainha(nivel), CompraFazendaRainha));
	secao.append(linha);
	return secao;
}

function FazendaSecaoColecao() {
	const secao = document.createElement("section");
	secao.className = "fazenda-secao";
	const titulo = document.createElement("h3");
	titulo.className = "fazenda-secao__titulo";
	titulo.textContent = "Coleção";
	secao.append(titulo);
	// reusa o conteúdo da coleção de formigas (mesmos cartões do painel Formigas)
	secao.append(UI.criaConteudoFormigas());
	return secao;
}

window.Tapeira = window.Tapeira || {};
window.Tapeira.Fazenda = {
	MAX_NIVEL: FAZENDA_MAX_NIVEL,
	RAINHA_MAX: FAZENDA_RAINHA_MAX,
	nivelValido: FazendaNivelValido,
	rainhaValida: FazendaRainhaValida,
	custoNivel: CustoFazendaNivel,
	custoRainha: CustoFazendaRainha,
	intervaloMs: IntervaloFazendaMs,
	formigasPorMinuto: FormigasPorMinutoFazenda,
	multiplicadorRainha: MultiplicadorRainhaFazenda,
	produz: ProduzFormigasFazenda,
	sincroniza: SincronizaIntervaloFazenda,
	comprarNivel: CompraFazendaNivel,
	comprarRainha: CompraFazendaRainha,
	painelTickAtivo: () => intervaloFazendaPainel !== null,
	abrir: AbrirFazenda,
	fechar: FecharFazenda,
	render: RenderFazendaPainel
};
