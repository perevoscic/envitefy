const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const nextBin = require.resolve("next/dist/bin/next");
const standaloneDir = path.join(process.cwd(), ".next", "standalone");
const extraArgs = process.argv.slice(2);

function rmStandalone() {
  try {
    fs.rmSync(standaloneDir, { recursive: true, force: true });
  } catch {
    // ignore
  }
}

/** Brief pause so AV/indexers can release handles (Windows EBUSY on copyfile). */
function pauseSeconds(sec) {
  const s = Math.max(1, sec);
  try {
    if (process.platform === "win32") {
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

const maxAttempts = process.platform === "win32" ? 3 : 1;

for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  if (attempt > 1) {
    console.error(
      `[build] retry ${attempt}/${maxAttempts} after EBUSY-style failure (Windows)`
    );
    pauseSeconds(2);
  }
  rmStandalone();

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
