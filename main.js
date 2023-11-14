const visited = new WeakMap();

window.addEventListener("focusin", (e) => {
  console.log("event", e);
  console.log("target", e.target);
  console.log("currenttarget", e.currentTarget);
  console.log("parent", e.target.parentElement);
  console.log("hasShadowRoot", e.target.shadowRoot != null);
  console.log("activeElement", document.activeElement);
  console.log(
    "activeShadowRootElement",
    e.target.shadowRoot != null ? e.target.shadowRoot.activeElement : null
  );

  // Find the real target of the event, even if it's nested in a shadow-root
  const focusTarget = getFocusTarget(e);
  console.log("hasFocusgroup", focusTarget.closest("[focusgroup]") != null);

  // Check if target is part of a focusgroup
  const focusGroup = getFocusGroup(focusTarget);
  console.log("focusGroup", focusGroup);

  // Init
  if (focusGroup != null) {
    const children = focusGroup.children;
    for (let child of children) {
      if (child !== focusTarget) {
        child.setAttribute("tabindex", "-1");
      }
    }
  }
});

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

function getSiblings(focusTarget, focusGroup) {}
