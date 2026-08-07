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

## Getting a data URL from the bundler

The last icon in this example does not hard-code its URL. It imports a local SVG file and assigns the result to `data-src`:

```js
import inlinedByVite from './inlined-by-vite.svg'

document.getElementById('inlined-by-vite').setAttribute('data-src', inlinedByVite)
```

Vite resolves that import to a data URL when the file is under `build.assetsInlineLimit` (4 kB by default), in dev as well as in the production build. A file over the limit resolves to a normal URL instead, which the library fetches over the network as usual.

The assignment has to happen in script because `data-src` is an opaque attribute to Vite's HTML handling: an import is the only reference the bundler follows. That is also why the SVG files in the other examples live in `public/`: they are named in `data-src` and never imported, so the bundler must copy them across untouched.

## Supported formats

Everything between `data:image/svg+xml` and the first comma is read as an RFC 2397 parameter list: semicolon-separated, with case-insensitive names and values. A `base64` parameter selects base64 decoding, otherwise the data is percent-decoded.

- `data:image/svg+xml,` followed by URL-encoded SVG (percent-encoded).
- `data:image/svg+xml;base64,` followed by base64-encoded SVG.
- `data:image/svg+xml;charset=utf-8,` followed by URL-encoded SVG.
- `data:image/svg+xml;charset=utf-8;base64,` followed by base64-encoded SVG.

A `charset` parameter is accepted when it names UTF-8: `utf-8` or `utf8`, in any case. Base64 data is decoded as UTF-8, so multi-byte characters in `<text>` elements survive intact.

## Fragment identifiers

Fragment identifiers work with data URLs the same way as with regular URLs. If a data URL contains an inlined SVG sprite, you can extract a specific symbol:

```html
<div data-src="data:image/svg+xml,...encoded-sprite...#icon-name"></div>
```

## Caching

Data URLs bypass the request cache entirely, so `cacheRequests` has no effect on them: the SVG content is already in the URL.

## Limitations

- Only `data:image/svg+xml` MIME types are supported. Other image formats (e.g. `data:image/png`) are not handled.
- A `charset` parameter naming anything other than UTF-8 (e.g. `charset=iso-8859-1`) is rejected with an `Unsupported data URL format` error rather than decoded with the wrong encoding. Unrecognised parameters are rejected the same way.
- Parse errors from malformed SVG content are reported through the `afterEach` error callback.
