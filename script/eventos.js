// ============================================================
// Eventos aleatórios (Tier 2 #2 — "bônus por presença", princípios 33/34)
//
// Sete eventos: Comércio, Chuva de meteoros, Névoa do Conhecimento,
// Veia de esmeralda, Inseto fugaz, Fissura temporal e Emboscada.
// Regras transversais:
//  - gatilho só rola ao subir de andar no jogo ao vivo (nunca no offline);
//  - raro (15% por subida) com cooldown de 3 min — presença, não farm;
//  - estado 100% transitório por run: NENHUM campo novo no save/ValidarSave;
//  - o contador pausa junto com o jogo e o ESC (FechaJanelasAbertas) encerra;
//  - duração limitada: o evento some sozinho no fim do tempo.
// ============================================================

var eventoAtivo = null; // null | "comercio" | "meteoro" | "nevoa" | "veia" | "inseto" | "fissura" | "emboscada"
var eventoFimMs = 0; // timestamp de término do evento ativo
var eventoUltimoMs = 0; // timestamp do último evento (cooldown)
var eventoProximoMeteoroMs = 0; // próxima queda durante a chuva
var eventoCM = 0; // CM ganho na Névoa (contador exibido no painel)
var eventoVeiaQtd = 0; // esmeraldas soltas na Veia (contador do painel)
var eventoEmboscadaAlvos = []; // ids da onda que precisam morrer pra vencer
var eventoEmboscadaQtd = 0; // tamanho inicial da onda (progresso do painel)
var eventoEmboscadaGold = 0; // gold ganho na emboscada (bônus = "em dobro")
var eventoEmboscadaVidas = {}; // vida original de cada alvo (desfaz o +50%)
var eventoEmboscadaOnda = 0; // carimbo da onda no início (mesma onda = desfaz)
var eventoAndarBase = 0; // andar quando a emboscada começou (trocar = perdeu)
var eventoOfertas = []; // ofertas sorteadas no Comércio
var eventoTick = null; // loop de 250ms enquanto há evento
var eventoPendente = null; // início adiado (espera a transição de andar)
var eventoPausaDesde = 0; // início da pausa atual (congela a contagem do evento)

var EVENTO_COOLDOWN_MS = 3 * 60 * 1000;
var EVENTO_CHANCE = 0.15; // por subida de andar
var EVENTO_ATRASO_MS = 1600; // transição de andar dura 1450ms
var EVENTO_VEIA_CHANCE = 0.05; // chance de esmeralda por abate na Veia (metade — balanceamento)
var EVENTO_DURACAO_MS = { comercio: 45000, meteoro: 30000, nevoa: 45000, veia: 60000, inseto: 5500, fissura: 30000, emboscada: 45000 };
var EVENTO_INFO = {
	comercio: { icone: "🪙", titulo: "Comerciante itinerante", dica: "Ofertas especiais enquanto durar o evento!" },
	meteoro: { icone: "☄️", titulo: "Chuva de meteoros", dica: "Fragmentos caem no chão — clique pra coletar!" },
	nevoa: { icone: "🌫️", titulo: "Névoa do Conhecimento", dica: "Abates valem CM em dobro até o fim do evento!" },
	veia: { icone: "💎", titulo: "Veia de esmeralda", dica: "Abates podem soltar esmeraldas até o fim do evento!" },
	inseto: { icone: "🪲", titulo: "Inseto fugaz", dica: "Um inseto cruza a tela — clique nele antes que escape!" },
	fissura: { icone: "⏳", titulo: "Fissura temporal", dica: "O cronômetro de fuga ficou congelado até o fim do evento!" },
	emboscada: { icone: "⚠️", titulo: "Emboscada", dica: "Onda mais dura! Vencer dá ouro em dobro e chance de baú — fugir, nada." }
};

