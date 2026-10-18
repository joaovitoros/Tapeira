// ============================================================================
// Bateria de auditoria — eventos, progressão, telas e save.
// Complementa tests/regression.test.cjs (mecânicas) com foco em:
//   - eventos aleatórios (elegibilidade, ciclo de vida, efeitos, pausa);
//   - progressão (XP/nível, skills, perks, ramos, reset);
//   - telas (abrir/fechar cada painel, ESC, atalhos);
//   - save (round-trip e validação).
// Rode com: npm run test:auditoria
// ============================================================================
const { after, before, test } = require("node:test");
const assert = require("node:assert/strict");
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const projectRoot = path.resolve(__dirname, "..");
const contentTypes = {
    ".css": "text/css; charset=utf-8",
    ".html": "text/html; charset=utf-8",
    ".ico": "image/x-icon",
    ".js": "text/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".mp3": "audio/mpeg",
    ".png": "image/png",
    ".svg": "image/svg+xml",
    ".wav": "audio/wav",
    ".webp": "image/webp"
};

let server;
let browser;
let baseUrl;

before(async () => {
    server = http.createServer((request, response) => {
        let pathname;
        try {
            pathname = decodeURIComponent(new URL(request.url, "http://localhost").pathname);
        } catch {
            response.writeHead(400).end("Bad request");
            return;
        }
        const relativePath = pathname === "/" ? "index.html" : pathname.slice(1);
        const filePath = path.resolve(projectRoot, relativePath);
        if (!filePath.startsWith(projectRoot + path.sep)) {
            response.writeHead(403).end("Forbidden");
            return;
        }
        fs.stat(filePath, (statError, stat) => {
            if (statError || !stat.isFile()) {
                response.writeHead(404).end("Not found");
                return;
            }
            response.writeHead(200, {
                "Content-Type": contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream",
                "Cache-Control": "no-store"
            });
            fs.createReadStream(filePath).pipe(response);
        });
    });
    await new Promise((resolve, reject) => {
        server.once("error", reject);
        server.listen(0, "127.0.0.1", resolve);
    });
    baseUrl = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ headless: true, args: ["--autoplay-policy=no-user-gesture-required"] });
});

after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
});

async function openPage(url = "Caverna.html") {
    const context = await browser.newContext();
    await context.addInitScript(() => {
        localStorage.setItem("volumeJogo", "0");
        localStorage.setItem("volumeAmbienteJogo", "0");
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => {
        if (!/play\(\) failed because the user didn't interact/.test(error.message)) pageErrors.push(error.message);
    });
    await page.goto(`${baseUrl}/${url}`, { waitUntil: "domcontentloaded" });
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });
    await page.evaluate(() => {
        window.ChamaSom = () => {};
        window.TocaSomSintetico = () => {};
        window.MostraInfo = () => {};
        window.MostraStatus = () => {};
        window.AutoSaveLocal = () => true;
        window.AutoSalvar = () => {};
        window.AtualizaMaximosLoja = () => {};
        UI.showInfo = () => {};
        UI.showMilestone = () => {};
        UI.updateSkillProgress = () => {};
        document.getElementById("infoModal")?.remove();
    });
    return { context, page, pageErrors };
}

// ---------------------------------------------------------------- EVENTOS

