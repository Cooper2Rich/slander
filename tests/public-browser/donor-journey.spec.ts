import { test, expect } from "@playwright/test";
import { navigate, selectCreator } from "./helpers";

const projectPath = "./#/support/adoption-is/acu-ad-competition";

test("donor explores a campaign and project, previews giving once, and returns through history", async ({
  page,
}, info) => {
  const errors: string[] = [];
  const externalWrites: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("request", (request) => {
    if (request.method() !== "GET") externalWrites.push(request.url());
  });
  await page.goto("./");
  await page
    .getByRole("link", { name: "Support projects", exact: true })
    .click();
  const featured = page.locator(".donor-card").filter({
    has: page.getByRole("heading", { name: "Adoption Is", exact: true }),
  });
  await expect(featured).toBeVisible();
  await featured.getByRole("link", { name: "View campaign" }).click();
  await expect(
    page.getByRole("heading", { name: "Adoption Is", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/donor-campaign-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Explore project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ACU ad competition", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".donor-metrics dd")).toHaveText([
    "40,000",
    "N/A",
    "1,600",
    "4.00%",
  ]);
  const insights = page.getByRole("tablist", { name: "Story insights" });
  await insights.getByRole("tab", { name: "CTR", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("4.00%");
  await page.keyboard.press("ArrowRight");
  await expect(
    insights.getByRole("tab", { name: "Impressions", exact: true }),
  ).toBeFocused();
  await expect(page.getByRole("tabpanel")).toContainText("40,000");
  await insights.getByRole("tab", { name: "Ad spend", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Actual ad spend: N/A",
  );
  await expect(
    page.getByRole("button", { name: "Live ad spending unavailable" }),
  ).toBeDisabled();
  await insights.getByRole("tab", { name: "Video", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Live donation unavailable" }),
  ).toBeDisabled();
  await expect(page.locator(".donor-gates")).toContainText(
    "Meta: not connected",
  );
  await expect(page.locator(".donor-gates")).toContainText(
    "TikTok: not connected",
  );
  await page.getByText("What these metrics mean", { exact: true }).click();
  await expect(
    page.getByText("Reach counts unique accounts", { exact: false }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/donor-project-viewport-${info.project.name}.png`,
  });
  await page.screenshot({
    path: `test-results/donor-project-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Preview support", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Preview support", exact: true }),
  ).toBeFocused();
  await page
    .getByRole("button", { name: "Preview support", exact: true })
    .click();
  await page.getByLabel("Your name").fill("Donor preview");
  await page.getByLabel("Email address").fill("donor@example.test");
  await page
    .getByRole("button", { name: "Create viewer profile", exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: "Real payment unavailable" }),
  ).toBeDisabled();
  await page.getByLabel("Amount in USD").fill("0");
  await page
    .getByRole("button", { name: "Confirm simulated contribution" })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("slander-public-viewers-v1")!).support
          .length,
    ),
  ).toBe(0);
  await page.getByLabel("Amount in USD").fill("37.50");
  await page.screenshot({
    path: `test-results/donor-support-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Confirm simulated contribution" })
    .evaluate((button: HTMLButtonElement) => {
      button.click();
      button.click();
    });
  await expect(page.getByRole("status")).toContainText("$37.50");
  await expect(page.getByRole("status")).toContainText("No money was charged");
  await page.getByRole("button", { name: "Keep discovering" }).click();
  await expect(page.locator(".donor-total")).toHaveText("$37.50");
  await expect(page.locator(".donor-metrics dd")).toHaveText([
    "40,000",
    "N/A",
    "1,600",
    "4.00%",
  ]);
  expect(
    await page.evaluate(
      () =>
        JSON.parse(localStorage.getItem("slander-public-viewers-v1")!).support
          .length,
    ),
  ).toBe(1);
  await page.reload();
  await expect(page.locator(".donor-total")).toHaveText("$37.50");
  await page
    .getByRole("button", { name: "Preview support", exact: true })
    .click();
  await page.goBack();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "Adoption Is", exact: true }),
  ).toBeVisible();
  await page.goForward();
  await expect(page.locator(".donor-total")).toHaveText("$37.50");
  await page
    .getByRole("link", { name: "View saved giving", exact: true })
    .click();
  await expect(page.locator(".giving-total")).toHaveText("$37.50");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(externalWrites).toEqual([]);
  expect(errors).toEqual([]);
});

test("donor cards, tabs and navigation fit small phones and tablet breakpoints", async ({
  page,
}) => {
  await page.goto(projectPath);
  await expect(page.locator(".donor-story")).toHaveCount(1);
  for (const width of [320, 768, 1024]) {
    await page.setViewportSize({ width, height: 900 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.getByRole("tab", { name: "Ad spend", exact: true }).click();
    await expect(
      page.getByRole("button", { name: "Live ad spending unavailable" }),
    ).toBeDisabled();
    await page.getByRole("tab", { name: "Video", exact: true }).click();
  }
});

test("project routes reflect active records and missing sample evidence", async ({
  page,
}) => {
  await page.goto(projectPath);
  await expect(page.locator(".donor-story")).toHaveCount(1);
  await page.evaluate(() => {
    const key = "slander-public-workspace-v1",
      state = JSON.parse(localStorage.getItem(key)!);
    const post = state.posts.find(
      (p: { id: string }) => p.id === "adoption-girl-in-the-middle",
    );
    post.id = "custom-story";
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(page.locator(".donor-metrics dd")).toHaveText([
    "N/A",
    "N/A",
    "N/A",
    "N/A",
  ]);
  await page.evaluate(() => {
    const key = "slander-public-workspace-v1",
      state = JSON.parse(localStorage.getItem(key)!);
    state.projects.find(
      (p: { id: string }) => p.id === "acu-ad-competition",
    ).status = "archived";
    localStorage.setItem(key, JSON.stringify(state));
  });
  await page.reload();
  await expect(
    page.getByRole("heading", {
      name: "This project or campaign is unavailable.",
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Preview support" }),
  ).toHaveCount(0);
  await page.goto("./#/support/adoption-is/missing-project");
  await expect(
    page.getByRole("heading", {
      name: "This project or campaign is unavailable.",
    }),
  ).toBeVisible();
});

test("Yakira creator journey and public video remain available alongside donor views", async ({
  page,
}, info) => {
  await page.goto("./");
  await selectCreator(page, "Yakira");
  await expect(
    page.getByRole("heading", { name: "ACU ad competition", exact: true }),
  ).toBeVisible();
  await navigate(page, "My ads");
  await expect(
    page.getByRole("heading", { name: "The Girl in the Middle", exact: true }),
  ).toBeVisible();
  await page.getByLabel("Demo role").selectOption("public");
  await page.getByLabel("Filter by cause").selectOption("Adoption");
  await page
    .getByRole("link", { name: "View The Girl in the Middle", exact: true })
    .click();
  await expect(page.locator(".profile-media video")).toHaveAttribute(
    "controls",
    "",
  );
  await page.getByRole("tab", { name: "CTR", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("4.00%");
  await page.getByRole("tab", { name: "Ad spend", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText(
    "Actual ad spend: N/A",
  );
  await page.getByRole("tab", { name: "Video", exact: true }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/ad-insights-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByRole("link", { name: "Explore supporting project" }).click();
  await expect(
    page.getByRole("heading", { name: "ACU ad competition", exact: true }),
  ).toBeVisible();
  await page.getByRole("link", { name: "Campaign leaderboard" }).click();
  await expect(
    page.getByLabel("Leaderboard campaign", { exact: true }),
  ).toHaveValue("adoption-is");
});

test("compact navigation and dropdowns work in creator and admin workspaces", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.getByLabel("Demo role").selectOption("admin");
  await expect(
    page.getByRole("heading", { name: "Campaigns.", exact: true }),
  ).toBeVisible();
  expect(
    await page
      .locator(".sidebar")
      .evaluate((element) => Math.round(element.getBoundingClientRect().width)),
  ).toBe(212);
  expect(
    await page
      .getByLabel("Demo role")
      .evaluate((element) => parseFloat(getComputedStyle(element).minHeight)),
  ).toBe(32);
  if (info.project.name === "desktop") {
    expect(
      await page
        .locator(".topbar")
        .evaluate((element) => element.getBoundingClientRect().height),
    ).toBeLessThanOrEqual(62);
  } else {
    await page
      .getByRole("button", { name: "Open navigation", exact: true })
      .click();
    await expect(
      page.getByRole("navigation", { name: "Main navigation" }),
    ).toBeVisible();
    await page
      .getByRole("button", { name: "Close navigation", exact: true })
      .click();
  }
  await selectCreator(page, "Yakira");
  await navigate(page, "My ads");
  await expect(
    page.getByRole("heading", { name: "The Girl in the Middle", exact: true }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.screenshot({
    path: `test-results/compact-workspace-${info.project.name}.png`,
    fullPage: true,
  });
});
