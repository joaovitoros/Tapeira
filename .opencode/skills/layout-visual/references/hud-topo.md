# Topo do HUD (`#container-HudTopo`)

Layout atual (v4): o topo é uma **grade de 2 linhas**, com a fuga dentro dele.

```
[ Andar/Manter ] [ Pausar ] [ Gold / Esmeraldas / Conhecimento ]
[ Fuga         ] [        ] [                                   ]
```

## Estrutura (HTML, `Caverna.html`)

`#container-HudTopo` contém, nesta ordem:

1. `#container-AndarManter` — Andar / Manter / Voltar
2. `#container-Fugir` — pílula "Tempo para fugir" + `#contTempo`
3. `#btnPause` — Pausar
4. `#container-GoldEsmeraldas` — as 3 fileiras de moeda (gold, esmeraldas, conhecimento)

A fuga **mora dentro do topo** (não é mais uma barra absoluta centralizada).

## CSS

- `#container-HudTopo`: `display: grid; grid-template-columns: auto minmax(0,1fr) auto;
  grid-template-rows: auto auto; align-items: start; justify-items: start`.
  No celular (≤700px) a 1ª coluna vira `minmax(0, 1fr)` (o Andar/Manter ocupa a sobra).
- Andar/Manter → coluna 1, linha 1; **Fuga → coluna 1, linha 2**;
  Gold/Esmeraldas → coluna 3, `grid-row: 1 / span 2`; Pausar → coluna 2.
- No **desktop** o Pausar é `position: absolute` (centralizado na tela, como antes)
  e fica fora da grade — a regra da grade só vale no celular.

## Invariantes (cobertos pelo teste `HUD: a fuga fica dentro do topo…`)

1. `#container-Fugir` é **filho** de `#container-HudTopo`.
2. A fuga fica **abaixo** do Andar/Manter e **alinhada à esquerda** com ele.
3. Andar/Manter, Pausar e Gold/Esmeraldas com o **mesmo `top`** (alinhados pelo topo).
4. O topo (com a fuga) **não invade** o Objetivo/Missão (`#container-Metas`).
5. O ícone de Conhecimento é **maior** que o do Gold (`#container-Conhecimento .moeda-icone { height: 1.45em }`).

## Padrão de override deste arquivo

`css/estilos.css` tem blocos "HUD v3"/"HUD v4" **no fim do arquivo**, de
propósito: eles vencem as dezenas de media queries antigas do assunto **por
ordem de origem** (mesma especificidade). Mexeu no topo? Coloque a regra nova no
FIM, não no meio — ou ela perde para as antigas.

## Armadilhas (todas já morderam)

- **Altura do painel vem do "stretch" do pai.** As fileiras de moeda usavam
  `flex: 1 1 0` (base 0), então o painel não crescia com o conteúdo: uma fileira
  nova **espremia** as outras (texto estourando a fileira). Hoje é `flex: 1 1 auto`
  e o painel cresce por conteúdo.
- **Elemento que sai do absoluto para o fluxo** precisa de reset explícito:
  `position: static; top/left/right/bottom: auto; transform: none; margin: 0`.
  Sem isso a fuga continuava centralizada/absoluta dentro do topo.
- **1px de sobra não é sobra.** Com a fuga na grade, os 4 maiores tamanhos de
  tela batiam 1px no Objetivo/Missão. A correção foi `padding-block: 2px` na
  fuga (mantém o `gap` confortável e não mexe no padding horizontal de cada
  breakpoint).
- **`align-self: stretch` estica o item na área da grade**: o Pausar virava um
  botão gigante ocupando as 2 linhas. Use `align-self: start` (e `bottom: auto`
  no caso absoluto do desktop) para ele ficar alinhado pelo topo com a altura
  própria.
- **`padding-block`** é seguro aqui (WebView/Chromium modernos; o projeto já usa
  `dvh`/`env()`), e evita repetir o padding horizontal de cada breakpoint.

## Como verificar

Meça as caixas dos 4 filhos + o `#container-Metas` e confira os invariantes numa
varredura de tamanhos (19 viewports, dos 2560×1440 aos 320×568), e **olhe** os
PNGs do topo no desktop e no celular. O roteiro de cópia Windows/Playwright está
no `SKILL.md` desta skill.
