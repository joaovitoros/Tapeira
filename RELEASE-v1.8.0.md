# TAPeira 1.8.0 — Biomas, música por região e o balance da auditoria

## ✨ Novidades
- **Biomas oficiais**: a cada 10 andares mudam **juntos** o **fundo**, o **inimigo** (com a animação de morte dele) e a **trilha** — os 8 fundos e 14 inimigos novos saíram do teste visual e viraram o jogo.
- **Música original por bioma**: 6 temas próprios + um **tema de batalha** para os guardiões.
- **Cidade mais viva**: os custos em **CM** estavam na escala do ouro (a Pesquisa custava **200 mil CM**, com uma renda de ~10-25 mil CM por run) — recalibrados, a Cidade finalmente dá pra evoluir.

## ⚖️ Balance (auditoria de ritmo)
Esta versão saiu de um **bot que joga o jogo sozinho** (headless) e mede o efeito de cada mudança no ritmo:
- **Loja do Conhecimento**: preço **×1,4 → ×1,25** e **CM ganho no reset em dobro**.
- **Cronômetro de fuga**: agora **cresce com os abates do andar** (×1 até 10 abates, linear depois) — o começo fica igual, e o fundo deixa de travar o jogo.
- **Dano**: preço **×1,5 → ×1,35** e incremento por compra **×1,025 → ×1,05**.
- **Correção**: o item "subtrair vida" não derruba mais a sua renda (menos vida no inimigo = menos ouro do avanço e do baú).
- **Avanço Rápido / Qtd Avanço**: o preço cresce ×2,5 por compra (era ×2).

## 🛠️ Por baixo do capô
- **Refatoração**: `script.js` de **716 → 348 linhas** (`fundos`, `loja-variaveis`, `avanco-inimigos` e `reset` viraram arquivos próprios, corte byte a byte).
- **Builds ~33 MB mais leves** (folhas de arte-fonte e fundos não usados ficaram fora do pacote).
- **Correção de build**: o `prepare:web` estava quebrado desde a limpeza de assets.
- **Painel F2**: comparador de **"dificuldade antiga"** — liga/desliga o balanceamento desta versão na hora, pra sentir o antes/depois.

## 📦 Instaladores
- **Windows**: `TAPeira Setup 1.8.0.exe`
- **Android**: `app-debug.apk`

## ⚠️ Notas
- Windows: o app não é certificado — o SmartScreen pode avisar (clique em **Mais informações → Executar mesmo assim**).
- Android: aceite a permissão de **fontes desconhecidas** quando o celular perguntar.
- Faça um **backup do save** antes de atualizar (Configurações → Salvar).
