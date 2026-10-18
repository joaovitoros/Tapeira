# TAPeira 1.8.4 — Mortes novas, qualidade personalizável e loja mais leve no celular

## ✨ Novidades
- **Mortes dos inimigos muito mais fluidas**: **11 criaturas** ganharam animação nova, de **13 a 15 quadros** (antes eram de 3 a 6):
  Normal, Gigante, Vegetal, Cristal, Gelo, Metálico, Tóxico, Lava, Rei, Espinhos e Sombrio.
- **Qualidade "Personalizada"**: além de Alta / Média / Baixa, agora você pode escolher **cada otimização** numa lista — filtros do personagem, fumaça da Cidade, partículas e lampiões, animações, **desfoque dos painéis** e **desfoque do HUD** (os dois últimos são novos e só existem aqui).

## 🐛 Correções
- **O próximo inimigo não nasce mais em cima do que está morrendo**: com as mortes novas (mais longas), a onda seguinte nascia antes de a anterior terminar de cair. Agora ela **espera a animação acabar**.
- **Quadros de morte desalinhados**: alguns quadros apareciam deslocados e davam impressão de "tremor". Agora todos ficam alinhados no pé do inimigo, na mesma proporção da caixa (o que também tirou o quadro "flutuando" no meio da tela).

## 🚀 Melhorias
- **Loja e Ramos bem mais leves no celular**: abrir, fechar e comprar não engasgam mais.
  - Abrir/fechar a **árvore de Ramos**: era ~106 ms, agora fica entre 19 e 30 ms depois da primeira abertura (o painel é montado uma vez e reaproveitado).
  - Comprar um nível no Ramos: ~25 ms → ~17 ms.
  - A loja fechada não gasta mais nada atualizando preço/descrição a cada segundo.
- **Média e Baixa agora também tiram o desfoque** dos painéis e dos cartões do HUD — o fundo deles já é quase opaco, então visualmente não muda.

## 💾 Instaladores
- **Windows**: `TAPeira Setup 1.8.4.exe`
- **Android**: `app-debug.apk`

## 📌 Notas
- Windows: o app **não é certificado** — o SmartScreen pode avisar (clique em **Mais informações → Executar mesmo assim**).
- Android: aceite a permissão de **fontes desconhecidas** quando o celular perguntar.
- **Faça um backup do save** antes de atualizar (Configurações → Salvar).
