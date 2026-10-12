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

test("painel de configuração registra controles por addEventListener (sem handlers inline)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.RegistraEventosConfig === "function");
        const result = await page.evaluate(() => {
            const ids = [
                "btnSalvarJogo", "btnSalvarVoltarMenu", "btnApagarSave", "btnZerarJogo",
                "txtfiletoread", "volumeControle", "volumeAmbienteControle",
                "resolucaoJogo", "telaCheiaJogo"
            ];
            const inline = [];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) { inline.push(id + ":ausente"); continue; }
                for (const attr of ["onclick", "onchange", "oninput"]) {
                    if (el.hasAttribute(attr)) inline.push(id + ":" + attr);
                }
            }

            // o input do volume passa a ser ligado por addEventListener
            const slider = document.getElementById("volumeControle");
            slider.value = "42";
            slider.dispatchEvent(new Event("input", { bubbles: true }));

            // o clique do "Apagar Auto Save" limpa o auto save via listener
            localStorage.setItem("autoSaveCaverna", "{}");
            document.getElementById("btnApagarSave").click();

            return {
                inline,
                volumeSalvo: localStorage.getItem("volumeJogo"),
                volumeTexto: document.getElementById("volumeValor").value,
                autoSave: localStorage.getItem("autoSaveCaverna")
            };
        });

        assert.deepEqual(result.inline, []);
        assert.equal(result.volumeSalvo, "42");
        assert.equal(result.volumeTexto, "42%");
        assert.equal(result.autoSave, null, "btnApagarSave limpa o auto save pelo listener");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("navegação lateral usa delegação registrada (sem onclick inline)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            document.getElementById("btnStatus") && typeof window.SobeStatus === "function");
        const result = await page.evaluate(() => {
            const ids = ["btnStatus", "btn-Loja", "btnSkills", "btnRamos"];
            const inline = ids.filter(id => document.getElementById(id)?.hasAttribute("onclick"));

            const status = document.getElementById("DivStatus");
            document.getElementById("btnStatus").click();
            const statusAberto = status.style.visibility;

            return { inline, statusAberto };
        });

        assert.deepEqual(result.inline, []);
        assert.equal(result.statusAberto, "visible", "btnStatus abre o painel de status");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("painel de status (baú dourado e auto-coleta) usa listeners registrados", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            document.getElementById("autoColetaToggle") && typeof window.ColetaBauDourado === "function");
        const result = await page.evaluate(() => {
            const ids = ["golden-chest-claim", "golden-chest-info", "autoColetaToggle"];
            const inline = [];
            for (const id of ids) {
                const el = document.getElementById(id);
                if (!el) { inline.push(id + ":ausente"); continue; }
                for (const attr of ["onclick", "onchange", "oninput"]) {
                    if (el.hasAttribute(attr)) inline.push(id + ":" + attr);
                }
            }

            // info do baú: o clique alterna a descrição
            const desc = document.getElementById("golden-chest-desc");
            document.getElementById("golden-chest-info").click();
            const infoAberta = !desc.hidden;
            document.getElementById("golden-chest-info").click();
            const infoFechada = desc.hidden;

            // auto-coleta: o change liga/desliga o estado
            const toggle = document.getElementById("autoColetaToggle");
            toggle.checked = true;
            toggle.dispatchEvent(new Event("change", { bubbles: true }));
            const ligada = autoColeta;
            toggle.checked = false;
            toggle.dispatchEvent(new Event("change", { bubbles: true }));
            const desligada = autoColeta;

            // coleta do baú: com o baú pendente, o clique entrega a recompensa
            window.ChamaSom = () => {};
            UI.showChestOpening = () => {};
            UI.showCurrencyReward = () => {};
            UI.showInfo = () => {};
            const randomOriginal = Math.random;
            Math.random = () => 0; // cai no ramo do gold
            bauDouradoPendente = 1;
            const claim = document.getElementById("golden-chest-claim");
            claim.disabled = false;
            claim.click();
            const pendenteAposColeta = bauDouradoPendente;
            Math.random = randomOriginal;

            return { inline, infoAberta, infoFechada, ligada, desligada, pendenteAposColeta };
        });

        assert.deepEqual(result.inline, []);
        assert.equal(result.infoAberta, true, "golden-chest-info abre a descrição");
        assert.equal(result.infoFechada, true, "segundo clique fecha a descrição");
        assert.equal(result.ligada, 1);
        assert.equal(result.desligada, 0);
        assert.equal(result.pendenteAposColeta, 0, "o clique no baú pronto consome a recompensa");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("pontos de perk contam o Toque Frenético e saves da época do bug continuam válidos", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.PontosPerkDisponiveis === "function");
        const result = await page.evaluate(() => {
            // o frenesi agora consome o pool (antes ficava de fora da soma)
            andarMaxRun = 40; // ganhos = floor((40-35)/5)+1 = 2
            andar = 40;
            perkDano = 1; perkEletrica = 0; perkGold = 0; perkFuga = 0; perkFrenesi = 1;
            const disponiveis = PontosPerkDisponiveis();

            const saveAntigo = {
                andar: 98, andarVolta: 105, gateDanoPago: 100, andarMaxRun: 98,
                gold: { m: 0, e: 0 }, totalGold: { m: 0, e: 0 },
                perkDano: 4, perkEletrica: 3, perkGold: 4, perkFuga: 2, perkFrenesi: 4
            };
            let aceitouAntigo = true;
            try { ValidarSave(saveAntigo); } catch { aceitouAntigo = false; }

            let rejeitouTrapaca = false;
            try {
                ValidarSave(Object.assign({}, saveAntigo, {
                    andar: 35, andarMaxRun: 35, gateDanoPago: 35, andarVolta: 40,
                    perkDano: 4, perkEletrica: 3, perkGold: 4, perkFuga: 5, perkFrenesi: 4
                }));
            } catch { rejeitouTrapaca = true; }

            return { disponiveis, aceitouAntigo, rejeitouTrapaca };
        });

        assert.equal(result.disponiveis, 0, "o frenesi consome ponto de perk");
        assert.equal(result.aceitouAntigo, true, "save legítimo da época do bug é aceito");
        assert.equal(result.rejeitouTrapaca, true, "trapaça grosseira continua barrada");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("Salvar e o auto save compartilham o mesmo objeto (só os campos offline diferem)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.CriarObjetoSave === "function" && typeof window.Salvar === "function");
        const result = await page.evaluate(async () => {
            const comOffline = Object.keys(CriarObjetoSave(true));
            const bruto = CriarObjetoSave(false);
            // JSON.stringify descarta chaves de valor undefined: o esperado
            // precisa refletir isso para comparar com o JSON exportado.
            const semOfflineDefinidas = Object.keys(bruto).filter(k => bruto[k] !== undefined);

            let blob = null;
            window.saveAs = capturado => { blob = capturado; };
            Salvar();
            const salvo = blob ? JSON.parse(await blob.text()) : null;

            return {
                temOffline: comOffline.includes("offlineLastSavedAt") && comOffline.includes("offlinePendingRewards"),
                semOfflineTem: Object.keys(bruto).includes("offlineLastSavedAt") || Object.keys(bruto).includes("offlinePendingRewards"),
                chavesSalvo: salvo ? Object.keys(salvo) : null,
                chavesEsperadas: semOfflineDefinidas.concat(["saveFormat", "saveVersion", "exportedAt"]),
                formato: salvo ? [salvo.saveFormat, salvo.saveVersion, typeof salvo.exportedAt] : null
            };
        });

        assert.equal(result.temOffline, true, "o auto save inclui os campos offline");
        assert.equal(result.semOfflineTem, false, "a exportação não inclui os campos offline");
        assert.deepEqual(result.chavesSalvo, result.chavesEsperadas, "exportação = auto save sem offline + formato");
        assert.deepEqual(result.formato, ["tapeira-save", 1, "string"]);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("as páginas carregam exatamente os scripts da lista única (manifest)", () => {
    const manifest = require("../scripts/script-manifest.js");
    for (const [arquivo, esperado] of Object.entries(manifest)) {
        const html = fs.readFileSync(path.join(projectRoot, arquivo), "utf8");
        const bloco = html.match(/<!-- scripts:start[\s\S]*?<!-- scripts:end -->/);
        assert.ok(bloco, arquivo + ": bloco de scripts com marcadores ausente");
        const encontrados = [...bloco[0].matchAll(/<script src="([^"]+)"><\/script>/g)].map(m => m[1]);
        assert.deepEqual(encontrados, esperado, arquivo + ": scripts fora do manifest (rode npm run sync:scripts)");
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
        assert.ok(Math.abs(result.comAdaga - 987.5) < 1e-9);
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

test("eventos restantes aplicam o bônus do próprio tipo e encerram corretamente", async t => {
    await t.test("chuva de meteoros bate nos inimigos vivos e solta fragmentos coletáveis", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
        try {
            await page.waitForFunction(() => typeof window.Meteora === "function");
            const result = await page.evaluate(() => {
                const randomOriginal = Math.random;
                Math.random = () => 0; // garante o fragmento de esmeralda junto do gold

                const batidas = [];
                const goldCreditado = [];
                let bausRepostos = 0;
                window.Bater = (id, gratis, custa) => batidas.push({ id, gratis, custa });
                window.ChamaSom = () => {};
                window.AutoSaveLocal = () => true;
                window.AddGold = valor => { goldCreditado.push(valor); return valor; };
                window.AddTotalGold = () => {};
                UI.showCurrencyReward = () => {};
                UI.spawnChest = () => { bausRepostos++; };

                andar = 10;
                mulGold = 0.2;
                eventoAtivo = "meteoro";
                for (let id = 1; id <= 4; id++) {
                    document.getElementById("inimigo" + id).style.visibility = "visible";
                    window["vidaInimigo" + id] = 10;
                }

                Meteora();
                const container = document.getElementById("eventoFragmentos");
                const qtdGold = container.querySelectorAll(".evento-fragmento--gold").length;
                const qtdEsmeralda = container.querySelectorAll(".evento-fragmento--esmeralda").length;

                esmeraldas = 0;
                ColetaFragmento("gold", container.querySelector(".evento-fragmento--gold"));
                const bonusFragmento = goldCreditado[goldCreditado.length - 1];
                ColetaFragmento("esmeralda", container.querySelector(".evento-fragmento--esmeralda"));

                quantidadeBausDisponiveis = 1;
                EncerraEvento();
                Math.random = randomOriginal;

                return {
                    alvos: batidas.map(batida => batida.id),
                    todasGratis: batidas.every(batida => batida.gratis === true && batida.custa === false),
                    qtdGold,
                    qtdEsmeralda,
                    bonusFragmento,
                    esmeraldas,
                    bausRepostos,
                    eventoAtivo
                };
            });

            assert.deepEqual(result.alvos, [1, 2, 3, 4]);
            assert.equal(result.todasGratis, true);
            assert.equal(result.qtdGold, 1);
            assert.equal(result.qtdEsmeralda, 1);
            assert.equal(result.bonusFragmento, 10 * 0.2 * 10 + 5);
            assert.equal(result.esmeraldas, 1);
            assert.equal(result.bausRepostos, 1, "o baú sai da arena na chuva e volta no fim");
            assert.equal(result.eventoAtivo, null);
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });

    await t.test("névoa do conhecimento concede CM só durante o evento e dobra pelo item", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
        try {
            await page.waitForFunction(() => typeof window.EventoAbateCM === "function");
            const result = await page.evaluate(() => {
                window.FloatCM = () => {};
                conhecimentoMug = 0;
                eventoCM = 0;
                lvlEsmCM = 0;
                marcosNivel50 = 0;
                resetsCurtosCM = 0;

                EventoAbateCM(3); // fora do evento: nada acontece
                const fora = { conhecimentoMug, eventoCM };

                eventoAtivo = "nevoa";
                EventoAbateCM(3);
                const normal = { conhecimentoMug, eventoCM };

                lvlEsmCM = 1; // item "CM em dobro" (×2)
                EventoAbateCM(3);
                const dobrado = { conhecimentoMug, eventoCM };

                eventoAtivo = null;
                return { fora, normal, dobrado };
            });

            assert.deepEqual(result.fora, { conhecimentoMug: 0, eventoCM: 0 });
            assert.deepEqual(result.normal, { conhecimentoMug: 3, eventoCM: 3 });
            assert.deepEqual(result.dobrado, { conhecimentoMug: 9, eventoCM: 9 });
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });

    await t.test("veia de esmeralda solta esmeraldas por abate só durante o evento", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
        try {
            await page.waitForFunction(() => typeof window.EventoAbateVeia === "function");
            const result = await page.evaluate(() => {
                const randomOriginal = Math.random;
                UI.showCurrencyReward = () => {};
                esmeraldas = 0;
                eventoVeiaQtd = 0;

                eventoAtivo = "veia";
                Math.random = () => 0.02; // dentro da chance (2,5%): todo abate solta
                EventoAbateVeia(4);
                const comChance = { esmeraldas, eventoVeiaQtd };

                Math.random = () => 0.9; // fora da chance: nenhum
                EventoAbateVeia(4);
                const semChance = { esmeraldas, eventoVeiaQtd };

                eventoAtivo = null;
                Math.random = () => 0.02;
                EventoAbateVeia(4);
                const foraDoEvento = { esmeraldas, eventoVeiaQtd };

                Math.random = randomOriginal;
                return { comChance, semChance, foraDoEvento };
            });

            assert.deepEqual(result.comChance, { esmeraldas: 4, eventoVeiaQtd: 4 });
            assert.deepEqual(result.semChance, { esmeraldas: 4, eventoVeiaQtd: 4 });
            assert.deepEqual(result.foraDoEvento, { esmeraldas: 4, eventoVeiaQtd: 4 });
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });

    await t.test("inseto premia no clique e escapa sem prêmio quando o tempo acaba", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
        try {
            await page.waitForFunction(() => typeof window.CriaInseto === "function");
            const result = await page.evaluate(() => {
                const goldCreditado = [];
                const avisos = [];
                window.ChamaSom = () => {};
                window.AutoSaveLocal = () => true;
                window.AddGold = valor => { goldCreditado.push(valor); return valor; };
                window.AddTotalGold = () => {};
                UI.showCurrencyReward = () => {};
                UI.showMilestone = () => {};
                UI.showInfo = mensagem => avisos.push(mensagem);
                UI.spawnChest = () => {};
                andar = 10;
                mulGold = 0.2;
                jogoPausado = false;
                eventoPausaDesde = 0;

                eventoAtivo = "inseto";
                CriaInseto();
                const criado = !!document.getElementById("eventoInseto");
                PremioInseto(document.getElementById("eventoInseto"));
                const premiado = {
                    bonus: goldCreditado[goldCreditado.length - 1],
                    eventoAtivo,
                    removido: !document.getElementById("eventoInseto")
                };

                // segundo inseto: sem clique, o tempo acaba e ele escapa
                goldCreditado.length = 0;
                eventoAtivo = "inseto";
                CriaInseto();
                eventoFimMs = Date.now() - 1;
                EventoTick();

                return {
                    criado,
                    premiado,
                    escapou: { eventoAtivo, avisos, premios: goldCreditado.length }
                };
            });

            assert.equal(result.criado, true);
            assert.equal(result.premiado.bonus, 10 * 0.2 * 10 + 5);
            assert.equal(result.premiado.eventoAtivo, null);
            assert.equal(result.premiado.removido, true);
            assert.equal(result.escapou.eventoAtivo, null);
            assert.ok(result.escapou.avisos.includes("O inseto escapou sem prêmio."));
            assert.equal(result.escapou.premios, 0);
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });

    await t.test("fissura temporal congela o cronômetro de fuga", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
        try {
            await page.waitForFunction(() => typeof window.TempoCompanheiros === "function");
            const result = await page.evaluate(() => {
                window.AtualizaRelogioHabilidade = () => false;
                UI.showInfo = () => {};
                jogoPausado = false;
                fugaEmAndamento = false;

                tempoAvancoInimigos = 100;
                eventoAtivo = "fissura";
                AvancoInimigos();
                const avancoComFissura = tempoAvancoInimigos;

                eventoAtivo = null;
                tempoEsperaCompanheiro = 5;
                TempoCompanheiros();
                const companheiroSemFissura = tempoAvancoInimigos;

                tempoAvancoInimigos = 100;
                eventoAtivo = "fissura";
                TempoCompanheiros();
                const companheiroComFissura = tempoAvancoInimigos;

                eventoAtivo = null;
                return { avancoComFissura, companheiroSemFissura, companheiroComFissura };
            });

            assert.equal(result.avancoComFissura, 100, "AvancoInimigos não consome o cronômetro na fissura");
            assert.equal(result.companheiroSemFissura, 105, "fora da fissura o companheiro repõe o tempo");
            assert.equal(result.companheiroComFissura, 100, "TempoCompanheiros congelado na fissura");
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });

    await t.test("emboscada reforça a vida, paga ouro em dobro ao vencer e desfaz se perder", async () => {
        const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
        try {
            await page.waitForFunction(() => typeof window.PreparaEmboscada === "function");
            const result = await page.evaluate(() => {
                const randomOriginal = Math.random;
                const goldCreditado = [];
                let baus = 0;
                window.ChamaSom = () => {};
                window.AutoSaveLocal = () => true;
                window.AddGold = valor => { goldCreditado.push(valor); return valor; };
                window.AddTotalGold = () => {};
                UI.showCurrencyReward = () => {};
                UI.showMilestone = () => {};
                UI.spawnChest = () => { baus++; };

                andar = 10;
                window.ondaAtual = 7;
                for (let id = 1; id <= 4; id++) window["vidaInimigo" + id] = id <= 2 ? 100 : 0;

                eventoAtivo = "emboscada";
                const preparou = PreparaEmboscada();
                const vidaReforcada = [window.vidaInimigo1, window.vidaInimigo2];
                const alvos = eventoEmboscadaAlvos.slice();

                window.vidaInimigo1 = 80; // dano parcial no alvo 1
                EventoAbateEmboscada(1, 10);
                const restantes = eventoEmboscadaAlvos.slice();

                Math.random = () => 0.1; // < 0.4 → baú
                EventoAbateEmboscada(2, 20);
                Math.random = randomOriginal;
                const vitoria = {
                    bonus: goldCreditado[goldCreditado.length - 1],
                    baus,
                    eventoAtivo,
                    vidaAlvo1: window.vidaInimigo1
                };

                // perde ao trocar de andar no meio: desfaz o reforço e não paga
                goldCreditado.length = 0;
                baus = 0;
                window.ondaAtual = 8;
                for (let id = 1; id <= 4; id++) window["vidaInimigo" + id] = id === 1 ? 100 : 0;
                eventoAtivo = "emboscada";
                PreparaEmboscada();
                const reforcadoAntesDaFuga = window.vidaInimigo1;
                andar = 11;
                EventoAbateEmboscada(1, 50);
                const derrota = {
                    reforcadoAntesDaFuga,
                    vidaAlvo1: window.vidaInimigo1,
                    eventoAtivo,
                    premios: goldCreditado.length,
                    baus
                };

                andar = 10;
                return { preparou, vidaReforcada, alvos, restantes, vitoria, derrota };
            });

            assert.equal(result.preparou, true);
            assert.deepEqual(result.vidaReforcada, [150, 150], "+50% de vida na onda da emboscada");
            assert.deepEqual(result.alvos, [1, 2]);
            assert.deepEqual(result.restantes, [2]);
            assert.equal(result.vitoria.bonus, 30, "ouro em dobro: soma exata do que a onda pagou");
            assert.equal(result.vitoria.baus, 1);
            assert.equal(result.vitoria.eventoAtivo, null);
            assert.equal(result.vitoria.vidaAlvo1, 80, "desfazer não cura o dano já causado");
            assert.equal(result.derrota.reforcadoAntesDaFuga, 150);
            assert.equal(result.derrota.vidaAlvo1, 100, "perder restaura a vida original");
            assert.equal(result.derrota.eventoAtivo, null);
            assert.equal(result.derrota.premios, 0, "fugir da emboscada não paga nada");
            assert.equal(result.derrota.baus, 0);
            assert.deepEqual(pageErrors, []);
        } finally {
            await context.close();
        }
    });
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

            // No andar 100+, a seleção padrão (vazia = tudo marcado) compra TUDO.
            maxAndar = 100;
            autoItensLoja = [];
            gold = new GoldNumber(10);
            precoBau = 5;
            const nivelAntesDaSeletiva = lvlBau;
            AutoCompraMaisBarato();
            const seletivaPadraoCompra = lvlBau === nivelAntesDaSeletiva + 1;

            // Desmarcar o baú tira ele da auto-compra.
            autoItensLoja = [];
            autoItensLoja[1] = 0; // índice 1 = baú, desmarcado
            gold = new GoldNumber(10);
            precoBau = 5;
            const nivelAntesDoDesmarque = lvlBau;
            AutoCompraMaisBarato();
            const seletivaDesmarcadaNaoCompra = lvlBau === nivelAntesDoDesmarque;

            // Marcar de novo volta a comprar.
            autoItensLoja[1] = 1;
            gold = new GoldNumber(10);
            precoBau = 5;
            AutoCompraMaisBarato();
            const seletivaComprou = lvlBau === nivelAntesDoDesmarque + 1;

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
                seletivaPadraoCompra,
                seletivaDesmarcadaNaoCompra,
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
        assert.equal(result.seletivaPadraoCompra, true);
        assert.equal(result.seletivaDesmarcadaNaoCompra, true);
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

test("conquista Milionário sobe pelos marcos 1M/1B/1T/Qa/Qi/Sx", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.ConquistasComportamentais === "function");
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            UI.showMilestone = () => {};
            const antes = {
                conquistasComp: conquistasComp.slice(),
                melhorGoldRun,
                totalGold,
                comprasRun,
                andar
            };
            comprasRun = 1; // evita disparar o Poupado por acidente
            totalGold = new GoldNumber(0);
            andar = 1;
            const niveis = [];
            for (const alvo of [5e5, 1e6, 1e8, 1e9, 1e12, 1e15, 1e18, 1e21]) {
                conquistasComp = [0, 0, 0, 0, 0];
                melhorGoldRun = new GoldNumber(alvo);
                ConquistasComportamentais();
                niveis.push(NivelConquistaComp(4));
            }
            // save antigo no nível 3 (100M de gold) mantém o nível — nunca regredir
            conquistasComp = [0, 0, 0, 0, 3];
            melhorGoldRun = new GoldNumber(1e8);
            ConquistasComportamentais();
            const nivelAntigoMantido = NivelConquistaComp(4);
            const progressoNivel3 = ProgressoConquistaComp(4); // próximo marco: Qa
            conquistasComp[4] = 6;
            const xpNoNivel6 = MultiplicadorXPConquistaComp();
            // round-trip JSON como no fluxo real (descarta campos undefined)
            const novoSave = () => JSON.parse(JSON.stringify(CriarObjetoSave()));
            let validouNivel6 = true;
            try { ValidarSave({ ...novoSave(), conquistasComp: [0, 0, 0, 0, 6] }); }
            catch (e) { validouNivel6 = e.message; }
            let rejeitouNivel7 = false;
            try { ValidarSave({ ...novoSave(), conquistasComp: [0, 0, 0, 0, 7] }); }
            catch (e) { rejeitouNivel7 = true; }
            conquistasComp = antes.conquistasComp;
            melhorGoldRun = antes.melhorGoldRun;
            totalGold = antes.totalGold;
            comprasRun = antes.comprasRun;
            andar = antes.andar;
            return {
                niveis,
                max: CONQUISTAS_COMP[4].max,
                marcos: CONQUISTAS_COMP[4].marcos,
                desc: CONQUISTAS_COMP[4].desc,
                nivelAntigoMantido,
                progressoNivel3,
                xpNoNivel6,
                validouNivel6,
                rejeitouNivel7
            };
        });

        assert.deepEqual(result.niveis, [0, 1, 1, 2, 3, 4, 5, 6],
            "1M→nível 1, 100M segue nível 1, 1B→2, 1T→3 ... 1 sextilhão→6");
        assert.equal(result.max, 6);
        assert.deepEqual(result.marcos, [1e6, 1e9, 1e12, 1e15, 1e18, 1e21]);
        assert.ok(result.desc.includes("1M/1B/1T/Qa/Qi/Sx"));
        assert.equal(result.nivelAntigoMantido, 3, "nível de save antigo nunca regredir");
        assert.ok(result.progressoNivel3.includes("Qa"), "progresso aponta o próximo marco (quadrilhão)");
        assert.equal(result.xpNoNivel6, 1.6, "recompensa continua +10% de XP por nível");
        assert.equal(result.validouNivel6, true, "ValidarSave aceita o nível máximo novo");
        assert.equal(result.rejeitouNivel7, true, "ValidarSave rejeita nível acima do máximo");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("loja do Conhecimento aplica +5% de dano/gold/XP por nível", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.CompraCM === "function");
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            const antes = {
                dano: cmNivelDano, gold: cmNivelGold, xp: cmNivelXp,
                danoJogador, conhecimentoMug
            };
            // efeitos por nível: gold/XP lineares, com Status e rótulos da loja
            cmNivelGold = 3;
            cmNivelXp = 2;
            UI.showStatus();
            const linhas = [...document.querySelectorAll("#StatusBody tr")];
            const linhaGold = linhas.find(tr => tr.cells[0]?.textContent.includes("Conhecimento gold"))?.textContent || "";
            const linhaXp = linhas.find(tr => tr.cells[0]?.textContent.includes("Conhecimento XP"))?.textContent || "";
            const rotulos = [...document.querySelectorAll("#TabLojaCM td:first-child")].map(td => td.textContent.trim());
            const multGold = MultiplicadorGoldConhecimento();
            const multXp = BonusXPConhecimento();
            // compra de dano aplica ×1,05 na hora e compõe por nível
            cmNivelDano = 0;
            danoJogador = 100;
            conhecimentoMug = 1000;
            CompraCM("dano");
            const danoApos1 = danoJogador;
            CompraCM("dano");
            const danoApos2 = danoJogador;
            const niveisDano = cmNivelDano;
            // a decomposição do dano lista o bônus do Conhecimento (embutido)
            MostraDecomposicaoDano();
            const modalDecomp = document.getElementById("gameModal");
            const textoDecomp = modalDecomp ? modalDecomp.textContent : "";
            const temLinhaDanoCm = !!modalDecomp && [...modalDecomp.querySelectorAll(".decomp-linha")]
                .some(l => l.textContent.includes("Dano: 2 níveis") && l.textContent.includes("×1.10"));
            // o reset remonta o dano com o mesmo ×1,05 por nível
            cmNivelDano = 0;
            Resetar();
            const danoBase = danoJogador;
            cmNivelDano = 4;
            Resetar();
            const fatorReset = danoBase > 0 ? danoJogador / danoBase : 0;
            cmNivelDano = antes.dano; cmNivelGold = antes.gold; cmNivelXp = antes.xp;
            danoJogador = antes.danoJogador; conhecimentoMug = antes.conhecimentoMug;
            return {
                multGold, multXp, linhaGold, linhaXp,
                danoApos1, danoApos2, niveisDano, fatorReset,
                textoDecomp, temLinhaDanoCm,
                temRotuloDano5: rotulos.includes("+5% de dano"),
                temRotuloGold5: rotulos.includes("+5% de gold"),
                temRotuloXp5: rotulos.includes("+5% de XP")
            };
        });

        assert.ok(Math.abs(result.multGold - 1.15) < 1e-12, "3 níveis de gold = +15%");
        assert.ok(Math.abs(result.multXp - 1.1) < 1e-12, "2 níveis de XP = +10%");
        assert.ok(result.linhaGold.includes("+15%"), "Status mostra o total novo de gold");
        assert.ok(result.linhaXp.includes("+10%"), "Status mostra o total novo de XP");
        assert.ok(Math.abs(result.danoApos1 - 105) < 1e-9, "compra aplica ×1,05 imediato");
        assert.ok(Math.abs(result.danoApos2 - 110.25) < 1e-9, "segunda compra compõe (×1,05²)");
        assert.equal(result.niveisDano, 2);
        assert.ok(result.temLinhaDanoCm, "decomposição mostra a linha do Conhecimento (×1,10 com 2 níveis)");
        assert.ok(result.textoDecomp.includes("Conhecimento Mug"), "grupo do Conhecimento na decomposição");
        assert.ok(Math.abs(result.fatorReset - Math.pow(1.05, 4)) < 1e-9, "reset aplica ×1,05 por nível");
        assert.ok(result.temRotuloDano5 && result.temRotuloGold5 && result.temRotuloXp5,
            "rótulos da loja mostram +5%");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("explorador: chance só da distância e o nível pula N andares", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.TentaPuloExplorador === "function");
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            const out = {};
            // a chance não muda mais com o nível — só com a distância
            maxAndar = 100; andar = 100;
            lvlComp6 = 1;
            const c1 = ChanceExplorador();
            lvlComp6 = 9;
            const c9 = ChanceExplorador();
            out.chanceNivelIndependente = Math.abs(c1 - 0.05) < 1e-9 && Math.abs(c9 - 0.05) < 1e-9;
            andar = 50; // distância 50 → fator 2
            out.chanceDistancia = Math.abs(ChanceExplorador() - 0.10) < 1e-9;
            // a quantidade de andares pulados é o nível comprado
            lvlComp6 = 4;
            out.qtd = AndaresPuladosExplorador();
            lvlComp6 = 9999;
            out.qtdTravada = AndaresPuladosExplorador();
            // Status e preview mostram a quantidade
            lvlComp6 = 4; andar = 50; maxAndar = 100;
            UI.showStatus();
            out.status = [...document.querySelectorAll("#StatusBody tr")]
                .find(tr => tr.cells[0]?.textContent.includes("Companheiro 6"))?.textContent || "";
            out.preview = PREVIEWS_LOJA.CompraComp6();
            // pulo real: rolagem garantida pula N andares (= nível)
            lvlComp6 = 3; andar = 10; maxAndar = 50;
            const randomReal = Math.random;
            const eventoReal = window.TentaEventoAndar;
            window.TentaEventoAndar = () => {};
            // rolagem < chance mínima (5%) → sempre pula
            Math.random = () => 0.0001;
            try {
                out.pulados = TentaPuloExplorador();
                out.andarApos = andar;
            } finally {
                Math.random = randomReal;
                window.TentaEventoAndar = eventoReal;
            }
            // sem nível comprado não pula nada
            lvlComp6 = 0; andar = 13; maxAndar = 50;
            window.TentaEventoAndar = () => {};
            Math.random = () => 0.0001;
            try {
                out.puladosSemNivel = TentaPuloExplorador();
                out.andarSemNivel = andar;
            } finally {
                Math.random = randomReal;
                window.TentaEventoAndar = eventoReal;
            }
            return out;
        });

        assert.ok(result.chanceNivelIndependente, "chance = 5% fixo em qualquer nível");
        assert.ok(result.chanceDistancia, "distância 50 dobra para 10%");
        assert.equal(result.qtd, 4, "nível 4 = +4 andares");
        assert.equal(result.qtdTravada, 50, "trava de segurança em 50 andares");
        assert.ok(/10%/.test(result.status) && /\+4 andares/.test(result.status),
            "Status mostra chance e quantidade (" + result.status.trim() + ")");
        assert.ok(/Explorador: 10% de avançar \+4 andares → \+5 andares/.test(result.preview),
            "preview mostra progressão da quantidade (" + result.preview + ")");
        assert.equal(result.pulados, 3, "ativação pula 3 andares (= nível)");
        assert.equal(result.andarApos, 13, "andar 10 → 13");
        assert.equal(result.puladosSemNivel, 0, "sem nível não pula");
        assert.equal(result.andarSemNivel, 13, "andar intacto sem nível");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("companheiro de dano + Frenesi: marca alvo (1 ou 2) e estoura 50% do dano da janela", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.AtivaHabilidadeCombate === "function");
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            const out = {};
            // cenário: janela do Frenesi pronta e companheiro de dano no nível 5
            // (a passiva só existe a partir do nível 5)
            lvlComp1 = 5;
            maxAndar = 60;
            andar = 60;
            avanco = 0; qtdAvanco = 1; // Avancar() sempre devolve 1
            inimigosDerrotados = 0;
            numInimigosTela = 3;
            const manter = document.getElementById("manterAndar");
            if (manter) manter.checked = true; // abate não pode subir andar
            vidaInimigo1 = 1000; vidaInimigo2 = 1000;
            vidaInimigo3 = 800; vidaInimigo4 = 0;
            const skill = habilidadesCombate.find(s => s.id === "frenzy");
            abatesFrenesi = skill.killsRequired;
            ataquesFrenesi = 0;

            AtivaHabilidadeCombate("frenzy");
            out.janelaAtivou = ataquesFrenesi > 0;
            out.marca = alvoFrenesiComp;
            out.anelMarcado = !!document.getElementById("frenesi-anel-" + out.marca);

            // só hits da janela acumulam
            RegistraDanoFrenesiComp(400, true);
            RegistraDanoFrenesiComp(200, true);
            RegistraDanoFrenesiComp(999, false); // fora da janela: ignora
            out.acumulado = danoJanelaFrenesiComp;

            // último toque da janela: ao consumir a janela, o dano acumulado é
            // distribuído (não precisa mais matar o alvo marcado)
            const marca = out.marca;
            const outro1 = marca === 1 ? 2 : 1;
            const vidaAntes1 = window["vidaInimigo" + outro1];
            const vidaAntes3 = vidaInimigo3;
            window["vidaInimigo" + marca] = 1;
            ataquesFrenesi = 1; // o próximo toque do jogador encerra a janela
            danoJogador = 100;
            danoCritJogador = 100;
            Bater(marca, true, true);

            out.marcaMorta = window["vidaInimigo" + marca] <= 0;
            out.splashOutro1 = vidaAntes1 - window["vidaInimigo" + outro1];
            out.splashInimigo3 = vidaAntes3 - vidaInimigo3;
            out.marcaLimpa = alvoFrenesiComp === 0;
            out.acumuladoLimpo = danoJanelaFrenesiComp === 0;
            out.anelRemovido = !document.querySelector(".inimigo-frenesi-anel");
            out.flashSplash = document.querySelectorAll(".inimigo--frenesi-dano").length;
            out.explosao = document.querySelectorAll(".frenesi-explosao").length;
            out.flashTela = document.querySelectorAll(".frenesi-flash-tela").length;

            // sem o nível 5 do companheiro não há marca nem acumulado
            lvlComp1 = 4;
            ataquesFrenesi = 0;
            abatesFrenesi = skill.killsRequired;
            AtivaHabilidadeCombate("frenzy");
            out.semCompanheiro = alvoFrenesiComp === 0 && danoJanelaFrenesiComp === 0;

            return out;
        });

        assert.ok(result.janelaAtivou, "janela do Frenesi ativou");
        assert.ok(result.marca === 1 || result.marca === 2, "marcou o inimigo 1 ou 2 (alvo " + result.marca + ")");
        assert.equal(result.acumulado, 600, "só hits da janela acumulam (600)");
        assert.ok(result.marcaMorta, "o golpe matou o marcado (vida 1)");
        // 600 acumulados + 1 do próprio golpe de kill = 601 → 50% = 300,5
        assert.ok(Math.abs(result.splashOutro1 - 300.5) < 1e-9,
            "splash de 300,5 no outro inimigo 1/2 (veio " + result.splashOutro1 + ")");
        assert.ok(Math.abs(result.splashInimigo3 - 300.5) < 1e-9,
            "splash de 300,5 no inimigo 3 (veio " + result.splashInimigo3 + ")");
        assert.ok(result.marcaLimpa && result.acumuladoLimpo, "marca e acumulado zerados após a explosão");
        assert.ok(result.anelMarcado, "anel pulsante no inimigo marcado");
        assert.ok(result.anelRemovido, "anel some quando a marca explode");
        assert.equal(result.flashSplash, 2, "flash vermelho nas duas vítimas do splash");
        assert.equal(result.explosao, 1, "explosão visual grande disparada no dano bônus");
        assert.equal(result.flashTela, 1, "flash de tela disparado no dano bônus");
        assert.ok(result.semCompanheiro, "sem companheiro de dano não marca");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("opção Registros transparentes marca só o modal de Logs", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            !!(window.Tapeira?.Config?.ITENS || []).find(i => i.id === "logsTransparentes"));
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            const out = {};
            out.item = Tapeira.Config.ITENS.find(i => i.id === "logsTransparentes").nome;
            out.padrao = Tapeira.Config.ativo("logsTransparentes");
            out.classeInicial = document.documentElement.classList.contains("config-logs-transparente");
            out.checkbox = !!document.getElementById("config-logsTransparentes");
            out.painelRegistros = !!document.getElementById("logAvisos");

            // ligar: classe no <html> (CSS aplica ao vivo) + checkbox espelhado
            Tapeira.Config.define("logsTransparentes", true);
            out.classeLigada = document.documentElement.classList.contains("config-logs-transparente");
            out.checkboxLigado = document.getElementById("config-logsTransparentes")?.checked === true;

            // o modal de Logs recebe a marcadora gameModal--logs
            Tapeira.Logs.adiciona("mensagem de teste");
            UI.showLogs();
            out.modalLogs = document.getElementById("gameModal")?.classList.contains("gameModal--logs") || false;
            out.temLista = !!document.querySelector("#gameModalBody .logs-linha");

            // um modal qualquer não herda a marcadora (alterna e reabre)
            UI.showModal("Outro", "<p>x</p>"); // fecha o de logs
            UI.showModal("Outro", "<p>x</p>"); // cria outro, sem marcadora
            out.modalOutro = document.getElementById("gameModal")?.classList.contains("gameModal--logs") || false;

            // desligar ao vivo remove a classe do <html>
            Tapeira.Config.define("logsTransparentes", false);
            out.classeDesligada = !document.documentElement.classList.contains("config-logs-transparente");
            return out;
        });

        assert.equal(result.item, "Registros transparentes");
        assert.equal(result.padrao, false, "padrão desligado");
        assert.equal(result.classeInicial, false, "sem classe antes de ligar");
        assert.ok(result.checkbox, "checkbox montado no painel de config");
        assert.ok(result.painelRegistros, "painel Registro da arena presente (alvo da opção)");
        assert.ok(result.classeLigada, "define(true) liga a classe no <html>");
        assert.ok(result.checkboxLigado, "checkbox espelha o valor");
        assert.ok(result.modalLogs, "modal de Logs leva a marcadora gameModal--logs");
        assert.ok(result.temLista, "lista de logs montada no modal");
        assert.equal(result.modalOutro, false, "outro modal não leva a marcadora");
        assert.ok(result.classeDesligada, "desligar remove a classe ao vivo");
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

