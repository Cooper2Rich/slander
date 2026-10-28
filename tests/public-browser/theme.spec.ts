import { test, expect, type Page } from "@playwright/test";
import { selectCreator, selectOwner } from "./helpers";

async function expectLightNavigation(page: Page) {
  for (const navigation of await page
    .locator(
      ".workspace-rail, .sidebar, .public-mobile-nav, .role-mobile-nav, .public-mobile-context",
    )
    .all()) {
    await expect(navigation).toHaveCSS(
      "background-color",
      "rgb(240, 239, 224)",
    );
    await expect(navigation).toHaveCSS("color", "rgb(31, 48, 62)");
  }
  for (const selected of await page
    .locator(
      ".rail-item.selected > span, .sidebar .nav-item.active, .public-mobile-context .nav-item.active",
    )
    .all()) {
    await expect(selected).toHaveCSS("background-color", "rgb(151, 98, 48)");
    await expect(selected).toHaveCSS("color", "rgb(250, 249, 242)");
  }
}

test("ACU theme follows public pages, every workspace, dialogs and refresh", async ({
  page,
}, info) => {
  await page.goto("./");
  const picker = page.getByLabel("Website theme");
  await expect(picker).toHaveValue("ripple");
  await picker.selectOption("acu");
  for (const route of ["/", "/about", "/explore", "/leaderboard", "/viewer"]) {
    await page.goto(`./#${route}`);
    await expect(picker).toHaveValue("acu");
    await expectLightNavigation(page);
    await expect(page.locator("body")).toHaveCSS(
      "background-color",
      "rgb(250, 249, 242)",
    );
    await expect(page.locator(".public-notice")).toHaveCSS(
      "background-color",
      "rgb(31, 48, 62)",
    );
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    expect(
      await page
        .locator(".public-notice")
        .evaluate((node) => node.getBoundingClientRect().height),
    ).toBe(44);
    expect(
      await page.locator(".public-notice").evaluate((node) => {
        const banner = node.getBoundingClientRect();
        return [...node.children].every((child) => {
          const box = child.getBoundingClientRect();
          return (
            !box.height ||
            (box.top >= banner.top && box.bottom <= banner.bottom)
          );
        });
      }),
    ).toBe(true);
  }
  await page.goto("./#/explore");
  await page
    .getByRole("button", { name: /Fund ad spend/ })
    .first()
    .click();
  await expect(page.getByRole("dialog")).toHaveCSS(
    "background-color",
    "rgb(255, 254, 250)",
  );
  await page.keyboard.press("Escape");
  await selectCreator(page);
  await expect(picker).toHaveValue("acu");
  await expectLightNavigation(page);
  await selectOwner(page);
  await expect(picker).toHaveValue("acu");
  await expectLightNavigation(page);
  await page.getByLabel("Demo role").selectOption("admin");
  await expect(page.locator(".topbar")).toBeVisible();
  await expect(picker).toHaveValue("acu");
  await expectLightNavigation(page);
  await page.reload();
  await expect(picker).toHaveValue("acu");
  await page.screenshot({
    path: `test-results/acu-admin-${info.project.name}.png`,
  });
  await page.getByLabel("Demo role").selectOption("public");
  await page.goto("./#/");
  if (info.project.name === "mobile") {
    await page.setViewportSize({ width: 320, height: 664 });
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.setViewportSize({ width: 390, height: 664 });
    const menu = page.getByRole("button", { name: "Home", exact: true });
    if (await menu.isVisible()) await menu.click();
  }
  await page.screenshot({
    path: `test-results/acu-home-${info.project.name}.png`,
  });
  await picker.selectOption("ripple");
  await expect(page.locator(".workspace-rail")).toHaveCSS(
    "background-color",
    "rgb(7, 16, 28)",
  );
  await expect(page.locator(".sidebar")).toHaveCSS(
    "background-color",
    "rgb(14, 25, 39)",
  );
  await page.reload();
  await expect(picker).toHaveValue("ripple");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
});
