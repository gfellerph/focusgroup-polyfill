import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

test("Reference tab test", async ({ page }) => {
  const button1 = await page.$("#shadow-dom-focusgroup-button-1");
  await button1?.focus();
  await button1?.press("Tab");
  await expect(
    page.locator("#shadow-dom-focusgroup-button-2")
  ).not.toBeFocused();
});

test("Regular focusgroup arrow right", async ({ page }) => {
  await page.locator("#shadow-dom-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#shadow-dom-focusgroup-button-2")).toBeFocused();
});

test("Regular focusgroup arrow down", async ({ page }) => {
  await page.locator("#shadow-dom-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#shadow-dom-focusgroup-button-2")).toBeFocused();
});

test("Regular focusgroup arrow left", async ({ page }) => {
  await page.locator("#shadow-dom-focusgroup-button-2").press("ArrowLeft");
  await expect(page.locator("#shadow-dom-focusgroup-button-1")).toBeFocused();
});

test("Regular focusgroup arrow up", async ({ page }) => {
  await page.locator("#shadow-dom-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#shadow-dom-focusgroup-button-1")).toBeFocused();
});

test("Regular focusgroup does not wrap right", async ({ page }) => {
  await page.locator("#shadow-dom-focusgroup-button-5").press("ArrowRight");
  await expect(page.locator("#shadow-dom-focusgroup-button-5")).toBeFocused();
});

test("Regular focusgroup does not wrap left", async ({ page }) => {
  await page.locator("#shadow-dom-focusgroup-button-1").press("ArrowLeft");
  await expect(page.locator("#shadow-dom-focusgroup-button-1")).toBeFocused();
});
