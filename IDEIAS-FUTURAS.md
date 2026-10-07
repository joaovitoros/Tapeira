# Ideias futuras

Registro de propostas e evoluções futuras do TAPeira.

> O progresso offline foi implementado com base nos companheiros: considera até 5 horas, concede 25% do dano e do Gold calculados, mantém o andar atual e limita a 2 os baús encontrados. A chance de baú usa avanços virtuais sem alterar o andar real. O menu exibe o tempo acumulado, e o resumo e o recebimento aparecem ao voltar ao jogo. Os limites ficam configuráveis no código.

> A coleção permanente de formigas foi implementada: inimigos a partir do andar 20 têm 1% de chance de deixar uma formiga de uma das cinco cores. Cada conjunto de cinco acumula +5% de dano (vermelhas), +5% de Gold (amarelas), +2% de Gold por baú e +1 ponto percentual de chance de baú extra por baú (marrons), +2 minutos de limite offline (pretas) ou +1 baú offline máximo (cinzas). A coleção pode ser consultada pela tela “Formigas” e permanece após resets.

> O bônus por tempo foi implementado com um baú dourado: a barra carrega em 20 minutos com o jogo visível ou 40 minutos fora dele e acumula no máximo um baú. As recompensas são 50% Gold (5x o Gold de um baú comum), 30% formiga aleatória após desbloquear a coleção e 20% para carregar ao máximo todas as habilidades desbloqueadas. Antes do desbloqueio das formigas, a chance de formiga é sorteada novamente entre Gold e habilidades, mantendo a proporção 50:20.

> O sistema de experiência e melhorias de habilidades foi implementado: cada inimigo concede 1 XP nos andares 1–10, aumentando em 1 XP a cada dez andares; o próximo nível custa 50 XP e aumenta em 25 XP por nível. Cada nível concede um ponto para melhorar quatro habilidades: dano automático (+5 s, máximo 6 níveis), corrente elétrica (25% de dano encadeado inicial, +5% por nível e +2% sem alvo próximo), Gold (+5% por ataque) e pausa da fuga (+2 s). A corrente elétrica também pode ser acionada por ataques da habilidade de dano automático e do companheiro. As três últimas têm máximo de 5 níveis e desbloqueiam nos andares 15, 25 e 35. XP, nível e melhorias reiniciam junto ao reset e são salvos entre sessões.

> O primeiro pacote de polimento foi implementado: ambiente sonoro sintetizado com controle de volume independente, efeitos curtos de impacto e acerto crítico, e transição visual/sonora ao avançar de andar, com destaque especial a cada dez andares e assinatura sonora grave exclusiva para guardiões.

> A ambientação visual da caverna foi aprimorada com névoa baixa e partículas discretas, brilho de tochas animado e paletas de luz que mudam a cada dez andares. Os efeitos respeitam a preferência por movimento reduzido.

> Os inimigos agora recebem variações de cor conforme a região da caverna e um contorno luminoso especial nos andares de guardião, sem alterar atributos ou balanceamento.

> A chegada dos guardiões agora escurece brevemente os arredores, abre um foco de luz no inimigo e prolonga o anúncio visual do andar; o foco acompanha o inimigo principal e respeita movimento reduzido.

> Em telas desktop horizontais de 1000–1500 px por 780–950 px, o painel do baú dourado fica abaixo do HUD à direita para não cobrir a loja.

> A abertura dos baús agora apresenta uma animação de revelação e destaca visualmente a recompensa recebida (Gold, esmeralda, formiga ou recarga de habilidades), respeitando a preferência por movimento reduzido e sem alterar chances ou valores.

> O dano crítico inicia limitado a 4x o dano normal para reduzir o crescimento excessivo. Cada compra de dano crítico aumenta permanentemente o teto em 0,05x; o limite atual é salvo, aplicado ao carregar saves existentes e respeitado após melhorias/conquistas.

## Bônus por tempo (implementado)

- O progresso e o baú dourado pendente são salvos entre sessões.
- O baú pode ser aberto na interface quando a barra completa.

## Tiers da auditoria (50 princípios)

> A auditoria contra os 50 princípios de design organizou o trabalho em Tiers. O Tier 0 (5 bugs: intervalo da missão Tempo, armadilha "Manter no andar", Avanço Gold apagado no reset, contadores de missão e no-ops do Resetar) foi corrigido no commit `221e0a2`.

### Tier 1 — Quick wins (UI/legibilidade) — ✅ concluído

| # | Ideia | Status |
|---|---|---|
| 1 | Botão "Voltar andar" com estado pronto (destaque/pulsação quando andar ≥ andarVolta) + contador "faltam X andares para o reset" | ✅ `bef281b` (#avisoReset) |
| 2 | Modal de confirmação do reset: o que ganha (+X esmeraldas, base de gold +25%, próxima porta andar Y) e o que perde | ✅ `22ff474` |
| 3 | Pós-reset: celebração (banner animado em vez de linha de texto) | ✅ `22ff474` |
| 4 | Status: decomposição do dano (base × formigas × nível × crítico...) | ✅ `22ff474` |
| 5 | Loja: preview "após upgrade: dano 5 → 6" nos 14 itens de compra | ✅ `22ff474` |

### Tier 2 — Design (esforço médio) — 🟡 em andamento (3/5 ✅)

| # | Ideia | Princípios |
|---|---|---|
| 1 ✅ | Marcos/breakpoints por andar: recompensa a cada 10 andares (ex: +25% gold no andar 20/30...) | 13/14 |
| 2 | Eventos aleatórios (comércio, meteoro) — bônus por presença | 33/34 |
| 3 ✅ | Novos desbloqueios pós-35: hoje o conteúdo acaba após a skill do andar 35 (novo item de loja, nova skill, novo tema...) | — |
| 4 ✅ | Missões com desafio (não só estatística) / conquistas comportamentais | 43 |
| 5 | Bônus de retorno ao voltar (recompensar quem volta ao jogo) | 35 |

**#1 (feito):** +10% de gold por marco, a cada 10 andares, por run — botão "Marcos" no painel de skills e `marcoGoldRun` persistido no save.

**#4 (feito):** missão tipo 5 no sorteio (~20%) com restrição — "sem gold" (qualquer compra com gold falha), "sem habilidades" (só ativação real falha) e "contra o tempo" (60s por inimigo exigido). Falha = troca de missão sem recompensa; sucesso ≈ 5 baús (`BonusGoldAvanco ×5`) e o alvo dobra. Conquistas comportamentais ficaram de fora (passo seguinte).

**#3 (feito):** sistema de reset pós-35 — os portões 15/25/35 continuam de 10 em 10; a partir do 35 sobem **+5** (40, 45, 50...). Cada portão ≥ 35 carrega **+5% de dano permanente pago UMA única vez** (`gateDanoPago`/`danoResetQtd` no save; portões pagos nunca pagam de novo). Portões terminados em 5 (45, 55...) mantêm as esmeraldas de sempre; os intermediários (40, 50...) dão só dano. Reset num portão maior paga o acumulado do que faltou (pular o 40 e resetar no 45 = +10%). Modal, aviso, celebração e Decomposição do dano mostram o bônus; `ValidarSave` rejeita save com portão incoerente (anti-trapaça). 4ª skill ficou pra depois.
