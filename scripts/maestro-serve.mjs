import { mkdir } from "node:fs/promises";
import path from "node:path";
import { ARTIFACT_ROOT } from "./lib/maestro-core.mjs";
import { startEnvironment } from "./lib/maestro-environment.mjs";

const runDir = path.join(ARTIFACT_ROOT, `development-${Date.now()}`);
await mkdir(runDir, { recursive: true });
const environment = await startEnvironment(runDir);
console.log(`Maestro Envitefy ready: ${environment.baseUrl}\nRun directory: ${runDir}`);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, async () => {
    await environment.shutdown();
    process.exit(0);
  });
