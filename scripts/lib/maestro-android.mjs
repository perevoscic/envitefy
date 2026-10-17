import path from "node:path";
import { runProcess } from "./maestro-core.mjs";

export const ANDROID_APP_ID = "com.envitefy.app";

export function selectAndroidDevice(output, requested = "") {
  const devices = output
    .split(/\r?\n/)
    .map((line) => line.match(/^([^\s]+)\s+(device|unauthorized|offline)(?:\s|$)/))
    .filter(Boolean);
  if (requested) {
    const device = devices.find((item) => item[1] === requested);
    if (!device) throw new Error("The configured Android serial is not connected.");
    if (device[2] !== "device")
      throw new Error(
        `The configured Android device is ${device[2]}. Authorize USB debugging on the phone.`,
      );
    return device[1];
  }
  const ready = devices.filter((item) => item[2] === "device");
  if (!ready.length)
    throw new Error(
      "No authorized Android device is connected. Connect a test phone with USB debugging enabled and Envitefy installed from Google Play.",
    );
  if (ready.length !== 1)
    throw new Error(
      "Multiple Android devices are connected. Set MAESTRO_ANDROID_SERIAL to the intended test device.",
    );
  return ready[0][1];
}

export async function inspectAndroid(environment, run = runProcess) {
  if (environment.androidAppId !== ANDROID_APP_ID)
    throw new Error(`This test targets only ${ANDROID_APP_ID}.`);
  const adb =
    process.env.MAESTRO_ADB_BIN ||
    (process.platform === "win32"
      ? path.join(
          process.env.ANDROID_HOME ||
            path.join(process.env.USERPROFILE || "", "AppData/Local/Android/Sdk"),
          "platform-tools/adb.exe",
        )
      : "adb");
  const exec = async (args) => {
    const result = await run(adb, args, { timeoutMs: 30000 });
    if (result.exitCode !== 0)
      throw new Error(
        `Android preflight could not complete adb ${args.includes("devices") ? "devices" : "device inspection"}: ${result.output}`,
      );
    return result.output;
  };
  const serial = selectAndroidDevice(await exec(["devices", "-l"]), environment.androidSerial);
  const device = (...args) => exec(["-s", serial, "shell", ...args]);
  const installed = await device("pm", "list", "packages", "-i", ANDROID_APP_ID);
  if (!installed.split(/\r?\n/).some((line) => line.startsWith(`package:${ANDROID_APP_ID} `)))
    throw new Error(
      `${ANDROID_APP_ID} is not installed on the selected device. Install it through the supplied Google Play testing link.`,
    );
  if (!/installer=com\.android\.vending(?:\s|$)/.test(installed))
    throw new Error(
      "The installed Envitefy package is not identified as Google Play installed. A sideloaded APK does not verify the requested Play build.",
    );
  const dump = await device("dumpsys", "package", ANDROID_APP_ID);
  const sdk = Number((await device("getprop", "ro.build.version.sdk")).trim());
  let verifiedLinks = "not checked on Android versions before API 31";
  if (sdk >= 31) {
    const links = await device("pm", "get-app-links", ANDROID_APP_ID);
    if (!/envitefy\.com:\s*verified\b/.test(links))
      throw new Error(
        "The Play-installed app's envitefy.com app link is not verified on this device. Verify supported links before running deep-link flows; no automatic approval was applied.",
      );
    verifiedLinks = "envitefy.com verified";
  }
  return {
    serial,
    appId: ANDROID_APP_ID,
    installer: "com.android.vending",
    sdk,
    versionCode: dump.match(/versionCode=(\d+)/)?.[1] || "unknown",
    versionName: dump.match(/versionName=([^\r\n]+)/)?.[1]?.trim() || "unknown",
    verifiedLinks,
  };
}
