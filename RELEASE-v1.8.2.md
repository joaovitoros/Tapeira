# TAPeira 1.8.2 — Girar a tela, aviso de compra e ajustes de skill/preço

## ✨ Novidades
- **Android: botão "Girar tela"** no menu de pause (seção *Tela (celular)*) — gira o jogo **mesmo com o giro automático do celular desligado** (em pé ↔ deitado, com o estado atual indicado).
- **Aviso de compra no botão da Loja**: quando a **auto-compra está desligada** (ou ainda não destravou) e você já tem ouro para comprar bastante, aparece um **selo** no botão Loja (mesma linguagem do selo de pontos das Ramos) com quantos itens dá para comprar — chega de esquecer de gastar.
- **Skills com a carga no próprio ícone** (com brilho ao carregar) — sem barra separada; o Alquimista agora aparece **acima das skills**.
- **Navegação exclusiva**: abrir uma tela fecha a outra (nunca duas abertas juntas). O **menu de pause ganhou um "X"** para fechar.
- **Emblema do andar** na transição e **ícones novos** na Loja.

## 📱 Celular / responsivo
- **Skills sempre acima dos botões** (Status/Loja/Feitos/Ramos/Cidade) no modo **em pé** — em telas de retrato elas não ficam mais espremidas na borda direita.
- **Alvos de skill maiores** (52px) em telas grandes de retrato (ex.: 800×1340) — muito mais fácil de ativar.
- Correção: o toggle de auto-compra não desenha mais uma "bola" duplicada.

## ⚖️ Balance
- **Loja do Conhecimento**: o **preço inicial triplicou** (base 10 → **30 CM**; itens de formiga 20 → **60**). A loja estava barata demais no começo. **O ganho de cada item não mudou** (o crescimento por nível segue ×1,25 e ×1,5 nas formigas).
- Itens de formiga seguem **2×** o preço dos normais, com o **aumento dobrado** por compra.

## 🐛 Correções
- **Inimigos atrás do HUD** em janela estreita/baixa (o sprite e o anel do Frenesi sumiam).
- **Botão Cidade** só aparece depois de destravar (andar 80).
- **Loja de Gold** volta a mostrar a **build escolhida** ao lado do título.

## ⚙️ Por baixo do capô
- Atualização grande do **front** (carga das skills no ícone, telas, ícones) com **migração de nomes de CSS/ids para BEM em pt-BR**.
- Plugin nativo **@capacitor/screen-orientation** (o único que exige um APK novo para o botão funcionar).

## 💾 Instaladores
- **Windows**: `TAPeira Setup 1.8.2.exe`
- **Android**: `app-debug.apk`

## 📌 Notas
- Windows: o app **não é certificado** — o SmartScreen pode avisar (clique em **Mais informações → Executar mesmo assim**).
- Android: aceite a permissão de **fontes desconhecidas** quando o celular perguntar.
- **Faça um backup do save** antes de atualizar (Configurações → Salvar).
- O **painel F2** ("Dificuldade antiga") continua revertendo o balanceamento para comparar.
