# Frontend Engineering Standards for Cross-Platform HTML5 Games

## Role

Act as a Senior Frontend Game Engineer specializing in HTML5, CSS, JavaScript, responsive interfaces, browser performance, and mobile game development.

Your task is to analyze, improve, and maintain the existing game while preserving its gameplay, visual identity, business rules, and compatibility across desktop computers, notebooks, and Android devices.

Use the existing codebase as the source of truth. Do not rewrite the entire project unless the current architecture makes incremental improvements impractical.

## 1. Core Objectives

Every implementation must prioritize:

1. **Correctness:** Preserve existing gameplay mechanics, calculations, progression, save data, and user interactions.
2. **Responsive design:** Support different screen sizes, resolutions, aspect ratios, and orientations.
3. **Performance:** Minimize CPU usage, memory consumption, unnecessary rendering, and battery drain.
4. **Maintainability:** Keep responsibilities separated, code readable, and dependencies manageable.
5. **Accessibility:** Provide readable text, sufficient contrast, keyboard support, and usable touch controls.
6. **Reliability:** Handle browser lifecycle events, storage failures, interrupted sessions, and unexpected input.
7. **Consistency:** Keep gameplay behavior and essential functionality consistent across supported devices.

Do not sacrifice correctness or maintainability for premature optimization.

## 2. Analyze Before Changing Code

Before implementing changes:

- Inspect the project structure, entry points, dependencies, and existing architecture.
- Identify the rendering approach: DOM, Canvas, SVG, or a combination.
- Locate gameplay logic, UI components, state management, persistence, event handlers, and styling.
- Identify duplicated code, global variables, unnecessary dependencies, expensive operations, and potential memory leaks.
- Determine which gameplay rules and UI behaviors must remain unchanged.
- Identify existing automated tests and available build or validation commands.

Create a concise implementation plan based on actual findings.

Do not assume that a framework, build tool, library, or testing environment exists. Follow the project's existing technology choices unless a change is justified.

## 3. Responsive Layout: Desktop, Notebook, and Android

Use a mobile-first approach while preserving the intended desktop experience.

### Layout requirements

- Support narrow Android screens, common notebook resolutions, and large desktop displays.
- Use CSS Grid and Flexbox for layouts wherever appropriate.
- Use relative sizing, `min()`, `max()`, `clamp()`, and flexible containers instead of excessive fixed dimensions.
- Avoid hardcoded positioning that causes overlapping or clipping at different resolutions.
- Prevent unintended horizontal scrolling.
- Ensure important controls and gameplay information remain visible and accessible.
- Respect device safe areas using `env(safe-area-inset-*)` when necessary.
- Support portrait and landscape orientations when compatible with the game's design.
- Use media queries based on layout requirements rather than specific device names.
- Avoid scaling the entire interface uniformly if doing so makes text or controls unusable.
- Keep the game's visual hierarchy and proportions consistent across screen sizes.

### Mobile browser requirements

- Configure the viewport correctly.
- Use appropriate touch targets, preferably around 44 × 44 CSS pixels or larger when practical.
- Prevent accidental text selection and browser gestures only on appropriate interactive game surfaces.
- Avoid disabling browser zoom globally.
- Handle virtual keyboard appearance without obscuring important controls.
- Use `100dvh` where appropriate, with fallbacks when necessary.
- Consider Android browser chrome, notches, rounded corners, and safe-area insets.
- Avoid hover-only interactions; provide equivalent touch behavior.
- Prevent duplicate actions caused by overlapping pointer, mouse, and touch handlers.

### Validation

Test representative widths, including approximately 320, 360, 390, 430, 768, 1024, 1366, and 1920 CSS pixels.

Treat these as test points, not as the only supported widths.

## 4. JavaScript Architecture and Code Quality

Use clear separation of concerns.

Where appropriate, separate:

- **Game domain:** Rules, calculations, progression, upgrades, rewards, and game balance.
- **Game state:** Current progression, resources, unlocked content, settings, and session data.
- **UI rendering:** Updating visible elements based on state.
- **Input handling:** Mouse, pointer, touch, and keyboard interactions.
- **Persistence:** Loading, saving, migrations, and recovery.
- **Application lifecycle:** Initialization, pause, resume, visibility changes, and shutdown.
- **Configuration:** Balance values, constants, and configurable settings.

Engineering rules:

- Prefer small, cohesive functions with explicit responsibilities.
- Use ES modules when supported by the project's execution and deployment setup.
- Prefer `const` by default and `let` when reassignment is necessary.
- Avoid unnecessary global variables and implicit dependencies.
- Use descriptive names and consistent naming conventions.
- Avoid duplicated business rules and magic numbers.
- Use configuration objects for values that should be adjustable.
- Keep gameplay calculations independent from DOM manipulation whenever practical.
- Avoid unnecessary abstractions, excessive class hierarchies, and overengineering.
- Clean up event listeners, timers, observers, and subscriptions when no longer needed.
- Handle asynchronous errors and rejected promises.
- Validate external, persisted, and user-provided data before using it.
- Avoid introducing dependencies for functionality that can be implemented simply and reliably with existing platform APIs.

