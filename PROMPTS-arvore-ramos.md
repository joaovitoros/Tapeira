# Prompts de implementação — 2º botão + painel "Árvore de ramos"

Baseados no esboço aprovado (formato de **colunas magras lado a lado, grade de quadradinhos**,
sem conectores, com detalhes sob clique). Nada de barra de recursos.

Como usar: cole o **Prompt mestre** antes de cada prompt, ou use cada prompt sozinho
(eles já repetem o essencial). Rode um por vez e valide antes de seguir.

Referência visual: `esboco-arvore.html` (arquivo descartável, só inspiração de layout).

---

## Prompt mestre (prefixo — cole antes dos outros)

```
Você trabalha no TAPeira, um jogo incremental em JavaScript PURO (script clássico).
Regras OBRIGATÓRIAS (leia `AGENTS.md`):
- NUNCA use `import`/`export` nem `type="module"`. Tudo é global.
- Não reformate arquivos inteiros. Mudança incremental. `ui.js`/`sistema.js` têm fim de linha misto — não normalize.
- A lógica vai no arquivo do domínio certo. Interface do painel de skills fica em `script/ui-skills.js`.
- Não adicione `onclick` inline; use `addEventListener` + `data-*`.
- Timers: se criar, guarde em variável e cancele em reset/menu/pausa/fim de evento.
- Código web não pode usar `require`/`fs`/Electron direto.
- Rode `npm test` no fim. Se não conseguir validar algo, diga no resumo.
Esta mudança é SÓ de interface: NÃO crie campo persistente (nada de save/ValidarSave/Resetar).
```

---

## Prompt 1 — Segundo botão "Ramos" (Fase 1)

```
Objetivo: criar um SEGUNDO botão de skill que abre um painel NOVO e separado ("Árvore de ramos"),
sem mexer no painel atual (`#skillUpgradeModal`).

Faça:
1) `Caverna.html`, dentro do `<div id="container-Botoes">`, logo DEPOIS do `<button id="btnSkills">`
   (perto da linha 284), adicione um botão:
   <button type="button" id="btnRamos" class="btn-Padrao screen-nav-button" aria-expanded="false">
     <span class="screen-nav-icon" aria-hidden="true">🌿</span>
     <span>Ramos</span>
   </button>
   (NÃO adicione em `index.html`: o menu não tem a barra de botões.)

2) `script/ui.js`:
   - Em `syncScreenButtons()` (~linha 269), inclua na lista de estados:
     ["btnRamos", !!document.getElementById("ramosTreeModal")]
   - No handler de clique delegado (~linha 901, junto do `#btnSkills`), adicione:
     if (e.target.closest("#btnRamos")) { UI.toggleRamosTreePanel(); return; }

3) `css/estilos.css`: inclua `#btnRamos` na regra de altura/fonte, junto de
   `#btnStatus, #btn-Loja, #btn-Config, #btn-Formigas, #btnSkills` (~linha 1627).

4) `script/keymap.js` (~linha 170): adicione `"ramosTreeModal"` à lista de modais
   removidos no Esc, junto de `"skillUpgradeModal"`.

Critérios de aceite:
- O botão aparece ao lado de "Skills", com o mesmo estilo dos outros.
- `aria-expanded`/classe `is-active` ficam marcados quando o painel novo está aberto.
- Sem erros no console antes de o painel existir (o toggle pode ser implementado no Prompt 2;
  se `UI.toggleRamosTreePanel` ainda não existir, crie um stub e complete depois).
```

---

## Prompt 2 — Painel "Árvore de ramos" (JS)

```
Objetivo: implementar `UI.showRamosTreePanel()` e `UI.toggleRamosTreePanel()` em
`script/ui-skills.js`, no mesmo `Object.assign(UI, { ... })` já existente. NÃO altere
`showSkillUpgradePanel()` nem nenhuma função existente.

Layout (do esboço): colunas magras LADO A LADO, uma por skill, com grade de "quadradinhos"
(3 por linha). Sem linhas/conectores. Descrições: sempre visíveis nas opções disponíveis;
nas já escolhidas/travadas só aparecem ao clicar no ícone.

Estrutura:
- Overlay `id="ramosTreeModal"`, classe `ant-collection-overlay ramos-tree-overlay`,
  role="dialog", aria-modal="true", aria-labelledby="ramos-tree-title".
