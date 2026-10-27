import { expect, type Page } from "@playwright/test";
export async function openWorkspaceMenu(page: Page) {
  await page.locator(".sidebar").waitFor({ state: "attached" });
  const open = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await open.isVisible()) {
    if ((await open.getAttribute("aria-expanded")) !== "true")
      await open.click();
  } else {
    const show = page.getByRole("button", {
      name: "Show secondary sidebar",
      exact: true,
    });
    if (await show.isVisible()) await show.click();
  }
}
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
  const ensureOpen = () => openWorkspaceMenu(page);
  await ensureOpen();
  const navigation = page.locator('.sidebar nav[aria-label="Main navigation"]');
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
    await expect(navigation.locator('a[href="#/campaigns"]')).toHaveAttribute(
      "aria-current",
      "page",
    );
    await ensureOpen();
  }
  if (!(await navigation.getByRole("link", { name: linkName }).count())) {
    const role = await page.getByLabel("Demo role").inputValue();
    const mainLabel =
      role === "creator"
        ? ["My ads", "Past ads"].includes(label)
          ? "My ads"
          : label
        : role === "nonprofit"
          ? ["Projects", "Project requests", "Archived projects"].includes(
              label,
            )
            ? "Projects"
            : label
          : ["Campaigns", "Archived campaigns"].includes(label)
            ? "Campaigns"
            : label;
    const desktop = page.getByRole("navigation", {
      name: "Workspace shortcuts",
      exact: true,
    });
    const primary = (await desktop.isVisible())
      ? desktop
      : page.getByRole("navigation", {
          name: "Mobile workspace navigation",
          exact: true,
        });
    await primary.getByRole("link", { name: mainLabel, exact: true }).click();
    await expect(
      primary.getByRole("link", { name: mainLabel, exact: true }),
    ).toHaveAttribute("aria-current", "page");
    await ensureOpen();
  }
  const target = navigation.getByRole("link", { name: linkName });
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
