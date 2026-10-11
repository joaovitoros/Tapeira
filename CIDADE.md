# Cidade — hub de metaprogressão (plano de trabalho)

> Aba nova na barra de baixo (**Status · Loja · Feitos · Ramos · Cidade**). **Não substitui**
> a caverna: a run continua rodando em segundo plano enquanto o jogador está na Cidade.
> Tudo na Cidade é **complemento** de sistemas que já existem — **sem moedas novas**.

---

## Princípios

1. **Aba nova, não substituição.** A caverna continua sendo a tela principal; a Cidade é uma
   tela cheia que abre/fecha (a run segue tickando por baixo, igual Loja/Status já fazem).
2. **Complementos, não sistemas novos.** Cada prédio **aprofiunda** algo que já existe
   (offline, lojas, itens de build, automação, CM, skills/ramos, formigas, companheiros, run).
3. **Gastar o que já existe**: gold, CM, esmeraldas, itens de build, formigas. **Sem nova moeda.**
4. **Desbloqueio gradual**: a Cidade abre no **nível 50** e os prédios/funções destravam depois.
5. **Gates são derivados** (`nivelJogador` / `maxAndar`) — como `EspecializacaoDesbloqueada`.
   **Só os níveis de upgrade vão pro save.**

---

## Desbloqueio gradual (gates iniciais — ajustáveis)

| O quê | Gate | Observação |
| --- | --- | --- |
| **Cidade** (aba) | `nivelJogador >= 50` | o botão só aparece a partir daí |
| 🏠 **Casa** | (já no desbloqueio da Cidade) | 1º prédio, ensina o lugar |
| 🐜 **Fazenda de Formigas** | `nivelJogador >= 55` | |
| 🛒 **Mercado** | `nivelJogador >= 60` | |
| ⚙️ **Fábrica** | `nivelJogador >= 70` | |
| 🔬 **Centro de Pesquisa** | `nivelJogador >= 80` | |
| 💎 **Cristal central** | `nivelJogador >= 100` | liga a Cidade à profundidade do reset |

Dentro de cada prédio, as **funções** também destravam em degraus (ex.: Forja só depois de N
itens; Rainha só depois de N formigas; 2º nível de pesquisa, etc.).

---

## Prédios e complementos

| Prédio | Complementa | Função |
| --- | --- | --- |
| 🏠 **Casa** | `progresso-offline.js`, `conquistas.js` | **Níveis de conforto** → melhoram o offline (+% recompensa, cap maior, tempo mínimo menor); **Sala de Troféus** → bônus pequeno por conquista exibida |
| 🐜 **Fazenda de Formigas** | `recompensas.js` (formigas) | **Produção passiva**: timer gera **formigas aleatórias** sozinho, reusando o mesmo drop existente; **Rainha** multiplica a colônia |
| 🛒 **Mercado** | lojas, `itens-build.js`, formigas | **Vender duplicatas** (itens/formigas extras → gold/CM); **Reputação** → desconto nas lojas existentes; ofertas rotativas |
| ⚙️ **Fábrica** | `itens-build.js`, `automacao.js` | **Forja**: 2 itens iguais → 1 melhorado; **Linha de montagem** → acelera/amplia a auto-coleta/auto-compra |
| 🔬 **Centro de Pesquisa** | `itens-build.js`, combate, `progressao.js` | **Pesquisa por item**: níveis que **potencializam o efeito** do item (multiplicador em ponto único); **Análise de inimigos** → +% de dano contra um tipo; paga com **CM** |
| 💎 **Cristal** | run (`Voltar Andar`) | Quanto mais **fundo o reset**, mais a Cidade rende — sem virar moeda |

> Divisão limpa nos itens de build: **Fábrica = juntar/forjar** · **Pesquisa = potencializar**.

---

## Plano de trabalho

### Fase 0 — Decisões (rápida)
- [ ] Fechar a tabela de gates (níveis acima).
- [ ] Arte/UX do mapa: usar a imagem do hub como fundo + **hotspots** por prédio (botões
      posicionados) — responsivo.
- [ ] Confirmar: pesquisa de itens **por item** ou **geral** (decidir aqui).

### Fase 1 — A aba "Cidade" + o mapa (sem mecânica nova)
- [ ] `Caverna.html`: `#btnCidade` na `#container-Botoes` (ícone 🏘️) + `#container-Cidade`.
- [ ] `script/ui-cidade.js` (novo): monta o mapa, hotspots e o **HUD compacto** (gold + andar).
- [ ] Cada hotspot **abre um painel que já existe** (Mercado→Loja, Pesquisa→CM+Ramos,
      Fazenda→Formigas+Companheiros, Casa→Status, Fábrica→Automação).
