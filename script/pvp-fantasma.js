// ===================== BATALHA-FANTASMA (PvP ASSÍNCRONO) =====================
// Fase 1: o "cartão de batalha" — exportar, validar e receber o cartão do
// adversário e abrir a tela de comparação (você vs. fantasma).
// Fase 2: a corrida contra o chefe — simulação determinística com seed.
//
// Regras da v1 (combinadas com o jogador):
// - O cartão é TRANSITÓRIO: não entra no save — os 5 passos do contrato de
//   save não valem aqui (ValidarSave continua intacto).
// - Vai de um jogador pro outro como ARQUIVO .json, pelo mesmo canal do
//   save: exportar no PC/celular e "Abrir com TAPeira" no Android (o intent
//   entrega o arquivo em ImportarSaveJson, que ramifica pro cartão).
// - Carrega valores JÁ CALCULADOS (não o save cru): funciona entre versões
//   diferentes do jogo e não vaza o progresso inteiro do jogador.
// - Regra do duelo: cada um enfrenta um chefe idêntico com
//   vida = (dpsVocê + dpsFantasma) / 2 × 25 SEGUNDOS — quem derruba o seu
//   primeiro vence (build igual = corrida apertada de ~25s; build melhor =
//   chefe cai antes dos 25s).
// - Determinismo: RNG mulberry32 com seed combinada (XOR, comutativo) e
//   lados canônicos ordenados por (seed, exportedAt) — as DUAS máquinas
//   calculam o mesmo resultado, independente de quem importou quem.

