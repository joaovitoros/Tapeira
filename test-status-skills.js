// Teste focado: painel de Status mostra o dano FINAL (com os itens da build) e
// a árvore de habilidades só marca "máximo" quando skill E perk estão no
// máximo. Rode depois de `npm run prepare:web`: node test-status-skills.js
const { chromium } = require('playwright');
const path = require('path');

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    const erros = [];
    page.on('pageerror', e => {
        if (!/play\(\) failed because the user didn't interact/.test(e.message)) erros.push(e.message);
    });
    await page.goto('file://' + path.resolve(__dirname, 'www', 'Caverna.html'));
    await page.waitForFunction(() => window.andar !== undefined, { timeout: 15000 });

    const resultados = await page.evaluate(() => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });

        // ---------- Status: dano/crítico incluem os itens da build ----------
        UI.showInfo = () => {};
        Tapeira.ItensBuild.carrega({ itensBuild: ["adaga", "pocaoRubra"], bauBuildPendente: false });
        danoJogador = 100;
        danoCritJogador = 200;
        nivelJogador = 1;
        chanceCrit = 0;
        especializacao = 0;
        formigasVermelhas = formigasAmarelas = formigasMarrons = formigasPretas = formigasCinzas = 0;

        UI.showStatus();
        const linhas = {};
        document.querySelectorAll("#StatusBody tr").forEach(tr => {
            const nome = tr.querySelector(".statusNome")?.textContent;
            const valor = tr.querySelector(".statusValor")?.textContent;
            if (nome) linhas[nome] = valor;
        });

        check("Status 'Dano' inclui a Adaga (×1,15): 100 → 115",
            Math.abs(parseFloat(linhas["Dano"]) - 115) < 0.01, linhas["Dano"]);
        check("Status 'Dano crítico' inclui Poção Rubra (×1,25) e Adaga: 200 → 287,5",
            Math.abs(parseFloat(linhas["Dano crítico"]) - 200 * 1.25 * 1.15) < 0.01, linhas["Dano crítico"]);

        // ---------- Habilidades: "máximo" exige skill E perk no máximo ----------
        maxAndar = 100; // desbloqueia
        const skillDano = SKILLS_UPGRADE.find(s => s.id === "damage");
        nivelSkillDano = skillDano.maximo;
        perkDano = 0;
        UI.showSkillUpgradePanel();
        const resumoDe = titulo => {
            for (const c of document.querySelectorAll("#skillUpgradeModal .skill-secao-cabecalho")) {
                if (c.querySelector(".skill-secao-titulo")?.textContent === titulo) {
                    return c.querySelector(".skill-secao-resumo")?.textContent || "";
                }
            }
            return "";
        };

        const comPerkPendente = resumoDe("Dano automático");
        check("nível máx + perk pendente NÃO marca 'máximo'", !comPerkPendente.includes("máximo"), comPerkPendente);
        check("mostra o progresso do perk (perk 0/4)", /perk 0\//.test(comPerkPendente), comPerkPendente);

        perkDano = PERKS.find(p => p.varName === "perkDano").maximo;
        UI.showSkillUpgradePanel();
        const tudoMax = resumoDe("Dano automático");
        check("nível máx + perk máx marca '✓ máximo'", tudoMax.includes("máximo"), tudoMax);

        return out;
    });

    await browser.close();
    let falhas = 0;
    for (const r of resultados) {
        if (!r.ok) falhas++;
        console.log((r.ok ? "OK   " : "FAIL ") + r.nome + (r.detalhe ? "  (" + r.detalhe + ")" : ""));
    }
    if (erros.length) { console.log("erros de pagina: " + erros.join(" | ")); falhas++; }
    console.log("\n" + (resultados.length - falhas) + "/" + resultados.length + " verificacoes passaram.");
    process.exit(falhas ? 1 : 0);
})();
