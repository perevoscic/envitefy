import { afterEach, expect, test } from "bun:test";
import { createSourceDeps, isPublicSourceAddress, readCreateSource, readPublicCreateUrl } from "./read-source";
import sharp from "sharp";
import { classifyCreateSource } from "./classify-source";

const original = { ...createSourceDeps };
afterEach(() => Object.assign(createSourceDeps, original));
const signal = () => new AbortController().signal;
const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "white" } }).png().toBuffer();

test("rejects private, loopback, metadata and IPv4-mapped addresses", () => {
  for (const address of ["127.0.0.1", "10.1.2.3", "169.254.169.254", "172.16.1.2", "192.168.1.2", "100.64.0.1", "::1", "::ffff:127.0.0.1", "fc00::1", "fe80::1", "2001:db8::1"]) expect(isPublicSourceAddress(address)).toBe(false);
  expect(isPublicSourceAddress("8.8.8.8")).toBe(true);
  expect(isPublicSourceAddress("2606:4700:4700::1111")).toBe(true);
});

test("revalidates redirect destinations and never connects to a private redirect", async () => {
  const requested: string[] = [];
  createSourceDeps.lookup = async (host) => [{ address: host === "public.example" ? "8.8.8.8" : "127.0.0.1", family: 4 }];
  createSourceDeps.request = async (url, address) => {
    requested.push(`${url.hostname}:${address.address}`);
    return { status: 302, location: "http://internal.example/secret", mimeType: "", bytes: Buffer.alloc(0) };
  };
  await expect(readPublicCreateUrl("https://public.example/event", signal())).rejects.toThrow("public internet");
  expect(requested).toEqual(["public.example:8.8.8.8"]);
});

test("rejects hosts with any nonpublic DNS answer and credentials before transport", async () => {
  let connections = 0;
  createSourceDeps.lookup = async () => [{ address: "8.8.8.8", family: 4 }, { address: "10.0.0.1", family: 4 }];
  createSourceDeps.request = async () => { connections++; throw new Error("Should not connect"); };
  await expect(readPublicCreateUrl("https://public.example/event", signal())).rejects.toThrow("public internet");
  await expect(readPublicCreateUrl("https://user:password@public.example/event", signal())).rejects.toThrow("without a login");
  expect(connections).toBe(0);
});

test("mixed PDFs retain text-layer pages and OCR every missing page in order", async () => {
  createSourceDeps.pdfText = async () => ({ text: "Birthday celebration May 3 at Riverside Park", pageCount: 3, pages: [{ num: 1, text: "Birthday celebration May 3 at Riverside Park" }] });
  const rasterized: number[] = [];
  let readers = 0, disposed = 0;
  createSourceDeps.rasterizer = () => {
    readers++;
    return { rasterize: async (index) => { rasterized.push(index); return png; }, dispose: async () => { disposed++; } };
  };
  createSourceDeps.transcribe = async (images) => { expect(images).toHaveLength(2); return ["Arrive at 10 AM. Bring water.", "Return at 2 PM. No siblings."]; };
  const stages: string[] = [];
  const result = await readCreateSource({ files: [new File(["fake PDF"], "packet.pdf", { type: "application/pdf" })] }, signal(), { onStage: (stage) => stages.push(stage) });
  expect(result.text).toContain("Birthday celebration");
  expect(result.text).toContain("Page 2\nArrive at 10 AM");
  expect(result.text).toContain("Page 3\nReturn at 2 PM. No siblings.");
  expect(result.images).toHaveLength(3);
  expect(result.pages?.map(({ pageNumber, text }) => ({ pageNumber, text }))).toEqual([
    { pageNumber: 1, text: "Birthday celebration May 3 at Riverside Park" },
    { pageNumber: 2, text: "Arrive at 10 AM. Bring water." },
    { pageNumber: 3, text: "Return at 2 PM. No siblings." },
  ]);
  expect(result.usedOcr).toBe(true);
  expect(stages).toEqual(["reading", "transcribing"]);
  expect(readers).toBe(1);
  expect(disposed).toBe(1);
  expect(rasterized).toEqual([0, 1, 2]);
});

