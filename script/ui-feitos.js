// ===================== PAINEL "FEITOS" ==================================
// Tela de Conquistas / Missões / Marcos embutidas num painel só (abas
// internas), no lugar do antigo fluxo de atalhos que abria o modal genérico.
// Reusa os construtores de HTML de `ui-telas.js` (HtmlConquistas/HtmlMissoes/
// HtmlMarcos) — nenhuma regra de jogo nova aqui.

Object.assign(UI, {
    // Abre/fecha o painel (mesmo padrão de toggle dos outros painéis).
    toggleFeitosPanel() {
        if (document.getElementById("feitosModal")) {
            this.fechaFeitosPanel();
            return;
        }
        this.showFeitosPanel();
    },

    // `aba` = "conquistas" | "missoes" | "marcos" (default: conquistas).
    // Re-renderiza a cada troca de aba pra refletir o estado atual do jogo.
    showFeitosPanel(aba) {
        document.getElementById("feitosModal")?.remove();

        const abas = [
            { id: "conquistas", rotulo: "Conquistas", html: () => HtmlConquistas() },
            { id: "missoes", rotulo: "Missões", html: () => HtmlMissoes() },
            { id: "marcos", rotulo: "Marcos", html: () => HtmlMarcos() },
            { id: "formigas", rotulo: "Formigas", conteudo: () => this.criaConteudoFormigas() }
        ];
        const aberta = abas.some(item => item.id === aba) ? aba : "conquistas";

        const overlay = document.createElement("div");
        overlay.id = "feitosModal";
        overlay.className = "ant-collection-overlay feitos-overlay";
        overlay.setAttribute("role", "dialog");
        overlay.setAttribute("aria-modal", "true");
        overlay.setAttribute("aria-labelledby", "feitos-title");

        const painel = document.createElement("section");
        painel.className = "ant-collection-panel feitos-panel";

        const header = document.createElement("div");
        header.className = "ant-collection-header";
        const titulo = document.createElement("h2");
        titulo.id = "feitos-title";
        titulo.textContent = "Feitos";
        const fechar = document.createElement("button");
        fechar.type = "button";
        fechar.className = "ant-collection-close";
        fechar.setAttribute("aria-label", "Fechar");
        fechar.textContent = "×";
        fechar.addEventListener("click", () => this.fechaFeitosPanel());
        header.append(titulo, CriaInfoTela({
            id: "feitos-info",
            rotulo: "Sobre os Feitos",
            html: "<b>Como funciona</b>"
                + "<p>Quatro abas: <b>Conquistas</b> (metas que desbloqueiam "
                + "bônus permanentes), <b>Missões</b> (tarefas curtas que pagam "
                + "gold e se renovam), <b>Marcos</b> (marcos de progresso, sem "
                + "bônus) e <b>Formigas</b> (a coleção).</p>"
        }), fechar);

        const barraAbas = document.createElement("div");
        barraAbas.className = "feitos-abas";
        barraAbas.setAttribute("role", "tablist");
        for (const item of abas) {
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "feitos-aba" + (item.id === aberta ? " feitos-aba--ativa" : "");
            btn.setAttribute("role", "tab");
            btn.setAttribute("data-aba", item.id);
            btn.setAttribute("aria-selected", String(item.id === aberta));
            btn.textContent = item.rotulo;
            btn.addEventListener("click", () => this.showFeitosPanel(item.id));
            barraAbas.appendChild(btn);
        }

        const corpo = document.createElement("div");
        corpo.className = "feitos-corpo ant-collection-list";
        corpo.setAttribute("role", "tabpanel");
        const escolhida = abas.find(item => item.id === aberta);
        if (escolhida.html) corpo.innerHTML = escolhida.html();
        else corpo.appendChild(escolhida.conteudo());

        painel.append(header, barraAbas, corpo);
        overlay.appendChild(painel);
        overlay.addEventListener("click", event => {
            if (event.target === overlay) this.fechaFeitosPanel();
        });
        overlay.addEventListener("keydown", event => {
            if (event.key === "Escape") this.fechaFeitosPanel();
        });
        document.body.appendChild(overlay);
        this.syncScreenButtons();
        fechar.focus();
    },

    fechaFeitosPanel() {
        document.getElementById("feitosModal")?.remove();
        this.syncScreenButtons();
        document.getElementById("btnSkills")?.focus();
    }
});
