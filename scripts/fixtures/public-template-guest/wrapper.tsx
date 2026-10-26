import type { ReactNode } from "react";
function FixtureWrapper({ children }: { children: ReactNode }) { return children; }
export { FixtureWrapper as EventCacheProvider, FixtureWrapper as MenuProvider };
export default FixtureWrapper;
