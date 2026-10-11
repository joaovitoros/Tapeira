// Teste focado: padronização da fileira de habilidades (#container-Habilidades).
// O "Dano automático" (ícone + barra) precisa ser o primeiro item da MESMA
// fileira das skills de combate, com ícone/barra do mesmo tamanho e alinhados.
// Roda direto da fonte (raiz do projeto): node test-skill-layout.js
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

    const resultados = await page.evaluate(() => {
        const out = [];
        const check = (nome, ok, detalhe) => out.push({ nome, ok: !!ok, detalhe: detalhe === undefined ? "" : String(detalhe) });
        window.ChamaSom = () => {};
        UI.showInfo = () => {};

        // Desbloqueia as skills de combate pra ter ícone/barra de referência.
        maxAndar = 100;
        CarregaHabilidadesDesbloqueadas(false);
        AtualizaHabilidadesCombate();

        // Cria o ícone do "Dano automático" pela mesma via do jogo.
        // (O jogo pode já ter criado um ao iniciar — limpa antes pra não duplicar.)
        UI.removeSkill();
        UI.spawnSkill();

        const cont = document.getElementById("container-Habilidades");
        const icone = document.getElementById("habilidade1");
        const barra = document.getElementById("BaraQTDHab1Borda");
        const iconeCombate = document.querySelector(".combat-skill:not([hidden]) .combat-skill__icon");
        const meter = document.querySelector(".combat-skill:not([hidden]) .combat-skill__meter");

        check("ícone do dano criado dentro da fileira", icone && cont && icone.parentElement === cont);
        check("ícone do dano é o primeiro item da fileira", icone && cont.firstElementChild === icone);
        check("barra do dano vem logo depois do ícone", icone && icone.nextElementSibling === barra);
        check("painel de combate fecha a fileira", barra && barra.nextElementSibling && barra.nextElementSibling.id === "skill-unlock-panel");

        const rIcon = icone.getBoundingClientRect();
        const rComb = iconeCombate.getBoundingClientRect();
        const rBar = barra.getBoundingClientRect();
        const rMeter = meter.getBoundingClientRect();

        check("ícone do dano tem o mesmo tamanho do ícone de combate",
            rIcon.width === rComb.width && rIcon.height === rComb.height,
            `${rIcon.width}x${rIcon.height} vs ${rComb.width}x${rComb.height}`);
        check("barra do dano tem o mesmo tamanho da barra de combate",
            rBar.width === rMeter.width && rBar.height === rMeter.height,
            `${rBar.width}x${rBar.height} vs ${rMeter.width}x${rMeter.height}`);
        check("ícone do dano alinhado com o ícone de combate",
            Math.round(rIcon.top) === Math.round(rComb.top),
            `${Math.round(rIcon.top)} vs ${Math.round(rComb.top)}`);
        check("barra do dano alinhada com a barra de combate",
            Math.round(rBar.top) === Math.round(rMeter.top),
            `${Math.round(rBar.top)} vs ${Math.round(rMeter.top)}`);
        check("ícone do dano fica à esquerda da própria barra",
            rIcon.right <= rBar.left + 1, `${Math.round(rIcon.right)} <= ${Math.round(rBar.left)}`);

        // Cor da barra por skill: cada uma tem o seu gradiente (puxado do ícone)
        const fundo = sel => {
            const el = document.querySelector(sel);
            return el ? getComputedStyle(el).backgroundImage : null;
        };
        const fundos = [
            fundo("#BaraQTDHab1"),
            fundo("#skill-electric .combat-skill__meter-fill"),
            fundo("#skill-gold .combat-skill__meter-fill"),
            fundo("#skill-escape .combat-skill__meter-fill"),
            fundo("#skill-frenzy .combat-skill__meter-fill")
        ];
        check("cada barra tem cor própria (dano + 4 skills)", new Set(fundos).size === 5,
            fundos.map(s => (s || "-").slice(0, 22)).join(" | "));
        check("barra do dano não é o azul padrão", fundos[0] !== fundos[1], fundos[0]);

        // Barra do dano: começa VAZIA e enche conforme carrega (igual às outras).
        abateshabilidadeDano = 20;
        qtdCarregaHabilidade = 0;
        AtualizaQTDHabildiade1();
        const vazio = parseFloat(document.getElementById("BaraQTDHab1").style.height);
        qtdCarregaHabilidade = 10;
        AtualizaQTDHabildiade1();
        const meio = parseFloat(document.getElementById("BaraQTDHab1").style.height);
        qtdCarregaHabilidade = 20;
        AtualizaQTDHabildiade1();
        const cheio = parseFloat(document.getElementById("BaraQTDHab1").style.height);
        check("barra do dano começa vazia", vazio === 0, vazio);
        check("barra do dano enche conforme carrega", meio === 50 && cheio === 100, `${meio}/${cheio}`);

        // Remove sem deixar lixo.
        UI.removeSkill();
        check("ícone do dano é removido sem sobrar resto", !document.getElementById("habilidade1"));

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
