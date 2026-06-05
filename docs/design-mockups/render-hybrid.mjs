import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = resolve(process.cwd(), "docs", "design-mockups");
const htmlPath = resolve(root, "home-hybrid.html");
const outputDir = resolve(root, "screenshots");

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 1120, height: 1000 },
  deviceScaleFactor: 2,
});

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.screenshot({ path: resolve(outputDir, "home-hybrid-full.png"), fullPage: true });
await page.locator(".phone").screenshot({ path: resolve(outputDir, "home-hybrid-phone.png") });

// Expanded capture: let the phone grow to fit all content so the whole screen shows in one image.
await page.evaluate(() => {
  document.querySelector(".phone").style.height = "auto";
  document.querySelector(".screen").style.height = "auto";
  const b = document.querySelector(".body");
  b.style.overflow = "visible";
  b.style.flex = "none";
  b.style.paddingBottom = "20px";
});
await page.waitForTimeout(300);
await page.locator(".phone").screenshot({ path: resolve(outputDir, "home-hybrid-tall.png") });

await browser.close();
console.log(`Rendered hybrid mockup to ${outputDir}`);