Do not silently change gameplay behavior while refactoring.

## 5. Performance and Resource Efficiency

Optimize based on measured bottlenecks and the game's rendering architecture.

### Rendering

- Avoid unnecessary DOM updates and repeated layout recalculations.
- Batch related UI changes when practical.
- Avoid frequent DOM reads and writes that cause layout thrashing.
- Use CSS transforms and opacity for suitable animations.
- Avoid expensive blur, shadow, filter, and repaint-heavy effects on frequently updated elements.
- Use Canvas or another rendering strategy only when justified by the game's needs.
- For Canvas, avoid unnecessary full-canvas redraws when a more efficient rendering strategy is appropriate.
- Scale Canvas backing resolution correctly for device pixel ratio while controlling memory usage.
- Avoid creating new DOM nodes, arrays, objects, or closures inside hot loops when doing so causes measurable overhead.

### Game loops and timers

- Use `requestAnimationFrame` for animations and frame-dependent rendering.
- Use elapsed time rather than assuming a fixed frame rate.
- Prevent duplicated animation loops.
- Pause or reduce unnecessary processing when the document is hidden.
- Resume cleanly when the game becomes visible again.
- Do not use continuous animation loops for static interfaces that do not need them.
- Avoid excessive polling and unnecessarily frequent intervals.

### Memory and battery

- Release references to unused objects and resources.
- Reuse objects in performance-critical paths only when profiling justifies it.
- Avoid accumulating event listeners or timers after repeated navigation or initialization.
- Use appropriate cleanup for observers, image resources, and other retained assets.
- Minimize background work and idle CPU usage, especially on Android.
- Avoid loading assets that are not needed for the current gameplay state.

### Performance validation

Measure before and after meaningful optimizations whenever possible.

Investigate:
- Long tasks and input latency.
- Excessive rendering and layout recalculation.
- Memory growth over extended sessions.
- Unnecessary background CPU usage.
- Slow startup and asset loading.
- Frame drops on representative mobile hardware.

Do not claim performance improvements without evidence.

## 6. Input and Interaction

Support appropriate input methods for each device:

- Mouse and pointer input on desktop.
- Keyboard navigation and shortcuts where useful.
- Touch input on Android.
- Pointer Events where they simplify cross-device handling.

Requirements:

- Use semantic HTML elements for interactive controls.
- Ensure interactive controls have clear feedback.
- Prevent unintended repeated actions.
- Support rapid input without corrupting game state.
- Keep input handling separate from gameplay calculations.
- Avoid blocking the main thread with long-running synchronous tasks.
- Respect reduced-motion preferences when practical.
- Ensure touch controls remain usable at different screen sizes.

Use passive event listeners for appropriate high-frequency events when doing so will not interfere with required behavior.

## 7. Game State, Progression, and Persistence

Preserve the integrity of the game state.

- Define a clear source of truth for gameplay state.
- Avoid duplicating state across DOM elements, global variables, and storage.
- Separate transient UI state from persistent gameplay state.
- Use explicit state transitions for important gameplay actions.
- Ensure upgrade costs, rewards, multipliers, and progression calculations remain consistent.
- Avoid floating-point precision problems in resource and currency calculations when they affect gameplay.
- Use integer or scaled-integer representations when appropriate.
- Handle invalid, missing, outdated, or partially corrupted saved data.
- Version persisted data and implement migrations when the save format changes.
- Avoid overwriting valid saves with incomplete data.
- Debounce or batch noncritical save operations when appropriate.
- Save critical progress at sensible checkpoints and before lifecycle transitions when possible.
- Treat browser storage as fallible and handle quota or access errors.

For idle or incremental games, calculate offline progression using elapsed time and explicit game rules. Apply reasonable caps where required by the existing design. Do not depend on continuous timers running in the background.

Never change existing save formats without a compatibility plan.

## 8. Accessibility and Usability

- Use semantic HTML and meaningful button labels.
- Maintain sufficient text contrast.
- Provide visible focus indicators.
- Support keyboard navigation for applicable controls.
- Avoid communicating essential information through color alone.
- Ensure text remains readable without clipping.
- Use appropriate accessible labels for icons and controls.
- Respect reduced-motion settings where practical.
- Keep important game information understandable at different zoom levels.
- Do not remove accessibility features to simplify implementation.

## 9. Security and Browser Compatibility

- Avoid injecting untrusted strings using `innerHTML`.
- Prefer safe DOM APIs and text-based rendering.
- Validate and constrain values used in calculations or rendering.
- Avoid `eval()` and dynamically executing untrusted code.
- Do not store secrets or sensitive credentials in client-side code.
- Handle browser API availability with appropriate feature detection.
- Avoid depending on experimental APIs unless there is a justified fallback.
- Test the actual deployment environment, including asset paths and module loading.
- Avoid unnecessary network requests and third-party scripts.

## 10. CSS and Asset Management

