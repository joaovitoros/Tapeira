// ===================== RODAPÉ: BOTÕES + HABILIDADES ======================
// Regras do rodapé da caverna:
//   1) #container-Botoes fica SEMPRE horizontal (uma fileira só) e SEMPRE no
//      canto inferior esquerdo — o canto é ancorado pelo pai
//      #container-opcoes (css/estilos.css).
//   2) #container-Habilidades fica AO LADO da fileira de botões quando a tela
//      comporta os dois COM FOLGA; quando não cabe, ela sobe PARA CIMA dos
//      botões (nunca por baixo/atrás deles). Em QUALQUER dos dois casos as
//      skills ficam sempre ABAIXO do log de avisos (#logAvisos) quando ele
//      está visível — ordem de cima pra baixo: log, skills, botões.
// A largura da fileira de skills varia a cada desbloqueio (ícone do "Dano
// automático", skills de combate), então a posição é MEDIDA de verdade e
// aplicada nas variáveis CSS --rodape-hab-left / --rodape-hab-bottom de
// #container-Habilidades. Sem timers: os gatilhos são ResizeObserver (fileira
// de botões e fileira de skills) e o resize da janela.
var UIRodape = (function () {
	var ESPACO_LADO = 12; // espaço entre os botões e as skills, lado a lado
	var ESPACO_CIMA = 10; // espaço entre os botões e as skills, empilhadas
	var FOLGA_LADO = 16;  // sobra mínima à direita para aceitar lado a lado
	var MARGEM_ESQ = 8;   // recuo mínimo da borda esquerda da tela
	var MARGEM_TOPO = 8;  // recuo mínimo da borda superior (nunca sai da tela)

	var ultimoLeft = null;
	var ultimoBottom = null;
	var ultimoTopo = null;
	var atualizando = false;

	// Largura natural da fileira de skills: encosta a fileira na borda
	// esquerda durante a medição, senão o shrink-to-fit do elemento fixo
	// encolheria a largura por falta de espaço à direita.
	function MedeLargura(hab) {
		var esquerda = hab.style.left;
		var base = hab.style.bottom;
		hab.style.left = "0px";
		hab.style.bottom = "";
		var largura = Math.max(hab.getBoundingClientRect().width, hab.scrollWidth);
		hab.style.left = esquerda;
		hab.style.bottom = base;
		return largura;
	}

	function Aplica(hab, left, bottom) {
		var vLeft = Math.round(left) + "px";
		var vBottom = Math.round(bottom) + "px";
		if (vLeft === ultimoLeft && vBottom === ultimoBottom) return;
		ultimoLeft = vLeft;
		ultimoBottom = vBottom;
		hab.style.setProperty("--rodape-hab-left", vLeft);
		hab.style.setProperty("--rodape-hab-bottom", vBottom);
	}

	// Topo da navegação (#container-opcoes). A loja em tela cheia termina acima
	// daqui, então fica publicada em --rodape-top (no <html>) para o CSS da loja
	// não cobrir o rodapé. As habilidades ficam POR BAIXO da loja (z-index da
	// loja é maior), então não entram nessa medida.
	function AplicaTopoBanda(topo) {
		var v = Math.round(topo) + "px";
		if (v === ultimoTopo) return;
		ultimoTopo = v;
		document.documentElement.style.setProperty("--rodape-top", v);
	}

	// Topo (y de cima) da fileira de skills quando ela está EMPILHADA.
	// Regras: (a) as skills ficam sempre ABAIXO do log de avisos (#logAvisos)
	// quando ele está visível — ordem de cima pra baixo: log, skills, botões;
	// (b) nunca invadem a fileira de botões (o log é translúcido e pode ceder,
	// os botões não). Devolve null quando não há log medível.
	function TopoAbaixoDoLog() {
		var log = document.getElementById("logAvisos");
		if (!log || log.hidden) return null;
		var rLog = log.getBoundingClientRect();
		// log.hidden só tira do fluxo; visibility:hidden continua medindo.
		if (rLog.width === 0 || rLog.height === 0) return null;
		if (getComputedStyle(log).visibility === "hidden") return null;
		return rLog.bottom + ESPACO_CIMA;
	}

	// Com a loja aberta, as skills precisam ficar EMPILHADAS (acima da
	// navegação), senão elas ficariam ao lado dos botões, na mesma faixa — e a
	// loja (que para acima da navegação) não as cobriria. Devolve a borda
	// direita útil: quando a loja está visível, o limite cai para perto da
	// borda esquerda e o teste "cabe ao lado" falha de propósito.
	// Olha o visibility INLINE (o mesmo que o CSS :has usa) — o computed fica
	// "visible" durante o fade-out.
	function LimiteDireita() {
		var limite = document.documentElement.clientWidth;
		var paineis = ["Loja", "LojaEsm", "LojaCM"];
		for (var i = 0; i < paineis.length; i++) {
			var p = document.getElementById(paineis[i]);
			if (!p || p.style.visibility !== "visible") continue;
			var r = p.getBoundingClientRect();
			if (r.width === 0 || r.height === 0) continue;
			limite = Math.min(limite, r.left - FOLGA_LADO);
		}
		return limite;
	}

	function Atualiza() {
		atualizando = false;
		var botoes = document.getElementById("container-Botoes");
		var hab = document.getElementById("container-Habilidades");
		if (!botoes || !hab) return;

		var rBot = botoes.getBoundingClientRect();
		if (rBot.width === 0 || rBot.height === 0) return; // navegação escondida

		var larguraHab = MedeLargura(hab);
		var alturaHab = hab.getBoundingClientRect().height;
		var alturaTela = document.documentElement.clientHeight;
		var limiteDireita = LimiteDireita();
		var cabeAoLado =
			rBot.left + rBot.width + ESPACO_LADO + larguraHab <= limiteDireita;
		if (cabeAoLado) {
			// Lado a lado: base das skills alinhada com a base dos botões.
			Aplica(hab, rBot.right + ESPACO_LADO, alturaTela - rBot.bottom);
		} else {
			// Empilhada: por baixo do log (quando visível) e sempre por cima
			// da fileira de botões. Se não couber entre os dois, os botões têm
			// prioridade — as skills sobem e podem encostar no log.
			var topoLog = TopoAbaixoDoLog();
			var topoMax = rBot.top - ESPACO_CIMA - alturaHab;
			var topo = topoLog === null ? topoMax : Math.min(topoLog, topoMax);
			topo = Math.max(MARGEM_TOPO, topo);
			Aplica(hab, Math.max(MARGEM_ESQ, rBot.left), alturaTela - topo - alturaHab);
		}

		// A loja em tela cheia termina acima da navegação (#container-opcoes) —
		// a fileira de skills fica por baixo da loja (a loja tem z-index maior).
		var opcoes = document.getElementById("container-opcoes");
		var rOpcoes = opcoes ? opcoes.getBoundingClientRect() : rBot;
		AplicaTopoBanda(rOpcoes.height > 0 ? rOpcoes.top : rBot.top);
	}

	// Pede uma reavaliação sem criar timer: o ResizeObserver e o resize da
	// janela já disparam isso nos momentos em que as medidas mudam.
	function Pede() {
		if (atualizando) return;
		atualizando = true;
		if (typeof requestAnimationFrame === "function") requestAnimationFrame(Atualiza);
		else Atualiza();
	}

	function Inicia() {
		var botoes = document.getElementById("container-Botoes");
		var hab = document.getElementById("container-Habilidades");
		if (!botoes || !hab) return;
		if (typeof ResizeObserver === "function") {
			var obs = new ResizeObserver(Pede);
			obs.observe(botoes);
			obs.observe(hab);
		}
		// Abrir/fechar a loja muda o limite à direita (ver LimiteDireita): a
		// mudança de visibility inline é o gatilho, sem timer próprio.
		if (typeof MutationObserver === "function") {
			var obsLoja = new MutationObserver(Pede);
			["Loja", "LojaEsm", "LojaCM"].forEach(function (id) {
				var p = document.getElementById(id);
				if (p) obsLoja.observe(p, { attributes: true, attributeFilter: ["style"] });
			});
		}
		window.addEventListener("resize", Pede);
		Pede();
	}

	return { Inicia: Inicia, Atualiza: Atualiza, Pede: Pede };
})();

// Os elementos vivem no <body>, então espera o DOM (script carregado no head).
if (document.readyState === "loading") {
	document.addEventListener("DOMContentLoaded", function () { UIRodape.Inicia(); });
} else {
	UIRodape.Inicia();
}
