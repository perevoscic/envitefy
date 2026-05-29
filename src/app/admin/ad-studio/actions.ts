"use server";

import {
  generateAdminAdStudioConfig,
  generateAdminAdStudioImages,
  parseAdminAdStudioGenerateRequest,
  parseAdminAdStudioImagesRequest,
} from "@/lib/admin/ad-studio";
import { requireAdminSession } from "@/lib/admin/require-admin";

export async function generateAdHubCampaignAction(input: unknown) {
  await requireAdminSession();
  const parsed = parseAdminAdStudioGenerateRequest(input);
  if (!parsed.ok) throw new Error(parsed.error);
  return generateAdminAdStudioConfig(parsed.value);
}

export async function generateAdHubFramesAction(input: unknown) {
  await requireAdminSession();
  const parsed = parseAdminAdStudioImagesRequest(input);
  if (!parsed.ok) throw new Error(parsed.error);
  return generateAdminAdStudioImages(parsed.value);
}
