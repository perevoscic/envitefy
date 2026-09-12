const assert = require("node:assert/strict");
const fs = require("node:fs");
const test = require("node:test");
const ts = require("typescript");

const code = ts.transpileModule(fs.readFileSync(`${__dirname}/InlineEditableText.tsx`, "utf8"), {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    jsx: ts.JsxEmit.ReactJSX,
    esModuleInterop: true,
  },
}).outputText;

function editor(value, multiline = false) {
  const slots = [];
  const changes = [];
  let cursor = 0;
  const hooks = {
    useState(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (next) => {
          slots[index] = next;
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      if (!(index in slots)) slots[index] = { current: initial };
      return slots[index];
    },
    useEffect() {},
  };
  const module = { exports: {} };
  new Function("require", "module", "exports", "requestAnimationFrame", code)(
    (name) =>
      name === "react"
        ? hooks
        : name === "lucide-react"
          ? {}
          : name.endsWith(".css")
            ? {}
            : require(name),
    module,
    module.exports,
    (callback) => callback(),
  );
  const props = {
    label: "Welcome message",
    value,
    fallback: "Welcome to the meet",
    multiline,
    onChange(next) {
      changes.push(next);
      props.value = next;
    },
  };
  const render = () => {
    cursor = 0;
    return module.exports.default(props);
  };
  const flatten = (node) =>
    !node || typeof node !== "object"
      ? []
      : [node, ...[node.props?.children].flat().flatMap(flatten)];
  const control = (label) => flatten(render()).find((node) => node.props?.["aria-label"] === label);
  const open = () => control("Edit welcome message").props.onClick();
  const input = () => control("Welcome message");
  const type = (text) => input().props.onChange({ target: { value: text } });
  return { props, changes, render, control, open, input, type };
}

test("typing updates memory, Done commits and Cancel restores the exact prior override", () => {
  const h = editor("Original");
  h.open();
  assert.equal(h.input().props.value, "Original");
  h.type("New wording");
  assert.equal(h.props.value, "New wording");
  h.control("Done editing welcome message").props.onClick();
  assert.ok(h.control("Edit welcome message"));
  h.open();
  h.type("Discard this");
  h.control("Cancel editing welcome message").props.onClick();
  assert.equal(h.props.value, "New wording");
});

test("Cancel preserves default inheritance, empty values hide text, and Reset restores the default", () => {
  const h = editor(undefined);
  h.open();
  h.type("Temporary");
  h.control("Cancel editing welcome message").props.onClick();
  assert.equal(h.props.value, undefined);
  h.open();
  h.type("");
  h.control("Done editing welcome message").props.onClick();
  assert.equal(h.props.value, "");
  h.open();
  h.control("Reset welcome message to template wording").props.onClick();
  assert.equal(h.props.value, undefined);
  h.props.onChange = undefined;
  assert.equal(h.render(), "Welcome to the meet");
  h.props.value = "";
  assert.equal(h.render(), "");
});

test("multiline copy keeps Enter for new lines and Escape cancels without closing the parent", () => {
  const h = editor("First line", true);
  h.open();
  assert.equal(h.input().type, "textarea");
  let prevented = 0;
  let stopped = 0;
  const key = (value) => ({
    key: value,
    nativeEvent: { isComposing: false },
    preventDefault() {
      prevented++;
    },
    stopPropagation() {
      stopped++;
    },
  });
  h.input().props.onKeyDown(key("Enter"));
  assert.ok(h.input());
  assert.equal(prevented, 0);
  h.type("First line\nSecond line");
  h.input().props.onKeyDown(key("Escape"));
  assert.equal(h.props.value, "First line");
  assert.equal(prevented, 1);
  assert.equal(stopped, 1);
});

test("editing a control caption does not invoke its action and guest rendering retains the action", () => {
  const React = require("react");
  const h = editor(undefined);
  let submitted = 0;
  h.props.renderText = text => React.createElement("button", { "aria-label": "Submit RSVP", onClick: () => submitted++ }, text);
  h.open();
  h.type("Count me in");
  h.control("Done editing welcome message").props.onClick();
  assert.equal(submitted, 0);
  assert.equal(h.control("Submit RSVP").props.children, "Count me in");
  h.props.onChange = undefined;
  const guest = h.render();
  assert.equal(guest.type, "button");
  guest.props.onClick();
  assert.equal(submitted, 1);
});
