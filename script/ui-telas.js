// ===================== TELAS LEGACY ====================================
// Telas de conquistas, missoes, marcos, tutorial e decomposicao de dano.
// Funcoes globais de UI movidas de ui.js sem alterar as chamadas.

function MostraConquista() {

    let conquista = "";

    conquista += `
		<div style="margin-bottom:1.2em;">

			<div style="color:#ffcc66;font-weight:bold;">
				Conquista Atual
			</div>

			<div>
				${totalDerrotados} inimigos derrotados de
				${progressoConquistaDano}
			</div>
	`;

    if (validaConquista == 1) {

        conquista += `
			<div>
				Recompensa: Bonus de dano
			</div>
		`;

    } else if (validaConquista == 2) {

        conquista += `
			<div>
				Recompensa: Bonus de gold
			</div>
		`;

    } else if (validaConquista == 3) {

        conquista += `
			<div>
				Recompensa: Bonus de dano crítico
			</div>
		`;
    }

    conquista += `
			<div>
				Progresso:
				${(totalDerrotados * 100 / progressoConquistaDano).toFixed(2)}%
			</div>

			<div>
				Bônus de dano: ${(Number(danoBonus) || 0) > 0 ? "+" + (Number(danoBonus)).toFixed(2) : "nenhum"}
			</div>

			<div>
				Bônus de crítico: ${(Number(bonusCritConquista) || 0) > 0 ? "+" + (Number(bonusCritConquista)).toFixed(2) : "nenhum"}
			</div>

		</div>
	`;

    conquista += `
		<div>

			<div style="color:#ffd84a;font-weight:bold;">
				Conquista de Gold
			</div>

			<div>
				${FormatGold(totalGold)} gold coletado de
				${progressoConquistaGold}
			</div>

			<div>
				Progresso:
				${(totalGold * 100 / progressoConquistaGold).toFixed(2)}%
			</div>

			<div>
				Bônus de gold: ${(Number(descontoLoja) || 0) > 0 ? "-" + (Number(descontoLoja) * 100).toFixed(1).replace(/\.0$/, "") + "% nos preços" : "nenhum"}
			</div>

		</div>
	`;

    const bonusNivel = Math.floor(Math.max(0, totalNiveis | 0) / 100);

    conquista += `
		<div style="margin-top:1.2em;">

			<div style="color:#8fe6a8;font-weight:bold;">
				Conquista de Nível
			</div>

			<div>
				${totalNiveis} níveis acumulados — a cada 100 níveis: -1 inimigo
			</div>

			<div>
				Progresso: ${totalNiveis % 100}% para o próximo -1
			</div>

			<div>
				Bônus atual: ${bonusNivel > 0 ? "-" + bonusNivel + " " + (bonusNivel === 1 ? "inimigo" : "inimigos") + " para avançar" : "nenhum"}
			</div>

		</div>
	`;

    conquista += `
		<div style="margin-top:1.2em;">

			<div style="color:#d9a7ff;font-weight:bold;">
				Conquistas Comportamentais
			</div>
	`;

    for (let i = 0; i < CONQUISTAS_COMP.length; i++) {
        const c = CONQUISTAS_COMP[i];
        const nivel = NivelConquistaComp(i);
        conquista += `
			<div style="margin-top:0.6em;${nivel > 0 ? "" : "opacity:0.75;"}">
				<div>
					${nivel > 0 ? "✔" : "○"} <b>${c.nome}</b> — ${c.recompensa} (nível ${nivel}/${c.max})
				</div>
				<div style="font-size:0.9em;">
					${c.desc}
				</div>
				<div style="font-size:0.9em;color:${nivel >= c.max ? "#ffd34f" : nivel > 0 ? "#8fe6a8" : "#cfcfcf"};">
					${nivel >= c.max ? "Nível máximo!" : "Progresso: " + ProgressoConquistaComp(i)}
				</div>
			</div>
		`;
    }

    conquista += `
		</div>
	`;

    UI.showModal("Conquistas", conquista);
}

