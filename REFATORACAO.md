# Estado da refatoração — TAPeira

Este arquivo registra **onde a reorganização parou** e o que falta, para que
qualquer pessoa (ou sessão futura) continue do ponto certo. As regras de
contribuição continuam no `AGENTS.md`.

## Objetivo

Reduzir o acoplamento dos arquivos monstro (`script.js`, `sistema.js`,
`ui.js`, `loja.js`) separando um domínio por arquivo, **sem alterar
comportamento nem o formato dos saves**, e mantendo o jogo funcionando em
navegador, Windows (Electron) e Android (Capacitor).

## Convenções adotadas (mantê-las nos próximos passos)

- Scripts clássicos carregados no HTML, em ordem explícita — sem
  `import`/`export` nem `type="module"`.
- As APIs globais existentes (`Bater`, `Carregar`, `CompraDano`, `UI.*`...)
  continuam com o mesmo nome; os consumidores não mudaram.
- A interface usa um único objeto `UI`: os fragmentos adicionam métodos com
  `Object.assign(UI, {...})`, então `this` segue sendo `UI`.
- Domínios novos ficam em `script/<dominio>.js` e entram nas duas páginas
  (`index.html` e `Caverna.html`) na ordem correta.
- A extração é por **corte de blocos**, nunca reescrita: o código movido é
  byte a byte o original (só mudou de arquivo).

## Mapa atual de módulos (`script/`)

### Núcleo / ciclo de vida

| Arquivo | Linhas | Conteúdo |
| --- | ---: | --- |
| `sistema.js` | 473 | Menu, configurações, desktop, baú dourado (tick), inicialização e `Resetar` |
| `script.js` | 579 | Estado global, Conhecimento Mug, loja (variáveis), fundo da caverna, avanço de inimigos, portões e `VoltaAndar` |
| `persistencia.js` | 320 | Exportar/importar o save em arquivo JSON (`Salvar`, `CarregarArquivo`) |
| `persistencia-carregar.js` | 336 | `Carregar`: montagem do estado a partir de um save |
| `persistencia-autosave.js` | 293 | Auto save local (`CriarObjetoSave`, `AutoSaveLocal`, `CarregarAutoSave`, `LimparAutoSave`) |
| `validacao-save.js` | 392 | `ValidarSave` e migração/compatibilidade de saves |
| `progresso-offline.js` | 259 | Simulação e entrega do progresso offline |
| `audio.js` | 217 | Sons, ambiente sintetizado e volumes |

### Regras de jogo

| Arquivo | Linhas | Conteúdo |
| --- | ---: | --- |
| `progressao.js` | 433 | XP, níveis, skills, perks e habilidades de combate |
| `batalha.js` | 483 | Ataque, dano, abate, avanço e fuga |
| `eventos.js` | 615 | Os 7 eventos aleatórios |
| `missoes.js` | 167 | Missões normais e desafio |
| `conquistas.js` | 131 | Conquistas clássicas e comportamentais |
| `companheiros.js` | 296 | Criação, ticks e buffs dos companheiros |
| `recompensas.js` | 162 | Formigas, baús comum/dourado e recompensas |
| `automacao.js` | 292 | Auto-coleta, auto-compra e auto-gasto |
| `especializacoes.js` | 139 | As 5 especializações |
| `ramos.js` | 145 | Árvore de ramos por skill |
| `itens-build.js` | 198 | Itens de build (`window.Tapeira.ItensBuild`) |
| `gold.js` | 220 | `GoldNumber` e formatação de gold |
| `keymap.js` | 253 | Teclado, ataque segurando e pausa |
| `logs.js` | 36 | Histórico de mensagens (`Tapeira.Logs`) |

### Loja

| Arquivo | Linhas | Conteúdo |
| --- | ---: | --- |
| `loja.js` | 254 | Helpers (`N`/`GE`), navegação das 3 lojas, `CompraCM`, `PagaLoja` |
| `loja-patentes.js` | 180 | Tabela `ITENS_PATENTE` e regras de patente |
| `loja-compras.js` | 289 | Compras da loja de gold |
| `loja-esmeraldas.js` | 195 | Abertura e compras da loja de esmeraldas |
| `loja-preview.js` | 266 | Preview no hover/foco e hold-to-buy |

### Interface

| Arquivo | Linhas | Conteúdo |
| --- | ---: | --- |
| `ui.js` | 760 | Base do objeto `UI`: HUD, missões, mensagens, status, modais, animações e wrappers legacy |
| `ui-skills.js` | 519 | Painel de habilidades (nós, perks, ramos) |
| `ui-baus.js` | 396 | Baús, baú dourado e itens da build |
| `ui-telas.js` | 419 | Telas legacy (conquistas, missões, marcos, tutorial) |
| `ui-combate.js` | 265 | Dano/recompensa, inimigos e sprites |
| `ui-colecao.js` | 211 | Coleção de formigas e recompensas offline |

