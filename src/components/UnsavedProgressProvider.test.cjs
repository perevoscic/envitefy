const assert = require("node:assert/strict");
const test = require("node:test");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

function eventProgress(save) {
  let readProgress;
  let savedRenders = 0;
  const navigation = {
    register(_id, read) { readProgress = read; return () => {}; },
    requestLeave() {},
    allowNavigation() {},
  };
  const hooks = {
    createContext: () => ({}),
    useCallback: (callback) => callback,
    useContext: () => navigation,
    useEffect() {},
    useLayoutEffect: (effect) => effect(),
    useMemo: (factory) => factory(),
    useRef: (value) => ({ current: value }),
    useState: (value) => [value, () => { savedRenders++; }],
  };
  const { useEventProgress } = loadTs("src/components/UnsavedProgressProvider.tsx", {
    react: hooks,
    "@radix-ui/react-dialog": {},
    "next/dist/shared/lib/app-router-context.shared-runtime": { AppRouterContext: {} },
  });
  // biome-ignore lint/correctness/useHookAtTopLevel: This lifecycle harness supplies synchronous hook stubs.
  useEventProgress({ snapshot: { title: "Unsaved event" }, initialDirty: true, save });
  return { save: () => readProgress().save(), savedRenders: () => savedRenders };
}

test("deferred account saves keep event progress dirty until the real save finishes", async () => {
  let finish;
  const beforeLeaving = new Promise((resolve) => { finish = resolve; });
  const progress = eventProgress(async () => ({ beforeLeaving }));
  const deferred = await progress.save();
  assert.equal(progress.savedRenders(), 0, "opening authentication must not mark edits saved");
  finish();
  await deferred.beforeLeaving;
  assert.equal(progress.savedRenders(), 1);
});

test("cancelled authentication and failed account saves preserve dirty event progress", async () => {
  let fail;
  const beforeLeaving = new Promise((_resolve, reject) => { fail = reject; });
  const progress = eventProgress(async () => ({ beforeLeaving }));
  const deferred = await progress.save();
  fail(new Error("Account creation cancelled"));
  await assert.rejects(deferred.beforeLeaving, /Account creation cancelled/);
  assert.equal(progress.savedRenders(), 0);
});

test("ordinary successful saves retain their immediate progress lifecycle", async () => {
  const progress = eventProgress(async () => {});
  assert.equal(await progress.save(), undefined);
  assert.equal(progress.savedRenders(), 1);
});