function MostraMissao() {

    // toggle da modal
    const modalExistente = document.getElementById("ui-modal-overlay");

    if (modalExistente) {
        UI.closeModal();
        return;
    }

    if (andar < 10) {

        UI.showModal(
            "Missões",
            `
                <div class="modal-info">
                    Missões só serão liberadas a partir do andar 10
                </div>
            `
        );

        return;
    }

    let progressoAtual = 0;
    let progressoMax = 0;

    if (missaoAtual == 1) {

        progressoAtual = missaoColetaAtual;
        progressoMax = missaoColeta;

    } else if (missaoAtual == 2) {

        progressoAtual = missaoGolpeAtual;
        progressoMax = missaoGolpe;

    } else if (missaoAtual == 3) {

        progressoAtual = missaoCacaMugsAtual;
        progressoMax = missaoCacaMugs;

    } else if (missaoAtual == 4) {

        progressoAtual = missaoTempoAtual;
        progressoMax = missaoTempo;
    } else if (missaoAtual == 5) {

        progressoAtual = missaoDesafioAtual;
        progressoMax = missaoDesafioAlvo;
    }

    const porcentagem =
        ((progressoAtual * 100) / progressoMax).toFixed(2);

    const regraDesafio = missaoAtual == 5 ? [
        "",
        "Qualquer compra com gold falha o desafio.",
        "Ativar qualquer habilidade de combate falha o desafio.",
        `Faltam ${missaoDesafioTempo} segundos — o tempo zerado falha o desafio.`
    ][missaoDesafioSub] : "";

    UI.showModal(
        "Missões",
        `
            <div class="modal-section">

                <div class="modal-linha">
                    <span class="modal-label">Missão Atual:</span>
                    <span class="modal-value">
                        ${missao[missaoAtual]}
                    </span>
                </div>

                ${regraDesafio ? `<div class="modal-info">${regraDesafio}</div>` : ""}

                <div class="modal-linha">
                    <span class="modal-label">Progresso:</span>
                    <span class="modal-value">
                        ${progressoAtual} / ${progressoMax}
                    </span>
                </div>

                <div class="modal-barra">
                    <div 
                        class="modal-barra-fill"
                        style="width:${Math.min(porcentagem, 100)}%">
                    </div>
                </div>

                <div class="modal-porcentagem">
                    ${porcentagem}%
                </div>

            </div>
        `
    );
}

