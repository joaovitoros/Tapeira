---
name: Ícones (moeda/gema)
description: Gerar, recolorir ou conferir ícones de moeda/gema do jogo no mesmo design de imagens/gold.png e imagens/gem.png (flat, 3 tons + brilho, fundo transparente, 512x512). Use quando o pedido for criar um ícone novo, uma variante de cor (prata, rubi, safira...), ou mexer na arte dos ícones (gold, esmeralda, moeda, gema, joia, recompensa).
---

# Ícones no design da moeda/gema

Arte dos ícones que o jogo usa via `<img class="moeda-icone">`: **flat, 3 tons
de uma matiz + 1 brilho pálido, fundo transparente, 512×512**, exibidos a
`height: 1em` (~11–20px). A especificação medida está em
`references/design-icones.md` — leia antes de desenhar algo novo.

## Escolha o caminho (não redesenhe o que já existe)

| Pedido | Caminho | Ferramenta |
| --- | --- | --- |
| "moeda de prata", "gema de rubi" (mesma arte, outra cor) | **recolorir** | `scripts/recolorir-icone.ps1` |
| forma nova no mesmo estilo (outro objeto) | **template SVG + rasterizar** | `templates/*.svg` + `scripts/gerar-icone.cjs` |
| "confere se ficou igual", "está bom?" | **medir e olhar** | `scripts/medir-icone.ps1` |

Recolorir é o caminho mais seguro para "mesmo design": reaproveita 100% da arte
e troca só a paleta. Prefira-o sempre que a forma puder ser a mesma.

> Não sobrescreva `imagens/gold.png` nem `imagens/gem.png` — estão referenciados
> no `Caverna.html`. Gere arquivos novos (`imagens/moeda-prata.png`, ...).

## Caminho 1 — recolorir (mesma arte, cor nova)

```powershell
$repo = "\\wsl.localhost\Ubuntu\home\krn\games\a\Tapeira"
powershell -NoProfile -ExecutionPolicy Bypass -File `
  "$repo\.opencode\skills\icones\scripts\recolorir-icone.ps1" `
  -Entrada "$repo\imagens\gold.png" -Esquema prata -Saida "$repo\imagens\moeda-prata.png"
```

- Paletas prontas (`paletas.json`): `ouro, prata, bronze, cobre, esmeralda,
  rubi, safira, ametista, obsidiana, sangue, osso, veneno`.
- `-ListarEsquemas` mostra todas.
- `-Mapa "F6D555=EDF1F5,EFB217=C2CAD2,D79511=949EA8"` para mapeamento manual.
- `-Brilho <hex>` força a cor do brilho (sem ele, é derivado do novo "claro").

O script detecta sozinho os 3 tons dominantes (ordena por luminância →
claro/médio/escuro) e o brilho pálido, e troca mantendo a transparência.

## Caminho 2 — forma nova (template SVG → PNG)

Os templates `templates/moeda.svg` e `templates/gema.svg` reproduzem o design
com tokens de cor: `__CLARO__` `__MEDIO__` `__ESCURO__` `__BRILHO__`.

O rasterizador usa o Chromium do Playwright (o projeto não tem outro). Como o
`node` do Windows não carrega script em caminho UNC, monte uma pasta Windows
uma vez e rode de lá — o `fs` lê e escreve UNC normalmente:

```powershell
$repo = "\\wsl.localhost\Ubuntu\home\krn\games\a\Tapeira"
$tmp  = "$env:TEMP\icones"
New-Item -ItemType Directory -Force -Path "$tmp\node_modules", "$tmp\scripts" | Out-Null
foreach ($p in @('playwright','playwright-core')) {
  robocopy "$repo\node_modules\$p" "$tmp\node_modules\$p" /E /NJH /NJS /NDL /NFL | Out-Null
}
Copy-Item "$repo\.opencode\skills\icones\paletas.json" "$tmp\paletas.json" -Force
Copy-Item "$repo\.opencode\skills\icones\scripts\gerar-icone.cjs" "$tmp\scripts\gerar-icone.cjs" -Force

Set-Location $tmp
node scripts\gerar-icone.cjs --template "$repo\.opencode\skills\icones\templates\moeda.svg" `
  --saida "$repo\imagens\moeda-obsidiana.png" --esquema obsidiana
```

- `--esquema <nome>` ou `--cores "claro,medio,escuro[,brilho]"`.
- `--tamanho 512` (padrão) e `--escala 2` (para conferir de perto).
- `--token NOME=HEX` (repetível) para tokens extras do template — ex.:
  `--token FUNDO=16211E --token BORDA=3E5C54`. Aceita `none`/`transparent`
  para omitir uma camada (ex.: gerar o ícone **sem** o badge).
- Para uma forma nova: copie um template, mantenha os tokens e a paleta, e
  ajuste só a geometria (respeite "flat, 3 tons, luz de cima-esquerda").

## Passo obrigatório — conferir (medir e OLHAR)

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File `
  "$repo\.opencode\skills\icones\scripts\medir-icone.ps1" `
  -Imagem "$repo\imagens\gold.png" -Comparar "$repo\imagens\moeda-prata.png"
```

O `medir-icone.ps1` imprime, para os dois arquivos: dimensões, % transparente,
tamanho do conteúdo, paleta e um **mapa ASCII** (letras por luminância:
`L/M/D` = os 3 tons, `W` = brilho). Compare:

- **conteúdo** com a mesma proporção do original (moeda 342×342 = 67%×67%;
  gema 324×495 = 63%×97%);
- **paleta** = os 3 tons + brilho esperados (nada de sobra);
- **mapa** na mesma silhueta (o recolor deve sair idêntico ao original).

E **abra o PNG** (é arte: medir não substitui olhar). Gere também um render
pequeno e confira a legibilidade em tamanho de jogo:

```powershell
node scripts\gerar-icone.cjs --template ... --saida "$tmp\pequeno.png" --tamanho 96 --escala 3
```

## Ligar no jogo

1. Salve o PNG em `imagens/`.
2. Use no HTML como os existentes:
   `<img class="moeda-icone" src="imagens/<arquivo>.png" alt="...">`
   (a classe `.moeda-icone` já dá `height: 1em; width: auto`).
3. **Nada de manifesto**: `scripts/prepare-web.ps1` copia a pasta `imagens/`
   inteira para `www/` e para o Android — o asset novo já embarca. (Isso é
   diferente de `script/*.js`, que precisa entrar em `script-manifest.js`.)

## Checklist

- [ ] Caminho certo: recolorir para mesma forma; template para forma nova.
- [ ] Não sobrescrevi `gold.png`/`gem.png`.
- [ ] Fundo transparente e conteúdo na mesma proporção do original.
- [ ] Só 3 tons + brilho; brilho **também** foi recolorido (nada de menta em rubi).
- [ ] `medir-icone.ps1` com `-Comparar` bate com o original.
- [ ] Olhei o PNG e um render pequeno (96px).
- [ ] No resumo: arquivos gerados, comandos rodados e o que não pôde ser validado.

## Armadilhas

Estão todas detalhadas em `references/design-icones.md` (brilho não recolorido,
letras do mapa instáveis por frequência, `Write-Output` capturado por `$x = Fn`,
ExecutionPolicy em UNC, `node` não carrega script em UNC).
