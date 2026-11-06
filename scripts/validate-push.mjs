import { validatePush, validationInterrupts } from "./lib/push-validation.mjs";

const interrupts = validationInterrupts();
try {
  await validatePush({ force: true, signal: interrupts.signal });
} catch (error) {
  console.error(`Push validation failed: ${error.message}`);
  process.exitCode = 1;
} finally { interrupts.dispose(); }
