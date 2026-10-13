# Estilo Fagulha — especificação

Referência detalhada do estilo de arte **Fagulha**. O resumo está em
`../SKILL.md`; aqui ficam tokens, geometria em proporções relativas, variantes e
armadilhas.

O estilo é **agnóstico de formato**: os números abaixo usam um quadrado de
referência de 512 unidades só porque é o tamanho dos ícones atuais. Em outro
tamanho, **mantenha as proporções** (tudo é relativo ao lado do quadrado).

## 1. Proporções (base 512)

| Parte | Raio (relativo ao lado) | Observação |
| --- | --- | --- |
| Aro externo | `0.492` do lado (252/512) | deixa uma folga fina até a borda |
| Bisel | `0.418` (214/512) | anel intermediário |
| Campo | `0.398` (204/512) | disco escuro |
| Brilho do aro | arco no raio `0.453` (232/512) | canto superior-esquerdo |
| Motivo | cabe num raio de ~`0.31` (160/512) | sem tocar no bisel |
| Faíscas | posições espalhadas até o raio ~`0.39` (200/512) | nunca em anel |

Espessuras: aro `stroke-width 8`, brilho do aro `16`, motivo `~14`,
brilho do motivo `~14`, faísca `4` (base 512).

## 2. Ordem de desenho (z)

```
aro → bisel → campo → brilho-do-aro → motivo → brilho-do-motivo → faíscas
```

As faíscas ficam por cima; o brilho do motivo por cima do motivo.

## 3. Arco do brilho do aro (matemática)

Arco de círculo no raio `r` centrado em `(c, c)`, do ângulo 100° ao 175°
(sentido anti-horário no ecrã), com `stroke-linecap="round"`:

```
M (c + r·cos100) (c − r·sin100)  A r r 0 0 0 (c + r·cos175) (c − r·sin175)
```

Base 512, `c = 256`, `r = 232` → `M 215.7 27.5 A 232 232 0 0 0 24.9 235.7`.

## 4. Enfeite (um só — temático com a habilidade)

O enfeite é **um único tipo** de elemento, e ele **combina com o motivo/skill**
(nada de misturar chama + gema + faísca). Biblioteca (skill `icone-fagulha`):

| Enfeite | Skill típica | Forma |
| --- | --- | --- |
| `faisca` | frenesi | estrela de 4 pontas |
| `mini-raio` | elétrico | raio pequeno |
| `estilhaco` | dano | estilhaço (quadrilátero pontudo) |
| `moeda` | ouro | moedinha **preenchida**: disco + anel interno claro (miniatura da moeda central) |
| `floco` | gelo/fuga | estrela de 6 pontas finas |

Colocado com `transform="translate(x y) scale(s)"`. As 10 posições canônicas
(x y escala), na ordem de "aparecimento" para uma progressão de detalhe:

```
286  92  0.80
168 380  0.85
372 150  0.75
108 236  0.55
238 424  0.70
398 268  0.90
150 130  0.65
350 372  0.60
198 172  0.50
312 316  0.60
```

Regra: **espalhar** (raios e ângulos diferentes, sem dois na mesma altura/lado).
Evite que formem um "colar" regular em volta do motivo.

## 5. Motivo central

O motivo é o símbolo da habilidade. Desenhe-o **dentro** do campo, cabendo num
raio ~160. Recebe o token `motivo` no `fill` e no `stroke`, e um brilho `brilho`
na borda superior-esquerda.

Motivos prontos (skill `icone-fagulha`): `raio`, `estrela`, `escudo`,
`coracao`, `espada`, `moeda`, `floco`.

## 6. Variantes de paleta

| Esquema | aro | bisel | campo | brilhoAro | motivo | brilho | faisca |
| --- | --- | --- | --- | --- | --- | --- | --- |
| fogo | `#ff9d15` | `#ea7609` | `#6f1a04` | `#ffe6ad` | `#ffd400` | `#fffef0` | `#fff05a` |
| gelo | `#2ec4ff` | `#1f86d6` | `#062b4a` | `#d7f2ff` | `#7ef0ff` | `#ffffff` | `#c9f6ff` |
| veneno | `#7ed321` | `#4a9e12` | `#153604` | `#eaffc2` | `#c6ff3d` | `#f7ffe0` | `#d9ff7a` |
| sangue | `#e8283c` | `#b01224` | `#42040a` | `#ffc2c6` | `#ff5a6a` | `#fff0f0` | `#ff9aa4` |
| sombra | `#9b5cff` | `#6f2fd6` | `#22093f` | `#e6d5ff` | `#c9a4ff` | `#ffffff` | `#d9c2ff` |
| dourado | `#ffb300` | `#d98a00` | `#301800` | `#ffe9a8` | `#ffd24a` | `#fffdf0` | `#fff0a0` |

Regra da paleta: `aro` claro/saturado, `bisel` médio, `campo` **escuro**,
`brilho*` quase branco, `motivo`/`faisca` claros e da mesma família do aro.

## 7. Armadilhas

- **Misturar enfeites** (chama + gema + faísca + gota) — ou usar um enfeite que
  **não combina** com a skill (moeda num ícone de gelo). Escolha **um**, temático.
- Enfeite **vazado** com motivo **preenchido** (ou vice-versa): o enfeite deve ter
  o mesmo tratamento do motivo. A moedinha de ouro é um disco preenchido (disco +
  anel interno claro), não um anel.
- Enfeite **alinhado** (mesma altura, ou um anel perfeito). Espalhe.
- Usar `filter`/`gradient`/`pattern` "só um pouquinho" — quebra o flat.
- Contorno escuro/contrastante: o contorno deve ser a própria cor do `fill`.
- Motivo encostando no bisel: mantenha o raio ~160 e deixe respiro.
- Esquecer o brilho de cima-esquerda (o ícone fica chapado e sem luz).
- **Resolver `xlink`**: ao usar `<use xlink:href>`, declare
  `xmlns:xlink="http://www.w3.org/1999/xlink"` no `<svg>`, senão abre como XML
  com erro "prefixo não vinculado a um namespace".

## 8. Ligar no jogo

- O ícone pode ser usado direto como `<img src=".../x.svg">` (o Chromium/Electron
  e o WebView do Android renderizam SVG). Se preferir seguir o padrão dos PNG,
  rasterize com o Playwright (ver skill `icone-fagulha`).
- `scripts/prepare-web.ps1` copia a pasta `imagens/` inteira — o asset novo já
  embarca (não precisa mexer em manifesto).
