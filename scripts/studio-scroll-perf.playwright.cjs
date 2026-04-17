#!/usr/bin/env node

const fs = require("node:fs");
const path = require("node:path");
const { chromium } = require("playwright");

const DEFAULT_BASE_URL = "http://127.0.0.1:3000";
const DEFAULT_ROUTE = "/studio";
const DEFAULT_OUTPUT_DIR = "qa-artifacts";
const DEFAULT_VIEWPORT = { width: 1440, height: 900 };

function parseArgs(argv) {
  const options = {
    baseUrl: DEFAULT_BASE_URL,
    route: DEFAULT_ROUTE,
    headed: false,
    outputDir: DEFAULT_OUTPUT_DIR,
    slowMo: 0,
    viewport: { ...DEFAULT_VIEWPORT },
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--base-url") {
      options.baseUrl = argv[index + 1] || options.baseUrl;
      index += 1;
      continue;
    }
    if (arg === "--route") {
      options.route = argv[index + 1] || options.route;
      index += 1;
      continue;
    }
    if (arg === "--output-dir") {
      options.outputDir = argv[index + 1] || options.outputDir;
      index += 1;
      continue;
    }
    if (arg === "--headed") {
      options.headed = true;
      continue;
    }
    if (arg === "--slow-mo") {
      options.slowMo = Number.parseInt(argv[index + 1] || "0", 10) || 0;
      index += 1;
      continue;
    }
    if (arg === "--viewport") {
      const value = argv[index + 1] || "";
      const [width, height] = value.split("x").map((part) => Number.parseInt(part, 10));
      if (Number.isFinite(width) && Number.isFinite(height)) {
        options.viewport = { width, height };
      }
      index += 1;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    }
  }

  return options;
}

function printHelp() {
  console.log(`
Usage:
  node scripts/studio-scroll-perf.playwright.cjs [options]

Options:
  --base-url <url>      Base URL to test. Default: ${DEFAULT_BASE_URL}
  --route <path>        Route to test. Default: ${DEFAULT_ROUTE}
  --output-dir <dir>    Where to write the JSON report. Default: ${DEFAULT_OUTPUT_DIR}
  --viewport <WxH>      Viewport, for example 1440x900.
  --headed              Run with a visible browser.
  --slow-mo <ms>        Slow actions for observation.
  --help                Show this message.
`);
}

function percentile(values, target) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(
    sorted.length - 1,
    Math.max(0, Math.ceil((target / 100) * sorted.length) - 1),
  );
  return sorted[index];
}

function round(value) {
  return Math.round(value * 100) / 100;
}

function summarizeFrameSamples(samples) {
  if (!samples.length) {
    return {
      sampleCount: 0,
      avgFrameMs: 0,
      p95FrameMs: 0,
      worstFrameMs: 0,
      over16ms: 0,
      over24ms: 0,
      over32ms: 0,
      over50ms: 0,
    };
  }

  const sum = samples.reduce((total, value) => total + value, 0);
  return {
    sampleCount: samples.length,
    avgFrameMs: round(sum / samples.length),
    p95FrameMs: round(percentile(samples, 95)),
    worstFrameMs: round(Math.max(...samples)),
    over16ms: samples.filter((value) => value > 16.7).length,
    over24ms: samples.filter((value) => value > 24).length,
    over32ms: samples.filter((value) => value > 32).length,
    over50ms: samples.filter((value) => value > 50).length,
  };
}

async function installObservers(page) {
  await page.addInitScript(() => {
    window.__studioPerf = {
      paints: {},
      lcp: 0,
      cls: 0,
      longTasks: [],
      sections: [],
      rafSamples: [],
      scrollRun: null,
    };

    const perf = window.__studioPerf;

    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        perf.paints[entry.name] = entry.startTime;
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });

    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      const last = entries[entries.length - 1];
      if (last) perf.lcp = last.startTime;
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (!entry.hadRecentInput) perf.cls += entry.value;
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    const longTaskObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        perf.longTasks.push({
          start: entry.startTime,
          duration: entry.duration,
        });
      }
    });
    longTaskObserver.observe({ type: "longtask", buffered: true });
  });
}

