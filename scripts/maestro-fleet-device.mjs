import { closeSync, openSync } from 'node:fs';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn, execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { ROOT, runProcess } from './lib/maestro-core.mjs';
import { acquireAndroidUiLock } from './lib/maestro-ui-lock.mjs';
import { explicitDisplayScreencapArgs, selectPrimaryCaptureDisplay } from './lib/maestro-display.mjs';
import { buildFleetEmulatorLaunch, parseFleetDeviceArgs } from './lib/maestro-fleet-launch.mjs';

const execFileAsync = promisify(execFile);
const base = path.join(ROOT, 'output/maestro/device-fleet');
const { command, alias, visible, bootDiagnostics } = parseFleetDeviceArgs(process.argv.slice(2));
const manifest = JSON.parse(await fs.readFile(path.join(base, 'manifest.json'), 'utf8'));
const profile = manifest.profiles.find(p => p.account === alias);
const expectedHome = path.join(ROOT, '.tools/android/account-fleet/avd');
const expectedName = `Envitefy_Fleet_${alias}`;
const expectedPort = 5560 + 2 * (Number(alias.slice(2)) - 1);
if (!profile?.assigned || !profile.provisioned || profile.avdName !== expectedName ||
    profile.serial !== `emulator-${expectedPort}` || profile.port !== expectedPort ||
    path.resolve(profile.avdHome) !== expectedHome ||
    path.resolve(profile.avdPath) !== path.join(expectedHome, `${expectedName}.avd`)) {
  throw new Error('Assigned and provisioned isolated fleet mapping was not verified. Run fleet status first.');
}
const registered = await fs.readFile(profile.registryPath, 'utf8');
if (!registered.split(/\r?\n/).some(line => line.startsWith('path=') && path.resolve(line.slice(5)) === profile.avdPath)) {
  throw new Error('AVD registration differs from the isolated account data path.');
}
const sdk = process.env.ANDROID_HOME || path.join(process.env.USERPROFILE || '', 'AppData/Local/Android/Sdk');
const adb = path.join(sdk, 'platform-tools/adb.exe');
const emulator = path.join(sdk, 'emulator/emulator.exe');
const serial = profile.serial;
const leasePath = path.join(base, 'running-device.json');
const release = await acquireAndroidUiLock('emulator-5556', { kind: `fleet-device-${command}`, account: alias, actualSerial: serial });
const dir = path.join(base, 'devices', alias, `${command}-${Date.now()}`);
await fs.mkdir(dir, { recursive: true });
const state = { account: alias, avdName: expectedName, serial, command, startedAt: new Date().toISOString(), noDataReset: true, noAppActivityCounted: true };
if (bootDiagnostics) state.bootDiagnostics = {
  requested: true,
  flags: ['-show-kernel', '-logcat', '*:s init:i adbd:i', '-debug', 'init,time'],
  stdoutFile: path.join(dir, 'emulator-stdout.log'),
  stderrFile: path.join(dir, 'emulator-stderr.log'),
  bootCheckTimeoutMs: 180000,
  logScope: 'Kernel output, init/adbd information and emulator init/time diagnostics; capture lasts until normal emulator shutdown.',
  nextStep: 'Boot-only diagnostic: normally stop this AVD before any app or authentication phase. A successful boot does not authorize app checks in this diagnostic launch.',
};
const save = () => fs.writeFile(path.join(dir, 'state.json'), JSON.stringify(state, null, 2));
const runAdb = (args, timeoutMs = 10000) => runProcess(adb, args, { timeoutMs });
const readLease = async () => {
  try { return JSON.parse(await fs.readFile(leasePath, 'utf8')); }
  catch (error) { if (error.code === 'ENOENT') return null; throw error; }
};
const emulatorProcesses = async () => {
  const result = await runProcess('powershell.exe', ['-NoProfile', '-Command', "@(Get-Process -Name emulator,qemu-system-x86_64 -ErrorAction SilentlyContinue | Select-Object Id,ProcessName) | ConvertTo-Json -Compress"], { timeoutMs: 10000 });
  if (result.timedOut || result.exitCode !== 0) throw new Error('Emulator process inventory was unavailable; no additional device will be started.');
  const parsed = result.output.trim() ? JSON.parse(result.output) : [];
  return Array.isArray(parsed) ? parsed : [parsed];
};
const assertRunningIdentity = async () => {
  const result = await runAdb(['-s', serial, 'emu', 'avd', 'name']);
  if (result.exitCode !== 0 || !result.output.split(/\r?\n/).map(line => line.trim()).includes(expectedName)) throw new Error('Connected serial does not match the assigned AVD.');
};
try {
  const inventory = await runAdb(['devices', '-l']);
  if (inventory.exitCode !== 0) throw new Error('ADB inventory failed: ' + inventory.output);
  const connected = inventory.output.split(/\r?\n/).map(line => line.match(/^(emulator-\d+)\s+(\w+)/)).filter(Boolean);
  if (command === 'start') {
    const lease = await readLease();
    if (lease && lease.account !== alias) throw new Error(`The ${lease.account} fleet device has an unresolved running lease. Verify its normal shutdown before another start.`);
    const other = connected.filter(item => item[1] !== serial);
    if (other.length) throw new Error(`Another emulator is connected (${other.map(x => x[1]).join(', ')}). It was not stopped; finish it before starting this account.`);
    if (connected.some(item => item[1] === serial)) {
      if (bootDiagnostics) throw new Error('--boot-diagnostics requires a new QA04 or QA10 launch; diagnostic flags cannot be added to an already-running AVD. No restart was performed.');
      await assertRunningIdentity();
      if (visible && lease?.windowMode !== 'visible') {
        throw new Error('--visible applies only to a new launch. The existing AVD was not restarted; finish its work and stop it normally before starting it with --visible.');
      }
      state.alreadyRunning = true;
      state.windowMode = lease?.windowMode || 'unknown';
      if (!lease) await fs.writeFile(leasePath, JSON.stringify({ account: alias, avdName: expectedName, serial, observedAt: new Date().toISOString(), evidenceDirectory: dir }, null, 2), { flag: 'wx' });
    } else {
      if (lease) throw new Error('This account has an unresolved launch with no ADB registration. Inspect its saved process and boot logs; a second instance was not started.');
      const processes = await emulatorProcesses();
      if (processes.length) throw new Error('An emulator process is still running without the selected ADB registration. Finish or recover it before starting another device.');
      const { args, windowsHide } = buildFleetEmulatorLaunch(expectedName, expectedPort, visible, bootDiagnostics);
      state.windowMode = visible ? 'visible' : 'headless';
      const stdoutFd = openSync(path.join(dir, 'emulator-stdout.log'), 'a');
      const stderrFd = openSync(path.join(dir, 'emulator-stderr.log'), 'a');
      try {
        await fs.writeFile(leasePath, JSON.stringify({ account: alias, avdName: expectedName, serial, status: 'launching', windowMode: state.windowMode, evidenceDirectory: dir, createdAt: new Date().toISOString() }, null, 2), { flag: 'wx' });
        const child = spawn(emulator, args, { cwd: ROOT, env: { ...process.env, ANDROID_AVD_HOME: expectedHome }, windowsHide, detached: true, stdio: ['ignore', stdoutFd, stderrFd] });
        await new Promise((resolve, reject) => { child.once('spawn', resolve); child.once('error', reject); });
        state.pid = child.pid;
        state.launchArguments = args;
        await fs.writeFile(leasePath, JSON.stringify({ account: alias, avdName: expectedName, serial, status: 'launched', windowMode: state.windowMode, pid: child.pid, evidenceDirectory: dir, createdAt: new Date().toISOString() }, null, 2));
        child.unref();
      } finally { closeSync(stdoutFd); closeSync(stderrFd); }
      state.status = 'booting';
      await save();
      console.log(`${alias}: starting ${expectedName}; fresh or preserved userdata, no account migration.`);
    }
    const deadline = Date.now() + 180000;
    let booted = false;
    while (Date.now() < deadline) {
      const result = await runAdb(['-s', serial, 'shell', 'getprop', 'sys.boot_completed'], 5000);
      if (result.exitCode === 0 && result.output.trim() === '1') { booted = true; break; }
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    if (!booted) throw new Error('Android boot check exceeded 180000 ms; app installation and sign-in remain unverified.');
    await assertRunningIdentity();
    await runAdb(['-s', serial, 'shell', 'input', 'keyevent', 'KEYCODE_WAKEUP']);
    await runAdb(['-s', serial, 'shell', 'wm', 'dismiss-keyguard']);
    state.status = 'android_boot_verified';
  } else {
    await assertRunningIdentity();
    if (command === 'stop') {
      const result = await runAdb(['-s', serial, 'emu', 'kill']);
      if (result.exitCode !== 0) throw new Error('Normal emulator shutdown failed: ' + result.output);
      const deadline = Date.now() + 30000;
      let disconnected = false;
      while (Date.now() < deadline) {
        const current = await runAdb(['devices']);
        if (current.exitCode === 0 && !current.output.split(/\r?\n/).some(line => line.startsWith(serial + '\t') || line.startsWith(serial + ' '))) { disconnected = true; break; }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      if (!disconnected) throw new Error('Shutdown requested; device disconnect not verified within 30000 ms.');
      const processDeadline = Date.now() + 30000;
      let processes = await emulatorProcesses();
      while (processes.length && Date.now() < processDeadline) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        processes = await emulatorProcesses();
      }
      if (processes.length) throw new Error('ADB disconnected, but an emulator process remains; launch lease retained pending verified exit.');
      const lease = await readLease();
      if (lease?.account === alias && lease?.avdName === expectedName) await fs.unlink(leasePath);
      state.status = 'stopped_with_userdata_preserved';
    } else if (command === 'screen') {
      const displayIdArgs = ['-s', serial, 'shell', 'dumpsys', 'SurfaceFlinger', '--display-id'];
      const displayDetailArgs = ['-s', serial, 'shell', 'dumpsys', 'display'];
      const [ids, details] = await Promise.all([runAdb(displayIdArgs), runAdb(displayDetailArgs)]);
      state.displayCapture = {
        inventoryFiles: { surfaceFlinger: path.join(dir, 'display-ids.txt'), displayManager: path.join(dir, 'display-details.txt') },
        inventoryResults: [{ args: displayIdArgs, exitCode: ids.exitCode, timedOut: Boolean(ids.timedOut) },
          { args: displayDetailArgs, exitCode: details.exitCode, timedOut: Boolean(details.timedOut) }],
      };
      await fs.writeFile(state.displayCapture.inventoryFiles.surfaceFlinger, ids.output);
      await fs.writeFile(state.displayCapture.inventoryFiles.displayManager, details.output);
      if ([ids, details].some(result => result.exitCode !== 0 || result.timedOut)) throw new Error('Read-only display inventory failed; no screenshot was requested.');
      Object.assign(state.displayCapture, selectPrimaryCaptureDisplay(ids.output, details.output));
      const captureArgs = explicitDisplayScreencapArgs(serial, state.displayCapture);
      state.displayCapture.captureArguments = captureArgs;
      const result = await execFileAsync(adb, captureArgs, { encoding: 'buffer', timeout: 15000, maxBuffer: 12 * 1024 * 1024, windowsHide: true });
      if (result.stdout.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') throw new Error('Android capture was not a PNG.');
      state.screenshot = path.join(dir, 'screen.png');
      await fs.writeFile(state.screenshot, result.stdout);
      state.status = 'screenshot_saved';
    } else state.status = 'assigned_avd_connected';
  }
  if (command !== 'stop') {
    state.actualAndroidModel = (await runAdb(['-s', serial, 'shell', 'getprop', 'ro.product.model'])).output.trim();
    state.actualAndroidManufacturer = (await runAdb(['-s', serial, 'shell', 'getprop', 'ro.product.manufacturer'])).output.trim();
    state.playStorePackage = (await runAdb(['-s', serial, 'shell', 'pm', 'list', 'packages', 'com.android.vending'])).output.trim();
    state.envitefyPackage = (await runAdb(['-s', serial, 'shell', 'pm', 'list', 'packages', '-i', 'com.envitefy.app'])).output.trim();
  }
} catch (error) {
  state.status = 'tool_or_access_failure';
  state.error = error.message;
  process.exitCode = 1;
} finally {
  state.finishedAt = new Date().toISOString();
  await save();
  release();
}
console.log(JSON.stringify({ ...state, evidenceDirectory: dir }, null, 2));
