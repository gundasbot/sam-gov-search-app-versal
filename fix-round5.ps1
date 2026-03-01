# =============================================================
# PreciseGovCon - Fix Issues Round 5
# Targets: Exact Duplicates, H1 Missing, Short/Duplicate Titles,
#          Missing Canonicals, Meta Description Duplicates
# =============================================================

Write-Host "=== PreciseGovCon SEO Fix Round 5 ===" -ForegroundColor Cyan
$fixCount = 0

# Helper: check if file is a "use client" component
function IsClientComponent($path) {
    $c = Get-Content $path -Raw -ErrorAction SilentlyContinue
    return $c -match '"use client"'
}

# =============================================================
# 1. EXACT DUPLICATES (6 URLs / High)
# Likely cause: service pages with identical templated content
# OR www vs non-www being counted as duplicates
# Fix: ensure every indexable page has a unique canonical
# =============================================================
Write-Host "`n[1] Adding missing canonicals to all public service/content pages..." -ForegroundColor Yellow

$canonicals = @{
    ".\app\page.tsx"                                    = "https://www.precisegovcon.com"
    ".\app\services\page.tsx"                           = "https://www.precisegovcon.com/services"
    ".\app\services\bid-search\page.tsx"                = "https://www.precisegovcon.com/services/bid-search"
    ".\app\services\bid-no-bid-review\page.tsx"         = "https://www.precisegovcon.com/services/bid-no-bid-review"
    ".\app\services\capability-statements\page.tsx"     = "https://www.precisegovcon.com/services/capability-statements"
    ".\app\services\compliance\page.tsx"                = "https://www.precisegovcon.com/services/compliance"
    ".\app\services\proposal-writing\page.tsx"          = "https://www.precisegovcon.com/services/proposal-writing"
    ".\app\services\sam-registration\page.tsx"          = "https://www.precisegovcon.com/services/sam-registration"
    ".\app\services\set-aside-certifications\page.tsx"  = "https://www.precisegovcon.com/services/set-aside-certifications"
    ".\app\about\page.tsx"                              = "https://www.precisegovcon.com/about"
    ".\app\pricing\page.tsx"                            = "https://www.precisegovcon.com/pricing"
    ".\app\features\page.tsx"                           = "https://www.precisegovcon.com/features"
    ".\app\contact\page.tsx"                            = "https://www.precisegovcon.com/contact"
    ".\app\insights\page.tsx"                           = "https://www.precisegovcon.com/insights"
    ".\app\opportunities\page.tsx"                      = "https://www.precisegovcon.com/opportunities"
    ".\app\search\page.tsx"                             = "https://www.precisegovcon.com/search"
    ".\app\privacy\page.tsx"                            = "https://www.precisegovcon.com/privacy"
    ".\app\terms\page.tsx"                              = "https://www.precisegovcon.com/terms"
    ".\app\security\page.tsx"                           = "https://www.precisegovcon.com/security"
    ".\app\support\page.tsx"                            = "https://www.precisegovcon.com/support"
    ".\app\help\page.tsx"                               = "https://www.precisegovcon.com/help"
}

foreach ($entry in $canonicals.GetEnumerator()) {
    if (Test-Path $entry.Key) {
        $c = Get-Content $entry.Key -Raw
        $isClient = $c -match '"use client"'

        if ($isClient) {
            Write-Host "  [SKIP-CLIENT] $($entry.Key)" -ForegroundColor DarkGray
            continue
        }

        if ($c -match "alternates") {
            # Update existing canonical to www version
            $oldCanon = [regex]::Match($c, "canonical:\s*[`"']([^`"']+)[`"']").Groups[1].Value
            if ($oldCanon -ne $entry.Value) {
                $c = $c -replace "canonical:\s*[`"'][^`"']+[`"']", "canonical: '$($entry.Value)'"
                Set-Content $entry.Key -Value $c -NoNewline
                Write-Host "  [UPDATED] $($entry.Key)" -ForegroundColor Green
                $fixCount++
            } else {
                Write-Host "  [OK] $($entry.Key)" -ForegroundColor DarkGray
            }
        } elseif ($c -match "export const metadata") {
            # Inject alternates into existing metadata block
            $c = $c -replace "(export const metadata[^=]*=[^{]*\{)", "`$1`n  alternates: { canonical: '$($entry.Value)' },"
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [ADDED] $($entry.Key)" -ForegroundColor Green
            $fixCount++
        }
    }
}

