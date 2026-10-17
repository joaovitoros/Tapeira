# TAPeira 1.8.1 — Preços da Cidade de volta ao padrão e ajustes de preço/ritmo

## ⚖️ Balance
- **Cidade volta ao padrão (~32,2 milhões de CM)**: os custos em CM tinham sido recalibrados para **÷100** (a Cidade ficou barata demais na 1.8.0). Agora voltaram **10×** — a escala que o jogo pede. Casa nível 0: **2.000 CM**; Fazenda **3.000**; Cristal **100.000**; Pesquisa (item) **20.000**.
- **Loja de gold — preço por compra**: o **aumento** do preço dobrou em três itens: **Chance Crítica** (×1,5 → **×2,0**), **Avanço Rápido** (×2,5 → **×4,0**) e **Qtd Avanço** (×2,5 → **×4,0**). O **ganho** de cada item **não mudou** (a Crítica segue ganhando o mesmo passo).
- **Loja do Conhecimento — itens de formiga** ("+0,5% de chance de formiga" e "+1% de vir 2 formigas"): **preço dobrado** (base 10 → **20**) e o **aumento dobrado** (×1,25 → **×1,5**). O efeito segue igual (+0,5%/nível).
- **Tempo de fuga — base 90s → 30s**. Com o resto igual, isso vira **~3s por abate exigido** no andar (era ~9s). O Conhecimento Mug (+2s/nível), o Destemido (+5s/nível), o Relógio de Bolso (×1,1) e o corte de 80% do Canhão de Vidro continuam iguais.
- **Portão de reset volta a +5%** por portão (a 1.8.0/1.8.0.x tinha ensaiado +10% e +16%).

## 🐛 Correções
- **Botão Cidade**: só aparece **depois de destravar** (andar 80). Antes ele ficava na barra desde o começo.
- **Inimigos atrás do HUD**: em **janela estreita ou baixa** (ex.: 1280×600, 1000×500, 500×400) o inimigo nascia **dentro do painel Objetivo** — o sprite e o **anel do Frenesi** sumiam. Corrigido com piso em px nos dois layouts (o deitado e a regra global).
- **Jogador novo**: volta a ver a **toupeira clássica** (capacete + picareta) até liberar a Cidade.

## 📱 Mobile
- **Alvos de toque ≥ 44 px** e **textos legíveis** no retrato **e** deitado (o rótulo da fuga estava em 8 px; vários botões tinham 20–34 px de altura).
- **Card do baú dourado**: o tempo não estoura mais a borda (o "17:31" vazava para fora).

## ✨ Interface
- **Loja de Gold** volta a mostrar a **build escolhida ao lado do título** (ex.: *Força Bruta · Loja de Gold*), sem precisar rolar até a seção de especialização.

## 💾 Instaladores
- **Windows**: `TAPeira Setup 1.8.1.exe`
- **Android**: `app-debug.apk`

## 📌 Notas
- Windows: o app **não é certificado** — o SmartScreen pode avisar (clique em **Mais informações → Executar mesmo assim**).
- Android: aceite a permissão de **fontes desconhecidas** quando o celular perguntar.
- Faça um **backup do save** antes de atualizar (Configurações → Salvar).
- O **painel F2** ("Dificuldade antiga") ainda reverte o pacote de balanceamento para comparar.