// Ofertas do comerciante: preço = k × gold do andar atual (escala sozinho).
var EVENTO_OFERTAS_POOL = [
	{
		id: "esmeralda", nome: "Esmeralda polida", desc: "+2 Esmeraldas", k: 30,
		comprar() {
			esmeraldas += 2;
			document.getElementById("contEmeraldas").innerHTML = esmeraldas;
			UI.showCurrencyReward("emerald", 2);
		}
	},
	{
		id: "bau", nome: "Baú comum", desc: "1 baú pra coletar agora", k: 20,
		comprar() {
			quantidadeBausDisponiveis++;
			UI.spawnChest(quantidadeBausDisponiveis);
		}
	},
	{
		id: "recarga", nome: "Recarga total", desc: "Habilidades carregadas ao máximo", k: 40,
		comprar() {
			CarregaHabilidadesDesbloqueadas(false);
		}
	},
	{
		id: "cm", nome: "Página do grimório", desc: "+15 de Conhecimento Mug", k: 120,
		comprar() {
			conhecimentoMug = N(conhecimentoMug) + 15;
			MostraStatus?.();
		}
	}
];

// ---------------------------------------------------------
// Elegibilidade / gatilho
// ---------------------------------------------------------

function ElegivelEvento(nome) {
	// Névoa é conteúdo do Conhecimento Mug: só a partir do andar 20
	if (nome === "nevoa" && andar < 20) return false;
	// Veia de esmeralda é conteúdo de mid/late game: também andar 20
	if (nome === "veia" && andar < 20) return false;
	// No desafio "sem gold" comprar falharia o desafio — não oferece
	if (nome === "comercio" && missaoAtual === 5 && missaoDesafioSub === 1) return false;
	return true;
}

// Chamado ao subir de andar (batalha.js). Sorteia um dos eventos elegíveis e
// adia o início pra depois da transição de andar.
function TentaEventoAndar() {
	if (eventoAtivo || eventoPendente) return;
	if (Date.now() - eventoUltimoMs < EVENTO_COOLDOWN_MS) return;
	if (Math.random() >= EVENTO_CHANCE) return;

	const elegiveis = ["comercio", "meteoro", "nevoa", "veia", "inseto", "fissura", "emboscada"].filter(ElegivelEvento);
	if (elegiveis.length === 0) return;
	const nome = elegiveis[Math.floor(Math.random() * elegiveis.length)];

	eventoPendente = setTimeout(() => {
		eventoPendente = null;
		IniciaEvento(nome);
	}, EVENTO_ATRASO_MS);
}

function IniciaEvento(nome) {
	if (eventoAtivo || jogoPausado) return;
	if (!ElegivelEvento(nome)) return;

	eventoAtivo = nome;
	eventoUltimoMs = Date.now();
	eventoFimMs = Date.now() + EVENTO_DURACAO_MS[nome];
	eventoCM = 0;
	eventoVeiaQtd = 0;
	eventoEmboscadaAlvos = [];
	eventoEmboscadaQtd = 0;
	eventoEmboscadaGold = 0;
	eventoEmboscadaVidas = {};
	eventoEmboscadaOnda = 0;
	eventoAndarBase = 0;
	eventoOfertas = [];

	if (nome === "comercio") {
		SorteiaOfertasComercio();
		// o comerciante em pessoa, visível só enquanto o evento dele roda
		const com = document.getElementById("comerciante");
		if (com) com.style.visibility = "visible";
	}
	if (nome === "meteoro") eventoProximoMeteoroMs = Date.now() + 1500;
	if (nome === "inseto") CriaInseto();
	if (nome === "emboscada" && !PreparaEmboscada()) {
		// sem onda viva na tela não há o que defender — aborta sem anunciar
		// (o cooldown já rola desde o sorteio)
		EncerraEvento();
		return;
	}

	const info = EVENTO_INFO[nome];
	UI.showMilestone(info.titulo, info.dica);
	ChamaSom("audio4");
	MontaPainelEvento();
	if (!eventoTick) eventoTick = setInterval(EventoTick, 250);
}

