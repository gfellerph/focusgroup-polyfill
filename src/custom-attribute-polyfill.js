/*
 * An attempt at creating attributes with lifecycles - a little
 * bit like custom elements. Inspired by https://github.com/WICG/webcomponents/issues/1029
 */

const observerConfig = {
  attributes: true,
  subtree: true,
  attributeOldValue: true,
  characterData: false,
  characterDataOldValue: false,
  childList: true,
};

/**
 * Represents a registry of custom attributes.
 */
const registries = new WeakMap();

/**
 * Represents a custom attribute on an element.
 */
export class Attribute {
  #host;
  #name;

  /**
   * Get the host element of the attribute.
   * @returns {Element}
   */
  get host() {
    return this.#host;
  }

  /**
   * Get the name of the attribute.
   * @returns {string}
   */
  get name() {
    return this.#name;
  }

  /**
   * Get the value of the attribute.
   * @returns {string | null}
   */
  get value() {
    return this.#host.getAttribute(this.#name);
  }

  /**
   * Create an instance of the attribute.
   * @param {string} name
   * @param {Element} host
   */
  constructor(name, host) {
    this.#host = host;
    this.#name = name;
  }

  /**
   * Called when the attribute is connected to the host element.
   * @param {string | null} _value - The initial value of the attribute.
   */
  connectedCallback(_value) {
    // console.log("native created");
  }

  /**
   * Called when the attribute value changes.
   * @param {string | null} _newValue - The new value of the attribute.
   * @param {string | null} _oldValue - The old value of the attribute.
   */
  changedCallback(_newValue, _oldValue) {
    // console.log("native changed");
  }

  /**
   * Called when the attribute is disconnected from the host element.
   */
  disconnectedCallback() {
    // console.log("native removed");
  }
}

/**
 * @template T
 * @typedef {new (...args: any[]) => T} Attribute
 */

const validAttributeNames = new RegExp(/^(?:[A-Z_]|-[A-Z-_])[A-Z0-9_-]*$/i);

/**
 * Register a custom attribute on a given root element.
 * @param {string} name - The name of the attribute.
 * @param {Attribute} customAttribute - The custom attribute class.
 * @param {Document | DocumentFragment | Element} root - The root element to observe.
 * @param {boolean} deep - Whether to observe child elements.
 * @returns {void}
 */
export function registerAttribute(
  name,
  customAttribute,
  root = document,
  deep = true
) {
  if (!validAttributeNames.test(name)) {
    console.error(
      `Failed to execute 'registerAttribute': the name "${name}" is not a valid attribute name.`
    );
    return;
  }

  if (!(customAttribute.prototype instanceof Attribute)) {
    console.error(
      `Failed to execute 'registerAttribute': the customAttribute is not a valid CustomAttribute instance.`
    );
    return;
  }

  if (!(root instanceof Document || root instanceof Element)) {
    console.error(
      `Failed to execute 'registerAttribute': the root is not a valid Document or Element.`
    );
    return;
  }

  // Normalize childList option, if it's anything else than true, it's false
  deep = deep === true;

  const observedElements = new WeakMap();
  const existingObserver = registries.get(root);
  let observer;
  let attributeFilter = [name];

  if (existingObserver) {
    // Attribute observer already defined
    if (existingObserver.attributes.includes(name)) {
      console.error(
        `Failed to execute 'registerAttribute': the name "${name}" has already been used within the scope of ${root}.`
      );
      return;
    }
    observer = existingObserver.observer;
    attributeFilter = [...attributeFilter, ...existingObserver.attributes];
    // Reset observer to start observing with new attribute filter
    observer.disconnect();
  } else {
    observer = new MutationObserver(mutationHandler);
  }

  function mutationHandler(mutationList) {
    for (let record of mutationList) {
      // Element (or parent of element) got removed
      if (record.type === "childList" && record.removedNodes.length > 0) {
        for (let removedNode of record.removedNodes) {
          if (removedNode instanceof Element) {
            if (removedNode.hasAttribute(name)) {
              if (observedElements.has(removedNode))
                observedElements.get(removedNode)?.disconnectedCallback();
            } else {
              removedNode.querySelectorAll(`[${name}]`).forEach((node) => {
                if (observedElements.has(node))
                  observedElements.get(node)?.disconnectedCallback();
              });
            }
          }
        }
        return;
      }
      // Element with attribute got added
      if (record.type === "childList" && record.addedNodes.length > 0) {
        for (let addedNode of record.addedNodes) {
          if (addedNode instanceof Element) {
            if (addedNode.hasAttribute(name)) {
              newAttribute(addedNode);
            } else {
              addedNode.querySelectorAll(`[${name}]`).forEach((node) => {
                newAttribute(node);
              });
            }
          }
        }
        return;
      }

      // Attribute changed
      if (record.type === "attributes" && record.target instanceof Element) {
        const newValue = record.target.getAttribute(name);
        const oldValue = record.oldValue;

        if (oldValue === null) {
          // New attribute
          newAttribute(record.target);
        } else if (newValue === null && observedElements.has(record.target)) {
          // Deleted
          const cls = observedElements.get(record.target);
          cls.disconnectedCallback();
          observedElements.delete(record.target);
        } else if (
          newValue !== record.oldValue &&
          observedElements.has(record.target)
        ) {
          // Change
          const cls = observedElements.get(record.target);
          cls.changedCallback(newValue, record.oldValue);
        }
      }
    }
  }

  /**
   * Instantiate new attribute
   * @param {Element} element
   */
  function newAttribute(element) {
    const cls = new customAttribute(name, element);
    cls.connectedCallback(element.getAttribute(name));
    observedElements.set(element, cls);
  }

  // Start listening to changes
  observer.observe(root, {
    ...observerConfig,
    attributeFilter,
    childList: deep,
    subtree: deep,
  });

  // Initial pass
  if (deep) {
    root.querySelectorAll(`[${name}]`).forEach((element) => {
      newAttribute(element);
    });
  } else if (root instanceof Element) {
    newAttribute(root);
  } else {
    // Throw error or what?
  }
}
