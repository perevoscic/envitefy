const assert = require("node:assert/strict");
const test = require("node:test");
const { NextResponse } = require("next/server");
const loadTs = require("../../scripts/lib/event-messages-test-loader.cjs");

test("sports attendance rejects disabled RSVPs before changing the roster", async () => {
  for (const settings of [{ rsvpEnabled: false }, { rsvp: { isEnabled: false } }]) {
    let writes = 0;
    const route = loadTs("src/app/api/rsvp/attendance/route.ts", {
      "next/server": { NextResponse },
      "next-auth": { getServerSession: async () => null },
      "@/lib/auth": { authOptions: {}, resolveSessionUserId: async () => null },
      "@/lib/history-cache": { invalidateUserHistory() {} },
      "@/lib/dashboard-cache": { invalidateUserDashboard() {} },
      "@/lib/db": {
        getEventHistoryById: async () => ({ id: "meet", user_id: "owner", data: { status: "published", ...settings } }),
        updateEventHistoryData: async () => { writes++; },
      },
    });
    const result = await route.POST(new Request("https://envitefy.test/api/rsvp/attendance", {
      method: "POST", body: JSON.stringify({ eventId: "meet", status: "going", athleteName: "Taylor" }),
    }));
    assert.equal(result.status, 403);
    assert.equal(writes, 0);
  }
});
