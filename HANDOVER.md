# HANDOVER — estado e próximo passo (16/10/2026)

> Escrito no fim de uma sessão longa. **A próxima sessão começa por aqui.**
> Método que funcionou: **medir → mudar → medir**, e nunca commitar sem a
> verificação passar. Nesta sessão, **três erros meus só apareceram porque o
> jogador olhou a tela** — então: mude **um item por vez** e peça o olho humano.

## Estado do repo
- `joao` = `main` = `origin` = **`6ab9f37`** · suíte **79/79** · `prepare:web` ok.
- Release **v1.8.0** publicada no GitHub (APK 61,71 MB + `TAPeira.Setup.1.8.0.exe`).
- ⚠️ **A release NÃO tem o portão +16%** (commits de 15/10, posteriores ao build de
  14/10 15:51). Decisão pendente: manter +16% / voltar pro +10% / reverter pro +5% —
  e, se mantiver, **regerar APK+exe** e republicar (ou subir 1.8.1, mais honesto
  para quem já baixou a 1.8.0).

## Feito nesta sessão (16/10)
1. **`a087384` fix(aparencia)** — o jogador **novo** nunca via a toupeira clássica
   (capacete + picareta). O HTML da arena nasce com a base nova visível e a clássica
   escondida, e quem ligava o interruptor era **só o load do save**
   (`AplicaChapeuJogador`, chamado pelo `persistencia-carregar`). Num jogo novo
   (save apagado) o load não roda → ficava a arte nova nos primeiros 80 andares.
   Agora `AparenciaAplica()` roda no start, com ou sem save (guard de `readyState`).
   Verificado com Playwright: sem save = clássica; `maxAndar=100` = base.
   Removido também o `player-antigo.png` órfão (930 KB).
2. **`68cfc69` + `8fdddec` fix(mobile)** — polimento de toque e legibilidade medido
   em **390×844**, escopado em `@media (max-width: 700px)` (o desktop não muda).
   Alvos ≥44 px (dois botões tinham **20 px de altura**) e textos legíveis (o rótulo
   da fuga estava em **8 px**).
3. **`6ab9f37` fix(mobile)** — o card do baú dourado quebrava porque o ícone de info
   foi **aumentado de verdade**. Técnica certa: **alvo grande sem mexer no visual**,
   com um `::after` invisível (`inset: -12px`).

## ⚠️ Pegadinhas que custaram tempo (não repetir)
- **Especificidade de CSS**: `#container-HudTopo > #btnPause` e
  `#golden-chest-tracker #golden-chest-info` **vencem** seletor de um id só. O bloco
  de polimento está no **fim** do `estilos.css` → basta **empatar** a especificidade.
- **Medir o ELEMENTO, não o ranking**: no ranking um item corrigido *sai da lista* e
  você pode passar batido. Foi assim que eu "corrigi" duas vezes sem corrigir.
- **`input` não aceita `::after`** — para checkbox, a área de toque tem que vir do
  **label**.
- Rodar Playwright com `file://` + contexto novo = **jogo sem save** (é o cenário
  exato de "jogador novo", que é onde os bugs de estado inicial aparecem).

## Na fila (em ordem de risco)
1. **Especialização de volta ao lado do título "Loja de Gold"** ← pedido do jogador.
   `Caverna.html:494` = `<h2 class="loja-titulo">Loja de Gold</h2>`;
   `Caverna.html:672` = `<div id="secaoEspecializacao" class="especializacao">`.
   Quem tirou de lá: commit da Karin **12/10 13:21 "feat: interface da loja melhorada"**.
   Antes de mexer: `git show <hash> -- Caverna.html` para ver o markup **original**
   (não adivinhar). Depois ajustar o CSS para o título e a seção dividirem a linha.
2. `viewport-fit=cover` + `env(safe-area-inset-*)` (notch / barra de gestos).
3. **360 px de verdade** no `test-loja-layout` (hoje para em 800×600).
4. Checkboxes 34×18 + `golden-chest-claim` 70×37 / `txtfiletoread` 280×18 /
   `qualidade-btn` 89×31 (usar a técnica do label).
5. Bateria: pausar o loop no background (`appStateChange` do Capacitor) + auto-qualidade.
6. Haptics (`navigator.vibrate` no crítico/abate/marco).
7. Notificação local de retorno (plugin do Capacitor) — o único item que **traz o
   jogador de volta**.

## Auditoria de ritmo (item 14) — o que ficou provado
- **O "teto de ~80" era o MEDIDOR**: o bot cortava o andar antes do cronômetro de
  fuga expirar. Corrigido, o recorde chega a **~95-100**.
- **Provado** (efeito muito acima do ruído): preço do CM **50→82** · fundo escalável
  **52→83** · Cidade ÷100 (0 → compras).
- **Não provado** (dentro do ruído de **±5-10** do bot, que gasta skill/perk
  aleatoriamente): portão +9, `cmStep` +4, renda de CM +2.
- **Para decidir levers, primeiro colapsar o ruído**: adicionar um modo
  determinístico de skill/perk no `test-auditoria-ritmo.js`.
- Comandos:
  `node test-auditoria-ritmo.js resets=N politica=patente|valor|cidade [cmStep=] [cmBase=] [cmReset=] [fusao=fixo] [danoPreco=] [danoTaxa=] [seed=]`
  — a política **realista é `patente`** (compra o ingresso ★ no teto). Cada run leva
  **60-170 min**: rodar em **background** e acompanhar pelo log ao vivo.

## Ainda pendente de sessões anteriores
- **Documentar o item 14** no `REFATORACAO.md` (o platô, as 8 hipóteses refutadas, a
  tabela dos 3 portões e o limite do instrumento) — este HANDOVER cobre o essencial,
  mas o `REFATORACAO.md` continua com o "ONDE PARAMOS" de 13/10.
- **Backlog D**: item 2 (sprites do build sem otimização) e o `CarregarStatus` →
  `batalha.js`.
- **Release assinado** do Android (hoje só sai debug/unsigned).
