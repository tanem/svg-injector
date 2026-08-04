# Error Handling

Three placeholders, two of which cannot be injected. Both failures come from a real static server rather than a mocked response: `missing.svg` is not in `public/`, and `markup.html` is a valid SVG document saved with an extension that makes every server send it as `text/html`.

## What it shows

- `afterEach` fires once per element on every path, with an `Error` for the two that failed and the injected `<svg>` for the one that succeeded.
- The error messages name their cause: `Unable to load SVG file: missing.svg` and `Invalid content type: text/html`. The content type is checked as soon as the response headers arrive, so a rejected response never has its body parsed.
- `afterAll` receives the number of elements _processed_, failures included, so it is `3` here while only one SVG reached the page. Count the `afterEach` calls whose `error` is `null` for the number injected.
- A failed injection leaves its placeholder in the document. Nothing is removed, so there is somewhere to put a fallback.

See the [API docs](https://github.com/tanem/svg-injector#api) for the full callback semantics.

## Under `npm run dev`

Vite's dev server answers an unmatched path with `index.html` and a 200 rather than a 404, so the first case reports `Unable to parse SVG from response: missing.svg` there instead of `Unable to load SVG file: missing.svg`. Both are the same failure seen from different sides: the URL ends `.svg`, which skips the content-type check, so the HTML body is only rejected once it fails to parse as an SVG document. `npm run build && npm run preview` serves the 404 and gives the first message.

## Usage

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('inject-me'), {
  afterEach(error, svg) {
    if (error) {
      console.error(error)
      return
    }
    console.log(`injected ${svg.outerHTML}`)
  },
  afterAll(elementsLoaded) {
    console.log(`processed ${elementsLoaded} elements`)
  },
})
```

Report the error and return. A throw from `afterEach` escapes as an uncaught exception; the accounting still completes and the rest of the collection still injects, but the page has an unhandled error in it either way.

## Matching an error back to its element

`afterEach` is called with the error and, on success, the injected SVG. It is not called with the placeholder, and only one of the two messages above names the URL, so a collection cannot pair its failures with their elements from the callback arguments alone.

The example works around it in `afterAll`: an element that injected has been replaced by its SVG, which leaves the failures as the only placeholders still in the document.

```js
const placeholders = Array.from(document.getElementsByClassName('inject-me'))

SVGInjector(placeholders, {
  afterAll() {
    for (const el of placeholders.filter((el) => el.isConnected)) {
      // el failed
    }
  },
})
```

That waits for the whole collection. To react per element as soon as it fails, call `SVGInjector` once per placeholder instead and let the closure hold the element. `afterAll` then reports `1` per call rather than the collection total.
