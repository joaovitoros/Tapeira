# Ideias futuras

Registro de propostas e evoluções futuras do TAPeira.

> O progresso offline foi implementado com base nos companheiros: considera até 5 horas, concede 25% do dano e do Gold calculados, mantém o andar atual e limita a 2 os baús encontrados. A chance de baú usa avanços virtuais sem alterar o andar real. O menu exibe o tempo acumulado, e o resumo e o recebimento aparecem ao voltar ao jogo. Os limites ficam configuráveis no código.

> A coleção permanente de formigas foi implementada: inimigos a partir do andar 20 têm 1% de chance de deixar uma formiga de uma das cinco cores. Cada conjunto de cinco acumula +5% de dano (vermelhas), +5% de Gold (amarelas), +2% de Gold por baú e +1 ponto percentual de chance de baú extra por baú (marrons), +2 minutos de limite offline (pretas) ou +1 baú offline máximo (cinzas). A coleção pode ser consultada pela tela “Formigas” e permanece após resets.

> O bônus por tempo foi implementado com um baú dourado: a barra carrega em 20 minutos com o jogo visível ou 40 minutos fora dele e acumula no máximo um baú. As recompensas são 50% Gold (5x o Gold de um baú comum), 30% formiga aleatória após desbloquear a coleção e 20% para carregar ao máximo todas as habilidades desbloqueadas. Antes do desbloqueio das formigas, a chance de formiga é sorteada novamente entre Gold e habilidades, mantendo a proporção 50:20.

> Os eventos aleatórios do Tier 2 foram implementados com 7 tipos: **Comércio** (2 ofertas por 45s — esmeralda, baú, recarga de habilidades e Conhecimento Mug, preço em gold que escala com o andar), **Chuva de meteoros** (30s: hit grátis do jogador em cada inimigo vivo + fragmentos clicáveis no chão com gold e chance de esmeralda, que somem sozinhos em 5s), **Névoa do Conhecimento** (45s, andar 20+: cada abate concede na hora o CM que valeria no reset, dobrando o valor dos abates; o item "CM em dobro" vale aqui também), **Veia de esmeralda** (60s, andar 20+: 10% de chance de esmeralda por abate, com contador no painel), **Inseto fugaz** (5,5s: a criatura cruza a tela em ~4s e clicar nela dá um prêmio pequeno de gold garantido), **Fissura temporal** (30s: congela o cronômetro de fuga) e **Emboscada** (45s: a onda viva ganha +50% de vida — limpá-la sem trocar de andar devolve o ouro da onda em dobro e tem 40% de chance de baú; fugir ou estourar o tempo não dá nada). O sorteio rola 15% ao subir de andar com 3 minutos de intervalo mínimo, só no jogo ao vivo (nunca no progresso offline), pausa junto com o jogo e encerra no fim do tempo, no ✕ ou no ESC. O estado é transitório por run: nenhum campo novo no save.

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

### Tier 2 — Design (esforço médio) — 🟢 concluído (5/5 ✅)

| # | Ideia | Princípios |
|---|---|---|
| 1 ✅ | Marcos/breakpoints por andar: recompensa a cada 10 andares (ex: +25% gold no andar 20/30...) | 13/14 |
| 2 ✅ | Eventos aleatórios (7 tipos: comércio, meteoro, névoa, veia, inseto, fissura, emboscada) — bônus por presença | 33/34 |
| 3 ✅ | Novos desbloqueios pós-35: hoje o conteúdo acaba após a skill do andar 35 (novo item de loja, nova skill, novo tema...) | — |
| 4 ✅ | Missões com desafio (não só estatística) / conquistas comportamentais | 43 |
| 5 ✅ | Bônus de retorno ao voltar (recompensar quem volta ao jogo) | 35 |

**#1 (feito):** +10% de gold por marco, a cada 10 andares, por run — botão "Marcos" no painel de skills e `marcoGoldRun` persistido no save. A tela **Marcos** lista hoje todos os marcos do jogo: ouro da run, portões de reset (recompensa, dano pendente/pago, perks), marcos de 50 níveis (+1 no multiplicador de CM, permanente), marcos de 100 níveis acumulados (−1 inimigo) e desbloqueios por andar (15/25/35).

**#4 (feito):** missão tipo 5 no sorteio (~20%) com restrição — "sem gold" (qualquer compra com gold falha), "sem habilidades" (só ativação real falha) e "contra o tempo" (60s por inimigo exigido). Falha = troca de missão sem recompensa; sucesso ≈ 5 baús (`BonusGoldAvanco ×5`) e o alvo dobra. Conquistas comportamentais ficaram de fora (passo seguinte).

**#3 (feito):** sistema de reset pós-35 — os portões 15/25/35 continuam de 10 em 10; a partir do 35 sobem **+5** (40, 45, 50...). Cada portão ≥ 35 carrega **+5% de dano permanente pago UMA única vez** (`gateDanoPago`/`danoResetQtd` no save; portões pagos nunca pagam de novo). Portões terminados em 5 (45, 55...) mantêm as esmeraldas de sempre; os intermediários (40, 50...) dão só dano. Reset num portão maior paga o acumulado do que faltou (pular o 40 e resetar no 45 = +10%). Modal, aviso, celebração e Decomposição do dano mostram o bônus; `ValidarSave` rejeita save com portão incoerente (anti-trapaça). 4ª skill ficou pra depois.

