# Guia de arquitetura e contribuição — TAPeira

Jogo incremental (clicker) em JavaScript puro. O MESMO código roda em 3 lugares:
**navegador** (`index.html` + `Caverna.html`), **Windows** (Electron) e **Android** (Capacitor).
Toda mudança precisa continuar funcionando nos 3. Leia este arquivo inteiro antes de editar qualquer coisa.

---

## REGRA Nº 1 — NÃO USE MÓDULOS (ES modules). NUNCA.

O projeto carrega JavaScript como **scripts clássicos** (`<script src="...">`), em ordem fixa no HTML.

- ❌ NÃO escreva `import ...` nem `export ...`.
- ❌ NÃO adicione `type="module"` em nenhuma `<script>`.
- ✅ Tudo que você criar é uma função/variável **global**, visível para todos os arquivos.
- ✅ A ordem dos `<script>` no HTML define quem enxerga quem. Scripts que rodam antes definem coisas que os scripts depois usam.

Se você ignorar isso, o jogo quebra no navegador, no Electron E no Android ao mesmo tempo.

---

## ONDE CADA COISA FICA

### As duas páginas (você quase sempre vai editar as DUAS)

| Arquivo | O que é | O que carrega |
| --- | --- | --- |
| `index.html` | O **menu** | Um subconjunto dos scripts (NÃO tem missões, eventos, automação, especializações, ramos, FileSaver, validacao-save, persistencia\*, progresso-offline, dev-tools) |
| `Caverna.html` | O **jogo** (a tela da caverna) | TODOS os scripts |

Os scripts carregados no `<head>` de `Caverna.html`, nesta ordem (não mude a ordem):

```
break_infinity.min.js  →  sistema.js  →  audio.js  →  gold.js  →  keymap.js
→  script.js  →  progressao.js  →  conquistas.js  →  companheiros.js
→  recompensas.js  →  logs.js  →  ui.js  →  ui-skills.js  →  ui-colecao.js
→  ui-combate.js  →  ui-baus.js  →  ui-telas.js  →  missoes.js  →  batalha.js
→  loja.js  →  loja-patentes.js  →  loja-compras.js  →  loja-esmeraldas.js
→  loja-preview.js  →  FileSaver.js  →  eventos.js  →  automacao.js
→  especializacoes.js  →  ramos.js  →  itens-build.js  →  validacao-save.js
→  persistencia-carregar.js  →  persistencia-autosave.js  →  persistencia.js
→  progresso-offline.js
```

`dev-tools.js` é carregado NO FIM do `<body>` de `Caverna.html` (não no `<head>`).

### Dono de cada arquivo em `script/` (não coloque lógica no arquivo errado)

- `script.js` — estado global, variáveis da loja, Conhecimento Mug, fundo da caverna, avanço de inimigos, portões, `VoltaAndar`.
- `sistema.js` — menu, configurações, inicialização, `Resetar()`.
- `batalha.js` — ataque, dano, abate, avanço, fuga.
- `progressao.js` — XP, níveis, skills, perks, habilidades de combate.
- `eventos.js` — os 7 eventos aleatórios.
- `missoes.js` — missões normais e com desafio.
- `conquistas.js` — conquistas clássicas e comportamentais.
- `companheiros.js` — criação, ticks e buffs dos companheiros.
- `recompensas.js` — formigas, baús comum/dourado e recompensas.
- `automacao.js` — auto-coleta, auto-compra, auto-gasto.
- `especializacoes.js` — as 5 especializações (builds).
- `ramos.js` — árvore de ramos por skill.
- `itens-build.js` — itens de build.
- `gold.js` — `GoldNumber` e formatação de números grandes (`FormatGold`).
- `keymap.js` — teclado, ataque segurando, pausa.
- `logs.js` — histórico de mensagens.
- Loja: `loja.js` (navegação + `PagaLoja`) + `loja-patentes.js`, `loja-compras.js`, `loja-esmeraldas.js`, `loja-preview.js`.
- Save (3 arquivos): `persistencia.js` (export/import em arquivo: `Salvar`, `CarregarArquivo`), `persistencia-carregar.js` (`Carregar` — monta o estado a partir do save), `persistencia-autosave.js` (`CriarObjetoSave`, `AutoSaveLocal`, `CarregarAutoSave`, `LimparAutoSave`), e `validacao-save.js` (`ValidarSave`).
- Offline: `progresso-offline.js`.
- Interface: `ui.js` (o objeto `UI`) + os fragmentos `ui-skills.js`, `ui-colecao.js`, `ui-combate.js`, `ui-baus.js`, `ui-telas.js`.

