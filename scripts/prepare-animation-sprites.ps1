$ErrorActionPreference = "Stop"

Add-Type -AssemblyName System.Drawing

$projectRoot = Split-Path -Parent $PSScriptRoot

function New-TransparentSpriteStrip {
    param(
        [string]$Source,
        [string]$Destination,
        [int]$Frames,
        [int]$CropTop,
        [int]$CropHeight,
        [int]$FrameWidth,
        [string]$FrameDestinationDirectory = "",
        [string]$KeyColor = "magenta"
    )

    $sourceImage = [System.Drawing.Bitmap]::new($Source)
    try {
        $strip = [System.Drawing.Bitmap]::new($Frames * $FrameWidth, $CropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
        try {
            for ($frame = 0; $frame -lt $Frames; $frame++) {
                $sourceLeft = [Math]::Floor($frame * $sourceImage.Width / $Frames)
                $sourceRight = [Math]::Floor(($frame + 1) * $sourceImage.Width / $Frames)
                $sourceWidth = $sourceRight - $sourceLeft

                for ($y = 0; $y -lt $CropHeight; $y++) {
                    for ($x = 0; $x -lt $FrameWidth; $x++) {
                        $sourceX = $sourceLeft + [Math]::Min($sourceWidth - 1, [Math]::Floor($x * $sourceWidth / $FrameWidth))
                        $color = $sourceImage.GetPixel($sourceX, $CropTop + $y)
                        # Remove the chroma background while preserving the red scarf.
                        $isBackground = $false
                        if ($KeyColor -eq "green") {
                            $isBackground = ($color.G -gt 120 -and $color.G -gt $color.R + 60 -and $color.G -gt $color.B + 60)
                        } else {
                            $isBackground = ($color.R -gt 210 -and $color.G -lt 110 -and $color.B -gt 170)
                        }
                        if ($isBackground) {
                            $strip.SetPixel($frame * $FrameWidth + $x, $y, [System.Drawing.Color]::Transparent)
                        } else {
                            $strip.SetPixel($frame * $FrameWidth + $x, $y, $color)
                        }
                    }
                }
            }

            $strip.Save($Destination, [System.Drawing.Imaging.ImageFormat]::Png)

            if ($FrameDestinationDirectory) {
                New-Item -ItemType Directory -Force -Path $FrameDestinationDirectory | Out-Null
                for ($frame = 0; $frame -lt $Frames; $frame++) {
                    $singleFrame = $strip.Clone([System.Drawing.Rectangle]::new($frame * $FrameWidth, 0, $FrameWidth, $CropHeight), $strip.PixelFormat)
                    try {
                        $singleFrame.Save((Join-Path $FrameDestinationDirectory "fuga-$($frame + 1).png"), [System.Drawing.Imaging.ImageFormat]::Png)
                    } finally {
                        $singleFrame.Dispose()
                    }
                }
            }
        } finally {
            $strip.Dispose()
        }
    } finally {
        $sourceImage.Dispose()
    }
}

function New-TransparentEscapeFrames {
    param(
        [string]$Source,
        [string]$DestinationDirectory,
        [object[]]$Bounds,
        [int]$CropTop,
        [int]$CropHeight,
        [int]$FrameWidth
    )

    New-Item -ItemType Directory -Force -Path $DestinationDirectory | Out-Null
    $sourceImage = [System.Drawing.Bitmap]::new($Source)
    try {
        for ($frame = 0; $frame -lt $Bounds.Count; $frame++) {
            $sourceLeft = [int]$Bounds[$frame][0]
            $sourceWidth = [int]$Bounds[$frame][1]
            $destinationLeft = [Math]::Floor(($FrameWidth - $sourceWidth) / 2)
            $singleFrame = [System.Drawing.Bitmap]::new($FrameWidth, $CropHeight, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
            try {
                for ($y = 0; $y -lt $CropHeight; $y++) {
                    for ($x = 0; $x -lt $sourceWidth; $x++) {
                        $color = $sourceImage.GetPixel($sourceLeft + $x, $CropTop + $y)
                        if ($color.R -gt 210 -and $color.G -lt 110 -and $color.B -gt 170) {
                            $singleFrame.SetPixel($destinationLeft + $x, $y, [System.Drawing.Color]::Transparent)
                        } else {
                            $destinationX = $destinationLeft + $x
                            $isAdjacentPoseFragment = switch ($frame) {
                                2 { ($destinationX -lt 70 -and $y -gt 300) -or ($destinationX -gt 265 -and $y -lt 240) }
                                3 { ($destinationX -lt 120 -and $y -gt 280) -or ($destinationX -gt 350 -and $y -gt 180) }
                                4 { $destinationX -lt 75 -and $y -gt 280 }
                                default { $false }
                            }
                            if ($isAdjacentPoseFragment) {
                                $singleFrame.SetPixel($destinationX, $y, [System.Drawing.Color]::Transparent)
                            } else {
                                $singleFrame.SetPixel($destinationX, $y, $color)
                            }
                        }
                    }
                }
                $singleFrame.Save((Join-Path $DestinationDirectory "fuga-$($frame + 1).png"), [System.Drawing.Imaging.ImageFormat]::Png)
            } finally {
                $singleFrame.Dispose()
            }
        }
    } finally {
        $sourceImage.Dispose()
    }
}

New-TransparentSpriteStrip `
    -Source (Join-Path $projectRoot "imagens/ataque/ataque.png") `
    -Destination (Join-Path $projectRoot "imagens/ataque/ataque-sprites.png") `
    -Frames 6 -CropTop 0 -CropHeight 256 -FrameWidth 256 -KeyColor "green"

New-TransparentSpriteStrip `
    -Source (Join-Path $projectRoot "imagens/fugindo/fugindo.png") `
    -Destination (Join-Path $projectRoot "imagens/fugindo/fugindo-sprites.png") `
    -Frames 7 -CropTop 160 -CropHeight 430 -FrameWidth 320

# The escape sheet has eight poses with different widths. Keep each crop inside
# its pose so adjacent characters do not leak into the animation frame.
$escapeFrameBounds = @(
    @(0, 280),
    @(285, 290),
    @(575, 365),
    @(830, 321),
    @(1120, 278),
    @(1398, 244),
    @(1657, 243),
    @(1919, 253)
)
New-TransparentEscapeFrames `
    -Source (Join-Path $projectRoot "imagens/fugindo/fugindo.png") `
    -DestinationDirectory (Join-Path $projectRoot "imagens/fugindo/frames") `
    -Bounds $escapeFrameBounds -CropTop 160 -CropHeight 430 -FrameWidth 400

Write-Output "Animation sprite strips prepared"
