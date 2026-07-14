param(
    [string]$Mode = "release",
    [string]$Target = "default"
)

$ErrorActionPreference = "Stop"

Write-Host "============================================" -ForegroundColor Cyan
Write-Host "  ClockForge Build Script (PowerShell)" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

function Test-Command {
    param([string]$Command)
    $exists = $null -ne (Get-Command $Command -ErrorAction SilentlyContinue)
    if (-not $exists) {
        Write-Host "ERROR: $Command is not installed. Please install it first." -ForegroundColor Red
        exit 1
    }
}

Write-Host "[1/5] Checking dependencies..." -ForegroundColor Yellow
Test-Command "node"
Test-Command "pnpm"
Test-Command "cargo"
Test-Command "tauri"

$nodeVersion = node --version
$pnpmVersion = pnpm --version
$rustVersion = cargo --version
$tauriVersion = tauri --version

Write-Host "  Node.js: $nodeVersion" -ForegroundColor Green
Write-Host "  pnpm: $pnpmVersion" -ForegroundColor Green
Write-Host "  Cargo: $rustVersion" -ForegroundColor Green
Write-Host "  Tauri CLI: $tauriVersion" -ForegroundColor Green
Write-Host ""

Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
pnpm install
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to install dependencies" -ForegroundColor Red
    exit 1
}
Write-Host "  Dependencies installed successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[3/5] Building frontend..." -ForegroundColor Yellow
pnpm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build frontend" -ForegroundColor Red
    exit 1
}
Write-Host "  Frontend built successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[4/5] Building Tauri application..." -ForegroundColor Yellow
$buildArgs = @()
if ($Mode -eq "release") {
    $buildArgs += "--release"
} else {
    $buildArgs += "--debug"
}

if ($Target -ne "default") {
    $buildArgs += "--target"
    $buildArgs += $Target
}

Write-Host "  Mode: $Mode" -ForegroundColor Cyan
Write-Host "  Target: $Target" -ForegroundColor Cyan

pnpm run tauri build @buildArgs
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Failed to build Tauri application" -ForegroundColor Red
    exit 1
}
Write-Host "  Tauri application built successfully" -ForegroundColor Green
Write-Host ""

Write-Host "[5/5] Build completed!" -ForegroundColor Green
Write-Host "============================================" -ForegroundColor Cyan

if ($Mode -eq "release") {
    $outputPath = Join-Path $PWD "src-tauri\target\x86_64-pc-windows-msvc\release"
} else {
    $outputPath = Join-Path $PWD "src-tauri\target\x86_64-pc-windows-msvc\debug"
}

Write-Host "  Output directory: $outputPath" -ForegroundColor Cyan
Write-Host "  Executable: clockforge.exe" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
