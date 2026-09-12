import assert from "node:assert/strict";
import test from "node:test";
import {
  findScoreStreamState,
  SCORESTREAM_STATES,
  scoreStreamStateUrl,
} from "./scorestream-states.ts";

test("the statewide catalog covers all 50 states and D.C. with distinct saved widgets", () => {
  const expected =
    "AL AK AZ AR CA CO CT DE DC FL GA HI ID IL IN IA KS KY LA ME MD MA MI MN MS MO MT NE NV NH NJ NM NY NC ND OH OK OR PA RI SC SD TN TX UT VT VA WA WV WI WY".split(
      " ",
    );
  assert.deepEqual(SCORESTREAM_STATES.map((state) => state.code).sort(), expected.sort());
  assert.equal(new Set(SCORESTREAM_STATES.map((state) => state.widgetId)).size, 51);
  for (const state of SCORESTREAM_STATES) {
    assert.match(state.widgetId, /^[1-9]\d*$/);
    assert.equal(findScoreStreamState(scoreStreamStateUrl(state)), state);
  }
});

test("custom, invalid and banner widgets never acquire a guessed state", () => {
  assert.equal(findScoreStreamState(""), undefined);
  assert.equal(findScoreStreamState("https://evil.test/?userWidgetId=70302"), undefined);
  assert.equal(
    findScoreStreamState("https://scorestream.com/widgets/scoreboards/vert?userWidgetId=5926"),
    undefined,
  );
  assert.equal(
    findScoreStreamState("https://scorestream.com/widgets/scoreboards/horz?userWidgetId=70302"),
    undefined,
  );
  assert.equal(
    findScoreStreamState("https://scorestream.com/widgets/scoreboards/vert?userWidgetId=70302")
      ?.code,
    "AL",
  );
});
