const assert = require("node:assert/strict");

module.exports = async function assertSharedGalleryBackground(page, samples, theme, width) {
  for (const key of ["page", "layout", "gallery"]) {
    assert.equal(samples[key].background, "rgba(0, 0, 0, 0)", `${theme}: ${key} exposes the dashboard canvas at ${width}px`);
  }
  const state = await page.locator('[data-project-gradient-background="true"]').evaluate((element) => {
    const style = getComputedStyle(element);
    const shell = element.closest('[data-app-main-content="true"]');
    const bounds = element.getBoundingClientRect();
    return {
      display: style.display,
      visibility: style.visibility,
      position: style.position,
      pointerEvents: style.pointerEvents,
      image: style.backgroundImage,
      shell: getComputedStyle(shell).backgroundColor,
      top: bounds.top,
      bottom: bounds.bottom,
      height: innerHeight,
    };
  });
  assert.equal(state.display, "block", `${theme}: gallery leaves the shared aurora visible`);
  assert.equal(state.visibility, "visible");
  assert.equal(state.position, "fixed");
  assert.equal(state.pointerEvents, "none");
  assert.match(state.image, /radial-gradient\(/);
  assert.equal(state.shell, "rgba(0, 0, 0, 0)");
  assert.equal(state.top, 0);
  assert.equal(state.bottom, state.height);
};
