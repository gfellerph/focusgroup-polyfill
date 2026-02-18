// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/entry-priority/entry-priority.spec.html");
});

test("Tab on first button jumps to entry priority button", async ({ page }) => {
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await expect(page.locator("#focusgroup-button-4")).toBeFocused();
});

test("Sequence of tabbing respects entry priority and memory elements", async ({
  page,
}) => {
  await page.keyboard.press("Tab");
  await expect(page.locator("#first-button")).toBeFocused();

  // Tab to entry priority button
  await page.keyboard.press("Tab");
  await expect(page.locator("#focusgroup-button-4")).toBeFocused();

  // Arrow right to button 5
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#focusgroup-button-5")).toBeFocused();

  // Tab out of focusgroup
  await page.keyboard.press("Shift+Tab");
  await expect(page.locator("#first-button")).toBeFocused();

  // Tab back into focusgroup, should go to button 5 (last focused)
  await page.keyboard.press("Tab");
  await expect(page.locator("#focusgroup-button-5")).toBeFocused();
});
