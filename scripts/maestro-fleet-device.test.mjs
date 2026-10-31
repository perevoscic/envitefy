import assert from 'node:assert/strict';
import test from 'node:test';
import { explicitDisplayScreencapArgs, selectPrimaryCaptureDisplay } from './lib/maestro-display.mjs';
import { buildFleetEmulatorLaunch, parseFleetDeviceArgs } from './lib/maestro-fleet-launch.mjs';

test('only an explicit start flag requests a visible emulator', () => {
  for (const command of ['start', 'stop', 'inspect', 'screen']) {
    assert.deepEqual(parseFleetDeviceArgs([command, 'QA09']), { command, alias: 'QA09', visible: false });
    if (command !== 'start') assert.throws(() => parseFleetDeviceArgs([command, 'QA09', '--visible']), /start only/);
  }
  assert.deepEqual(parseFleetDeviceArgs(['start', 'QA09', '--visible']), { command: 'start', alias: 'QA09', visible: true });
  for (const args of [[], ['start', 'QA14'], ['start', 'QA09', '--visible', '--visible'],
    ['start', 'QA09', '--visible=true'], ['start', 'QA09', '--wipe-data'], ['start', '--visible', 'QA09']]) {
    assert.throws(() => parseFleetDeviceArgs(args), /Usage/);
  }
});

test('visible launch preserves the assigned device and userdata arguments', () => {
  const headless = buildFleetEmulatorLaunch('Envitefy_Fleet_QA09', 5576);
  const visible = buildFleetEmulatorLaunch('Envitefy_Fleet_QA09', 5576, true);
  assert.deepEqual(headless, {
    args: ['-avd', 'Envitefy_Fleet_QA09', '-port', '5576', '-memory', '3072', '-cores', '2',
      '-no-window', '-no-audio', '-no-snapshot', '-no-boot-anim', '-gpu', 'software', '-feature', '-Vulkan'],
    windowsHide: true,
  });
  assert.deepEqual(visible.args, headless.args.filter(arg => arg !== '-no-window'));
  assert.equal(visible.windowsHide, false);
  assert.ok(visible.args.includes('-no-snapshot'));
  assert.ok(!visible.args.includes('-wipe-data'));
});

// Reduced, non-account fixture from the QA03 Pixel Fold display inventories.
const inner = '4619827259835644672';
const outer = '4619827551948147201';
const ids = `Display ${inner} (HWC display 0): port=0 pnpId=GGL displayName="EMU_display_0"
Display ${outer} (HWC display 1): port=1 pnpId=GGL displayName="EMU_display_1"
`;
function details(primary = inner) {
  const inactive = primary === inner ? outer : inner;
  return `Display Devices: size=2
  DisplayDeviceInfo{"Built-in Screen": uniqueId="local:${primary}", type INTERNAL, state ON, committedState ON, FLAG_ALLOWED_TO_BE_DEFAULT_DISPLAY}
  DisplayDeviceInfo{"Built-in Screen": uniqueId="local:${inactive}", type INTERNAL, state OFF, committedState OFF, FLAG_ALLOWED_TO_BE_DEFAULT_DISPLAY}
LogicalDisplayMapper:
  Logical Displays: size=2
  Display 0:
    mDisplayId=0
    mIsEnabled=true
    mIsInTransition=false
    mBaseDisplayInfo=DisplayInfo{"Built-in Screen", displayId 0, state ON, committedState ON, type INTERNAL, uniqueId "local:${primary}"}
  Display 3:
    mDisplayId=3
    mIsEnabled=false
    mIsInTransition=false
    mBaseDisplayInfo=DisplayInfo{"Built-in Screen", displayId 3, state OFF, committedState OFF, type INTERNAL, uniqueId "local:${inactive}"}
  DeviceStateToLayoutMap:
    Registered Layouts:
Display Power Controller:
  mDisplayId=0
`;
}

test('unfolded and folded inventories select the active logical default, independent of enumeration order', () => {
  for (const primary of [inner, outer]) {
    for (const inventory of [ids, ids.trim().split('\n').reverse().join('\r\n') + '\r\n']) {
      const selected = selectPrimaryCaptureDisplay(inventory, details(primary));
      assert.equal(selected.logicalDisplayId, '0');
      assert.equal(selected.physicalDisplayId, primary);
      assert.equal(selected.hwcDisplayId, primary === inner ? '0' : '1');
      assert.deepEqual(explicitDisplayScreencapArgs('emulator-5564', selected),
        ['-s', 'emulator-5564', 'exec-out', 'screencap', '-p', '-d', primary]);
      assert.equal(typeof selected.physicalDisplayId, 'string');
      assert.notEqual(String(Number(primary)), primary, 'fixture demonstrates why IDs must not pass through Number');
    }
  }
});

test('disabled, transitioning, off or inconsistent default displays never fall back to the first panel', () => {
  for (const change of [
    value => value.replace('mIsEnabled=true', 'mIsEnabled=false'),
    value => value.replace('mIsInTransition=false', 'mIsInTransition=true'),
    value => value.replace('state ON, committedState ON', 'state OFF, committedState OFF'),
    value => value.replace('displayId 0, state ON', 'displayId 0, state OFF'),
    value => value.replace('displayId 0, state ON, committedState ON', 'displayId 0, state ON, committedState OFF'),
    value => value.replace(`uniqueId "local:${outer}"`, 'uniqueId "virtual:unknown"'),
  ]) assert.throws(() => selectPrimaryCaptureDisplay(ids, change(details(outer))), /display|default/i);
});

test('missing or duplicate logical and physical mappings fail closed', () => {
  assert.throws(() => selectPrimaryCaptureDisplay('', details()), /absent or ambiguous/);
  assert.throws(() => selectPrimaryCaptureDisplay(ids + ids.split('\n')[0] + '\n', details()), /ambiguous/);
  assert.throws(() => selectPrimaryCaptureDisplay(ids.split('\n')[1] + '\n', details()), /matching SurfaceFlinger/);
  assert.throws(() => selectPrimaryCaptureDisplay(ids, details().replace('Display 0:', 'Display 2:')), /logical default/);
  assert.throws(() => selectPrimaryCaptureDisplay(ids, details().replace('  Display 3:', '  Display 0:')), /logical default/);
  const duplicateDevice = details().split('\n')[1];
  assert.throws(() => selectPrimaryCaptureDisplay(ids, details() + duplicateDevice + '\n'), /matching physical/);
  assert.throws(() => selectPrimaryCaptureDisplay(ids, details().replace('mBaseDisplayInfo=', 'unknownBase=')), /base display/);
});

test('explicit capture cannot accept an absent ID or unverified serial', () => {
  assert.throws(() => explicitDisplayScreencapArgs('emulator-5564', {}), /verified serial and physical/);
  assert.throws(() => explicitDisplayScreencapArgs('arbitrary-device', { physicalDisplayId: inner }), /verified serial and physical/);
});
