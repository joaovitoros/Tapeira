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

// Custo em CM do próximo nível (base 2.000 ×CUSTO_CIDADE_MULT, ×1,5 por nível)
function CustoConfortoCasa(nivel) {
	return Math.round(2000 * CUSTO_CIDADE_MULT * Math.pow(1.5, CasaNivelValido(nivel)));
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
	AtualizaHUDConhecimento();
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
	header.append(title, CriaInfoTela({
		id: "casa-info",
		rotulo: "Sobre a Casa",
		html: "<b>Como funciona</b>"
			+ "<p><b>Seu nome</b>: a identidade que aparece nos duelos da "
			+ "Batalha-fantasma (ficha e corrida).</p>"
			+ "<p><b>Conforto</b>: níveis que melhoram o que você ganha "
			+ "<b>offline</b> (+recompensa e +limite de tempo por nível), "
			+ "pagos em CM.</p>"
			+ "<p><b>Sala de Troféus</b>: exiba conquistas comportamentais — "
			+ "cada troféu exibido dá <b>+"
			+ Math.round(CASA_BONUS_TROFEU * 100) + "% de gold</b>.</p>"
			+ "<p>Tudo aqui é <b>permanente</b> (atravessa o reset).</p>"
	}), close);

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
	corpo.replaceChildren(CasaSecaoNome(), CasaSecaoConforto(), CasaSecaoCompanheiros(), CasaSecaoTrofeus(), CasaSecaoAparencia());
}

// ---- Nome do jogador ----
// Identidade permanente digitada aqui e exibida nos duelos da
// Batalha-fantasma (ficha, corrida e resultado — pvp-fantasma.js).
function CasaSecaoNome() {
	const secao = document.createElement("section");
	secao.className = "casa-secao";

	const titulo = document.createElement("h3");
	titulo.className = "casa-secao__titulo";
	titulo.textContent = "Seu nome";

	const desc = document.createElement("p");
	desc.className = "casa-secao__desc";
	desc.textContent = "É assim que você aparece nos duelos da Batalha-fantasma — "
		+ "na ficha dos duelistas e na hora da corrida. Vale pra sempre (atravessa o reset).";

	const linha = document.createElement("div");
	linha.className = "casa-nome__linha";

	const rotulo = document.createElement("label");
	rotulo.className = "casa-nome__rotulo";
	rotulo.setAttribute("for", "casaNomeJogador");
	rotulo.textContent = "Nome do jogador";

	const status = document.createElement("p");
	status.className = "casa-nome__status";
	status.textContent = StatusNomeCasa();

	const campo = document.createElement("input");
	campo.type = "text";
	campo.id = "casaNomeJogador";
	campo.className = "casa-nome__input";
	campo.value = NomeJogador();
	campo.maxLength = NOME_JOGADOR_MAX;
	campo.placeholder = "Tapeira";
	campo.setAttribute("autocomplete", "off");
	campo.setAttribute("spellcheck", "false");

	// grava ao sair do campo (change/blur) — digitação parcial não salva
	// nome pela metade no auto save
	const grava = () => {
		const antes = nomeJogador;
		nomeJogador = NormalizaNomeJogador(campo.value);
		campo.value = nomeJogador; // o campo mostra o que foi de fato gravado
		if (nomeJogador === antes) return;
		AutoSaveLocal();
		status.textContent = StatusNomeCasa();
	};
	campo.addEventListener("change", grava);
	campo.addEventListener("blur", grava);
	campo.addEventListener("keydown", evento => {
		// Enter confirma; Escape fecha o painel (o handler do overlay faz isso)
		// e o valor digitado tem que estar gravado antes de o campo sumir
		if (evento.key === "Enter") {
			evento.preventDefault();
			campo.blur();
		} else if (evento.key === "Escape") {
			grava();
		}
	});

	linha.append(rotulo, campo);
	secao.append(titulo, desc, linha, status);
	return secao;
}

function StatusNomeCasa() {
	return "No duelo você aparece como «" + NomeJogador() + "».";
}

