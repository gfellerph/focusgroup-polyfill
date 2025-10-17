test("getChildren returns children in deeply nested shadow DOM", async ({
  page,
}) => {
  const deepChildId = await page.evaluate(async () => {
    const { getChildren } = await import("./shadow-tree-walker.js");
    const deepHost = document.getElementById("deep-host");
    // First shadow root
    const deepChild1 = getChildren(deepHost)[0];
    // Second shadow root inside deepChild1
    const deepHost2 = deepChild1.querySelector("#deep-host-2");
    const deepChild2 = getChildren(deepHost2)[0];
    return deepChild2.id;
  });
  expect(deepChildId).toBe("deep-child-2");
});

test("getParent traverses up deeply nested shadow DOM", async ({ page }) => {
  const parentIds = await page.evaluate(async () => {
    const { getParent } = await import("./shadow-tree-walker.js");
    const deepHost = document.getElementById("deep-host");
    const deepChild1 = deepHost.shadowRoot.querySelector("#deep-child-1");
    const deepHost2 = deepChild1.querySelector("#deep-host-2");
    const deepChild2 = deepHost2.shadowRoot.querySelector("#deep-child-2");
    // Parent of deepChild2 should be deepHost2
    const parent1 = getParent(deepChild2);
    // Parent of deepHost2 should be deepChild1
    const parent2 = getParent(deepHost2);
    // Parent of deepChild1 should be deepHost
    const parent3 = getParent(deepChild1);
    return [
      parent1 === deepHost2,
      parent2 === deepChild1,
      parent3 === deepHost,
    ];
  });
  expect(parentIds[0]).toBe(true);
  expect(parentIds[1]).toBe(true);
  expect(parentIds[2]).toBe(true);
});

test("shadowQuerySelector finds elements in deeply nested shadow DOM", async ({
  page,
}) => {
  const found = await page.evaluate(async () => {
    const { shadowQuerySelector } = await import("./shadow-tree-walker.js");
    const deepHost = document.getElementById("deep-host");
    // Find deep-child-2 from the top host
    const results = shadowQuerySelector(
      deepHost,
      (el) => el.id === "deep-child-2"
    );
    return results.length === 1 && results[0].id === "deep-child-2";
  });
  expect(found).toBe(true);
});
import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/src/shadow-tree-walker/shadow-tree-walker.test.html");
});

test("getChildren returns shadow DOM children", async ({ page }) => {
  const shadowChildren = await page.evaluate(async () => {
    const { getChildren } = await import("./shadow-tree-walker.js");
    const host = document.getElementById("shadow-host");
    return getChildren(host)[0].id;
  });
  expect(shadowChildren).toBe("shadow-child");
});

test("getParent traverses shadow DOM and slot correctly", async ({ page }) => {
  const parentIds = await page.evaluate(async () => {
    const { getParent } = await import("./shadow-tree-walker.js");
    // Test shadow child parent is shadow host
    const host = document.getElementById("shadow-host");
    const shadowChild = host.shadowRoot.getElementById("shadow-child");
    const parent1 = getParent(shadowChild);
    // Test slotted element parent is slot
    const slotted = document.getElementById("slotted-element");
    const slotHost = document.getElementById("slot-host");
    const slot = slotHost.shadowRoot.querySelector("slot");
    const parent2 = getParent(slotted);
    return [parent1 === host, parent2 === slot];
  });
  expect(parentIds[0]).toBe(true);
  expect(parentIds[1]).toBe(true);
});

test("shadowQuerySelector finds elements in shadow DOM and slotted elements", async ({
  page,
}) => {
  const results = await page.evaluate(async () => {
    const { shadowQuerySelector } = await import("./shadow-tree-walker.js");
    const host = document.getElementById("shadow-host");
    const slotHost = document.getElementById("slot-host");
    // Find shadow child
    const shadowResults = shadowQuerySelector(
      host,
      (el) => el.id === "shadow-child"
    );
    // Find slotted element
    const slotResults = shadowQuerySelector(
      slotHost,
      (el) => el.id === "slotted-element"
    );
    return {
      shadowChildFound:
        shadowResults.length === 1 && shadowResults[0].id === "shadow-child",
      slottedFound:
        slotResults.length === 1 && slotResults[0].id === "slotted-element",
    };
  });
  expect(results.shadowChildFound).toBe(true);
  expect(results.slottedFound).toBe(true);
});
