---
type: doc
name: data-flow
description: How data moves through the system and external integrations
category: data-flow
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Data Flow & Integrations

## Authentication Flow

```
Client                          Server                          PostgreSQL
  |                               |                                |
  |-- POST /auth/register ------->|                                |
  |   {name, email, password}     |-- hashPassword(argon2) ------->|
  |                               |-- prisma.user.create --------->|
  |                               |<-- user record ----------------|
  |                               |-- generateTokens(jwt) -------->|
  |<-- Set-Cookie: token (7d) ----|                                |
  |<-- Set-Cookie: refreshToken   |                                |
  |    (30d)                      |                                |
  |                               |                                |
  |-- GET /auth/me (cookie) ----->|                                |
  |                               |-- verifyToken(jwt) ----------->|
  |                               |-- prisma.user.findUnique ----->|
  |<-- {id, name, email, role} ---|<-- user data ------------------|
```

### Token Details

- **Access Token (JWT):** 7-day expiry. Contains `{id, email, name, role}`. Stored in HTTP-only `token` cookie.
- **Refresh Token (JWT):** 30-day expiry. Contains `{id}`. Stored in HTTP-only `refreshToken` cookie.
- **Cookie options:** `httpOnly: true`, `secure` in production, `sameSite: 'none'` in production / `'lax'` in development, domain scoped to `lneducacional.com.br` in production.
- **Password hashing:** Argon2 (via `argon2` library).

### Token Refresh

```
Client                          Server
  |                               |
  |-- POST /auth/refresh -------->|
  |   (refreshToken cookie)       |-- validateRefreshToken ------->
  |                               |-- generateTokens (new pair) -->
  |<-- Set-Cookie: token (new) ---|
```

## Payment Flow (Asaas Integration)

The Asaas payment gateway is the primary external integration. It supports PIX, Boleto, and Credit Card payments.

### Checkout Flow

```
Client                    Server                    Asaas API           PostgreSQL
  |                         |                          |                    |
  |-- POST /checkout/create |                          |                    |
  |   {courseId/ebookId/    |                          |                    |
  |    paperId, customer,   |                          |                    |
  |    paymentMethod}       |                          |                    |
  |                         |-- createOrUpdateCustomer |                    |
  |                         |------------------------->|                    |
  |                         |<-- customerId ------------|                    |
  |                         |                          |                    |
  |                         |-- prisma.order.create ---|----------------->  |
  |                         |                          |  <-- order --------|
  |                         |                          |                    |
  |                         |-- createCharge --------->|                    |
  |                         |<-- charge (id, status) --|                    |
  |                         |                          |                    |
  |  [If PIX]               |-- getPixQrCode -------->|                    |
  |                         |<-- {payload, qrImage} ---|                    |
  |<-- {pixCode, qrImage} -|                          |                    |
  |                         |                          |                    |
  |  [If Credit Card]      |-- payWithCreditCard ---->|                    |
  |                         |<-- payment result -------|                    |
  |<-- {status: CONFIRMED} -|                          |                    |
  |                         |                          |                    |
  |  [If Boleto]           |<-- {bankSlipUrl} --------|                    |
  |<-- {boletoUrl} --------|                          |                    |
```

### Asaas Webhook Flow

```
Asaas                       Server                      PostgreSQL
  |                            |                            |
  |-- POST /webhooks/asaas --->|                            |
  |   {event, payment}        |                            |
  |                            |-- Lookup order by         |
  |                            |   externalReference ----->|
  |                            |<-- order data ------------|
  |                            |                            |
  |  [PAYMENT_CONFIRMED]      |-- Update order status ---->|
  |                            |   COMPLETED + CONFIRMED   |
  |                            |                            |
  |  [If course purchase]     |-- Create enrollment ------>|
  |                            |                            |
  |<-- 200 {received: true} --|                            |
```

### Asaas Configuration

The Asaas API key and environment (sandbox/production) are stored in the `ApiIntegration` database table, not in environment variables. The `AsaasService.initialize()` static method reads the configuration from the database at runtime.

**Supported payment events:**
- `PAYMENT_RECEIVED` / `PAYMENT_CONFIRMED` -> Order COMPLETED
- `PAYMENT_OVERDUE` / `PAYMENT_DELETED` -> Order CANCELED
- `PAYMENT_REFUNDED` / `PAYMENT_REFUND_IN_PROGRESS` -> Order CANCELED

## Custom Paper Workflow

Custom papers follow a multi-step stateful workflow:

```
REQUESTED --> QUOTED --> APPROVED --> IN_PROGRESS --> REVIEW --> COMPLETED
    |            |          |              |            |
    +-> CANCELLED +-> REJECTED +-> CANCELLED +-> CANCELLED
```

1. **REQUESTED:** Student submits a request with title, description, paper type, academic area, page count, deadline, urgency, requirements, and optional files.
2. **QUOTED:** Admin reviews and provides a price quote (`quotedPrice`).
3. **APPROVED:** Student accepts the quote. An Order is created and linked to the custom paper.
4. **IN_PROGRESS:** Work begins after payment is confirmed.
5. **REVIEW:** Admin uploads delivery files for review.
6. **COMPLETED:** Student accepts the deliverable.