var PvpFantasma = {
	// taxa nominal de golpes por segundo do duelo — os dois lados usam a
	// mesma, então a corrida compara builds, não a velocidade do dedo
	TAXA_ATAQUE_JOGADOR: 3,

	_registrado: false,
	// estado da tela aberta: cartões em disputa, timer da animação e
	// resultado — tudo transitório (nunca vai pro save)
	_dueloAtual: null,
	_resultadoDuelo: null,
	_timerDuelo: null,

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

	// Fase 1: ficha dos dois duelistas lado a lado + acesso à corrida (Fase 2)
	AbreDuelo(cartaoFantasma) {
		this.FechaDuelo(); // reabrir troca o adversário e limpa estado anterior
		const meuCartao = this.MontaCartaoBatalha();
		const dpsMeu = this.DpsMedio(meuCartao);
		const dpsFantasma = this.DpsMedio(cartaoFantasma);
		this._dueloAtual = { cartaoMeu: meuCartao, cartaoFantasma };

		const modal = document.createElement("div");
		modal.id = "pvpDuelo";
		modal.innerHTML = `
		<div class="pvpDueloBox">
			<div class="pvpDueloTitulo">BATALHA-FANTASMA</div>
			<div class="pvpDueloSub">Ficha dos duelistas — quem derruba o chefe primeiro vence.</div>
			<div class="pvpCartoes">
				${this._htmlCartao("Você", meuCartao, dpsMeu, dpsFantasma)}
				${this._htmlCartao("Fantasma", cartaoFantasma, dpsFantasma, dpsMeu)}
			</div>
			<div class="pvpDueloAcoes">
				<button type="button" class="btn-Padrao pvpBtnLutar" data-pvp-lutar>Começar duelo</button>
				<button type="button" class="btn-Padrao" data-pvp-exportar>Exportar meu cartão</button>
				<button type="button" class="btn-Padrao" data-pvp-fechar>Fechar</button>
			</div>
		</div>
	`;
		document.body.appendChild(modal);
	},

	FechaDuelo() {
		if (this._timerDuelo !== null) {
			clearInterval(this._timerDuelo);
			this._timerDuelo = null;
		}
		this._dueloAtual = null;
		this._resultadoDuelo = null;
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
	// FASE 2: CORRIDA CONTRA O CHEFE
	// =========================

	// mulberry32 — PRNG simples e determinístico (mesma seed = mesma
	// sequência em qualquer máquina)
	_prng(seed) {
		let a = seed >>> 0;
		return function () {
			a |= 0;
			a = (a + 0x6D2B79F5) | 0;
			let t = Math.imul(a ^ (a >>> 15), 1 | a);
			t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
			return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
		};
	},

	// ordem canônica dos lados: as duas máquinas chegam na mesma ordem,
	// independente de quem importou o cartão de quem
	_ordenados(cartaoMeu, cartaoFantasma) {
		const troca = cartaoMeu.seed > cartaoFantasma.seed
			|| (cartaoMeu.seed === cartaoFantasma.seed
				&& String(cartaoMeu.exportedAt) > String(cartaoFantasma.exportedAt));
		return troca ? [cartaoFantasma, cartaoMeu] : [cartaoMeu, cartaoFantasma];
	},

	// Uma corrida: chefe com 25s de vida NORMALIZADA (vida real ÷ a média
	// das duas builds). Round = 1 golpe (1/TAXA_ATAQUE_JOGADOR s): crítico
	// sorteado no RNG + dano contínuo do companheiro. O kill é interpolado
	// dentro do round para tempos finos. Retorna o tempo (s) e a série de
	// vida por round (a animação bebe daqui).
	_corrida(cartao, media, rnd) {
		const dt = 1 / this.TAXA_ATAQUE_JOGADOR;
		const golpe = cartao.danoGolpe / media;
		const critico = cartao.danoCrit / media;
		const companheiro = cartao.dpsCompanheiro / media * dt;
		let hp = 25;
		let round = 0;
		const serie = [{ t: 0, hp }];
		while (hp > 0 && round < 100000) {
			// a chamada ao RNG é incondicional: a sequência não muda com
			// chance de crítico 0 (determinismo entre as máquinas)
			const dano = (rnd() < cartao.chanceCrit ? critico : golpe) + companheiro;
			if (dano >= hp) {
				// morre neste round: interpola a fração dentro dele
				serie.push({ t: (round + hp / dano) * dt, hp: 0 });
				return { tempo: (round + hp / dano) * dt, serie };
			}
			hp -= dano;
			round++;
			serie.push({ t: round * dt, hp });
		}
		// nunca deve acontecer (dano > 0 sempre): truncado com segurança
		return { tempo: round * dt, serie };
	},

	// Simulação completa — pura função dos DOIS cartões. Mesmos cartões,
	// mesmo resultado nas duas máquinas (seed combinada por XOR).
	SimulaDuelo(cartaoMeu, cartaoFantasma) {
		this.ValidarCartaoBatalha(cartaoMeu);
		this.ValidarCartaoBatalha(cartaoFantasma);
		const [a, b] = this._ordenados(cartaoMeu, cartaoFantasma);
		const media = (this.DpsMedio(a) + this.DpsMedio(b)) / 2;
		if (!(media > 0)) {
			throw new TypeError("As builds do duelo não têm DPS válido.");
		}
		const rnd = this._prng((a.seed ^ b.seed) >>> 0);
		const corridaA = this._corrida(a, media, rnd);
		const corridaB = this._corrida(b, media, rnd);
		// empate exato no tempo (improvável): moeda do mesmo RNG
		const vencedor = corridaA.tempo < corridaB.tempo ? "A"
			: corridaB.tempo < corridaA.tempo ? "B"
				: (rnd() < 0.5 ? "A" : "B");
		const meuEhA = a === cartaoMeu;
		return {
			tempoMeu: meuEhA ? corridaA.tempo : corridaB.tempo,
			tempoFantasma: meuEhA ? corridaB.tempo : corridaA.tempo,
			serieMeu: meuEhA ? corridaA.serie : corridaB.serie,
			serieFantasma: meuEhA ? corridaB.serie : corridaA.serie,
			venceu: (meuEhA ? "A" : "B") === vencedor,
			hpSegundos: 25
		};
	},

	// ---- execução da corrida na tela ----

	IniciaDuelo() {
		if (this._timerDuelo !== null || !this._dueloAtual) return;
		let resultado;
		try {
			resultado = this.SimulaDuelo(
				this._dueloAtual.cartaoMeu,
				this._dueloAtual.cartaoFantasma);
		} catch (error) {
			console.error("Não foi possível simular o duelo:", error);
			MostraInfo("Não foi possível simular o duelo.");
			return;
		}
		this._resultadoDuelo = resultado;

		const modal = document.getElementById("pvpDuelo");
		if (!modal) return;
		const cartoes = modal.querySelector(".pvpCartoes");
		const botaoLutar = modal.querySelector("[data-pvp-lutar]");
		if (botaoLutar) botaoLutar.remove();
		if (cartoes) {
			cartoes.insertAdjacentHTML("afterend", this._htmlCorrida());
			cartoes.style.display = "none";
		}

		// animação: percorre a timeline da corrida em 3s (o tempo real do
		// duelo pode ser de minutos — a animação só acelera a exibição)
		const DURACAO_MS = 3000;
		const tempoTotal = Math.max(resultado.tempoMeu, resultado.tempoFantasma);
		const inicio = Date.now();
		const atualiza = () => {
			const el = document.getElementById("pvpDuelo");
			const decorrido = Date.now() - inicio;
			const t = tempoTotal * Math.min(1, decorrido / DURACAO_MS);
			if (el) this._pintaCorrida(resultado, t);
			if (decorrido >= DURACAO_MS) {
				clearInterval(this._timerDuelo);
				this._timerDuelo = null;
				if (el) {
					this._mostraResultado(resultado);
				} else {
					// fecharam o duelo durante a animação: só registra
					this._logResultado(resultado);
				}
			}
		};
		this._timerDuelo = setInterval(atualiza, 50);
		atualiza();
	},

	_htmlCorrida() {
		return `
		<div class="pvpCorrida">
			<div class="pvpCronometro" data-pvp-cronometro>0.00s</div>
			<div class="pvpCorridaInfo">Chefe com a vida da média das duas builds × 25s — quem derruba primeiro vence.</div>
			<div class="pvpAlvo pvpAlvo--meu" data-pvp-alvo="meu">
				<div class="pvpAlvoTopo"><span>Você</span><b data-pvp-tempo>—</b></div>
				<div class="pvpBarra"><div class="pvpBarraFill" data-pvp-fill></div></div>
			</div>
			<div class="pvpAlvo pvpAlvo--fantasma" data-pvp-alvo="fantasma">
				<div class="pvpAlvoTopo"><span>Fantasma</span><b data-pvp-tempo>—</b></div>
				<div class="pvpBarra"><div class="pvpBarraFill" data-pvp-fill></div></div>
			</div>
			<div class="pvpResultado" data-pvp-resultado hidden></div>
		</div>`;
	},

	// vida restante na série interpolada no instante t
	_hpNaSerie(serie, t) {
		const fim = serie[serie.length - 1];
		if (t >= fim.t) return fim.hp;
		let i = 0;
		while (i < serie.length - 2 && serie[i + 1].t < t) i++;
		const a = serie[i];
		const b = serie[i + 1];
		const frac = b.t > a.t ? (t - a.t) / (b.t - a.t) : 1;
		return a.hp + (b.hp - a.hp) * frac;
	},

	_pintaCorrida(resultado, t) {
		const modal = document.getElementById("pvpDuelo");
		if (!modal) return;
		const cronometro = modal.querySelector("[data-pvp-cronometro]");
		if (cronometro) cronometro.textContent = t.toFixed(2) + "s";
		const pinta = (qual, serie, tempoMorto) => {
			const alvo = modal.querySelector(`[data-pvp-alvo="${qual}"]`);
			if (!alvo) return;
			const hp = this._hpNaSerie(serie, t);
			const fill = alvo.querySelector("[data-pvp-fill]");
			if (fill) fill.style.width = Math.max(0, hp / 25 * 100) + "%";
			alvo.classList.toggle("pvpAlvo--morto", t >= tempoMorto);
		};
		pinta("meu", resultado.serieMeu, resultado.tempoMeu);
		pinta("fantasma", resultado.serieFantasma, resultado.tempoFantasma);
	},

	// tempo do duelo na UI: acima de 1h a corrida é absurdamente
	// desigual — mostra "> 1h" em vez de um número absurdo
	_formataTempo(segundos) {
		if (!Number.isFinite(segundos) || segundos >= 3600) return "> 1h";
		return segundos.toFixed(2) + "s";
	},

	_mostraResultado(resultado) {
		const modal = document.getElementById("pvpDuelo");
		if (!modal) return;
		for (const [qual, tempo] of [
			["meu", resultado.tempoMeu],
			["fantasma", resultado.tempoFantasma]
		]) {
			const alvo = modal.querySelector(`[data-pvp-alvo="${qual}"] [data-pvp-tempo]`);
			if (alvo) alvo.textContent = this._formataTempo(tempo);
		}
		const cronometro = modal.querySelector("[data-pvp-cronometro]");
		if (cronometro) {
			cronometro.textContent = this._formataTempo(
				Math.max(resultado.tempoMeu, resultado.tempoFantasma));
		}
		const box = modal.querySelector("[data-pvp-resultado]");
		if (box) {
			box.hidden = false;
			box.classList.add(resultado.venceu
				? "pvpResultado--venceu"
				: "pvpResultado--perdeu");
			box.innerHTML = `
				<div class="pvpResultadoTitulo">${resultado.venceu ? "VOCÊ VENCEU!" : "O FANTASMA VENCEU"}</div>
				<div class="pvpResultadoLinha">Você: <b>${this._formataTempo(resultado.tempoMeu)}</b> ·
					Fantasma: <b>${this._formataTempo(resultado.tempoFantasma)}</b></div>
				<div class="pvpResultadoNota">Resultado idêntico na máquina do rival — mesmos cartões, mesma corrida.</div>`;
		}
		this._logResultado(resultado);
	},

	_logResultado(resultado) {
		MostraInfo(resultado.venceu
			? `Batalha-fantasma vencida em ${this._formataTempo(resultado.tempoMeu)} (fantasma: ${this._formataTempo(resultado.tempoFantasma)}).`
			: `Batalha-fantasma perdida: fantasma em ${this._formataTempo(resultado.tempoFantasma)} (você: ${this._formataTempo(resultado.tempoMeu)}).`);
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
			if (e.target.closest("[data-pvp-lutar]")) {
				this.IniciaDuelo();
				return;
			}
			if (e.target.closest("[data-pvp-exportar]")) {
				this.ExportaCartaoBatalha();
			}
		});
	}
};

PvpFantasma.RegistraListeners();