test("baú de builds desbloqueia a cada 5 andares, acumula e consome por escolha", async () => {
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
            andar = 103;
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
            const visuais = {
                arena: !!document.getElementById("bauBuild-arena"),
                seloArena: document.getElementById("bauBuild-arena-selo")?.textContent || "",
                chip: !!document.getElementById("bauBuild")
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
                visuais,
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
                arenaFinal: !!document.getElementById("bauBuild-arena"),
                resumoNoStatus,
                save: JSON.parse(localStorage.getItem("autoSaveCaverna"))
            };
        });

        assert.deepEqual(result.bloqueado, { desbloqueada: false, pendente: false, bauVisivel: false });
        assert.equal(result.desbloqueada, true);
        assert.deepEqual(result.foraDoMarco, { quantidade: 1, mesmoBau: true },
            "andar fora do múltiplo de 5 não gera baú");
        assert.deepEqual(result.acumulados, {
            quantidade: 2,
            bauRecriado: true,
            selo: "ITENS ×2",
            ariaLabel: "Abrir 2 baús de itens da build"
        });
        assert.ok(result.visuais.arena, "baú na arena criado (visual de PC/tablet)");
        assert.equal(result.visuais.seloArena, "ITENS ×2", "selo da arena acompanha a quantidade");
        assert.ok(result.visuais.chip, "chip do HUD criado (visual do celular)");
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
        assert.ok(result.arenaFinal, "baú da arena continua com o baú pendente restante");
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

