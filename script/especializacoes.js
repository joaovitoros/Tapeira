// =========================
// ESPECIALIZAÇÕES (Tier 3 #1 — princípios 26/27/38)
// =========================
// Cinco builds mutuamente exclusivas na loja de gold. A base desbloqueia
// após o 1º reset (andarVolta > 15 — o mesmo marcador do tutorial do
// companheiro; sai de 15 só quando o primeiro portão de reset é passado) e
// três builds têm piso de andar extra (Olho de Águia no andar 60, Canhão de
// Vidro no 70 e Cadeia de Ataques no 80 — pelo maxAndar, com badge no cartão).
// Escolhe UMA com gold e trocar dentro da run custa 5× o preço anterior
// (volta ao preço-base a cada reset). Sem "nenhuma": a build é o compromisso
// da run.
//
// Os bônus/penalidades são aplicados em TEMPO DE SORTEIO por funções puras
// (MultiplicadorDanoEspecializacao no Bater e no status/offline, e
// MultiplicadorGoldEspecializacao no AddGold) — nada muta danoJogador,
// danoCritJogador ou mulGold, então trocar de build nunca corrompe status,
// mesmo comprando itens da loja entre uma troca e outra.

const PRECO_ESPECIALIZACAO_BASE = 500;
const FATOR_PRECO_TROCA = 5;
// trava de saneamento do save: 5^200 ainda é finito em double
const TROCA_ESPECIALIZACAO_MAX = 200;

// 0 = nenhuma (padrão/save antigo), 1..5 = build ativa — por run, zerada
// no Resetar()
var especializacao = 0;
var especializacaoTrocas = 0;

// Cadeia de Ataques: contador de acertos diretos no inimigo 1..4 (índice 0
// não usado). Transiente por onda: zera no CarregarStatus e no Resetar(),
// não vai pro save — recarregar no meio da onda recomeça o stack do zero
var ataquesCadeia = [0, 0, 0, 0, 0];

const ESPECIALIZACOES = [
	{ id: 0, nome: "Nenhuma" },
	{ id: 1, nome: "Força Bruta", efeito: "+40% dano · −25% gold" },
	{ id: 2, nome: "Toque de Midas", efeito: "+40% gold · −25% dano" },
	{ id: 3, nome: "Olho de Águia", efeito: "Crítico ×1,8 · −10% dano · −15% gold", andar: 60 },
	{ id: 4, nome: "Canhão de Vidro", efeito: "+80% dano · −50% tempo de fuga", andar: 70 },
	{ id: 5, nome: "Cadeia de Ataques", efeito: "−50% dano · +25% por ataque no mesmo alvo (até +400%)", andar: 80 }
];

// Desbloqueio por build: base é o 1º reset e o campo opcional `andar` da
// tabela cobra o andar máximo já atingido (maxAndar — o mesmo marcador dos
// skills, da automação e da tela Marcos: permanente, não some no reset).
// Sem id = só a base (estado da seção na loja).
function EspecializacaoDesbloqueada(id) {
	if (andarVolta <= 15) return false;
	const piso = ESPECIALIZACOES[id] && ESPECIALIZACOES[id].andar;
	return !piso || maxAndar >= piso;
}

// Dano do hit (Bater, status e progressão offline). ehCritico separa o
// golpe normal do crítico: o Olho de Águia nerfa os dois e só o crítico
// leva o ×1,8 (por isso a build exige investir em chance/dano crítico).
function MultiplicadorDanoEspecializacao(ehCritico) {
	if (especializacao === 1) return 1.4;
	if (especializacao === 2) return 0.75;
	if (especializacao === 3) return ehCritico ? 0.9 * 1.8 : 0.9;
	if (especializacao === 4) return 1.8; // Canhão de Vidro: +80% (normal e crítico)
	if (especializacao === 5) return 0.5; // Cadeia: −50% (o stack por alvo compensa)
	return 1;
}

