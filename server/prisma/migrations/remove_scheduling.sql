-- Migration: Remove blog post scheduling feature
-- This migration removes the SCHEDULED status and scheduledAt field from BlogPost

-- Step 1: Update any posts with SCHEDULED status to DRAFT
UPDATE "BlogPost"
SET status = 'DRAFT'::"PostStatus"
WHERE status = 'SCHEDULED'::"PostStatus";

-- Step 2: Remove the column scheduledAt
ALTER TABLE "BlogPost" DROP COLUMN "scheduledAt";

-- Step 3: Remove the default value temporarily
ALTER TABLE "BlogPost" ALTER COLUMN status DROP DEFAULT;

-- Step 4: Create a new enum without SCHEDULED
CREATE TYPE "PostStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- Step 5: Alter the column to use the new enum type
ALTER TABLE "BlogPost"
  ALTER COLUMN status TYPE "PostStatus_new"
  USING (status::text::"PostStatus_new");

-- Step 6: Drop the old enum type
DROP TYPE "PostStatus";

-- Step 7: Rename the new enum type to the original name
ALTER TYPE "PostStatus_new" RENAME TO "PostStatus";

-- Step 8: Re-add the default value
ALTER TABLE "BlogPost" ALTER COLUMN status SET DEFAULT 'DRAFT'::"PostStatus";
