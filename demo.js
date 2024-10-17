// Dom interference buttons
const container = document.getElementById("dom-interference-container");
document
  .getElementById("dom-interference-add-button")
  ?.addEventListener("click", () => {
    const newButton = document.createElement("button");
    newButton.innerHTML = `Button ${container.children.length + 1}`;
    container.appendChild(newButton);
  });

document
  .getElementById("dom-interference-remove-button")
  ?.addEventListener("click", () => {
    document
      .querySelector("#dom-interference-container > :last-child")
      ?.remove();
  });

// JIT options
const jitFocusgroup = document.getElementById("jit-focusgroup");
document.querySelectorAll(".jit-toggle").forEach((toggle) => {
  toggle.addEventListener("change", (e) => {
    let options = jitFocusgroup.getAttribute("focusgroup");
    const optionToToggle = e.target.name;
    if (options.includes(optionToToggle)) {
      options = options.replace(optionToToggle, "");
    } else {
      options += ` ${optionToToggle}`;
    }
    jitFocusgroup.setAttribute("focusgroup", options.trim());
  });
});

// Custom attribute testing
const testButton = document.getElementById("test-attribute");
const addAttribute = document.getElementById("add-attribute");
const removeAttribute = document.getElementById("remove-attribute");
const editAttribute = document.getElementById("edit-attribute");
const cloneDiv = document.getElementById("clone-div");
addAttribute?.addEventListener("click", () =>
  testButton?.setAttribute("custom-attribute", "1")
);
removeAttribute?.addEventListener("click", () =>
  testButton?.removeAttribute("custom-attribute")
);
editAttribute?.addEventListener("click", () =>
  testButton?.setAttribute(
    "custom-attribute",
    `${
      testButton !== null
        ? parseInt(testButton.getAttribute("custom-attribute") || "0") + 1
        : 0
    }`
  )
);
cloneDiv?.addEventListener("click", (e) => {
  if (!(e.target instanceof Element)) return;
  const x = e.target?.parentElement.cloneNode(true);
  document.body.prepend(x);
});
