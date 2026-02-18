---
type: doc
name: glossary
description: Project terminology, type definitions, domain entities, and business rules
category: glossary
generated: 2026-02-02
status: filled
scaffoldVersion: "2.0.0"
---

# Glossary & Domain Concepts

## Domain Entities

### User

A registered user of the platform. Every user has one of three roles:

- **STUDENT** (default) -- Can browse, purchase, and access content.
- **ADMIN** -- Full administrative access.
- **COLLABORATOR** -- Limited portal access after application.

Key fields: `id`, `email`, `password` (argon2 hash), `name`, `role`, `verified`, profile fields (phone, address, city, state, etc.)

### Paper (Ready Paper)

A pre-written academic work available for purchase or free download.

Key fields: `title`, `description`, `paperType`, `academicArea`, `price` (in cents), `pageCount`, `authorName`, `fileUrl`, `thumbnailUrl`, `previewUrl`, `isFree`.

### Custom Paper

A student-requested academic work produced on demand. Follows a workflow from request to delivery.

Key fields: `title`, `description`, `paperType`, `academicArea`, `pageCount`, `deadline`, `urgency`, `requirements`, `quotedPrice`, `finalPrice`, `status`, `requirementFiles[]`, `deliveryFiles[]`.

Urgency levels:
- **NORMAL** -- 7+ days
- **URGENT** -- 3-6 days
- **VERY_URGENT** -- 1-2 days

### Course

An online course with structured content.

Key fields: `title`, `description`, `academicArea`, `instructorName`, `price` (cents), `duration` (minutes), `level` (BEGINNER/INTERMEDIATE/ADVANCED), `status` (ACTIVE/INACTIVE), `isFeatured`.

Courses contain **CourseModules**, which contain **CourseLessons**.

### CourseModule

An ordered section within a course. Contains: `title`, `description`, `order`, and a list of `CourseLesson` records.

### CourseLesson

An individual lesson within a module. Contains: `title`, `description`, `videoUrl`, `content` (text), `duration` (minutes), `order`, `attachments[]` (file URLs), `isEnabled`.

### CourseEnrollment

Tracks a student's enrollment in a course. Created after successful payment. Contains: `userId`, `courseId`, `progress` (percentage), `enrolledAt`, `completedAt`.

### CourseProgress

Tracks a student's progress on individual lessons. Contains: `userId`, `lessonId`, `completed`, `watchTime` (seconds), `completedAt`.

### Ebook

A downloadable ebook. Can have multiple files via `EbookFile`.

Key fields: `title`, `description`, `academicArea`, `authorName`, `price` (cents), `pageCount`, `fileUrl`, `coverUrl`.

### EbookFile

An individual file associated with an Ebook (supports multiple files per ebook). Contains: `ebookId`, `fileUrl`, `fileName`, `fileSize`.

### Order

A purchase transaction. Links a user to one or more items.

Key fields: `userId`, `totalAmount` (cents), `status`, `paymentMethod`, `paymentStatus`, `customerName`, `customerEmail`, `customerCpfCnpj`, `pixCode`, `boletoUrl`.

### OrderItem

An individual item within an order. Each item references exactly one of: `paperId`, `courseId`, or `ebookId`.

### Certificate

Generated when a student completes a course. Contains: `userId`, `courseId`, `certificateNumber` (unique), `grade`, `completionDate`, `qrCodeUrl`.

### Library

A student's personal library of purchased/acquired content. Contains: `userId`, `itemType` (PAPER/EBOOK/COURSE_MATERIAL), `itemId`, `downloadUrl`, `expiresAt`.

### BlogPost

A blog article. Contains: `title`, `content` (rich text), `slug`, `excerpt`, `coverImageUrl`, `status` (DRAFT/PUBLISHED/ARCHIVED), `authorId`, `categoryId`, SEO fields (metaTitle, metaDescription, metaKeywords, ogImage, canonicalUrl, readingTime), `views`.

### Category

A blog category. Contains: `name`, `slug`. Used for both blog post categorization and newsletter subscriptions.

### Tag

A blog tag. Connected to posts via the `BlogTag` join table.

### Comment

A comment on a blog post. Supports nested replies via self-referencing `parentId`. Must be approved by admin (`approved` field).

### CollaboratorApplication

An application to become a platform collaborator. Contains personal data, professional data, documents, and goes through a hiring pipeline.

