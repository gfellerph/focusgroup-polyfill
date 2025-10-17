// Dom interference buttons
const container = document.getElementById("dom-interference-container");
document
  .getElementById("dom-interference-add-button")
  .addEventListener("click", () => {
    const newButton = document.createElement("button");
    newButton.innerHTML = `Button ${container.children.length + 1}`;
    container.appendChild(newButton);
  });

document
  .getElementById("dom-interference-remove-button")
  .addEventListener("click", () => {
    document
      .querySelector("#dom-interference-container > :last-child")
      .remove();
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
