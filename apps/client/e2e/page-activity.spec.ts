import { test, expect, Page } from "@playwright/test";

// Requires a running instance + an admin account. Provide credentials via env.
// E2E_PAGE_PATH is the path to an existing page, e.g. "/s/general/p/7eZmIF3goP".
// When unset, this spec is skipped.
//
// Note: capturing a *content* edit is an inherently timing-dependent path
// (edits persist through the collaboration server on a debounce, outside the
// HTTP pipeline), so that behaviour is covered by the EditSessionThrottle unit
// tests rather than a flaky browser test. This e2e covers the per-page
// activity endpoint + UI wiring deterministically.
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

const rows = (page: Page) => page.locator("table tbody tr");

test.describe("page activity", () => {
  test.skip(
    !EMAIL || !PASSWORD || !PAGE_PATH,
    "set E2E_EMAIL, E2E_PASSWORD and E2E_PAGE_PATH to run",
  );

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("shows the page's activity in the version history view", async ({
    page,
  }) => {
    await page.goto(PAGE_PATH!);
    await page
      .locator('.ProseMirror[contenteditable="true"]')
      .first()
      .waitFor({ state: "visible", timeout: 25_000 });

    // open the "..." page action menu -> Version history
    await page.locator("button:has(svg.tabler-icon-dots)").last().click();
    await page.getByRole("menuitem", { name: "Version history" }).click();

    // switch to the Activity tab within the combined view
    await page.getByRole("tab", { name: "Activity" }).click();

    await expect(
      page.getByText("A record of recent activity on this page."),
    ).toBeVisible();

    // the page has at least its creation entry
    await expect(rows(page).first()).toBeVisible();
  });
});
