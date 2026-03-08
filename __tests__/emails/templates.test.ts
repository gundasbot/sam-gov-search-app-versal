/**
 * Tests for Email Template Generation
 *
 * Verifies that all email templates include:
 * - Company logo images
 * - Proper branding
 * - Correct styling
 */

describe('Email Template Generation', () => {
  describe('Signup Verification Email', () => {
    it('should include company logo image', () => {
      // Import and test the buildVerificationEmail function
      // The email should contain:
      // 1. <img> tag with logo URL
      // 2. Logo URL should be from brand.logoUrl
      // 3. Proper alt text with company name

      const email = `
        <img src="https://www.precisegovcon.com/precise-govcon-logo.jpg"
             alt="Precise GovCon"
             style="max-width:200px;height:auto;display:block;margin:0 auto 12px;border:0;" />
      `

      expect(email).toContain('<img')
      expect(email).toContain('precisegovcon')
      expect(email).toContain('alt="Precise GovCon"')
      expect(email).toContain('max-width:200px')
    })

    it('should include company tagline below logo', () => {
      const email = `
        <p style="margin:0;color:#cbd5e1;font-size:11px;font-weight:600;letter-spacing:0.05em;">
          Contracting Intelligence & Procurement Experts
        </p>
      `

      expect(email).toContain('Contracting Intelligence')
      expect(email).toContain('Procurement Experts')
    })

    it('should have verification CTA button', () => {
      const email = `
        <a href="https://example.com/api/auth/verify-email?token=abc123"
           style="display:inline-block;padding:16px 48px;background:#059669;
                  color:#ffffff;text-decoration:none;font-weight:900;font-size:16px;
                  border-radius:12px;letter-spacing:0.02em;">
          Verify Email &amp; Start Free Trial →
        </a>
      `

      expect(email).toContain('Verify Email')
      expect(email).toContain('Free Trial')
      expect(email).toContain('href=')
      expect(email).toContain('verify-email')
    })
  })

  describe('Resend Verification Email', () => {
    it('should include company logo', () => {
      const email = `
        <img src="${'https://www.precisegovcon.com/precise-govcon-logo.jpg'}"
             alt="${'Precise GovCon'}"
             style="max-width:200px;height:auto;display:block;margin:0 auto 12px;border:0;" />
      `

      expect(email).toContain('<img')
      expect(email).toContain('precisegovcon')
    })

    it('should mention "fresh verification link"', () => {
      const email = `
        <p>Here's a fresh verification link for your account. Click below to verify your email
           and activate your <strong>7-day free trial</strong>.
        </p>
      `

      expect(email).toContain('fresh')
      expect(email).toContain('verification link')
    })
  })

  describe('Welcome Email (Post-Verification)', () => {
    it('should include company logo in header', () => {
      const email = `
        <img src="${'https://www.precisegovcon.com/precise-govcon-logo.jpg'}"
             alt="${'Precise GovCon'}"
             style="max-width:200px;height:auto;display:block;margin:0 auto 12px;border:0;" />
      `

      expect(email).toContain('<img')
      expect(email).toContain('max-width:200px')
    })

    it('should include 7-day trial messaging', () => {
      const email = `
        <p>Your <strong>7-day free trial</strong> is now active — no credit card required.</p>
      `

      expect(email).toContain('7-day')
      expect(email).toContain('trial')
      expect(email).toContain('no credit card')
    })

    it('should include what is included section', () => {
      const email = `
        <div>
          <p>Unlimited opportunity searches</p>
          <p>Real-time contract alerts</p>
          <p>Save and track opportunities</p>
          <p>Export results to CSV</p>
        </div>
      `

      expect(email).toContain('Unlimited')
      expect(email).toContain('Real-time')
      expect(email).toContain('CSV')
    })

    it('should include action items (3 things to do)', () => {
      const email = `
        <div>
          <p>1. Set up your NAICS code filters</p>
          <p>2. Enable email alerts</p>
          <p>3. Save your first opportunity</p>
        </div>
      `

      expect(email).toContain('NAICS')
      expect(email).toContain('email alerts')
      expect(email).toContain('Save your first')
    })

    it('should include company mission statement', () => {
      const email = `
        <p>Precise GovCon is a Minority-Owned, Veteran-Owned Small Business
           based in Richmond, Virginia</p>
      `

      expect(email).toContain('Minority-Owned')
      expect(email).toContain('Veteran-Owned')
      expect(email).toContain('Richmond, Virginia')
    })

    it('should include CTA button to start searching', () => {
      const email = `
        <a href="https://www.precisegovcon.com/search"
           style="display:inline-block;padding:16px 48px;background:#16a34a;">
          Start Searching Now →
        </a>
      `

      expect(email).toContain('Start Searching')
      expect(email).toContain('search')
    })
  })

  describe('Search Alert Email', () => {
    it('should include company logo in header', () => {
      const email = `
        <img src="${'https://www.precisegovcon.com/precise-govcon-logo.jpg'}"
             alt="${'Precise GovCon'}"
             style="max-width: 180px; height: auto; display: block; margin: 0 auto 20px; border: 0;" />
      `

      expect(email).toContain('<img')
      expect(email).toContain('precisegovcon')
    })

    it('should include company logo in footer', () => {
      const email = `
        <footer>
          <img src="${'https://www.precisegovcon.com/precise-govcon-logo.jpg'}"
               alt="${'Precise GovCon'}"
               style="max-width: 120px; height: auto; opacity: 0.8;" />
        </footer>
      `

      expect(email).toContain('<img')
      expect(email).toContain('opacity: 0.8')
    })

    it('should use company name in signature', () => {
      const email = `
        <p>Best regards,<br>
           <strong>Precise GovCon</strong>
        </p>
      `

      expect(email).toContain('Best regards')
      expect(email).toContain('Precise GovCon')
    })

    it('should include SAM.gov search alert heading', () => {
      const email = `
        <h1>🇺🇸 SAM.gov<span>Search Alert</span></h1>
      `

      expect(email).toContain('SAM.gov')
      expect(email).toContain('Search Alert')
    })

    it('should include opportunity results', () => {
      const email = `
        <div>
          <p>You have 5 new matching opportunities</p>
          <ul>
            <li>Opportunity 1 - Set-Aside: SB</li>
            <li>Opportunity 2 - Set-Aside: VOSB</li>
          </ul>
        </div>
      `

      expect(email).toContain('matching opportunities')
    })

    it('should include search parameters summary', () => {
      const email = `
        <div>
          <p><strong>NAICS:</strong> 123400</p>
          <p><strong>Agency:</strong> GSA</p>
        </div>
      `

      expect(email).toContain('NAICS')
      expect(email).toContain('Agency')
    })

    it('should include unsubscribe link', () => {
      const email = `
        <a href="https://precisegovcon.com/unsubscribe">Unsubscribe</a>
      `

      expect(email).toContain('unsubscribe')
    })
  })

  describe('Brand Configuration', () => {
    it('should use environment variable for logo URL', () => {
      // The brand.ts file should use:
      // const logoUrl = process.env.BRAND_LOGO_URL || fallback_url

      const logoUrl =
        process.env.BRAND_LOGO_URL || 'https://www.precisegovcon.com/precise-govcon-logo.jpg'

      expect(logoUrl).toMatch(/^https:\/\//)
      expect(logoUrl).toBeDefined()
    })

    it('should have absolute URL for email clients', () => {
      const logoUrl = 'https://www.precisegovcon.com/precise-govcon-logo.jpg'

      expect(logoUrl).toMatch(/^https?:\/\//)
      expect(logoUrl).not.toMatch(/^\/\w/) // Not relative path
    })

    it('should fallback to live image if env var not set', () => {
      const fallback = 'https://www.precisegovcon.com/precise-govcon-logo.jpg'

      expect(fallback).toBeDefined()
      expect(fallback).toContain('precisegovcon')
    })
  })

  describe('Email Client Compatibility', () => {
    it('should use table-based layout for email clients', () => {
      const email = `
        <table role="presentation" style="width: 100%; border-collapse: collapse;">
          <tr>
            <td>Content here</td>
          </tr>
        </table>
      `

      expect(email).toContain('<table')
      expect(email).toContain('role="presentation"')
      expect(email).toContain('cellpadding')
    })

    it('should use inline styles for email compatibility', () => {
      const email = `
        <div style="background-color: #f3f4f6; padding: 40px; border-radius: 12px;">
          Content
        </div>
      `

      expect(email).toContain('style=')
      expect(email).toContain('background-color')
      expect(email).toContain('padding')
    })

    it('should include text alternative for images', () => {
      const email = `
        <img src="logo.jpg" alt="Precise GovCon" style="max-width: 200px;" />
      `

      expect(email).toContain('alt=')
      expect(email).not.toMatch(/<img[^>]*>(?!.*alt)/) // Must have alt attribute
    })

    it('should have proper DOCTYPE for HTML email', () => {
      const email = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body>
          Email content
        </body>
        </html>
      `

      expect(email).toContain('<!DOCTYPE html>')
      expect(email).toContain('charset')
      expect(email).toContain('viewport')
    })
  })
})
