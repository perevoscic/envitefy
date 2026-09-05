import { timingSafeEqual } from "node:crypto";
import { StudioRequestError } from "./validation.ts";

export function requireStudioCron(
  request: Request,
  configuration: {
    cronSecret?: string;
    studioSecret?: string;
  } = {
    cronSecret: process.env.CRON_SECRET,
    studioSecret: process.env.ADMIN_MARKETING_STUDIO_CRON_SECRET,
  },
): void {
  const secrets = [configuration.cronSecret, configuration.studioSecret].filter(
    (value): value is string => Boolean(value?.trim()),
  );
  if (!secrets.length)
    throw new StudioRequestError("Content Studio reconciliation is not configured.", 503);
  const received = Buffer.from(request.headers.get("authorization") || "");
  const authorized = secrets.some((secret) => {
    const expected = Buffer.from(`Bearer ${secret}`);
    return received.length === expected.length && timingSafeEqual(received, expected);
  });
  if (!authorized) throw new StudioRequestError("Unauthorized.", 401);
}
