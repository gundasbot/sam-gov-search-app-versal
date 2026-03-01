# =============================================================
# PreciseGovCon - Final SEO Fixes
# Remaining: Exact Duplicates, H1 Missing (4), Canonicals Missing (12)
# =============================================================

Write-Host "=== Final SEO Fixes ===" -ForegroundColor Cyan
$fixCount = 0

# =============================================================
# 1. Find which pages are exact duplicates
# Click "Content: Exact Duplicates" in Screaming Frog to see them
# Most likely: pages sharing identical HTML because they have no
# unique content (empty shells, same layout, no body text)
# Fix: ensure every page has unique title + description + canonical
# =============================================================
Write-Host "`n[1] Scanning for pages with missing/duplicate metadata..." -ForegroundColor Yellow

$allPages = Get-ChildItem -Path ".\app" -Filter "page.tsx" -Recurse |
    Where-Object { $_.FullName -notmatch "api|_next|node_modules" }

$titlesSeen = @{}
$descsSeen  = @{}

foreach ($f in $allPages) {
    $c = Get-Content $f.FullName -Raw -ErrorAction SilentlyContinue
    if (-not $c) { continue }

    $tm = [regex]::Match($c, "title:\s*[`"']([^`"']+)[`"']")
    $dm = [regex]::Match($c, "description:\s*[`"']([^`"']+)[`"']")
    $t  = if ($tm.Success) { $tm.Groups[1].Value } else { "" }
    $d  = if ($dm.Success) { $dm.Groups[1].Value } else { "" }

    if ($t -and $titlesSeen.ContainsKey($t)) {
        Write-Host "  [DUPE TITLE] '$t'" -ForegroundColor Yellow
        Write-Host "    $($titlesSeen[$t])" -ForegroundColor DarkGray
        Write-Host "    $($f.FullName)" -ForegroundColor DarkGray
    } elseif ($t) { $titlesSeen[$t] = $f.FullName }

    if ($d -and $descsSeen.ContainsKey($d)) {
        Write-Host "  [DUPE DESC] '$($d.Substring(0,[Math]::Min(60,$d.Length)))...'" -ForegroundColor Yellow
        Write-Host "    $($descsSeen[$d])" -ForegroundColor DarkGray
        Write-Host "    $($f.FullName)" -ForegroundColor DarkGray
    } elseif ($d) { $descsSeen[$d] = $f.FullName }
}

# =============================================================
# 2. Add missing canonicals to pages that still lack them
# Screaming Frog shows 12 pages missing canonicals
# These are likely non-service pages (privacy, terms, help, etc.)
# =============================================================
Write-Host "`n[2] Adding missing canonicals to content pages..." -ForegroundColor Yellow

$missingCanonicals = @{
    ".\app\privacy\page.tsx"        = "https://www.precisegovcon.com/privacy"
    ".\app\terms\page.tsx"          = "https://www.precisegovcon.com/terms"
    ".\app\security\page.tsx"       = "https://www.precisegovcon.com/security"
    ".\app\support\page.tsx"        = "https://www.precisegovcon.com/support"
    ".\app\help\page.tsx"           = "https://www.precisegovcon.com/help"
    ".\app\docs\page.tsx"           = "https://www.precisegovcon.com/docs"
    ".\app\pricing\page.tsx"        = "https://www.precisegovcon.com/pricing"
    ".\app\features\page.tsx"       = "https://www.precisegovcon.com/features"
    ".\app\search\page.tsx"         = "https://www.precisegovcon.com/search"
    ".\app\opportunities\page.tsx"  = "https://www.precisegovcon.com/opportunities"
    ".\app\insights\page.tsx"       = "https://www.precisegovcon.com/insights"
    ".\app\about\page.tsx"          = "https://www.precisegovcon.com/about"
    ".\app\contact\page.tsx"        = "https://www.precisegovcon.com/contact"
    ".\app\page.tsx"                = "https://www.precisegovcon.com"
    ".\app\alerts\page.tsx"         = "https://www.precisegovcon.com/alerts"
    ".\app\changelog\page.tsx"      = "https://www.precisegovcon.com/changelog"
    ".\app\status\page.tsx"         = "https://www.precisegovcon.com/status"
    ".\app\accessibility\page.tsx"  = "https://www.precisegovcon.com/accessibility"
}

