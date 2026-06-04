#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { homedir } from "node:os";
import path from "node:path";

const DEFAULT_PROVIDER_ID = "codex-app-server";
const EXTENSION_DIR_PATTERN = /^airizom\.chat-to-cli-(\d+)\.(\d+)\.(\d+)$/;
const BRIDGE_FILE_NAME = "linter-bridge.json";

function fail(message) {
  console.error(message);
  process.exit(1);
}

function compareVersionsDesc(left, right) {
  for (let index = 0; index < 3; index += 1) {
    if (left.version[index] !== right.version[index]) {
      return right.version[index] - left.version[index];
    }
  }
  return right.mtimeMs - left.mtimeMs;
}

function findChatToCliLintScript() {
  const home = homedir();
  const roots = [
    path.join(home, ".cursor", "extensions"),
    path.join(home, ".vscode", "extensions"),
  ];
  const candidates = [];

  for (const root of roots) {
    if (!existsSync(root)) {
      continue;
    }

    for (const entry of readdirSync(root, { withFileTypes: true })) {
      if (!entry.isDirectory()) {
        continue;
      }
      const match = entry.name.match(EXTENSION_DIR_PATTERN);
      if (!match) {
        continue;
      }

      const extensionPath = path.join(root, entry.name);
      const lintScript = path.join(extensionPath, "scripts", "vscode-lint.js");
      if (!existsSync(lintScript)) {
        continue;
      }

      candidates.push({
        lintScript,
        mtimeMs: statSync(extensionPath).mtimeMs,
        version: match.slice(1).map((part) => Number.parseInt(part, 10)),
      });
    }
  }

  candidates.sort(compareVersionsDesc);
  return candidates[0]?.lintScript;
}

function resolveCliHome() {
  const explicit = process.env.CHAT_TO_CLI_HOME || process.env.CLI_HOME;
  if (explicit?.trim()) {
    return path.resolve(explicit);
  }
  return path.join(homedir(), ".chat-to-cli");
}

function normalizeFilePath(filePath) {
  const resolved = path.resolve(filePath);
  return process.platform === "win32" ? resolved.toLowerCase() : resolved;
}

function isWithinWorkspace(workspacePath, cwd) {
  if (typeof workspacePath !== "string" || workspacePath.trim().length === 0) {
    return false;
  }

  const normalizedWorkspace = normalizeFilePath(workspacePath);
  const normalizedCwd = normalizeFilePath(cwd);
  return (
    normalizedCwd === normalizedWorkspace ||
    normalizedCwd.startsWith(`${normalizedWorkspace}${path.sep}`)
  );
}

function readBridgeEntries(bridgePath) {
  try {
    const raw = JSON.parse(readFileSync(bridgePath, "utf8"));
    if (Array.isArray(raw.entries)) {
      return raw.entries;
    }
    if (typeof raw.socketPath === "string" && typeof raw.token === "string") {
      return [raw];
    }
  } catch {
    return [];
  }
  return [];
}

function listBridgeCandidates() {
  const providersRoot = path.join(resolveCliHome(), "providers");
  if (!existsSync(providersRoot)) {
    return [];
  }

  const cwd = process.cwd();
  const candidates = [];
  for (const entry of readdirSync(providersRoot, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const bridgePath = path.join(providersRoot, entry.name, BRIDGE_FILE_NAME);
    if (!existsSync(bridgePath)) {
      continue;
    }

    const bridgeEntries = readBridgeEntries(bridgePath);
    candidates.push({
      bridgePath,
      providerId: decodeURIComponent(entry.name),
      workspaceMatch: bridgeEntries.some((bridgeEntry) =>
        isWithinWorkspace(bridgeEntry?.workspace, cwd),
      ),
      mtimeMs: statSync(bridgePath).mtimeMs,
    });
  }

  return candidates;
}

function hasBridgeContext() {
  if (process.env.CLI_BRIDGE_INFO_FILE?.trim() || process.env.CLI_PROVIDER_ID?.trim()) {
    return true;
  }
  return Boolean(
    process.env.VSCODE_MCP_SOCKET_PATH?.trim() && process.env.VSCODE_MCP_TOKEN?.trim(),
  );
}

function resolveBridgeContext() {
  const providerId = process.env.VSCODE_LINT_PROVIDER_ID || DEFAULT_PROVIDER_ID;
  const candidates = listBridgeCandidates();
  if (candidates.length === 0) {
    fail(
      "Could not find a Chat to CLI linter bridge. Reload Cursor/VS Code and ensure chatToCli.enableDiagnosticsLinter is enabled.",
    );
  }

  const selected =
    candidates.find((candidate) => candidate.providerId === providerId && candidate.workspaceMatch) ||
    candidates.find((candidate) => candidate.providerId === providerId) ||
    candidates.find((candidate) => candidate.workspaceMatch) ||
    (candidates.length === 1 ? candidates[0] : undefined);

  if (!selected) {
    const providers = candidates.map((candidate) => candidate.providerId).join(", ");
    fail(
      `Found multiple Chat to CLI bridge providers (${providers}) but none matched this workspace. Set CLI_PROVIDER_ID or CLI_BRIDGE_INFO_FILE explicitly.`,
    );
  }

  return selected;
}

const lintScript = findChatToCliLintScript();
if (!lintScript) {
  fail("Could not find airizom.chat-to-cli with scripts/vscode-lint.js under Cursor or VS Code extensions.");
}

const childEnv = { ...process.env };
if (!hasBridgeContext()) {
  const bridgeContext = resolveBridgeContext();
  childEnv.CLI_PROVIDER_ID = bridgeContext.providerId;
  childEnv.CLI_BRIDGE_INFO_FILE = bridgeContext.bridgePath;
}

const result = spawnSync(process.execPath, [lintScript, ...process.argv.slice(2)], {
  cwd: process.cwd(),
  env: childEnv,
  stdio: "inherit",
});

if (result.error) {
  fail(result.error.message);
}
process.exit(result.status ?? 1);