// Encerra o evento atual (ESC, ✕, fim do tempo, reset ou load). O cooldown
// só é zerado quando passado resetarCooldown = true (reset/load da run).
function EncerraEvento(resetarCooldown) {
	if (eventoPendente) {
		clearTimeout(eventoPendente);
		eventoPendente = null;
	}
	// Emboscada: desfaz o +50% de vida se ainda for a mesma onda do snapshot
	// (em fuga/avanço a onda já mudou e os inimigos nem existem mais). Nunca
	// cura além do original: Math.min preserva o dano que o jogador deu.
	if (eventoEmboscadaOnda > 0 && window.ondaAtual === eventoEmboscadaOnda) {
		for (const id in eventoEmboscadaVidas) {
			const atual = N(window["vidaInimigo" + id]);
			if (atual > 0) window["vidaInimigo" + id] = Math.min(N(eventoEmboscadaVidas[id]), atual);
		}
	}
	eventoEmboscadaVidas = {};
	eventoEmboscadaOnda = 0;
	eventoAtivo = null;
	eventoOfertas = [];
	eventoCM = 0;
	eventoVeiaQtd = 0;
	eventoEmboscadaAlvos = [];
	eventoEmboscadaQtd = 0;
	eventoEmboscadaGold = 0;
	eventoAndarBase = 0;
	eventoPausaDesde = 0;
	if (eventoTick) {
		clearInterval(eventoTick);
		eventoTick = null;
	}
	if (resetarCooldown) eventoUltimoMs = 0;

	const painel = document.getElementById("eventoPainel");
	if (painel) painel.remove();
	const fragmentos = document.getElementById("eventoFragmentos");
	if (fragmentos) fragmentos.innerHTML = "";
	// cobre todos os fins do evento (tempo, ✕, ESC, reset e load)
	const com = document.getElementById("comerciante");
	if (com) com.style.visibility = "hidden";
}

// ---------------------------------------------------------
// Loop do evento (250ms; congela quando o jogo está pausado)
// ---------------------------------------------------------

function EventoTick() {
	if (!eventoAtivo) return;
	const agora = Date.now();

	// o tempo do evento anda só com o jogo rodando: durante a pausa a
	// contagem congela (senão voltar de uma pausa longa mataria o evento)
	if (jogoPausado) {
		if (!eventoPausaDesde) eventoPausaDesde = agora;
		PausaInseto(true);
		return;
	}
	if (eventoPausaDesde) {
		const pausaMs = agora - eventoPausaDesde;
		eventoFimMs += pausaMs;
		eventoProximoMeteoroMs += pausaMs;
		eventoPausaDesde = 0;
		PausaInseto(false);
	}

	if (eventoAtivo === "meteoro" && agora >= eventoProximoMeteoroMs) {
		eventoProximoMeteoroMs = agora + 5000;
		Meteora();
	}
	// Emboscada: mudou de andar (fuga ou quota) sem limpar a onda = perdeu
	if (eventoAtivo === "emboscada" && andar !== eventoAndarBase) {
		EncerraEvento();
		return;
	}
	if (agora >= eventoFimMs) {
		// o bônus some com o tempo: avisa que era pra estar correndo
		if (eventoAtivo === "inseto") UI.showInfo("O inseto escapou sem prêmio.");
		if (eventoAtivo === "emboscada") UI.showInfo("A emboscada dissipou sem recompensa.");
		EncerraEvento();
		return;
	}
	AtualizaPainelEvento();
}

// ---------------------------------------------------------
// Painel do evento (elemento fixo, criado em runtime)
// ---------------------------------------------------------

