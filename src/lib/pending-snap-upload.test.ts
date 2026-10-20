import { afterEach, expect, test } from "bun:test";
import { savePendingSnapUpload, takePendingSnapUpload, clearPendingSnapUpload } from "./pending-snap-upload";
const runtime = globalThis as typeof globalThis & { window?: Window };
const originalWindow = runtime.window;
afterEach(() => { if (originalWindow) runtime.window = originalWindow; else Reflect.deleteProperty(runtime, "window"); });

test("the same-tab fallback retains personal text without inventing an upload", async () => {
  runtime.window = {} as Window;
  await savePendingSnapUpload({ text: "Dental appointment October 25 at 10am", scanAttemptId: "private-text-1" });
  const pending = await takePendingSnapUpload();
  expect(pending?.text).toBe("Dental appointment October 25 at 10am");
  expect(pending?.file).toBeUndefined();
  expect(pending?.scanAttemptId).toBe("private-text-1");
  expect(await takePendingSnapUpload()).toBeNull();
});

test("real source files and host corrections survive transfer together and can be cleared", async () => {
  runtime.window = {} as Window;
  const file = new File(["private original"], "appointment.png", { type: "image/png" });
  await savePendingSnapUpload({ file, files: [file], text: "The appointment moved to 11am." });
  const pending = await takePendingSnapUpload();
  expect(pending?.file).toBe(file);
  expect(pending?.files?.[0]).toBe(file);
  expect(pending?.text).toBe("The appointment moved to 11am.");
  await savePendingSnapUpload({ text: "Private details" });
  await clearPendingSnapUpload();
  expect(await takePendingSnapUpload()).toBeNull();
});
