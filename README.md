# Focusgroup polyfill

## Questions

- Does every shadow root need to import and instantiate it's own version of the polyfill? -> Most likely yes, in case the API changes and custom elements using different versions of the focusgroup polyfill need to live on the same page, this functionality will be necessary.