test("eventos: elegibilidade (andar 20 na névoa/veia e desafio sem gold)", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            andar = 19; missaoAtual = 0;
            const n19 = ElegivelEvento("nevoa");
            const v19 = ElegivelEvento("veia");
            const m19 = ElegivelEvento("meteoro");
            andar = 20;
            const n20 = ElegivelEvento("nevoa");
            const v20 = ElegivelEvento("veia");
            missaoAtual = 5; missaoDesafioSub = 1;
            const comercioDesafio = ElegivelEvento("comercio");
            return { n19, v19, m19, n20, v20, comercioDesafio };
        });
        assert.deepEqual(r, { n19: false, v19: false, m19: true, n20: true, v20: true, comercioDesafio: false });
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: ciclo de vida (inicia monta painel/ambiente/tick; encerra limpa)", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            jogoPausado = false;
            andar = 30; maxAndar = 30;
            const nomes = ["comercio", "meteoro", "nevoa", "veia", "fissura", "inseto"];
            const inicio = {};
            const fim = {};
            for (const nome of nomes) {
                EncerraEvento(true);
                IniciaEvento(nome);
                inicio[nome] = {
                    ativo: eventoAtivo === nome,
                    painel: !!document.getElementById("eventoPainel"),
                    ambiente: document.getElementById("eventoAmbiente")?.className,
                    tick: !!eventoTick
                };
                EncerraEvento(true);
                fim[nome] = {
                    ativo: eventoAtivo,
                    painel: !!document.getElementById("eventoPainel"),
                    ambiente: document.getElementById("eventoAmbiente")?.className,
                    tick: !!eventoTick
                };
            }
            return { inicio, fim };
        });
        for (const nome of Object.keys(r.inicio)) {
            assert.deepEqual(r.inicio[nome], {
                ativo: true,
                painel: true,
                ambiente: `evento-${nome}`,
                tick: true
            }, `início de ${nome}`);
            assert.deepEqual(r.fim[nome], { ativo: null, painel: false, ambiente: "", tick: false }, `fim de ${nome}`);
        }
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: névoa dá CM por abate na hora", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            jogoPausado = false;
            andar = 30; maxAndar = 30;
            conhecimentoMug = 0;
            IniciaEvento("nevoa");
            EventoAbateCM(3);
            const cm = conhecimentoMug;
            const contador = eventoCM;
            EncerraEvento(true);
            return { cm, contador };
        });
        assert.equal(r.cm, 3);
        assert.equal(r.contador, 3);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: veia solta esmeralda por abate", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            jogoPausado = false;
            andar = 30; maxAndar = 30;
            esmeraldas = 0;
            IniciaEvento("veia");
            const antes = esmeraldas;
            const randomOriginal = Math.random;
            Math.random = () => 0; // garante o drop
            EventoAbateVeia(5);
            Math.random = randomOriginal;
            const depois = esmeraldas;
            const contador = eventoVeiaQtd;
            EncerraEvento(true);
            return { ganhou: depois - antes, contador };
        });
        assert.ok(r.ganhou >= 1, `esperava esmeralda(s), ganhou ${r.ganhou}`);
        assert.equal(r.contador, r.ganhou);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: fissura congela o cronômetro de fuga", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            jogoPausado = false;
            fugaEmAndamento = false;
            andar = 30; maxAndar = 30;
            IniciaEvento("fissura");
            tempoAvancoInimigos = 50;
            AvancoInimigos();
            const durante = tempoAvancoInimigos;
            EncerraEvento(true);
            tempoAvancoInimigos = 50;
            AvancoInimigos();
            const depois = tempoAvancoInimigos;
            return { durante, depois };
        });
        assert.equal(r.durante, 50, "fissura não deveria decrementar");
        assert.equal(r.depois, 49, "fora da fissura deveria decrementar");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: emboscada dá +50% de vida e paga em dobro ao vencer", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            jogoPausado = false;
            andar = 30; maxAndar = 30;
            window.ondaAtual = 1;
            vidaInimigo1 = 1000; vidaInimigo2 = 1000; vidaInimigo3 = 0; vidaInimigo4 = 0;
            document.getElementById("inimigo1").style.visibility = "visible";
            document.getElementById("inimigo2").style.visibility = "visible";
            numInimigosTela = 2;
            gold = new GoldNumber(0);
            IniciaEvento("emboscada");
            const vidas = [vidaInimigo1, vidaInimigo2];
            const alvos = eventoEmboscadaAlvos.length;
            // o jogador limpa a onda (o crédito de gold já foi acumulado)
            eventoEmboscadaGold = 500;
            vidaInimigo1 = 0; vidaInimigo2 = 0;
            const goldAntes = gold.toNumber();
            VenceuEmboscada();
            const goldGanho = gold.toNumber() - goldAntes;
            const ativo = eventoAtivo;
            return { vidas, alvos, goldGanho, ativo };
        });
        assert.deepEqual(r.vidas, [1500, 1500], "onda deveria ganhar +50% de vida");
        assert.equal(r.alvos, 2);
        assert.ok(r.goldGanho > 0, `vencer deveria pagar o ouro, ganhou ${r.goldGanho}`);
        assert.equal(r.ativo, null, "vencer encerra a emboscada");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: inseto premia no clique e encerra", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            jogoPausado = false;
            andar = 30; maxAndar = 30;
            gold = new GoldNumber(0);
            IniciaEvento("inseto");
            const inseto = document.getElementById("eventoInseto");
            const criado = !!inseto;
            PremioInseto(inseto);
            return { criado, removido: !document.getElementById("eventoInseto"), ativo: eventoAtivo, gold: gold.toNumber() };
        });
        assert.equal(r.criado, true);
        assert.equal(r.removido, true);
        assert.equal(r.ativo, null, "premiar encerra o evento");
        assert.ok(r.gold > 0, "deveria pagar gold");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: meteoro esconde o baú e cria fragmentos", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            jogoPausado = false;
            andar = 30; maxAndar = 30;
            window.ondaAtual = 1;
            vidaInimigo1 = 1000; vidaInimigo2 = 1000; vidaInimigo3 = 0; vidaInimigo4 = 0;
            document.getElementById("inimigo1").style.visibility = "visible";
            document.getElementById("inimigo2").style.visibility = "visible";
            numInimigosTela = 2;
            quantidadeBausDisponiveis = 1;
            UI.spawnChest(1);
            const baúAntes = !!document.getElementById("bau");
            IniciaEvento("meteoro");
            const baúDurante = !!document.getElementById("bau");
            CriaFragmentos();
            const fragmentos = document.querySelectorAll(".evento-fragmento").length;
            EncerraEvento(true);
            return { baúAntes, baúDurante, fragmentos };
        });
        assert.equal(r.baúAntes, true);
        assert.equal(r.baúDurante, false, "meteoro tira o baú da arena");
        assert.ok(r.fragmentos >= 1, "deveria criar fragmento");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("eventos: pausa congela a contagem do evento", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            window.ElegivelEvento = () => true;
            andar = 30; maxAndar = 30;
            IniciaEvento("nevoa");
            jogoPausado = false;
            const fimAntes = eventoFimMs;
            jogoPausado = true;
            EventoTick();
            const fimPausado = eventoFimMs;
            return { fimAntes, fimPausado };
        });
        assert.equal(r.fimAntes, r.fimPausado, "na pausa o fim do evento não anda");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

