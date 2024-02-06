import {
  focusableSelector,
  keyConflictSelector,
} from "/src/focusable-selectors.js";
import {
  getChildren,
  getOptions,
  getAncestorFocusgroup,
  getNestedFocusgroups,
  DIRECTION,
  getDirectionMap,
  getParent,
  findNestedCandidate,
  findCousinCandidate,
} from "/src/shadow-tree-walker.js";

const observedRoots = new WeakMap();
const initializedFocusgroups = new WeakMap();

/**
 * Add a focusin listener to a root element to enable
 * more precise focus target identification
 * @param {Element} root
 */
export default function registerFocusinListener(root) {
  if (!observedRoots.has(root)) {
    observedRoots.set(root, true);
    root.addEventListener("focusin", focusInHandler);
  }
}

registerFocusinListener(window);
console.log("registered");

// Register the top level focus in event listener, starting the whole process
// registerFocusinListener(window);

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

/**
 *
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
  const keyMap = getDirectionMap(focusTarget);

  if (key in keyMap) {
    focusNode(focusTarget, focusGroup, options, key, keyMap[key], event);
  }
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
    direction,
    key
  );

  if (nodeToFocus == null && options.wrap) {
    nodeToFocus = treeWalker(
      activeFocusGroup,
      activeFocusGroup,
      options,
      direction,
      key
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

/**
 *
 * @param {Element} node
 * @param {Element} focusGroup
 * @param {FocusgroupOptions} options
 * @param {DIRECTION} direction
 * @param {string} key
 * @returns
 */
function treeWalker(node, focusGroup, options, direction, key) {
  /*
   * 1. Search current node for focusgroup candidates
   * 2. Search sibling nodes + their children
   * 3. Search cousin nodes + their children
   */

  let candidate = null;

  // 1. Child node search
  // This is an edge case
  const children = getChildren(node);
  if (children?.length > 0) {
    const childNode =
      DIRECTION.NEXT === direction
        ? children[0]
        : children[children.length - 1];
    candidate = findNestedCandidate(childNode, direction);
  }

  if (candidate) {
    return candidate;
  }

  // 2. Sibling node search
  let sibling =
    direction === DIRECTION.NEXT
      ? node.nextElementSibling
      : node.previousElementSibling;
  while (sibling) {
    candidate = findNestedCandidate(sibling, direction, options, key);
    if (candidate) {
      return candidate;
    }
    sibling =
      direction === DIRECTION.NEXT
        ? sibling.nextElementSibling
        : sibling.previousElementSibling;
  }

  // 3. Search other descendants of the ancestor focusgroup
  // TODO: loop over all possible parents, not just the first
  if (options.extend) {
    candidate = findCousinCandidate(node, direction, key);
  }

  // Found nothing
  return candidate;
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
