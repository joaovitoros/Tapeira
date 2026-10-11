#!/usr/bin/env node
// Verificador visual de layout da TAPeira (Playwright, headless).
//
// O QUE FAZ: abre Caverna.html em vários tamanhos de tela, aplica um estado de
// jogo (SETUP), mede os elementos por getBoundingClientRect e confere REGRAS
// geométricas (A abaixo de B, A acima de B, sem sobreposição...). Imprime uma
// tabela PASS/FAIL, salva um PNG por tamanho e sai com código != 0 se falhar.
//
// POR QUE EXISTE: "ficou ruim" é sintoma de layout, e layout se verifica
// OLHANDO e MEDINDO — não relendo CSS. Ele pega a classe de bug mais comum
// aqui: um elemento fixo que passa por cima de outro em algum breakpoint que
// ninguém testou à mão.
//
// USO: precisa web rodando de dentro de uma cópia Windows do projeto (o
// caminho UNC \\wsl.localhost\... não é acessível ao node do Windows — veja o
// SKILL.md). Depois:
//
//   node visual-check.cjs                 # todos os VIEWPORTS
//   node visual-check.cjs 400x740 1920x900   # só alguns tamanhos
//
// ADAPTAR: mexa só nas 3 seções marcadas (VIEWPORTS, SETUP, REGRAS).

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

// ---------------------------------------------------------------- VIEWPORTS
// Todo breakpoint que o CSS trata + os extremos (menor tela, maior tela).
const VIEWPORTS = [
  [1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 720],
  [1100, 800], [1024, 768], [900, 520], [800, 480], [768, 1024],
  [740, 400], [600, 900], [480, 800], [400, 740], [390, 844],
  [360, 640], [320, 568]
];

// -------------------------------------------------------------------- SETUP
// Código rodado DENTRO da página (como string) antes de medir. Serve para
// montar o estado que o layout depende: fechar modais, desbloquear skills,
// mostrar/esconder o log, etc. Deixe o mínimo necessário.
const SETUP = `
  // fecha o "Como jogar" e modais de info que cobrem a tela
  document.querySelectorAll('#infoModal, #gameModal, .modal').forEach(m => m.remove());
  document.querySelectorAll('button').forEach(b => {
    if ((b.textContent || '').trim() === 'Fechar') b.click();
  });
  document.querySelectorAll('#infoModal').forEach(m => m.remove());
  // desbloqueia a fileira de habilidades cheia (pior caso de largura)
  if (typeof maxAndar !== 'undefined') {
    maxAndar = 100;
    CarregaHabilidadesDesbloqueadas(false);
    AtualizaHabilidadesCombate();
    UI.removeSkill();
    UI.spawnSkill();
  }
  // log visível com linhas, como no jogo real
  const log = document.getElementById('logAvisos');
  if (log) {
    const corpo = document.getElementById('logAvisosCorpo');
    corpo.replaceChildren();
    for (let i = 0; i < 3; i++) {
      const l = document.createElement('div');
      l.className = 'log-avisos__linha log-avisos__linha--marco';
      l.textContent = 'Andar ' + (i + 1) + ' desbloqueado';
      corpo.appendChild(l);
    }
    log.hidden = false;
    log.classList.remove('log-avisos--recolhido');
  }
  if (typeof UIRodape !== 'undefined') UIRodape.Atualiza();
`;

// -------------------------------------------------------------------- REGRAS
// Estado atual do rodapé: log em cima, skills no meio, botões embaixo; e a
// fileira de botões sempre horizontal, à esquerda, sem nada por cima.
//
// Tipos: "abaixo-de" | "acima-de" | "acima-ou-lado-de" | "ao-lado-de" |
//        "sem-sobreposicao" | "na-tela" | "mesma-altura"
// "acima-ou-lado-de" é o invariante de empilhamento: A está acima de B OU à
// direita de B (nunca por cima). Use quando o layout alterna entre os dois.
// Regras cujo elemento estiver invisível (hidden / display:none / tamanho 0)
// viram SKIP em vez de falha.
const REGRAS = [
  { tipo: "abaixo-de", a: "#container-Habilidades", b: "#logAvisos" },
  { tipo: "acima-ou-lado-de", a: "#container-Habilidades", b: "#container-Botoes" },
  { tipo: "sem-sobreposicao", a: "#container-Habilidades", b: "#container-Botoes" },
  { tipo: "sem-sobreposicao", a: "#container-Habilidades", b: "#logAvisos" },
  { tipo: "na-tela", a: "#container-Habilidades" },
  { tipo: "na-tela", a: "#container-Botoes" },
  { tipo: "mesma-altura", a: "#container-Botoes button" }
];

// ================================ a partir daqui não precisa mexer =========

