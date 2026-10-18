// ===================== COMPANHEIROS =====================================
// Criacao visual, ticks, buffs e efeitos dos companheiros.
// Precos e niveis ficam em script.js (compartilhados com loja e save).
// APIs globais mantidas para compatibilidade com os scripts classicos.

// ============================================================
// NOVOS COMPANHEIROS (Fauna Fantástica)
// ============================================================
// Companheiro 3 (Mago do Relógio): a cada 5s enche 10% da barra de
// uma skill aleatória (substituiu o bônus de tempo).
// Companheiro 4 (Alquimista): a cada 20s sorteia um buff por 10s.
// Companheiro 5 (Assassino): passiva — ataque tem chance de matar
//   instantaneamente (0,5% manual; metade em automáticos/companheiro).
// Companheiro 6 (Explorador do mapa): chance de pular vários andares
//   por vez — a chance vem SÓ da distância e o nível comprado é a
//   QUANTIDADE de andares pulados (nv 1 = +1 andar, nv 5 = +5 andares).

// Chance do Explorador pular andares: independe do nível (base fixa de
// 5% × bônus de distância do recorde — ×(1 + 2% por andar abaixo de
// maxAndar)), com teto de 90%. Fonte única — usada pelo combate
// (batalha.js), pelo Status (ui.js) e pelo preview da loja.
function ChanceExplorador() {
	const distancia = Math.max(0, N(maxAndar) - N(andar));
	return Math.min(0.9, 0.05 * (1 + 0.02 * distancia));
}

// Quantidade de andares pulados por ativação = nível comprado. A trava
// de 50 protege contra save corrompido: o preço dobra por nível, então o
// teto real de uma compra legítima fica muito abaixo disso.
function AndaresPuladosExplorador() {
	return Math.min(50, Math.max(0, Math.floor(N(lvlComp6) || 0)));
}

// "+1 andar" / "+5 andares" — rótulo compartilhado pelo Status e pelo
// preview da loja
function TextoAndaresExplorador(qtd) {
	const q = Math.max(1, Math.floor(N(qtd) || 0));
	return "+" + q + (q === 1 ? " andar" : " andares");
}

// Tenta o pulo do Explorador logo após vencer um andar: uma rolagem por
// andar vencido e, no sucesso, pula N andares (N = nível comprado).
// Retorna quantos andares pulou (0 = sem pulo).
function TentaPuloExplorador() {
	if (N(lvlComp6) <= 0) return 0;
	if (Math.random() >= ChanceExplorador()) return 0;
	const pular = AndaresPuladosExplorador();
	for (let i = 0; i < pular; i++) SobeUmAndar();
	return pular;
}

// ============================================================
// COMPANHEIRO 1 (dano) + TOQUE FRENÉTICO
// ============================================================
// Quando a janela do Frenesi ativa, o companheiro de dano marca um inimigo
// aleatório (1 ou 2, só os vivos) e cada hit DURANTE a janela acumula dano
// real. Quando a janela TERMINA, 50% do acumulado explode em todos os inimigos
// vivos. A passiva só existe a partir do nível 5 do companheiro. Estado de
// janela: não é salvo; zera no reset e a cada nova ativação.
var alvoFrenesiComp = 0;       // id do inimigo marcado (0 = sem marca)
var danoJanelaFrenesiComp = 0; // dano acumulado durante a janela ativa
// Fração do acumulado que explode no fim da janela (fonte única do balance)
const FRENESI_SPLASH_PCT = 0.5;

// --------- Visual da marca (anel pulsante) e do dano bônus (flash) ------
// Só DOM/efeito — nada aqui entra no save. O anel é uma div fixa no chão,
// no mesmo padrão do anel de surgimento (SurgeInimigo, ui-combate.js).

