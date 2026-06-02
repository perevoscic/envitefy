type RecaptchaVerificationPayload = {
  success?: boolean;
  score?: number;
  action?: string;
  hostname?: string;
  "error-codes"?: string[];
};

type VerifyRecaptchaOptions = {
  action?: string;
  logPrefix?: string;
  minimumScore?: number;
};

export type RecaptchaVerificationResult = {
  ok: boolean;
  skipped: boolean;
  error?: string;
  score?: number;
};

function isRecaptchaPayload(value: unknown): value is RecaptchaVerificationPayload {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export async function verifyRecaptchaToken(
  token: string,
  options: VerifyRecaptchaOptions = {},
): Promise<RecaptchaVerificationResult> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  const logPrefix = options.logPrefix || "recaptcha";
  const minimumScore = options.minimumScore ?? 0.5;

  if (!secretKey) {
    console.warn(`[${logPrefix}] RECAPTCHA_SECRET_KEY not configured, skipping verification`);
    return { ok: true, skipped: true };
  }

  if (!token) {
    return { ok: false, skipped: false, error: "missing-token" };
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });
    const data: unknown = await response.json();

    if (!isRecaptchaPayload(data)) {
      console.error(`[${logPrefix}] Invalid reCAPTCHA response`, data);
      return { ok: false, skipped: false, error: "invalid-response" };
    }

    if (!data.success) {
      console.error(`[${logPrefix}] reCAPTCHA verification failed`, {
        errorCodes: data["error-codes"],
        hostname: data.hostname,
      });
      return { ok: false, skipped: false, error: "verification-failed", score: data.score };
    }

    if (options.action && data.action && data.action !== options.action) {
      console.error(`[${logPrefix}] reCAPTCHA action mismatch`, {
        expected: options.action,
        received: data.action,
      });
      return { ok: false, skipped: false, error: "action-mismatch", score: data.score };
    }

    if (typeof data.score === "number" && data.score < minimumScore) {
      console.warn(`[${logPrefix}] reCAPTCHA score too low`, {
        score: data.score,
        minimumScore,
      });
      return { ok: false, skipped: false, error: "low-score", score: data.score };
    }

    return { ok: true, skipped: false, score: data.score };
  } catch (error: unknown) {
    console.error(`[${logPrefix}] reCAPTCHA verification error`, error);
    return { ok: false, skipped: false, error: "verification-error" };
  }
}
