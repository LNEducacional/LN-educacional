---
type: doc
name: security
description: Security policies, authentication, secrets management, and compliance requirements
category: security
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Security & Compliance Notes

## Authentication

### JWT Token Strategy

The application uses a dual-token JWT strategy:

- **Access Token:** Signed with `JWT_SECRET`, expires in 7 days, stored in HTTP-only cookie named `token`.
- **Refresh Token:** Signed with `JWT_REFRESH_SECRET`, expires in 30 days, stored in HTTP-only cookie named `refreshToken`.

Both cookies are configured with:
- `httpOnly: true` -- Prevents JavaScript access (XSS protection)
- `secure: true` in production -- Only sent over HTTPS
- `sameSite: 'none'` in production -- Required for cross-origin cookie sending
- `domain: 'lneducacional.com.br'` in production
- `path: '/'` -- Available on all routes

### Password Security

- Passwords are hashed using **Argon2** (via `argon2` library), the winner of the Password Hashing Competition and recommended by OWASP.
- Minimum password length: 8 characters (enforced by Zod validation).
- Passwords are never logged or returned in API responses.

### Password Reset

- Reset tokens are JWTs signed with the same `JWT_SECRET`, with a 1-hour expiry.
- The token is stored in the database (`resetToken` field) alongside an expiry timestamp (`resetTokenExpiry`).
- Once used, the token is cleared from the database.

### Role-Based Access Control

Two Fastify decorators enforce access:

1. **`app.authenticate`** -- Verifies JWT from cookie. Returns 401 if missing or invalid.
2. **`app.requireAdmin`** -- Checks `currentUser.role === 'ADMIN'`. Returns 403 if not admin.

Admin routes use both: `{ preHandler: [app.authenticate, app.requireAdmin] }`.

## HTTP Security Headers

The application uses `@fastify/helmet` for security headers:

- **X-Content-Type-Options:** nosniff
- **X-Frame-Options:** SAMEORIGIN
- **X-XSS-Protection:** enabled
- **Referrer-Policy:** configured
- **Content-Security-Policy:** Disabled to avoid breaking the frontend SPA
- **Cross-Origin-Resource-Policy:** Disabled to allow cross-origin resource loading
- **Cross-Origin-Opener-Policy:** Disabled to allow cross-origin popups

## CORS Configuration

CORS is configured via the `CORS_ORIGIN` environment variable:

- In production: Restricted to the platform domain
- In development: Defaults to `http://localhost:5173` and `http://localhost:3000`
- `credentials: true` -- Allows cookies to be sent cross-origin

## Input Validation

All API inputs are validated using **Zod** schemas before processing:

- Registration: email format, password min 8 chars, name min 2 chars
- Login: email format, password required
- Checkout: complex schema with refinements ensuring exactly one product type
- File uploads: MIME type and size validation

## Anti-Spam Protection

The `AntiSpamService` provides multi-layer spam protection for the contact form:

### Rate Limiting
- Default: 5 requests per IP per 15-minute window
- Block duration: 1 hour after exceeding the limit
- In-memory rate limiting store (resets on server restart)

### Content Analysis
- **Spam keyword detection** -- Common spam terms (viagra, casino, lottery, etc.)
- **Suspicious keyword detection** -- Marketing-related terms
- **Link count check** -- Max 2 links per message
- **Message length bounds** -- Min 10 characters, max 5,000 characters
- **Repetitive content detection** -- Flags if any word appears in >30% of text
- **Capital letter ratio** -- Flags if >70% of letters are uppercase

### Behavioral Analysis
- **Honeypot field** -- Hidden field named `website`; if filled, the submission is from a bot
- **Suspicious user agent detection** -- Flags bots, crawlers, curl, wget, Python
- **Disposable email detection** -- Checks against a list of disposable email domains
- **Generic name detection** -- Flags names like "test", "admin", "asdf"

### IP Management
- **Auto-blacklisting** -- After 5 suspicious activities from the same IP
- **Manual blacklist management** -- Admin can add/remove IPs
- **Periodic cleanup** -- Rate limit entries expire, suspicious IP records clear after 24 hours

## File Upload Security

- **Size limits:** 50MB per file, 5 files per request
- **Collaborator documents:** Restricted to PDF, DOC, DOCX, TXT formats, 10MB max
- **File naming:** All uploaded files are renamed to UUID-based names to prevent path traversal
- **Storage:** Files stored in organized subdirectories under `uploads/`
- **Serving:** Static files served through a custom Fastify route with content-type detection

## Secrets Management

### Environment Variables

Sensitive values are managed through environment variables:

| Secret | Purpose |
|--------|---------|
| `JWT_SECRET` | Access token signing |
| `JWT_REFRESH_SECRET` | Refresh token signing |
| `COOKIE_SECRET` | Cookie signing |
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `EMAIL_API_KEY` | Email provider API key |
| `DISCORD_WEBHOOK` / `SLACK_WEBHOOK` | Notification webhook URLs |

### Database-Stored Secrets

The `ApiIntegration` model stores API keys for external services (e.g., Asaas). These are stored in the database and loaded at runtime, allowing dynamic configuration through the admin panel without redeployment.

**Important:** API keys in `ApiIntegration` are stored as plain text. In a production hardening pass, these should be encrypted at rest.

## LGPD Compliance

The platform includes LGPD (Brazil's data protection law) infrastructure:

- **LegalDocument model** -- Stores versioned legal documents (Terms of Service, Privacy Policy, Cookies Policy, LGPD Compliance)
- **User data fields** -- Profile data (address, phone, birth date) is optional
- **Data visibility** -- File URLs for paid content are excluded from public listings

## Known Security Considerations

1. **CSP is disabled** -- Content Security Policy is turned off to avoid breaking the SPA frontend. Consider enabling it with appropriate directives.
2. **API key storage** -- Asaas API keys are stored in plain text in the database. Should be encrypted.
3. **Rate limiting is in-memory** -- The AntiSpamService rate limiter uses in-memory Maps, which reset on server restart and are not shared across PM2 cluster instances. Consider using Redis-based rate limiting for production.
4. **Webhook authentication** -- The Asaas webhook endpoint (`/webhooks/asaas`) does not verify webhook signatures. Consider adding signature verification.
5. **File serving** -- Uploaded files are served directly without access control checks. Paid content file URLs could potentially be shared.
6. **Password reset** -- The forgot-password and reset-password routes currently return success messages without actually sending emails or resetting passwords (stub implementation).
