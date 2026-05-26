$ErrorActionPreference = "Stop"

$PluginSlug = "rp-coverage-dashboard"
$Root = Split-Path -Parent $PSScriptRoot
$ReleaseDir = Join-Path $Root "release"
$StageDir = Join-Path $ReleaseDir $PluginSlug
$ZipPath = Join-Path $ReleaseDir "$PluginSlug.zip"

Set-Location $Root

Write-Host "Building React assets..."
npm run build

Write-Host "Preparing release folder..."
Remove-Item $StageDir -Recurse -Force -ErrorAction SilentlyContinue
Remove-Item $ZipPath -Force -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Path $StageDir | Out-Null

Copy-Item (Join-Path $Root "rp-coverage-dashboard.php") $StageDir
Copy-Item (Join-Path $Root "index.php") $StageDir
Copy-Item (Join-Path $Root "README.txt") $StageDir
Copy-Item (Join-Path $Root "dist") $StageDir -Recurse

Write-Host "Creating plugin zip..."
Compress-Archive -Path $StageDir -DestinationPath $ZipPath -Force

Write-Host "Created $ZipPath"
