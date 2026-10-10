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
    browser = await chromium.launch({
        headless: true,
        args: ["--autoplay-policy=no-user-gesture-required"]
    });
});

after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
});

async function openIsolatedPage(url) {
    const context = await browser.newContext();
    await context.addInitScript(() => {
        // Mantém os testes de lógica silenciosos e evita rejeições de play()
        // por política de autoplay do Chromium headless.
        localStorage.setItem("volumeJogo", "0");
        localStorage.setItem("volumeAmbienteJogo", "0");
    });
    const page = await context.newPage();
    const pageErrors = [];
    page.on("pageerror", error => pageErrors.push(error.message));
    await page.goto(`${baseUrl}/${url}`, { waitUntil: "domcontentloaded" });
    return { context, page, pageErrors };
}

test("menu e caverna inicializam sem erros JavaScript", async t => {
    await t.test("menu", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("index.html");
        try {
            await page.waitForFunction(() => typeof PrepararMenu === "function");
            assert.equal(await page.title(), "TAPeira");
            assert.equal(await page.locator("#btn-Jogar").innerText(), "Entrar na caverna");
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });

    await t.test("jogo", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
        try {
            await page.waitForFunction(() =>
                document.getElementById("game-root") && typeof window.andar === "number",
                undefined,
                { timeout: 15000 }
            );
            assert.ok(await page.locator("#game-root").count());
            assert.ok((await page.evaluate(() => window.andar)) >= 1);
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });
});

