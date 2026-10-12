#!/usr/bin/env node
// gerar-icone.cjs - rasteriza um template SVG (templates/*.svg) em PNG com
// FUNDO TRANSPARENTE, trocando os tokens de cor do template.
//
// Tokens do template: __CLARO__ __MEDIO__ __ESCURO__ __BRILHO__
//
// Por que Chromium: o projeto nao tem rasterizador de SVG, mas o Playwright ja
// e dependencia (testes) e o Chromium desenha SVG com antialias igual ao jogo.
//
// COMO RODAR: o Playwright precisa ser resolvido pelo node do Windows, e o
// projeto vive em caminho UNC (\\wsl.localhost\...), onde o node nao consegue
// nem carregar o script. Copie SO ESTE ARQUIVO para uma pasta Windows com
// node_modules/playwright e passe os caminhos (UNC) de template e saida:
//
//   copy .opencode\skills\icones\scripts\gerar-icone.cjs $env:TEMP\icones\
//   cd $env:TEMP\icones
//   node gerar-icone.cjs --template \\wsl.localhost\...\templates\moeda.svg `
//        --saida \\wsl.localhost\...\imagens\moeda-prata.png --esquema prata
//
// Exemplos:
//   node gerar-icone.cjs --template t.svg --saida o.png                 # ouro
//   node gerar-icone.cjs --template t.svg --saida o.png --esquema safira
//   node gerar-icone.cjs --template t.svg --saida o.png --cores "A9D4FF,4A90E2,245FA8,FFFFFF"
//   node gerar-icone.cjs --template t.svg --saida o.png --tamanho 256 --escala 2
//   # tokens extras do template (badge/fundo), e a versao sem badge:
//   node gerar-icone.cjs --template t.svg --saida o.png --token FUNDO=16211E --token BORDA=3E5C54
//   node gerar-icone.cjs --template t.svg --saida o.png --token FUNDO=none --token BORDA=none

const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");

function arg(nome, padrao) {
  const i = process.argv.indexOf(nome);
  return i >= 0 && process.argv[i + 1] ? process.argv[i + 1] : padrao;
}

const template = arg("--template");
const saida = arg("--saida");
const tamanho = Number(arg("--tamanho", "512"));
const escala = Number(arg("--escala", "1"));
const esquema = arg("--esquema", "ouro");
const coresArg = arg("--cores", "");

if (!template || !saida) {
  console.error("Uso: node gerar-icone.cjs --template <svg> --saida <png> " +
    "[--esquema <nome> | --cores \"claro,medio,escuro[,brilho]\"] [--tamanho 512] [--escala 1]");
  process.exit(1);
}

const normaliza = hex => {
  const h = String(hex).trim().replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error("cor invalida: " + hex);
  return "#" + h.toUpperCase();
};

let paleta;
const esquemas = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "paletas.json"), "utf8"));
if (coresArg) {
  const partes = coresArg.split(",").map(normaliza);
  if (partes.length < 3) throw new Error("--cores pede pelo menos claro,medio,escuro");
  paleta = partes;
} else {
  const tons = esquemas[esquema];
  if (!tons) {
    const nomes = Object.keys(esquemas).filter(k => !k.startsWith("_"));
    console.error("esquema desconhecido: " + esquema + "\nDisponiveis: " + nomes.join(", "));
    process.exit(1);
  }
  paleta = tons.map(normaliza);
}
const [claro, medio, escuro, brilho = "#FFFFFF"] = paleta;

// Tokens de cor do template. Os 4 basicos vem da paleta; os extras vem de
// --token NOME=HEX (repetivel). "none"/"transparent" passam direto, o que
// permite gerar a versao SEM fundo/badge a partir do MESMO template.
const tokens = { CLARO: claro, MEDIO: medio, ESCURO: escuro, BRILHO: brilho };
process.argv.forEach((a, i) => {
  if (a !== "--token") return;
  const [nome, valor] = (process.argv[i + 1] || "").split("=");
  if (!nome || !valor) throw new Error("--token espera NOME=HEX (ex.: --token FUNDO=16211E)");
  const v = valor.trim();
  tokens[nome.trim().toUpperCase()] = /^(none|transparent)$/i.test(v) ? v.toLowerCase() : normaliza(v);
});

const svgOriginal = fs.readFileSync(template, "utf8");
const svg = svgOriginal
  .replace(/__([A-Z0-9_]+)__/g, (m, nome) => (tokens[nome] !== undefined ? tokens[nome] : m))
  .replace(/width="512"\s+height="512"/, "");

// Token sem valor = SVG quebrado em silencio; falha alto.
const sobraram = [...new Set(svg.match(/__[A-Z0-9_]+__/g) || [])];
if (sobraram.length) {
  throw new Error("token sem valor no template: " + sobraram.join(", ") +
    " (passe --token NOME=HEX)");
}

const html = `<!doctype html><html><head><meta charset="utf-8">
<style>html,body{margin:0;padding:0;background:transparent}
svg{display:block;width:${tamanho}px;height:${tamanho}px}</style></head>
<body>${svg}</body></html>`;

(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: tamanho, height: tamanho },
    deviceScaleFactor: escala
  });
  const page = await ctx.newPage();
  await page.setContent(html, { waitUntil: "load" });
  const erros = [];
  page.on("pageerror", e => erros.push(e.message));
  await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

  const dir = path.dirname(saida);
  if (dir && !fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: saida, omitBackground: true });
  await browser.close();

  const kb = (fs.statSync(saida).size / 1024).toFixed(1);
  console.log(`ok: ${saida} (${tamanho * escala}x${tamanho * escala}, ${kb} KB)`);
  console.log(`   paleta: claro=${claro} medio=${medio} escuro=${escuro} brilho=${brilho}`);
  const extras = Object.entries(tokens).filter(([k]) => !["CLARO", "MEDIO", "ESCURO", "BRILHO"].includes(k));
  if (extras.length) console.log("   tokens extras: " + extras.map(([k, v]) => k + "=" + v).join(" "));
  if (erros.length) { console.error("erros na pagina: " + erros.join(" | ")); process.exit(1); }
})().catch(e => { console.error("falhou: " + e.message); process.exit(1); });