- [ ] `ui.js`: entrar em `syncScreenButtons` / `closeOtherPanels` (1 painel por vez).
- [ ] Gate: a aba **só aparece** com `nivelJogador >= 50` (derivado, sem save).
- [ ] CSS responsivo (validar breakpoints do `AGENTS.md`, **celular intacto**).
- [ ] Teste focado `test-cidade.js`: aba aparece no nível 50; hotspots abrem o painel certo; mobile.
- [ ] **Save: nenhum campo novo.**

### Fase 2 — Desbloqueio gradual dos prédios
- [ ] Cada prédio com gate (tabela) e estado **"trancado"** mostrando o requisito.
- [ ] Teste: gates batem com a tabela.

### Fase 3 — 🏠 Casa
- [ ] Níveis de conforto (upgrades) aplicados no `progresso-offline.js` (ponto único).
- [ ] Sala de Troféus (bônus por conquista).
- [ ] **Save** (5 passos): `casaNivel`, `trofeusExibidos`.
- [ ] Teste: offline com/sem conforto; troféu aplica e persiste.

### Fase 4 — 🐜 Fazenda de Formigas
- [ ] Timer de produção (reusa o drop de formiga de `recompensas.js`) + **Rainha**.
- [ ] **Save**: `fazendaNivel`, `fazendaRainha`.
- [ ] Teste: gera formiga no ciclo; rainha multiplica; persiste; timer limpo no reset/pausa.

### Fase 5 — 🔬 Centro de Pesquisa
- [ ] Pesquisa por item (multiplicador no efeito do item) + Análise de inimigos.
- [ ] **Save**: `pesquisaItens`, `pesquisaInimigos`.
- [ ] Teste: pesquisa sobe o efeito; dano contra o inimigo analisado.

### Fase 6 — 🛒 Mercado
- [ ] Vender duplicatas (itens/formigas → gold/CM) + Reputação (desconto nas lojas).
- [ ] **Save**: `reputacao`, `ofertasDia`.
- [ ] Teste: venda credita certo; desconto aplica.

### Fase 7 — ⚙️ Fábrica
- [ ] Forja (2 iguais → 1 melhorado) + Linha de montagem (automação).
- [ ] **Save**: `fabricaNivel`, estado da forja.
- [ ] Teste: forja combina e melhora; automação acelera.

### Fase 8 — 💎 Cristal
- [ ] Ligação com a profundidade do reset.
- [ ] **Save**: `cristalNivel` (se necessário).
- [ ] Teste: reset mais fundo → mais rendimento.

---

## Contrato de save (para cada campo novo — sempre os 5 passos)
1. Declarar a variável global no arquivo do domínio.
2. `Salvar()` (`persistencia.js`) **e** `CriarObjetoSave()` (`persistencia-autosave.js`).
3. `Carregar()` (`persistencia-carregar.js`) com `?? default`.
4. `ValidarSave()` (`validacao-save.js`) + **whitelist** se for não-numérico.
5. `Resetar()` (`sistema.js`) — **NÃO zerar** o que é permanente da Cidade (documentar).

## Cuidados
- **Não quebrar a run**: a Cidade nunca pausa o jogo (só o menu de pause pausa).
- **Mobile**: 5 botões na barra + o mapa — validar 640×900, 850×1000, 800×450.
- **Balanceamento**: cada complemento aplica em **um ponto único** de fórmula (como
  patentes/perks) e com **teto explícito** — evitar explosão (aviso já existe pras formigas).
- **Timers**: todo `setInterval`/`setTimeout` novo guardado em variável e cancelado no
  reset / sair pro menu / pausa.
- **Sem `onclick` inline** em HTML novo (usar `addEventListener` + `data-*`).

## Definição de pronto (por fase)
- [ ] `npm test` (regressão) e `npm run test:auditoria` verdes.
- [ ] Teste focado da fase verde.
- [ ] Sem `import`/`export`; script novo registrado em `Caverna.html` **e** `index.html` (se
      compartilhado) + `scripts/script-manifest.js`.
- [ ] Validado visualmente (screenshots) nos breakpoints, **celular intacto**.
- [ ] `git status` conferido (não sobrescrever trabalho alheio).
