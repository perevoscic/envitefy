import { spawn } from 'node:child_process';
import path from 'node:path';

const pendingTerminations = new Map();
export const pendingProcessTerminations = () => [...pendingTerminations.values()].map((item) => ({ ...item }));

export function processTerminationLockDecision(lock, token, { pending = pendingProcessTerminations(), timestamp = () => new Date().toISOString() } = {}) {
  if (lock.token !== token) return { release: false };
  if (!pending.length) return { release: true };
  return { release: false, retainedLock: { ...lock, releaseBlockedAt: timestamp(),
    releaseBlockedReason: 'Runner process-tree exit is not verified.', pendingProcessTerminations: pending } };
}

function commandResult(binary, args, timeoutMs = 10000) {
  return new Promise((resolve) => {
    const child = spawn(binary, args, { windowsHide: true, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
    let stdout = '', stderr = '', done = false;
    const finish = (result) => {
      if (done) return; done = true; clearTimeout(timer);
      child.stdout.destroy(); child.stderr.destroy(); resolve({ ...result, stdout, stderr });
    };
    child.stdout.on('data', (data) => { stdout += data; });
    child.stderr.on('data', (data) => { stderr += data; });
    const timer = setTimeout(() => { child.kill(); finish({ exitCode: null, timedOut: true }); }, timeoutMs);
    child.once('error', (error) => finish({ exitCode: null, spawnError: error.code }));
    child.once('close', (exitCode) => finish({ exitCode, timedOut: false }));
  });
}

export function validateProcessInventory(value) {
  if (!Array.isArray(value)) throw new Error('Windows process inventory is not an array.');
  const seen = new Set();
  return value.map((item) => {
    if (!Number.isInteger(item.pid) || item.pid < 0 || !Number.isInteger(item.parentPid) || item.parentPid < 0 ||
        (item.created !== null && (typeof item.created !== 'string' || !Number.isFinite(Date.parse(item.created)))) || seen.has(item.pid))
      throw new Error('Windows process inventory contains invalid or duplicate identities.');
    seen.add(item.pid);
    return { pid: item.pid, parentPid: item.parentPid, created: item.created };
  });
}

export function selectProcessTree(inventory, rootPid) {
  const root = inventory.find((item) => item.pid === rootPid);
  if (!root) throw new Error('Runner root exited before its process tree could be captured.');
  if (root.created === null) throw new Error('Runner creation metadata is unavailable.');
  const selected = new Map([[root.pid, root]]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const item of inventory) {
      const parent = selected.get(item.parentPid);
      if (!selected.has(item.pid) && parent && item.created === null) throw new Error('Runner descendant creation metadata is unavailable.');
      if (!selected.has(item.pid) && parent && item.created >= parent.created) {
        selected.set(item.pid, item); changed = true;
      }
    }
  }
  return [...selected.values()];
}

function sameIdentity(left, right) { return left.pid === right.pid && left.created === right.created; }

function requireKnownCapturedMetadata(inventory, captured) {
  if (inventory.some((item) => item.created === null && captured.some((known) => known.pid === item.pid)))
    throw new Error('A captured runner PID has unavailable creation metadata; absence cannot be verified.');
}

function uncapturedPossibleDescendants(inventory, captured) {
  return inventory.filter((item) => {
    if (captured.some((known) => sameIdentity(known, item))) return false;
    const formerParent = captured.find((known) => known.pid === item.parentPid && (item.created === null || item.created >= known.created));
    if (!formerParent) return false;
    const currentParent = inventory.find((live) => live.pid === item.parentPid);
    // A new process definitely created under a recycled parent is not our child.
    if (item.created !== null && currentParent?.created && !sameIdentity(currentParent, formerParent) && item.created >= currentParent.created) return false;
    return true;
  });
}

async function windowsInventory(timeoutMs) {
  const script = `$ErrorActionPreference='Stop'; [Console]::OutputEncoding=[System.Text.UTF8Encoding]::new(); $rows=@(Get-CimInstance Win32_Process -ErrorAction Stop | ForEach-Object { [pscustomobject]@{ pid=[int]$_.ProcessId; parentPid=[int]$_.ParentProcessId; created=$(if ($_.CreationDate) { $_.CreationDate.ToUniversalTime().ToString('o') } else { $null }) } }); ConvertTo-Json -InputObject $rows -Compress`;
  const powershell = path.join(process.env.SystemRoot || 'C:/Windows', 'System32/WindowsPowerShell/v1.0/powershell.exe');
  const result = await commandResult(powershell, ['-NoProfile', '-NonInteractive', '-EncodedCommand', Buffer.from(script, 'utf16le').toString('base64')], timeoutMs);
  if (result.exitCode !== 0 || result.timedOut || result.spawnError) throw new Error('Windows process inventory query failed.');
  return validateProcessInventory(JSON.parse(result.stdout.replace(/^\uFEFF/, '').trim()));
}

async function windowsKillTree(pid, timeoutMs) {
  // Do not kill the root separately: taskkill must still see its descendant tree.
  return commandResult(path.join(process.env.SystemRoot || 'C:/Windows', 'System32/taskkill.exe'), ['/PID', String(pid), '/T', '/F'], timeoutMs);
}

export async function terminateWindowsProcessTree(rootPid, { inventory = windowsInventory, killTree = windowsKillTree,
  now = Date.now, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)), timeoutMs = 30000,
  rootExited = () => false, track = () => {} } = {}) {
  const started = now();
  const result = { rootPid, startedAt: new Date().toISOString(), verified: false, captured: [], attempts: [] };
  const remaining = () => Math.max(1, Math.min(10000, timeoutMs - (now() - started)));
  try {
    if (!Number.isInteger(rootPid) || rootPid <= 0) throw new Error('No valid runner PID was available for timeout containment.');
    if (rootExited()) throw new Error('Runner root exited before its process tree could be captured.');
    let current = await inventory(remaining());
    if (rootExited()) throw new Error('Runner root exited while its initial process tree was being captured.');
    result.captured = selectProcessTree(current, rootPid);
    track(result.captured);
    while (now() - started < timeoutMs) {
      requireKnownCapturedMetadata(current, result.captured);
      // Discover children only through an identity that still exists, never a recycled PID.
      for (const item of [...result.captured]) {
        if (current.some((live) => sameIdentity(live, item))) {
          for (const descendant of selectProcessTree(current, item.pid))
            if (!result.captured.some((known) => sameIdentity(known, descendant))) result.captured.push(descendant);
        }
      }
      track(result.captured);
      const live = result.captured.filter((item) => current.some((candidate) => sameIdentity(item, candidate)));
      if (!live.length) {
        result.unresolvedDescendants = uncapturedPossibleDescendants(current, result.captured);
        if (result.unresolvedDescendants.length) throw new Error('Uncaptured possible runner descendants remain after their parent exited.');
        result.verified = true; break;
      }
      // Keep the parent intact for taskkill /T. If it exited naturally, target only
      // captured descendants whose PID and creation time still match this inventory.
      const target = live.some((item) => item.pid === rootPid) && !rootExited()
        ? live.find((item) => item.pid === rootPid)
        : live.find((item) => item.pid !== rootPid && !live.some((parent) => parent.pid !== rootPid && parent.pid === item.parentPid));
      if (!target) throw new Error('Runner identity changed during timeout containment.');
      // One highest surviving ancestor per inventory; never kill a grandchild
      // from a stale snapshot after taskkill already removed its parent subtree.
      const killed = await killTree(target.pid, remaining());
      result.attempts.push({ pid: target.pid, exitCode: killed.exitCode, timedOut: Boolean(killed.timedOut),
        ...(killed.spawnError ? { spawnError: killed.spawnError } : {}) });
      current = await inventory(remaining());
      requireKnownCapturedMetadata(current, result.captured);
      if (!result.captured.some((item) => current.some((candidate) => sameIdentity(item, candidate)))) {
        result.unresolvedDescendants = uncapturedPossibleDescendants(current, result.captured);
        if (result.unresolvedDescendants.length) throw new Error('Uncaptured possible runner descendants remain after their parent exited.');
        result.verified = true; break;
      }
      await sleep(Math.min(250, Math.max(0, timeoutMs - (now() - started))));
    }
    if (!result.verified) result.error = 'Runner process-tree exit was not verified within the cleanup limit.';
  } catch (error) { result.error = error.message; }
  return { ...result, completedAt: new Date().toISOString(), elapsedMs: now() - started };
}

