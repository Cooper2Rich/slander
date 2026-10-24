import { test, expect } from "@playwright/test";

test("current leaders move while completed daily and weekly winners stay fixed", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-24T18:00:00Z") });
  await page.goto("./#/leaderboard?campaign=nocturne-coffee-showcase-v1");
  const board = page.locator(".campaign-board");
  const rows = board.locator("tbody tr");
  await expect(
    page.getByRole("tab", { name: "Current leaderboard", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(board.locator(".winner-badge")).toHaveCount(0);
  await expect(board.locator(".leader-badge")).toHaveText("Current leader");
  await expect(rows.first()).toContainText("Your midnight ritual");
  for (const label of ["Impressions", "Link clicks", "Funding"]) {
    await expect(rows.first().locator(`[data-label="${label}"]`)).toBeVisible();
  }
  await page.clock.runFor(6100);
  await expect(rows.first()).toContainText("A little obsession");
  await expect(board.getByLabel("Up 1 place", { exact: true })).toHaveCount(1);
  await expect(board.getByLabel("Down 1 place", { exact: true })).toHaveCount(
    1,
  );
  await rows.first().hover();
  const hoveredStep = await page
    .locator(".public-leaderboard")
    .getAttribute("data-simulation-step");
  await page.clock.runFor(6100);
  await expect(page.locator(".public-leaderboard")).toHaveAttribute(
    "data-simulation-step",
    hoveredStep!,
  );
  await page
    .getByRole("heading", { name: "Leaderboard.", exact: true })
    .hover();
  await page.getByRole("button", { name: "Pause demo movement" }).click();
  const step = await page
    .locator(".public-leaderboard")
    .getAttribute("data-simulation-step");
  await page.clock.runFor(13000);
  await expect(page.locator(".public-leaderboard")).toHaveAttribute(
    "data-simulation-step",
    step!,
  );
  await page.getByRole("tab", { name: "Daily", exact: true }).click();
  await expect(board.locator(".leaderboard-leading")).toContainText(
    "A little obsession",
  );
  await expect(page.locator(".leaderboard-date")).toContainText(
    "Oct 24, 2026 · UTC · in progress",
  );
  await page.getByRole("tab", { name: "Past winners", exact: true }).click();
  await expect(page.getByLabel("Past daily winners")).toHaveValue("2026-10-23");
  await expect(board.locator(".winner-badge")).toHaveText("Daily winner");
  await expect(
    page.getByLabel("Past daily winners").locator('option[value="2026-10-24"]'),
  ).toHaveCount(0);
  await page.getByLabel("Past weekly winners").selectOption("2026-10-12");
  await expect(board.locator(".winner-badge")).toHaveText("Weekly winner");
  const result = await rows.allTextContents();
  await page.clock.runFor(20000);
  expect(await rows.allTextContents()).toEqual(result);
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Past winners", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(page.getByLabel("Past weekly winners")).toHaveValue(
    "2026-10-12",
  );
  expect(await rows.allTextContents()).toEqual(result);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("scheduled refresh countdown repeats every ten minutes independently of demo movement", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-24T18:00:00Z") });
  await page.goto("./#/leaderboard");
  await page.getByRole("button", { name: "Pause demo movement" }).click();
  await expect(page.locator(".leaderboard-countdown")).toHaveText(
    "Next refresh 10:00",
  );
  await page.clock.runFor(599001);
  await expect(page.locator(".leaderboard-countdown")).toHaveText(
    "Next refresh 00:01",
  );
  await page.clock.runFor(1000);
  await expect(page.locator(".leaderboard-countdown")).toHaveText(
    "Next refresh 10:00",
  );
});
