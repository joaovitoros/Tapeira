<#
  recolorir-icone.ps1 - gera um ícone NOVO a partir de um ícone existente,
  trocando só a paleta (mantém 100% do desenho: formas, sombras, transparência).

  É o caminho mais seguro para "mesmo design": a arte do jogo é FLAT com 3 tons
  de uma cor (+ um brilho claro). Trocar os 3 tons por outro esquema produz um
  ícone que parece do mesmo pacote, sem redesenhar nada.

  Detecta sozinho os 3 tons dominantes (por luminância = claro/médio/escuro) e
  mapeia para o esquema escolhido. O brilho (branco/quase branco) é preservado.

  Como rodar (o script está em caminho UNC; use -ExecutionPolicy Bypass):

    powershell -NoProfile -ExecutionPolicy Bypass -File recolorir-icone.ps1 `
      -Entrada imagens/gold.png -Esquema prata -Saida imagens/prata.png

    # mapeamento manual (tons do original -> tons novos):
    ... -Entrada imagens/gem.png -Mapa "69E6C3=A9D4FF,5ACCA6=4A90E2,4AB591=245FA8" `
        -Saida imagens/safira.png

    # listar esquemas prontos:
    ... -ListarEsquemas
#>
param(
    [string]$Entrada,
    [string]$Saida,
    [string]$Esquema,
    [string]$Mapa,
    [string]$Brilho,
    [int]$Tolerancia = 70,
    [switch]$ListarEsquemas
)

Add-Type -AssemblyName System.Drawing

# Paletas: fonte unica em paletas.json (mesma usada por scripts/gerar-icone.cjs).
$arquivoPaletas = Join-Path (Split-Path -Parent $PSScriptRoot) 'paletas.json'
if (-not (Test-Path -LiteralPath $arquivoPaletas)) {
    Write-Host "Nao encontrei paletas.json em $arquivoPaletas"; exit 1
}
$json = Get-Content -LiteralPath $arquivoPaletas -Raw -Encoding UTF8 | ConvertFrom-Json
$script:Esquemas = [ordered]@{}
foreach ($prop in $json.PSObject.Properties) {
    if ($prop.Name.StartsWith('_')) { continue }
    $script:Esquemas[$prop.Name] = @($prop.Value)
}

if ($ListarEsquemas) {
    Write-Host "Esquemas prontos (claro, medio, escuro):"
    foreach ($k in $script:Esquemas.Keys) {
        Write-Host ("  {0,-10} {1}" -f $k, ($script:Esquemas[$k] -join ', '))
    }
    exit 0
}

if (-not $Entrada -or -not $Saida) {
    Write-Host "Uso: recolorir-icone.ps1 -Entrada <png> -Saida <png> (-Esquema <nome> | -Mapa 'AAAAAA=BBBBBB,...')"
    Write-Host "     recolorir-icone.ps1 -ListarEsquemas"
    exit 1
}

function Hex-Para-Rgb($hex) {
    return , @(
        [Convert]::ToInt32($hex.Substring(0, 2), 16),
        [Convert]::ToInt32($hex.Substring(2, 2), 16),
        [Convert]::ToInt32($hex.Substring(4, 2), 16)
    )
}
function Lum($rgb) { return 0.299 * $rgb[0] + 0.587 * $rgb[1] + 0.114 * $rgb[2] }
function Mistura-Branco($rgb, $f) {
    return , @(
        [int][math]::Round($rgb[0] + (255 - $rgb[0]) * $f),
        [int][math]::Round($rgb[1] + (255 - $rgb[1]) * $f),
        [int][math]::Round($rgb[2] + (255 - $rgb[2]) * $f)
    )
}

