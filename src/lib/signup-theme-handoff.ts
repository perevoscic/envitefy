import type { SignupForm } from "@/types/signup";

// A client-side transition, never a draft save. Reloading discards unused previews.
const previews = new Map<string, { form: SignupForm; expires: number }>();
const lifetime = 10 * 60 * 1000;

export function stageSignupTheme(form: SignupForm): string {
  const now = Date.now();
  for (const [key, value] of previews) {
    if (value.expires <= now) previews.delete(key);
  }
  while (previews.size >= 3) previews.delete(previews.keys().next().value!);
  const token = crypto.randomUUID();
  previews.set(token, { form: structuredClone(form), expires: now + lifetime });
  return token;
}

export function takeSignupTheme(token: string): SignupForm | null {
  const preview = previews.get(token);
  previews.delete(token);
  return preview && preview.expires > Date.now() ? preview.form : null;
}
