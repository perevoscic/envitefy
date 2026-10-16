import { mkdir, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import { ARTIFACT_ROOT, maestroCommand, runProcess } from "./lib/maestro-core.mjs";

const dir = path.join(ARTIFACT_ROOT, "doctor");
await mkdir(dir, { recursive: true });
const command = await maestroCommand();
const version = await runProcess(command.binary, ["--version"], {
  env: command.env,
  timeoutMs: 30000,
});
if (version.exitCode !== 0) throw new Error(`Maestro CLI could not start: ${version.output}`);
console.log(`Maestro ${version.output.trim()}`);
const server = createServer((_req, res) => {
  res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
  res.end(
    '<!doctype html><html lang="en"><title>Maestro doctor</title><body><h1>Maestro browser check</h1><label for="doctor-name">Your name</label><input id="doctor-name" placeholder="Your name"><button onclick="document.getElementById(\'result\').textContent=\'Browser automation works\'">Verify browser</button><p id="result"></p></body></html>',
  );
});
await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
const flow = path.join(dir, "doctor.yaml");
await writeFile(
  flow,
  `url: http://127.0.0.1:${server.address().port}\n---\n- launchApp:\n    clearState: true\n- assertVisible: "Maestro browser check"\n- tapOn: "Verify browser"\n- assertVisible: "Browser automation works"\n- takeScreenshot: doctor-passed\n`,
);
try {
  const result = await runProcess(
    command.binary,
    [
      "test",
      "--headless",
      "--no-ansi",
      "--format",
      "JUNIT",
      "--output",
      path.join(dir, "junit.xml"),
      "--test-output-dir",
      dir,
      "--debug-output",
      dir,
      flow,
    ],
    { env: command.env, timeoutMs: 240000 },
  );
  await writeFile(path.join(dir, "console.log"), result.output);
  console.log(result.output);
  if (result.timedOut)
    throw new Error(
      "Maestro browser doctor exceeded 240 seconds. Browser support remains unverified; see console.log.",
    );
  process.exitCode = result.exitCode === 0 ? 0 : 1;
} finally {
  server.closeAllConnections();
  await new Promise((resolve) => server.close(resolve));
}
