// ===================== PREVIEW E HOLD DA LOJA =================================
// Preview de compra no hover/foco e compra segurando o botao.
// Funcoes globais movidas de loja.js sem alterar as chamadas.

// =========================
// PREVIEW DE COMPRA (hover/foco nos botões da loja)
// =========================

function FormataPct(x, casas) {
	return (N(x) * 100).toFixed(casas === undefined ? 2 : casas) + "%";
}

// Percentual sem zeros sobrando (para os efeitos que crescem em passos
// pequenos): 0,005 → "0,5%", 0,0065 → "0,65%", 0,01 → "1%"
function PctTexto(ratio) {
	return (Math.round(N(ratio) * 100000) / 1000).toString().replace(".", ",") + "%";
}

const PREVIEWS_LOJA = {
	CompraDano() {
		if (ITENS_PATENTE.dano.noTeto()) return "Dano — ★ " + (GanhoProximaPatenteTexto("dano") || "patente máxima");
		const prox = N(danoJogador) + N(mulDano);
		const extra = (N(lvlDano) === 9) ? " · nível 10 dá +20%!" : "";
		return "Dano: " + N(danoJogador).toFixed(2) + " → " + prox.toFixed(2)
			+ " (+" + N(mulDano).toFixed(2) + ")" + extra;
	},
	CompraBau() {
		if (ITENS_PATENTE.bau.noTeto()) return "Chance de baú — ★ " + (GanhoProximaPatenteTexto("bau") || "patente máxima");
		return "Chance de baú: " + FormataPct(chanceBau, 0) + " → "
			+ FormataPct(Math.min(TetoLoja("bau"), N(chanceBau) + PassoLoja("bau")), 0)
			+ " (máx " + FormataTetoPct(TetoLoja("bau")) + ")";
	},
	CompraBEspaco() {
		if (ITENS_PATENTE.espaco.noTeto()) return "Recarga do espaço — ★ " + (GanhoProximaPatenteTexto("espaco") || "patente máxima");
		return "Recarga do espaço: " + N(MaxValidaBater) + " → " + (N(MaxValidaBater) - 1) + " (quanto menor, mais rápido)";
	},
	CompraGold() {
		const prox = N(mulGold) * (1 + N(sobeGold));
		return "Multiplicador gold: " + N(mulGold).toFixed(2) + " → " + prox.toFixed(2);
	},
	CompraAvanco() {
		if (ITENS_PATENTE.avan.noTeto()) return "Avanço rápido — ★ " + (GanhoProximaPatenteTexto("avan") || "patente máxima");
		const prox = Math.min(TetoLoja("avan"), N(avanco) + N(sobeAvanco));
		return "Chance de avanço: " + FormataPct(avanco) + " → " + FormataPct(prox)
			+ " (máx " + FormataTetoPct(TetoLoja("avan")) + ")";
	},
	CompraDCrit() {
		if (ITENS_PATENTE.dcrit.noTeto()) return "Dano crítico — ★ " + (GanhoProximaPatenteTexto("dcrit") || "patente máxima");
		const proxMult = N(multiplicadorMaximoDanoCritico) + 0.1;
		const proxSobe = N(sobeDCrit) * TaxaPassoLoja("dcrit");
		let proxCrit = N(danoCritJogador) + (N(danoJogador) / 2) * (2 + proxSobe);
		proxCrit = Math.min(proxCrit, N(danoJogador) * proxMult);
		return "Dano crítico: " + N(danoCritJogador).toFixed(2) + " → " + proxCrit.toFixed(2)
			+ " (máx ×" + proxMult.toFixed(1) + ")";
	},
	CompraSubVida() {
		if (ITENS_PATENTE.subvida.noTeto()) return "Vida dos inimigos — ★ " + (GanhoProximaPatenteTexto("subvida") || "patente máxima");
		return "Redução de vida: " + FormataPct(subVidaInimigo, 0) + " → "
			+ FormataPct(Math.min(TetoLoja("subvida"), N(subVidaInimigo) + PassoLoja("subvida")), 0)
			+ " (máx " + FormataTetoPct(TetoLoja("subvida")) + ")";
	},
	CompraCCrit() {
		if (ITENS_PATENTE.ccrit.noTeto()) return "Chance crítica — ★ " + (GanhoProximaPatenteTexto("ccrit") || "patente máxima");
		const meio = N(chanceCrit) >= 0.3;
		const passo = N(sobeCCrit) * (meio ? 0.5 : 1);
		const prox = Math.min(TetoLoja("ccrit"), N(chanceCrit) + passo);
		return "Chance crítica: " + FormataPct(chanceCrit) + " → " + FormataPct(prox)
			+ " (máx " + FormataTetoPct(TetoLoja("ccrit")) + (meio ? " · ganho pela metade" : " · a partir de 30% cai pela metade") + ")";
	},
	CompraQTDAvanco() {
		if (ITENS_PATENTE.qtdavan.noTeto()) return "Quantidade de avanço — ★ " + (GanhoProximaPatenteTexto("qtdavan") || "patente máxima");
		return "Qtd de avanço: " + N(qtdAvanco) + " → " + (N(qtdAvanco) + 1) + " inimigos";
	},
	CompraEsmBau() {
		if (ITENS_PATENTE.esmbau.noTeto()) return "Esmeralda no baú — ★ " + (GanhoProximaPatenteTexto("esmbau") || "patente máxima");
		return "Chance de esmeralda: " + FormataPct(chanceEsmeraldaBau, 0) + " → "
			+ FormataPct(Math.min(TetoLoja("esmbau"), N(chanceEsmeraldaBau) + PassoLoja("esmbau")), 0)
			+ " (máx " + FormataTetoPct(TetoLoja("esmbau")) + ")";
	},
	CompraComp1() {
		const prox = N(danoComp1) + 0.1;
		return "Dano do companheiro: " + FormataPct(danoComp1, 0) + " → "
			+ FormataPct(prox, 0) + " do seu dano";
	},
	CompraAvGold() {
		const prox = N(mulGoldAvanco) * 1.1;
		return "Bônus de gold do avanço: " + N(mulGoldAvanco).toFixed(2) + " → " + prox.toFixed(2);
	},
	CompraComp2() {
		const n = N(lvlComp2);
		const pctAtual = 25 + 10 * Math.max(0, n - 1);
		const pctProx = 25 + 10 * n;
		const prox = GoldCompanheiroPorSegundo(n + 1);
		// 25% do gold de um inimigo no nível 1, +10% por upgrade
		return "Gold do companheiro: " + FormatGold(N(goldCompanheiro)) + " → " + FormatGold(prox)
			+ "/seg (" + (n > 0 ? pctAtual + "% → " + pctProx : pctProx) + "% do gold de um inimigo)";
	},
	CompraComp3() {
		const n = Math.max(0, N(lvlComp3) | 0);
		const pct = lv => Math.min(50, 10 + 2 * Math.max(0, lv - 1));
		return "Mago do Relógio: enche " + (n > 0 ? pct(n) + "% → " + pct(n + 1) : pct(1))
			+ "% de uma skill a cada 5s (teto 50%)";
	},
	CompraComp4() {
		const n = Math.max(0, N(lvlComp4) | 0);
		const seg = lv => Math.max(10, 20 - Math.max(0, lv - 1));
		return "Alquimista: buff aleatório (dano/gold/velocidade/baú) a cada "
			+ (n > 0 ? seg(n) + "s → " + seg(n + 1) : seg(1)) + "s (mínimo 10s)";
	},
	CompraComp5() {
		const n = Math.max(0, N(lvlComp5) | 0);
		const ch = lv => 0.005 + 0.0005 * Math.max(0, lv - 1);
		return "Assassino: morte instantânea " + (n > 0 ? PctTexto(ch(n)) + " → " + PctTexto(ch(n + 1)) : PctTexto(ch(1)))
			+ " (metade em automáticos)";
	},
	CompraComp6() {
		const chance = Math.min(50, 5 + 2 * Math.max(0, N(lvlComp6) - 1));
		const prox = Math.min(50, 5 + 2 * N(lvlComp6));
		return "Explorador: " + chance + "% → " + prox + "% de avançar +1 andar";
	},
	CompraXP() {
		const n = Math.max(0, N(lvlXP) | 0);
		return "Bônus de XP: +" + BonusXPLoja(n) + " → +" + BonusXPLoja(n + 1) + " por abate";
	},
	CompraEsmCM() {
		if (N(lvlEsmCM) >= 1) return "CM ganho: no nível máximo (×2 do item)";
		// o item dobra só a parte dele (2^nível); os marcos de 50 níveis e o
		// bônus de resets curtos multiplicam por fora e não dobram
		const atual = MultiplicadorCM();
		const prox = atual + Math.pow(2, Math.max(0, Math.floor(Number(lvlEsmCM) || 0))) * BonusCMResetCurto();
		return "CM ganho no reset: ×" + FormataMultCM(atual) + " → ×" + FormataMultCM(prox);
	},
	CompraVelComp() {
		if (ITENS_PATENTE.velcomp.noTeto()) {
			return "Velocidade do companheiro — ★ " + (GanhoProximaPatenteTexto("velcomp") || "patente máxima");
		}
		const prox = Math.min(TetoLoja("velcomp"), N(velAtaqueComp) + PassoLoja("velcomp"));
		return "Ataques do companheiro: " + N(velAtaqueComp).toFixed(1) + "/s → "
			+ prox.toFixed(1) + "/s (máx " + TetoLoja("velcomp").toFixed(1) + "/s)";
	}
};

