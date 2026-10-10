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
| `persistencia.js` | 798 | Exportar/importar JSON, `Carregar`, auto save local |
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

1. Suíte de regressão com `npm test` (20 testes) cobrindo menu, saves,
   importação de JSON, combate, missões, eventos, automação, companheiros,
   conquistas, progresso offline, builds e hit kill.
2. Extração, nesta ordem: áudio; validação e persistência de saves;
   progresso offline; missões; progressão (XP/skills/perks); conquistas;
   companheiros; recompensas; interface (`ui.js`); loja (`loja.js`).
3. `AGENTS.md` passou a descrever os limites de cada módulo.

Resultado: nenhum arquivo passa de 800 linhas (antes `ui.js` tinha ~2.960 e
`script.js`/`sistema.js` mais de 1.800 cada).

## Próximos passos sugeridos (em ordem de valor)

1. **Reduzir `persistencia.js` (798):** separar `Carregar` (montagem do
   estado) do auto save/exportação; é a área mais sensível a regressões,
   então exige cuidado e testes antes.
2. **Cobrir `eventos.js` (615):** faltam testes para chuva de meteoros,
   névoa, veia, inseto, fissura e emboscada (só o comércio está coberto).
3. **Reduzir handlers `onclick` no HTML:** migrar para `addEventListener`
   registrado no JavaScript, um painel por vez.
4. **Investigar o bug de save relatado:** importar JSON e "Salvar e voltar ao
   menu" foram testados e preservam o andar; o caso real ainda não foi
   reproduzido — se voltar a acontecer, é preciso o JSON do save problemático.
5. **Consolidar o carregamento:** hoje a ordem dos `<script>` é manual em
   duas páginas; uma lista única (gerador ou bundler com esbuild) evita
   esquecimento.

## Como validar

```powershell
npm test                 # suíte principal (20 testes)
node test-logs.js        # tela de logs
node test-itens-build.js # itens de build (roda sobre www/)
npm run prepare:web      # sincroniza www/ para web/Android
```

Rode `npm run prepare:web` antes dos testes focados que abrem `www/`.

## Pendências conhecidas

- `ui.js` e `sistema.js` ainda têm **fim de linha misto** (`\r\n` e `\n`);
  os arquivos novos usam `\n`. Ao editar, não "normalizar" o arquivo inteiro
  num único commit — gera diff gigante sem benefício.
- `script.js` ainda concentra o estado global e as variáveis da loja; mover
  variáveis exige conferir save, reset e validação em conjunto.
- O save incompatível agora preserva o auto save local e mostra o motivo,
  mas o caso original do usuário nunca foi reproduzido com o JSON real.