// Todos os marcos do jogo num lugar só: ouro por andar (por run), portões
// de reset, níveis do jogador (permanente) e desbloqueios por andar.
// As classes modal-* são estilizadas em estilos.css.
function MostraMarcos() {
    const linha = (rotulo, valor, classe) => `
        <div class="modal-linha">
            <span class="modal-label">${rotulo}</span>
            <span class="modal-value${classe ? " " + classe : ""}">${valor}</span>
        </div>`;

    const barra = (progresso) => {
        const largura = Math.max(0, Math.min(100, Number(progresso) || 0));
        return `
        <div class="modal-barra">
            <div class="modal-barra-fill" style="width:${largura}%"></div>
        </div>
        <div class="modal-porcentagem">${largura.toFixed(0)}%</div>`;
    };

    // --- Ouro desta run: +10% de gold a cada 10 andares (zeram no reset) ---
    const marcos = Math.max(0, Math.floor(marcoGoldRun / 10));
    const bonusComposto = (Math.pow(1.1, marcos) - 1) * 100;
    const proximoMarco = marcoGoldRun + 10;
    const faltamGold = Math.max(0, proximoMarco - andar);
    const progressoGold = (andar - marcoGoldRun) * 10;

    const casas = bonusComposto < 100 ? 1 : 0;
    const bonusTexto = marcos === 0
        ? "nenhum"
        : "+" + bonusComposto.toFixed(casas).replace(/\.0$/, "") + "%";

    // lista limitada: últimos marcos atingidos + os próximos
    const inicio = marcoGoldRun > 0 ? Math.max(10, marcoGoldRun - 20) : 10;
    const itens = [];
    if (inicio > 10) itens.push("…");
    for (let m = inicio; m <= marcoGoldRun + 30; m += 10) {
        if (m <= marcoGoldRun) itens.push(m + " ✓");
        else itens.push(m === proximoMarco ? m + " (próximo)" : String(m));
    }

    // --- Portões de reset ---
    const faltamPortao = Math.max(0, andarVolta - andar);
    const portaoEsmeralda = andarVolta % 10 === 5;
    const pagaDanoProximo = andarVolta >= Math.max(35, gateDanoPago + 5);
    const recompensaPortao = [
        portaoEsmeralda ? "esmeralda" : "",
        pagaDanoProximo ? "5% dano" : ""
    ].filter(Boolean).join(" + ") || "avanço";
    const pendentesDano = GatesDanoPendentes(andar);
    const danoPago = Math.max(0, Math.floor(Number(danoResetQtd) || 0));
    const perkGanhosRun = PontosPerkGanhos();
    const perkDisp = PontosPerkDisponiveis();

    // --- Níveis do jogador (permanente) ---
    const nivelAtual = Math.max(1, Math.floor(Number(nivelJogador) || 1));
    const marcosCM = Math.max(0, Math.floor(Number(marcosNivel50) || 0));
    const proximoNivelCM = (marcosCM + 1) * 50;
    const faltamNivelCM = Math.max(0, proximoNivelCM - nivelAtual);
    const progressoNivelCM = (nivelAtual - marcosCM * 50) * 2; // 50 níveis = 100%
    const niveisAcum = Math.max(0, Math.floor(Number(totalNiveis) || 0));
    const bonusNiveis = Math.floor(niveisAcum / 100);
    const proximoNiveis = (bonusNiveis + 1) * 100;
    const faltamNiveis = proximoNiveis - niveisAcum;

    // --- Desbloqueios por andar (andar máximo = permanente) ---
    // especializações 3/4/5 entram pelo `andar` da própria tabela
    const desbloqueios = [
        ...SKILLS_UPGRADE
            .filter(skill => skill.pisoDesbloqueio > 1)
            .map(skill => ({ nome: skill.nome, piso: skill.pisoDesbloqueio })),
        { nome: "Auto-coleta de baús", piso: ANDAR_AUTO_COLETA },
        { nome: "Auto-compra da loja", piso: ANDAR_AUTO_COMPRA },
        { nome: "Auto-gasto de pontos", piso: ANDAR_AUTO_GASTO },
        { nome: "Sobra de pontos vira CM", piso: ANDAR_SOBRA_CM },
        ...ESPECIALIZACOES
            .filter(esp => esp.andar > 0)
            .map(esp => ({ nome: esp.nome, piso: esp.andar }))
    ].sort((a, b) => a.piso - b.piso).map(desbloqueio => {
        const aberto = maxAndar >= desbloqueio.piso;
        return aberto
            ? linha(desbloqueio.nome, "✓ andar " + desbloqueio.piso, "modal-value--ok")
            : linha(desbloqueio.nome, "andar " + desbloqueio.piso + " — faltam " + (desbloqueio.piso - maxAndar), "modal-value--pend");
    }).join("");

    UI.showModal(
        "Marcos",
        `
            <div class="modal-section">
                <div class="modal-titulo">Ouro desta run · a cada 10 andares</div>

                ${linha("Andar atual", andar)}
                ${linha("Marcos atingidos", marcos + " (a cada 10 andares)")}
                ${linha("Bônus desta run", bonusTexto)}
                ${linha("Próximo marco", faltamGold > 0 ? `andar ${proximoMarco} — faltam ${faltamGold}` : `andar ${proximoMarco}`)}
                ${barra(progressoGold)}
                ${linha("Marcos", itens.join(" · "))}

                <div class="modal-info">
                    Cada marco dá +10% de gold multiplicativo nesta run e mostra um
                    aviso na tela. O bônus zera ao resetar.
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-titulo">Portões de reset</div>

                ${linha("Reset livre", andar >= 20 ? "disponível agora" : `libera no andar 20 — faltam ${20 - andar}`)}
                ${linha("Próximo portão", faltamPortao > 0 ? `andar ${andarVolta} — faltam ${faltamPortao}` : `andar ${andarVolta} — disponível`)}
                ${linha("Recompensa do portão", recompensaPortao)}
                ${linha("Dano pendente até aqui", pendentesDano > 0 ? `+${pendentesDano * 5}% se resetar agora` : "nenhum")}
                ${linha("Dano permanente pago", danoPago > 0 ? `${danoPago} portões (+${danoPago * 5}%)` : "nenhum")}
                ${linha("Perks desta run", `${perkDisp} ${perkDisp === 1 ? "disponível" : "disponíveis"} de ${perkGanhosRun}`)}

                <div class="modal-info">
                    Portões terminados em 5 (15, 25, 35, 45…) dão esmeralda; os
                    intermediários (40, 50…) só dano. Cada portão a partir do 35
                    paga +5% de dano permanente uma única vez. A partir do andar 20
                    a troca de andar também gera Conhecimento Mug.
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-titulo">Níveis do jogador · não zera no reset</div>

                ${linha("Nível atual", nivelAtual)}
                ${linha("Próximo marco de 50", `nível ${proximoNivelCM} — faltam ${faltamNivelCM}`)}
                ${barra(progressoNivelCM)}
                ${linha("Marcos de 50 atingidos", marcosCM)}
                ${linha("Multiplicador de CM no reset", "×" + FormataMultCM())}
                ${linha("Resets curtos (+5% cada)", resetsCurtosCM > 0 ? resetsCurtosCM + " → ×" + FormataMultCM() : "nenhum")}
                ${linha("Níveis acumulados", niveisAcum)}
                ${linha("Próximo marco de 100", `${proximoNiveis} — faltam ${faltamNiveis}`)}
                ${barra(niveisAcum % 100)}
                ${linha("Bônus de 100 níveis", bonusNiveis > 0 ? `−${bonusNiveis} inimigo${bonusNiveis === 1 ? "" : "s"} para avançar` : "nenhum")}

                <div class="modal-info">
                    A cada 50 níveis o multiplicador de CM no reset ganha +1 — o
                    mesmo marco não paga de novo depois do reset. A cada 100 níveis
                    acumulados entre resets, 1 inimigo a menos é exigido para avançar.
                    Resetar perto do recorde — até 10 andares antes dele
                    (ex.: reset no 88 com recorde 97) dá +5% permanente
                    nesse multiplicador, e a cada reset curto novo o
                    bônus acumula (multiplicativo). Resetar longe (ex.: no
                    20 com recorde 97) não conta.
                </div>
            </div>

            <div class="modal-section">
                <div class="modal-titulo">Desbloqueios por andar · valem para sempre</div>

                ${desbloqueios}

                <div class="modal-info">
                    O desbloqueio usa o andar máximo já atingido (${maxAndar}) e não
                    é perdido no reset. Andar 40 libera a auto-coleta dos baús e
                    andar 50 a auto-compra da loja (toggles no rastreador do baú
                    dourado e no cabeçalho da loja); andar 55 o auto-gasto de
                    pontos (toggle no painel de skills) e andar 65 a sobra de
                    pontos na mão virar +1% de Conhecimento Mug no reset. As
                    especializações de build
                    abrem pelo mesmo critério: ${ESPECIALIZACOES.filter(esp => esp.andar > 0).map(esp => esp.nome + " (andar " + esp.andar + ")").join(", ")}.
                </div>
            </div>
        `
    );
}

