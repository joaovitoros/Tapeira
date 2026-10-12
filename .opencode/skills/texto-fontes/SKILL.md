---
name: Texto e fontes (TAPeira)
description: Escrever ou revisar os TEXTOS (rótulos, nomes de item, descrições, números, estados) e a TIPOGRAFIA (fontes serif/sans, tamanhos, maiúsculas, espaçamento) do jogo TAPeira no padrão de esbocos/esboco-loja-v2.html. Use quando o pedido for "texto", "descrição", "nome do item", "rótulo", "redação", "linguagem", "fonte", "tipografia", "letra", "caixa alta/maiúsculas", "título de painel" ou padronizar a escrita da interface.
---

# Texto e fontes na TAPeira

O padrão aprovado está em **`esbocos/esboco-loja-v2.html`** (protótipo 2 da loja) e
na sua versão já embarcada: o painel `#Loja` em `Caverna.html` + o bloco `.loja-*`
em `css/estilos.css`. Os esboços são **referência descartável** (não são
carregados pelo jogo) — copie o padrão deles, não o arquivo.

Se este guia divergir do código, **o código manda** — e atualize este guia.

## Duas fontes, dois papéis (não misture)

| Papel | Fonte | Onde aparece |
| --- | --- | --- |
| **Interface / corpo** | `'Segoe UI', 'Roboto', sans-serif` (fallback `system-ui`) | nomes, descrições, rótulos, botões — tudo que se lê como frase |
| **Título e cifra** | `Georgia, 'Times New Roman', serif` | título de painel (peso 400), saldos da carteira e preços (peso 700) |

Regra mental: **frase = sans; título e número = serif**. Georgia **nunca** num
parágrafo de descrição — fica pesado e mistura os dois mundos.

## Hierarquia tipográfica (valores canônicos)

| Papel | Tam. | Peso | Caixa | Espaçamento | Cor |
| --- | --- | --- | --- | --- | --- |
| Eyebrow (sobrelinha) | 10px | 400 | UPPERCASE | `.26em` | `#9aa4b4` |
| Título do painel | `clamp(18px,1.9vw,25px)` | 400 **serif** | normal | `.03em` | cor de acento + `text-shadow` |
| Nome do item | 14px | 700 | normal | — | `#efece6` (ellipsis) |
| Pílula de nível | 10px | 600 | normal | — | `#a6adba` sobre `#0e1219` |
| Descrição | 11.5px / 1.35 | 400 | sentence case | — | `#a6adba` (máx. 2 linhas) |
| Valor da carteira | 14px | 700 **serif** | normal | — | `#efece6` |
| Rótulo da moeda | 9px | 400 | normal | `.02em` | `#778191` |
| Preço no botão | 13px | 700 **serif** | normal | `.01em` | cor da moeda |
| Rótulo do botão | 11px | 700 | normal | `.02em` | cor da moeda |
| Selo (`MAX`/`★ PATENTE`) | 13px | 800 | UPPERCASE | `.06em` | ouro / âmbar |

**Maiúsculas só nestes lugares:** eyebrow, cabeçalho de tabela, rótulo de seção
(e o `#lblInf`/`#objetivoTitulo`/`#missaoTitulo`, que já usam `uppercase`) e os
selos `MAX` / `PATENTE`. Descrição e rótulo de botão **nunca** vão em caixa alta.

## Como escrever

### Nome de item — curto, sem ponto, Title Case
- Sinal na frente quando é ganho/perda: `+Dano`, `−Tempo bater (Espaço)`,
  `+5% de dano`, `+2 no tempo de fuga`.
- Title Case nos substantivos: `Chance Baú`, `Esmeralda no Baú`, `Avanço Rápido`,
  `Mult Gold`, `Dano crítico`.
- Abreviações consagradas do jogo: `Mult` (multiplicador), `CM`
  (Conhecimento Mug), `Nv.` (nível).

### Descrição — uma frase, presente, termina com ponto
- Começa com verbo no presente, 3ª pessoa: `Aumenta…`, `Melhora…`, `Reduz…`,
  `Adiciona…`, `Multiplica…`.
- Fala com o jogador (`seu`/`você`): `Aumenta o dano dos seus ataques.`,
  `Reduz a vida do Mug.`, `Aumenta a chance de encontrar um baú.`
