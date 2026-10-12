---
name: Layout visual (TAPeira)
description: Alterar, corrigir ou revisar QUALQUER layout/posição/alinhamento no jogo TAPeira (rodapé, botões, habilidades, log de avisos, painéis, HUD) com verificação visual e medição em vários tamanhos de tela. Use quando o pedido for sobre posição, alinhamento, sobreposição, "ficou ruim", "não cabe", "em cima/em baixo de", breakpoints ou tamanhos de tela.
---

# Layout visual na TAPeira

Use esta skill para mudanças de **layout** (posição, alinhamento, ordem visual,
sobreposição, tamanho de fileiras). Para mudanças de regra/cálculo/save, use a
skill `tapeira-fluxo`.

## Regra de ouro

Layout **não se resolve relendo CSS de cabeça**. A ordem que funciona:

1. **LER** o dono do layout (script + CSS).
2. **OLHAR** a tela (screenshot) — antes e depois.
3. **MEDIR** em vários tamanhos (o `visual-check.cjs` faz isso).
4. Só então **MUDAR uma coisa** e repetir 2–3.

Pular o "olhar/medir" é o que produz "ficou ruim" e retrabalho.

## Passo 0 — Ambiente (o caminho UNC atrapalha)

O projeto vive em `\\wsl.localhost\...`; o `node`/`cmd` do Windows **não**
consegue `chdir` pra lá. Faça uma cópia Windows temporária e rode de lá:

```powershell
$src = "\\wsl.localhost\Ubuntu\home\krn\games\a\Tapeira"
$dst = "$env:TEMP\tapeira-vis"
robocopy $src $dst /MIR /NJH /NJS /NDL /NFL /XD node_modules .git android desktop dist www | Out-Null
New-Item -ItemType Directory -Force -Path "$dst\node_modules" | Out-Null
foreach ($p in @('playwright','playwright-core')) {
  robocopy "$src\node_modules\$p" "$dst\node_modules\$p" /E /NJH /NJS /NDL /NFL | Out-Null
}
Set-Location $dst
```

- `robocopy` retorna **exit 1 em sucesso** — não é erro.
- **Não** rode `npx playwright install`: o Chromium já está cacheado em
  `C:\Users\<user>\AppData\Local\ms-playwright`.
- Ao terminar, **apague** o `$dst`.
- Ao editar o projeto, **recopie só os arquivos que mudaram** ($src → $dst):
  copiar tudo de novo é lento.

## Passo 1 — Medir e olhar (o coração da skill)

