"use client";

import { UNIFIED_CREATION_ENABLED } from "@/lib/create/release";
import LegacyCreatePageClient from "./LegacyCreatePageClient";
import UnifiedCreatePageClient from "./UnifiedCreatePageClient";

export default function CreatePageClient() {
  return UNIFIED_CREATION_ENABLED ? <UnifiedCreatePageClient /> : <LegacyCreatePageClient />;
}
