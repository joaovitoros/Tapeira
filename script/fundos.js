// ---------- Fundo da caverna ----------
// Duas camadas fixas (#fundoA/#fundoB) se cruzam (crossfade ~1,2s; corte seco
// em reduced-motion). Quem escolhe a ARTE é script/biomas.js: uma por faixa de
// 10 andares. Cosmético: não vai pro save.
//
// (Extraído de script.js sem alterar uma linha — ver REFATORACAO.md. Carregado
//  logo depois de script.js; as funções seguem globais.)
var FUNDOS_CAVERNA = ['fundos/background cristal.png', 'fundos/background.png'];
var fundoIdxAtual = 0;
var fundoA = null, fundoB = null, fundoAtiva = null;

function IniciaFundos() {
	if (fundoAtiva) return; // idempotente (Batalha roda a cada load/onda)
	fundoA = document.getElementById('fundoA');
	fundoB = document.getElementById('fundoB');
	if (!fundoA || !fundoB) return;
	fundoAtiva = fundoA;
	// aquece as duas artes: a primeira troca não pode "piscar"
	FUNDOS_CAVERNA.forEach(function (nome) {
		var img = new Image();
		img.src = 'imagens/' + nome;
	});
}

// Troca a arte do fundo com o crossfade das duas camadas. Usado tanto pelo
// rodízio normal (a cada andar) quanto pelo teste visual (a cada 10 andares).
function TrocaFundoPara(caminho) {
	if (!fundoAtiva) IniciaFundos();
	if (!fundoAtiva) return;
	var oculta = fundoAtiva === fundoA ? fundoB : fundoA;
	// andares muito rápidos: conclui na hora qualquer crossfade em voo
	fundoAtiva.style.transition = 'none';
	fundoAtiva.style.opacity = '1';
	oculta.style.transition = 'none';
	oculta.style.opacity = '0';
	void oculta.offsetHeight; // aplica os estados finais sem transição
	// a camada oculta recebe a próxima arte; as duas se cruzam (~1,2s)
	// URL absoluta: URL relativa dentro de var() resolveria contra estilos.css (css/imagens/… = 404)
	oculta.style.setProperty('--fundo-img', "url('" + new URL('imagens/' + caminho, document.baseURI).href + "')");
	fundoAtiva.style.transition = '';
	oculta.style.transition = '';
	void oculta.offsetHeight; // reativa a transição antes de mexer no opacity
	oculta.style.opacity = '1';
	fundoAtiva.style.opacity = '0';
	fundoAtiva = oculta;
}

function ProximoFundo() {
	// Biomas: o fundo segue a FAIXA de 10 andares — só troca quando a faixa
	// muda, não a cada andar vencido. Ver script/biomas.js.
	if (typeof BiomaFundoMudou === "function") {
		var caminho = BiomaFundoMudou();
		if (caminho) TrocaFundoPara(caminho);
		return;
	}
	// fallback (sem o módulo de biomas): rodízio simples a cada andar
	fundoIdxAtual = (fundoIdxAtual + 1) % FUNDOS_CAVERNA.length;
	TrocaFundoPara(FUNDOS_CAVERNA[fundoIdxAtual]);
}
