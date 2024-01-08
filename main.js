import {
  focusableSelector,
  keyConflictSelector,
} from "/src/focusable-selectors.js";

import { ShadowWalker } from "/src/shadow-tree-walker.js";

/**
 * Option type for focusgroups
 * @typedef {object} FocusgroupOptions
 * @property {boolean} wrap
 * @property {boolean} horizontal
 * @property {boolean} vertical
 * @property {boolean} extended
 * @property {boolean} grid
 * @property {boolean} auto
 */

/**
 * Direction
 * @typedef {object} DIRECTION
 * @property {number} PREVIOUS
 * @property {number} NEXT
 */

/**
 * Direction map
 * @typedef {object} DirectionMap
 * @property {DIRECTION} ArrowUp
 * @property {DIRECTION} ArrowRight
 * @property {DIRECTION} ArrowDown
 * @property {DIRECTION} ArrowLeft
 */

const DIRECTION = {
  NEXT: 0,
  PREVIOUS: 1,
};

const observedRoots = new WeakMap();

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
  const walker = new ShadowWalker(element);
  const parentNode = walker.parentNode();

  if (parentNode?.hasAttribute("focusgroup")) {
    return parentNode;
  } else {
    return null;
  }
}

/**
 * Get options of the current focusgroup
 * @param {Element} focusGroup
 * @returns {FocusgroupOptions}
 */
function getOptions(focusGroup) {
  const optionsString = ` ${focusGroup.getAttribute("focusgroup").trim()} `;
  const options = {
    auto: optionsString.includes(" auto "),
    vertical: optionsString.includes(" vertical "),
    horizontal: optionsString.includes(" horizontal "),
    wrap: optionsString.includes(" wrap "),
    extend: optionsString.includes(" extend "),
    grid: optionsString.includes(" grid "),
  };
  // Auto case
  if ((!options.vertical && !options.horizontal) || options.auto) {
    options.vertical = true;
    options.horizontal = true;
  }
  return options;
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
    activeElement,
    options,
    direction,
    key
  );

  if (nodeToFocus == null && options.wrap) {
    nodeToFocus = treeWalker(
      direction === DIRECTION.NEXT
        ? activeFocusGroup.firstElementChild
        : activeFocusGroup.lastElementChild,
      activeFocusGroup,
      activeElement,
      options,
      direction,
      key
    );
  }

  if (nodeToFocus != null) {
    // Key event is handled by the focusgroup, prevent other default events
    event.preventDefault();
    setFocus(nodeToFocus, activeElement);
  }
}

function setFocus(target, previousTarget) {
  previousTarget.removeEventListener("keydown", handleKeydown);
  target.focus();
}

function treeWalker(node, focusGroup, initialTarget, options, direction, key) {
  /**
   * 1. Walk the tree from here
   * - If there is a next focusable sibling, return that
   * - If there is a non-focusable element with children, search for an extended focusgroup
   * - If there is a shadow dom child, search the shadowroot for an extended focusgroup
   * - If there is no sibling and current focusgroup is not extended, return null
   * - If current focusgroup is extended, search for the parent focusgroups next sibling
   * - If there is no sibling and wrap is enabled, start search again with the first node of the parent focusgroup
   */
  let currentNode = node;
  while (currentNode) {
    if (
      currentNode !== initialTarget &&
      getFocusGroup(currentNode) != null &&
      currentNode.matches(focusableSelector)
    ) {
      // Found a focusable element belonging to a focusgroup
      return currentNode;
    }

    if (currentNode.hasAttribute("focusgroup")) {
      // Found another focusgroup
      const currentOptions = getOptions(currentNode);
      if (currentOptions.extend) {
        const root =
          currentNode.shadowRoot == null ? currentNode : currentNode.shadowRoot;
        const childNode =
          direction === DIRECTION.NEXT
            ? root.firstElementChild
            : root.lastElementChild;

        return treeWalker(
          childNode,
          currentNode,
          initialTarget,
          currentOptions,
          direction,
          key
        );
      }
    }

    if (currentNode.childElementCount !== 0 || currentNode.shadowRoot != null) {
      const root =
        currentNode.shadowRoot == null ? currentNode : currentNode.shadowRoot;
      const childNode =
        direction === DIRECTION.NEXT
          ? root.firstElementChild
          : root.lastElementChild;

      return treeWalker(
        childNode,
        focusGroup,
        initialTarget,
        options,
        direction,
        key
      );
    }

    // Move prev/next sibling
    currentNode =
      direction === DIRECTION.NEXT
        ? currentNode.nextElementSibling
        : currentNode.previousElementSibling;
  }

  // Focusgroup does not contain any more items, start to ascend the tree if it extends
  if (options.extend) {
    // debugger;
    // TODO: walk up shadow dom
    // See if siblings are focusable
    currentNode =
      initialTarget.parentElement || initialTarget.getRootNode().host;
    while (currentNode) {
      const nextSibling =
        direction === DIRECTION.NEXT
          ? currentNode.nextElementSibling
          : currentNode.previousElementSibling;
      if (nextSibling) {
        const result = treeWalker(
          nextSibling,
          null,
          initialTarget,
          options,
          direction,
          key
        );
        if (result) {
          return result;
        }
      }
      currentNode = currentNode.parentElement || currentNode.getRootNode().host;
    }
  }

  // Found nothing
  return null;
}