**Application Stages:** RECEIVED -> SCREENING -> INTERVIEW -> TECHNICAL_TEST -> FINAL_REVIEW -> OFFER -> HIRED

**Application Statuses:** PENDING, INTERVIEWING, APPROVED, REJECTED

### Evaluation

An evaluator's assessment of a collaborator application. Scores: experienceScore, skillsScore, educationScore, culturalFitScore (each 0-10). Recommendations: STRONG_HIRE, HIRE, MAYBE, NO_HIRE, STRONG_NO_HIRE.

### Interview

A scheduled interview for a collaborator applicant. Types: PHONE_SCREENING, TECHNICAL, BEHAVIORAL, FINAL. Statuses: SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED, NO_SHOW. Results: PASS, FAIL, UNDECIDED.

### Message

A contact form submission. Contains: `name`, `email`, `phone`, `subject`, `message`, `status` (UNREAD/READ/ARCHIVED), `priority` (LOW/NORMAL/HIGH/URGENT), `replied`, `replyContent`.

### MessageTemplate

A reusable email template for auto-replies. Contains: `name`, `subject`, `content`, `variables[]`, `category`.

### NewsletterSubscriber

An email subscriber. Contains: `email`, `name`, `active`. Connected to categories via `NewsletterSubscription`.

### LegalDocument

A versioned legal document. Types: TERMS_OF_SERVICE, PRIVACY_POLICY, COOKIES_POLICY, LGPD_COMPLIANCE.

### ApiIntegration

Configuration for external API integrations (e.g., Asaas). Stores `apiKey`, `apiSecret`, `environment` (production/sandbox), and `metadata` (JSON).

### SystemSetting

Key-value store for system-wide configuration.

## Enums Reference

### PaperType
`ARTICLE`, `REVIEW`, `THESIS`, `DISSERTATION`, `PROJECT`, `ESSAY`, `SUMMARY`, `MONOGRAPHY`, `CASE_STUDY`, `OTHER`

### AcademicArea
`ADMINISTRATION`, `LAW`, `EDUCATION`, `ENGINEERING`, `PSYCHOLOGY`, `HEALTH`, `ACCOUNTING`, `ARTS`, `ECONOMICS`, `SOCIAL_SCIENCES`, `OTHER`, `EXACT_SCIENCES`, `BIOLOGICAL_SCIENCES`, `HEALTH_SCIENCES`, `APPLIED_SOCIAL_SCIENCES`, `HUMANITIES`, `LANGUAGES`, `AGRICULTURAL_SCIENCES`, `MULTIDISCIPLINARY`

### PaymentMethod
`PIX`, `BOLETO`, `CREDIT_CARD`, `DEBIT_CARD`

### PaymentStatus
`PENDING`, `PROCESSING`, `PAID`, `CONFIRMED`, `OVERDUE`, `REFUNDED`, `FAILED`, `CANCELED`

### OrderStatus
`PENDING`, `PROCESSING`, `COMPLETED`, `CANCELED`, `INTERESTED`

## Business Rules

### Pricing

- All prices are stored as **integers in cents** (BRL centavos). A price of `1990` means R$19.90.
- Free papers have `isFree: true` and `price: 0`.
- Free ebooks have `price: 0` and are accessible to all users.
- Custom paper pricing is done manually by admin via the `quotedPrice` field.
- Credit card payments support installments (up to 12x).

### Purchase Rules

- A user cannot purchase a course they are already enrolled in.
- A user cannot purchase an ebook or paper they have already bought (checked via completed Order with confirmed payment).
- Course enrollment is created automatically upon payment confirmation.
- Ebook/paper purchases are tracked via OrderItem records.

### Custom Paper Urgency Pricing

The urgency level affects the custom paper quote:
- NORMAL (7+ days) -- Standard pricing
- URGENT (3-6 days) -- Premium pricing
- VERY_URGENT (1-2 days) -- Highest pricing

### Content Access

- Paid content requires a completed order with confirmed payment status.
- Free papers are accessible to all authenticated users.
- Free ebooks (price 0) are always accessible.
- Library items for paid ebooks expire after 1 year.
- Course progress is tracked per-lesson with watch time in seconds.

### Blog

- Posts have three statuses: DRAFT, PUBLISHED, ARCHIVED.
- Comments require admin approval before being visible.
- Likes are unique per user per post.
- Post analytics track views, unique views, shares, average time on page, and bounce rate per day.
