import { headers } from "next/headers";
import styles from "@/generated/runtime-styles.json";

/** React hoists and waits for this stylesheet before committing the page. */
export default async function RuntimeStyles() {
  if (process.env.NODE_ENV !== "production") return null;
  const requestHeaders = await headers();
  const scope = requestHeaders.get("x-envitefy-style-scope") === "landing"
    ? "landing"
    : "application";
  return <link rel="stylesheet" href={styles[scope].href} precedence="envitefy-base" />;
}
