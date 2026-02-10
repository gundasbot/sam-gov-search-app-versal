#!/bin/bash

# Account Page Automated Deployment Script
# This script will place all files in the correct locations

echo "🚀 Deploying Account Page Files..."
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the directory where the script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Create necessary directories
echo -e "${BLUE}📁 Creating directories...${NC}"
mkdir -p app/account
mkdir -p app/api/account/payment-methods
mkdir -p app/api/account/bids

# Copy account page
if [ -f "$SCRIPT_DIR/page.tsx" ]; then
    cp "$SCRIPT_DIR/page.tsx" app/account/page.tsx
    echo -e "${GREEN}✓${NC} Deployed app/account/page.tsx"
else
    echo -e "${RED}✗${NC} page.tsx not found in current directory"
    echo -e "  ${YELLOW}→${NC} Make sure page.tsx is in the same folder as this script"
fi

# Copy payment methods route
if [ -f "$SCRIPT_DIR/payment-methods-route.ts" ]; then
    cp "$SCRIPT_DIR/payment-methods-route.ts" app/api/account/payment-methods/route.ts
    echo -e "${GREEN}✓${NC} Deployed app/api/account/payment-methods/route.ts"
else
    echo -e "${RED}✗${NC} payment-methods-route.ts not found in current directory"
fi

# Copy bids route
if [ -f "$SCRIPT_DIR/bids-route.ts" ]; then
    cp "$SCRIPT_DIR/bids-route.ts" app/api/account/bids/route.ts
    echo -e "${GREEN}✓${NC} Deployed app/api/account/bids/route.ts"
else
    echo -e "${RED}✗${NC} bids-route.ts not found in current directory"
fi

echo ""
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo ""
echo "📝 Next Steps:"
echo ""
echo "1. Restart your dev server:"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "2. Navigate to:"
echo -e "   ${BLUE}http://localhost:3000/account${NC}"
echo ""
echo "3. Click the user dropdown → Account"
echo ""
echo "If you encounter issues, run ./verify-account-setup.sh to diagnose"
