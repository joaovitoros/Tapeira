// ===================== GERADOR DO BLOCO DE SCRIPTS =====================
// Escreve, a partir de scripts/script-manifest.js, os <script> do <head> das
// páginas entre os marcadores <!-- scripts:start --> e <!-- scripts:end -->.
// Rode: npm run sync:scripts
//
// Na primeira execução (sem marcadores) ele envolve a sequência existente de
// <script src="script/..."> com os marcadores; depois, só regenera o miolo.

const fs = require("fs");
const path = require("path");
const manifest = require("./script-manifest.js");

const raiz = path.resolve(__dirname, "..");
const INICIO = "<!-- scripts:start (gerado por scripts/sync-scripts.js; npm run sync:scripts) -->";
const FIM = "<!-- scripts:end -->";

function eolDominante(texto) {
    const crlf = (texto.match(/\r\n/g) || []).length;
    const lf = (texto.match(/(?<!\r)\n/g) || []).length;
    return crlf >= lf ? "\r\n" : "\n";
}

for (const [arquivo, scripts] of Object.entries(manifest)) {
    const caminho = path.join(raiz, arquivo);
    let html = fs.readFileSync(caminho, "utf8");
    const eol = eolDominante(html);
    const linhas = scripts.map(s => `\t<script src="${s}"></script>`).join(eol);
    const bloco = `\t${INICIO}${eol}${linhas}${eol}\t${FIM}`;

    const comMarcadores = /[ \t]*<!-- scripts:start[\s\S]*?<!-- scripts:end -->/;
    const semMarcadores = /(\t<script src="script\/[^"]+"><\/script>)(?:\r?\n\t<script src="script\/[^"]+"><\/script>)+/;

    if (comMarcadores.test(html)) {
        html = html.replace(comMarcadores, bloco);
    } else if (semMarcadores.test(html)) {
        html = html.replace(semMarcadores, bloco);
    } else {
        throw new Error("Não encontrei o bloco de <script> em " + arquivo);
    }
    fs.writeFileSync(caminho, html);
    console.log("ok: " + arquivo + " (" + scripts.length + " scripts)");
}
