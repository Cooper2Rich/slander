import { test, expect } from "@playwright/test";
import { selectCreator, selectOwner } from "./helpers";

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
  await selectOwner(page);
  await expect(picker).toHaveValue("acu");
  await page.getByLabel("Demo role").selectOption("admin");
  await expect(page.locator(".topbar")).toBeVisible();
  await expect(picker).toHaveValue("acu");
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
  await page.reload();
  await expect(picker).toHaveValue("ripple");
  await expect(page.locator("body")).toHaveCSS(
    "background-color",
    "rgb(0, 0, 0)",
  );
});
