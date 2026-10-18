---
name: Estilo e CSS (TAPeira)
description: Escrever, alterar ou revisar o CSS do jogo TAPeira — convenção de nomes (BEM + kebab-case), vocabulário do domínio em pt-BR, estados is-*/has-*, tokens em custom properties, camadas de override, especificidade e as armadilhas do arquivo único css/estilos.css. Use para criar/renomear classes e ids ligados a estilo, definir temas/cores/tokens, padronizar nomes, ou quando o pedido citar CSS, classe, seletor, estilo, cor, tema, "is-", "--var", especificidade ou "padrão de nome".
---

# Estilo e CSS na TAPeira

Guia do **CSS do projeto**. Complementa o `AGENTS.md` e o §10.1 do
`tasks-front.md`. Para **posição/alinhamento/sobreposição** (medir e olhar a
tela), use a skill `layout-visual`; aqui o foco é **como escrever e nomear o
estilo**.

## 1. As regras que não se quebram

- **Um único arquivo-fonte:** `css/estilos.css` (~14 mil linhas). O
  `esbocos/*.css` é **rascunho** — não é fonte, não edite como se fosse.
- **Sem build e sem lint de CSS.** O mesmo arquivo roda em navegador, Electron e
  Android. Não introduza pré-processador (Sass/Less/Tailwind) nem bundling.
- **Sem handler inline** (`onclick`, `style="..."` para lógica) — o estilo mora
  no CSS; o comportamento no JS via `addEventListener` + `data-*`.
- **`!important` é exceção**, não ferramenta: prefira especificidade/ordem.
- **Não normalize o arquivo inteiro** (`estilos.css` e `Caverna.html` têm
  `\r\n`/`\n` mistos; `ui.js`/`sistema.js` idem — o `AGENTS.md` proíbe). Mudança
  incremental, sem reformatar o que não foi tocado.

## 2. Convenção de nomes (BEM + kebab-case)

| Papel | Sintaxe | Exemplos reais |
| --- | --- | --- |
| Bloco | `kebab-case`, **domínio pt-BR** | `.loja-item`, `.cidade-predio`, `.combate-habilidade`, `.transicao-andar`, `.recipiente-buffs` |
| Elemento | `bloco__elemento` | `.loja-item__emblema`, `.combate-habilidade__icone`, `.transicao-andar__numero` |
| Modificador | `bloco--modificador` | `.loja-item--max`, `.transicao-andar--guardiao`, `.combate-habilidade__icone--ouro` |
| Estado | `is-*` / `has-*` (**palavra pt-BR**) | `.is-pronta`, `.is-carregando`, `.is-ativa`, `.is-travado`, `.has-missao` |
| Token (CSS var) | `--kebab-case` | `--medidor-topo`, `--rodape-hab-left`, `--loja-ring`, `--acento` |
| Id | só para **JS/âncora** | `#habilidade-dano`, `#transicaoAndar`, `#recipienteBuffs` |

- **Estilo por classe.** Id só quando o elemento precisa de alvo global no JS; se
  o id existe só por causa do JS, prefira `data-*` ou a própria classe.
- **Estado nunca vira modificador** (`--ativo`) nem classe nua (`.ativo`).

## 3. Vocabulário do domínio: sempre pt-BR

Coisa do jogo → português do Brasil. Inglês só para termo técnico/plataforma
(`dvh`, `env()`, `flex`). “andar”, não `floor`; “combate”, não `combat`.

```
floor → andar        combat → combate      skill → habilidade
damage → dano        health → vida         critical → crítico
shop/store → loja    chest → baú           mission → missão
companion → companheiro   guardian → guardião   transition → transição
```

**Exceções que ficam:** `gold`, `XP`, `CM`, `DPS`, `buff` (nome do
recurso/termo da interface), nomes próprios (`TAPeira`, `Mug`) e **nomes de
arquivo de arte** (`imagens/skills/skill-*.svg`).

**Exemplo de id montado** (dado interno em EN, id no DOM em pt-BR): quando o
identificador é construído a partir de um dado do código, traduza só o DOM:

```js
const SLUG_DOM_HABILIDADE = { damage: "dano", electric: "eletrica", gold: "ouro", escape: "fuga", frenzy: "frenesi" };
function IdDomHabilidade(id) { return "habilidade-" + (SLUG_DOM_HABILIDADE[id] || id); }
```

## 4. Migração de nomes (a regra de ouro do legado)

- **Código novo** já nasce no padrão (pt-BR, BEM, `is-*`, tokens).
- **Código antigo só renomeia quando a área é mexida** — nunca em massa.
- Renomear é **tudo-ou-nada na área**: HTML + CSS + JS + **teste** juntos. Cheque
  quem referencia: `getElementById`, `querySelector`, `classList`, `keymap.js`
  (`SELETOR_SEM_ATAQUE`), testes de regressão e testes focados.
