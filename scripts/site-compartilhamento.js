#!/usr/bin/env node
/*
 * Site de compartilhamento do TAPeira.
 *
 * Sobe um site simples no seu PC que lista os instaladores gerados
 * (Windows: `npm run build:pc` -> dist/pc/*.exe ;
 *  Android: `npm run android:release` -> android/.../app-release.apk)
 * e os patch notes (arquivo patchnotes.json na raiz do projeto).
 *
 * POR SEGURANÇA ele só serve a página, o favicon e os arquivos de
 * instalação — nunca o código-fonte, saves ou qualquer outro arquivo.
 *
 * Uso:
 *   npm run compartilhar             # site na porta 8100
 *   npm run compartilhar -- 9000     # em outra porta
 *   SEM_TUNEL=1 npm run compartilhar # só a rede local, sem túnel
 *
 * Se existir um cloudflared.exe na raiz do projeto (ou no PATH), ele
 * também abre um túnel gratuito do Cloudflare e imprime uma URL pública
 * (https) que os amigos usam para baixar de qualquer lugar.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const os = require("os");
const { spawn, execSync } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const PORTA_BASE = Number(process.argv[2] || process.env.PORTA || 8100);
const DIR_WIN = path.join(RAIZ, "dist", "pc");
const DIR_APK_RELEASE = path.join(RAIZ, "android", "app", "build", "outputs", "apk", "release");
const DIR_APK_DEBUG = path.join(RAIZ, "android", "app", "build", "outputs", "apk", "debug");
const ARQ_PATCHNOTES = path.join(RAIZ, "patchnotes.json");
const ARQ_ICONE = path.join(RAIZ, "assets", "tapeira.ico");
const CLOUDFLARED_RAIZ = path.join(RAIZ, "cloudflared.exe");

// ---------------------------------------------------------------- arquivos

function achaMaisRecente(dir, ehValido) {
    try {
        const encontrados = fs.readdirSync(dir)
            .filter(ehValido)
            .map(nome => {
                const completo = path.join(dir, nome);
                const st = fs.statSync(completo);
                return { nome, completo, tamanho: st.size, mtime: st.mtimeMs };
            })
            .filter(a => a.tamanho > 0)
            .sort((a, b) => b.mtime - a.mtime);
        return encontrados[0] || null;
    } catch {
        return null;
    }
}

function achaInstaladores() {
    const win = achaMaisRecente(
        DIR_WIN,
        n => n.toLowerCase().endsWith(".exe") && !n.toLowerCase().includes("unins")
    );
    const ehApk = n => n.toLowerCase().endsWith(".apk");
    const ehAssinado = n => ehApk(n) && !n.toLowerCase().includes("unsigned");
    // prefere APK assinado (o não assinado o Android bloqueia na instalação)
    const apk = achaMaisRecente(DIR_APK_RELEASE, ehAssinado)
        || achaMaisRecente(DIR_APK_DEBUG, ehAssinado)
        || achaMaisRecente(DIR_APK_RELEASE, ehApk)
        || achaMaisRecente(DIR_APK_DEBUG, ehApk);
    return { win, apk };
}

function carregaPatchNotes() {
    try {
        const dados = JSON.parse(fs.readFileSync(ARQ_PATCHNOTES, "utf8"));
        if (!Array.isArray(dados.patches)) return [];
        return dados.patches
            .filter(p => p && typeof p.versao === "string" && p.versao)
            .map(p => ({
                versao: String(p.versao),
                data: typeof p.data === "string" ? p.data : "",
                titulo: typeof p.titulo === "string" ? p.titulo : "",
                itens: Array.isArray(p.itens) ? p.itens.map(i => String(i)) : []
            }))
            .sort((a, b) => (b.data || "").localeCompare(a.data || ""));
    } catch {
        return [];
    }
}

// ------------------------------------------------------------- formatação

function escapaHtml(texto) {
    return String(texto)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formataTamanho(bytes) {
    if (bytes >= 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + " MB";
    if (bytes >= 1024) return Math.round(bytes / 1024) + " KB";
    return bytes + " B";
}

function formataData(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
    if (!m) return iso || "";
    return `${m[3]}/${m[2]}/${m[1]}`;
}

// ------------------------------------------------------------------ página

function cartao({ icone, nome, descricao, instrucao, arquivo, url, aviso }) {
    const corpo = arquivo
        ? `<p class="card-meta">${escapaHtml(arquivo.nome)} &middot; ${formataTamanho(arquivo.tamanho)}</p>
           ${aviso ? `<p class="card-aviso">&#9888; ${escapaHtml(aviso)}</p>` : ""}
           <a class="botao" href="${url}">&#8595; Baixar</a>`
        : `<p class="card-meta card-vazio">${instrucao}</p>`;
    return `<section class="card">
        <div class="card-icone"><img src="${icone}" alt=""></div>
        <div class="card-corpo">
            <h2>${nome}</h2>
            <p class="card-desc">${descricao}</p>
            ${corpo}
        </div>
    </section>`;
}

function blocoPatchNotes(patches) {
    if (!patches.length) {
        return `<p class="vazio">Nenhum patch note publicado ainda &mdash; edite o arquivo <code>patchnotes.json</code> para criar o primeiro.</p>`;
    }
    return patches.map(p => {
        const titulo = p.titulo ? `<span class="patch-titulo">${escapaHtml(p.titulo)}</span>` : "";
        const itens = p.itens.map(i => `<li>${escapaHtml(i)}</li>`).join("");
        return `<article class="patch">
            <header class="patch-cab">
                <strong>v${escapaHtml(p.versao)}</strong> ${titulo}
                <time>${escapaHtml(formataData(p.data))}</time>
            </header>
            ${itens ? `<ul>${itens}</ul>` : ""}
        </article>`;
    }).join("");
}

function pagina() {
    const { win, apk } = achaInstaladores();
    const patches = carregaPatchNotes();
    const versaoPkg = (() => {
        try { return JSON.parse(fs.readFileSync(path.join(RAIZ, "package.json"), "utf8")).version || "?"; }
        catch { return "?"; }
    })();

    const cartaoWin = cartao({
        icone: "/imagens/hud/bau-aventura.svg",
        nome: "Windows",
        descricao: "Instalador do jogo para PC (Windows 10/11, 64 bits).",
        instrucao: "Ainda não há instalador. Rode <b>npm run build:pc</b> na pasta do projeto e recarregue esta página.",
        arquivo: win,
        url: "/download/win"
    });
    const cartaoApk = cartao({
        icone: "/imagens/hud/bau-dourado.svg",
        nome: "Android",
        descricao: "APK do jogo para celular e tablet.",
        instrucao: "Ainda não há APK. Rode <b>npm run android:release</b> na pasta do projeto e recarregue esta página.",
        arquivo: apk,
        url: "/download/apk",
        aviso: apk && apk.nome.toLowerCase().includes("unsigned")
            ? "Este APK ainda não foi assinado — o Android pode bloquear a instalação. Gere a release com keystore (npm run android:release) para os amigos instalarem sem problema."
            : ""
    });

    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>TAPeira &mdash; baixe o jogo</title>
<style>
    /* visual do jogo: fundo da caverna + véu escuro, painéis dos modais,
       botões btn-Padrao e títulos azuis — igual ao TAPeira de verdade */
    :root {
        --azul-titulo:#9ccfff;
        --texto:#e6edf3;
        --suave:#aab6c6;
        --borda:rgba(255,255,255,.08);
        --painel:linear-gradient(145deg,#1a2230,#10161f);
        --painel-cab:linear-gradient(145deg,#2d3a52,#1d2738);
    }
    * { box-sizing:border-box; }
    body {
        margin:0; padding:24px 16px 48px; min-height:100vh;
        font-family:'Segoe UI',Roboto,sans-serif; font-weight:bold; color:var(--texto);
        text-shadow:1px 1px 2px rgba(0,0,0,.8);
        background-color:#0a0d12;
        background-image:
            linear-gradient(rgba(0,0,0,.45), rgba(0,0,0,.65)),
            url("/imagens/fundos/background%20cristal.png");
        background-size:cover; background-position:center;
        background-repeat:no-repeat; background-attachment:fixed;
    }
    main { max-width:760px; margin:0 auto; }
    .topo { text-align:center; margin-bottom:30px; }
    .topo .titulo { display:flex; align-items:center; justify-content:center; gap:16px; }
    .topo .titulo img { height:64px; filter:drop-shadow(0 0 16px rgba(156,207,255,.45)) drop-shadow(0 4px 6px rgba(0,0,0,.6)); }
    .topo h1 { margin:0; font-size:2.5rem; letter-spacing:.12em; text-shadow:0 0 22px rgba(156,207,255,.35), 2px 2px 3px rgba(0,0,0,.9); }
    .topo p { margin:10px 0 0; color:var(--suave); }
    .topo .versao {
        display:inline-block; margin-top:12px; padding:.25em 1.1em; font-size:.8rem; color:var(--suave);
        background:linear-gradient(to bottom,#333a49,#1b1f2a); border:1px solid #46506a; border-radius:999px;
        box-shadow:0 2px 0 #10131b, inset 0 1px rgba(255,255,255,.06); text-shadow:none;
    }
    .card {
        display:flex; gap:18px; align-items:center; margin:16px 0; padding:18px 22px;
        background:var(--painel); border:1px solid var(--borda); border-radius:12px;
        box-shadow:0 8px 22px rgba(0,0,0,.5);
    }
    .card-icone img { height:58px; filter:drop-shadow(0 4px 7px rgba(0,0,0,.65)); }
    .card-corpo { flex:1; min-width:0; }
    .card h2 { margin:0 0 2px; font-size:1.2rem; color:var(--azul-titulo); text-shadow:0 0 10px rgba(156,207,255,.25), 1px 1px 2px rgba(0,0,0,.8); }
    .card-desc { margin:0 0 6px; color:var(--suave); font-size:.9rem; }
    .card-meta { margin:0 0 10px; font-size:.8rem; color:var(--suave); word-break:break-all; }
    .card-aviso { margin:-4px 0 10px; font-size:.8rem; color:#e8b45c; line-height:1.5; }
    .card-vazio { line-height:1.5; }
    .botao {
        display:inline-block; padding:.45em 1.4em; border-radius:8px; text-decoration:none;
        font-weight:700; color:#fff; text-align:center; text-shadow:0 1px 2px rgba(0,0,0,.8);
        background:linear-gradient(to bottom,#333a49,#1b1f2a); border:1px solid #46506a;
        box-shadow:0 3px 0 #10131b, 0 6px 14px rgba(0,0,0,.35), inset 0 1px rgba(255,255,255,.06);
        transition:transform .14s ease, box-shadow .14s ease, background .14s ease, border-color .14s ease;
    }
    .botao:hover {
        background:linear-gradient(to bottom,#414a5f,#2b3040); border-color:#5c6a8c; transform:translateY(-1px);
        box-shadow:0 4px 0 #10131b, 0 8px 18px rgba(0,0,0,.4), 0 0 14px rgba(120,160,255,.18), inset 0 1px rgba(255,255,255,.08);
    }
    .botao:active { transform:translateY(1px); box-shadow:0 1px 0 #10131b, 0 3px 8px rgba(0,0,0,.35), inset 0 1px rgba(255,255,255,.05); }
    h3.secao {
        margin:36px 0 12px; font-size:1.25rem; font-weight:800; color:var(--azul-titulo);
        display:flex; align-items:center; gap:10px;
        text-shadow:0 0 12px rgba(156,207,255,.35), 1px 1px 2px rgba(0,0,0,.8);
    }
    h3.secao img { height:1.5em; filter:drop-shadow(0 2px 4px rgba(0,0,0,.6)); }
    .patch {
        background:var(--painel); border:1px solid var(--borda); border-radius:12px;
        margin:12px 0; overflow:hidden; box-shadow:0 8px 22px rgba(0,0,0,.5);
    }
    .patch-cab {
        display:flex; flex-wrap:wrap; gap:10px; align-items:baseline; padding:10px 18px;
        background:var(--painel-cab); border-bottom:1px solid var(--borda);
    }
    .patch-cab strong { color:var(--azul-titulo); font-weight:800; }
    .patch-cab time { margin-left:auto; color:var(--suave); font-size:.8rem; }
    .patch-titulo { color:var(--texto); }
    .patch ul { margin:12px 18px 14px 36px; color:var(--suave); }
    .patch li { margin:5px 0; }
    .aviso {
        margin-top:30px; padding:14px 18px; background:var(--painel); border:1px solid var(--borda);
        border-radius:12px; color:var(--suave); font-size:.85rem; line-height:1.7; box-shadow:0 8px 22px rgba(0,0,0,.5);
    }
    .aviso b { color:var(--texto); }
    .aviso code { color:var(--azul-titulo); }
    .vazio { color:var(--suave); }
    footer {
        margin-top:32px; text-align:center; color:var(--suave); font-size:.75rem;
        display:flex; align-items:center; justify-content:center; gap:8px; flex-wrap:wrap;
    }
    footer img { height:1.3em; filter:drop-shadow(0 2px 3px rgba(0,0,0,.6)); }
    @media (max-width:560px) {
        .card { flex-direction:column; text-align:center; }
        .topo h1 { font-size:2rem; }
    }
</style>
</head>
<body>
<main>
    <div class="topo">
        <div class="titulo">
            <img src="/imagens/hud/bau-aventura.svg" alt="">
            <h1>TAPeira</h1>
        </div>
        <p>Uma aventura sob a montanha &mdash; baixe o jogo aqui</p>
        <span class="versao">versão ${escapaHtml(versaoPkg)}</span>
    </div>
    ${cartaoWin}
    ${cartaoApk}
    <h3 class="secao"><img src="/imagens/hud/esmeralda-recompensa.svg" alt="">Novidades (patch notes)</h3>
    ${blocoPatchNotes(patches)}
    <div class="aviso">
        <b>Windows:</b> o app é novo e não tem certificado, então o SmartScreen pode avisar &mdash; clique em <b>Mais informações &rsaquo; Executar mesmo assim</b>.<br>
        <b>Android:</b> ao instalar o APK, aceite a permissão de "fontes desconhecidas" quando o celular perguntar.<br>
        Cada IP pode baixar até <b>${DOWNLOADS_POR_HORA} arquivos por hora</b> (para não derrubar o servidor).<br>
        Os links valem enquanto este computador estiver ligado. Dúvidas? Combinem no Discord.
    </div>
    <footer>
        <img src="/imagens/itens/moedas.png" alt="">
        hospedado carinhosamente no PC do Tapeira &middot; recarregue a página para ver as versões mais novas
        <img src="/imagens/itens/moedas.png" alt="">
    </footer>
</main>
</body>
</html>`;
}

// --------------------------------------------------------------- imagens
// O site serve imagens do jogo (fundo da caverna, baús dos cards, ícones) —
// e SÓ imagens: a rota é restrita à pasta imagens/ e a extensões de imagem.

const MIME_IMAGENS = {
    ".png": "image/png", ".svg": "image/svg+xml", ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif",
    ".ico": "image/x-icon"
};

function serveImagem(req, res, rota) {
    let relativo;
    try { relativo = decodeURIComponent(rota); } catch { res.writeHead(400); res.end(); return; }
    const mime = MIME_IMAGENS[path.extname(relativo).toLowerCase()];
    const completo = path.resolve(RAIZ, "." + relativo.split("/").join(path.sep));
    const dirImagens = path.join(RAIZ, "imagens") + path.sep;
    if (!mime || !completo.startsWith(dirImagens)) {
        res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("acesso negado");
        return;
    }
    let st;
    try { st = fs.statSync(completo); } catch { st = null; }
    if (!st || !st.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        res.end("imagem nao encontrada");
        return;
    }
    res.writeHead(200, { "Content-Type": mime, "Content-Length": st.size, "Cache-Control": "public, max-age=300" });
    if (req.method === "HEAD") { res.end(); return; }
    fs.createReadStream(completo).on("error", () => res.destroy()).pipe(res);
}

// ------------------------------------------------------- limite de downloads
// Protege a sua banda: cada IP pode baixar no máximo DOWNLOADS_POR_HORA
// arquivos por hora (janela deslizante; a contagem zera ao reiniciar o site).
// Atrás do túnel do Cloudflare o IP real do visitante vem no cabeçalho
// X-Forwarded-For; na rede local usa o IP direto da conexão.
// Ajuste: DOWNLOADS_POR_HORA=10 npm run compartilhar
const DOWNLOADS_POR_HORA = Number(process.env.DOWNLOADS_POR_HORA || 6);
const JANELA_DOWNLOAD_MS = 60 * 60 * 1000;
const MAX_IPS_RASTREADOS = 5000;
const downloadsPorIp = new Map(); // ip -> [instantes dos downloads]

function ipReal(req) {
    const encaminhado = req.headers["x-forwarded-for"];
    if (typeof encaminhado === "string" && encaminhado.trim()) return encaminhado.split(",")[0].trim();
    return req.socket.remoteAddress || "desconhecido";
}

function downloadPermitido(ip) {
    const agora = Date.now();
    let tempos = downloadsPorIp.get(ip);
    if (!tempos) return true;
    tempos = tempos.filter(t => agora - t < JANELA_DOWNLOAD_MS);
    if (tempos.length) downloadsPorIp.set(ip, tempos); else downloadsPorIp.delete(ip);
    return tempos.length < DOWNLOADS_POR_HORA;
}

function registraDownload(ip) {
    const agora = Date.now();
    let tempos = downloadsPorIp.get(ip);
    if (!tempos) {
        if (downloadsPorIp.size >= MAX_IPS_RASTREADOS) {
            // estourou o mapa: descarta o IP com o download mais antigo
            let antigo = null;
            for (const [chave, lista] of downloadsPorIp) {
                if (!antigo || lista[0] < downloadsPorIp.get(antigo)[0]) antigo = chave;
            }
            if (antigo) downloadsPorIp.delete(antigo);
        }
        tempos = [];
        downloadsPorIp.set(ip, tempos);
    }
    tempos.push(agora);
}

function esperaDownloadMs(ip) {
    const tempos = downloadsPorIp.get(ip);
    if (!tempos || !tempos.length) return 0;
    return Math.max(0, JANELA_DOWNLOAD_MS - (Date.now() - tempos[0]));
}

function trataDownload(req, res, { arquivo, instrucao, rotulo }) {
    if (!arquivo) {
        paginaAviso(res, rotulo + " ainda não gerado", instrucao, 404);
        return;
    }
    if (req.method === "GET") {
        const ip = ipReal(req);
        if (!downloadPermitido(ip)) {
            const minutos = Math.max(1, Math.ceil(esperaDownloadMs(ip) / 60000));
            paginaAviso(res, "Limite de downloads atingido",
                `Este IP já baixou <b>${DOWNLOADS_POR_HORA}</b> arquivos na última hora, ` +
                `para não sobrecarregar o servidor. Tente de novo em <b>${minutos} min</b>.`, 429);
            console.log(`[download] BLOQUEADO ${rotulo} por ${ip} (limite ${DOWNLOADS_POR_HORA}/hora)`);
            return;
        }
        registraDownload(ip);
        console.log(`[download] ${rotulo} (${arquivo.nome}) para ${ip}`);
    }
    enviaArquivo(req, res, arquivo);
}

// ------------------------------------------------------------------ rotas

function enviaArquivo(req, res, arquivo) {
    res.writeHead(200, {
        "Content-Type": "application/octet-stream",
        "Content-Length": arquivo.tamanho,
        "Content-Disposition": `attachment; filename="${arquivo.nome.replace(/["\\]/g, "")}"`,
        "Cache-Control": "no-store"
    });
    if (req.method === "HEAD") { res.end(); return; }
    const fluxo = fs.createReadStream(arquivo.completo);
    fluxo.on("error", () => res.destroy());
    fluxo.pipe(res);
}

function paginaAviso(res, titulo, texto, status) {
    const html = `<!DOCTYPE html><html lang="pt-BR"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1"><title>${escapaHtml(titulo)}</title>
<style>body{font-family:system-ui,sans-serif;background:#120c1a;color:#e9e0f5;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center}div{max-width:420px;padding:24px}h1{color:#b973ff}p{color:#a594bd;line-height:1.6}</style>
</head><body><div><h1>${escapaHtml(titulo)}</h1><p>${texto}</p></div></body></html>`;
    res.writeHead(status, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
    res.end(html);
}

function trataRequisicao(req, res) {
    const url = new URL(req.url, "http://localhost");
    const rota = url.pathname.replace(/\/+$/, "") || "/";

    if (rota === "/" && (req.method === "GET" || req.method === "HEAD")) {
        const html = pagina();
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" });
        if (req.method === "HEAD") { res.end(); return; }
        res.end(html);
        return;
    }

    if (rota === "/favicon.ico") {
        try {
            const dados = fs.readFileSync(ARQ_ICONE);
            res.writeHead(200, { "Content-Type": "image/x-icon", "Cache-Control": "no-store" });
            res.end(dados);
        } catch {
            res.writeHead(404); res.end();
        }
        return;
    }

    if (rota.startsWith("/imagens/") && (req.method === "GET" || req.method === "HEAD")) {
        serveImagem(req, res, rota);
        return;
    }

    if (rota === "/download/win" && (req.method === "GET" || req.method === "HEAD")) {
        trataDownload(req, res, {
            arquivo: achaInstaladores().win,
            instrucao: "Rode <b>npm run build:pc</b> na pasta do projeto e recarregue esta página.",
            rotulo: "Instalador do Windows"
        });
        return;
    }

    if (rota === "/download/apk" && (req.method === "GET" || req.method === "HEAD")) {
        trataDownload(req, res, {
            arquivo: achaInstaladores().apk,
            instrucao: "Rode <b>npm run android:release</b> na pasta do projeto e recarregue esta página.",
            rotulo: "APK do Android"
        });
        return;
    }

    paginaAviso(res, "Página não encontrada",
        "Este site só serve a página inicial e os instaladores do TAPeira.", 404);
}

// ------------------------------------------------------- rede local + túnel

function ipsLocais() {
    const ips = [];
    for (const itens of Object.values(os.networkInterfaces())) {
        for (const item of itens || []) {
            if ((item.family === "IPv4" || item.family === 4) && !item.internal) ips.push(item.address);
        }
    }
    return ips;
}

function achaCloudflared() {
    if (fs.existsSync(CLOUDFLARED_RAIZ)) return CLOUDFLARED_RAIZ;
    const comando = process.platform === "win32" ? "where cloudflared" : "which cloudflared";
    try {
        const saida = execSync(comando, { encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
        if (saida) return saida.split(/\r?\n/)[0];
    } catch { /* não encontrado */ }
    return null;
}

let procTunel = null;

function iniciaTunel(porta) {
    if (process.env.SEM_TUNEL === "1") return;
    const exe = achaCloudflared();
    if (!exe) {
        console.log("");
        console.log("Túnel da internet NÃO iniciado (cloudflared não encontrado).");
        console.log("Para os amigos baixarem de fora da sua rede:");
        console.log("  1) Baixe: https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe");
        console.log("  2) Salve como cloudflared.exe na pasta do projeto");
        console.log("  3) Rode `npm run compartilhar` de novo — o site imprime a URL pública sozinho.");
        return;
    }
    procTunel = spawn(exe, ["tunnel", "--url", `http://localhost:${porta}`], { stdio: ["ignore", "ignore", "pipe"] });
    let buffer = "";
    let imprimiuUrl = false;
    procTunel.stderr.on("data", dados => {
        buffer += dados.toString();
        const m = buffer.match(/https:\/\/[a-z0-9-]+\.trycloudflare\.com/);
        if (m && !imprimiuUrl) {
            imprimiuUrl = true;
            console.log("");
            console.log("============================================================");
            console.log("  LINK PUBLICO (compartilhe com os amigos):");
            console.log("  " + m[0]);
            console.log("  Obs.: a URL muda quando voce reinicia o site.");
            console.log("============================================================");
        }
        const linha = dados.toString().split(/\r?\n/).find(l => /error|failed|ERR/i.test(l));
        if (linha) console.log("[tunel] " + linha.trim());
    });
    procTunel.on("error", erro => console.log("Nao consegui rodar o cloudflared: " + erro.message));
    procTunel.on("exit", () => { procTunel = null; });
}

// ------------------------------------------------------------------- boot

function sobeServidor(porta, tentativa) {
    const servidor = http.createServer(trataRequisicao);
    servidor.on("error", erro => {
        if (erro.code === "EADDRINUSE" && tentativa < 5) {
            console.log(`Porta ${porta} ocupada, tentando ${porta + 1}...`);
            sobeServidor(porta + 1, tentativa + 1);
        } else {
            console.error("Erro ao subir o site:", erro.message);
            process.exit(1);
        }
    });
    servidor.listen(porta, () => {
        console.log("============================================================");
        console.log("  Site do TAPeira rodando!");
        console.log("============================================================");
        console.log(`  Na sua rede local:   http://${ipsLocais()[0] || "localhost"}:${porta}`);
        for (const ip of ipsLocais().slice(1)) console.log(`                       http://${ip}:${porta}`);
        console.log(`  Na sua maquina:      http://localhost:${porta}`);
        console.log("  (para parar: Ctrl+C no terminal)");
        iniciaTunel(porta);
    });
    return servidor;
}

function encerraTudo() {
    console.log("\nEncerrando site e túnel...");
    if (procTunel) { try { procTunel.kill(); } catch { /* já morreu */ } }
    process.exit(0);
}
process.on("SIGINT", encerraTudo);
process.on("SIGTERM", encerraTudo);

if (!Number.isInteger(PORTA_BASE) || PORTA_BASE < 1 || PORTA_BASE > 65535) {
    console.error("Porta inválida:", process.argv[2]);
    process.exit(1);
}
sobeServidor(PORTA_BASE, 0);
