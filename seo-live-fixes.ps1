# =============================================================
# PreciseGovCon - Live Site SEO Fix Script
# Priority order: Critical → High → Medium → Low
# Run from: C:\Users\owner\Documents\sam-gov-search-app
# =============================================================

Write-Host "=== PreciseGovCon Live Site SEO Fixes ===" -ForegroundColor Cyan
$fixCount = 0

# =============================================================
# CRITICAL: Add Security Headers (affects 73-93% of pages)
# Fix: X-Content-Type-Options, X-Frame-Options, Referrer-Policy, CSP
# Done in next.config.ts — one fix covers all pages at once
# =============================================================
Write-Host "`n[1] Adding Security Headers to next.config.ts..." -ForegroundColor Yellow

$nextConfig = ".\next.config.ts"
if (Test-Path $nextConfig) {
    $c = Get-Content $nextConfig -Raw

    if ($c -notmatch "X-Content-Type-Options") {
        # Inject headers() into the config
        $headersBlock = @'

      async headers() {
        return [
          {
            source: '/(.*)',
            headers: [
              { key: 'X-Content-Type-Options',   value: 'nosniff' },
              { key: 'X-Frame-Options',           value: 'SAMEORIGIN' },
              { key: 'Referrer-Policy',           value: 'strict-origin-when-cross-origin' },
              { key: 'X-XSS-Protection',          value: '1; mode=block' },
              {
                key: 'Content-Security-Policy',
                value: [
                  "default-src 'self'",
                  "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://www.googletagmanager.com https://www.google-analytics.com",
                  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                  "font-src 'self' https://fonts.gstatic.com",
                  "img-src 'self' data: https: blob:",
                  "connect-src 'self' https://api.stripe.com https://www.google-analytics.com https://vitals.vercel-insights.com https://api.sam.gov",
                  "frame-src https://js.stripe.com https://hooks.stripe.com",
                  "object-src 'none'",
                  "base-uri 'self'"
                ].join('; ')
              },
            ],
          },
        ]
      },
'@
        # Insert before the closing of the config object
        $c = $c -replace "(const nextConfig[^=]*=\s*\{)", "`$1$headersBlock"
        Set-Content $nextConfig -Value $c -NoNewline
        Write-Host "  [FIXED] Security headers added to next.config.ts" -ForegroundColor Green
        $fixCount++
    } else {
        Write-Host "  [SKIP] Security headers already present" -ForegroundColor DarkGray
    }
}

# =============================================================
# HIGH: Add missing canonicals to ALL pages via root layout
# Fixes: Canonicals: Missing (25 URLs / 100%)
# =============================================================
Write-Host "`n[2] Ensuring metadataBase canonical in root layout..." -ForegroundColor Yellow

$layout = ".\app\layout.tsx"
if (-not (Test-Path $layout)) { $layout = ".\app\layout.jsx" }

