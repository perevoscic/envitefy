"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import { getThemeColorForPath, setThemeColor } from "@/lib/theme-color";

export default function ThemeColorSync() {
  const pathname = usePathname();

  useEffect(() => {
    setThemeColor(getThemeColorForPath(pathname));
  }, [pathname]);

  return null;
}