// Tutorial do 1º reset: força a compra do Companheiro de Dano (se ainda não tiver)
function TutorialComp1Pendente() {
    return andarVolta > 15 && N(lvlComp1) === 0;
}

function MostraTutorialComp1() {
    if (!TutorialComp1Pendente()) return;

    const titulo = "Compre o Companheiro de Dano";
    const preco = Math.max(1, N(precoComp1));

    const conteudo = `
            <div class="modal-tutorial-texto">
                O <b>Companheiro de Dano</b> ataca junto com voce em toda batalha
                e é essencial para avançar de andar. Voce ganha esmeraldas a cada
                reset — use-as agora!
            </div>

            <div class="modal-tutorial-info">
                <span>Esmeraldas: <b>${N(esmeraldas)}</b></span>
                <span>Preço: <b>${preco} esmeralda${preco === 1 ? "" : "s"}</b></span>
            </div>

            <button type="button" class="btn-Padrao btn-tutorial-comp1" onclick="CompraTutorialComp1()">
                Comprar Companheiro de Dano (${preco} esmeralda${preco === 1 ? "" : "s"})
            </button>

            <div class="modal-tutorial-dica">
                ESC ou X fecha a janela — ela reabre ao abrir a loja até voce comprar.
            </div>
        `;

    const atual = document.getElementById("gameModal");
    if (atual && atual.style.display === "flex") {
        // já é o nosso modal aberto: atualiza só o conteúdo (valores podem ter mudado);
        // outro modal visível: não interrompe (a condição continua pendente)
        if (document.getElementById("gameModalTitle")?.innerHTML === titulo) {
            document.getElementById("gameModalBody").innerHTML = conteudo;
        }
        return;
    }

    UI.showModal(titulo, conteudo);
}