// Cadeia de Ataques: +25% por acerto direto já dado no MESMO inimigo, cap de
// +400% (16 acertos — o contador incrementa ANTES do cálculo do golpe). Só
// com a build ativa: combinado com o −50% base, o dano efetivo nesse alvo vai
// de ×0,625 (1º golpe) a ×2,5 no cap. Os saltos da corrente elétrica batem
// direto na vida (DesceVida) e não empilham aqui — só golpes via Bater.
function MultiplicadorCadeiaAtaques(inimigo) {
	if (especializacao !== 5) return 1;
	const n = N(ataquesCadeia[inimigo]);
	return Math.min(1 + 0.25 * (n > 0 ? n : 0), 5);
}

// Ganhos de gold: AddGold cobre kills, bônus, eventos, baús, missões,
// companheiros e o progresso offline — gasto (PagaLoja) não passa por ele.
function MultiplicadorGoldEspecializacao() {
	if (especializacao === 1) return 0.75;
	if (especializacao === 2) return 1.4;
	if (especializacao === 3) return 0.85;
	return 1;
}

// Próxima escolha/troca: 500 · 5^trocas; especializacaoTrocas zera no reset
function PrecoEspecializacao() {
	return PRECO_ESPECIALIZACAO_BASE * Math.pow(FATOR_PRECO_TROCA, especializacaoTrocas);
}

function EscolheEspecializacao(id) {
	if (!EspecializacaoDesbloqueada()) {
		MostraInfo("A especialização desbloqueia após o primeiro reset!");
		return;
	}
	if (!Number.isInteger(id) || id < 1 || id > 5 || id === especializacao) return;
	if (!EspecializacaoDesbloqueada(id)) {
		MostraInfo(ESPECIALIZACOES[id].nome + " desbloqueia no andar " + ESPECIALIZACOES[id].andar + "!");
		return;
	}

	const preco = PrecoEspecializacao();
	if (!GE(gold, preco)) {
		MostraInfo("Voce não tem gold o suficiente para essa compra!");
		return;
	}

	// mesmo caminho das compras da loja de gold: no desafio "sem gold" o
	// gasto falha a missão (é decisão manual, como comprar um item qualquer)
	PagaLoja(preco);
	especializacao = id;
	especializacaoTrocas++;

	ChamaSom('audio6');
	SyncSecaoEspecializacao();
	AutoSaveLocal();
	MostraInfo(ESPECIALIZACOES[id].nome + " ativada — " + ESPECIALIZACOES[id].efeito + ".");
}

// Estado da seção na loja: trava antes do 1º reset, marca o cartão ativo e
// mostra o preço da próxima escolha/troca. Roda no intervalo do
// PreCarregamento (só leitura de DOM, como os toggles da automação) — load,
// reset e zerada se refletem sozinhos na tela.
function SyncSecaoEspecializacao() {
	const secao = document.getElementById("secaoEspecializacao");
	if (!secao) return;

	const desbloqueada = EspecializacaoDesbloqueada();
	secao.classList.toggle("especializacao--travada", !desbloqueada);

	for (const cartao of secao.querySelectorAll(".esp-cartao")) {
		const id = Number(cartao.dataset.esp);
		const pisoOk = EspecializacaoDesbloqueada(id);
		cartao.classList.toggle("esp-cartao--ativo", id === especializacao);
		cartao.disabled = !desbloqueada || !pisoOk;
		// badge de andar (builds 3/4/5) só aparece com a seção destravada
		const cadeado = cartao.querySelector(".esp-cartao__lock");
		if (cadeado) cadeado.hidden = !desbloqueada || pisoOk;
	}

	const status = document.getElementById("espStatus");
	if (status) status.textContent = ESPECIALIZACOES[especializacao].nome;

	const nota = document.getElementById("espNota");
	if (nota) {
		nota.textContent = desbloqueada
			? "Uma por run — trocar custa 5× mais e zera no reset"
			: "Desbloqueia após o primeiro reset";
	}

	const preco = document.getElementById("espPreco");
	if (preco) {
		preco.hidden = !desbloqueada;
		if (desbloqueada) {
			preco.textContent = (especializacao === 0 ? "Escolher: " : "Troca: ")
				+ FormatGold(PrecoEspecializacao()) + " gold";
		}
	}
}
