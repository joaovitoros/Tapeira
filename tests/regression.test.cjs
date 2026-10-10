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
    browser = await chromium.launch({ headless: true });
});

after(async () => {
    if (browser) await browser.close();
    if (server) await new Promise(resolve => server.close(resolve));
});

async function openIsolatedPage(url) {
    const context = await browser.newContext();
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