// ---- Companheiros: foto + o que faz + a passiva ----
function CasaCompanheirosInfo() {
	return [
		{
			img: "imagens/companheiros/companheiro1.png", nome: "Companheiro 1 — Dano", nivel: N(lvlComp1) | 0,
			desc: "Ataca os inimigos junto com você: cada golpe dá " + FormataPct(danoComp1, 0) + " do seu dano.",
			passiva: "No Toque Frenético, marca um inimigo; quando a janela termina, 50% do dano acumulado nela explode em todos os inimigos vivos."
		},
		{
			img: "imagens/companheiros/companheiro2.png", nome: "Companheiro 2 — Gold", nivel: N(lvlComp2) | 0,
			desc: "Gera gold passivo por segundo (" + (25 + 10 * (Math.max(1, N(lvlComp2)) - 1)) + "% do gold de um inimigo por nível).",
			passiva: "Sem passiva especial — o ganho por segundo cresce com o nível."
		},
		{
			img: "imagens/companheiros/companheiro3.png", nome: "Companheiro 3 — Mago do Relógio", nivel: N(lvlComp3) | 0,
			desc: "A cada 5 s enche " + (PctCargaMago() * 100).toFixed(0) + "% de uma skill aleatória que ainda não está cheia.",
			passiva: "Ao encher a Pausa da fuga, ela liga sozinha e dura +50%. É a única skill que ele ainda pode escolher mesmo cheia."
		},
		{
			img: "imagens/companheiros/companheiro4.png", nome: "Companheiro 4 — Alquimista", nivel: N(lvlComp4) | 0,
			desc: "A cada 20 s sorteia um buff por 10 s: Dano ×2, Gold ×2, Velocidade ×2 ou Baú ×3.",
			passiva: "Os buffs valem no momento do ganho/golpe (não mudam os números base)."
		},
		{
			img: "imagens/companheiros/companheiro5.png", nome: "Companheiro 5 — Assassino", nivel: N(lvlComp5) | 0,
			desc: "Chance de morte instantânea: " + PctTexto(ChanceMorteAssassino(true)) + " no ataque manual (" + PctTexto(ChanceMorteAssassino(false)) + " em automáticos).",
			passiva: "Veneno: " + PctTexto(CHANCE_VENENO_ASSASSINO) + " dos golpes tiram " + PctTexto(VENENO_ASSASSINO_PCT) + " da vida máxima do andar, em qualquer golpe."
		},
		{
			img: "imagens/companheiros/companheiro6.png", nome: "Companheiro 6 — Explorador", nivel: N(lvlComp6) | 0,
			desc: "Ao vencer um andar, tem " + PctTexto(ChanceExplorador()) + " de pular andares de uma vez.",
			passiva: "A chance vem só da distância do recorde; o nível comprado é a QUANTIDADE de andares pulados (nível 5 = " + TextoAndaresExplorador(5) + ")."
		},
		{
			img: "imagens/companheiros/companheiroXP.png", nome: "Companheiro XP", nivel: N(lvlXP) | 0,
			desc: "Bônus de XP (item da loja de esmeraldas).",
			passiva: "Aumenta o XP ganho por abate — ajuda a subir de nível mais rápido."
		}
	];
}

function CasaSecaoCompanheiros() {
	const secao = document.createElement("section");
	secao.className = "casa-secao";

	const titulo = document.createElement("h3");
	titulo.className = "casa-secao__titulo";
	titulo.textContent = "Companheiros";

	const desc = document.createElement("p");
	desc.className = "casa-secao__desc";
	desc.textContent = "Seus ajudantes e o que cada um faz — com destaque pras passivas.";

	const lista = document.createElement("div");
	lista.className = "casa-companheiros";
	for (const c of CasaCompanheirosInfo()) {
		const card = document.createElement("article");
		card.className = "casa-companheiro" + (c.nivel > 0 ? "" : " is-bloqueado");

		const foto = document.createElement("img");
		foto.className = "casa-companheiro__foto";
		foto.src = c.img;
		foto.alt = "";

		const info = document.createElement("div");
		info.className = "casa-companheiro__info";
		const nome = document.createElement("strong");
		nome.className = "casa-companheiro__nome";
		nome.textContent = c.nome + (c.nivel > 0 ? " · nível " + c.nivel : " · não comprado");
		const det = document.createElement("span");
		det.className = "casa-companheiro__desc";
		det.textContent = c.desc;
		const passiva = document.createElement("span");
		passiva.className = "casa-companheiro__passiva";
		passiva.textContent = "Passiva: " + c.passiva;
		info.append(nome, det, passiva);

		card.append(foto, info);
		lista.appendChild(card);
	}

	secao.append(titulo, desc, lista);
	return secao;
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
