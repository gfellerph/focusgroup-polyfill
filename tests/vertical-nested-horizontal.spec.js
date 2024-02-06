import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

// Top level tests
test("Vertical focusgroup arrow right should focus next top level", async ({
  page,
}) => {
  await page.locator("#vertical-nested-button-1").press("ArrowRight");
  await expect(page.locator("#vertical-nested-button-2")).toBeFocused();
});

test("Vertical focusgroup arrow down should descend to second level", async ({
  page,
}) => {
  await page.locator("#vertical-nested-button-1").press("ArrowDown");
  await expect(page.locator("#vertical-nested-h-g1-button-1")).toBeFocused();
});

test("Vertical focusgroup arrow left should go back to first button", async ({
  page,
}) => {
  await page.locator("#vertical-nested-button-2").press("ArrowLeft");
  await expect(page.locator("#vertical-nested-button-1")).toBeFocused();
});

test("Vertical focusgroup arrow up should not change focus", async ({
  page,
}) => {
  await page.locator("#vertical-nested-button-1").press("ArrowUp");
  await expect(page.locator("#vertical-nested-button-1")).toBeFocused();
});

// Second level tests
test("Vertical focusgroup arrow right in nested horizontal group", async ({
  page,
}) => {
  await page.locator("#vertical-nested-h-g1-button-1").press("ArrowDown");
  await expect(page.locator("#vertical-nested-button-2")).toBeFocused();
});