async function registerSectionObserver(page) {
  await page.evaluate(() => {
    const perf = window.__studioPerf;
    const sections = Array.from(document.querySelectorAll("main section"));
    const now = performance.now();

    perf.sections = sections.map((section, index) => {
      const heading = section.querySelector("h1, h2, h3");
      const bounds = section.getBoundingClientRect();
      const visible =
        bounds.top < window.innerHeight * 0.8 && bounds.bottom > window.innerHeight * 0.2;

      return {
        index,
        id: section.id || null,
        heading: heading?.textContent?.trim() || `Section ${index + 1}`,
        top: bounds.top + window.scrollY,
        imageCount: section.querySelectorAll("img").length,
        visibleAt: visible ? now : null,
      };
    });

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const index = Number(entry.target.getAttribute("data-studio-perf-section-index"));
          const item = perf.sections[index];
          if (item && item.visibleAt === null) {
            item.visibleAt = performance.now();
          }
        }
      },
      { threshold: 0.25 },
    );

    sections.forEach((section, index) => {
      section.setAttribute("data-studio-perf-section-index", String(index));
      observer.observe(section);
    });

    window.__studioPerfCleanup = () => observer.disconnect();
  });
}

async function startFrameMonitor(page) {
  await page.evaluate(() => {
    const perf = window.__studioPerf;
    perf.rafSamples = [];
    perf.scrollRun = {
      startedAt: performance.now(),
      endedAt: null,
    };

    let frameId = 0;
    let last = performance.now();

    const tick = (now) => {
      perf.rafSamples.push(now - last);
      last = now;
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);
    window.__stopStudioPerfRaf = () => {
      window.cancelAnimationFrame(frameId);
      perf.scrollRun.endedAt = performance.now();
      return perf.rafSamples.slice();
    };
  });
}

async function runScrollPass(page) {
  const scrollHeight = await page.evaluate(() =>
    Math.max(document.documentElement.scrollHeight - window.innerHeight, 0),
  );

  const targetSteps = 14;
  const stepSize = Math.max(400, Math.ceil(scrollHeight / targetSteps));

  for (let position = 0; position < scrollHeight; position += stepSize) {
    await page.mouse.wheel(0, stepSize);
    await page.waitForTimeout(140);
  }

  await page.waitForTimeout(900);
}

async function collectResults(page) {
  return page.evaluate(() => {
    const perf = window.__studioPerf;
    const navigation = performance.getEntriesByType("navigation")[0];
    const resources = performance.getEntriesByType("resource");
    const images = Array.from(document.images);

    const imageResources = resources.filter((entry) => entry.initiatorType === "img");
    const heavyImages = imageResources
      .map((entry) => ({
        name: entry.name,
        transferSize: entry.transferSize || 0,
        encodedBodySize: entry.encodedBodySize || 0,
        duration: entry.duration,
      }))
      .sort((a, b) => (b.encodedBodySize || b.transferSize) - (a.encodedBodySize || a.transferSize))
      .slice(0, 10);

    const byType = {};
    for (const entry of resources) {
      const key = entry.initiatorType || "other";
      if (!byType[key]) {
        byType[key] = { count: 0, encodedBodySize: 0, transferSize: 0 };
      }
      byType[key].count += 1;
      byType[key].encodedBodySize += entry.encodedBodySize || 0;
      byType[key].transferSize += entry.transferSize || 0;
    }

    return {
      title: document.title,
      navigation: navigation
        ? {
            domContentLoadedMs: navigation.domContentLoadedEventEnd,
            loadEventMs: navigation.loadEventEnd,
            responseEndMs: navigation.responseEnd,
          }
        : null,
      webVitals: {
        firstContentfulPaintMs: perf.paints["first-contentful-paint"] || 0,
        largestContentfulPaintMs: perf.lcp || 0,
        cumulativeLayoutShift: perf.cls || 0,
      },
      longTasks: {
        count: perf.longTasks.length,
        totalDurationMs: perf.longTasks.reduce((total, task) => total + task.duration, 0),
        worstTaskMs: perf.longTasks.reduce((worst, task) => Math.max(worst, task.duration), 0),
      },
      scrollRun: perf.scrollRun,
      sections: perf.sections,
      images: {
        domCount: images.length,
        eagerCount: images.filter((image) => image.loading !== "lazy").length,
        lazyCount: images.filter((image) => image.loading === "lazy").length,
        completeCount: images.filter((image) => image.complete).length,
      },
      resources: {
        totalCount: resources.length,
        imageCount: imageResources.length,
        totalEncodedBodySize: resources.reduce(
          (total, entry) => total + (entry.encodedBodySize || 0),
          0,
        ),
        imageEncodedBodySize: imageResources.reduce(
          (total, entry) => total + (entry.encodedBodySize || 0),
          0,
        ),
        byType,
        heavyImages,
      },
    };
  });
}