# =============================================================
# 2. PAGE TITLES: Below 30 Characters & Duplicate Titles
# From audit: "About PreciseGovCon" (19c), "Bid/No-Bid Analysis" (19c)
# Duplicate titles on service pages
# =============================================================
Write-Host "`n[2] Fixing short and duplicate page titles..." -ForegroundColor Yellow

$titleFixes = @{
    ".\app\about\page.tsx"                          = "About Us | Federal Contracting Tools | PreciseGovCon"
    ".\app\services\bid-no-bid-review\page.tsx"     = "Bid/No-Bid Analysis Tool | PreciseGovCon"
    ".\app\services\capability-statements\page.tsx" = "Capability Statements for Federal Contractors | PreciseGovCon"
    ".\app\services\set-aside-certifications\page.tsx" = "Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon"
    ".\app\opportunities\page.tsx"                  = "Federal Contract Opportunities | PreciseGovCon"
    ".\app\insights\page.tsx"                       = "Federal Market Insights & Analytics | PreciseGovCon"
    ".\app\support\page.tsx"                        = "Support Center | PreciseGovCon"
    ".\app\help\page.tsx"                           = "Help & Documentation | PreciseGovCon"
    ".\app\security\page.tsx"                       = "Security & Compliance | PreciseGovCon"
    ".\app\privacy\page.tsx"                        = "Privacy Policy | PreciseGovCon"
    ".\app\terms\page.tsx"                          = "Terms of Service | PreciseGovCon"
}

