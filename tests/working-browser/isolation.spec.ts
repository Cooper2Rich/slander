import { test, expect } from "@playwright/test";
import { selectCreator, navigate } from "../public-browser/helpers";

const keys = [
  "slander-role",
  "slander-public-access-v1",
  "slander-public-workspace-v1",
  "slander-public-preview-v1",
  "slander-public-viewers-v1",
  "slander-financial-samples-v1",
  "ripple-leaderboard-history-v1",
];
test("working donor preview has independent giving, roles and history while main/John records stay unchanged", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.addInitScript((keys) => {
    for (const key of keys)
      if (!localStorage.getItem(key))
        localStorage.setItem(key, `unchanged-main-john:${key}`);
  }, keys);
  await page.goto("./#/support/adoption-is");
  await expect(page.locator(".public-notice")).toContainText("Working preview");
  await page
    .getByRole("link", { name: "Explore project", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "ACU ad competition", exact: true }),
  ).toBeVisible();
  await page.getByRole("tab", { name: "CTR", exact: true }).click();
  await expect(page.getByRole("tabpanel")).toContainText("4.00%");
  await page.getByRole("tab", { name: "Video", exact: true }).click();
  await page
    .getByRole("button", { name: "Preview support", exact: true })
    .click();
  await page.getByLabel("Your name").fill("Working viewer");
  await page.getByLabel("Email address").fill("working@example.test");
  await page
    .getByRole("button", { name: "Create viewer profile", exact: true })
    .click();
  await page.getByLabel("Amount in USD").fill("9.50");
  await page
    .getByRole("button", {
      name: "Confirm simulated contribution",
      exact: true,
    })
    .click();
  await expect(page.getByRole("status")).toContainText("$9.50");
  await page.getByRole("button", { name: "Keep discovering" }).click();
  await page.reload();
  await expect(page.locator(".donor-total")).toHaveText("$9.50");
  await page.getByRole("link", { name: "Campaign leaderboard" }).click();
  await expect(page.getByLabel("Leaderboard campaign")).toHaveValue(
    "adoption-is",
  );
  await page.getByLabel("Demo role").selectOption("admin");
  await expect(
    page.getByRole("heading", { name: "Campaigns.", exact: true }),
  ).toBeVisible();
  const storage = await page.evaluate(
    (keys) => ({
      original: keys.map((key) => localStorage.getItem(key)),
      viewer: JSON.parse(
        localStorage.getItem("working:slander-public-viewers-v1")!,
      ),
      access: JSON.parse(
        localStorage.getItem("working:slander-public-access-v1")!,
      ),
      history: localStorage.getItem("working:ripple-leaderboard-history-v1"),
    }),
    keys,
  );
  expect(storage.original).toEqual(
    keys.map((key) => `unchanged-main-john:${key}`),
  );
  expect(storage.viewer.support).toHaveLength(1);
  expect(storage.access.role).toBe("admin");
  expect(storage.history).toBeTruthy();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  const manifest = await (
    await page.request.get("./working-preview.json")
  ).json();
  expect(manifest).toMatchObject({
    branch: "working",
    base: "/slander/working/",
    storagePrefix: "working:",
  });
  expect(manifest.commit).toMatch(/^[a-f0-9]{40}$/);
  expect(errors).toEqual([]);
  await page.screenshot({
    path: `test-results/working-preview/isolated-admin-${info.project.name}.png`,
    fullPage: true,
  });
});

test("working private video reads its own IndexedDB and retains main media bytes", async ({
  page,
}) => {
  await page.goto("./");
  await expect(page.locator(".ad-card")).toHaveCount(7);
  await page.evaluate(async () => {
    const media = "/api/media/isolated-working-film";
    const film = await (
      await fetch(
        document.querySelector<HTMLVideoElement>(".ad-card video")!.src,
      )
    ).blob();
    for (const [name, value] of [
      ["slander-public-media-v1", new Blob(["unchanged-main-media"])],
      ["working:slander-public-media-v1", film],
    ] as const) {
      const db = await new Promise<IDBDatabase>((resolve, reject) => {
        const r = indexedDB.open(name, 1);
        r.onupgradeneeded = () => r.result.createObjectStore("files");
        r.onsuccess = () => resolve(r.result);
        r.onerror = () => reject(r.error);
      });
      await new Promise<void>((resolve, reject) => {
        const tx = db.transaction("files", "readwrite");
        tx.objectStore("files").put(value, media);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
      db.close();
    }
    const key = "working:slander-public-workspace-v1",
      state = JSON.parse(localStorage.getItem(key)!);
    const post = state.posts.find(
      (p: { id: string }) => p.id === "nocturne-midnight",
    );
    post.media = media;
    state.creativeHolds.push({
      id: "working-private-hold",
      postId: post.id,
      code: "EVIDENCE_CONFLICT",
      reason: "Private fixture",
      evidence: "Browser test",
    });
    state.uploads.push({
      media,
      mediaType: "video",
      creatorId: post.creatorId,
    });
    localStorage.setItem(key, JSON.stringify(state));
  });
  await selectCreator(page, "Nocturne Studio · fictional");
  await navigate(page, "My ads");
  const video = page.locator(".creator-card").first().locator("video");
  await expect(video).toHaveAttribute("src", /^blob:/);
  await expect
    .poll(() => video.evaluate((v: HTMLVideoElement) => v.duration))
    .toBeGreaterThan(15);
  const unchanged = await page.evaluate(async () => {
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const r = indexedDB.open("slander-public-media-v1", 1);
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    const blob = await new Promise<Blob>((resolve, reject) => {
      const r = db
        .transaction("files")
        .objectStore("files")
        .get("/api/media/isolated-working-film");
      r.onsuccess = () => resolve(r.result);
      r.onerror = () => reject(r.error);
    });
    db.close();
    return blob.text();
  });
  expect(unchanged).toBe("unchanged-main-media");
});
