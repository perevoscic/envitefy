import { defineConfig } from "playwright/test";

const baseURL = process.env.MOBILE_QA_BASE_URL || "http://localhost:3000";

const viewportProjects = [
  { name: "phone-320", width: 320, height: 568 },
  { name: "phone-360", width: 360, height: 800 },
  { name: "phone-390", width: 390, height: 844 },
  { name: "phone-430", width: 430, height: 932 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 },
];

export default defineConfig({
  testDir: "./tests/mobile",
  outputDir: "qa-artifacts/mobile-results",
  snapshotPathTemplate: "{testDir}/__screenshots__/{projectName}/{testFilePath}/{arg}{ext}",
  timeout: 45_000,
  expect: {
    timeout: 8_000,
    toHaveScreenshot: {
      animations: "disabled",
      caret: "hide",
      maxDiffPixelRatio: 0.012,
    },
  },
  fullyParallel: false,
  workers: process.env.CI ? 2 : 1,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [
    ["list"],
    ["html", { outputFolder: "qa-artifacts/mobile-report", open: "never" }],
  ],
  use: {
    baseURL,
    colorScheme: "light",
    locale: "en-US",
    contextOptions: { reducedMotion: "reduce" },
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    video: "retain-on-failure",
  },
  webServer:
    process.env.MOBILE_QA_SKIP_WEB_SERVER === "1"
      ? undefined
      : {
          command: "npm run dev",
          url: baseURL,
          timeout: 180_000,
          reuseExistingServer: true,
        },
  projects: viewportProjects.map(({ name, width, height }) => ({
    name,
    use: {
      browserName: "chromium" as const,
      viewport: { width, height },
      deviceScaleFactor: 1,
      isMobile: width < 768,
      hasTouch: width < 768,
    },
  })),
});