foreach ($entry in $titleFixes.GetEnumerator()) {
    if (Test-Path $entry.Key) {
        $c = Get-Content $entry.Key -Raw
        $isClient = $c -match '"use client"'
        if ($isClient) { Write-Host "  [SKIP-CLIENT] $($entry.Key)" -ForegroundColor DarkGray; continue }

        if ($c -match "title:") {
            $c = $c -replace "title:\s*'[^']*'", "title: '$($entry.Value)'"
            $c = $c -replace 'title:\s*"[^"]*"', "title: `"$($entry.Value)`""
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [FIXED] $($entry.Key) -> $($entry.Value)" -ForegroundColor Green
            $fixCount++
        } elseif ($c -match "export const metadata") {
            $c = $c -replace "(export const metadata[^=]*=[^{]*\{)", "`$1`n  title: '$($entry.Value)',"
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [ADDED TITLE] $($entry.Key)" -ForegroundColor Green
            $fixCount++
        }
    }
}

# =============================================================
# 3. META DESCRIPTION: Duplicates & Over 155 chars
# Add unique descriptions to pages that are missing them
# =============================================================
Write-Host "`n[3] Adding/fixing meta descriptions..." -ForegroundColor Yellow

$descFixes = @{
    ".\app\services\bid-no-bid-review\page.tsx"        = "AI-powered bid/no-bid analysis for federal contractors. Make smarter decisions and stop wasting resources on unwinnable contracts."
    ".\app\services\capability-statements\page.tsx"    = "Professional one-page capability statements tailored for federal buyers. Stand out to prime contractors and government agencies."
    ".\app\services\set-aside-certifications\page.tsx" = "Get certified as SDVOSB, 8(a), HUBZone, or WOSB. We guide you through the entire federal set-aside certification process."
    ".\app\opportunities\page.tsx"                     = "Browse and filter active federal contract opportunities from SAM.gov. Search by agency, NAICS code, set-aside type, and more."
    ".\app\insights\page.tsx"                          = "Track federal contracting market trends, agency spending patterns, and opportunity analytics to inform your bid strategy."
    ".\app\about\page.tsx"                             = "PreciseGovCon is built for SDVOSBs and small businesses competing for federal contracts. Learn about our mission and team."
    ".\app\support\page.tsx"                           = "Get help with PreciseGovCon features, SAM.gov registration, and federal contracting questions. Contact our support team."
    ".\app\privacy\page.tsx"                           = "Read PreciseGovCon's privacy policy to understand how we collect, use, and protect your data."
    ".\app\terms\page.tsx"                             = "Review the terms of service governing your use of PreciseGovCon's federal contracting platform."
    ".\app\security\page.tsx"                          = "PreciseGovCon's security practices, data protection standards, and compliance with federal contractor requirements."
}

foreach ($entry in $descFixes.GetEnumerator()) {
    if (Test-Path $entry.Key) {
        $c = Get-Content $entry.Key -Raw
        $isClient = $c -match '"use client"'
        if ($isClient) { Write-Host "  [SKIP-CLIENT] $($entry.Key)" -ForegroundColor DarkGray; continue }

        if ($c -match "description:") {
            # Only replace if current description is over 155 chars or duplicate
            $existing = [regex]::Match($c, "description:\s*'([^']*)'").Groups[1].Value
            if (-not $existing) { $existing = [regex]::Match($c, 'description:\s*"([^"]*)"').Groups[1].Value }
            if ($existing.Length -gt 155 -or $existing.Length -eq 0) {
                $c = $c -replace "description:\s*'[^']*'", "description: '$($entry.Value)'"
                $c = $c -replace 'description:\s*"[^"]*"', "description: `"$($entry.Value)`""
                Set-Content $entry.Key -Value $c -NoNewline
                Write-Host "  [FIXED] $($entry.Key)" -ForegroundColor Green
                $fixCount++
            } else {
                Write-Host "  [OK] $($entry.Key) ($($existing.Length)c)" -ForegroundColor DarkGray
            }
        } elseif ($c -match "export const metadata") {
            $c = $c -replace "(export const metadata[^=]*=[^{]*\{)", "`$1`n  description: '$($entry.Value)',"
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [ADDED DESC] $($entry.Key)" -ForegroundColor Green
            $fixCount++
        }
    }
}

# =============================================================
# 4. FINAL AUDIT
# =============================================================
Write-Host "`n--- Title & Canonical Audit ---" -ForegroundColor Cyan
Get-ChildItem -Path ".\app" -Filter "page.tsx" -Recurse |
    Where-Object { $_.FullName -notmatch "api|admin|_" } |
    ForEach-Object {
        $c = Get-Content $_.FullName -Raw -ErrorAction SilentlyContinue
        if ($c -match "export const metadata") {
            $tm = [regex]::Match($c, "title:\s*'([^']+)'")
            if (-not $tm.Success) { $tm = [regex]::Match($c, 'title:\s*"([^"]+)"') }
            $cm = [regex]::Match($c, "canonical:\s*'([^']+)'")
            if (-not $cm.Success) { $cm = [regex]::Match($c, 'canonical:\s*"([^"]+)"') }

            $title  = if ($tm.Success) { $tm.Groups[1].Value } else { "(no title)" }
            $canon  = if ($cm.Success) { "✓" } else { "✗ NO CANONICAL" }
            $tColor = if ($title.Length -gt 60) { "Red" } elseif ($title.Length -lt 30 -and $title -ne "(no title)") { "Yellow" } else { "Green" }
            $cColor = if ($cm.Success) { "Green" } else { "Yellow" }

            Write-Host "  [$($title.Length)c] $($_.Directory.Name)" -ForegroundColor $tColor -NoNewline
            Write-Host "  $canon" -ForegroundColor $cColor
        }
    }

# =============================================================
# 5. BUILD & DEPLOY
# =============================================================
Write-Host "`n=== $fixCount fix(es) applied. Building... ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: canonicals, titles, meta descriptions - SEO round 5"
    git push
    Write-Host "`n✓ Deployed. Re-crawl https://www.precisegovcon.com" -ForegroundColor Green
} else {
    Write-Host "`n✗ Build failed." -ForegroundColor Red
}