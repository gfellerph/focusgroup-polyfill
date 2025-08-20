import { isFocusable } from "./focusable.js";
import { isFocusgroup } from "./utils.js";
import { getChildren } from "./shadow-tree-walker.js";

const TABINDEX_MEMORY = "data-focusgroup-tabindex-memory";

// Holds a list of initialized roving tabindex focusgroups
const rovingFocusgroups = new WeakMap();

/**
 * Initializes roving behavior. Only call this if you know
 * that one of the elements has focus.
 * @param {Element} element
 * @returns
 */
export const initializeRovingTabindex = (element) => {
  if (rovingFocusgroups.has(element)) return;

  // Add mutation observer for child events and initialize new candidates with tabindex=-1
  rovingChildObserver.observe(element, rovingChildObserverOptions);
  // Add mutation observer for focusgroup attribute no-memory to disable roving tabindex
  optionChangeObserver.observe(element, optionChangeObserverOptions);

  const candidates = findCandidates(element);
  candidates.map((candidate) => {
    if (candidate.matches(":focus")) {
      // This element should be focusable by tabstop
      resetRovingTabindex(candidate);
    } else {
      setRovingTabindex(candidate);
    }
  });
  rovingFocusgroups.set(element, true);
};

/**
 * Removes roving tabindex behavior from a focusgroup
 * @param {Element} element
 */
export const disableRovingTabindex = (element) => {
  if (rovingFocusgroups.has(element)) {
    rovingFocusgroups.delete(element);
  }
  element.querySelectorAll(`[${TABINDEX_MEMORY}]`).forEach((candidate) => {
    resetRovingTabindex(candidate);
  });
};

/**
 * Uses tabindex to create a roving tabindex behavior. If the
 * element previously had a tabindex set, it will be memorized
 * in a custom attribute and restored if focusgroup functionality
 * is being reset.
 * @param {Element} element
 */
export const setRovingTabindex = (element) => {
  const currentTabindex = element.getAttribute("tabindex");
  if (currentTabindex) {
    element.setAttribute(TABINDEX_MEMORY, currentTabindex);
  }
  element.setAttribute("tabindex", "-1");
};

/**
 * Reset the roving tabindex behaviour. If the element previously
 * had a tabindex set, it's restored to its previous value.
 * @param {Element} element
 */
export const resetRovingTabindex = (element) => {
  const oldTabIndex = element.getAttribute(
    TABINDEX_MEMORY
  );
  if (oldTabIndex) {
    element.setAttribute("tabindex", oldTabIndex);
  } else {
    element.removeAttribute("tabindex");
  }
};

/**
 * Handle changes within the focusgroup and initialize
 * @param {MutationRecord[]} records
 * @param {MutationObserver} observer
 */
const rovingChildHandler = (records) => {
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
};
const rovingChildObserver = new MutationObserver(rovingChildHandler);
const rovingChildObserverOptions = {
  childList: true,
  subtree: true,
};

const optionChangedHandler = (records) => {
  for (const record of records) {
    if (record.type === "attributes" && record.attributeName === "focusgroup") {
      const options = getOptions(record.target);
      if (options.nomemory || options.none) {
        disableRovingTabindex(record.target);
      }
    }
  }
};
const optionChangeObserver = new MutationObserver(optionChangedHandler);
const optionChangeObserverOptions = {
  attributes: true,
  attributeFilter: ["focusgroup"],
};


/**
 * Get a list of candidates participating in this focusgroup
 * @param {Element} element Starting node, should be a focusgroup but does not have to be
 * @param {boolean} _initialRun Index for keeping track of recurse
 * @returns {Element[]} A list of candidates of this focusgroup
 */
export const findCandidates = (element, _initialRun = true) => {
  // Exit criteria 1: element is a focusgroup, either the parent or a focusgroup=none
  if (!_initialRun && isFocusgroup(element)) {
    return [];
  }

  let candidates = [];
  const children = Array.from(getChildren(element));
  children.map((childnode) => {
    if (isFocusable(childnode)) {
      candidates.push(childnode);
    }
    candidates = [...candidates, ...findCandidates(childnode, false)];
  });

  return candidates;
};