import { keyConflictSelector, isFocusable } from "./focusable.js";
import { getParent } from "./shadow-tree-walker.js";

/**
 * Option type for focusgroups
 * @typedef {object} FocusgroupOptions
 * @property {boolean} wrap
 * @property {boolean} inline
 * @property {boolean} block
 * @property {boolean} grid
 * @property {boolean} none
 * @property {boolean} nomemory
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
 * Check if the browser supports focus groups
 */
export const focusGroupSupported =
  document && "focusgroup" in document.createElement("div");

/**
 * Check if the element is a focusgroup
 * @param {Element} element
 * @returns {boolean}
 */
export function isFocusgroup(element) {
  return element.hasAttribute("focusgroup");
}

/**
 * Checks if an element is a candidate for a focusgroup and returns
 * the result of the check and also the reason that lead to the result
 * @param {Element} element
 * @returns {boolean}
 */
export const isFocusgroupCandidate = (element) => {
  const focusgroup = getParentFocusgroup(element);

  // Check if element is part of a focusgroup
  if (!focusgroup) return false;

  // Check if the focusgroup options is not none
  const options = getFocusgroupOptions(focusgroup);
  if (options.none) return false;

  // Check if the element is focusable
  if (!isFocusable(element)) return false;

  // Check if the element has no key conflict
  if (element.matches(keyConflictSelector)) return false;

  // All checks passed, this is a candidate
  return true;
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
 * @param {FocusgroupOptions} options Current focusgroup options
 * @returns {object} Direction mappings
 */
export const getDirectionMap = (element, options) => {
  const isLTR = getComputedStyle(element).direction === "ltr";

  let keymap = {};

  if (options.inline) {
    keymap = {
      ...keymap,
      ArrowLeft: isLTR ? DIRECTION.PREVIOUS : DIRECTION.NEXT,
      ArrowRight: isLTR ? DIRECTION.NEXT : DIRECTION.PREVIOUS,
      End: DIRECTION.LAST,
      Home: DIRECTION.FIRST,
      MetaArrowRight: isLTR ? DIRECTION.LAST : DIRECTION.FIRST,
      MetaArrowLeft: isLTR ? DIRECTION.FIRST : DIRECTION.LAST,
    };
  }

  if (options.block) {
    keymap = {
      ...keymap,
      ArrowUp: DIRECTION.PREVIOUS,
      ArrowDown: DIRECTION.NEXT,
      MetaArrowUp: DIRECTION.FIRST,
      MetaArrowDown: DIRECTION.LAST,
    };
  }

  return keymap;
};

/**
 * Get options of the current focusgroup
 * @param {Element} focusGroup
 * @returns {FocusgroupOptions}
 */
export const getFocusgroupOptions = (focusGroup) => {
  const optionsString = ` ${focusGroup.getAttribute("focusgroup").trim()} `;
  const options = {
    block: optionsString.includes(" block "),
    inline: optionsString.includes(" inline "),
    wrap: optionsString.includes(" wrap "),
    grid: optionsString.includes(" grid "),
    none: optionsString.includes(" none "),
    nomemory: optionsString.includes(" no-memory "),
  };

  // "Both" case
  if (!options.block && !options.inline) {
    options.block = true;
    options.inline = true;
  }

  return options;
};
