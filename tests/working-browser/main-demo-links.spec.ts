import { test, expect } from "@playwright/test";
import { readFileSync } from "node:fs";
import { withMainDemoLinks } from "../../scripts/main-demo-links.mjs";

test("main demo links stay visible and keep workspace navigation aligned", async ({ page }, info) => {
  const html = withMainDemoLinks(readFileSync("public-site/index.html", "utf8"));
  await page.route("**/__main-demo-links", (route) =>
    route.fulfill({ contentType: "text/html", body: html }),
  );
  await page.goto("./__main-demo-links");
  const links = page.getByRole("navigation", { name: "Public demos", exact: true });
  await expect(links).toBeVisible();
  await expect(links.getByRole("link", { name: "John — Frozen demo", exact: true }))
    .toHaveAttribute("href", "/slander/demo-shared-with-john/");
  await expect(links.getByRole("link", { name: "Working — Editable demo", exact: true }))
    .toHaveAttribute("href", "/slander/working/");
  await expect(page.locator(".ad-card")).toHaveCount(7);
  await page.getByLabel("Demo role").selectOption("admin");
  await expect(page.getByRole("heading", { name: "Campaigns.", exact: true })).toBeVisible();
  if (info.project.name === "mobile")
    await page.getByRole("button", { name: "Open navigation", exact: true }).click();
  await expect.poll(() => page.evaluate(() => {
    const bar = document.getElementById("brm-public-demo-links")!.getBoundingClientRect();
    const notice = document.querySelector(".public-notice")!.getBoundingClientRect();
    const sidebar = document.querySelector(".sidebar")!.getBoundingClientRect();
    return Math.max(Math.abs(bar.bottom - notice.top), Math.abs(notice.bottom - sidebar.top));
  })).toBeLessThanOrEqual(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  await page.screenshot({
    path: `test-results/working-preview/main-links-${info.project.name}.png`,
    fullPage: true,
  });
});
