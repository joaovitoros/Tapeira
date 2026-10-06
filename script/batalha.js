function Bater(inimigo, validaDano) {
	if (jogoPausado) return;

	const inimigoElement = document.getElementById("inimigo" + inimigo);
	// gatilho da animação de ataque removido (imagens em imagens/ataque/frames mantidas)

	var dano;
	var danoCritico;
	var goldAux;
	var av;

	if (validaDano) {
		dano = danoJogador;
		danoCritico = danoCritJogador;
	} else {
		dano = danoComp;
		danoCritico = danoCritJogador * danoComp1;
	}

	if (missaoAtual == 2) {
		MissaoGolpes();
	}

	const critico = DanoCritico(danoCritico);
	if (critico) {
		dano = danoCritico;
		ChamaSom('audio8');
	} else {
		ChamaSom('audio3');
	}

	let vidaAtual = window["vidaInimigo" + inimigo];
	const vidaAnterior = vidaAtual;

	if (vidaAtual > 0) {
		vidaAtual -= dano;
		window["vidaInimigo" + inimigo] = vidaAtual;
	}

	if (vidaAnterior > 0 && inimigoElement) {
		UI.showDamageNumber(inimigoElement, dano, critico);
	}

	if (vidaAtual > 0 && inimigoElement) {
		animarImpacto(inimigoElement, critico);
	}

	// inimigo morreu
	if (vidaAtual <= 0) {

		if (inimigoElement) {
			animarMorte(inimigoElement);
			inimigoElement.style.visibility = "hidden";
		}
			

		ChamaSom('audio2');

		av = Avancar();

		inimigosDerrotados += av;
		totalDerrotados += av;
		numInimigosTela--;
		if (inimigosDerrotados >= qtdInimigosAndar) {
			UI.showObjectiveComplete();
		} else {
			UI.updateObjective();
		}

		let recompensaGold = ((andar * mulGold) * av)+1;

		AddGold(recompensaGold);
		AddTotalGold(recompensaGold);
		UI.showCurrencyReward("gold", recompensaGold);

		if (missaoAtual == 3) {
			MissaoCaca();
		}

		if (missaoAtual == 1) {
			goldAux = (andar * mulGold);
			MissaoColetaGold(goldAux);
		}

		qtdCarregaHabilidade++;
		VerificaHabilidade();
	}

	DesceVida(inimigo);

	// UI separada (agora ideal mover pra ui.js depois)
	if (typeof MostraStatus === "function") MostraStatus();
	if (typeof Conquistas === "function") Conquistas();

	const elTotalAbatidos = document.getElementById("contDerrotados");
	if (elTotalAbatidos) elTotalAbatidos.innerHTML = totalDerrotados;
	UI.updateObjective();

	// nova wave
	if (numInimigosTela == 0) {
		RemoverInimigos();
		CarregarStatus();
		CriarInimigos();
	}

	// subir andar
	if (inimigosDerrotados >= qtdInimigosAndar) {

		if (document.getElementById("manterAndar")?.checked && andar > 4) {
			inimigosDerrotados = 0;
		} else {

			andar++;

			if (andar > maxAndar) maxAndar = andar;

			RemoverInimigos();
			RemoveBau();

			let bonusAndar =
				((andar * mulGold) + (vidaAndar * mulGold) * mulGoldAvanco);

			AddGold(bonusAndar);
			AddTotalGold(bonusAndar);
			UI.showCurrencyReward("gold", bonusAndar);

			const elAndar = document.getElementById("contAndar");
			const elTitulo = document.getElementById("titulo");

			if (elAndar) elAndar.innerHTML = andar;
			if (elTitulo) elTitulo.innerHTML = "Caverna (Andar: " + andar + ")";

			qtdInimigosAndar++;

			inimigosDerrotados = 0;

			AutoSalvar();

			Conquistas();
			CriaBau();

			if (missaoAtual == 1) {
				MissaoColetaGold(bonusAndar * 2);
			}

			MostraStatus?.();

			CarregarStatus();
			CriarInimigos();
		}

		// O cronometro continua ativo no proximo andar. Cancela-lo aqui fazia
		// o contador reiniciar em 120 e permanecer parado.
		tempoAvancoInimigos = 120;
		UI.render();
	}
}