foreach ($entry in $missingCanonicals.GetEnumerator()) {
    if (-not (Test-Path $entry.Key)) { continue }
    $c = Get-Content $entry.Key -Raw
    $isClient = $c -match '"use client"'
    if ($isClient) { Write-Host "  [SKIP-CLIENT] $($entry.Key)" -ForegroundColor DarkGray; continue }

    if ($c -match "alternates") {
        # Verify it's pointing to www version
        $existing = [regex]::Match($c, "canonical:\s*[`"']([^`"']+)[`"']").Groups[1].Value
        if ($existing -eq $entry.Value) {
            Write-Host "  [OK] $($entry.Key)" -ForegroundColor DarkGray
        } else {
            $c = $c -replace "canonical:\s*[`"'][^`"']+[`"']", "canonical: '$($entry.Value)'"
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [UPDATED] $($entry.Key) -> $($entry.Value)" -ForegroundColor Green
            $fixCount++
        }
    } elseif ($c -match "export const metadata") {
        $c = $c -replace "(export const metadata[^=]*=[^{]*\{)", "`$1`n  alternates: { canonical: '$($entry.Value)' },"
        Set-Content $entry.Key -Value $c -NoNewline
        Write-Host "  [ADDED] $($entry.Key)" -ForegroundColor Green
        $fixCount++
    }
}

# =============================================================
# 3. H1 Missing - identify the 4 pages and report them
# Since most are "use client", we just report which ones need
# manual H1 addition in the JSX
# =============================================================
Write-Host "`n[3] Checking all indexable pages for H1 tags..." -ForegroundColor Yellow

$publicPages = @(
    ".\app\page.tsx",
    ".\app\about\page.tsx",
    ".\app\services\page.tsx",
    ".\app\services\ServicesClient.tsx",
    ".\app\pricing\page.tsx",
    ".\app\features\page.tsx",
    ".\app\contact\page.tsx",
    ".\app\insights\page.tsx",
    ".\app\opportunities\page.tsx",
    ".\app\search\page.tsx",
    ".\app\privacy\page.tsx",
    ".\app\terms\page.tsx",
    ".\app\support\page.tsx",
    ".\app\help\page.tsx",
    ".\app\security\page.tsx",
    ".\app\services\bid-search\page.tsx",
    ".\app\services\proposal-writing\page.tsx",
    ".\app\services\sam-registration\page.tsx",
    ".\app\services\compliance\page.tsx",
    ".\app\services\bid-no-bid-review\page.tsx",
    ".\app\services\capability-statements\page.tsx",
    ".\app\services\set-aside-certifications\SetAsideClient.tsx"
)

$missingH1 = @()
foreach ($p in $publicPages) {
    if (Test-Path $p) {
        $c = Get-Content $p -Raw
        if ($c -notmatch '<h1[\s>]') {
            $missingH1 += $p
            Write-Host "  [MISSING H1] $p" -ForegroundColor Red
        }
    }
}

if ($missingH1.Count -eq 0) {
    Write-Host "  [OK] All public pages have H1 tags" -ForegroundColor Green
} else {
    Write-Host "`n  These $($missingH1.Count) pages need an <h1> added manually in the JSX." -ForegroundColor Yellow
    Write-Host "  Add it as the first visible heading inside the return() statement." -ForegroundColor Yellow
}

# =============================================================
# 4. Fix alerts page - title only 23 chars, no canonical
# =============================================================
Write-Host "`n[4] Fixing alerts page metadata..." -ForegroundColor Yellow
$alertsPath = ".\app\alerts\page.tsx"
if (Test-Path $alertsPath) {
    $c = Get-Content $alertsPath -Raw
    $isClient = $c -match '"use client"'
    if (-not $isClient) {
        if ($c -match "title:") {
            $c = $c -replace "title:\s*[`"'][^`"']+[`"']", "title: 'Email Alerts & Saved Searches | PreciseGovCon'"
        }
        if ($c -notmatch "alternates") {
            $c = $c -replace "(export const metadata[^=]*=[^{]*\{)", "`$1`n  alternates: { canonical: 'https://www.precisegovcon.com/alerts' },"
        }
        Set-Content $alertsPath -Value $c -NoNewline
        Write-Host "  [FIXED] alerts page" -ForegroundColor Green
        $fixCount++
    } else {
        Write-Host "  [SKIP-CLIENT] alerts/page.tsx is use client" -ForegroundColor DarkGray
    }
}

# =============================================================
# 5. BUILD & DEPLOY
# =============================================================
Write-Host "`n=== $fixCount fix(es) applied. Building... ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: missing canonicals, alerts title, final SEO cleanup"
    git push
    Write-Host "`n✓ Deployed. Re-crawl https://www.precisegovcon.com" -ForegroundColor Green
    Write-Host "`nRemaining manual tasks:" -ForegroundColor White
    Write-Host "  1. Add <h1> to pages listed above in the JSX" -ForegroundColor Gray
    Write-Host "  2. Compress 4 images at squoosh.app (convert to WebP)" -ForegroundColor Gray
    Write-Host "  3. In Screaming Frog: click 'Content: Exact Duplicates' to see which 6 pages are identical" -ForegroundColor Gray
} else {
    Write-Host "`n✗ Build failed." -ForegroundColor Red
}