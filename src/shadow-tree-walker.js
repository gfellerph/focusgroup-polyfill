import { focusableSelector } from "./focusable-selectors";

/**
 * Direction
 * @typedef {object} DIRECTION
 * @property {number} PREVIOUS
 * @property {number} NEXT
 */
export const DIRECTION = {
  NEXT: 0,
  PREVIOUS: 1,
};

/**
 *
 * @param {Element} element
 * @returns {boolean}
 */
export const isFocusgroup = (element) => {
  return element.hasAttribute("focusgroup");
};

/**
 *
 * @param {Element} element
 * @returns {boolean}
 */
export const isFocusgroupCandidate = (element) => {
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
  return getRoot(element).children;
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
  return getRoot(element)?.firstElementChild;
};

/**
 *
 * @param {Element} element
 * @returns {Element | null}
 */
export const getLastChild = (element) => {
  return getRoot(element)?.lastElementChild;
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
 * @param {DIRECTION} direction
 * @returns {Element | null}
 */
export const findNestedCandidate = (startNode, direction) => {
  const findNestedFocusable = (element) => {
    let currentElement = element;

    while (currentElement) {
      // Check if we have a match
      if (
        isFocusgroupCandidate(currentElement) &&
        currentElement.matches(focusableSelector)
      ) {
        // TODO: only return if
        // 1. this belongs to the original focusgroup, or
        // 2. an extended focusgroup that is not the original one goes in the same direction
        return currentElement;
      }

      // Check if there are nested elements
      const child = DIRECTION.NEXT
        ? getFirstChild(currentElement)
        : getLastChild(currentElement);
      if (child != null) {
        return findNestedFocusable(child);
      }

      currentElement = DIRECTION.NEXT
        ? currentElement.nextElementSibling
        : currentElement.previousElementSibling;
    }

    return currentElement;
  };

  // Define starting node
  const currenNode =
    direction === DIRECTION.NEXT
      ? getFirstChild(startNode) || startNode.nextElementSibling
      : getLastChild(startNode) || startNode.previousElementSibling;
  return findNestedFocusable(currenNode);
};
