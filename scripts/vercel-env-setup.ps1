# Hooshagar — همگام‌سازی env با Vercel
# پیش‌نیاز: vercel login && vercel link (در ریشه پروژه)
#
# استفاده:
#   .\scripts\vercel-env-setup.ps1 -Environment production
#   .\scripts\vercel-env-setup.ps1 -Environment preview

param(
  [ValidateSet('production', 'preview', 'development')]
  [string]$Environment = 'production'
)

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$envFile = Join-Path $root '.env.local'

if (-not (Get-Command vercel -ErrorAction SilentlyContinue)) {
  Write-Error 'Vercel CLI نصب نیست. npm i -g vercel'
}

$whoami = vercel whoami 2>&1
if ($LASTEXITCODE -ne 0) {
  Write-Host 'ابتدا وارد شوید: vercel login'
  exit 1
}

if (-not (Test-Path $envFile)) {
  Write-Error "فایل .env.local یافت نشد: $envFile"
}

$keys = @(
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'NEXT_PUBLIC_APP_URL',
  'JWT_SECRET',
  'GOOGLE_API_KEY',
  'GOOGLE_API_KEY_1',
  'OPENROUTER_API_KEY',
  'KAVENEGAR_API_KEY',
  'KAVENEGAR_SENDER',
  'ZARINPAL_MERCHANT_ID',
  'UPSTASH_REDIS_REST_URL',
  'UPSTASH_REDIS_REST_TOKEN',
  'KV_REST_API_URL',
  'KV_REST_API_TOKEN'
)

Write-Host "همگام‌سازی $($keys.Count) متغیر برای $Environment ..." -ForegroundColor Cyan

$lines = Get-Content $envFile
$map = @{}
foreach ($line in $lines) {
  if ($line -match '^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$') {
    $map[$matches[1]] = $matches[2].Trim().Trim('"').Trim("'")
  }
}

foreach ($key in $keys) {
  if (-not $map.ContainsKey($key) -or [string]::IsNullOrWhiteSpace($map[$key])) {
    Write-Host "  skip (خالی): $key" -ForegroundColor Yellow
    continue
  }
  $value = $map[$key]
  Write-Host "  set: $key"
  $value | vercel env add $key $Environment --force 2>$null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "  warn: $key — ممکن است از قبل وجود داشته باشد" -ForegroundColor Yellow
  }
}

Write-Host "`nبررسی env در Vercel:" -ForegroundColor Green
vercel env ls $Environment

Write-Host "`nDeploy preview:" -ForegroundColor Green
Write-Host "  vercel --prod=false"
