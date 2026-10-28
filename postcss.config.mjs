import { fileURLToPath } from "node:url";

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Utilities come from shipped application code, not docs, tests or tooling.
      base: fileURLToPath(new URL("./src", import.meta.url)),
      // Next minifies after the production-only selector split. Keeping this
      // phase unminified makes every preserved utility exactly comparable.
      optimize: false,
    },
    ...(process.env.NODE_ENV === "production" ? { "./scripts/lib/runtime-utility-postcss.cjs": {} } : {}),
  },
};

export default config;
