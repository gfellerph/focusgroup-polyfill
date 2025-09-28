// Dom interference buttons
const container = document.getElementById("dom-interference-container");
const domInterferenceAddButton = document.getElementById(
  "dom-interference-add-button"
);
if (domInterferenceAddButton) {
  domInterferenceAddButton.addEventListener("click", () => {
    const newButton = document.createElement("button");
    newButton.innerHTML = `Button ${container.children.length + 1}`;
    container.appendChild(newButton);
  });
}

const domInterferenceRemoveButton = document.getElementById(
  "dom-interference-remove-button"
);
if (domInterferenceRemoveButton) {
  domInterferenceRemoveButton.addEventListener("click", () => {
    document
      .querySelector("#dom-interference-container > :last-child")
      .remove();
  });
}

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

// WYSIWYG toolbar actions
document.addEventListener("DOMContentLoaded", () => {
  const toolbar = document.querySelector(".wysiwyg-toolbar");
  const editor = document.querySelector(".wysiwyg-editor");
  if (!toolbar || !editor) return;
  toolbar.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-command]");
    if (!btn) return;
    const command = btn.getAttribute("data-command");
    editor.focus();
    document.execCommand(command, false, null);
  });
  // Keyboard shortcuts
  editor.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && !e.altKey) {
      if (e.key.toLowerCase() === "b") {
        document.execCommand("bold");
        e.preventDefault();
      } else if (e.key.toLowerCase() === "i") {
        document.execCommand("italic");
        e.preventDefault();
      } else if (e.key.toLowerCase() === "u") {
        document.execCommand("underline");
        e.preventDefault();
      }
    }
  });
});
