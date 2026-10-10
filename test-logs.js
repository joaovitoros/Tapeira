// Teste focado: remoção da caixa "Infos" e tela de Logs (histórico das
// mensagens, últimos 500, sem o dano crítico de combate) acessível pelo
// botão no fim do menu de configuração. Segue o padrão dos testes
// existentes: Playwright abrindo o jogo preparado (www/Caverna.html).
// Execute depois de `npm run prepare:web`:  node test-logs.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const errosDePagina = [];
  page.on('pageerror', erro => {
    // pré-existente e fora do escopo: spawnEnemies() toca audio1 no load sem
    // gesto do usuário e ChamaSom não trata a rejeição da promise de play()
    if (/play\(\) failed because the user didn't interact/.test(erro.message)) return;
    errosDePagina.push(erro.message);
  });

  const filePath = path.resolve(__dirname, 'www', 'Caverna.html');
  await page.goto(`file://${filePath}`);
  await page.waitForSelector('.player', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => window.andar !== undefined, { timeout: 10000 });

  const resultados = await page.evaluate(() => {
    const resultados = [];
    const check = (nome, ok, detalhe) =>
      resultados.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

    try {
      const L = window.Tapeira && window.Tapeira.Logs;

      // ---- API encapsulada (AGENTS.md: sem novos globais) ----
      check("API window.Tapeira.Logs existe", L);
      check("sem global Logs solto", typeof window.Logs === "undefined");

      // ---- caixa Infos fora da tela ----
      check("caixa Infos removida do DOM",
        !document.getElementById("container-Infos") && !document.getElementById("Infos"));

      // ---- registro normal ----
      L.limpa();
      UI.showInfo("Mensagem de teste um");
      check("showInfo registra no histórico",
        L.contagem() === 1 && L.pegaLista()[0].texto === "Mensagem de teste um");
      check("entrada tem hora HH:MM:SS",
        /^\d{2}:\d{2}:\d{2}$/.test(L.pegaLista()[0].hora));

      // ---- filtro do dano crítico de combate ----
      UI.showInfo("Dano critico de: 1234");
      check("dano crítico de combate não vai para o log", L.contagem() === 1, L.contagem());
      UI.showInfo("Conquista desbloqueada!\nVoce recebeu um bonus de dano critico");
      check("conquista sobre dano crítico continua no log", L.contagem() === 2, L.contagem());

      // ---- vazio e caminho legado ----
      UI.showInfo("   ");
      check("mensagem vazia não registra", L.contagem() === 2, L.contagem());
      MostraInfo("via MostraInfo legado");
      check("MostraInfo legado registra", L.contagem() === 3, L.contagem());

      // ---- limite de 500 ----
      L.limpa();
      for (let i = 1; i <= 600; i++) L.adiciona("log " + i);
      const lista = L.pegaLista();
      check("limite de 500 entradas", L.contagem() === 500 && L.LIMITE === 500, L.contagem());
      check("mais antigos saem, mais recentes ficam",
        lista[0].texto === "log 101" && lista[499].texto === "log 600",
        lista[0].texto + " / " + lista[499].texto);

      // ---- botão no fim do menu de configuração ----
      const config = document.getElementById("container-SalvaCarrega");
      const btn = document.getElementById("btnLogs");
      check("botão Logs existe na configuração", !!btn && !!config && config.contains(btn));
      check("botão Logs é o último bloco do menu",
        !!config && !!config.lastElementChild && config.lastElementChild.contains(btn));

      // ---- tela de logs via clique real no botão ----
      L.limpa();
      UI.showInfo("primeira");
      UI.showInfo('<img src="x" id="__pwned" onerror="window.__pwned=1">');
      UI.showInfo("última");
      btn.click();
      const modal = document.getElementById("gameModal");
      check("clique no botão abre a tela de Logs",
        !!modal && modal.style.display === "flex"
        && document.getElementById("gameModalTitle").textContent === "Logs");
      const linhas = [...document.querySelectorAll("#gameModalBody .logs-linha")];
      check("tela lista as 3 entradas", linhas.length === 3, linhas.length);
      check("mais recente aparece primeiro",
        !!linhas[0] && linhas[0].textContent.includes("última")
        && !!linhas[2] && linhas[2].textContent.includes("primeira"));
      check("mensagem com HTML vira texto puro (sem injeção)",
        !document.querySelector("#gameModalBody img")
        && typeof window.__pwned === "undefined"
        && linhas.some(l => l.textContent.includes("<img src=")));
      UI.closeModal();

      // ---- estado vazio ----
      L.limpa();
      UI.showLogs();
      check("sem logs mostra aviso de vazio",
        !!document.querySelector("#gameModalBody .logs-vazio"));
      UI.closeModal();
      check("limpa() zera o histórico", L.contagem() === 0);
    } catch (e) {
      check("exceção no teste", false, (e && e.stack) || e);
    }
    return resultados;
  });

  let falhas = 0;
  for (const r of resultados) {
    console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.nome}${r.detalhe ? " — " + r.detalhe : ""}`);
    if (!r.ok) falhas++;
  }
  for (const erro of errosDePagina) {
    console.log(`FAIL  erro de página: ${erro}`);
    falhas++;
  }
  console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram.`);
  await browser.close();
  process.exit(falhas > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
