"use client";

import { UNIFIED_CREATION_ENABLED } from "@/lib/create/release";
import LegacyCreatePageClient from "./LegacyCreatePageClient";
import UnifiedCreatePageClient from "./UnifiedCreatePageClient";
import type { InitialCreationAccess } from "@/lib/create/creation-access-client";

export default function CreatePageClient({ initialCreationAccess }: { initialCreationAccess?: InitialCreationAccess }) {
  return UNIFIED_CREATION_ENABLED ? <UnifiedCreatePageClient initialCreationAccess={initialCreationAccess} /> : <LegacyCreatePageClient />;
}
