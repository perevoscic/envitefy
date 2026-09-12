import assert from "node:assert/strict";
import test from "node:test";
import { parseScoreStreamWidget } from "./scorestream.ts";

test("ScoreStream accepts supported embeds and retains only a canonical widget URL", () => {
  const expected = {
    widgetId: "5926",
    layout: "vert",
    url: "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=5926",
  };
  assert.deepEqual(parseScoreStreamWidget(expected.url), expected);
  assert.deepEqual(
    parseScoreStreamWidget(
      ' <iframe src="http://www.scorestream.com/widgets/scoreboards/vert?userWidgetId=5926&amp;unused=1" onload="alert(1)" style="height:9000px"></iframe> ',
    ),
    expected,
  );
  assert.deepEqual(
    parseScoreStreamWidget(
      "https://scorestream.com/widgets/scoreboards/horz/?userWidgetId=5933#extra",
    ),
    {
      widgetId: "5933",
      layout: "horz",
      url: "https://scorestream.com/widgets/scoreboards/horz?userWidgetId=5933",
    },
  );
});

test("ScoreStream rejects arbitrary destinations, profile links and malformed IDs", () => {
  for (const value of [
    undefined,
    null,
    {},
    5926,
    "",
    "5926",
    "x".repeat(4097),
    "javascript:alert(1)",
    "//scorestream.com/widgets/scoreboards/vert?userWidgetId=5926",
    "https://scorestream.com.evil.test/widgets/scoreboards/vert?userWidgetId=5926",
    "https://scorestream.com@evil.test/widgets/scoreboards/vert?userWidgetId=5926",
    "https://user:password@scorestream.com/widgets/scoreboards/vert?userWidgetId=5926",
    "https://scorestream.com:8443/widgets/scoreboards/vert?userWidgetId=5926",
    "https://scorestream.com/team/example-5926",
    "https://scorestream.com/widgets/scoreboards/vert",
    "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=0",
    "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=-1",
    "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=1.2",
    "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=5926&userWidgetId=5933",
    '<iframe src="https://evil.test/"></iframe>',
    '<iframe srcdoc="<script>alert(1)</script>"></iframe>',
    '<script src="https://scorestream.com/script.js"></script>',
  ])
    assert.equal(parseScoreStreamWidget(value), null, String(value));
});

test("ScoreStream reads its current widget container and discards all pasted markup", () => {
  const code =
    '<div class="scorestream-widget-container" data-ss_widget_type="vertScoreboard" style="height:600px;" data-user-widget-id="70302"></div><script async="async" type="text/javascript" src="https://scorestream.com/apiJsCdn/widgets/embed.js"></script>';
  assert.deepEqual(parseScoreStreamWidget(code), {
    widgetId: "70302",
    layout: "vert",
    url: "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=70302",
  });
  assert.equal(parseScoreStreamWidget(code.replace("70302", "0")), null);
  assert.equal(parseScoreStreamWidget(code.replace("vertScoreboard", "unsupported")), null);
  assert.equal(
    parseScoreStreamWidget(
      code.replace(
        'data-user-widget-id="70302"',
        'data-user-widget-id="70302" data-user-widget-id="70303"',
      ),
    ),
    null,
  );
  assert.equal(parseScoreStreamWidget(code.replace("</script>", "alert(1)</script>")), null);
  assert.equal(
    parseScoreStreamWidget(code.replace("</div>", '<img src="x" onerror="alert(1)"></div>')),
    null,
  );
  assert.equal(
    parseScoreStreamWidget(code.replace('style="height:600px;"', 'onload="alert(1)"')).url,
    "https://scorestream.com/widgets/scoreboards/vert?userWidgetId=70302",
  );
});
