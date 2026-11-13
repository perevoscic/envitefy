const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const webpackRuntime = require("next/dist/compiled/webpack/webpack");
webpackRuntime.init();

test("development excludes the production CSS manifest from both watch graphs while production keeps its resource links", { timeout: 60000 }, async () => {
  const output = path.resolve("output/runtime-style-watch");
  fs.mkdirSync(output, { recursive: true });
  const mock = path.join(output, "routing.ts");
  fs.writeFileSync(mock, 'export function usePathname(){return "/"} export function useSession(){return {status:"unauthenticated"}} export async function headers(){return {get:()=>"landing"}}');
  const manifestPath = path.resolve("src/generated/runtime-styles.json");
  const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  for (const environment of ["development", "production"]) {
    const directory = path.join(output, environment);
    const compiler = webpackRuntime.webpack({
      mode: "none", target: "node", devtool: false,
      entry: {
        server: path.resolve("src/components/RuntimeStyles.tsx"),
        boundary: path.resolve("src/components/RuntimeStyleBoundary.tsx"),
      },
      output: { path: directory, filename: "[name].cjs", library: { type: "commonjs2" } },
      plugins: [new webpackRuntime.webpack.DefinePlugin({ "process.env.NODE_ENV": JSON.stringify(environment) })],
      externals: { react: "commonjs react", "react/jsx-runtime": "commonjs react/jsx-runtime" },
      resolve: { extensions: [".tsx", ".ts", ".js", ".json"], alias: {
        "next/navigation": mock, "next-auth/react": mock, "next/headers": mock, "@": path.resolve("src"),
      } },
      module: { rules: [{ test: /\.[jt]sx?$/, exclude: /node_modules/, use: path.resolve("scripts/lib/create-guest-ts-loader.cjs") }] },
    });
    const stats = await new Promise((resolve, reject) => {
      compiler.run((error, stats) => compiler.close(() => error || stats.hasErrors()
        ? reject(error || new Error(stats.toString({ all: false, errors: true }))) : resolve(stats)));
    });
    assert.equal(stats.compilation.fileDependencies.has(manifestPath), environment === "production",
      `${environment}: production manifest membership in webpack's watched dependencies`);
    const serverFile = path.join(directory, "server.cjs");
    const boundaryFile = path.join(directory, "boundary.cjs");
    delete require.cache[serverFile];
    delete require.cache[boundaryFile];
    const server = await require(serverFile).default();
    const boundary = require(boundaryFile).default({ children: "Page controls" });
    if (environment === "development") {
      assert.equal(server, null);
      assert.equal(boundary, "Page controls");
    } else {
      assert.equal(server.props.href, manifest.landing.href);
      assert.equal(boundary.props.children[0].props.href, manifest.landing.href);
      assert.equal(boundary.props.children[1], "Page controls");
    }
  }
});