// Decomposição do dano: de onde sai cada ponto de dano do golpe
function MostraDecomposicaoDano() {
    const multFormigas = MultiplicadorDanoFormigas();
    const multNivel = MultiplicadorDanoNivel();
    const multTotal = multFormigas * multNivel;
    const conjuntos = ConjuntosFormigas("vermelhas");
    const danoEfetivo = N(danoJogador) * multTotal;
    const critEfetivo = N(danoCritJogador) * multTotal;

    const linha = (rotulo, valor) => `
        <div class="decomp-linha">
            <span>${rotulo}</span>
            <span class="decomp-valor">${valor}</span>
        </div>`;

    let html = `
        <div class="decomp-grupo">Por golpe</div>
        ${linha("Dano base da loja (nível " + (N(lvlDano) | 0) + ")", N(danoJogador).toFixed(2))}
        ${linha("× Bônus de nível (nível " + (N(nivelJogador) | 0) + ")", "×" + multNivel.toFixed(2))}
        ${linha("× Formigas vermelhas (" + conjuntos + " conjunto" + (conjuntos === 1 ? "" : "s") + ")", "×" + multFormigas.toFixed(2))}
        <div class="decomp-linha decomp-linha--total">
            <span>= Dano efetivo por golpe</span>
            <span class="decomp-valor">${danoEfetivo.toFixed(2)}</span>
        </div>

        <div class="decomp-grupo">Crítico</div>
        ${linha("Dano crítico efetivo", critEfetivo.toFixed(2))}
        ${linha("Chance crítica", (N(chanceCrit) * 100).toFixed(2) + "%")}
        ${linha("Multiplicador crítico máximo", "×" + N(multiplicadorMaximoDanoCritico).toFixed(1))}
        ${N(bonusCritConquista) > 0 ? linha("Bônus crítico das conquistas", "+" + N(bonusCritConquista).toFixed(2)) : ""}

        <div class="decomp-grupo">Companheiro de dano</div>
    `;

    if (N(lvlComp1) > 0) {
        html += linha("Dano do companheiro (nível " + (N(lvlComp1) | 0) + ")", (N(danoComp) * multTotal).toFixed(2));
        html += linha("= " + (N(danoComp1) * 100).toFixed(0) + "% do seu dano", "×" + N(danoComp1).toFixed(2));
    } else {
        html += `<div class="decomp-nota">Ainda sem companheiro — compre na loja de esmeraldas após o 1º reset.</div>`;
    }

    if (N(danoBonus) > 0 && isFinite(N(danoBonus))) {
        html += `
        <div class="decomp-grupo">Bônus permanente</div>
        ${linha("Bônus das conquistas (reaplicado no reset)", "×" + N(danoBonus).toFixed(2))}
        `;
    }

    if (N(danoResetQtd) > 0) {
        html += `
        <div class="decomp-grupo">Bônus de reset (reaplicado a cada reset)</div>
        ${linha("Portões pagos: " + N(danoResetQtd) + " (+" + (N(danoResetQtd) * 5) + "%)", "×" + Math.pow(1.05, N(danoResetQtd)).toFixed(2))}
        `;
    }

    UI.showModal("Decomposição do dano", html);
}

function MostraInfos() {
    UI.toggleInfoModal();
}
