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
// - Itens da build: só os com forja >= 5 entram no duelo
//   (FORJA_MINIMO_PVP) — tanto nos multiplicadores Pvp quanto no resumo
//   do cartão. A tela de builds marca esses itens com borda prateada
//   azulada pra ficar visível o que vale.
// - Determinismo: RNG mulberry32 com seed combinada (XOR, comutativo) e
//   lados canônicos ordenados por (seed, exportedAt) — as DUAS máquinas
//   calculam o mesmo resultado, independente de quem importou quem.
// - Id de integridade: cada cartão carrega id = sha256(segredo + campos
//   estáveis). Editou o cartão num editor, a assinatura não confere e o
//   import é recusado. exportedAt e seed ficam FORA do id de propósito:
//   exportar de novo o mesmo progresso gera o MESMO id (sem isso, o
//   farm de re-exportar em loop continuaria possível).
// - Anti-farm: um cartão só conclui UM duelo — o id entra em
//   pvpCartoesUsados (campo de save PERMANENTE) quando o duelo acaba e
//   importar de novo é recusado. Vitória paga +2 esmeraldas, sempre na
//   mesma conclusão que queima o id: não existe caminho pra pagar 2x o
//   mesmo cartão.

// ids dos cartões de batalha já duelados nesta máquina (anti-farm do
// PvP). PERMANENTE: não zera no Resetar — protege as esmeraldas, que
// também atravessam o reset. Contrato de save: CriarObjetoSave,
// Carregar e ValidarSave (validação própria + whitelist por ser array).
var pvpCartoesUsados = [];

