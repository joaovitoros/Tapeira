# Tokens de texto e fonte — extraído da loja

Fonte: `esbocos/esboco-loja-v2.html` e o bloco `.loja-*` de `css/estilos.css`
(a versão já no jogo é a canônica). Os valores abaixo são os medidos no código.

## Bloco CSS pronto para copiar

```css
/* papel do texto -------------------------------------------------- */
:root {
  --font:  'Segoe UI', 'Roboto', system-ui, sans-serif; /* frase */
  --serif: Georgia, 'Times New Roman', serif;           /* título e cifra */
  --text: #efece6; --muted: #a6adba; --muted-2: #778191;
}

/* eyebrow / sobrelinha */
.x-eyebrow {
  display: block; margin-bottom: 4px;
  font-size: 10px; letter-spacing: .26em; text-transform: uppercase;
  color: #9aa4b4;
}

/* título de painel (serif, peso normal) */
.x-titulo {
  margin: 0;
  font-family: var(--serif);
  font-size: clamp(18px, 1.9vw, 25px);
  font-weight: 400; letter-spacing: .03em; line-height: 1.05;
  color: var(--acento);
  text-shadow: 0 2px 8px rgba(0,0,0,.95), 0 0 18px var(--glow);
}

/* número/cifra em destaque */
.x-valor { font-family: var(--serif); font-size: 14px; font-weight: 700; color: var(--text); }

/* rótulo secundário sob o valor */
.x-rotulo { margin-top: 3px; font-size: 9px; letter-spacing: .02em; color: var(--muted-2); }

/* nome do item */
.x-nome { font-size: 14px; font-weight: 700; color: var(--text);
          white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

/* pílula de nível */
.x-nivel { flex: 0 0 auto; padding: 2px 6px; border: 1px solid #2b3341; border-radius: 5px;
           background: #0e1219; color: var(--muted); font-size: 10px; font-weight: 600; white-space: nowrap; }

/* descrição (máx. 2 linhas) */
.x-desc { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical;
          margin: 0; overflow: hidden; color: var(--muted); font-size: 11.5px; line-height: 1.35; }

/* rótulo do botão + preço */
.x-acao    { font-size: 11px; font-weight: 700; letter-spacing: .02em; }
.x-preco   { font-family: var(--serif); font-size: 13px; font-weight: 700; letter-spacing: .01em; }

/* selo de estado */
.x-selo { display: grid; place-items: center; min-height: 48px; border-radius: 8px;
          font-weight: 800; letter-spacing: .06em; font-size: 13px; }
.x-selo--max     { color: #ffd36b; background: rgba(255,211,107,.07); border: 1px solid rgba(255,211,107,.4); }
.x-selo--patente { color: #ffb84d; background: rgba(255,184,77,.07); border: 1px solid rgba(255,184,77,.42); }
```

## Paleta de texto (não invente tons novos)

| Papel | Hex |
| --- | --- |
| Texto principal / nome | `#efece6` |
| Corpo / descrição / nível | `#a6adba` |
| Rótulo apagado | `#778191` |
| Eyebrow | `#9aa4b4` |
| Ouro (preço Gold, `MAX`, título menu) | `#ffd84a` / `#ffd36b` / `#ffe0a0` |
| Esmeralda (preço gem) | `#4dff88` |
| CM (preço Conhecimento) | `#ffe0a0` |
| Âmbar (patente, `.lim`) | `#ffb84d` |

## Exemplos canônicos (esboco-loja-v2.html)

| Campo | Exemplo |
| --- | --- |
| Eyebrow | `Loja · moeda Gold` |
| Título | `Loja de Gold` · `Loja de Esmeraldas` · `Loja de Conhecimento` |
| Nome | `+Dano` · `Chance Baú` · `-Tempo bater (Espaço)` · `Mult Gold` · `+5% de dano` |
| Nível | `Nv. 24` · `Nv. MAX` · `—` |
| Descrição | `Aumenta o dano dos seus ataques.` · `Reduz a vida do Mug.` · `Multiplica CM por 2 a cada nível no Conhecimento Mug.` |
| Botão | `Comprar` + ícone + `1.250` |
| Auto | `Auto` (trilha + bolinha) |
| Selos | `MAX` · `★ PATENTE` |
| Carteira | `128.450 Gold` · `2.840 Esmeralda` · `360 Conhecimento` |

## Antes → depois (erros que a skill corrige)

| Errado | Certo | Por quê |
| --- | --- | --- |
| `AUMENTA O DANO DOS SEUS ATAQUES.` | `Aumenta o dano dos seus ataques.` | caixa alta é só para eyebrow/seção/selo |
| `aumenta o dano` | `Aumenta o dano dos seus ataques.` | frase completa, verbo inicial, ponto final |
| `Comprar` em Georgia | `Comprar` em sans; cifra `1.250` em Georgia | serif é para título/valor |
| `1,250` / `1,250.00` | `1.250` / `1.250,00` | pt-BR: ponto no milhar, vírgula no decimal |
| `+ 5 %` | `+5%` | colado e com sinal |
| `Nível 24` | `Nv. 24` | abreviação do jogo |
| Inter / Lucide (protótipo 1) | Segoe UI + material do jogo | protótipo 1 foi rejeitado |