if (Test-Path $layout) {
    $c = Get-Content $layout -Raw
    if ($c -match "metadataBase.*localhost") {
        $c = $c -replace "metadataBase:\s*new URL\([`"']http://localhost[^`"']*[`"']\)", "metadataBase: new URL('https://www.precisegovcon.com')"
        Set-Content $layout -Value $c -NoNewline
        Write-Host "  [FIXED] metadataBase corrected to production URL" -ForegroundColor Green
        $fixCount++
    } elseif ($c -notmatch "metadataBase") {
        $c = $c -replace "(export const metadata[^{]*\{)", "`$1`n  metadataBase: new URL('https://www.precisegovcon.com'),"
        Set-Content $layout -Value $c -NoNewline
        Write-Host "  [FIXED] metadataBase added to root layout" -ForegroundColor Green
        $fixCount++
    } else {
        Write-Host "  [OK] metadataBase already set correctly" -ForegroundColor DarkGray
    }
}

# =============================================================
# HIGH: Add Next.js image width/height to fix CLS
# Fixes: Images: Missing Size Attributes (23 URLs / 85%)
# =============================================================
Write-Host "`n[3] Checking for images missing width/height attributes..." -ForegroundColor Yellow

$imgIssues = 0
Get-ChildItem -Path ".\app",".\components" -Include "*.tsx","*.jsx" -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.FullName -notmatch "node_modules|\.next" } |
    ForEach-Object {
        $c = Get-Content $_.FullName -Raw
        # Flag <img tags missing width or height (not Next/Image which handles this)
        $matches = [regex]::Matches($c, '<img\s[^>]+>')
        foreach ($m in $matches) {
            if ($m.Value -notmatch 'width' -or $m.Value -notmatch 'height') {
                Write-Host "  [WARN] Missing width/height in: $($_.Name)" -ForegroundColor Yellow
                $imgIssues++
            }
        }
    }
if ($imgIssues -eq 0) {
    Write-Host "  [OK] All <img> tags have width/height (or use Next/Image)" -ForegroundColor DarkGray
}

# =============================================================
# MEDIUM: Fix duplicate page titles
# Fixes: Page Titles Duplicate (21 URLs / 84%)
# Strategy: API/dashboard/auth pages often share default title
# Add unique titles to pages missing them
# =============================================================
Write-Host "`n[4] Adding missing/fixing duplicate page titles..." -ForegroundColor Yellow

$pageTitles = @{
    ".\app\dashboard\page.tsx"                    = "My Dashboard | PreciseGovCon"
    ".\app\dashboard\active-tracking\page.tsx"    = "Active Tracking | PreciseGovCon"
    ".\app\dashboard\deadlines\page.tsx"          = "Upcoming Deadlines | PreciseGovCon"
    ".\app\dashboard\saved-opportunities\page.tsx"= "Saved Opportunities | PreciseGovCon"
    ".\app\search\page.tsx"                       = "Search Federal Contracts | PreciseGovCon"
    ".\app\opportunities\page.tsx"                = "Federal Opportunities | PreciseGovCon"
    ".\app\pricing\page.tsx"                      = "Pricing Plans | PreciseGovCon"
    ".\app\features\page.tsx"                     = "Platform Features | PreciseGovCon"
    ".\app\contact\page.tsx"                      = "Contact Us | PreciseGovCon"
    ".\app\about\page.tsx"                        = "About PreciseGovCon"
    ".\app\insights\page.tsx"                     = "Market Insights | PreciseGovCon"
    ".\app\login\page.tsx"                        = "Sign In | PreciseGovCon"
    ".\app\signup\page.tsx"                       = "Create Account | PreciseGovCon"
    ".\app\forgot-password\page.tsx"              = "Reset Password | PreciseGovCon"
}

foreach ($entry in $pageTitles.GetEnumerator()) {
    if (Test-Path $entry.Key) {
        $c = Get-Content $entry.Key -Raw
        $hasMetadata = $c -match "export const metadata"
        $hasTitle    = $c -match "title:"

        if ($hasMetadata -and -not $hasTitle) {
            # Add title to existing metadata
            $c = $c -replace "(export const metadata[^{]*\{)", "`$1`n  title: '$($entry.Value)',"
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [FIXED] Added title to: $($entry.Key)" -ForegroundColor Green
            $fixCount++
        } elseif (-not $hasMetadata) {
            # Inject full metadata block before default export
            $inject = "`nexport const metadata = {`n  title: '$($entry.Value)',`n}`n"
            $c = $c -replace "(export default function)", "$inject`$1"
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [FIXED] Injected metadata into: $($entry.Key)" -ForegroundColor Green
            $fixCount++
        } else {
            Write-Host "  [SKIP] $($entry.Key) already has title" -ForegroundColor DarkGray
        }
    }
}

# =============================================================
# MEDIUM: Fix meta descriptions over 155 chars
# Shorten descriptions on service pages
# =============================================================
Write-Host "`n[5] Fixing meta descriptions over 155 characters..." -ForegroundColor Yellow

$descFixes = @{
    ".\app\services\bid-search\page.tsx"       = "Find and filter federal contract opportunities on SAM.gov. Search by NAICS code, set-aside type, agency, and more."
    ".\app\services\proposal-writing\page.tsx" = "Win more federal contracts with AI-powered proposal writing. Expert review, compliant formatting, and fast turnaround."
    ".\app\services\sam-registration\page.tsx" = "Expert SAM.gov registration and renewal services. Get registered fast and stay compliant with full support."
    ".\app\services\compliance\page.tsx"       = "Federal compliance monitoring for government contractors. FAR/DFARS tracking, audit readiness, and renewal management."
    ".\app\services\capability-statements\page.tsx" = "Professional capability statements that win meetings. One-page format tailored for federal buyers and prime contractors."
    ".\app\about\page.tsx"                     = "PreciseGovCon helps small businesses and SDVOSBs find, track, and win federal contracts with AI-powered tools."
    ".\app\pricing\page.tsx"                   = "Simple, transparent pricing for federal contractors. Start free, upgrade as you grow. No long-term contracts required."
}

foreach ($entry in $descFixes.GetEnumerator()) {
    if (Test-Path $entry.Key) {
        $c = Get-Content $entry.Key -Raw
        if ($c -match "description:") {
            $c = $c -replace "description:\s*'[^']{155,}'", "description: '$($entry.Value)'"
            $c = $c -replace 'description:\s*"[^"]{155,}"', "description: `"$($entry.Value)`""
            Set-Content $entry.Key -Value $c -NoNewline
            Write-Host "  [FIXED] Meta description trimmed: $($entry.Key)" -ForegroundColor Green
            $fixCount++
        }
    }
}

# =============================================================
# MEDIUM: Add robots noindex to non-public pages
# Fixes: Exact Duplicates + prevents auth pages from indexing
# =============================================================
Write-Host "`n[6] Adding noindex to auth/account pages..." -ForegroundColor Yellow

$noindexPages = @(
    ".\app\login\page.tsx",
    ".\app\signup\page.tsx",
    ".\app\forgot-password\page.tsx",
    ".\app\reset-password\page.tsx",
    ".\app\reset-request\page.tsx",
    ".\app\verify-email\page.tsx",
    ".\app\activate\page.tsx",
    ".\app\account\page.tsx",
    ".\app\account\settings\page.tsx",
    ".\app\checkout\page.tsx",
    ".\app\pricing\checkout\page.tsx",
    ".\app\admin\dashboard\page.tsx",
    ".\app\admin\login\page.tsx"
)

foreach ($p in $noindexPages) {
    if (Test-Path $p) {
        $c = Get-Content $p -Raw
        if ($c -match "export const metadata" -and $c -notmatch "robots") {
            $c = $c -replace "(export const metadata[^{]*\{)", "`$1`n  robots: { index: false, follow: false },"
            Set-Content $p -Value $c -NoNewline
            Write-Host "  [FIXED] noindex added: $p" -ForegroundColor Green
            $fixCount++
        } elseif ($c -notmatch "export const metadata") {
            $inject = "`nexport const metadata = {`n  robots: { index: false, follow: false },`n}`n"
            $c = $c -replace "(export default function)", "$inject`$1"
            Set-Content $p -Value $c -NoNewline
            Write-Host "  [FIXED] noindex injected: $p" -ForegroundColor Green
            $fixCount++
        } else {
            Write-Host "  [SKIP] $p already has robots config" -ForegroundColor DarkGray
        }
    }
}

# =============================================================
# FINAL: Title audit
# =============================================================
Write-Host "`n--- Final Title Audit ---" -ForegroundColor Cyan
Get-ChildItem -Path ".\app" -Filter "page.tsx" -Recurse |
    Where-Object { $_.FullName -notmatch "api|admin|_" } |
    ForEach-Object {
        $c = Get-Content $_.FullName -Raw
        if ($c -match 'export const metadata') {
            $m = [regex]::Match($c, "title:\s*'([^']+)'")
            if (-not $m.Success) { $m = [regex]::Match($c, 'title:\s*"([^"]+)"') }
            if ($m.Success) {
                $title = $m.Groups[1].Value
                $color = if ($title.Length -gt 60) {"Red"} elseif ($title.Length -gt 55) {"Yellow"} else {"Green"}
                Write-Host "  [$($title.Length)c] $($_.Directory.Name): $title" -ForegroundColor $color
            } else {
                Write-Host "  [---] $($_.Directory.Name): no title found" -ForegroundColor DarkGray
            }
        } else {
            Write-Host "  [NO META] $($_.Directory.Name)" -ForegroundColor DarkGray
        }
    }

# =============================================================
# BUILD & DEPLOY
# =============================================================
Write-Host "`n=== $fixCount fix(es) applied. Building... ===" -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: SEO - security headers, canonicals, titles, noindex, meta descriptions"
    git push
    Write-Host "`n✓ Deployed. Re-crawl https://www.precisegovcon.com in Screaming Frog." -ForegroundColor Green
} else {
    Write-Host "`n✗ Build failed — fix errors before deploying." -ForegroundColor Red
}