// ------------------------------------------------------------ PROGRESSÃO

test("progressão: curva de XP e level-up multi-nível", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            nivelJogador = 1; xpAtual = 0; pontosHabilidade = 0; totalNiveis = 0;
            const custo1 = XPNecessarioProximoNivel(1);   // 50
            const custo11 = XPNecessarioProximoNivel(11); // 50 + 25*10 = 300
            GanhaXP(0, 1, 1000000); // XP fixo grande → vários níveis
            return { custo1, custo11, nivel: nivelJogador, pontos: pontosHabilidade, total: totalNiveis };
        });
        assert.equal(r.custo1, 50);
        assert.equal(r.custo11, 300);
        assert.ok(r.nivel > 10, `esperava vários níveis, ficou no ${r.nivel}`);
        assert.equal(r.pontos, r.nivel - 1, "cada nível dá 1 ponto");
        assert.equal(r.total, r.nivel - 1);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("progressão: skill custa ponto e respeita trava/teto", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            maxAndar = 1; andar = 1;
            pontosHabilidade = 3;
            nivelSkillFuga = 0;
            const travado = EvoluiSkill("escape"); // piso 35 não atingido
            maxAndar = 35; // destrava a Pausa da fuga
            const ok = EvoluiSkill("escape");
            const pontosDepois = pontosHabilidade;
            const nivelDepois = NivelDaSkill("escape");
            pontosHabilidade = 0;
            const semPonto = EvoluiSkill("escape");
            return { travado, ok, pontosDepois, nivelDepois, semPonto };
        });
        assert.equal(r.travado, false);
        assert.equal(r.ok, true);
        assert.equal(r.pontosDepois, 2);
        assert.equal(r.nivelDepois, 1);
        assert.equal(r.semPonto, false);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("progressão: perk custa ponto de perk e ramos são exclusivos", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            maxAndar = 100;
            andarMaxRun = 1; // sem pontos de perk ainda
            perkDano = 0; nivelSkillDano = 10;
            const semPonto = CompraPerk("damage"); // sem pontos de perk
            andarMaxRun = 100; // agora o pico da run dá pontos
            const ganhos = PontosPerkGanhos();
            const ok = CompraPerk("damage");
            const nivelPerk = perkDano;
            const ramo1 = EscolheRamoSkill("damage", 1);
            const ramo2 = EscolheRamoSkill("damage", 2); // já escolheu → bloqueado
            return { semPonto, ganhos, ok, nivelPerk, ramo1, ramo2, ramo: RamoEscolhido("damage") };
        });
        assert.equal(r.semPonto, false);
        assert.ok(r.ganhos > 0, "andarMaxRun 100 deveria dar pontos de perk");
        assert.equal(r.ok, true);
        assert.equal(r.nivelPerk, 1);
        assert.equal(r.ramo1, true);
        assert.equal(r.ramo2, false, "segundo caminho é bloqueado");
        assert.equal(r.ramo, 1);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("progressão: Canhão de Vidro corta 80% do tempo de fuga", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            cmNivelFuga = 0;
            conquistasComp = [0, 0, 0, 0, 0]; // sem o +5 s do Destemido
            Tapeira.ItensBuild.carrega({ itensBuild: [] }); // sem Relógio de Bolso
            especializacao = 0;
            const base = TempoFugaMax();
            especializacao = 4; // Canhão de Vidro
            const vidro = TempoFugaMax();

            // Troca em TEMPO REAL: escolher o Canhão corta o cronômetro do andar
            // atual na hora (não espera a troca de andar).
            gold = new GoldNumber(1e9);
            andarVolta = 20; maxAndar = 90; // destrava as builds
            especializacao = 0;
            tempoAvancoInimigos = TempoFugaMax(); // 90
            const antesTroca = tempoAvancoInimigos;
            EscolheEspecializacao(4); // paga e troca pra Canhão de Vidro
            const depoisTroca = tempoAvancoInimigos;

            return { base, vidro, antesTroca, depoisTroca };
        });
        assert.equal(r.base, 90);
        assert.equal(r.vidro, 18, "90 s com −80% = 18 s");
        assert.equal(r.antesTroca, 90);
        assert.equal(r.depoisTroca, 18, "a troca de build corta o cronômetro na hora");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("progressão: Mago do Relógio ativa a Pausa da fuga (+50%) ao encher", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            maxAndar = 50; // destrava todas as skills de combate
            nivelSkillFuga = 5; // duração base 20s (10 + 2/nível)
            ramoSkillFuga = 0;
            lvlComp3 = 1; // Mago do Relógio
            missaoAtual = 0;
            jogoPausado = false;
            fugaEmAndamento = false;
            segundosPausaFuga = 0;

            const duracao = DuracaoPausaFuga();

            // o mago enche a Pausa da fuga de uma vez: ela ativa sozinha, +50%
            abatesPausaFuga = 0;
            AdicionaCargaSkill("escape", TetoSkill("escape"));
            const mago = { segundos: segundosPausaFuga, carga: abatesPausaFuga };
            // efeito visual do Mago: classe no botão da skill
            const magoEfeito = document.getElementById("habilidade-fuga")?.classList.contains("habilidade-mago");

            // a ativação MANUAL (botão) não leva o bônus nem o efeito do mago
            segundosPausaFuga = 0;
            abatesPausaFuga = TetoSkill("escape");
            document.getElementById("habilidade-fuga")?.classList.remove("habilidade-mago");
            AtivaHabilidadeCombate("escape");
            const manual = segundosPausaFuga;
            const manualEfeito = document.getElementById("habilidade-fuga")?.classList.contains("habilidade-mago");

            // Skills de combate todas cheias, mas o Dano ainda tem espaço:
            // o Dano continua valendo e a Pausa da fuga (cheia) também entra
            // no sorteio — ela é a ÚNICA que pode ser escolhida cheia.
            abateshabilidadeDano = 10; qtdCarregaHabilidade = 0; // Dano com espaço
            abatesCorrenteEletrica = TetoSkill("electric");
            abatesBonusGoldAtaque = TetoSkill("gold");
            abatesFrenesi = TetoSkill("frenzy");
            abatesPausaFuga = TetoSkill("escape"); // cheia
            segundosPausaFuga = 0;
            const candidatas = CandidatasMago(); // ["dano", "escape"]

            // força o sorteio a pegar a Pausa da fuga (última da lista)
            const randOriginal = Math.random;
            Math.random = () => 0.999;
            document.getElementById("habilidade-fuga")?.classList.remove("habilidade-mago");
            CarregaSkillAleatoriaMago();
            Math.random = randOriginal;
            const magoLiga = segundosPausaFuga;
            const magoLigaEfeito = document.getElementById("habilidade-fuga")?.classList.contains("habilidade-mago");

            // agora o Dano também cheio: a Pausa da fuga vira a única opção
            qtdCarregaHabilidade = abateshabilidadeDano;
            segundosPausaFuga = 0;
            const soEscape = CandidatasMago();

            return { duracao, mago, manual, magoEfeito, manualEfeito, candidatas, magoLiga, magoLigaEfeito, soEscape };
        });
        assert.equal(r.duracao, 20, "duração base 20s no nível 5");
        assert.equal(r.mago.segundos, 30, "mago: +50% (20 -> 30)");
        assert.equal(r.mago.carga, 0, "a carga zera ao ativar");
        assert.equal(r.magoEfeito, true, "o mago aplica o efeito visual no botão da skill");
        assert.equal(r.manual, 20, "ativação manual não tem o bônus");
        assert.equal(r.manualEfeito, false, "ativação manual não aplica o efeito do mago");
        assert.equal(r.magoLigaEfeito, true, "o efeito aparece quando o mago liga a Pausa da fuga");
        assert.deepEqual(r.candidatas, ["dano", "escape"], "Dano continua valendo e a Pausa da fuga entra mesmo cheia");
        assert.equal(r.magoLiga, 30, "o mago ainda liga a Pausa da fuga (+50%) mesmo cheia");
        assert.deepEqual(r.soEscape, ["escape"], "com o Dano cheio, a Pausa da fuga é a única opção");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("telas: notificação de Ramos soma perks e ignora skill/perk no máximo", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            andar = 1;
            andarMaxRun = 45; // PontosPerkGanhos = floor((45-35)/5)+1 = 3
            perkDano = perkEletrica = perkGold = perkFuga = perkFrenesi = 0;
            nivelSkillDano = nivelSkillEletrica = nivelSkillGold = 10;
            nivelSkillFuga = nivelSkillFrenesi = 10;
            pontosHabilidade = 2;
            const skillsNoMax = TodasSkillsNoMaximo();
            const perksNoMax = TodosPerksNoMaximo();
            const comMaximo = PontosNotificadosRamos(); // skills no teto: só perks
            nivelSkillDano = 9; // agora há skill para subir
            const semMaximo = PontosNotificadosRamos(); // 2 skills + 3 perks
            perkDano = 1; // 1 perk já gasto sai da conta
            const comPerkGasto = PontosNotificadosRamos();
            // todos os perks no teto: os pontos de perk param de contar
            nivelSkillDano = 10; // skills de volta ao teto
            perkDano = 4; perkEletrica = 3; perkGold = 4; perkFuga = 5; perkFrenesi = 4;
            const perksNoTeto = TodosPerksNoMaximo();
            const tudoNoTeto = PontosNotificadosRamos();
            return { skillsNoMax, perksNoMax, comMaximo, semMaximo, comPerkGasto, perksNoTeto, tudoNoTeto };
        });
        assert.equal(r.skillsNoMax, true);
        assert.equal(r.perksNoMax, false);
        assert.equal(r.comMaximo, 3, "skills no máximo: só os perks contam");
        assert.equal(r.semMaximo, 5, "com skill subível: pontos de habilidade + perks");
        assert.equal(r.comPerkGasto, 4, "perk gasto sai da conta");
        assert.equal(r.perksNoTeto, true);
        assert.equal(r.tudoNoTeto, 0, "skills e perks no teto: nada a notificar");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("progressão: reset zera a run e preserva permanentes", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            // estado de run
            andar = 40; gold = new GoldNumber(1e6);
            nivelJogador = 20; xpAtual = 10; pontosHabilidade = 5;
            nivelSkillDano = 3; perkDano = 2; ramoSkillDano = 1;
            especializacao = 3; danoResetQtd = 4;
            Tapeira.ItensBuild.carrega({ itensBuild: ["adaga", "adaga"], slotsExtrasBuild: 5 });
            // permanentes
            conhecimentoMug = 1234;
            conquistasComp = [1, 0, 2, 0, 3];
            maxAndar = 60;
            autoItensLoja = [1, 0, 1];
            slotsExtrasAntes = Tapeira.ItensBuild.slotsExtras();

            Resetar();

            return {
                andar, nivel: nivelJogador, pontos: pontosHabilidade,
                skill: nivelSkillDano, perk: perkDano, ramo: ramoSkillDano,
                esp: especializacao, danoReset: danoResetQtd,
                build: Tapeira.ItensBuild.contagem(), slots: Tapeira.ItensBuild.slotsExtras(),
                cm: conhecimentoMug, maxAndar, auto: autoItensLoja.slice()
            };
        });
        // run zerada
        assert.equal(r.andar, 1);
        assert.equal(r.nivel, 1);
        assert.equal(r.pontos, 0);
        assert.equal(r.skill, 0);
        assert.equal(r.perk, 0);
        assert.equal(r.ramo, 0);
        assert.equal(r.esp, 0);
        assert.equal(r.danoReset, 4, "bônus de reset é permanente");
        assert.equal(r.build, 0, "build é por run");
        // permanentes
        assert.equal(r.cm, 1234);
        assert.equal(r.maxAndar, 60);
        assert.equal(r.slots, 5, "espaço extra é compra permanente");
        assert.deepEqual(r.auto, [1, 0, 1], "seleção da auto-compra é permanente");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

