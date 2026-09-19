import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const ios = path.join(root, "ios");
const app = JSON.parse(await readFile(path.join(ios, "app-store/app.json"), "utf8"));
const write = async (file, data) => {
  const target = path.join(ios, file);
  await mkdir(path.dirname(target), { recursive: true });
  await writeFile(target, data);
};
const json = (value) => `${JSON.stringify(value, null, 2)}\n`;

// Derivative of the approved existing icon; PNG is Apple's required asset-catalog format.
// This does not generate or replace any artwork and does not modify its colors/composition.
const iconFolder = "Envitefy/Assets.xcassets/AppIcon.appiconset";
await write(
  `${iconFolder}/Contents.json`,
  json({
    images: [{ filename: "AppIcon.png", idiom: "universal", platform: "ios", size: "1024x1024" }],
    info: { author: "xcode", version: 1 },
  }),
);
await sharp(path.join(root, "public/icons/icon-512.png"))
  .resize(1024, 1024)
  .flatten({ background: "#ffffff" })
  .removeAlpha()
  .png()
  .toFile(path.join(ios, iconFolder, "AppIcon.png"));
await write(
  "Envitefy/Assets.xcassets/Contents.json",
  json({ info: { author: "xcode", version: 1 } }),
);
await write(
  "Envitefy/Assets.xcassets/LaunchBackground.colorset/Contents.json",
  json({
    colors: [
      {
        idiom: "universal",
        color: {
          "color-space": "srgb",
          components: { alpha: "1.000", blue: "0.984", green: "0.973", red: "0.973" },
        },
      },
    ],
    info: { author: "xcode", version: 1 },
  }),
);

// Plain Xcode project: no CocoaPods, Capacitor server.url, package download or XcodeGen required.
const id = (name) =>
  createHash("sha256").update(`envitefy-ios:${name}`).digest("hex").slice(0, 24).toUpperCase();
const q = (value) => JSON.stringify(String(value));
const objects = [];
const add = (name, body) => {
  objects.push(`\t\t${id(name)} = { ${body} };`);
  return id(name);
};
const list = (names) => `(${names.map(id).join(", ")}${names.length ? "," : ""})`;
const sources = [
  "AppConfiguration.swift",
  "AuthenticationCoordinator.swift",
  "BrowserModel.swift",
  "ContentView.swift",
  "EnvitefyApp.swift",
];
const resources = ["Assets.xcassets", "PrivacyInfo.xcprivacy"];
for (const file of [...sources, ...resources, "Info.plist"]) {
  const type = file.endsWith(".swift")
    ? "sourcecode.swift"
    : file.endsWith(".xcassets")
      ? "folder.assetcatalog"
      : "text.plist.xml";
  add(
    file,
    `isa = PBXFileReference; lastKnownFileType = ${q(type)}; path = ${q(file)}; sourceTree = "<group>";`,
  );
  if (file !== "Info.plist") add(`build:${file}`, `isa = PBXBuildFile; fileRef = ${id(file)};`);
}
add(
  "test-file",
  `isa = PBXFileReference; lastKnownFileType = sourcecode.swift; path = AppConfigurationTests.swift; sourceTree = "<group>";`,
);
add("test-build", `isa = PBXBuildFile; fileRef = ${id("test-file")};`);
add(
  "app-product",
  "isa = PBXFileReference; explicitFileType = wrapper.application; includeInIndex = 0; path = Envitefy.app; sourceTree = BUILT_PRODUCTS_DIR;",
);
add(
  "test-product",
  "isa = PBXFileReference; explicitFileType = wrapper.cfbundle; includeInIndex = 0; path = EnvitefyTests.xctest; sourceTree = BUILT_PRODUCTS_DIR;",
);
add(
  "root-group",
  `isa = PBXGroup; children = ${list(["app-group", "test-group", "products"])}; sourceTree = "<group>";`,
);
add(
  "app-group",
  `isa = PBXGroup; children = ${list([...sources, ...resources, "Info.plist"])}; path = Envitefy; sourceTree = "<group>";`,
);
add(
  "test-group",
  `isa = PBXGroup; children = ${list(["test-file"])}; path = EnvitefyTests; sourceTree = "<group>";`,
);
add(
  "products",
  `isa = PBXGroup; children = ${list(["app-product", "test-product"])}; name = Products; sourceTree = "<group>";`,
);
for (const [name, isa, files] of [
  ["sources", "PBXSourcesBuildPhase", sources.map((f) => `build:${f}`)],
  ["resources", "PBXResourcesBuildPhase", resources.map((f) => `build:${f}`)],
  ["frameworks", "PBXFrameworksBuildPhase", []],
  ["test-sources", "PBXSourcesBuildPhase", ["test-build"]],
  ["test-frameworks", "PBXFrameworksBuildPhase", []],
]) {
  add(
    name,
    `isa = ${isa}; buildActionMask = 2147483647; files = ${list(files)}; runOnlyForDeploymentPostprocessing = 0;`,
  );
}
const settings = (data) =>
  `{ ${Object.entries(data)
    .map(([key, value]) => `${key} = ${q(value)};`)
    .join(" ")} }`;