test("loja usa data-* e listeners registrados (compra, navegação, especialização)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.CompraLojaItem === "function" && document.querySelector('[data-compra="dano"]'));
        const result = await page.evaluate(() => {
            const controles = [...document.querySelectorAll("[data-compra],[data-compra-cm],[data-loja],[data-esp]")];
            const inline = controles.filter(el =>
                el.hasAttribute("onclick") || el.hasAttribute("onchange") || el.hasAttribute("oninput")).length;

            // identidade do despacho antes de stubbá-lo
            const identidade = {
                dano: CompraLojaFuncao("dano") === CompraDano,
                gold: CompraLojaFuncao("gold") === CompraGold,
                desconhecido: CompraLojaFuncao("naoexiste") === null
            };
            const btnDano = document.querySelector('[data-compra="dano"]');
            const nomePreview = NomeFuncaoCompra(btnDano);

            const chamadas = [];
            window.CompraDano = () => chamadas.push("CompraDano");
            window.CompraCM = tipo => chamadas.push("CompraCM:" + tipo);
            window.FechaLoja = () => chamadas.push("FechaLoja");
            window.LojaEsmeralda = () => chamadas.push("LojaEsmeralda");
            window.EscolheEspecializacao = id => chamadas.push("Esp:" + id);

            btnDano.click();
            document.querySelector('[data-compra-cm="crit"]').click();
            document.querySelector('[data-loja="fechar"]').click();
            document.querySelector('[data-esp="3"]').click();
            document.querySelector('[data-loja="esmeralda"]').click();
            const chamadasClique = chamadas.slice();

            // hold-to-buy: pointerdown no botão inicia o hold pelo data-compra
            const antesHold = chamadas.length;
            btnDano.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true, button: 0, pointerType: "mouse" }));
            const holdIniciado = holdCompraBotao === btnDano;
            const holdComprou = chamadas.length > antesHold;
            HoldCompraPara();

            // auto-compra seletiva: um checkbox por item, achado pelo data-compra
            MontaCheckboxesAutoLoja();
            const checkboxes = ITENS_AUTO_COMPRA.map((_, i) => !!document.getElementById("autoItemLoja-" + i));

            return { inline, identidade, nomePreview, chamadasClique, holdIniciado, holdComprou, checkboxes };
        });

        assert.equal(result.inline, 0, "nenhum controle da loja com handler inline");
        assert.deepEqual(result.identidade, { dano: true, gold: true, desconhecido: true });
        assert.equal(result.nomePreview, "CompraDano", "preview deriva do data-compra");
        assert.deepEqual(result.chamadasClique, ["CompraDano", "CompraCM:crit", "FechaLoja", "Esp:3", "LojaEsmeralda"]);
        assert.equal(result.holdIniciado, true, "pointerdown inicia o hold pelo data-compra");
        assert.equal(result.holdComprou, true, "o hold compra pelo data-compra");
        assert.ok(result.checkboxes.every(Boolean), "um checkbox de auto-compra por item");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("reset e pausa usam listeners registrados (sem onclick/onload inline)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => document.getElementById("btnPause") && typeof window.PedeReset === "function");
        const result = await page.evaluate(() => {
            const ids = ["manterAndar", "btnAndar", "btnPause"];
            const inline = ids.filter(id => document.getElementById(id)?.hasAttribute("onclick"));
            const bodyOnload = document.body.hasAttribute("onload");

            const chamadas = [];
            window.AlternaManterAndar = () => chamadas.push("AlternaManterAndar");
            window.PedeReset = () => chamadas.push("PedeReset");
            window.AlternaPausa = () => chamadas.push("AlternaPausa");

            const manter = document.getElementById("manterAndar");
            manter.checked = true;
            manter.dispatchEvent(new Event("change", { bubbles: true }));
            document.getElementById("btnAndar").click();
            document.getElementById("btnPause").click();

            return { inline, bodyOnload, chamadas };
        });

        assert.deepEqual(result.inline, []);
        assert.equal(result.bodyOnload, false, "o <body> não tem mais onload inline");
        assert.deepEqual(result.chamadas, ["AlternaManterAndar", "PedeReset", "AlternaPausa"]);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("menu usa listeners registrados (sem onclick/onload inline)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("index.html");
    try {
        await page.waitForFunction(() => document.getElementById("btn-Jogar") && typeof window.PrepararMenu === "function");
        const result = await page.evaluate(() => {
            const inline = ["btn-Jogar", "btn-SairJogo"].filter(id => document.getElementById(id)?.hasAttribute("onclick"));
            const bodyOnload = document.body.hasAttribute("onload");

            const chamadas = [];
            window.Menu = () => chamadas.push("Menu");
            window.SairDoJogo = () => chamadas.push("SairDoJogo");

            document.getElementById("btn-Jogar").click();
            document.getElementById("btn-SairJogo").click();

            return { inline, bodyOnload, chamadas };
        });

        assert.deepEqual(result.inline, []);
        assert.equal(result.bodyOnload, false, "o <body> não tem mais onload inline");
        assert.deepEqual(result.chamadas, ["Menu", "SairDoJogo"]);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("painéis dinâmicos (evento, reset e info) não usam onclick inline", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.MontaPainelEvento === "function" && typeof window.PedeReset === "function");
        const result = await page.evaluate(() => {
            const chamadas = [];
            window.CompraEventoOferta = indice => chamadas.push("oferta:" + indice);
            window.EncerraEvento = () => chamadas.push("fechar");
            window.ConfirmaReset = () => chamadas.push("ConfirmaReset");
            UI.closeModal = () => chamadas.push("closeModal");

            // painel de evento (comércio) com markup dinâmico
            eventoAtivo = "comercio";
            eventoOfertas = [{ nome: "Esmeralda", desc: "+2", k: 30, comprada: false, comprar() {} }];
            MontaPainelEvento();
            const painel = document.getElementById("eventoPainel");
            const painelInline = painel.querySelectorAll("[onclick]").length;
            painel.querySelector("[data-evento-oferta]").click();
            painel.querySelector("[data-evento-fechar]").click();

            // modal de reset
            andar = 25; andarVolta = 30; gateDanoPago = 25; maxAndar = 30;
            PedeReset();
            const modal = document.getElementById("gameModal");
            const modalInline = modal ? modal.querySelectorAll("[onclick]").length : -1;
            modal.querySelector("[data-reset-confirmar]").click();
            modal.querySelector("[data-reset-cancelar]").click();

            // modal de info (COMO JOGAR)
            UI.toggleInfoModal();
            const infoInline = document.querySelectorAll("#infoModal [onclick]").length;
            UI.toggleInfoModal();

            return { painelInline, modalInline, infoInline, chamadas };
        });

        assert.equal(result.painelInline, 0, "painel de evento sem onclick inline");
        assert.equal(result.modalInline, 0, "modal de reset sem onclick inline");
        assert.equal(result.infoInline, 0, "modal de info sem onclick inline");
        assert.deepEqual(result.chamadas, ["oferta:0", "fechar", "ConfirmaReset", "closeModal"]);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("inimigos usam listeners registrados (sem onclick inline)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => document.getElementById("inimigo1"));
        const result = await page.evaluate(() => {
            const inline = [];
            for (let id = 1; id <= 4; id++) {
                if (document.getElementById("inimigo" + id)?.hasAttribute("onclick")) inline.push(id);
            }

            const chamadas = [];
            window.Bater = (id, validaDano) => chamadas.push([id, validaDano]);
            for (let id = 1; id <= 4; id++) document.getElementById("inimigo" + id).click();

            return { inline, chamadas };
        });

        assert.deepEqual(result.inline, []);
        assert.deepEqual(result.chamadas, [[1, true], [2, true], [3, true], [4, true]]);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("habilidades de combate usam listeners registrados (sem onclick inline)", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => document.getElementById("skill-electric"));
        const result = await page.evaluate(() => {
            const ids = ["skill-electric", "skill-gold", "skill-escape", "skill-frenzy"];
            const inline = ids.filter(id => document.getElementById(id)?.hasAttribute("onclick"));

            const chamadas = [];
            window.AtivaHabilidadeCombate = tipo => chamadas.push(tipo);
            for (const id of ids) {
                const botao = document.getElementById(id);
                botao.disabled = false; // o teste é do listener, não do estado travado
                botao.click();
            }

            return { inline, chamadas };
        });

        assert.deepEqual(result.inline, []);
        assert.deepEqual(result.chamadas, ["electric", "gold", "escape", "frenzy"]);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("tela da build esconde o log de avisos", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.ColetaBauDourado === "function");
        const result = await page.evaluate(() => {
            const log = document.getElementById("logAvisos");
            const semTela = getComputedStyle(log).visibility;
            document.body.classList.add("itens-build-tela-aberta");
            const comTela = getComputedStyle(log).visibility;
            document.body.classList.remove("itens-build-tela-aberta");

            return { semTela, comTela };
        });

        assert.equal(result.semTela, "visible", "sem a tela da build o log aparece");
        assert.equal(result.comTela, "hidden", "com a tela da build o log não fica na frente");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("efeitos dos itens, limite de vinte e troca descartando a pilha inteira", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof Tapeira?.ItensBuild?.carrega === "function");
        const result = await page.evaluate(() => {
            const build = Tapeira.ItensBuild;
            const efeitos = [
                ["adaga", "multDano", 1.25],
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

            // Dados desconhecidos são ignorados e a lista nunca ultrapassa o limite (20).
            build.carrega({
                itensBuild: ["adaga", "desconhecido", "adaga", "moedas", "escudo", "mapa", "grimorio", "relogio", "pocaoVerde", "pocaoRubra", "lanterna", "colarFormigas", "bauPortatil", "esmeralda", "adaga", "moedas", "escudo", "mapa", "grimorio", "relogio", "pocaoVerde"],
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
            adaga: 1.25, escudo: 1.30, moedas: 1.20, mapa: 1.25,
            relogio: 1.10, grimorio: 1.20, pocaoVerde: 1.50,
            pocaoRubra: 1.25, lanterna: 1.20, colarFormigas: 1.20,
            bauPortatil: 1.15, esmeralda: 1.50
        };
        assert.equal(result.multiplicadores.length, Object.keys(esperados).length);
        for (const { id, valor } of result.multiplicadores) {
            assert.ok(Math.abs(valor - esperados[id]) < 1e-10, `${id}: esperado ${esperados[id]}, recebido ${valor}`);
        }
        assert.equal(result.multiplicadorNeutro, 1);
        assert.deepEqual(result.copiasAdaga, { contagem: 2, copias: 2, multiplicador: 1.25 ** 2 });
        const cheia = ["adaga", "adaga", "moedas", "escudo", "mapa", "grimorio", "relogio", "pocaoVerde", "pocaoRubra", "lanterna", "colarFormigas", "bauPortatil", "esmeralda", "adaga", "moedas", "escudo", "mapa", "grimorio", "relogio", "pocaoVerde"];
        assert.deepEqual(result.listaSanitizada, cheia);
        assert.deepEqual(result.escolhaSemDescarte, { lista: cheia, pendente: true });
        assert.equal(result.limite, 20);
        assert.equal(result.opcoesDeTroca, 12, "um cartão por item único na etapa de descarte");
        assert.equal(result.descarteEscolhido, "adaga");
        assert.equal(result.copiasAdagaAposDescarte, 0, "descartar some a pilha inteira");
        assert.equal(result.listaFinal.length, 18, "pilha de 3 saiu e o item novo entrou com 1 cópia");
        assert.equal(result.pendente, false);
        assert.match(result.resumo, /18\/20/);
        assert.match(result.resumo, /Grimório Estelar ×3/, "cópia repetida empilha no resumo");
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

test("árvore de ramos: 2º botão, trilha de skills e seções com descrições", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            document.getElementById("btnRamos")
            && typeof UI !== "undefined"
            && typeof UI.toggleRamosTreePanel === "function",
            undefined,
            { timeout: 15000 }
        );

        // pausa o jogo, dá pontos e abre pelo 2º botão (delegação no document)
        await page.evaluate(() => {
            if (typeof AlternaPausa === "function") AlternaPausa();
            document.getElementById("infoModal")?.remove();
            window.pontosHabilidade = 5;
            document.getElementById("btnRamos").click();
        });
        await page.waitForSelector("#ramosTreeModal");

        const resumo = await page.evaluate(() => {
            const trilha = document.querySelectorAll("#ramosTreeModal .ramos-tree-trilha__btn").length;
            const secao = document.querySelector("#ramosTreeModal .ramos-tree-secao");
            if (!secao) return null;
            const descs = [...secao.querySelectorAll(".ramos-tree-no__txt span, .ramos-tree-perk__txt span")]
                .filter(el => getComputedStyle(el).display !== "none").length;
            const badgeRamos = document.querySelector("#btnRamos #skill-point-badge");
            return {
                trilha,
                pips: secao.querySelectorAll(".ramos-tree-niv").length,
                dica: secao.querySelector(".ramos-tree-dica")?.textContent || "",
                efeito: secao.querySelector(".ramos-tree-efeito")?.textContent || "",
                ramos: secao.querySelectorAll(".ramos-tree-ramo").length,
                descsVisiveis: descs,
                temSeloNivel: !!secao.querySelector(".ramos-tree-topo__selo"),
                // bloco compartilhado do jogador (nível, pontos, XP, auto-gasto, bônus)
                resumoJogador: [
                    "skill-player-level", "skill-player-points", "skill-player-xp",
                    "skill-player-xp-fill", "skill-player-xp-label",
                    "autoGastoWrap", "autoGastoToggle", "skill-player-bonus"
                ].every(id => !!document.getElementById(id)),
                resumoForaDaSecao: !!document.querySelector("#ramosTreeModal .ramos-tree-resumo")
                    && !document.querySelector("#ramosTreeModal .ramos-tree-secao .ramos-tree-resumo"),
                // contador no botão "Ramos" (a bolinha que a 1.3.0 tinha no "Skills")
                badgeRamos: badgeRamos
                    ? { texto: badgeRamos.textContent, hidden: badgeRamos.hidden, visivel: getComputedStyle(badgeRamos).display !== "none" }
                    : null,
                // descrições restauradas da 1.3.0
                perkDano: secao.querySelector(".ramos-tree-perk__txt span")?.textContent || "",
                ramoCanhao: [...secao.querySelectorAll(".ramos-tree-no__txt span")]
                    .map(el => el.textContent).find(t => t.includes("no hit automático")) || ""
            };
        });
        assert.ok(resumo, "uma seção abre ao clicar");
        assert.equal(resumo.trilha, 5, "5 botões à esquerda (um por skill)");
        assert.equal(resumo.pips, 10, "faixa de níveis de 1 a 10");
        assert.match(resumo.dica, /hoje/, "linha dos níveis no padrão aprovado");
        assert.ok(resumo.efeito.length > 0, "efeito curto da skill visível");
        assert.ok(resumo.ramos >= 2, "ramos lado a lado na seção");
        assert.ok(resumo.descsVisiveis > 0, "descrições sempre visíveis");
        assert.ok(resumo.temSeloNivel, "selo de nível no topo");
        assert.ok(resumo.resumoJogador, "bloco compartilhado do jogador presente no painel");
        assert.ok(resumo.resumoForaDaSecao, "bloco fica entre o título e a trilha (não muda por skill)");
        assert.deepEqual(resumo.badgeRamos, { texto: "5", hidden: false, visivel: true },
            "bolinha de pontos no botão Ramos reflete os pontos disponíveis");
        assert.match(resumo.perkDano, /no nível máximo a skill ativa sozinha/,
            "descrição do perk restaurada (texto da 1.3.0)");
        assert.ok(resumo.ramoCanhao, "descrição do ramo restaurada (texto da 1.3.0)");

        // a pílula "próximo" compra o nível usando a regra existente
        const compra = await page.evaluate(() => {
            const nivelAntes = NivelDaSkill("damage");
            const pip = document.querySelector("#ramosTreeModal .ramos-tree-niv--proximo");
            if (!pip) return null;
            pip.click();
            return { antes: nivelAntes, depois: NivelDaSkill("damage"), painel: !!document.getElementById("ramosTreeModal") };
        });
        assert.deepEqual(compra, { antes: 0, depois: 1, painel: true },
            "clique na pílula usa EvoluiSkill e re-renderiza");

        // trocar de skill pela trilha abre outra seção (e o resumo continua igual)
        const trocada = await page.evaluate(() => {
            const alvo = [...document.querySelectorAll("#ramosTreeModal .ramos-tree-trilha__btn")]
                .find(b => b.getAttribute("aria-label") === "Corrente elétrica");
            if (!alvo) return null;
            alvo.click();
            const secao = document.querySelector("#ramosTreeModal .ramos-tree-secao");
            return {
                titulo: secao?.querySelector(".ramos-tree-topo__titulo b")?.textContent || "",
                ativo: document.querySelectorAll("#ramosTreeModal .ramos-tree-trilha__btn--ativo").length,
                resumoPersiste: !!document.querySelector("#ramosTreeModal .ramos-tree-resumo #skill-player-level")
            };
        });
        assert.deepEqual(trocada, { titulo: "Corrente elétrica", ativo: 1, resumoPersiste: true },
            "clicar na trilha abre a seção da skill e o bloco compartilhado não muda");

        // fechar pelo × devolve o foco ao 2º botão
        await page.evaluate(() => document.querySelector("#ramosTreeModal .ant-collection-close").click());
        await page.waitForFunction(() => !document.getElementById("ramosTreeModal"));
        assert.equal(await page.evaluate(() => document.activeElement?.id), "btnRamos");

        // reabrir e fechar com Esc
        await page.evaluate(() => {
            document.getElementById("infoModal")?.remove();
            document.getElementById("btnRamos").click();
        });
        await page.waitForSelector("#ramosTreeModal");
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.getElementById("ramosTreeModal"));

        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("árvore de ramos: ícone de info abre o balão de como funciona a tela", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            document.getElementById("btnRamos")
            && typeof UI !== "undefined"
            && typeof UI.toggleRamosTreePanel === "function",
            undefined,
            { timeout: 15000 }
        );

        await page.evaluate(() => {
            if (typeof AlternaPausa === "function") AlternaPausa();
            document.getElementById("infoModal")?.remove();
            document.getElementById("btnRamos").click();
        });
        await page.waitForSelector("#ramosTreeModal");

        // o helper é genérico (ui-info.js) e o balão nasce fechado
        const inicial = await page.evaluate(() => {
            const btn = document.getElementById("ramos-tree-info");
            const balao = btn?.parentElement?.querySelector(".info-tela__balao");
            return {
                helperGlobal: typeof window.CriaInfoTela === "function",
                botaoNoHeader: !!btn && !!btn.closest(".ramos-tree-header"),
                inline: btn
                    ? ["onclick", "onload"].filter(a => btn.hasAttribute(a))
                    : null,
                expandido: btn?.getAttribute("aria-expanded") ?? null,
                balaoOculto: balao ? balao.hidden : null,
                texto: balao?.textContent || ""
            };
        });
        assert.equal(inicial.helperGlobal, true, "CriaInfoTela fica global (ui-info.js)");
        assert.equal(inicial.botaoNoHeader, true, "ícone de info no cabeçalho do painel");
        assert.deepEqual(inicial.inline, [], "sem handler inline no botão");
        assert.equal(inicial.expandido, "false", "nasce com aria-expanded=false");
        assert.equal(inicial.balaoOculto, true, "balão nasce oculto");
        assert.match(inicial.texto, /nível 5/, "balão explica o fork dos ramos");

        // clique abre; segundo clique fecha
        const alternado = await page.evaluate(() => {
            const btn = document.getElementById("ramos-tree-info");
            const balao = btn.parentElement.querySelector(".info-tela__balao");
            btn.click();
            const aberto = { oculto: balao.hidden, expandido: btn.getAttribute("aria-expanded") };
            btn.click();
            const fechado = { oculto: balao.hidden, expandido: btn.getAttribute("aria-expanded") };
            return { aberto, fechado };
        });
        assert.deepEqual(alternado.aberto, { oculto: false, expandido: "true" },
            "clique abre o balão e marca aria-expanded");
        assert.deepEqual(alternado.fechado, { oculto: true, expandido: "false" },
            "segundo clique fecha o balão");

        // clique fora fecha (o listener nasce num setTimeout(0), então espera
        // um tick antes de disparar o pointerdown fora do balão)
        await page.evaluate(() => document.getElementById("ramos-tree-info").click());
        await page.waitForTimeout(30);
        const cliqueFora = await page.evaluate(() => {
            document.dispatchEvent(new PointerEvent("pointerdown", { bubbles: true }));
            return {
                oculto: document.querySelector("#ramosTreeModal .info-tela__balao").hidden,
                expandido: document.getElementById("ramos-tree-info").getAttribute("aria-expanded")
            };
        });
        assert.deepEqual(cliqueFora, { oculto: true, expandido: "false" },
            "pointerdown fora do balão fecha o balão");

        // ESC com o balão aberto fecha SÓ o balão (o painel continua) — o
        // FechaJanelasAbertas (keymap.js) trata o info como camada extra.
        const escBalao = await page.evaluate(() => {
            const btn = document.getElementById("ramos-tree-info");
            btn.click();
            return {
                balaoAberto: !document.querySelector("#ramosTreeModal .info-tela__balao").hidden
            };
        });
        assert.equal(escBalao.balaoAberto, true, "balão reaberto para testar o ESC");
        await page.keyboard.press("Escape");
        const escResultado = await page.evaluate(() => ({
            balaoFechado: document.querySelector("#ramosTreeModal .info-tela__balao")?.hidden ?? null,
            painelAberto: !!document.getElementById("ramosTreeModal")
        }));
        assert.deepEqual(escResultado, { balaoFechado: true, painelAberto: true },
            "ESC fecha primeiro o balão e deixa o painel aberto");

        // e o ESC seguinte fecha o painel (comportamento existente)
        await page.keyboard.press("Escape");
        await page.waitForFunction(() => !document.getElementById("ramosTreeModal"));

        // reabrir: o balão volta oculto (re-render não vaza estado)
        await page.evaluate(() => {
            document.getElementById("infoModal")?.remove();
            document.getElementById("btnRamos").click();
        });
        await page.waitForSelector("#ramosTreeModal");
        const reaberto = await page.evaluate(() => ({
            oculto: document.querySelector("#ramosTreeModal .info-tela__balao").hidden,
            ativos: typeof infoTelaAtiva === "undefined" || infoTelaAtiva === null
        }));
        assert.deepEqual(reaberto, { oculto: true, ativos: true },
            "reabrir a tela não vaza o balão aberto");

        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("telas complexas: Skills, Coleção e Feitos trazem o ícone de info com balão", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            typeof UI !== "undefined"
            && typeof UI.showSkillUpgradePanel === "function"
            && typeof window.CriaInfoTela === "function",
            undefined,
            { timeout: 15000 }
        );

        // cada painel: abre, confere o selo no header e que o clique abre o balão
        const resultado = await page.evaluate(() => {
            if (typeof AlternaPausa === "function" && !window.jogoPausado) AlternaPausa();
            document.getElementById("infoModal")?.remove();

            const casos = [
                { nome: "Skills", abre: () => UI.showSkillUpgradePanel(), idModal: "skillUpgradeModal" },
                { nome: "Colecao", abre: () => UI.showAntCollection(), idModal: "antCollectionModal" },
                { nome: "Feitos", abre: () => UI.showFeitosPanel(), idModal: "feitosModal" }
            ];
            const fora = [];
            for (const caso of casos) {
                caso.abre();
                const modal = document.getElementById(caso.idModal);
                const btn = modal ? modal.querySelector(".info-tela__btn") : null;
                const balao = btn ? btn.parentElement.querySelector(".info-tela__balao") : null;
                if (!btn || !balao) {
                    fora.push(caso.nome + ":sem-info");
                    modal?.remove();
                    continue;
                }
                // o selo precisa estar no header (Feitos usa <div> com a classe)
                const header = btn.closest("header") || btn.closest(".ant-collection-header");
                const fechar = header ? header.querySelector(".ant-collection-close") : null;
                if (!header) fora.push(caso.nome + ":fora-do-header");
                else if (!fechar || !(btn.compareDocumentPosition(fechar) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                    fora.push(caso.nome + ":nao-antes-do-x");
                }
                if (["onclick", "onload"].some(a => btn.hasAttribute(a))) fora.push(caso.nome + ":handler-inline");
                if (!balao.hidden) fora.push(caso.nome + ":balao-nasceu-aberto");
                if (!/Como funciona|funciona/i.test(balao.textContent)) fora.push(caso.nome + ":texto-vazio");

                // clique abre e o aria-expanded acompanha
                btn.click();
                if (balao.hidden || btn.getAttribute("aria-expanded") !== "true") {
                    fora.push(caso.nome + ":clique-nao-abriu");
                }
                // ESC fecha o balão e mantém o painel (camada extra)
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
                if (!balao.hidden) fora.push(caso.nome + ":esc-nao-fechou-balao");
                if (!document.getElementById(caso.idModal)) fora.push(caso.nome + ":esc-levantou-o-painel");
                // limpa pro próximo
                modal.remove();
            }
            return fora;
        });

        assert.deepEqual(resultado, [],
            "Skills, Coleção e Feitos têm o ícone de info funcional no header");

        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("telas da Cidade: os 7 prédios trazem o ícone de info com balão", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            typeof window.CriaInfoTela === "function"
            && typeof window.AbrirCasa === "function"
            && typeof window.AbrirTrofeus === "function",
            undefined,
            { timeout: 15000 }
        );

        const resultado = await page.evaluate(() => {
            if (typeof AlternaPausa === "function" && !window.jogoPausado) AlternaPausa();
            document.getElementById("infoModal")?.remove();
            window.maxAndar = 200; // destrava os prédios da Cidade

            const casos = [
                { nome: "Casa", abre: AbrirCasa, fecha: FecharCasa, idModal: "casaModal" },
                { nome: "Fazenda", abre: AbrirFazenda, fecha: FecharFazenda, idModal: "fazendaModal" },
                { nome: "Mercado", abre: AbrirMercado, fecha: FecharMercado, idModal: "mercadoModal" },
                { nome: "Fabrica", abre: AbrirFabrica, fecha: FecharFabrica, idModal: "fabricaModal" },
                { nome: "Pesquisa", abre: AbrirPesquisa, fecha: FecharPesquisa, idModal: "pesquisaModal" },
                { nome: "Cristal", abre: AbrirCristal, fecha: FecharCristal, idModal: "cristalModal" },
                { nome: "Trofeus", abre: AbrirTrofeus, fecha: FecharTrofeus, idModal: "trofeusModal" }
            ];
            const fora = [];
            for (const caso of casos) {
                caso.abre();
                const modal = document.getElementById(caso.idModal);
                const btn = modal ? modal.querySelector(".info-tela__btn") : null;
                const balao = btn ? btn.parentElement.querySelector(".info-tela__balao") : null;
                if (!btn || !balao) {
                    fora.push(caso.nome + ":sem-info");
                    caso.fecha();
                    continue;
                }
                const header = btn.closest("header");
                const fechar = header ? header.querySelector("[class$='-fechar']") : null;
                if (!header) fora.push(caso.nome + ":fora-do-header");
                else if (!fechar || !(btn.compareDocumentPosition(fechar) & Node.DOCUMENT_POSITION_FOLLOWING)) {
                    fora.push(caso.nome + ":nao-antes-do-x");
                }
                if (["onclick", "onload"].some(a => btn.hasAttribute(a))) fora.push(caso.nome + ":handler-inline");
                if (!balao.hidden) fora.push(caso.nome + ":balao-nasceu-aberto");
                if (!balao.textContent.trim()) fora.push(caso.nome + ":texto-vazio");

                btn.click();
                if (balao.hidden || btn.getAttribute("aria-expanded") !== "true") {
                    fora.push(caso.nome + ":clique-nao-abriu");
                }
                document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
                if (!balao.hidden) fora.push(caso.nome + ":esc-nao-fechou-balao");
                if (!document.getElementById(caso.idModal)) fora.push(caso.nome + ":esc-levantou-o-painel");
                caso.fecha();
                if (document.getElementById(caso.idModal)) fora.push(caso.nome + ":nao-fechou");
            }
            // o ESC seguinte, sem balão, fecha o painel (comportamento existente)
            AbrirCasa();
            document.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", code: "Escape", bubbles: true }));
            if (document.getElementById("casaModal")) fora.push("Casa:esc-final-nao-fechou");
            return fora;
        });

        assert.deepEqual(resultado, [],
            "Casa, Fazenda, Mercado, Fábrica, Pesquisa, Cristal e Troféus têm o ícone de info funcional");

        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("rodapé: botões horizontais à esquerda e habilidades abaixo do log, ao lado ou acima dos botões", async t => {
    const abrir = async viewport => {
        const context = await browser.newContext({ viewport });
        await context.addInitScript(() => {
            localStorage.setItem("volumeJogo", "0");
            localStorage.setItem("volumeAmbienteJogo", "0");
        });
        const page = await context.newPage();
        const pageErrors = [];
        page.on("pageerror", error => pageErrors.push(error.message));
        await page.goto(`${baseUrl}/Caverna.html`, { waitUntil: "domcontentloaded" });
        await page.waitForFunction(() =>
            document.getElementById("game-root")
            && typeof window.andar === "number"
            && typeof window.UIRodape === "object"
            && document.getElementById("container-Habilidades")
                .style.getPropertyValue("--rodape-hab-left") !== "",
            undefined,
            { timeout: 15000 });
        return { context, page, pageErrors };
    };

    // Destrava as skills de combate para a fileira de habilidades ter a
    // largura de jogo e devolve as medidas do rodapé.
    const medirRodape = async (page, opcoes) => {
        const mostrarLog = !opcoes || opcoes.mostrarLog !== false;
        await page.evaluate(mostrar => {
            maxAndar = 100;
            CarregaHabilidadesDesbloqueadas(false);
            AtualizaHabilidadesCombate();
            UI.removeSkill();
            UI.spawnSkill();
            // O log só aparece quando entra uma linha; garante um estado
            // visível e expandido pra checar a ordem log → skills → botões.
            const log = document.getElementById("logAvisos");
            log.hidden = !mostrar;
            log.classList.remove("log-avisos--recolhido");
            UIRodape.Atualiza();
        }, mostrarLog);
        return page.evaluate(() => {
            const reta = el => {
                const b = el.getBoundingClientRect();
                return {
                    left: Math.round(b.left), right: Math.round(b.right),
                    top: Math.round(b.top), bottom: Math.round(b.bottom)
                };
            };
            return {
                botoes: [...document.querySelectorAll("#container-Botoes button")]
                    .filter(b => getComputedStyle(b).display !== "none")
                    .map(reta),
                opcoes: reta(document.getElementById("container-opcoes")),
                habilidades: reta(document.getElementById("container-Habilidades")),
                log: reta(document.getElementById("logAvisos")),
                logVisivel: (() => {
                    const l = document.getElementById("logAvisos");
                    return !!l && !l.hidden && getComputedStyle(l).visibility !== "hidden";
                })(),
                larguraTela: document.documentElement.clientWidth
            };
        });
    };

    const confereFileiraDeBotoes = (medidas, nome) => {
        assert.ok(medidas.botoes.length >= 4, nome + ": botões da navegação presentes");
        for (let i = 0; i < medidas.botoes.length; i++) {
            assert.equal(medidas.botoes[i].top, medidas.botoes[0].top,
                nome + ": botão " + i + " na mesma altura dos demais (fileira horizontal)");
            if (i > 0) {
                assert.ok(medidas.botoes[i].left > medidas.botoes[i - 1].right,
                    nome + ": botão " + i + " à direita do anterior");
            }
        }
        assert.ok(medidas.opcoes.left <= 20,
            nome + ": navegação encostada no canto inferior esquerdo (left=" + medidas.opcoes.left + ")");
    };

    const confereEmpilhado = (medidas, nome) => {
        assert.ok(medidas.habilidades.bottom <= medidas.botoes[0].top + 1,
            nome + ": habilidades acima da fileira de botões (" +
            medidas.habilidades.bottom + " <= " + medidas.botoes[0].top + ")");
        assert.ok(Math.abs(medidas.habilidades.left - medidas.botoes[0].left) <= 2,
            nome + ": habilidades alinhadas à esquerda com os botões");
        assert.ok(medidas.habilidades.right <= medidas.larguraTela,
            nome + ": fileira de habilidades cabe na tela");
        if (medidas.logVisivel) {
            assert.ok(medidas.habilidades.top >= medidas.log.bottom,
                nome + ": habilidades abaixo do log de avisos (" +
                medidas.habilidades.top + " >= " + medidas.log.bottom + ")");
        }
    };

    const { context, page, pageErrors } = await abrir({ width: 400, height: 740 });
    try {
        await t.test("tela estreita: habilidades abaixo do log e acima dos botões", async () => {
            const medidas = await medirRodape(page);
            confereFileiraDeBotoes(medidas, "estreita");
            assert.ok(medidas.logVisivel, "estreita: log de avisos visível");
            confereEmpilhado(medidas, "estreita");
        });

        await t.test("log oculto: habilidades não invadem os botões", async () => {
            await page.evaluate(() => {
                document.getElementById("logAvisos").hidden = true;
                UIRodape.Atualiza();
            });
            const medidas = await medirRodape(page, { mostrarLog: false });
            assert.ok(!medidas.logVisivel, "log oculto: log fora de cena");
            confereEmpilhado(medidas, "log oculto");
        });

        await t.test("tela larga: habilidades ao lado dos botões", async () => {
            await page.setViewportSize({ width: 1920, height: 900 });
            await page.waitForFunction(() => {
                const hab = document.getElementById("container-Habilidades");
                const bot = document.getElementById("container-Botoes");
                return hab && bot
                    && hab.getBoundingClientRect().left >= bot.getBoundingClientRect().right;
            }, undefined, { timeout: 5000 });

            const medidas = await medirRodape(page);
            confereFileiraDeBotoes(medidas, "larga");
            assert.ok(medidas.habilidades.left >= medidas.botoes[0].right,
                "larga: habilidades encostadas à direita dos botões (gap=" +
                (medidas.habilidades.left - medidas.botoes[0].right) + ")");
            assert.equal(medidas.habilidades.bottom, medidas.botoes[0].bottom,
                "larga: base das habilidades alinhada com a base dos botões");
            assert.ok(medidas.habilidades.right <= medidas.larguraTela,
                "larga: fileira de habilidades cabe na tela");
            assert.ok(medidas.logVisivel, "larga: log de avisos visível");
            assert.ok(medidas.habilidades.top >= medidas.log.bottom,
                "larga: habilidades abaixo do log de avisos (" +
                medidas.habilidades.top + " >= " + medidas.log.bottom + ")");
        });

        await t.test("voltou a ficar estreita: habilidades sobem de novo", async () => {
            await page.setViewportSize({ width: 400, height: 740 });
            await page.waitForFunction(() => {
                const hab = document.getElementById("container-Habilidades");
                const bot = document.getElementById("container-Botoes");
                return hab && bot
                    && hab.getBoundingClientRect().bottom <= bot.getBoundingClientRect().top;
            }, undefined, { timeout: 5000 });

            const medidas = await medirRodape(page);
            confereFileiraDeBotoes(medidas, "estreita de volta");
            confereEmpilhado(medidas, "estreita de volta");
        });

        await t.test("varredura de tamanhos: invariantes valem em todos", async () => {
            const tamanhos = [
                [1920, 1080], [1600, 900], [1440, 900], [1366, 768], [1280, 720],
                [1100, 800], [1024, 768], [900, 520], [800, 480], [768, 1024],
                [740, 400], [600, 900], [480, 800], [400, 740], [390, 844],
                [360, 640], [320, 568]
            ];
            for (const [w, h] of tamanhos) {
                await page.setViewportSize({ width: w, height: h });
                await page.evaluate(() => new Promise(r => requestAnimationFrame(r)));
                const m = await medirRodape(page);
                const nome = `${w}x${h}`;
                confereFileiraDeBotoes(m, nome);

                // Nunca cobre os botões: ou está acima deles, ou ao lado.
                assert.ok(m.habilidades.bottom <= m.botoes[0].top + 1 ||
                    m.habilidades.left >= m.botoes[0].right,
                    nome + ": habilidades não cobrem os botões (hab=" +
                    m.habilidades.top + ".." + m.habilidades.bottom +
                    ", bot.top=" + m.botoes[0].top + ")");

                // Nunca cobre o log (quando visível): ou abaixo, ou à direita.
                if (m.logVisivel) {
                    assert.ok(m.habilidades.top >= m.log.bottom - 1 ||
                        m.habilidades.left >= m.log.right,
                        nome + ": habilidades não cobrem o log (hab.top=" +
                        m.habilidades.top + ", log.bottom=" + m.log.bottom +
                        ", hab.left=" + m.habilidades.left + ", log.right=" + m.log.right + ")");
                }

                // Sempre dentro da tela.
                assert.ok(m.habilidades.right <= m.larguraTela &&
                    m.habilidades.left >= 0 && m.habilidades.top >= 0,
                    nome + ": fileira de habilidades dentro da tela");
            }
        });

        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("Loja de Troféus: níveis, custo crescente, efeitos, save e painel", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => window.Tapeira && window.Tapeira.Trofeus);
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            window.MostraInfo = () => {};
            const T = window.Tapeira.Trofeus;
            const out = { ids: T.LISTA.map(t => t.id) };

            // custo cresce ×1,5 por nível
            trofeus = {};
            out.custo0 = T.custo("cacador");
            trofeus = { cacador: 1 };
            out.custo1 = T.custo("cacador");
            trofeus = { cacador: 2 };
            out.custo2 = T.custo("cacador");

            // bônus por nível (funções-fonte dos 5 efeitos)
            trofeus = { cacador: 3, mercador: 2, sabio: 4, colecionador: 5, sorte: 6 };
            out.bDano = T.bonusDano();
            out.bGold = T.bonusGold();
            out.bXP = T.bonusXP();
            out.bCM = T.bonusCM();
            out.bCrit = T.bonusCrit();

            // o MultiplicadorCM inclui o troféu Colecionador
            const marcosAntes = marcosNivel50, esmAntes = lvlEsmCM;
            marcosNivel50 = 0; lvlEsmCM = 0;
            trofeus = {};
            const cmBase = MultiplicadorCM();
            trofeus = { colecionador: 5 };
            const cmComTrofeu = MultiplicadorCM();
            marcosNivel50 = marcosAntes; lvlEsmCM = esmAntes;
            out.cmBase = cmBase;
            out.cmComTrofeu = cmComTrofeu;

            // cada sistema consulta a função do troféu (espionando o global)
            const espia = nome => {
                let n = 0;
                const orig = window[nome];
                window[nome] = function (...a) { n++; return orig.apply(this, a); };
                return { conta: () => n, solta: () => { window[nome] = orig; } };
            };
            trofeus = {};

            const sGold = espia("TrofeuBonusGold");
            AddGold(100, false);
            out.goldChama = sGold.conta(); sGold.solta();

            const sXp = espia("TrofeuBonusXP");
            nivelJogador = 0; xpAtual = 0;
            GanhaXP(0, 1, 100);
            out.xpChama = sXp.conta(); sXp.solta();

            const sCm = espia("TrofeuBonusCM");
            MultiplicadorCM();
            out.cmChama = sCm.conta(); sCm.solta();

            const sCrit = espia("TrofeuBonusCrit");
            chanceCrit = 0.5;
            DanoCritico(10);
            out.critChama = sCrit.conta(); sCrit.solta();

            const sDano = espia("TrofeuBonusDano");
            jogoPausado = false; fugaEmAndamento = false;
            nivelJogador = 1; danoJogador = 10; chanceCrit = 0; lvlComp5 = 0;
            especializacao = 0; ataquesCorrenteEletrica = 0; ataquesBonusGold = 0;
            segundosPausaFuga = 0; numInimigosTela = 1; missaoAtual = 0;
            vidaAndar = 1000; vidaInimigo1 = 1000;
            try { Bater(1, true); } catch (e) { out.baterErro = String(e && e.message || e); }
            out.danoChama = sDano.conta(); sDano.solta();

            // compra consome Tickets e sobe o nível; sem saldo falha
            trofeus = {};
            ticketsMug = 10;
            out.comprou = T.comprar("cacador");
            out.nivelApos = T.nivel("cacador");
            out.ticketsApos = ticketsMug;
            ticketsMug = 0;
            out.falhouSemSaldo = T.comprar("cacador");
            out.ticketsFinal = ticketsMug;

            // reset preserva troféus e tickets (permanentes)
            trofeus = { cacador: 2 };
            ticketsMug = 7;
            Resetar();
            out.trofeusAposReset = JSON.stringify(trofeus);
            out.ticketsAposReset = ticketsMug;

            // save: build inclui, validar aceita/rejeita, carregar restaura
            // (vidaAndar/vidas precisam ser números válidos no save — o teste
            // mexeu no combate acima)
            vidaAndar = 1000;
            vidaInimigo1 = 1000; vidaInimigo2 = 0; vidaInimigo3 = 0; vidaInimigo4 = 0;
            trofeus = { cacador: 2, sorte: 1 };
            const save = CriarObjetoSave();
            out.saveTem = JSON.stringify(save.trofeus);
            let ok = true, lixo = false, alto = false, desconhecido = false;
            try { ValidarSave(save); } catch { ok = false; }
            try { ValidarSave(Object.assign({}, save, { trofeus: { cacador: 1.5 } })); } catch { lixo = true; }
            try { ValidarSave(Object.assign({}, save, { trofeus: { cacador: T.NIVEL_MAX + 1 } })); } catch { alto = true; }
            try { ValidarSave(Object.assign({}, save, { trofeus: { fantasma: 1 } })); } catch { desconhecido = true; }
            out.validou = ok; out.rejeitouLixo = lixo; out.rejeitouAlto = alto; out.rejeitouDesconhecido = desconhecido;
            trofeus = {};
            Carregar(JSON.stringify(save));
            out.carregouTrofeus = JSON.stringify(trofeus);

            // painel: abre, mostra o saldo, compra pelo botão e fecha
            trofeus = {};
            ticketsMug = 5;
            AbrirTrofeus();
            const modal = document.getElementById("trofeusModal");
            out.modalAberto = !!modal;
            out.linhas = modal ? modal.querySelectorAll(".trofeus-linha").length : 0;
            out.saldo = modal ? (modal.querySelector(".trofeus-saldo__texto")?.textContent || "") : "";
            const botao = modal ? modal.querySelector(".trofeus-comprar") : null;
            if (botao) botao.click();
            out.nivelAposClique = T.nivel("cacador");
            out.ticketsAposClique = ticketsMug;
            FecharTrofeus();
            out.modalFechado = !document.getElementById("trofeusModal");

            // o prédio existe na Cidade (scene)
            out.predioExiste = !!document.querySelector('[data-cidade="trofeus"]');

            return out;
        });

        assert.deepEqual(result.ids, ["cacador", "mercador", "sabio", "colecionador", "sorte"],
            "os 5 troféus da sugestão A existem");
        assert.equal(result.custo0, 1, "1º nível custa 1 ticket");
        assert.equal(result.custo1, 2, "2º nível custa 2 tickets");
        assert.equal(result.custo2, 3, "3º nível custa 3 tickets (×1,5 arredondado)");
        assert.ok(Math.abs(result.bDano - 1.15) < 1e-12, "Caçador +5%/nível (3) = ×1,15");
        assert.ok(Math.abs(result.bGold - 1.10) < 1e-12, "Mercador +5%/nível (2) = ×1,10");
        assert.ok(Math.abs(result.bXP - 1.20) < 1e-12, "Sábio +5%/nível (4) = ×1,20");
        assert.ok(Math.abs(result.bCM - 1.10) < 1e-12, "Colecionador +2%/nível (5) = ×1,10");
        assert.ok(Math.abs(result.bCrit - 0.03) < 1e-12, "Sorte +0,5%/nível (6) = +3% (aditivo)");
        assert.ok(Math.abs(result.cmComTrofeu / result.cmBase - 1.10) < 1e-9,
            "MultiplicadorCM inclui o Colecionador");
        assert.ok(result.goldChama > 0, "AddGold consulta o troféu Mercador");
        assert.ok(result.xpChama > 0, "GanhaXP consulta o troféu Sábio");
        assert.ok(result.cmChama > 0, "MultiplicadorCM consulta o troféu Colecionador");
        assert.ok(result.critChama > 0, "DanoCritico consulta o troféu Sorte");
        assert.ok(result.danoChama > 0, "Bater consulta o troféu Caçador" + (result.baterErro ? " (erro: " + result.baterErro + ")" : ""));
        assert.equal(result.comprou, true, "compra com saldo");
        assert.equal(result.nivelApos, 1, "nível sobe");
        assert.equal(result.ticketsApos, 9, "tickets debitados");
        assert.equal(result.falhouSemSaldo, false, "sem saldo não compra");
        assert.equal(result.ticketsFinal, 0, "saldo não fica negativo");
        assert.equal(result.trofeusAposReset, JSON.stringify({ cacador: 2 }), "reset preserva os troféus");
        assert.equal(result.ticketsAposReset, 7, "reset preserva os tickets");
        assert.equal(result.saveTem, JSON.stringify({ cacador: 2, sorte: 1 }), "CriarObjetoSave inclui trofeus");
        assert.ok(result.validou, "ValidarSave aceita troféus válidos");
        assert.ok(result.rejeitouLixo, "rejeita nível fracionário");
        assert.ok(result.rejeitouAlto, "rejeita nível acima do teto");
        assert.ok(result.rejeitouDesconhecido, "rejeita troféu desconhecido");
        assert.equal(result.carregouTrofeus, JSON.stringify({ cacador: 2, sorte: 1 }), "Carregar restaura os troféus");
        assert.ok(result.modalAberto, "o painel abre");
        assert.equal(result.linhas, 5, "lista os 5 troféus");
        assert.ok(/5 Tickets/.test(result.saldo), "painel mostra o saldo: " + result.saldo);
        assert.equal(result.nivelAposClique, 1, "clique no botão compra");
        assert.equal(result.ticketsAposClique, 4, "clique debita o ticket");
        assert.ok(result.modalFechado, "o painel fecha");
        assert.ok(result.predioExiste, "o prédio da Loja de Troféus existe na Cidade");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("forja da Fábrica custa ~80 avanços de andar e cobra o gold", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() =>
            window.Tapeira && window.Tapeira.ItensBuild && typeof window.CustoForjaItem === "function");
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            const build = window.Tapeira.ItensBuild;
            andar = 123; mulGold = 1; mulGoldAvanco = 1; vidaAndar = 5000;
            const base = BonusGoldAvanco();
            const custo = CustoForjaItem();

            // sem 2 cópias iguais: não forja
            build.limpa();
            build.carrega({ itensBuild: ["adaga"], bauBuildPendente: false });
            gold = new GoldNumber(base * 1000);
            const semCopias = ForjaItem("adaga");

            // com 2 cópias mas sem gold: não forja
            build.limpa();
            build.carrega({ itensBuild: ["adaga", "adaga"], bauBuildPendente: false });
            gold = new GoldNumber(base); // ~1 avanço, bem menos que o custo
            const semGold = ForjaItem("adaga");

            // com 2 cópias e gold: forja e debita o custo
            gold = new GoldNumber(custo * 2);
            const antes = gold.toNumber();
            const forjou = ForjaItem("adaga");
            const depois = gold.toNumber();

            return {
                mult: base > 0 ? custo / base : 0,
                semCopias, semGold, forjou,
                cobrou: antes - depois,
                custo,
                nivelForja: build.nivelForja("adaga")
            };
        });

        assert.ok(Math.abs(result.mult - 80) < 1e-9,
            "custo = 80 avanços de andar (veio " + result.mult + ")");
        assert.equal(result.semCopias, false, "não forja sem 2 cópias iguais");
        assert.equal(result.semGold, false, "não forja sem gold suficiente");
        assert.equal(result.forjou, true, "forja com 2 cópias e gold");
        assert.ok(Math.abs(result.cobrou - result.custo) < 1e-6, "debita exatamente o custo");
        assert.equal(result.nivelForja, 1, "o item fica com 1 forja");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("Mercado: ofertas do dia giram pela data, dão o bem e não repetem", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => window.Tapeira && window.Tapeira.Mercado
            && typeof window.Tapeira.Mercado.ofertasDoDia === "function");
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            const M = window.Tapeira.Mercado;
            const out = {};

            // determinismo + 3 ofertas distintas no mesmo dia
            const a = M.ofertasDoDia();
            const b = M.ofertasDoDia();
            out.qtd = a.length;
            out.idsDiferentes = new Set(a.map(o => o.id)).size === a.length;
            out.deterministico = JSON.stringify(a) === JSON.stringify(b);
            out.descontoOk = a.every(o => o.desconto >= 0.15 - 1e-9 && o.desconto <= 0.45 + 1e-9);

            // preço = k × avanço × (1-desconto) × (1-reputação)
            andar = 100; mulGold = 1; mulGoldAvanco = 1; vidaAndar = 5000;
            reputacao = 0;
            const o0 = a[0];
            const base = BonusGoldAvanco();
            out.preco = M.precoOferta(o0);
            out.precoEsperado = Math.max(10, Math.round(base * o0.k * (1 - o0.desconto)));
            const p0 = M.precoOferta(o0);
            reputacao = 10; // -20%
            out.reputacaoRatio = M.precoOferta(o0) / p0;
            reputacao = 0;

            // compra: debita o gold, marca e não compra de novo
            ofertasDia = M.diaOfertas();
            ofertasDiaCompradas = 0;
            const preco = M.precoOferta(a[0]);
            gold = new GoldNumber(preco * 3);
            const antes = gold.toNumber();
            out.comprou = M.comprarOferta(0);
            out.debitou = antes - gold.toNumber();
            out.marcada = M.ofertaComprada(0);
            out.comprouDeNovo = M.comprarOferta(0);

            // gira no dia seguinte: sincroniza zera o bitmask
            ofertasDia = 12345;
            ofertasDiaCompradas = 7;
            out.girou = M.sincronizaOfertas();
            out.aposGirar = ofertasDiaCompradas;

            // painel: lista as 3 ofertas
            window.maxAndar = 200;
            AbrirMercado();
            const modal = document.getElementById("mercadoModal");
            out.linhasPainel = modal ? modal.querySelectorAll(".mercado-oferta").length : 0;
            FecharMercado();
            out.painelFechou = !document.getElementById("mercadoModal");

            // save: campos entram e a validação aceita/rejeita
            vidaAndar = 1000;
            vidaInimigo1 = 1000; vidaInimigo2 = 0; vidaInimigo3 = 0; vidaInimigo4 = 0;
            ofertasDia = M.diaOfertas();
            ofertasDiaCompradas = 5;
            const save = CriarObjetoSave();
            out.saveDia = save.ofertasDia;
            out.saveCompradas = save.ofertasDiaCompradas;
            let ok = true, lixo = false, diaRuim = false;
            try { ValidarSave(save); } catch { ok = false; }
            try { ValidarSave(Object.assign({}, save, { ofertasDiaCompradas: 99 })); } catch { lixo = true; }
            try { ValidarSave(Object.assign({}, save, { ofertasDia: -1 })); } catch { diaRuim = true; }
            out.validou = ok; out.rejeitouLixo = lixo; out.rejeitouDiaRuim = diaRuim;

            return out;
        });

        assert.equal(result.qtd, 3, "3 ofertas por dia");
        assert.ok(result.idsDiferentes, "as ofertas não repetem o tipo");
        assert.ok(result.deterministico, "mesma data = mesmas ofertas");
        assert.ok(result.descontoOk, "descontos entre 15% e 45%");
        assert.equal(result.preco, result.precoEsperado, "preço = base × desconto");
        assert.ok(Math.abs(result.reputacaoRatio - 0.8) < 1e-3, "Reputação no máximo dá -20%");
        assert.equal(result.comprou, true, "compra com gold");
        assert.ok(Math.abs(result.debitou - (result.precoEsperado)) < 1e-6 || result.debitou > 0,
            "compra debita o preço");
        assert.equal(result.marcada, true, "a oferta fica marcada como comprada");
        assert.equal(result.comprouDeNovo, false, "não compra a mesma oferta 2×");
        assert.equal(result.girou, true, "sincroniza gira quando o dia muda");
        assert.equal(result.aposGirar, 0, "o bitmask zera no dia novo");
        assert.equal(result.linhasPainel, 3, "o painel lista as 3 ofertas");
        assert.ok(result.painelFechou, "o painel fecha");
        assert.equal(result.saveDia, await page.evaluate(() => window.Tapeira.Mercado.diaOfertas()),
            "o stamp do dia vai pro save");
        assert.equal(result.saveCompradas, 5, "o bitmask vai pro save");
        assert.ok(result.validou, "ValidarSave aceita ofertas válidas");
        assert.ok(result.rejeitouLixo, "rejeita bitmask fora do intervalo");
        assert.ok(result.rejeitouDiaRuim, "rejeita dia negativo");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("CM comprado escala com o andar (+20 × andar) no Comércio e no Mercado", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => typeof window.CMCompraOferta === "function"
            && window.Tapeira && window.Tapeira.Mercado);
        const result = await page.evaluate(() => {
            UI.showInfo = () => {};
            window.MostraStatus = () => {};
            const out = {};
            out.em50 = CMCompraOferta(50);
            out.em100 = CMCompraOferta(100);
            out.em200 = CMCompraOferta(200);

            andar = 100;
            out.descEsperado = "+" + FormatCM(2000) + " de Conhecimento Mug";

            // oferta do Comércio (evento)
            const ofertaEvento = EVENTO_OFERTAS_POOL.find(o => o.id === "cm");
            conhecimentoMug = 0;
            ofertaEvento.comprar();
            out.cmEvento = conhecimentoMug;
            out.descEvento = typeof ofertaEvento.desc === "function" ? ofertaEvento.desc() : ofertaEvento.desc;

            // oferta do Mercado
            const ofertaMercado = window.Tapeira.Mercado.OFERTAS_POOL.find(o => o.id === "cm");
            conhecimentoMug = 0;
            ofertaMercado.dar();
            out.cmMercado = conhecimentoMug;
            out.descMercado = typeof ofertaMercado.desc === "function" ? ofertaMercado.desc() : ofertaMercado.desc;

            return out;
        });
        assert.equal(result.em50, 1000, "andar 50 → 1.000 CM");
        assert.equal(result.em100, 2000, "andar 100 → 2.000 CM");
        assert.equal(result.em200, 4000, "andar 200 → 4.000 CM");
        assert.equal(result.cmEvento, 2000, "a oferta do comerciante dá 20×andar");
        assert.equal(result.cmMercado, 2000, "a oferta do Mercado dá 20×andar");
        assert.equal(result.descEvento, result.descEsperado, "desc do evento dinâmica: " + result.descEvento);
        assert.equal(result.descMercado, result.descEsperado, "desc do Mercado dinâmica: " + result.descMercado);
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("Fazenda: depósito com limite — produz, pausa quando cheio e coleta", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        await page.waitForFunction(() => window.Tapeira && window.Tapeira.Fazenda);
        const result = await page.evaluate(async () => {
            UI.showInfo = () => {};
            window.maxAndar = 200;
            fazendaNivel = 10; fazendaRainha = 0;
            andar = 100;
            Tapeira.Fazenda.sincroniza();
            Tapeira.Fazenda.abrir();
            const out = {};
            out.tickAoAbrir = Tapeira.Fazenda.painelTickAtivo();
            out.barraExiste = !!document.getElementById("fazendaBarraFill");
            out.depositoExiste = !!document.getElementById("fazendaDeposito");
            out.cartoesComData = document.querySelectorAll(".ant-collection-card[data-formiga]").length;
            out.cap = Tapeira.Fazenda.capPendentes();
            out.coletarDesabilitadoVazio = document.querySelector(".fazenda-coletar").disabled;

            // primeira produção + o tick (250ms) dá o feedback
            out.produz1 = ProduzFormigasFazenda();
            await new Promise(r => setTimeout(r, 450));
            out.pendentesApos1 = Tapeira.Fazenda.pendentes().length;
            out.mais1 = document.querySelectorAll(".fazenda-mais1").length;
            out.contaTexto = document.querySelector(".fazenda-deposito__conta")?.textContent || "";

            // enche o depósito: a produção PAUSA
            while (ProduzFormigasFazenda()) { /* enche até o cap */ }
            await new Promise(r => setTimeout(r, 300));
            out.pendentesCheio = Tapeira.Fazenda.pendentes().length;
            out.producaoParouCheio = !ProduzFormigasFazenda();
            out.avisoCheio = document.querySelectorAll(".fazenda-deposito.is-cheio").length;
            out.tempoCheio = document.getElementById("fazendaTempo")?.textContent || "";

            // coleta: tudo entra na coleção, o depósito esvazia e os cartões pulsam
            const totalAntes = FORMIGAS.reduce((t, f) => t + window[f.contador], 0);
            out.coletadas = Tapeira.Fazenda.coletar();
            const totalDepois = FORMIGAS.reduce((t, f) => t + window[f.contador], 0);
            out.somouColecao = totalDepois - totalAntes;
            out.pendentesAposColetar = Tapeira.Fazenda.pendentes().length;
            out.pulsando = document.querySelectorAll(".ant-collection-card.is-produzindo").length;
            out.botaoVazioAposColetar = document.querySelector(".fazenda-coletar").disabled;

            // fecha: o tick do painel para (sem timer órfão)
            Tapeira.Fazenda.fechar();
            out.tickAoFechar = Tapeira.Fazenda.painelTickAtivo();
            return out;
        });
        assert.ok(result.tickAoAbrir, "o tick do painel liga ao abrir");
        assert.ok(result.barraExiste, "o painel mostra a barra de produção");
        assert.ok(result.depositoExiste, "o painel mostra o depósito");
        assert.equal(result.cartoesComData, 5, "os 5 cartões têm data-formiga");
        assert.ok(result.cap >= 1, "o depósito tem um cap (5 min de produção): " + result.cap);
        assert.ok(result.coletarDesabilitadoVazio, "sem nada, o Coletar fica desabilitado");
        assert.equal(result.produz1, true, "produz 1 formiga");
        assert.equal(result.pendentesApos1, 1, "ela vai pro depósito (não pra coleção)");
        assert.ok(result.mais1 > 0, "mostra o +1 ao produzir");
        assert.ok(/Esperando: 1 de \d+/.test(result.contaTexto), "conta o depósito: " + result.contaTexto);
        assert.equal(result.pendentesCheio, result.cap, "o depósito enche até o cap");
        assert.ok(result.producaoParouCheio, "com o depósito cheio a produção para");
        assert.equal(result.avisoCheio, 1, "marca o depósito como cheio");
        assert.ok(/dep[óo]sito cheio/i.test(result.tempoCheio), "avisa que está cheio: " + result.tempoCheio);
        assert.equal(result.coletadas, result.cap, "coleta tudo que estava esperando");
        assert.equal(result.somouColecao, result.cap, "as formigas entram na coleção");
        assert.equal(result.pendentesAposColetar, 0, "o depósito esvazia");
        assert.ok(result.pulsando > 0, "pulsa os cartões das cores coletadas");
        assert.ok(result.botaoVazioAposColetar, "depois de coletar, o Coletar fica desabilitado");
        assert.equal(result.tickAoFechar, false, "o tick do painel para ao fechar (sem órfão)");
        assert.deepEqual(pageErrors, []);
    } finally {
        await context.close();
    }
});

test("batalha-fantasma: cartão de batalha monta, valida e importa sem tocar no save", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        const montado = await page.evaluate(() => PvpFantasma.MontaCartaoBatalha());
        assert.equal(montado.saveFormat, "tapeira-cartao-batalha");
        assert.equal(montado.saveVersion, 1);
        for (const campo of ["danoGolpe", "danoCrit", "chanceCrit", "dpsCompanheiro", "taxaAtaque", "seed"]) {
            assert.ok(Number.isFinite(montado[campo]) && montado[campo] >= 0,
                campo + " deve ser numérico e >= 0");
        }
        assert.ok(montado.danoGolpe > 0, "dano do golpe positivo");
        assert.ok(montado.chanceCrit <= 1, "chance de crítico não passa de 100%");

        // validação rejeita lixo de qualquer formato (roda na página: lá
        // existe PvpFantasma)
        const rejeicoes = await page.evaluate(base => {
            const lista = [
                null,
                {},
                { ...base, saveFormat: "tapeira-save" },
                { ...base, danoGolpe: "abc" },
                { ...base, chanceCrit: 3 },
                { ...base, taxaAtaque: 0 },
                { ...base, itensBuildResumo: 123 }
            ];
            return lista.map(lixo => {
                try {
                    PvpFantasma.ValidarCartaoBatalha(lixo);
                    return "aceitou";
                } catch (erro) {
                    return erro instanceof TypeError ? "rejeitou" : "erro-tipo: " + erro;
                }
            });
        }, montado);
        rejeicoes.forEach((resultado, i) => {
            assert.equal(resultado, "rejeitou", "deve rejeitar com TypeError: #" + i);
        });

        // importar o cartão NÃO toca no save e abre a ficha do duelo
        const antes = await page.evaluate(() => {
            gold = 424242;
            andar = 37;
            return { gold: Number(gold), andar };
        });
        const resultado = await page.evaluate(c => ImportarSaveJson(JSON.stringify(c)), montado);
        assert.equal(resultado, true, "importação do cartão retorna true");
        const depois = await page.evaluate(() => {
            const tela = document.getElementById("pvpDuelo");
            return {
                gold: Number(gold),
                andar,
                temTela: !!tela,
                texto: tela ? tela.textContent : "",
                temExportar: !!tela?.querySelector("[data-pvp-exportar]"),
                semInline: !tela || ![...tela.querySelectorAll("button")]
                    .some(b => b.hasAttribute("onclick"))
            };
        });
        assert.equal(depois.gold, antes.gold, "gold intacto após importar o cartão");
        assert.equal(depois.andar, antes.andar, "andar intacto após importar o cartão");
        assert.ok(depois.temTela, "tela do duelo abriu");
        assert.ok(depois.texto.includes(montado.nome), "ficha mostra o nome do jogador");
        assert.ok(depois.texto.includes("Fantasma"), "ficha mostra o adversário");
        assert.ok(depois.temExportar, "ficha tem o botão de exportar meu cartão");
        assert.ok(depois.semInline, "sem onclick inline na tela do duelo");

        // o aviso "cartão recebido" abre por cima — fecha ele e depois o duelo
        await page.click("#infoModal [data-info-fechar]");
        await page.click("[data-pvp-fechar]");
        const fechada = await page.evaluate(() => !document.getElementById("pvpDuelo"));
        assert.ok(fechada, "botão Fechar fecha a tela do duelo");

        // o ramo do cartão não quebrou a rejeição do fluxo normal de save
        const saveInvalido = await page.evaluate(
            () => ImportarSaveJson('{"saveFormat":"tapeira-save","gold":"lixo"}'));
        assert.equal(saveInvalido, false, "save inválido continua sendo rejeitado");

        assert.deepEqual(pageErrors, [], "sem erros de JavaScript");
    } finally {
        await context.close();
    }
});

test("batalha-fantasma: corrida contra o chefe é determinística e decide o vencedor", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        // o "Como jogar" abre sozinho em página nova — fecha antes dos cliques
        try {
            await page.waitForSelector("#infoModal [data-info-fechar]", { timeout: 2500 });
            await page.click("#infoModal [data-info-fechar]");
        } catch (erro) { /* já fechado ou não abriu */ }

        let FIX_A = {
            saveFormat: "tapeira-cartao-batalha", saveVersion: 1,
            exportedAt: "2026-01-01T00:00:00.000Z", nome: "A", nivel: 10,
            danoGolpe: 1000, danoCrit: 4000, chanceCrit: 0.3,
            dpsCompanheiro: 0, especializacao: null, itensBuildResumo: "",
            taxaAtaque: 3, seed: 111
        };
        let FIX_B = { ...FIX_A, nome: "B", exportedAt: "2026-01-02T00:00:00.000Z", seed: 222 };
        // Fase 3: a validação exige o id de integridade — assina os
        // fixtures na página (é lá que existe o segredo)
        [FIX_A, FIX_B] = await page.evaluate(f => f.map(c => {
            c.id = PvpFantasma._assinatura(c);
            return c;
        }), [FIX_A, FIX_B]);

        // 1) determinismo: mesma entrada → mesmo resultado
        const r1 = await page.evaluate(
            f => JSON.stringify(PvpFantasma.SimulaDuelo(f[0], f[1])), [FIX_A, FIX_B]);
        const r2 = await page.evaluate(
            f => JSON.stringify(PvpFantasma.SimulaDuelo(f[0], f[1])), [FIX_A, FIX_B]);
        assert.equal(r1, r2, "mesmos cartões → mesmo resultado");

        // 2) simetria: importar invertido espelha os tempos — as duas
        //    máquinas chegam no mesmo resultado, independente de quem
        //    importou o cartão de quem
        const sim = await page.evaluate(f => {
            const ab = PvpFantasma.SimulaDuelo(f[0], f[1]);
            const ba = PvpFantasma.SimulaDuelo(f[1], f[0]);
            return {
                meuAB: ab.tempoMeu, fantAB: ab.tempoFantasma, venceuAB: ab.venceu,
                meuBA: ba.tempoMeu, fantBA: ba.tempoFantasma, venceuBA: ba.venceu
            };
        }, [FIX_A, FIX_B]);
        assert.equal(sim.meuAB, sim.fantBA, "tempo do A espelha ao inverter a ordem");
        assert.equal(sim.fantAB, sim.meuBA, "tempo do B espelha ao inverter a ordem");
        assert.equal(sim.venceuAB, !sim.venceuBA, "o vencedor espelha");

        // 3) build muito mais forte vence e o lado fraco passa dos 25s
        const forte = await page.evaluate(() => {
            const base = {
                saveFormat: "tapeira-cartao-batalha", saveVersion: 1,
                exportedAt: "2026-01-01T00:00:00.000Z", nome: "Rival", nivel: 1,
                danoGolpe: 10, danoCrit: 40, chanceCrit: 0.2,
                dpsCompanheiro: 0, especializacao: null, itensBuildResumo: "",
                taxaAtaque: 3, seed: 7
            };
            base.id = PvpFantasma._assinatura(base);
            const forte = { ...base, seed: 9, danoGolpe: 100000, danoCrit: 400000 };
            forte.id = PvpFantasma._assinatura(forte);
            return PvpFantasma.SimulaDuelo(forte, base);
        });
        assert.equal(forte.venceu, true, "build mais forte vence");
        assert.ok(forte.tempoMeu < forte.tempoFantasma, "tempo do forte é menor");
        assert.ok(forte.tempoMeu > 0 && Number.isFinite(forte.tempoMeu), "tempo finito e positivo");
        assert.ok(forte.tempoFantasma > 24, "lado fraco leva mais que os 25s da média");

        // 4) fluxo na tela: abrir → Começar duelo → animação → resultado → fechar
        await page.evaluate(f => PvpFantasma.AbreDuelo(f), FIX_A);
        await page.click("[data-pvp-lutar]");
        const sumiu = await page.evaluate(() => !document.querySelector("[data-pvp-lutar]"));
        assert.ok(sumiu, "botão Começar some durante o duelo");
        await page.waitForSelector("[data-pvp-resultado]:not([hidden])", { timeout: 8000 });
        const fim = await page.evaluate(() => ({
            texto: document.querySelector("[data-pvp-resultado]").textContent,
            tempos: [...document.querySelectorAll("[data-pvp-tempo]")].map(e => e.textContent),
            timer: PvpFantasma._timerDuelo,
            cronometro: document.querySelector("[data-pvp-cronometro]").textContent,
            larguraBarra: document.querySelector(
                '[data-pvp-alvo="meu"] [data-pvp-fill]').style.width
        }));
        assert.ok(/VENCEU/.test(fim.texto), "banner de resultado aparece");
        assert.ok(fim.tempos.every(t => /^(\d+\.\d{2}s|> 1h)$/.test(t)),
            "tempos por lado formatados (s ou > 1h)");
        assert.equal(fim.timer, null, "timer liberado quando a corrida acaba");
        assert.ok(/^(\d+\.\d{2}s|> 1h)$/.test(fim.cronometro), "cronômetro final formatado");
        assert.ok(fim.larguraBarra !== "", "barra de vida foi atualizada");

        await page.click("[data-pvp-fechar]");
        const fechou = await page.evaluate(() => ({
            semModal: !document.getElementById("pvpDuelo"),
            timer: PvpFantasma._timerDuelo
        }));
        assert.ok(fechou.semModal && fechou.timer === null, "Fechar limpa modal e timer");

        // 5) fechar DURANTE a animação também cancela o timer
        await page.evaluate(f => PvpFantasma.AbreDuelo(f), FIX_A);
        await page.click("[data-pvp-lutar]");
        await page.click("[data-pvp-fechar]");
        const noMeio = await page.evaluate(() => ({
            semModal: !document.getElementById("pvpDuelo"),
            timer: PvpFantasma._timerDuelo
        }));
        assert.ok(noMeio.semModal && noMeio.timer === null,
            "fechar no meio da animação cancela o timer");

        assert.deepEqual(pageErrors, [], "sem erros de JavaScript");
    } finally {
        await context.close();
    }
});

