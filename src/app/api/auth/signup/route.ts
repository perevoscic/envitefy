import { NextResponse } from "next/server";
import { createUserWithEmailPassword } from "@/lib/db";

function getSignupSourceFromCookieHeader(cookieHeader: string | null): "snap" | "gymnastics" | null {
  if (!cookieHeader) return null;
  const pairs = cookieHeader.split(";");
  for (const pair of pairs) {
    const [rawKey, ...rawValue] = pair.trim().split("=");
    if (rawKey !== "envitefy_signup_source") continue;
    const value = rawValue.join("=");
    return value === "snap" || value === "gymnastics" ? value : null;
  }
  return null;
}

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
    const requestedSignupSource =
      body.signupSource === "snap" || body.signupSource === "gymnastics"
        ? body.signupSource
        : null;
    const cookieSignupSource = getSignupSourceFromCookieHeader(
      req.headers.get("cookie"),
    );

    console.log("[signup] Request received", { 
      email, 
      hasToken: !!recaptchaToken,
      tokenLength: recaptchaToken?.length || 0,
      hasSecretKey: !!process.env.RECAPTCHA_SECRET_KEY,
      requestedSignupSource,
      cookieSignupSource,
    });

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    if (!cookieSignupSource) {
      return NextResponse.json(
        { error: "Create accounts only from /snap or /gymnastics." },
        { status: 400 },
      );
    }

    if (requestedSignupSource && requestedSignupSource !== cookieSignupSource) {
      return NextResponse.json(
        { error: "Signup source mismatch. Restart from /snap or /gymnastics." },
        { status: 400 },
      );
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

    await createUserWithEmailPassword({
      email,
      password,
      firstName,
      lastName,
      signupSource: cookieSignupSource,
    });
    const response = NextResponse.json({ ok: true });
    response.cookies.set("envitefy_signup_source", "", {
      expires: new Date(0),
      httpOnly: true,
      path: "/",
      sameSite: "lax",
    });
    return response;
  } catch (err: any) {
    const message = typeof err?.message === "string" ? err.message : "Failed to create account";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}