# --- 1. descobre os 3 tons dominantes do original (por luminância) ---------
$bmp = [System.Drawing.Bitmap]::FromFile($Entrada)
try {
    $w = $bmp.Width; $h = $bmp.Height
    $contagem = @{}
    $rect = New-Object System.Drawing.Rectangle 0, 0, $w, $h
    $dados = $bmp.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::ReadOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $bytes = New-Object byte[] ($dados.Stride * $h)
    [System.Runtime.InteropServices.Marshal]::Copy($dados.Scan0, $bytes, 0, $bytes.Length)
    $bmp.UnlockBits($dados)

    for ($i = 0; $i -lt $bytes.Length; $i += 4) {
        if ($bytes[$i + 3] -lt 32) { continue }
        $key = ("{0:X2}{1:X2}{2:X2}" -f $bytes[$i + 2], $bytes[$i + 1], $bytes[$i])
        if ($contagem.ContainsKey($key)) { $contagem[$key]++ } else { $contagem[$key] = 1 }
    }

    if ($Mapa) {
        $pares = $Mapa -split ',' | Where-Object { $_.Trim() }
        $origem = @(); $destino = @()
        foreach ($p in $pares) {
            $lados = $p.Split('=')
            $origem += , (Hex-Para-Rgb ($lados[0].Trim().TrimStart('#')))
            $destino += , (Hex-Para-Rgb ($lados[1].Trim().TrimStart('#')))
        }
        Write-Host ("mapeamento manual: {0} tom(ns)" -f $origem.Count)
    } else {
        if (-not $Esquema) { Write-Host "Informe -Esquema ou -Mapa (ou -ListarEsquemas)."; exit 1 }
        if (-not $script:Esquemas.Contains($Esquema)) {
            Write-Host "Esquema desconhecido: $Esquema"; Write-Host ("Disponiveis: " + ($script:Esquemas.Keys -join ', ')); exit 1
        }
        $tons = $contagem.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First 3 |
            ForEach-Object { , @{ Rgb = (Hex-Para-Rgb $_.Key); Lum = (Lum (Hex-Para-Rgb $_.Key)); Hex = $_.Key } }
        if ($tons.Count -lt 3) { Write-Host "O original tem menos de 3 tons dominantes; use -Mapa."; exit 1 }
        $tons = $tons | Sort-Object { $_.Lum } -Descending   # claro, medio, escuro
        $origem = @(); $destino = @()
        $novos = $script:Esquemas[$Esquema]
        for ($i = 0; $i -lt 3; $i++) {
            $origem += , $tons[$i].Rgb
            $destino += , (Hex-Para-Rgb $novos[$i])
        }
        Write-Host ("tons do original -> esquema '{0}':" -f $Esquema)
        for ($i = 0; $i -lt 3; $i++) {
            $rot = @('claro', 'medio', 'escuro')[$i]
            Write-Host ("  {0,-6} #{1} -> #{2}" -f $rot, $tons[$i].Hex, $novos[$i])
        }

        # O 4o tom mais frequente costuma ser o BRILHO (branco no gold, menta no
        # gem). Sem trocar o brilho, um rubi fica com brilho menta. Se ele for
        # claro o bastante, tambem e recolorido: -Brilho <hex> manda; sem isso,
        # usa um tom claro derivado do novo "claro" (mistura com branco).
        $quarto = $contagem.GetEnumerator() | Sort-Object Value -Descending | Select-Object -Skip 3 -First 1
        if ($quarto) {
            $q = Hex-Para-Rgb $quarto.Key
            $minQ = ($q | Measure-Object -Minimum).Minimum
            if ($minQ -ge 150 -and (Lum $q) -gt $tons[0].Lum + 18) {
                if ($Brilho) { $novoBrilho = Hex-Para-Rgb $Brilho.TrimStart('#') }
                else { $novoBrilho = Mistura-Branco (Hex-Para-Rgb $novos[0]) 0.55 }
                $origem += , $q
                $destino += , $novoBrilho
                Write-Host ("  brilho #{0} -> #{1:X2}{2:X2}{3:X2}" -f $quarto.Key, $novoBrilho[0], $novoBrilho[1], $novoBrilho[2])
            }
        }
    }

    # --- 2. troca os pixels ------------------------------------------------
    $tol2 = $Tolerancia * $Tolerancia
    $trocados = 0
    for ($i = 0; $i -lt $bytes.Length; $i += 4) {
        if ($bytes[$i + 3] -lt 1) { continue }
        $b = $bytes[$i]; $g = $bytes[$i + 1]; $r = $bytes[$i + 2]
        $melhor = -1; $melhorD = [double]::MaxValue
        for ($k = 0; $k -lt $origem.Count; $k++) {
            $o = $origem[$k]
            $d = [math]::Pow($r - $o[0], 2) + [math]::Pow($g - $o[1], 2) + [math]::Pow($b - $o[2], 2)
            if ($d -lt $melhorD) { $melhorD = $d; $melhor = $k }
        }
        if ($melhor -ge 0 -and $melhorD -le $tol2) {
            $n = $destino[$melhor]
            $bytes[$i] = [byte]$n[2]; $bytes[$i + 1] = [byte]$n[1]; $bytes[$i + 2] = [byte]$n[0]
            $trocados++
        }
    }

    $saidaDir = Split-Path -Parent $Saida
    if ($saidaDir -and -not (Test-Path -LiteralPath $saidaDir)) {
        New-Item -ItemType Directory -Force -Path $saidaDir | Out-Null
    }
    $dest = [System.Drawing.Bitmap]::new($w, $h, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    try {
        $dadosD = $dest.LockBits($rect, [System.Drawing.Imaging.ImageLockMode]::WriteOnly, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        [System.Runtime.InteropServices.Marshal]::Copy($bytes, 0, $dadosD.Scan0, $bytes.Length)
        $dest.UnlockBits($dadosD)
        $dest.Save($Saida, [System.Drawing.Imaging.ImageFormat]::Png)
    } finally { $dest.Dispose() }

    Write-Host ("ok: {0} ({1}x{2}) - {3} pixels recoloridos" -f $Saida, $w, $h, $trocados)
    Write-Host "Confira com: medir-icone.ps1 -Imagem <original> -Comparar $Saida"
} finally { $bmp.Dispose() }
