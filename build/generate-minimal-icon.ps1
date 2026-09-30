Add-Type -AssemblyName System.Drawing

$root = Split-Path -Parent $MyInvocation.MyCommand.Path

function New-RoundedRectPath {
    param([single]$X, [single]$Y, [single]$W, [single]$H, [single]$R)
    $path = New-Object System.Drawing.Drawing2D.GraphicsPath
    $d = [single](2 * $R)
    $path.AddArc($X, $Y, $d, $d, 180, 90)
    $path.AddArc($X + $W - $d, $Y, $d, $d, 270, 90)
    $path.AddArc($X + $W - $d, $Y + $H - $d, $d, $d, 0, 90)
    $path.AddArc($X, $Y + $H - $d, $d, $d, 90, 90)
    $path.CloseFigure()
    return $path
}

function New-AppIcon {
    param([int]$S)

    $bmp = New-Object System.Drawing.Bitmap($S, $S, [System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
    $g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.Clear([System.Drawing.Color]::Transparent)

    $radius = [single]($S * 0.22)
    $rc = New-RoundedRectPath 0 0 $S $S $radius

    # Deep pure matte black background
    $bgBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 10, 10, 12))
    $g.FillPath($bgBrush, $rc)

    # Subtle hairline monochrome border
    $borderPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 42, 42, 46), [single]([Math]::Max(1.0, $S * 0.012)))
    $g.DrawPath($borderPen, $rc)

    # White brush and pens
    $whiteBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 255, 255, 255))
    $zincBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 161, 161, 170))
    $faintBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 82, 82, 91))

    # Center coordinates
    $cx = [single](0.5 * $S)
    $cy = [single](0.5 * $S)

    # Minimalist Financial Vault & Ledger Glyph:
    # 1. Outer precision geometric diamond/shield outline
    $dSize = [single]($S * 0.35)
    $p1 = New-Object System.Drawing.PointF($cx, [single]($cy - $dSize))
    $p2 = New-Object System.Drawing.PointF([single]($cx + $dSize), $cy)
    $p3 = New-Object System.Drawing.PointF($cx, [single]($cy + $dSize))
    $p4 = New-Object System.Drawing.PointF([single]($cx - $dSize), $cy)
    $diamondPoints = [System.Drawing.PointF[]]@($p1, $p2, $p3, $p4)
    $diamondPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), [single]([Math]::Max(1.5, $S * 0.032)))
    $g.DrawPolygon($diamondPen, $diamondPoints)

    # 2. Sleek horizontal encoder lines inside the diamond
    $barW1 = [single]($S * 0.32)
    $barW2 = [single]($S * 0.44)
    $barW3 = [single]($S * 0.28)
    $barH  = [single]([Math]::Max(2.0, $S * 0.038))

    # Top bar
    $g.FillRectangle($whiteBrush, [single]($cx - $barW1 * 0.5), [single]($cy - $S * 0.13), $barW1, $barH)
    # Center primary bar
    $g.FillRectangle($whiteBrush, [single]($cx - $barW2 * 0.5), [single]($cy - $barH * 0.5), $barW2, $barH)
    # Bottom bar
    $g.FillRectangle($whiteBrush, [single]($cx - $barW3 * 0.5), [single]($cy + $S * 0.13 - $barH), $barW3, $barH)

    # 3. Precision center vertical encoder needle / axis
    $axisPen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), [single]([Math]::Max(1.5, $S * 0.038)))
    $axisH = [single]($S * 0.18)
    $g.DrawLine($axisPen, $cx, $cy - $axisH, $cx, $cy + $axisH)

    # 4. Center jewel / vault core
    $coreR = [single]([Math]::Max(2.5, $S * 0.045))
    $blackBrush = New-Object System.Drawing.SolidBrush([System.Drawing.Color]::FromArgb(255, 10, 10, 12))
    $g.FillEllipse($blackBrush, $cx - $coreR, $cy - $coreR, 2 * $coreR, 2 * $coreR)
    $corePen = New-Object System.Drawing.Pen([System.Drawing.Color]::FromArgb(255, 255, 255, 255), [single]([Math]::Max(1.2, $S * 0.022)))
    $g.DrawEllipse($corePen, $cx - $coreR, $cy - $coreR, 2 * $coreR, 2 * $coreR)

    $g.Dispose()
    return $bmp
}

$sizes = @(256, 128, 64, 48, 32, 24, 16)
$outDir = Join-Path $root 'generated'
if (-not (Test-Path $outDir)) { New-Item -ItemType Directory -Path $outDir | Out-Null }

$pngBlobs = [System.Collections.Generic.List[byte[]]]::new()
foreach ($s in $sizes) {
    $bmp = New-AppIcon $s
    $ms = New-Object System.IO.MemoryStream
    $bmp.Save($ms, [System.Drawing.Imaging.ImageFormat]::Png)
    $pngBlobs.Add($ms.ToArray())
    $ms.Dispose()
    $bmp.Dispose()
}

$master = New-AppIcon 256
$masterPath = Join-Path $root 'icon.png'
$master.Save($masterPath, [System.Drawing.Imaging.ImageFormat]::Png)
$master.Dispose()

$icoPath = Join-Path $root 'icon.ico'
$fs = [System.IO.File]::Open($icoPath, [System.IO.FileMode]::Create)
$bw = New-Object System.IO.BinaryWriter($fs)
$bw.Write([byte]0); $bw.Write([byte]0)
$bw.Write([byte]1); $bw.Write([byte]0)
$bw.Write([uint16]$sizes.Count)

$offset = 6 + (16 * $sizes.Count)
for ($i = 0; $i -lt $sizes.Count; $i++) {
    $s = $sizes[$i]
    $dim = $s
    if ($dim -ge 256) { $dim = 0 }
    $bw.Write([byte]$dim)
    $bw.Write([byte]$dim)
    $bw.Write([byte]0)
    $bw.Write([byte]0)
    $bw.Write([uint16]1)
    $bw.Write([uint16]32)
    $bw.Write([uint32]$pngBlobs[$i].Length)
    $bw.Write([uint32]$offset)
    $offset += $pngBlobs[$i].Length
}
foreach ($blob in $pngBlobs) { $bw.Write($blob) }
$bw.Flush()
$bw.Close()

# Also copy to public/icon.png
$publicIcon = Join-Path $root '..\public\icon.png'
if (Test-Path (Split-Path $publicIcon)) {
    Copy-Item -LiteralPath $masterPath -Destination $publicIcon -Force
}

Write-Output "Successfully generated minimal monochrome icons:"
Write-Output " - $masterPath"
Write-Output " - $icoPath"
Write-Output " - $publicIcon"
