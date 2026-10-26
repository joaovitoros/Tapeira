// ===================== AVANÇO / FUGA DOS INIMIGOS ====================
// O cronômetro de fuga do andar: consome 1s por tick e, ao zerar, recua um
// andar (com a animação de fuga) — ou volta ao máximo pelo perk da Pausa da
// fuga. Extraído de script.js byte a byte (ver REFATORACAO.md). Chamado pelo
// tick de 1s em sistema.js (ExecutaTick("avanço", ...)).
// ====================================================================
// Escreve o relógio de fuga e liga/desliga a urgência (últimos 5s em cor de
// alarme). Único ponto que toca #contTempo — render e updateResources também
// passam por aqui, então o estado da classe nunca fica velho.
function EscreveTempoFuga() {
	const el = document.getElementById("contTempo");
	if (!el) return;
	el.innerHTML = FormataTempoFuga(tempoAvancoInimigos);
	document.getElementById("container-Fugir")
		?.classList.toggle("fuga-urgente", tempoAvancoInimigos <= 5 && tempoAvancoInimigos > 0);
}

function AvancoInimigos() {
	if (jogoPausado || fugaEmAndamento) return;
	if (AtualizaRelogioHabilidade()) return;
	// Fissura temporal: congela só o cronômetro de fuga (a pausa da skill de
	// escape acima continua sendo consumida e os demais ticks seguem)
	if (typeof eventoAtivo !== "undefined" && eventoAtivo === "fissura") return;

    tempoAvancoInimigos--;
    EscreveTempoFuga();

	// Lógica de avanço dos inimigos
/*
    for (let i = 1; i <= numInimigosTela; i++) {

        const el = document.getElementById("inimigo" + i);
        if (!el) continue;

        if (i === 1 || i === 2) {
            el.style.left = (380 - tempoAvancoInimigos * 3) + "px";
        } else {
            el.style.left = (820 + tempoAvancoInimigos * 3) + "px";
        }
    }
*/
    if (tempoAvancoInimigos <= 0) {
        if (andar > 1) {
			// perk da Pausa da fuga: chance de não fugir — o tempo do andar volta ao máximo
			const chancePerkFuga = Math.min(50, perkFuga * 10);
			if (chancePerkFuga > 0 && Math.random() * 100 < chancePerkFuga) {
				tempoAvancoInimigos = TempoFugaMax();
				EscreveTempoFuga();
				UI.showInfo("O tempo para fugir deste andar voltou ao máximo! (chance de perk: " + chancePerkFuga + "%)");
				return;
			}
			fugaEmAndamento = true;
			UI.showInfo("Inimigos te alcançaram, fugindo...");
			UI.playEscapeAnimation().then(() => {
				RemoverInimigos();
				andar--;
				inimigosDerrotados = 0;
				qtdInimigosAndar--;
				tempoAvancoInimigos = TempoFugaMax();
				UI.render();
				CarregarStatus();
				UI.spawnEnemies();
				UI.showInfo("Dica: compre Avanço rápido para facilitar os andares");
				fugaEmAndamento = false;
			});
			return;
        }

        tempoAvancoInimigos = TempoFugaMax();
        EscreveTempoFuga(); // volta do alarme ao normal (andar 1 não foge)
    }
}
