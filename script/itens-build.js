// ===================== ITENS DA BUILD (por run) ==========================
// Desbloqueio permanente ao chegar no andar 100 a primeira vez. Depois
// disso, a cada 5 andares um baú de build aparece — inclusive em runs
// novas, depois do reset (o andar 100 só destrava o sistema).
// Os baús são MANUAIS e persistentes: cada marco de 5 andares acumula um,
// mesmo que os anteriores ainda não tenham sido abertos. Ignorar o baú
// ("não escolher nenhum item") consome esse baú — ele some da tela.
// A escolha é 1 de 3 itens aleatórios; cada cópia ocupa um slot próprio
// e acumula o bônus (teto de LIMITE slots + espaços extras comprados na
// loja de esmeraldas). Na build cheia, descartar um item remove a pilha
// INTEIRA dele — todas as cópias e o bônus delas somem.
// Os itens são da run: zeram no Resetar (junto com perks/especialização);
// os espaços extras são compra PERMANENTE da loja e não zera no reset.
//
// Domínio encapsulado: API pequena em window.Tapeira.ItensBuild (AGENTS.md),
// sem novas variáveis globais. A interface (UI.spawnBauBuild e o modal em
// ui.js) lê o estado por esta API; os multiplicadores são consumidos pelos
// hooks nos donos de cada sistema (batalha, gold, eventos, script, sistema).
(function () {
	"use strict";

	window.Tapeira = window.Tapeira || {};

	// slots base; cada compra na loja de esmeraldas soma +5 (teto LIMITE_EXTRAS)
	const LIMITE = 20;
	const LIMITE_EXTRAS = 30;

	// Pool de itens (ícones recortados da "Grade de Ícones Fantásticos de RPG").
	// Todos positivos; o custo é o espaço limitado dos slots da build.
	const POOL = [
		{ id: "adaga", nome: "Adaga Sombria", icone: "imagens/itens/adaga.png",
			efeito: "+25% de dano" },
		{ id: "escudo", nome: "Escudo do Guardião", icone: "imagens/itens/escudo.png",
			efeito: "+30% de dano contra guardiões (andares múltiplos de 10)" },
		{ id: "moedas", nome: "Saco de Moedas", icone: "imagens/itens/moedas.png",
			efeito: "+20% de gold" },
		{ id: "mapa", nome: "Mapa do Aventureiro", icone: "imagens/itens/mapa.png",
			efeito: "+25% na chance de evento por andar" },
		{ id: "relogio", nome: "Relógio de Bolso", icone: "imagens/itens/relogio.png",
			efeito: "+10% no tempo antes da fuga" },
		{ id: "grimorio", nome: "Grimório Estelar", icone: "imagens/itens/grimorio.png",
			efeito: "+20% de XP por abate" },
		{ id: "pocaoVerde", nome: "Poção de Ferro", icone: "imagens/itens/pocaoVerde.png",
			efeito: "+50% na chance de crítico" },
		{ id: "pocaoRubra", nome: "Poção Rubra", icone: "imagens/itens/pocaoRubra.png",
			efeito: "+25% no dano do crítico" },
		{ id: "lanterna", nome: "Lanterna Ancestral", icone: "imagens/itens/lanterna.png",
			efeito: "+20% no dano da habilidade Dano automático" },
		{ id: "colarFormigas", nome: "Colar das Formigas", icone: "imagens/itens/colarFormigas.png",
			efeito: "+20% no dano do Companheiro 1" },
		{ id: "bauPortatil", nome: "Baú Portátil", icone: "imagens/itens/bauPortatil.png",
			efeito: "+15% na chance de baú por andar" },
		{ id: "esmeralda", nome: "Esmeralda Bruta", icone: "imagens/itens/esmeralda.png",
			efeito: "+50% na chance de esmeralda dentro do baú" }
	];

	// Uma entrada por cópia: cópias repetidas do mesmo item acumulam o efeito
	let lista = [];
	let bausPendentes = 0;
	let opcoesBauAtual = null;
	// espaços extras comprados na loja de esmeraldas: permanentes (não zeram
	// no Resetar), cada compra dá +5 slots e o preço dobra por compra
	let slotsExtras = 0;

	function item(id) {
		return POOL.find(registro => registro.id === id) || null;
	}

	function copias(id) {
		return lista.filter(idItem => idItem === id).length;
	}

	// sem cópia o valor é exatamente 1 (Math.pow(x, 0)); cada cópia repete
	// o fator, então acumular o mesmo item multiplica o bônus por cópia
	function mult(base, id) {
		return Math.pow(base, copias(id));
	}

	function desbloqueada() {
		return (Number(window.maxAndar) || 0) >= 100;
	}

	// 3 itens distintos sorteados do pool
	function sorteia(qtd) {
		const ids = POOL.map(registro => registro.id);
		for (let i = ids.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[ids[i], ids[j]] = [ids[j], ids[i]];
		}
		return ids.slice(0, qtd);
	}

	// limite efetivo: slots base + espaços extras comprados na loja
	function limiteAtual() {
		return LIMITE + slotsExtras;
	}

	// espaços extras vêm do save; valor inválido conta como 0
	function slotsExtrasDoSave(save) {
		const valor = save ? save.slotsExtrasBuild : undefined;
		return Number.isSafeInteger(valor) && valor >= 0
			? Math.min(valor, LIMITE_EXTRAS)
			: 0;
	}

	// preço do próximo espaço: 10 esmeraldas e dobra por COMPRA (5 slots cada)
	function precoSlotExtra() {
		return 10 * Math.pow(2, Math.floor(slotsExtras / 5));
	}

	function resumo() {
		if (lista.length === 0) return "nenhum (0/" + limiteAtual() + ")";
		const partes = [];
		for (const registro of POOL) {
			const n = copias(registro.id);
			if (n > 0) partes.push(registro.nome + (n > 1 ? " ×" + n : ""));
		}
		return partes.join(", ") + " (" + lista.length + "/" + limiteAtual() + ")";
	}

	window.Tapeira.ItensBuild = {
		LIMITE: LIMITE,
		LIMITE_EXTRAS: LIMITE_EXTRAS,
		POOL: POOL,

		// ---- leitura ----
		item: item,
		copias: copias,
		contagem: () => lista.length,
		pegaLista: () => lista.slice(),
		pendente: () => bausPendentes > 0,
		quantidadeBausPendentes: () => bausPendentes,
		desbloqueada: desbloqueada,
		limiteAtual: limiteAtual,
		slotsExtras: () => slotsExtras,
		precoSlotExtra: precoSlotExtra,
		// limite da lista gravada num save (validacao-save.js)
		limiteDoSave: save => LIMITE + slotsExtrasDoSave(save),
		// item da loja de esmeraldas: +5 espaços permanentes (loja-esmeraldas.js)
		compraSlotExtra() {
			if (slotsExtras >= LIMITE_EXTRAS) return false;
			slotsExtras = Math.min(LIMITE_EXTRAS, slotsExtras + 5);
			return true;
		},
		resumo: resumo,
		sorteia: sorteia,

		// ---- baú: chamado a cada subida de andar (batalha.js) ----
		// Cada marco gera um baú, acumulado com os que continuam pendentes.
		tentaBau() {
			if (!desbloqueada()) return;
			if (window.andar % 5 !== 0) return;
			if (bausPendentes >= Number.MAX_SAFE_INTEGER) return;
			bausPendentes++;
			UI.spawnBauBuild();
			AutoSalvar();
		},

		// chamado pelo clique no baú (ui.js)
		abreEscolha() {
			if (bausPendentes <= 0) return;
			// Não re-sorteia ao apertar Espaço repetidamente nem enquanto o modal está aberto.
			if (document.getElementById("modalItensBuild")) return;
			if (!opcoesBauAtual) {
				opcoesBauAtual = sorteia(3);
				AutoSalvar();
			}
			ChamaSom("audio4");
			UI.showEscolhaItensBuild(opcoesBauAtual.slice(), null);
		},

		// Jogador abriu o baú e escolheu não pegar nenhum item: este baú é
		// consumido e some da tela; se ainda houver acumulados, o próximo
		// já fica pronto (com opções sorteadas de novo).
		descartaBau() {
			if (bausPendentes <= 0) return;
			bausPendentes--;
			opcoesBauAtual = null;
			if (bausPendentes > 0) UI.spawnBauBuild();
			else UI.removeBauBuild();
			UI.fechaEscolhaItensBuild();
			UI.showInfo("Baú de itens ignorado"
				+ (bausPendentes > 0 ? " · restam " + bausPendentes + " baú(s)" : "") + ".");
			AutoSalvar();
		},

		// escolha final (chamada pelo modal): id do item novo; descarta = id do
		// item que sai quando a build está cheia — a pilha INTEIRA dele sai
		// (todas as cópias e o bônus delas), e o novo item entra com 1 cópia
		escolhe(id, descarta) {
			const registro = item(id);
			if (!registro || bausPendentes <= 0 || !opcoesBauAtual?.includes(id)) return;
			if (lista.length >= limiteAtual()) {
				// build cheia: sem um item para descartar não pode entrar
				if (!descarta || copias(descarta) === 0) return;
				lista = lista.filter(idItem => idItem !== descarta);
			}
			lista.push(id); // cada cópia ocupa um slot próprio e acumula o bônus
			bausPendentes--;
			opcoesBauAtual = null;
			if (bausPendentes > 0) UI.spawnBauBuild();
			else UI.removeBauBuild();
			UI.fechaEscolhaItensBuild();
			UI.showInfo("Item escolhido: " + registro.nome + " · build: " + resumo());
			AutoSalvar();
		},

		// ---- save (regras do save em sistema.js) ----
		carrega(save) {
			// extras antes da lista: o slice respeita o limite efetivo do save
			slotsExtras = slotsExtrasDoSave(save);
			lista = Array.isArray(save.itensBuild)
				? save.itensBuild.filter(id => item(id)).slice(0, limiteAtual())
				: [];
			bausPendentes = Number.isSafeInteger(save.bausBuildPendentes) && save.bausBuildPendentes >= 0
				? save.bausBuildPendentes
				: (save.bauBuildPendente === true ? 1 : 0);
			opcoesBauAtual = Array.isArray(save.opcoesBauBuild)
				&& save.opcoesBauBuild.length === 3
				&& new Set(save.opcoesBauBuild).size === 3
				&& save.opcoesBauBuild.every(id => item(id))
				&& bausPendentes > 0
				? save.opcoesBauBuild.slice()
				: null;
			return bausPendentes > 0;
		},
		serializa() {
			return {
				slotsExtrasBuild: slotsExtras,
				itensBuild: lista.slice(),
				bausBuildPendentes: bausPendentes,
				bauBuildPendente: bausPendentes > 0,
				opcoesBauBuild: opcoesBauAtual ? opcoesBauAtual.slice() : null
			};
		},
		limpa() {
			lista = [];
			bausPendentes = 0;
			opcoesBauAtual = null;
			// slotsExtras NÃO zera: espaço extra é compra permanente da loja
		},

		// ---- multiplicadores dos efeitos (hooks nos donos dos sistemas) ----
		multDano: () => mult(1.25, "adaga"),
		multGuardiao: () => mult(1.30, "escudo"),
		multGold: () => mult(1.20, "moedas"),
		multEvento: () => mult(1.25, "mapa"),
		multFuga: () => mult(1.10, "relogio"),
		multXP: () => mult(1.20, "grimorio"),
		multChanceCrit: () => mult(1.50, "pocaoVerde"),
		multDanoCrit: () => mult(1.25, "pocaoRubra"),
		multDanoAuto: () => mult(1.20, "lanterna"),
		multDanoComp: () => mult(1.20, "colarFormigas"),
		multBau: () => mult(1.15, "bauPortatil"),
		multEsmBau: () => mult(1.50, "esmeralda")
	};
})();
