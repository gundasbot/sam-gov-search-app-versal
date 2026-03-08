# 🧪 Quick Start Guide: Running Tests

## Installation & Setup (One-time)

### 1. Install Jest and Testing Dependencies
```bash
npm install --save-dev jest @types/jest ts-jest jest-environment-node
```

This will install:
- `jest` - Testing framework
- `@types/jest` - TypeScript types for Jest
- `ts-jest` - TypeScript support in Jest
- `jest-environment-node` - Node.js test environment

### 2. Verify Files Are In Place
```bash
# Should show:
ls -la __tests__/auth/
ls -la __tests__/emails/
ls -la jest.config.js jest.setup.js
```

The following files should exist:
- ✅ `jest.config.js` - Jest configuration
- ✅ `jest.setup.js` - Test environment setup
- ✅ `__tests__/auth/signup.test.ts` - Signup endpoint tests
- ✅ `__tests__/auth/verify-email.test.ts` - Email verification tests
- ✅ `__tests__/emails/templates.test.ts` - Email template tests
- ✅ `__tests__/README.md` - Full documentation

### 3. Verify package.json Has Test Scripts
```bash
npm run test --help  # Should work
```

You should see test scripts in package.json:
```json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "verify": "npm run typecheck && npm run lint && npm run test && npm run build"
  }
}
```

## Running Tests

### Basic Test Run
```bash
npm test
```

**Expected output:**
```
 PASS  __tests__/auth/signup.test.ts
 PASS  __tests__/auth/verify-email.test.ts
 PASS  __tests__/emails/templates.test.ts

Test Suites: 3 passed, 3 total
Tests:       37 passed, 37 total
Time:        2.8s
```

### Watch Mode (Re-run tests on file change)
```bash
npm run test:watch
```

This is useful during development. Tests re-run automatically when you save files.

### Coverage Report
```bash
npm run test:coverage
```

This shows:
- Line coverage
- Branch coverage
- Function coverage
- Statement coverage

Example output:
```
---------|----------|----------|----------|----------|
File     | % Stmts  | % Branch | % Funcs  | % Lines  |
---------|----------|----------|----------|----------|
All      |   78.5   |   72.1   |   85.3   |   78.9   |
```

### Run Specific Tests
```bash
# Run only signup tests
npm test signup.test.ts

# Run only email verification tests
npm test verify-email.test.ts

# Run only email template tests
npm test templates.test.ts
```

### Run with Additional Options
```bash
# Show verbose output
npm test -- --verbose

# Run tests matching a pattern
npm test -- --testNamePattern="should include company logo"

# Update snapshots (if using snapshot testing)
npm test -- --updateSnapshot

# Test a specific file
npm test -- __tests__/auth/signup.test.ts
```

## Complete Verification Pipeline

Run this to check everything (TypeScript, linting, tests, build):
```bash
npm run verify
```

This runs:
1. ✅ Type checking (`npm run typecheck`)
2. ✅ Linting (`npm run lint`)
3. ✅ Tests (`npm run test`)
4. ✅ Build (`npm run build`)

## Test Organization

```
__tests__/
├── README.md                    ← Full test documentation
│
├── auth/
│   ├── signup.test.ts          ← Tests for /api/auth/signup
│   │   ├── Validation tests
│   │   ├── Duplicate prevention
│   │   ├── Successful signup
│   │   └── Error handling
│   │
│   └── verify-email.test.ts    ← Tests for /api/auth/verify-email
│       ├── GET endpoint tests
│       ├── POST endpoint tests
│       └── Email integration
│
└── emails/
    └── templates.test.ts        ← Email template generation tests
        ├── Logo inclusion tests
        ├── Branding tests
        ├── Content tests
        └── Compatibility tests
```

## What Gets Tested

### 📝 Signup Flow (`signup.test.ts`)
- ✅ Input validation (email, password, names)
- ✅ Duplicate account prevention
- ✅ Plan tier selection
- ✅ User creation
- ✅ Email verification token generation
- ✅ Verification email sending with logo
- ✅ Error handling

**Total: 11 test cases**

### 🔐 Email Verification Flow (`verify-email.test.ts`)
- ✅ Token validation
- ✅ Trial activation (7 days)
- ✅ Session cookie creation
- ✅ Plan tier in JWT (not hardcoded)
- ✅ Welcome banner cookie
- ✅ Auto-login functionality
- ✅ Already-verified user handling
- ✅ JSON responses

**Total: 13 test cases**

### 📧 Email Templates (`templates.test.ts`)
- ✅ Company logo in all emails
- ✅ Brand colors and styling
- ✅ CTA buttons
- ✅ Email client compatibility
- ✅ Responsive design
- ✅ Alternative text for images

**Total: 13+ test cases**

## Debugging Tests

### See Full Test Output
```bash
npm test -- --verbose
```

### Run Single Test Suite
```bash
npm test signup  # Run only signup.test.ts
```

### Run Single Test Case
```bash
npm test -- --testNamePattern="should create user with correct plan tier"
```

### Debug in VS Code
Add to `.vscode/launch.json`:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Jest Debug",
  "program": "${workspaceFolder}/node_modules/.bin/jest",
  "args": ["--runInBand"],
  "console": "integratedTerminal"
}
```

Then press F5 to debug.

## Common Issues

### ❌ "Cannot find module 'jest'"
**Solution:** Run `npm install --save-dev jest`

### ❌ "Test file not found"
**Solution:** Verify files exist in `__tests__/` directory

### ❌ "NEXTAUTH_SECRET is not set"
**Solution:** `jest.setup.js` sets this automatically for tests

### ❌ "Prisma client not available"
**Solution:** Tests mock Prisma - it's not actually connecting to the database

### ❌ Tests pass locally but fail in CI/CD
**Solution:** Ensure `.env.test` or environment variables are set in CI/CD

## Integration with CI/CD

### GitHub Actions Example
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '20'
      - run: npm install
      - run: npm run test -- --coverage
      - uses: codecov/codecov-action@v2
```

### GitLab CI Example
```yaml
test:
  image: node:20
  script:
    - npm install
    - npm run test -- --coverage
  coverage: '/Coverage: \d+\.\d+%/'
```

## Next Steps

1. ✅ Run `npm install` to install Jest
2. ✅ Run `npm test` to execute all tests
3. ✅ Review coverage with `npm run test:coverage`
4. ✅ Set up watch mode with `npm run test:watch` during development
5. ✅ Add to CI/CD pipeline for automated testing

## Resources

- 📖 [Jest Documentation](https://jestjs.io/)
- 📖 [Testing Library](https://testing-library.com/)
- 📖 [Next.js Testing Guide](https://nextjs.org/docs/app/building-your-application/testing)

---

**Need help?** Check `__tests__/README.md` for detailed documentation on each test file.
