# Update Notes

Purpose: Keep a simple running log of significant codebase updates before commit/deploy.

## 2026-03-07

- Added bulk preflight scripts in `package.json`:
  - `npm run typecheck`
  - `npm run verify:deploy` (TypeScript + production build)
  - `npm run verify` (TypeScript + lint + production build)
- Added hook setup script in `package.json`:
  - `npm run setup:hooks`
- Added repo-managed pre-push hook at `.githooks/pre-push`.
  - Hook runs `npm run verify:deploy` and blocks push on failure.
  - Validated hook execution with `git hook run pre-push`.
- Updated `app/api/auth/[...nextauth]/route.ts` to resolve NextAuth type mismatch in credentials `authorize()` payload by including normalized fields used by augmented auth types.
- Verified `npm run verify:deploy` passes locally.

## Notes Process

- For each substantial change, append a dated bullet list under a new date heading.
- Include at minimum: files touched, purpose, and verification command used.
- Run `npm run verify:deploy` before push and note the result in this file when relevant.
