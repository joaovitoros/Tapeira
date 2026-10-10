// =========================
// LOGS (histórico de mensagens)
// =========================
// Buffer em memória com as mensagens que antes apareciam na caixa "Infos".
// A caixa saiu da tela: o histórico (últimos 500) abre pelo botão "Logs"
// no fim do menu de configurações. É só da sessão atual — não entra no save
// e não zera no reset.
(function () {
	"use strict";

	window.Tapeira = window.Tapeira || {};

	const LIMITE = 500;
	const entradas = [];

	// Mensagens de combate muito frequentes poluem o histórico:
	// o dano crítico de cada golpe fica fora por regra.
	const FILTROS = [/^Dano critico de:/];

	function normaliza(mensagem) {
		return typeof mensagem === "string" ? mensagem.trim() : "";
	}

	window.Tapeira.Logs = {
		LIMITE: LIMITE,

		// Registra uma mensagem; retorna false se ela foi ignorada
		// (vazia ou filtrada). Chamado por UI.showInfo.
		adiciona(mensagem) {
			const texto = normaliza(mensagem);
			if (!texto) return false;
			if (FILTROS.some(padrao => padrao.test(texto))) return false;

			entradas.push({ hora: new Date().toTimeString().slice(0, 8), texto: texto });
			if (entradas.length > LIMITE) entradas.shift();
			return true;
		},

		// Mais antiga → mais recente (a tela mostra invertido)
		pegaLista: () => entradas.slice(),
		contagem: () => entradas.length,
		limpa: () => { entradas.length = 0; }
	};
})();
