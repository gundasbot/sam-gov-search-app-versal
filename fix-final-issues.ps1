# =============================================================
# PreciseGovCon - Fix Remaining 3 Issues
# 1. Non-Indexable Canonicals (service pages pointing wrong)
# 2. Exact Duplicate Pages (6 pages identical)
# 3. H1: Missing (5 pages)
# =============================================================

Write-Host "=== Fixing Remaining Issues ===" -ForegroundColor Cyan
$fixCount = 0

# =============================================================
# ISSUE 1: Non-Indexable Canonicals
# Pages showing as "Canonicalised" in Screaming Frog:
# bid-no-bid-review, capability-statements, proposal-writing, sam-registration
# These canonical tags are pointing to the wrong/non-indexable URL
# Fix: Update canonical to match the correct live HTTPS URL
# =============================================================
Write-Host "`n[1] Fixing Non-Indexable Canonicals..." -ForegroundColor Yellow

$canonicalFixes = @(
    @{ Path = ".\app\services\bid-no-bid-review\page.tsx";     Canonical = "https://www.precisegovcon.com/services/bid-no-bid-review" },
    @{ Path = ".\app\services\capability-statements\page.tsx"; Canonical = "https://www.precisegovcon.com/services/capability-statements" },
    @{ Path = ".\app\services\proposal-writing\page.tsx";      Canonical = "https://www.precisegovcon.com/services/proposal-writing" },
    @{ Path = ".\app\services\sam-registration\page.tsx";      Canonical = "https://www.precisegovcon.com/services/sam-registration" },
    @{ Path = ".\app\services\bid-search\page.tsx";            Canonical = "https://www.precisegovcon.com/services/bid-search" },
    @{ Path = ".\app\services\compliance\page.tsx";            Canonical = "https://www.precisegovcon.com/services/compliance" },
    @{ Path = ".\app\services\set-aside-certifications\page.tsx"; Canonical = "https://www.precisegovcon.com/services/set-aside-certifications" }
)

foreach ($f in $canonicalFixes) {
    if (Test-Path $f.Path) {
        $c = Get-Content $f.Path -Raw

        if ($c -match "alternates") {
            # Fix existing canonical - replace whatever URL is there
            $c = $c -replace "alternates:\s*\{[^}]*\}", "alternates: { canonical: '$($f.Canonical)' }"
            Set-Content $f.Path -Value $c -NoNewline
            Write-Host "  [FIXED] Canonical updated: $($f.Path)" -ForegroundColor Green
            $fixCount++
        } elseif ($c -match "export const metadata") {
            # Add alternates to existing metadata
            $c = $c -replace "(export const metadata[^{]*\{)", "`$1`n  alternates: { canonical: '$($f.Canonical)' },"
            Set-Content $f.Path -Value $c -NoNewline
            Write-Host "  [ADDED] Canonical added: $($f.Path)" -ForegroundColor Green
            $fixCount++
        } else {
            Write-Host "  [SKIP] No metadata found: $($f.Path)" -ForegroundColor DarkGray
        }
    } else {
        Write-Host "  [NOT FOUND] $($f.Path)" -ForegroundColor Red
    }
}

# =============================================================
# ISSUE 2: Exact Duplicate Pages (6 URLs / 24%)
# Common causes: /services pages sharing identical content
# Also: www vs non-www redirect (row 1 in crawl = 308 redirect)
# Fix: Ensure www redirect is permanent 301 not 308
# =============================================================
Write-Host "`n[2] Checking for duplicate page causes..." -ForegroundColor Yellow

# First check if we have a www redirect issue
$nextConfig = ".\next.config.ts"
if (Test-Path $nextConfig) {
    $c = Get-Content $nextConfig -Raw
    # The crawl shows https://precisegovcon.com/ → 308 redirect to www
    # 308 is fine but let's confirm the redirect exists and is correct
    if ($c -notmatch "precisegovcon.com.*www" -and $c -notmatch "www.*precisegovcon.com") {
        Write-Host "  [INFO] No explicit www redirect found - Vercel handles this automatically" -ForegroundColor DarkGray
    } else {
        Write-Host "  [OK] www redirect already configured" -ForegroundColor DarkGray
    }
}