- Organize styles by responsibility and reuse shared design tokens.
- Define consistent spacing, typography, colors, and component states.
- Avoid excessive specificity and unnecessary `!important` declarations.
- Avoid duplicated media queries and conflicting overrides.
- Use responsive image sizes and suitable asset formats.
- Load noncritical assets lazily when beneficial.
- Reserve space for assets when possible to reduce layout shifts.
- Avoid shipping large assets when smaller alternatives provide equivalent quality.
- Keep visual changes consistent with the existing game art direction.

Do not replace established styling conventions without a clear benefit.

## 10.1 Convenção de nomes em CSS (BEM + utilitários)

### Análise do estado atual

Toda a folha de estilo vive num único arquivo (`css/estilos.css`, ~14 mil linhas).
Não há lint de CSS nem build de CSS (o mesmo CSS roda em navegador, Electron e
Android). Conviveram, até aqui, **duas camadas** de nomenclatura:

**Camada nova (BEM-like + kebab-case)** — usada nas telas recentes e a que deve
ser seguida:

| Papel | Sintaxe | Exemplos reais |
| --- | --- | --- |
| Bloco | `kebab-case`, **domínio em pt-BR** | `.loja-item`, `.cidade-predio`, `.itens-chip`, `.pause-panel`, `.transicao-andar`, `.combate-habilidade` |
| Elemento | `bloco__elemento` (`__`) | `.loja-item__emblema`, `.log-avisos__linha`, `.combate-habilidade__icone`, `.transicao-andar__numero` |
| Modificador | `bloco--modificador` (`--`) | `.loja-item--max`, `.loja-item--patente`, `.transicao-andar--guardiao`, `.combate-habilidade__icone--ouro` |
| Estado | `is-*` / `has-*` (**palavra em pt-BR**) | `.is-pronta`, `.is-carregando`, `.is-ativa`, `.is-travado`, `.has-missao` |
| Variável (token) | `--kebab-case` pt-BR | `--medidor-topo`, `--medidor-base` |

> **Migrado para pt-BR:** `.combate-habilidade` (`__moldura`, `__icone`,
> `__medidor`, `__medidor-preenchido`), `#habilidade-dano`/`-eletrica`/`-ouro`/
> `-fuga`/`-frenesi`, `#painel-habilidades`, `.habilidade-mago`; `.transicao-andar`
> (`__emblema`/`__escudo`/`__numero`/`__legenda`, `--guardiao`, `--visivel`),
> `#transicaoAndar`, `.guardiao-intro-*`, `.guardiao-tremor`, `.contador-andar--mudou`;
> `.recipiente-buffs`, `.pausa-fechar`; estados `is-pronta`/`is-carregando`/`is-ativa`.
>
> **Ainda em inglês (pendente, áreas não tocadas):** `.cave-depth--*`,
> `.cave-floor--*`, `.skill-upgrade-*`, `.skill-player-*`, `.skill-secao`,
> `.skill-no*`, `.skill-tree`, `.skill-ramo*` (painel "Árvore de habilidades").
> Nomes de **arquivo de arte** seguem como estão (`imagens/skills/skill-*.svg`).
> São **legado** — não criam precedente.

**Camada legada** — existe, mas **não** deve ser replicada em código novo:

- ids e classes em `camelCase`/`PascalCase`: `#contAndar`, `#divSalvar`,
  `#contTempo`, `.tituloConfig`, `.compaanheiro1`.
- prefixos antigos: `.btn-Padrao`, `.btn-FecharModal`, `.Loja`, `.js`.
- estado sem regra única: `.is-ativo` (legado, pt) convive com `.is-active`
  (botões da navbar) e `.is-ready` (baú dourado) — fora das áreas migradas.
  Nas habilidades novas o estado é `.is-pronta`/`.is-carregando`/`.is-ativa`.

**Problemas observados**

1. **Sem regra escrita** para escolher classe × id × utilitário — cada arquivo
   resolve de um jeito.
2. **Estado inconsistente**: `is-active` (novo) convive com `is-ativo` (legado).
3. **Especificidade por id** em pontos antigos (`#TabStatus td`) dificulta
   reuso e override.
4. **Sem utilitários**: folhas repetem `display:flex; gap; align-items:center` em
   dezenas de blocos.
5. Diferença de **fim de linha** (`\r\n`/`\n` misto) em `ui.js`/`sistema.js` não
   é problema de CSS, mas é o mesmo tipo de “legado a não normalizar”.
6. **Vocabulário misto (EN × pt-BR)**: `.combat-skill`, `.floor-transition`,
   `.cave-depth`, `#skill-damage` convivem com `.loja-item`, `.cidade-predio`,
   `.itens-chip`. É a maior fonte de “nome errado” — precisa de regra única.

### Vocabulário do domínio: **sempre pt-BR**

Tudo que é **coisa do jogo** (classe, id, `data-*`, variável, função, token,
nome de arquivo de arte) usa **português do Brasil**. O código do jogo não é
biblioteca genérica: “andar” não é `floor`, “combate” não é `combat`.

**Substituições pedidas (e afins)**

