import {
  focusableSelector,
  keyConflictSelector,
  focusDisablingParentSelecor,
} from "focusgroup/src/focusable-selectors";
import { getChildren, getParent } from "focusgroup/src/shadow-tree-walker";

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
 * Check if an element is currently focusable
 * @param {Element} element
 * @returns {boolean}
 */
export const isFocusable = (element) => {
  return (
    !element.matches(focusDisablingParentSelecor) &&
    element.matches(focusableSelector)
  );
};

/**
 * Get options of the current focusgroup
 * @param {Element} focusGroup
 * @returns {FocusgroupOptions}
 */
export const getOptions = (focusGroup) => {
  const optionsString = ` ${focusGroup.getAttribute("focusgroup")} `;
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
  NULL_ELEMENT: 6,
  FOCUSGROUP_NONE_ON_SELF: 7,
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
  if (!element) {
    console.warn("isFocusgroupCandidate called on null");
    return {
      isCandidate: false,
      reason: candidateReasons.NULL_ELEMENT,
      focusgroup: null,
    };
  }

  const focusgroup = getParentFocusgroup(element);

  // Check if element is part of a focusgroup
  if (!focusgroup)
    return {
      isCandidate: false,
      reason: candidateReasons.NO_FOCUSGROUP,
      focusgroup,
    };

  const options = getOptions(focusgroup);

  // Check if the focusgroup options is not none
  if (options.none)
    return {
      isCandidate: false,
      reason: candidateReasons.FOCUSGROUP_NONE,
      focusgroup,
    };

  // Check if element has focusgroup=none
  if (isFocusgroup(element) && getOptions(element).none) {
    console.log(element, "was not a candidate");
    return {
      isCandidate: false,
      reason: candidateReasons.FOCUSGROUP_NONE_ON_SELF,
      element,
    };
  }

  // Check if the element is focusable
  if (!isFocusable(element))
    return {
      isCandidate: false,
      reason: candidateReasons.NOT_FOCUSABLE,
      focusgroup,
    };

  // Check if the element has no key conflict
  // TODO: take scroll containers into account
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
 * Check if the element is a focusgroup
 * @param {Element} element
 * @returns {boolean}
 */
const isFocusgroup = (element) => {
  return element.hasAttribute("focusgroup") && !getOptions(element).none;
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
  const isForeignFocusgroup = index > 0 && isFocusgroup(element);

  // Exit criteria 1: element is a candidate
  if (!isForeignFocusgroup && index > 0 && isFocusable(element)) return element;

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
 * Get a list of candidates participating in this focusgroup
 * @param {Element} element Starting node, should be a focusgroup but does not have to
 * @param {number} index Index for keeping track of recurse
 * @returns {Element[]} A list of candidates of this focusgroup
 */
export const findCandidates = (
  element: Element,
  index: number = 0
): Element[] => {
  // Exit criteria 1: element is a focusgroup, either the parent or a focusgroup=none
  if (index > 0 && isFocusgroup(element)) {
    return [];
  }

  let candidates = [];
  const children = Array.from(getChildren(element));
  children.map((childnode) => {
    if (isFocusable(childnode)) {
      candidates.push(childnode);
    }
    candidates = [...candidates, ...findCandidates(childnode, index + 1)];
  });

  return candidates;
};
