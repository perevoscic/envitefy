import { runCreateBrowserTests } from "./lib/create-browser-suite.mjs";

try {
  process.exitCode = runCreateBrowserTests();
} catch (error) {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
