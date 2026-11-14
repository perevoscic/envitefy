/** Fields consumed by renderers; the production build generates the JSON asset. */
export type RuntimeStyleManifest = Record<"application" | "landing", { href: string }>;
