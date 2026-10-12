// ===================== BATALHA-FANTASMA (PvP ASSÍNCRONO) =====================
// Fase 1: o "cartão de batalha" — exportar, validar, receber o cartão do
// adversário e abrir a tela de comparação (você vs. fantasma). A corrida
// contra o chefe (simulação determinística com a seed) vem na Fase 2.
//
// Regras da v1 (combinadas com o jogador):
// - O cartão é TRANSITÓRIO: não entra no save — os 5 passos do contrato de
//   save não valem aqui (ValidarSave continua intacto).
// - Vai de um jogador pro outro como ARQUIVO .json, pelo mesmo canal do
//   save: exportar no PC/celular e "Abrir com TAPeira" no Android (o intent
//   entrega o arquivo em ImportarSaveJson, que ramifica pro cartão).
// - Carrega valores JÁ CALCULADOS (não o save cru): funciona entre versões
//   diferentes do jogo e não vaza o progresso inteiro do jogador.

var PvpFantasma = {
	// taxa nominal de golpes por segundo do duelo — os dois lados usam a
	// mesma, então a corrida compara builds, não a velocidade do dedo
	TAXA_ATAQUE_JOGADOR: 3,

	_registrado: false,

	// =========================
	// CARTÃO
	// =========================

	MontaCartaoBatalha() {
		const multDanoTotal = MultiplicadorDanoFormigas() * MultiplicadorDanoNivel() * Tapeira.ItensBuild.multDano();
		const multEspNormal = MultiplicadorDanoEspecializacao(false);
		const multEspCritico = MultiplicadorDanoEspecializacao(true);
		return {
			saveFormat: "tapeira-cartao-batalha",
			saveVersion: 1,
			exportedAt: new Date().toISOString(),
			nome: "Tapeira",
			nivel: Math.max(1, N(nivelJogador) | 0),
			// golpes nominais (sem crítico e sem situações pontuais — guardião,
			// pausa de fuga, buff de alquimista, cadeia de ataques)
			danoGolpe: Math.max(0, N(danoJogador) * multDanoTotal * multEspNormal),
			danoCrit: Math.max(0, N(danoCritJogador) * Tapeira.ItensBuild.multDanoCrit() * multDanoTotal * multEspCritico),
			chanceCrit: Math.min(1, Math.max(0, N(chanceCrit) * Tapeira.ItensBuild.multChanceCrit())),
			// DPS do companheiro de dano: a Velocidade multiplica os hits/s
			dpsCompanheiro: N(danoComp) > 0
				? Math.max(0, N(danoComp) * Tapeira.ItensBuild.multDanoComp() * multDanoTotal * multEspNormal * N(velAtaqueComp))
				: 0,
			especializacao: especializacao > 0 ? ESPECIALIZACOES[especializacao].nome : null,
			itensBuildResumo: Tapeira.ItensBuild.resumo(),
			taxaAtaque: this.TAXA_ATAQUE_JOGADOR,
			seed: Math.floor(Math.random() * 2147483647)
		};
	},

	// DPS médio de um cartão (crítico ponderado pela chance) — usado na ficha
	// e, na Fase 2, na corrida contra o chefe
	DpsMedio(cartao) {
		const golpeMedio = cartao.danoGolpe * (1 - cartao.chanceCrit) + cartao.danoCrit * cartao.chanceCrit;
		return cartao.taxaAtaque * golpeMedio + cartao.dpsCompanheiro;
	},

	ValidarCartaoBatalha(cartao) {
		if (!cartao || typeof cartao !== "object" || Array.isArray(cartao)) {
			throw new TypeError("O arquivo não contém um cartão de batalha válido.");
		}
		if (cartao.saveFormat !== "tapeira-cartao-batalha") {
			throw new TypeError("O arquivo não é um cartão de batalha da TAPeira.");
		}
		if (!Number.isInteger(cartao.saveVersion) || cartao.saveVersion < 1) {
			throw new TypeError("A versão do cartão de batalha é inválida.");
		}
		for (const campo of ["danoGolpe", "danoCrit", "chanceCrit", "dpsCompanheiro", "taxaAtaque", "seed"]) {
			if (!Number.isFinite(cartao[campo]) || cartao[campo] < 0) {
				throw new TypeError(`O campo "${campo}" do cartão de batalha é inválido.`);
			}
		}
		if (cartao.danoGolpe <= 0 || cartao.taxaAtaque <= 0 || cartao.chanceCrit > 1) {
			throw new TypeError("Os valores de ataque do cartão de batalha são inválidos.");
		}
		if (cartao.nome !== undefined && (typeof cartao.nome !== "string" || !cartao.nome.trim())) {
			throw new TypeError("O nome do cartão de batalha é inválido.");
		}
		if (cartao.itensBuildResumo !== undefined && typeof cartao.itensBuildResumo !== "string") {
			throw new TypeError("O resumo de itens do cartão de batalha é inválido.");
		}
		return true;
	},

	// =========================
	// EXPORTAR (mesmos 3 canais do save: desktop, Android e navegador)
	// =========================

	ExportaCartaoBatalha() {
		let cartao;
		try {
			cartao = this.MontaCartaoBatalha();
			this.ValidarCartaoBatalha(cartao);
		} catch (error) {
			console.error("Não foi possível montar o cartão de batalha:", error);
			MostraInfo("Não foi possível montar o cartão de batalha.");
			return;
		}
		const json = JSON.stringify(cartao);
		const fileName = "TAPeira-cartao-batalha-" + cartao.exportedAt.replace(/[:.]/g, "-") + ".json";

		if (window.tapeiraDesktop?.saveJson) {
			window.tapeiraDesktop.saveJson(json, fileName).then(result => {
				MostraInfo(result.canceled
					? "Exportação cancelada."
					: "Cartão de batalha exportado — mande pro seu rival.");
			}).catch(error => {
				console.error("Erro ao exportar o cartão de batalha:", error);
				MostraInfo("Não foi possível exportar o cartão de batalha.");
			});
			return;
		}

		if (typeof window.tapeiraAndroidSave === "function") {
			window.tapeiraAndroidSave(json, fileName).then(() => {
				MostraInfo("Escolha onde salvar ou compartilhar o cartão de batalha.");
			}).catch(error => {
				console.error("Erro ao exportar o cartão no Android:", error);
				MostraInfo("Não foi possível exportar o cartão de batalha.");
			});
			return;
		}

		saveAs(
			new Blob([json], { type: "application/json;charset=utf-8" }),
			fileName
		);
		MostraInfo("Cartão de batalha exportado — mande pro seu rival.");
	},

	// =========================
	// RECEBER E DUELO
	// =========================

	// Chamado por ImportarSaveJson quando o arquivo é um cartão. Nunca toca
	// no save local — só abre a tela do duelo.
	RecebeCartao(cartao) {
		try {
			this.ValidarCartaoBatalha(cartao);
			this.AbreDuelo(cartao);
			MostraInfo("Cartão de batalha recebido — a ficha do duelo está aberta.");
			return true;
		} catch (error) {
			console.error("Cartão de batalha inválido:", error);
			MostraInfo(`Cartão de batalha inválido: ${error.message} O progresso atual foi mantido.`);
			return false;
		}
	},

	// Fase 1: ficha dos dois duelistas lado a lado (a corrida vem na Fase 2)
	AbreDuelo(cartaoFantasma) {
		this.FechaDuelo(); // reabrir troca o adversário
		const meuCartao = this.MontaCartaoBatalha();
		const dpsMeu = this.DpsMedio(meuCartao);
		const dpsFantasma = this.DpsMedio(cartaoFantasma);

		const modal = document.createElement("div");
		modal.id = "pvpDuelo";
		modal.innerHTML = `
		<div class="pvpDueloBox">
			<div class="pvpDueloTitulo">BATALHA-FANTASMA</div>
			<div class="pvpDueloSub">Ficha dos duelistas — a corrida contra o chefe chega na próxima etapa.</div>
			<div class="pvpCartoes">
				${this._htmlCartao("Você", meuCartao, dpsMeu, dpsFantasma)}
				${this._htmlCartao("Fantasma", cartaoFantasma, dpsFantasma, dpsMeu)}
			</div>
			<div class="pvpDueloAcoes">
				<button type="button" class="btn-Padrao" data-pvp-exportar>Exportar meu cartão</button>
				<button type="button" class="btn-Padrao" data-pvp-fechar>Fechar</button>
			</div>
		</div>
	`;
		document.body.appendChild(modal);
	},

	FechaDuelo() {
		const modal = document.getElementById("pvpDuelo");
		if (modal) modal.remove();
	},

	_htmlCartao(rotulo, cartao, dps, dpsAdversario) {
		const lider = dps > dpsAdversario;
		const linhas = [
			["Nome", this._esc(cartao.nome || "Tapeira")],
			["Nível", String(cartao.nivel ?? "—")],
			["Golpe", FormatarGold(cartao.danoGolpe)],
			["Crítico", FormatarGold(cartao.danoCrit) + " · " + (cartao.chanceCrit * 100).toFixed(1) + "%"],
			["DPS companheiro", FormatarGold(cartao.dpsCompanheiro)],
			["DPS total", FormatarGold(dps)],
			["Especialização", this._esc(cartao.especializacao || "—")],
			["Itens da build", this._esc(cartao.itensBuildResumo || "—")]
		];
		const corpo = linhas.map(linha =>
			`<div class="pvpCartaoLinha"><span>${linha[0]}</span><b>${linha[1]}</b></div>`).join("");
		return `
		<div class="pvpCartao${lider ? " pvpCartao--lider" : ""}">
			<div class="pvpCartaoCab">${this._esc(rotulo)}${lider ? " · vantagem" : ""}</div>
			${corpo}
		</div>`;
	},

	// valores vindos de cartão de terceiros: escapa antes de provar o DOM
	_esc(texto) {
		return String(texto)
			.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
			.replace(/"/g, "&quot;");
	},

	// =========================
	// LISTENERS (delegados, uma vez — sem onclick inline)
	// =========================

	RegistraListeners() {
		if (this._registrado) return;
		this._registrado = true;
		document.addEventListener("click", (e) => {
			if (e.target.closest("[data-pvp-fechar]")) {
				this.FechaDuelo();
				return;
			}
			if (e.target.closest("[data-pvp-exportar]")) {
				this.ExportaCartaoBatalha();
			}
		});
	}
};

PvpFantasma.RegistraListeners();
