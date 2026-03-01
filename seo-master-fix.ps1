# =============================================================
# PreciseGovCon - Master SEO Fix Script
# Run from: C:\Users\owner\Documents\sam-gov-search-app
# =============================================================

Write-Host "=== PreciseGovCon Master SEO Fix ===" -ForegroundColor Cyan

# --- 1. Fix localhost URLs ---
Write-Host "`n[1] Replacing localhost URLs..." -ForegroundColor Yellow
$prod = "https://www.precisegovcon.com"
Get-ChildItem -Path "." -Include "*.tsx","*.ts","*.js","*.jsx","*.env*" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules|\.next|\.git" } |
    ForEach-Object {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -match "http://localhost:3000") {
            $c -replace "http://localhost:3000", $prod | Set-Content $_.FullName -NoNewline
            Write-Host "  Fixed: $($_.Name)" -ForegroundColor Green
        }
    }

# --- 2. Fix page titles (replace entire title value) ---
Write-Host "`n[2] Fixing page titles..." -ForegroundColor Yellow
$titles = @(
    @{ Path = ".\app\services\bid-search\page.tsx";       Title = "Find Federal Contracts | PreciseGovCon" },
    @{ Path = ".\app\services\proposal-writing\page.tsx"; Title = "AI Proposal Writing Services | PreciseGovCon" },
    @{ Path = ".\app\services\sam-registration\page.tsx"; Title = "SAM.gov Registration Services | PreciseGovCon" },
    @{ Path = ".\app\services\compliance\page.tsx";       Title = "Federal Compliance Services | PreciseGovCon" }
)
foreach ($t in $titles) {
    if (Test-Path $t.Path) {
        $c = Get-Content $t.Path -Raw
        $c = $c -replace "title:\s*'[^']*'", "title: '$($t.Title)'"
        $c = $c -replace 'title:\s*"[^"]*"', "title: `"$($t.Title)`""
        Set-Content $t.Path -Value $c -NoNewline
        Write-Host "  Fixed: $($t.Path) -> $($t.Title)" -ForegroundColor Green
    } else {
        Write-Host "  NOT FOUND: $($t.Path)" -ForegroundColor Red
    }
}

# --- 3. Final audit ---
Write-Host "`n[3] Title Audit:" -ForegroundColor Yellow
Get-ChildItem -Path ".\app" -Filter "page.tsx" -Recurse | ForEach-Object {
    $c = Get-Content $_.FullName -Raw
    if ($c -match 'export const metadata') {
        $m = [regex]::Match($c, "title:\s*'([^']+)'")
        if (-not $m.Success) { $m = [regex]::Match($c, 'title:\s*"([^"]+)"') }
        if ($m.Success) {
            $title = $m.Groups[1].Value
            $color = if ($title.Length -gt 60) { "Red" } elseif ($title.Length -gt 55) { "Yellow" } else { "Green" }
            Write-Host "  [$($title.Length)c] $($_.Directory.Name): $title" -ForegroundColor $color
        }
    }
}

# --- 4. Build + deploy ---
Write-Host "`n[4] Building..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -eq 0) {
    Write-Host "`n[5] Deploying..." -ForegroundColor Yellow
    git add -A
    git commit -m "fix: SEO title cleanup and localhost URL fixes"
    git push
    Write-Host "`nDone! Re-crawl https://www.precisegovcon.com in Screaming Frog." -ForegroundColor Cyan
} else {
    Write-Host "`nBuild failed — fix errors before deploying." -ForegroundColor Red
}