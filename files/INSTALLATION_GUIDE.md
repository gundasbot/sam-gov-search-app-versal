# Account Page - Manual Installation Guide

## The Problem

You're getting a 404 error because Next.js can't find the account page at the `/account` route.

## The Solution

Place the files in the **exact** locations shown below.

## Required Folder Structure

```
your-project/
├── app/
│   ├── account/                    ← This folder should already exist
│   │   ├── layout.tsx             ← Already exists (you uploaded it)
│   │   └── page.tsx               ← COPY THIS FILE HERE
│   │
│   └── api/
│       └── account/
│           ├── payment-methods/   ← Create this folder
│           │   └── route.ts       ← Copy payment-methods-route.ts here
│           │
│           └── bids/              ← Create this folder
│               └── route.ts       ← Copy bids-route.ts here
│
├── package.json
└── ...
```

## Step-by-Step Installation

### Option 1: Automated (Recommended)

**Windows:**
```cmd
# 1. Download all files to your project root
# 2. Run the deployment script
deploy-account.bat
```

**Mac/Linux:**
```bash
# 1. Download all files to your project root
# 2. Make script executable
chmod +x deploy-account.sh

# 3. Run the deployment script
./deploy-account.sh
```

### Option 2: Manual Installation

#### Step 1: Account Page
```bash
# Copy page.tsx to the account folder
# From: page.tsx
# To:   app/account/page.tsx
```

**Windows (PowerShell):**
```powershell
Copy-Item page.tsx app\account\page.tsx
```

**Mac/Linux:**
```bash
cp page.tsx app/account/page.tsx
```

#### Step 2: Payment Methods API
```bash
# Create the folder
# Windows:
mkdir app\api\account\payment-methods

# Mac/Linux:
mkdir -p app/api/account/payment-methods

# Copy the file
# Windows:
Copy-Item payment-methods-route.ts app\api\account\payment-methods\route.ts

# Mac/Linux:
cp payment-methods-route.ts app/api/account/payment-methods/route.ts
```

#### Step 3: Bids API
```bash
# Create the folder
# Windows:
mkdir app\api\account\bids

# Mac/Linux:
mkdir -p app/api/account/bids

# Copy the file
# Windows:
Copy-Item bids-route.ts app\api\account\bids\route.ts

# Mac/Linux:
cp bids-route.ts app/api/account/bids/route.ts
```

## After Installation

### 1. Clear Next.js Cache
```bash
# Windows (PowerShell):
Remove-Item -Recurse -Force .next

# Mac/Linux:
rm -rf .next
```

### 2. Restart Dev Server
```bash
# Stop current server (Ctrl+C or Cmd+C)
# Then restart:
npm run dev
```

### 3. Test the Page

1. Open browser: `http://localhost:3000`
2. Click the user dropdown in the header (shows "Norman")
3. Click "Account"
4. Should load the account page ✅

## Troubleshooting

### Still Getting 404?

1. **Check file names are exact:**
   - Must be `page.tsx` (lowercase)
   - Must be `route.ts` (lowercase)

2. **Verify folder structure:**
   ```bash
   # Windows:
   dir app\account
   # Should show: layout.tsx, page.tsx
   
   # Mac/Linux:
   ls -la app/account
   # Should show: layout.tsx, page.tsx
   ```

3. **Check for typos in folder names:**
   ```bash
   # Should be app/account NOT app/accounts
   # Should be app/api NOT app/apis
   ```

4. **Look at dev server output:**
   ```bash
   # After running npm run dev, you should see:
   ✓ Ready in 1499ms
   
   # NOT:
   ⨯ Error: Cannot find module...
   ```

### Console Errors?

Open browser DevTools (F12) and check for:
- Red errors in Console tab
- Failed network requests in Network tab

Common errors:
- `404 /account` → File not in correct location
- `404 /api/account/plan` → API endpoint missing
- `Unauthorized` → Session/auth issue

### Need to Verify Setup?

Run the verification script:

**Windows:**
```cmd
verify-account-setup.bat
```

**Mac/Linux:**
```bash
chmod +x verify-account-setup.sh
./verify-account-setup.sh
```

## What Each File Does

### page.tsx (Main Account Page)
- The React component that renders the account interface
- Handles tabs: Overview, Profile, Billing, Support, Bids
- Manages state and data fetching
- **Size:** ~62KB (comprehensive UI)

### payment-methods-route.ts
- API endpoint: `GET /api/account/payment-methods`
- Fetches payment methods from Stripe
- Returns list of cards with last 4 digits
- **Size:** ~2KB

### bids-route.ts
- API endpoint: `GET /api/account/bids`
- Fetches user's bid history
- Currently returns empty array (until bids table exists)
- **Size:** ~3KB

## File Locations Reference

| File You Have | Where It Goes | Route It Creates |
|---------------|---------------|------------------|
| page.tsx | app/account/page.tsx | /account |
| payment-methods-route.ts | app/api/account/payment-methods/route.ts | /api/account/payment-methods |
| bids-route.ts | app/api/account/bids/route.ts | /api/account/bids |

## Header Integration

The header already has the correct link:

```tsx
// In Header.tsx line 462
<Link href="/account">
  <User className="w-4 h-4" />
  Account
</Link>
```

No changes needed to Header.tsx! ✅

## Expected Behavior After Installation

1. ✅ Click "Norman" dropdown → Shows "Account" option
2. ✅ Click "Account" → Loads /account page
3. ✅ Page displays 5 tabs: Overview, Profile, Billing, Support, Bids
4. ✅ Overview shows account status and quick actions
5. ✅ Profile shows user information
6. ✅ Billing shows current plan (ENTERPRISE)
7. ✅ Support shows contact options
8. ✅ Bids shows empty state (until bids are added)

## Getting Help

If you're still stuck after following this guide:

1. Check your terminal for error messages
2. Check browser console (F12) for errors
3. Run the verification script
4. Share the exact error message

The most common issue is files being in the wrong folder. Double-check the paths!
