// Parse read-only Android display inventories. Physical IDs exceed JavaScript's
// safe integer range, so retain their exact decimal strings for screencap -d.
function only(values, description) {
  if (values.length !== 1) throw new Error(`Display selection requires exactly one ${description}.`);
  return values[0];
}

function field(text, expression, description) {
  return only([...text.matchAll(expression)].map(match => match[1]), description);
}

export function selectPrimaryCaptureDisplay(surfaceFlinger, displayDetails) {
  const physicalDisplays = [...surfaceFlinger.matchAll(/^Display (\d+) \(HWC display (\d+)\):[^\r\n]*$/gm)]
    .map(match => ({ physicalDisplayId: match[1], hwcDisplayId: match[2] }));
  if (!physicalDisplays.length || new Set(physicalDisplays.map(display => display.physicalDisplayId)).size !== physicalDisplays.length)
    throw new Error('SurfaceFlinger display IDs are absent or ambiguous.');

  const lines = displayDetails.replaceAll('\r', '').split('\n');
  const logicalHeading = only(lines.map((line, index) => /^\s*Logical Displays: size=\d+\s*$/.test(line) ? index : -1)
    .filter(index => index >= 0), 'logical display inventory');
  const logicalDisplays = [];
  for (let index = logicalHeading + 1; index < lines.length;) {
    if (!lines[index].trim()) { index++; continue; }
    const heading = lines[index].match(/^(\s*)Display (\d+):\s*$/);
    if (!heading) break;
    const indent = heading[1].length;
    const start = ++index;
    while (index < lines.length && (!lines[index].trim() || lines[index].match(/^\s*/)[0].length > indent)) index++;
    logicalDisplays.push({ id: heading[2], body: lines.slice(start, index).join('\n') });
  }
  const primary = only(logicalDisplays.filter(display => display.id === '0'), 'logical default display (0)');
  if (field(primary.body, /^\s*mDisplayId=(\d+)\s*$/gm, 'default display ID') !== '0' ||
      field(primary.body, /^\s*mIsEnabled=(true|false)\s*$/gm, 'default enabled state') !== 'true' ||
      field(primary.body, /^\s*mIsInTransition=(true|false)\s*$/gm, 'default transition state') !== 'false')
    throw new Error('The logical default display is disabled or transitioning.');
  const baseInfo = field(primary.body, /^\s*mBaseDisplayInfo=(.+)$/gm, 'default base display info');
  const physicalDisplayId = field(baseInfo, /\buniqueId "local:(\d+)"/g, 'default local physical display ID');
  if (!/\bdisplayId 0,/.test(baseInfo) || !/\bstate ON,/.test(baseInfo) || !/\bcommittedState ON,/.test(baseInfo) || !/\btype INTERNAL,/.test(baseInfo))
    throw new Error('The logical default display is not a fully active internal display.');
  const deviceInfo = only(lines.filter(line => /^\s*DisplayDeviceInfo\{/.test(line) &&
    line.includes(`uniqueId="local:${physicalDisplayId}"`)), 'matching physical display device');
  if (!/\bstate ON,/.test(deviceInfo) || !/\bcommittedState ON,/.test(deviceInfo) || !/\btype INTERNAL,/.test(deviceInfo))
    throw new Error('The physical default display is not fully active or disagrees with the logical inventory.');
  const mapped = only(physicalDisplays.filter(display => display.physicalDisplayId === physicalDisplayId), 'matching SurfaceFlinger display ID');
  return {
    selectionRule: 'enabled_nontransitioning_logical_default_0_with_active_matching_physical_display',
    logicalDisplayId: '0', physicalDisplayId, hwcDisplayId: mapped.hwcDisplayId,
    physicalDisplays, logicalDisplayIds: logicalDisplays.map(display => display.id),
  };
}

export function explicitDisplayScreencapArgs(serial, selection) {
  if (!/^emulator-\d+$/.test(serial) || !/^\d+$/.test(selection?.physicalDisplayId || ''))
    throw new Error('Explicit display capture requires a verified serial and physical display ID.');
  return ['-s', serial, 'exec-out', 'screencap', '-p', '-d', selection.physicalDisplayId];
}
