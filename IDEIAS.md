# IDEIAS / BACKLOG

Anotações de ideias que **não** estão em desenvolvimento agora. Nada aqui é
um plano fechado — é ponto de partida pra retomar depois.

---

## PvP entre dois TAPeiras (Bluetooth) — nota pra depois

Dá pra fazer em 3 níveis, do mais barato ao mais complexo:

**A) Batalha-fantasma (assíncrona, sem conexão direta)** — recomendado começar por aqui.
- Cada jogador exporta um **"cartão de batalha"** (subconjunto do save: dano,
  crítico, vida, skills, itens, nível) e manda pro outro pelo **mesmo
  compartilhamento de save** (Bluetooth/Quick Share).
- O jogo recebe o cartão e **simula o adversário localmente**.
- Reusa 100% do que já existe (export/import + intent "Abrir com TAPeira").
- Não exige os dois online ao mesmo tempo.

**B) P2P local de verdade (mesma sala, celular)** — precisa de código nativo.
- Bluetooth cai no WebView? Não: precisa de um **plugin Capacitor** nativo.
- Opções: Bluetooth Classic RFCOMM/SPP (Android↔Android, exige pareamento);
  BLE (throughput baixo, ok pra turnos); **Google Nearby Connections**
  (recomendado: escolhe o transporte sozinho; precisa do Play Services).
- Modelo mais simples: **host autoritativo** (um lado simula e manda vida/eventos;
  o outro só desenha) — dispensa determinismo.

**C) Online de verdade** — servidor/WebSocket, contas, matchmaking, anti-cheat.
Bem mais longe.

**O que muda no jogo (independente do transporte):**
- `Math.random()` do combate (crítico/drops) → RNG com semente **ou** host autoritativo.
- Separar "estado de combate" da apresentação (hoje `Bater()` mistura cálculo,
  DOM e som).
- Definir as **regras do duelo** (a build/skills são PvE e assimétricas).

---

## Tickets de Caçador de Mugs (pontos de habilidade) — design a confirmar

Ideia: dar utilidade aos pontos de habilidade depois que tudo já está no máximo.

- Enquanto as skills **não** estão todas no máximo: os pontos funcionam
  **como hoje** (gasta em skill).
- Depois que tudo está no máximo: os pontos podem ser gastos **na Cidade**.
- Os Tickets são **permanentes** (vão pro save; **não** zeram no reset).
- Ao **resetar**: os pontos da run zeram (skills voltam) e **não** dá pra usar
  os Tickets pra upar skill — skill só sobe com os pontos da run.

Pontos em aberto (decidir quando for implementar):
1. ~~Contador separado ou o mesmo?~~ **O MESMO contador** (um valor só, que muda de uso quando as skills fecham).
2. ~~Taxa~~ **1 ponto = 1 ticket**, e só se ganha ticket **depois** de fechar todas as skills.
3. ~~O que compra na Cidade~~ **ainda em aberto** (o usuário está pensando nas possibilidades).
4. ~~Conversão manual ou automática~~ **automática**.

Modelo proposto (confirmar na implementação):
- Um contador visível **Tickets de Caçador de Mugs**.
- Por run: os pontos ganhos alimentam as skills **enquanto alguma skill não
  estiver no máximo** naquela run.
- Quando todas fecham: os pontos da run somam ao saldo (o MESMO número) e, daí
  em diante, só servem pra Cidade.
- No reset: o saldo **fica** (permanente), mas a parte "gastável em skill" não
  existe mais — as skills voltam e sobem **só** com os novos pontos da run.
