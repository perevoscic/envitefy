import { lazy, Suspense, type ComponentType } from "react";

export default function dynamic(
  load: () => Promise<{ default: ComponentType<Record<string, unknown>> }>,
) {
  const Component = lazy(load);
  return function DynamicFixture(props: Record<string, unknown>) {
    return <Suspense fallback={null}><Component {...props} /></Suspense>;
  };
}
