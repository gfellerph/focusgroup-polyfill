/**
 * Allows to descend into shadow roots easily by returning
 * the shadow root for elements who have it and the element itself if not
 * @param {Element} element
 * @returns {Element | ShadowRoot}
 */
const getRoot = (element: Element): Element | ShadowRoot => {
  return element.shadowRoot || element;
};

/**
 * Returns the children of an element
 * If it has a shadow root, it will instead return the shadow roots content
 * @param {Element} element
 * @returns {HTMLCollection | null}
 */
export const getChildren = (element: Element): HTMLCollection | null => {
  const root = getRoot(element);
  if ("assignedElements" in element) {
    return root.assignedElements();
  } else {
    return root.children;
  }
};

/**
 * Get the parent of an element
 * If element is assigned to a slot, this will return the slot
 * If element is part of a shadow root, it will return the host
 * If element has a regular parent it will return that
 * Returns null otherwise
 * @param {Element} element
 * @returns {Element | null}
 */
export const getParent = (element: Element): Element | null => {
  if (element.assignedSlot !== null) {
    return element.assignedSlot;
  }

  let parentNode = element.parentElement;

  if (parentNode === null) {
    parentNode = element.getRootNode()?.host;
  }

  return parentNode;
};

/**
 * Returns the first child, including slotted elements
 * @param {Element} element
 * @returns {Element | null}
 */
export const getFirstChild = (element: Element): Element | null => {
  const children = getChildren(element);
  if (children?.length > 0) {
    return children[0];
  }
  return null;
};
