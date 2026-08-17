$WinMD1 = [Windows.Foundation.PropertyType, Windows.Foundation, ContentType = WindowsMD]
$WinMD2 = [Windows.Media.Ocr.OcrEngine, Windows.Media.Ocr, ContentType = WindowsMD]
$WinMD3 = [Windows.Graphics.Imaging.BitmapDecoder, Windows.Graphics.Imaging, ContentType = WindowsMD]
$WinMD4 = [Windows.Storage.StorageFile, Windows.Storage, ContentType = WindowsMD]

async function Get-OcrText($path) {
    $file = [Windows.Storage.StorageFile]::GetFileFromPathAsync($path).GetAwaiter().GetResult()
    $stream = $file.OpenAsync([Windows.Storage.FileAccessMode]::Read).GetAwaiter().GetResult()
    $decoder = [Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream).GetAwaiter().GetResult()
    $bmp = $decoder.GetSoftwareBitmapAsync().GetAwaiter().GetResult()
    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromUserProfileLanguage()
    $res = $engine.RecognizeAsync($bmp).GetAwaiter().GetResult()
    return $res.Lines | ForEach-Object { $_.Text }
}

$lines0 = Get-OcrText "c:\Users\Pragadeesh S\Desktop\advance\chunk_0.png"
$lines1 = Get-OcrText "c:\Users\Pragadeesh S\Desktop\advance\chunk_1.png"

$allLines = $lines0 + $lines1
$allLines | Out-File -FilePath "c:\Users\Pragadeesh S\Desktop\advance\full_ocr.txt" -Encoding utf8
Write-Host "Done! Extracted $($allLines.Count) lines."
