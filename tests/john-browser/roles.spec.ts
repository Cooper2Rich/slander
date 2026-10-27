import { test, expect, type Page } from "@playwright/test";

async function threeViews(page: Page) {
  const picker = page.getByLabel("Demo role");
  await expect(picker).toBeVisible();
  expect(
    await picker
      .locator("option")
      .evaluateAll((options) =>
        options.map((option) => (option as HTMLOptionElement).value).sort(),
      ),
  ).toEqual(["creator", "nonprofit", "public"]);
  await expect(page.getByText("Administrator", { exact: true })).toHaveCount(0);
  return picker;
}
test("John can use public, campaign and creator views without an Admin option", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./#/explore");
  await expect(page.locator(".ad-card")).toHaveCount(7);
  await (await threeViews(page)).selectOption("nonprofit");
  await expect(
    page.getByRole("heading", { name: /choose|select/i }).first(),
  ).toBeVisible();
  await threeViews(page);
  await page
    .getByLabel("Nonprofit organization")
    .selectOption({ label: "Adoption Is An Option" });
  await page.getByRole("button", { name: "Open nonprofit workspace" }).click();
  await expect(
    page.getByRole("heading", { name: /projects/i }).first(),
  ).toBeVisible();
  await (await threeViews(page)).selectOption("creator");
  await page.getByLabel("Creator profile").selectOption({ label: "Yakira" });
  await page.getByRole("button", { name: "Open creator studio" }).click();
  await expect(page.getByRole("heading", { name: /My ads/i })).toBeVisible();
  await threeViews(page);
  await page.screenshot({
    path: `test-results/john-preview/creator-${info.project.name}.png`,
    fullPage: true,
  });
  await page.getByLabel("Demo role").selectOption("public");
  await expect(page.locator(".ad-card")).toHaveCount(7);
  await page.goBack();
  await threeViews(page);
  await page.goForward();
  await threeViews(page);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});
test("saved admin preferences and admin deep links cannot reopen Admin", async ({
  page,
}) => {
  await page.addInitScript(() => {
    if (localStorage.getItem("john-test-seeded")) return;
    localStorage.setItem("john-test-seeded", "true");
    localStorage.setItem(
      "slander-public-access-v1",
      JSON.stringify({ role: "admin", nonprofitId: null, creatorId: null }),
    );
    localStorage.setItem("slander-role", "admin");
    localStorage.setItem(
      "john:slander-public-access-v1",
      JSON.stringify({ role: "admin", nonprofitId: null, creatorId: null }),
    );
    localStorage.setItem("john:slander-role", "admin");
  });
  await page.goto("./#/funding");
  await expect(page.getByLabel("Demo role")).toHaveValue("nonprofit");
  await threeViews(page);
  await page
    .getByLabel("Nonprofit organization")
    .selectOption({ label: "Adoption Is An Option" });
  await page.getByRole("button", { name: "Open nonprofit workspace" }).click();
  for (const path of ["funding", "campaigns", "campaigns/adoption-is"]) {
    await page.goto(`./#/${path}`);
    await expect(page).toHaveURL(/#\/projects$/);
    await threeViews(page);
  }
  await page.reload();
  await expect(page.getByLabel("Demo role")).toHaveValue("nonprofit");
  expect(await page.evaluate(() => localStorage.getItem("slander-role"))).toBe(
    "admin",
  );
});
