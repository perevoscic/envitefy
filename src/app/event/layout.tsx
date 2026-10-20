import { Suspense, type ReactNode } from "react";
import EventCreationRouteBoundary from "@/components/event-create/EventCreationRouteBoundary";
export default function EventLayout({ children }: { children: ReactNode }) {
  return <Suspense fallback={null}><EventCreationRouteBoundary>{children}</EventCreationRouteBoundary></Suspense>;
}
