import { randomUUID } from "node:crypto";
import { readFileSync, unlinkSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { ROOT } from "./maestro-core.mjs";

export async function acquireAndroidUiLock(serial, context) {
  if (!/^[a-zA-Z0-9_.:-]+$/.test(serial)) throw new Error("Invalid Android device serial.");
  const root = path.join(ROOT, "output/maestro");
  await mkdir(root, { recursive: true });
  const file = path.join(root, `android-ui-${serial.replaceAll(":", "_")}.lock`);
  const token = randomUUID();
  try {
    await writeFile(
      file,
      JSON.stringify({ pid: process.pid, token, context, startedAt: new Date().toISOString() }),
      { flag: "wx" },
    );
  } catch (error) {
    if (error.code !== "EEXIST") throw error;
    throw new Error(
      `Android UI is reserved by another run (${file}). Wait for it to finish. If interrupted, inspect its process and logs before removing the stale lock.`,
    );
  }
  const release = () => {
    try {
      if (JSON.parse(readFileSync(file, "utf8")).token === token) unlinkSync(file);
    } catch (error) {
      if (error.code !== "ENOENT")
        process.stderr.write(`Could not release Android UI lock: ${error.message}\n`);
    }
  };
  process.once("exit", release);
  return () => {
    process.off("exit", release);
    release();
  };
}
