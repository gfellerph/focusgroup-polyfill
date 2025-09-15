import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("Arrow right should focus button 2", async ({ page }) => {
  await page
    .locator("#horizontal-extending-vertical-button-1")
    .press("ArrowRight");
  await expect(
    page.locator("#horizontal-extending-vertical-button-2")
  ).toBeFocused();
});

test("Arrow up on 3-1 should not move focus", async ({ page }) => {
  await page
    .locator("#horizontal-extending-vertical-button-3-1")
    .press("ArrowUp");
  await expect(
    page.locator("#horizontal-extending-vertical-button-3-1")
  ).toBeFocused();
});

test("Arrow down on 3-3 should not move focus", async ({ page }) => {
  await page
    .locator("#horizontal-extending-vertical-button-3-3")
    .press("ArrowDown");
  await expect(
    page.locator("#horizontal-extending-vertical-button-3-3")
  ).toBeFocused();
});

test("Arrow down on 4 should not move focus", async ({ page }) => {
  await page
    .locator("#horizontal-extending-vertical-button-4")
    .press("ArrowDown");
  await expect(
    page.locator("#horizontal-extending-vertical-button-4")
  ).toBeFocused();
});

test("Arrow right on 3 should focus 4", async ({ page }) => {
  await page
    .locator("#horizontal-extending-vertical-button-3")
    .press("ArrowRight");
  await expect(
    page.locator("#horizontal-extending-vertical-button-4")
  ).toBeFocused();
});

test("Arrow left on 4 should focus 3", async ({ page }) => {
  await page
    .locator("#horizontal-extending-vertical-button-4")
    .press("ArrowLeft");
  await expect(
    page.locator("#horizontal-extending-vertical-button-3")
  ).toBeFocused();
});
