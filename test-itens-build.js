// Teste focado: itens de build (desbloqueio no andar 100, baú a cada 5
// andares, acúmulo por cópia, troca na build cheia, save/reset e API
// encapsulada em window.Tapeira.ItensBuild). Segue o padrão dos testes
// existentes: Playwright abrindo o jogo preparado (www/Caverna.html).
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

      // ---- baú: cadência a cada 5 andares ----
      IB.limpa();
      window.andar = 4;
      IB.tentaBau();
      check("sem baú no andar 4 (múltiplo de 5 obrigatório)", !document.getElementById("bauBuild"));
      window.andar = 5;
      IB.tentaBau();
      check("baú no andar 5 com selo",
        !!document.getElementById("bauBuild") && !!document.getElementById("bauBuild-selo"));
      check("bauBuildPendente vira true", IB.pendente() === true);
      IB.tentaBau(); // mesmo andar de novo
      check("sem baú duplicado", document.querySelectorAll("#bauBuild").length === 1);
      window.andar = 10; // pendente: marcador seguinte não gera outro
      IB.tentaBau();
      check("pendente bloqueia novo baú no andar 10", document.querySelectorAll("#bauBuild").length === 1);
      RemoveBau(); // baú comum não pode sumir com o de build
      check("RemoveBau() não remove o baú de build", !!document.getElementById("bauBuild"));

      // ---- escolha: fluxo normal e empilhamento ----
      IB.abreEscolha();
      const modal = document.getElementById("modalItensBuild");
      check("modal abre com 3 cartões",
        !!modal && modal.querySelectorAll("[data-item]").length === 3);
      const imgsCartao = modal ? [...modal.querySelectorAll(".item-build-cartao img")] : [];
      await Promise.all(imgsCartao.map(i => i.decode().catch(() => {})));
      check("ícones dos cartões carregam",
        imgsCartao.length === 3 && imgsCartao.every(i => i.complete && i.naturalWidth > 0));
      UI.fechaEscolhaItensBuild();
      IB.escolhe("adaga", null);
      check("escolha normal entra na build",
        IB.contagem() === 1 && IB.pendente() === false && IB.pegaLista()[0] === "adaga");
      check("baú e modal somem após escolher",
        !document.getElementById("bauBuild") && !document.getElementById("modalItensBuild"));
      IB.carrega({ itensBuild: ["adaga"], bauBuildPendente: true });
      UI.spawnBauBuild();
      IB.escolhe("adaga", null); // mesma cópia de novo
      check("item repetido acumula (2 cópias)",
        IB.contagem() === 2 && IB.copias("adaga") === 2);

      // ---- build cheia: limite e troca ----
      IB.carrega({
        itensBuild: ["adaga", "moedas", "mapa", "relogio", "grimorio"],
        bauBuildPendente: true
      });
      check("build cheia com 5", IB.contagem() === 5 && IB.LIMITE === 5);
      IB.escolhe("esmeralda", null); // sem slot: não pode entrar
      check("sem slot na build cheia não entra nem limpa o pendente",
        IB.contagem() === 5 && IB.pendente() === true
        && IB.pegaLista().join(",") === "adaga,moedas,mapa,relogio,grimorio");
      IB.escolhe("esmeralda", 1); // troca o slot 1 (moedas)
      check("troca substitui o slot certo",
        IB.contagem() === 5 && IB.pegaLista()[1] === "esmeralda" && IB.pendente() === false);

      // ---- save: round-trip e save antigo ----
      IB.carrega({ itensBuild: ["moedas", "moedas"], bauBuildPendente: true });
      const serializado = IB.serializa();
      check("serializa() devolve os campos do save",
        JSON.stringify(serializado.itensBuild) === '["moedas","moedas"]'
        && serializado.bauBuildPendente === true);
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

      // ---- reset limpa estado e DOM ----
      UI.spawnBauBuild();
      Resetar();
      check("reset limpa itens, pendente e o baú da tela",
        IB.contagem() === 0 && IB.pendente() === false
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
