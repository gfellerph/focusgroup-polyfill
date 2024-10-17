// Adapted from Kitty Giraudel:
// https://github.com/KittyGiraudel/focusable-selectors/blob/main/index.js

export const focusableSelector = `:where(${[
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
].join(",")})`;

export const focusDisablingParentSelecor = `:where(${[
  "[inert]",
  "[inert] *",
  ":disabled",
  "dialog:not([open]) *",
  "[popover]:not(:popover-open) *",
  "details:not([open]) > *:not(details > summary:first-of-type)",
  "details:not([open]) > *:not(details > summary:first-of-type) *",
].join(",")})`;

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
