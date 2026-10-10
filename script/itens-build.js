// ===================== ITENS DA BUILD (por run) ==========================
// Desbloqueio permanente ao chegar no andar 100 a primeira vez. Depois
// disso, a cada 10 andares um baú de build aparece — inclusive em runs
// novas, depois do reset (o andar 100 só destrava o sistema).
// Os baús são MANUAIS e persistentes: cada marco de 10 andares acumula um,
// mesmo que os anteriores ainda não tenham sido abertos. Ignorar o baú
// ("não escolher nenhum item") consome esse baú — ele some da tela.
// A escolha é 1 de 3 itens aleatórios; escolher um item já presente
// acumula o efeito (uma entrada por cópia, teto de 5 escolhas).
// Os itens são da run: zeram no Resetar (junto com perks/especialização).
//
// Domínio encapsulado: API pequena em window.Tapeira.ItensBuild (AGENTS.md),
// sem novas variáveis globais. A interface (UI.spawnBauBuild e o modal em
// ui.js) lê o estado por esta API; os multiplicadores são consumidos pelos
// hooks nos donos de cada sistema (batalha, gold, eventos, script, sistema).
(function () {
	"use strict";

	window.Tapeira = window.Tapeira || {};

	const LIMITE = 5;

	// Pool de itens (ícones recortados da "Grade de Ícones Fantásticos de RPG").
	// Todos positivos; o custo é o espaço limitado dos 5 slots da build.
	const POOL = [
		{ id: "adaga", nome: "Adaga Sombria", icone: "imagens/itens/adaga.png",
			efeito: "+15% de dano" },
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

	function resumo() {
		if (lista.length === 0) return "nenhum (0/" + LIMITE + ")";
		const partes = [];
		for (const registro of POOL) {
			const n = copias(registro.id);
			if (n > 0) partes.push(registro.nome + (n > 1 ? " ×" + n : ""));
		}
		return partes.join(", ") + " (" + lista.length + "/" + LIMITE + ")";
	}

	window.Tapeira.ItensBuild = {
		LIMITE: LIMITE,
		POOL: POOL,

		// ---- leitura ----
		item: item,
		copias: copias,
		contagem: () => lista.length,
		pegaLista: () => lista.slice(),
		pendente: () => bausPendentes > 0,
		quantidadeBausPendentes: () => bausPendentes,
		desbloqueada: desbloqueada,
		resumo: resumo,
		sorteia: sorteia,

		// ---- baú: chamado a cada subida de andar (batalha.js) ----
		// Cada marco gera um baú, acumulado com os que continuam pendentes.
		tentaBau() {
			if (!desbloqueada()) return;
			if (window.andar % 10 !== 0) return;
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

		// escolha final (chamada pelo modal): id do item novo; slot = índice a
		// substituir quando a build já está cheia (null no fluxo normal)
		escolhe(id, slot) {
			const registro = item(id);
			if (!registro || bausPendentes <= 0 || !opcoesBauAtual?.includes(id)) return;
			if (Number.isInteger(slot) && slot >= 0 && slot < lista.length) {
				lista[slot] = id; // troca: a cópia escolhida sai
			} else if (lista.length < LIMITE) {
				lista.push(id);
			} else {
				return; // build cheia e sem slot definido: o modal precisa escolher
			}
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
			lista = Array.isArray(save.itensBuild)
				? save.itensBuild.filter(id => item(id)).slice(0, LIMITE)
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
		},

		// ---- multiplicadores dos efeitos (hooks nos donos dos sistemas) ----
		multDano: () => mult(1.15, "adaga"),
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
