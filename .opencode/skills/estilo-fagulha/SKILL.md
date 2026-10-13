---
name: Estilo de arte Fagulha
description: Aplicar/replicar o estilo de arte "Fagulha" dos ícones de habilidade do TAPeira — emblema circular flat, contorno da MESMA cor do preenchimento, sem gradiente/sombra/textura, paleta quente saturada com alto contraste, luz de cima-esquerda e UM ÚNICO motivo decorativo, temático com a habilidade (frenesi=faíscas, ouro=moedas, gelo=flocos, elétrico=mini-raios, dano=estilhaços). Use quando o pedido citar "estilo Fagulha", quando precisar padronizar a arte de um ícone/emblema/insígnia novo, ou quando for decidir cores e regras visuais de um ícone de skill.
---

# Estilo de arte **Fagulha**

Nome do estilo: **Fagulha** (do elemento único de enfeite: a *fagulha* / faísca).

Arte dos ícones de habilidade do jogo. É **flat de verdade** e o mais simples
possível: um emblema circular + **um** motivo central + **um** tipo de enfeite —
e o enfeite tem de **combinar com a habilidade** (temático). O erro a evitar é
**misturar enfeites** (chama + gema + faísca no mesmo ícone): use *um* só, e que
faça sentido com a skill.

A especificação completa (tokens, geometria, regras e armadilhas) está em
`references/estilo-fagulha.md` — **leia antes de desenhar qualquer coisa**.

O ícone canônico deste estilo é `exemplos/skill-frenzy-10.svg`.

> O estilo é **independente de formato e de tamanho**: ele define *proporções
> relativas e regras*, não um `viewBox` fixo. Qualquer que seja o formato
> (SVG/PNG, 512×512, 256×256, 1em), o ícone deve parecer o mesmo.

## As 6 regras (todas obrigatórias)

1. **Flat**: nada de gradiente, sombra (`filter`), textura (`pattern`) ou bevel real.
2. **Contorno = cor do preenchimento**: cada forma usa `stroke` com o MESMO hex
   do `fill` (engrossa a silhueta, não desenha linha escura).
3. **Luz de cima-esquerda**: um arco claro no aro (canto superior-esquerdo) e um
   brilho claro na borda superior-esquerda do motivo. Nada de luz de baixo.
4. **Paleta quente, saturada e de alto contraste**: campo bem escuro + motivo
   bem claro; poucas cores (ver tokens).
5. **Um só enfeite — e temático**: o enfeite combina com a habilidade
   (frenesi → faíscas; ouro → moedas; gelo/fuga → flocos; elétrico → mini-raios;
   dano → estilhaços). Nunca misturar enfeites diferentes no mesmo ícone.
   Espalhados, com tamanho/posição variados (sem formar anel).
6. **Fundo transparente**: nada de cor de fundo no quadrado.

## Estrutura do emblema

Nesta ordem (de trás para frente):

1. Aro externo — círculo grande, cor principal.
2. Bisel — círculo médio, tom médio/escuro.
3. Campo — círculo menor, cor bem escura.
4. Brilho do aro — arco no canto superior-esquerdo.
5. Motivo central — o "glifo" da habilidade (raio, escudo, estrela...).
6. Brilho do motivo — faixa clara na borda superior-esquerda.
7. Enfeite — o elemento decorativo temático, por cima.

## Tokens (variante "fogo")

| Token | Hex | Uso |
| --- | --- | --- |
| `aro` | `#ff9d15` | anel externo |
| `bisel` | `#ea7609` | anel intermediário |
| `campo` | `#6f1a04` | disco interno (escuro p/ contraste) |
| `brilhoAro` | `#ffe6ad` | arco claro do aro |
| `motivo` | `#ffd400` | forma central |
| `brilho` | `#fffef0` | brilho do motivo |
| `faisca` | `#fff05a` | estrela de 4 pontas |

Outras variantes (gelo, veneno, sangue, sombra, dourado) estão em
`references/estilo-fagulha.md`.

## Checklist

- [ ] Só um tipo de enfeite, e ele **combina** com a habilidade — nada misturado.
- [ ] Nenhum gradiente/sombra/textura; contorno = cor do preenchimento.
- [ ] Brilho no aro **e** no motivo, sempre de cima-esquerda.
- [ ] Campo escuro o bastante para o motivo saltar (contraste).
- [ ] Faíscas espalhadas (sem parecer um anel/alinhamento).
- [ ] Fundo transparente.
- [ ] Olhei o render grande **e** um render pequeno (~40px) — é arte, medir não basta.

## Como gerar um ícone novo neste estilo

Use a skill **"Criar ícone de habilidade (Fagulha)"**
(`.opencode/skills/icone-fagulha/`), que já emite o emblema + motivo + faíscas
com os tokens daqui.
