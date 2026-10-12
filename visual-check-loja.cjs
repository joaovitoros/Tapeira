#!/usr/bin/env node
// Verificador visual do OVERLAY DA LOJA (TAPeira) — Playwright headless.
//
// Complementa visual-check.cjs (rodapé). Valida o novo modelo da loja:
//   - a loja é um overlay centralizado (painel <= 1300x850) terminando ACIMA
//     da faixa inferior (navegação + habilidades), sem sobrepô-la;
//   - ABRIR/FECHAR a loja NÃO reposiciona as habilidades nem encolhe os
//     botões (mudança de script/ui-rodape.js — a loja virou overlay puro);
//   - o painel fica dentro da tela em todos os breakpoints.
// Salva um PNG por tamanho (com a loja aberta) em visual-shots-loja/.
//
// USO: node visual-check-loja.cjs [WxH ...]   (sem args = todos os VIEWPORTS)

const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");

const VIEWPORTS = [
  [1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 720],
  [1100, 800], [1024, 768], [900, 520], [800, 480], [768, 1024],
  [740, 400], [600, 900], [480, 800], [400, 740], [390, 844],
  [360, 640], [320, 568]
];

// Estado base: fecha modais, desbloqueia as skills (pior caso de largura da
// fileira) e mostra o log. Roda ANTES de abrir a loja — a posição das skills
// medida aqui é a "referência" (sem loja).
const SETUP = `
  document.querySelectorAll('#infoModal, #gameModal, .modal').forEach(m => m.remove());
  document.querySelectorAll('#infoModal').forEach(m => m.remove());
  if (typeof maxAndar !== 'undefined') {
    maxAndar = 100;
    CarregaHabilidadesDesbloqueadas(false);
    AtualizaHabilidadesCombate();
    UI.removeSkill();
    UI.spawnSkill();
  }
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

const ABRE_LOJA = `
  if (typeof LojaGold === 'function') { LojaGold(); }
  else { document.getElementById('btn-Loja').click(); }
  if (typeof UIRodape !== 'undefined') UIRodape.Atualiza();