// ---------------------------------------------------------------- TELAS

test("telas: cada painel abre e fecha (status, lojas, config, skills, formigas)", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            const vis = id => document.getElementById(id)?.style.visibility;
            const out = {};

            AbreLoja(false); out.lojaGold = vis("Loja");
            FechaLoja(); out.lojaGoldFechada = vis("Loja");

            LojaEsmeralda(); out.esm = vis("LojaEsm");
            LojaConhecimento(); out.cm = vis("LojaCM");
            FechaLojaCM(); out.voltaEsm = vis("LojaEsm");
            FechaLoja();

            SobeStatus(); out.status = vis("DivStatus");
            SobeStatus(); out.statusFechado = vis("DivStatus");

            AbreConfig(); out.config = vis("container-SalvaCarrega");
            AbreConfig(); out.configFechado = vis("container-SalvaCarrega");

            UI.showSkillUpgradePanel(); out.skills = !!document.getElementById("skillUpgradeModal");
            document.getElementById("skillUpgradeModal")?.remove();

            UI.toggleAntCollection(); out.formigas = !!document.getElementById("antCollectionModal");
            UI.toggleAntCollection(); out.formigasFechado = !!document.getElementById("antCollectionModal");

            return out;
        });
        assert.equal(r.lojaGold, "visible");
        assert.equal(r.lojaGoldFechada, "hidden");
        assert.equal(r.esm, "visible");
        assert.equal(r.cm, "visible");
        assert.equal(r.voltaEsm, "visible", "voltar do CM reabre a loja de esmeraldas");
        assert.equal(r.status, "visible");
        assert.equal(r.statusFechado, "hidden");
        assert.equal(r.config, "visible");
        assert.equal(r.configFechado, "hidden");
        assert.equal(r.skills, true);
        assert.equal(r.formigas, true);
        assert.equal(r.formigasFechado, false);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("telas: ESC (FechaJanelasAbertas) fecha tudo", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            const vis = id => document.getElementById(id)?.style.visibility;
            AbreLoja(false);
            const lojaAberta = vis("Loja");
            // abrir a árvore de habilidades fecha a Loja (telas exclusivas — item 2)
            UI.showSkillUpgradePanel();
            const lojaFechadaPelaSkill = vis("Loja") === "hidden";
            UI.showItensBuild(); // tela de leitura dos itens da build
            const antes = {
                loja: vis("Loja"),
                skills: !!document.getElementById("skillUpgradeModal"),
                build: !!document.getElementById("modalItensBuildView"),
                classe: document.body.classList.contains("itens-build-tela-aberta")
            };
            const fechou = FechaJanelasAbertas();
            return {
                lojaAberta,
                lojaFechadaPelaSkill,
                antes,
                fechou,
                loja: vis("Loja"),
                skills: !!document.getElementById("skillUpgradeModal"),
                build: !!document.getElementById("modalItensBuildView"),
                classe: document.body.classList.contains("itens-build-tela-aberta")
            };
        });
        assert.equal(r.lojaAberta, "visible");
        assert.equal(r.lojaFechadaPelaSkill, true,
            "abrir as habilidades fecha a Loja (telas exclusivas)");
        assert.equal(r.antes.skills, true);
        assert.equal(r.antes.build, true);
        assert.equal(r.antes.classe, true);
        assert.equal(r.fechou, true);
        assert.equal(r.loja, "hidden");
        assert.equal(r.skills, false);
        assert.equal(r.build, false);
        assert.equal(r.classe, false);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("telas: ESC na tela de itens da build fecha sem abrir a pausa", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        await page.evaluate(() => UI.showItensBuild());
        await page.waitForSelector("#modalItensBuildView");
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.getElementById("modalItensBuildView"));
        const r = await page.evaluate(() => ({
            classe: document.body.classList.contains("itens-build-tela-aberta"),
            pausado: document.getElementById("game-root")?.classList.contains("game-paused") || !!document.getElementById("pauseOverlay")
        }));
        assert.equal(r.classe, false);
        assert.equal(r.pausado, false);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("telas: atalhos do painel de skills abrem conquistas/missões/marcos", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            andar = 12; maxAndar = 12; // missões liberam no andar 10
            const abrir = (texto) => {
                UI.showSkillUpgradePanel();
                const btn = [...document.querySelectorAll(".skill-upgrade-shortcut")]
                    .find(b => b.textContent === texto);
                btn.click();
                const titulo = document.getElementById("gameModalTitle")?.textContent;
                const corpo = document.getElementById("gameModalBody")?.textContent || "";
                document.getElementById("gameModal")?.remove();
                return { titulo, tamanho: corpo.length };
            };
            return { conquistas: abrir("Conquistas"), missoes: abrir("Missões"), marcos: abrir("Marcos") };
        });
        assert.equal(r.conquistas.titulo, "Conquistas");
        assert.equal(r.missoes.titulo, "Missões");
        assert.equal(r.marcos.titulo, "Marcos");
        assert.ok(r.conquistas.tamanho > 0 && r.missoes.tamanho > 0 && r.marcos.tamanho > 0);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("telas: painel de status lista os campos-chave", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            UI.showStatus();
            const nomes = [...document.querySelectorAll("#StatusBody .statusNome")].map(td => td.textContent);
            return nomes;
        });
        for (const esperado of ["Dano", "Dano crítico", "Gold por inimigo", "Especialização", "Itens da build"]) {
            assert.ok(r.includes(esperado), `status deveria ter "${esperado}"`);
        }
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

