import assert from "node:assert/strict";
import test from "node:test";
import { createScanOriginalCache } from "./original-cache.ts";

test("concurrent and later reads share one load but receive independent exact copies", async (t) => {
  const cache = createScanOriginalCache();
  t.after(() => cache.clear());
  let calls = 0;
  let finish;
  const load = () => {
    calls++;
    return new Promise((resolve) => {
      finish = resolve;
    });
  };
  const first = cache.read("source", load);
  const second = cache.read("source", load);
  await Promise.resolve();
  assert.equal(calls, 1);
  finish(Buffer.from("exact bytes"));
  const [a, b] = await Promise.all([first, second]);
  assert.deepEqual(a, b);
  a.fill(0);
  assert.equal(b.toString(), "exact bytes");
  assert.equal((await cache.read("source", load)).toString(), "exact bytes");
  assert.equal(calls, 1);
});

test("entries expire five minutes after loading even when accessed repeatedly", async (t) => {
  let time = 0;
  let calls = 0;
  const cache = createScanOriginalCache({ now: () => time });
  t.after(() => cache.clear());
  const load = async () => Buffer.from(String(++calls));
  assert.equal((await cache.read("source", load)).toString(), "1");
  time = 299_999;
  assert.equal((await cache.read("source", load)).toString(), "1");
  time = 300_000;
  assert.equal((await cache.read("source", load)).toString(), "2");
});

test("failed loads are not cached and retry can recover", async (t) => {
  const cache = createScanOriginalCache();
  t.after(() => cache.clear());
  let calls = 0;
  const load = async () => {
    if (++calls === 1) throw new Error("storage unavailable");
    return Buffer.from("recovered");
  };
  await assert.rejects(cache.read("source", load), /storage unavailable/);
  assert.equal((await cache.read("source", load)).toString(), "recovered");
  assert.equal(calls, 2);
});

test("byte budget evicts the least recently used file", async (t) => {
  const cache = createScanOriginalCache({ maxBytes: 6 });
  t.after(() => cache.clear());
  const counts = {};
  const read = (key) =>
    cache.read(key, async () => {
      counts[key] = (counts[key] || 0) + 1;
      return Buffer.from(key.repeat(3));
    });
  await read("a");
  await read("b");
  await read("a");
  await read("c");
  await read("a");
  assert.equal(counts.a, 1);
  await read("b");
  assert.equal(counts.b, 2);
});

test("oversized files are delivered exactly without being retained", async (t) => {
  const cache = createScanOriginalCache({ maxBytes: 3 });
  t.after(() => cache.clear());
  let calls = 0;
  const load = async () => {
    calls++;
    return Buffer.from("large file");
  };
  assert.equal((await cache.read("source", load)).toString(), "large file");
  assert.equal((await cache.read("source", load)).toString(), "large file");
  assert.equal(calls, 2);
});

test("entry count is bounded even for tiny files", async (t) => {
  const cache = createScanOriginalCache({ maxEntries: 1 });
  t.after(() => cache.clear());
  let calls = 0;
  const load = async () => {
    calls++;
    return Buffer.alloc(0);
  };
  await cache.read("a", load);
  await cache.read("b", load);
  await cache.read("a", load);
  assert.equal(calls, 3);
});

test("clearing memory while a load is pending prevents its late result being retained", async (t) => {
  const cache = createScanOriginalCache();
  t.after(() => cache.clear());
  let finish;
  const first = cache.read(
    "source",
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  await Promise.resolve();
  cache.clear();
  finish(Buffer.from("old bytes"));
  assert.equal((await first).toString(), "old bytes");
  assert.equal(
    (await cache.read("source", async () => Buffer.from("fresh bytes"))).toString(),
    "fresh bytes",
  );
});
