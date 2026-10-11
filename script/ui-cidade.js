// ===================== CIDADE (hub de metaprogressão) ======================
// Aba nova na barra. FASE 1 (esqueleto): só navegação — cada prédio abre um
// painel que JÁ existe. A Cidade NÃO pausa a run: o jogo continua por baixo
// (igual Loja/Status). O gate é derivado do andar máximo (sem campo no save).
//
// Plano completo em CIDADE.md.
(function () {
    "use strict";

    // A aba só aparece a partir deste andar (permanente, como skills/automação).
    const ANDAR_CIDADE = 80;

    // prédio -> painel existente que ele abre
    const PREDIOS = {
        casa: () => Tapeira.Casa.abrir(),
        mercado: () => Tapeira.Mercado.abrir(),
        pesquisa: () => Tapeira.Pesquisa.abrir(),
        fazenda: () => Tapeira.Fazenda.abrir(),
        fabrica: () => Tapeira.Fabrica.abrir()
    };

    // Andar máximo para destravar cada prédio (derivado, sem campo no save).
    // Bate com a tabela de gates do CIDADE.md.
    const GATES = { casa: 80, fazenda: 85, mercado: 90, fabrica: 100, pesquisa: 110 };

    function desbloqueada() {
        return (Number(window.maxAndar) || 0) >= ANDAR_CIDADE;
    }

    function travado(id) {
        const gate = GATES[id];
        return gate !== undefined && (Number(window.maxAndar) || 0) < gate;
    }

    function painel() {
        return document.getElementById("container-Cidade");
    }

    function aberta() {
        const el = painel();
        return !!el && !el.hidden;
    }

    function atualizaHud() {
        const hud = document.getElementById("cidadeHud");
        if (hud) hud.textContent = "Andar " + andar + " · " + FormatGold(gold);
    }

    // A Cidade é tela cheia: fecha os painéis laterais (Status/Loja/Config) pra
    // não ficarem escondidos atrás dela.
    function fechaPainaisLaterais() {
        ["DivStatus", "Loja", "LojaEsm", "LojaCM", "container-SalvaCarrega"].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.visibility = "hidden";
        });
    }

    function fechar() {
        const el = painel();
        if (el) el.hidden = true;
        document.getElementById("game-root")?.classList.remove("cidade-aberta");
        const botao = document.getElementById("btnCidade");
        if (botao) botao.setAttribute("aria-expanded", "false");
        UI.syncScreenButtons();
    }

    function abrir() {
        if (!desbloqueada()) return;
        const el = painel();
        if (!el) return;
        fechaPainaisLaterais();
        el.hidden = false;
        // a Cidade vive dentro de #container-opcoes (z-index 3); sobe o contexto
        // pra ela ficar acima do HUD (z-index 5) enquanto está aberta
        document.getElementById("game-root")?.classList.add("cidade-aberta");
        const botao = document.getElementById("btnCidade");
        if (botao) botao.setAttribute("aria-expanded", "true");
        atualizaHud();
        UI.syncScreenButtons();
        // centraliza depois do layout (a cena já tem o tamanho final)
        requestAnimationFrame(centralizaCena);
    }

    function alternar() {
        if (aberta()) fechar();
        else abrir();
    }

    function abrePredio(id) {
        if (id === "fechar") { fechar(); return; }
        if (travado(id)) {
            UI.showInfo("Prédio trancado: alcance o andar " + GATES[id] + ".");
            return;
        }
        const acao = PREDIOS[id];
        if (!acao) return;
        // Abre o painel POR CIMA da Cidade (ela continua aberta atrás) — assim,
        // ao fechar o painel, o jogador volta pra Cidade, não pra caverna.
        acao();
    }

    // Reflete o gate (a aba só aparece no andar 80), o HUD e o estado
    // trancado/destrancado de cada prédio. Roda a cada 1s junto dos outros
    // ticks leves (sistema.js) — o maxAndar muda no avanço.
    function sincroniza() {
        const botao = document.getElementById("btnCidade");
        if (botao) botao.hidden = !desbloqueada();
        if (aberta()) atualizaHud();

        Object.keys(GATES).forEach(id => {
            const predio = document.querySelector('[data-cidade="' + id + '"]');
            if (!predio) return;
            const bloqueado = travado(id);
            predio.classList.toggle("is-travado", bloqueado);
            const selo = predio.querySelector(".cidade-predio__lock");
            if (selo) selo.textContent = bloqueado ? "🔒 Andar " + GATES[id] : "";
        });
    }

    // Centraliza a cena no container (a cidade abre no meio, não na ponta) —
    // vale pro celular, onde a cena é mais larga que o visor.
    function centralizaCena() {
        const container = painel();
        if (!container) return;
        container.scrollLeft = Math.max(0, (container.scrollWidth - container.clientWidth) / 2);
        container.scrollTop = Math.max(0, (container.scrollHeight - container.clientHeight) / 2);
    }

    // Arrastar a cena pra explorar a cidade (tipo um mapa): move o scroll do
    // container. SEM setPointerCapture — ele redirecionava o "click" pro
    // container e o clique no prédio não chegava; o arrasto acompanha o
    // ponteiro por listeners na janela. Um arrasto engole o clique seguinte.
    function habilitaArrastarCena() {
        const cena = document.querySelector(".cidade-cena");
        const container = painel();
        if (!cena || !container) return;
        let arrastando = false, moveu = false, iniX = 0, iniY = 0, sTop = 0, sLeft = 0;

        const aoMover = e => {
            if (!arrastando) return;
            const dx = e.clientX - iniX;
            const dy = e.clientY - iniY;
            if (Math.abs(dx) > 5 || Math.abs(dy) > 5) moveu = true;
            container.scrollTop = sTop - dy;
            container.scrollLeft = sLeft - dx;
        };
        const aoSoltar = () => {
            arrastando = false;
            window.removeEventListener("pointermove", aoMover);
            window.removeEventListener("pointerup", aoSoltar);
            window.removeEventListener("pointercancel", aoSoltar);
        };

        cena.addEventListener("pointerdown", e => {
            if (e.button !== 0) return;
            arrastando = true;
            moveu = false;
            iniX = e.clientX; iniY = e.clientY;
            sTop = container.scrollTop; sLeft = container.scrollLeft;
            window.addEventListener("pointermove", aoMover);
            window.addEventListener("pointerup", aoSoltar);
            window.addEventListener("pointercancel", aoSoltar);
        });

        // se arrastou, engole o clique que viria em seguida (não abre o prédio)
        cena.addEventListener("click", e => {
            if (moveu) {
                e.preventDefault();
                e.stopPropagation();
                moveu = false;
            }
        }, true);
    }

    document.addEventListener("DOMContentLoaded", () => {
        const botao = document.getElementById("btnCidade");
        if (botao) botao.addEventListener("click", alternar);

        const el = painel();
        if (el) {
            el.querySelectorAll("[data-cidade]").forEach(b => {
                const id = b.getAttribute("data-cidade");
                // selo de "trancado" (só nos prédios; o botão × não tem gate)
                if (id !== "fechar" && GATES[id] !== undefined && !b.querySelector(".cidade-predio__lock")) {
                    const selo = document.createElement("span");
                    selo.className = "cidade-predio__lock";
                    selo.setAttribute("aria-hidden", "true");
                    b.appendChild(selo);
                }
                b.addEventListener("click", () => abrePredio(id));
            });
        }
        habilitaArrastarCena();
        sincroniza();
    });

    window.Tapeira = window.Tapeira || {};
    window.Tapeira.Cidade = { ANDAR_CIDADE, GATES, desbloqueada, travado, abrir, fechar, alternar, sincroniza };
})();
