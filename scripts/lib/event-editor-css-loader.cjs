const path = require("node:path");
const postcss = require("postcss");
module.exports = function transform(source) {
  const names = {};
  const prefix = path.basename(this.resourcePath).replace(/\W/g, "_");
  const css = postcss.parse(source);
  css.walkRules((rule) => {
    rule.selector = rule.selector.replace(/\.([a-zA-Z_][\w-]*)/g, (_, name) => {
      names[name] = `${prefix}_${name}`;
      return `.${names[name]}`;
    });
  });
  return `const style=document.createElement('style');style.textContent=${JSON.stringify(css.toString())};document.head.append(style);export default ${JSON.stringify(names)};`;
};
