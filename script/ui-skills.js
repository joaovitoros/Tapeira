// ===================== PAINEL DE HABILIDADES =================================
// Painel de melhorias (nos, perks, ramos) e secoes recolhaveis.
// Metodos movidos de ui.js; continuam em UI via Object.assign, entao
// this segue sendo UI e nenhuma chamada existente muda.

Object.assign(UI, {
    skillPanelAberta(chave, padrao) {
        if (!(chave in this.skillPanelSecoes)) this.skillPanelSecoes[chave] = !!padrao;
        return this.skillPanelSecoes[chave];
    },

    alternaSecaoSkill(chave, abrir) {
        this.skillPanelSecoes[chave] = abrir;
        this.showSkillUpgradePanel();
    },

    // seção com cabeçalho-botão (aria-expanded/aria-controls) e resumo do
    // conteúdo recolhido — usado em Progresso, Perks e Árvore de ramos
    criaSecaoRecuavelSkill({ chave, titulo, resumo, aberta, destaque, resumoId }) {
        const id = `skill-secao-${chave.replace(/[^a-zA-Z0-9]+/g, "-")}`;
        const secao = document.createElement("section");
        secao.className = "skill-secao";
        if (destaque) secao.classList.add("skill-secao--destaque");

        const cabecalho = document.createElement("button");
        cabecalho.type = "button";
        cabecalho.className = "skill-secao-cabecalho";
        cabecalho.setAttribute("aria-expanded", String(aberta));
        cabecalho.setAttribute("aria-controls", `${id}-corpo`);
        cabecalho.setAttribute("data-focus-key", `secao:${chave}`);
        const rotulo = document.createElement("span");
        rotulo.className = "skill-secao-titulo";
        rotulo.textContent = titulo;
        const detalhe = document.createElement("span");
        detalhe.className = "skill-secao-resumo";
        detalhe.textContent = resumo;
        if (resumoId) detalhe.id = resumoId;
        const seta = document.createElement("span");
        seta.className = "skill-secao-seta";
        seta.setAttribute("aria-hidden", "true");
        seta.textContent = "▾";
        cabecalho.append(rotulo, detalhe, seta);

        const corpo = document.createElement("div");
        corpo.className = "skill-secao-corpo";
        corpo.id = `${id}-corpo`;
        corpo.hidden = !aberta;
        cabecalho.addEventListener("click", () => this.alternaSecaoSkill(chave, corpo.hidden));
        secao.append(cabecalho, corpo);
        return { secao, corpo };
    },

    showSkillUpgradePanel() {
        // re-renderizações (level-up, compra, perk, ramo, recolher seção) não
        // podem jogar a rolagem pro topo nem tirar o foco do controle ativo:
        // guarda os dois e restaura no painel recém-construído
        const rolagemAnterior =
            document.querySelector("#skillUpgradeModal .skill-upgrade-scroll")?.scrollTop || 0;
        const focoAnterior = document.activeElement instanceof HTMLElement
            ? document.activeElement.dataset.focusKey
            : null;
        document.getElementById("skillUpgradeModal")?.remove();

        const overlay = document.createElement("div");
        overlay.id = "skillUpgradeModal";
        overlay.className = "ant-collection-overlay skill-upgrade-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "skill-upgrade-title");

        // cabeçalho fixo: título e fechar continuam acessíveis mesmo com o
        // conteúdo rolando (o painel inteiro não rola, só .skill-upgrade-scroll)
        const panel = document.createElement("section");
        panel.className = "ant-collection-panel skill-upgrade-panel";
        const header = document.createElement("header");
        header.className = "ant-collection-header";
        const title = document.createElement("h2");
        title.id = "skill-upgrade-title";
        title.textContent = "Árvore de habilidades";
        const close = document.createElement("button");
        close.type = "button";
        close.className = "ant-collection-close";
        close.setAttribute("aria-label", "Fechar habilidades");
        close.setAttribute("data-focus-key", "fechar");
        close.textContent = "×";
        const fechar = () => {
            overlay.remove();
            this.syncScreenButtons();
            document.getElementById("btnSkills")?.focus();
        };
        close.addEventListener("click", fechar);
        header.append(title, close);

        // atalhos no topo do painel para abrir as telas de conquistas, missões e marcos
        const atalhos = document.createElement("div");
        atalhos.className = "skill-upgrade-shortcuts";
        const abreTela = (mostrar) => {
            fechar();
            document.getElementById("gameModal")?.remove();
            mostrar();
        };
        const botaoConquistas = document.createElement("button");
        botaoConquistas.type = "button";
        botaoConquistas.className = "skill-upgrade-shortcut";
        botaoConquistas.textContent = "Conquistas";
        botaoConquistas.setAttribute("aria-label", "Abrir tela de conquistas");
        botaoConquistas.setAttribute("data-focus-key", "atalho:conquistas");
        botaoConquistas.addEventListener("click", () => abreTela(MostraConquista));
        const botaoMissoes = document.createElement("button");
        botaoMissoes.type = "button";
        botaoMissoes.className = "skill-upgrade-shortcut";
        botaoMissoes.textContent = "Missões";
        botaoMissoes.setAttribute("aria-label", "Abrir tela de missões");
        botaoMissoes.setAttribute("data-focus-key", "atalho:missoes");
        botaoMissoes.addEventListener("click", () => abreTela(MostraMissao));
        const botaoMarcos = document.createElement("button");
        botaoMarcos.type = "button";
        botaoMarcos.className = "skill-upgrade-shortcut";
        botaoMarcos.textContent = "Marcos";
        botaoMarcos.setAttribute("aria-label", "Abrir tela de marcos");
        botaoMarcos.setAttribute("data-focus-key", "atalho:marcos");
        botaoMarcos.addEventListener("click", () => abreTela(MostraMarcos));
        atalhos.append(botaoConquistas, botaoMissoes, botaoMarcos);

        // resumo do jogador: nível + pontos em linha compacta (fixo)
        const level = document.createElement("div");
        level.className = "skill-player-summary";
        const levelName = document.createElement("strong");
        levelName.id = "skill-player-level";
        const points = document.createElement("span");
        points.id = "skill-player-points";
        level.append(levelName, points);

        const bonus = document.createElement("div");
        bonus.id = "skill-player-bonus";
        bonus.className = "skill-player-bonus";

        const xpTrack = document.createElement("div");
        xpTrack.id = "skill-player-xp";
        xpTrack.className = "skill-player-xp";
        xpTrack.setAttribute("role", "progressbar");
        xpTrack.setAttribute("aria-label", "Experiência para o próximo nível");
        xpTrack.setAttribute("aria-valuemin", "0");
        xpTrack.setAttribute("aria-describedby", "skill-player-xp-label");
        xpTrack.appendChild(document.createElement("div"));
        xpTrack.firstElementChild.id = "skill-player-xp-fill";
        const xpLabel = document.createElement("span");
        xpLabel.id = "skill-player-xp-label";
        xpLabel.className = "skill-player-xp-label";
        const blocoXp = document.createElement("div");
        blocoXp.className = "skill-player-xp-bloco";
        blocoXp.append(xpTrack, xpLabel);

        // único contêiner de rolagem do painel (cabeçalho/atalhos/resumo ficam fora)
        const rolagem = document.createElement("div");
        rolagem.className = "skill-upgrade-scroll";

        // informações secundárias (bônus e regra de perks) em seção recolhível
        const secaoProgresso = this.criaSecaoRecuavelSkill({
            chave: "progresso:detalhes",
            titulo: "Progresso e bônus",
            resumo: "",
            resumoId: "skill-player-progresso-resumo",
            aberta: this.skillPanelAberta("progresso:detalhes", true)
        });
        const perkLine = document.createElement("div");
        perkLine.id = "skill-player-perk";
        perkLine.className = "skill-player-bonus";
        const perkDisp = PontosPerkDisponiveis();
        const perkGanhos = PontosPerkGanhos();
        perkLine.textContent = `Pontos de perk: ${perkDisp} ${perkDisp === 1 ? "disponível" : "disponíveis"} de ${perkGanhos} · +1 por portão desta run (andar 35+) · zeram no reset`;
        secaoProgresso.corpo.append(bonus, perkLine);

        // ---- árvore de habilidades ----
        // Cada skill é um tronco: nó raiz (a skill), o perk como nó filho e o
        // fork de ramos no nível 5, com dois caminhos lidos na vertical
        // (nó 5 → nó 10). Gastar pontos acontece no nó — mesmas regras
        // (EvoluiSkill/CompraPerk/EscolheRamoSkill), nada de lógica nova aqui.
        const arvore = document.createElement("div");
        arvore.className = "skill-tree";

        for (const skill of SKILLS_UPGRADE) {
            const skillLevel = NivelDaSkill(skill.id);
            const unlocked = PisoMaximoAlcancado() >= skill.pisoDesbloqueio;
            const noMaximo = skillLevel >= skill.maximo;
            const semPontos = pontosHabilidade <= 0;
            const podeMelhorar = unlocked && !noMaximo && !semPontos;
            const icone = ICONE_SKILL[skill.id] || "imagens/espada-habilidade.svg";

            // tronco recolhível: resumo com nível + o que dá para fazer agora
            const resumoTronco = [
                `Nv ${skillLevel}/${skill.maximo}`,
                !unlocked
                    ? `✕ andar ${skill.pisoDesbloqueio}`
                    : noMaximo
                        ? "✓ máximo"
                        : semPontos
                            ? "✕ sem pontos"
                            : "● 1 ponto para subir"
            ].join(" · ");
            const ramoPronto = RamoEscolhido(skill.id) === 0 && unlocked && skillLevel >= RAMO_NIVEL_ESCOLHA;
            const destaqueTronco = podeMelhorar || ramoPronto;
            const tronco = this.criaSecaoRecuavelSkill({
                chave: `skill:${skill.id}`,
                titulo: skill.nome,
                resumo: resumoTronco,
                aberta: this.skillPanelAberta(`skill:${skill.id}`, true),
                destaque: destaqueTronco
            });
            const corpoTronco = tronco.corpo;
            corpoTronco.classList.add("skill-tronco");

            // nó raiz do tronco: a skill. Clicável quando dá para melhorar;
            // travado continua visível com o motivo em texto (nunca só disabled)
            const estadoSkill = !unlocked
                ? { texto: `✕ Desbloqueia no andar ${skill.pisoDesbloqueio}`, classe: "skill-no-estado--bloqueado" }
                : noMaximo
                    ? { texto: "✓ Nível máximo", classe: "skill-no-estado--ok" }
                    : semPontos
                        ? { texto: "✕ Sem pontos de habilidade", classe: "skill-no-estado--bloqueado" }
                        : { texto: "● Pronta para melhorar", classe: "skill-no-estado--ok" };
            const raiz = document.createElement(podeMelhorar ? "button" : "div");
            raiz.className = "skill-no skill-no--raiz"
                + (podeMelhorar
                    ? " skill-no--pronto"
                    : noMaximo
                        ? " skill-no--maximo"
                        : unlocked
                            ? " skill-no--neutro"
                            : " skill-no--travado");
            if (podeMelhorar) {
                raiz.type = "button";
                raiz.setAttribute("data-focus-key", `melhorar:${skill.id}`);
                raiz.addEventListener("click", () => {
                    if (EvoluiSkill(skill.id)) this.showSkillUpgradePanel();
                });
            }

            const iconeEl = document.createElement("img");
            iconeEl.className = "skill-no-icone";
            iconeEl.src = ICONE_SKILL[skill.id] || "imagens/espada-habilidade.svg";
            iconeEl.alt = "";
            iconeEl.setAttribute("aria-hidden", "true");

            const corpoNo = document.createElement("div");
            corpoNo.className = "skill-no-corpo";
            const linhaTopo = document.createElement("div");
            linhaTopo.className = "skill-no-linha";
            const nomeSkill = document.createElement("strong");
            nomeSkill.className = "skill-no-nome";
            nomeSkill.textContent = skill.nome;
            const badgeNivel = document.createElement("span");
            badgeNivel.className = "skill-no-nivel";
            badgeNivel.textContent = `Nv ${skillLevel}/${skill.maximo}`;
            badgeNivel.setAttribute("aria-label", `nível ${skillLevel} de ${skill.maximo}`);
            linhaTopo.append(nomeSkill, badgeNivel);

            const descricao = document.createElement("p");
            descricao.className = "skill-no-desc";
            descricao.textContent = DescricaoEfeitoSkill(skill.id, skillLevel);

            const linhaPe = document.createElement("div");
            linhaPe.className = "skill-no-linha skill-no-pe";
            const estadoEl = document.createElement("span");
            estadoEl.className = `skill-no-estado ${estadoSkill.classe}`;
            estadoEl.textContent = estadoSkill.texto;
            const custoEl = document.createElement("span");
            custoEl.className = "skill-no-custo";
            custoEl.textContent = noMaximo ? "Sem melhoria pendente" : "1 ponto por nível";
            linhaPe.append(estadoEl, custoEl);

            corpoNo.append(linhaTopo, descricao, linhaPe);
            raiz.append(iconeEl, corpoNo);
            raiz.setAttribute("aria-label", podeMelhorar
                ? `Melhorar ${skill.nome} por 1 ponto de habilidade`
                : `${skill.nome}, nível ${skillLevel} de ${skill.maximo} — ${estadoSkill.texto}`);
            corpoTronco.append(raiz);
            const conector = () => {
                const linha = document.createElement("span");
                linha.className = "skill-conector";
                linha.setAttribute("aria-hidden", "true");
                return linha;
            };

            const perk = PERKS.find(item => item.skillId === skill.id);
            if (perk) {
                const perkNivel = Number(window[perk.varName]) || 0;
                const perkNoMaximo = perkNivel >= perk.maximo;
                const semPontoPerk = PontosPerkDisponiveis() <= 0;
                const perkPronto = unlocked && !perkNoMaximo && !semPontoPerk;
                const estadoPerk = !unlocked
                    ? { texto: `✕ Desbloqueia no andar ${skill.pisoDesbloqueio}`, classe: "skill-no-estado--bloqueado" }
                    : perkNoMaximo
                        ? { texto: "✓ Perk no máximo", classe: "skill-no-estado--ok" }
                        : semPontoPerk
                            ? { texto: "✕ Sem pontos de perk", classe: "skill-no-estado--bloqueado" }
                            : { texto: "● Pronto para aplicar", classe: "skill-no-estado--ok" };

                // nó filho: o perk da skill (pontos de perk, não de habilidade)
                const noPerk = document.createElement(perkPronto ? "button" : "div");
                noPerk.className = "skill-no skill-no--perk"
                    + (perkPronto ? " skill-no--pronto" : perkNoMaximo ? " skill-no--maximo" : unlocked ? " skill-no--neutro" : " skill-no--travado");
                if (perkPronto) {
                    noPerk.type = "button";
                    noPerk.setAttribute("data-focus-key", `perk:${skill.id}`);
                    noPerk.addEventListener("click", () => {
                        if (CompraPerk(perk.skillId)) this.showSkillUpgradePanel();
                    });
                }
                const perkGlifo = document.createElement("span");
                perkGlifo.className = "skill-no-glifo";
                perkGlifo.setAttribute("aria-hidden", "true");
                perkGlifo.textContent = "◆";
                const perkCorpo = document.createElement("div");
                perkCorpo.className = "skill-no-corpo";
                const perkTopo = document.createElement("div");
                perkTopo.className = "skill-no-linha";
                const perkNome = document.createElement("strong");
                perkNome.className = "skill-no-nome";
                perkNome.textContent = "Perk";
                const perkBadge = document.createElement("span");
                perkBadge.className = "skill-no-nivel";
                perkBadge.textContent = `Nv ${perkNivel}/${perk.maximo}`;
                perkTopo.append(perkNome, perkBadge);
                const perkEfeito = document.createElement("p");
                perkEfeito.className = "skill-no-desc";
                perkEfeito.textContent = perk.efeito;
                const perkPe = document.createElement("div");
                perkPe.className = "skill-no-linha skill-no-pe";
                const perkEstado = document.createElement("span");
                perkEstado.className = `skill-no-estado ${estadoPerk.classe}`;
                perkEstado.textContent = estadoPerk.texto;
                const perkCusto = document.createElement("span");
                perkCusto.className = "skill-no-custo";
                perkCusto.textContent = perkNoMaximo ? "Sem níveis pendentes" : "1 ponto de perk por nível";
                perkPe.append(perkEstado, perkCusto);
                perkCorpo.append(perkTopo, perkEfeito, perkPe);
                noPerk.append(perkGlifo, perkCorpo);
                noPerk.setAttribute("aria-label", perkPronto
                    ? `Aplicar perk em ${perk.nome} — ${perkNivel}/${perk.maximo} por 1 ponto de perk`
                    : `Perk de ${skill.nome}, ${perkNivel} de ${perk.maximo} — ${estadoPerk.texto}`);
                corpoTronco.append(conector(), noPerk);
            }

            // fork dos ramos no nível 5: dois caminhos, cada um lido na
            // vertical (nó 5 → nó 10). Em telas largas ficam lado a lado.
            const arvoreRamos = RAMOS_SKILL.find(item => item.skillId === skill.id);
            if (arvoreRamos) {
                const escolhido = RamoEscolhido(skill.id);

                const ramificacao = document.createElement("div");
                ramificacao.className = "skill-ramificacao";
                const dica = document.createElement("p");
                dica.className = "skill-ramos-hint";
                dica.textContent = escolhido !== 0
                    ? `Caminho selado: ${arvoreRamos.ramos[escolhido - 1].nome} · zerado no reset`
                    : skillLevel >= RAMO_NIVEL_ESCOLHA && unlocked
                        ? "Escolha um caminho — mutuamente exclusivo nesta run"
                        : unlocked
                            ? `Ramos abrem no nível ${RAMO_NIVEL_ESCOLHA} · zeram no reset`
                            : `Ramos abrem no nível ${RAMO_NIVEL_ESCOLHA} da skill`;
                ramificacao.append(dica);

                const caminhos = document.createElement("div");
                caminhos.className = "skill-caminhos";
                for (const ramo of arvoreRamos.ramos) {
                    const caminho = document.createElement("div");
                    caminho.className = "skill-caminho";
                    if (escolhido !== 0 && escolhido !== ramo.id) caminho.classList.add("skill-caminho--selado");
                    if (escolhido === ramo.id) caminho.classList.add("skill-caminho--ativo");

                    const tituloCaminho = document.createElement("div");
                    tituloCaminho.className = "skill-ramo-cabecalho";
                    const nomeCaminho = document.createElement("span");
                    nomeCaminho.className = "skill-ramo-caminho";
                    nomeCaminho.textContent = ramo.nome;
                    tituloCaminho.append(nomeCaminho);
                    caminho.append(tituloCaminho);

                    // nó 1: a escolha (nível 5) — só é botão quando há escolha
                    const podeEscolher = escolhido === 0 && unlocked && skillLevel >= RAMO_NIVEL_ESCOLHA;
                    const nome1 = document.createElement("span");
                    nome1.className = "skill-ramo-nome";
                    nome1.textContent = `Nv ${RAMO_NIVEL_ESCOLHA}`;
                    const efeito1 = document.createElement("span");
                    efeito1.className = "skill-ramo-efeito";
                    efeito1.textContent = ramo.efeito5;
                    const estado1 = document.createElement("span");
                    estado1.className = "skill-ramo-estado";
                    let no1;
                    let estado1Texto;
                    if (escolhido === ramo.id) {
                        estado1Texto = "✓ escolhido";
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--ativo";
                    } else if (escolhido !== 0) {
                        estado1Texto = "✕ selado";
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--selado";
                    } else if (!unlocked) {
                        estado1Texto = `✕ andar ${skill.pisoDesbloqueio}`;
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--travado";
                    } else if (skillLevel < RAMO_NIVEL_ESCOLHA) {
                        estado1Texto = `✕ nível ${RAMO_NIVEL_ESCOLHA}`;
                        no1 = document.createElement("span");
                        no1.className = "skill-ramo-no skill-ramo-no--travado";
                    } else {
                        estado1Texto = "● Escolher";
                        no1 = document.createElement("button");
                        no1.type = "button";
                        no1.className = "skill-ramo-no skill-ramo-no--escolhivel";
                        no1.setAttribute("data-focus-key", `ramo:${skill.id}:${ramo.id}`);
                        no1.addEventListener("click", () => {
                            if (EscolheRamoSkill(skill.id, ramo.id)) this.showSkillUpgradePanel();
                        });
                    }
                    estado1.textContent = estado1Texto;
                    no1.append(nome1, efeito1, estado1);
                    no1.setAttribute("aria-label", `${podeEscolher ? "Escolher" : "Caminho"} ${ramo.nome} de ${skill.nome} — ${estado1Texto}`);

                    const seta = document.createElement("span");
                    seta.className = "skill-conector";
                    seta.setAttribute("aria-hidden", "true");

                    // nó 2: conclusão no nível 10 (nunca clicável)
                    const nome2 = document.createElement("span");
                    nome2.className = "skill-ramo-nome";
                    nome2.textContent = `Nv ${RAMO_NIVEL_CONCLUSAO}`;
                    const efeito2 = document.createElement("span");
                    efeito2.className = "skill-ramo-efeito";
                    efeito2.textContent = ramo.efeito10;
                    const estado2 = document.createElement("span");
                    estado2.className = "skill-ramo-estado";
                    const no2 = document.createElement("span");
                    no2.className = "skill-ramo-no";
                    if (escolhido === ramo.id) {
                        if (skillLevel >= RAMO_NIVEL_CONCLUSAO) {
                            no2.classList.add("skill-ramo-no--ativo");
                            estado2.textContent = "✓ ativo";
                        } else {
                            no2.classList.add("skill-ramo-no--pendente");
                            estado2.textContent = `○ falta nível ${RAMO_NIVEL_CONCLUSAO}`;
                        }
                    } else if (escolhido !== 0) {
                        no2.classList.add("skill-ramo-no--selado");
                        estado2.textContent = "✕ selado";
                    } else {
                        no2.classList.add("skill-ramo-no--travado");
                        estado2.textContent = unlocked && skillLevel >= RAMO_NIVEL_ESCOLHA
                            ? "○ após escolher"
                            : `✕ nível ${RAMO_NIVEL_ESCOLHA}`;
                    }
                    no2.setAttribute("aria-label", `Conclusão do caminho ${ramo.nome} — ${estado2.textContent}`);
                    no2.append(nome2, efeito2, estado2);

                    caminho.append(no1, seta, no2);
                    caminhos.append(caminho);
                }
                ramificacao.append(caminhos);
                corpoTronco.append(conector(), ramificacao);
            }
            arvore.appendChild(tronco.secao);
        }

        rolagem.append(secaoProgresso.secao, arvore);

        // Auto-gasto de pontos (andar 55): toggle dentro do painel — gasta na
        // hora cada ponto ganho numa skill aleatória (só níveis; perks e
        // ramos da árvore ficam manuais). Ids batem com a SyncTogglesAutomacao.
        const autoGastoWrap = document.createElement("label");
        autoGastoWrap.className = "auto-toggle skill-auto-gasto";
        autoGastoWrap.id = "autoGastoWrap";
        const autoGastoTexto = document.createElement("span");
        autoGastoTexto.textContent = "auto-gasto de pontos · nível aleatório";
        const autoGastoInput = document.createElement("input");
        autoGastoInput.type = "checkbox";
        autoGastoInput.id = "autoGastoToggle";
        autoGastoInput.setAttribute("aria-label", "Auto-gasto de pontos de habilidade");
        autoGastoInput.addEventListener("change", () => {
            AlternaAutoGasto(autoGastoInput.checked);
            this.showSkillUpgradePanel();
        });
        autoGastoWrap.append(autoGastoTexto, autoGastoInput);

        panel.append(header, atalhos, level, blocoXp, autoGastoWrap, rolagem);
        overlay.appendChild(panel);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) fechar();
        });
        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") {
                fechar();
                return;
            }
            if (event.key !== "Tab") return;
            // foco coerente: Tab circula só entre os controles do modal
            const focaveis = Array.from(overlay.querySelectorAll(
                'button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])'
            )).filter(el => el.offsetParent !== null);
            if (focaveis.length === 0) return;
            const primeiro = focaveis[0];
            const ultimo = focaveis[focaveis.length - 1];
            const atual = document.activeElement;
            if (event.shiftKey && (atual === primeiro || !overlay.contains(atual))) {
                event.preventDefault();
                ultimo.focus();
            } else if (!event.shiftKey && (atual === ultimo || !overlay.contains(atual))) {
                event.preventDefault();
                primeiro.focus();
            }
        });
        document.body.appendChild(overlay);
        // estado travado/marcado do auto-gasto (e re-sync dos outros dois,
        // que só existem fora do painel) — mesmos ids da SyncTogglesAutomacao
        SyncTogglesAutomacao();
        this.updateSkillProgress();
        this.syncScreenButtons();
        // devolve o foco ao controle que originou o re-render (ou ao fechar)
        const alvoFoco = focoAnterior
            ? Array.from(overlay.querySelectorAll("[data-focus-key]"))
                .find(el => el.dataset.focusKey === focoAnterior)
            : null;
        (alvoFoco || close).focus({ preventScroll: true });
        // restaura a rolagem na única área rolável (kill/level-up não sobe a tela)
        rolagem.scrollTop = rolagemAnterior;
    },

    toggleSkillUpgradePanel() {
        if (document.getElementById("skillUpgradeModal")) {
            document.getElementById("skillUpgradeModal").remove();
            this.syncScreenButtons();
            return;
        }
        document.getElementById("antCollectionModal")?.remove();
        this.closeOtherPanels("skills");
        this.showSkillUpgradePanel();
    },

    closeOtherPanels(activePanel) {
        const mobileLayout = window.matchMedia(
            "(max-width: 700px), (min-width: 701px) and (max-width: 900px) and (orientation: portrait), (max-width: 900px) and (max-height: 520px) and (orientation: landscape), (min-width: 1000px) and (max-width: 1500px) and (min-height: 780px) and (max-height: 950px) and (orientation: landscape)"
        ).matches;
        if (!mobileLayout) return;

        if (activePanel !== "status") {
            document.getElementById("DivStatus").style.visibility = "hidden";
        }
        if (activePanel !== "shop") {
            document.getElementById("Loja").style.visibility = "hidden";
            document.getElementById("LojaEsm").style.visibility = "hidden";
            document.getElementById("LojaCM").style.visibility = "hidden";
        }
        if (activePanel !== "config") {
            document.getElementById("container-SalvaCarrega").style.visibility = "hidden";
        }
    }
});
