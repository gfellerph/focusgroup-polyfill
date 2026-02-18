// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/direction/block-direction.spec.html");
});

test("Block focusgroup arrow right", async ({ page }) => {
  await page.locator("#block-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#block-focusgroup-button-1")).toBeFocused();
});

test("Block focusgroup arrow down", async ({ page }) => {
  await page.locator("#block-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#block-focusgroup-button-2")).toBeFocused();
});

test("Block focusgroup arrow left", async ({ page }) => {
  await page.locator("#block-focusgroup-button-2").press("ArrowLeft");
  await expect(page.locator("#block-focusgroup-button-2")).toBeFocused();
});

test("Block focusgroup arrow up", async ({ page }) => {
  await page.locator("#block-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#block-focusgroup-button-1")).toBeFocused();
});

test("Block focusgroup does not wrap right", async ({ page }) => {
  await page.locator("#block-focusgroup-button-5").press("ArrowDown");
  await expect(page.locator("#block-focusgroup-button-5")).toBeFocused();
});

test("Block focusgroup does not wrap left", async ({ page }) => {
  await page.locator("#block-focusgroup-button-1").press("ArrowUp");
  await expect(page.locator("#block-focusgroup-button-1")).toBeFocused();
});

test("Pressing down arrow on last element scrolls the page", async ({
  page,
}) => {
  const scrollTopBefore = await page.evaluate(() => window.scrollY);
  // Why does it not work with only one arrow press?
  for await (let i of Array(10).keys()) {
    await page.locator("#block-focusgroup-button-5").press("ArrowDown");
  }
  const scrollTopAfter = await page.evaluate(() => window.scrollY);
  expect(scrollTopAfter).toBeGreaterThan(scrollTopBefore);
});
