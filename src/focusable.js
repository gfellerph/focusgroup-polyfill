// Adapted from Kitty Giraudel:
// https://github.com/KittyGiraudel/focusable-selectors/blob/main/index.js

const focusableElementsSelector = [
  "button",
  'input:not([type="hidden"])',
  "[tabindex]",
  "select",
  "textarea",
  "[contenteditable]",
  `a[href]`,
  `iframe`,
  `audio[controls]`,
  `video[controls]`,
  `area[href]`,
  "details > summary:first-of-type",
].join(",");

const focusDisablingSelector = [
  "[inert]",
  "[inert] *",
  ":disabled",
  "dialog:not([open]) *",
  "[popover]:not(:popover-open) *",
  "details:not([open]) > *:not(details > summary:first-of-type)",
  "details:not([open]) > *:not(details > summary:first-of-type) *",
].join(",");

const focusableSelector = `:where(${focusableElementsSelector})`;

const focusDisablingParentSelecor = `:where(${focusDisablingSelector})`;

// These elements already use arrow keys for navigation, tab should be used to exit
export const keyConflictSelector = [
  'input:is([type="text"],[type="radio"],[type="url"],[type="password"],[type="search"],[type="number"],[type="email"],[type="tel"])',
  "select",
  "textarea",
  "[contenteditable]",
  "audio",
  "video",
  "iframe",
].join(",");

/**
 * Check if an element is currently focusable
 * @param {Element} element
 * @returns {boolean}
 */
export function isFocusable(element) {
  return (
    !element.matches(focusDisablingParentSelecor) &&
    element.matches(focusableSelector)
  );
};
