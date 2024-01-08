// Credit:
// https://github.com/KittyGiraudel/focusable-selectors/blob/main/index.js
const notFocusableSelectorPart = {
  inert: ":not([inert]):not([inert] *)",
  negTabIndex: ':not([tabindex^="-"])',
  disabled: ":not(:disabled)",
};

export const focusableSelector = [
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
export const keyConflictSelector = [
  'input:is([type="text"],[type="url"],[type="password"],[type="search"],[type="number"],[type="email"],[type="tel"])',
  "select",
  "textarea",
  "audio",
  "video",
  "iframe",
].join(",");