function MontaPainelEvento() {
	if (!eventoAtivo) return;

	let painel = document.getElementById("eventoPainel");
	if (!painel) {
		painel = document.createElement("section");
		painel.id = "eventoPainel";
		document.body.appendChild(painel);
	}

	const info = EVENTO_INFO[eventoAtivo];
	let corpo = "";

	if (eventoAtivo === "comercio") {
		corpo = eventoOfertas.map((oferta, i) => `
			<div class="evento-oferta${oferta.comprada ? " evento-oferta--comprada" : ""}">
				<div class="evento-oferta__info">
					<b>${oferta.nome}</b>
					<span>${oferta.desc}</span>
				</div>
				<div class="evento-oferta__acoes">
					<span class="evento-oferta__preco">${FormatGold(PrecoOfertaEvento(oferta.k))}</span>
					<button type="button" onclick="CompraEventoOferta(${i})" ${oferta.comprada ? "disabled" : ""}>
						${oferta.comprada ? "Comprado" : "Comprar"}
					</button>
				</div>
			</div>`).join("");
	} else if (eventoAtivo === "nevoa") {
		corpo = `<div class="evento-dica">${info.dica}</div>
			<div class="evento-nevoa-contador">Ganho nesta névoa: <b id="eventoCMContador">+${eventoCM} CM</b></div>`;
	} else if (eventoAtivo === "veia") {
		corpo = `<div class="evento-dica">${info.dica}</div>
			<div class="evento-nevoa-contador">Esmeraldas nesta veia: <b id="eventoVeiaContador">+${eventoVeiaQtd}</b></div>`;
	} else if (eventoAtivo === "emboscada") {
		corpo = `<div class="evento-dica">${info.dica}</div>
			<div class="evento-nevoa-contador">Onda: <b id="eventoEmboscadaContador">${eventoEmboscadaQtd - eventoEmboscadaAlvos.length}/${eventoEmboscadaQtd}</b> de alvos abatida</div>`;
	} else {
		// meteoro, inseto e fissura: só a dica
		corpo = `<div class="evento-dica">${info.dica}</div>`;
	}

	painel.innerHTML = `
		<div class="evento-painel__cabecalho">
			<span class="evento-painel__icone" aria-hidden="true">${info.icone}</span>
			<div class="evento-painel__titulo">
				<b>${info.titulo}</b>
				<span class="evento-painel__tempo" id="eventoPainelTempo">--</span>
			</div>
			<button type="button" class="evento-painel__fechar" aria-label="Encerrar evento"
				onclick="EncerraEvento()">✕</button>
		</div>
		<div class="evento-painel__corpo">${corpo}</div>`;

	AtualizaPainelEvento();
}

function AtualizaPainelEvento() {
	const tempo = document.getElementById("eventoPainelTempo");
	if (tempo) {
		const restante = Math.max(0, Math.ceil((eventoFimMs - Date.now()) / 1000));
		tempo.textContent = restante + "s";
	}
	if (eventoAtivo === "nevoa") {
		const contador = document.getElementById("eventoCMContador");
		if (contador) contador.textContent = "+" + eventoCM + " CM";
	}
	if (eventoAtivo === "veia") {
		const contador = document.getElementById("eventoVeiaContador");
		if (contador) contador.textContent = "+" + eventoVeiaQtd;
	}
	if (eventoAtivo === "emboscada") {
		const contador = document.getElementById("eventoEmboscadaContador");
		if (contador) contador.textContent = (eventoEmboscadaQtd - eventoEmboscadaAlvos.length) + "/" + eventoEmboscadaQtd;
	}
}

// ---------------------------------------------------------
// Comércio
// ---------------------------------------------------------

// Preço em gold: k × (gold do andar atual) — acompanha a economia sozinho.
function PrecoOfertaEvento(k) {
	return Math.max(10, Math.round(N(andar) * N(mulGold) * k));
}

function SorteiaOfertasComercio() {
	const pool = EVENTO_OFERTAS_POOL.slice();
	eventoOfertas = [];
	for (let i = 0; i < 2 && pool.length > 0; i++) {
		const idx = Math.floor(Math.random() * pool.length);
		eventoOfertas.push(Object.assign({ comprada: false }, pool[idx]));
		pool.splice(idx, 1);
	}
}

function CompraEventoOferta(indice) {
	if (eventoAtivo !== "comercio") return;
	const oferta = eventoOfertas[indice];
	if (!oferta || oferta.comprada) return;

	const preco = PrecoOfertaEvento(oferta.k);
	if (!GE(gold, preco)) {
		UI.showInfo("Gold insuficiente pra essa oferta!");
		return;
	}

	PagaLoja(preco);
	oferta.comprada = true;
	document.getElementById("contGold").innerHTML = FormatGold(gold);
	ChamaSom("audio6");
	oferta.comprar();
	MontaPainelEvento();
	AutoSaveLocal();
}

// ---------------------------------------------------------
// Chuva de meteoros
// ---------------------------------------------------------