// ---------------------------------------------------------------- SAVE

test("save: round-trip preserva o estado essencial", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            andar = 33; maxAndar = 45; nivelJogador = 17; xpAtual = 42;
            gold = new GoldNumber(12345); conhecimentoMug = 99;
            esmeraldas = 7; totalNiveis = 210;
            subVidaInimigo = 0.4; lvlSubVida = 40;
            Tapeira.ItensBuild.carrega({ itensBuild: ["adaga", "moedas"], slotsExtrasBuild: 5 });
            const save = JSON.stringify(CriarObjetoSave(false));
            // muda tudo e recarrega
            andar = 1; nivelJogador = 1; gold = new GoldNumber(0); conhecimentoMug = 0; esmeraldas = 0;
            Tapeira.ItensBuild.limpa();
            Carregar(save, false);
            return {
                andar, maxAndar, nivel: nivelJogador, xp: xpAtual,
                gold: gold.toNumber(), cm: conhecimentoMug, esmeraldas, total: totalNiveis,
                subVida: subVidaInimigo, build: Tapeira.ItensBuild.contagem(), slots: Tapeira.ItensBuild.slotsExtras()
            };
        });
        assert.equal(r.andar, 33);
        assert.equal(r.maxAndar, 45);
        assert.equal(r.nivel, 17);
        assert.equal(r.xp, 42);
        assert.equal(r.gold, 12345);
        assert.equal(r.cm, 99);
        assert.equal(r.esmeraldas, 7);
        assert.equal(r.total, 210);
        assert.ok(Math.abs(r.subVida - 0.4) < 1e-9);
        assert.equal(r.build, 2);
        assert.equal(r.slots, 5);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("save: validação rejeita campos adulterados", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            const base = CriarObjetoSave(false);
            const tenta = (patch) => {
                try { ValidarSave({ ...base, ...patch }); return "ok"; }
                catch { return "rejeitado"; }
            };
            return {
                valido: tenta({}),
                andarNegativo: tenta({ andar: -1 }),
                nivelString: tenta({ nivelJogador: "10" }),
                subVidaAcima: tenta({ subVidaInimigo: 0.95 }),
                especializacaoInvalida: tenta({ especializacao: 9 }),
                patenteAcima: tenta({ patenteDano: 99 }),
                autoItensNulo: tenta({ autoItensLoja: [null, 1] })
            };
        });
        assert.equal(r.andarNegativo, "rejeitado");
        assert.equal(r.nivelString, "rejeitado");
        assert.equal(r.subVidaAcima, "rejeitado");
        assert.equal(r.especializacaoInvalida, "rejeitado");
        assert.equal(r.patenteAcima, "rejeitado");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

