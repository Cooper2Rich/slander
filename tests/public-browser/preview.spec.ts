import { test, expect } from "@playwright/test";

test("public preview works without an API server and persists only browser sample data", async ({
  page,
  context,
}, info) => {
  const errors: string[] = [],
    apiRequests: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (req) => {
    if (new URL(req.url()).pathname.startsWith("/api/"))
      apiRequests.push(req.url());
  });
  await page.goto("./");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "A little louder for living rivers",
      }),
    })
    .click();
  await expect(page.locator(".campaign-cover")).toBeVisible();
  expect(
    await page
      .locator(".campaign-cover")
      .evaluate((img) => (img as HTMLImageElement).naturalWidth),
  ).toBeGreaterThan(0);
  await page
    .getByRole("button", { name: "Accept campaign terms", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Submit sample creative", exact: true })
    .click();
  await expect(
    page.getByText("Automatically eligible", { exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Create tracked giving link" })
    .click();
  await page.getByRole("link", { name: "Open tracked giving page" }).click();
  await page.getByRole("button", { name: "Confirm simulated gift" }).click();
  await expect(page.getByText("$100.00", { exact: true })).toBeVisible();
  await expect(page.getByText("$10.00", { exact: true })).toBeVisible();
  await expect(page.getByText("$90.00", { exact: true })).toBeVisible();
  await expect(page.getByText("+1", { exact: true })).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/public-${info.project.name}-gift.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Return to campaign" }).click();
  await page.getByLabel("Demo role").selectOption("nonprofit");
  await page.getByRole("tab", { name: "Funding" }).click();
  await expect(page.getByText("$600.00", { exact: true })).toBeVisible();
  await expect(page.getByText("$400.00", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Performance" }).click();
  await expect(page.getByRole("heading", { name: "77.5 / 100" })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Funding" }).click();
  await expect(page.getByText("$10.00", { exact: true })).toBeVisible();
  await page.getByLabel("Demo role").selectOption("admin");
  await page.getByRole("tab", { name: "Settlement" }).click();
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "Preview & export sample week" })
    .click();
  const file = await download;
  const { readFile } = await import("node:fs/promises");
  const statement = JSON.parse(await readFile((await file.path())!, "utf8"));
  expect(statement.statement.creatorCents).toBe(1000);
  expect(statement.statement.beneficiaryCents).toBe(9000);
  expect(statement.statement.votes).toBe(1);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/public-${info.project.name}-statement.png`,
    fullPage: true,
  });
  const clean = await context.browser()!.newContext();
  const cleanPage = await clean.newPage();
  await cleanPage.goto(page.url());
  await cleanPage.getByRole("tab", { name: "Funding" }).click();
  await expect(
    cleanPage.getByText("$0.00", { exact: true }).first(),
  ).toBeVisible();
  await expect(
    cleanPage.getByRole("button", { name: "Terms accepted", exact: false }),
  ).not.toBeVisible();
  await clean.close();
  expect(errors).toEqual([]);
  expect(apiRequests).toEqual([]);
});
