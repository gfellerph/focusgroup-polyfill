// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/direction/inline-direction.spec.html");
});

test("Inline focusgroup arrow right", async ({ page }) => {
  await page.locator("#inline-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#inline-focusgroup-button-2")).toBeFocused();
});

test("Inline focusgroup arrow down", async ({ page }) => {
  await page.locator("#inline-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#inline-focusgroup-button-1")).toBeFocused();
});

test("Inline focusgroup arrow left", async ({ page }) => {
  await page.locator("#inline-focusgroup-button-2").press("ArrowLeft");
  await expect(page.locator("#inline-focusgroup-button-1")).toBeFocused();
});

test("Inline focusgroup arrow up", async ({ page }) => {
  await page.locator("#inline-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#inline-focusgroup-button-2")).toBeFocused();
});

test("Inline focusgroup does not wrap right", async ({ page }) => {
  await page.locator("#inline-focusgroup-button-5").press("ArrowRight");
  await expect(page.locator("#inline-focusgroup-button-5")).toBeFocused();
});

test("Inline focusgroup does not wrap left", async ({ page }) => {
  await page.locator("#inline-focusgroup-button-1").press("ArrowLeft");
  await expect(page.locator("#inline-focusgroup-button-1")).toBeFocused();
});
