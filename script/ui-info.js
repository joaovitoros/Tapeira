// =========================
// ÍCONE DE INFO DE TELAS
// =========================
// Componente reutilizável: o selo redondo de "i" que abre um balão curto
// explicando como a tela funciona — o mesmo padrão visual do info do baú
// dourado (ui-baus.js), mas genérico para QUALQUER tela complexa. Primeiro
// uso/teste: o painel de Ramos (ui-skills.js). Reuse daqui em diante.
//
// Uso (sem import/export — tudo global, script clássico):
//
//   const info = CriaInfoTela({
//       id: "ramos-tree-info",              // opcional
//       rotulo: "Sobre a árvore de habilidades",
//       html: "<b>Como funciona</b><p>...</p>"
//   });
//   header.append(title, info, close);      // o botão vive dentro do wrapper
//
// Comportamento: um balão por vez (abrir outro fecha o anterior), fecha no
// clique fora e no ESC — o ESC para a propagação para o painel/modal NÃO
// fechar junto (fecha-se primeiro o balão, depois a tela). Sem handler
// inline; listeners por addEventListener.

let infoTelaAtiva = null; // { botao, balao, aoFora }

function FechaInfoTela() {
    if (!infoTelaAtiva) return;
    const { botao, balao, aoFora } = infoTelaAtiva;
    infoTelaAtiva = null;
    balao.hidden = true;
    botao.setAttribute("aria-expanded", "false");
    document.removeEventListener("pointerdown", aoFora, true);
}

function CriaInfoTela(opcoes) {
    const { id, rotulo, html } = opcoes || {};

    const wrap = document.createElement("span");
    wrap.className = "info-tela";

    const botao = document.createElement("button");
    botao.type = "button";
    botao.className = "info-tela__btn";
    if (id) botao.id = id;
    botao.setAttribute("aria-expanded", "false");
    botao.setAttribute("aria-label", rotulo || "Sobre esta tela");
    botao.title = rotulo || "Sobre esta tela";
    // mesmo desenho do info do baú dourado: círculo + haste + ponto
    botao.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">'
        + '<circle cx="12" cy="12" r="9.4"></circle>'
        + '<path d="M12 11.2v5.2"></path>'
        + '<circle cx="12" cy="7.8" r="1.15" class="info-tela__ponto"></circle>'
        + '</svg>';

    const balao = document.createElement("div");
    balao.className = "info-tela__balao";
    balao.setAttribute("role", "note");
    balao.hidden = true;
    balao.innerHTML = html || "";

    botao.addEventListener("click", () => {
        const abrir = balao.hidden;
        FechaInfoTela();
        if (!abrir) return;
        balao.hidden = false;
        botao.setAttribute("aria-expanded", "true");
        const aoFora = (evento) => {
            // painel pode ter sido re-renderizado/destruído com o balão aberto:
            // o wrapper sai do DOM e este handler se aposenta sozinho aqui.
            if (!wrap.isConnected || !wrap.contains(evento.target)) FechaInfoTela();
        };
        infoTelaAtiva = { botao, balao, aoFora };
        // setTimeout: senão o próprio clique que abriu já fecha (o listener
        // nasce depois, mas o evento de abertura ainda está na fila).
        setTimeout(() => {
            if (infoTelaAtiva && infoTelaAtiva.botao === botao) {
                document.addEventListener("pointerdown", aoFora, true);
            }
        }, 0);
    });

    // ESC fecha o balão pelo FechaJanelasAbertas() (keymap.js), que trata o
    // info como uma camada a mais — uma janela por ESC.

    wrap.append(botao, balao);
    return wrap;
}
