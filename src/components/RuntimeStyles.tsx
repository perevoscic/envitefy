import { headers } from "next/headers";

/** React hoists and waits for this stylesheet before committing the page. */
export default async function RuntimeStyles() {
  if (process.env.NODE_ENV === "production") {
    // Exclude the manifest from the development dependency/watch graph.
    const styles: typeof import("@/generated/runtime-styles.json") = require("@/generated/runtime-styles.json");
    const requestHeaders = await headers();
    const scope = requestHeaders.get("x-envitefy-style-scope") === "landing"
      ? "landing"
      : "application";
    return <link rel="stylesheet" href={styles[scope].href} precedence="envitefy-base" />;
  }
  return null;
}