Throughout the workflow, students and admins can exchange messages via `CustomPaperMessage`, which supports file attachments.

## Contact Message Flow

```
Visitor                    Server                  AntiSpam      AutoReply     NotificationService
  |                          |                        |              |               |
  |-- POST /contact -------->|                        |              |               |
  |   {name, email, subject, |-- checkMessage() ----->|              |               |
  |    message, honeypot}    |<-- SpamCheckResult ----|              |               |
  |                          |                        |              |               |
  |  [If not spam]           |-- prisma.message       |              |               |
  |                          |   .create()            |              |               |
  |                          |                        |              |               |
  |                          |-- processAutoReply() --|------------->|               |
  |                          |                        |  send email  |               |
  |                          |                        |              |               |
  |                          |-- notifyNewMessage() --|--------------|-------------->|
  |                          |                        |              |  email admin  |
  |                          |                        |              |  webhook      |
  |                          |                        |              |  WebSocket    |
  |<-- {success: true} ------|                        |              |               |
```

### Anti-Spam Pipeline

The `AntiSpamService` performs multi-layer checks:

1. **IP Blacklist** -- Immediate block if IP is blacklisted (confidence 1.0).
2. **Rate Limiting** -- In-memory rate limiter per IP (default: 5 requests per 15 minutes, 1-hour block).
3. **Honeypot** -- Hidden form field; if filled, message is from a bot (confidence 0.9).
4. **Content Analysis** -- Checks for spam keywords, suspicious keywords, excessive links, repetitive content, all-caps ratio.
5. **Behavior Analysis** -- Suspicious user agent detection, generic name detection, disposable email detection.

Auto-blacklisting triggers after 5 suspicious activities from the same IP.

## Email Flow

The `EmailService` supports multiple providers via a strategy pattern:

| Provider | Status | Use Case |
|----------|--------|----------|
| `console` | Active (default) | Development -- logs emails to console |
| `sendgrid` | Stub | Production email delivery |
| `resend` | Stub | Alternative production provider |
| `nodemailer` | Stub | SMTP-based delivery |

Currently, all providers except `console` fall back to console logging with a TODO for full implementation.

### Email Types

- **Auto-reply emails** -- Sent to contact form submitters with keyword-matched templates
- **Collaborator notifications** -- Application received, stage changes, interview scheduling
- **Newsletter** -- Blog post notifications to subscribers, with unsubscribe links
- **Admin notifications** -- New messages, new collaborator applications
- **Reply notifications** -- When admin replies to a contact message

## Course Progress Tracking

```
Student                    Server                    PostgreSQL
  |                          |                          |
  |-- Watch lesson video --->|                          |
  |                          |                          |
  |-- POST /progress ------->|                          |
  |   {lessonId, watchTime,  |-- upsert CourseProgress->|
  |    completed}            |   (userId + lessonId)    |
  |                          |                          |
  |-- GET /enrollment ------>|                          |
  |   progress %             |-- Calculate from         |
  |                          |   completed lessons /    |
  |                          |   total lessons -------->|
  |<-- {progress: 75} -------|<-- enrollment data ------|
```

## File Upload Flow

Files are uploaded via multipart form data and stored on the local filesystem:

```
uploads/
  thumbnails/     # Paper, course, ebook thumbnails (images)
  videos/         # Course lesson videos
  materials/      # Paper files, ebook files
  blog-images/    # Blog post cover images
  collaborator-docs/  # Resumes, portfolios
  avatars/        # User profile images
  lesson-attachments/ # Course lesson PDFs, docs
```

Each uploaded file gets a UUID-based filename. The server serves files from the `/uploads/*` route with proper content-type headers.

**Upload limits:** 50MB per file, 5 files per request. Collaborator documents have a stricter 10MB limit and are restricted to PDF, DOC, DOCX, and TXT formats.

## Caching Strategy

Redis caching is used for read-heavy endpoints:

- **Cache key patterns:** Domain-specific keys (e.g., `papers:list:page:1`, `course:${id}`)
- **Default TTL:** 5 minutes (300 seconds)
- **Cache invalidation:** Pattern-based deletion on write operations (`deleteCachePattern`)
- **Graceful degradation:** All Redis operations are wrapped in try/catch. If Redis is unavailable, the application queries PostgreSQL directly.

## Newsletter Flow

```
Admin                      Server                    PostgreSQL         EmailService
  |                          |                          |                    |
  |-- Publish blog post ---->|                          |                    |
  |                          |-- Get subscribers ------>|                    |
  |                          |   (by category)         |                    |
  |                          |<-- subscriber list ------|                    |
  |                          |                          |                    |
  |                          |-- For each subscriber --|-------------------->|
  |                          |   sendPostNotification  |   send email       |
  |                          |   (100ms delay between) |   with template    |
  |                          |                          |                    |
  |                          |-- Create PostNotification|                    |
  |                          |   record --------------->|                    |
  |<-- {sent, failed} -------|                          |                    |
```

Subscribers are managed per-category via the `NewsletterSubscription` join table between `NewsletterSubscriber` and `Category`.