O script pronto está em `scripts/visual-check.cjs`. **Copie-o para a cópia
temporária** (ex.: `$dst\scripts\`) e rode de lá:

```powershell
node scripts/visual-check.cjs                 # 17 tamanhos de tela
node scripts/visual-check.cjs 400x740 1920x900   # só alguns
```

Ele:
- abre `Caverna.html` em cada tamanho,
- aplica o `SETUP` (fecha modais, desbloqueia skills, mostra o log),
- mede por `getBoundingClientRect` e confere as `REGRAS`,
- imprime `PASS`/`FAIL`/`SKIP` por regra,
- **salva um PNG por tamanho** em `scripts/visual-shots/` (é pra OLHAR!),
- sai com código `!= 0` se algo falhar.

Tipos de regra disponíveis (edite o array `REGRAS`):

| tipo | significa |
| --- | --- |
| `abaixo-de` | `A.top >= B.bottom` (A visualmente ABAIXO de B) |
| `acima-de` | `A.bottom <= B.top` |
| `acima-ou-lado-de` | A acima **ou** à direita de B (layout que alterna) |
| `ao-lado-de` | `A.left >= B.right` |
| `sem-sobreposicao` | A e B não se cruzam |
| `na-tela` | A dentro do viewport |
| `mesma-altura` | todos os A com o mesmo `top` (fileira horizontal) e sem sobrepor |

Regras com elemento invisível viram `SKIP` (não falha) — por isso o mesmo
arquivo serve para o log visível e oculto.

### Conferir que o próprio verificador funciona

Um verificador que nunca falha não serve. Ao criar/editar regras, reintroduza o
bug de propósito na cópia temporária, rode e confirme o `FAIL`; depois restaure.
(Feito assim: o bug "skills por cima dos botões" é detectado e o script sai
com código 1.)

## Passo 2 — Onde mexer (donos)

| Camada | Arquivo | Responsabilidade |
| --- | --- | --- |
| Cálculo de posição | `script/ui-rodape.js` | mede e escreve as variáveis CSS `--rodape-hab-left/bottom` |
| Estilo | `css/estilos.css` | tamanhos, cores, `gap`, `flex-direction`, fallback das variáveis |
| Ordem de carga | `scripts/script-manifest.js` (+ `npm run sync:scripts`) | registro de scripts |
| Regressão | `tests/regression.test.cjs` | teste `rodapé:` com varredura de tamanhos |

Regra prática: **posição ↔ JS medido**; **tamanho/aparência ↔ CSS**. Não
hardcode posição em media query para elementos cuja largura muda com o jogo
(a fileira de habilidades cresce a cada desbloqueio) — foi o erro original.

Detalhes e invariantes do rodapé: `references/rodape.md`.
Detalhes e invariantes do topo do HUD: `references/hud-topo.md`.

## Passo 3 — Interpretar pedidos (ambiguidade que já custou retrabalho)

Português é ambíguo e a direção do eixo Y confunde. Convenção adotada e
**medível**:

- "X **em baixo de** Y" → X ABAIXO de Y → `X.top >= Y.bottom`
  (X fica visivelmente mais perto do rodapé que Y).
- "X **em cima de** Y" → X ACIMA de Y → `X.bottom <= Y.top`.
- "**ao lado de**" → `X.left >= Y.right` (mesma faixa vertical).
- "`#logAvisos` em cima, skills embaixo" → `skills.top >= log.bottom`.

Se o pedido puder significar as duas coisas (ex.: "skills abaixo do log" pode
querer dizer "logo coladas no log" ou "simplesmente em qualquer ponto abaixo"),
**pergunte antes de codar** ou implemente a leitura literal e mostre o PNG.
Nunca assuma a estética: meça.

## Passo 4 — Validar

1. `node scripts/visual-check.cjs` (na cópia temp) → 0 falhas, nas duas
   direções (log visível **e** oculto).
2. Teste de regressão do projeto, na cópia temp:
   `node --test --test-name-pattern="rodap" tests/regression.test.cjs`
   e depois a suíte completa `node --test tests/regression.test.cjs`.
3. Rode o `visual-check` **antes e depois** da mudança: se o número de falhas
   não mudou, você não corrigiu nada.

## Passo 5 — Resumo final

Diga: arquivos alterados, o que o `visual-check` mediu (números), testes
executados, e que a validação rodou em **cópia temporária** (por causa do UNC).

## Armadilhas

- **Elemento fixo com `left: 0` para medir**: `#container-Habilidades` é
  `position: fixed`; medir com ele à direita faz o browser encolher a largura
  (shrink-to-fit) e corrompe a medida. Encoste em `left: 0` durante a medição.
- **Ancorar pelo topo do log com elemento alto**: se você posiciona a base do
  elemento a partir do topo do log, um elemento mais alto que o esperado
  sobrepõe o log. Ancora pelo **topo** (`log.bottom + folga`) e derive o
  `bottom` com a altura medida.
- **`hidden` x `visibility: hidden`**: `hidden` tira o elemento do layout;
  `visibility: hidden` continua medindo. Trate os dois.
- **Log começa `hidden`**: no jogo o `#logAvisos` só aparece quando entra linha.
  Teste os dois estados — o estado oculto é o que costuma esconder bugs.
- **Media queries concorrentes**: há dezenas de `@media` ajustando os mesmos
  elementos. Ao mudar posição, verifique TODOS os breakpoints (a varredura faz
  isso), não só o que você tem na frente.
- **Não normalize fim de linha** de `ui.js`/`sistema.js` (`\r\n`+`\n` mistos).

## Checklist

- [ ] Olhei os PNGs antes e depois.
- [ ] `visual-check.cjs` com 0 falhas, com log **visível e oculto**.
- [ ] Teste `rodap` e a suíte completa passaram.
- [ ] Posição no script de medição, tamanho no CSS (não misturei).
- [ ] Resumo declara a cópia temporária e o que não pôde ser validado.
