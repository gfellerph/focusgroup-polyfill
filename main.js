const visited = new WeakMap();

window.addEventListener("focusin", (e) => {
  if (e.defaultPrevented) return;
  /* console.log("event", e);
  console.log("target", e.target);
  console.log("currenttarget", e.currentTarget);
  console.log("parent", e.target.parentElement);
  console.log("hasShadowRoot", e.target.shadowRoot != null);
  console.log("activeElement", document.activeElement);
  console.log(
    "activeShadowRootElement",
    e.target.shadowRoot != null ? e.target.shadowRoot.activeElement : null
  ); */

  // Find the real target of the event, even if it's nested in a shadow-root
  const focusTarget = getFocusTarget(e);
  // console.log("hasFocusgroup", focusTarget.closest("[focusgroup]") != null);

  // Check if target is part of a focusgroup
  const focusGroup = getFocusGroup(focusTarget);
  // console.log("focusGroup", focusGroup);

  // Init
  // Nested buttons should find the next parent level sibling and enable focus on that
  // This is not part of the spec and could be optional
  /* if (focusGroup != null) {
    const children = focusGroup.children;
    for (let child of children) {
      if (child !== focusTarget) {
        child.setAttribute("tabindex", "-1");
      }
    }
  } */
  if (focusGroup != null) {
    focusTarget.addEventListener("keydown", (event) =>
      handleKeydown(event, focusTarget, focusGroup)
    );
  }
});

function handleKeydown(event, focusTarget, focusGroup) {
  if (event.defaultPrevented) return;
  const options = getOptions(focusGroup);
  const keyMap = getKeyMap(focusTarget, options);

  if (event.key in keyMap) {
    // Handling this one, prevent page scrolling with up/down arrows
    event.preventDefault();
    console.log("handling", options, keyMap, focusTarget);
    keyMap[event.key](focusTarget, focusGroup, options);
  }
}

/**
 *
 * @param {Element} focusTarget
 * @param {object} options
 * @param options.wrap
 * @param options.horizontal
 * @param options.vertical
 * @param options.extended
 * @returns
 */
function getKeyMap(focusTarget, options) {
  const isLTR = getComputedStyle(focusTarget).direction === "ltr";

  // Set directional event handlers
  let map = {};
  if (options.horizontal) {
    map = {
      ...map,
      ArrowLeft: isLTR ? getPreviousCandidate : getNextCandidate,
      ArrowRight: isLTR ? getNextCandidate : getPreviousCandidate,
    };
  }
  if (options.vertical) {
    map = {
      ...map,
      ArrowUp: getPreviousCandidate,
      ArrowDown: getNextCandidate,
    };
  }
  return map;
}

/**
 *
 * @param {Event} event
 * @returns {Element}
 */
function getFocusTarget(event) {
  return event.target.shadowRoot?.activeElement || document.activeElement;
}

function getFocusGroup(element) {
  if (element.parentElement.hasAttribute("focusgroup"))
    return element.parentElement;
  if (element.assignedSlot?.parentElement.hasAttribute("focusgroup"))
    return element.assignedSlot.parentElement;
  return null;
}

/**
 *
 * @param {Element} focusGroup
 * @returns options
 * @returns options.vertical
 * @returns options.horizontal
 * @returns options.wrap
 * @returns options.extend
 */
function getOptions(focusGroup) {
  const options = ` ${focusGroup.getAttribute("focusgroup").trim()} `;
  return {
    vertical: !options.includes(" horizontal "),
    horizontal: !options.includes(" vertical "),
    wrap: options.includes(" wrap "),
    extend: options.includes(" extend "),
  };
}

function getPreviousCandidate(focusTarget, focusGroup, options) {
  let nextFocusable = treeWalker(
    focusTarget,
    focusGroup,
    focusTarget,
    options,
    "previous"
  );

  // Check if wrapping is enabled and possible
  if (nextFocusable == null && options.wrap) {
    nextFocusable = treeWalker(
      focusGroup.lastElementChild,
      focusGroup,
      focusTarget,
      options,
      "previous"
    );
  }

  if (nextFocusable != null) {
    focusTarget.removeEventListener("keydown", handleKeydown);
    nextFocusable.focus();
  }
}

function getNextCandidate(focusTarget, focusGroup, options) {
  let nextFocusable = treeWalker(
    focusTarget,
    focusGroup,
    focusTarget,
    options,
    "next"
  );

  // See if wrapping is enabled and possible
  if (nextFocusable == null && options.wrap) {
    nextFocusable = treeWalker(
      focusGroup.firstElementChild,
      focusGroup,
      focusTarget,
      options,
      "next"
    );
  }

  if (nextFocusable != null) {
    focusTarget.removeEventListener("keydown", handleKeydown);
    nextFocusable.focus();
  }
}

function treeWalker(node, focusGroup, initialTarget, options, mode = "next") {
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
      currentNode.parentElement.hasAttribute("focusgroup") &&
      currentNode.matches(focusableSelector)
    ) {
      // Clean up

      // Focus
      return currentNode;
    }

    if (currentNode.hasAttribute("focusgroup")) {
      // Found another focusgroup
      const currentOptions = getOptions(currentNode);
      if (currentOptions.extend) {
        //debugger;
        return treeWalker(
          mode === "next"
            ? currentNode.firstElementChild
            : currentNode.lastElementChild,
          currentNode,
          initialTarget,
          currentOptions,
          mode
        );
      }
    }

    if (currentNode.childElementCount !== 0) {
      //debugger;
      return treeWalker(
        mode === "next"
          ? currentNode.firstElementChild
          : currentNode.lastElementChild,
        focusGroup,
        initialTarget,
        options,
        mode
      );
    }

    // TODO: Descent into shadow trees

    // Move prev/next sibling
    currentNode =
      mode === "next"
        ? currentNode.nextElementSibling
        : currentNode.previousElementSibling;
  }

  // Focusgroup does not contain any more items, start to ascent the tree if it extends
  if (options.extend) {
    // debugger;
    // TODO: walk up shadow dom
    // See if siblings are focusable
    currentNode = initialTarget.parentElement;
    while (currentNode) {
      const nextSibling =
        mode === "next"
          ? currentNode.nextElementSibling
          : currentNode.previousElementSibling;
      if (nextSibling) {
        const result = treeWalker(
          nextSibling,
          null,
          initialTarget,
          options,
          mode
        );
        if (result) {
          return result;
        }
      }
      currentNode = currentNode.parentElement;
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
