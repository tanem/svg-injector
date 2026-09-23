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
The step that obtains an injection's SVG document and hands it over as an element the injection owns. Which way it went, a data URL, a cached request, or an uncached request, is its own business; the rest of the pipeline does not see it.
_Avoid_: Loader, fetch, source

**Transport**:
The layer under the load path that makes the XHR for one URL and answers with an SVG document or an error. Data URLs never reach it. The cache sits between it and the load path.
_Avoid_: Ajax, request, XHR layer

**Transform**:
The steps applied to a loaded SVG before the swap: extract the symbol, transfer the placeholder's attributes, renumerate IRIs, evaluate scripts.
_Avoid_: Processing, post-processing, prepare