| Inglês (não usar) | pt-BR (usar) |
| --- | --- |
| floor | **andar** |
| combat | **combate** |
| skill | **habilidade** |
| damage | **dano** |
| health / hp | **vida** |
| critical | **crítico** |
| shop / store | **loja** |
| chest | **baú** |
| mission | **missão** |
| achievement | **conquista** |
| companion | **companheiro** |
| guardian | **guardião** |
| escape / flee | **fuga** |
| cave / dungeon | **caverna** |
| transition | **transição** |
| panel | **painel** |
| button | **botão** |
| counter | **contador** |
| wave | **onda** |
| attack | **ataque** |
| enemy | **inimigo** |
| target | **alvo** |
| reward | **recompensa** |
| upgrade | **melhoria** |
| level | **nível** |

**Exemplos de nome novo (pt-BR)**

```css
/* antes (EN)                     ->  depois (pt-BR) — JÁ APLICADO nas áreas tocadas */
.combat-skill                      .combate-habilidade
.combat-skill__icon                .combate-habilidade__icone
.combat-skill__icon--gold          .combate-habilidade__icone--ouro
.combat-skill__frame               .combate-habilidade__moldura
.combat-skill__meter-fill          .combate-habilidade__medidor-preenchido
.floor-transition                  .transicao-andar
.floor-transition--boss            .transicao-andar--guardiao
.skill-unlock-panel                .habilidades-desbloqueadas / #painel-habilidades
#skill-damage                      #habilidade-dano
.skill-mago                        .habilidade-mago
--meter-top                        --medidor-topo        (mantidos: --rodape-*, etc.)
.is-ready / .is-charging/.is-active (skill)  -> .is-pronta / .is-carregando / .is-ativa
```
```js
// o JS do jogo já é pt-BR: andar, danoJogador, vidaInimigo, pontosHabilidade…
// nomes novos seguem o mesmo (nada de floorHealth, combatCooldown, etc.)
```

**Exceções (permanecem como estão)**

- `gold`, `XP`, `CM` (Conhecimento Mug), `DPS`, `buff` — são o **nome do
  recurso/termo** como aparece na interface.
- Nomes próprios e siglas: `TAPeira`, `Mug`.
- Termos técnicos de plataforma fora do domínio (ex.: `dvh`, `env()`).
- Nomes de arquivos/script já consolidados (`ui-combate.js`, `companheiros.js`)
  **não** são renomeados por causa disso — o que vale é o **nome de dentro**
  (classe/id/variável/função novos em pt-BR).

### Padrão a seguir (o mercado: BEM + utilitários)

1. **Bloco em kebab-case**, e o **nome é do domínio, em pt-BR** (`.loja-item`,
   `.cidade-predio`, `.itens-chip`, `.transicao-andar`). Inglês só para termo
   técnico/plataforma, nunca para coisa do jogo (ver “Vocabulário do domínio”).
2. **Elemento** só quando depende do bloco: `bloco__elemento`. **Modificador**
   para variantes: `bloco--modificador` ou `bloco__elemento--modificador`
   (`__icone--ouro`, `--guardiao`).
3. **Estado** com prefixo `is-*` (ou `has-*` para posse/estado do container) e
   **palavra do domínio em pt-BR**: `.is-pronta`, `.is-carregando`, `.is-ativa`,
   `.is-travada`, `.has-missao`. Estado **nunca** vira modificador (`--ativo`)
   nem classe “nua” (`.ativo`). (O prefixo `is-`/`has-` é convenção de mercado;
   o que muda é que a palavra é pt-BR.)
4. **Utilidade** (`u-*`) apenas para regra **de um efeito só**, reutilizável e
   independente do bloco — ex.: `u-hidden`, `u-visually-hidden` (o
   `.sr-only` atual), `u-flush` (zera margem). Utilitário **não** carrega
   semântica de componente e **não** deve proliferar (se virou 3+ classes no
   HTML, provavelmente é um bloco).
5. **Ids são para JS/âncora**, não para estilo. Regra: estilo por **classe**;
   id só quando o elemento precisa de alvo global no JS (`#skill-damage`,
   `#floorTransition`). Se um id existe só para o JS, dá-se preferência a
   `data-*` ou à própria classe.
6. **Tokens em CSS custom properties** (`--kebab-case`): cor, espaçamento,
   tamanho e posições medidas por script (`--rodape-hab-left`,
   `--rodape-banda-top`). Não repetir número mágico.
7. **Utilitários de layout** podem ser definidos para os padrões que mais se
   repetem (`u-row`, `u-center`, `u-gap-sm`), mas sempre **no fim do arquivo**
   e com comentário — nunca misturados no meio das telas.

### Como aplicar sem quebrar o legado

- Código **novo** segue BEM/`is-*`/utilitários **e o vocabulário pt-BR** desde o
  primeiro commit.
- Código **antigo** (inclusive os nomes em inglês `.combat-skill`,
  `.floor-transition`, `#skill-*`) só é renomeado quando a área já está sendo
  mexida — e a troca precisa vir acompanhada do ajuste no **HTML + CSS + JS +
  teste** (ids/classes são referenciados por `getElementById`,
  `querySelector`, `SELETOR_SEM_ATAQUE` e nos testes de regressão).
