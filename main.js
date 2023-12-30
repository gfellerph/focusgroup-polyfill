import tabbable from "https://cdn.jsdelivr.net/npm/tabbable@6.2.0/+esm";

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
 * @property {number} FORWARDS
 * @property {number} BACKWARDS
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
  FORWARDS: 0,
  BACKWARDS: 1,
};

const observedRoots = new WeakMap();

function registerFocusinListener(root) {
  if (!observedRoots.has(root)) {
    observedRoots.set(root, true);
    root.addEventListener("focusin", focusInHandler);
  }
}

// Register the top level focus in event listener, starting the whole process
registerFocusinListener(window);

function focusInHandler(focusEvent) {
  //if (focusEvent.defaultPrevented) return;

  // Find the real target of the event, even if it's nested in a shadow-root
  const activeElement = getActiveElement(focusEvent);

  // Check if target is part of a focusgroup
  const focusGroup = getFocusGroup(activeElement);

  // Init
  // Nested buttons should find the next parent level sibling and enable focus on that
  // This is not part of the spec and could be optional
  if (focusGroup != null && !activeElement.matches(keyConflictSelector)) {
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
    // Prevent page scrolling on arrow up/down
    if (key === "ArrowUp" || key === "ArrowDown") {
      event.preventDefault();
    }
    focusNode(focusTarget, focusGroup, options, key, keyMap[key]);
  }
}

/**
 * Figure out in which direction to walk the DOM tree
 * @param {Element} focusTarget
 * @param {FocusgroupOptions} options
 * @returns {DirectionMap} Direction mappings
 *
 */
function getDirection(focusTarget) {
  const isLTR = getComputedStyle(focusTarget).direction === "ltr";

  // Set directional event handlers
  return {
    ArrowLeft: isLTR ? DIRECTION.BACKWARDS : DIRECTION.FORWARDS,
    ArrowRight: isLTR ? DIRECTION.FORWARDS : DIRECTION.BACKWARDS,
    ArrowUp: DIRECTION.BACKWARDS,
    ArrowDown: DIRECTION.FORWARDS,
  };
}

/**
 *
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

function getFocusGroup(element) {
  // Direct parent has a focusgroup, easy
  if (element.parentElement?.hasAttribute("focusgroup")) {
    return element.parentElement;
  }
  // Element is slotted in a focusgroup parent
  if (element.assignedSlot?.hasAttribute("focusgroup")) {
    return element.assignedSlot.parentElement;
  }
  // Element is inside a shadow root where the light dom parent has focusgroup
  if (element.getRootNode()?.host?.hasAttribute("focusgroup")) {
    return element.getRootNode().host;
  }
  return null;
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

function focusNode(activeElement, activeFocusGroup, options, key, direction) {
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
      direction === DIRECTION.FORWARDS
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
          direction === DIRECTION.FORWARDS
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
      //debugger;
      const root =
        currentNode.shadowRoot == null ? currentNode : currentNode.shadowRoot;
      const childNode =
        direction === DIRECTION.FORWARDS
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
      direction === DIRECTION.FORWARDS
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
        direction === DIRECTION.FORWARDS
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

// Credit:
// https://github.com/KittyGiraudel/focusable-selectors/blob/main/index.js
const notFocusableSelectorPart = {
  inert: ":not([inert]):not([inert] *)",
  negTabIndex: ':not([tabindex^="-"])',
  disabled: ":not(:disabled)",
};

const focusableSelector = [
  `button${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}${notFocusableSelectorPart.disabled}`,
  `a[href]${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}`,
  `input:not([type="hidden"]):not([type="radio"])${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}${notFocusableSelectorPart.disabled}`,
  `input[type="radio"]${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}${notFocusableSelectorPart.disabled}`,
  `[tabindex]${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}`,
  `select${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}${notFocusableSelectorPart.disabled}`,
  `textarea${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}${notFocusableSelectorPart.disabled}`,
  `details${notFocusableSelectorPart.inert} > summary:first-of-type${notFocusableSelectorPart.negTabIndex}`,
  // Discard until Firefox supports `:has()`
  // See: https://github.com/KittyGiraudel/focusable-selectors/issues/12
  // `details:not(:has(> summary))${not.inert}${not.negTabIndex}`,
  `iframe${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}`,
  `audio[controls]${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}`,
  `video[controls]${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}`,
  `[contenteditable]${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}`,
  `area[href]${notFocusableSelectorPart.inert}${notFocusableSelectorPart.negTabIndex}`,
].join(",");

// These elements already use arrow keys for navigation, tab should be used to exit
const keyConflictSelector = [
  'input:is([type="text"],[type="url"],[type="password"],[type="search"],[type="number"],[type="email"],[type="tel"])',
  "select",
  "textarea",
  "audio",
  "video",
  "iframe",
].join(",");