### Fora de `script/`

- `desktop/` — Electron (`main.cjs`, `preload.cjs`).
- `scripts/` — tarefas de build (preparação web, ícones, sprites).
- `tests/regression.test.cjs` — suíte principal (`npm test`).
- `test-*.js`, `test-*.html` — testes focados por funcionalidade.

## O que foi feito nesta reorganização

1. Suíte de regressão com `npm test` (34 testes) cobrindo menu, saves,
   importação de JSON, combate, missões, eventos, automação, companheiros,
   conquistas, progresso offline, builds e hit kill.
2. Extração, nesta ordem: áudio; validação e persistência de saves;
   progresso offline; missões; progressão (XP/skills/perks); conquistas;
   companheiros; recompensas; interface (`ui.js`); loja (`loja.js`).
3. `AGENTS.md` passou a descrever os limites de cada módulo.
4. `persistencia.js` dividido em três: exportação/importação de arquivo
   (`Salvar`, `CarregarArquivo`), montagem do estado (`persistencia-carregar.js`)
   e auto save local (`persistencia-autosave.js`).
5. Cobertura dos seis eventos restantes em `tests/regression.test.cjs`:
   chuva de meteoros, névoa, veia, inseto, fissura e emboscada (o comércio já
   tinha teste).
6. Painel de configuração migrado para `addEventListener` (`RegistraEventosConfig`
   em `sistema.js`, ligado no `DOMContentLoaded`): salvar/carregar, apagar save,
   zerar, importar JSON, volumes e tela — sem handlers inline no HTML.
7. Navegação lateral migrada para a delegação de clique já existente em
   `ui.js` (Status, Loja, Config, Formigas e Skills).
8. Painel de status migrado: baú dourado (coleta e info) em `ui-baus.js` e
   auto-coleta em `automacao.js`, ligados no `DOMContentLoaded`.
9. Habilidades de combate migradas: os 4 botões (`skill-electric`, `skill-gold`,
   `skill-escape`, `skill-frenzy`) registrados em `progressao.js`.
10. Inimigos migrados: os 4 cliques (`inimigo1..4` → `Bater(id, true)`)
    registrados em `batalha.js`.
11. Loja migrada para `data-*` + `addEventListener`: compras (`data-compra`,
    `data-compra-cm`), navegação/fechar (`data-loja`) e cartões de
    especialização (`data-esp`) em `loja.js`; o preview e o hold-to-buy
    (`loja-preview.js`) e a auto-compra seletiva (`automacao.js`) passaram a
    ler `data-compra` em vez do `onclick`; a auto-compra também foi ligada no
    `change` do checkbox.
12. Bug de save reproduzido e corrigido: `PontosPerkDisponiveis`
    (`progressao.js`) não somava `perkFrenesi`, então o Toque Frenético podia
    ser comprado sem gastar o pool e o `ValidarSave` rejeitava saves legítimos.
    Agora o frenesi conta nos pontos e o validador tolera o excedente histórico
    (até `perkFrenesi`) — saves da época do bug continuam carregando.
13. Handlers inline restantes migrados: painel de reset (`#manterAndar` e
    `#btnAndar` em `script.js`), botão de pausa (`keymap.js`) e menu
    (`index.html`, em `sistema.js`). Os dois `onload` do `<body>` viraram um
    listener de `load` por página em `sistema.js`. Não sobrou handler inline
    vivo no HTML (resta só um `<input>` comentado e inerte).
14. Handlers inline gerados por JS migrados: painel de evento e modais de
    reset, info e tutorial do Comp1 usam `data-*` com delegação no `document`;
    `gameModalClose`/`modal` (`ui.js`), o baú (`ui-baus.js`) e a habilidade
    (`ui-combate.js`) viraram `addEventListener`. Não sobrou handler inline
    vivo em JS (só `xhr.onload`/`reader.onload`, que não são de DOM, e um
    trecho comentado).
15. `Salvar` e `CriarObjetoSave` unificados: `Salvar` reusa
    `CriarObjetoSave(false)` (o auto save usa `CriarObjetoSave()`, com os
    campos offline). Some a duplicação do objeto de save e o `getRawGold`
    morto que estava em `Salvar`.
16. Carregamento consolidado numa **lista única**: `scripts/script-manifest.js`
    define a ordem dos scripts de cada página; `scripts/sync-scripts.js`
    (`npm run sync:scripts`) gera o bloco entre os marcadores
    `<!-- scripts:start/end -->` em `index.html` e `Caverna.html`; um teste
    garante que o HTML não saiu de sincronia.
