export function parseFleetDeviceArgs(args) {
  const [command, alias, ...options] = args;
  const visible = options.length === 1 && options[0] === '--visible';
  if (!['start', 'stop', 'inspect', 'screen'].includes(command) ||
      !/^QA(?:0[1-9]|1[0-3])$/.test(alias || '') ||
      (options.length && (!visible || command !== 'start'))) {
    throw new Error('Usage: node scripts/maestro-fleet-device.mjs start|stop|inspect|screen QA01..QA13 [--visible (start only)]');
  }
  return { command, alias, visible };
}

export function buildFleetEmulatorLaunch(avdName, port, visible = false) {
  return {
    args: ['-avd', avdName, '-port', String(port), '-memory', '3072', '-cores', '2',
      ...(visible ? [] : ['-no-window']),
      '-no-audio', '-no-snapshot', '-no-boot-anim', '-gpu', 'software', '-feature', '-Vulkan'],
    windowsHide: !visible,
  };
}
