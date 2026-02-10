# PowerShell Script to Fix Prisma Field Names
# This fixes the camelCase to snake_case conversion issue

Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "Fixing Prisma Field Names in Middleware" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan

$projectPath = "C:\Users\owner\Documents\sam-gov-search-app"

# Step 1: Find all files with the problematic field names
Write-Host "`nStep 1: Searching for files with incorrect field names..." -ForegroundColor Yellow

$searchTerms = @{
    "trialActive" = "trial_active"
    "trialExpiresAt" = "trial_expires_at"
    "trialEndsAt" = "trial_ends_at"
    "planStatus" = "plan_status"
}

$filesToFix = @()

foreach ($term in $searchTerms.Keys) {
    $files = Get-ChildItem -Path $projectPath -Recurse -Include *.ts,*.tsx -ErrorAction SilentlyContinue | 
        Select-String -Pattern $term -List | 
        Select-Object -ExpandProperty Path -Unique
    
    if ($files) {
        $filesToFix += $files
        Write-Host "  Found '$term' in:" -ForegroundColor Red
        $files | ForEach-Object { Write-Host "    - $_" -ForegroundColor White }
    }
}

$filesToFix = $filesToFix | Select-Object -Unique

if ($filesToFix.Count -eq 0) {
    Write-Host "`nNo files found with problematic field names!" -ForegroundColor Green
    exit 0
}

Write-Host "`n`nFound $($filesToFix.Count) file(s) to fix" -ForegroundColor Yellow

# Step 2: Create backups
Write-Host "`nStep 2: Creating backups..." -ForegroundColor Yellow

foreach ($file in $filesToFix) {
    $backupPath = "$file.backup"
    Copy-Item -Path $file -Destination $backupPath -Force
    Write-Host "  ✓ Backed up: $file" -ForegroundColor Green
}

# Step 3: Fix the field names
Write-Host "`nStep 3: Fixing field names..." -ForegroundColor Yellow

foreach ($file in $filesToFix) {
    $content = Get-Content -Path $file -Raw
    $originalContent = $content
    
    foreach ($oldName in $searchTerms.Keys) {
        $newName = $searchTerms[$oldName]
        # Only replace in select/where clauses, not in variable names
        $content = $content -replace "(\s+)$oldName(\s*:\s*true)", "`$1$newName`$2"
        $content = $content -replace "(\s+)$oldName(\s*\?:\s*true)", "`$1$newName`$2"
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file -Value $content -NoNewline
        Write-Host "  ✓ Fixed: $file" -ForegroundColor Green
    } else {
        Write-Host "  - No changes needed: $file" -ForegroundColor Gray
    }
}

# Step 4: Show what was changed
Write-Host "`n`nStep 4: Summary of changes" -ForegroundColor Yellow
Write-Host "The following replacements were made:" -ForegroundColor White
foreach ($oldName in $searchTerms.Keys) {
    $newName = $searchTerms[$oldName]
    Write-Host "  $oldName -> $newName" -ForegroundColor Cyan
}

Write-Host "`n==================================================" -ForegroundColor Cyan
Write-Host "Fix Complete!" -ForegroundColor Green
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host "`nNext steps:" -ForegroundColor Yellow
Write-Host "1. Review the changes in your code editor" -ForegroundColor White
Write-Host "2. Restart your dev server with: npm run dev" -ForegroundColor White
Write-Host "3. If something goes wrong, restore from .backup files" -ForegroundColor White
Write-Host "`nBackup files created with .backup extension" -ForegroundColor Gray