// ------------------------------------------------------------ SONDAS (edge)

test("sonda: reset converte abates em CM e zera a run", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            andar = 30; maxAndar = 30; andarVolta = 30;
            derrotadosRun = 100; conhecimentoMug = 0;
            const esperado = Math.round(100 * MultiplicadorCM() * BonusCMPontosSobra());
            VoltaAndar();
            return { cm: conhecimentoMug, esperado, andar, derrotados: derrotadosRun };
        });
        assert.equal(r.andar, 1, "reset volta pro andar 1");
        assert.equal(r.derrotados, 0, "abates da run zeram");
        assert.equal(r.cm, r.esperado, "CM = abates × multiplicadores");
        assert.ok(r.cm > 0);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("sonda: reset é bloqueado abaixo do portão mínimo (20)", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            andar = 5; andarVolta = 30; maxAndar = 30;
            VoltaAndar();
            return { andar };
        });
        assert.equal(r.andar, 5, "não deveria resetar abaixo do andar 20");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("sonda: conquista clássica de dano aplica e dobra o próximo alvo", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            totalDerrotados = 100; progressoConquistaDano = 100; validaConquista = 1;
            danoJogador = 10; danoBonus = 0;
            Conquistas();
            return { dano: danoJogador, bonus: danoBonus, alvo: progressoConquistaDano, valida: validaConquista };
        });
        assert.ok(r.dano > 10, "conquista deveria aumentar o dano");
        assert.equal(r.alvo, 200, "próximo alvo dobra");
        assert.equal(r.valida, 2);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("sonda: save com campo extra (números tolerados; não-numéricos rejeitados)", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => {
            const base = CriarObjetoSave(false);
            const valida = obj => {
                try { ValidarSave(JSON.parse(JSON.stringify(obj))); return "ok"; }
                catch (e) { return e.message; }
            };
            return {
                base: valida(base),
                numerico: valida({ ...base, campoInventado: 999 }),
                naoNumerico: valida({ ...base, outroLixo: { a: 1 } })
            };
        });
        assert.equal(r.base, "ok", "save base (após o round-trip de JSON) deveria validar");
        assert.equal(r.numerico, "ok", "campo extra numérico é tolerado");
        assert.notEqual(r.naoNumerico, "ok", "campo extra não-numérico é rejeitado (whitelist estrita)");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("sonda: formatação de gold nos extremos", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        const r = await page.evaluate(() => ({
            zero: FormatarGold(0),
            mil: FormatarGold(1000),
            milhao: FormatarGold(1e6),
            infinito: FormatarGold(Infinity),
            // sufixos além de "Sx": formatNumber parava em Sx e o valor virava
            // um número gigante tipo "229986612.80Sx"
            alemDeSx: FormatGold(2.299866128e29),
            dc: FormatGold(1e33),
            ud: FormatGold(1e36),
            // ALÉM do último sufixo ("Noqig", ~e+150) é que cai na notação
            // científica (1e36 já tem sufixo: "Ud")
            cientifico: FormatGold(1e200),
            // FormatarGold (status/cartão de batalha: dano, DPS, crítico) usa o
            // MESMO fallback do FormatGold
            danoGrande: FormatarGold(1e200),
            cmGrande: FormatCM(2.299866128e29)
        }));
        assert.equal(r.zero, "0.00");
        assert.equal(r.mil, "1.00K");
        assert.equal(r.milhao, "1.00M");
        assert.equal(r.infinito, "∞");
        assert.equal(r.alemDeSx, "229.99Oc");
        assert.equal(r.dc, "1.00Dc");
        assert.equal(r.ud, "1.00Ud");
        assert.equal(r.cientifico, "1.00e+200");
        assert.equal(r.danoGrande, "1.00e+200");
        assert.equal(r.cmGrande, "229.99Oc");
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});

