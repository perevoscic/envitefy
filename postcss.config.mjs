import { fileURLToPath } from "node:url";

const config = {
  plugins: {
    "@tailwindcss/postcss": {
      // Utilities come from shipped application code, not docs, tests or tooling.
      base: fileURLToPath(new URL("./src", import.meta.url)),
    },
  },
};

export default config;
