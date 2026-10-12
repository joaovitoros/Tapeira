#!/usr/bin/env node
/*
 * Proxy do TAPeira — junta TUDO num link só (e é ele que vai pro túnel).
 *
 *   /            -> SITE (builds + patch notes)            [porta 8100]
 *   /download/*  -> SITE (baixar .exe / .apk)              [porta 8100]
 *   /api/*       -> DADOS DO JOGO (cartões de batalha)     [porta 8101]
 *   /api/versao  -> versão atual + links de download       (aqui mesmo)
 *   /jogo/*      -> o JOGO (www/)                          (aqui mesmo)
 *
 * Ele SOBE o site e o servidor de cartões sozinho (processos filhos) e derruba
 * tudo quando você fecha.
 *
 * Porta: 8000 (ou PORTA / argv[2]).
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const RAIZ = path.resolve(__dirname, "..");
const PORTA = Number(process.argv[2] || process.env.PORTA || 8000);
const PORTA_SITE = Number(process.env.PORTA_SITE || 8100);
const PORTA_CARTOES = Number(process.env.PORTA_CARTOES || 8101);
const DIR_WWW = path.join(RAIZ, "www");
const ARQ_PATCHNOTES = path.join(RAIZ, "patchnotes.json");
const DIR_WIN = path.join(RAIZ, "dist", "pc");
const DIR_APK_RELEASE = path.join(RAIZ, "android", "app", "build", "outputs", "apk", "release");
const DIR_APK_DEBUG = path.join(RAIZ, "android", "app", "build", "outputs", "apk", "debug");

// ------------------------------------------------------------ filhos (site/cartões)

const filhos = [];
function sobe(rotulo, script, porta, envExtra) {
    const p = spawn(process.execPath, [path.join(__dirname, script), String(porta)], {
        cwd: RAIZ,
        env: Object.assign({}, process.env, envExtra || {}),
        stdio: ["ignore", "pipe", "pipe"]
    });
    p.stdout.on("data", d => process.stdout.write("[" + rotulo + "] " + d));
    p.stderr.on("data", d => process.stderr.write("[" + rotulo + "!] " + d));
    p.on("exit", c => console.log("[" + rotulo + "] saiu (codigo " + c + ")"));
    filhos.push(p);
    return p;
}

function derrubaFilhos() {
    for (const f of filhos) { try { f.kill(); } catch { /* ok */ } }
}
process.on("exit", derrubaFilhos);
process.on("SIGINT", () => { derrubaFilhos(); process.exit(0); });
process.on("SIGTERM", () => { derrubaFilhos(); process.exit(0); });

// ------------------------------------------------------------ versão

function achaMaisRecente(dir, filtro) {
    try {
        return fs.readdirSync(dir).filter(filtro)
            .map(n => ({ nome: n, mtime: fs.statSync(path.join(dir, n)).mtimeMs }))
            .sort((a, b) => b.mtime - a.mtime)[0] || null;
    } catch { return null; }
}

function infoVersao() {
    let versao = "0.0.0", titulo = "", notas = [];
    try {
        const pn = JSON.parse(fs.readFileSync(ARQ_PATCHNOTES, "utf8"));
        const patches = (pn.patches || []).filter(p => p && typeof p.versao === "string" && p.versao);
        patches.sort((a, b) => String(b.data || "").localeCompare(String(a.data || "")));
        if (patches[0]) {
            versao = patches[0].versao;
            titulo = patches[0].titulo || "";
            notas = Array.isArray(patches[0].itens) ? patches[0].itens : [];
        }
    } catch { /* sem patchnotes */ }
    const win = achaMaisRecente(DIR_WIN, n => n.toLowerCase().endsWith(".exe") && !n.toLowerCase().includes("unins"));
    const apk = achaMaisRecente(DIR_APK_RELEASE, n => n.toLowerCase().endsWith(".apk") && !n.toLowerCase().includes("unsigned"))
        || achaMaisRecente(DIR_APK_DEBUG, n => n.toLowerCase().endsWith(".apk"));
    return {
        versao, titulo, notas,
        download: {
            pc: win ? "/download/win" : null,
            android: apk ? "/download/apk" : null
        },
        builds: { pc: win ? win.nome : null, android: apk ? apk.nome : null }
    };
}

