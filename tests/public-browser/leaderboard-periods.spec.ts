import { test, expect } from "@playwright/test";

test("daily and weekly campaign boards highlight their period's winner and preserve selection", async ({
  page,
}) => {
  await page.clock.install({ time: new Date("2026-10-24T18:00:00Z") });
  await page.goto("./#/leaderboard?campaign=nocturne-coffee-showcase-v1");
  const board = page.locator(".campaign-board");
  await expect(board).toHaveCount(1);
  await expect(
    page.getByRole("tab", { name: "Weekly", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(board.locator(".leaderboard-winner")).toHaveCount(1);
  await expect(board.locator(".leaderboard-winner")).toContainText(
    "Your midnight ritual",
  );
  await expect(board.locator(".winner-badge")).toHaveText("Weekly winner");
  await expect(page.locator(".leaderboard-date")).toContainText(
    "Oct 19, 2026 – Oct 25, 2026",
  );
  await page.getByRole("tab", { name: "Daily", exact: true }).click();
  await expect(board.locator("tbody tr")).toHaveCount(3);
  await expect(board.locator(".leaderboard-winner")).toContainText(
    "A little obsession, in every shot",
  );
  await expect(board.locator(".winner-badge")).toHaveText("Daily winner");
  await expect(page.locator(".leaderboard-date")).toHaveText(
    "Oct 24, 2026 · UTC",
  );
  await expect(page).toHaveURL(/period=daily/);
  await page.reload();
  await expect(
    page.getByRole("tab", { name: "Daily", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await expect(board.locator(".leaderboard-winner")).toContainText(
    "A little obsession",
  );
  await page.getByLabel("Search leaderboard").fill("midnight");
  await expect(board.locator("tbody tr")).toHaveCount(1);
  await expect(board.locator(".leaderboard-winner")).toHaveCount(0);
  await page.getByLabel("Search leaderboard").fill("");
  await page.getByLabel("Leaderboard campaign").selectOption("all");
  await expect(page.locator(".campaign-board")).toHaveCount(4);
  await expect(page.locator(".winner-badge")).toHaveCount(3);
  await expect(
    page.getByRole("heading", { name: "No daily winner yet.", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("tab", { name: "Weekly", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "No weekly winner yet.", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".winner-badge")).toHaveCount(3);
});
