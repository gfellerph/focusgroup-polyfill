import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

test("Wrapping focusgroup arrow right should focus next button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#wrapping-focusgroup-button-2")).toBeFocused();
});

test("Wrapping focusgroup arrow down should focus next button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#wrapping-focusgroup-button-2")).toBeFocused();
});

test("Wrapping focusgroup arrow left should focus last button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-1").press("ArrowLeft");
  await expect(page.locator("#wrapping-focusgroup-button-5")).toBeFocused();
});

test("Wrapping focusgroup arrow up should focus last button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-1").press("ArrowUp");
  await expect(page.locator("#wrapping-focusgroup-button-5")).toBeFocused();
});

// Starting from the last button
test("Wrapping focusgroup arrow right on last should focus first button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-5").press("ArrowRight");
  await expect(page.locator("#wrapping-focusgroup-button-1")).toBeFocused();
});

test("Wrapping focusgroup arrow down on last should focus first button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-5").press("ArrowDown");
  await expect(page.locator("#wrapping-focusgroup-button-1")).toBeFocused();
});

test("Wrapping focusgroup arrow left should focus second last button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-5").press("ArrowLeft");
  await expect(page.locator("#wrapping-focusgroup-button-4")).toBeFocused();
});

test("Wrapping focusgroup arrow up should focus second tp last button", async ({
  page,
}) => {
  await page.locator("#wrapping-focusgroup-button-5").press("ArrowUp");
  await expect(page.locator("#wrapping-focusgroup-button-4")).toBeFocused();
});
