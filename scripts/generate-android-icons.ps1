$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot
$sourcePath = Join-Path $projectRoot "imagens/player.png"
$resourcesPath = Join-Path $projectRoot "android/app/src/main/res"

if (-not (Test-Path -LiteralPath $sourcePath)) {
    throw "Player image not found: $sourcePath"
}

# Square framing of the character's face and helmet in imagens/player.png (1024x1536).
$faceCrop = [System.Drawing.Rectangle]::new(250, 115, 650, 650)
$densities = @{
    "mipmap-mdpi" = 48
    "mipmap-hdpi" = 72
    "mipmap-xhdpi" = 96
    "mipmap-xxhdpi" = 144
    "mipmap-xxxhdpi" = 192
}

$sourceImage = [System.Drawing.Image]::FromFile($sourcePath)
try {
    foreach ($density in $densities.GetEnumerator()) {
        $outputDirectory = Join-Path $resourcesPath $density.Key
        New-Item -ItemType Directory -Force -Path $outputDirectory | Out-Null

        $icon = [System.Drawing.Bitmap]::new($density.Value, $density.Value)
        try {
            $graphics = [System.Drawing.Graphics]::FromImage($icon)
            try {
                $graphics.Clear([System.Drawing.Color]::Transparent)
                $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
                $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
                $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
                $graphics.DrawImage($sourceImage, [System.Drawing.Rectangle]::new(0, 0, $density.Value, $density.Value), $faceCrop, [System.Drawing.GraphicsUnit]::Pixel)
            } finally {
                $graphics.Dispose()
            }

            foreach ($fileName in @("ic_launcher.png", "ic_launcher_round.png", "ic_launcher_foreground.png")) {
                $icon.Save((Join-Path $outputDirectory $fileName), [System.Drawing.Imaging.ImageFormat]::Png)
            }
        } finally {
            $icon.Dispose()
        }
    }
} finally {
    $sourceImage.Dispose()
}

Write-Output "Android launcher icons generated from imagens/player.png"