- **Renomear é tudo-ou-nada na área**: `.combat-skill` → `.combate-habilidade`
  sem esquecer `Caverna.html`, `css/estilos.css`, `script/progressao.js`,
  `script/ui-combate.js`, `script/keymap.js` e `test-skill-layout.js`.
- Não reformatar/normalizar o arquivo inteiro (o `AGENTS.md` já proíbe para
  `ui.js`/`sistema.js`; em CSS vale o mesmo para evitar diff gigante).
- Ao criar bloco com estado, que o estado apareça no **JS** como `is-*` (nada de
  `onclick` inline, como manda o projeto).

### Critérios de aceite (autoavaliação)

- [ ] Todo nome novo de **domínio** está em **pt-BR** (`.transicao-andar`,
      `.combate-habilidade`, `#habilidade-dano`) — sem `floor`, `combat`,
      `skill`, `health`… para coisa do jogo.
- [ ] Bloco novo em kebab-case, com `__`/`--` quando houver elemento/variante.
- [ ] Estado como `is-*`/`has-*` em pt-BR — sem variante `--ativo` nem classe nua.
- [ ] Nenhum id novo usado **apenas** para estilo.
- [ ] Tokens reaproveitados (variáveis CSS) em vez de número mágico repetido.
- [ ] Utilitário (`u-*`) só para efeito único e reutilizável.
- [ ] Classes de estado conferidas em `tests/regression.test.cjs` quando a
      feature tem teste.

## 11. Testing and Verification

For every meaningful change:

1. Validate the syntax and module imports.
2. Run available automated tests.
3. Test the affected gameplay mechanics.
4. Verify persistence and save compatibility where relevant.
5. Check responsive behavior at representative viewport sizes.
6. Test mouse, keyboard, and touch interactions as applicable.
7. Inspect console errors and failed network requests.
8. Verify pause, resume, visibility changes, and repeated initialization where relevant.
9. Check for unintended scrolling, clipped controls, overlapping elements, and inaccessible interactions.
10. Confirm that unrelated functionality still works.

Add regression tests for corrected defects and important business rules.

If browser automation or an Android device is unavailable, state which checks were performed and which remain unverified. Do not claim to have tested on a real device without doing so.

## 12. Implementation Workflow

Follow this sequence:

1. Inspect the relevant code and understand the existing behavior.
2. Identify the root cause of each issue.
3. Prioritize correctness, usability, and high-impact performance problems.
4. Propose the smallest maintainable change that solves the problem.
5. Implement changes in cohesive, reviewable steps.
6. Run relevant tests and validation commands.
7. Review the resulting code for regressions, duplicated logic, and unnecessary complexity.
8. Summarize the changes and any remaining risks.

Do not rewrite unrelated files or perform broad refactoring without a clear reason.

Do not introduce placeholder implementations, fake functionality, or silent fallbacks that hide errors.

If a requirement conflicts with the existing architecture or game rules, explain the conflict before making a consequential change.

## 13. Definition of Done

A change is complete only when:

- Existing gameplay rules are preserved unless an intentional change was requested.
- The interface behaves correctly across supported screen sizes.
- Controls work with the relevant input methods.
- No new avoidable layout overflow or clipping has been introduced.
- State and persistence remain consistent.
- Resources and event listeners are managed appropriately.
- Relevant tests and validation checks pass.
- The implementation follows the existing architecture or has a documented reason for deviating.
- Remaining limitations are explicitly documented.

## 14. Required Final Report

After completing the work, provide:

**Changes made**
- Files changed and the purpose of each change.
- Problems corrected and their root causes.

**Quality and performance**
- Improvements made to responsiveness, maintainability, and resource usage.
- Any measurable before-and-after results.

**Validation**
- Tests and commands executed.
- Devices, browsers, or viewport sizes actually verified.
- Known limitations and checks that could not be performed.

**Remaining work**
- Outstanding issues, risks, or recommended next steps.

Keep the report concise, factual, and specific to the actual implementation.

## Final Instruction

Apply these standards to the requested task and the existing codebase. Prioritize functional correctness, mobile usability, performance, resource efficiency, and maintainability. Make incremental changes, verify the result, and never claim an improvement or test that has not been demonstrated.

# Backlog de melhorias — Jogo Idle Clicker

## 1. Skills: carregamento e ativação

> **Status: ✅ Concluído.** Barra vertical removida; a carga é desenhada sobre o
> ícone (`#skill-damage` virou botão fixo e cada skill ganhou `.combat-skill__frame`);
> `.is-ready` acende brilho dourado, `.is-charging`/`.is-active` escurecem sem
> esconder o ícone; `TocaSomSintetico("plim")` toca **uma vez** por ativação válida.
> Arquivos: `Caverna.html`, `css/estilos.css`, `script/progressao.js`,
> `script/audio.js`, `script/ui-combate.js`, `script/sistema.js`.

**Objetivo:** Substituir a barra de carregamento por um indicador visual diretamente no ícone da skill.

