import { isFocusable } from "./focusable.js";
import { shadowQuerySelector } from "./shadow-tree-walker/shadow-tree-walker.js";

const TABINDEX_MEMORY = "data-roving-tabindex-memory";
const ROVING_INDICATOR = "data-roving-tabindex";

// Holds a list of initialized roving tabindex focusgroups
const rovingFocusgroups = new WeakMap();

export function initializeRovingTabindex(element, boundary) {
  // Check if already initialised
  if (rovingFocusgroups.has(element)) return;

  // Handle subtree changes
  rovingChildObserver.observe(element, rovingChildObserverOptions);

  // Keep a reference to prevent double initialisation
  rovingFocusgroups.set(element, boundary);

  // Walk the subtree to find focusable elements and initialise them
  const candidates = shadowQuerySelector(element, isFocusable, boundary);
  for (const candidate of candidates) {
    candidate.setAttribute(ROVING_INDICATOR, "");
    if (candidate.matches(":focus")) {
      // This element should be focusable by tabstop
      resetRovingTabindex(candidate);
    } else {
      setRovingTabindex(candidate);
    }
  }
}

/**
 * Check if an element has been initialised with roving tabindex
 * @param {Element} element
 * @returns {boolean}
 */
function isRover(element) {
  return element.hasAttribute(ROVING_INDICATOR);
}

/**
 * Removes roving tabindex behavior from a focusgroup
 * @param {Element} element
 */
export function disableRovingTabindex(element) {
  if (!rovingFocusgroups.has(element)) return;

  let boundary = rovingFocusgroups.get(element);

  const candidates = shadowQuerySelector(element, isRover, boundary);
  for (const candidate of candidates) {
    resetRovingTabindex(candidate);
  }

  rovingFocusgroups.delete(element);
}

/**
 * Uses tabindex to create a roving tabindex behavior. If the
 * element previously had a tabindex set, it will be memorized
 * in a custom attribute and restored if focusgroup functionality
 * is being reset.
 * @param {Element} element
 */
export function setRovingTabindex(element) {
  const currentTabindex = element.getAttribute("tabindex");
  if (currentTabindex) {
    element.setAttribute(TABINDEX_MEMORY, currentTabindex);
  }
  element.setAttribute("tabindex", "-1");
}

/**
 * Reset the roving tabindex behaviour. If the element previously
 * had a tabindex set, it's restored to its previous value.
 * @param {Element} element
 */
export function resetRovingTabindex(element) {
  const oldTabIndex = element.getAttribute(TABINDEX_MEMORY);
  if (oldTabIndex) {
    element.setAttribute("tabindex", oldTabIndex);
  } else {
    element.removeAttribute("tabindex");
  }
}

/**
 * Handle changes within the focusgroup and initialize
 * @param {MutationRecord[]} records
 */
function rovingChildHandler(records) {
  for (const record of records) {
    for (const addedNode of record.addedNodes) {
      if (isFocusgroupCandidate(addedNode)) {
        setRovingTabindex(addedNode);
      }
    }
    for (const removedNode of record.removedNodes) {
      if (
        isFocusable(removedNode) &&
        !removedNode.matches(keyConflictSelector) &&
        !removedNode.hasAttribute("tabindex")
      ) {
        disableRovingTabindex(record.target);
      }
    }
  }
}
const rovingChildObserver = new MutationObserver(rovingChildHandler);
const rovingChildObserverOptions = {
  childList: true,
  subtree: true,
};