- Painel `.ramos-tree-panel` com header fixo: título "Árvore de ramos" (#ramos-tree-title),
  botão "✓ Feitas" (id `ramos-tree-feitas`, aria-pressed) e fechar `.ant-collection-close`.
  NÃO inclua o botão "olho".
- Única área de rolagem `.ramos-tree-scroll` (overflow auto nos dois eixos).
- Para cada skill de `SKILLS_UPGRADE` monte uma coluna `.ramos-col` com `--acento` por skill
  (ex.: damage #e0463c, electric #c9a227, gold #e0a72e, escape #4a9be0, frenzy #9b6be0).
  Cabeçalho `.ramos-col__cabecalho` = botão colapsável (nome + resumo + chevron).
  Corpo `.ramos-col__corpo` = grid de células.

Células (reaproveite as leituras já existentes — NÃO crie regra nova):
- Níveis: agregue os níveis em faixas (ex.: "Nv 1–5", "Nv 6", "Nv 7+") usando
  `NivelDaSkill(skill.id)` e `skill.maximo`.
- Perk: use `PERKS` + `window[perk.varName]` e `PontosPerkDisponiveis()`.
- Ramos: use `RAMOS_SKILL` + `RamoEscolhido(skill.id)` e `RAMO_NIVEL_ESCOLHA`/`RAMO_NIVEL_CONCLUSAO`.
- Descrição de efeito: reutilize `DescricaoEfeitoSkill()` / `perk.efeito` / `ramo.efeito5`/`efeito10`.
- Ícones: `ICONE_SKILL[skill.id]` para a raiz; glifos para perk/ramos como no esboço.

Estados (classes): `--on`, `--max`, `--travado`, `--selado`, `--pronto`, `--proximo`.
Prioridade do estado por célula: travado (piso > andar) > maximo > pronto/proximo > on; ramo não escolhido = selado.

Comportamento:
- "✓ Feitas": colapsa/expande todas as colunas das skills concluídas (`bloco--completo`).
  Estado num objeto `ramosTreeSecoes` (só em memória; NÃO persista).
- Clicar no cabeçalho da coluna abre/fecha aquela coluna (aria-expanded).
- Clicar numa célula que representa uma AÇÃO disponível (nível pronta, perk pronto, ramo escolhível)
  chama a MESMA função existente — `EvoluiSkill(id)` / `CompraPerk(skillId)` /
  `EscolheRamoSkill(skillId, ramoId)` — e, se retornar true, re-renderiza com `showRamosTreePanel()`.
- Células de opção disponível (prontas/proximo) nascem com detalhes abertos e não fecham.
- Células já escolhidas (on/max) e travadas/seladas começam com detalhes FECHADOS e alternam com clique.
- Ao abrir: abra a coluna da próxima escolha, role até ela (`scrollIntoView inline:"center"`)
  e dê foco no primeiro controle pendente. Não dar destaque a um único ramo (o foco é a decisão).
- Fechar: remove o overlay, chama `this.syncScreenButtons()` e devolve o foco pro `#btnRamos`.
  Esc fecha; clique fora fecha; Tab circula entre controles do modal (copie o padrão do painel atual).
- Sem timers novos. Se criar algum, guarde e cancele.

Critérios de aceite:
- Abre pelo 2º botão e pelo `UI.toggleRamosTreePanel()`.
- Nº de colunas = `SKILLS_UPGRADE.length`.
- Comprar nível/perk/ramo reflete na hora (re-render) e usa as funções existentes (nada duplicado).
- Nenhuma regra de progressão foi reescrita.
```

---

## Prompt 3 — CSS do painel novo

```
Objetivo: estilizar o painel da "Árvore de ramos" em `css/estilos.css`, ANEXANDO um bloco novo
perto do bloco do painel de skills (~linha 5776), sem alterar as classes existentes e sem
normalizar o arquivo. Siga o esboço `esboco-arvore.html` (é a referência visual).

Crie as classes (prefixo `ramos-tree-` / `ramos-col-` / `ramos-cel-`):
- Overlay: padding seguro (safe-area) como `.skill-upgrade-overlay`.
- Painel: flex column, `overflow:hidden`, largura `min(1180px, 97vw)`, altura máx 94vh.
- `.ramos-tree-scroll`: única área rolável (overflow:auto).
- `.ramos-tree-cols`: `display:flex; flex-direction:row; align-items:flex-start; gap:10px; min-width:max-content`
  (colunas magras lado a lado; rola para o lado quando não couber).
- Coluna: `width:196px; flex:0 0 auto; border-radius:12px; overflow:hidden; --acento:...`.
- Cabeçalho da coluna: barra colorida com `linear-gradient(180deg, color-mix(in srgb, var(--acento) 45%, #0d1826), #0d1826)`
  e `border-bottom:2px solid var(--acento)`; texto maiúsculo.
- Corpo: `display:grid; grid-template-columns:repeat(3,1fr); gap:7px; padding:10px`.
- Célula: coluna centralizada; `.tile` quadrado (`aspect-ratio:1`) com borda/fundo.
- Estados: on (cor da coluna), max (verde #9ff5c0), travado (grayscale + 🔒), selado (vermelho + ✕),
  pronto (brilho), proximo (dourado #ffd36b + animação `pulso`).
- Célula aberta (`.ramos-cel--aberta`): ocupa `grid-column:1/-1`, vira "ícone + texto" (row),
  tile fixo ~38px, descrição visível.
- Descrição escondida por padrão (`.ramos-cel__desc{display:none}`); visível com `.ramos-cel--aberta`.
- Divisores de grupo ("Níveis", "Ramos") ocupando a linha toda, como no esboço.
- Cabeçalho: manter área de toque ≥48dp no botão de fechar.

Responsividade: manter as colunas com largura fixa e rolagem horizontal (não encolher).
Teste visual em 320/360/700px e garanta `overflow-x:hidden` no container que não deve vazar.
```

---

## Prompt 4 — Testes e validação

```
Objetivo: cobrir o novo botão e o novo painel.

1) `tests/regression.test.cjs` (~linha 196): inclua `"btnRamos"` na lista de ids verificados.

2) Crie/estenda um teste focado (modele em `test-skill-panel.html`, servido por Playwright via
   `npm test`) checando:
   - `#btnRamos` existe e, ao clicar, abre `#ramosTreeModal`.
   - nº de colunas == `SKILLS_UPGRADE.length`.
   - existe ao menos uma célula pronta/próximo com descrição VISÍVEL por padrão.
   - clicar numa célula fechada (já escolhida ou travada) revela a descrição; clicar de novo esconde.
   - "✓ Feitas" colapsa/expande as colunas concluídas.
   - fechar devolve o foco para `#btnRamos`; Esc fecha.
   - um clique numa opção disponível chama a regra existente (mocke `EvoluiSkill`/`CompraPerk`/
     `EscolheRamoSkill` e verifique que foram chamadas + re-render).

3) Rode `npm test` (na 1ª vez, `npx playwright install chromium`).
   Como `estilos.css` é compartilhado com o menu, rode também `npm run prepare:web`
   (Windows/PowerShell) e confirme que nada quebrou.

Relate no fim: arquivos alterados, testes executados e o que NÃO foi possível validar
(ex.: Electron/Android não rodam neste ambiente).
```

---

## Prompt 5 — Checklist de encerramento

```
Antes de dizer que acabou, confira:
- [ ] Lógica no arquivo certo (`ui-skills.js`), sem import/export.
- [ ] `#btnRamos` só em `Caverna.html` (menu não tem a barra de botões).
- [ ] `syncScreenButtons`, handler de clique e lista do Esc atualizados.
- [ ] Nenhum campo persistente criado → não toquei em `Salvar`, `CriarObjetoSave`,
      `Carregar`, `ValidarSave` nem `Resetar`.
- [ ] Sem timers órfãos.
- [ ] `npm test` verde; `npm run prepare:web` sem quebrar.
- [ ] `git status` conferido; não sobrescrevi trabalho do usuário.
- [ ] Painel antigo (`#skillUpgradeModal`) intacto e funcional.
```

---

## Fora de escopo (não fazer)
- Barra de recursos/contadores e botões "+" (a imagem era só inspiração).
- Remover ou reescrever o painel de skills atual.
- Novas skills, rebalanceamento ou compra de recursos.

## Detalhe de save
Esta feature é 100% interface. **Não cria campo persistente.** Se em algum momento você decidir
persistir o estado "colapsado/aberto" das colunas, aí sim siga os 5 passos do `AGENTS.md`
(var global + `Salvar` + `CriarObjetoSave` + `Carregar` com `?? default` + `ValidarSave` + whitelist
se não-numérico + `Resetar` se for por run). Enquanto for só memória, ignore.
