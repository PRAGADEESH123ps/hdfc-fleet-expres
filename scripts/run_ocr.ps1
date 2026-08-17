[CmdletBinding()]
param()

$imgPath = "C:\Users\Pragadeesh S\.gemini\antigravity\brain\aa9f55f3-5bb6-4479-b345-8b5b3332cfbe\media__1786954853767.png"

[void][System.Reflection.Assembly]::LoadWithPartialName("System.Drawing")
$src = [System.Drawing.Image]::FromFile($imgPath)
$w = $src.Width
$h = $src.Height
$src.Dispose()

Write-Host "Image dimensions: $w x $h"

# Crop image into chunks if height is large
Add-Type -AssemblyName System.Drawing

$chunkH = 1000
$numChunks = [math]::Ceiling($h / $chunkH)

for ($i = 0; $i -lt $numChunks; $i++) {
    $y = $i * $chunkH
    $ch = [math]::Min($chunkH, $h - $y)
    
    $bmp = New-Object System.Drawing.Bitmap $w, $ch
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $img = [System.Drawing.Image]::FromFile($imgPath)
    $g.DrawImage($img, (New-Object System.Drawing.Rectangle 0, 0, $w, $ch), (New-Object System.Drawing.Rectangle 0, $y, $w, $ch), [System.Drawing.GraphicsUnit]::Pixel)
    $img.Dispose()
    $g.Dispose()
    
    $chunkPath = "c:\Users\Pragadeesh S\Desktop\advance\chunk_$i.png"
    $bmp.Save($chunkPath, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
}

Write-Host "Created $numChunks image chunks."
