---
name: Performance front e manutenção (TAPeira)
description: Otimizar, refatorar ou revisar performance/eficiência/manutenção do front do jogo TAPeira (HTML, CSS, JS puro, DOM, timers, eventos, memória) SEM quebrar as regras do projeto (scripts clássicos, contrato de save, 3 plataformas, 2 páginas). Use quando o pedido for "está pesado", "trava", "lento", "melhorar performance", "reduzir timer", "limpar esse código", "otimizar render", "vazamento de memória", "diminuir código duplicado" — ou antes de qualquer refatoração de front.
---

# Performance front e manutenção na TAPeira

Skill de **diagnóstico e otimização de front** para este repositório. Ela é a
camada "genérica de frontend" — mas **subordinada ao `AGENTS.md`**, que é a
autoridade do projeto. Se algo aqui contradiz o `AGENTS.md`, vale o `AGENTS.md`.

Antes de codar, leia a skill `tapeira-fluxo` (fluxo de mudança, manifesto de
scripts, cópia temporária por causa do caminho UNC). Para layout, use
`layout-visual`.

## 0. Realidade do projeto (não presuma outra)

| Fato | Consequência para a otimização |
| --- | --- |
| JS puro, **scripts clássicos globais**, ordem fixa | Proibido `import`/`export`/`type="module"`. Sem code splitting, sem dynamic import, sem bundler web. |
| `esbuild` só no `prepare:web` (Windows) para 1 bundle do Android | Web/Electron servem os arquivos crus. Minificar fonte não é a resposta. |
| 2 páginas: `index.html` (menu) e `Caverna.html` (jogo) | O que é compartilhado precisa das duas. |
| Ordem dos `<script>` é gerada por `scripts/script-manifest.js` → `npm run sync:scripts` | **Nunca** edite os `<script>` na mão nem mude a ordem para "carregar mais rápido". |
| 3 alvos: navegador + Electron + Android (Capacitor) | Sem `require`/`fs`/`ipcRenderer`; desktop via `window.tapeiraDesktop`. |
| Save é contrato público (5 lugares + whitelist) | Otimização que mexa em persistência é mudança de save — siga o ritual completo. |
| 4 arquivos de save: `persistencia.js`, `persistencia-autosave.js`, `persistencia-carregar.js`, `validacao-save.js` | Não "deduplique" os dois builders: eles são deliberadamente redundantes. |
| `css/estilos.css` único, ~13,8k linhas, 87 `@media`, ~16 `!important` | Nada de reformatar; mudança incremental e local. |
| `ui.js`/`sistema.js` têm **EOL misto** de propósito | Não normalize fim de linha. |
| Testes: `npm test` (Playwright headless + `node --test`) | A medição/validação usa essa base, não instrumentação nova. |
| Sem ESLint/Prettier/editorconfig | Não existe etapa de lint/format para "rodar". Use `npm test`. |
| Painel **dev-tools** na tecla **F2** (na caverna) | Use-o para forçar estado (eventos, hit kill) em vez de criar código de teste. Os testes o usam (`#game-dev-tools`). |

## 1. Ordem de prioridade

1. **Correção** — regra de negócio, interação e comportamento visual atuais.
2. **Performance medida** — gargalo real (não teórico).
3. **Recursos** — CPU, memória, timers, listeners.
4. **Manutenção** — clareza, responsabilidade, duplicação.
5. **Acessibilidade e compatibilidade** — as 3 plataformas e o teclado.

Não sacrifique 1, 4 ou 5 por ganho irrelevante de 2.

## 2. Antes de mexer

- `git status` — não sobrescreva trabalho do usuário.
- Identifique o **dono do arquivo** (lista no `AGENTS.md`). Lógica no arquivo
  errado é dívida garantida.
- Estabeleça **baseline** antes de otimizar: quantos timers ativos, quantas
  escritas de DOM por segundo, tamanho da árvore de DOM, tempo de tick. Sem
  baseline não existe "melhorou".
- Classifique o achado: defeito de correção · gargalo medido · ineficiência de
  recurso · problema de manutenção · acessibilidade · **melhoria especulativa
  (descarte ou deixe anotada)**.

## 3. Regras de front adaptadas a este projeto

### 3.1 Carregamento (regra adaptada — a genérica conflita)
- **Proibido** `import`/`export`, `type="module"`, dynamic import, code splitting.
- **Não** adicione `defer`/`async`: a ordem de execução dos `<script>` do
  `<head>` é contrato (menos `dev-tools.js`, no fim do `<body>`).
- Script novo = `script/<dominio>.js` + `scripts/script-manifest.js` +
  `npm run sync:scripts` (ver `tapeira-fluxo`).
- Não duplique download/execução de script.

### 3.2 DOM (onde este jogo mais ganha)
- Escreva só o que mudou. `UI.render()` é o render "grosso" do HUD: chamá-lo a
  cada golpe faz muita escrita desnecessária — prefira atualizar o elemento
  pontual.
- Agrupe leituras de layout (`getBoundingClientRect`, `offsetWidth`) antes de
  escrever estilo — nunca alterne leitura/escrita em laço.
- `innerHTML` **é aceitável** aqui para *montar template HTML estático/confiável*
  (lojas, painéis). Use `textContent` quando o conteúdo for só texto. **Nunca**
  interpole entrada de usuário/save sem sanitizar — isso é injeção, não perf.
- Many nodes de uma vez: monte fora do DOM e insira de uma vez (fragment),
  quando o perfil justificar — não faça isso "por estética".

