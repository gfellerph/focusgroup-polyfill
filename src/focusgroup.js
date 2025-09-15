import { shadowQuerySelector } from "./shadow-tree-walker.js";
import {
  setRovingTabindex,
  disableRovingTabindex,
  initializeRovingTabindex,
  resetRovingTabindex,
} from "./roving-tabindex.js";
import { Attribute, registerAttribute } from "./custom-attribute-polyfill.js";
import {
  isFocusgroup,
  getFocusgroupOptions,
  getParentFocusgroup,
  getDirectionMap,
  isFocusgroupCandidate,
  DIRECTION,
  focusGroupSupported,
} from "./utils.js";
import { isFocusable } from "./focusable.js";

// A map for keeping track of observed root nodes
const observedRoots = new WeakMap();

/**
 * Add a focusin listener to a root element to enable focusgroup behaviour on that element and
 * its descendants
 * @param {Element} root
 */
export default function registerFocusGroupPolyfill(root = window) {
  if (!focusGroupSupported && !observedRoots.has(root)) {
    observedRoots.set(root, true);
    root.addEventListener("focusin", focusInHandler);
  }
}

/**
 * Find the active element, even in shadow roots
 * @param {Event} event
 * @returns {Element}
 */
function getActiveElement(event) {
  let root = event.target.shadowRoot;
  let eventTarget = event.target;

  // Oh boy, it's a shadow root, dig as deep as necessary to find the actual target
  while (root) {
    // Continuous focus-in events are not fired from the same shadow root, a dedicated listener has to be set for each root
    registerFocusGroupPolyfill(root);
    eventTarget = root.activeElement || eventTarget;
    root = root.activeElement.shadowRoot;
  }

  return eventTarget;
}

/**
 * Focus-in event handler
 * @param {FocusEvent} focusEvent
 */
function focusInHandler(focusEvent) {
  // Find the real focused element, even if it's nested in a shadow-root
  const activeElement = getActiveElement(focusEvent);

  // Check if target is a candidate
  const isCandidate = isFocusgroupCandidate(activeElement);

  // If it is, start to handle keydown events
  if (isCandidate) {
    const focusgroup = getParentFocusgroup(activeElement);
    registerAttribute("focusgroup", FocusgroupAttribute, focusgroup, false);

    // Check if there are parent focusgroups and disable roving tabindex on them
    let currentParentFocusgroup = getParentFocusgroup(focusgroup);
    while (currentParentFocusgroup) {
      disableRovingTabindex(currentParentFocusgroup);
      currentParentFocusgroup = getParentFocusgroup(currentParentFocusgroup);
    }

    const keydownHandler = (event) => {
      handleKeydown(event, activeElement, focusgroup);
    };

    activeElement.addEventListener("keydown", keydownHandler);
    activeElement.addEventListener(
      "blur",
      () => activeElement.removeEventListener("keydown", keydownHandler),
      { once: true }
    );
  } else {
    // Focus is on a non-candidate, disable roving tabindex on the parent focusgroup, if any
    disableRovingTabindex(getParentFocusgroup(activeElement));
  }
}

/**
 * Keydown event handler
 * @param {KeyboardEvent} event
 * @param {Element} focusTarget
 * @param {Element} focusGroup
 * @returns
 */
function handleKeydown(event, focusTarget, focusGroup) {
  // If default is prevented, disable focusgroup behavior
  if (event.defaultPrevented) return;

  const key = `${event.getModifierState("Meta") ? "Meta" : ""}${event.key}`;
  const options = getFocusgroupOptions(focusGroup);
  const keyMap = getDirectionMap(focusTarget, options);

  if (key in keyMap) {
    focusNode(focusTarget, focusGroup, options, keyMap[key], event);
  }
}

/**
 * Figure out which node to focus next
 * @param {Element} activeElement The currently focused element
 * @param {Element} activeFocusGroup The parent focusgroup of the selected element
 * @param {import("./src/shadow-tree-walker.js").FocusgroupOptions} options
 * @param {DIRECTION} direction Whether the direction is forward or not
 * @param {KeyboardEvent} event The event that fired
 */
function focusNode(activeElement, activeFocusGroup, options, direction, event) {
  const candidates = shadowQuerySelector(
    activeFocusGroup,
    isFocusable,
    isFocusgroup
  );

  // Take no action, there are no candidates in this focusgroup
  if (candidates.length === 0) return;

  const currentIndex = candidates.indexOf(activeElement);

  // Default if no current index is found
  let nextIndex = -1;
  if (currentIndex === -1) {
    // Current focus is not in this focusgroup, focus the first element
    nextIndex = 0;
  } else if (direction === DIRECTION.NEXT) {
    nextIndex = currentIndex + 1;

    // Handle wrapping behaviour
    if (nextIndex >= candidates.length) nextIndex = options.wrap ? 0 : -1;
  } else if (direction === DIRECTION.PREVIOUS) {
    nextIndex = currentIndex - 1;

    // Handle wrapping behaviour
    if (nextIndex < 0) nextIndex = options.wrap ? candidates.length - 1 : -1;
  } else if (direction === DIRECTION.FIRST) {
    nextIndex = 0;
  } else if (direction === DIRECTION.LAST) {
    nextIndex = candidates.length - 1;
  }

  // No next index found, do nothing
  if (nextIndex === -1) return;

  const nodeToFocus = candidates[nextIndex];
  if (nodeToFocus) {
    // Key event is handled by the focusgroup, prevent other default events
    event.preventDefault();
    if (!options.nomemory) {
      setRovingTabindex(activeElement);
      resetRovingTabindex(nodeToFocus);
    }

    // Oh my, finally something to focus
    nodeToFocus.focus();
  }
}

class FocusgroupAttribute extends Attribute {
  #options;

  constructor(name, element) {
    super(name, element);
    this.#options = getFocusgroupOptions(element);
  }

  get hasRovingTabIndex() {
    return !this.#options.none && !this.#options.nomemory;
  }

  connectedCallback() {
    if (this.hasRovingTabIndex) {
      initializeRovingTabindex(this.host, isFocusgroup);
    }
  }

  changedCallback(newValue) {
    this.#options = getFocusgroupOptions(newValue);

    if (this.hasRovingTabIndex) {
      initializeRovingTabindex(this.host, isFocusgroup);
    } else {
      disableRovingTabindex(this.element);
    }
  }

  disconnectedCallback() {
    disableRovingTabindex(this.host);
  }
}