test("native PDF text keeps graphics and hidden links without an OCR request", async () => {
  createSourceDeps.pdfText = async () => ({
    text: "Gymnastics meet details and the complete event schedule", pageCount: 1,
    pages: [{ num: 1, text: "Gymnastics meet details and the complete event schedule" }],
    links: [{ url: "https://booking.example/rooms?group=meet#reserve", label: "Reserve rooms", contextText: "Host hotel", pageNumber: 1, source: "pdf_annotation" }],
  });
  createSourceDeps.rasterizer = () => ({ rasterize: async () => png, dispose: async () => {} });
  createSourceDeps.transcribe = async () => { throw new Error("Native text does not need transcription"); };
  const stages: string[] = [];
  const result = await readCreateSource({ files: [new File(["PDF"], "packet.pdf", { type: "application/pdf" })] }, signal(), { onStage: (stage) => stages.push(stage) });
  expect(result.images).toHaveLength(1);
  expect(result.pages?.[0].image).toBe(result.images[0]);
  expect(result.usedOcr).toBe(false);
  expect(result.links?.[0]).toMatchObject({ url: "https://booking.example/rooms?group=meet#reserve", label: "Reserve rooms", pageNumber: 1, contextText: "Host hotel" });
  expect(stages).toEqual(["reading"]);
});

test("PDF page failures release the shared reader and preserve the page error", async () => {
  createSourceDeps.pdfText = async () => ({ text: "", pageCount: 2, pages: [] });
  let disposed = false;
  createSourceDeps.rasterizer = () => ({ rasterize: async () => null, dispose: async () => { disposed = true; } });
  await expect(readCreateSource({ files: [new File(["PDF"], "packet.pdf", { type: "application/pdf" })] }, signal())).rejects.toThrow("PDF page 1 could not be read");
  expect(disposed).toBe(true);
});

test("links from multiple source files keep their combined page numbers", async () => {
  createSourceDeps.pdfText = async () => ({ text: "The full event schedule starts at 10 AM", pageCount: 1, pages: [{ num: 1, text: "The full event schedule starts at 10 AM" }], links: [{ url: "https://booking.example/reserve", label: null, pageNumber: 1, source: "pdf_annotation" }] });
  createSourceDeps.rasterizer = () => ({ rasterize: async () => png, dispose: async () => {} });
  const result = await readCreateSource({ files: [new File(["PDF1"], "one.pdf", { type: "application/pdf" }), new File(["PDF2"], "two.pdf", { type: "application/pdf" })] }, signal());
  expect(result.links?.map(({ pageNumber }) => pageNumber)).toEqual([1, 2]);
});

test("rejects over-budget PDF instead of dropping later pages", async () => {
  createSourceDeps.pdfText = async () => ({ text: "", pageCount: 21, pages: [] });
  await expect(readCreateSource({ files: [new File(["PDF"], "packet.pdf", { type: "application/pdf" })] }, signal())).rejects.toThrow("20 pages");
});

test("public HTML uses actual readable content and preserves destination links", async () => {
  createSourceDeps.lookup = async () => [{ address: "8.8.8.8", family: 4 }];
  createSourceDeps.request = async () => ({ status: 200, mimeType: "text/html", bytes: Buffer.from('<script>football schedule</script><h1>Maya Birthday</h1><p>May 3 at Riverside Park</p><a href="https://example.org/rsvp?guest=1">RSVP</a>') });
  const result = await readCreateSource({ url: "https://public.example/football", text: "Use blue." }, signal());
  expect(result.text).toContain("Maya Birthday");
  expect(result.text).not.toContain("football schedule");
  expect(result.text).toContain("https://example.org/rsvp?guest=1");
});

test("URL recognition reads page content instead of classifying misleading path words", async () => {
  createSourceDeps.lookup = async () => [{ address: "8.8.8.8", family: 4 }];
  createSourceDeps.request = async () => ({ status: 200, mimeType: "text/html", bytes: Buffer.from("<h1>Maya's 7th Birthday</h1><p>Celebrate May 3 at Riverside Park</p>") });
  const result = await classifyCreateSource({ text: "https://public.example/football-schedule" }, signal());
  expect(result.category).toBe("birthdays");
});

test("a login page with HTTP 200 is not converted into invented event details", async () => {
  createSourceDeps.lookup = async () => [{ address: "8.8.8.8", family: 4 }];
  createSourceDeps.request = async () => ({ status: 200, mimeType: "text/html", bytes: Buffer.from('<h1>Sign in to see this invitation</h1><input type="password" name="password">') });
  await expect(readCreateSource({ url: "https://public.example/private" }, signal())).rejects.toThrow("login or passcode");
});
