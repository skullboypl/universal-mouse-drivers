# EV / Authenticode sign - same idea as Fenrir Battery Tray pipeline.
# Requires Windows SDK signtool + your EV code-signing certificate installed.
#
# Usage:
#   $env:UMD_SIGN_THUMBPRINT = "AABBCCDDEE..."   # cert SHA1 thumbprint
#   .\sign.ps1
#   .\sign.ps1 -ExePath ".\UmdBatteryTray\bin\Release\net8.0-windows\win-x64\publish\UmdBatteryTray.exe"
#
# Optional:
#   $env:UMD_TIMESTAMP_URL = "http://timestamp.digicert.com"

param(
    [string]$ExePath = "",
    [string]$Thumbprint = $env:UMD_SIGN_THUMBPRINT,
    [string]$TimestampUrl = $(if ($env:UMD_TIMESTAMP_URL) { $env:UMD_TIMESTAMP_URL } else { "http://timestamp.digicert.com" }),
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

if (-not $ExePath) {
    $ExePath = Join-Path $PSScriptRoot "UmdBatteryTray\bin\Release\net8.0-windows\win-x64\publish\UmdBatteryTray.exe"
}
if (-not (Test-Path $ExePath)) {
    Write-Error "EXE not found: $ExePath - run .\build.ps1 first"
}

if (-not $Thumbprint) {
    Write-Host @"
No thumbprint. Set EV cert SHA1:

  `$env:UMD_SIGN_THUMBPRINT = '<thumbprint without spaces>'
  .\sign.ps1

List code-signing certs:
  Get-ChildItem Cert:\CurrentUser\My | Where-Object { `$_.HasPrivateKey } | Format-List Subject, Thumbprint
"@ -ForegroundColor Yellow
    exit 2
}

$Thumbprint = ($Thumbprint -replace '\s', '').ToUpperInvariant()

$signtool = @(
    "${env:ProgramFiles(x86)}\Windows Kits\10\bin\*\x64\signtool.exe",
    "${env:ProgramFiles}\Windows Kits\10\bin\*\x64\signtool.exe"
) | Get-Item -ErrorAction SilentlyContinue | Sort-Object FullName -Descending | Select-Object -First 1

if (-not $signtool) {
    Write-Error "signtool.exe not found - install Windows SDK Signing Tools"
}

Write-Host "Signing $ExePath" -ForegroundColor Cyan
Write-Host "Cert thumbprint: $Thumbprint"
& $signtool.FullName sign `
    /sha1 $Thumbprint `
    /fd SHA256 `
    /tr $TimestampUrl `
    /td SHA256 `
    /v `
    $ExePath

if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

if (-not $OutDir) {
    $OutDir = Join-Path (Split-Path $PSScriptRoot -Parent) "data\downloads"
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$dest = Join-Path $OutDir "UmdBatteryTray.exe"
Copy-Item -Force $ExePath $dest
Write-Host "Signed + copied → $dest" -ForegroundColor Green
Write-Host "Upload that file to CapRover Persistent Directory /app/data/downloads/" -ForegroundColor Green
