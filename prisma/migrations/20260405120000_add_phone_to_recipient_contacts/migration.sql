-- Add missing phone column to recipient_contacts for address-book API compatibility
ALTER TABLE "recipient_contacts"
ADD COLUMN IF NOT EXISTS "phone" TEXT;