function MostraAnelFrenesiComp(id) {
	if (id <= 0) return;
	const el = document.getElementById("inimigo" + id);
	if (!el || document.getElementById("frenesi-anel-" + id)) return;
	const rect = el.getBoundingClientRect();
	const anel = document.createElement("div");
	anel.className = "inimigo-frenesi-anel";
	anel.id = "frenesi-anel-" + id;
	anel.setAttribute("aria-hidden", "true");
	anel.style.left = `${rect.left + rect.width / 2}px`;
	anel.style.top = `${rect.top + rect.height * 0.62}px`;
	anel.style.width = `${rect.width * 0.95}px`;
	anel.style.height = `${rect.height * 0.42}px`;
	document.body.appendChild(anel);
}

function RemoveAnelFrenesiComp(id) {
	if (id <= 0) return;
	document.getElementById("frenesi-anel-" + id)?.remove();
}

function LimpaAnelFrenesiComp() {
	document.querySelectorAll(".inimigo-frenesi-anel").forEach(anel => anel.remove());
}

// Flash vermelho (filter) em quem sofre o dano bônus do splash. Não mexe em
// transform, então não briga com o animarImpacto; o listener some com a
// classe quando o CSS termina (ignora animações de outro nome no mesmo el).
function FlashDanoFrenesiComp(el) {
	if (!el) return;
	el.classList.remove("inimigo--frenesi-dano");
	void el.offsetWidth;
	el.classList.add("inimigo--frenesi-dano");
	const fim = (evento) => {
		if (evento.animationName !== "inimigo-frenesi-dano") return;
		el.classList.remove("inimigo--frenesi-dano");
		el.removeEventListener("animationend", fim);
	};
	el.addEventListener("animationend", fim);
}

