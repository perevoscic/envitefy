"use client";

import { UNIFIED_CREATION_ENABLED } from "@/lib/create/release";
import dynamic from "next/dynamic";
import UnifiedCreatePageClient from "./UnifiedCreatePageClient";
import type { InitialCreationAccess } from "@/lib/create/creation-access-client";

const LegacyCreatePageClient = dynamic(() => import("./LegacyCreatePageClient"));

export default function CreatePageClient({ initialCreationAccess }: { initialCreationAccess?: InitialCreationAccess }) {
  return UNIFIED_CREATION_ENABLED ? <UnifiedCreatePageClient initialCreationAccess={initialCreationAccess} /> : <LegacyCreatePageClient />;
}
