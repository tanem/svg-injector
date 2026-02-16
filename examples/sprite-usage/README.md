# Sprite Usage

Inject individual symbols from an SVG sprite sheet by appending a fragment identifier to the `data-src` URL. The library fetches the sprite file, extracts the `<symbol>` matching the fragment ID, and injects it as a standalone inline `<svg>`.

## Usage

```html
<div class="icon" data-src="sprite.svg#icon-star"></div>
<div class="icon" data-src="sprite.svg#icon-heart"></div>
```

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('icon'))
```

When `cacheRequests` is `true` (the default), the sprite file is fetched once and reused for all symbol extractions. Multiple icons from the same sprite file result in only a single HTTP request.

## Limitations

- Each `<symbol>` must be self-contained. Shared `<defs>` at the root level of the sprite (e.g. gradients or filters referenced by multiple symbols) are **not** copied into the extracted SVG. If your symbols depend on shared definitions, use individual SVG files instead or inline the required definitions within each `<symbol>`.
- Only `<symbol>` elements are supported for extraction. The fragment ID must match the `id` of a `<symbol>` in the sprite.
- `<use>` chains within symbols are not resolved. If a symbol internally references another symbol via `<use>`, the reference will break after extraction.
