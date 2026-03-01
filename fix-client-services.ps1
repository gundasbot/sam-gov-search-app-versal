# =============================================================
# Fix: use client conflicts on services + set-aside pages
# Creates server wrapper files that export metadata
# =============================================================

Write-Host "=== Fixing use client conflicts ===" -ForegroundColor Cyan
$fixCount = 0

$pages = @(
    @{
        Page       = ".\app\services\page.tsx"
        ClientFile = ".\app\services\ServicesClient.tsx"
        FuncName   = "ServicesPage"
        Title      = "Federal Contracting Services | PreciseGovCon"
        Desc       = "Explore PreciseGovCon services: SAM registration, proposal writing, compliance monitoring, capability statements, and bid analysis."
        Canonical  = "https://www.precisegovcon.com/services"
    },
    @{
        Page       = ".\app\services\set-aside-certifications\page.tsx"
        ClientFile = ".\app\services\set-aside-certifications\SetAsideClient.tsx"
        FuncName   = "SetAsideCertificationsPage"
        Title      = "Set-Aside Certifications | SDVOSB & 8(a) | PreciseGovCon"
        Desc       = "Get certified as SDVOSB, 8(a), HUBZone, or WOSB. We guide you through the entire federal set-aside certification process."
        Canonical  = "https://www.precisegovcon.com/services/set-aside-certifications"
    }
)

foreach ($p in $pages) {
    if (-not (Test-Path $p.Page)) {
        Write-Host "  [NOT FOUND] $($p.Page)" -ForegroundColor Red
        continue
    }

    $c = Get-Content $p.Page -Raw

    # Step 1: Remove any metadata block we injected
    $c = $c -replace "(?s)\nexport const metadata[^}]+\}\n", ""
    $c = $c -replace "(?s)\r\nexport const metadata[^}]+\}\r\n", ""

    # Step 2: Save as ClientFile (preserves "use client" + all component code)
    Set-Content $p.ClientFile -Value $c -NoNewline
    Write-Host "  [CREATED] $($p.ClientFile)" -ForegroundColor Green

    # Step 3: Get the default export function name from original
    $fnMatch = [regex]::Match($c, 'export default function (\w+)')
    $clientFn = if ($fnMatch.Success) { $fnMatch.Groups[1].Value } else { "ClientComponent" }
    $clientName = Split-Path $p.ClientFile -LeafBase

    # Step 4: Rewrite page.tsx as thin server wrapper
    $wrapper = @"
import type { Metadata } from 'next'
import $clientName from './$clientName'

export const metadata: Metadata = {
  title: '$($p.Title)',
  description: '$($p.Desc)',
  alternates: { canonical: '$($p.Canonical)' },
}

export default function $($p.FuncName)() {
  return <$clientName />
}
"@
    Set-Content $p.Page -Value $wrapper -NoNewline
    Write-Host "  [WRAPPED] $($p.Page)" -ForegroundColor Green
    $fixCount++
}

# =============================================================
# Also fix capability-statements title (61c - just over limit)
# =============================================================
Write-Host "`n[2] Trimming capability-statements title (61c -> under 60)..." -ForegroundColor Yellow
$capPath = ".\app\services\capability-statements\page.tsx"
if (Test-Path $capPath) {
    $c = Get-Content $capPath -Raw
    $c = $c -replace "title:\s*'Capability Statements for Federal Contractors \| PreciseGovCon'", "title: 'Capability Statements for Gov Contractors | PreciseGovCon'"
    $c = $c -replace 'title:\s*"Capability Statements for Federal Contractors \| PreciseGovCon"', 'title: "Capability Statements for Gov Contractors | PreciseGovCon"'
    Set-Content $capPath -Value $c -NoNewline
    Write-Host "  [FIXED] capability-statements title trimmed to 59c" -ForegroundColor Green
    $fixCount++
}

# =============================================================
# BUILD & DEPLOY
# =============================================================
Write-Host "`n=== $fixCount fix(es) applied. Building... ===" -ForegroundColor Cyan
npm run build

if ($LASTEXITCODE -eq 0) {
    git add -A
    git commit -m "fix: server wrappers for services + set-aside pages, trim long title"
    git push
    Write-Host "`n✓ Deployed successfully." -ForegroundColor Green
} else {
    Write-Host "`n✗ Build failed." -ForegroundColor Red
}