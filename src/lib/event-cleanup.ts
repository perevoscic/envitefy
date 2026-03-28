import { del } from "@vercel/blob";

import {
  deleteEventHistoryById,
  getEventHistoryById,
  getEventHistoryInputBlob,
  query,
  type EventHistoryRow,
} from "@/lib/db";
import { collectAppOwnedBlobUrls } from "@/lib/event-media";

export type EventCleanupResult = {
  deleted: boolean;
  blobRefs: string[];
  blobDeleteFailures: string[];
  discoveryBlobRefs: string[];
  registryItemsDeleted: number;
  registryClaimsDeleted: number;
};

async function deleteRegistryArtifactsForEvent(eventId: string): Promise<{
  registryItemsDeleted: number;
  registryClaimsDeleted: number;
}> {
  if (!eventId) {
    return { registryItemsDeleted: 0, registryClaimsDeleted: 0 };
  }

  const claimDelete = await query(
    `delete from registry_claims
     where item_id in (
       select id
       from registry_items
       where event_id = $1
     )`,
    [eventId],
  ).catch((error) => {
    if ((error as any)?.code === "42P01") {
      return { rowCount: 0 } as { rowCount: number };
    }
    throw error;
  });

  const itemDelete = await query(`delete from registry_items where event_id = $1`, [eventId]).catch(
    (error) => {
      if ((error as any)?.code === "42P01") {
        return { rowCount: 0 } as { rowCount: number };
      }
      throw error;
    },
  );

  return {
    registryItemsDeleted: itemDelete.rowCount || 0,
    registryClaimsDeleted: claimDelete.rowCount || 0,
  };
}

async function bestEffortDeleteBlobRefs(refs: string[]): Promise<string[]> {
  if (!refs.length) return [];
  try {
    await del(refs);
    return [];
  } catch (error) {
    console.error("[event-cleanup] blob delete failed", {
      refs,
      message: error instanceof Error ? error.message : String(error),
    });
    return refs;
  }
}

export async function deleteEventHistoryWithCleanup(params: {
  id: string;
  row?: EventHistoryRow | null;
}): Promise<EventCleanupResult> {
  const row = params.row ?? (await getEventHistoryById(params.id));
  if (!row) {
    return {
      deleted: false,
      blobRefs: [],
      blobDeleteFailures: [],
      discoveryBlobRefs: [],
      registryItemsDeleted: 0,
      registryClaimsDeleted: 0,
    };
  }

  const blobRefs = collectAppOwnedBlobUrls(row.data);
  const discoveryRow = await getEventHistoryInputBlob(row.id).catch(() => null);
  const discoveryBlobRefs = [discoveryRow?.storage_url, discoveryRow?.storage_pathname]
    .filter((value): value is string => typeof value === "string" && value.trim().length > 0);
  const registryDelete = await deleteRegistryArtifactsForEvent(row.id);

  await deleteEventHistoryById(row.id);

  const blobDeleteFailures = await bestEffortDeleteBlobRefs(
    Array.from(new Set([...blobRefs, ...discoveryBlobRefs])),
  );

  return {
    deleted: true,
    blobRefs,
    blobDeleteFailures,
    discoveryBlobRefs,
    registryItemsDeleted: registryDelete.registryItemsDeleted,
    registryClaimsDeleted: registryDelete.registryClaimsDeleted,
  };
}