# Scan for pages that might have identical content (same H1, same description)
Write-Host "  Scanning for duplicate metadata..." -ForegroundColor DarkGray
$titleMap = @{}
Get-ChildItem -Path ".\app" -Filter "page.tsx" -Recurse |
    Where-Object { $_.FullName -notmatch "api|_next" } |
    ForEach-Object {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -match "export const metadata") {
            $m = [regex]::Match($c, "title:\s*[`"']([^`"']+)[`"']")
            if ($m.Success) {
                $title = $m.Groups[1].Value
                if ($titleMap.ContainsKey($title)) {
                    Write-Host "  [DUPE TITLE] '$title'" -ForegroundColor Yellow
                    Write-Host "    File 1: $($titleMap[$title])" -ForegroundColor Yellow
                    Write-Host "    File 2: $($_.FullName)" -ForegroundColor Yellow
                } else {
                    $titleMap[$title] = $_.FullName
                }
            }
        }
    }

# =============================================================
# ISSUE 3: H1 Missing (5 pages / 21%)
# From crawl: these pages are missing H1 tags
# Check which public indexable pages need H1s added
# =============================================================
Write-Host "`n[3] Finding pages missing H1 tags..." -ForegroundColor Yellow

$h1Candidates = @(
    ".\app\services\page.tsx",
    ".\app\opportunities\page.tsx",
    ".\app\support\page.tsx",
    ".\app\help\page.tsx",
    ".\app\docs\page.tsx",
    ".\app\security\page.tsx",
    ".\app\status\page.tsx",
    ".\app\changelog\page.tsx",
    ".\app\accessibility\page.tsx"
)

foreach ($p in $h1Candidates) {
    if (Test-Path $p) {
        $c = Get-Content $p -Raw
        # Check if file has <h1 anywhere
        if ($c -notmatch '<h1[\s>]') {
            Write-Host "  [MISSING H1] $p" -ForegroundColor Yellow
            # Show first 3 lines after default export to understand component type
            $lines = $c -split "`n"
            $exportLine = ($lines | Select-String "export default" | Select-Object -First 1).LineNumber
            if ($exportLine) {
                Write-Host "    Component starts at line $exportLine" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "  [OK] H1 found: $p" -ForegroundColor DarkGray
        }
    }
}

# Also check service pages specifically flagged in crawl
$servicePages = @(
    @{ Path = ".\app\services\page.tsx";            H1 = "Federal Contracting Services" },
    @{ Path = ".\app\opportunities\page.tsx";        H1 = "Federal Contract Opportunities" },
    @{ Path = ".\app\insights\page.tsx";             H1 = "Federal Market Insights" }
)

Write-Host "`n  Attempting to add H1 to server-rendered pages only..." -ForegroundColor DarkGray

foreach ($s in $servicePages) {
    if (Test-Path $s.Path) {
        $c = Get-Content $s.Path -Raw
        $isClient = $c -match '"use client"'
        $hasH1 = $c -match '<h1[\s>]'

        if (-not $hasH1 -and -not $isClient) {
            # Safe to add H1 to server component - inject after first <div or <main or <section
            $c = $c -replace '(<(?:main|div|section)[^>]*>)(\s*)', "`$1`$2<h1 className=`"sr-only`">$($s.H1)</h1>`$2"
            Set-Content $s.Path -Value $c -NoNewline
            Write-Host "  [FIXED] Added sr-only H1 to: $($s.Path)" -ForegroundColor Green
            $fixCount++
        } elseif ($isClient -and -not $hasH1) {
            Write-Host "  [MANUAL] $($s.Path) is 'use client' - add H1 manually in the JSX" -ForegroundColor Yellow
        } else {
            Write-Host "  [OK] $($s.Path)" -ForegroundColor DarkGray
        }
    }
}

# =============================================================
# REPORT canonical values in all service pages
# =============================================================
Write-Host "`n--- Canonical Audit (service pages) ---" -ForegroundColor Cyan
Get-ChildItem -Path ".\app\services" -Filter "page.tsx" -Recurse | ForEach-Object {
    $c = Get-Content $_.FullName -Raw
    $canon = [regex]::Match($c, "canonical:\s*[`"']([^`"']+)[`"']")
    if ($canon.Success) {
        $url = $canon.Groups[1].Value
        $color = if ($url -match "^https://www\.precisegovcon\.com") { "Green" } else { "Red" }
        Write-Host "  $($_.Directory.Name): $url" -ForegroundColor $color
    } else {
        Write-Host "  $($_.Directory.Name): NO CANONICAL" -ForegroundColor Red
    }
}

# =============================================================
# BUILD & DEPLOY
# =============================================================
Write-Host "`n=== $fixCount fix(es) applied. Building... ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: canonical URLs, H1 tags for remaining SEO issues"
    git push
    Write-Host "`n✓ Deployed. Re-crawl https://www.precisegovcon.com" -ForegroundColor Green
} else {
    Write-Host "`n✗ Build failed." -ForegroundColor Red
}