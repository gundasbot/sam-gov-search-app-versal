@echo off
REM Account Page Automated Deployment Script (Windows)
REM This script will place all files in the correct locations

echo.
echo 🚀 Deploying Account Page Files...
echo.

REM Create necessary directories
echo 📁 Creating directories...
if not exist "app\account" mkdir "app\account"
if not exist "app\api\account\payment-methods" mkdir "app\api\account\payment-methods"
if not exist "app\api\account\bids" mkdir "app\api\account\bids"

REM Copy account page
if exist "page.tsx" (
    copy /Y "page.tsx" "app\account\page.tsx" >nul
    echo ✓ Deployed app\account\page.tsx
) else (
    echo ✗ page.tsx not found in current directory
    echo   Make sure page.tsx is in the same folder as this script
)

REM Copy payment methods route
if exist "payment-methods-route.ts" (
    copy /Y "payment-methods-route.ts" "app\api\account\payment-methods\route.ts" >nul
    echo ✓ Deployed app\api\account\payment-methods\route.ts
) else (
    echo ✗ payment-methods-route.ts not found in current directory
)

REM Copy bids route
if exist "bids-route.ts" (
    copy /Y "bids-route.ts" "app\api\account\bids\route.ts" >nul
    echo ✓ Deployed app\api\account\bids\route.ts
) else (
    echo ✗ bids-route.ts not found in current directory
)

echo.
echo ✅ Deployment Complete!
echo.
echo 📝 Next Steps:
echo.
echo 1. Restart your dev server:
echo    npm run dev
echo.
echo 2. Navigate to:
echo    http://localhost:3000/account
echo.
echo 3. Click the user dropdown (Norman) → Account
echo.
pause
