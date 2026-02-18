# Focusgroup polyfill

An experimental polyfill for the [`focusgroup` proposal](https://open-ui.org/components/focusgroup.explainer/) by the Open UI Community Group.

## Workflow

### Lazy initialisation

The polyfill waits for any `focusin` event before it starts to track focusgroups and their child elements. This is done to prevent possible observer overload on pages with thousands of shadow roots, where initialising lots of mutation observers could non-negligible performance impact[^1].

[^1]: Peter Kroener, 100'000 MutationObserver vs. 100'000 Funktionen: https://www.peterkroener.de/100000-mutationobserver-vs-100000-funktionen/

- `focusin`
- Deep search for the real focused element (in shadow roots) while attaching `focusin` listeners to each shadow root on the way to catch continuous events. Global `focusin` only fires once per shadow root [^2].
- Check if target is a valid focusgroup candidate (not `focusgroup=none`)
-

[^2]: https://issues.chromium.org/issues/41484609#comment8

## References

-
