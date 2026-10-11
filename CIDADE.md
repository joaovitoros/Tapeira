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
| **Cidade** (aba) | `maxAndar >= 80` | abre o "pós-especializações", sem competir com o meio-jogo (1–80 é denso) |
| 🏠 **Casa** | 80 | 1º prédio, no desbloqueio da Cidade |
| 🐜 **Fazenda de Formigas** | 85 | |
| 🛒 **Mercado** | 90 | |
| ⚙️ **Fábrica** | 100 | junto dos itens de build |
| 🔬 **Centro de Pesquisa** | 110 | |
| 💎 **Cristal central** | 120 | liga a Cidade à profundidade do reset |

> Os gates são por **andar máximo** (o padrão do jogo: skills, automação e especializações
> também usam `maxAndar`/`pisoDesbloqueio`). O mapa completo dos desbloqueios atuais está em
> `IDEIAS-FUTURAS.md`/histórico; a janela escolhida foi **80+**, que estava vazia.

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

### Fase 0 — Decisões (fechada)
- [x] Gates: **andar 80** para a Cidade; prédios em 85/90/100/110/120 (ver tabela acima).
- [x] Pesquisa de itens: **por item**.
- [x] Arte/UX do mapa: **cena em vila 2.5D** (perto da arte-base) — prédios em volta de uma
      **praça com fonte de cristal** (Casa no topo-centro; Mercado/Pesquisa nas laterais de
      cima; Fábrica/Fazenda embaixo), **banner-placa** com ícone acima de cada prédio,
      decoração (props de natureza/luz/estruturas, cristais e ursinhos passeando) e
      **hotspots** por prédio — responsivo (desktop e celular).

### Fase 1 — A aba "Cidade" + o mapa (sem mecânica nova)
- [x] `Caverna.html`: `#btnCidade` na `#container-Botoes` (ícone 🏘️) + `#container-Cidade`.
- [x] `script/ui-cidade.js` (novo): monta o mapa, hotspots e o **HUD compacto** (gold + andar).
- [x] Cada hotspot **abre um painel que já existe** (Mercado→Loja, Pesquisa→Ramos,
      Fazenda→Formigas, Casa→Status, Fábrica→Itens da build).
- [x] `ui.js`: entrar em `syncScreenButtons` / `closeOtherPanels` (1 painel por vez).
- [x] Gate: a aba **só aparece** com `maxAndar >= 80` (derivado, sem save).
- [x] CSS responsivo (validado 1400/1000/390; **celular intacto**).
- [x] Teste focado `test-cidade.js`: aba aparece no andar 80; hotspots abrem o painel certo;
      chão e props de decoração presentes; imagens carregam; mobile.
- [x] **Save: nenhum campo novo.**
- [x] **Decoração da cena** (extraída de `imagens/cidade/props 4/6/7/9.png` → `imagens/cidade/decor/`):
      chão, moitas/rochas/cogumelos, poste e lanternas penduradas, carrinho/barril e ursinhos
      passeando (2, em loop). Animações desligadas com `prefers-reduced-motion`.

### Fase 2 — Desbloqueio gradual dos prédios
- [x] Cada prédio com gate (tabela) e estado **"trancado"** (apagado + selo "🔒 Andar N";
      clicar avisa o requisito e não abre o painel). `GATES` em `ui-cidade.js`.
- [x] Teste: gates batem com a tabela (84/90/100/110) + trancado não abre.

### Fase 3 — 🏠 Casa
- [x] **Níveis de conforto** (10 níveis, pagos em CM): +6% de recompensa offline e
      +20 min de limite por nível. Aplicado num ponto único em `progresso-offline.js`
      (`MultiplicadorOfflineCasa`) e em `LimiteTempoOffline` (`CasaBonusTempoOfflineMs`,
      também refletido no limite que o `ValidarSave` aceita).
- [x] **Sala de Troféus**: exibe as conquistas comportamentais (`CONQUISTAS_COMP`);
      cada troféu exibido dá +2% de gold (ponto único em `AddGold`).
- [x] **Save** (5 passos): `casaNivel` + `trofeusExibidos` (bitmask). Permanentes —
      **não zeram no `Resetar`**.
- [x] Painel próprio (`script/casa.js` + `#casaModal`), aberto pelo prédio Casa.
- [x] Teste `test-casa.js`: multiplicadores, compra, troféus, gold, save/validação e reset.

### Fase 4 — 🐜 Fazenda de Formigas
- [x] **Produção passiva**: timer gera 1 formiga aleatória por ciclo, reusando o MESMO drop
      (`ConcedeFormigaColecao`). Nível (`fazendaNivel`, 0..10) encurta o intervalo (90 s → 36 s);
      a **Rainha** (`fazendaRainha`, 0..5) multiplica a produção (+30% por nível). Pagos em CM.
- [x] **Save** (5 passos): `fazendaNivel` + `fazendaRainha` (permanentes — não zeram no `Resetar`).
- [x] Painel próprio (`script/fazenda.js` + `#fazendaModal`), com Produção + Rainha + a coleção
      de formigas (reusa `UI.criaConteudoFormigas`). Timer gerenciado (load/reset/compra).
- [x] Teste `test-fazenda.js`: intervalos, multiplicador da Rainha, compras, produção (pausa),
      save/validação e reset.

### Fase 5 — 🔬 Centro de Pesquisa
- [x] **Pesquisa por item**: nível por item (pago em CM) que potencializa o efeito
      (+10%/nível) — aplicado num ponto único em `ItensBuild.mult` (só vale se você
      tiver o item).
- [x] **Análise de inimigos**: +10%/nível de dano contra um TIPO (comuns / guardiões,
      andares múltiplos de 10) — ponto único no combate (`batalha.js`).
- [x] **Save** (5 passos): `pesquisaItens` + `pesquisaInimigos` (objetos `{id: nível}`;
      whitelist + shape no `ValidarSave`). Permanentes — não zeram no `Resetar`.
- [x] Painel próprio (`script/pesquisa.js` + `#pesquisaModal`), aberto pelo prédio Pesquisa.
- [x] Teste `test-pesquisa.js`: bônus, custos, compras, save/validação e reset.

### Fase 6 — 🛒 Mercado
- [x] **Reputação**: nível (pago em CM) que dá -2% no preço da **Loja do Conhecimento**
      por nível (ponto único em `PrecoLojaCM`). **Save**: `reputacao` (permanente).
- [x] **Vender excedentes**: cópias extras dos itens da build (mantém 1 de cada) +
      formigas fora dos conjuntos de 5 → **gold** (escala com o andar).
- [x] Painel próprio (`script/mercado.js` + `#mercadoModal`), aberto pelo prédio Mercado.
- [x] Teste `test-mercado.js`: desconto aplica; venda credita e sobra só os conjuntos;
      save/validação e reset.
- [ ] (adiado) **Ofertas rotativas** (`ofertasDia`) — não entrou nesta rodada.

### Fase 7 — ⚙️ Fábrica
- [x] **Forja**: junta 2 cópias iguais em 1 "melhorada" (mesmo efeito, 1 slot a menos).
      O estado é da run (zera com a build). Save: `forja` (objeto `{itemId: nível}`; whitelist).
- [x] **Linha de montagem** (`fabricaNivel`, 0..10, pago em CM): +1 auto-compra por
      segundo cada nível (ponto único no `TickAutomacao`). Permanente.
- [x] Painel próprio (`script/fabrica.js` + `#fabricaModal`), aberto pelo prédio Fábrica.
- [x] Teste `test-fabrica.js`: forja preserva o efeito e libera slot; linha acelera;
      save/validação e reset.

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
