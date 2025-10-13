import { keyConflictSelector, isFocusable } from "./focusable.js";
import { getParent } from "./shadow-tree-walker/shadow-tree-walker.js";

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
export function isFocusgroupCandidate(element) {
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
}

/**
 * Find the nearest parent focusgroup
 * @param {Element} element
 * @returns {Element | null}
 */
export function getParentFocusgroup(element) {
  let currentElement = getParent(element);

  while (currentElement != null) {
    if (isFocusgroup(currentElement)) {
      return currentElement;
    }

    currentElement = getParent(currentElement);
  }

  return null;
}

/**
 * Figure out in which direction to walk the DOM tree
 * @param {Element} element
 * @param {FocusgroupOptions} options Current focusgroup options
 * @returns {object} Direction mappings
 */
export function getDirectionMap(element, options) {
  const isLTR = getComputedStyle(element).direction === "ltr";

  let keymap = {};

  if (options.inline) {
    keymap = {
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
}

/**
 * Option type for focusgroups
 * @typedef {object} FocusgroupOptions
 * @property {boolean} wrap
 * @property {boolean} inline
 * @property {boolean} block
 * @property {boolean} none
 * @property {boolean} nomemory
 * @property {FocusgroupBehavior | null} behavior
 */

/**
 * List of supported behaviors
 * @typedef {object} FocusgroupBehavior
 * @property {"toolbar" | "tablist" | "radiogroup" | "listbox" | "menu" | "menubar"} behavior
 */
const behaviors = [
  "toolbar",
  "tablist",
  "radiogroup",
  "listbox",
  "menu",
  "menubar",
];

/**
 * Get options of the current focusgroup
 * @param {Element} focusGroup
 * @returns {FocusgroupOptions}
 */
export function getFocusgroupOptions(focusGroup) {
  const rawOptions = focusGroup.getAttribute("focusgroup").trim().toLowerCase();
  const optionsString = ` ${rawOptions} `;
  const options = {
    block: optionsString.includes(" block "),
    inline: optionsString.includes(" inline "),
    wrap: optionsString.includes(" wrap "),
    none: optionsString.includes(" none "),
    nomemory: optionsString.includes(" no-memory "),
    behavior: null,
  };

  // Pattern matching for ARIA roles, first defined wins
  let earliestMatch = Infinity;
  let behaviorMatch = null;

  for (const behavior of behaviors) {
    const index = optionsString.indexOf(` ${behavior} `);
    if (index > -1) {
      if (earliestMatch > index) {
        earliestMatch = index;
        behaviorMatch = behavior;
      }
    }
  }

  if (behaviorMatch) {
    options.behavior = behaviorMatch;
  }

  // "Both directions" case
  if (!options.block && !options.inline) {
    options.block = true;
    options.inline = true;
  }

  return options;
}
