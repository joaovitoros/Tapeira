---
name: Mudança TAPeira (fluxo completo)
description: Executar uma mudança de feature/regra/layout no jogo TAPeira ponta a ponta — arquivos certos, manifesto de scripts, teste focado e suíte completa, com as armadilhas de caminho UNC do Windows. Use para QUALQUER pedido de alteração no projeto (browser + Electron + Android), antes de mergulhar no código.
---

# Mudança TAPeira — fluxo ponta a ponta

Guia de execução para qualquer alteração no projeto. Complementa o `AGENTS.md`
(leia-o antes se for mudança grande). Foco aqui: **como rodar rápido e não
travar nas armadilhas do ambiente**.

## 0. Antes de mexer

- `git status` — anote alterações pré-existentes do usuário. Nunca sobrescreva.
- Identifique o **dono do arquivo** (lista no `AGENTS.md`). Lógica no arquivo
  errado vira dívida.
- Decide: o pedido é sobre **posição/layout** (use a skill `layout-visual`,
  que já traz o verificador visual e a varredura de tamanhos de tela),
  **regra/cálculo**, **save**, ou **script novo**?

## 1. Regras invioláveis (as que quebram 3 plataformas de uma vez)

- **Sem ES modules**: nada de `import`/`export`/`type="module"`. Tudo é global,
  carregado como `<script>` clássico em ordem fixa.
- **Sem handler inline**: nunca `onclick=`/`onload=` novo. `addEventListener` +
  identificação por `data-*`.
- **Timer precisa de dono**: todo `setInterval`/`setTimeout` guardado em
  variável e cancelado em reset/menu/pausa/fim de evento. Se já existe tick que
  resolve, não crie polling novo.
- **Sem Node/Electron no código web**: `require`/`fs`/`ipcRenderer` proibidos.
  Desktop usa `window.tapeiraDesktop` com fallback navegador.

## 2. Script novo — 4 passos (o 3º é o que esquecem)

1. Crie `script/<dominio>.js` (global, sem import/export).
2. Registre em **`scripts/script-manifest.js`** (fonte única da ordem) — no
   array de `Caverna.html`, e no de `index.html` se rodar também no menu.
3. Gere o HTML: `npm run sync:scripts`. **Não edite os `<script>` dos HTML na
   mão** — o teste de manifest compara HTML contra o manifesto e falha.
4. Rode o teste focado + `npm test`.

## 3. Rodar testes quando o projeto está em caminho UNC

**Problema**: o projeto vive em `\\wsl.localhost\Ubuntu\...`. `node`/`cmd` do
Windows não conseguem `chdir` pra lá (`npm test` morre com erro de UNC ou
`Cannot find module`). Node não existe dentro do WSL aqui.

**Workaround que funciona** (testado):

1. Copie o projeto pra `C:\Users\<user>\AppData\Local\Temp\opencode\<nome>`
   com `robocopy <src> <dst> /MIR /NJH /NJS /NDL /NFL /XD node_modules .git dist android www`.
   - `robocopy` retorna **exit 1 em sucesso** — não trate como erro.
2. `node_modules` é enorme demais pra copiar do UNC. Copie **só** o necessário
   pra Playwright: `robocopy <src>\node_modules\playwright <dst>\node_modules\playwright /E`
   e o mesmo para `playwright-core`.
3. Chromium já está cacheado em
   `C:\Users\<user>\AppData\Local\ms-playwright` — **não** rode
   `npx playwright install`.
4. Rode de lá: `cd <dst>; node --test --test-name-pattern="<filtro>" tests/regression.test.cjs`
   e depois o completo sem o pattern.
5. **Apague o dir temporário** ao fim.
6. No resumo final: **declane explicitamente** que a validação rodou numa cópia
   temporária, não no path vivo (o `AGENTS.md` exige dizer o que não pôde
   validar).

Teste de um caso só: `node --test --test-name-pattern="<trecho do nome>" tests/regression.test.cjs`.

## 4. Validação mínima

- Mudança de **regra/cálculo/save/progressão**: teste novo ou atualizado. Não
  confie em inspeção visual.
- Teste o caminho normal **e** os limites (sem recurso, valor máximo, save
  antigo, elemento ausente).
- Mudança em recurso compartilhado: rode também `npm run prepare:web` (PowerShell,
  só no Windows).

## 5. Escopo — não faça

- Não reformate arquivo grande "só pra arrumar" (diff gigante, risco de
  sobrescrever). Mudança incremental.
- Não normalise fim de linha de `ui.js`/`sistema.js` (mistura `\r\n`/`\n` de
  propósito hoje).
- Refatoração fora do escopo: anote como sugestão, não misture.

## 6. Resumo final (obrigatório)

Liste: (a) arquivos alterados, (b) testes executados e resultado, (c) o que
**não** pôde validar (ex.: "rodei em cópia temporária por causa do UNC").
