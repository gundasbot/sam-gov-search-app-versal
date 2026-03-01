# =============================================================
# PreciseGovCon — Fix Remaining Page Titles
# Run from: C:\Users\owner\Documents\sam-gov-search-app
# =============================================================

Write-Host "=== Fixing Page Titles ===" -ForegroundColor Cyan

$fixes = @(
    @{
        Path    = ".\app\services\bid-search\page.tsx"
        OldTitle = "Federal Compliance Services | Precise GovCon | PreciseGovCon"
        NewTitle = "Find Federal Contracts | PreciseGovCon"
        Desc    = "bid-search"
    },
    @{
        Path    = ".\app\services\proposal-writing\page.tsx"
        OldTitle = "AI-Powered Proposal Writing | Precise GovCon | PreciseGovCon"
        NewTitle = "AI Proposal Writing Services | PreciseGovCon"
        Desc    = "proposal-writing"
    },
    @{
        Path    = ".\app\services\sam-registration\page.tsx"
        OldTitle = "SAM Registration Services | Precise GovCon | PreciseGovCon"
        NewTitle = "SAM.gov Registration Services | PreciseGovCon"
        Desc    = "sam-registration"
    },
    @{
        Path    = ".\app\services\compliance\page.tsx"
        OldTitle = "Compliance Services | SAM.gov Search | PreciseGovCon"
        NewTitle = "Federal Compliance Services | PreciseGovCon"
        Desc    = "compliance"
    }
)

$fixCount = 0
foreach ($fix in $fixes) {
    if (Test-Path $fix.Path) {
        $c = Get-Content $fix.Path -Raw
        if ($c -match [regex]::Escape($fix.OldTitle)) {
            $c = $c -replace [regex]::Escape($fix.OldTitle), $fix.NewTitle
            Set-Content -Path $fix.Path -Value $c -NoNewline
            Write-Host "  [FIXED] $($fix.Desc): '$($fix.NewTitle)'" -ForegroundColor Green
            $fixCount++
        } else {
            # Try single-quoted variant
            $oldSingle = $fix.OldTitle
            if ($c -match $oldSingle) {
                $c = $c -replace $oldSingle, $fix.NewTitle
                Set-Content -Path $fix.Path -Value $c -NoNewline
                Write-Host "  [FIXED] $($fix.Desc): '$($fix.NewTitle)'" -ForegroundColor Green
                $fixCount++
            } else {
                Write-Host "  [SKIPPED] $($fix.Desc) — title not found, showing current:" -ForegroundColor Yellow
                $titleM = [regex]::Match($c, "title:\s*[`"']([^`"']+)[`"']")
                if ($titleM.Success) {
                    Write-Host "    Current title: $($titleM.Groups[1].Value)" -ForegroundColor DarkGray
                } else {
                    Write-Host "    Could not extract title — check file manually" -ForegroundColor Red
                }
            }
        }
    } else {
        Write-Host "  [NOT FOUND] $($fix.Path)" -ForegroundColor Red
        # Search for the file anywhere under app/
        Write-Host "    Searching for file..." -ForegroundColor DarkGray
        $found = Get-ChildItem -Path ".\app" -Filter "page.tsx" -Recurse | Where-Object { $_.FullName -like "*$($fix.Desc)*" }
        if ($found) {
            Write-Host "    Found at: $($found.FullName)" -ForegroundColor Yellow
            $c = Get-Content $found.FullName -Raw
            $titleM = [regex]::Match($c, "title:\s*[`"']([^`"']+)[`"']")
            if ($titleM.Success) {
                Write-Host "    Current title: $($titleM.Groups[1].Value)" -ForegroundColor DarkGray
            }
        }
    }
}

Write-Host "`n--- Final Title Audit ---" -ForegroundColor Cyan
Get-ChildItem -Path ".\app" -Filter "page.tsx" -Recurse | ForEach-Object {
    $c = Get-Content $_.FullName -Raw
    if ($c -match 'export const metadata') {
        $titleM = [regex]::Match($c, 'title:\s*[''"`]([^''"`]+)[''"`]')
        if ($titleM.Success) {
            $title = $titleM.Groups[1].Value
            $display = if ($title -match "PreciseGovCon") { $title } else { "$title | PreciseGovCon" }
            $color = if ($display.Length -gt 60) { "Red" } elseif ($display.Length -gt 55) { "Yellow" } else { "Green" }
            Write-Host "  [$($display.Length)c] $($_.Directory.Name): $display" -ForegroundColor $color
        }
    }
}

Write-Host "`n=== $fixCount fix(es) applied ===" -ForegroundColor Cyan
if ($fixCount -gt 0) {
    Write-Host "Run: npm run build && git add -A && git commit -m 'fix: SEO title cleanup and localhost URL fixes' && git push" -ForegroundColor White
}