// ===================== AVISO DE ATUALIZAÇÃO =====================
// Lê a versão do servidor (/api/versao) e, se for MAIS NOVA que a do jogo,
// mostra um aviso:
//   - Web  -> botão "Atualizar agora" (recarrega, pega o build novo)
//   - PC   -> botão "Baixar atualização" (abre o instalador .exe)
//   - Android -> botão "Baixar atualização" (abre o .apk)
//
// O endereço do servidor é a MESMA origem quando o jogo é servido por ele;
// rodando solto (arquivo/.exe/app), usa o endereço salvo (Configurações).

// Versão DESTE build — atualize junto com o package.json a cada release.
const VERSAO_JOGO = "1.8.4";

function AtualizacaoBase() {
    if (location.protocol === "http:" || location.protocol === "https:") return "";
    try { return localStorage.getItem("tapeira-servidor-pvp") || ""; } catch { return ""; }
}

// -1 = a < b | 0 = iguais | 1 = a > b
function AtualizacaoCompara(a, b) {
    const pa = String(a).split(".").map(n => parseInt(n, 10) || 0);
    const pb = String(b).split(".").map(n => parseInt(n, 10) || 0);
    for (let i = 0; i < 3; i++) {
        const x = pa[i] || 0, y = pb[i] || 0;
        if (x !== y) return x < y ? -1 : 1;
    }
    return 0;
}

function AtualizacaoPlataforma() {
    if (window.tapeiraDesktop) return "pc";
    if (window.Capacitor || /Android/i.test(navigator.userAgent)) return "android";
    return "web";
}

function MostraAvisoAtualizacao(info) {
    if (document.getElementById("avisoAtualizacao")) return;
    const plataforma = AtualizacaoPlataforma();
    const caixa = document.createElement("div");
    caixa.id = "avisoAtualizacao";

    const texto = document.createElement("div");
    texto.className = "avisoAtualizacao__texto";
    texto.textContent = "Nova versão " + info.versao + " disponível!";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-Padrao";
    btn.textContent = plataforma === "web" ? "Atualizar agora" : "Baixar atualização";
    btn.addEventListener("click", () => {
        if (plataforma === "web") { location.reload(); return; }
        const caminho = plataforma === "android" ? info.download.android : info.download.pc;
        const url = AtualizacaoBase() + (caminho || "");
        if (url) window.open(url, "_blank");
    });

    const fechar = document.createElement("button");
    fechar.type = "button";
    fechar.className = "avisoAtualizacao__x";
    fechar.textContent = "×";
    fechar.title = "Fechar";
    fechar.addEventListener("click", () => caixa.remove());

    caixa.append(texto, btn, fechar);
    document.body.appendChild(caixa);
}

async function VerificaAtualizacao() {
    let info;
    try {
        const resp = await fetch(AtualizacaoBase() + "/api/versao", { cache: "no-store" });
        if (!resp.ok) return;
        info = await resp.json();
    } catch { return; }
    if (!info || !info.versao) return;
    if (AtualizacaoCompara(VERSAO_JOGO, info.versao) >= 0) return;   // já é a mais nova
    MostraAvisoAtualizacao(info);
}

window.VerificaAtualizacao = VerificaAtualizacao;
document.addEventListener("DOMContentLoaded", () => setTimeout(VerificaAtualizacao, 2500));
