import { createContext, useContext } from "react";

export const FontCatalogRoute = createContext({ pathname: "/landing", status: "unauthenticated" });
export const usePathname = () => useContext(FontCatalogRoute).pathname;
export const useSession = () => ({ status: useContext(FontCatalogRoute).status });