// Meteoro: um hit grátis do jogador em cada inimigo vivo + fragmentos no chão.
// Bater(id, true, false) reaproveita TODO o fluxo normal (kill, XP, gold,
// missões, cobrança de habilidades) sem duplicar regra nenhuma.
function Meteora() {
	CriaFlashMeteoro();

	const alvos = [];
	for (let id = 1; id <= 4; id++) {
		const el = document.getElementById("inimigo" + id);
		if (!el) continue;
		if (window["vidaInimigo" + id] <= 0) continue;
		if (getComputedStyle(el).visibility !== "visible") continue;
		alvos.push(id);
	}

	for (const id of alvos) {
		const el = document.getElementById("inimigo" + id);
		if (!el || window["vidaInimigo" + id] <= 0) continue;
		if (getComputedStyle(el).visibility !== "visible") continue;
		const onda = window.ondaAtual;
		Bater(id, true, false);
		// Onda nova ou andar novo no meio do hit (Bater pode matar a tela toda
		// e trocar de wave/andar): para de bater os alvos da onda antiga.
		if (window.ondaAtual !== onda) break;
	}

	CriaFragmentos();
}

function CriaFlashMeteoro() {
	const cont = GaranteContainerFragmentos();
	const flash = document.createElement("div");
	flash.className = "meteoro-flash";
	cont.appendChild(flash);
	setTimeout(() => flash.remove(), 750);
}

function CriaFragmentos() {
	const cont = GaranteContainerFragmentos();
	const base = CentroDosInimigos();
	CriaFragmento(cont, "gold", base);
	// chance de esmeralda junto com o gold (12,5% — metade do original)
	if (Math.random() < 0.125) CriaFragmento(cont, "esmeralda", base);
}

function CentroDosInimigos() {
	let somaX = 0, somaY = 0, n = 0;
	for (let id = 1; id <= 4; id++) {
		const el = document.getElementById("inimigo" + id);
		if (!el) continue;
		if (window["vidaInimigo" + id] <= 0) continue;
		if (getComputedStyle(el).visibility !== "visible") continue;
		const rect = el.getBoundingClientRect();
		somaX += rect.left + rect.width / 2;
		somaY += rect.top + rect.height / 2;
		n++;
	}
	if (n === 0) return { x: window.innerWidth / 2, y: window.innerHeight * 0.42 };
	return { x: somaX / n, y: somaY / n };
}

function CriaFragmento(cont, tipo, base) {
	const el = document.createElement(tipo === "gold" ? "div" : "img");
	el.className = "evento-fragmento evento-fragmento--" + tipo;
	el.setAttribute("role", "button");
	el.setAttribute("tabindex", "0");
	el.setAttribute("aria-label", tipo === "gold" ? "Fragmento de ouro do meteoro" : "Esmeralda do meteoro");
	if (tipo === "esmeralda") {
		el.src = "imagens/esmeralda-recompensa.svg";
		el.alt = "";
	}

	const margemX = Math.min(140, window.innerWidth * 0.18);
	const margemY = Math.min(90, window.innerHeight * 0.14);
	const x = Math.max(46, Math.min(window.innerWidth - 46, base.x + (Math.random() * 2 - 1) * margemX));
	const y = Math.max(70, Math.min(window.innerHeight - 150, base.y + (Math.random() * 2 - 1) * margemY));
	el.style.left = Math.round(x) + "px";
	el.style.top = Math.round(y) + "px";

	el.addEventListener("click", () => ColetaFragmento(tipo, el));
	el.addEventListener("keydown", (evt) => {
		if (evt.key === "Enter" || evt.key === " ") {
			evt.preventDefault();
			ColetaFragmento(tipo, el);
		}
	});

	cont.appendChild(el);
	// some sozinho em 5s (é bônus de presença: precisa estar na tela)
	setTimeout(() => el.remove(), 5000);
}

function ColetaFragmento(tipo, el) {
	if (!el || !el.parentNode) return;
	el.remove();
	ChamaSom("audio4");

	if (tipo === "gold") {
		const bonus = N(andar) * N(mulGold) * 10 + 5;
		const recebido = AddGold(bonus);
		AddTotalGold(recebido, false);
		document.getElementById("contGold").innerHTML = FormatGold(gold);
		UI.showCurrencyReward("gold", recebido);
	} else {
		esmeraldas++;
		document.getElementById("contEmeraldas").innerHTML = esmeraldas;
		UI.showCurrencyReward("emerald", 1);
	}
	AutoSaveLocal();
}

