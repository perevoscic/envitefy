const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

const code = ts.transpileModule(readFileSync(`${__dirname}/HeroImageEditor.tsx`, "utf8"), {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;

function pickerHarness({ readError = false, decodeError = false } = {}) {
  const states = [];
  const changes = [];
  let chooserCount = 0;
  const hooks = {
    useRef: () => ({ current: { click: () => chooserCount++ } }),
    useState: (initial) => {
      const index = states.push(initial) - 1;
      return [
        initial,
        (value) => {
          states[index] = value;
        },
      ];
    },
  };
  class FileReader {
    readAsDataURL(file) {
      if (readError) this.onerror();
      else {
        this.result = `data:${file.type};base64,aW1hZ2U=`;
        this.onload();
      }
    }
  }
  class Image {
    set src(value) {
      if (decodeError) this.onerror();
      else this.onload();
    }
  }
  const module = { exports: {} };
  new Function("require", "module", "exports", "FileReader", "window", code)(
    (name) => (name === "react" ? hooks : name === "lucide-react" || name === "./HeroImageAdjustments" ? {} : require(name)),
    module,
    module.exports,
    FileReader,
    { Image },
  );
  // biome-ignore lint/correctness/useHookAtTopLevel: The test injects state/ref doubles and does not invoke React's dispatcher.
  const picker = module.exports.useHeroImagePicker((image) => changes.push(image));
  return {
    picker,
    changes,
    states,
    chooserCount: () => chooserCount,
    editor: (props) => module.exports.default({ onChange: (image) => changes.push(image), ...props }),
    choose: async (file) => {
      const target = { files: file ? [file] : [], value: file ? file.name : "" };
      await picker.input.props.onChange({ target });
      assert.equal(target.value, "", "The same file can be selected again");
    },
  };
}

test("opening the chooser and canceling do not replace the current image", async () => {
  const h = pickerHarness();
  h.picker.open();
  assert.equal(h.chooserCount(), 1);
  assert.deepEqual(h.changes, []);
  await h.choose();
  assert.deepEqual(h.changes, []);
});

test("a valid selection applies immediately as an in-memory data URL", async () => {
  for (const type of ["image/jpeg", "image/png", "image/webp", "image/avif"]) {
    const h = pickerHarness();
    await h.choose({ name: "photo", type, size: 1024 });
    assert.deepEqual(h.changes, [`data:${type};base64,aW1hZ2U=`]);
    assert.deepEqual(h.states, [false, ""]);
  }
});

test("unsupported or oversized files keep the current image and explain the problem", async () => {
  for (const file of [
    { name: "file.pdf", type: "application/pdf", size: 1024 },
    { name: "huge.png", type: "image/png", size: 20 * 1024 * 1024 + 1 },
  ]) {
    const h = pickerHarness();
    await h.choose(file);
    assert.deepEqual(h.changes, []);
    assert.match(h.states[1], /Choose a JPG, PNG, WebP, or AVIF/);
    assert.equal(h.states[0], false);
  }
});

test("the inline filter switch toggles without opening a chooser or changing the original image", () => {
  const h = pickerHarness();
  const values = [];
  const findSwitch = (node) => {
    if (!node || typeof node !== "object") return null;
    if (node.props?.role === "switch") return node;
    const children = node.props?.children;
    return (Array.isArray(children) ? children : [children]).map(findSwitch).find(Boolean);
  };
  const on = findSwitch(h.editor({ onFilterChange: (enabled) => values.push(enabled) }));
  assert.equal(on.props["aria-checked"], true);
  on.props.onClick();
  const off = findSwitch(h.editor({ filterEnabled: false, onFilterChange: (enabled) => values.push(enabled) }));
  assert.equal(off.props["aria-checked"], false);
  off.props.onClick();
  assert.deepEqual(values, [false, true]);
  assert.equal(h.chooserCount(), 0);
  assert.deepEqual(h.changes, []);
});

test("unreadable or corrupt image files keep the previous image", async () => {
  for (const options of [{ readError: true }, { decodeError: true }]) {
    const h = pickerHarness(options);
    await h.choose({ name: "photo.png", type: "image/png", size: 1024 });
    assert.deepEqual(h.changes, []);
    assert.match(h.states[1], /Unable to read|could not be decoded/);
    assert.equal(h.states[0], false);
  }
});
