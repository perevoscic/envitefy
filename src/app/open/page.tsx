"use client";
import { useEffect } from "react";

export default function Open() {
  useEffect(() => {
    try {
      const sp = new URLSearchParams(window.location.search);
      const url = sp.get("url");
      if (url) {
        window.open(url, "_blank");
      }
    } catch {}
    // Always return home after attempting to open
    window.location.replace("/");
  }, []);
  return null;
}
