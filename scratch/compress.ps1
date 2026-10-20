Add-Type -AssemblyName System.Drawing
$inPath = "public/sample_dustbin_overflow.jpg"
$outPath = "public/sample_dustbin_overflow_small.jpg"
if (Test-Path $inPath) {
    $img = [System.Drawing.Image]::FromFile((Resolve-Path $inPath).Path)
    $newWidth = 640
    $newHeight = [int]($img.Height * ($newWidth / $img.Width))
    $bmp = New-Object System.Drawing.Bitmap $newWidth, $newHeight
    $graph = [System.Drawing.Graphics]::FromImage($bmp)
    $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $graph.DrawImage($img, 0, 0, $newWidth, $newHeight)
    $img.Dispose()
    
    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $encParams = New-Object System.Drawing.Imaging.EncoderParameters(1)
    $encParams.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter([System.Drawing.Imaging.Encoder]::Quality, [long]65)
    
    $bmp.Save((Resolve-Path .).Path + "/" + $outPath, $codec, $encParams)
    $bmp.Dispose()
    $size = (Get-Item $outPath).Length
    Write-Host "Created $outPath with size: $size bytes"
}
