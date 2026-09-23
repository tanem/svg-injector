# SVG Injector

Replaces placeholder elements in a page with the inline SVG content they point at, so the SVG can be styled and scripted as part of the document.

## Language

**Placeholder**:
The element passed to `SVGInjector`, carrying `src` or `data-src`, that the injected SVG replaces in the DOM.
_Avoid_: Element, target, img

**Injection**:
One placeholder's run through the pipeline: split the fragment, load, transform, swap, settle.
_Avoid_: Request, load, render

**Settle**:
The single completion of an injection, success or failure. It is deferred, happens exactly once, releases the in-flight guard, and feeds `afterEach` and the `afterAll` count.
_Avoid_: Callback, complete, accounting, resolve

**In-flight guard**:
The set of placeholders with an injection running. A second call for a placeholder already in it settles with an error and leaves the guard untouched.
_Avoid_: Lock, dedupe, elementsInFlight

**Load path**:
The way an injection obtains its SVG document: a data URL, a cached request, or an uncached request.
_Avoid_: Loader, fetch, transport

**Transform**:
The steps applied to a loaded SVG before the swap: extract the symbol, transfer the placeholder's attributes, renumerate IRIs, evaluate scripts.
_Avoid_: Processing, post-processing, prepare
