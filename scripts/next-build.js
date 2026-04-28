const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const nextBin = require.resolve("next/dist/bin/next");
const standaloneDir = path.join(process.cwd(), ".next", "standalone");
const extraArgs = process.argv.slice(2);
const isWindows = process.platform === "win32";

function isBusyError(err) {
  return (
    err &&
    typeof err === "object" &&
    ["EBUSY", "EPERM", "ENOTEMPTY"].includes(String(err.code || ""))
  );
}

/** Brief pause so AV/indexers can release handles (Windows EBUSY on copyfile). */
function pauseSeconds(sec) {
  const s = Math.max(1, sec);
  try {
    if (isWindows) {
      spawnSync("cmd", ["/c", `timeout /t ${s} /nobreak >nul`], {
        stdio: "ignore",
        shell: false,
      });
    } else {
      spawnSync("sleep", [String(s)], { stdio: "ignore", shell: false });
    }
  } catch {
    // ignore
  }
}

function rmStandalone() {
  const maxRemoveAttempts = isWindows ? 5 : 1;
  for (let attempt = 1; attempt <= maxRemoveAttempts; attempt++) {
    try {
      fs.rmSync(standaloneDir, { recursive: true, force: true });
      return true;
    } catch (err) {
      if (!isWindows || !isBusyError(err) || attempt === maxRemoveAttempts) {
        console.error(
          `[build] unable to remove ${path.relative(process.cwd(), standaloneDir)}`,
          err
        );
        return false;
      }
      console.error(
        `[build] waiting for .next/standalone to unlock (${attempt}/${maxRemoveAttempts})`
      );
      pauseSeconds(attempt * 2);
    }
  }
  return false;
}

function retryDelaySeconds(attempt) {
  return Math.min(20, attempt * attempt * 2);
}

const maxAttempts = isWindows ? 5 : 1;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  if (attempt > 1) {
    const delay = retryDelaySeconds(attempt - 1);
    console.error(
      `[build] retry ${attempt}/${maxAttempts} after Windows file-lock style failure; waiting ${delay}s`
    );
    pauseSeconds(delay);
  }
  if (!rmStandalone()) {
    if (attempt === maxAttempts) break;
    pauseSeconds(retryDelaySeconds(attempt));
    continue;
  }

  const r = spawnSync(process.execPath, [nextBin, "build", ...extraArgs], {
    cwd: process.cwd(),
    stdio: "inherit",
    env: process.env,
    shell: false,
  });

  if (r.status === 0) {
    process.exit(0);
  }
}

process.exit(1);
