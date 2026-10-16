# HANDOVER — estado e próximo passo (16/10/2026)

> **A próxima sessão começa por aqui.**
> Método que funciona: **medir → mudar → medir**. Nesta sessão, **dois "ajustes
> que já estavam feitos" não estavam** — e só apareceram porque eu *medi* de novo
> (especificidade de CSS). Regra: mude **um item por vez** e **confira medindo o
> elemento**, não o ranking.

## Estado do repo
- `joao` = `origin/joao` = **`f38c727`** · suíte **84/84** · `auditoria.test.cjs`
  **29/29** · `prepare:web` ok. Tudo desta sessão já **commitado e empurrado**.
- `origin/main` continua em **`b2e8b1a`** (3 commits atrás do `joao`). Não houve
  merge para a `main` ainda.
- Release **v1.8.0** publicada no GitHub (APK 61,71 MB + `TAPeira.Setup.1.8.0.exe`).
- ✅ **O "+16% do portão" deixou de ser pendência**: o jogador decidiu voltar ao
  **+5%** (o valor original). A release não precisa ser regerada por causa disso.

## Feito nesta sessão (16/10, parte 2) — 3 commits
1. **`b7091c7` fix(mobile)** — `css/estilos.css`:
   - **Card do baú dourado**: o tempo VAZAVA para fora da borda em **todos** os
     tamanhos (medido: `scrollWidth 85 > clientWidth 68` em 13 viewports). Bug
     desde o `8ddba7c` (ícone subiu 26→36 num card de 84–92px). Agora empilha
     (ícone em cima, tempo embaixo) e o tempo segue em 14px.
   - **Alvos de toque ≥44×44 no retrato (≤700px) E no landscape de celular
     (701–960 × altura ≤520)**: Fechar dos modais (34px), Voltar andar (39–42px),
     checkboxes 34×18, info do baú (20×20), qualidade/ajustes/importar-save.
   - **Legibilidade**: painel Objetivo/Missão (base 9px → título **6,5px**, aviso
     **7,2px**) e rótulos do HUD "Andar/Manter/Voltar" (10,9px). Pisos em px agora
     valem no retrato **e** no landscape; moedas 9px → 11px.
   - **Botão "Cidade"** só aparece no andar 80+ (ele aparecia desde o andar 1).
2. **`5526ecc` balance**:
   - **Portão de reset: +16% → +5%** (`PORTAO_BONUS = 0.05` fixo, sem branch do F2).
   - **Loja de gold** — dobra o **aumento** do preço por compra (fator = 1+2×(f−1)):
     Chance Crítica **1,5 → 2,0**, Avanço Rápido **2,5 → 4,0**, Qtd Avanço
     **2,5 → 4,0**. O **passo do efeito não muda** (a Crítica segue ×1,1).
     Constantes nomeadas em `loja-variaveis.js`; sem toggle no F2.
   - **Tempo de fuga: base 90 → 30 s.** Com o joelho em 10 abates
     (`FUSAO_ABATES_REF`), sai de ~9s para **~3s por abate exigido**. Resto da
     fórmula igual (CM +2s/nível, Destemido +5s/nível, Relógio ×1,1, Canhão de
     Vidro corta 80%).
3. **`f38c727` test(mobile+balance)** — `tests/regression.test.cjs`: baú, alvos de
   toque por **hit-test** (retrato/landscape), legibilidade, botão Cidade, portão
   +5%, preço da Crítica/Avanço, base do tempo de fuga.

## ⚠️ Pegadinhas que custaram tempo (não repetir)
- **Especificidade de CSS** — a causa mais repetida aqui. Casos reais:
  `#container-AndarManter .andar-label-mobile` (1 id + classe) **vencia** a regra
  de classe do bloco de polimento → o bump para 12px **nunca tinha valido**;
  `#container-HudTopo > #btnPause` (id + filho) e
  `#golden-chest-tracker #golden-chest-info` (2 ids) idem. Como o bloco de
  polimento está **no fim** do `estilos.css`, basta **empatar** a especificidade.
- **`display: flex` vence o `[hidden]`** do navegador. `.screen-nav-button` tem
  `display:flex` → o botão Cidade aparecia com `hidden=true`. Fix: `[hidden] { display: none }`.
- **`input` já usa `::after`** (o knob do checkbox) → o alvo de toque do checkbox
  vem do **`::before` do próprio input** (melhor que o label: funciona nas duas
  orientações, sem depender de onde o label está).