### Outras pastas (NÃO edite como se fosse fonte)

- `www/` — **gerado** por `npm run prepare:web`. Não edite nada dentro dele.
- `dist/`, `android/`, `node_modules/` — saída de build / dependências. Não implemente funcionalidade web aqui.
- `desktop/` — Electron (`main.cjs`, `preload.cjs`). Código web não pode usar Node/Electron direto.
- `scripts/` — tarefas de build (PowerShell).
- `tests/` — suíte de regressão.

---

## COMO ADICIONAR UM ARQUIVO NOVO DE SCRIPT

1. Crie `script/nome-do-dominio.js` (sem `import`/`export`; funções globais).
2. Abra `Caverna.html` e adicione `<script src="script/nome-do-dominio.js"></script>` no `<head>`, **na posição certa** da lista acima (depois das dependências dele, antes de quem depende dele).
3. Se o código precisa rodar TAMBÉM no menu, adicione a MESMA linha em `index.html`. Se é só do jogo, adicione apenas em `Caverna.html`.
4. Rode `npm test` para garantir que não quebrou a ordem de carregamento.

---

## COMANDOS EXATOS

```powershell
npm install                     # uma vez só
npm test                        # suíte de regressão completa
npm run start:pc                # abre o jogo no Electron (desenvolvimento)
npm run build:pc                # gera o instalador .exe do Windows
npm run prepare:web             # gera a pasta www/ (roda PowerShell)
npm run android:init            # cria o projeto nativo Android (uma vez)
npm run android:debug           # gera o APK de teste
npm run android:open            # abre no Android Studio
```

### Testes — detalhes que uma IA costuma errar

- `npm test` = `node --test tests/regression.test.cjs`. Ele sobe um servidor HTTP local e roda **Chromium headless via Playwright**.
- **Na primeira vez** (ou se der erro de "browser not found"), rode antes: `npx playwright install chromium`.
- Para rodar **um único teste** (filtrar pelo nome): `node --test --test-name-pattern="combate" tests/regression.test.cjs`.
- Testes focados que abrem `www/` (ex.: `node test-itens-build.js`) exigem `npm run prepare:web` ANTES.
- `prepare:web` e os builds de Android usam **PowerShell** — rode no Windows.

---

## SAVE É CONTRATO PÚBLICO — SIGA OS 5 PASSOS, SEMPRE

Se sua funcionalidade adiciona um **campo persistente** (que sobrevive ao reset ou entre sessões), você é obrigado a tocar em 5 lugares. Se esquecer um, o jogo quebra no load ou perde dados.

1. **Declare a variável global** no arquivo do domínio (ex.: `var meuCampo = 0;`). Campos centrais ficam em `script.js`.
2. **Os DOIS builders de save** (cada um tem um objeto que lista TODOS os campos):
   - `Salvar()` em `script/persistencia.js` (o objeto `var save = {...}`);
   - `CriarObjetoSave()` em `script/persistencia-autosave.js`.
   - Adicione `meuCampo,` nos DOIS objetos.
3. **`Carregar()`** em `script/persistencia-carregar.js`: leia com valor padrão para save antigo, ex.: `meuCampo = save.meuCampo ?? 0;`. Saves antigos NÃO têm o campo — por isso o `??`.
4. **`ValidarSave()`** em `script/validacao-save.js` (função na linha ~66): valide o valor (inteiro? faixa?) e **rejeite lixo** com `throw new TypeError(...)`.
5. **`Resetar()`** em `script/sistema.js` (função na linha ~341): se o campo é **por run**, zere aqui. Se é **permanente** (atravessa o reset), NÃO zere — e documente isso num comentário.

