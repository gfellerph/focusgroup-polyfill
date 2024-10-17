import {
  findCandidates,
  getOptions,
  isFocusable,
  isFocusgroupCandidate,
} from "focusgroup/src/focusgroup-core";
import { keyConflictSelector } from "./focusable-selectors";

// Holds a list of initialized roving tabindex focusgroups
export const rovingFocusgroups = new WeakMap();

/**
 * Handle changes within the focusgroup and initialize
 * @param {MutationRecord[]} records
 * @param {MutationObserver} observer
 */
const rovingChildHandler = (records) => {
  for (let record of records) {
    for (let addedNode of record.addedNodes) {
      if (isFocusgroupCandidate(addedNode)) {
        setRovingTabindex(addedNode);
      }
    }
    for (let removedNode of record.removedNodes) {
      // TODO: take scroll containers into account as key conflict candidates
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
  for (let record of records) {
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
  candidates.forEach((candidate) => {
    if (candidate.matches(":focus") || candidate.matches(keyConflictSelector)) {
      // This element should be focusable by tabstop
      resetRovingTabindex(candidate);
    } else {
      setRovingTabindex(candidate);
    }
  });
  rovingFocusgroups.set(element, true);
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
  element.setAttribute("tabindex", "-1");
  if (currentTabindex) {
    element.setAttribute("data-focusgroup-tabindex-memory", currentTabindex);
  }
};

/**
 * Reset the roving tabindex behaviour. If the element previously
 * had a tabindex set, it's restored to its previous value.
 * @param {Element} element
 */
export const resetRovingTabindex = (element) => {
  const tabindexMemory = element.getAttribute(
    "data-focusgroup-tabindex-memory"
  );
  if (tabindexMemory) {
    element.setAttribute("tabindex", tabindexMemory);
  } else {
    element.removeAttribute("tabindex");
  }
};

/**
 * Removes roving tabindex behavior from a focusgroup
 * @param {Element} element
 */
export const disableRovingTabindex = (element) => {
  if (rovingFocusgroups.has(element)) {
    rovingFocusgroups.delete(element);
  }
  findCandidates(element).forEach(resetRovingTabindex);
};
