// Teste focado: APARÊNCIA da toupeira (customização) — chapéus.
// Camada dentro da caixa do player + seção na Casa + save (5 passos).
// Roda direto da fonte (raiz do projeto): node test-aparencia.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', e => {
        if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message);
    });
    await page.goto('file://' + path.resolve(__dirname, 'Caverna.html'));
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

    const out = [];
    const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

    const r = await page.evaluate(() => {
        window.ChamaSom = () => {};
        document.getElementById("infoModal")?.remove();
        UI.showInfo = () => {};
        document.querySelector(".offline-rewards-claim")?.click();
        document.querySelector(".offline-rewards-overlay")?.remove();
        const res = {};
        const A = window.Tapeira?.Aparencia;

        res.temApi = !!A;
        res.qtd = A.CHAPEUS.length;
        res.ids = A.CHAPEUS.map(c => c.id).join(",");

        // a base e a camada vivem DENTRO da caixa do player
        res.baseDentro = !!document.querySelector(".player .player__base");
        res.chapeuDentro = !!document.querySelector(".player .player__chapeu");

        // sem chapéu, a camada some; com chapéu, aparece com src e posição em %
        chapeuEquipado = "nenhum";
        A.aplica();
        const img = document.querySelector(".player__chapeu");
        res.escondidoSemChapeu = !!img && img.hidden;
        res.equipouViking = A.equiparChapeu("viking");
        res.visivelComChapeu = !!img && !img.hidden;
        res.srcViking = img ? img.getAttribute("src") : "";
        res.posPct = img ? (img.style.left + "/" + img.style.top + "/" + img.style.width) : "";
        res.equipouFantasma = A.equiparChapeu("fantasma");

        // save: o campo vai, é aceito e volta; lixo é rejeitado
        chapeuEquipado = "viking";
        const save = CriarObjetoSave();
        res.saveTem = save.chapeuEquipado;
        let ok = true, lixo = false, desconhecido = false;
        try { ValidarSave(save); } catch { ok = false; }
        try { ValidarSave(Object.assign({}, save, { chapeuEquipado: 7 })); } catch { lixo = true; }
        try { ValidarSave(Object.assign({}, save, { chapeuEquipado: "fantasma" })); } catch { desconhecido = true; }
        res.validou = ok; res.rejeitouLixo = lixo; res.rejeitouDesconhecido = desconhecido;
        chapeuEquipado = "nenhum";
        Carregar(JSON.stringify(save));
        res.carregou = chapeuEquipado;

        // seção na Casa
        const secao = A.secaoCasa();
        res.secaoOk = secao.classList.contains("casa-secao");
        res.botoes = secao.querySelectorAll(".aparencia-chapeu").length;

        // Resetar NÃO mexe no chapéu (permanente)
        chapeuEquipado = "mago";
        Resetar();
        res.aposReset = chapeuEquipado;
        return res;
    });

    check("API Tapeira.Aparencia existe", r.temApi === true);
    check("9 opções (nenhum + 8 chapéus)", r.qtd === 9, r.qtd);
    check("ids dos chapéus", r.ids === "nenhum,amarelo,escuro,vermelho,verde,viking,mago,palha,pirata", r.ids);
    check("base e camada dentro da caixa do player", r.baseDentro === true && r.chapeuDentro === true);
    check("sem chapéu, a camada fica escondida", r.escondidoSemChapeu === true);
    check("equipar chapéu funciona", r.equipouViking === true && r.visivelComChapeu === true);
    check("camada aponta pro arquivo do chapéu", /chapeus\/chapeu-05\.png$/.test(r.srcViking), r.srcViking);
    check("camada posicionada em % da caixa", /%\/[0-9.]+%\/[0-9.]+%$/.test(r.posPct), r.posPct);
    check("chapéu desconhecido é recusado", r.equipouFantasma === false);
    check("save grava chapeuEquipado", r.saveTem === "viking", r.saveTem);
    check("validação aceita chapéu válido", r.validou === true);
    check("validação rejeita chapéu não-texto", r.rejeitouLixo === true);
    check("validação rejeita chapéu desconhecido", r.rejeitouDesconhecido === true);
    check("load restaura o chapéu", r.carregou === "viking", r.carregou);
    check("seção Aparência é uma casa-secao", r.secaoOk === true);
    check("seção lista as 9 opções", r.botoes === 9, r.botoes);
    check("Resetar NÃO zera o chapéu", r.aposReset === "mago", r.aposReset);

    await browser.close();
    let falhas = 0;
    for (const x of out) {
        if (!x.ok) falhas++;
        console.log((x.ok ? "OK   " : "FAIL ") + x.nome + (x.detalhe ? "  (" + x.detalhe + ")" : ""));
    }
    if (erros.length) { console.log("erros de pagina: " + erros.join(" | ")); falhas++; }
    console.log("\n" + (out.length - falhas) + "/" + out.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
