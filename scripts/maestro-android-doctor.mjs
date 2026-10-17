import { readFile } from "node:fs/promises";
import { parseEnv } from "node:util";
import { ANDROID_APP_ID, inspectAndroid } from "./lib/maestro-android.mjs";

let file = {};
try {
  file = parseEnv(await readFile(".env.maestro.local", "utf8"));
} catch (error) {
  if (error.code !== "ENOENT") throw error;
}
try {
  const info = await inspectAndroid({
    androidAppId:
      process.env.MAESTRO_ANDROID_APP_ID || file.MAESTRO_ANDROID_APP_ID || ANDROID_APP_ID,
    androidSerial: process.env.MAESTRO_ANDROID_SERIAL || file.MAESTRO_ANDROID_SERIAL || "",
  });
  console.log(JSON.stringify(info, null, 2));
  console.log(
    "Android preflight passed. No app login, installation, launch or test-data mutation was performed.",
  );
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
