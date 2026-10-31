import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { PassThrough } from 'node:stream';
import { mkdtemp, readFile, writeFile, unlink, rmdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { createContainedProcessRunner, processTerminationLockDecision, selectProcessTree, terminateWindowsProcessTree, validateProcessInventory } from './lib/maestro-process-timeout.mjs';

const root = { pid: 101, parentPid: 1, created: '2026-10-31T00:00:00.0000000Z' };
const child = { pid: 102, parentPid: 101, created: '2026-10-31T00:00:01.0000000Z' };
const grandchild = { pid: 103, parentPid: 102, created: '2026-10-31T00:00:02.0000000Z' };
function fakeChild(pid = 101) {
  const process = new EventEmitter();
  Object.assign(process, { pid, stdout: new PassThrough(), stderr: new PassThrough(), killed: [],
    kill: (signal) => process.killed.push(signal), unref: () => {} });
  return process;
}

test('tree snapshots include only descendants with valid creation order and reject unknown roots', () => {
  const stale = { pid: 110, parentPid: root.pid, created: '2026-10-30T23:00:00.0000000Z' };
  assert.deepEqual(selectProcessTree([grandchild, stale, child, root], 101).map((item) => item.pid).sort(), [101, 102, 103]);
  assert.throws(() => selectProcessTree([child, grandchild], 101), /root exited/);
  for (const input of [null, {}, [root, root], [{ ...root, created: 'unknown' }], [{ ...root, pid: '101' }]]) assert.throws(() => validateProcessInventory(input));
});

test('taskkill success is followed by verified absence of every captured identity', async () => {
  let reads = 0; const kills = []; const tracked = [];
  const result = await terminateWindowsProcessTree(101, {
    inventory: async () => reads++ ? [] : [root, child, grandchild],
    killTree: async (pid) => { kills.push(pid); return { exitCode: 0 }; }, track: (tree) => tracked.push(tree.map((item) => item.pid)),
  });
  assert.equal(result.verified, true);
  assert.deepEqual(kills, [101]);
  assert.equal(reads, 2);
  assert.deepEqual(tracked.at(-1), [101, 102, 103]);
});

test('natural root exit after capture still requires terminating and verifying its captured descendants', async () => {
  let reads = 0; let captured = false; const kills = [];
  const result = await terminateWindowsProcessTree(101, {
    inventory: async () => reads++ ? [] : [root, child, grandchild], rootExited: () => captured,
    track: () => { captured = true; },
    killTree: async (pid) => { kills.push(pid); return { exitCode: 0 }; },
  });
  assert.equal(result.verified, true);
  assert.deepEqual(kills, [102]);
});

test('root exit during initial inventory cannot capture a recycled root or kill its unrelated children', async () => {
  let exited = false;
  const result = await terminateWindowsProcessTree(101, {
    rootExited: () => exited,
    inventory: async () => { exited = true; return [{ ...root, created: '2026-10-31T01:00:00.0000000Z' }, { ...child, created: '2026-10-31T01:00:01.0000000Z' }]; },
    killTree: async () => assert.fail('Untrusted replacement tree must not be killed'),
  });
  assert.equal(result.verified, false);
  assert.match(result.error, /initial process tree/);
});

test('a new orphan appearing after taskkill cannot produce a clean result', async () => {
  let reads = 0;
  const orphan = { pid: 104, parentPid: 102, created: '2026-10-31T00:00:03.0000000Z' };
  const result = await terminateWindowsProcessTree(101, {
    inventory: async () => reads++ ? [orphan] : [root, child], killTree: async () => ({ exitCode: 0 }),
  });
  assert.equal(result.verified, false);
  assert.deepEqual(result.unresolvedDescendants, [orphan]);
});

test('recycled PID is not mistaken for a surviving captured process', async () => {
  let reads = 0; const kills = [];
  const reused = { ...child, parentPid: 1, created: '2026-10-31T01:00:00.0000000Z' };
  const result = await terminateWindowsProcessTree(101, {
    inventory: async () => reads++ ? [reused] : [root, child],
    killTree: async (pid) => { kills.push(pid); return { exitCode: 0 }; },
  });
  assert.equal(result.verified, true);
  assert.deepEqual(kills, [101]);
});

test('unknown creation metadata for a captured PID is not filtered into a false absence', async () => {
  let reads = 0;
  const unknown = { ...child, created: null };
  assert.deepEqual(validateProcessInventory([unknown]), [unknown]);
  const result = await terminateWindowsProcessTree(101, {
    inventory: async () => reads++ ? [unknown] : [root, child], killTree: async () => ({ exitCode: 0 }),
  });
  assert.equal(result.verified, false);
  assert.match(result.error, /unavailable creation metadata/);
});

test('zero kill exit with survivors stays unverified; nonzero with proven absence can verify', async () => {
  let clock = 0;
  const survivor = await terminateWindowsProcessTree(101, {
    inventory: async () => { clock += 10; return [root, child]; },
    killTree: async () => ({ exitCode: 0 }), now: () => clock, sleep: async (ms) => { clock += ms; }, timeoutMs: 100,
  });
  assert.equal(survivor.verified, false);
  let reads = 0;
  const absent = await terminateWindowsProcessTree(101, {
    inventory: async () => reads++ ? [] : [root, child], killTree: async () => ({ exitCode: 128 }),
  });
  assert.equal(absent.verified, true);
});

test('missing initial root or failed verification remains unverified', async () => {
  const missing = await terminateWindowsProcessTree(101, { inventory: async () => [child], killTree: async () => assert.fail('Unknown tree must not be killed') });
  assert.equal(missing.verified, false);
  let reads = 0;
  const failed = await terminateWindowsProcessTree(101, {
    inventory: async () => { if (reads++) throw new Error('CIM unavailable'); return [root, child]; },
    killTree: async () => ({ exitCode: 0 }),
  });
  assert.equal(failed.verified, false);
  assert.match(failed.error, /CIM unavailable/);
  assert.deepEqual(failed.captured, [root, child]);
});

test('late exit and close zero cannot resolve a timed-out run before containment completes', async () => {
  const proc = fakeChild(); const pending = new Map(); let completeCleanup, announceCleanup;
  const cleanupStarted = new Promise((resolve) => { announceCleanup = resolve; });
  const run = createContainedProcessRunner({ platform: 'win32', spawnProcess: () => proc, pending,
    terminateTree: async () => { announceCleanup(); return new Promise((resolve) => { completeCleanup = resolve; }); } });
  let resolved = false;
  const resultPromise = run('maestro.bat', ['test'], { timeoutMs: 5 }).then((value) => { resolved = true; return value; });
  await cleanupStarted;
  assert.equal(pending.get(101).status, 'timeout_containment_pending');
  proc.emit('exit', 0); proc.emit('close', 0);
  await new Promise((resolve) => setTimeout(resolve, 150));
  assert.equal(resolved, false);
  assert.deepEqual(proc.killed, []);
  completeCleanup({ verified: true, captured: [root, child] });
  const result = await resultPromise;
  assert.equal(result.timedOut, true);
  assert.equal(result.exitCode, null);
  assert.equal(result.observedExitCode, 0);
  assert.equal(result.terminationVerified, true);
  assert.equal(pending.size, 0);
});

test('unverified cleanup retains the process reservation for UI lock release checks', async () => {
  const proc = fakeChild(); const pending = new Map();
  const run = createContainedProcessRunner({ platform: 'win32', spawnProcess: () => proc, pending,
    terminateTree: async (_pid, { track }) => { track([root, child]); return { verified: false, error: 'CIM unavailable' }; } });
  const result = await run('maestro.bat', ['test'], { timeoutMs: 5 });
  assert.equal(result.timedOut, true);
  assert.equal(result.terminationVerified, false);
  assert.equal(pending.get(101).status, 'timeout_containment_unverified');
  assert.deepEqual(pending.get(101).captured, [root, child]);
  assert.match(result.output, /UI locks must remain reserved/);
  const lock = { pid: 999, token: 'owned-token', context: { account: 'QA08' } };
  const decision = processTerminationLockDecision(lock, 'owned-token', { pending: [...pending.values()], timestamp: () => 'observed-time' });
  assert.equal(decision.release, false);
  assert.equal(decision.retainedLock.releaseBlockedAt, 'observed-time');
  assert.equal(decision.retainedLock.pendingProcessTerminations[0].rootPid, 101);
  assert.equal(decision.retainedLock.token, lock.token);
  assert.deepEqual(processTerminationLockDecision(lock, 'other-token', { pending: [...pending.values()] }), { release: false });
  assert.deepEqual(processTerminationLockDecision(lock, 'owned-token', { pending: [] }), { release: true });
});

test('normal exit, stdout redaction, batch quoting and spawn errors retain their behavior', async () => {
  const proc = fakeChild(); let spawned;
  const run = createContainedProcessRunner({ platform: 'win32', spawnProcess: (...args) => { spawned = args; return proc; } });
  const resultPromise = run('maestro.bat', ['test', 'flow.yaml'], { timeoutMs: 1000, secrets: ['private'], redact: (text) => text.replaceAll('private', '[REDACTED]') });
  proc.stdout.write('complete private output'); proc.emit('close', 3);
  const result = await resultPromise;
  assert.equal(result.exitCode, 3); assert.equal(result.timedOut, false);
  assert.equal(result.output, 'complete [REDACTED] output');
  assert.equal(spawned[0], 'cmd.exe'); assert.equal(spawned[2].shell, false);
  await assert.rejects(run('maestro.bat', ['test&other']), /Unsafe Windows batch/);
  const failed = fakeChild(undefined);
  const runFailure = createContainedProcessRunner({ platform: 'win32', spawnProcess: () => failed });
  const failurePromise = runFailure('missing.exe', [], { timeoutMs: 1000 });
  failed.emit('error', Object.assign(new Error('not found'), { code: 'ENOENT' }));
  assert.equal((await failurePromise).spawnError, 'ENOENT');
});

test('Windows timeout verifies a disposable cmd parent and nested Node descendants have exited', { skip: process.platform !== 'win32', timeout: 45000 }, async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'envitefy-process-timeout-'));
  const fixture = path.join(dir, 'tree.mjs');
  const pidFile = path.join(dir, 'pids.jsonl');
  const batch = path.join(dir, 'runner.cmd');
  let result;
  try {
    await writeFile(fixture, `import {spawn} from 'node:child_process'; import {appendFileSync} from 'node:fs'; const depth=Number(process.argv[3]); appendFileSync(process.argv[2],JSON.stringify({pid:process.pid,depth})+'\\n'); if(depth<2)spawn(process.execPath,[process.argv[1],process.argv[2],String(depth+1)],{stdio:'inherit',windowsHide:true,shell:false}); setInterval(()=>{},1000);`);
    await writeFile(batch, `@echo off\r\n"${process.execPath}" "${fixture}" "${pidFile}" 0\r\n`);
    const run = createContainedProcessRunner({ pending: new Map() });
    result = await run(batch, [], { timeoutMs: 2500 });
    const pids = (await readFile(pidFile, 'utf8')).trim().split('\n').map(JSON.parse);
    assert.equal(pids.length, 3);
    assert.equal(result.timedOut, true);
    assert.equal(result.exitCode, null);
    assert.equal(result.terminationVerified, true, result.termination?.error);
    assert.ok(result.termination.captured.length >= 4, 'cmd plus three nested Node processes must be captured');
    for (const item of pids) assert.throws(() => process.kill(item.pid, 0), (error) => error.code === 'ESRCH');
  } finally {
    // Disposable fixture PIDs only; no process-name matching or Android access.
    const pids = await readFile(pidFile, 'utf8').then((s) => s.trim().split('\n').filter(Boolean).map(JSON.parse)).catch(() => []);
    if (!result?.terminationVerified) {
      for (const { pid } of pids.reverse()) { try { process.kill(pid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; } }
      if (result?.termination?.rootPid) { try { process.kill(result.termination.rootPid, 'SIGKILL'); } catch (error) { if (error.code !== 'ESRCH') throw error; } }
    }
    for (const file of [fixture, pidFile, batch]) await unlink(file).catch((error) => { if (error.code !== 'ENOENT') throw error; });
    await rmdir(dir);
  }
});
