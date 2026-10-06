# Ideias futuras

Registro de propostas e evoluções futuras do TAPeira.

> O progresso offline foi implementado com base nos companheiros: considera até 5 horas, concede 25% do dano e do Gold calculados, mantém o andar atual e limita a 2 os baús encontrados. A chance de baú usa avanços virtuais sem alterar o andar real. O menu exibe o tempo acumulado, e o resumo e o recebimento aparecem ao voltar ao jogo. Os limites ficam configuráveis no código.

> A coleção permanente de formigas foi implementada: inimigos a partir do andar 20 têm 1% de chance de deixar uma formiga de uma das cinco cores. Cada conjunto de cinco acumula +5% de dano (vermelhas), +5% de Gold (amarelas), +2% de Gold por baú e +0,01% de chance de baú extra (marrons), +2 minutos de limite offline (pretas) ou +1 baú offline máximo (cinzas). A coleção pode ser consultada pela tela “Formigas” e permanece após resets.

> O bônus por tempo foi implementado com um baú dourado: a barra carrega em 20 minutos com o jogo visível ou 40 minutos fora dele e acumula no máximo um baú. As recompensas são 50% Gold (5x o Gold de um baú comum), 30% formiga aleatória após desbloquear a coleção e 20% para carregar ao máximo todas as habilidades desbloqueadas. Antes do desbloqueio das formigas, a chance de formiga é sorteada novamente entre Gold e habilidades, mantendo a proporção 50:20.

> O sistema de experiência e melhorias de habilidades foi implementado: cada inimigo concede 1 XP nos andares 1–10, aumentando em 1 XP a cada dez andares; o próximo nível custa 50 XP e aumenta em 25 XP por nível. Cada nível concede um ponto para melhorar quatro habilidades: dano automático (+5 s, máximo 6 níveis), corrente elétrica (+5% no encadeamento e +2% sem alvo próximo), Gold (+5% por ataque) e pausa da fuga (+2 s). As três últimas têm máximo de 5 níveis e desbloqueiam nos andares 15, 25 e 35. XP, nível e melhorias reiniciam junto ao reset e são salvos entre sessões.

## Bônus por tempo (implementado)

- O progresso e o baú dourado pendente são salvos entre sessões.
- O baú pode ser aberto na interface quando a barra completa.
