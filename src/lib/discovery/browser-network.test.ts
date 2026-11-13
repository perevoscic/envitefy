import { afterEach, expect, test } from "bun:test";
import { collectDiscoveryBrowserData, fulfillPublicDiscoveryRequest } from "@/lib/discovery-browser";
import { createSourceDeps } from "@/lib/create/read-source";

const original = { ...createSourceDeps };
afterEach(() => Object.assign(createSourceDeps, original));

test("browser scripts and linked resources are fulfilled through the pinned public transport", async () => {
  createSourceDeps.lookup = async () => [{ address: "8.8.8.8", family: 4 }];
  createSourceDeps.request = async (_url, address) => {
    expect(address.address).toBe("8.8.8.8");
    return { status: 200, mimeType: "text/javascript", bytes: Buffer.from("window.readOnlyEvent = true;") };
  };
  let fulfilled: any;
  await fulfillPublicDiscoveryRequest({
    request: () => ({ method: () => "GET", url: () => "https://public.example/app.js" }),
    abort: async () => { throw new Error("Unexpected abort"); },
    fulfill: async (response) => { fulfilled = response; },
  });
  expect(fulfilled.headers["content-type"]).toBe("text/javascript");
  expect(fulfilled.body.toString()).toContain("readOnlyEvent");
});

test("private browser subresources and mutating requests are aborted without a connection", async () => {
  let connections = 0, aborted = 0;
  createSourceDeps.request = async () => { connections++; throw new Error("Should not connect"); };
  for (const [method, url] of [["GET", "http://169.254.169.254/latest/meta-data/"], ["POST", "https://public.example/submit"]]) {
    await fulfillPublicDiscoveryRequest({
      request: () => ({ method: () => method, url: () => url }),
      abort: async () => { aborted++; },
      fulfill: async () => { throw new Error("Must not fulfill unsafe source"); },
    });
  }
  expect(aborted).toBe(2);
  expect(connections).toBe(0);
});

test("browser discovery never opens another meet and blocks a same-event link redirecting there", async () => {
  const root = "https://calendar.example/meets/riverside-invitational/2027";
  const other = "https://calendar.example/meets/presidential-classic/2027";
  const child = `${root}/details`;
  const requests: string[] = [];
  createSourceDeps.lookup = async () => [{ address: "8.8.8.8", family: 4 }];
  createSourceDeps.request = async (url) => {
    const target = url.toString();
    requests.push(target);
    if (target === child) return { status: 302, mimeType: "text/html", bytes: Buffer.alloc(0), location: other };
    return { status: 200, mimeType: "text/html", bytes: Buffer.from(`<title>Riverside Invitational 2027</title><main><h1>Riverside Invitational 2027</h1><a href="${other}">Presidential Classic January 15-17 Hotels</a><a href="${child}">Meet details</a></main>`) };
  };
  const result = await collectDiscoveryBrowserData(root, { timeoutMs: 1000, maxChildPages: 2 });
  expect(requests).toContain(root);
  expect(requests).not.toContain(other);
  expect(result.pages.some((page) => page.url === other)).toBe(false);
  expect(result.candidates.some((candidate) => candidate.url === other)).toBe(false);
});
