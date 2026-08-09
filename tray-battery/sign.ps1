# EV / Authenticode - same cert + timestamp as Fenrir Battery Tray.
param(
    [string]$Exe = (Join-Path $PSScriptRoot "UmdBatteryTray\bin\Release\net8.0-windows\win-x64\publish\UmdBatteryTray.exe"),
    [string]$SignTool = "C:\Program Files (x86)\Microsoft SDKs\ClickOnce\SignTool\signtool.exe",
    [string]$Sha1 = "549221B68AADFFDC8580812275A1789C0C8CEC5F",
    [string]$TimestampUrl = "http://time.certum.pl",
    [string]$OutDir = ""
)

$ErrorActionPreference = "Stop"

$exePath = Get-Item -LiteralPath $Exe -ErrorAction SilentlyContinue
if (-not $exePath) {
    Write-Error "Exe not found: $Exe`nRun build.ps1 first."
}

if (-not (Test-Path $SignTool)) {
    Write-Error "signtool not found at: $SignTool"
}

Write-Host "Signing (EV / $Sha1): $($exePath.FullName)" -ForegroundColor Cyan

$signProcess = Start-Process -FilePath $SignTool `
    -ArgumentList @(
        "sign",
        "/sha1", $Sha1,
        "/t", $TimestampUrl,
        "/fd", "sha256",
        "/v", "`"$($exePath.FullName)`""
    ) -NoNewWindow -Wait -PassThru

if ($signProcess.ExitCode -ne 0) {
    Write-Error "Signing failed (exit code $($signProcess.ExitCode))."
}

Write-Host "Signed OK." -ForegroundColor Green

$repoRoot = Split-Path $PSScriptRoot -Parent
if (-not $OutDir) {
    $OutDir = Join-Path $repoRoot "web\bundled-downloads"
}
New-Item -ItemType Directory -Force -Path $OutDir | Out-Null
$dest = Join-Path $OutDir "UmdBatteryTray.exe"
Copy-Item -Force $exePath.FullName $dest
Write-Host "Copied -> $dest" -ForegroundColor Green

# Local CapRover-style data dir (gitignored)
$localData = Join-Path $repoRoot "data\downloads"
New-Item -ItemType Directory -Force -Path $localData | Out-Null
Copy-Item -Force $exePath.FullName (Join-Path $localData "UmdBatteryTray.exe")
Write-Host "Also copied -> $localData\UmdBatteryTray.exe" -ForegroundColor Green
Write-Host "Commit web/bundled-downloads/UmdBatteryTray.exe so CapRover image serves /api/downloads/UmdBatteryTray.exe" -ForegroundColor Cyan
