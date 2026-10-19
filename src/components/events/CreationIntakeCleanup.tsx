"use client";
import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { clearCreationIntakes, creationIntakeOwner, resumeCreationIntakeWrites, suspendCreationIntakeWrites } from "@/lib/create/creation-intake";

/** Source documents stay scoped to the signed-in account and are removed on sign-out. */
export default function CreationIntakeCleanup() {
  const { data: session, status } = useSession();
  const previous = useRef<string | null>(null);
  const owner = creationIntakeOwner(session?.user);
  useEffect(() => {
    if (status === "loading") return;
    if (!owner) { suspendCreationIntakeWrites(); void clearCreationIntakes().catch(() => {}); }
    else if (previous.current !== owner) {
      if (previous.current) void clearCreationIntakes(previous.current).catch(() => {});
      resumeCreationIntakeWrites(owner);
    }
    previous.current = owner;
  }, [owner, status]);
  return null;
}