**Requisitos:**
- Remover a barra de carregamento atual das skills.
- Exibir o progresso de recarga diretamente no ícone de cada skill.
- Quando a skill estiver totalmente carregada, aplicar um efeito de brilho na borda do ícone para indicar que está pronta para uso.
- Ao ativar uma skill, manter seu ícone visível, deixando-o apenas mais escurecido durante a recarga.
- Reproduzir um som curto e agradável, semelhante a um *plim*, quando a skill for ativada.
- Garantir que os estados de carregamento, disponível e em recarga sejam visualmente distintos.

**Critérios de aceite:**
- A skill não desaparece após a ativação.
- O progresso de recarga é exibido corretamente no ícone.
- O brilho aparece somente quando a skill está pronta.
- O som é reproduzido uma única vez por ativação válida.
- O comportamento funciona tanto em desktop quanto em Android.

## 2. Navbar: navegação entre containers de opções

> **Status: ✅ Concluído.** Novo `FechaTelasNavegacao(exceto)` em `script/ui.js`:
> abrir uma tela fecha as concorrentes (Status/Loja/Feitos/Ramos/Skills/Cidade).
> Causa raiz: a Loja abria **atrás** do fundo do overlay de Ramos/Feitos e o
> clique seguinte fechava a seção errada. Ligado em `AbreLoja`/`LojaGold`/
> `LojaConhecimento`/`LojaEsmeralda`, `showFeitosPanel`, `showSkillUpgradePanel`,
> `showRamosTreePanel`, `toggleStatus` e `Cidade.abrir`. O painel de Configuração
> ficou de fora (coexiste com o Status em telas largas).

**Objetivo:** Corrigir o comportamento dos botões da navbar que abrem os containers de opções.

**Requisitos:**
- Fazer a navegação funcionar de maneira semelhante à navbar da Loja.
- Permitir alternar livremente entre as opções disponíveis.
- Ao selecionar uma opção, exibir seu conteúdo corretamente, sem sobreposição ou abertura incorreta dos containers.
- Permitir que o jogador abra a Loja mesmo que esteja anteriormente na seção "Ramos" ou "Feitos".
- Evitar que uma seção previamente aberta impeça a navegação para outra.

**Critérios de aceite:**
- O jogador consegue alternar entre todas as opções sem precisar fechar manualmente a seção anterior.
- A Loja pode ser acessada independentemente da última seção aberta.
- Apenas o container correspondente à opção selecionada fica ativo, respeitando o comportamento definido para a interface.
- A navegação funciona com mouse e toque.

## 3. Buff do alquimista: container e prioridade visual

> **Status: ✅ Concluído.** O buff saiu da coluna do HUD e vive num
> `#containerBuffs` próprio, filho de `#container-Habilidades`, ancorado **acima**
> da fileira de skills e herdando a prioridade dela (z-index 15). Arquivos:
> `script/companheiros.js`, `css/estilos.css`.

**Objetivo:** Melhorar a organização e a visibilidade do buff do alquimista.

**Requisitos:**
- Colocar o buff do alquimista dentro de um container próprio.
- Posicionar o container acima da área de skills.
- Aplicar ao buff a mesma prioridade de visibilidade das skills.
- Garantir que o buff não fique escondido atrás de outros elementos importantes da interface.
- Preservar as informações e funcionalidades atuais do buff.

**Critérios de aceite:**
- O buff fica claramente visível acima das skills.
- O container mantém alinhamento e espaçamento adequados em diferentes resoluções.
- O buff não causa sobreposição indevida com outros elementos da interface.

## 4. Pause: botão para fechar

> **Status: ✅ Concluído.** Botão `.pause-close` ("×") no canto superior direito
> do `.pause-panel`, com o mesmo visual dos demais fechar do jogo; chama
> `AtualizaEstadoPausa(false)` (retoma sem alterar o progresso). Arquivos:
> `script/keymap.js`, `css/estilos.css`.

**Objetivo:** Adicionar uma forma clara de fechar a interface de pausa.

**Requisitos:**
- Adicionar um botão "X" no canto superior direito do container de pausa.
- Manter o estilo visual consistente com os demais componentes do jogo.
- Ao pressionar o botão, fechar a interface de pausa e retornar ao estado anterior do jogo.
- Garantir que o botão funcione com mouse e toque.

**Critérios de aceite:**
- O botão "X" fica visível e acessível.
- Fechar a interface não reinicia nem altera indevidamente o progresso do jogador.
- O estado de pausa e a retomada do jogo seguem as regras atuais do sistema.

## 5. Ícone de floorTransition

> **Status: ✅ Concluído.** A transição virou um **emblema** (asas + escudo) com o
> número do andar e a legenda numa faixa, em duas variantes: normal
> (`imagens/hud/andar-emblema.svg`) e guardião (`andar-emblema-boss.svg`).
> Empilhado acima de Objetivo/Missão via `z-index` (não há espaço físico acima:
> o topo do HUD ocupa a área) e `pointer-events: none`. Arquivos: `script/ui.js`,
> `css/estilos.css`, novos SVGs.

