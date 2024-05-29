import {
  getChildren,
  getOptions,
  getDirectionMap,
  isFocusgroupCandidate,
  candidateReasons,
  rovingFocusgroups,
  disableRovingTabindex,
  initializeRovingTabindex,
  setRovingTabindex,
  resetRovingTabindex,
  findNextCandidate,
  DIRECTION,
} from "./src/shadow-tree-walker.js";

// A map for keeping track of observed root nodes
const observedRoots = new WeakMap();

/**
 * Add a focusin listener to a root element to enable focusgroup behaviour on that element and
 * its decendants
 * @param {Element} root
 */
export default function registerFocusinListener(root) {
  if (!observedRoots.has(root)) {
    observedRoots.set(root, true);
    root.addEventListener("focusin", focusInHandler);
  }
}

/**
 * Find the active element, even in shadow roots
 * @param {Event} event
 * @returns {Element}
 */
export const getActiveElement = (event) => {
  let root = event.target.shadowRoot;
  let keepGoing = root != null;
  if (keepGoing) {
    // Oh boy, it's a shadow root, dig as deep as necessary to find the actual
    // target
    while (keepGoing) {
      if (root.activeElement.shadowRoot != null) {
        root = root.activeElement.shadowRoot;
      } else {
        keepGoing = false;
      }
    }

    // Continuous focusin events are not fired from the same shadow root, a dedicated listener has to be set for each root
    registerFocusinListener(root);

    return root.activeElement;
  } else {
    // It's the light dom, the target is the actually focused element
    return event.target;
  }
};

/**
 * Focus in event handler
 * @param {FocusEvent} focusEvent
 */
function focusInHandler(focusEvent) {
  // Find the real focused element, even if it's nested in a shadow-root
  const activeElement = getActiveElement(focusEvent);

  // Check if target is a candidate
  const { isCandidate, reason, focusgroup } =
    isFocusgroupCandidate(activeElement);

  // If it is, start to handle keydown events
  if (isCandidate) {
    focusEvent.stopPropagation();
    initializeRovingTabindex(focusgroup);

    // TODO: check if there are parent focusgroups and disable roving tabindex on them

    activeElement.addEventListener("keydown", (event) =>
      handleKeydown(event, activeElement, focusgroup)
    );
  } else if (
    reason === candidateReasons.KEY_CONFLICT &&
    rovingFocusgroups.has(focusgroup)
  ) {
    // Focus is on a key conflict field, disable roving behavior
    disableRovingTabindex(focusgroup);
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
  const options = getOptions(focusGroup);
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
  // Switch start node if meta key is pressed to enable jumping to first/last
  const startNode =
    direction === DIRECTION.NEXT || direction === DIRECTION.PREVIOUS
      ? activeElement
      : activeFocusGroup;
  const forward = direction === DIRECTION.FIRST || direction === DIRECTION.NEXT;
  let nodeToFocus = findNextCandidate(startNode, forward);

  // Handle wrapping behaviour
  if (nodeToFocus == null && options.wrap) {
    const children = getChildren(activeFocusGroup);
    const startingNode = forward ? children[0] : children[children.length - 1];
    nodeToFocus = findNextCandidate(startingNode, forward, true, false, 1);
  }

  // TODO: Check if nodeToFocus is in viewport

  if (nodeToFocus) {
    // Key event is handled by the focusgroup, prevent other default events
    event.preventDefault();
    activeElement.removeEventListener("keydown", handleKeydown);
    setFocus(nodeToFocus, activeElement);
  }
}

/**
 * Sets the focus to a new target, handling the roving tabindex for the last one
 * @param {Element} target
 * @param {Element} previousTarget
 */
function setFocus(target, previousTarget) {
  // Refresh focusgroup memory
  setRovingTabindex(previousTarget);
  resetRovingTabindex(target);
  target.focus();
}

/**
 * Feature detection for focusgroup
 * @returns {boolean}
 */
function focusgroupSupported() {
  const div = document.createElement("div");
  return "focusgroup" in div;
}

// Start polyfill
// TODO: let users define the scope where they want focusgroup to be active
if (window && !focusgroupSupported()) {
  registerFocusinListener(window);
}