// Centro da explosão: no alvo marcado se ele ainda estiver na tela; senão no
// primeiro inimigo vivo; senão no meio do #game-root.
function CentroExplosaoFrenesiComp(marca = 0) {
	for (const id of [marca, 1, 2, 3, 4]) {
		if (!id) continue;
		const el = document.getElementById("inimigo" + id);
		if (!el || getComputedStyle(el).visibility === "hidden") continue;
		const r = el.getBoundingClientRect();
		if (r.width > 0) return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
	}
	const raiz = document.getElementById("game-root") || document.documentElement;
	const r = raiz.getBoundingClientRect();
	return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

// Efeito GRANDE e visível no momento do dano bônus: núcleo brilhante + onda de
// choque no alvo marcado e um flash de tela curto. Some sozinho no fim da
// animação (o reduced-motion encurta pra 1ms, como os outros efeitos). Puro DOM.
function EfeitoExplosaoFrenesiComp(marca = 0) {
	const centro = CentroExplosaoFrenesiComp(marca);

	const explosao = document.createElement("div");
	explosao.className = "frenesi-explosao";
	explosao.setAttribute("aria-hidden", "true");
	explosao.style.left = centro.x + "px";
	explosao.style.top = centro.y + "px";

	const nucleo = document.createElement("span");
	nucleo.className = "frenesi-explosao__nucleo";
	const onda = document.createElement("span");
	onda.className = "frenesi-explosao__onda";
	explosao.append(nucleo, onda);

	document.body.appendChild(explosao);
	explosao.addEventListener("animationend", () => explosao.remove(), { once: true });

	const flash = document.createElement("div");
	flash.className = "frenesi-flash-tela";
	flash.setAttribute("aria-hidden", "true");
	document.body.appendChild(flash);
	flash.addEventListener("animationend", () => flash.remove(), { once: true });
}

// Sorteia o alvo entre os inimigos 1 e 2 vivos. Retorna o id marcado (0 =
// sem companheiro de dano comprado ou ninguém elegível na tela).
function MarcaAlvoFrenesiComp() {
	const marcaAnterior = alvoFrenesiComp;
	alvoFrenesiComp = 0;
	danoJanelaFrenesiComp = 0;
	RemoveAnelFrenesiComp(marcaAnterior); // reativação troca o anel de alvo
	if (N(lvlComp1) < 5) return 0;
	const elegiveis = [1, 2].filter(id => N(window["vidaInimigo" + id]) > 0);
	if (elegiveis.length === 0) return 0;
	alvoFrenesiComp = elegiveis[Math.floor(Math.random() * elegiveis.length)];
	MostraAnelFrenesiComp(alvoFrenesiComp);
	return alvoFrenesiComp;
}

// Acumula o dano causado por um hit enquanto a janela do Frenesi está
// ativa. O chamador deve capturar a janela ANTES do toque consumi-la
// (batalha.js) e passar em naJanela — o default cobre chamadas soltas.
function RegistraDanoFrenesiComp(dano, naJanela = ataquesFrenesi > 0) {
	if (naJanela && alvoFrenesiComp > 0) {
		danoJanelaFrenesiComp += Math.max(0, N(dano));
	}
}

// Explode FRENESI_SPLASH_PCT (50%) do acumulado contra todos os inimigos vivos
// quando a janela do Frenesi TERMINA (não precisa mais matar o alvo marcado).
// Dispara o efeito visual da explosão e limpa a marca (uma explosão por marca);
// retorna os ids abatidos pela explosão — o chamador os insere no mesmo fluxo
// de recompensas do abate normal (batalha.js).
function SplashFrenesiComp() {
	if (alvoFrenesiComp <= 0) return [];
	const marca = alvoFrenesiComp;
	alvoFrenesiComp = 0;
	RemoveAnelFrenesiComp(marca);
	const dano = Math.max(0, N(danoJanelaFrenesiComp)) * FRENESI_SPLASH_PCT;
	danoJanelaFrenesiComp = 0;
	if (dano <= 0) return [];
	// efeito GRANDE e visível no momento exato do dano bônus
	EfeitoExplosaoFrenesiComp(marca);
	const mortos = [];
	for (let id = 1; id <= 4; id++) {
		if (id === marca) continue;
		const vida = N(window["vidaInimigo" + id]);
		if (vida <= 0) continue;
		const restante = Math.max(0, vida - dano);
		window["vidaInimigo" + id] = restante;
		const el = document.getElementById("inimigo" + id);
		if (el) {
			UI.showDamageNumber(el, Math.min(dano, vida), false);
			if (restante <= 0) animarMorte(el); else animarImpacto(el, false);
			FlashDanoFrenesiComp(el);
		}
		DesceVida(id);
		if (restante <= 0) mortos.push(id);
	}
	return mortos;
}

// Buffs do Alquimista: tipo → multiplicador e nome amigável
const BUFFS_ALQUIMISTA = [
	{ tipo: "dano",     mult: 2,   nome: "Dano ×2" },
	{ tipo: "gold",     mult: 2,   nome: "Gold ×2" },
	{ tipo: "velocidade", mult: 2, nome: "Velocidade ×2" },
	{ tipo: "bau",      mult: 3,   nome: "Baú ×3" }
];
const DURACAO_BUFF_MS = 10000; // 10s

// Verifica se o buff do tipo está vigente (e limpa o expirado)
function BuffAtivo(tipo) {
	if (!buffAtivo) return false;
	if (Date.now() >= buffAtivo.fimMs) {
		buffAtivo = null;
		return false;
	}
	return buffAtivo.tipo === tipo;
}

function MultiplicadorBuffDano() { return BuffAtivo("dano") ? 2 : 1; }
function MultiplicadorBuffGold() { return BuffAtivo("gold") ? 2 : 1; }
function MultiplicadorBuffVelocidade() { return BuffAtivo("velocidade") ? 2 : 1; }
function MultiplicadorBuffBau() { return BuffAtivo("bau") ? 3 : 1; }

// Sorteia e aplica um buff aleatório (chamado a cada 20s pelo Alquimista)
function SorteiaBuffAlquimista() {
	if (jogoPausado || fugaEmAndamento) return;
	if (lvlComp4 <= 0) return;
	const sorteado = BUFFS_ALQUIMISTA[Math.floor(Math.random() * BUFFS_ALQUIMISTA.length)];
	buffAtivo = { tipo: sorteado.tipo, fimMs: Date.now() + DURACAO_BUFF_MS };
	UI.showInfo("Alquimista: " + sorteado.nome + " por 10s!");
	AtualizaBuffAlquimistaUI();
}

// Indicador do buff ativo no HUD (cria/atualiza/remove o selo)
function AtualizaBuffAlquimistaUI() {
	let selo = document.getElementById("buffAlquimista");
	if (!buffAtivo || Date.now() >= buffAtivo.fimMs) {
		selo?.remove();
		return;
	}
	const info = BUFFS_ALQUIMISTA.find(b => b.tipo === buffAtivo.tipo);
	if (!info) return;
	if (!selo) {
		selo = document.createElement("div");
		selo.id = "buffAlquimista";
		selo.className = "buff-alquimista";
		// Vive num container próprio (item 3), ancorado ACIMA da fileira de
		// habilidades e com a mesma prioridade de visibilidade dela (z-index 15).
		// No menu, onde não há a fileira, cai no body.
		let recipienteBuffs = document.getElementById("recipienteBuffs");
		if (!recipienteBuffs) {
			const fileira = document.getElementById("container-Habilidades");
			if (fileira) {
				recipienteBuffs = document.createElement("div");
				recipienteBuffs.id = "recipienteBuffs";
				recipienteBuffs.className = "recipiente-buffs";
				recipienteBuffs.setAttribute("aria-live", "polite");
				fileira.appendChild(recipienteBuffs);
			}
		}
		(recipienteBuffs || document.body).appendChild(selo);
	}
	const resta = Math.max(0, Math.ceil((buffAtivo.fimMs - Date.now()) / 1000));
	selo.innerHTML = "🧪 " + info.nome + " (" + resta + "s)";
}

// ---- Efeitos por nível dos novos companheiros (3, 4 e 5) ----
// Mago: fatia da skill preenchida por disparo — 10% no nv1, +2% por nível
// (teto 50%)
function PctCargaMago() {
	return Math.min(0.50, 0.10 + 0.02 * Math.max(0, Math.floor(Number(lvlComp3) || 0) - 1));
}

// Alquimista: intervalo entre buffs — 20s no nv1, −1s por nível (mín 10s)
function IntervaloAlquimistaMs() {
	return Math.max(10000, 20000 - 1000 * Math.max(0, Math.floor(Number(lvlComp4) || 0) - 1));
}

// Assassino: chance de morte instantânea — 1% no nv1, +0,1% por nível;
// a metade (0,5% +0,05%) vale nos golpes automáticos e do companheiro
function ChanceMorteAssassino(manual) {
	const n = Math.max(0, Math.floor(Number(lvlComp5) || 0) - 1);
	return (manual ? 0.01 : 0.005) + (manual ? 0.001 : 0.0005) * n;
}

// Assassino: passiva de veneno — 2% dos golpes tiram 5% da vida máxima do
// andar (vidaAndar), em qualquer golpe (jogador, automático ou companheiro)
const CHANCE_VENENO_ASSASSINO = 0.02;
const VENENO_ASSASSINO_PCT = 0.05;

// Mago do Relógio: lista as skills que ele pode sortear agora.
// Entram as skills desbloqueadas que ainda têm espaço — inclusive a de Dano
// (barra própria: qtdCarregaHabilidade/abateshabilidadeDano), que continua
// valendo mesmo quando as de combate estão cheias.
// A Pausa da fuga (skill de tempo) é a ÚNICA que entra MESMO CHEIA: é assim
// que o Mago ainda tem chance de ligar a passiva dele (a skill ativa sozinha e
// dura 50% a mais). Ela só entra quando não está ativa, pra não redisparar.
function CandidatasMago() {
	const candidatas = [];
	if (qtdCarregaHabilidade < abateshabilidadeDano) candidatas.push("dano");
	habilidadesCombate.forEach(skill => {
		if (skill.id === "escape") return; // tratada à parte (pode entrar cheia)
		if (maxAndar < skill.unlockFloor) return;
		const atual = ContagemSkill(skill.id);
		if (atual < skill.killsRequired) candidatas.push(skill.id);
	});
	const escape = habilidadesCombate.find(s => s.id === "escape");
	if (escape && maxAndar >= escape.unlockFloor && segundosPausaFuga === 0 && !fugaEmAndamento) {
		candidatas.push("escape");
	}
	return candidatas;
}

// Mago do Relógio: enche uma fatia da barra de uma skill aleatória.
function CarregaSkillAleatoriaMago() {
	if (jogoPausado || fugaEmAndamento) return;
	if (lvlComp3 <= 0) return;

	const candidatas = CandidatasMago();
	if (candidatas.length === 0) return;

	const escolhida = candidatas[Math.floor(Math.random() * candidatas.length)];
	const teto = TetoSkill(escolhida);
	// PctCargaMago() do teto, arredondado para cima e no mínimo 1
	const quanto = Math.max(1, Math.ceil(teto * PctCargaMago()));
	AdicionaCargaSkill(escolhida, quanto);
}

// Leitura/escrita uniforme da carga das skills de combate
function ContagemSkill(id) {
	if (id === "dano") return qtdCarregaHabilidade;
	if (id === "electric") return abatesCorrenteEletrica;
	if (id === "gold") return abatesBonusGoldAtaque;
	if (id === "escape") return abatesPausaFuga;
	if (id === "frenzy") return abatesFrenesi;
	return 0;
}
function TetoSkill(id) {
	if (id === "dano") return abateshabilidadeDano;
	const skill = habilidadesCombate.find(s => s.id === id);
	return skill ? skill.killsRequired : 0;
}
function AdicionaCargaSkill(id, quanto) {
	const teto = TetoSkill(id);
	if (id === "dano") {
		qtdCarregaHabilidade = Math.min(teto, qtdCarregaHabilidade + quanto);
		AtualizaQTDHabildiade1();
		VerificaHabilidade();
	} else if (id === "electric") {
		abatesCorrenteEletrica = Math.min(teto, abatesCorrenteEletrica + quanto);
	} else if (id === "gold") {
		abatesBonusGoldAtaque = Math.min(teto, abatesBonusGoldAtaque + quanto);
	} else if (id === "escape") {
		abatesPausaFuga = Math.min(teto, abatesPausaFuga + quanto);
		// Passiva do Mago do Relógio: encher a Pausa da fuga ativa a skill
		// sozinha (e a ativação dele dura 50% a mais).
		if (teto > 0 && abatesPausaFuga >= teto) {
			AtivaHabilidadeCombate("escape", { bonusFuga: 1.5 });
		}
	} else if (id === "frenzy") {
		abatesFrenesi = Math.min(teto, abatesFrenesi + quanto);
	}
	AtualizaHabilidadesCombate();
}

// Handles gerenciados dos intervalos dos novos companheiros.
// Criados no load e na compra; limpos no PreCarregamento.
function SincronizaIntervalosNovosCompanheiros() {
	if (intervaloMagoRelogio !== null) clearInterval(intervaloMagoRelogio);
	intervaloMagoRelogio = null;
	if (intervaloAlquimista !== null) clearInterval(intervaloAlquimista);
	intervaloAlquimista = null;

	if (lvlComp3 > 0) intervaloMagoRelogio = setInterval(CarregaSkillAleatoriaMago, 5000);
	// intervalo do Alquimista encurta com o nível (20s −1s/nv, mín 10s) —
	// por isso é recriado aqui a cada compra/load em vez de fixo
	if (lvlComp4 > 0) intervaloAlquimista = setInterval(SorteiaBuffAlquimista, IntervaloAlquimistaMs());
}

function CriarCompanheiros(){
	// guarda por id: chamada a cada compra e no load — sem ela as imagens empilhavam
	if(lvlComp1>0 && !document.getElementById("companheiro1")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiros/companheiro1.png";
		att2.value = "companheiro1";
		att3.value = "companheiro1";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	if(lvlComp2>0 && !document.getElementById("companheiro2")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiros/companheiro2.png";
		att2.value = "companheiro2";
		att3.value = "companheiro2";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	if(lvlComp3>0 && !document.getElementById("companheiro3")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiros/companheiro3.png";
		att2.value = "companheiro3";
		att3.value = "companheiro3";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	// Companheiro 4 (Alquimista): buff aleatório a cada 20s
	if(lvlComp4>0 && !document.getElementById("companheiro4")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiros/companheiro4.png";
		att2.value = "companheiro4";
		att3.value = "companheiro4";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	// Companheiro 5 (Assassino): morte instantânea passiva
	if(lvlComp5>0 && !document.getElementById("companheiro5")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiros/companheiro5.png";
		att2.value = "companheiro5";
		att3.value = "companheiro5";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	// Companheiro 6 (Explorador do mapa): avança mais de um andar
	if(lvlComp6>0 && !document.getElementById("companheiro6")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiros/companheiro6.png";
		att2.value = "companheiro6";
		att3.value = "companheiro6";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
	// item 5 da loja de esmeraldas: o mago só entra na tela com o bônus comprado
	if(lvlXP>0 && !document.getElementById("companheiroXP")){
		companheiro = document.createElement("img");
		att1 = document.createAttribute("src");
		att2 = document.createAttribute("class");
		att3 = document.createAttribute("id");
		att1.value = "imagens/companheiros/companheiroXP.png";
		att2.value = "companheiroXP";
		att3.value = "companheiroXP";
		companheiro.setAttributeNode(att1);
		companheiro.setAttributeNode(att2);
		companheiro.setAttributeNode(att3);
		document.body.appendChild(companheiro);
	}
}

//funçoes de parceiros
function DanoCompanheiros(){
	if (jogoPausado) return;
	if(danoComp>0){
		DanoAutomatico(false,false);
		// Alquimista: buff de Velocidade ×2 — golpe extra no mesmo tick
		if (MultiplicadorBuffVelocidade() > 1) {
			DanoAutomatico(false,false);
		}
	}
}

// Velocidade do companheiro: o tick de ataque roda a cada 1000ms ÷ o
// multiplicador (1,0 = 1 hit/s; 2,0 = 2 hits/s no teto ★III). O handle é
// gerenciado — recriado na compra, no load e no reset — e o PreCarregamento
// limpa ele junto com os outros intervalos antes de recriar.
var intervaloDanoComp = null;
function IntervaloAtaqueComp() {
	const vel = N(velAtaqueComp);
	return 1000 / (vel > 0 ? vel : 1);
}
function SincronizaIntervaloDanoComp() {
	if (intervaloDanoComp !== null) clearInterval(intervaloDanoComp);
	intervaloDanoComp = setInterval(DanoCompanheiros, IntervaloAtaqueComp());
}

function GoldCompanheiros(){
	if (jogoPausado) return;
	// fórmula nova depende do andar e dos bônus: recompõe a cada tick
	// (o MultiplicadorGoldFormigas já está dentro de GoldCompanheiroPorSegundo)
	goldCompanheiro = GoldCompanheiroPorSegundo();
	const goldRecebido = goldCompanheiro;
	AddGold(goldRecebido, false);
	AddTotalGold(goldRecebido, false);

	document.getElementById("contGold").innerHTML = FormatGold(gold);

	if (goldRecebido > 0) {
		goldCompanheirosAcumulado += goldRecebido;
		ticksGoldCompanheiros++;
		if (ticksGoldCompanheiros >= 10) {
			UI.showCurrencyReward("gold", goldCompanheirosAcumulado);
			goldCompanheirosAcumulado = 0;
			ticksGoldCompanheiros = 0;
		}
	} else {
		goldCompanheirosAcumulado = 0;
		ticksGoldCompanheiros = 0;
	}
}

function TempoCompanheiros(){
	if (jogoPausado) return;
	// Fissura temporal: congela o cronômetro junto com o ganho de segundos
	if (typeof eventoAtivo !== "undefined" && eventoAtivo === "fissura") return;
	tempoAvancoInimigos=tempoAvancoInimigos+tempoEsperaCompanheiro;
	document.getElementById("contTempo").innerHTML=FormataTempoFuga(tempoAvancoInimigos);
	if(tempoEsperaCompanheiro>0){
		UI.showInfo("Ganhou "+tempoEsperaCompanheiro +" segundos");
	}
}
////
