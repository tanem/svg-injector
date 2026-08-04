# Error Handling

Three placeholders, two of which cannot be injected. Both failures come from a real static server rather than a mocked response: `missing.svg` is not in `public/`, and `markup.html` is a valid SVG document saved with an extension that makes every server send it as `text/html`.

## What it shows

- `afterEach` fires once per element on every path, with an `Error` for the two that failed and the injected `<svg>` for the one that succeeded. Its third argument is the element itself, which is what pairs each error with the placeholder it belongs to.
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
  afterEach(error, svg, element) {
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

`element` is the third `afterEach` argument, and is the placeholder that was passed in. It is present on every call, failures included, which is what lets a collection put each fallback in the right place:

```js
afterEach(error, svg, element) {
  if (error) {
    element.replaceWith(fallbackFor(element))
  }
}
```

Nothing else in the arguments identifies it. On failure there is no `svg`, only one of the two messages above names its URL, and a URL would not be enough in general anyway: two placeholders sharing one `data-src` is the normal case for a sprite.

The fallback goes in as each element fails. Deriving it instead from which placeholders are still in the document — an element that injected has been replaced by its SVG — works, but only once the whole collection has finished, so one slow load holds back every fallback.