for (const scope of ["project", "app", "test"]) {
  for (const mode of ["Debug", "Release"]) {
    const common = {
      IPHONEOS_DEPLOYMENT_TARGET: app.minimumIOS,
      SDKROOT: "iphoneos",
      SWIFT_VERSION: "5.0",
      CLANG_ENABLE_MODULES: "YES",
      SWIFT_OPTIMIZATION_LEVEL: mode === "Debug" ? "-Onone" : "-O",
      DEBUG_INFORMATION_FORMAT: mode === "Debug" ? "dwarf" : "dwarf-with-dsym",
    };
    const target = {
      CODE_SIGN_STYLE: "Automatic",
      DEVELOPMENT_TEAM: "",
      TARGETED_DEVICE_FAMILY: "1,2",
      PRODUCT_NAME: "$(TARGET_NAME)",
      MARKETING_VERSION: app.version,
      CURRENT_PROJECT_VERSION: app.build,
      LD_RUNPATH_SEARCH_PATHS: "$(inherited) @executable_path/Frameworks",
    };
    const values =
      scope === "project"
        ? { ...common, ENABLE_TESTABILITY: mode === "Debug" ? "YES" : "NO" }
        : scope === "app"
          ? {
              ...target,
              PRODUCT_BUNDLE_IDENTIFIER: app.bundleId,
              INFOPLIST_FILE: "Envitefy/Info.plist",
              ASSETCATALOG_COMPILER_APPICON_NAME: "AppIcon",
              ENABLE_PREVIEWS: "YES",
              SUPPORTS_MACCATALYST: "NO",
              SUPPORTS_XR_DESIGNED_FOR_IPHONE_IPAD: "NO",
              SWIFT_EMIT_LOC_STRINGS: "YES",
            }
          : {
              ...target,
              PRODUCT_BUNDLE_IDENTIFIER: `${app.bundleId}.tests`,
              GENERATE_INFOPLIST_FILE: "YES",
              TEST_HOST:
                "$(BUILT_PRODUCTS_DIR)/Envitefy.app/$(BUNDLE_EXECUTABLE_FOLDER_PATH)/Envitefy",
              BUNDLE_LOADER: "$(TEST_HOST)",
            };
    add(
      `${scope}-${mode}`,
      `isa = XCBuildConfiguration; buildSettings = ${settings(values)}; name = ${mode};`,
    );
  }
  add(
    `${scope}-configs`,
    `isa = XCConfigurationList; buildConfigurations = ${list([`${scope}-Debug`, `${scope}-Release`])}; defaultConfigurationIsVisible = 0; defaultConfigurationName = Release;`,
  );
}
add(
  "test-proxy",
  `isa = PBXContainerItemProxy; containerPortal = ${id("project")}; proxyType = 1; remoteGlobalIDString = ${id("app")}; remoteInfo = Envitefy;`,
);
add(
  "test-dependency",
  `isa = PBXTargetDependency; target = ${id("app")}; targetProxy = ${id("test-proxy")};`,
);
add(
  "app",
  `isa = PBXNativeTarget; buildConfigurationList = ${id("app-configs")}; buildPhases = ${list(["sources", "frameworks", "resources"])}; buildRules = (); dependencies = (); name = Envitefy; productName = Envitefy; productReference = ${id("app-product")}; productType = "com.apple.product-type.application";`,
);
add(
  "test",
  `isa = PBXNativeTarget; buildConfigurationList = ${id("test-configs")}; buildPhases = ${list(["test-sources", "test-frameworks"])}; buildRules = (); dependencies = ${list(["test-dependency"])}; name = EnvitefyTests; productName = EnvitefyTests; productReference = ${id("test-product")}; productType = "com.apple.product-type.bundle.unit-test";`,
);
add(
  "project",
  `isa = PBXProject; attributes = { BuildIndependentTargetsInParallel = YES; LastUpgradeCheck = 1600; TargetAttributes = { ${id("test")} = { TestTargetID = ${id("app")}; }; }; }; buildConfigurationList = ${id("project-configs")}; compatibilityVersion = "Xcode 14.0"; developmentRegion = en; hasScannedForEncodings = 0; knownRegions = (en, Base); mainGroup = ${id("root-group")}; productRefGroup = ${id("products")}; projectDirPath = ""; projectRoot = ""; targets = ${list(["app", "test"])};`,
);
await write(
  "Envitefy.xcodeproj/project.pbxproj",
  `// !$*UTF8*$!\n{\n\tarchiveVersion = 1;\n\tclasses = {};\n\tobjectVersion = 56;\n\tobjects = {\n${objects.join("\n")}\n\t};\n\trootObject = ${id("project")};\n}\n`,
);
const reference = (target, name) =>
  `<BuildableReference BuildableIdentifier="primary" BlueprintIdentifier="${id(target)}" BuildableName="${name}" BlueprintName="${target === "app" ? "Envitefy" : "EnvitefyTests"}" ReferencedContainer="container:Envitefy.xcodeproj"/>`;
