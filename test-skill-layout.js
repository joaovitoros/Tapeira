// Teste focado: fileira de habilidades (#container-Habilidades) no novo
// desenho (item 1) — a carga é mostrada SOBRE o ícone (sem barra vertical ao
// lado), o ícone nunca some e cada estado (carregando/pronta/ativa) é distinto.
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
        window.TocaSomSintetico = () => {};
        UI.showInfo = () => {};

        // Desbloqueia as skills de combate pra ter ícone/barra de referência.
        maxAndar = 100;
        CarregaHabilidadesDesbloqueadas(false);
        AtualizaHabilidadesCombate();

        const cont = document.getElementById("container-Habilidades");
        const dano = document.getElementById("habilidade-dano");
        const danoFrame = dano.querySelector(".combate-habilidade__moldura");
        const danoIcone = dano.querySelector(".combate-habilidade__icone");
        const danoMeter = document.getElementById("habilidade-dano-medidor");
        const combate = document.querySelector(".combate-habilidade:not(#habilidade-dano):not([hidden])");
        const combateFrame = combate.querySelector(".combate-habilidade__moldura");
        const combateIcone = combate.querySelector(".combate-habilidade__icone");

        check("botão do dano existe (#habilidade-dano)", !!dano);
        check("botão do dano é o primeiro item da fileira", cont.firstElementChild === dano);
        check("painel de combate vem depois do dano", dano.nextElementSibling && dano.nextElementSibling.id === "painel-habilidades");

        const rIcon = danoFrame.getBoundingClientRect();
        const rComb = combateFrame.getBoundingClientRect();
        check("frame do dano tem o mesmo tamanho do frame de combate",
            rIcon.width === rComb.width && rIcon.height === rComb.height,
            `${rIcon.width}x${rIcon.height} vs ${rComb.width}x${rComb.height}`);

        // O ícone fica SEMPRE visível (mesmo carregando) e a barra de progresso
        // cobre exatamente o mesmo retângulo do ícone.
        qtdCarregaHabilidade = 0;
        AtualizaHabilidadesCombate();
        const rIcone = danoIcone.getBoundingClientRect();
        const rMeter = danoMeter.parentElement.getBoundingClientRect();
        check("ícone do dano não é escondido enquanto carrega",
            getComputedStyle(danoIcone).display !== "none" && rIcone.width > 0);
        check("progresso do dano cobre o ícone (mesmo retângulo)",
            Math.abs(rMeter.width - rIcone.width) <= 1 && Math.abs(rMeter.height - rIcone.height) <= 1,
            `icon ${Math.round(rIcone.width)}x${Math.round(rIcone.height)} / meter ${Math.round(rMeter.width)}x${Math.round(rMeter.height)}`);

        // Estado "carregando": escurecido, sem glifo de "pronta".
        const alturaCarregando = parseFloat(danoMeter.style.height);
        check("classe is-carregando durante a carga", dano.classList.contains("is-carregando"));
        check("ícone escurecido durante a carga",
            /brightness\(0?\.4/.test(getComputedStyle(danoIcone).filter), getComputedStyle(danoIcone).filter);
        check("barra vazia no início da carga", alturaCarregando === 0, alturaCarregando);

        // 50% de carga -> 50% de preenchimento
        qtdCarregaHabilidade = abateshabilidadeDano / 2;
        AtualizaHabilidadesCombate();
        const meio = parseFloat(danoMeter.style.height);
        check("barra do dano enche com a carga (50%)", meio === 50, meio);

        // Carregada -> "pronta" com brilho
        qtdCarregaHabilidade = abateshabilidadeDano;
        AtualizaHabilidadesCombate();
        check("classe is-pronta quando carregada", dano.classList.contains("is-pronta"));
        check("barra cheia quando carregada", parseFloat(danoMeter.style.height) === 100);
        check("brilho (drop-shadow) quando pronta",
            /drop-shadow/.test(getComputedStyle(danoIcone).filter), getComputedStyle(danoIcone).filter);

        // Ativação: vira is-ativa, escurecido, e não some
        UsaHabilidadeDano();
        check("após ativar, classe is-ativa (não desaparece)", dano.classList.contains("is-ativa") && !!danoIcone);
        check("após ativar, dano ativo escurecido",
            /brightness\(0?\.4/.test(getComputedStyle(danoIcone).filter), getComputedStyle(danoIcone).filter);
        verificaHabilidadeDano = false;
        tempoHabilidadeDano = 30;

        // Skill de combate: mesmos 3 estados
        const kills = abatesCorrenteEletrica;
        abatesCorrenteEletrica = 0;
        ataquesCorrenteEletrica = 0;
        AtualizaHabilidadesCombate();
        check("skill de combate carregando: is-carregando", document.getElementById("habilidade-eletrica").classList.contains("is-carregando"));
        const corIconeCombate = getComputedStyle(combateIcone).filter;
        abatesCorrenteEletrica = habilidadesCombate.find(s => s.id === "electric").killsRequired;
        AtualizaHabilidadesCombate();
        const elCombate = document.getElementById("habilidade-eletrica");
        check("skill de combate pronta: is-pronta", elCombate.classList.contains("is-pronta"));
        check("ícone de combate não é o mesmo (ganhou brilho)",
            getComputedStyle(combateIcone).filter !== corIconeCombate,
            corIconeCombate + " -> " + getComputedStyle(combateIcone).filter);
        abatesCorrenteEletrica = kills;

        // Cor própria por skill (o overlay mantém o gradiente de cada uma) —
        // zera o estado pra todas ficarem em "carregando" (mesma regra de fundo)
        qtdCarregaHabilidade = 0;
        abatesCorrenteEletrica = 0;
        abatesBonusGoldAtaque = 0;
        abatesPausaFuga = 0;
        abatesFrenesi = 0;
        ataquesCorrenteEletrica = 0;
        ataquesBonusGold = 0;
        segundosPausaFuga = 0;
        ataquesFrenesi = 0;
        AtualizaHabilidadesCombate();
        const fundo = sel => {
            const el = document.querySelector(sel);
            return el ? getComputedStyle(el).backgroundImage : null;
        };
        const fundos = [
            fundo("#habilidade-dano-medidor"),
            fundo("#habilidade-eletrica .combate-habilidade__medidor-preenchido"),
            fundo("#habilidade-ouro .combate-habilidade__medidor-preenchido"),
            fundo("#habilidade-fuga .combate-habilidade__medidor-preenchido"),
            fundo("#habilidade-frenesi .combate-habilidade__medidor-preenchido")
        ];
        check("cada skill tem cor própria (dano + 4 skills)", new Set(fundos).size === 5,
            fundos.map(s => (s || "-").slice(0, 22)).join(" | "));

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