// ------------------------------------------------------------ estáticos do jogo

const MIMES = {
    ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8",
    ".css": "text/css; charset=utf-8", ".json": "application/json; charset=utf-8",
    ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".gif": "image/gif",
    ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon",
    ".woff2": "font/woff2", ".woff": "font/woff", ".ttf": "font/ttf",
    ".mp3": "audio/mpeg", ".ogg": "audio/ogg", ".wav": "audio/wav", ".mp4": "video/mp4"
};

function serveJogo(req, res, caminho) {
    let rel = caminho.replace(/^\/jogo\/?/, "");
    if (rel === "" || rel.endsWith("/")) rel += "index.html";
    const destino = path.normalize(path.join(DIR_WWW, rel));
    if (!destino.startsWith(DIR_WWW)) { res.writeHead(403).end(); return; }
    fs.stat(destino, (erro, st) => {
        if (erro || !st.isFile()) { res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" }); res.end("404"); return; }
        res.writeHead(200, { "Content-Type": MIMES[path.extname(destino).toLowerCase()] || "application/octet-stream" });
        if (req.method === "HEAD") { res.end(); return; }
        fs.createReadStream(destino).pipe(res);
    });
}

// ------------------------------------------------------------ proxy simples

function encaminha(req, res, porta, caminho) {
    const opcoes = {
        hostname: "127.0.0.1",
        port: porta,
        path: caminho,
        method: req.method,
        headers: Object.assign({}, req.headers, { host: "127.0.0.1:" + porta })
    };
    const prox = http.request(opcoes, resp => {
        res.writeHead(resp.statusCode || 502, resp.headers);
        resp.pipe(res);
    });
    prox.on("error", () => { res.writeHead(502, { "Content-Type": "text/plain; charset=utf-8" }); res.end("Servidor interno fora do ar."); });
    req.pipe(prox);
}

// ------------------------------------------------------------ servidor

const servidor = http.createServer((req, res) => {
    const url = new URL(req.url, "http://x");
    const caminho = url.pathname;

    if (caminho === "/api/versao") {
        const corpo = JSON.stringify(infoVersao());
        res.writeHead(200, { "Content-Type": "application/json; charset=utf-8", "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" });
        res.end(corpo);
        return;
    }
    if (caminho.startsWith("/api/")) { encaminha(req, res, PORTA_CARTOES, req.url); return; }
    // /jogo sem a barra no fim quebra os caminhos relativos -> redireciona
    if (caminho === "/jogo") { res.writeHead(301, { Location: "/jogo/" }); res.end(); return; }
    if (caminho.startsWith("/jogo/")) { serveJogo(req, res, caminho); return; }
    encaminha(req, res, PORTA_SITE, req.url);   // site (e /download/*)
});

sobe("site", "site-compartilhamento.js", PORTA_SITE, { SEM_TUNEL: "1" });
sobe("cartoes", "servidor-cartoes.js", PORTA_CARTOES);

servidor.listen(PORTA, () => {
    console.log("");
    console.log("============================================================");
    console.log("  TAPeira — proxy no ar (porta " + PORTA + ")");
    console.log("============================================================");
    console.log("  Site ........ /            (porta " + PORTA_SITE + ")");
    console.log("  Jogo ........ /jogo        (www)");
    console.log("  Cartoes ..... /api/cartoes (porta " + PORTA_CARTOES + ")");
    console.log("  Versao ...... /api/versao");
    console.log("");
    console.log("  Abra no navegador:  http://localhost:" + PORTA);
    console.log("  (o LINK PUBLICO vem do cloudflared apontando pra esta porta)");
    console.log("============================================================");
});
