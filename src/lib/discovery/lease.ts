import { tryAcquireEventDiscoveryLease, updateEventDiscovery } from "@/lib/db";
import { createLeaseOwnerId, getDiscoveryLeaseMs } from "@/lib/discovery/shared";
import type { EventDiscoveryRow } from "@/lib/discovery/types";

export async function acquireDiscoveryLease(discovery: EventDiscoveryRow) {
  const leaseOwnerId = createLeaseOwnerId();
  const acquiredAt = new Date();
  const expiresAt = new Date(acquiredAt.getTime() + getDiscoveryLeaseMs());
  const nextPipeline = {
    ...discovery.pipeline,
    lease: {
      ownerId: leaseOwnerId,
      acquiredAt: acquiredAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
    },
  };
  const leased = await tryAcquireEventDiscoveryLease({
    eventId: discovery.eventId,
    leaseOwnerId,
    leaseExpiresAt: expiresAt.toISOString(),
    nextPipeline,
  });
  return leased
    ? {
        discovery: leased,
        leaseOwnerId,
      }
    : null;
}

export async function releaseDiscoveryLease(discovery: EventDiscoveryRow) {
  return updateEventDiscovery({
    eventId: discovery.eventId,
    pipeline: {
      ...discovery.pipeline,
      lease: null,
    },
  });
}
