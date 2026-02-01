#!/bin/bash

# PreciseGovCon Account System Cleanup Script
# This script removes old/duplicate files that are no longer needed

echo "🧹 Starting cleanup of PreciseGovCon account system..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to safely remove file/directory
safe_remove() {
    local path=$1
    if [ -e "$path" ]; then
        echo -e "${YELLOW}Removing: $path${NC}"
        rm -rf "$path"
        echo -e "${GREEN}✓ Removed${NC}"
    else
        echo -e "${YELLOW}Skipping (not found): $path${NC}"
    fi
}

# Remove old tab-based system files (if they exist)
echo ""
echo "📁 Removing old tab-based system..."
safe_remove "app/account/tabs/"
safe_remove "app/account/plan/page.tsx"
safe_remove "app/account/profile/page.tsx"
safe_remove "app/account/contact/page.tsx"
safe_remove "app/account/usage/page.tsx"

# Remove duplicate API routes (if they exist in wrong locations)
echo ""
echo "📁 Checking for duplicate API routes..."
safe_remove "app/account/api/"

# Remove old subscription management files
echo ""
echo "📁 Removing deprecated subscription files..."
safe_remove "app/account/subscription/"
safe_remove "app/api/subscription/"

# Remove old Stripe integration files (if using old structure)
echo ""
echo "📁 Cleaning up old Stripe files..."
safe_remove "app/api/stripe/create-checkout/"
safe_remove "app/api/stripe/create-portal-session/"

# Check for .env.local
echo ""
echo "🔍 Checking environment configuration..."
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  Warning: .env.local not found${NC}"
    echo "   Creating from .env.local.example..."
    if [ -f ".env.local.example" ]; then
        cp .env.local.example .env.local
        echo -e "${GREEN}✓ Created .env.local - Please update with your values${NC}"
    else
        echo -e "${RED}✗ .env.local.example not found${NC}"
    fi
else
    echo -e "${GREEN}✓ .env.local exists${NC}"
fi

# Verify required environment variables
echo ""
echo "🔍 Verifying Stripe configuration..."
required_vars=(
    "STRIPE_SECRET_KEY"
    "STRIPE_PUBLISHABLE_KEY"
    "STRIPE_PRICE_BASIC_MONTHLY"
    "STRIPE_PRICE_BASIC_ANNUAL"
    "STRIPE_PRICE_PROFESSIONAL_MONTHLY"
    "STRIPE_PRICE_PROFESSIONAL_ANNUAL"
    "STRIPE_PRICE_ENTERPRISE_MONTHLY"
    "STRIPE_PRICE_ENTERPRISE_ANNUAL"
)

missing_vars=0
for var in "${required_vars[@]}"; do
    if ! grep -q "^${var}=" .env.local 2>/dev/null; then
        echo -e "${RED}✗ Missing: $var${NC}"
        missing_vars=$((missing_vars + 1))
    else
        value=$(grep "^${var}=" .env.local | cut -d '=' -f2 | tr -d '"' | tr -d "'")
        if [ "$value" = "price_xxxxx" ] || [ "$value" = "sk_test_..." ] || [ -z "$value" ]; then
            echo -e "${YELLOW}⚠️  Not configured: $var${NC}"
            missing_vars=$((missing_vars + 1))
        else
            echo -e "${GREEN}✓ Configured: $var${NC}"
        fi
    fi
done

# Check database connection
echo ""
echo "🔍 Checking database configuration..."
if grep -q "^DATABASE_URL=" .env.local 2>/dev/null; then
    echo -e "${GREEN}✓ DATABASE_URL configured${NC}"
else
    echo -e "${RED}✗ DATABASE_URL not found${NC}"
    missing_vars=$((missing_vars + 1))
fi

# Summary
echo ""
echo "======================================"
if [ $missing_vars -eq 0 ]; then
    echo -e "${GREEN}✓ Cleanup complete! All configurations look good.${NC}"
else
    echo -e "${YELLOW}⚠️  Cleanup complete, but $missing_vars configuration(s) need attention.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Update .env.local with your Stripe keys and Price IDs"
    echo "2. Ensure DATABASE_URL is properly configured"
    echo "3. Run 'npm run dev' to start the development server"
    echo ""
    echo "See ACCOUNT_SETUP.md for detailed setup instructions."
fi
echo "======================================"