function NomeFuncaoCompra(btn) {
	const attr = btn.getAttribute("onclick") || "";
	const m = attr.match(/^\s*([A-Za-z_$][\w$]*)\s*\(/);
	return m ? m[1] : null;
}

// ids no HTML que não batem com o nome da variável de preço
const ALIAS_PRECO = { precoQTDAvan: "precoQTDAvanco" };

// Localiza o item de patente pela variável de preço da sua linha
function ItemPorPrecoVar(varPreco) {
	for (const [id, cfg] of Object.entries(ITENS_PATENTE)) {
		if (cfg.precoVar === varPreco) return { id, cfg };
	}
	return null;
}

function MostraPreviewCompra(btn) {
	const nome = NomeFuncaoCompra(btn);
	const calc = PREVIEWS_LOJA[nome];
	const painel = btn.closest("#Loja, #LojaEsm");
	if (!calc || !painel) return;

	const div = painel.querySelector(".preview-compra");
	if (!div) return;

	div.textContent = calc();
	div.hidden = false;

	// cor: dá para pagar?
	let podePagar = true;
	const linha = btn.closest("tr");
	const celulaPreco = linha ? linha.querySelector("td:nth-child(2) > div") : null;
	const idPreco = celulaPreco ? (ALIAS_PRECO[celulaPreco.id] || celulaPreco.id) : "";
	if (/^preco/.test(idPreco) && window[idPreco] !== undefined) {
		// no teto com patente pendente a célula mostra o ingresso, não o nível
		const item = ItemPorPrecoVar(idPreco);
		const preco = (item && item.cfg.noTeto()) ? PrecoPatenteLoja(item.id) : window[idPreco];
		podePagar = (painel.id === "LojaEsm")
			? N(esmeraldas) >= N(preco)
			: GE(gold, preco);
	}
	div.classList.toggle("preview-compra--nao-pode", !podePagar);
}

document.addEventListener("DOMContentLoaded", () => {
	document.querySelectorAll("#Loja input.Loja, #LojaEsm input.Loja").forEach(btn => {
		const mostrar = () => MostraPreviewCompra(btn);
		btn.addEventListener("mouseenter", mostrar);
		btn.addEventListener("focus", mostrar);
		// após o clique inline (compra já aplicada), atualiza o preview
		btn.addEventListener("click", mostrar);
	});
});

// ============================================================
// HOLD PRA COMPRAR (loja de gold): segurar o "Evoluir" repete a compra
// ============================================================
// Late game: segurar o botão compra nível atrás de nível até o gold acabar
// (ou até o nível máximo). A primeira falha encerra o hold com UM aviso do
// próprio jogo — sem spam de toast. Clique normal e teclado seguem iguais:
// um clique, uma compra (o clique sintético pós-pointerdown é engolido).

var holdCompraTimer = null;
var holdCompraBotao = null;
var holdCompraInfoOriginal = null;
var holdCompraCliquePendente = null;

function HoldCompraPara() {
	if (holdCompraTimer) {
		clearInterval(holdCompraTimer);
		holdCompraTimer = null;
	}
	if (holdCompraInfoOriginal) {
		MostraInfo = holdCompraInfoOriginal;
		holdCompraInfoOriginal = null;
	}
	holdCompraBotao = null;
}

function HoldCompraTenta() {
	const btn = holdCompraBotao;
	if (!btn || !btn.isConnected) {
		HoldCompraPara();
		return;
	}
	// lê o onclick inline (CompraDano(), CompraGold(), ...) e chama de volta
	const chamada = (btn.getAttribute("onclick") || "").trim();
	const m = /^([A-Za-z_$][\w$]*)\s*\(\s*\)$/.exec(chamada);
	if (!m || typeof window[m[1]] !== "function") {
		HoldCompraPara();
		return;
	}
	// sem gold ou nível máximo: o jogo chama MostraInfo, que neste momento é
	// o interceptor — ele restaura tudo e avisa uma única vez
	window[m[1]]();
	if (holdCompraBotao) MostraPreviewCompra(btn); // preview do Tier1 #5 em dia
}

function HoldCompraInicia(btn) {
	HoldCompraPara();
	holdCompraBotao = btn;

	// intercepta o aviso da compra: 1ª falha = fim do hold, um aviso só
	const avisoOriginal = MostraInfo;
	holdCompraInfoOriginal = avisoOriginal;
	MostraInfo = function (msg) {
		HoldCompraPara();
		avisoOriginal(msg);
	};

	HoldCompraTenta(); // resposta imediata no pointerdown
	if (holdCompraBotao) holdCompraTimer = setInterval(HoldCompraTenta, 100);
}

// Delegado no document: não depende de quando o DOM da loja é montado
document.addEventListener("pointerdown", (e) => {
	if (e.pointerType === "mouse" && e.button !== 0) return;
	const btn = e.target && e.target.closest ? e.target.closest("#Loja input.Loja[onclick]") : null;
	if (!btn) return;
	if (holdCompraBotao === btn && holdCompraTimer) return; // já segurando
	HoldCompraInicia(btn);
	btn.focus({ preventScroll: true });
	e.preventDefault(); // segurar não vira clique/arraste do navegador
});

// o clique que o navegador ainda emitir depois do hold não compra de novo
document.addEventListener("click", (e) => {
	if (!holdCompraCliquePendente || e.target !== holdCompraCliquePendente) return;
	holdCompraCliquePendente = null;
	e.preventDefault();
	e.stopPropagation();
}, true);

window.addEventListener("pointerup", () => {
	const btn = holdCompraBotao;
	if (btn) {
		holdCompraCliquePendente = btn;
		setTimeout(() => {
			if (holdCompraCliquePendente === btn) holdCompraCliquePendente = null;
		}, 400);
	}
	HoldCompraPara();
});
window.addEventListener("pointercancel", HoldCompraPara);
window.addEventListener("blur", HoldCompraPara);
