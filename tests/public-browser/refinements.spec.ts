import { test, expect } from "@playwright/test";
import { navigate, selectOwner, openRiverCampaign } from "./helpers";

test("leaderboard scopes campaigns, searches creators and opens ad profiles", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".ad-description")).toHaveCount(6);
  await expect(page.locator(".ad-support-copy").first()).toContainText(
    "reach more people",
  );
  await page.getByRole("link", { name: "Leaderboard", exact: true }).click();
  const rows = page.locator(".leaderboard-table tbody tr");
  await expect(rows).toHaveCount(6);
  await expect
    .poll(() =>
      page
        .locator(".leaderboard-ad img")
        .first()
        .evaluate((img: HTMLImageElement) => img.naturalWidth),
    )
    .toBeGreaterThan(0);
  await expect(rows.first()).toContainText("Your midnight ritual");
  await page
    .getByLabel("Leaderboard campaign")
    .selectOption("nocturne-coffee-showcase-v1");
  await expect(rows).toHaveCount(3);
  await page.getByLabel("Search leaderboard").fill("obsession");
  await expect(rows).toHaveCount(1);
  await expect(rows).toContainText("02");
  await page.getByLabel("Search leaderboard").fill("Nocturne Studio");
  await expect(rows).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await rows.first().getByRole("link").click();
  await expect(page.locator(".profile-copy h1")).toHaveText(
    "Your midnight ritual",
  );
});

test("admin creatives show video thumbnails and searchable creator names without bulky sidebar cards", async ({
  page,
}) => {
  await page.goto("./");
  await page.getByLabel("Demo role").selectOption("admin");
  await expect(page.locator(".workspace-hero")).toHaveCount(0);
  await expect(
    page.locator(".sidebar-note, .sidebar-user, .workspace-symbol"),
  ).toHaveCount(0);
  await expect(page.locator(".workspace-identity .avatar")).toHaveCount(1);
  await navigate(page, "Creatives");
  await expect(
    page.getByRole("heading", { name: "Creatives.", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Search workspace").fill("Nocturne Studio");
  await expect(page.locator(".post-row")).toHaveCount(3);
  await expect(page.locator(".post-thumbnail video")).toHaveCount(3);
  await expect(page.locator(".creative-byline").first()).toContainText(
    "Nocturne Studio",
  );
  const video = page.locator(".post-thumbnail video").first();
  await video.hover();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(false);
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  await page.getByLabel("Search workspace").fill("midnight ritual");
  await expect(page.locator(".post-row")).toHaveCount(1);
  await page.getByLabel("Search workspace").fill("Nocturne Coffee");
  await expect(page.locator(".post-row")).toHaveCount(3);
  await navigate(page, "Activity");
  await expect(page.locator(".activity-list")).toHaveCSS(
    "background-color",
    "rgb(7, 18, 27)",
  );
  await navigate(page, "Archives");
  await expect(
    page.locator(".empty-state, .archive-project").first(),
  ).toHaveCSS("background-color", "rgb(7, 18, 27)");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("owner creatives and campaign funding share compact dark surfaces", async ({
  page,
}) => {
  await page.goto("./");
  await selectOwner(page, "Nocturne Coffee · fictional");
  await navigate(page, "Creatives");
  await expect(page.locator(".post-thumbnail video")).toHaveCount(3);
  await expect(page.locator(".creative-byline").first()).toContainText(
    "Nocturne Studio",
  );
  await page.getByLabel("Demo role").selectOption("admin");
  await openRiverCampaign(page);
  await expect(page.locator(".market-intro")).toHaveCount(0);
  await page.getByRole("tab", { name: "Funding", exact: true }).click();
  await expect(page.locator(".metric-card")).toHaveCount(4);
  await expect(page.locator(".metric-card").first()).toHaveCSS(
    "background-color",
    "rgb(7, 18, 27)",
  );
  const height = await page
    .locator(".metric-card")
    .first()
    .evaluate((el) => el.getBoundingClientRect().height);
  expect(height).toBeLessThan(190);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
