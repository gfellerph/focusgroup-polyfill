// @ts-check
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/wrapping/wrapping.spec.html");
});

test.describe("Wrapping focusgroup", () => {
  test("ArrowRight moves focus to next button", async ({ page }) => {
    await page.locator("#wrap-button-1").press("ArrowRight");
    await expect(page.locator("#wrap-button-2")).toBeFocused();
  });

  test("ArrowDown moves focus to next button", async ({ page }) => {
    await page.locator("#wrap-button-1").press("ArrowDown");
    await expect(page.locator("#wrap-button-2")).toBeFocused();
  });

  test("ArrowLeft on first button wraps to last button", async ({ page }) => {
    await page.locator("#wrap-button-1").press("ArrowLeft");
    await expect(page.locator("#wrap-button-5")).toBeFocused();
  });

  test("ArrowUp on first button wraps to last button", async ({ page }) => {
    await page.locator("#wrap-button-1").press("ArrowUp");
    await expect(page.locator("#wrap-button-5")).toBeFocused();
  });

  test("ArrowRight on last button wraps to first button", async ({ page }) => {
    await page.locator("#wrap-button-5").press("ArrowRight");
    await expect(page.locator("#wrap-button-1")).toBeFocused();
  });

  test("ArrowDown on last button wraps to first button", async ({ page }) => {
    await page.locator("#wrap-button-5").press("ArrowDown");
    await expect(page.locator("#wrap-button-1")).toBeFocused();
  });

  test("ArrowLeft on last button moves to previous button", async ({
    page,
  }) => {
    await page.locator("#wrap-button-5").press("ArrowLeft");
    await expect(page.locator("#wrap-button-4")).toBeFocused();
  });

  test("ArrowUp on last button moves to previous button", async ({ page }) => {
    await page.locator("#wrap-button-5").press("ArrowUp");
    await expect(page.locator("#wrap-button-4")).toBeFocused();
  });

  test("Can wrap forward through all buttons", async ({ page }) => {
    await page.locator("#wrap-button-1").focus();
    for (let i = 2; i <= 5; i++) {
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(`#wrap-button-${i}`)).toBeFocused();
    }
    // One more wraps back to first
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#wrap-button-1")).toBeFocused();
  });

  test("Can wrap backward through all buttons", async ({ page }) => {
    await page.locator("#wrap-button-5").focus();
    for (let i = 4; i >= 1; i--) {
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator(`#wrap-button-${i}`)).toBeFocused();
    }
    // One more wraps back to last
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#wrap-button-5")).toBeFocused();
  });
});

test.describe("Non-wrapping focusgroup", () => {
  test("ArrowRight moves focus to next button", async ({ page }) => {
    await page.locator("#nowrap-button-1").press("ArrowRight");
    await expect(page.locator("#nowrap-button-2")).toBeFocused();
  });

  test("ArrowLeft on first button does not wrap", async ({ page }) => {
    await page.locator("#nowrap-button-1").press("ArrowLeft");
    await expect(page.locator("#nowrap-button-1")).toBeFocused();
  });

  test("ArrowUp on first button does not wrap", async ({ page }) => {
    await page.locator("#nowrap-button-1").press("ArrowUp");
    await expect(page.locator("#nowrap-button-1")).toBeFocused();
  });

  test("ArrowRight on last button does not wrap", async ({ page }) => {
    await page.locator("#nowrap-button-5").press("ArrowRight");
    await expect(page.locator("#nowrap-button-5")).toBeFocused();
  });

  test("ArrowDown on last button does not wrap", async ({ page }) => {
    await page.locator("#nowrap-button-5").press("ArrowDown");
    await expect(page.locator("#nowrap-button-5")).toBeFocused();
  });

  test("ArrowLeft on last button moves to previous button", async ({
    page,
  }) => {
    await page.locator("#nowrap-button-5").press("ArrowLeft");
    await expect(page.locator("#nowrap-button-4")).toBeFocused();
  });
});

