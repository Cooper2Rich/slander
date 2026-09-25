import { test, expect } from "@playwright/test";

test("project setup, upload, revision, approval, and per-project pairing", async ({
  page,
}, testInfo) => {
  const projectName = `Community in bloom ${testInfo.project.name} ${Date.now()}`;
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("/projects");
  await expect(
    page.getByRole("heading", { name: "Projects.", exact: true }),
  ).toBeVisible();
  await expect(page.locator("body")).not.toHaveCSS("overflow-x", "scroll");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-projects.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "New project" }).click();
  await page.getByLabel("Project name", { exact: true }).fill(projectName);
  await page
    .getByLabel("Nonprofit name", { exact: true })
    .fill("Community Garden Foundation");
  await page
    .getByLabel("About the project")
    .fill("Help our neighborhood grow more green spaces.");
  await page
    .getByLabel("Creator brief", { exact: true })
    .fill("Share a hopeful story about local gardens.");
  await page.getByLabel("Project status").selectOption("active");
  await page
    .getByRole("button", { name: "Create project", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", { name: projectName, exact: true }),
    })
    .click();
  await expect(
    page.getByRole("heading", { name: projectName, exact: true }),
  ).toBeVisible();
  await page.getByLabel("Demo role").selectOption("creator");
  await page
    .getByLabel("Creator profile", { exact: true })
    .selectOption({ label: "Maya Chen" });
  await page.getByRole("button", { name: "Open creator studio" }).click();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", { name: projectName, exact: true }),
    })
    .click();
  await page
    .getByRole("button", { name: "Submit a post", exact: true })
    .first()
    .click();
  await expect(page.getByLabel("Demo role")).toHaveValue("creator");
  await page
    .getByLabel("Post title", { exact: true })
    .fill("Roots for the future");
  await expect(page.getByLabel("Your name", { exact: true })).toHaveValue(
    "Maya Chen",
  );
  await expect(page.getByLabel("Your name", { exact: true })).toHaveAttribute(
    "readonly",
    "",
  );
  await page
    .getByLabel("Upload creative")
    .setInputFiles("public/images/seedling.jpg");
  await expect(
    page.getByText("Change your creative", { exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Instagram caption")
    .fill("Come plant a greener future with us. #CommunityGardens");
  await page.getByRole("checkbox").check();
  await page
    .getByRole("button", { name: "Submit for review", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Roots for the future" }),
  ).toBeVisible();
  await page.getByLabel("Demo role").selectOption("admin");
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: "Roots for the future" }),
    })
    .click();
  await page
    .getByRole("button", { name: "Request changes", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Add feedback");
  await page
    .getByLabel("Feedback for the creator")
    .fill("Please include the nonprofit name.");
  await page
    .getByRole("button", { name: "Request changes", exact: true })
    .click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Demo role").selectOption("creator");
  await page
    .getByLabel("Creator profile", { exact: true })
    .selectOption({ label: "Maya Chen" });
  await page.getByRole("button", { name: "Open creator studio" }).click();
  await page
    .getByRole("link")
    .filter({
      has: page.getByRole("heading", { name: projectName, exact: true }),
    })
    .click();
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: "Roots for the future" }),
    })
    .click();
  await expect(
    page.getByText("Please include the nonprofit name.").first(),
  ).toBeVisible();
  await page.getByRole("button", { name: "Edit & resubmit" }).click();
  await page
    .getByLabel("Instagram caption")
    .fill(
      "Join Community Garden Foundation and plant a greener future with us.",
    );
  await page.getByRole("button", { name: "Resubmit for review" }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByLabel("Demo role").selectOption("admin");
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: "Roots for the future" }),
    })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review history" }),
  ).toBeVisible();
  await page.screenshot({
    path: `test-results/${testInfo.project.name}-review.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Approve post", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page
    .getByRole("button", { name: "Add Instagram account", exact: true })
    .click();
  await page
    .getByLabel("Nonprofit Instagram account", { exact: true })
    .fill("@community.garden");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(
    page.getByRole("heading", { name: "@community.garden", exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "@community.garden", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button")
    .filter({
      has: page.getByRole("heading", { name: "Roots for the future" }),
    })
    .click();
  await expect(
    page.getByText("Ready for Instagram handoff", { exact: true }),
  ).toBeVisible();
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Post details" }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^slander-.+\.json$/);
  await page.getByRole("button", { name: "Close dialog" }).click();
  await page.goto("/projects/seat-at-the-table");
  await expect(
    page.getByRole("button", { name: "Add Instagram account" }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  expect(errors).toEqual([]);
});

test("navigation, search, filters, and keyboard modal close work", async ({
  page,
}) => {
  await page.goto("/projects");
  await page.getByLabel("Search workspace").fill("does-not-exist");
  await expect(page.getByText("No projects match your search.")).toBeVisible();
  await page.getByRole("button", { name: "Clear search" }).click();
  await page.getByRole("button", { name: "Draft", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Room to grow" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "A greener tomorrow" }),
  ).not.toBeVisible();
  await page.getByRole("button", { name: "List view" }).click();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("button", { name: "New project" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  if (await page.getByRole("button", { name: "Open navigation" }).isVisible())
    await page.getByRole("button", { name: "Open navigation" }).click();
  await page
    .getByRole("link", { name: "Review inbox", exact: false })
    .first()
    .click();
  await expect(
    page.getByRole("heading", { name: "Review inbox." }),
  ).toBeVisible();
  await page.getByLabel("Filter by project").selectOption("greener-tomorrow");
  await expect(
    page.getByRole("heading", { name: "More than a meal" }),
  ).not.toBeVisible();
});
