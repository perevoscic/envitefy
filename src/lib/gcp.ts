import { ImageAnnotatorClient } from "@google-cloud/vision";

export function getVisionClient(): ImageAnnotatorClient {
  const inlineJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;
  const inlineBase64 = process.env.GOOGLE_APPLICATION_CREDENTIALS_BASE64;
  let creds: any | null = null;
  if (inlineJson) {
    try {
      creds = JSON.parse(inlineJson);
    } catch {
      // ignore JSON parse error; fall back to default ADC
    }
  } else if (inlineBase64) {
    try {
      const decoded = Buffer.from(inlineBase64, "base64").toString("utf8");
      creds = JSON.parse(decoded);
    } catch {
      // ignore base64/JSON parse error; fall back to default ADC
    }
  }
  if (creds?.client_email && creds?.private_key) {
    if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      delete (process.env as any).GOOGLE_APPLICATION_CREDENTIALS;
    }
    return new ImageAnnotatorClient({
      credentials: {
        client_email: creds.client_email,
        private_key: creds.private_key,
      },
      projectId: creds.project_id,
    });
  }
  return new ImageAnnotatorClient();
}
