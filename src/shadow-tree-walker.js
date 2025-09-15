/**
 * Allows to descend into shadow roots easily by returning
 * the shadow root for elements who have it and the element itself if not
 * @param {Element} element
 * @returns {Element | ShadowRoot}
 */
const getRoot = (element) => {
  return element.shadowRoot || element;
};

/**
 * Returns the children of an element
 * If it has a shadow root, it will instead return the shadow roots content
 * @param {Element} element
 * @returns {HTMLCollection | null}
 */
export const getChildren = (element) => {
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
export const getParent = (element) => {
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
 * Recursively queries a shadow DOM tree for elements matching a filter function
 * @param {Element} root
 * @param {Function} filter
 * @param {Function} boundary
 * @returns {Element[]}
 */
export function shadowQuerySelector(
  root,
  filter = () => true,
  boundary = () => false
) {
  let candidates = [];

  if (filter(root)) candidates.push(root);

  for (const child of getChildren(root)) {
    if (boundary(child)) continue;
    const result = shadowQuerySelector(child, filter, boundary);
    candidates = candidates.concat(result);
  }

  return candidates;
}
