// src/lib/gcp.ts
import { ImageAnnotatorClient } from "@google-cloud/vision";

let cached: ImageAnnotatorClient | null = null;

export function getVisionClient(): ImageAnnotatorClient {
  if (cached) return cached;

  // Prefer BASE64, then inline JSON
  const inlineBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  const inlineJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  let creds: any | null = null;

  if (inlineBase64) {
    try {
      const decoded = Buffer.from(inlineBase64, "base64").toString("utf8");
      creds = JSON.parse(decoded);
    } catch (e) {
      throw new Error(
        `GCP creds: failed to decode/parse GOOGLE_APPLICATION_CREDENTIALS_BASE64: ${String(
          (e as Error).message || e
        )}`
      );
    }
  } else if (inlineJson) {
    try {
      creds = JSON.parse(inlineJson);
    } catch (e) {
      throw new Error(
        `GCP creds: invalid GOOGLE_APPLICATION_CREDENTIALS_JSON: ${String(
          (e as Error).message || e
        )}`
      );
    }
  } else {
    // Be explicit—don’t silently fall back to ADC on App Runner
    throw new Error(
      "GCP creds: neither GOOGLE_APPLICATION_CREDENTIALS_BASE64 nor GOOGLE_APPLICATION_CREDENTIALS_JSON is set"
    );
  }

  if (!creds?.client_email || !creds?.private_key) {
    throw new Error("GCP creds: JSON missing client_email or private_key");
  }

  // Fix the common newline escaping from Secrets Manager
  const fixedKey = (creds.private_key as string).replace(/\\n/g, "\n");

  // Avoid accidental ADC path
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    delete (process.env as any).GOOGLE_APPLICATION_CREDENTIALS;
  }

  cached = new ImageAnnotatorClient({
    projectId: creds.project_id,
    credentials: {
      client_email: creds.client_email,
      private_key: fixedKey,
    },
  });

  return cached;
}
