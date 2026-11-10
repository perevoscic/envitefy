export function parseFleetDeviceArgs(args) {
  const [command, alias, ...options] = args;
  const visible = options.includes('--visible');
  const bootDiagnostics = options.includes('--boot-diagnostics');
  if (!['start', 'stop', 'inspect', 'screen'].includes(command) ||
      !/^QA(?:0[1-9]|1[0-3])$/.test(alias || '') ||
      new Set(options).size !== options.length ||
      options.some(option => !['--visible', '--boot-diagnostics'].includes(option)) ||
      (options.length && command !== 'start') ||
      (bootDiagnostics && !['QA04', 'QA10'].includes(alias))) {
    throw new Error('Usage: node scripts/maestro-fleet-device.mjs start|stop|inspect|screen QA01..QA13 [--visible (start only)] [--boot-diagnostics (QA04 or QA10 start only)]');
  }
  return { command, alias, visible, ...(bootDiagnostics ? { bootDiagnostics: true } : {}) };
}

export function buildFleetEmulatorLaunch(avdName, port, visible = false, bootDiagnostics = false) {
  if (bootDiagnostics && !((avdName === 'Envitefy_Fleet_QA04' && port === 5566) ||
      (avdName === 'Envitefy_Fleet_QA10' && port === 5578))) {
    throw new Error('Boot diagnostics require the exact assigned QA04 or QA10 AVD and port.');
  }
  return {
    args: ['-avd', avdName, '-port', String(port), '-memory', '3072', '-cores', '2',
      ...(visible ? [] : ['-no-window']),
      '-no-audio', '-no-snapshot', '-no-boot-anim', '-gpu', 'software', '-feature', '-Vulkan',
      ...(bootDiagnostics ? ['-show-kernel', '-logcat', '*:s init:i adbd:i', '-debug', 'init,time'] : [])],
    windowsHide: !visible,
  };
}