function GaranteContainerFragmentos() {
	let cont = document.getElementById("eventoFragmentos");
	if (!cont) {
		cont = document.createElement("div");
		cont.id = "eventoFragmentos";
		cont.setAttribute("aria-hidden", "true");
		document.body.appendChild(cont);
	}
	return cont;
}

// ---------------------------------------------------------
// Inseto fugaz
// ---------------------------------------------------------

// Um bicho cruza a tela (animação CSS, ~4s); clicar nele — ou Enter/Espaço —
// garante o prêmio e encerra o evento. Sem clique até o fim, some junto com
// o evento. Com movimento reduzido ele aparece parado em vez de cruzar.
function CriaInseto() {
	const cont = GaranteContainerFragmentos();
	const el = document.createElement("img");
	el.className = "evento-inseto";
	el.id = "eventoInseto";
	el.src = "imagens/inimigo.png";
	el.alt = "";
	el.setAttribute("role", "button");
	el.setAttribute("tabindex", "0");
	el.setAttribute("aria-label", "Inseto fugaz — clique pra coletar o prêmio");
	el.addEventListener("click", () => PremioInseto(el));
	el.addEventListener("keydown", (evt) => {
		if (evt.key === "Enter" || evt.key === " ") {
			evt.preventDefault();
			PremioInseto(el);
		}
	});
	cont.appendChild(el);
}

function PremioInseto(el) {
	if (eventoAtivo !== "inseto" || !el || !el.parentNode) return;
	el.remove();
	ChamaSom("audio4");

	// prêmio pequeno e garantido: mesmo valor de um fragmento de gold
	const bonus = N(andar) * N(mulGold) * 10 + 5;
	const recebido = AddGold(bonus);
	AddTotalGold(recebido, false);
	document.getElementById("contGold").innerHTML = FormatGold(gold);
	UI.showCurrencyReward("gold", recebido);
	UI.showMilestone("Pegou o inseto!", "+" + FormatGold(recebido) + " Gold");
	EncerraEvento(); //acabou cedo: o cooldown já rola desde o início
	AutoSaveLocal();
}

// A travessia é animação CSS: durante a pausa do jogo ela congela junto
// com o tempo do evento (que já congela no EventoTick).
function PausaInseto(paused) {
	const el = document.getElementById("eventoInseto");
	if (el) el.style.animationPlayState = paused ? "paused" : "running";
}

// ---------------------------------------------------------
// Névoa do Conhecimento
// ---------------------------------------------------------

// Chamado no loop de kills (batalha.js). Cada abate concede AGORA o CM que ele
// valeria no reset (o kill continua contando em derrotadosRun, então o abate da
// névoa vale o dobro no total). MultiplicadorCM (item "CM em dobro") vale aqui
// também — sem nenhum campo novo no save.
function EventoAbateCM(avancoAbates) {
	if (eventoAtivo !== "nevoa") return;
	const ganho = Math.max(0, Math.round(avancoAbates * MultiplicadorCM()));
	if (!ganho) return;

	conhecimentoMug = N(conhecimentoMug) + ganho;
	eventoCM += ganho;
	FloatCM(ganho);
}

// ---------------------------------------------------------
// Veia de esmeralda
// ---------------------------------------------------------

// Chamado no loop de kills (batalha.js): cada abate tem chance de soltar
// esmeralda na hora enquanto o evento durar. Esmeralda é moeda permanente
// (mesma regra das ofertas do Comércio) — nenhum campo novo no save.
function EventoAbateVeia(avancoAbates) {
	if (eventoAtivo !== "veia") return;
	let qtd = 0;
	for (let i = 0; i < avancoAbates; i++) {
		if (Math.random() < EVENTO_VEIA_CHANCE) qtd++;
	}
	if (!qtd) return;

	esmeraldas += qtd;
	eventoVeiaQtd += qtd;
	document.getElementById("contEmeraldas").innerHTML = esmeraldas;
	UI.showCurrencyReward("emerald", qtd);
}

