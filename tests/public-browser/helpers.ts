import { expect, type Page } from "@playwright/test";
export async function navigate(page: Page, label: string) {
  const legacyFilter = {
    "All submissions": "all",
    "Platform exceptions": "held",
    "Eligible creatives": "approved",
  }[label];
  if (legacyFilter) label = "Creatives";
  if (label === "Archives")
    label =
      (await page.getByLabel("Demo role").inputValue()) === "admin"
        ? "Archived campaigns"
        : "Archived projects";
  const open = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .waitFor({ state: "attached" });
  if (await open.isVisible()) await open.click();
  const navigation = page.getByRole("navigation", { name: "Main navigation" });
  const linkName = new RegExp(
    `^${label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?: \\d+)?$`,
  );
  if (
    [
      "Campaigns",
      "Project requests",
      "Funding",
      "Archived campaigns",
      "Activity",
    ].includes(label) &&
    !(await navigation.getByRole("link", { name: linkName }).count()) &&
    (await navigation
      .getByRole("link", { name: "All campaigns", exact: true })
      .count())
  ) {
    await navigation
      .getByRole("link", { name: "All campaigns", exact: true })
      .click();
    if (await open.isVisible()) await open.click();
  }
  const target = page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: linkName });
  const href = await target.getAttribute("href");
  await target.click();
  await expect
    .poll(() =>
      navigation
        .locator('a[aria-current="page"]')
        .evaluateAll(
          (links, selectedHref) =>
            links.some((link) => link.getAttribute("href") === selectedHref),
          href,
        ),
    )
    .toBe(true);
  if (legacyFilter)
    await page.getByLabel("Filter by post status").selectOption(legacyFilter);
}
export async function selectCreator(
  page: Page,
  label = "Alex River · fictional",
) {
  await page.getByLabel("Demo role").selectOption("creator");
  await page
    .getByLabel("Creator profile", { exact: true })
    .selectOption({ label });
  await page.getByRole("button", { name: "Open creator studio" }).click();
  await navigate(page, "Projects");
}
export async function selectOwner(
  page: Page,
  label = "Riverkind Collective · fictional",
) {
  await page.getByLabel("Demo role").selectOption("nonprofit");
  await page
    .getByLabel("Nonprofit organization", { exact: true })
    .selectOption({ label });
  await page.getByRole("button", { name: "Open nonprofit workspace" }).click();
}
export async function openRiverCampaign(page: Page) {
  const role = await page.getByLabel("Demo role").inputValue();
  await navigate(page, role === "admin" ? "Campaigns" : "Projects");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "A little louder for living rivers",
        exact: true,
      }),
    })
    .click();
  if (role === "admin") await navigate(page, "Cause-gift records");
}
