import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/src/custom-attribute/custom-attribute-polyfill.test.html");
  await page.evaluate(async () => {
    const { Attribute, registerAttribute } = await import(
      "./custom-attribute-polyfill.js"
    );

    window.connected = [];
    window.changed = [];
    window.disconnected = [];

    class TestAttribute extends Attribute {
      constructor(name, element) {
        super(name, element);
      }

      toObject() {
        return {
          name: this.name,
          value: this.value,
          host: this.host,
        };
      }

      connectedCallback() {
        window.connected = [...window.connected, this.toObject()];
      }

      changedCallback() {
        window.changed = [...window.changed, this.toObject()];
      }

      disconnectedCallback() {
        window.disconnected = [...window.disconnected, this.toObject()];
      }
    }

    registerAttribute("test-attribute", TestAttribute);
  });
});

// Connected

test("connectedCallback is called on initial scan", async ({ page }) => {
  const connected = await page.evaluate(() => window.connected);
  expect(connected).toHaveLength(1);
  expect(connected[0]).toMatchObject({
    name: "test-attribute",
    value: "",
    host: "ref: <Node>",
  });
});

test("connectedCallback is called on newly added attributes", async ({
  page,
}) => {
  await page
    .getByTestId("no-attribute")
    .evaluate((node) => node.setAttribute("test-attribute", "new"));
  const connects = await page.evaluate(() => window.connected);
  const connect = connects.find((c) => c.value === "new");
  expect(connect.value).toBe("new");
});

test("connectedCallback is executed on newly added elements", async ({
  page,
}) => {
  await page.evaluate((node) => {
    const newNode = document.createElement("div");
    newNode.setAttribute("test-attribute", "new");
    newNode.setAttribute("data-testid", "new-attribute");
    document.documentElement.appendChild(newNode);
  });
  const connects = await page.evaluate(() => window.connected);
  const connect = connects.find((c) => c.value === "new");
  expect(connect.value).toBe("new");
});

// Changed

test("changedCallback is executed", async ({ page }) => {
  await page
    .locator("[test-attribute]")
    .evaluate((node) => node.setAttribute("test-attribute", "test2"));
  const [change1] = await page.evaluate(() => window.changed);
  expect(change1.value).toBe("test2");
});

// Disconnected

test("disconnectedCallback is executed", async ({ page }) => {
  await page
    .locator("[test-attribute]")
    .evaluate((node) => node.removeAttribute("test-attribute"));
  const [disconnect1] = await page.evaluate(() => window.disconnected);
  expect(disconnect1.name).toBe("test-attribute");
});
