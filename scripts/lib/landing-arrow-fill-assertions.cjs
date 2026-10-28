const assert = require("node:assert/strict");

async function readArrowFill(cta) {
  return cta.evaluate((node) => {
    const label = node.querySelector("[data-arrow-fill-label]");
    const overlay = node.querySelector("[data-arrow-fill-label-overlay]");
    const surface = node.querySelector("[data-arrow-fill-surface]");
    const icon = node.querySelector("[data-arrow-fill-icon]");
    const bounds = node.getBoundingClientRect();
    const textBounds = (element) => {
      const range = document.createRange();
      range.selectNodeContents(element);
      const rect = range.getBoundingClientRect();
      return {
        left: rect.left - bounds.left,
        top: rect.top - bounds.top,
        width: rect.width,
        height: rect.height,
      };
    };
    const rgba = (value) => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 1;
      const context = canvas.getContext("2d");
      context.fillStyle = value;
      context.fillRect(0, 0, 1, 1);
      return Array.from(context.getImageData(0, 0, 1, 1).data);
    };
    return {
      marker: node.hasAttribute("data-arrow-fill-button"),
      tag: node.tagName,
      href: node.getAttribute("href"),
      label: label?.textContent,
      visibleLabels: node.querySelectorAll("[data-arrow-fill-label]:not([aria-hidden])").length,
      overlayHidden: overlay?.getAttribute("aria-hidden"),
      iconHidden: icon?.getAttribute("aria-hidden"),
      fill: rgba(getComputedStyle(surface).backgroundColor),
      overlayInk: rgba(getComputedStyle(overlay).webkitTextFillColor),
      arrowInk: rgba(getComputedStyle(icon.querySelector("svg")).color),
      labelBox: textBounds(label),
      overlayBox: textBounds(overlay),
      width: bounds.width,
      height: bounds.height,
      filled: ["top", "right", "bottom", "left"].every(
        (side) => Math.abs(Number.parseFloat(getComputedStyle(surface)[side])) < 0.1,
      ),
      focused: node.matches(":focus-visible"),
      activeInset: getComputedStyle(node).getPropertyValue("--arrow-fill-active-inset").trim(),
      transitions: [surface, overlay, ...icon.querySelectorAll("svg")].map(
        (element) => getComputedStyle(element).transitionDuration,
      ),
    };
  });
}

function contrast(first, second) {
  const luminance = (channels) =>
    channels.slice(0, 3).reduce((sum, channel, index) => {
      const value = channel / 255;
      return (
        sum +
        (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4) *
          [0.2126, 0.7152, 0.0722][index]
      );
    }, 0);
  const values = [luminance(first), luminance(second)].sort((a, b) => b - a);
  return (values[0] + 0.05) / (values[1] + 0.05);
}

async function assertArrowFillCta(cta, { label, href, description }) {
  assert.equal(await cta.count(), 1, `${description}: one accessible ${label} action`);
  const state = await readArrowFill(cta);
  assert.equal(state.marker, true, `${description}: shared login effect is present`);
  assert.equal(state.label, label, `${description}: preserve the complete label`);
  assert.equal(state.visibleLabels, 1, `${description}: expose the label once`);
  assert.equal(state.overlayHidden, "true", `${description}: decorative text stays hidden`);
  assert.equal(state.iconHidden, "true", `${description}: decorative arrows stay hidden`);
  if (href !== undefined) {
    assert.equal(state.tag, "A", `${description}: keep native navigation`);
    assert.equal(state.href, href, `${description}: preserve the exact destination`);
  }
  assert.ok(
    contrast(state.fill, state.overlayInk) >= 4.5,
    `${description}: hover label/fill contrast is at least 4.5:1 (${JSON.stringify(state)})`,
  );
  assert.ok(
    contrast(state.fill, state.arrowInk) >= 4.5,
    `${description}: arrow/fill contrast is at least 4.5:1 (${JSON.stringify(state)})`,
  );
  return state;
}

async function assertArrowFillInteraction(page, cta, description) {
  await cta.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  await cta.evaluate((node) => document.activeElement?.blur());
  const before = await readArrowFill(cta);
  await cta.hover();
  const waitForFill = () => cta.evaluate(
    (node) =>
      new Promise((resolve, reject) => {
        const surface = node.querySelector("[data-arrow-fill-surface]");
        const deadline = performance.now() + 2000;
        const check = () => {
          if (
            ["top", "right", "bottom", "left"].every(
              (side) => Math.abs(Number.parseFloat(getComputedStyle(surface)[side])) < 0.1,
            )
          ) {
            resolve();
          } else if (performance.now() > deadline) {
            reject(new Error("The CTA did not finish its interaction fill within 2 seconds"));
          } else {
            requestAnimationFrame(check);
          }
        };
        check();
      }),
  );
  await waitForFill();
  const hovered = await readArrowFill(cta);
  assert.equal(hovered.filled, true, `${description}: hover expands the circle over the button`);
  await page.mouse.move(0, 0);
  await page.keyboard.press("Tab");
  await cta.focus();
  await waitForFill();
  const focused = await readArrowFill(cta);
  assert.equal(focused.focused, true, `${description}: keyboard focus receives the same effect`);
  assert.equal(
    focused.activeInset,
    "0px 0px 0px 0px",
    `${description}: keyboard focus activates full fill without hover`,
  );
  assert.equal(focused.filled, true, `${description}: focus keeps the fill complete`);
  for (const key of ["left", "top", "width", "height"]) {
    assert.ok(
      Math.abs(before.labelBox[key] - hovered.labelBox[key]) < 0.75,
      `${description}: hover keeps label ${key} stable`,
    );
    assert.ok(
      Math.abs(before.labelBox[key] - focused.labelBox[key]) < 0.75,
      `${description}: focus keeps label ${key} stable`,
    );
    assert.ok(
      Math.abs(hovered.labelBox[key] - hovered.overlayBox[key]) < 0.75,
      `${description}: the hover label overlays the original ${key} (${JSON.stringify(hovered)})`,
    );
  }
}

async function assertArrowFillReducedMotion(page, cta, description) {
  await page.emulateMedia({ reducedMotion: "reduce" });
  const state = await readArrowFill(cta);
  assert.ok(
    state.transitions.every((duration) =>
      duration.split(",").every((value) => Number.parseFloat(value) <= 0.00001),
    ),
    `${description}: live reduced motion makes CTA transitions immediate (${state.transitions.join(", ")})`,
  );
}

module.exports = {
  assertArrowFillCta,
  assertArrowFillInteraction,
  assertArrowFillReducedMotion,
  contrast,
};