test.describe("RTL wrapping focusgroup", () => {
  test("ArrowLeft moves focus to next button (RTL forward)", async ({
    page,
  }) => {
    await page.locator("#rtl-wrap-button-1").press("ArrowLeft");
    await expect(page.locator("#rtl-wrap-button-2")).toBeFocused();
  });

  test("ArrowRight on first button wraps to last button (RTL backward)", async ({
    page,
  }) => {
    await page.locator("#rtl-wrap-button-1").press("ArrowRight");
    await expect(page.locator("#rtl-wrap-button-5")).toBeFocused();
  });

  test("ArrowDown moves focus to next button", async ({ page }) => {
    await page.locator("#rtl-wrap-button-1").press("ArrowDown");
    await expect(page.locator("#rtl-wrap-button-2")).toBeFocused();
  });

  test("ArrowUp on first button wraps to last button", async ({ page }) => {
    await page.locator("#rtl-wrap-button-1").press("ArrowUp");
    await expect(page.locator("#rtl-wrap-button-5")).toBeFocused();
  });

  test("ArrowLeft on last button wraps to first button (RTL forward wrap)", async ({
    page,
  }) => {
    await page.locator("#rtl-wrap-button-5").press("ArrowLeft");
    await expect(page.locator("#rtl-wrap-button-1")).toBeFocused();
  });

  test("ArrowRight on last button moves to previous button (RTL backward)", async ({
    page,
  }) => {
    await page.locator("#rtl-wrap-button-5").press("ArrowRight");
    await expect(page.locator("#rtl-wrap-button-4")).toBeFocused();
  });

  test("ArrowDown on last button wraps to first button", async ({ page }) => {
    await page.locator("#rtl-wrap-button-5").press("ArrowDown");
    await expect(page.locator("#rtl-wrap-button-1")).toBeFocused();
  });

  test("ArrowUp on last button moves to previous button", async ({ page }) => {
    await page.locator("#rtl-wrap-button-5").press("ArrowUp");
    await expect(page.locator("#rtl-wrap-button-4")).toBeFocused();
  });

  test("Can wrap forward through all buttons with ArrowLeft", async ({
    page,
  }) => {
    await page.locator("#rtl-wrap-button-1").focus();
    for (let i = 2; i <= 5; i++) {
      await page.keyboard.press("ArrowLeft");
      await expect(page.locator(`#rtl-wrap-button-${i}`)).toBeFocused();
    }
    await page.keyboard.press("ArrowLeft");
    await expect(page.locator("#rtl-wrap-button-1")).toBeFocused();
  });

  test("Can wrap backward through all buttons with ArrowRight", async ({
    page,
  }) => {
    await page.locator("#rtl-wrap-button-5").focus();
    for (let i = 4; i >= 1; i--) {
      await page.keyboard.press("ArrowRight");
      await expect(page.locator(`#rtl-wrap-button-${i}`)).toBeFocused();
    }
    await page.keyboard.press("ArrowRight");
    await expect(page.locator("#rtl-wrap-button-5")).toBeFocused();
  });
});

test.describe("RTL non-wrapping focusgroup", () => {
  test("ArrowLeft moves focus to next button", async ({ page }) => {
    await page.locator("#rtl-nowrap-button-1").press("ArrowLeft");
    await expect(page.locator("#rtl-nowrap-button-2")).toBeFocused();
  });

  test("ArrowRight on first button does not wrap", async ({ page }) => {
    await page.locator("#rtl-nowrap-button-1").press("ArrowRight");
    await expect(page.locator("#rtl-nowrap-button-1")).toBeFocused();
  });

  test("ArrowUp on first button does not wrap", async ({ page }) => {
    await page.locator("#rtl-nowrap-button-1").press("ArrowUp");
    await expect(page.locator("#rtl-nowrap-button-1")).toBeFocused();
  });

  test("ArrowLeft on last button does not wrap", async ({ page }) => {
    await page.locator("#rtl-nowrap-button-5").press("ArrowLeft");
    await expect(page.locator("#rtl-nowrap-button-5")).toBeFocused();
  });

  test("ArrowDown on last button does not wrap", async ({ page }) => {
    await page.locator("#rtl-nowrap-button-5").press("ArrowDown");
    await expect(page.locator("#rtl-nowrap-button-5")).toBeFocused();
  });

  test("ArrowRight on last button moves to previous button", async ({
    page,
  }) => {
    await page.locator("#rtl-nowrap-button-5").press("ArrowRight");
    await expect(page.locator("#rtl-nowrap-button-4")).toBeFocused();
  });
});
