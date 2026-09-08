$ErrorActionPreference = "Stop"

$project = Join-Path $PSScriptRoot "UmdBatteryTray\UmdBatteryTray.csproj"

Write-Host "Building UmdBatteryTray (Release, win-x64, single-file)..." -ForegroundColor Cyan

dotnet publish $project `
    -c Release `
    -r win-x64 `
    --self-contained true `
    -p:PublishSingleFile=true `
    -p:IncludeNativeLibrariesForSelfExtract=true `
    -p:EnableCompressionInSingleFile=true

$exe = Join-Path $PSScriptRoot "UmdBatteryTray\bin\Release\net8.0-windows\win-x64\publish\UmdBatteryTray.exe"

if (Test-Path $exe) {
    $size = [math]::Round((Get-Item $exe).Length / 1MB, 1)
    Write-Host ""
    Write-Host "OK: $exe ($size MB)" -ForegroundColor Green
    Write-Host "Next: .\sign.ps1  (EV code signing) then upload to CapRover /app/data/downloads/" -ForegroundColor Cyan
} else {
    Write-Error "Build failed - exe not found."
}
