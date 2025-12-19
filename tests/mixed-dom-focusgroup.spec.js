import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

test("Should focus ascending", async ({ page }) => {
  for (let i = 1; i < 8; i++) {
    await page.locator(`#mixed-dom-button-${i}`).press("ArrowRight");
    await expect(page.locator(`#mixed-dom-button-${i + 1}`)).toBeFocused();
  }
});

test("Should focus descending", async ({ page }) => {
  for (let i = 8; i > 1; i--) {
    await page.locator(`#mixed-dom-button-${i}`).press("ArrowLeft");
    await expect(page.locator(`#mixed-dom-button-${i - 1}`)).toBeFocused();
  }
});