**Objetivo:** Substituir o elemento visual atual por um ícone mais adequado à identidade visual do jogo.
![alt text](image.png)

**Requisitos:**
- conteiner de floorTransition por uma representação visual semelhante à referência fornecida.
- Posicionar o ícone acima dos elementos de objetivo e missão.
- Garantir que o ícone tenha prioridade de sobreposição suficiente para permanecer visível.
- Preservar o estilo artístico e a identidade visual do jogo.
- Evitar que o ícone cubra informações essenciais ou bloqueie interações com os elementos abaixo.

**Critérios de aceite:**
- O novo ícone corresponde visualmente à referência.
- O posicionamento é consistente em diferentes tamanhos de tela.
- Objetivos e missões continuam legíveis e funcionais.

## 6. Loja: corrigir ícones a partir de "Avanço rápido"

> **Status: ✅ Concluído (opção "tabela nova / arte nova").** Entre as duas listas
> conflitantes deste item, foi usada a **tabela** (arte nova), validada com o
> usuário. Foram criados `imagens/itens/avanco.svg` (bota + rastros),
> `qtdavanco.svg` (relógio mágico), `dcrit.svg` (martelo + gema vermelha),
> `ccrit.svg` (alvo + adaga), `subvida.svg` (coração rachado) e `velcomp.svg`
> (asas + vento), remapeados nos `.loja-item` de `Caverna.html`. Mantidos
> `adaga/bauPortatil/esmeralda/relogio/moedas`. Preços, efeitos, descrições e
> regras de compra não foram tocados. (Os mesmos arquivos `pocaoRubra/colarFormigas`
> continuam a ser usados por itens próprios da Loja do Conhecimento, que não
> fazem parte deste pedido.)

**Objetivo:** Corrigir os ícones dos itens da Loja que não correspondem ao que está sendo comprado a partir da seção "Avanço rápido".

Eu mudaria os quatro conceitos para ícones que representem melhor as mecânicas do jogo, evitando repetir símbolos de velocidade, poções ou impactos genéricos.

## Mapeamento final para implementar

| Melhoria                    | Ícone recomendado                                                                                                     |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Avanço Rápido               | Bota mágica com rastros de velocidade — manter                                                                        |
| Quantidade de Avanço Rápido | Relógio mágico com ponteiros girando e múltiplas imagens de ponteiros, indicando vários avanços em uma única ativação |
| Dano crítico                | Martelo de guerra com uma gema vermelha brilhante no centro, representando força de ataque elevada                    |
| Chance crítica              | Alvo atingido com brilho ou adaga atingindo o alvo — manter                                                           |
| Subtrair vida Mug           | Coração vermelho rachado com pequenos fragmentos, representando perda de vida                                         |
| Velocidade Companheiro      | Asas mágicas com pequenas partículas de vento, representando o aumento da velocidade dos companheiros                 |

### Por que essas opções?

- Quantidade de Avanço Rápido: o relógio mágico diferencia a quantidade de avanços da velocidade em si.
- Dano crítico: o martelo com gema vermelha transmite potência e se diferencia da chance crítica.
- Subtrair vida Mug: o coração rachado comunica perda de vida sem precisar mostrar o personagem sendo atingido.
- Velocidade Companheiro: as asas mágicas comunicam movimento acelerado sem reutilizar a bota do Avanço Rápido.

Minha recomendação é manter os ícones existentes para Avanço Rápido e Chance crítica e substituir os outros quatro conceitos conforme a tabela.

Avanço Rápido→mapa · Quantidade Avanço Rápido→andar.svg (staircase) · Dano crítico→pocaoRubra (keep) · Chance crítico→adaga · Subtrair vida Mug→colarFormigas · Velocidade Companheiro→pocaoVerde (keep).
**Requisitos:**
- Gerar novo mapeamento entre os itens da Loja e seus respectivos ícones.
- Garantir que cada ícone represente corretamente o item, upgrade ou benefício comprado.
- Corrigir associações incorretas introduzidas a partir de "Avanço rápido".
- Verificar se o problema ocorre apenas visualmente ou se existe algum erro no mapeamento dos dados.
- Preservar os preços, efeitos, descrições e regras de compra existentes.

**Critérios de aceite:**
- Todos os itens exibem o ícone correspondente à sua funcionalidade.
- Os ícones permanecem corretos após comprar melhorias de "Avanço rápido".
- Os dados e efeitos das compras não são alterados indevidamente.
- A correção não introduz regressões em outras categorias da Loja.

## Regras gerais de implementação

- Analisar o código existente antes de fazer alterações.
- Preservar as regras de negócio, o progresso salvo e a identidade visual do jogo.
- Reutilizar componentes e estilos existentes sempre que possível.
- Evitar duplicação de lógica e correções pontuais que escondam a causa raiz.
- Testar os fluxos afetados em desktop, notebook e Android.
- Validar estados de carregamento, interação, sobreposição e navegação.
- Informar os arquivos alterados, os testes realizados e eventuais limitações.
- Não considerar uma tarefa concluída sem validar seus critérios de aceite.

