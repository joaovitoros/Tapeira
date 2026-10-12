#!/usr/bin/env node
/*
 * Servidor dos CARTÕES DE BATALHA (PvP) do TAPeira.
 *
 * Guarda os cartões em `cartoes/` (um JSON por cartão) e expõe uma API simples:
 *   GET  /api/cartoes            -> lista (id, nome, nivel, dps, criadoEm)
 *   POST /api/cartoes            -> sobe um cartão (valida o básico e o id)
 *   GET  /api/cartoes/:id        -> cartão completo (JSON)
 *   GET  /api/status             -> { ok, total }
 *
 * Porta: 8101 (ou PORTA / argv[2]).
 *
 * SEGURANÇA: a "assinatura" do cartão é feita no cliente (serve pra pegar edição
 * boba, não é anti-cheat de verdade). Aqui só validamos a estrutura e limitamos
 * a taxa de envio. Não exponha isso como verdade absoluta.
 */
"use strict";

const http = require("http");
const fs = require("fs");
const path = require("path");

const RAIZ = path.resolve(__dirname, "..");
const PORTA = Number(process.argv[2] || process.env.PORTA || 8101);
const DIR_CARTOES = path.join(RAIZ, "cartoes");
const LIMITE_POR_MINUTO = Number(process.env.LIMITE || 30);

fs.mkdirSync(DIR_CARTOES, { recursive: true });

// ---------------------------------------------------------------- utilidades

function responderJson(res, status, corpo) {
    const texto = JSON.stringify(corpo);
    res.writeHead(status, {
        "Content-Type": "application/json; charset=utf-8",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Cache-Control": "no-store"
    });
    res.end(texto);
}

function lerCorpo(req, limite = 64 * 1024) {
    return new Promise((resolve, reject) => {
        let dados = "", tamanho = 0;
        req.on("data", pedaco => {
            tamanho += pedaco.length;
            if (tamanho > limite) { reject(new Error("corpo grande demais")); req.destroy(); return; }
            dados += pedaco;
        });
        req.on("end", () => resolve(dados));
        req.on("error", reject);
    });
}

// validação leve (o cliente já assina; aqui barra lixo estrutural)
function validaCartao(cartao) {
    if (!cartao || typeof cartao !== "object" || Array.isArray(cartao)) return "não é um objeto";
    if (cartao.saveFormat !== "tapeira-cartao-batalha") return "formato desconhecido";
    if (typeof cartao.id !== "string" || !/^[0-9a-f]{32}$/.test(cartao.id)) return "id inválido";
    for (const campo of ["danoGolpe", "danoCrit", "chanceCrit", "dpsCompanheiro", "taxaAtaque", "seed"]) {
        if (!Number.isFinite(cartao[campo]) || cartao[campo] < 0) return "campo " + campo + " inválido";
    }
    if (cartao.danoGolpe <= 0 || cartao.taxaAtaque <= 0 || cartao.chanceCrit > 1) return "valores de ataque inválidos";
    if (cartao.nome !== undefined && (typeof cartao.nome !== "string" || !cartao.nome.trim())) return "nome inválido";
    return null;
}

function resumo(cartao) {
    const golpeMedio = cartao.danoGolpe * (1 - cartao.chanceCrit) + cartao.danoCrit * cartao.chanceCrit;
    const dps = cartao.taxaAtaque * golpeMedio + (cartao.dpsCompanheiro || 0);
    return {
        id: cartao.id,
        nome: cartao.nome || "Tapeira",
        nivel: cartao.nivel || 1,
        dps: Math.round(dps * 100) / 100,
        criadoEm: cartao.exportedAt || null,
        aparencia: cartao.aparencia || null
    };
}

// ---------------------------------------------------------------- rate limit

const acessos = new Map(); // ip -> { n, ate }
function permitido(ip) {
    const agora = Date.now();
    let a = acessos.get(ip);
    if (!a || agora > a.ate) { a = { n: 0, ate: agora + 60000 }; acessos.set(ip, a); }
    a.n++;
    if (acessos.size > 500) acessos.clear();
    return a.n <= LIMITE_POR_MINUTO;
}

// ---------------------------------------------------------------- servidor

const servidor = http.createServer(async (req, res) => {
    const url = new URL(req.url, "http://x");
    const caminho = url.pathname;

    if (req.method === "OPTIONS") { responderJson(res, 204, {}); return; }

    if (caminho === "/api/status") {
        const total = fs.readdirSync(DIR_CARTOES).filter(n => n.endsWith(".json")).length;
        responderJson(res, 200, { ok: true, total, limitePorMinuto: LIMITE_POR_MINUTO });
        return;
    }

    if (caminho === "/api/cartoes" && req.method === "GET") {
        const arquivos = fs.readdirSync(DIR_CARTOES).filter(n => n.endsWith(".json"));
        const lista = [];
        for (const arq of arquivos) {
            try {
                const c = JSON.parse(fs.readFileSync(path.join(DIR_CARTOES, arq), "utf8"));
                lista.push(resumo(c));
            } catch { /* ignora arquivo corrompido */ }
        }
        lista.sort((a, b) => String(b.criadoEm || "").localeCompare(String(a.criadoEm || "")));
        responderJson(res, 200, { ok: true, total: lista.length, cartoes: lista.slice(0, 60) });
        return;
    }

    if (caminho === "/api/cartoes" && req.method === "POST") {
        const ip = (req.headers["x-forwarded-for"] || req.socket.remoteAddress || "?").split(",")[0].trim();
        if (!permitido(ip)) { responderJson(res, 429, { ok: false, erro: "Muitos envios. Espere um pouco." }); return; }
        let cartao;
        try {
            cartao = JSON.parse(await lerCorpo(req));
        } catch {
            responderJson(res, 400, { ok: false, erro: "JSON inválido." });
            return;
        }
        const problema = validaCartao(cartao);
        if (problema) { responderJson(res, 400, { ok: false, erro: "Cartão inválido: " + problema }); return; }
        const destino = path.join(DIR_CARTOES, cartao.id + ".json");
        const jaTinha = fs.existsSync(destino);
        if (!jaTinha) fs.writeFileSync(destino, JSON.stringify(cartao));
        responderJson(res, 200, { ok: true, id: cartao.id, jaExistia: jaTinha });
        return;
    }

    const m = /^\/api\/cartoes\/([0-9a-f]{32})(?:\.json)?$/.exec(caminho);
    if (m && req.method === "GET") {
        const destino = path.join(DIR_CARTOES, m[1] + ".json");
        if (!fs.existsSync(destino)) { responderJson(res, 404, { ok: false, erro: "Cartão não encontrado." }); return; }
        res.writeHead(200, {
            "Content-Type": "application/json; charset=utf-8",
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "no-store"
        });
        fs.createReadStream(destino).pipe(res);
        return;
    }

    responderJson(res, 404, { ok: false, erro: "Rota não encontrada." });
});

servidor.listen(PORTA, () => {
    console.log("Servidor de cartões do TAPeira na porta " + PORTA);
    console.log("  cartões em: " + DIR_CARTOES);
    console.log("  API: /api/cartoes (GET lista, POST sobe), /api/cartoes/:id, /api/status");
});
