// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

test("Wrong horizontal vertical focusgroup arrow right", async ({ page }) => {
  await page.locator("#wrong-hv-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#wrong-hv-focusgroup-button-2")).toBeFocused();
});

test("Wrong horizontal vertical focusgroup arrow down", async ({ page }) => {
  await page.locator("#wrong-hv-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#wrong-hv-focusgroup-button-2")).toBeFocused();
});

test("Wrong horizontal vertical focusgroup arrow left", async ({ page }) => {
  await page.locator("#wrong-hv-focusgroup-button-2").press("ArrowLeft");
  await expect(page.locator("#wrong-hv-focusgroup-button-1")).toBeFocused();
});

test("Wrong horizontal vertical focusgroup arrow up", async ({ page }) => {
  await page.locator("#wrong-hv-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#wrong-hv-focusgroup-button-1")).toBeFocused();
});

test("Wrong horizontal vertical focusgroup does not wrap right", async ({
  page,
}) => {
  await page.locator("#wrong-hv-focusgroup-button-5").press("ArrowRight");
  await expect(page.locator("#wrong-hv-focusgroup-button-5")).toBeFocused();
});

test("Wrong horizontal vertical focusgroup does not wrap left", async ({
  page,
}) => {
  await page.locator("#wrong-hv-focusgroup-button-1").press("ArrowLeft");
  await expect(page.locator("#wrong-hv-focusgroup-button-1")).toBeFocused();
});
