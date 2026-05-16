-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "offer_code" TEXT;
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "offer_code_id" TEXT;