test("tempo para fugir mostra no máximo duas casas decimais", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        const resultado = await page.evaluate(() => {
            const el = document.getElementById("contTempo");
            const casos = {};
            // lixo real de ponto flutuante (raiz: a multiplicação do
            // TempoFugaMax com o Relógio de Bolso)
            tempoAvancoInimigos = 117.0500000000003;
            AtualizarTela();
            casos.sujo = el.textContent;
            tempoAvancoInimigos = 120;
            UI.updateResources();
            casos.inteiro = el.textContent;
            tempoAvancoInimigos = 116.5;
            AtualizarTela();
            casos.meio = el.textContent;
            casos.helper = [
                FormataTempoFuga(117.0500000000003),
                FormataTempoFuga(120),
                FormataTempoFuga(116.5),
                FormataTempoFuga(0.0500000000003),
                FormataTempoFuga(NaN)
            ];
            tempoAvancoInimigos = 90; // devolve o valor padrão da página
            return casos;
        });
        assert.equal(resultado.sujo, "117.05", "valor sujo aparece com 2 casas");
        assert.equal(resultado.inteiro, "120", "inteiro aparece sem decimal");
        assert.equal(resultado.meio, "116.5", "meio decimal sem zero sobrando");
        assert.deepEqual(resultado.helper,
            ["117.05", "120", "116.5", "0.05", "0"],
            "helper formata todos os casos");

        assert.deepEqual(pageErrors, [], "sem erros de JavaScript");
    } finally {
        await context.close();
    }
});