### 3.3 Timers — o ponto sensível da TAPeira
Hoje há vários `setInterval(..., 1000)` no `sistema.js` e um `setInterval(..., 30)`
no auto-ataque (`keymap.js`). Regras:
- Todo timer tem **dono**: guardado em variável e cancelado em reset, menu,
  pausa e fim de evento.
- **Não crie polling novo** se um tick já resolve (o `AGENTS.md` é explícito).
- Antes de criar mais um `setInterval(1000)`, considere pendurar a lógica num
  tick que já existe. Consolidar N timers de 1s em 1 é ganho real — mas só com
  medição antes/depois e ordem de execução preservada.
- `requestAnimationFrame` é para sincronizar com o render, **não** é throttle
  universal. Debounce/throttle só quando não piora a resposta ao usuário.

### 3.4 Eventos e memória
- Sem listener duplicado por reinicialização (reset/load recriam estado).
- Listener transitório: remova ao fim do ciclo; `{ once: true }` ou
  `AbortController` quando couber.
- `ResizeObserver`/`MutationObserver`/`IntersectionObserver`: desconecte quando
  o trabalho terminou. `ui-rodape.js` é o **modelo bom** (rAF + observers, zero
  timer próprio).
- Não "nulifique" referência por decreto; deixe o GC agir. Vazamento se
  investiga com heap snapshot, não por suposição.

### 3.5 CSS
- Selector simples e específico o suficiente; `!important` é exceção.
- Animar `transform`/`opacity` em vez de propriedades que refazem layout.
- `content-visibility`/`containment`/`will-change` **só** com problema de
  render concreto — não aplique por padrão.
- Não remova CSS "não usado" por suposição: são 13,8k linhas compartilhadas
  pelas duas páginas e dezenas de `@media` concorrentes.
- Mudança de CSS é **incremental e local**. Nada de reformatar o arquivo.

## 4. Otimizar sem quebrar o contrato de save

Se a otimização tocar qualquer campo persistente, siga os 5 passos do
`AGENTS.md`, sem atalho:

1. variável global no dono do domínio;
2. **os dois** builders: `Salvar()` (`persistencia.js`) e `CriarObjetoSave()`
   (`persistencia-autosave.js`);
3. `Carregar()` (`persistencia-carregar.js`) com `?? default` para save antigo;
4. `ValidarSave()` (`validacao-save.js`) — e a **whitelist** do loop de campos
   não-numéricos, se o campo não for número finito;
5. `Resetar()` (`sistema.js`) se for por run.

Esquecer (2) ou a whitelist de (4) **quebra todo load**. Teste o save antigo
sem o campo.

## 5. Fluxo seguro

1. **Entender** — ler dono do arquivo + `AGENTS.md` + skill `tapeira-fluxo`.
2. **Identificar** — classificar o achado (seção 2), priorizar gargalo real.
3. **Planejar** — arquivos, problema, ganho esperado, risco, como validar.
   Mudança focada; nada de reescrita ampla.
4. **Implementar** — pequeno, coeso, sem dependência nova, sem tocar arquivo
   não relacionado.
5. **Validar** — teste focado (`node --test --test-name-pattern="..."`), depois
   `npm test`. Recurso compartilhado: `npm run prepare:web` (Windows).
6. **Medir** — antes/depois nas **mesmas condições**: nº de timers, escritas de
   DOM/tick, tempo de tick, nós do DOM, memória retida, requisições. Use dev-tools
   (F2) para forçar cenários.
7. **Relatar** — o que mudou, por que importa, o que foi validado e o que **não**
   foi. Nunca afirme ganho sem número.

## 6. Anti-padrões (não faça aqui)

- Reescrever o app, adotar framework, adicionar dependência para coisa trivial.
- Introduzir módulos/dynamic import/`defer`/`async`.
- Reformatação de arquivo grande ou normalização de EOL (`ui.js`, `sistema.js`).
- `innerHTML` com dado não confiável.
- Cache sem política de invalidação.
- Listener global sem ciclo de vida; timer órfão.
- Timeout arbitrário para "sincronizar" render.
- Trocar HTML semântico por `<div>` (ou vice-versa) "por performance".
- Remover código/CSS só por achar que não é usado.
- Otimizar trecho que não é gargalo porque "parece ineficiente".
- Afirmar melhoria sem medição.
- Misturar refatoração fora do escopo na mesma mudança (anote como sugestão).

## 7. Definição de pronto

- [ ] Comportamento pedido implementado; o resto preservado (ou a mudança
      documentada).
- [ ] Mexeu só no que o problema exige — nada especulativo.
- [ ] Código no **dono certo**, seguindo convenções locais.
- [ ] Sem dependência/abstração nova sem justificativa.
- [ ] Timers e listeners com ciclo de vida correto (reset/menu/pausa/evento).
- [ ] Acessibilidade e responsividade preservadas.
- [ ] Se tocou save: os 5 passos cumpridos.
- [ ] Teste focado + `npm test` executados (ou dizer por que não).
- [ ] Ganho de performance sustentado por medição, ou explicitamente marcado
      como "esperado, não medido".

## 8. Formato do resumo final

1. **Achados** — problema, evidência, impacto.
2. **Mudanças propostas** — o que e por quê vale a pena.
3. **Implementação** — arquivos e mudanças relevantes.
4. **Validação** — testes/checagens/cenários/medições realmente feitos.
5. **Impacto** — separar o **medido** do **esperado** (com números antes/depois).
6. **Riscos restantes** — compatibilidade, o que não foi testado, o que ficou
   adiado (com o motivo).