export function createContainedProcessRunner({ spawnProcess = spawn, platform = process.platform,
  terminateTree = terminateWindowsProcessTree, pending = pendingTerminations } = {}) {
  return async function runContainedProcess(binary, args, { env = process.env, cwd, timeoutMs = 300000,
    onOutput, secrets = [], redact = (value) => String(value) } = {}) {
    return new Promise((resolve, reject) => {
      const batch = platform === 'win32' && /\.(bat|cmd)$/i.test(binary);
      if (batch && [binary, ...args].some((value) => /["\r\n%&|<>^]/.test(String(value)))) {
        reject(new Error('Unsafe Windows batch argument.')); return;
      }
      const child = spawnProcess(batch ? 'cmd.exe' : binary, batch
        ? ['/d', '/s', '/c', `"${[binary, ...args].map((value) => `"${value}"`).join(' ')}"`] : args,
      { cwd, env, windowsHide: true, windowsVerbatimArguments: batch, shell: false, stdio: ['ignore', 'pipe', 'pipe'] });
      let output = '', timedOut = false, settled = false, containmentComplete = false, observedExitCode = null, rootDidExit = false;
      let termination;
      const capture = (chunk) => { const value = redact(chunk.toString(), secrets); output += value; onOutput?.(value); };
      child.stdout.on('data', capture); child.stderr.on('data', capture);
      const finish = (code, extra = {}) => {
        if (settled || (timedOut && !containmentComplete)) return;
        settled = true; clearTimeout(timer); child.stdout.destroy(); child.stderr.destroy();
        resolve({ exitCode: timedOut ? null : code, output: redact(output, secrets), timedOut, ...extra,
          ...(timedOut ? { observedExitCode, terminationVerified: Boolean(termination?.verified), termination } : {}) });
      };
      const timer = setTimeout(async () => {
        if (settled) return;
        timedOut = true;
        // Register before awaiting anything so UI lock exit hooks cannot release early.
        pending.set(child.pid, { rootPid: child.pid, status: 'timeout_containment_pending', startedAt: new Date().toISOString() });
        try {
          if (platform === 'win32') {
            termination = await terminateTree(child.pid, { rootExited: () => rootDidExit,
              track: (captured) => pending.set(child.pid, { ...pending.get(child.pid), captured }) });
          } else {
            child.kill('SIGTERM');
            termination = { rootPid: child.pid, verified: false, error: 'Process exit is pending after SIGTERM.' };
            const deadline = Date.now() + 10000;
            while (!rootDidExit && Date.now() < deadline) await new Promise((done) => setTimeout(done, 25));
            termination.verified = rootDidExit;
            if (termination.verified) delete termination.error;
          }
        } catch (error) { termination = { rootPid: child.pid, verified: false, error: error.message }; }
        if (termination.verified) pending.delete(child.pid);
        else {
          pending.set(child.pid, { ...pending.get(child.pid), status: 'timeout_containment_unverified', error: termination.error });
          capture(`\nTimeout process-tree exit is unverified; owned Android UI locks must remain reserved. Root PID ${child.pid}.\n`);
          child.unref();
        }
        containmentComplete = true;
        finish(null);
      }, timeoutMs);
      child.once('error', (error) => {
        if (timedOut) return;
        finish(null, { spawnError: error.code, output: redact(error.message, secrets) });
      });
      child.once('close', (code) => { rootDidExit = true; observedExitCode = code; finish(code); });
      child.once('exit', (code) => {
        rootDidExit = true; observedExitCode = code;
        // Preserve the existing pg_ctl behavior for inherited daemon pipe handles.
        setTimeout(() => finish(code), 100);
      });
    });
  };
}

export const runContainedProcess = createContainedProcessRunner();
