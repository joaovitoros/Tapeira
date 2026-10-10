// ===================== BUNDLE MINIFICADO (www) =========================
// Concatena os scripts de cada página NA ORDEM do script-manifest.js e
// minifica com esbuild — SEM renomear identificadores (o jogo acessa globais
// por string, ex.: window["vidaInimigo"+i]; renomear quebraria).
// Gera www/script/bundle-<pagina>.js e troca o bloco marcado no www HTML.
// Roda como parte de `npm run prepare:web` (o HTML-fonte continua com os
// scripts individuais para dev e para a suíte de regressão).

const fs = require("fs");
const path = require("path");
const esbuild = require("esbuild");
const manifest = require("./script-manifest.js");

const raiz = path.resolve(__dirname, "..");
const webRoot = path.join(raiz, "www");

for (const [arquivo, scripts] of Object.entries(manifest)) {
    const codigo = scripts.map(s => fs.readFileSync(path.join(raiz, s), "utf8")).join("\n;\n");
    const { code } = esbuild.transformSync(codigo, {
        minifyWhitespace: true,
        minifySyntax: true,
        minifyIdentifiers: false,
        legalComments: "none",
        charset: "utf8"
    });

    const nomeBundle = "script/bundle-" + path.basename(arquivo, ".html").toLowerCase() + ".js";
    fs.writeFileSync(path.join(webRoot, nomeBundle), code);

    const destino = path.join(webRoot, arquivo);
    let html = fs.readFileSync(destino, "utf8");
    const eol = html.includes("\r\n") ? "\r\n" : "\n";
    const bloco = `\t<!-- scripts:start (bundle gerado por scripts/prepare-bundle.js) -->${eol}`
        + `\t<script src="${nomeBundle}"></script>${eol}`
        + `\t<!-- scripts:end -->`;
    const marcadores = /[ \t]*<!-- scripts:start[\s\S]*?<!-- scripts:end -->/;
    if (!marcadores.test(html)) throw new Error("marcadores de scripts não encontrados em www/" + arquivo);
    html = html.replace(marcadores, bloco);
    fs.writeFileSync(destino, html);

    console.log("bundle: www/" + nomeBundle + " (" + (code.length / 1024).toFixed(0) + " KB, " + scripts.length + " scripts)");
}
