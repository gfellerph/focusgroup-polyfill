import {
  focusableSelector,
  keyConflictSelector,
} from "/src/focusable-selectors.js";
import {
  getFirstChild,
  getChildren,
  getOptions,
  getAncestorFocusgroup,
  getNestedFocusgroups,
  getLastChild,
  DIRECTION,
  getParent,
  findNestedCandidate,
  getContainerNodeOfNearestParentFocusgroup,
} from "/src/shadow-tree-walker.js";

/**
 * Option type for focusgroups
 * @typedef {object} FocusgroupOptions
 * @property {boolean} wrap
 * @property {boolean} horizontal
 * @property {boolean} vertical
 * @property {boolean} extend
 * @property {boolean} grid
 * @property {boolean} auto
 */

/**
 * Direction map
 * @typedef {object} DirectionMap
 * @property {DIRECTION} ArrowUp
 * @property {DIRECTION} ArrowRight
 * @property {DIRECTION} ArrowDown
 * @property {DIRECTION} ArrowLeft
 */

const observedRoots = new WeakMap();
const initializedFocusgroups = new WeakMap();

/**
 * Add a focusin listener to a root element to enable
 * more precise focus target identification
 * @param {Element} root
 */
function registerFocusinListener(root) {
  if (!observedRoots.has(root)) {
    observedRoots.set(root, true);
    root.addEventListener("focusin", focusInHandler);
  }
}

// Register the top level focus in event listener, starting the whole process
registerFocusinListener(window);

function focusInHandler(focusEvent) {
  // Find the real focused element, even if it's nested in a shadow-root
  const activeElement = getActiveElement(focusEvent);

  // Check if target is part of a focusgroup
  const focusGroup = getFocusGroup(activeElement);

  // If it is, start to handle keydown events
  if (focusGroup != null && !activeElement.matches(keyConflictSelector)) {
    // Stop bubbling to upper focusgroups to prevent double handling of the event
    focusEvent.stopPropagation();
    setTabindices(activeElement, focusGroup, getOptions(focusGroup));
    activeElement.addEventListener("keydown", (event) =>
      handleKeydown(event, activeElement, focusGroup)
    );
  }
}

function handleKeydown(event, focusTarget, focusGroup) {
  // If default is prevented, disable focusgroup behavior
  if (event.defaultPrevented) return;

  const { key } = event;
  const options = getOptions(focusGroup);
  const keyMap = getDirection(focusTarget, options);

  if (key in keyMap) {
    focusNode(focusTarget, focusGroup, options, key, keyMap[key], event);
  }
}

/**
 * Figure out in which direction to walk the DOM tree
 * @param {Element} focusTarget
 * @returns {DirectionMap} Direction mappings
 */
function getDirection(focusTarget, options) {
  const isLTR = getComputedStyle(focusTarget).direction === "ltr";

  let directions = {};
  if (options.horizontal) {
    directions = {
      ...directions,
      ArrowLeft: isLTR ? DIRECTION.PREVIOUS : DIRECTION.NEXT,
      ArrowRight: isLTR ? DIRECTION.NEXT : DIRECTION.PREVIOUS,
    };
  }
  if (options.vertical) {
    directions = {
      ...directions,
      ArrowUp: DIRECTION.PREVIOUS,
      ArrowDown: DIRECTION.NEXT,
    };
  }

  return directions;
}

/**
 * Find the active element, even in shadow roots
 * @param {Event} event
 * @returns {Element}
 */
function getActiveElement(event) {
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

    registerFocusinListener(root);
    return root.activeElement;
  } else {
    // It's the light dom, the target is the actual focusable element
    return event.target;
  }
}

/**
 * Find the focusgroup element, across shadow roots
 * @param {Element} element
 * @returns {Element|null} The focusgroup element or null if the input element is not part of a focusgroup
 */
function getFocusGroup(element) {
  const parentNode = getParent(element);

  if (parentNode?.hasAttribute("focusgroup")) {
    return parentNode;
  } else {
    return null;
  }
}

function focusNode(
  activeElement,
  activeFocusGroup,
  options,
  key,
  direction,
  event
) {
  let nodeToFocus = treeWalker(
    activeElement,
    activeFocusGroup,
    options,
    direction
  );

  if (nodeToFocus == null && options.wrap) {
    nodeToFocus = treeWalker(
      activeFocusGroup,
      activeFocusGroup,
      options,
      direction
    );
  }

  if (nodeToFocus != null) {
    // Key event is handled by the focusgroup, prevent other default events
    event.preventDefault();
    setFocus(nodeToFocus, activeElement, activeFocusGroup);
  }
}

function setFocus(target, previousTarget, focusGroup) {
  // Refresh last target for focusgroup
  initializedFocusgroups.set(focusGroup, target);
  previousTarget.setAttribute("tabindex", "-1");
  target.setAttribute("tabindex", "0");
  previousTarget.removeEventListener("keydown", handleKeydown);
  target.focus();
}

function treeWalker(node, focusGroup, options, direction) {
  /*
   * 1. Search current node for focusgroup candidates
   * 2. Search sibling nodes + their children
   * 3. Search cousin nodes + their children
   */

  debugger;

  // 1. Current node search
  const childNode =
    DIRECTION.NEXT === direction ? getFirstChild(node) : getLastChild(node);
  let candidate = findNestedCandidate(childNode, direction);

  if (candidate) {
    return candidate;
  }

  // 2. Sibling node search
  let sibling =
    direction === DIRECTION.NEXT
      ? node.nextElementSibling
      : node.previousElementSibling;
  while (sibling) {
    candidate = findNestedCandidate(sibling, direction);
    if (candidate) {
      return candidate;
    }
    sibling =
      direction === DIRECTION.NEXT
        ? sibling.nextElementSibling
        : sibling.previousElementSibling;
  }

  // 3. Search cousin nodes and their children
  if (options.extend) {
    const containerNode = getContainerNodeOfNearestParentFocusgroup(focusGroup);
    let cousinNode =
      direction === DIRECTION.NEXT
        ? containerNode.nextElementSibling
        : containerNode.previousElementSibling;
    while (cousinNode && !candidate) {
      candidate = findNestedCandidate(cousinNode);
      if (candidate) {
        return candidate;
      }
      cousinNode =
        direction === DIRECTION.NEXT
          ? containerNode.nextElementSibling
          : containerNode.previousElementSibling;
    }
  }

  // Found nothing
  return null;
}

function setTabindices(target, focusgroup) {
  if (initializedFocusgroups.has(focusgroup)) {
    // Focusgroup was alerady initialized
    return;
  }
  const ancestorFocusgroup = getAncestorFocusgroup(focusgroup);
  initializedFocusgroups.set(ancestorFocusgroup, target);

  disableFocusOnChildren(ancestorFocusgroup, target);

  // Search for extended focusgroups and set tab indices on them as well (every child)
  getNestedFocusgroups(ancestorFocusgroup).forEach((group) => {
    disableFocusOnChildren(group);
  });
}

function disableFocusOnChildren(element, targetElement = null) {
  Array.from(getChildren(element)).forEach((child) => {
    if (child !== targetElement && child.matches(focusableSelector)) {
      child.setAttribute("tabindex", "-1");
    }
  });
}
