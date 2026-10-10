// Teste focado: itens de build (desbloqueio no andar 100, baú a cada 10
// andares com acúmulo de marcos, acúmulo por cópia, "não escolher" que
// consome o baú, troca na build cheia, tela de leitura no Status,
// save/reset e API encapsulada em window.Tapeira.ItensBuild). Segue o
// padrão dos testes existentes: Playwright abrindo o jogo preparado
// (www/Caverna.html).
// Execute depois de `npm run prepare:web`:  node test-itens-build.js
const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

(async () => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  const filePath = path.resolve(__dirname, 'www', 'Caverna.html');
  await page.goto(`file://${filePath}`);
  await page.waitForSelector('.player', { state: 'visible', timeout: 10000 });
  await page.waitForFunction(() => window.andar !== undefined, { timeout: 10000 });

  const resultados = await page.evaluate(async () => {
    const resultados = [];
    const check = (nome, ok, detalhe) =>
      resultados.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
    const arredonda = v => Math.round(v * 10000) / 10000;
    const IB = window.Tapeira && window.Tapeira.ItensBuild;

    try {
      // ---- API encapsulada (AGENTS.md: sem novos globais) ----
      check("API window.Tapeira.ItensBuild existe", IB);
      check("sem globais novos (itensBuild/bauBuildPendente/functions)",
        typeof window.itensBuild === "undefined"
        && typeof window.bauBuildPendente === "undefined"
        && typeof window.TentaBauBuild === "undefined"
        && typeof window.EscolheItemBuild === "undefined");

      // ---- pool ----
      check("pool com 12 itens", IB && IB.POOL.length === 12, IB && IB.POOL.length);
      const ids = IB.POOL.map(i => i.id);
      check("ids únicos", new Set(ids).size === ids.length);
      check("todos os ids resolvem item()", ids.every(id => IB.item(id) && IB.item(id).nome && IB.item(id).icone));
      check("item desconhecido retorna null", IB.item("naoExiste") === null);

      // ---- desbloqueio (andar 100) ----
      const maxAndarOriginal = window.maxAndar;
      IB.limpa();
      window.maxAndar = 99;
      check("andar 99 não desbloqueia", IB.desbloqueada() === false);
      window.maxAndar = 100;
      check("andar 100 desbloqueia", IB.desbloqueada() === true);
      window.maxAndar = maxAndarOriginal;

      // ---- multiplicadores ----
      IB.limpa();
      const todos = ["multDano", "multGuardiao", "multGold", "multEvento", "multFuga",
        "multXP", "multChanceCrit", "multDanoCrit", "multDanoAuto", "multDanoComp",
        "multBau", "multEsmBau"];
      check("sem itens todos os multiplicadores valem 1",
        todos.every(m => IB[m]() === 1));
      window.maxAndar = 100;
      IB.carrega({ itensBuild: ["adaga"], bauBuildPendente: false });
      check("1 cópia de adaga: dano ×1,15", arredonda(IB.multDano()) === 1.15, arredonda(IB.multDano()));
      IB.carrega({ itensBuild: ["adaga", "adaga"], bauBuildPendente: false });
      check("2 cópias de adaga: dano ×1,3225", arredonda(IB.multDano()) === 1.3225, arredonda(IB.multDano()));
      check("copias() conta por id", IB.copias("adaga") === 2 && IB.copias("moedas") === 0);

      // ---- baú: cadência a cada 10 andares (marcos acumulam) ----
      IB.limpa();
      UI.removeBauBuild();
      window.maxAndar = 100;
      window.andar = 4;
      IB.tentaBau();
      check("sem baú no andar 4 (múltiplo de 10 obrigatório)", !document.getElementById("bauBuild"));
      window.andar = 5;
      IB.tentaBau();
      check("sem baú no andar 5 (agora é a cada 10 andares)",
        !document.getElementById("bauBuild") && IB.quantidadeBausPendentes() === 0);
      window.andar = 10;
      IB.tentaBau();
      check("baú no andar 10 com selo",
        !!document.getElementById("bauBuild")
        && document.getElementById("bauBuild-selo")?.textContent === "ITENS");
      check("bauBuildPendente vira true", IB.pendente() === true);
      window.andar = 20; // marco seguinte acumula com o que estava pendente
      IB.tentaBau();
      check("marco seguinte acumula outro baú (selo ×2)",
        IB.quantidadeBausPendentes() === 2
        && document.getElementById("bauBuild-selo")?.textContent === "ITENS ×2"
        && document.getElementById("bauBuild")?.getAttribute("aria-label") === "Abrir 2 baús de itens da build");
      RemoveBau(); // baú comum não pode sumir com o de build
      check("RemoveBau() não remove o baú de build", !!document.getElementById("bauBuild"));

      // ---- escolha: fluxo normal e empilhamento (opções fixas no save) ----
      IB.carrega({
        itensBuild: [],
        bausBuildPendentes: 2,
        bauBuildPendente: true,
        opcoesBauBuild: ["adaga", "moedas", "mapa"]
      });
      UI.spawnBauBuild();
      IB.abreEscolha();
      const modal = document.getElementById("modalItensBuild");
      check("modal abre exatamente com as 3 opções do save",
        !!modal
        && [...modal.querySelectorAll("[data-item]")].map(b => b.getAttribute("data-item")).join(",")
          === "adaga,moedas,mapa");
      UI.showMilestone("Aviso de teste", "não deve ficar visível sobre o modal");
      check("baú, selo e milestone ficam escondidos atrás da tela",
        document.body.classList.contains("itens-build-tela-aberta")
        && getComputedStyle(document.getElementById("bauBuild")).visibility === "hidden"
        && getComputedStyle(document.getElementById("bauBuild-selo")).visibility === "hidden"
        && getComputedStyle(document.getElementById("gameMilestone")).visibility === "hidden");
      const imgsCartao = modal ? [...modal.querySelectorAll(".item-build-cartao img")] : [];
      await Promise.all(imgsCartao.map(i => i.decode().catch(() => {})));
      check("ícones dos cartões carregam",
        imgsCartao.length === 3 && imgsCartao.every(i => i.complete && i.naturalWidth > 0));
      UI.fechaEscolhaItensBuild(); // fechar sem consumir mantém as opções sorteadas
      IB.abreEscolha();
      check("reabrir mantém as mesmas opções",
        [...document.querySelectorAll("#modalItensBuild [data-item]")].map(b => b.getAttribute("data-item")).join(",")
          === "adaga,moedas,mapa");
      IB.escolhe("pocaoRubra", null); // id fora das opções atuais do baú
      check("id fora das opções do baú é ignorado",
        IB.contagem() === 0 && IB.quantidadeBausPendentes() === 2
        && !!document.getElementById("modalItensBuild"));
      IB.escolhe("adaga", null);
      check("escolha normal entra na build e consome 1 baú",
        IB.contagem() === 1 && IB.quantidadeBausPendentes() === 1 && IB.pegaLista()[0] === "adaga");
      check("modal fecha e o baú restante continua na tela",
        !document.getElementById("modalItensBuild")
        && !!document.getElementById("bauBuild")
        && document.getElementById("bauBuild-selo")?.textContent === "ITENS");
      check("fechar a escolha devolve baú, selo e milestone à tela",
        !document.body.classList.contains("itens-build-tela-aberta")
        && getComputedStyle(document.getElementById("bauBuild")).visibility === "visible"
        && getComputedStyle(document.getElementById("gameMilestone")).visibility === "visible");
      IB.carrega({
        itensBuild: ["adaga"],
        bausBuildPendentes: 1,
        bauBuildPendente: true,
        opcoesBauBuild: ["adaga", "pocaoRubra", "lanterna"]
      });
      UI.spawnBauBuild();
      IB.escolhe("adaga", null); // mesma cópia de novo
      check("item repetido acumula (2 cópias)",
        IB.contagem() === 2 && IB.copias("adaga") === 2 && IB.quantidadeBausPendentes() === 0);
      check("sem baú quando não sobra pendente", !document.getElementById("bauBuild"));

      // ---- ignorar ("não escolher nenhum item") consome o baú ----
      IB.carrega({
        itensBuild: ["adaga"],
        bausBuildPendentes: 2,
        bauBuildPendente: true,
        opcoesBauBuild: ["moedas", "mapa", "relogio"]
      });
      UI.spawnBauBuild();
      IB.abreEscolha();
      document.querySelector("[data-item-build-skip]").click();
      check("ignorar consome 1 baú e fecha o modal",
        IB.quantidadeBausPendentes() === 1 && !document.getElementById("modalItensBuild"));
      check("baú restante continua na tela (selo ITENS)",
        !!document.getElementById("bauBuild")
        && document.getElementById("bauBuild-selo")?.textContent === "ITENS");
      check("ignorar zera as opções sorteadas", IB.serializa().opcoesBauBuild === null);
      IB.abreEscolha();
      const opcoesNovas = [...document.querySelectorAll("#modalItensBuild [data-item]")]
        .map(b => b.getAttribute("data-item"));
      check("próximo baú sortea 3 opções distintas",
        opcoesNovas.length === 3 && new Set(opcoesNovas).size === 3);
      document.querySelector("[data-item-build-skip]").click();
      check("último baú ignorado some da tela",
        IB.quantidadeBausPendentes() === 0
        && !document.getElementById("bauBuild") && !document.getElementById("bauBuild-selo"));

      // ---- build cheia: limite e troca ----
      IB.carrega({
        itensBuild: ["adaga", "moedas", "mapa", "relogio", "grimorio"],
        bausBuildPendentes: 1,
        bauBuildPendente: true,
        opcoesBauBuild: ["esmeralda", "escudo", "lanterna"]
      });
      UI.spawnBauBuild();
      check("build cheia com 5", IB.contagem() === 5 && IB.LIMITE === 5);
      IB.escolhe("moedas", null); // id fora das opções atuais: não pode entrar
      check("id fora das opções não entra (build intacta)",
        IB.contagem() === 5 && IB.quantidadeBausPendentes() === 1
        && IB.pegaLista().join(",") === "adaga,moedas,mapa,relogio,grimorio");
      IB.escolhe("esmeralda", null); // build cheia sem slot: o modal precisa escolher
      check("build cheia sem slot não entra nem consome o baú",
        IB.contagem() === 5 && IB.quantidadeBausPendentes() === 1
        && IB.pegaLista().join(",") === "adaga,moedas,mapa,relogio,grimorio");
      IB.escolhe("esmeralda", 1); // troca o slot 1 (moedas)
      check("troca substitui o slot certo e consome o baú",
        IB.contagem() === 5 && IB.pegaLista()[1] === "esmeralda" && IB.quantidadeBausPendentes() === 0);

      // ---- save: round-trip e save antigo ----
      IB.carrega({ itensBuild: ["moedas", "moedas"], bauBuildPendente: true });
      const serializado = IB.serializa();
      check("serializa() devolve os campos do save",
        JSON.stringify(serializado.itensBuild) === '["moedas","moedas"]'
        && serializado.bauBuildPendente === true
        && serializado.bausBuildPendentes === 1);
      IB.carrega({}); // save antigo sem os campos
      check("save antigo (sem campos) nasce vazio",
        IB.contagem() === 0 && IB.pendente() === false);
      IB.carrega({ itensBuild: ["adaga", "idInvalido", "moedas"], bauBuildPendente: true });
      check("id desconhecido é ignorado no load",
        IB.pegaLista().join(",") === "adaga,moedas" && IB.pendente() === true);
      IB.carrega({
        itensBuild: ["adaga", "escudo", "moedas", "mapa", "relogio", "grimorio"],
        bauBuildPendente: false
      });
      check("load com 6 ids é cortado no limite", IB.contagem() === 5);
      IB.carrega({ bausBuildPendentes: 2, bauBuildPendente: true, opcoesBauBuild: ["adaga", "moedas"] });
      check("opções inválidas no save são descartadas",
        IB.quantidadeBausPendentes() === 2 && IB.serializa().opcoesBauBuild === null);

      // ---- validação do save (ValidarSave) ----
      // valida o round-trip JSON, que é exatamente o que o Carregar recebe
      // do disco (undefined é descartado pelo stringify)
      const saveValido = JSON.parse(JSON.stringify(CriarObjetoSave()));
      let validou = true;
      let msgValidacao = "";
      try { ValidarSave(saveValido); } catch (e) { validou = false; msgValidacao = e.message; }
      check("ValidarSave aceita o save criado", validou, msgValidacao);
      let rejeitouInvalido = false;
      try { ValidarSave({ ...saveValido, itensBuild: ["idInvalido"] }); }
      catch (e) { rejeitouInvalido = true; }
      check("ValidarSave rejeita id de item inválido", rejeitouInvalido);
      let rejeitouExcesso = false;
      try { ValidarSave({ ...saveValido, itensBuild: ["adaga", "escudo", "moedas", "mapa", "relogio", "grimorio"] }); }
      catch (e) { rejeitouExcesso = true; }
      check("ValidarSave rejeita build acima do limite", rejeitouExcesso);

      // ---- Status ----
      IB.carrega({ itensBuild: ["adaga", "adaga"], bauBuildPendente: false });
      UI.showStatus();
      const temLinha = [...document.querySelectorAll("#StatusBody tr")]
        .some(tr => tr.textContent.includes("Itens da build")
          && tr.textContent.includes("Adaga Sombria ×2"));
      check("Status mostra a build com cópias", temLinha);

      // ---- tela de leitura dos itens da build (botão no painel Status) ----
      IB.carrega({ itensBuild: ["adaga", "adaga", "moedas"], bausBuildPendentes: 0, bauBuildPendente: false });
      const botaoTela = document.getElementById("btnVerItensBuild");
      check("botão Ver itens da build existe no painel Status",
        !!botaoTela && document.getElementById("DivStatus").contains(botaoTela));
      botaoTela.click();
      const tela = document.getElementById("modalItensBuildView");
      check("tela abre com um cartão por slot (3)",
        !!tela && tela.querySelectorAll(".item-build-cartao").length === 3);
      check("tela de leitura também marca o estado (esconde avisos do baú)",
        document.body.classList.contains("itens-build-tela-aberta"));
      check("tela mostra nome, efeito e resumo com cópias",
        !!tela && tela.textContent.includes("Adaga Sombria")
        && tela.textContent.includes("+15% de dano")
        && tela.textContent.includes("Adaga Sombria ×2"));
      tela.click(); // clique no fundo (fora do conteúdo) fecha
      check("clique fora fecha a tela",
        !document.getElementById("modalItensBuildView")
        && !document.body.classList.contains("itens-build-tela-aberta"));
      IB.limpa();
      botaoTela.click();
      check("build vazia mostra aviso de vazio",
        !!document.querySelector("#modalItensBuildView .logs-vazio"));
      document.getElementById("modalItensBuildView").remove();
      const maxAndarAntes = window.maxAndar;
      window.maxAndar = 99;
      botaoTela.click();
      check("sem desbloqueio avisa o andar 100",
        (document.querySelector("#modalItensBuildView")?.textContent || "").includes("andar 100"));
      document.getElementById("modalItensBuildView").remove();
      window.maxAndar = maxAndarAntes;

      // ---- reset limpa estado e DOM ----
      IB.carrega({
        itensBuild: ["adaga"],
        bausBuildPendentes: 2,
        bauBuildPendente: true,
        opcoesBauBuild: ["moedas", "mapa", "relogio"]
      });
      UI.spawnBauBuild();
      Resetar();
      check("reset limpa itens, baús, opções e o ícone da tela",
        IB.contagem() === 0 && IB.quantidadeBausPendentes() === 0
        && IB.serializa().opcoesBauBuild === null
        && !document.getElementById("bauBuild") && !document.getElementById("bauBuild-selo"));
    } catch (e) {
      check("exceção no teste", false, e && e.stack || e);
    }
    return resultados;
  });

  // ícones presentes no disco (recortes da grade)
  const caminhos = await page.evaluate(() => window.Tapeira.ItensBuild.POOL.map(i => i.icone));
  for (const caminho of caminhos) {
    resultados.push({
      nome: `ícone existe: ${caminho}`,
      ok: fs.existsSync(path.resolve(__dirname, caminho)),
      detalhe: ""
    });
  }

  let falhas = 0;
  for (const r of resultados) {
    console.log(`${r.ok ? "OK  " : "FAIL"}  ${r.nome}${r.detalhe ? " — " + r.detalhe : ""}`);
    if (!r.ok) falhas++;
  }
  console.log(`\n${resultados.length - falhas}/${resultados.length} verificações passaram.`);
  await browser.close();
  process.exit(falhas > 0 ? 1 : 0);
})().catch(e => { console.error(e); process.exit(1); });