⚠️ **PEGADINHA CRÍTICA:** no final de `ValidarSave` (linha ~424) há um loop que rejeita qualquer campo de **topo do save** que não seja número finito. Campos não-numéricos (arrays, objetos, strings) precisam ser adicionados à **whitelist** desse loop (atualmente `["saveFormat", "saveVersion", "exportedAt", "gold", "totalGold", "offlinePendingRewards", "conquistasComp", "melhorGoldRun", "autoItensLoja", "itensBuild", "bauBuildPendente", "opcoesBauBuild"]`). Se esquecer, TODO load de save falha.

Resumo do que pode quebrar se você não fizer tudo: save antigo morre no load, save novo é rejeitado pela validação, ou o campo vaza entre runs.

---

## TIMERS, EVENTOS E HANDLERS — REGRAS RÁPIDAS

- ❌ NÃO adicione `onclick`, `onload` etc. em HTML novo. ✅ Registre no JS com `addEventListener` e identifique ações com `data-*`. (O código antigo ainda tem alguns handlers inline; a migração para `addEventListener` está em andamento — não adicione novos.)
- Todo `setInterval`/`setTimeout` que você criar precisa ser **guardado numa variável** e **cancelado** em: reset, sair para o menu, pausa e fim de evento. Sem timer órfão.
- Se um tick/evento já existe que resolve o caso, NÃO crie polling novo.
- Para forçar/inspecionar eventos e estado, use o painel **dev-tools** (tecla **F2** na caverna). Ele tem botões para disparar os eventos e "hit kill". Os testes usam esse painel (`#game-dev-tools`).

---

## ISOLAMENTO DE PLATAFORMA

- Código web **não pode** chamar `require`, `fs`, `ipcRenderer` etc.
- Para salvar arquivo/resolução/fechar no desktop, use a ponte já pronta `window.tapeiraDesktop` (definida em `desktop/preload.cjs`), com fallback para navegador.
- Mantenha `contextIsolation: true` e `nodeIntegration: false` no Electron. Não mexa nisso.

---

## TESTES E VALIDAÇÃO

- Para qualquer mudança de regra/cálculo/save/progressão: adicione ou atualize um teste. NÃO confie só em inspeção visual.
- Teste o caminho normal E os limites (sem recurso, valor máximo, save antigo, elemento ausente).
- Rode `npm test`. Para mudanças em recursos compartilhados, rode também `npm run prepare:web` e confirme que nada quebrou.
- Se não conseguiu executar alguma validação, DIGA isso no resumo final.

---

## ESCOPO — O QUE NÃO FAZER

- Não reformate/reescreva arquivos grandes "só para arrumar". Mudança incremental.
- ⚠️ `ui.js` e `sistema.js` ainda podem ter **fim de linha misto** (`\r\n` e `\n`); os arquivos novos usam `\n`. NÃO normalize o arquivo inteiro — gera um diff gigante.
- Não faça refatorações fora do escopo. Achou um problema separado? Anote como sugestão, não misture na mudança.
- Antes de terminar, rode `git status` e NÃO sobrescreva alterações que o usuário já tinha.

---

## CHECKLIST FINAL (confira um por um antes de dizer que acabou)

- [ ] A lógica está no arquivo do domínio certo (veja a lista acima).
- [ ] Se adicionou script novo, ele entrou em `Caverna.html` (e em `index.html` se for compartilhado), na ordem certa.
- [ ] Sem `import`/`export` e sem `type="module"`.
- [ ] Se adicionou campo persistente: declarei a variável, atualizei os DOIS builders (`Salvar` em `persistencia.js` e `CriarObjetoSave` em `persistencia-autosave.js`), o `Carregar` (em `persistencia-carregar.js`, com `?? default`), o `ValidarSave` (validação + whitelist se for não-numérico) e o `Resetar` (se for por run).
- [ ] Timers têm limpeza no reset/menu/pausa/evento.
- [ ] Rodei `npm test` e passou.
- [ ] No resumo, listei arquivos alterados, testes executados e o que NÃO pude validar.
