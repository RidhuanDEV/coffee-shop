param([ValidateSet('setup','api','worker','web','test')][string]$Service='setup')
$ErrorActionPreference='Stop'
$coffeeRoot=Split-Path $PSScriptRoot -Parent
# Explicitly isolated development/test configuration. Never use for production.
$env:DATABASE_URL='mysql://root:coffee-local-test-only@127.0.0.1:13308/coffee_test'
$env:REDIS_URL='redis://127.0.0.1:16379'
$env:JWT_SECRET='coffee-local-test-jwt-secret-at-least-32'
$env:NODE_ENV='test'
$env:PAYMENT_PROVIDER='mock'
$env:PUBLIC_WEB_URL='http://127.0.0.1:5173'
$env:PORT='3000'
$env:DEV_ADMIN_EMAIL='admin@ruangseduh.test'
$env:DEV_ADMIN_PASSWORD='Coffee-local-test-2026'
function Check-Command { if($LASTEXITCODE -ne 0){throw "Command failed with exit code $LASTEXITCODE"} }
Push-Location $coffeeRoot
try {
 if($Service -eq 'setup'){
  docker compose -p ruang-seduh-test -f compose.test.yml up -d --wait
  Check-Command
  Push-Location backend
  try { npm ci --ignore-scripts; Check-Command; npm run db:migrate; Check-Command; npm run db:seed:coffee; Check-Command } finally { Pop-Location }
  Push-Location frontend
  try { npm ci --ignore-scripts; Check-Command } finally { Pop-Location }
 } elseif($Service -eq 'web'){
  Push-Location frontend
  try { npm run dev -- --host 127.0.0.1; Check-Command } finally { Pop-Location }
 } elseif($Service -eq 'test'){
  Push-Location backend
  try { npm run typecheck; Check-Command; npm run lint; Check-Command; npm run test; Check-Command; npm run test:integration; Check-Command } finally { Pop-Location }
  Push-Location frontend
  try { npm run verify; Check-Command; npm run test; Check-Command } finally { Pop-Location }
 } else {
  Push-Location backend
  try { if($Service -eq 'api'){npm run dev}else{npm run worker}; Check-Command } finally { Pop-Location }
 }
} finally { Pop-Location }
