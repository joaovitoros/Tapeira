---
name: Criar ícone de habilidade (Fagulha)
description: Gerar um ícone de habilidade NOVO do TAPeira no estilo Fagulha (emblema circular + motivo central + um enfeite temático com a habilidade), a partir de um motivo, uma paleta e um enfeite, em SVG. Use quando o pedido for "criar ícone de skill/habilidade", "novo emblema/ícone", "ícone da habilidade X", "outro ícone de skill", ou começar uma arte de ícone do zero no estilo dos ícones de habilidade.
---

# Criar ícone de habilidade — estilo Fagulha

Gera um emblema circular no estilo **Fagulha** (ver a skill `estilo-fagulha`)
com **um** motivo central e **um** enfeite que **combina com a habilidade** —
(frenesi=faíscas, ouro=moedas, gelo=flocos, elétrico=mini-raios, dano=estilhaços).
Nunca misture enfeites. Sem gradiente, sombra ou textura; contorno = cor do
preenchimento; luz de cima-esquerda.

## Comando

```bash
node .opencode/skills/icone-fagulha/scripts/gerar-icone-fagulha.cjs \
  --motivo raio --esquema fogo --enfeite faisca --faiscas 10 --saida imagens/skills/skill-<nome>.svg
```

### Opções

| Opção | Valores | Padrão | O que faz |
| --- | --- | --- | --- |
| `--motivo` | `raio`, `estrela`, `escudo`, `coracao`, `espada`, `moeda`, `floco`, ou um `d=""` cru | `raio` | símbolo central da habilidade |
| `--esquema` | `fogo`, `gelo`, `veneno`, `sangue`, `sombra`, `dourado` | `fogo` | paleta do emblema |
| `--enfeite` | `faisca`, `mini-raio`, `estilhaco`, `moeda`, `floco` | derivado do motivo (ver tabela) | **um só** enfeite, temático |
| `--faiscas` (alias `--enfeites`) | `0`–`10` | `10` | quantidade de enfeites (posições espalhadas prontas) |
| `--tamanho` | inteiro | `512` | lado do quadrado (viewBox/largura/altura) |
| `--saida` | caminho `.svg` | — | **obrigatório** |
| `--listar-motivos` / `--listar-esquemas` / `--listar-enfeites` | — | — | mostra as opções |

Enfeite padrão por motivo: `raio`/`estrela`/`escudo`/`coracao` → `faisca`;
`espada` → `estilhaco`; `moeda` → `moeda`; `floco` → `floco`.

O script é **agnóstico de formato**: gera SVG em qualquer `--tamanho` mantendo
as proporções.

## Fluxo de trabalho

1. Escolha o **motivo** = o símbolo da habilidade. Se não houver um pronto,
   passe um path: `--motivo "M... Z"` (desenhado para caber num raio ~160 numa
   base 512; ele sai sem brilho).
2. Escolha o **esquema** de cor conforme a "natureza" da habilidade
   (fogo/gelo/veneno/sangue/sombra/dourado).
3. Escolha o **enfeite** que **combina** com a habilidade — e só ele. Não misture
   (ex.: nada de moeda num ícone de gelo). A quantidade vai em `--faiscas`
   (`0` para liso; `10` para o máximo espalhado).
4. Gere o SVG e **olhe o render** (grande e pequeno, ~40px). É arte — não confie
   só no código.
5. Ligue no jogo (abaixo).

## Exemplos

```bash
# frenesi: raio laranja, faíscas
node .../gerar-icone-fagulha.cjs --motivo raio --esquema fogo --enfeite faisca --saida imagens/skills/skill-frenzy.svg

# dano: espada vermelha, estilhaços
node .../gerar-icone-fagulha.cjs --motivo espada --esquema sangue --enfeite estilhaco --saida imagens/skills/skill-damage.svg

# elétrico: raio azul, mini-raios
node .../gerar-icone-fagulha.cjs --motivo raio --esquema gelo --enfeite mini-raio --saida imagens/skills/skill-electric.svg

# ouro: moeda dourada, moedinhas
node .../gerar-icone-fagulha.cjs --motivo moeda --esquema dourado --enfeite moeda --saida imagens/skills/skill-gold.svg

# fuga: floco azul, mini-flocos
node .../gerar-icone-fagulha.cjs --motivo floco --esquema gelo --enfeite floco --saida imagens/skills/skill-escape.svg
```

## Conferir (obrigatório)

- Renderize o SVG num navegador (ou via Playwright) e **veja**: emblema
  centrado, enfeites espalhados (sem anel), brilho em cima-esquerda, contraste do
  motivo contra o campo.
- Veja também a ~40px: o motivo precisa continuar legível.
- Confira que não entrou gradiente/sombra/textura e que há **um só** tipo de
  enfeite — e que ele **combina** com a habilidade.

## Rasterizar para PNG (opcional)

O jogo usa **SVG** para os ícones de habilidade (o Chromium/Electron e o WebView
do Android renderizam). Rasterizar para PNG é opcional — faça só se precisar de
PNG, com o Chromium do Playwright (mesma abordagem da skill `icones`):

```bash
# gera SVG e depois rasteriza (exemplo com Node + Playwright)
node -e "const{chromium}=require('playwright');const fs=require('fs');(async()=>{const s=fs.readFileSync('imagens/skills/skill-x.svg','utf8');const b=await chromium.launch();const p=await b.newPage({viewport:{width:512,height:512}});await p.setContent(s);await p.screenshot({path:'imagens/skills/skill-x.png',omitBackground:true});await b.close();})()"
```

## Ligar no jogo

1. Salve em `imagens/skills/`.
2. No `Caverna.html` e/ou no mapa de ícones em `script/ui.js` (as habilidades de
   combate usam `imagens/skills/skill-*.svg`), aponte para o novo arquivo.
3. Nada de manifesto: `scripts/prepare-web.ps1` copia `imagens/` inteira.

## Motivos prontos

- `raio` — ataque/energia.
- `estrela` — sorte/brilho.
- `escudo` — defesa.
- `coracao` — vida/cura.
- `espada` — dano/ataque.
- `moeda` — ouro/recompensa.
- `floco` — gelo/fuga.

Ícones de habilidade do jogo gerados com este gerador (em `imagens/skills/*.svg`):

| Arquivo | Motivo | Esquema | Enfeite | Qtd |
| --- | --- | --- | --- | --- |
| `skill-frenzy.svg` | `raio` | `fogo` | `faisca` | 10 |
| `skill-damage.svg` | `espada` | `sangue` | `estilhaco` | 8 |
| `skill-electric.svg` | `raio` | `gelo` | `mini-raio` | 8 |
| `skill-gold.svg` | `moeda` | `dourado` | `moeda` | 6 |
| `skill-escape.svg` | `floco` | `gelo` | `floco` | 5 |

Quer outro símbolo (bota, punho, poção...)? Desenhe o `d` e passe em `--motivo`
— ou adicione um motivo novo em `scripts/gerar-icone-fagulha.cjs` (objeto
`MOTIVOS`), mantendo o padrão: forma cabendo num raio ~160 e, se quiser, um
brilho na borda superior-esquerda. Para um enfeite novo, adicione-o em
`ENFEITES` (mesma lógica: forma pequena centrada na origem, cabendo num raio ~30).
