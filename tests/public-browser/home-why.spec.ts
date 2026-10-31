import { test, expect, type Locator } from "@playwright/test";

async function scale(image: Locator) {
  return image.evaluate(
    (element) => new DOMMatrixReadOnly(getComputedStyle(element).transform).a,
  );
}

test("Our Why uses loaded photos over a landscape backdrop in both themes", async ({
  page,
}, info) => {
  await page.goto("./#/?section=mission");
  const visual = page.locator(".mission-visual");
  await expect(visual.locator("svg > rect")).toHaveCount(0);
  const backdrop = visual.locator(".mission-backdrop");
  await expect(backdrop).toHaveAttribute("src", /images\/why-landscape\.jpg$/);
  const photos = visual.locator(".mission-node-photo img");
  await expect(photos).toHaveCount(3);
  await expect(visual.locator(".mission-node-label")).toHaveText([
    "Creators",
    "Causes",
    "Community",
  ]);
  await expect(visual.locator(".mission-arrow")).toHaveCount(2);
  for (const theme of ["ripple", "acu"]) {
    await page.getByLabel("Website theme").selectOption(theme);
    await visual.scrollIntoViewIfNeeded();
    for (const image of [backdrop, ...(await photos.all())]) {
      await expect
        .poll(() =>
          image.evaluate(
            (element: HTMLImageElement) =>
              element.complete && element.naturalWidth > 0,
          ),
        )
        .toBe(true);
    }
    for (const photo of await photos.all()) {
      await expect(photo).toHaveAttribute("alt", /.+/);
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await visual.screenshot({
      path: "test-results/home-why-" + theme + "-" + info.project.name + ".png",
    });
  }
});

test("the sequence plays through each item along the arrows", async ({
  page,
}) => {
  await page.goto("./#/?section=mission");
  const visual = page.locator(".mission-visual");
  await visual.scrollIntoViewIfNeeded();
  await page.mouse.move(0, 0);
  for (const key of ["creators", "causes", "community", "creators"]) {
    await expect(visual).toHaveAttribute("data-active", key, {
      timeout: 4000,
    });
    const node = visual.locator(`.mission-node.${key}`);
    await expect(node).toHaveClass(/is-active/);
    await expect.poll(() => scale(node.locator("img"))).toBeCloseTo(1, 2);
    const index = ["creators", "causes", "community"].indexOf(key);
    if (index < 2) {
      await expect(visual.locator(".mission-arrow").nth(index)).toHaveClass(
        /is-flowing/,
      );
    }
  }
  const idle = visual.locator(".mission-node:not(.is-active) img").first();
  await expect.poll(() => scale(idle)).toBeCloseTo(1.3, 2);
});

test("hovering an item holds it in the wide view", async ({ page }) => {
  await page.goto("./#/?section=mission");
  const visual = page.locator(".mission-visual");
  const causes = visual.locator(".mission-node.causes");
  await causes.scrollIntoViewIfNeeded();
  await causes.hover();
  await expect(visual).toHaveAttribute("data-active", "causes");
  await expect.poll(() => scale(causes.locator("img"))).toBeCloseTo(1, 2);
  await page.waitForTimeout(3200);
  await expect(visual).toHaveAttribute("data-active", "causes");
  await expect(visual.locator(".is-flowing")).toHaveCount(0);
  await page.mouse.move(0, 0);
  await expect(visual).toHaveAttribute("data-active", "community", {
    timeout: 4000,
  });
});

test("reduced motion shows still wide photos", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#/?section=mission");
  const visual = page.locator(".mission-visual");
  await expect(visual).not.toHaveAttribute("data-active");
  await expect(visual.locator(".is-flowing")).toHaveCount(0);
  for (const photo of await visual.locator(".mission-node-photo img").all()) {
    await expect.poll(() => scale(photo)).toBe(1);
  }
});