function DanoAutomatico(indentificador, habilidade) {
	if (jogoPausado) return;

	// false = dano companheiro
	// true = habilidade

	if (!indentificador) {
		ValidaBater = 0;
	}

	if (ValidaBater == 0) {

		ValidaBater = MaxValidaBater;

		if (habilidade) {
			indentificador = true;
		}

		if (andar < 5) {

			if (vidaInimigo1 > 0) {
				Bater(1, indentificador);
			} else {
				CarregarStatus();
				CriarInimigos();
			}

		} else if (andar >= 5 && andar <= 14) {

			if (vidaInimigo2 > 0) {
				Bater(2, indentificador);
			} else {
				Bater(1, indentificador);
			}

		} else if (andar >= 15 && andar <= 29) {

			if (vidaInimigo3 > 0) {
				Bater(3, indentificador);
			} else if (vidaInimigo2 > 0) {
				Bater(2, indentificador);
			} else {
				Bater(1, indentificador);
			}

		} else if (andar >= 30) {

			if (vidaInimigo4 > 0) {
				Bater(4, indentificador);
			} else if (vidaInimigo3 > 0) {
				Bater(3, indentificador);
			} else if (vidaInimigo2 > 0) {
				Bater(2, indentificador);
			} else {
				Bater(1, indentificador);
			}
		}

	} else {
		ValidaBater--;
	}
}

function Avancar() {

	valida = Math.random();

	if (valida <= avanco) {
		MostraInfo("Avanço de " + qtdAvanco + " no andar: " + andar);
		return qtdAvanco;
	} else {
		return 1;
	}
}

function animarImpacto(el, critico) {
	const rect = el.getBoundingClientRect();
	const recuo = rect.left + rect.width / 2 < window.innerWidth / 2 ? -12 : 12;
	const facing = getComputedStyle(el).getPropertyValue("--facing").trim() || "1";

	el.animate([
		{ transform: `translateX(0) scaleX(${facing}) scaleY(1) rotate(0)` },
		{ transform: `translateX(${recuo}px) scaleX(${facing}) scaleY(0.82) rotate(${recuo / 4}deg)`, offset: 0.35 },
		{ transform: `translateX(0) scaleX(${facing}) scaleY(1) rotate(0)` }
	], {
		duration: 260,
		easing: "ease-out"
	});

	const olhos = document.createElement("div");
	olhos.className = "enemy-hit-eyes";
	olhos.setAttribute("aria-hidden", "true");
	olhos.style.left = rect.left + "px";
	olhos.style.top = rect.top + "px";
	olhos.style.width = rect.width + "px";
	olhos.style.height = rect.height + "px";
	olhos.style.transform = `scaleX(${facing})`;
	olhos.innerHTML = "<span></span><span></span>";
	document.body.appendChild(olhos);
	olhos.addEventListener("animationend", () => olhos.remove(), { once: true });

	const impacto = document.createElement("div");
	impacto.className = critico
		? "enemy-hit-smoke enemy-hit-smoke--critical"
		: "enemy-hit-smoke";
	impacto.setAttribute("aria-hidden", "true");
	impacto.style.left = rect.left + rect.width / 2 + "px";
	impacto.style.top = rect.top + rect.height * 0.62 + "px";
	document.body.appendChild(impacto);
	impacto.addEventListener("animationend", () => impacto.remove(), { once: true });
}

function DanoCritico(critico) {

	valida = Math.random();

	if (valida <= chanceCrit) {
		MostraInfo("Dano critico de: " + critico);
		return true;
	} else {
		return false;
	}
}

function DesceVida(inimigo) {

	var vida;

	if (inimigo == 1) {
		vida = vidaInimigo1;
	} else if (inimigo == 2) {
		vida = vidaInimigo2;
	} else if (inimigo == 3) {
		vida = vidaInimigo3;
	} else {
		vida = vidaInimigo4;
	}

	UI.updateEnemyHealth(inimigo, vida, vidaAndar);
}

function animarMorte(el) {

    const rect = el.getBoundingClientRect();

    // cria animação
    const morte = document.createElement("img");

    morte.className = "morteAnim";

    // PRIMEIRO FRAME
    morte.src = "imagens/morte/frame12.png";

    // posição
    morte.style.position = "absolute";
    morte.style.left = rect.left + "px";
    morte.style.top = rect.top + "px";

    // tamanho igual ao inimigo
    morte.style.width = rect.width + "px";
    morte.style.height = rect.height + "px";

    // flip igual ao inimigo
    morte.style.transform = el.style.transform;

    document.body.appendChild(morte);

    // esconde inimigo original
    el.style.visibility = "hidden";

    const frames = [
        "imagens/morte/frame12.png",
        "imagens/morte/frame11.png",
        "imagens/morte/frame10.png",
        "imagens/morte/frame9.png",
        "imagens/morte/frame8.png",
        "imagens/morte/frame7.png",
        "imagens/morte/frame6.png",
        "imagens/morte/frame5.png",
        "imagens/morte/frame4.png",
        "imagens/morte/frame3.png",
        "imagens/morte/frame2.png",
        "imagens/morte/frame1.png"
    ];

    let frame = 0;

    const animacao = setInterval(() => {

        frame++;

        if (frame >= frames.length) {

            clearInterval(animacao);

            morte.remove();

            return;
        }

        morte.src = frames[frame];

    }, 80);
}
