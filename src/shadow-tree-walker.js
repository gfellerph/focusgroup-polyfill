import { focusableSelector } from "./focusable-selectors.js";

/**
 * Option type for focusgroups
 * @typedef {object} FocusgroupOptions
 * @property {boolean} wrap
 * @property {boolean} horizontal
 * @property {boolean} vertical
 * @property {boolean} extend
 * @property {boolean} grid
 * @property {boolean} auto
 */

/**
 * Direction
 * @typedef {object} DIRECTION
 * @property {number} PREVIOUS
 * @property {number} NEXT
 * @property {number} FIRST
 * @property {number} LAST
 */
export const DIRECTION = {
  NEXT: 0,
  PREVIOUS: 1,
  FIRST: 2,
  LAST: 3,
};

/**
 *
 * @param {Element} element
 * @returns {boolean}
 */
export const isFocusgroup = (element) => {
  return element.hasAttribute("focusgroup");
};

export const focusgroupDirectionMatches = (optionsA, optionsB) => {
  if (!optionsA || !optionsB) {
    return true;
  }

  return (
    optionsA.horizontal === optionsB.horizontal ||
    optionsA.vertical === optionsB.vertical
  );
};

/**
 * Check if arrow key matches focusgroup direction
 * @param {string} key
 * @param {FocusgroupOptions} options
 */
export const isKeyMatchingDirection = (key, options) => {
  const vDir = ["ArrowUp", "ArrowDown"];
  const hDir = ["ArrowLeft", "ArrowRight"];

  return (
    (options.horizontal && options.vertical) ||
    (!options.vertical && hDir.includes(key)) ||
    (!options.horizontal && vDir.includes(key))
  );
};

/**
 *
 * @param {Element} element
 * @param {FocusgroupOptions}
 * @returns {boolean}
 */
export const isFocusgroupCandidate = (element, options) => {
  const parentNode = getParent(element);
  return parentNode && isFocusgroup(parentNode);
};

/**
 * Allows to descend into shadow roots easily by returning
 * the shadow root for elements who have it and the element itself if not
 * @param {Element} element
 * @returns {Element | ShadowRoot}
 */
export const getRoot = (element) => {
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
 *
 * @param {Element} element
 * @returns {Element | null}
 */
export const getFirstChild = (element) => {
  const children = getChildren(element);
  if (children?.length > 0) {
    return children[0];
  }
  return null;
};

/**
 *
 * @param {Element} element
 * @returns {Element | null}
 */
export const getLastChild = (element) => {
  const children = getChildren(element);
  if (children?.length > 0) {
    return children[children.length - 1];
  }
  return null;
};

/**
 * Find the nearest parent focusgroup
 * @param {Element} element
 * @returns {Element | null}
 */
export const getParentFocusgroup = (element) => {
  let currentElement = getParent(element);

  while (currentElement != null) {
    if (isFocusgroup(currentElement)) {
      return currentElement;
    }

    currentElement = getParent(currentElement);
  }

  return null;
};

/**
 * Figure out in which direction to walk the DOM tree
 * @param {Element} element
 * @returns {object} Direction mappings
 */
export const getDirectionMap = (element) => {
  const isLTR = getComputedStyle(element).direction === "ltr";

  return {
    ArrowLeft: isLTR ? DIRECTION.PREVIOUS : DIRECTION.NEXT,
    ArrowRight: isLTR ? DIRECTION.NEXT : DIRECTION.PREVIOUS,
    ArrowUp: DIRECTION.PREVIOUS,
    ArrowDown: DIRECTION.NEXT,
    End: DIRECTION.LAST,
    Home: DIRECTION.FIRST,
    MetaArrowRight: isLTR ? DIRECTION.LAST : DIRECTION.FIRST,
    MetaArrowLeft: isLTR ? DIRECTION.FIRST : DIRECTION.LAST,
  };
};

/**
 * Gets the parent node that is part of a parent focusgroup
 * @param {Element} element
 * @returns {Element | null}
 */
export const getContainerNodeOfNearestParentFocusgroup = (element) => {
  let currentElement = element;

  while (currentElement != null) {
    const currentParent = getParent(currentElement);
    if (isFocusgroup(currentParent)) {
      return currentElement;
    }

    currentElement = currentParent;
  }

  return null;
};

/**
 * Find the one ancestor focusgroup that is not extended
 * @param {Element} element
 * @returns {Element | null}
 */
export const getAncestorFocusgroup = (element) => {
  let currentElement = element;

  while (currentElement != null) {
    if (isFocusgroup(currentElement) && !getOptions(currentElement).extend) {
      return currentElement;
    }

    currentElement = getParent(currentElement);
  }

  return null;
};

/**
 * Get options of the current focusgroup
 * @param {Element} focusGroup
 * @returns {FocusgroupOptions}
 */
export const getOptions = (focusGroup) => {
  const optionsString = ` ${focusGroup.getAttribute("focusgroup").trim()} `;
  const options = {
    auto: optionsString.includes(" auto "),
    vertical: optionsString.includes(" vertical "),
    horizontal: optionsString.includes(" horizontal "),
    wrap: optionsString.includes(" wrap "),
    extend: optionsString.includes(" extend "),
    grid: optionsString.includes(" grid "),
  };
  // Auto case
  if ((!options.vertical && !options.horizontal) || options.auto) {
    options.vertical = true;
    options.horizontal = true;
  }
  // Only wrapping a child focusgroup does not make sense
  if (options.extend && options.wrap) {
    options.wrap = false;
  }
  return options;
};

/**
 * Search for nested focusgroups and return an array of the results
 * @param {Element} startNode
 * @returns {Element[]} Focusgroups
 */
export const getNestedFocusgroups = (startNode) => {
  const focusgroups = [];

  /**
   *
   * @param {Element} element
   */
  const findNestedFocusgroups = (element) => {
    let currentNode = element;
    while (currentNode) {
      if (isFocusgroup(currentNode)) {
        focusgroups.push(currentNode);
      }

      const child = getFirstChild(currentNode);
      if (child != null) {
        findNestedFocusgroups(child);
      }

      currentNode = currentNode.nextElementSibling;
    }
  };

  // Initialize tree search
  findNestedFocusgroups(getFirstChild(startNode));

  return focusgroups;
};

/**
 *
 * @param {Element} startNode
 * @param {number} direction
 * @returns {Element | null}
 */
export const findNestedCandidate = (element, direction, _options, key) => {
  let currentElement = element;

  while (currentElement) {
    // Check if we have a match
    const options = getOptions(getParent(element));
    debugger;
    if (
      currentElement.matches(focusableSelector) &&
      isFocusgroupCandidate(currentElement, options) &&
      isKeyMatchingDirection(key, options)
    ) {
      // TODO: only return if
      // 1. this belongs to the original focusgroup, or
      // 2. an extended focusgroup that is not the original one goes in the same direction
      return currentElement;
    }

    // Check if there are nested elements
    const child =
      DIRECTION.NEXT === direction
        ? getFirstChild(currentElement)
        : getLastChild(currentElement);
    if (child != null) {
      return findNestedCandidate(child, direction, null, key);
    }

    currentElement =
      DIRECTION.NEXT === direction
        ? currentElement.nextElementSibling
        : currentElement.previousElementSibling;
  }

  return currentElement;
};
