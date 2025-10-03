-- AlterTable
ALTER TABLE "promo_codes" ADD COLUMN IF NOT EXISTS "created_by_user_id" UUID;

