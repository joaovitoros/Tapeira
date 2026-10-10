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
// Companheiro 6 (Explorador do mapa): chance de avançar mais de um
//   andar por vez (escala com o nível: 5% + 2% por nível).

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
		document.body.appendChild(selo);
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

// Assassino: chance de morte instantânea — 0,5% no nv1, +0,05% por nível;
// a metade (0,25% +0,025%) vale nos golpes automáticos e do companheiro
function ChanceMorteAssassino(manual) {
	const n = Math.max(0, Math.floor(Number(lvlComp5) || 0) - 1);
	return (manual ? 0.005 : 0.0025) + (manual ? 0.0005 : 0.00025) * n;
}

// Mago do Relógio: enche uma fatia da barra de uma skill aleatória.
// Considera só as skills desbloqueadas e que ainda não estão cheias.
function CarregaSkillAleatoriaMago() {
	if (jogoPausado || fugaEmAndamento) return;
	if (lvlComp3 <= 0) return;

	// skill de Dano (barra própria: qtdCarregaHabilidade/abateshabilidadeDano)
	const candidatas = [];
	if (qtdCarregaHabilidade < abateshabilidadeDano) candidatas.push("dano");
	habilidadesCombate.forEach(skill => {
		if (maxAndar < skill.unlockFloor) return;
		const atual = ContagemSkill(skill.id);
		if (atual < skill.killsRequired) candidatas.push(skill.id);
	});
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
		att1.value = "imagens/companheiro1.png";
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
		att1.value = "imagens/companheiro2.png";
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
		att1.value = "imagens/companheiro3.png";
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
		att1.value = "imagens/companheiro4.png";
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
		att1.value = "imagens/companheiro5.png";
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
		att1.value = "imagens/companheiro6.png";
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
		att1.value = "imagens/companheiroXP.png";
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
	document.getElementById("contTempo").innerHTML=tempoAvancoInimigos;
	if(tempoEsperaCompanheiro>0){
		UI.showInfo("Ganhou "+tempoEsperaCompanheiro +" segundos");
	}
}
////