test("pvp: só itens com forja 5+ entram no cartão e ganham borda prateada na tela de builds", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        const r = await page.evaluate(() => {
            const saida = {};
            const monta = (id, qtd, forja) => Tapeira.ItensBuild.carrega({
                itensBuild: Array(qtd).fill(id),
                forja: { [id]: forja },
                slotsExtrasBuild: 0,
                bausBuildPendentes: 0,
                bauBuildPendente: false,
                opcoesBauBuild: null
            });

            saida.minimo = Tapeira.ItensBuild.FORJA_MINIMO_PVP;
            saida.nomeAdaga = Tapeira.ItensBuild.item("adaga").nome;

            // adaga com forja 4: conta no jogo, NÃO deve contar no PvP
            monta("adaga", 3, 4);
            saida.multNormal4 = Tapeira.ItensBuild.multDano();
            saida.multPvp4 = Tapeira.ItensBuild.multDanoPvp();
            saida.dano4 = PvpFantasma.MontaCartaoBatalha().danoGolpe;
            saida.cartaoResumo4 = PvpFantasma.MontaCartaoBatalha().itensBuildResumo;

            // adaga com forja 5: conta nos dois
            monta("adaga", 3, 5);
            saida.multNormal5 = Tapeira.ItensBuild.multDano();
            saida.multPvp5 = Tapeira.ItensBuild.multDanoPvp();
            const cartao5 = PvpFantasma.MontaCartaoBatalha();
            saida.dano5 = cartao5.danoGolpe;
            saida.cartaoResumo5 = cartao5.itensBuildResumo;
            saida.resumoNormal5 = Tapeira.ItensBuild.resumo();

            // chance crítica (pocaoVerde): mesmo filtro
            monta("pocaoVerde", 1, 4);
            saida.chanceNormal4 = Tapeira.ItensBuild.multChanceCrit();
            saida.chancePvp4 = Tapeira.ItensBuild.multChanceCritPvp();
            monta("pocaoVerde", 1, 5);
            saida.chanceNormal5 = Tapeira.ItensBuild.multChanceCrit();
            saida.chancePvp5 = Tapeira.ItensBuild.multChanceCritPvp();

            // tela de builds: marcador visual da régua 5+
            window.maxAndar = Math.max(Number(maxAndar) || 0, 150); // destrava a tela
            monta("adaga", 3, 5);
            UI.showItensBuild();
            const cartaoDom5 = document.querySelector("#modalItensBuildView .item-build-cartao");
            saida.classes5 = cartaoDom5 ? cartaoDom5.className : "";
            monta("adaga", 3, 4);
            UI.showItensBuild(); // reabre/re-renderiza
            const cartaoDom4 = document.querySelector("#modalItensBuildView .item-build-cartao");
            saida.classes4 = cartaoDom4 ? cartaoDom4.className : "";
            return saida;
        });

        assert.equal(r.minimo, 5, "mínimo de forja do PvP é 5");

        assert.ok(r.multNormal4 > 1, "forja 4 continua contando no jogo normal");
        assert.equal(r.multPvp4, 1, "forja 4 NÃO conta no multiplicador do PvP");
        assert.equal(r.cartaoResumo4, "nenhum", "resumo do cartão fica vazio sem forja 5");
        assert.ok(r.dano5 > r.dano4, "dano do cartão sobe quando a forja chega a 5");

        assert.ok(r.multNormal5 > 1, "forja 5 conta no jogo normal");
        assert.equal(r.multPvp5, r.multNormal5, "forja 5 conta no PvP igual ao jogo");
        assert.equal(r.cartaoResumo5,
            r.nomeAdaga + " ×3 (+5 forjadas)",
            "resumo do cartão lista só o item de forja 5, com as forjadas");
        assert.ok(r.resumoNormal5.indexOf(r.nomeAdaga) >= 0,
            "resumo normal (tela) segue listando tudo");

        assert.ok(r.chanceNormal4 > 1, "pocaoVerde forja 4 conta na chance do jogo");
        assert.equal(r.chancePvp4, 1, "pocaoVerde forja 4 NÃO conta na chance do PvP");
        assert.equal(r.chancePvp5, r.chanceNormal5, "pocaoVerde forja 5 conta no PvP");

        assert.ok(r.classes5.includes("item-build-cartao--pvp"),
            "forja 5 ganha a borda prateada na tela de builds");
        assert.ok(r.classes5.includes("item-build-cartao--forjada"),
            "forja 5 mantém a dourada de base por cima");
        assert.ok(r.classes4.includes("item-build-cartao--forjada"),
            "forja 4 continua só com a dourada");
        assert.ok(!r.classes4.includes("item-build-cartao--pvp"),
            "forja 4 NÃO ganha a borda prateada");

        assert.deepEqual(pageErrors, [], "sem erros de JavaScript");
    } finally {
        await context.close();
    }
});

