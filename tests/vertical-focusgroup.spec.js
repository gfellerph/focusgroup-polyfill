// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/index.html");
});

test("Vertical focusgroup arrow right", async ({ page }) => {
  await page.locator("#vertical-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#vertical-focusgroup-button-1")).toBeFocused();
});

test("Vertical focusgroup arrow down", async ({ page }) => {
  await page.locator("#vertical-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#vertical-focusgroup-button-2")).toBeFocused();
});

test("Vertical focusgroup arrow left", async ({ page }) => {
  await page.locator("#vertical-focusgroup-button-2").press("ArrowLeft");
  await expect(page.locator("#vertical-focusgroup-button-2")).toBeFocused();
});

test("Vertical focusgroup arrow up", async ({ page }) => {
  await page.locator("#vertical-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#vertical-focusgroup-button-1")).toBeFocused();
});

test("Vertical focusgroup does not wrap right", async ({ page }) => {
  await page.locator("#vertical-focusgroup-button-5").press("ArrowDown");
  await expect(page.locator("#vertical-focusgroup-button-5")).toBeFocused();
});

test("Vertical focusgroup does not wrap left", async ({ page }) => {
  await page.locator("#vertical-focusgroup-button-1").press("ArrowUp");
  await expect(page.locator("#vertical-focusgroup-button-1")).toBeFocused();
});

test("Pressing down arrow on last element scrolls the page", async ({
  page,
}) => {
  const scrollTopBefore = await page.evaluate(() => window.scrollY);
  // Why does it not work with only one arrow press?
  for await (let i of Array(10).keys()) {
    await page.locator("#vertical-focusgroup-button-5").press("ArrowDown");
  }
  const scrollTopAfter = await page.evaluate(() => window.scrollY);
  expect(scrollTopAfter).toBeGreaterThan(scrollTopBefore);
});
