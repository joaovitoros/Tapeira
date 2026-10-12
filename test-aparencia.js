// Teste focado: APARÊNCIA da toupeira (customização) — chapéus + cachecóis.
// Camadas dentro da caixa do player + preview na Casa + save (5 passos).
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
        const slotChapeu = A.slot("chapeu");
        const slotCachecol = A.slot("cachecol");

        res.temApi = !!A;
        res.slots = A.SLOTS.map(s => s.id).join(",");
        res.qtdChapeus = slotChapeu.itens.length;
        res.qtdCachecois = slotCachecol.itens.length;

        // camadas dentro da caixa do player
        res.baseDentro = !!document.querySelector(".player .player__base");
        const chapeuImg = document.querySelector('.player .player__camada[data-aparencia-slot="chapeu"]');
        const cachecolImg = document.querySelector('.player .player__camada[data-aparencia-slot="cachecol"]');
        res.temCamadas = !!chapeuImg && !!cachecolImg;

        // sem item: escondidas; com item: aparecem com src/posição
        chapeuEquipado = "nenhum"; cachecolEquipado = "nenhum";
        A.aplica();
        res.escondidoSemItem = chapeuImg.hidden && cachecolImg.hidden;
        res.equipouViking = A.equipar("chapeu", "viking");
        res.visivelComChapeu = !chapeuImg.hidden;
        res.srcViking = chapeuImg.getAttribute("src") || "";
        res.espelhadoViking = chapeuImg.classList.contains("is-espelhado");
        res.equipouFantasma = A.equipar("chapeu", "fantasma");
        res.equipouCachecol = A.equipar("cachecol", "roxo");
        res.visivelCachecol = !cachecolImg.hidden;
        res.srcCachecol = cachecolImg.getAttribute("src") || "";
        res.posCachecol = cachecolImg.style.left + "/" + cachecolImg.style.top + "/" + cachecolImg.style.width;

        // save: os dois campos vão, são aceitos e voltam; lixo é rejeitado
        const save = CriarObjetoSave();
        res.saveChapeu = save.chapeuEquipado;
        res.saveCachecol = save.cachecolEquipado;
        let ok = true, lixo = false, desconhecido = false;
        try { ValidarSave(save); } catch { ok = false; }
        try { ValidarSave(Object.assign({}, save, { cachecolEquipado: 7 })); } catch { lixo = true; }
        try { ValidarSave(Object.assign({}, save, { cachecolEquipado: "fantasma" })); } catch { desconhecido = true; }
        res.validou = ok; res.rejeitouLixo = lixo; res.rejeitouDesconhecido = desconhecido;
        chapeuEquipado = "nenhum"; cachecolEquipado = "nenhum";
        Carregar(JSON.stringify(save));
        res.carregouChapeu = chapeuEquipado;
        res.carregouCachecol = cachecolEquipado;

        // seção na Casa + preview
        const secao = A.secaoCasa();
        res.secaoOk = secao.classList.contains("casa-secao");
        res.blocos = secao.querySelectorAll(".aparencia-bloco").length;
        res.itensLista = secao.querySelectorAll(".aparencia-lista .aparencia-item").length;
        const pvC = secao.querySelector('.aparencia-preview .player__camada[data-aparencia-slot="chapeu"]');
        const pvS = secao.querySelector('.aparencia-preview .player__camada[data-aparencia-slot="cachecol"]');
        res.previewChapeu = !!(pvC && !pvC.hidden && /chapeus\/chapeu-05\.png$/.test(pvC.getAttribute("src") || ""));
        res.previewCachecol = !!(pvS && !pvS.hidden && /cachecois\/cachecol-01\.png$/.test(pvS.getAttribute("src") || ""));

        // Resetar NÃO mexe na aparência (permanente)
        chapeuEquipado = "mago"; cachecolEquipado = "azul";
        Resetar();
        res.aposResetChapeu = chapeuEquipado;
        res.aposResetCachecol = cachecolEquipado;
        return res;
    });

    check("API Tapeira.Aparencia existe", r.temApi === true);
    check("slots: chapeu, cachecol", r.slots === "chapeu,cachecol", r.slots);
    check("8 chapéus + 6 cachecóis", r.qtdChapeus === 8 && r.qtdCachecois === 6, r.qtdChapeus + "/" + r.qtdCachecois);
    check("base e camadas dentro da caixa do player", r.baseDentro === true && r.temCamadas === true);
    check("sem item, as camadas ficam escondidas", r.escondidoSemItem === true);
    check("equipar chapéu funciona", r.equipouViking === true && r.visivelComChapeu === true);
    check("chapéu aponta pro arquivo certo", /chapeus\/chapeu-05\.png$/.test(r.srcViking), r.srcViking);
    check("viking vem espelhado", r.espelhadoViking === true);
    check("item desconhecido é recusado", r.equipouFantasma === false);
    check("equipar cachecol funciona", r.equipouCachecol === true && r.visivelCachecol === true);
    check("cachecol aponta pro arquivo certo", /cachecois\/cachecol-01\.png$/.test(r.srcCachecol), r.srcCachecol);
    check("cachecol posicionado em % da caixa", /%\/[0-9.]+%\/[0-9.]+%$/.test(r.posCachecol), r.posCachecol);
    check("save grava os dois slots", r.saveChapeu === "viking" && r.saveCachecol === "roxo", r.saveChapeu + "/" + r.saveCachecol);
    check("validação aceita itens válidos", r.validou === true);
    check("validação rejeita cachecol não-texto", r.rejeitouLixo === true);
    check("validação rejeita cachecol desconhecido", r.rejeitouDesconhecido === true);
    check("load restaura os dois slots", r.carregouChapeu === "viking" && r.carregouCachecol === "roxo", r.carregouChapeu + "/" + r.carregouCachecol);
    check("seção Aparência é uma casa-secao", r.secaoOk === true);
    check("seção tem um bloco por slot", r.blocos === 2, r.blocos);
    check("seção lista 9 chapéus + 7 cachecóis (com 'nenhum')", r.itensLista === 16, r.itensLista);
    check("preview mostra chapéu e cachecol", r.previewChapeu === true && r.previewCachecol === true);
    check("Resetar NÃO zera a aparência", r.aposResetChapeu === "mago" && r.aposResetCachecol === "azul");

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
