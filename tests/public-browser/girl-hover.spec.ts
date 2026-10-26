import { test, expect, type Locator, type Page } from "@playwright/test";
import { navigate, selectCreator, selectOwner } from "./helpers";

async function assertPreview(page: Page, card: Locator, target = card) {
  const video = card.locator("video").first();
  await expect(video).toHaveCount(1);
  await target.hover();
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.2);
  expect(await video.evaluate((v: HTMLVideoElement) => v.muted)).toBe(true);
  await video.evaluate((v: HTMLVideoElement) => {
    v.currentTime = 5.1;
    v.dispatchEvent(new Event("timeupdate"));
  });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeLessThan(1);
  await page.mouse.move(0, 0);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
}

test("Girl previews across public, Admin, owner and creator views, including earnings", async ({
  page,
}, info) => {
  test.slow();
  await page.goto("./#/explore");
  await page.getByLabel("Filter by cause").selectOption("Adoption");
  const card = page
    .locator(".ad-card")
    .filter({ hasText: "The Girl in the Middle" });
  await assertPreview(page, card, card.locator("h3"));
  await page.goto("./#/ads/adoption-girl-in-the-middle");
  await assertPreview(page, page.locator(".profile-media"));
  await page.goto("./#/leaderboard?campaign=adoption-is");
  await assertPreview(page, page.locator(".leaderboard-table tbody tr"));
  await page.getByRole("tab", { name: "Past winners", exact: true }).click();
  await assertPreview(page, page.locator(".leaderboard-table tbody tr"));
  await page.getByLabel("Demo role").selectOption("admin");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", { name: "Adoption Is", exact: true }),
    })
    .click();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "ACU ad competition",
        exact: true,
      }),
    })
    .click();
  await navigate(page, "Creatives");
  await assertPreview(page, page.locator(".post-row"));
  await selectOwner(page, "Adoption Is An Option");
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", {
        name: "ACU ad competition",
        exact: true,
      }),
    })
    .click();
  await navigate(page, "Creatives");
  await assertPreview(page, page.locator(".post-row"));
  await selectCreator(page, "Yakira");
  await navigate(page, "My ads");
  await assertPreview(page, page.locator(".creator-card"));
  await navigate(page, "Earnings");
  await assertPreview(
    page,
    page.getByRole("region", { name: "Past daily wins", exact: true }),
  );
  await assertPreview(
    page,
    page.getByRole("region", { name: "Past weekly wins", exact: true }),
  );
  await assertPreview(
    page,
    page.locator(".earnings-row").filter({ hasText: "The Girl in the Middle" }),
  );
  await page
    .getByRole("region", { name: "Past daily wins", exact: true })
    .locator("h4")
    .hover();
  await page.screenshot({
    path: `test-results/girl-hover-${info.project.name}.png`,
    fullPage: true,
  });
});

test("Girl preview supports browsers sending mouse-only hover events", async ({
  page,
}) => {
  await page.goto("./#/explore");
  await page.getByLabel("Filter by cause").selectOption("Adoption");
  await page.mouse.move(0, 0);
  const card = page
    .locator(".ad-card")
    .filter({ hasText: "The Girl in the Middle" });
  const video = card.locator("video");
  await card.dispatchEvent("mouseenter");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.2);
  await card.dispatchEvent("mouseleave");
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
});

test("an interrupted preview can retry while the mouse is still over the ad", async ({
  page,
}) => {
  await page.addInitScript(() => {
    const play = HTMLMediaElement.prototype.play;
    let interrupted = false;
    HTMLMediaElement.prototype.play = function () {
      if (
        !interrupted &&
        this.getAttribute("aria-label") === "The Girl in the Middle"
      ) {
        interrupted = true;
        return Promise.reject(
          new DOMException("Interrupted initial preview", "AbortError"),
        );
      }
      return play.call(this);
    };
  });
  await page.goto("./#/explore");
  await page.getByLabel("Filter by cause").selectOption("Adoption");
  const card = page
    .locator(".ad-card")
    .filter({ hasText: "The Girl in the Middle" });
  const video = card.locator("video");
  await card.dispatchEvent("pointerenter", { pointerType: "mouse" });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.paused))
    .toBe(true);
  await card.dispatchEvent("pointermove", { pointerType: "mouse" });
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.currentTime))
    .toBeGreaterThan(0.2);
});
