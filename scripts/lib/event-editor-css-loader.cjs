const path = require("node:path");
const postcss = require("postcss");
module.exports = function transform(source) {
  const names = {};
  const prefix = path.basename(this.resourcePath).replace(/\W/g, "_");
  const css = postcss.parse(source);
  css.walkRules((rule) => {
    const globals = [];
    const selector = rule.selector.replace(/:global\(([^()]*)\)/g, (_, value) => {
      globals.push(value);
      return `__fixture_global_${globals.length - 1}__`;
    });
    rule.selector = selector.replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => {
      names[name] = `${prefix}_${name}`;
      return `.${names[name]}`;
    }).replace(/__fixture_global_(\d+)__/g, (_, index) => globals[Number(index)]);
  });
  return `const style=document.createElement('style');style.textContent=${JSON.stringify(css.toString())};document.head.append(style);export default ${JSON.stringify(names)};`;
};
