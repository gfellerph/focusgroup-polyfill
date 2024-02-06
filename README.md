# Focusgroup polyfill

## Feature roadmap

- [ ] Signalling to assistive technology that alternative keyboard interactions are available
- [ ] Grid option for focusgroup
- [ ] Focus by text search
- [ ] Support for CSS scenarios

## Questions

- Does every shadow root need to import and instantiate it's own version of the polyfill?

  - Most likely yes, in case the API changes and custom elements using different versions of the focusgroup polyfill need to live on the same page, this functionality will be necessary.
  - As focus does not know shadow boundaries, this becomes really tricky. Extended focusgroups should also work inside a shadow boundary which prescribes a global integration.

- Should an option "skiptabs" be added for configuring if the polyfill should add tabindex="-1" to focusgroup candidates?
