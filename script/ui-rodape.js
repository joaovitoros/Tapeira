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
	var MARGEM_ESQ = 8;   // recuo mínimo da borda esquerda da tela
	var MARGEM_TOPO = 8;  // recuo mínimo da borda superior (nunca sai da tela)

	var ultimoLeft = null;
	var ultimoBottom = null;
	var ultimoTopo = null;
	var ultimoNavTop = null;
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

	// Topo da FAIXA INFERIOR (navegação + habilidades). A loja termina acima
	// daqui, então fica publicada em --rodape-banda-top (no <html>) para o CSS
	// da loja não cortar nem o rodapé nem as skills. É o menor y entre o topo da
	// navegação e o topo da fileira de skills (as skills ficam acima da
	// navegação quando empilhadas e sobressaem quando lado a lado).
	function AplicaTopoBanda(topo) {
		var v = Math.round(topo) + "px";
		if (v === ultimoTopo) return;
		ultimoTopo = v;
		document.documentElement.style.setProperty("--rodape-banda-top", v);
	}

	// Topo da NAVEGAÇÃO (fileira de botões). Publicado em --rodape-nav-top
	// porque, no rodapé EMPILHADO, a loja (e os painéis Feitos/Ramos, que têm o
	// mesmo tamanho) devem terminar AQUI — cobrindo as skills que ficam acima
	// da navegação.
	function AplicaTopoNav(topo) {
		var v = Math.round(topo) + "px";
		if (v === ultimoNavTop) return;
		ultimoNavTop = v;
		document.documentElement.style.setProperty("--rodape-nav-top", v);
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

	// A loja NÃO entra mais nesta conta: abrir/fechar a loja não pode mexer na
	// posição das habilidades (pedido). O limite à direita é só a largura útil
	// da tela — a loja é um overlay (z-index 16 > 15) que passa por cima das
	// skills sem reposicioná-las.
	function LimiteDireita() {
		return document.documentElement.clientWidth;
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
		// MOBILE NO VERTICAL: as skills ficam SEMPRE ACIMA dos botoes, mesmo
		// quando caberiam ao lado (pedido). Em retrato o "lado a lado" espremia a
		// fileira contra a borda direita e dificultava o toque pra ativar a
		// habilidade. Acima de 960px (desktop) o lado a lado continua valendo.
		var retratoMobile =
			(typeof window.matchMedia === "function"
				&& window.matchMedia("(orientation: portrait)").matches)
			&& document.documentElement.clientWidth <= 960;
		var cabeAoLado = !retratoMobile &&
			rBot.left + rBot.width + ESPACO_LADO + larguraHab <= limiteDireita;
		var topoSkills;
		if (cabeAoLado) {
			// Lado a lado: base das skills alinhada com a base dos botões.
			Aplica(hab, rBot.right + ESPACO_LADO, alturaTela - rBot.bottom);
			topoSkills = rBot.bottom - alturaHab;
		} else {
			// Empilhada: por baixo do log (quando visível) e sempre por cima
			// da fileira de botões. Se não couber entre os dois, os botões têm
			// prioridade — as skills sobem e podem encostar no log.
			var topoLog = TopoAbaixoDoLog();
			var topoMax = rBot.top - ESPACO_CIMA - alturaHab;
			var topo = topoLog === null ? topoMax : Math.min(topoLog, topoMax);
			topo = Math.max(MARGEM_TOPO, topo);
			Aplica(hab, Math.max(MARGEM_ESQ, rBot.left), alturaTela - topo - alturaHab);
			topoSkills = topo;
		}

		// Faixa inferior = navegação + habilidades. A loja termina acima dela
		// (o overlay não corta nem os botões nem as skills).
		var opcoes = document.getElementById("container-opcoes");
		var rOpcoes = opcoes ? opcoes.getBoundingClientRect() : rBot;
		var topoNav = rOpcoes.height > 0 ? rOpcoes.top : rBot.top;
		AplicaTopoBanda(Math.min(topoNav, topoSkills));
		AplicaTopoNav(topoNav);
		// Rodapé empilhado = skills ACIMA dos botões. O CSS (html.rodape-empilhado)
		// usa isto para a loja terminar acima da navegação e cobrir as skills.
		document.documentElement.classList.toggle("rodape-empilhado", !cabeAoLado);
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
		// A loja não reposiciona mais as habilidades (é só overlay), então não
		// há observer dos painéis da loja — só a fileira de botões, a fileira de
		// skills e o resize da janela disparam remeasure.
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
