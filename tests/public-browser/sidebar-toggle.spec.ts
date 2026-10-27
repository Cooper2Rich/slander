import { test, expect, type Page } from "@playwright/test";
import { selectCreator, selectOwner } from "./helpers";

function primary(page: Page, mobile: boolean) {
  return page.getByRole("navigation", {
    name: mobile ? "Mobile public navigation" : "Workspace shortcuts",
    exact: true,
  });
}

test("main tabs toggle secondary menus while preserving the page and filters", async ({
  page,
}, info) => {
  const mobile = info.project.name === "mobile";
  await page.goto("./#/explore?cause=Adoption");
  await expect(page.locator(".ad-card")).toHaveCount(1);
  const discover = primary(page, mobile).getByRole("link", {
    name: "Discover ads",
    exact: true,
  });
  const url = page.url();
  await expect(discover).toHaveAttribute("aria-expanded", "false");
  await discover.click();
  await expect(discover).toHaveAttribute("aria-expanded", "true");
  await expect(
    page.getByRole("navigation", { name: "Discover navigation", exact: true }),
  ).toBeVisible();
  await expect(page).toHaveURL(url);
  await discover.click();
  await expect(discover).toHaveAttribute("aria-expanded", "false");
  await expect(
    page.getByRole("navigation", { name: "Discover navigation", exact: true }),
  ).toBeHidden();
  await expect(page.getByLabel("Filter by cause")).toHaveValue("Adoption");
  await expect(page.locator(".ad-card")).toHaveCount(1);
  await discover.focus();
  await page.keyboard.press("Enter");
  await expect(discover).toHaveAttribute("aria-expanded", "true");
  for (const [name, area] of [
    ["About BRM", "About BRM"],
    ["Home", "Home"],
    ["Leaderboard", "Leaders"],
    ["Viewer account", "Profile"],
  ]) {
    const tab = primary(page, mobile).getByRole("link", { name, exact: true });
    await tab.click();
    await expect(tab).toHaveAttribute("aria-expanded", "true");
    await expect(
      page.getByRole("navigation", { name: `${area} navigation`, exact: true }),
    ).toBeVisible();
    const currentUrl = page.url();
    await tab.click();
    await expect(tab).toHaveAttribute("aria-expanded", "false");
    await expect(page).toHaveURL(currentUrl);
  }
  await page.reload();
  await expect(
    primary(page, mobile).getByRole("link", {
      name: "Viewer account",
      exact: true,
    }),
  ).toHaveAttribute("aria-expanded", "false");
});

for (const role of ["creator", "nonprofit", "admin"]) {
  test(`${role} view shares panel state and main-tab toggling`, async ({
    page,
  }, info) => {
    const mobile = info.project.name === "mobile";
    await page.goto("./#/explore");
    if (role === "creator") await selectCreator(page, "Maya Chen");
    else if (role === "nonprofit")
      await selectOwner(page, "Nocturne Coffee · fictional");
    else await page.getByLabel("Demo role").selectOption("admin");
    await expect(page.getByLabel("Demo role")).toHaveValue(role);
    await expect(page.locator(".workspace-identity")).toHaveCount(1);
    const access = await page.evaluate(() =>
      localStorage.getItem("slander-public-access-v1"),
    );
    if (mobile) {
      const menu = page.getByRole("button", {
        name: "Open navigation",
        exact: true,
      });
      if ((await menu.getAttribute("aria-expanded")) !== "true")
        await menu.click();
      await expect(menu).toHaveAttribute("aria-expanded", "true");
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeInViewport();
      await page
        .getByRole("button", { name: "Close navigation", exact: true })
        .click({ position: { x: page.viewportSize()!.width - 12, y: 120 } });
      await expect(menu).toHaveAttribute("aria-expanded", "false");
      await page.getByLabel("Demo role").selectOption("public");
    } else {
      const shell = page.locator(".main-shell");
      const expandedLeft = (await shell.boundingBox())!.x;
      await page
        .getByRole("button", { name: "Hide secondary sidebar", exact: true })
        .click();
      await expect(page.locator(".sidebar")).toBeHidden();
      expect((await shell.boundingBox())!.x).toBeLessThan(expandedLeft);
      await page
        .getByRole("button", { name: "Show secondary sidebar", exact: true })
        .click();
      await expect(
        page.getByRole("navigation", { name: "Main navigation" }),
      ).toBeVisible();
      await primary(page, false)
        .getByRole("link", { name: "Discover ads", exact: true })
        .click();
    }
    const tab = primary(page, mobile).getByRole("link", {
      name: "Discover ads",
      exact: true,
    });
    await expect(tab).toHaveAttribute("aria-expanded", "true");
    await tab.click();
    await expect(tab).toHaveAttribute("aria-expanded", "false");
    await tab.click();
    await expect(tab).toHaveAttribute("aria-expanded", "true");
    expect(
      await page.evaluate(() =>
        localStorage.getItem("slander-public-access-v1"),
      ),
    ).toBe(access);
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}
