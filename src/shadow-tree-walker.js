/**
 * A tree walker that crosses shadow dom roots
 * @class
 * @constructor
 */
export class ShadowWalker {
  /**
   * The currently selected node
   * @type {Element|null}
   */
  currentNode = null;

  /**
   *
   * @param {Element} node
   */
  constructor(node) {
    if (node instanceof Element) {
      this.currentNode = node;
    }
  }

  get #parentNode() {
    if (this.currentNode.assignedSlot !== null) {
      return this.currentNode.assignedSlot;
    }

    let parentNode = this.currentNode.parentElement;

    if (parentNode === null) {
      parentNode = this.currentNode.getRootNode()?.host;
    }

    return parentNode;
  }

  /**
   * Selects the parent node
   * @returns {Element|null}
   */
  parentNode() {
    const parentNode = this.#parentNode;

    if (parentNode !== null) {
      this.currentNode = parentNode;
    }

    return parentNode;
  }

  get #root() {
    return this.currentNode.shadowRoot || this.currentNode;
  }

  get #hasChildren() {
    return this.currentNode.childElementCount > 0;
  }

  firstChild() {
    if (!this.#hasChildren) {
      return null;
    }

    this.currentNode = this.#root.firstElementChild;

    return this.currentNode;
  }

  lastChild() {
    if (!this.#hasChildren) {
      return null;
    }

    this.currentNode = this.#root.lastElementChild;

    return this.currentNode;
  }

  children() {
    if (!this.#hasChildren) {
      return null;
    }

    return this.#root.children;
  }

  previousSibling() {
    const previousSibling = this.currentNode.previousElementSibling;
    if (previousSibling !== null) {
      this.currentNode = previousSibling;
    }
    return previousSibling;
  }

  nextSibling() {
    const nextSibling = this.currentNode.nextElementSibling;
    if (nextSibling !== null) {
      this.currentNode = nextSibling;
    }
    return nextSibling;
  }

  /**
   *
   * @returns {boolean}
   */
  isFocusgroup() {
    return this.currentNode.hasAttribute("focusgroup");
  }

  /**
   *
   * @returns {boolean}
   */
  isFocusgroupCandidate() {
    const parentNode = this.#parentNode;
    return !!(parentNode && parentNode.hasAttribute("focusgroup"));
  }
}

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
