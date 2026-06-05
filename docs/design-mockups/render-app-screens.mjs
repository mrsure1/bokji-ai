import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { chromium } from "playwright";

const root = resolve(process.cwd(), "docs", "design-mockups");
const htmlPath = resolve(root, "app-screens.html");
const outputDir = resolve(root, "screenshots");
const names = ["chat", "saved", "noti", "profile"];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({ headless: true });
const page = await browser.newPage({
  viewport: { width: 2080, height: 1200 },
  deviceScaleFactor: 2,
});

await page.goto(pathToFileURL(htmlPath).href, { waitUntil: "networkidle" });
await page.waitForTimeout(1200);

await page.screenshot({ path: resolve(outputDir, "app-screens-all.png"), fullPage: true });

// Expand each phone to fit its full content for clean per-screen captures.
await page.evaluate(() => {
  document.querySelectorAll(".phone").forEach((p) => (p.style.height = "auto"));
  document.querySelectorAll(".screen").forEach((s) => (s.style.height = "auto"));
  document.querySelectorAll(".body").forEach((b) => {
    b.style.overflow = "visible";
    b.style.flex = "none";
  });
});
await page.waitForTimeout(300);

const phones = await page.locator(".phone").all();
for (let i = 0; i < phones.length; i += 1) {
  await phones[i].screenshot({ path: resolve(outputDir, `app-screen-${names[i]}.png`) });
}

await browser.close();
console.log(`Rendered ${phones.length} app screens to ${outputDir}`);