`;

const caixa = el => {
  const r = el.getBoundingClientRect();
  return {
    top: Math.round(r.top), bottom: Math.round(r.bottom),
    left: Math.round(r.left), right: Math.round(r.right),
    w: Math.round(r.width), h: Math.round(r.height)
  };
};

const visivel = el => {
  if (!el) return false;
  if (el.hidden) return false;
  if (getComputedStyle(el).visibility === "hidden") return false;
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0;
};

const cruza = (a, b, folga) => a.left < b.right - folga && a.right > b.left + folga
  && a.top < b.bottom - folga && a.bottom > b.top + folga;

const MEDIR = () => {
  const visivelEl = el => {
    if (!el || el.hidden) return false;
    if (getComputedStyle(el).visibility === "hidden") return false;
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  };
  const caixaEl = el => {
    const r = el.getBoundingClientRect();
    return {
      top: Math.round(r.top), bottom: Math.round(r.bottom),
      left: Math.round(r.left), right: Math.round(r.right),
      w: Math.round(r.width), h: Math.round(r.height)
    };
  };
  const p = ["Loja", "LojaEsm", "LojaCM"].map(id => document.getElementById(id)).find(visivelEl);
  const painel = p ? caixaEl(p) : null;
  const opcoes = visivelEl(document.getElementById("container-opcoes"))
    ? caixaEl(document.getElementById("container-opcoes")) : null;
  const habilidades = visivelEl(document.getElementById("container-Habilidades"))
    ? caixaEl(document.getElementById("container-Habilidades")) : null;
  const botoes = visivelEl(document.getElementById("container-Botoes"))
    ? caixaEl(document.getElementById("container-Botoes")) : null;
  return {
    painel, opcoes, habilidades, botoes,
    vw: document.documentElement.clientWidth,
    vh: document.documentElement.clientHeight,
    painelZ: p ? (parseInt(getComputedStyle(p.parentElement).zIndex, 10) || 0) : 0,
    habZ: (() => {
      const h = document.getElementById("container-Habilidades");
      return h ? (parseInt(getComputedStyle(h).zIndex, 10) || 0) : 0;
    })()
  };
};

(async () => {
  const argv = process.argv.slice(2);
  const alvos = argv.length ? argv.map(a => a.split("x").map(Number)) : VIEWPORTS;

  const raiz = __dirname;
  const html = fs.existsSync(path.join(raiz, "Caverna.html"))
    ? path.join(raiz, "Caverna.html")
    : path.resolve(raiz, "..", "Caverna.html");
  const shots = path.join(raiz, "visual-shots-loja");
  fs.mkdirSync(shots, { recursive: true });

  const browser = await chromium.launch();
  let falhasTotais = 0;

  for (const [w, h] of alvos) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    const erros = [];
    page.on("pageerror", e => {
      if (!/play\(\) failed/.test(e.message)) erros.push(e.message);
    });
    await page.goto("file://" + html);
    await page.waitForFunction(() => window.andar !== undefined, null, { timeout: 20000 });

    // 1) estado sem loja: referência da posição das skills
    await page.evaluate("(() => {" + SETUP + "})()");
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
    const antes = await page.evaluate(() => {
        const visivelEl = el => {
            if (!el || el.hidden) return false;
            if (getComputedStyle(el).visibility === "hidden") return false;
            const r = el.getBoundingClientRect();
            return r.width > 0 && r.height > 0;
        };
        const caixaEl = el => {
            const r = el.getBoundingClientRect();
            return {
                top: Math.round(r.top), bottom: Math.round(r.bottom),
                left: Math.round(r.left), right: Math.round(r.right),
                w: Math.round(r.width), h: Math.round(r.height)
            };
        };
        const h = document.getElementById("container-Habilidades");
        const b = document.getElementById("container-Botoes");
        return {
            habilidades: visivelEl(h) ? caixaEl(h) : null,
            botoes: visivelEl(b) ? caixaEl(b) : null
        };
    });

    // 2) abre a loja e espera o fade (160ms) + um frame
    await page.evaluate("(() => {" + ABRE_LOJA + "})()");
    await page.waitForTimeout(300);
    await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));

    // 3) mede com a loja aberta
    const m = await page.evaluate(MEDIR);
    await page.screenshot({ path: path.join(shots, w + "x" + h + ".png") });

    console.log("\n=== " + w + "x" + h + " ===");
    const falhas = [];

    if (!m.painel) {
      falhas.push("painel da loja não está visível");
    } else {
      const p = m.painel;
      if (p.left < 0 || p.top < 0 || p.right > m.vw || p.bottom > m.vh) {
        falhas.push("painel fora da tela: [" + p.left + "," + p.top + " " + p.right + "," + p.bottom + "]");
      }
      if (p.w > 1300.5 || p.h > 850.5) {
        falhas.push("painel acima do teto 1300x850: " + p.w + "x" + p.h);
      }
      if (m.opcoes && cruza(p, m.opcoes, 1)) {
        falhas.push("painel sobrepõe #container-opcoes: " +
          JSON.stringify(p) + " x " + JSON.stringify(m.opcoes));
      }
      if (m.opcoes && p.bottom > m.opcoes.top + 1) {
        falhas.push("painel termina abaixo da navegação (bottom " + p.bottom +
          " > opcoes.top " + m.opcoes.top + ")");
      }
    }

    // 4) a loja NÃO pode movimentar as habilidades nem encolher os botões
    if (!antes.habilidades || !m.habilidades) {
      falhas.push("fileira de habilidades invisível antes/depois (antes=" +
        JSON.stringify(antes.habilidades) + " depois=" + JSON.stringify(m.habilidades) + ")");
    } else {
      const d = (a, b) => Math.abs(a - b);
      if (d(antes.habilidades.top, m.habilidades.top) > 1
        || d(antes.habilidades.left, m.habilidades.left) > 1
        || d(antes.habilidades.w, m.habilidades.w) > 1) {
        falhas.push("loja moveu as habilidades antes=" +
          JSON.stringify(antes.habilidades) + " depois=" + JSON.stringify(m.habilidades));
      }
    }
    if (!antes.botoes || !m.botoes) {
      falhas.push("fileira de botões invisível antes/depois");
    } else {
      const d = (a, b) => Math.abs(a - b);
      if (d(antes.botoes.top, m.botoes.top) > 1
        || d(antes.botoes.left, m.botoes.left) > 1
        || d(antes.botoes.w, m.botoes.w) > 1) {
        falhas.push("loja moveu os botões antes=" +
          JSON.stringify(antes.botoes) + " depois=" + JSON.stringify(m.botoes));
      }
    }

    if (erros.length) {
      falhas.push("ERRO JS: " + erros.join(" | "));
    }

    for (const f of falhas) { falhasTotais++; console.log("  FAIL " + f); }
    console.log("  " + (falhas.length ? falhas.length + " falha(s)" : "ok") + " (painel " +
      (m.painel ? m.painel.w + "x" + m.painel.h : "—") + ")");
    await ctx.close();
  }

  await browser.close();
  console.log("\n" + alvos.length + " viewports, " + falhasTotais + " falha(s). " +
    "Screenshots em " + path.relative(process.cwd(), shots) + "/");
  process.exit(falhasTotais ? 1 : 0);
})();