var PvpFantasma = {
	// taxa nominal de golpes por segundo do duelo — os dois lados usam a
	// mesma, então a corrida compara builds, não a velocidade do dedo
	TAXA_ATAQUE_JOGADOR: 3,

	// segredo do id de integridade dos cartões. Valor embutido no código
	// (dá pra achar lendo o JS) — serve pra derrubar edição casual no
	// bloco de notas; anti-cheat sério do lado do cliente não existe.
	_segredo: "t4peira-pvp-k4rdumm-2026",

	// SHA-256 puro e síncrono. Sem WebCrypto de propósito: crypto.subtle
	// exige contexto seguro e não existe em file:// nem no Electron
	// abrindo arquivo local — e o fluxo do cartão é todo síncrono.
	_sha256(texto) {
		const K = [
			0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
			0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
			0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
			0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
			0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
			0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
			0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
			0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
		];
		const bytes = new TextEncoder().encode(texto);
		const bits = bytes.length * 8;
		const blocos = Math.ceil((bytes.length + 9) / 64);
		const buffer = new Uint8Array(blocos * 64);
		buffer.set(bytes);
		buffer[bytes.length] = 0x80;
		const vista = new DataView(buffer.buffer);
		vista.setUint32(blocos * 64 - 8, Math.floor(bits / 0x100000000), false);
		vista.setUint32(blocos * 64 - 4, bits >>> 0, false);
		const h = new Uint32Array([
			0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
			0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
		]);
		const w = new Uint32Array(64);
		const rotr = (x, n) => (x >>> n) | (x << (32 - n));
		for (let bloco = 0; bloco < blocos; bloco++) {
			const off = bloco * 64;
			for (let t = 0; t < 16; t++) w[t] = vista.getUint32(off + t * 4, false);
			for (let t = 16; t < 64; t++) {
				const s0 = rotr(w[t - 15], 7) ^ rotr(w[t - 15], 18) ^ (w[t - 15] >>> 3);
				const s1 = rotr(w[t - 2], 17) ^ rotr(w[t - 2], 19) ^ (w[t - 2] >>> 10);
				w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
			}
			let a = h[0], b = h[1], c = h[2], d = h[3];
			let e = h[4], f = h[5], g = h[6], hh = h[7];
			for (let t = 0; t < 64; t++) {
				const s1r = rotr(e, 6) ^ rotr(e, 11) ^ rotr(e, 25);
				const ch = (e & f) ^ (~e & g);
				const t1 = (hh + s1r + ch + K[t] + w[t]) >>> 0;
				const s0r = rotr(a, 2) ^ rotr(a, 13) ^ rotr(a, 22);
				const maj = (a & b) ^ (a & c) ^ (b & c);
				const t2 = (s0r + maj) >>> 0;
				hh = g; g = f; f = e;
				e = (d + t1) >>> 0;
				d = c; c = b; b = a;
				a = (t1 + t2) >>> 0;
			}
			h[0] = (h[0] + a) >>> 0; h[1] = (h[1] + b) >>> 0;
			h[2] = (h[2] + c) >>> 0; h[3] = (h[3] + d) >>> 0;
			h[4] = (h[4] + e) >>> 0; h[5] = (h[5] + f) >>> 0;
			h[6] = (h[6] + g) >>> 0; h[7] = (h[7] + hh) >>> 0;
		}
		let hex = "";
		for (let i = 0; i < 8; i++) hex += h[i].toString(16).padStart(8, "0");
		return hex;
	},

	// id do cartão = sha256(segredo + conteúdo ESTÁVEL) truncado em 128
	// bits. exportedAt e seed ficam de fora: mudam a cada exportação e,
	// sem eles, exportar duas vezes o mesmo progresso dá o MESMO id.
	_assinatura(cartao) {
		const campos = [
			cartao.saveFormat, cartao.saveVersion, cartao.nome, cartao.nivel,
			cartao.danoGolpe, cartao.danoCrit, cartao.chanceCrit,
			cartao.dpsCompanheiro, cartao.especializacao,
			cartao.itensBuildResumo, cartao.taxaAtaque
		];
		const canonico = campos.map(c => JSON.stringify(c === undefined ? null : c)).join("\u0001");
		return this._sha256(this._segredo + "\u0000" + canonico).slice(0, 32);
	},

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
		// Regra do duelo: só item de build com forja >= FORJA_MINIMO_PVP
		// conta nos bônus (a borda prateada na tela de builds marca quais)
		const multDanoTotal = MultiplicadorDanoFormigas() * MultiplicadorDanoNivel() * Tapeira.ItensBuild.multDanoPvp();
		const multEspNormal = MultiplicadorDanoEspecializacao(false);
		const multEspCritico = MultiplicadorDanoEspecializacao(true);
		const cartao = {
			saveFormat: "tapeira-cartao-batalha",
			saveVersion: 1,
			exportedAt: new Date().toISOString(),
			nome: "Tapeira",
			nivel: Math.max(1, N(nivelJogador) | 0),
			// golpes nominais (sem crítico e sem situações pontuais — guardião,
			// pausa de fuga, buff de alquimista, cadeia de ataques)
			danoGolpe: Math.max(0, N(danoJogador) * multDanoTotal * multEspNormal),
			danoCrit: Math.max(0, N(danoCritJogador) * Tapeira.ItensBuild.multDanoCritPvp() * multDanoTotal * multEspCritico),
			chanceCrit: Math.min(1, Math.max(0, N(chanceCrit) * Tapeira.ItensBuild.multChanceCritPvp())),
			// DPS do companheiro de dano: a Velocidade multiplica os hits/s
			dpsCompanheiro: N(danoComp) > 0
				? Math.max(0, N(danoComp) * Tapeira.ItensBuild.multDanoCompPvp() * multDanoTotal * multEspNormal * N(velAtaqueComp))
				: 0,
			especializacao: especializacao > 0 ? ESPECIALIZACOES[especializacao].nome : null,
			itensBuildResumo: Tapeira.ItensBuild.resumo(Tapeira.ItensBuild.FORJA_MINIMO_PVP),
			taxaAtaque: this.TAXA_ATAQUE_JOGADOR,
			seed: Math.floor(Math.random() * 2147483647)
		};
		// id de integridade: deriva do segredo + o conteúdo do cartão —
		// editar qualquer campo estável invalida o arquivo no import
		cartao.id = this._assinatura(cartao);
		return cartao;
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
		if (typeof cartao.id !== "string" || !/^[0-9a-f]{32}$/.test(cartao.id)) {
			throw new TypeError("O cartão de batalha não tem o id de integridade — exporte de novo na versão atual.");
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
		// por último: o id precisa bater com o conteúdo — editou um campo
		// estável no editor, a assinatura não confere mais e o cartão cai
		if (this._assinatura(cartao) !== cartao.id) {
			throw new TypeError("A assinatura do cartão de batalha não confere — o arquivo foi editado.");
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
			// anti-farm: um cartão só conclui um duelo nesta máquina
			if (pvpCartoesUsados.includes(cartao.id)) {
				throw new TypeError("esse cartão de batalha já foi usado — cada cartão vale um duelo só.");
			}
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
			<div class="pvpDueloSub">Ficha dos duelistas — quem derruba o chefe primeiro vence e leva +2 esmeraldas.</div>
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
			["Itens 5+ (PvP)", this._esc(cartao.itensBuildResumo || "—")]
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
		// id do fantasma, guardado pro fechamento do duelo: fechar no
		// meio da animação não queima o cartão (o duelo não concluiu)
		const idFantasma = this._dueloAtual && this._dueloAtual.cartaoFantasma
			? this._dueloAtual.cartaoFantasma.id : null;

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
				// conclusão: queima o id do cartão e paga o prêmio —
				// acontece com ou sem modal na tela
				this._conclui(idFantasma, resultado);
				if (el) this._mostraResultado(resultado);
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

	// o duelo CONCLUIU (vitória ou derrota): queima o id — um cartão
	// vale um duelo só — e paga o prêmio da vitória. Marcação e prêmio
	// no MESMO ponto: não existe caminho pra pagar 2x o mesmo cartão.
	_conclui(idCartao, resultado) {
		if (idCartao && !pvpCartoesUsados.includes(idCartao)) {
			pvpCartoesUsados.push(idCartao);
			// teto defensivo: o save não cresce sem fim (2000 ids ~ 80 KB)
			if (pvpCartoesUsados.length > 2000) pvpCartoesUsados.shift();
			AutoSalvar();
		}
		let premio = "";
		if (resultado.venceu) {
			esmeraldas += 2;
			const contador = document.getElementById("contEmeraldas");
			if (contador) contador.innerHTML = esmeraldas;
			UI.showCurrencyReward("emerald", 2);
			premio = " Prêmio: +2 esmeraldas.";
		}
		this._logResultado(resultado, premio);
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
				${resultado.venceu ? '<div class="pvpResultadoPremio">+2 esmeraldas</div>' : ""}
				<div class="pvpResultadoLinha">Você: <b>${this._formataTempo(resultado.tempoMeu)}</b> ·
					Fantasma: <b>${this._formataTempo(resultado.tempoFantasma)}</b></div>
				<div class="pvpResultadoNota">Resultado idêntico na máquina do rival — mesmos cartões, mesma corrida.</div>`;
		}
		// o log sai da _conclui (roda com ou sem modal na tela)
	},

	_logResultado(resultado, premio) {
		MostraInfo(resultado.venceu
			? `Batalha-fantasma vencida em ${this._formataTempo(resultado.tempoMeu)} (fantasma: ${this._formataTempo(resultado.tempoFantasma)}).${premio || ""}`
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
