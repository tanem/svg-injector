# Data URL Usage

Inject SVGs from `data:image/svg+xml` URLs without making network requests. This is useful when bundlers like Vite inline small SVG files as data URIs during the build process.

## Usage

```html
<!-- URL-encoded (Vite's default for SVGs without <text>) -->
<div
  data-src="data:image/svg+xml,%3Csvg%20xmlns%3D'...'%3E...%3C%2Fsvg%3E"
></div>

<!-- Base64-encoded (Vite's default for SVGs containing <text>) -->
<div data-src="data:image/svg+xml;base64,PHN2Zy..."></div>
```

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.querySelectorAll('[data-src]'))
```

The library detects the `data:image/svg+xml` prefix and parses the SVG content directly using `DOMParser`. No XHR is made, which avoids Content Security Policy violations that would otherwise occur when attempting to fetch a `data:` URI.

## Supported formats

- `data:image/svg+xml,` followed by URL-encoded SVG (percent-encoded).
- `data:image/svg+xml;base64,` followed by base64-encoded SVG.
- `data:image/svg+xml;charset=utf-8,` followed by URL-encoded SVG.

## Fragment identifiers

Fragment identifiers work with data URLs the same way as with regular URLs. If a data URL contains an inlined SVG sprite, you can extract a specific symbol:

```html
<div data-src="data:image/svg+xml,...encoded-sprite...#icon-name"></div>
```

## Caching

Data URLs bypass the request cache entirely since the SVG content is already embedded in the URL. The `cacheRequests` option has no effect on data URL elements.

## Limitations

- Only `data:image/svg+xml` MIME types are supported. Other image formats (e.g. `data:image/png`) are not handled.
- Parse errors from malformed SVG content are reported through the `afterEach` error callback.
