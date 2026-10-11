# Rodapé da caverna — especificação

Estado atual (aprovado): **log em cima, skills no meio, botões embaixo**, tudo
encostado no canto inferior esquerdo.

```
┌──────────────────────────┐
│  #logAvisos  (REGISTRO)  │   ← topo da pilha
├──────────────────────────┤
│  #container-Habilidades  │   ← skills (ou AO LADO dos botões)
├──────────────────────────┤
│  #container-Botoes       │   ← sempre 1 fileira horizontal
└──────────────────────────┘
```

## Invariantes (o que os testes/`visual-check` garantem)

1. `#container-Botoes` é **sempre horizontal** (uma fileira) e **sempre no
   canto inferior esquerdo** (`left <= 20px`).
2. `#container-Habilidades` fica **ao lado** dos botões quando a tela comporta
   os dois **com folga**; senão fica **acima** dos botões. Nunca por cima.
3. Em **qualquer** um dos casos, as skills ficam **abaixo do `#logAvisos`**
   quando ele está visível: `skills.top >= log.bottom`.
4. Skills e botões **nunca se sobrepõem**; nada sai da tela.
5. Se o log está oculto (`hidden`), a regra 3 é dispensada e as skills ficam
   logo acima dos botões.

## Fonte da verdade

- `script/ui-rodape.js` — `UIRodape.{Inicia,Atualiza,Pede}`.
  - `ESPACO_LADO` (12), `ESPACO_CIMA` (10), `FOLGA_LADO` (16),
    `MARGEM_ESQ` (8), `MARGEM_TOPO` (8).
  - `MedeLargura()` — largura natural (encosta em `left: 0` para não sofrer
    shrink-to-fit).
  - `TopoAbaixoDoLog()` — `log.bottom + ESPACO_CIMA`, ou `null` se o log não
    está visível/medível.
  - `Atualiza()` — decide lado a lado vs empilhado e escreve as variáveis CSS.
- `css/estilos.css` — `#container-Botoes { flex-direction: row }`;
  `#container-Habilidades { left/bottom: var(--rodape-hab-*) }`;
  `#container-opcoes { justify-content: flex-start }` nos breakpoints mobile.

## Decisões geométricas

- Lado a lado: `left = botões.right + 12`, `bottom = alturaTela - botões.bottom`
  (bases alinhadas).
- Empilhado: `topo = min(log.bottom + 10, botões.top - 10 - alturaSkills)`,
  depois `bottom = alturaTela - topo - alturaSkills`.
  O `min` dá **prioridade aos botões**: se não couber entre log e botões, as
  skills sobem e podem encostar no log (o log é translúcido; os botões não).
- O teste de "cabe ao lado" é
  `botões.left + botões.width + 12 + habilidades.width + 16 <= larguraTela`.

## Histórico de erros (não repetir)

- **Skills por cima dos botões quando o log estava oculto**: a base era
  derivada do topo dos botões (`topo = rBot.top`) e o elemento alto invadia a
  fileira. Corrigido com `min(...)` + altura medida. O teste só pegava com o
  log visível — por isso hoje há a varredura e o `visual-check.cjs`.
- **Skills acima do log**: a primeira versão subia as skills para não colidir
  com o log. O pedido era o oposto (skills **abaixo** do log).
- **`left: 22rem` fixo / coluna de botões**: a fileira de skills era posicionada
  por media query e a fileira de botões era uma coluna; nenhum dos dois funciona
  com largura variável.