async function main() {
  const options = parseArgs(process.argv.slice(2));
  const browser = await chromium.launch({
    headless: !options.headed,
    slowMo: options.slowMo,
  });
  const context = await browser.newContext({
    viewport: options.viewport,
  });
  const page = await context.newPage();

  try {
    await installObservers(page);

    const url = new URL(options.route, options.baseUrl).toString();
    const startedAt = new Date().toISOString();
    await page.goto(url, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await registerSectionObserver(page);
    await startFrameMonitor(page);
    await runScrollPass(page);
    const rafSamples = await page.evaluate(() => window.__stopStudioPerfRaf());
    const metrics = await collectResults(page);
    await page.evaluate(() => {
      if (typeof window.__studioPerfCleanup === "function") {
        window.__studioPerfCleanup();
      }
    });

    const report = {
      startedAt,
      finishedAt: new Date().toISOString(),
      url,
      viewport: options.viewport,
      frameSummary: summarizeFrameSamples(rafSamples),
      metrics: {
        ...metrics,
        longTasks: {
          ...metrics.longTasks,
          totalDurationMs: round(metrics.longTasks.totalDurationMs),
          worstTaskMs: round(metrics.longTasks.worstTaskMs),
        },
        webVitals: {
          firstContentfulPaintMs: round(metrics.webVitals.firstContentfulPaintMs),
          largestContentfulPaintMs: round(metrics.webVitals.largestContentfulPaintMs),
          cumulativeLayoutShift: round(metrics.webVitals.cumulativeLayoutShift),
        },
        navigation: metrics.navigation
          ? {
              domContentLoadedMs: round(metrics.navigation.domContentLoadedMs),
              loadEventMs: round(metrics.navigation.loadEventMs),
              responseEndMs: round(metrics.navigation.responseEndMs),
            }
          : null,
        sections: metrics.sections.map((section) => ({
          ...section,
          visibleAtMs: section.visibleAt === null ? null : round(section.visibleAt),
        })),
        resources: {
          ...metrics.resources,
          totalEncodedBodySizeKb: round(metrics.resources.totalEncodedBodySize / 1024),
          imageEncodedBodySizeKb: round(metrics.resources.imageEncodedBodySize / 1024),
          heavyImages: metrics.resources.heavyImages.map((image) => ({
            ...image,
            encodedBodySizeKb: round(image.encodedBodySize / 1024),
            transferSizeKb: round(image.transferSize / 1024),
            durationMs: round(image.duration),
          })),
        },
      },
    };

    fs.mkdirSync(options.outputDir, { recursive: true });
    const safeTimestamp = startedAt.replace(/[:.]/g, "-");
    const outputPath = path.join(options.outputDir, `studio-scroll-perf-${safeTimestamp}.json`);
    fs.writeFileSync(outputPath, `${JSON.stringify(report, null, 2)}\n`, "utf8");

    console.log(`Wrote studio perf report to ${outputPath}`);
    console.log(JSON.stringify(report, null, 2));
  } finally {
    await context.close();
    await browser.close();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.stack || error.message : String(error));
  process.exit(1);
});
