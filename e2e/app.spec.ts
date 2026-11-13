import { test, expect } from "@playwright/test";

test.describe("Anfio Attendance & Team Management E2E", () => {
  test("landing page renders and links to login and register", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByText("Anfio HRMS")).toBeVisible();
    await expect(page.getByRole("link", { name: /Sign in/i }).first()).toBeVisible();
    await expect(
      page.getByRole("link", { name: /Employee Register/i }).first()
    ).toBeVisible();
  });

  test("health API returns ok", async ({ request }) => {
    const res = await request.get("/api/health");
    expect(res.ok()).toBeTruthy();
    const json = await res.json();
    expect(json.status).toBe("ok");
  });

  test("login, register, and forgot-password pages render properly", async ({
    page,
  }) => {
    await page.goto("/login");
    await expect(
      page.getByRole("heading", { name: /Sign in to your account/i })
    ).toBeVisible();

    await page.goto("/register");
    await expect(
      page.getByRole("heading", { name: /Employee Registration/i })
    ).toBeVisible();

    await page.goto("/forgot-password");
    await expect(
      page.getByRole("heading", { name: /Reset your password/i })
    ).toBeVisible();
  });

  test("protected routes redirect unauthenticated users to /login", async ({
    page,
  }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/login/);

    await page.goto("/admin");
    await expect(page).toHaveURL(/\/login/);
  });

  test("protected API routes reject unauthenticated requests", async ({
    request,
  }) => {
    const checkInRes = await request.post("/api/attendance/check-in");
    expect(checkInRes.status()).toBe(401);

    const adminSettingsRes = await request.get("/api/admin/settings");
    expect(adminSettingsRes.status()).toBe(401);
  });

  test("mobile viewport renders landing page without horizontal overflow", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    const hasOverflow = await page.evaluate(
      () => document.documentElement.scrollWidth > window.innerWidth
    );
    expect(hasOverflow).toBe(false);
  });
});
