# TAPeira 1.8.6 — Barra de vida em cada inimigo e as esferas do objetivo de volta

## ✨ Novidades
- **Barra de vida em cada inimigo**: cada bicho vivo tem a **sua** mini-barra, com o **nome da criatura** ("Mugi Cristal", "Mugi Gelo", "Rei Espinhos"…). Ela fica na tela enquanto ele está vivo — com quatro inimigos, dá para ver de relance **quem está mais fraco**.
  - Antes existia um único indicador, que **sumia em 1,2 s** e dizia só "Inimigo 1".
  - A barra aparece **cheia já no surgimento**, desce a cada golpe (inclusive dano automático e corrente) e some **só quando aquele** inimigo morre.
  - Se o topo do inimigo está embaixo do card de objetivo/missão, a barra dele fica **abaixo do bicho** em vez de escondida.

## 🐛 Correções
- **As esferas do objetivo voltaram**: elas sumiam quando a meta passava de 8 abates — e a meta sobe +1 por andar, então a partir do andar ~10 elas nunca mais apareciam. Agora:
  - até **12 abates**: uma esfera por abate;
  - **acima de 12**: cada esfera vale um bloco, e a esfera do bloco em andamento fica **meio cheia** (o texto "X / Y inimigos derrotados" continua dando o número exato).
- **Aviso de fuga mais evidente**: nos últimos 5 segundos o chip do tempo fica **avermelhado por inteiro** (antes só o texto ficava vermelho).

## 💾 Instaladores
- **Windows**: `TAPeira Setup 1.8.6.exe`
- **Android**: `app-debug.apk`

## 📌 Notas
- Windows: o app **não é certificado** — o SmartScreen pode avisar (clique em **Mais informações → Executar mesmo assim**).
- Android: aceite a permissão de **fontes desconhecidas** quando o celular perguntar.
- **Faça um backup do save** antes de atualizar (Configurações → Salvar).