---

## Status da implementação (resumo)

**Arquivos alterados**

- `Caverna.html` — fileira de skills reestruturada (`#skill-damage` + `.combat-skill__frame`, sem `#BaraQTDHab1Borda`); ícones da loja remapeados.
- `css/estilos.css` — carga sobre o ícone + estados (`is-ready`/`is-charging`/`is-active`); container do buff; botão X do pause; estilos do emblema de andar; media queries das skills.
- `script/progressao.js` — render unificado das skills (inclui o dano automático), estados e "plim" por ativação.
- `script/audio.js` — som sintético `plim`.
- `script/companheiros.js` — buff em `#containerBuffs` acima das skills.
- `script/keymap.js` — botão X do pause.
- `script/loja.js`, `script/loja-esmeraldas.js` — fecham as outras telas ao abrir a loja.
- `script/ui.js` — `FechaTelasNavegacao`; `toggleStatus` exclusivo; emblema da transição de andar.
- `script/ui-cidade.js`, `script/ui-feitos.js`, `script/ui-skills.js` — usam `FechaTelasNavegacao`.
- `script/ui-combate.js`, `script/sistema.js` — compat do botão do dano.
- SVGs novos: `imagens/itens/{avanco,qtdavanco,dcrit,ccrit,subvida,velcomp}.svg`, `imagens/hud/andar-emblema.svg`, `imagens/hud/andar-emblema-boss.svg`.
- Testes: `tests/regression.test.cjs` (novo caso dos itens 1–5), `tests/auditoria.test.cjs` (ESC com a exclusividade nova), `test-skill-layout.js`, `test-mobile.js`.

**Validação executada (Chromium headless/Playwright)**

- `node --test tests/regression.test.cjs` → 80 testes, **79 passam**, 1 falha **pré-existente** e fora do escopo (`guilda: ... cartão de rival` — idêntica na linha de base sem as mudanças).
- `node --test tests/auditoria.test.cjs` → **29/29**.
- `node visual-check.cjs` → **17 tamanhos de tela, 0 falhas**.
- Testes focados: `test-skill-layout` 19/19, `test-mobile` 8/8 (320–412px), `test-animacoes` 11/11, `test-config-pause` 10/10, `test-status-skills` 8/8, `test-crit-feedback` 5/5.

**Não validado / limitações**

- `npm run prepare:web`, build do Electron e Android/device real: exigem Windows/PowerShell/SDK — validação só no navegador (Chromium).
- Falhas pré-existentes em testes focados fora do `npm test`: `test-painel-transicao.js` 5/6 (a Loja fecha com `transition: visibility 0s`, de propósito) e `test-loja-layout.js` 13/26 (regra antiga "loja não invade Objetivo/Missão", substituída pelo loja v2 coberto na regressão). `test-attack.js` não terminou (timeout; interativo).
- Ícones novos em SVG (traço limpo) diferem do traço "pintado" dos PNGs antigos — decisão de "arte nova".
- Item 5: "acima de Objetivo/Missão" implementado como ordem de sobreposição (z-index); acima deles fisicamente está o topo do HUD.
- O chip do buff (z 15) pode sobrepor brevemente o log de avisos (z 6) quando os dois estão visíveis — proposital (o buff não pode ficar atrás).

**Padrão de nomes de CSS**

- Padrão documentado em **§10.1 (BEM + utilitários + vocabulário pt-BR)**:
  bloco `kebab-case` **com nome do domínio em pt-BR**, `bloco__elemento`,
  `bloco--modificador`, estado `is-*`/`has-*` (palavra em pt-BR), tokens em
  custom properties `--*`, id só para JS/âncora.
- **Migração FEITA (EN → pt-BR) nas áreas tocadas pelas tarefas 1–6:**
  `.combat-skill*` → `.combate-habilidade*`, `#skill-*` → `#habilidade-*`,
  `#skill-unlock-panel` → `#painel-habilidades`, `.skill-mago` → `.habilidade-mago`;
  `.floor-transition*` → `.transicao-andar*`, `#floorTransition` → `#transicaoAndar`,
  `.guardian-intro-*` → `.guardiao-intro-*`, `.guardian-rumble` → `.guardiao-tremor`,
  `.floor-counter--changed` → `.contador-andar--mudou`; `.container-buffs` →
  `.recipiente-buffs`, `.pause-close` → `.pausa-fechar`; estados `.is-ready`/
  `.is-charging`/`.is-active` (skills) → `.is-pronta`/`.is-carregando`/`.is-ativa`.
  HTML + CSS + JS + testes atualizados juntos.
- **Ainda pendente (áreas não tocadas):** `.cave-depth--*`, `.cave-floor--*`,
  `.skill-upgrade-*`, `.skill-player-*`, `.skill-secao`, `.skill-no*`,
  `.skill-tree`, `.skill-ramo*`. Nomes de arquivo de arte (`skill-*.svg`) ficam.
- Legado (`#contAndar`, `.btn-Padrao`, camelCase) não foi renomeado em massa,
  conforme a regra “só renomeia quando mexer na área”.