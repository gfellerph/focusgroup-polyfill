// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("RTL focusgroup arrow right", async ({ page }) => {
  await page.locator("#rtl-focusgroup-button-2").press("ArrowRight");
  await expect(page.locator("#rtl-focusgroup-button-1")).toBeFocused();
});

test("RTL focusgroup arrow down", async ({ page }) => {
  await page.locator("#rtl-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#rtl-focusgroup-button-2")).toBeFocused();
});

test("RTL focusgroup arrow left", async ({ page }) => {
  await page.locator("#rtl-focusgroup-button-1").press("ArrowLeft");
  await expect(page.locator("#rtl-focusgroup-button-2")).toBeFocused();
});

test("RTL focusgroup arrow up", async ({ page }) => {
  await page.locator("#rtl-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#rtl-focusgroup-button-1")).toBeFocused();
});

test("RTL focusgroup does not wrap right", async ({ page }) => {
  await page.locator("#rtl-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#rtl-focusgroup-button-1")).toBeFocused();
});

test("RTL focusgroup does not wrap left", async ({ page }) => {
  await page.locator("#rtl-focusgroup-button-5").press("ArrowLeft");
  await expect(page.locator("#rtl-focusgroup-button-5")).toBeFocused();
});