- Uma ideia por frase; se precisar de duas, separe com ponto. **Sempre com ponto
  final** — o esboço termina todas as descrições com `.`
- Sem jargão de código (nada de `bonusDano`, `multXP`, `×1.5` cru).

### Números e unidades (pt-BR)
- Milhar com **ponto**, decimal com **vírgula**: `1.250`, `150.000`, `+0,5%`,
  `×2,50`.
- Porcentagem colada e com sinal: `+5%`, `+0,5%`, `25%`.
- Nível: `Nv. 24` (com ponto e espaço). Não se aplica → `—`. No teto → `Nv. MAX`.
- Preço/saldo **sempre** pela função do jogo (`FormatGold`, `FormatCM`), nunca
  montando a string na mão.

### Rótulos fixos (estados)
- Ação: `Comprar` (title case, não maiúsculo).
- Auto: `Auto` (linha) / `Auto-compra` (cabeçalho) — espelha o `.auto-toggle` do HUD.
- Teto de nível: `MAX` · próximo passo travado: `★ PATENTE` · não aplicável: `—`.
- Carteira: `Gold` · `Esmeralda` · `Conhecimento`.
- Companheiro: `Companheiro N — Papel`, com **travessão** e o papel igual ao do
  resto do jogo (`casa.js`/`ui.js`): `Dano`, `Gold`, `Mago do Relógio`,
  `Alquimista`, `Assassino`, `Explorador`. Nunca `(DPS)`/`(GoldPS)`.
- Eyebrow: `Loja · moeda Gold` (moeda capitalizada, separador `·`).

## Onde a coisa vive (donos)

| Camada | Arquivo | Observação |
| --- | --- | --- |
| Estilo | `css/estilos.css`, bloco `.loja-*` (~11256–11645) | variáveis `--loja-*`, `.loja-eyebrow`, `.loja-titulo`, `.loja-saldo__*`, `.loja-item__*` |
| Markup + textos | `Caverna.html`, bloco `#Loja` (~451–) | **nomes e descrições são markup estático** (`loja-item__nome` / `loja-item__desc`) |
| Preços e níveis | `script/loja-compras.js`, `script/loja-esmeraldas.js` | só escrevem preço/nível/saldo via `FormatGold`/`FormatCM` |

Mudar texto de item = editar o `Caverna.html`. Mudar tamanho/fonte = `estilos.css`.
Não invente uma terceira fonte nem um terceiro tom de cinza.

## Revisar (varredura rápida)

```powershell
# caixa alta indevida / mistura de fonte
Select-String -Path css\estilos.css -Pattern "text-transform|font-family|Georgia"
# descrição sem ponto final ou separador em inglês
Select-String -Path Caverna.html -Pattern 'loja-item__desc|,[0-9]{3}'
```

Detalhes, bloco CSS pronto para copiar e exemplos antes/depois:
`references/tokens.md`.

## Armadilhas

- **Protótipo 1 (Figma) foi rejeitado**: ícones de linha Lucide + fonte **Inter**.
  Não reintroduza Inter nem ícones de linha — o acabamento vem do material do
  próprio jogo.
- **Serif só em título e número.** Georgia em descrição/rótulo quebra a leitura.
- **`text-transform: uppercase` nunca em frase** (descrição, rótulo de botão).
- **Números em pt-BR**: nada de `1,250` (milhar) nem `1.5` (decimal).
- **Preço é cálculo, não texto**: `FormatGold`/`FormatCM` — não hardcode.
- Não confunda `Nv. MAX` (nível no teto) com `MAX` (selo do botão).

## Checklist

- [ ] Fonte certa por papel (frase = sans; título/cifra = serif).
- [ ] Maiúsculas só em eyebrow, `th`, rótulo de seção e selos.
- [ ] Descrição no presente, termina com ponto, fala com "seu/você".
- [ ] Números em pt-BR e preço via `FormatGold`/`FormatCM`.
- [ ] Rótulos de estado exatamente `Comprar` / `Auto` / `MAX` / `★ PATENTE` / `Nv. MAX` / `—`.
- [ ] Comparei o resultado com `esbocos/esboco-loja-v2.html`.
- [ ] No resumo: arquivos alterados e o que não pôde ser validado.
