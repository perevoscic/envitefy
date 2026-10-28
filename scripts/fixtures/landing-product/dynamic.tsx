import { type ComponentType, useEffect, useState } from "react";

// Keep real dialog components and their prop flow, without Next's app runtime.
export default function dynamic(loader: () => Promise<{ default: ComponentType<any> }>) {
  return function DynamicFixture(props: any) {
    const [Component, setComponent] = useState<ComponentType<any> | null>(null);
    useEffect(() => {
      let mounted = true;
      loader().then((module) => {
        const loads = (window as any).__landingProductDynamicLoads ?? [];
        (window as any).__landingProductDynamicLoads = loads;
        loads.push(module.default.name);
        if (mounted) setComponent(() => module.default);
      });
      return () => {
        mounted = false;
      };
    }, []);
    return Component ? <Component {...props} /> : null;
  };
}
