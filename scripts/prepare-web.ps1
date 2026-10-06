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
    New-Item -ItemType Directory -Force -Path $destinationDirectory | Out-Null
    # Copia o conteÃºdo da pasta, e nÃ£o a pasta em si. Assim, execuÃ§Ãµes
    # posteriores atualizam www/script/*.js em vez de criar www/script/script/.
    Copy-Item -Path (Join-Path $sourceDirectory "*") `
        -Destination $destinationDirectory -Recurse -Force
}

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
