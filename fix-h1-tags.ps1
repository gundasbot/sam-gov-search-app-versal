# =============================================================
# Add H1 tags to 3 pages missing them
# services/page.tsx (server wrapper - safe to edit directly)
# pricing/page.tsx (need to check if client)
# search/page.tsx (need to check if client)
# =============================================================

Write-Host "=== Adding H1 Tags ===" -ForegroundColor Cyan
$fixCount = 0

$h1Fixes = @(
    @{
        Path      = ".\app\services\page.tsx"
        H1Text    = "Federal Contracting Services"
        # This is a server wrapper we created, safe to inject
    },
    @{
        Path      = ".\app\services\ServicesClient.tsx"
        H1Text    = "Federal Contracting Services"
        # The actual rendered component
    },
    @{
        Path      = ".\app\pricing\page.tsx"
        H1Text    = "Pricing Plans"
    },
    @{
        Path      = ".\app\search\page.tsx"
        H1Text    = "Search Federal Contracts"
    }
)

foreach ($f in $h1Fixes) {
    if (-not (Test-Path $f.Path)) { continue }
    $c = Get-Content $f.Path -Raw

    if ($c -match '<h1[\s>]') {
        Write-Host "  [OK] Already has H1: $($f.Path)" -ForegroundColor DarkGray
        continue
    }

    # For server wrapper (services/page.tsx) - add sr-only H1 in JSX return
    if ($f.Path -eq ".\app\services\page.tsx") {
        # The wrapper returns <ServicesClient /> - wrap it with a fragment + sr-only h1
        $c = $c -replace "return <ServicesClient />", "return (`n    <>`n      <h1 className=`"sr-only`">$($f.H1Text)</h1>`n      <ServicesClient />`n    </>`n  )"
        Set-Content $f.Path -Value $c -NoNewline
        Write-Host "  [FIXED] Added sr-only H1 to server wrapper: $($f.Path)" -ForegroundColor Green
        $fixCount++
        continue
    }

    # For client components - find the first <div or <main or <section in return()
    # and inject H1 right after it
    $isClient = $c -match '"use client"'

    # Try to inject after first opening tag in return statement
    $injected = $false

    # Pattern: find return ( then first JSX opening tag
    foreach ($tag in @('<main', '<div', '<section', '<article')) {
        if ($c -match [regex]::Escape($tag)) {
            # Find the first occurrence and inject H1 after the closing > of that tag
            $pattern = "($([regex]::Escape($tag))[^>]*>)"
            $replacement = "`$1`n      <h1 className=`"sr-only`">$($f.H1Text)</h1>"
            $newC = $c -replace $pattern, $replacement
            if ($newC -ne $c) {
                Set-Content $f.Path -Value $newC -NoNewline
                Write-Host "  [FIXED] Added sr-only H1 after $tag in: $($f.Path)" -ForegroundColor Green
                $fixCount++
                $injected = $true
                break
            }
        }
    }

    if (-not $injected) {
        Write-Host "  [MANUAL] Could not auto-inject H1 in: $($f.Path)" -ForegroundColor Yellow
        Write-Host "    Add this inside return(): <h1 className=`"sr-only`">$($f.H1Text)</h1>" -ForegroundColor DarkGray
    }
}

# =============================================================
# Verify H1s are now present
# =============================================================
Write-Host "`n--- H1 Verification ---" -ForegroundColor Cyan
$checkFiles = @(
    ".\app\services\page.tsx",
    ".\app\services\ServicesClient.tsx",
    ".\app\pricing\page.tsx",
    ".\app\search\page.tsx"
)
foreach ($f in $checkFiles) {
    if (Test-Path $f) {
        $c = Get-Content $f -Raw
        $hasH1 = $c -match '<h1[\s>]'
        $color = if ($hasH1) { "Green" } else { "Red" }
        $status = if ($hasH1) { "✓ HAS H1" } else { "✗ MISSING H1" }
        Write-Host "  $status : $f" -ForegroundColor $color
    }
}

# =============================================================
# BUILD & DEPLOY
# =============================================================
Write-Host "`n=== $fixCount fix(es) applied. Building... ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: add H1 tags to services, pricing, search pages"
    git push
    Write-Host "`n✓ Deployed." -ForegroundColor Green
    Write-Host "`nNext steps:" -ForegroundColor White
    Write-Host "  1. Re-crawl https://www.precisegovcon.com in Screaming Frog" -ForegroundColor Gray
    Write-Host "  2. Click 'Content: Exact Duplicates' and paste the 6 URLs here" -ForegroundColor Gray
    Write-Host "  3. Compress 4 images at squoosh.app -> convert to WebP" -ForegroundColor Gray
    Write-Host "  4. Submit sitemap: https://www.precisegovcon.com/sitemap.xml to Google Search Console" -ForegroundColor Gray
} else {
    Write-Host "`n✗ Build failed." -ForegroundColor Red
}