await write(
  "Envitefy.xcodeproj/xcshareddata/xcschemes/Envitefy.xcscheme",
  `<?xml version="1.0" encoding="UTF-8"?>
<Scheme LastUpgradeVersion="1600" version="1.3">
  <BuildAction parallelizeBuildables="YES" buildImplicitDependencies="YES"><BuildActionEntries><BuildActionEntry buildForTesting="YES" buildForRunning="YES" buildForProfiling="YES" buildForArchiving="YES" buildForAnalyzing="YES">${reference("app", "Envitefy.app")}</BuildActionEntry></BuildActionEntries></BuildAction>
  <TestAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" shouldUseLaunchSchemeArgsEnv="YES"><Testables><TestableReference skipped="NO">${reference("test", "EnvitefyTests.xctest")}</TestableReference></Testables></TestAction>
  <LaunchAction buildConfiguration="Debug" selectedDebuggerIdentifier="Xcode.DebuggerFoundation.Debugger.LLDB" selectedLauncherIdentifier="Xcode.IDEFoundation.Launcher.LLDB" launchStyle="0" useCustomWorkingDirectory="NO" ignoresPersistentStateOnLaunch="NO" debugDocumentVersioning="YES" allowLocationSimulation="YES"><BuildableProductRunnable runnableDebuggingMode="0">${reference("app", "Envitefy.app")}</BuildableProductRunnable></LaunchAction>
  <ProfileAction buildConfiguration="Release" shouldUseLaunchSchemeArgsEnv="YES" savedToolIdentifier="" useCustomWorkingDirectory="NO" debugDocumentVersioning="YES"><BuildableProductRunnable runnableDebuggingMode="0">${reference("app", "Envitefy.app")}</BuildableProductRunnable></ProfileAction>
  <AnalyzeAction buildConfiguration="Debug"/><ArchiveAction buildConfiguration="Release" revealArchiveInOrganizer="YES"/>
</Scheme>
`,
);
for (const [field, name] of Object.entries({
  name: "name",
  subtitle: "subtitle",
  keywords: "keywords",
  promotionalText: "promotional_text",
  description: "description",
  whatsNew: "release_notes",
  supportUrl: "support_url",
  marketingUrl: "marketing_url",
  privacyPolicyUrl: "privacy_url",
})) {
  await write(`app-store/en-US/${name}.txt`, `${app[field]}\n`);
}
console.log(
  "Prepared iOS project, approved icon derivative and App Store metadata. No signing, build, registration or upload performed.",
);
