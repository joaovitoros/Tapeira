// ===================== CONFIGURAÇÕES (preferências do jogador) ============
// Ajustes de gameplay/visual POR DISPOSITIVO, persistidos em localStorage
// (como os volumes) — nada aqui vai pro save do jogo. Cada opção liga/desliga
// um efeito existente; a leitura é sempre via Tapeira.Config.ativo(id).
(function () {
    "use strict";
    window.Tapeira = window.Tapeira || {};

    const CHAVE = "tapeiraConfig";

    // id · rótulo · descrição · padrão
    const ITENS = [
        { id: "numerosDano", nome: "Números de dano", desc: "Mostra o número que sai a cada golpe.", padrao: true },
        { id: "efeitosImpacto", nome: "Efeitos de impacto", desc: "Explosões e faíscas ao acertar o inimigo.", padrao: true },
        { id: "tremerCritico", nome: "Tremor no crítico", desc: "Treme a tela e dá um flash no acerto crítico.", padrao: true },
        { id: "avisosBau", nome: "Avisos de baú", desc: "Avisa quando um baú aparece e ao abrir.", padrao: true },
        { id: "anunciosMarco", nome: "Anúncios de marco", desc: "Banners de nível, marco de andar e conquistas.", padrao: true },
        { id: "logsTransparentes", nome: "Registros transparentes", desc: "Deixa o painel de Registro da arena e o histórico mais transparentes.", padrao: false },
        { id: "movimentoReduzido", nome: "Reduzir movimento", desc: "Menos animações — mais leve em aparelhos fracos.", padrao: false }
    ];

    const valores = {};
    for (const item of ITENS) valores[item.id] = item.padrao;

    try {
        const salvo = JSON.parse(localStorage.getItem(CHAVE) || "{}");
        for (const item of ITENS) {
            if (typeof salvo[item.id] === "boolean") valores[item.id] = salvo[item.id];
        }
    } catch { /* preferência corrompida: usa o padrão */ }

    function salva() {
        try { localStorage.setItem(CHAVE, JSON.stringify(valores)); } catch { /* sem storage */ }
    }

    // Efeitos globais: a classe no <html> liga o CSS de "reduzir movimento"
    // e o do "registros transparentes" (modal de Logs).
    function aplica() {
        document.documentElement?.classList.toggle("config-sem-movimento", valores.movimentoReduzido === true);
        document.documentElement?.classList.toggle("config-logs-transparente", valores.logsTransparentes === true);
    }

    function ativo(id) {
        return valores[id] === true;
    }

    function define(id, valor) {
        if (!(id in valores)) return false;
        valores[id] = valor === true;
        // espelha o valor no checkbox quando a mudança vem de fora da UI
        const chk = document.getElementById("config-" + id);
        if (chk) chk.checked = valores[id];
        salva();
        aplica();
        return true;
    }

    // ---- UI: monta a seção "Ajustes" dentro do painel de Config ----
    let montado = false;
    function montaUI() {
        if (montado) return;
        const alvo = document.getElementById("container-SalvaCarrega");
        if (!alvo) return;
        montado = true;

        const secao = document.createElement("div");
        secao.id = "divAjustes";

        const titulo = document.createElement("div");
        titulo.className = "tituloConfig";
        titulo.textContent = "Ajustes";
        secao.appendChild(titulo);

        for (const item of ITENS) {
            const linha = document.createElement("label");
            linha.className = "config-item";
            const texto = document.createElement("span");
            texto.className = "config-item__texto";
            const nome = document.createElement("b");
            nome.textContent = item.nome;
            const desc = document.createElement("span");
            desc.textContent = item.desc;
            texto.append(nome, desc);
            const chk = document.createElement("input");
            chk.type = "checkbox";
            chk.id = "config-" + item.id;
            chk.setAttribute("data-config", item.id);
            chk.checked = ativo(item.id);
            chk.setAttribute("aria-label", item.nome);
            chk.addEventListener("change", () => {
                define(item.id, chk.checked);
                UI.showInfo?.(`${item.nome}: ${chk.checked ? "ligado" : "desligado"}.`);
            });
            linha.append(texto, chk);
            secao.appendChild(linha);
        }

        // entra depois do bloco de Volume (antes da Tela, no desktop)
        const volume = document.getElementById("divVolume");
        if (volume && volume.nextSibling) alvo.insertBefore(secao, volume.nextSibling);
        else alvo.appendChild(secao);
    }

    window.Tapeira.Config = {
        ITENS,
        ativo,
        valor: id => valores[id],
        define,
        alterna: id => define(id, !valores[id]),
        aplica,
        montaUI
    };

    document.addEventListener("DOMContentLoaded", () => { montaUI(); aplica(); });
})();
