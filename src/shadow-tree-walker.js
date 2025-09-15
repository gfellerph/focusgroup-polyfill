import { keyConflictSelector, isFocusable } from "./focusable.js";
import { isFocusgroup } from "./utils.js";

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
 * @typedef {object} CANDIDATE_REASON
 * @property {number} NO_FOCUSGROUP
 * @property {number} NOT_FOCUSABLE
 * @property {number} KEY_CONFLICT
 * @property {number} FOCUSGROUP_NONE
 * @property {number} IS_CANDIDATE
 */
export const candidateReasons = {
  NO_FOCUSGROUP: 1,
  NOT_FOCUSABLE: 2,
  KEY_CONFLICT: 3,
  FOCUSGROUP_NONE: 4,
  IS_CANDIDATE: 5,
};

/**
 * Candidate check result
 * @typedef {object} CANDIDATE_CHECK_RESULT
 * @property {CANDIDATE_REASON} reason
 * @property {boolean} isCandidate
 * @property {Element | null} focusgroup
 */

/**
 * Checks if an element is a candidate for a focusgroup and returns
 * the result of the check and also the reason that lead to the result
 * @param {Element} element
 * @returns {CANDIDATE_CHECK_RESULT}
 */
export const isFocusgroupCandidate = (element) => {
  const focusgroup = getParentFocusgroup(element);

  // Check if element is part of a focusgroup
  if (!focusgroup)
    return {
      isCandidate: false,
      reason: candidateReasons.NO_FOCUSGROUP,
      focusgroup,
    };

  // Check if the focusgroup options is not none
  const options = getOptions(focusgroup);
  if (options.none)
    return {
      isCandidate: false,
      reason: candidateReasons.FOCUSGROUP_NONE,
      focusgroup,
    };

  // Check if the element is focusable
  if (!isFocusable(element))
    return {
      isCandidate: false,
      reason: candidateReasons.NOT_FOCUSABLE,
      focusgroup,
    };

  // Check if the element has no key conflict
  if (element.matches(keyConflictSelector))
    return {
      isCandidate: false,
      reason: candidateReasons.KEY_CONFLICT,
      focusgroup,
    };

  // All checks passed, this is a candidate
  return {
    isCandidate: true,
    reason: candidateReasons.IS_CANDIDATE,
    focusgroup,
  };
};

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
const getParent = (element) => {
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
  // TODO: improve block/inline direction detection

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
export const getOptions = (focusGroup) => {
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

/**
 * Recursively walk the DOM tree to find the next best focusgroup candidate
 * @param {Element} element The starting node, usually the currently focused element
 * @param {boolean} forward Whether to walk the tree forward or backwards
 * @param {boolean} childSearch Whether to search for candidates in the child nodes
 * @param {boolean} parentSearch Wheter to walk up to siblings of parents to search for candidates
 * @param {number} index Iteration count of the recursion
 * @returns {Element | null} The next focusgroup candidate or null if there is none
 */
export const findNextCandidate = (
  element,
  forward = true,
  childSearch = true,
  parentSearch = true,
  index = 0
) => {
  // Exit criteria 1: element is a candidate
  if (index > 0 && isFocusable(element)) return element;

  const isForeignFocusgroup = index > 0 && isFocusgroup(element);
  let candidate = null;

  // Only start child search if element is not a focusgroup, otherwise, continue with sibling search
  if (!isForeignFocusgroup) {
    // Search children
    const children = getChildren(element);
    if (childSearch && children?.length) {
      const nextChild = forward ? children[0] : children[children.length - 1];
      candidate = findNextCandidate(nextChild, forward, true, false, index + 1);
    }
  }

  // Search siblings
  const sibling = forward
    ? element.nextElementSibling
    : element.previousElementSibling;
  if (!candidate && sibling) {
    candidate = findNextCandidate(sibling, forward, true, false, index + 1);
  }

  // Search parent
  const parent = getParent(element);
  if (
    !candidate &&
    !isForeignFocusgroup &&
    parentSearch &&
    parent &&
    !isFocusgroup(parent)
  ) {
    candidate = findNextCandidate(parent, forward, false, true, index + 1);
  }

  return candidate;
};

/**
 * Recursively queries a shadow DOM tree for elements matching a filter
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
