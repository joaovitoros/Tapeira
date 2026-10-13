# TAPeira

> Uma aventura sob a montanha.

**TAPeira** é um jogo incremental/idle ("clicker") em que você explora uma caverna,
derrota os **Mugs** e fortalece sua equipe. O mesmo código roda em três plataformas:
**navegador**, **Windows** (Electron) e **Android** (Capacitor).

## Descrição

Você começa no primeiro andar da caverna, golpeando inimigos com cliques e melhorando
seu personagem ao longo da jornada. A progressão combina dano por clique, dano
automático, companheiros e uma loja de melhorias, com um ciclo de *reset* ("Voltar
andar") que transforma o andar alcançado em **Conhecimento Mug (CM)** — um
multiplicador permanente que acelera as próximas runs.

### Recursos

- **Combate** — ataque por clique e dano automático, dano crítico, corrente elétrica
  (dano encadeado) e cronômetro de fuga.
- **Companheiros** — aliados que geram dano, gold e XP por segundo.
- **Progressão** — XP, níveis e pontos para melhorar habilidades de combate, perks e
  uma **árvore de ramos** (escolhas mutuamente exclusivas por skill).
- **Loja** — lojas de gold e de esmeraldas, **patentes** que estendem o teto dos itens,
  **especializações** (builds com trade-offs) e compra por manter pressionado
  (*hold-to-buy*).
- **Eventos aleatórios** — 7 tipos: Comércio, Chuva de meteoros, Névoa do Conhecimento,
  Veia de esmeralda, Inseto fugaz, Fissura temporal e Emboscada.
- **Missões** — missões normais e missões com desafio ("sem gold", "sem habilidades",
  "contra o tempo").
- **Conquistas** — clássicas (estatísticas) e comportamentais (recompensam estilo de
  jogo, com bônus permanentes).
- **Coleção de formigas** — inimigos a partir do andar 20 podem deixar formigas de
  cinco cores, cada conjunto com bônus permanente.
- **Baús e recompensas** — baús comuns, baú dourado (bônus por tempo) e baús de build.
- **Marcos** — desbloqueios e recompensas por andar (a cada 10 andares, portões de
  reset, etc.).
- **Progresso offline** — o jogo simula sua ausência e entrega as recompensas ao
  voltar, com **bônus de retorno** para quem fica tempo longe.
- **Automação** — auto-coleta de baús, auto-compra na loja e auto-gasto de pontos
  (desbloqueáveis por andar).
- **Save** — salvamento automático local e exportação/importação em JSON, com
  compatibilidade entre plataformas e com saves antigos.

## Requisitos

- **Node.js LTS** e **npm**.
- **Windows** para gerar o instalador `.exe`.
- **Android SDK** (com uma plataforma Android instalada) e **JDK 21** configurado no
  `JAVA_HOME` para os builds de Android. Android Studio é opcional para os builds por
  linha de comando.

## Instalação

Na raiz do projeto, instale as dependências uma única vez:

```powershell
npm install
```

## Executando em desenvolvimento

Para abrir o jogo no **Windows** (Electron):

```powershell
npm run start:pc
```

No **navegador**, basta abrir `index.html` (menu) ou `Caverna.html` (a caverna).
Para testes focados que abrem a versão web, rode antes o `prepare:web` (veja
[Testes](#testes)).

### Docker

Para servir o jogo em um contêiner nginx (sem Node/Electron):

```bash
docker compose up -d --build
```

Abra <http://localhost:8080/>. Veja [`DOCKER.md`](DOCKER.md) para detalhes e
endurecimento da imagem.

## Builds

### Windows

```powershell
npm run build:pc
```

Gera o instalador x64 em `dist/pc`. O instalador cria atalhos no menu Iniciar e na
área de trabalho. No aplicativo, **Configurações** permite escolher a resolução da
janela e ativar tela cheia.

### Android

Gere o projeto nativo uma vez:

```powershell
npm run android:init
```

Para sincronizar as alterações web e gerar um APK de teste:

```powershell
npm run android:debug
```

O APK de teste fica em `android/app/build/outputs/apk/debug/app-debug.apk`. Para abrir
o projeto no Android Studio:

```powershell
npm run android:open
```

O comando `android:release` gera um APK sem assinatura de distribuição; para publicar,
configure uma chave de assinatura no Android Studio/Gradle.

### Web

A pasta `www/` é gerada e atualizada por:

```powershell
npm run prepare:web
```

Ela é usada como fonte para web e Android — não edite as cópias dentro de `www/`.

## Testes

A suíte principal usa `node:test` e cobre menu, saves, importação de JSON, combate,
missões, eventos, automação, companheiros, conquistas, progresso offline, builds e
hit kill:

```powershell
npm test
```

Há também testes focados por funcionalidade (`test-*.js` e páginas `test-*.html`),
como `node test-logs.js` e `node test-itens-build.js`. Rode `npm run prepare:web`
antes dos testes focados que abrem `www/`.

## Estrutura do projeto

```
.
├── index.html            # Página do menu
├── Caverna.html          # Página da caverna (o jogo)
├── css/                  # Estilos
├── script/               # Regras do jogo e interface (scripts clássicos)
├── imagens/              # Sprites, ícones e fundos
├── media/                # Sons e ambiente
├── desktop/              # Integração com Electron (main.cjs, preload.cjs)
├── scripts/              # Tarefas de build e preparação
├── assets/               # Ícone do instalador
├── tests/                # Suíte de regressão (npm test)
├── AGENTS.md             # Guia de arquitetura e contribuição
├── BUILDING.md           # Comandos de execução e build
├── REFATORACAO.md        # Estado da reorganização em módulos
└── IDEIAS-FUTURAS.md     # Roadmap e histórico de features
```

### Mapa de módulos (`script/`)

Os scripts são carregados como scripts clássicos, em ordem explícita no HTML — sem
`import`/`export`. A interface fica no objeto `UI`, e os domínios são separados por
arquivo.

| Área | Arquivos |
| --- | --- |
| Núcleo / ciclo de vida | `sistema.js`, `script.js`, `persistencia.js`, `validacao-save.js`, `progresso-offline.js`, `audio.js` |
| Regras de jogo | `progressao.js`, `batalha.js`, `eventos.js`, `missoes.js`, `conquistas.js`, `companheiros.js`, `recompensas.js`, `automacao.js`, `especializacoes.js`, `ramos.js`, `itens-build.js` |
| Gold e entrada | `gold.js`, `keymap.js`, `logs.js` |
| Loja | `loja.js`, `loja-patentes.js`, `loja-compras.js`, `loja-esmeraldas.js`, `loja-preview.js` |
| Interface | `ui.js`, `ui-skills.js`, `ui-colecao.js`, `ui-combate.js`, `ui-baus.js`, `ui-telas.js` |

## Roadmap

As ideias e evoluções futuras estão registradas em [`IDEIAS-FUTURAS.md`](IDEIAS-FUTURAS.md),
incluindo o histórico de features já implementadas e as pendências em aberto.

## Contribuindo

Contribuições são bem-vindas. Antes de mexer no código, leia:

- **[`AGENTS.md`](AGENTS.md)** — regras de arquitetura e contribuição (separação de
  domínio e interface, formato de carregamento de scripts, tratamento do save, testes).
- **[`BUILDING.md`](BUILDING.md)** — comandos de execução e build por plataforma.
- **[`REFATORACAO.md`](REFATORACAO.md)** — estado da reorganização em módulos e os
  próximos passos.

Pontos essenciais:

- Não introduza `import`/`export` nem `type="module"`: as páginas usam scripts
  clássicos em ordem definida no HTML.
- Coloque regras junto ao sistema responsável, separando regras de interface.
- Trate o save como contrato público: ao adicionar estado persistente, atualize
  criação, carregamento com valor padrão, validação e reset, preservando saves antigos.
- Adicione ou atualize um teste focado para a regra alterada.

## Licença

Licenciado sob a licença **ISC**. Veja o arquivo `package.json` para os metadados.

## Status do projeto

Em desenvolvimento ativo.
