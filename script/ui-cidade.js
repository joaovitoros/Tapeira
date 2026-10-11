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
        casa: () => UI.toggleStatus(),
        mercado: () => AbreLoja(false),
        pesquisa: () => UI.showRamosTreePanel(),
        fazenda: () => UI.showAntCollection(),
        fabrica: () => UI.showItensBuild()
    };

    function desbloqueada() {
        return (Number(window.maxAndar) || 0) >= ANDAR_CIDADE;
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
    }

    function alternar() {
        if (aberta()) fechar();
        else abrir();
    }

    function abrePredio(id) {
        if (id === "fechar") { fechar(); return; }
        const acao = PREDIOS[id];
        if (!acao) return;
        fechar();
        acao();
    }

    // Reflete o gate (a aba só aparece no andar 80) e o HUD. Roda a cada 1s
    // junto dos outros ticks leves (sistema.js) — o maxAndar muda no avanço.
    function sincroniza() {
        const botao = document.getElementById("btnCidade");
        if (botao) botao.hidden = !desbloqueada();
        if (aberta()) atualizaHud();
    }

    document.addEventListener("DOMContentLoaded", () => {
        const botao = document.getElementById("btnCidade");
        if (botao) botao.addEventListener("click", alternar);

        const el = painel();
        if (el) {
            el.querySelectorAll("[data-cidade]").forEach(b => {
                b.addEventListener("click", () => abrePredio(b.getAttribute("data-cidade")));
            });
        }
        sincroniza();
    });

    window.Tapeira = window.Tapeira || {};
    window.Tapeira.Cidade = { ANDAR_CIDADE, desbloqueada, abrir, fechar, alternar, sincroniza };
})();
