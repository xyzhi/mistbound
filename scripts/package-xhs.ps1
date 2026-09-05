param(
  [string]$Source = "dist",
  [string]$Output = "mistbound-1.0.1.zip"
)

$ErrorActionPreference = "Stop"
Add-Type -AssemblyName System.IO.Compression
$sourcePath = (Resolve-Path -LiteralPath $Source).Path.TrimEnd("\", "/")
$outputPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Output))

if (Test-Path -LiteralPath $outputPath) {
  Remove-Item -LiteralPath $outputPath -Force
}

$stream = [System.IO.File]::Open($outputPath, [System.IO.FileMode]::CreateNew)
$archive = [System.IO.Compression.ZipArchive]::new(
  $stream,
  [System.IO.Compression.ZipArchiveMode]::Create
)

try {
  Get-ChildItem -LiteralPath $sourcePath -File -Recurse | ForEach-Object {
    $relativePath = $_.FullName.Substring($sourcePath.Length).TrimStart("\", "/").Replace("\", "/")
    $entry = $archive.CreateEntry($relativePath, [System.IO.Compression.CompressionLevel]::Optimal)
    $entryStream = $entry.Open()
    $fileStream = [System.IO.File]::OpenRead($_.FullName)
    try {
      $fileStream.CopyTo($entryStream)
    } finally {
      $fileStream.Dispose()
      $entryStream.Dispose()
    }
  }
} finally {
  $archive.Dispose()
  $stream.Dispose()
}

Write-Host "Created $outputPath"
