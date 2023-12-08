// @ts-check
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Horizontal focusgroup arrow right", async ({ page }) => {
  await page.locator("#horizontal-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#horizontal-focusgroup-button-2")).toBeFocused();
});

test("Horizontal focusgroup arrow down", async ({ page }) => {
  await page.locator("#horizontal-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#horizontal-focusgroup-button-1")).toBeFocused();
});

test("Horizontal focusgroup arrow left", async ({ page }) => {
  await page.locator("#horizontal-focusgroup-button-2").press("ArrowLeft");
  await expect(page.locator("#horizontal-focusgroup-button-1")).toBeFocused();
});

test("Horizontal focusgroup arrow up", async ({ page }) => {
  await page.locator("#horizontal-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#horizontal-focusgroup-button-2")).toBeFocused();
});

test("Horizontal focusgroup does not wrap right", async ({ page }) => {
  await page.locator("#horizontal-focusgroup-button-5").press("ArrowRight");
  await expect(page.locator("#horizontal-focusgroup-button-5")).toBeFocused();
});

test("Horizontal focusgroup does not wrap left", async ({ page }) => {
  await page.locator("#horizontal-focusgroup-button-1").press("ArrowLeft");
  await expect(page.locator("#horizontal-focusgroup-button-1")).toBeFocused();
});
