import { NextResponse } from "next/server";
import { createUserWithEmailPassword } from "@/lib/db";

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secretKey = process.env.RECAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn("[signup] RECAPTCHA_SECRET_KEY not configured, skipping verification");
    return true; // Skip verification if not configured
  }

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await response.json();
    
    console.log("[signup] reCAPTCHA Google API response:", JSON.stringify(data, null, 2));
    
    if (!data.success) {
      console.error("[signup] reCAPTCHA verification failed:", {
        success: data.success,
        errorCodes: data['error-codes'],
        hostname: data.hostname,
        fullResponse: data
      });
      return false;
    }

    // Check score for v3 (should be > 0.5 for legitimate users)
    if (data.score !== undefined && data.score < 0.5) {
      console.warn("[signup] reCAPTCHA score too low:", data.score);
      return false;
    }

    console.log("[signup] reCAPTCHA verified successfully", { 
      score: data.score, 
      action: data.action 
    });
    return true;
  } catch (err) {
    console.error("[signup] reCAPTCHA verification error:", err);
    return false;
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = (body.email as string) || "";
    const password = (body.password as string) || "";
    const firstName = (body.firstName as string) || undefined;
    const lastName = (body.lastName as string) || undefined;
    const recaptchaToken = (body.recaptchaToken as string) || "";

    console.log("[signup] Request received", { 
      email, 
      hasToken: !!recaptchaToken,
      tokenLength: recaptchaToken?.length || 0,
      hasSecretKey: !!process.env.RECAPTCHA_SECRET_KEY
    });

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    // Verify reCAPTCHA if token provided and secret key is configured
    if (recaptchaToken && process.env.RECAPTCHA_SECRET_KEY) {
      console.log("[signup] Verifying reCAPTCHA...");
      const isValid = await verifyRecaptcha(recaptchaToken);
      if (!isValid) {
        console.log("[signup] reCAPTCHA verification FAILED");
        return NextResponse.json(
          { error: "Security verification failed. Please try again." },
          { status: 400 }
        );
      }
      console.log("[signup] reCAPTCHA verification PASSED");
    } else {
      console.log("[signup] Skipping reCAPTCHA verification", {
        reason: !recaptchaToken ? "no token" : "no secret key"
      });
    }

    await createUserWithEmailPassword({ email, password, firstName, lastName });
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


