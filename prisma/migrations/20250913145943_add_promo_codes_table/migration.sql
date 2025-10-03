-- CreateTable
CREATE TABLE IF NOT EXISTS "promo_codes" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "code" VARCHAR(255) NOT NULL,
    "amount_cents" INTEGER NOT NULL,
    "currency" VARCHAR(3) NOT NULL DEFAULT 'USD',
    "created_by_email" VARCHAR(255),
    "recipient_name" VARCHAR(255),
    "recipient_email" VARCHAR(255),
    "message" TEXT,
    "quantity" INTEGER,
    "period" VARCHAR(32),
    "expires_at" TIMESTAMPTZ(6),
    "redeemed_at" TIMESTAMPTZ(6),
    "redeemed_by_email" VARCHAR(255),
    "stripe_payment_intent_id" VARCHAR(255),
    "stripe_checkout_session_id" VARCHAR(255),
    "stripe_charge_id" VARCHAR(255),
    "stripe_refund_id" VARCHAR(255),
    "revoked_at" TIMESTAMPTZ(6),
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "promo_codes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "promo_codes_code_key" ON "promo_codes"("code");