17. Limpeza de assets: removida a duplicata **não referenciada**
    `imagens/imagens/` (−15,4 MB) e o `prepare-web.ps1` passou a limpar o
    destino antes de copiar, então o `www/` não acumula mais arquivos
    obsoletos (`www` de 61 → 37 MB).
18. Otimização de assets: PNGs reencodados **sem perda** (lossless,
    29,8 → 9,2 MB) e o mp3 de fundo de 320 → 128 kbps (6,6 → 2,6 MB). O `www`
    caiu de 61 → ~13 MB.
19. Bundle minificado no `www`: `scripts/prepare-bundle.js` concatena os
    scripts na ordem do `script-manifest.js` e minifica com esbuild **sem
    renomear identificadores** (o jogo acessa globais por string). O
    `prepare:web` passou a gerar `bundle-caverna.js` (300 KB) e
    `bundle-index.js` (230 KB) — as 35 requisições da caverna viram 3 (bundle +
    `android-save` + `dev-tools`). A fonte e a suíte seguem com os scripts
    individuais; `test-bundle.js` valida o bundle sobre o `www`.

Resultado: nenhum arquivo passa de 800 linhas (antes `ui.js` tinha ~2.960 e
`script.js`/`sistema.js` mais de 1.800 cada).

## Próximos passos sugeridos (em ordem de valor)

Os itens do plano original (handlers inline, bug de save, consolidação do
carregamento e unificação do save) estão concluídos. Candidatos naturais agora:

1. **Cachear `getElementById` e consolidar ticks** (1s/250ms) nos laços.
2. **Assets restantes:** tirar as folhas de arte-fonte do pacote
   (`Grade de Ícones`, `Fauna Fantastica`, `personagens.png`) e otimizar os
   sprites gerados pelo build — `prepare-animation-sprites.ps1` os recria sem
   otimização (~711 KB).

## Como validar

```powershell
npm test                     # suíte principal (61 testes)
npm run test:auditoria       # auditoria (28 testes)
node test-logs.js            # tela de logs
node test-itens-build.js     # itens de build (roda sobre www/)
npm run prepare:web          # sincroniza www/ para web/Android
```

Rode `npm run prepare:web` antes dos testes focados que abrem `www/`.

## Pendências conhecidas

- **Fim de linha misto**: alguns arquivos ainda misturam `\r\n` e `\n` — no
  índice: `Caverna.html`, `css/estilos.css`, `script/ui-skills.js` e
  `tests/regression.test.cjs` (no worktree, mais alguns); `ui.js`/`sistema.js`
  já estão uniformes. Ao editar, **não** "normalizar" o arquivo inteiro num
  commit único — gera diff gigante sem benefício (confira com
  `git ls-files --eol`).
- `script.js` ainda concentra o estado global e as variáveis da loja; mover
  variáveis exige conferir save, reset e validação em conjunto.
- ~~O save incompatível preserva o auto save local e mostra o motivo~~ —
  **resolvido**: era o `perkFrenesi` fora do cálculo de pontos (item 12).
- **`FormatarGold` sem fallback científico** (achado à parte, não misturado): é
  usado só no status/cartão de batalha (dano, DPS, crítico) e, além do último
  sufixo (~e+150), imprimiria um número gigante + "Noqig" em vez de notação
  científica — diferente do `FormatGold`/`formatNumber`. Baixo risco hoje, mas
  vale unificar.
- **Customização (Aparência) — slot de CHAPÉUS pronto**: base sem chapéu
  (`imagens/personagens/player.png`) + camada `.player__chapeu` dentro da caixa
  do player + 8 chapéus (`imagens/personagens/chapeus/`) + seção "Aparência" na
  Casa + campo `chapeuEquipado` no save. Base = 1º sprite da "Folha de sprites do
  mineiro toupeira" (toupeira padrão, SEM a faixa nos olhos). Âncora de
  referência: `x=50%` `y=30%` `largura=53%` (canvas 1166x1536). **Próximos slots** (cachecol, capa,
  mochila, ferramenta, escudo, cinto): as peças já estão fatiadas em
  `imagens/customizacao/pecas/` (78 peças, sem xadrez) — falta **calibrar a
  âncora de cada peça** (trabalho por peça; dá pra reaproveitar
  `scripts/testar-chapeus.js` trocando as imagens).
- **Teste de PvP `pvp fase 3` falhando** (na outra sessão, não na customização):
  a asserção que falha varia entre execuções (cartão assinado / toast "já
  usado") — `script/pvp-fantasma.js` e `tests/regression.test.cjs` estavam sendo
  editados em paralelo; provável WIP em andamento. Revalidar quando a outra
  sessão fechar.
- **Arte da customização**: as folhas vieram com o "transparente" PINTADO (xadrez).
  O fatiador (`scripts/fatiar-customizacao.js`) remove por flood-fill das bordas
  — funciona, mas se re-exportar com alfa real, o recorte fica ainda mais limpo.
