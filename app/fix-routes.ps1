# fix-routes.ps1
# Automatic Route Fix Script

Write-Host "================================" -ForegroundColor Cyan
Write-Host "Route File Fix & Verification" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Check current state
Write-Host "Step 1: Checking current route file..." -ForegroundColor Yellow

$routePath = "app/api/saved-searches/[id]/route.ts"
$routeExists = Test-Path $routePath

if ($routeExists) {
    Write-Host "  ✓ Route file exists" -ForegroundColor Green
    
    # Check for handlers
    $hasDelete = Select-String -Path $routePath -Pattern "export async function DELETE" -Quiet
    $hasPatch = Select-String -Path $routePath -Pattern "export async function PATCH" -Quiet
    $hasGet = Select-String -Path $routePath -Pattern "export async function GET" -Quiet
    $hasPost = Select-String -Path $routePath -Pattern "export async function POST" -Quiet
    
    Write-Host "  DELETE handler: $(if ($hasDelete) { '✓' } else { '✗ MISSING' })" -ForegroundColor $(if ($hasDelete) { 'Green' } else { 'Red' })
    Write-Host "  PATCH handler:  $(if ($hasPatch) { '✓' } else { '✗ MISSING' })" -ForegroundColor $(if ($hasPatch) { 'Green' } else { 'Red' })
    Write-Host "  GET handler:    $(if ($hasGet) { '✓' } else { '✗ MISSING' })" -ForegroundColor $(if ($hasGet) { 'Green' } else { 'Red' })
    Write-Host "  POST handler:   $(if ($hasPost) { '✓' } else { '✗ MISSING' })" -ForegroundColor $(if ($hasPost) { 'Green' } else { 'Red' })
    
    if (-not ($hasDelete -and $hasPatch -and $hasGet -and $hasPost)) {
        Write-Host "`n⚠️  Route file incomplete!" -ForegroundColor Yellow
        $needsReplace = $true
    } else {
        Write-Host "`n✓ Route file looks complete" -ForegroundColor Green
        $needsReplace = $false
    }
} else {
    Write-Host "  ✗ Route file DOES NOT EXIST" -ForegroundColor Red
    $needsReplace = $true
}

Write-Host ""

# Step 2: Check if route-fixed.ts exists
Write-Host "Step 2: Checking for route-fixed.ts..." -ForegroundColor Yellow

$fixedRoutePath = "route-fixed.ts"
$fixedRouteExists = Test-Path $fixedRoutePath

if (-not $fixedRouteExists) {
    Write-Host "  ✗ route-fixed.ts not found in current directory" -ForegroundColor Red
    Write-Host "`nPlease make sure route-fixed.ts is in your project root directory." -ForegroundColor Yellow
    Write-Host "You can download it from the outputs folder." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✓ route-fixed.ts found" -ForegroundColor Green
Write-Host ""

# Step 3: Ask user if they want to replace
if ($needsReplace) {
    Write-Host "Step 3: Fix Required" -ForegroundColor Yellow
    Write-Host "The route file needs to be replaced with the fixed version." -ForegroundColor Yellow
    $response = Read-Host "`nDo you want to replace it now? (Y/N)"
    
    if ($response -eq 'Y' -or $response -eq 'y') {
        # Create directory if it doesn't exist
        $routeDir = Split-Path -Parent $routePath
        if (-not (Test-Path $routeDir)) {
            Write-Host "  Creating directory: $routeDir" -ForegroundColor Cyan
            New-Item -ItemType Directory -Path $routeDir -Force | Out-Null
        }
        
        # Backup old file if it exists
        if ($routeExists) {
            $backupPath = "$routePath.backup"
            Write-Host "  Creating backup: $backupPath" -ForegroundColor Cyan
            Copy-Item $routePath $backupPath -Force
        }
        
        # Copy fixed file
        Write-Host "  Copying route-fixed.ts to $routePath" -ForegroundColor Cyan
        Copy-Item $fixedRoutePath $routePath -Force
        
        Write-Host "`n✅ Route file replaced successfully!" -ForegroundColor Green
        Write-Host "  You can restore the backup later if needed: $backupPath" -ForegroundColor Gray
    } else {
        Write-Host "`n❌ Cancelled. No changes made." -ForegroundColor Red
        exit 0
    }
} else {
    Write-Host "Step 3: No fix needed" -ForegroundColor Green
    Write-Host "The route file appears to be complete." -ForegroundColor Green
}

Write-Host ""

# Step 4: Verify after fix
Write-Host "Step 4: Final verification..." -ForegroundColor Yellow

$hasDelete = Select-String -Path $routePath -Pattern "export async function DELETE" -Quiet
$hasPatch = Select-String -Path $routePath -Pattern "export async function PATCH" -Quiet
$hasGet = Select-String -Path $routePath -Pattern "export async function GET" -Quiet
$hasPost = Select-String -Path $routePath -Pattern "export async function POST" -Quiet

Write-Host "  DELETE handler: $(if ($hasDelete) { '✓' } else { '✗' })" -ForegroundColor $(if ($hasDelete) { 'Green' } else { 'Red' })
Write-Host "  PATCH handler:  $(if ($hasPatch) { '✓' } else { '✗' })" -ForegroundColor $(if ($hasPatch) { 'Green' } else { 'Red' })
Write-Host "  GET handler:    $(if ($hasGet) { '✓' } else { '✗' })" -ForegroundColor $(if ($hasGet) { 'Green' } else { 'Red' })
Write-Host "  POST handler:   $(if ($hasPost) { '✓' } else { '✗' })" -ForegroundColor $(if ($hasPost) { 'Green' } else { 'Red' })

Write-Host ""

if ($hasDelete -and $hasPatch -and $hasGet -and $hasPost) {
    Write-Host "✅ All handlers present! Route file is ready." -ForegroundColor Green
    Write-Host ""
    Write-Host "Next Steps:" -ForegroundColor Cyan
    Write-Host "1. If dev server is running, it should auto-reload" -ForegroundColor White
    Write-Host "2. If not, restart it with: npm run dev" -ForegroundColor White
    Write-Host "3. Test DELETE functionality in the browser" -ForegroundColor White
    Write-Host "4. Check terminal for 'DELETE /api/saved-searches/[id] 200'" -ForegroundColor White
} else {
    Write-Host "⚠️  Something went wrong. Route file still incomplete." -ForegroundColor Red
    Write-Host "Please manually copy route-fixed.ts to $routePath" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================" -ForegroundColor Cyan