// Float "+N CM" no mesmo padrão dos floats de gold/XP (ui.js)
function FloatCM(quantidade) {
	const alvo = document.querySelector(".player");
	if (!alvo || quantidade <= 0) return;

	const rect = alvo.getBoundingClientRect();
	const marker = document.createElement("div");
	const stack = document.querySelectorAll(".reward-number").length;
	marker.className = "floating-game-text reward-number reward-number--cm";
	marker.setAttribute("aria-hidden", "true");
	marker.textContent = `+${quantidade} CM`;
	marker.style.left = `${rect.left + rect.width / 2}px`;
	marker.style.top = `${rect.top + rect.height * 0.2 - stack * 24}px`;
	document.body.appendChild(marker);
	setTimeout(() => marker.remove(), 1100);
}

// ---------------------------------------------------------
// Emboscada (risk/reward — feita por último: toca nos lados sensíveis)
// ---------------------------------------------------------

// Snapshot da onda atual: os alvos que precisam morrer pra "vencer". A onda
// fica com +50% de vida (mais dura) e o bônus só sai se ela for limpa SEM
// mudar de andar. O timer de fuga e a cota do andar NÃO são alterados: o
// risco é o próprio cronômetro correndo enquanto você bate numa onda reforçada.
function PreparaEmboscada() {
	eventoAndarBase = andar;
	eventoEmboscadaOnda = window.ondaAtual || 0;

	let alvos = ContaInimigosVivos();
	if (alvos.length === 0) {
		// janela entre ondas: puxa a próxima pra não sortear emboscada vazia
		CriarInimigos();
		alvos = ContaInimigosVivos();
	}
	if (alvos.length === 0) return false;

	eventoEmboscadaAlvos = alvos;
	eventoEmboscadaQtd = alvos.length;
	for (const id of alvos) {
		// guarda o original: se a emboscada terminar sem vitória, o +50% é
		// desfeito no EncerraEvento (sem curar o dano já causado)
		eventoEmboscadaVidas[id] = N(window["vidaInimigo" + id]);
		window["vidaInimigo" + id] = eventoEmboscadaVidas[id] * 1.5;
	}
	return true;
}

function ContaInimigosVivos() {
	const vivos = [];
	for (let id = 1; id <= 4; id++) {
		const el = document.getElementById("inimigo" + id);
		// conta por vida, não por visibility: os inimigos nascem com
		// visibility hidden e só ficam visíveis 600ms depois (spawnEnemies)
		if (!el) continue;
		if (N(window["vidaInimigo" + id]) <= 0) continue;
		vivos.push(id);
	}
	return vivos;
}

// Chamado no loop de kills (batalha.js) com o gold já creditado: acumula o
// ouro da onda (o bônus dobra exatamente isso) e marca o alvo morto. Vencer
// = limpar TODOS os alvos do snapshot antes do fim do evento.
function EventoAbateEmboscada(inimigoDerrotado, goldRecebido) {
	if (eventoAtivo !== "emboscada") return;
	// mudou de andar no meio do kill (fuga ou quota) = emboscada perdida
	if (andar !== eventoAndarBase) {
		EncerraEvento();
		return;
	}

	eventoEmboscadaGold += N(goldRecebido);
	const idx = eventoEmboscadaAlvos.indexOf(inimigoDerrotado);
	if (idx >= 0) eventoEmboscadaAlvos.splice(idx, 1);

	if (eventoEmboscadaAlvos.length === 0) VenceuEmboscada();
}

// Pagamento: devolve em gold exatamente o que a onda pagou durante a
// emboscada (→ "ouro em dobro") + rolo de baú (40%). Encerra ANTES de pagar
// pra nenhum payout reentrar no estado do evento.
function VenceuEmboscada() {
	if (eventoAtivo !== "emboscada") return;
	const bonus = Math.max(0, N(eventoEmboscadaGold));
	const bau = Math.random() < 0.4;
	EncerraEvento();

	if (bonus > 0) {
		const recebido = AddGold(bonus);
		AddTotalGold(recebido, false);
		document.getElementById("contGold").innerHTML = FormatGold(gold);
		UI.showCurrencyReward("gold", recebido);
	}
	if (bau) {
		quantidadeBausDisponiveis++;
		UI.spawnChest(quantidadeBausDisponiveis);
	}
	UI.showMilestone("Emboscada vencida!", bau
		? "Ouro em dobro e um baú pela recompensa!"
		: "Ouro em dobro garantido!");
	ChamaSom("audio4");
	AutoSaveLocal();
}
