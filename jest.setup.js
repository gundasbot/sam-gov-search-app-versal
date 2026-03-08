// jest.setup.js
// Configure Jest for testing API routes with Next.js

// Mock environment variables for testing
process.env.NEXTAUTH_SECRET = 'test-secret-for-jest'
process.env.APP_URL = 'http://localhost:3000'
process.env.NEXTAUTH_URL = 'http://localhost:3000'
process.env.BRAND_NAME = 'Precise GovCon'
process.env.BRAND_LOGO_URL = 'https://www.precisegovcon.com/precise-govcon-logo.jpg'
process.env.SUPPORT_EMAIL = 'support@precisegovcon.com'

// Suppress console output during tests (optional)
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Don't suppress errors
  error: console.error,
}
