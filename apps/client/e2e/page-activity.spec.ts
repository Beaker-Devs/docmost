import { test, expect, Page } from "@playwright/test";

// Requires a running instance + an admin account. Provide credentials via env.
// E2E_PAGE_PATH is the path to an existing editable page, e.g.
// "/s/general/p/7eZmIF3goP". When unset, this spec is skipped.
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;
const PAGE_PATH = process.env.E2E_PAGE_PATH;

async function login(page: Page) {
  await page.goto("/login");
  const email = page.locator('input[type="email"]');
  await email.waitFor({ state: "visible" });
  await email.fill(EMAIL!);
  await page.locator('input[type="password"]').fill(PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(home|s\/)/, { timeout: 30_000 });
}

async function openActivityModal(page: Page) {
  // the "..." page action menu is the last header action icon
  await page.locator('button:has(svg.tabler-icon-dots)').last().click();
  await page.getByRole("menuitem", { name: "Page activity" }).click();
  await expect(
    page.getByText("A record of recent activity on this page."),
  ).toBeVisible();
}

const rows = (page: Page) => page.locator("table tbody tr");

test.describe("page activity", () => {
  test.skip(
    !EMAIL || !PASSWORD || !PAGE_PATH,
    "set E2E_EMAIL, E2E_PASSWORD and E2E_PAGE_PATH to run",
  );

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("captures a content edit and shows it in the page activity", async ({
    page,
  }) => {
    await page.goto(PAGE_PATH!);

    // wait for yjs to connect (title + body editors become editable)
    await page.waitForFunction(
      () =>
        document.querySelectorAll('.ProseMirror[contenteditable="true"]')
          .length >= 2,
      { timeout: 25_000 },
    );

    // type into the body editor (last editable ProseMirror; first is the title)
    const body = page.locator('.ProseMirror[contenteditable="true"]').last();
    await body.click();
    await page.keyboard.type(`e2e edit ${Date.now()} `);

    // the content edit is persisted through the collaboration server (not the
    // REST pipeline) on a debounce, so poll by reopening the modal until the
    // "Edited page" entry appears.
    await expect(async () => {
      if (await page.getByText("Page activity").isVisible().catch(() => false)) {
        await page.keyboard.press("Escape");
      }
      await openActivityModal(page);
      await expect(rows(page).first()).toContainText("Edited page");
    }).toPass({ timeout: 60_000, intervals: [3_000, 5_000, 5_000] });
  });

  test("shows the activity modal with the page's own trail", async ({
    page,
  }) => {
    await page.goto(PAGE_PATH!);
    await page
      .locator('.ProseMirror[contenteditable="true"]')
      .first()
      .waitFor({ state: "visible", timeout: 25_000 });

    await openActivityModal(page);
    await expect(rows(page).first()).toBeVisible();
  });
});
