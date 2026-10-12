$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$webRoot = Join-Path $projectRoot "www"
New-Item -ItemType Directory -Force -Path $webRoot | Out-Null

foreach ($file in @("index.html", "Caverna.html")) {
    Copy-Item -LiteralPath (Join-Path $projectRoot $file) -Destination $webRoot -Force
}

foreach ($directory in @("css", "script", "imagens", "media")) {
    $sourceDirectory = Join-Path $projectRoot $directory
    $destinationDirectory = Join-Path $webRoot $directory
    # Limpa o destino antes de copiar: sem isso, arquivos removidos da fonte
    # (ex.: uma pasta apagada) continuariam no www/ indefinidamente.
    if (Test-Path $destinationDirectory) {
        Remove-Item -LiteralPath $destinationDirectory -Recurse -Force
    }
    New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
    # Copia o conteÃºdo da pasta, e nÃ£o a pasta em si. Assim, execuÃ§Ãµes
    # posteriores atualizam www/script/*.js em vez de criar www/script/script/.
    Copy-Item -Path (Join-Path $sourceDirectory "*") `
        -Destination $destinationDirectory -Recurse -Force
}

# Assets que NAO vao pro app: sao material de origem (folhas-fonte, inimigos
# futuros) e o material-base da Cidade (props/fundos/predios antigos) - nada
# disso e usado em runtime, entao fica de fora das builds (ver tambem o
# "files" do electron-builder no package.json, que exclui os mesmos caminhos).
$excluirPastas = @(
    "imagens\fontes",
    "imagens\inimigos-futuros",
    "imagens\cidade\edificios"
)
foreach ($rel in $excluirPastas) {
    $destino = Join-Path $webRoot $rel
    if (Test-Path $destino) {
        Remove-Item -LiteralPath $destino -Recurse -Force
    }
}
$cidadeDestino = Join-Path $webRoot "imagens\cidade"
Get-ChildItem -LiteralPath $cidadeDestino -File -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -like "props *" -or $_.Name -like "cidade background*" } |
    Remove-Item -Force

$cavernaPath = Join-Path $webRoot "Caverna.html"
$cavernaHtml = [System.IO.File]::ReadAllText($cavernaPath)
$androidSaveScript = '<script src="script/android-save.bundle.js"></script>'
if (-not $cavernaHtml.Contains($androidSaveScript)) {
    $cavernaHtml = $cavernaHtml.Replace("</head>", "$androidSaveScript`r`n</head>")
    [System.IO.File]::WriteAllText(
        $cavernaPath,
        $cavernaHtml,
        [System.Text.UTF8Encoding]::new($false)
    )
}

Write-Output "Web assets copied to $webRoot"
