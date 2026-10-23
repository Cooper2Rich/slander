import type { Page } from "@playwright/test";
export async function navigate(page: Page, label: string) {
  const open = page.getByRole("button", {
    name: "Open navigation",
    exact: true,
  });
  if (await open.isVisible()) await open.click();
  await page
    .getByRole("navigation", { name: "Main navigation" })
    .getByRole("link", { name: label, exact: false })
    .click();
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
  await navigate(page, "Campaigns");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "A little louder for living rivers",
        exact: true,
      }),
    })
    .click();
}
