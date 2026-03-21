import assert from "node:assert/strict";
import test from "node:test";

import { buildEventStartAtTsSql } from "./pg-event-start-ts";

test("buildEventStartAtTsSql anchors naive timestamps to UTC", () => {
  const sql = buildEventStartAtTsSql("event_start");

  assert.ok(
    sql.includes("event_start)::timestamp at time zone 'UTC'"),
    "naive date/time values should be anchored to UTC"
  );
  assert.ok(
    sql.includes("event_start)::timestamptz"),
    "timezone-aware timestamps should still cast directly"
  );
  assert.ok(
    sql.includes(
      "^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{1,2}:[0-9]{2}(:[0-9]{2}(\\.\\d{1,6})?)?$"
    ),
    "naive date/time values should be recognized without a timezone suffix"
  );
});