- Ao renomear ids/classes que contêm o nome de um **arquivo de arte**, proteja o
  caminho (`skill-damage.svg` não pode virar `habilidade-dano.svg`).
- Ainda em EN (não tocado): `.cave-depth--*`, `.skill-upgrade-*`,
  `.skill-player-*`, painel “Árvore de habilidades” (`.skill-no*`, `.skill-tree`).

## 5. Organização do arquivo (camadas e override)

- Agrupe por **responsabilidade/área**, com comentário de bloco (`/* ---- loja ---- */`).
- **Blocos de override ficam no FIM do arquivo** (padrão “HUD v3/v4”): com a
  mesma especificidade, **a ordem de origem vence** — pôr no fim garante que a
  regra nova derrube as dezenas de media queries antigas. Mexeu no topo do HUD?
  Regra nova no fim.
- **Media queries por necessidade de layout**, não por nome de aparelho. Mudou
  posição/tamanho? confira **todos** os breakpoints (a varredura do
  `visual-check.cjs` faz isso).
- **Tamanho/aparência → CSS.** Posição de elemento cuja largura muda com o jogo
  (ex.: fileira de habilidades) é **medida no JS** (`ui-rodape.js` publica
  `--rodape-hab-left`/`--rodape-hab-bottom`) — **não** hardcode a posição.

## 6. Armadilhas que já morderam

1. **Especificidade de pseudo-classe.** `:disabled`/`:checked`/`:focus` somam um
   ponto: `input[type="checkbox"]:disabled` `(0,2,1)` **vence** `.auto-item-loja input`
   `(0,1,1)` — foi assim que um input escondido (`opacity:0`) reaparecia a `.5` e
   **desenhava uma segunda bola** somada à `.auto-item-loja__trilha`. Correção:
   incluir o estado no seletor que esconde (`… input:disabled`) e/ou desligar o
   `::after`. **Antes de culpar o layout, confira `getComputedStyle` do estado.**
2. **`hidden` × `visibility: hidden`.** `hidden` tira do layout; `visibility`
   continua medindo/tendo caixa. Trate os dois ao estilizar/medir.
3. **Fim de linha misto** — não “arrume” o arquivo inteiro (diff gigante e risco
   de sobrescrever). Edite só o trecho.
4. **Ids como estilo.** `#TabStatus td { … }` vence `.loja-item__valor` e trava
   override — evite; use classe.
5. **Especificidade por `!important` em cascata.** Se precisou de `!important`,
   provavelmente há seletor demais; reduza o seletor.
6. **Animação/estado sem saída.** Classe de estado/animação deve sair sozinha no
   `animationend` (ou ser limpa pelo JS) — nada de estado preso.

## 7. Fluxo de trabalho

1. **Ler** o dono da área (o bloco no `estilos.css` + onde a classe/id é usada:
   HTML, JS, testes).
2. **Olhar** a tela (screenshot) e **medir** com `node visual-check.cjs`.
3. **Mudar uma coisa** por vez, no padrão de nomes/tokens.
4. Revalidar: `node visual-check.cjs` + testes focados + `npm test`.
5. Ao adicionar/renomear classe de estado, **atualize o teste** que a verifica.

## 8. Validação

```bash
node visual-check.cjs                 # 17 telas, salva PNG por tamanho (é pra OLHAR)
node --test tests/regression.test.cjs # suíte completa
node --test --test-name-pattern="loja v2" tests/regression.test.cjs   # um teste
```

- Mudei nomes? `grep` pelos tokens antigos no repo (fora `node_modules/`,
  `www/`, `esbocos/`) deve voltar **vazio**.
- Mudei aparência? Rode `visual-check` **antes e depois** e olhe os PNGs.

## 9. Checklist

- [ ] Bloco `kebab-case` com nome de **domínio em pt-BR**; `__`/`--` quando houver elemento/variante.
- [ ] Estado como `is-*`/`has-*` (palavra pt-BR), sem `--ativo` nem classe nua.
- [ ] Nenhum id novo usado **só** para estilo; id novo em `camelCase` pt-BR.
- [ ] Tokens (`--*`) reaproveitados em vez de número mágico repetido.
- [ ] `!important` evitado; seletor o mais curto que resolve.
- [ ] Override novo no **fim** do arquivo; todos os breakpoints conferidos.
- [ ] Não reformatei trechos não relacionados; EOL preservado.
- [ ] Renomeei HTML+CSS+JS+teste juntos (e protegi nomes de arquivo de arte).
- [ ] `visual-check` 0 falhas, testes focados e `npm test` rodados.

## 10. Resumo final (obrigatório)

Diga: arquivos alterados, o que o `visual-check` mediu (números), testes
executados, e o que **não** pôde ser validado (ex.: Electron/Android exigem
Windows/SDK).