- **Medir a área de toque por HIT-TEST** (`elementFromPoint`), não pela caixa do
  elemento — os alvos crescem por `::before`/`::after` invisível. E amostre em
  **meio-pixel**: um alvo de exatamente 44px mede **43** com passo inteiro.
- **O layout DEITADO (701–960px) escapa do `max-width:700px`.** Nele a base do
  painel Objetivo é **9px** (media query `max-width:900 and max-height:520 and
  orientation:landscape`). Ao mexer em "mobile", cheque as **duas orientações**.
- **`file://` + contexto novo = jogo sem save** (o cenário "jogador novo", onde
  bugs de estado inicial aparecem).

## Na fila (em ordem de risco)
1. **Especialização de volta ao lado do título "Loja de Gold"** ← pedido do
   jogador. `Caverna.html`: `<h2 class="loja-titulo">Loja de Gold</h2>` e
   `#secaoEspecializacao`. Quem tirou de lá: commit da Karin **12/10 13:21**.
   Antes de mexer: `git show <hash> -- Caverna.html` (não adivinhar).
2. **`viewport-fit=cover`** na meta viewport (dos 2 HTML). O CSS já usa
   `env(safe-area-inset-*)` em 20+ pontos, mas sem isso tudo vale **0**.
3. **Legibilidade dos demais painéis** (medido <12px): Status **8,5px**
   ("Decomposição do dano") e 9,9px ("Ver itens da build"); Loja 10px (abas) e
   11,5px (descrição); Ramos 10px; Cidade 10px (nome do prédio); barras de
   progresso das skills 11,7px.
4. **Zoom do iOS**: `.casa-nome__input` (nome do jogador) e `#txtfiletoread` com
   `font-size: 16px` no mobile (hoje `font: inherit` < 16px → a página dá zoom).
5. **`-webkit-tap-highlight-color: transparent`** + migrar os **7 `100vh`**
   restantes para `dvh` onde importa.
6. **Bateria**: pausar o loop quando o app vai para segundo plano
   (`appStateChange` do Capacitor) + auto-baixar qualidade.
7. **Haptics** (`navigator.vibrate` no crítico/abate/marco) e **notificação local
   de retorno** (o único item que traz o jogador de volta).

- **Observação (não é bug novo):** no **landscape** a toupeira (`.player`,
  `top: 34vh`) é desenhada **por cima** da parte de baixo do painel Objetivo. As
  medidas do painel não mudaram (top 90, altura 108) — é pré-existente.

## Instrumento (auditoria de ritmo)
- **O "teto de ~80" era o MEDIDOR**: o bot cortava o andar antes do cronômetro de
  fuga expirar. Corrigido, o recorde chega a **~95-100**.
- **Provado** (efeito muito acima do ruído): preço do CM **50→82** · fundo escalável
  **52→83** · Cidade ÷100 (0 → compras).
- **Não provado** (dentro do ruído de **±5-10**): portão +9 andares, `cmStep` +4,
  renda de CM +2. — e agora o portão **voltou a +5%** de qualquer forma.
- **Para decidir levers, primeiro colapsar o ruído**: falta o **modo determinístico
  de skill/perk** no `test-auditoria-ritmo.js`.
- Comandos:
  `node test-auditoria-ritmo.js resets=N politica=patente|valor|cidade [cmStep=] [cmBase=] [cmReset=] [fusao=fixo] [danoPreco=] [danoTaxa=] [seed=]`
  — a política **realista é `patente`**. Cada run leva **60-170 min**: rodar em
  **background** e acompanhar pelo log ao vivo.
- O stub de `fusao=fixo` foi atualizado para a base **30s**.

## Ainda pendente de sessões anteriores
- **Documentar o item 14** no `REFATORACAO.md` (o platô, as 8 hipóteses refutadas,
  a tabela dos 3 portões e o limite do instrumento) — o `REFATORACAO.md` continua
  com o "ONDE PARAMOS" de 13/10.
- **Backlog D**: item 2 (sprites do build sem otimização) e o `CarregarStatus` →
  `batalha.js`.
- **Release assinado** do Android (hoje só sai debug/unsigned).
- **Flake a observar**: numa rodada do `npm test` deu **1 falha** (`assert.ok`
  booleano com mensagem), mas **não reproduziu em 7+ rodadas** depois. Se voltar,
  **capturar o nome do teste** (o output tinha vindo truncado).
- `tests/auditoria.test.cjs` **não** entra no `npm test` — ele estava 28/29 (o
  teste da névoa esperava `cm = 3`, mas o "CM em dobro" `CM_MULT_BASE = 2` é
  intencional). Alinhado: agora **29/29**.
