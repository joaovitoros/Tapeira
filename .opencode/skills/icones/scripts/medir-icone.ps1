<#
  medir-icone.ps1 - inspeciona um PNG de ícone: dimensões, transparência,
  caixa do conteúdo, paleta (top cores) e um MAPA ASCII da forma.

  É o "olho" da skill: use antes e depois de gerar um ícone para comparar com
  o original (proporções, paleta e silhueta). Sem dependências além do
  System.Drawing (o próprio projeto já usa em scripts/generate-android-icons.ps1).

  Como rodar (o arquivo vive num caminho UNC \\wsl.localhost\..., e o PowerShell
  bloqueia scripts de UNC — use -ExecutionPolicy Bypass, como os outros scripts
  do projeto):

    powershell -NoProfile -ExecutionPolicy Bypass -File <este-script> `
      -Imagem imagens/gold.png -Cols 56

    # comparar gerado x original (mesma grade, paleta do original):
    powershell ... -File <este-script> -Imagem imagens/gold.png -Comparar imagens/prata.png
#>
param(
    [Parameter(Mandatory = $true)][string]$Imagem,
    [string]$Comparar,
    [int]$Cols = 56,
    [int]$TopCores = 8,
    [int]$AlphaMinimo = 128
)

Add-Type -AssemblyName System.Drawing

$script:Letras = @('L', 'M', 'D', 'W', '1', '2', '3', '4', '5', '6')

function Hex-Para-Rgb($hex) {
    return , @(
        [Convert]::ToInt32($hex.Substring(0, 2), 16),
        [Convert]::ToInt32($hex.Substring(2, 2), 16),
        [Convert]::ToInt32($hex.Substring(4, 2), 16)
    )
}

function Get-Resumo($caminho) {
    $bmp = [System.Drawing.Bitmap]::FromFile($caminho)
    try {
        $w = $bmp.Width; $h = $bmp.Height
        $cores = @{}
        $transp = 0
        $minX = $w; $maxX = -1; $minY = $h; $maxY = -1
        for ($y = 0; $y -lt $h; $y++) {
            for ($x = 0; $x -lt $w; $x++) {
                $c = $bmp.GetPixel($x, $y)
                if ($c.A -lt $AlphaMinimo) { $transp++; continue }
                if ($x -lt $minX) { $minX = $x }
                if ($x -gt $maxX) { $maxX = $x }
                if ($y -lt $minY) { $minY = $y }
                if ($y -gt $maxY) { $maxY = $y }
                $key = ("{0:X2}{1:X2}{2:X2}" -f $c.R, $c.G, $c.B)
                if ($cores.ContainsKey($key)) { $cores[$key]++ } else { $cores[$key] = 1 }
            }
        }
        return @{
            W = $w; H = $h; Cores = $cores; Transparentes = $transp
            MinX = $minX; MaxX = $maxX; MinY = $minY; MaxY = $maxY
        }
    } finally { $bmp.Dispose() }
}

function Write-Mapa($caminho, $paleta, $cols, $alphaMin) {
    $bmp = [System.Drawing.Bitmap]::FromFile($caminho)
    try {
        $w = $bmp.Width; $h = $bmp.Height
        $rows = [int]($cols * $h / $w / 2)
        Write-Host "  mapa ${cols}x${rows} (letras = paleta de referencia):"
        for ($r = 0; $r -lt $rows; $r++) {
            $linha = "    "
            for ($c = 0; $c -lt $cols; $c++) {
                $x = [int](($c + 0.5) * $w / $cols)
                $y = [int](($r + 0.5) * $h / $rows)
                $p = $bmp.GetPixel($x, $y)
                if ($p.A -lt $alphaMin) { $linha += "."; continue }
                $melhorIdx = 0; $melhorD = [double]::MaxValue
                for ($i = 0; $i -lt $paleta.Count; $i++) {
                    $q = $paleta[$i]
                    $d = [math]::Pow($p.R - $q[0], 2) + [math]::Pow($p.G - $q[1], 2) + [math]::Pow($p.B - $q[2], 2)
                    if ($d -lt $melhorD) { $melhorD = $d; $melhorIdx = $i }
                }
                $linha += $script:Letras[$melhorIdx]
            }
            Write-Host $linha
        }
    } finally { $bmp.Dispose() }
}

function Write-Descricao($caminho, $titulo) {
    if (-not (Test-Path -LiteralPath $caminho)) { Write-Host "FALTA: $caminho"; return $null }
    $info = Get-Resumo $caminho
    $total = $info.W * $info.H
    Write-Host "=== $titulo ($($info.W) x $($info.H)) ==="
    Write-Host ("  transparentes: {0:N1}%" -f (100 * $info.Transparentes / $total))
    if ($info.MaxX -ge 0) {
        $cw = $info.MaxX - $info.MinX + 1
        $ch = $info.MaxY - $info.MinY + 1
        $porW = 100.0 * $cw / $info.W
        $porH = 100.0 * $ch / $info.H
        Write-Host ("  conteudo: {0}x{1}px  ({2:N0}% x {3:N0}% do canvas)  x {4}..{5}, y {6}..{7}" -f `
                $cw, $ch, $porW, $porH, $info.MinX, $info.MaxX, $info.MinY, $info.MaxY)
    }
    Write-Host "  paleta (top $TopCores):"
    $top = $info.Cores.GetEnumerator() | Sort-Object Value -Descending | Select-Object -First $TopCores
    foreach ($t in $top) {
        Write-Host ("    #{0}  {1,8}px  {2,5:N2}%" -f $t.Key, $t.Value, (100 * $t.Value / $total))
    }
    # Letras SEMPRE por luminância (L=mais claro ...), nunca por frequência:
    # cores com contagem quase igual trocariam de letra entre execuções. O
    # BRILHO (tom palido bem mais claro que os outros) vira 'W' e vai por
    # ultimo, para o mapa continuar legivel: L/M/D = os 3 tons, W = brilho.
    $porLum = $top | Sort-Object { $r = Hex-Para-Rgb $_.Key; 0.299 * $r[0] + 0.587 * $r[1] + 0.114 * $r[2] } -Descending
    $lums = $porLum | ForEach-Object { $r = Hex-Para-Rgb $_.Key; 0.299 * $r[0] + 0.587 * $r[1] + 0.114 * $r[2] }
    $ordem = @($porLum)
    if ($porLum.Count -ge 4) {
        $primeiro = Hex-Para-Rgb $porLum[0].Key
        $minPrimeiro = ($primeiro | Measure-Object -Minimum).Minimum
        if ($minPrimeiro -ge 150 -and $lums[0] -gt $lums[1] + 18) {
            $ordem = @($porLum[1..($porLum.Count - 1)]) + @($porLum[0])   # brilho vai pro fim
        }
    }
    $info.Paleta = @()
    $legenda = @()
    for ($i = 0; $i -lt $ordem.Count; $i++) {
        $info.Paleta += , (Hex-Para-Rgb $ordem[$i].Key)
        $legenda += ("{0}=#{1}" -f $script:Letras[$i], $ordem[$i].Key)
    }
    Write-Host ("  letras: " + ($legenda -join "  "))
    return $info
}

$orig = Write-Descricao $Imagem "imagem"

if ($orig) {
    Write-Mapa $Imagem $orig.Paleta $Cols $AlphaMinimo
}

if ($Comparar) {
    $null = Write-Descricao $Comparar "comparacao"
    if ($orig) {
        Write-Mapa $Comparar $orig.Paleta $Cols $AlphaMinimo
    }
}
