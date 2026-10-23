import { test, expect } from "@playwright/test";
import { navigate, selectCreator } from "./helpers";

test("finished coffee collection has three playable films over 15 seconds, with sound and scoped creator access", async ({
  page,
}, info) => {
  await page.goto("./");
  await page.getByRole("button", { name: "Watch coffee collection" }).click();
  await expect(page.locator(".ad-card")).toHaveCount(3);
  await expect(page.locator(".ad-duration")).toHaveCount(3);
  const videos = page.locator(".ad-card video");
  for (const video of await videos.all()) {
    await expect
      .poll(() =>
        video.evaluate(
          (element: HTMLVideoElement) =>
            Number.isFinite(element.duration) && element.duration >= 15,
        ),
      )
      .toBe(true);
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.duration),
    ).toBeLessThan(18);
    const response = await page.request.get((await video.getAttribute("src"))!);
    expect(response.ok()).toBe(true);
    expect((await response.body()).includes(Buffer.from("A_OPUS"))).toBe(true);
  }
  await page.getByLabel("Filter by cause").blur();
  await page.evaluate(() => window.scrollTo({ top: 0, behavior: "instant" }));
  await page.screenshot({
    path: `test-results/coffee-${info.project.name}-discovery.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "View Your midnight ritual", exact: true })
    .click();
  const player = page.locator(".profile-media video");
  await player.evaluate((video: HTMLVideoElement) => video.play());
  await expect
    .poll(() => player.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(0.1);
  expect(await player.evaluate((video: HTMLVideoElement) => video.muted)).toBe(
    false,
  );
  await player.evaluate((video: HTMLVideoElement) => {
    video.currentTime = 14;
  });
  await expect
    .poll(() => player.evaluate((video: HTMLVideoElement) => video.currentTime))
    .toBeGreaterThan(14);
  await player.evaluate((video: HTMLVideoElement) => video.pause());
  await page.screenshot({
    path: `test-results/coffee-${info.project.name}-film.png`,
    fullPage: true,
  });
  await selectCreator(page, "Nocturne Studio · fictional");
  await navigate(page, "My ads");
  await expect(page.locator(".creator-card")).toHaveCount(3);
  await page
    .getByRole("button", { name: "View Your midnight ritual", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect
    .poll(() =>
      page
        .getByRole("dialog")
        .locator("video")
        .evaluate((video: HTMLVideoElement) => video.duration),
    )
    .toBeGreaterThanOrEqual(15);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.screenshot({
    path: `test-results/coffee-${info.project.name}-creator.png`,
    fullPage: true,
  });
  await page.reload();
  await expect(page.locator(".creator-card")).toHaveCount(3);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("existing browser workspace upgrades once while preserving viewer history and creative edits", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".ad-card")).toHaveCount(6);
  await page.evaluate(() => {
    const key = "slander-public-workspace-v1",
      state = JSON.parse(localStorage.getItem(key)!);
    delete state.coffeeShowcaseVersion;
    state.posts = state.posts.filter(
      (p: { id: string }) => !p.id.startsWith("nocturne-"),
    );
    state.projects = state.projects.filter(
      (p: { id: string }) => !p.id.startsWith("nocturne-"),
    );
    state.posts.find((p: { id: string }) => p.id === "sample-1").feedback =
      "Preserve my demo edits";
    localStorage.setItem(key, JSON.stringify(state));
    localStorage.setItem(
      "slander-public-viewers-v1",
      JSON.stringify({
        profiles: [],
        activeId: null,
        support: [{ id: "existing-gift", adId: "sample-1", amountCents: 2500 }],
      }),
    );
  });
  await page.reload();
  await expect(page.locator(".ad-card")).toHaveCount(6);
  await page.reload();
  await expect(page.locator(".ad-card")).toHaveCount(6);
  const stored = await page.evaluate(() => ({
    workspace: JSON.parse(localStorage.getItem("slander-public-workspace-v1")!),
    viewers: JSON.parse(localStorage.getItem("slander-public-viewers-v1")!),
  }));
  expect(
    stored.workspace.posts.find((p: { id: string }) => p.id === "sample-1")
      .feedback,
  ).toBe("Preserve my demo edits");
  expect(stored.viewers.support[0].amountCents).toBe(2500);
});
