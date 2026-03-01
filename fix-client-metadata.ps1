# =============================================================
# Fix: Remove metadata from "use client" pages
# Strategy: Remove the injected metadata export from client
# components — metadata for these pages (auth/dashboard) is
# handled by the root layout or doesn't need to be indexed.
# =============================================================

Write-Host "=== Fixing use client metadata conflicts ===" -ForegroundColor Cyan
$fixCount = 0

# All pages that failed build — remove the injected metadata block
$clientPages = @(
    ".\app\about\page.tsx",
    ".\app\account\page.tsx",
    ".\app\account\settings\page.tsx",
    ".\app\activate\page.tsx",
    ".\app\admin\dashboard\page.tsx",
    ".\app\admin\login\page.tsx",
    ".\app\checkout\page.tsx",
    ".\app\contact\page.tsx",
    ".\app\dashboard\active-tracking\page.tsx",
    ".\app\dashboard\deadlines\page.tsx",
    ".\app\dashboard\page.tsx",
    ".\app\dashboard\saved-opportunities\page.tsx",
    ".\app\features\page.tsx",
    ".\app\insights\page.tsx",
    ".\app\login\page.tsx",
    ".\app\pricing\checkout\page.tsx",
    ".\app\reset-request\page.tsx",
    ".\app\search\page.tsx",
    ".\app\forgot-password\page.tsx",
    ".\app\signup\page.tsx",
    ".\app\reset-password\page.tsx",
    ".\app\verify-email\page.tsx",
    ".\app\opportunities\page.tsx",
    ".\app\pricing\page.tsx"
)

foreach ($p in $clientPages) {
    if (Test-Path $p) {
        $c = Get-Content $p -Raw
        # Remove any metadata block we injected (between blank line and export default)
        # Pattern: optional newline + export const metadata = { ... } + newline
        $before = $c.Length
        $c = $c -replace "`nexport const metadata = \{[^}]*\}`n", ""
        $c = $c -replace "`r`nexport const metadata = \{[^}]*\}`r`n", ""
        # Also catch multiline with robots
        $c = $c -replace "(?ms)`nexport const metadata = \{.*?\}`n(?=export default)", ""
        if ($c.Length -ne $before) {
            Set-Content $p -Value $c -NoNewline
            Write-Host "  [REMOVED] metadata from: $p" -ForegroundColor Green
            $fixCount++
        } else {
            Write-Host "  [SKIP] no injected metadata found: $p" -ForegroundColor DarkGray
        }
    }
}

# =============================================================
# For pages that NEED metadata but are "use client":
# Create a thin server-component wrapper page that exports
# metadata, and rename the client component.
# Only do this for public-facing indexable pages.
# =============================================================

Write-Host "`n--- Creating server wrappers for public client pages ---" -ForegroundColor Yellow

$wrappers = @(
    @{
        Page        = ".\app\about\page.tsx"
        ClientName  = "AboutClient"
        Title       = "About PreciseGovCon"
        Description = "PreciseGovCon helps small businesses and SDVOSBs find, track, and win federal contracts with AI-powered tools."
    },
    @{
        Page        = ".\app\features\page.tsx"
        ClientName  = "FeaturesClient"
        Title       = "Platform Features | PreciseGovCon"
        Description = "Explore PreciseGovCon features: SAM.gov search, saved searches, email alerts, bid analysis, and proposal writing tools."
    },
    @{
        Page        = ".\app\contact\page.tsx"
        ClientName  = "ContactClient"
        Title       = "Contact Us | PreciseGovCon"
        Description = "Get in touch with the PreciseGovCon team. We help federal contractors with SAM registration, proposals, and compliance."
    },
    @{
        Page        = ".\app\pricing\page.tsx"
        ClientName  = "PricingClient"
        Title       = "Pricing Plans | PreciseGovCon"
        Description = "Simple, transparent pricing for federal contractors. Start free, upgrade as you grow. No long-term contracts required."
    },
    @{
        Page        = ".\app\insights\page.tsx"
        ClientName  = "InsightsClient"
        Title       = "Market Insights | PreciseGovCon"
        Description = "Federal contracting market insights and analytics. Track trends, agency spending, and opportunity data."
    }
)

foreach ($w in $wrappers) {
    if (Test-Path $w.Page) {
        $c = Get-Content $w.Page -Raw

        # Only wrap if it has "use client" and no existing metadata
        if ($c -match '"use client"' -and $c -notmatch 'export const metadata') {
            $dir = Split-Path $w.Page -Parent
            $clientFile = Join-Path $dir "$($w.ClientName).tsx"

            # 1. Copy current page to ClientName.tsx (keep "use client")
            Copy-Item $w.Page $clientFile
            Write-Host "  [CREATED] $clientFile" -ForegroundColor Green

            # 2. Rewrite page.tsx as a server component wrapper
            $defaultFnMatch = [regex]::Match($c, 'export default function (\w+)')
            $clientFn = if ($defaultFnMatch.Success) { $defaultFnMatch.Groups[1].Value } else { $w.ClientName }

            $wrapper = @"
import type { Metadata } from 'next'
import $($w.ClientName) from './$($w.ClientName)'

export const metadata: Metadata = {
  title: '$($w.Title)',
  description: '$($w.Description)',
  alternates: { canonical: 'https://www.precisegovcon.com/$((Split-Path $w.Page -Parent) -replace '.*\\app\\','')' },
}

export default function $($clientFn)Page() {
  return <$($w.ClientName) />
}
"@
            Set-Content $w.Page -Value $wrapper -NoNewline
            Write-Host "  [WRAPPED] $($w.Page) → server wrapper created" -ForegroundColor Green
            $fixCount++
        } else {
            Write-Host "  [SKIP] $($w.Page) — already server or already has metadata" -ForegroundColor DarkGray
        }
    }
}

# =============================================================
# Noindex pages: add via generateMetadata in a separate file
# For auth pages, use next.config.ts headers instead of metadata
# =============================================================
Write-Host "`n--- Adding noindex via HTTP headers in next.config.ts (safer for client pages) ---" -ForegroundColor Yellow

$nextConfig = ".\next.config.ts"
if (Test-Path $nextConfig) {
    $c = Get-Content $nextConfig -Raw
    $noindexPaths = @('/login', '/signup', '/forgot-password', '/reset-password', '/reset-request', '/verify-email', '/activate', '/account', '/account/settings', '/checkout', '/pricing/checkout', '/admin/:path*')

    if ($c -notmatch "x-robots-tag") {
        $robotsHeaders = $noindexPaths | ForEach-Object {
            "          {`n            source: '$_',`n            headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],`n          },"
        }
        $robotsBlock = "`n          // Noindex for auth/account pages`n" + ($robotsHeaders -join "`n")

        # Append to existing headers() return array
        $c = $c -replace "(return \[)", "`$1$robotsBlock"
        Set-Content $nextConfig -Value $c -NoNewline
        Write-Host "  [FIXED] X-Robots-Tag noindex added to next.config.ts for auth pages" -ForegroundColor Green
        $fixCount++
    } else {
        Write-Host "  [SKIP] X-Robots-Tag already configured" -ForegroundColor DarkGray
    }
}

# =============================================================
# BUILD
# =============================================================
Write-Host "`n=== $fixCount fix(es) applied. Building... ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: SEO metadata - server wrappers for client pages, noindex via headers"
    git push
    Write-Host "`n✓ Deployed successfully." -ForegroundColor Green
} else {
    Write-Host "`n✗ Build failed — check errors above." -ForegroundColor Red
}