**#2 (feito):** 3 primeiros eventos em `script/eventos.js` — **Comércio** (45s, 2 ofertas sorteadas de um pool de 4: esmeralda, baú, recarga de habilidades e +15 CM; preço em gold = k × gold do andar, não rola no desafio "sem gold"), **Chuva de meteoros** (30s: hit do jogador em cada inimigo vivo a cada 5s + fragmentos clicáveis por 5s com gold e 25% de chance de esmeralda) e **Névoa do Conhecimento** (45s no andar ≥ 20: +1 CM por abate na hora — o abate continua contando em `derrotadosRun`, então vale o dobro no total; o item "CM em dobro" também vale). Sorteio de 15% ao subir de andar (era 12%; subiu "um pouco" no teste), cooldown de 3 min, início adiado 1,6s pra depois da transição, contador pausa com o jogo, encerra sozinho no fim/✕/ESC e não sobrevive a reset ou load. Estado transitório: nenhum campo novo no save.

**#2 — extensão (feita):** os outros 4 eventos do bloco anterior, todos em `script/eventos.js` — **Veia de esmeralda** (60s, andar ≥ 20: `EventoAbateVeia` no loop de kills, 10% de chance por crédito de abate, contador de esmeraldas no painel), **Inseto fugaz** (5,5s: `imagens/inimigo.png` cruza a tela uma vez em ~4s pela animação CSS `evento-inseto-cruza`; clique ou Enter dá o mesmo gold de um fragmento e encerra o evento; com movimento reduzido ele aparece parado na borda direita; na pausa a animação congela junto via `PausaInseto`), **Fissura temporal** (30s: guard `eventoAtivo === "fissura"` em `AvancoInimigos` e `TempoCompanheiros` — só o cronômetro de fuga congela; a pausa da skill de escape e os demais ticks seguem normais) e **Emboscada** (45s: `PreparaEmboscada` faz snapshot da onda viva e dá +50% de vida nela; `EventoAbateEmboscada` acumula o ouro de cada kill e vai removendo os alvos — limpar todos sem trocar de andar chama `VenceuEmboscada`, que devolve esse ouro (totalizando em dobro) + 40% de chance de baú; fuga ou quota que muda o andar sem limpar = perdeu, e o fim do tempo avisa. Não mexe no timer nem na cota: só interage com eles). Os 4 são forçáveis pelo dev-tools (agora 7 botões de evento).

**#5 (feito):** bônus de retorno por tempo fora — quem volta depois de **≥2h** ganha um presente junto com as recompensas offline: **+25% no gold offline a cada 4h** (teto **+150%** aos 12h) e **1 esmeralda a cada 4h** (teto **6** em 24h). Usa o mesmo relógio do progresso offline (`offlineLastSavedAt`, atualizado a cada autosave — recarregar a página zera a janela, então não dá pra farmar) e nasce/morre em `recompensasOfflinePendentes` (**nenhum campo novo no save**). Aparece como linha verde "Bônus de retorno (Xh longe)" no modal de *Ganhos durante sua ausência*, entra nos popups de gold/esmeraldas e tem toast próprio; `ValidarRecompensasOffline` rejeita bônus fora da faixa (horas 2–24, esmeraldas 0–6, ouro ≥0, não-vazio). Como a validação do load roda no `ValidarRecompensasOffline`, o caminho é: ouro multiplicado pelo `MultiplicadorGoldConhecimento()` no recebimento (mesma regra do gold normal).

### Tier 3 — Grandes (esforço alto) — ⏳ em andamento (1/3)

| # | Ideia | Princípios |
|---|---|---|
| 1 | Builds/escolhas reais na loja (trade-offs e sinergias — acabar com "compre o mais barato" como única estratégia) | 26/27/38 |
| 2 ✅ | Automação como recompensa: auto-coleta de baús e auto-compra desbloqueáveis como marco tardio | 9 |
| 3 | Árvore de skills com ramos (escolhas entre caminhos em vez de linha fixa) | 16/20 |

**Ordem escolhida:** começar pelo **#2** (escopo mais fechado, resultado visível rápido), depois **#1** e por último **#3** (o maior: save + UI + balanceamento de longo prazo).

**#2 (feito):** desbloqueio por piso permanente pelo `maxAndar` (mesmo esquema das skills, listado na tela **Marcos**): **auto-coleta no andar 40** e **auto-compra no andar 50**. A auto-coleta abre o baú dourado no instante em que fica pronto e recolhe os baús normais do chão (mesmo popup/som de sempre); a auto-compra compra **o item mais barato da loja de gold** por tick de 1s (1 por tick — esmeralda e Conhecimento Mug ficam de fora, são escolhas estratégicas; as travas de nível máximo espelham o `AtualizaMaximosLoja`). Cada automação tem seu **toggle** (linha no rastreador do baú dourado + cabeçalho da loja), **nascem ligadas** ao desbloquear e o estado 0/1 vai para o save (`autoColeta`/`autoCompra`, validados no `ValidarSave`; ausentes em saves antigos = ligadas — quem já passou dos pisos ganha na hora). Guardas: roda só com o jogo **despausado** (inclusive atrás do modal de recompensas offline), fica parada no desafio **"sem gold"** (mesma condição do `PagaLoja`, senão a compra automática falharia a missão) e silencia o aviso "não tem gold" da rodada (técnica do hold-to-buy, com save/restauração do `MostraInfo`). Validado no navegador: travas e títulos, linhas da tela Marcos (pendente/✓), toast de desbloqueio no kill real que cruza o piso 40, tick **orgânico** de 1s, coleta dourado+normal, "mais barato +1 por tick", guarda do desafio (0 falhas), pausa, toggles off, tamper de save (2/"x"/-1/1,5 rejeitados), roundtrip de load, interplay com hold-to-buy, clique real no toggle, **5 presets responsivos (1920/1366/768/640/375) sem overflow** e console 0/0.
