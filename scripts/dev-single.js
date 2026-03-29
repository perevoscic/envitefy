const fs = require("node:fs");
const net = require("node:net");
const path = require("node:path");
const { spawn } = require("node:child_process");

const nextBin = require.resolve("next/dist/bin/next");
const cliArgs = process.argv.slice(2);
const nextArgs = [nextBin, "dev", ...cliArgs];
const hasExplicitPortArg = cliArgs.some((arg, index, args) => {
  if (arg === "-p" || arg === "--port") return true;
  if (arg.startsWith("--port=")) return true;
  return arg.startsWith("-p") && arg.length > 2 && args[index - 1] !== "--";
});
const explicitPortArg = (() => {
  for (let index = 0; index < cliArgs.length; index += 1) {
    const arg = cliArgs[index];
    if ((arg === "-p" || arg === "--port") && cliArgs[index + 1]) {
      return cliArgs[index + 1];
    }
    if (arg.startsWith("--port=")) {
      return arg.slice("--port=".length);
    }
    if (arg.startsWith("-p") && arg.length > 2 && cliArgs[index - 1] !== "--") {
      return arg.slice(2);
    }
  }
  return "";
})();

if (explicitPortArg) {
  process.env.PORT = explicitPortArg;
} else if (!process.env.PORT && !hasExplicitPortArg) {
  process.env.PORT = "3000";
}

const devPort = String(process.env.PORT || "3000");
const lockPath = path.join(
  process.cwd(),
  devPort === "3000" ? ".next-dev.lock" : `.next-dev-${devPort}.lock`
);

function isProcessRunning(pid) {
  if (!Number.isFinite(pid) || pid <= 0) return false;
  try {
    process.kill(pid, 0);
    return true;
  } catch {
    return false;
  }
}

function isPortInUse(port) {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();

    probe.once("error", (error) => {
      if (error && error.code === "EADDRINUSE") {
        resolve(true);
        return;
      }
      reject(error);
    });

    probe.once("listening", () => {
      probe.close((closeError) => {
        if (closeError) {
          reject(closeError);
          return;
        }
        resolve(false);
      });
    });

    probe.listen(Number(port));
  });
}

function cleanupLock() {
  try {
    if (fs.existsSync(lockPath)) fs.unlinkSync(lockPath);
  } catch {
    // best effort
  }
}

async function main() {
  if (fs.existsSync(lockPath)) {
    const raw = fs.readFileSync(lockPath, "utf8").trim();
    const existingPid = Number.parseInt(raw, 10);
    if (isProcessRunning(existingPid)) {
      console.error(
        `[dev] Another envitefy dev server is already running on port ${devPort} (pid ${existingPid}). Stop it before starting a new one.`
      );
      process.exit(1);
    }
    cleanupLock();
  }

  const portBusy = await isPortInUse(devPort);
  if (portBusy) {
    console.error(
      `[dev] Port ${devPort} is already in use. Stop the existing process or choose a different port before starting Envitefy dev.`
    );
    process.exit(1);
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
}

main().catch((error) => {
  cleanupLock();
  console.error("[dev] Failed to start envitefy dev server", error);
  process.exit(1);
});
