# Village1 - All-in-One Local Village Shop Platform Startup Script
$ErrorActionPreference = "Stop"
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass

$nodeBin = "C:\Users\kishore\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin"
$rootBin = Join-Path $PSScriptRoot "node_modules\.bin"
$env:PATH = "$nodeBin;$rootBin;$env:PATH"

Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host "  Starting Village1 Backend and Web Frontend" -ForegroundColor Green
Write-Host "=======================================================" -ForegroundColor Cyan

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='$nodeBin;$rootBin;' + `$env:PATH; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; Set-Location '$PSScriptRoot\server'; Write-Host 'Starting Village1 Backend...'; tsx src/index.ts"

Start-Sleep -Seconds 2

Start-Process powershell -ArgumentList "-NoExit", "-Command", "`$env:PATH='$nodeBin;$rootBin;' + `$env:PATH; Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; Set-Location '$PSScriptRoot\apps\web'; Write-Host 'Starting Village1 Web Frontend...'; vite --host 0.0.0.0 --port 5173"

Write-Host "`nVillage1 is now running!" -ForegroundColor Green
Write-Host "  - Web App:    http://localhost:5173" -ForegroundColor Yellow
Write-Host "  - API Server: http://localhost:5000/api/v1" -ForegroundColor Yellow
Write-Host "  - Swagger UI: http://localhost:5000/api-docs" -ForegroundColor Yellow
