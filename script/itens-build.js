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
	// Forja (Cidade): por item, quantas vezes 2 cópias foram juntadas numa
	// "melhorada" — cada nível soma +1 cópia EFETIVA no efeito sem ocupar slot.
	// É da run: zera junto com a build no Resetar.
	let forja = {};
	const FORJA_MAX = 50;
	// Regra do PvP (batalha-fantasma): só item com forja >= 5 "entra" no
	// cartão de batalha — os demais valem 1 nos multiplicadores do duelo e
	// não aparecem no resumo do cartão. A tela de builds marca os que entram
	// com a borda prateada (item-build-cartao--pvp).
	const FORJA_MINIMO_PVP = 5;
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

	// Forja: níveis de "melhorada" por item e cópias efetivas (cópia + forja)
	function forjaDe(id) {
		const n = forja[id];
		return Number.isInteger(n) && n > 0 ? n : 0;
	}

	// cada nível de forja vale as 2 cópias que foram juntadas (mesmo efeito,
	// menos slots): 2 cópias → 1 forja = 2 cópias efetivas
	function copiasEfetivas(id) {
		return copias(id) + 2 * forjaDe(id);
	}

	// Efeito final do item já considerando pilha + forja: pega o "+N%" base do
	// efeito e aplica o mesmo fator composto do jogo (base^cópias efetivas).
	function efeitoFinal(id) {
		const registro = item(id);
		if (!registro) return "";
		const efetivas = copiasEfetivas(id);
		const m = /\+(\d+(?:[.,]\d+)?)%/.exec(registro.efeito);
		if (!m || efetivas === 0) return registro.efeito;
		const base = 1 + Number(m[1].replace(",", ".")) / 100;
		const total = (Math.pow(base, efetivas) - 1) * 100;
		return registro.efeito.replace(m[0], "+" + total.toFixed(0) + "%");
	}

	function podeForjar(id) {
		return copias(id) >= 2 && forjaDe(id) < FORJA_MAX;
	}

	// Junta 2 cópias iguais em 1 "melhorada": o efeito fica igual (cópia efetiva
	// +2 → -2 +1 forja), mas libera 1 slot da build.
	function forjar(id) {
		if (!podeForjar(id)) return false;
		let removidas = 0;
		lista = lista.filter(idItem => {
			if (idItem === id && removidas < 2) { removidas++; return false; }
			return true;
		});
		forja[id] = forjaDe(id) + 1;
		return true;
	}

	// sem cópia o valor é exatamente 1 (Math.pow(x, 0)); cada cópia repete
	// o fator, então acumular o mesmo item multiplica o bônus por cópia.
	// Centro de Pesquisa (Cidade): a pesquisa do item potencializa o efeito
	// (+10% por nível), aplicado aqui — ponto único de todo bônus de item.
	function mult(base, id, minForja = 0) {
		// Filtro do PvP: item com forja abaixo do mínimo não conta neste
		// cálculo (vale 1). O jogo normal não passa minForja e não muda.
		if (forjaDe(id) < minForja) return 1;
		const efetivas = copiasEfetivas(id);
		if (efetivas === 0) return 1;
		const bonus = (typeof PesquisaBonusItem === "function") ? PesquisaBonusItem(id) : 1;
		return Math.pow(base, efetivas) * bonus;
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

	// forja vem do save: só ids conhecidos e níveis inteiros dentro do teto
	function forjaDoSave(save) {
		const bruto = save ? save.forja : undefined;
		const limpo = {};
		if (bruto && typeof bruto === "object" && !Array.isArray(bruto)) {
			for (const [id, nivel] of Object.entries(bruto)) {
				if (item(id) && Number.isSafeInteger(nivel) && nivel > 0) {
					limpo[id] = Math.min(nivel, FORJA_MAX);
				}
			}
		}
		return limpo;
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

	function resumo(minForja = 0) {
		const partes = [];
		for (const registro of POOL) {
			const n = copias(registro.id);
			const f = forjaDe(registro.id);
			// com filtro (ex.: resumo do cartão PvP) só entram os itens
			// com forja >= minForja
			if (f < minForja) continue;
			if (n > 0 || f > 0) {
				partes.push(registro.nome + (n > 0 ? " ×" + n : "")
					+ (f > 0 ? " (+" + f + " forjada" + (f > 1 ? "s" : "") + ")" : ""));
			}
		}
		if (partes.length === 0) {
			return minForja > 0 ? "nenhum" : "nenhum (0/" + limiteAtual() + ")";
		}
		const vaga = minForja > 0 ? "" : " (" + lista.length + "/" + limiteAtual() + ")";
		return partes.join(", ") + vaga;
	}

	window.Tapeira.ItensBuild = {
		LIMITE: LIMITE,
		LIMITE_EXTRAS: LIMITE_EXTRAS,
		POOL: POOL,

		// ---- leitura ----
		item: item,
		copias: copias,
		copiasEfetivas: copiasEfetivas,
		nivelForja: forjaDe,
		// itens com forja (não aparecem mais na lista como cópias)
		idsForjados: () => Object.keys(forja).filter(id => forjaDe(id) > 0),
		podeForjar: podeForjar,
		forjar: forjar,
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
				if (!descarta || (copias(descarta) === 0 && forjaDe(descarta) === 0)) return;
				lista = lista.filter(idItem => idItem !== descarta);
				delete forja[descarta]; // a pilha inteira sai (cópias + forja)
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

		// Mercado (Cidade): vende as cópias EXTRAS (mantém 1 de cada item) e
		// devolve quantas saíram — o valor em gold é calculado pelo Mercado.
		vendeDuplicatas() {
			const vistas = new Set();
			const mantidas = [];
			let vendidas = 0;
			for (const id of lista) {
				if (vistas.has(id)) { vendidas++; continue; }
				vistas.add(id);
				mantidas.push(id);
			}
			lista = mantidas;
			return vendidas;
		},

		// ---- save (regras do save em sistema.js) ----
		carrega(save) {
			// extras antes da lista: o slice respeita o limite efetivo do save
			slotsExtras = slotsExtrasDoSave(save);
			forja = forjaDoSave(save);
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
				forja: Object.assign({}, forja),
				bausBuildPendentes: bausPendentes,
				bauBuildPendente: bausPendentes > 0,
				opcoesBauBuild: opcoesBauAtual ? opcoesBauAtual.slice() : null
			};
		},
		limpa() {
			lista = [];
			forja = {};
			bausPendentes = 0;
			opcoesBauAtual = null;
			// slotsExtras NÃO zera: espaço extra é compra permanente da loja
		},

		// ---- efeito final (pilha + forja) e cópias efetivas ----
		efeitoFinal,
		copiasEfetivas,

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
		multEsmBau: () => mult(1.50, "esmeralda"),

		// ---- PvP (batalha-fantasma): só conta item com forja >= FORJA_MINIMO_PVP ----
		FORJA_MINIMO_PVP: FORJA_MINIMO_PVP,
		multDanoPvp: () => mult(1.25, "adaga", FORJA_MINIMO_PVP),
		multChanceCritPvp: () => mult(1.50, "pocaoVerde", FORJA_MINIMO_PVP),
		multDanoCritPvp: () => mult(1.25, "pocaoRubra", FORJA_MINIMO_PVP),
		multDanoCompPvp: () => mult(1.20, "colarFormigas", FORJA_MINIMO_PVP)
	};
})();