test("painel de HUD aberto fica acima das habilidades/efeitos e abaixo dos overlays", async () => {
    const { context, page, pageErrors } = await openPage();
    try {
        await page.waitForFunction(() => typeof UI !== "undefined" && typeof UI.syncScreenButtons === "function");
        const r = await page.evaluate(() => {
            const z = id => getComputedStyle(document.getElementById(id)).zIndex;
            const classe = () => document.getElementById("game-root").classList.contains("hud-painel-aberto");
            const mede = id => {
                document.getElementById(id).style.visibility = "visible";
                UI.syncScreenButtons();
                const out = { z: z("container-opcoes"), classe: classe() };
                document.getElementById(id).style.visibility = "hidden";
                UI.syncScreenButtons();
                return out;
            };
            const antes = { z: z("container-opcoes"), classe: classe() };
            const status = mede("DivStatus");
            const loja = mede("Loja");
            // overlay de verdade (itens da build) — o z-index vem do CSS dele
            const probe = document.createElement("div");
            probe.className = "modal-itens-build";
            document.body.appendChild(probe);
            const overlayZ = getComputedStyle(probe).zIndex;
            probe.remove();
            return {
                antes, status, loja, overlayZ,
                depois: { z: z("container-opcoes"), classe: classe() },
                skillsZ: z("container-Habilidades")
            };
        });
        assert.equal(r.antes.z, "3", "fechado: z-index base do #container-opcoes");
        assert.equal(r.antes.classe, false);
        assert.equal(r.status.z, "25", "Status aberto sobe o contexto do #container-opcoes");
        assert.equal(r.status.classe, true, "marca o #game-root com hud-painel-aberto");
        assert.ok(Number(r.status.z) > Number(r.skillsZ), "acima das habilidades (z " + r.skillsZ + ")");
        assert.ok(Number(r.status.z) > 8, "acima dos efeitos de dano/vida (z 7-8)");
        assert.ok(Number(r.status.z) < Number(r.overlayZ), "abaixo do overlay dos itens da build (z " + r.overlayZ + ")");
        assert.equal(r.loja.z, "25", "a Loja também conta como painel de HUD");
        assert.equal(r.depois.z, "3", "fechado volta ao base");
        assert.equal(r.depois.classe, false);
        assert.deepEqual(pageErrors, []);
    } finally { await context.close(); }
});
