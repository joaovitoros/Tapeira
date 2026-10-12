# Design dos ícones (moeda e gema)

Especificação extraída dos originais `imagens/gold.png` e `imagens/gem.png` por
medição (não por olhômetro). Serve de contrato para gerar ícones novos.

## Como o jogo usa

```html
<img class="moeda-icone" src="imagens/gold.png" alt="Gold:" />
<img class="moeda-icone" src="imagens/gem.png" alt="Esmeraldas:" />
```

```css
.moeda-icone { height: 1em; width: auto; flex-shrink: 0; display: block; }
```

Consequências para a arte:

- O ícone é exibido com **`height: 1em`** — na prática **~11 a 20px** conforme
  o `font-size` do pai. Desenhe para ler bem pequeno: formas cheias, 3 tons com
  bom contraste, nenhum detalhe fino.
- A largura é automática: o **aspecto** importa (moeda 1:1, gema ~1:1.5).
- Fundo **transparente** sempre.

## Especificação dos originais (medida)

| | `gold.png` (moeda) | `gem.png` (gema) |
| --- | --- | --- |
| Canvas | 512×512 | 512×512 |
| Fundo | transparente (65% dos pixels) | transparente (48%) |
| Conteúdo | 342×342px (67% × 67%), centralizado | 324×495px (63% × 97%), x 94..417, y 8..502 |
| Claro | `#F6D555` (19,8%) | `#69E6C3` (24,1%) |
| Médio | `#EFB217` (7,3%) | `#5ACCA6` (13,0%) |
| Escuro | `#D79511` (6,6%) | `#4AB591` (13,1%) |
| Brilho | `#FFFFFF` (0,4%) | `#B3FFE7` (1,0%) |

### Regras do estilo

1. **Flat**: sem gradiente, sem contorno/contorno escuro, sem sombra, sem
   textura. Só manchas de cor chapada.
2. **3 tons de uma mesma matiz** (claro / médio / escuro) + **1 brilho** pálido.
   Nunca mais de 4 cores.
3. A luz vem de **cima-esquerda**: a face/banda superior-esquerda recebe o tom
   claro, a inferior-direita o mais escuro.
4. O brilho é **pálido** (branco ou quase) e pequeno: uma estrela de 4 pontas
   (moeda) ou dois riscos arredondados (gema).

### Geometria da moeda (canvas 512, centro 256)

- Disco externo **r=171** (tom médio).
- **Cunha clara** no semicírculo superior-esquerdo: meia-plano `x + y <= 512`,
  recortado pelo disco (divisória na diagonal de 45° que passa pelo centro).
- **Anel escuro** entre **r=111 e r=134**.
- **Núcleo claro** r=111.
- **Brilho**: estrela de 4 pontas centrada em ~(352,148), pontas em
  N/E/S/W (raio externo ~36, interno ~11).

### Geometria da gema (canvas 512)

- Silhueta: hexágono vertical com cantos arredondados —
  (255,14) → (412,104) → (412,408) → (255,500) → (96,408) → (96,104).
- Corpo em 3 faixas verticais: esquerda **média** (x 96..152), frontal
  **clara** (x 152..356), direita **escura** (x 356..412).
- Face frontal com **chevron** em cima (ápice em (255,69)) e embaixo (ápice em
  (255,441)).
- Faceta do tampo **escura** à esquerda; a direita fica média (é a própria
  silhueta).
- Face direita escura desce até a ponta inferior (255,500).
- Brilho: dois riscos arredondados (~14px de espessura) no alto da face frontal.

## Os três caminhos de geração

| Quero | Caminho | Script |
| --- | --- | --- |
| **Mesma arte, outra cor** (prata, rubi, safira...) | recolorir | `scripts/recolorir-icone.ps1` |
| **Forma nova no mesmo estilo** | template SVG + rasterizar | `templates/*.svg` + `scripts/gerar-icone.cjs` |
| **Conferir** o resultado | medir e olhar | `scripts/medir-icone.ps1` |

O recolor é o caminho **mais seguro** para "mesmo design": reaproveita 100% da
arte (formas, antialias, transparência) e troca só a paleta.

### Templates prontos

| Template | O que é |
| --- | --- |
| `templates/moeda.svg` | moeda (círculos + cunha clara + estrela) |
| `templates/gema.svg` | gema isométrica (hexágono + 3 faces + 2 riscos) |
| `templates/conhecimento.svg` | Conhecimento Mug: cérebro com chevron de subida (sem `!`), dentro de um badge escuro |

Além dos 4 tokens de paleta, um template pode ter tokens extras (badge/fundo),
passados por `--token NOME=HEX`. O `conhecimento.svg` usa `__FUNDO__`,
`__BORDA__` e `__TINTA__` (a cor do `!`). `--token FUNDO=none --token
BORDA=none` gera a versão **sem badge** (glifo solto, transparente) a partir do
mesmo template. Token sem valor é erro — o script falha em vez de sair um SVG
quebrado.

### Paletas prontas

`paletas.json` (na raiz da skill) é a fonte única, lida pelos dois scripts:
`ouro, prata, bronze, cobre, esmeralda, rubi, rosa, safira, ametista, obsidiana,
sangue, osso, veneno`. Cada uma tem 3 tons (claro, médio, escuro).

## Armadilhas (todas já morderam)

- **O brilho também precisa mudar de cor.** Um rubi gerado a partir da gema
  ficou com brilho **menta** (o rosa não troca o branco/menta). Hoje o script
  detecta o 4º tom (pálido) e o recolore: `-Brilho <hex>` manda; sem ele, usa um
  tom claro derivado do novo "claro" (mistura 55% com branco).
- **Ordenar as letras do mapa por frequência é instável**: na gema, dois tons
  têm 13,07% e 13,01% e trocam de lugar entre execuções, invertendo o mapa.
  As letras agora saem por **luminância** (L/M/D = tons, W = brilho).
- **`Write-Output` dentro de função com resultado atribuído** (`$x = Fn`) é
  capturado na variável e não aparece. Relatórios usam `Write-Host`.
- **PowerShell bloqueia script em caminho UNC**: rode com
  `-NoProfile -ExecutionPolicy Bypass -File` (convenção do próprio projeto).
- **`node` não carrega script em UNC** e precisa de `node_modules/playwright`
  resolvível: copie o `gerar-icone.cjs` para uma pasta Windows com Playwright e
  passe template/saída como caminhos UNC (o `fs` lê/escreve UNC normalmente).
- **Ícone em `imagens/` não precisa de registro**: `scripts/prepare-web.ps1`
  copia a pasta inteira (`css`, `script`, `imagens`, `media`), então o PNG novo
  já vai para `www/` e para o Android. (Diferente de um `script/*.js`, que
  precisa entrar em `scripts/script-manifest.js`.)
- **Confira em tamanho pequeno**: gere também um render com `--tamanho 96
  --escala 3` e olhe; o jogo mostra a ~1em.
