import { test, expect, Page } from "@playwright/test";

// Requires a running instance + an admin account. Provide credentials via env.
const EMAIL = process.env.E2E_EMAIL;
const PASSWORD = process.env.E2E_PASSWORD;

async function login(page: Page) {
  await page.goto("/login");
  const email = page.locator('input[type="email"]');
  await email.waitFor({ state: "visible" }); // let the SPA hydrate
  await email.fill(EMAIL!);
  await page.locator('input[type="password"]').fill(PASSWORD!);
  await page.locator('button[type="submit"]').click();
  await page.waitForURL(/\/(home|s\/)/, { timeout: 30_000 });
}

async function openAuditLog(page: Page) {
  await page.goto("/settings/audit-logs");
  await expect(page.getByRole("heading", { name: "Audit log" })).toBeVisible();
  await expect(rows(page).first()).toBeVisible();
}

const rows = (page: Page) => page.locator("table tbody tr");

test.describe("audit log", () => {
  test.skip(!EMAIL || !PASSWORD, "set E2E_EMAIL and E2E_PASSWORD to run");

  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test("captures the sign-in and shows it in the audit log", async ({
    page,
  }) => {
    await openAuditLog(page);
    // logging in is an audited action, so the newest row is the sign-in
    await expect(rows(page).first()).toContainText("Signed in");
  });

  test("filters by action", async ({ page }) => {
    await openAuditLog(page);
    await page.getByPlaceholder("All actions").click();
    await page.getByRole("option", { name: "Signed in" }).first().click();
    await expect(rows(page).first()).toContainText("Signed in");
    // every visible row should match the filter
    const count = await rows(page).count();
    for (let i = 0; i < count; i++) {
      await expect(rows(page).nth(i)).toContainText("Signed in");
    }
  });

  test("paginates forward and back with the cursor", async ({ page }) => {
    await openAuditLog(page);
    const next = page.getByRole("button", { name: "Next" });

    if (!(await next.isEnabled())) {
      test.info().annotations.push({
        type: "note",
        description: "only one page of audit logs; pagination not exercised",
      });
      return;
    }

    const firstBefore = await rows(page).first().innerText();
    await next.click();
    await expect(async () => {
      expect(await rows(page).first().innerText()).not.toBe(firstBefore);
    }).toPass();

    await page.getByRole("button", { name: "Prev" }).click();
    await expect(async () => {
      expect(await rows(page).first().innerText()).toBe(firstBefore);
    }).toPass();
  });
});
