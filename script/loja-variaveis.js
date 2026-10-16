// ===================== VARIÁVEIS DA LOJA ============================
// Estado da loja de gold, da loja de esmeraldas e dos itens de companheiro.
// Extraído de script.js byte a byte (ver REFATORACAO.md). Carregado logo
// depois dele: os nomes seguem globais e iguais aos do save.
// ====================================================================
//variaveis referentes a loja
var precoDano = 5;
// Passo do preço do Dano a partir do 5º nível (o balanço antigo era ×1,5).
// Como o dano é a soma cumulativa dos incrementos (mulDano, ×1,025 no ★I por
// compra), ×1,5 de preço fazia o custo por ponto disparar: depois de ~15-20
// níveis o mesmo ouro rendia mais em subvida/crítico/recarga. A razão do preço
// é o que move o teto (foi o que aconteceu no CM) — medido pelo bot de auditoria.
var PASSO_PRECO_DANO = 1.35;
var mulDano = 1;
var lvlDano = 1;

var precoBEspaco = 45;
var lvlBEspaco = 1;

var precoGold = 100;
var sobeGold = 0.3;
var lvlGold = 1;

var precoAvan = 160;
var sobeAvanco = 0.005;
var lvlAvan = 0;

var precoDCrit = 150;
var sobeDCrit = 0.1;
var lvlDCrit = 1;

var precoCCrit = 250;
var sobeCCrit = 0.02; //passo da chance crítica (cresce ×1,1 por compra; de 30% em diante só metade é aplicada)
var lvlCCrit = 1;

var precoQTDAvanco = 400;
var lvlQTDAvanco = 1;

// ---- Passos de preço dos itens de chance/avanço (balanceamento direto) ----
// O jogador achou a Chance Crítica barata demais. Pedido: DOBRAR O AUMENTO do
// PREÇO por compra (o fator vira 1 + 2×(fator−1)), nos 3 itens. O PASSO do
// efeito NÃO muda (a chance ganha por compra segue igual). Aplicado direto,
// sem toggle no painel F2.
//   Chance Crítica: preço ×1,5 → ×2,0 (o passo do efeito segue ×1,1)
//   Avanço Rápido:  preço ×2,5 → ×4,0
//   Qtd Avanço:     preço ×2,5 → ×4,0
// Obs.: o passo do Avanço (sobeAvanco) segue intocado — o persistencia-carregar
// o deriva do nível com ×1,005.
var PASSO_PRECO_CCRIT = 2.0;
var PASSO_PRECO_AVANCO = 4.0;
var PASSO_PRECO_QTDAVANCO = 4.0;

var precoVidaInimigo = 150;
var subVidaInimigo = 0.00;
var lvlSubVida = 0;

var precoBau = 25;
var lvlBau = 1;

// Item novo da loja de gold: chance de esmeralda ao abrir cada baú
var precoEsmBau = 500;
var lvlEsmBau = 0;

// Item novo da loja de gold: velocidade de ataque do companheiro — +20% por
// nível a partir de 1 hit/s, com teto por patente (1,6 → 1,8 → 2,0 hits/s).
// O tick do DanoCompanheiros escala junto (SincronizaIntervaloDanoComp)
var precoVelComp = 125;
var lvlVelComp = 1;
var velAtaqueComp = 1;

// Patentes da loja de gold (0 = ★I, a base de hoje): ao bater no nível máximo
// o ingresso destrava o próximo segmento de níveis com o teto do efeito
// subindo. São por run — zeram no reset junto com os itens que destravam.
var patenteBau = 0;
var patenteBEspaco = 0;
var patenteQTDAvan = 0;
var patenteCCrit = 0;
var patenteSubVida = 0;
var patenteAvan = 0;
var patenteEsmBau = 0;
var patenteVelComp = 0;
// Dano e Dano Crítico: gate por nível (★I fecha no 50) e a ★ acelera a taxa
// do passo dinâmico (1,025 → +0,005 por patente)
var patenteDano = 0;
var patenteDCrit = 0;

var descontoLoja = 0;
var mulGoldInicial = mulGold;
////



//variaveis loja de esmeraldas
var precoComp1 = 1;
var danoComp1 = 0.4;
var lvlComp1 = 0;

var precoAvGold = 2;
var lvlAvGold = 1;

var precoComp2 = 3;
var goldComp2 = 0.5;
var lvlComp2 = 0;

var precoComp3 = 4;
var tempoComp3 = 1;
var lvlComp3 = 0;

// Companheiro 4 (Alquimista): a cada 20s sorteia um buff aleatório por 10s
var precoComp4 = 6;
var lvlComp4 = 0;

// Companheiro 5 (Assassino): passiva de morte instantânea
var precoComp5 = 8;
var lvlComp5 = 0;

// Companheiro 6 (Explorador do mapa): chance de avançar mais de um andar
var precoComp6 = 10;
var lvlComp6 = 0;

// Buffs do Alquimista (comp 4): sorteia um dos 4 a cada 20s, vale por 10s.
// buffAtivo guarda o tipo e o timestamp (ms) de fim.
var buffAtivo = null; // { tipo: "dano"|"gold"|"velocidade"|"bau", fimMs }
// Handles dos intervalos dos novos companheiros (gerenciados: criados na
// compra/load e limpos no PreCarregamento junto com os demais intervalos)
var intervaloMagoRelogio = null; // comp 3: carrega skill a cada 5s
var intervaloAlquimista = null;  // comp 4: sorteia buff a cada 20s −1s por nível

var precoXP = 1;
var lvlXP = 0;
// marcos de 50 níveis do jogador já reivindicados (+1 cada no MultiplicadorCM)
// permanente: não zera no Resetar, então o mesmo marco não paga duas vezes
var marcosNivel50 = 0;
// resets feitos perto do recorde (até 10 andares antes do maxAndar): +5%
// permanente no MultiplicadorCM cada — acumulativo (1,05^N), não zera no Resetar
var resetsCurtosCM = 0;

var precoEsmCM = 5; //base do item "CM em dobro"; dobra por nível (5/10/20/40)
const MAX_ESM_CM = 4; //níveis do "CM em dobro" (cada nível dobra o CM no reset)
var lvlEsmCM = 0; //0..MAX_ESM_CM
////
