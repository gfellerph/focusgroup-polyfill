// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
});

test("has title", async ({ page }) => {
  await expect(page).toHaveTitle("Focusgroup");
});

test("Reference tab test", async ({ page, browserName }) => {
  const button1 = await page.$("#regular-focusgroup-button-1");
  await button1?.focus();
  const tabKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
  await button1?.press(tabKey);
  await expect(page.locator("#rtl-focusgroup-button-1")).toBeFocused();
});

test("Regular focusgroup arrow right", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-1").press("ArrowRight");
  await expect(page.locator("#regular-focusgroup-textinput")).toBeFocused();
});

test("Regular focusgroup arrow down", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-1").press("ArrowDown");
  await expect(page.locator("#regular-focusgroup-textinput")).toBeFocused();
});

test("Regular focusgroup arrow left", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-2").press("ArrowLeft");
  await expect(page.locator("#regular-focusgroup-textinput")).toBeFocused();
});

test("Regular focusgroup arrow up", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-2").press("ArrowUp");
  await expect(page.locator("#regular-focusgroup-textinput")).toBeFocused();
});

test("Regular focusgroup does not wrap right", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-5").press("ArrowRight");
  await expect(page.locator("#regular-focusgroup-button-5")).toBeFocused();
});

test("Regular focusgroup does not wrap left", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-1").press("ArrowLeft");
  await expect(page.locator("#regular-focusgroup-button-1")).toBeFocused();
});

test("Regular focusgroup end keypress", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-1").press("End");
  await expect(page.locator("#regular-focusgroup-button-5")).toBeFocused();
});

test("Regular focusgroup home keypress", async ({ page }) => {
  await page.locator("#regular-focusgroup-button-5").press("Home");
  await expect(page.locator("#regular-focusgroup-button-1")).toBeFocused();
});
