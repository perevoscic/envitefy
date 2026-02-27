const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

const lockPath = path.join(process.cwd(), ".next-dev.lock");
const nextBin = require.resolve("next/dist/bin/next");
const nextArgs = [nextBin, "dev", ...process.argv.slice(2)];

function isProcessRunning(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function cleanupLock() {
  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch {
    // best effort
  }
}

if (fs.existsSync(lockPath)) {
  const raw = fs.readFileSync(lockPath, "utf8").trim();
  const existingPid = Number.parseInt(raw, 10);
  if (isProcessRunning(existingPid)) {
    console.error(
      `[dev] Another envitefy dev server is already running (pid ${existingPid}). Stop it before starting a new one.`
    );
    process.exit(1);
  }
  cleanupLock();
}

fs.writeFileSync(lockPath, String(process.pid), "utf8");

const child = spawn(process.execPath, nextArgs, {
  cwd: process.cwd(),
  stdio: "inherit",
  shell: false,
  env: process.env,
});

const handleSignal = (signal) => {
  try {
    child.kill(signal);
  } catch {
    // ignore
  }
};

process.on("SIGINT", () => handleSignal("SIGINT"));
process.on("SIGTERM", () => handleSignal("SIGTERM"));

child.on("exit", (code, signal) => {
  cleanupLock();
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