test("módulo de áudio mantém controles e volumes persistidos", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.AtualizaVolume === "function");
        const result = await page.evaluate(() => {
            AtualizaVolume(65);
            AtualizaVolumeAmbiente(40);
            return {
                volumes: [volumeAtual, volumeAmbiente],
                saves: [localStorage.getItem("volumeJogo"), localStorage.getItem("volumeAmbienteJogo")],
                controles: [
                    document.getElementById("volumeValor").value,
                    document.getElementById("volumeAmbienteValor").value
                ]
            };
        });

        assert.deepEqual(result.volumes, [0.65, 0.4]);
        assert.deepEqual(result.saves, ["65", "40"]);
        assert.deepEqual(result.controles, ["65%", "40%"]);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("save antigo é migrado sem perder compatibilidade", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.Carregar === "function");
        const result = await page.evaluate(() => {
            const legacySave = {
                andar: 25,
                andarVolta: 20,
                gold: { m: 1.25, e: 3 },
                totalGold: { m: 2, e: 4 }
            };
            const loaded = Carregar(JSON.stringify(legacySave));
            const normalizedSave = JSON.parse(localStorage.getItem("autoSaveCaverna"));
            return {
                loaded,
                andar,
                andarVolta,
                gateDanoPago,
                andarMaxRun,
                gold: { m: gold.m, e: gold.e },
                autoColeta,
                autoCompra,
                autoGasto,
                itensBuild: Tapeira.ItensBuild.pegaLista(),
                comprasRun,
                normalizedSaveExists: normalizedSave.andar === 25
            };
        });

        assert.equal(result.loaded, true);
        assert.equal(result.andar, 25);
        assert.equal(result.andarVolta, 15, "o antigo andar de reset 20 migra para 15");
        assert.equal(result.gateDanoPago, 10);
        assert.equal(result.andarMaxRun, 25);
        assert.deepEqual(result.gold, { m: 1.25, e: 3 });
        assert.equal(result.autoColeta, 1);
        assert.equal(result.autoCompra, 1);
        assert.equal(result.autoGasto, 0);
        assert.deepEqual(result.itensBuild, []);
        assert.equal(result.comprasRun, 1);
        assert.equal(result.normalizedSaveExists, true);

        const rejectedFutureSave = await page.evaluate(() => {
            andar = 7;
            try {
                Carregar(JSON.stringify({
                    saveFormat: "tapeira-save",
                    saveVersion: 2,
                    andar: 1,
                    gold: { m: 0, e: 0 },
                    totalGold: { m: 0, e: 0 }
                }));
                return { rejected: false, andar };
            } catch (error) {
                return { rejected: true, message: error.message, andar };
            }
        });
        assert.equal(rejectedFutureSave.rejected, true);
        assert.match(rejectedFutureSave.message, /versão mais nova/);
        assert.equal(rejectedFutureSave.andar, 7, "rejeitar um save futuro não altera o progresso atual");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("importação por arquivo mantém o andar salvo no JSON", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.CriarObjetoSave === "function");
        const saveJson = await page.evaluate(() => {
            andar = 137;
            maxAndar = 137;
            andarMaxRun = 137;
            const save = CriarObjetoSave();
            save.saveFormat = "tapeira-save";
            save.saveVersion = 1;
            save.exportedAt = new Date().toISOString();
            const json = JSON.stringify(save);

            // Deixa a página num estado diferente para garantir que o teste
            // observa o valor carregado, não o valor usado na fixture.
            andar = 1;
            maxAndar = 1;
            andarMaxRun = 1;
            return json;
        });

        const corruptAutoSave = await page.evaluate(() => {
            const raw = JSON.stringify({ andar: 0 });
            localStorage.setItem("autoSaveCaverna", raw);
            const loaded = CarregarAutoSave();
            const savedAgain = AutoSaveLocal();
            return {
                loaded,
                savedAgain,
                preserved: localStorage.getItem("autoSaveCaverna") === raw
            };
        });
        assert.deepEqual(corruptAutoSave, { loaded: false, savedAgain: false, preserved: true });

        await page.locator("#txtfiletoread").setInputFiles({
            name: "TAPeira-save-test.json",
            mimeType: "application/json",
            buffer: Buffer.from(saveJson, "utf8")
        });
        await page.waitForFunction(() => {
            const autoSave = localStorage.getItem("autoSaveCaverna");
            return window.andar === 137 && autoSave && JSON.parse(autoSave).andar === 137;
        }, undefined, { timeout: 15000 });

        const loaded = await page.evaluate(() => ({
            andar,
            maxAndar,
            andarMaxRun,
            autosaveAndar: JSON.parse(localStorage.getItem("autoSaveCaverna")).andar
        }));
        assert.deepEqual(loaded, { andar: 137, maxAndar: 137, andarMaxRun: 137, autosaveAndar: 137 });

        // Arquivo legado sem metadados também deve continuar importável.
        await page.locator("#txtfiletoread").setInputFiles({
            name: "TAPeira-save-legado.json",
            mimeType: "application/json",
            buffer: Buffer.from(JSON.stringify({
                andar: 42,
                gold: { m: 1.5, e: 4 },
                totalGold: { m: 2, e: 5 }
            }), "utf8")
        });
        await page.waitForFunction(() => {
            const autoSave = localStorage.getItem("autoSaveCaverna");
            return window.andar === 42 && autoSave && JSON.parse(autoSave).andar === 42;
        }, undefined, { timeout: 15000 });
        assert.equal(await page.evaluate(() => andar), 42);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("Salvar e voltar ao menu preserva o andar ao continuar a aventura", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.SalvarEVoltarMenu === "function");
        await page.waitForFunction(() => !!window.avancoInterval);
        await page.evaluate(() => {
            andar = 137;
            maxAndar = 137;
            andarMaxRun = 137;
            document.getElementById("infoModal")?.remove();
            document.getElementById("container-SalvaCarrega").style.visibility = "visible";
        });
        await page.locator("#btnSalvarVoltarMenu").click();
        await page.waitForURL("**/index.html");
        await page.waitForFunction(() =>
            document.getElementById("menu-save-details")?.textContent.includes("Andar 137")
        );
        assert.match(await page.locator("#menu-save-details").innerText(), /Andar 137/);

        await page.locator("#btn-Jogar").click();
        await page.waitForURL("**/Caverna.html");
        await page.waitForFunction(() => window.andar === 137, undefined, { timeout: 15000 });
        assert.equal(await page.evaluate(() => JSON.parse(localStorage.getItem("autoSaveCaverna")).andar), 137);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("compras de gold respeitam saldo e progressão de preço", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.CompraGold === "function");
        const result = await page.evaluate(() => {
            volumeAtual = 0;
            missaoAtual = 0;
            lvlComp2 = 0;
            gold = new GoldNumber(50);
            precoGold = 100;
            mulGold = 1;
            lvlGold = 1;
            sobeGold = 0.3;
            comprasRun = 0;

            CompraGold();
            const semSaldo = {
                gold: gold.toNumber(),
                preco: precoGold,
                nivel: lvlGold,
                compras: comprasRun
            };

            gold = new GoldNumber(1000);
            CompraGold();
            CompraGold();
            return {
                semSaldo,
                gold: gold.toNumber(),
                multiplicador: mulGold,
                proximoPreco: precoGold,
                nivel: lvlGold,
                proximoAumento: sobeGold,
                compras: comprasRun
            };
        });

        assert.deepEqual(result.semSaldo, { gold: 50, preco: 100, nivel: 1, compras: 0 });
        assert.equal(result.gold, 750);
        assert.ok(
            Math.abs(result.multiplicador - 1.69) < 1e-9,
            `esperava ~1.69 após 2 compras, veio ${result.multiplicador}`
        );
        assert.equal(result.proximoPreco, 225);
        assert.equal(result.nivel, 3);
        assert.equal(result.proximoAumento, 0.4);
        assert.equal(result.compras, 2);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("combate aplica dano, item de build e respeita pausa", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.Bater === "function");
        const result = await page.evaluate(() => {
            const build = Tapeira.ItensBuild;
            const randomOriginal = Math.random;
            Math.random = () => 0.99; // sem crítico ou drops aleatórios
            volumeAtual = 0;
            jogoPausado = true;
            fugaEmAndamento = false;
            andar = 1;
            nivelJogador = 1;
            totalNiveis = 0;
            danoJogador = 10;
            danoCritJogador = 20;
            chanceCrit = 0;
            lvlComp5 = 0;
            especializacao = 0;
            ataquesCorrenteEletrica = 0;
            ataquesBonusGold = 0;
            ataquesFrenesi = 0;
            segundosPausaFuga = 0;
            numInimigosTela = 1;
            vidaAndar = 1000;
            vidaInimigo1 = 1000;
            vidaInimigo2 = vidaInimigo3 = vidaInimigo4 = 0;
            missaoAtual = 0;
            qtdCarregaHabilidade = 0;
            build.limpa();

            UI.playAttackAnimation = () => {};
            UI.showDamageNumber = () => {};
            UI.showCurrencyReward = () => {};
            UI.updateObjective = () => {};
            UI.showObjectiveComplete = () => {};
            UI.updateEnemyHealth = () => {};
            window.MostraInfo = () => {};
            window.MostraStatus = () => {};
            window.Conquistas = () => {};
            window.ConquistasComportamentais = () => {};
            window.AtualizaHabilidadesCombate = () => {};
            window.TocaSomSintetico = () => {};
            window.ChamaSom = () => {};

            Bater(1, true);
            const pausado = vidaInimigo1;
            jogoPausado = false;
            Bater(1, true);
            const semItem = vidaInimigo1;
            build.carrega({ itensBuild: ["adaga"], bauBuildPendente: false });
            vidaInimigo1 = 1000;
            Bater(1, true);
            const comAdaga = vidaInimigo1;
            Math.random = randomOriginal;
            return { pausado, semItem, comAdaga };
        });

        assert.equal(result.pausado, 1000, "ataque durante pausa não altera a vida");
        assert.ok(Math.abs(result.semItem - 990) < 1e-9);
        assert.ok(Math.abs(result.comAdaga - 988.5) < 1e-9);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("hit kill no menu de debug mata com um golpe e pode ser desligado", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html?dev=1");
    try {
        await page.waitForSelector("#game-dev-tools [data-one-hit-kill]");
        await page.waitForFunction(() => !!window.avancoInterval);
        await page.evaluate(() => {
            document.getElementById("infoModal")?.remove();
        });
        await page.locator("#game-dev-tools [data-one-hit-kill]").check();
        const hitResult = await page.evaluate(() => {
            const randomOriginal = Math.random;
            Math.random = () => 0.99;
            volumeAtual = 0;
            jogoPausado = false;
            fugaEmAndamento = false;
            andar = 1;
            maxAndar = 1;
            nivelJogador = 1;
            totalNiveis = 0;
            danoJogador = 1;
            danoCritJogador = 1;
            chanceCrit = 0;
            lvlComp5 = 0;
            especializacao = 0;
            ataquesCorrenteEletrica = 0;
            ataquesBonusGold = 0;
            ataquesFrenesi = 0;
            segundosPausaFuga = 0;
            numInimigosTela = 2;
            qtdInimigosAndar = 100;
            inimigosDerrotados = 0;
            totalDerrotados = 0;
            derrotadosRun = 0;
            vidaAndar = 1000;
            vidaInimigo1 = vidaInimigo2 = 1000;
            vidaInimigo3 = vidaInimigo4 = 0;
            missaoAtual = 0;
            qtdCarregaHabilidade = 0;
            window.MostraInfo = () => {};
            window.MostraStatus = () => {};
            window.Conquistas = () => {};
            window.ConquistasComportamentais = () => {};
            window.AtualizaHabilidadesCombate = () => {};
            window.TocaSomSintetico = () => {};
            window.ChamaSom = () => {};
            window.AutoSaveLocal = () => true;
            UI.playAttackAnimation = () => {};
            UI.showDamageNumber = () => {};
            UI.showCurrencyReward = () => {};
            UI.updateObjective = () => {};
            UI.showObjectiveComplete = () => {};
            UI.updateEnemyHealth = () => {};
            Bater(1, true);
            Math.random = randomOriginal;
            return {
                enabled: Tapeira.DevTools.isOneHitKillEnabled(),
                vida: vidaInimigo1,
                abates: totalDerrotados,
                andar
            };
        });
        assert.deepEqual(hitResult, { enabled: true, vida: 0, abates: 1, andar: 1 });

        await page.locator("#game-dev-tools [data-one-hit-kill]").uncheck();
        const normalHit = await page.evaluate(() => {
            vidaInimigo2 = 1000;
            Bater(2, true);
            return {
                enabled: Tapeira.DevTools.isOneHitKillEnabled(),
                vida: vidaInimigo2
            };
        });
        assert.equal(normalHit.enabled, false);
        assert.ok(normalHit.vida > 0 && normalHit.vida < 1000);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("missão de golpes recompensa ao concluir e desafio falho não paga", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.MissaoGolpes === "function");
        const result = await page.evaluate(() => {
            const randomOriginal = Math.random;
            Math.random = () => 0; // próxima missão determinística: coleta de gold, sem timer
            volumeAtual = 0;
            gold = new GoldNumber(0);
            totalGold = new GoldNumber(0);
            missoesCompletas = 0;
            missaoAtual = 2;
            missaoGolpe = 2;
            missaoGolpeAtual = 1;
            statusMissao = false;
            UI.updateMission = () => {};
            UI.showInfo = () => {};
            UI.showMilestone = () => {};
            UI.showCurrencyReward = () => {};
            UI.render = () => {};

            MissaoGolpes();
            const concluida = {
                gold: gold.toNumber(),
                missaoGolpe,
                missoesCompletas,
                missaoAtual,
                progressoAnterior: missaoGolpeAtual,
                statusMissao
            };

            missaoAtual = 5;
            missaoDesafioSub = 1;
            missaoDesafioAlvo = 2;
            missaoDesafioAtual = 1;
            statusMissao = false;
            const goldAntesFalha = gold.toNumber();
            FalhaDesafio("Gold gasto na loja");
            const falha = {
                gold: gold.toNumber(),
                missaoAtual,
                desafioFalhando,
                statusMissao
            };
            Math.random = randomOriginal;
            return { concluida, goldAntesFalha, falha };
        });

        assert.ok(result.concluida.gold > 0);
        assert.equal(result.concluida.missaoGolpe, 4, "a meta dobra após concluir");
        assert.equal(result.concluida.missoesCompletas, 1);
        assert.equal(result.concluida.missaoAtual, 1);
        assert.equal(result.concluida.progressoAnterior, 0);
        assert.equal(result.concluida.statusMissao, false, "a próxima missão começa automaticamente");
        assert.equal(result.falha.gold, result.goldAntesFalha, "falhar o desafio não concede recompensa");
        assert.equal(result.falha.missaoAtual, 1, "a falha sorteia uma nova missão");
        assert.equal(result.falha.desafioFalhando, false);
        assert.equal(result.falha.statusMissao, false);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("eventos respeitam elegibilidade e oferta do comerciante cobra uma vez", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.CompraEventoOferta === "function");
        const result = await page.evaluate(() => {
            const randomOriginal = Math.random;
            Math.random = () => 0; // ofertas previsíveis para verificar que não se repetem
            andar = 10;
            missaoAtual = 0;
            const antesDoMarco = {
                nevoa: ElegivelEvento("nevoa"),
                veia: ElegivelEvento("veia")
            };
            andar = 20;
            const depoisDoMarco = {
                nevoa: ElegivelEvento("nevoa"),
                veia: ElegivelEvento("veia")
            };
            missaoAtual = 5;
            missaoDesafioSub = 1;
            const comercioBloqueado = ElegivelEvento("comercio");
            missaoAtual = 0;
            SorteiaOfertasComercio();
            const ofertasUnicas = eventoOfertas.map(oferta => oferta.id);
            Math.random = randomOriginal;

            window.MontaPainelEvento = () => {};
            window.AutoSaveLocal = () => true;
            window.ChamaSom = () => {};
            UI.showInfo = () => {};
            UI.showCurrencyReward = () => {};
            andar = 10;
            mulGold = 0.2;
            gold = new GoldNumber(0);
            esmeraldas = 0;
            comprasRun = 0;
            eventoAtivo = "comercio";
            eventoOfertas = [Object.assign(
                { comprada: false },
                EVENTO_OFERTAS_POOL.find(oferta => oferta.id === "esmeralda")
            )];

            CompraEventoOferta(0);
            const insuficiente = {
                gold: gold.toNumber(),
                esmeraldas,
                comprada: eventoOfertas[0].comprada
            };
            gold = new GoldNumber(60); // preço: max(10, round(andar × mulGold × 30))
            CompraEventoOferta(0);
            CompraEventoOferta(0); // compra repetida não pode cobrar nem premiar de novo
            return {
                antesDoMarco,
                depoisDoMarco,
                comercioBloqueado,
                ofertasUnicas,
                insuficiente,
                depoisDaCompra: {
                    gold: gold.toNumber(),
                    esmeraldas,
                    comprada: eventoOfertas[0].comprada,
                    comprasRun
                }
            };
        });

        assert.deepEqual(result.antesDoMarco, { nevoa: false, veia: false });
        assert.deepEqual(result.depoisDoMarco, { nevoa: true, veia: true });
        assert.equal(result.comercioBloqueado, false);
        assert.equal(result.ofertasUnicas.length, 2);
        assert.equal(new Set(result.ofertasUnicas).size, 2);
        assert.deepEqual(result.insuficiente, { gold: 0, esmeraldas: 0, comprada: false });
        assert.deepEqual(result.depoisDaCompra, { gold: 0, esmeraldas: 2, comprada: true, comprasRun: 1 });
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("automação respeita desbloqueios, compra mais barato e gasta pontos elegíveis", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.AutoCompraMaisBarato === "function");
        const result = await page.evaluate(() => {
            const randomOriginal = Math.random;
            Math.random = () => 0;
            window.MostraStatus = () => {};
            window.MostraInfo = () => {};
            window.ChamaSom = () => {};
            window.AutoSaveLocal = () => true;
            window.AtualizaMaximosLoja = () => {};
            UI.updateSkillProgress = () => {};
            UI.showInfo = () => {};

            maxAndar = 39;
            const antesDosDesbloqueios = {
                coleta: AutoColetaDesbloqueada(),
                compra: AutoCompraDesbloqueada(),
                gasto: AutoGastoDesbloqueado(),
                seletiva: AutoCompraSeletivaDesbloqueada()
            };
            maxAndar = 40;
            const coletaDesbloqueada = AutoColetaDesbloqueada();
            maxAndar = 50;
            const compraDesbloqueada = AutoCompraDesbloqueada();
            maxAndar = 54;
            const gastoAindaBloqueado = AutoGastoDesbloqueado();
            maxAndar = 55;
            const gastoDesbloqueado = AutoGastoDesbloqueado();
            maxAndar = 99;
            const seletivaAindaBloqueada = AutoCompraSeletivaDesbloqueada();
            maxAndar = 100;
            const seletivaDesbloqueada = AutoCompraSeletivaDesbloqueada();

            missaoAtual = 0;
            maxAndar = 50;
            andar = 50;
            autoItensLoja = [];
            gold = new GoldNumber(10);
            precoDano = precoBEspaco = precoGold = precoAvan = 1000;
            precoDCrit = precoVidaInimigo = precoCCrit = 1000;
            precoQTDAvanco = precoEsmBau = precoVelComp = 1000;
            precoBau = 5;
            lvlBau = 1;
            chanceBau = 0.1;
            AutoCompraMaisBarato();
            const comprouMaisBarato = {
                gold: gold.toNumber(),
                nivelBau: lvlBau,
                chanceBau
            };

            // No andar 100+, seleção vazia não deve comprar todos os itens.
            maxAndar = 100;
            autoItensLoja = [];
            gold = new GoldNumber(10);
            const nivelAntesDaSeletiva = lvlBau;
            AutoCompraMaisBarato();
            const semItemSelecionado = lvlBau === nivelAntesDaSeletiva;
            autoItensLoja[1] = 1; // índice 1 = baú
            precoBau = 5;
            AutoCompraMaisBarato();
            const seletivaComprou = lvlBau === nivelAntesDaSeletiva + 1;

            // Auto-gasto distribui pontos só em habilidades desbloqueadas.
            maxAndar = 54;
            andar = 54;
            autoGasto = 1;
            pontosHabilidade = 2;
            nivelSkillDano = 0;
            const bloqueadoNaoGasta = AutoGastaPontos();
            const pontosEnquantoBloqueado = pontosHabilidade;
            maxAndar = 55;
            andar = 55;
            nivelSkillDano = 0;
            nivelSkillEletrica = nivelSkillGold = nivelSkillFuga = nivelSkillFrenesi = 0;
            const gastos = AutoGastaPontos();
            Math.random = randomOriginal;

            return {
                antesDosDesbloqueios,
                coletaDesbloqueada,
                compraDesbloqueada,
                gastoAindaBloqueado,
                gastoDesbloqueado,
                seletivaAindaBloqueada,
                seletivaDesbloqueada,
                comprouMaisBarato,
                semItemSelecionado,
                seletivaComprou,
                bloqueadoNaoGasta,
                pontosEnquantoBloqueado,
                gastos,
                nivelSkillDano,
                pontosHabilidade
            };
        });

        assert.deepEqual(result.antesDosDesbloqueios, {
            coleta: false, compra: false, gasto: false, seletiva: false
        });
        assert.equal(result.coletaDesbloqueada, true);
        assert.equal(result.compraDesbloqueada, true);
        assert.equal(result.gastoAindaBloqueado, false);
        assert.equal(result.gastoDesbloqueado, true);
        assert.equal(result.seletivaAindaBloqueada, false);
        assert.equal(result.seletivaDesbloqueada, true);
        assert.equal(result.comprouMaisBarato.gold, 5);
        assert.equal(result.comprouMaisBarato.nivelBau, 2);
        assert.ok(Math.abs(result.comprouMaisBarato.chanceBau - 0.15) < 1e-10);
        assert.equal(result.semItemSelecionado, true);
        assert.equal(result.seletivaComprou, true);
        assert.equal(result.bloqueadoNaoGasta, 0);
        assert.equal(result.pontosEnquantoBloqueado, 2);
        assert.equal(result.gastos, 2);
        assert.equal(result.nivelSkillDano, 2);
        assert.equal(result.pontosHabilidade, 0);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("validação do progresso offline aceita dados coerentes e rejeita inválidos", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.ValidarRecompensasOffline === "function");
        const errors = await page.evaluate(() => {
            const valid = {
                tempoMs: 60_000,
                dano: 10,
                gold: 25,
                abates: 2,
                inimigosTela: 1,
                vidasInimigos: [10, 0, 0, 0],
                baus: [{ gold: 5, esmeraldas: 0 }]
            };
            const validar = value => {
                try {
                    ValidarRecompensasOffline(value, 5 * 60 * 60 * 1000, 2);
                    return null;
                } catch (error) {
                    return error.message;
                }
            };
            return {
                valido: validar(valid),
                goldNegativo: validar({ ...valid, gold: -1 }),
                vidaInvalida: validar({ ...valid, vidasInimigos: [10, -1, 0, 0] }),
                muitosBaus: validar({ ...valid, baus: [valid.baus[0], valid.baus[0], valid.baus[0]] })
            };
        });

        assert.equal(errors.valido, null);
        assert.match(errors.goldNegativo, /recompensas offline/);
        assert.match(errors.vidaInvalida, /vidas dos inimigos/);
        assert.match(errors.muitosBaus, /baús do progresso offline/);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("companheiro de gold calcula renda e conquistas aplicam bônus por nível", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.GoldCompanheiroPorSegundo === "function");
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            UI.showMilestone = () => {};
            andar = 10;
            mulGold = 0.2;
            lvlComp2 = 2;
            cmNivelGoldComp2 = 0;
            cmNivelGold = 0;
            formigasAmarelas = 0;
            velAtaqueComp = 1.25;
            especializacao = 0;
            conquistasComp = [0, 0, 0, 0, 0];

            const goldPorSegundoBase = GoldCompanheiroPorSegundo();
            const intervaloCompanheiro = IntervaloAtaqueComp();
            for (const [indice, nivel] of [[0, 2], [1, 2], [2, 3], [3, 2], [4, 3]]) {
                SobeNivelConquistaComp(indice, nivel);
            }
            const repetida = SobeNivelConquistaComp(2, 2);
            gold = new GoldNumber(0);
            totalGold = new GoldNumber(0);
            goldCompanheirosAcumulado = 0;
            ticksGoldCompanheiros = 0;
            UI.showCurrencyReward = () => {};
            GoldCompanheiros();
            return {
                goldPorSegundoBase,
                intervaloCompanheiro,
                repetida,
                niveis: conquistasComp.slice(),
                dano: MultiplicadorDanoConquistaComp(),
                gold: MultiplicadorGoldConquistaComp(),
                missao: MultiplicadorMissaoConquistaComp(),
                fuga: BonusFugaConquistaComp(),
                xp: MultiplicadorXPConquistaComp(),
                goldPorSegundoComConquista: GoldCompanheiroPorSegundo(),
                goldAdicionado: gold.toNumber(),
                totalGoldAdicionado: totalGold.toNumber()
            };
        });

        assert.ok(Math.abs(result.goldPorSegundoBase - 0.7) < 1e-10);
        assert.equal(result.intervaloCompanheiro, 800);
        assert.equal(result.repetida, false, "não sobe novamente para nível abaixo do atual");
        assert.deepEqual(result.niveis, [2, 2, 3, 2, 3]);
        assert.equal(result.dano, 1.1);
        assert.equal(result.gold, 1.1);
        assert.equal(result.missao, 1.75);
        assert.equal(result.fuga, 10);
        assert.equal(result.xp, 1.3);
        assert.ok(Math.abs(result.goldPorSegundoComConquista - 0.7) < 1e-10);
        assert.ok(Math.abs(result.goldAdicionado - 0.77) < 1e-10);
        assert.ok(Math.abs(result.totalGoldAdicionado - 0.7) < 1e-10);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("simulação offline mantém vidas, conta mortes e reinicia onda completa", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.SimulaDanoOffline === "function");
        const result = await page.evaluate(() => {
            vidaAndar = 10;
            andar = 1;
            vidaInimigo1 = 10;
            vidaInimigo2 = vidaInimigo3 = vidaInimigo4 = 0;
            const danoParcial = SimulaDanoOffline(3);

            vidaInimigo1 = 10;
            const ondasCompletasMaisSobra = SimulaDanoOffline(25);

            andar = 15; // três inimigos ativos
            vidaInimigo1 = vidaInimigo2 = vidaInimigo3 = 10;
            vidaInimigo4 = 0;
            const variasVidas = SimulaDanoOffline(25);
            return { danoParcial, ondasCompletasMaisSobra, variasVidas };
        });

        assert.deepEqual(result.danoParcial, {
            vidasInimigos: [7, 0, 0, 0], abates: 0, inimigosTela: 1
        });
        assert.deepEqual(result.ondasCompletasMaisSobra, {
            vidasInimigos: [5, 0, 0, 0], abates: 2, inimigosTela: 1
        });
        assert.deepEqual(result.variasVidas, {
            vidasInimigos: [5, 0, 0, 0], abates: 2, inimigosTela: 1
        });
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("baú de builds desbloqueia a cada 10 andares, acumula e consome por escolha", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof Tapeira?.ItensBuild?.tentaBau === "function");
        const result = await page.evaluate(() => {
            const build = Tapeira.ItensBuild;
            volumeAtual = 0;
            build.limpa();
            UI.removeBauBuild();

            andar = 100;
            maxAndar = 99;
            build.tentaBau();
            const bloqueado = {
                desbloqueada: build.desbloqueada(),
                pendente: build.pendente(),
                bauVisivel: !!document.getElementById("bauBuild")
            };

            maxAndar = 100;
            build.tentaBau(); // marco 100
            const bauOriginal = document.getElementById("bauBuild");
            andar = 105;
            build.tentaBau(); // fora do marco: não gera baú
            const foraDoMarco = {
                quantidade: build.quantidadeBausPendentes(),
                mesmoBau: bauOriginal === document.getElementById("bauBuild")
            };
            andar = 110;
            build.tentaBau(); // marco 110 acumula sobre o pendente
            const acumulados = {
                quantidade: build.quantidadeBausPendentes(),
                bauRecriado: bauOriginal !== document.getElementById("bauBuild"),
                selo: document.getElementById("bauBuild-selo")?.textContent,
                ariaLabel: document.getElementById("bauBuild")?.getAttribute("aria-label")
            };

            build.abreEscolha();
            const opcoes = [...document.querySelectorAll("#modalItensBuild [data-item]")]
                .map(botao => botao.getAttribute("data-item"));
            // Espaço com o modal aberto não deve re-sortear as três opções.
            document.getElementById("bauBuild").dispatchEvent(new KeyboardEvent("keydown", {
                key: " ", bubbles: true, cancelable: true
            }));
            const aposEspaco = [...document.querySelectorAll("#modalItensBuild [data-item]")]
                .map(botao => botao.getAttribute("data-item"));
            // "Não escolher nenhum item" consome um baú e zera as opções sorteadas.
            document.querySelector("[data-item-build-skip]").click();
            const aposDescartar = {
                quantidade: build.quantidadeBausPendentes(),
                opcoes: build.serializa().opcoesBauBuild,
                modalFechado: !document.getElementById("modalItensBuild"),
                selo: document.getElementById("bauBuild-selo")?.textContent
            };
            build.abreEscolha();
            const aoReabrir = [...document.querySelectorAll("#modalItensBuild [data-item]")]
                .map(botao => botao.getAttribute("data-item"));
            const escolhido = aoReabrir[0];
            document.querySelector(`#modalItensBuild [data-item="${escolhido}"]`).click();

            // um terceiro marco deixa outro baú pendente para o Status mostrar
            andar = 120;
            build.tentaBau();
            UI.showStatus();
            const resumoNoStatus = [...document.querySelectorAll("#StatusBody tr")]
                .find(linha => linha.cells[0]?.textContent === "Itens da build")?.textContent || "";

            return {
                bloqueado,
                desbloqueada: build.desbloqueada(),
                foraDoMarco,
                acumulados,
                opcoes,
                aposEspaco,
                aposDescartar,
                aoReabrir,
                escolhido,
                nomeEscolhido: build.item(escolhido).nome,
                lista: build.pegaLista(),
                quantidadeFinal: build.quantidadeBausPendentes(),
                pendente: build.pendente(),
                modalFechado: !document.getElementById("modalItensBuild"),
                seloFinal: document.getElementById("bauBuild-selo")?.textContent,
                resumoNoStatus,
                save: JSON.parse(localStorage.getItem("autoSaveCaverna"))
            };
        });

        assert.deepEqual(result.bloqueado, { desbloqueada: false, pendente: false, bauVisivel: false });
        assert.equal(result.desbloqueada, true);
        assert.deepEqual(result.foraDoMarco, { quantidade: 1, mesmoBau: true },
            "andar fora do múltiplo de 10 não gera baú");
        assert.deepEqual(result.acumulados, {
            quantidade: 2,
            bauRecriado: true,
            selo: "ITENS ×2",
            ariaLabel: "Abrir 2 baús de itens da build"
        });
        assert.equal(result.opcoes.length, 3);
        assert.equal(new Set(result.opcoes).size, 3, "as três opções devem ser distintas");
        assert.deepEqual(result.aposEspaco, result.opcoes, "Espaço com o modal aberto não pode rerrolar opções");
        assert.deepEqual(result.aposDescartar, {
            quantidade: 1,
            opcoes: null,
            modalFechado: true,
            selo: "ITENS"
        }, "ignorar consome um baú, fecha o modal e zera as opções");
        assert.equal(result.aoReabrir.length, 3);
        assert.equal(new Set(result.aoReabrir).size, 3, "ao reabrir, o baú restante sortea 3 opções distintas");
        assert.deepEqual(result.lista, [result.escolhido]);
        assert.equal(result.quantidadeFinal, 1, "o terceiro marco deixa mais um baú pendente");
        assert.equal(result.pendente, true);
        assert.equal(result.modalFechado, true);
        assert.equal(result.seloFinal, "ITENS");
        assert.match(result.resumoNoStatus, /baú\(s\) pendente\(s\)/);
        assert.ok(result.resumoNoStatus.includes(result.nomeEscolhido),
            "o Status mostra o item escolhido");
        assert.deepEqual({
            itensBuild: result.save.itensBuild,
            bausBuildPendentes: result.save.bausBuildPendentes,
            bauBuildPendente: result.save.bauBuildPendente,
            opcoesBauBuild: result.save.opcoesBauBuild
        }, {
            itensBuild: [result.escolhido],
            bausBuildPendentes: 1,
            bauBuildPendente: true,
            opcoesBauBuild: null
        });
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("efeitos dos itens, limite de seis e troca descartando a pilha inteira", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof Tapeira?.ItensBuild?.carrega === "function");
        const result = await page.evaluate(() => {
            const build = Tapeira.ItensBuild;
            const efeitos = [
                ["adaga", "multDano", 1.15],
                ["escudo", "multGuardiao", 1.30],
                ["moedas", "multGold", 1.20],
                ["mapa", "multEvento", 1.25],
                ["relogio", "multFuga", 1.10],
                ["grimorio", "multXP", 1.20],
                ["pocaoVerde", "multChanceCrit", 1.50],
                ["pocaoRubra", "multDanoCrit", 1.25],
                ["lanterna", "multDanoAuto", 1.20],
                ["colarFormigas", "multDanoComp", 1.20],
                ["bauPortatil", "multBau", 1.15],
                ["esmeralda", "multEsmBau", 1.50]
            ];
            build.limpa();
            const multiplicadorNeutro = build.multDano();
            const multiplicadores = efeitos.map(([id, metodo]) => {
                build.carrega({ itensBuild: [id], bauBuildPendente: false });
                return { id, valor: build[metodo]() };
            });

            build.carrega({ itensBuild: ["adaga", "adaga"], bauBuildPendente: false });
            const copiasAdaga = {
                contagem: build.contagem(),
                copias: build.copias("adaga"),
                multiplicador: build.multDano()
            };

            // Dados desconhecidos são ignorados e a lista nunca ultrapassa o limite (6).
            build.carrega({
                itensBuild: ["adaga", "desconhecido", "adaga", "moedas", "escudo", "mapa", "grimorio", "relogio"],
				bausBuildPendentes: 1,
				bauBuildPendente: true,
				opcoesBauBuild: ["grimorio", "lanterna", "esmeralda"]
            });
            const listaSanitizada = build.pegaLista();
            build.escolhe("lanterna", null); // cheia e sem descarte: não pode exceder o limite
            const escolhaSemDescarte = {
                lista: build.pegaLista(),
                pendente: build.pendente()
            };
			build.abreEscolha();
            const opcoes = [...document.querySelectorAll("#modalItensBuild [data-item]")];
            opcoes[0].click(); // "grimorio" (primeira opção do save); abre a etapa de descarte
            const descartaveis = [...document.querySelectorAll("#modalItensBuild [data-descartar]")];
            const descarteEscolhido = descartaveis[0].getAttribute("data-descartar"); // "adaga": pilha ×2
            descartaveis[0].click(); // descarta a pilha INTEIRA de adaga (2 cópias)

            return {
                multiplicadores,
                multiplicadorNeutro,
                copiasAdaga,
                listaSanitizada,
                escolhaSemDescarte,
                limite: build.LIMITE,
                opcoesDeTroca: descartaveis.length,
                descarteEscolhido,
                copiasAdagaAposDescarte: build.copias("adaga"),
                listaFinal: build.pegaLista(),
                pendente: build.pendente(),
                resumo: build.resumo()
            };
        });

        const esperados = {
            adaga: 1.15, escudo: 1.30, moedas: 1.20, mapa: 1.25,
            relogio: 1.10, grimorio: 1.20, pocaoVerde: 1.50,
            pocaoRubra: 1.25, lanterna: 1.20, colarFormigas: 1.20,
            bauPortatil: 1.15, esmeralda: 1.50
        };
        assert.equal(result.multiplicadores.length, Object.keys(esperados).length);
        for (const { id, valor } of result.multiplicadores) {
            assert.ok(Math.abs(valor - esperados[id]) < 1e-10, `${id}: esperado ${esperados[id]}, recebido ${valor}`);
        }
        assert.equal(result.multiplicadorNeutro, 1);
        assert.deepEqual(result.copiasAdaga, { contagem: 2, copias: 2, multiplicador: 1.15 ** 2 });
        assert.deepEqual(result.listaSanitizada, ["adaga", "adaga", "moedas", "escudo", "mapa", "grimorio"]);
        assert.deepEqual(result.escolhaSemDescarte, {
            lista: ["adaga", "adaga", "moedas", "escudo", "mapa", "grimorio"],
            pendente: true
        });
        assert.equal(result.limite, 6);
        assert.equal(result.opcoesDeTroca, 5, "um cartão por item único na etapa de descarte");
        assert.equal(result.descarteEscolhido, "adaga");
        assert.equal(result.copiasAdagaAposDescarte, 0, "descartar some a pilha inteira");
        assert.equal(result.listaFinal.length, 5, "pilha de 2 saiu e o item novo entrou com 1 cópia");
        assert.deepEqual(result.listaFinal, ["moedas", "escudo", "mapa", "grimorio", "grimorio"]);
        assert.equal(result.pendente, false);
        assert.match(result.resumo, /5\/6/);
        assert.match(result.resumo, /Grimório Estelar ×2/, "cópia repetida empilha no resumo");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("build e baú pendente persistem no reload e são limpos no reset", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof Tapeira?.ItensBuild?.carrega === "function");
        const salvo = await page.evaluate(() => {
            volumeAtual = 0;
            andar = 105;
            maxAndar = 100;
            Tapeira.ItensBuild.carrega({
                itensBuild: ["adaga", "moedas", "relogio"],
                bausBuildPendentes: 2,
                bauBuildPendente: true,
                opcoesBauBuild: ["adaga", "moedas", "relogio"]
            });
            return AutoSaveLocal();
        });
        assert.equal(salvo, true);

        await page.reload({ waitUntil: "domcontentloaded" });
        await page.waitForFunction(() =>
            typeof Tapeira?.ItensBuild?.pegaLista === "function"
            && Tapeira.ItensBuild.pendente()
            && document.getElementById("bauBuild"),
            undefined,
            { timeout: 15000 }
        );

        const loaded = await page.evaluate(() => {
            const antes = {
                itens: Tapeira.ItensBuild.pegaLista(),
                quantidadeBaus: Tapeira.ItensBuild.quantidadeBausPendentes(),
                opcoes: Tapeira.ItensBuild.serializa().opcoesBauBuild,
                pendente: Tapeira.ItensBuild.pendente(),
                bauVisivel: !!document.getElementById("bauBuild"),
                selo: document.getElementById("bauBuild-selo")?.textContent,
                desbloqueada: Tapeira.ItensBuild.desbloqueada()
            };
            Resetar();
            return {
                antes,
                depois: {
                    itens: Tapeira.ItensBuild.pegaLista(),
                    quantidadeBaus: Tapeira.ItensBuild.quantidadeBausPendentes(),
                    opcoes: Tapeira.ItensBuild.serializa().opcoesBauBuild,
                    pendente: Tapeira.ItensBuild.pendente(),
                    bauVisivel: !!document.getElementById("bauBuild"),
                    modalVisivel: !!document.getElementById("modalItensBuild"),
                    desbloqueada: Tapeira.ItensBuild.desbloqueada()
                }
            };
        });

        assert.deepEqual(loaded.antes, {
            itens: ["adaga", "moedas", "relogio"],
            quantidadeBaus: 2,
            opcoes: ["adaga", "moedas", "relogio"],
            pendente: true,
            bauVisivel: true,
            selo: "ITENS ×2",
            desbloqueada: true
        });
        assert.deepEqual(loaded.depois, {
            itens: [],
            quantidadeBaus: 0,
            opcoes: null,
            pendente: false,
            bauVisivel: false,
            modalVisivel: false,
            desbloqueada: true
        });
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("regressão de habilidades, reset e save/load", { timeout: 120000 }, async () => {
    const { context, page, pageErrors } = await openIsolatedPage("test-skill-panel.html?modo=negocio");
    try {
        await page.waitForFunction(() => window.__pronto === true, undefined, { timeout: 110000 });
        const results = await page.evaluate(() => window.__resultados || []);
        const failures = results.filter(result => /^(FALHA|ERRO negócio:|ERRO caso )/.test(result));

        assert.ok(results.some(result => result === "FIM negócio"), "o harness deve concluir os testes de negócio");
        assert.deepEqual(failures, []);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});