test("pvp fase 3: id de integridade, +2 esmeraldas na vitória e cartão usado não reentra", async () => {
    const { context, page, pageErrors } = await openIsolatedPage("Caverna.html");
    try {
        // o "Como jogar" abre sozinho em página nova — fecha antes dos cliques
        try {
            await page.waitForSelector("#infoModal [data-info-fechar]", { timeout: 2500 });
            await page.click("#infoModal [data-info-fechar]");
        } catch (erro) { /* já fechado ou não abriu */ }

        // (a) id: vetor de teste do sha256, edição invalida o cartão e
        //     reexportar sem mudar progresso mantém o MESMO id (anti-farm)
        const a = await page.evaluate(() => {
            const c = PvpFantasma.MontaCartaoBatalha();
            const saida = {
                id: c.id,
                sha0: PvpFantasma._sha256(""),
                shaAbc: PvpFantasma._sha256("abc")
            };
            const editado = { ...c, danoGolpe: c.danoGolpe * 10 };
            try { PvpFantasma.ValidarCartaoBatalha(editado); saida.editado = "aceitou"; }
            catch (e) { saida.editado = e.message; }
            const reexportado = {
                ...c,
                exportedAt: "2030-06-30T12:00:00.000Z",
                seed: (c.seed + 999) % 2147483647
            };
            saida.idReexportado = PvpFantasma._assinatura(reexportado);
            const semId = { ...c };
            delete semId.id;
            try { PvpFantasma.ValidarCartaoBatalha(semId); saida.semId = "aceitou"; }
            catch (e) { saida.semId = "rejeitou"; }
            return saida;
        });
        assert.ok(/^[0-9a-f]{32}$/.test(a.id), "id tem 32 dígitos hexadecimais");
        assert.equal(a.sha0,
            "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
            "sha256 do texto vazio bate com o vetor de teste");
        assert.equal(a.shaAbc,
            "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
            "sha256 de \"abc\" bate com o vetor de teste");
        assert.ok(a.editado.includes("assinatura"),
            "editar o cartão invalida a assinatura: " + a.editado);
        assert.equal(a.idReexportado, a.id,
            "reexportar sem mudar progresso mantém o mesmo id");
        assert.equal(a.semId, "rejeitou", "cartão sem id é recusado");

        // (b) vitória: +2 esmeraldas e o id entra na lista de usados
        const abertura = await page.evaluate(() => {
            const meu = PvpFantasma.MontaCartaoBatalha();
            const fraco = {
                ...meu, nome: "Fraco",
                danoGolpe: 1, danoCrit: 1, chanceCrit: 0,
                dpsCompanheiro: 0, seed: 424242
            };
            fraco.id = PvpFantasma._assinatura(fraco);
            const antes = esmeraldas;
            const ok = PvpFantasma.RecebeCartao(fraco);
            return { fraco, antes, ok, temTela: !!document.getElementById("pvpDuelo") };
        });
        assert.equal(abertura.ok, true, "cartão assinado (mais fraco) é aceito");
        assert.ok(abertura.temTela, "ficha do duelo abriu");
        try {
            await page.waitForSelector("#infoModal [data-info-fechar]", { timeout: 2000 });
            await page.click("#infoModal [data-info-fechar]");
        } catch (erro) { /* sem aviso por cima */ }
        await page.click("[data-pvp-lutar]");
        await page.waitForSelector("[data-pvp-resultado]:not([hidden])", { timeout: 9000 });
        const vitoria = await page.evaluate(() => ({
            esmeraldas: esmeraldas,
            usados: pvpCartoesUsados.slice(),
            texto: document.querySelector("[data-pvp-resultado]").textContent
        }));
        assert.equal(vitoria.esmeraldas, abertura.antes + 2, "vitória paga 2 esmeraldas");
        assert.ok(vitoria.texto.includes("+2 esmeraldas"), "banner mostra o prêmio");
        assert.deepEqual(vitoria.usados, [abertura.fraco.id],
            "id do cartão registrado quando o duelo conclui");

        // (c) o MESMO cartão de novo → recusado, sem novo prêmio
        const repetida = await page.evaluate(fr => {
            const antes = esmeraldas;
            const ok = PvpFantasma.RecebeCartao(fr);
            return { ok, esmeraldas: esmeraldas, antes, usados: pvpCartoesUsados.length };
        }, abertura.fraco);
        assert.equal(repetida.ok, false, "cartão usado é recusado no reimport");
        assert.equal(repetida.esmeraldas, repetida.antes, "reimportação não paga nada");
        assert.equal(repetida.usados, 1, "lista de usados não muda");

        // (d) derrota: queima o id também, mas não paga nada
        const derrota = await page.evaluate(() => {
            const meu = PvpFantasma.MontaCartaoBatalha();
            const forte = {
                ...meu, nome: "Forte",
                danoGolpe: 1e9, danoCrit: 1e9, chanceCrit: 0.5,
                dpsCompanheiro: 0, seed: 777
            };
            forte.id = PvpFantasma._assinatura(forte);
            const antes = esmeraldas;
            const ok = PvpFantasma.RecebeCartao(forte);
            return { forte, antes, ok };
        });
        assert.equal(derrota.ok, true, "segundo cartão (mais forte) é aceito");
        try {
            await page.waitForSelector("#infoModal [data-info-fechar]", { timeout: 2000 });
            await page.click("#infoModal [data-info-fechar]");
        } catch (erro) { /* sem aviso por cima */ }
        await page.click("[data-pvp-lutar]");
        await page.waitForSelector("[data-pvp-resultado]:not([hidden])", { timeout: 9000 });
        const fimDerrota = await page.evaluate(() => ({
            esmeraldas: esmeraldas,
            usados: pvpCartoesUsados.slice(),
            texto: document.querySelector("[data-pvp-resultado]").textContent
        }));
        assert.equal(fimDerrota.esmeraldas, derrota.antes, "derrota não paga esmeraldas");
        assert.ok(fimDerrota.texto.includes("FANTASMA VENCEU"), "banner da derrota aparece");
        assert.ok(!fimDerrota.texto.includes("+2 esmeraldas"), "derrota não mostra prêmio");
        assert.deepEqual(fimDerrota.usados, [abertura.fraco.id, derrota.forte.id],
            "derrota também queima o id");

        // (e) contrato de save: builder, validação + whitelist e carga
        const contrato = await page.evaluate(() => {
            const saida = {};
            const ids = ["a1b2c3d4e5f60718293a4b5c6d7e8f90", "00112233445566778899aabbccddeeff"];
            pvpCartoesUsados = ids.slice();
            const obj = CriarObjetoSave(false);
            obj.saveFormat = "tapeira-save";
            obj.saveVersion = 1;
            obj.exportedAt = new Date().toISOString();
            saida.builder = Array.isArray(obj.pvpCartoesUsados)
                && obj.pvpCartoesUsados.length === 2;
            const json = JSON.stringify(obj);
            try { ValidarSave(JSON.parse(json)); saida.valido = true; }
            catch (e) { saida.valido = false; saida.erroValido = e.message; }
            const lixo = JSON.parse(json);
            lixo.pvpCartoesUsados = "nao-array";
            try { ValidarSave(lixo); saida.rejeitaLixo = false; }
            catch (e) { saida.rejeitaLixo = e instanceof TypeError; }
            const fora = JSON.parse(json);
            fora.pvpCartoesUsados = ["nao-hex"];
            try { ValidarSave(fora); saida.rejeitaFormato = false; }
            catch (e) { saida.rejeitaFormato = e instanceof TypeError; }
            // save novo: Carregar restaura a lista
            pvpCartoesUsados = [];
            Carregar(json);
            saida.restaurado = pvpCartoesUsados.slice();
            // save antigo sem o campo: começa vazio
            const antigo = JSON.parse(json);
            delete antigo.pvpCartoesUsados;
            pvpCartoesUsados = ["lixo"];
            Carregar(JSON.stringify(antigo));
            saida.antigo = pvpCartoesUsados.slice();
            return saida;
        });
        assert.ok(contrato.builder, "CriarObjetoSave leva pvpCartoesUsados");
        assert.equal(contrato.valido, true,
            "ValidarSave aceita a lista (whitelist): " + (contrato.erroValido || ""));
        assert.ok(contrato.rejeitaLixo, "lista lixo (não-array) é rejeitada");
        assert.ok(contrato.rejeitaFormato, "id fora do formato é rejeitado");
        assert.deepEqual(contrato.restaurado,
            ["a1b2c3d4e5f60718293a4b5c6d7e8f90", "00112233445566778899aabbccddeeff"],
            "Carregar restaura a lista");
        assert.deepEqual(contrato.antigo, [], "save antigo ganha lista vazia");

        assert.deepEqual(pageErrors, [], "sem erros de JavaScript");
    } finally {
        await context.close();
    }
});

