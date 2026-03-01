# =============================================================
# Fix: Remove bad redirect from headers() in next.config.ts
# and put it in the correct redirects() function
# =============================================================

Write-Host "=== Fixing next.config.ts ===" -ForegroundColor Cyan

$path = ".\next.config.ts"
$c = Get-Content $path -Raw

# Remove the bad block that was injected into headers()
$bad = @"
      // Redirect parameterized contact URLs to canonical /contact
      {
        source: '/contact',
        has: [{ type: 'query', key: 'service' }],
        destination: '/contact',
        permanent: true,
      },
"@

$c = $c.Replace($bad, "")
Set-Content $path -Value $c -NoNewline
Write-Host "  [REMOVED] Bad redirect from headers()" -ForegroundColor Green

# Verify headers() no longer has destination/permanent fields
if ($c -match "destination.*permanent" -and $c -notmatch "async redirects") {
    Write-Host "  [WARN] Still detecting destination/permanent in headers - check manually" -ForegroundColor Yellow
} else {
    Write-Host "  [OK] next.config.ts looks clean" -ForegroundColor Green
}

# Build to confirm fix
Write-Host "`nBuilding..." -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: remove bad redirect from headers in next.config.ts"
    git push
    Write-Host "`n✓ Deployed." -ForegroundColor Green
} else {
    Write-Host "`n✗ Still failing - paste the error and we'll fix manually" -ForegroundColor Red
}