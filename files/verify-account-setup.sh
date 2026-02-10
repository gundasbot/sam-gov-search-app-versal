#!/bin/bash

# Account Page Deployment Verification Script
# Run this to check if all files are in the correct locations

echo "🔍 Checking Account Page File Structure..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check main account page
if [ -f "app/account/page.tsx" ]; then
    echo -e "${GREEN}✓${NC} app/account/page.tsx exists"
else
    echo -e "${RED}✗${NC} app/account/page.tsx MISSING"
    echo -e "  ${YELLOW}→${NC} Copy page.tsx to app/account/page.tsx"
fi

# Check layout
if [ -f "app/account/layout.tsx" ]; then
    echo -e "${GREEN}✓${NC} app/account/layout.tsx exists"
else
    echo -e "${RED}✗${NC} app/account/layout.tsx MISSING"
    echo -e "  ${YELLOW}→${NC} Copy layout.tsx to app/account/layout.tsx"
fi

# Check payment methods API
if [ -f "app/api/account/payment-methods/route.ts" ]; then
    echo -e "${GREEN}✓${NC} app/api/account/payment-methods/route.ts exists"
else
    echo -e "${RED}✗${NC} app/api/account/payment-methods/route.ts MISSING"
    echo -e "  ${YELLOW}→${NC} Copy payment-methods-route.ts to app/api/account/payment-methods/route.ts"
fi

# Check bids API
if [ -f "app/api/account/bids/route.ts" ]; then
    echo -e "${GREEN}✓${NC} app/api/account/bids/route.ts exists"
else
    echo -e "${RED}✗${NC} app/api/account/bids/route.ts MISSING"
    echo -e "  ${YELLOW}→${NC} Copy bids-route.ts to app/api/account/bids/route.ts"
fi

echo ""
echo "📋 Required Stripe API Endpoints (should already exist):"
echo ""

# Check existing Stripe endpoints
STRIPE_ENDPOINTS=(
    "app/api/stripe/create-checkout/route.ts"
    "app/api/stripe/change-subscription/route.ts"
    "app/api/stripe/portal/route.ts"
    "app/api/stripe/subscription/cancel/route.ts"
    "app/api/stripe/invoices/route.ts"
)

for endpoint in "${STRIPE_ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo -e "${GREEN}✓${NC} $endpoint exists"
    else
        echo -e "${YELLOW}!${NC} $endpoint not found (may need to be created)"
    fi
done

# Check existing account endpoints
echo ""
echo "📋 Required Account API Endpoints (should already exist):"
echo ""

ACCOUNT_ENDPOINTS=(
    "app/api/account/profile/route.ts"
    "app/api/account/plan/route.ts"
    "app/api/account/usage/route.ts"
)

for endpoint in "${ACCOUNT_ENDPOINTS[@]}"; do
    if [ -f "$endpoint" ]; then
        echo -e "${GREEN}✓${NC} $endpoint exists"
    else
        echo -e "${YELLOW}!${NC} $endpoint not found (may need to be created)"
    fi
done

echo ""
echo "🚀 Next Steps:"
echo ""
echo "1. Place any missing files in the correct locations"
echo "2. Stop your dev server (Ctrl+C)"
echo "3. Clear Next.js cache: rm -rf .next"
echo "4. Restart: npm run dev"
echo "5. Navigate to http://localhost:3000/account"
echo ""
echo "If you see 404 after this, check your console for error messages."