const MEDIR = (regras) => {
  const caixaStr = c => "[" + c.left + "," + c.top + " " + c.right + "," + c.bottom + "]";
  const visivel = el => {
    if (!el) return false;
    if (el.hidden) return false;
    if (getComputedStyle(el).visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const caixa = el => {
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top), bottom: Math.round(r.bottom),
      left: Math.round(r.left), right: Math.round(r.right),
      w: Math.round(r.width), h: Math.round(r.height)
    };
  };
  const vw = document.documentElement.clientWidth;
  const vh = document.documentElement.clientHeight;
  const resultado = [];

  for (const regra of regras) {
    const nA = document.querySelectorAll(regra.a);
    const A = [...nA].filter(visivel).map(caixa);
    const B = regra.b
      ? [...document.querySelectorAll(regra.b)].filter(visivel).map(caixa)
      : null;

    if (A.length === 0 || (regra.b && (!B || B.length === 0))) {
      resultado.push({ regra, status: "SKIP", detalhe: "elemento invisível" });
      continue;
    }

    const falhas = [];
    const folga = regra.folga || 1;

    if (regra.tipo === "na-tela") {
      for (const a of A) {
        if (a.left < 0 || a.right > vw || a.top < 0 || a.bottom > vh) falhas.push(caixaStr(a));
      }
    } else if (regra.tipo === "mesma-altura") {
      const top = A[0].top;
      for (let i = 0; i < A.length; i++) {
        if (Math.abs(A[i].top - top) > folga) falhas.push("item " + i + " top=" + A[i].top + " != " + top);
        if (i > 0 && A[i].left < A[i - 1].right - folga) falhas.push("item " + i + " sobrepõe o anterior");
      }
    } else {
      for (const a of A) {
        for (const b of B) {
          if (regra.tipo === "abaixo-de" && a.top < b.bottom - folga) {
            falhas.push(caixaStr(a) + " não está abaixo de " + caixaStr(b));
          }
          if (regra.tipo === "acima-de" && a.bottom > b.top + folga) {
            falhas.push(caixaStr(a) + " não está acima de " + caixaStr(b));
          }
          if (regra.tipo === "acima-ou-lado-de" &&
            a.bottom > b.top + folga && a.left < b.right - folga) {
            falhas.push(caixaStr(a) + " não está acima nem ao lado de " + caixaStr(b));
          }
          if (regra.tipo === "ao-lado-de" && a.left < b.right - folga) {
            falhas.push(caixaStr(a) + " não está ao lado de " + caixaStr(b));
          }
          if (regra.tipo === "sem-sobreposicao") {
            const cruza = a.left < b.right - folga && a.right > b.left + folga &&
              a.top < b.bottom - folga && a.bottom > b.top + folga;
            if (cruza) falhas.push(caixaStr(a) + " sobrepõe " + caixaStr(b));
          }
        }
      }
    }
    resultado.push({
      regra,
      status: falhas.length ? "FAIL" : "PASS",
      detalhe: falhas.length ? falhas.join("; ") : "",
      a: A.map(caixaStr).join(" ")
    });
  }
  return resultado;
};

function rotulo(regra) {
  const s = regra.a + " " + regra.tipo.replace(/-/g, " ") + (regra.b ? " " + regra.b : "");
  return s.replace(/[#.]/g, "").replace(/container-/g, "");
}

(async () => {
  const argv = process.argv.slice(2);
  const alvos = argv.length
    ? argv.map(a => a.split("x").map(Number))
    : VIEWPORTS;

  const raiz = __dirname;
  const html = fs.existsSync(path.join(raiz, "Caverna.html"))
    ? path.join(raiz, "Caverna.html")
    : path.resolve(raiz, "..", "Caverna.html");
  const shots = path.join(raiz, "visual-shots");
  fs.mkdirSync(shots, { recursive: true });

  const browser = await chromium.launch();
  let falhasTotais = 0;
  let slides = 0;

  for (const [w, h] of alvos) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const erros = [];
    page.on("pageerror", e => {
      if (!/play\(\) failed/.test(e.message)) erros.push(e.message);
    });
    await page.goto("file://" + html);
    await page.waitForFunction(() => window.andar !== undefined, null, { timeout: 20000 });
    await page.evaluate("(() => {" + SETUP + "})()");
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    await page.screenshot({ path: path.join(shots, w + "x" + h + ".png") });

    const resultado = await page.evaluate(MEDIR, REGRAS);
    console.log("\n=== " + w + "x" + h + " ===");
    for (const r of resultado) {
      if (r.status === "PASS" || r.status === "SKIP") continue;
      falhasTotais++;
      console.log("  FAIL " + rotulo(r.regra) + " :: " + r.detalhe);
    }
    const fails = resultado.filter(r => r.status === "FAIL").length;
    const skips = resultado.filter(r => r.status === "SKIP").length;
    console.log("  " + (fails ? fails + " falha(s)" : "ok") +
      " (" + resultado.length + " regras, " + skips + " skip)");
    if (erros.length) { falhasTotais++; console.log("  ERRO JS: " + erros.join(" | ")); }
    await ctx.close();
    slides++;
  }

  await browser.close();
  console.log("\n" + slides + " viewports, " + falhasTotais + " falha(s). " +
    "Screenshots em " + path.relative(process.cwd(), shots) + "/");
  process.exit(falhasTotais ? 1 : 0);
})();
