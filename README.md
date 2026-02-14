# svg-injector

[![npm version](https://img.shields.io/npm/v/@tanem/svg-injector.svg?style=flat-square)](https://www.npmjs.com/package/@tanem/svg-injector)
[![build status](https://img.shields.io/github/actions/workflow/status/tanem/svg-injector/ci.yml?branch=master&style=flat-square)](https://github.com/tanem/svg-injector/actions?query=workflow%3ACI)
[![coverage status](https://img.shields.io/codecov/c/github/tanem/svg-injector.svg?style=flat-square)](https://codecov.io/gh/tanem/svg-injector)
[![npm downloads](https://img.shields.io/npm/dm/@tanem/svg-injector.svg?style=flat-square)](https://www.npmjs.com/package/@tanem/svg-injector)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@tanem/svg-injector?style=flat-square)](https://bundlephobia.com/package/@tanem/svg-injector)

> A fast, caching, dynamic inline SVG DOM injection library.

## Background

There are a number of ways to use SVG on a page (`object`, `embed`, `iframe`, `img`, CSS `background-image`) but to unlock the full potential of SVG, including full element-level CSS styling and evaluation of embedded JavaScript, the full SVG markup must be included directly in the DOM.

Wrangling and maintaining a bunch of inline SVG on your pages isn't anyone's idea of good time, so `SVGInjector` lets you work with simple tag elements and does the heavy lifting of swapping in the SVG markup inline for you.

## Basic Usage

```html
<div id="inject-me" data-src="icon.svg"></div>
```

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementById('inject-me'))
```

## SVG Sprite Support

You can inject individual symbols from an SVG sprite sheet by appending a fragment identifier to the `data-src` URL. The library will fetch the sprite file, extract the `<symbol>` matching the fragment ID, and inject it as a standalone inline `<svg>`.

```html
<div class="icon" data-src="sprite.svg#icon-star"></div>
<div class="icon" data-src="sprite.svg#icon-heart"></div>
```

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('icon'))
```

When `cacheRequests` is `true` (the default), the sprite file is fetched once and reused for all symbol extractions, so multiple icons from the same sprite file result in only a single HTTP request.

**Limitations:**

- Each `<symbol>` must be self-contained. Shared `<defs>` at the root level of the sprite (e.g. gradients or filters referenced by multiple symbols) are **not** copied into the extracted SVG. If your symbols depend on shared definitions, use individual SVG files instead or inline the required definitions within each `<symbol>`.
- Only `<symbol>` elements are supported for extraction. The fragment ID must match the `id` of a `<symbol>` in the sprite.

## Avoiding XSS

Be careful when injecting arbitrary third-party SVGs into the DOM, as this opens the door to XSS attacks. If you must inject third-party SVGs, it is highly recommended to sanitise the SVG before injecting. The following example uses [DOMPurify](https://github.com/cure53/DOMPurify) to strip out attributes and tags that can execute arbitrary JavaScript. Note that this can alter the behaviour of the SVG.

```js
import { SVGInjector } from '@tanem/svg-injector'
import DOMPurify from 'dompurify'

SVGInjector(document.getElementById('inject-me'), {
  beforeEach(svg) {
    DOMPurify.sanitize(svg, {
      IN_PLACE: true,
      USE_PROFILES: { svg: true, svgFilters: true },
    })
  },
})
```

## Live Examples

- Basic Usage: [Source](https://github.com/tanem/svg-injector/tree/master/examples/basic-usage) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/basic-usage)
- API Usage: [Source](https://github.com/tanem/svg-injector/tree/master/examples/api-usage) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/api-usage)
- IRI Renumeration: [Source](https://github.com/tanem/svg-injector/tree/master/examples/iri-renumeration) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/iri-renumeration)
- Sprite Usage: [Source](https://github.com/tanem/svg-injector/tree/master/examples/sprite-usage) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/sprite-usage)
- UMD Build (Development): [Source](https://github.com/tanem/svg-injector/tree/master/examples/umd-dev) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/umd-dev)
- UMD Build (Production): [Source](https://github.com/tanem/svg-injector/tree/master/examples/umd-prod) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/umd-prod)

## API

**Arguments**

- `elements` - A single DOM element or array of elements, with `src` or `data-src` attributes defined, to inject.
- `options` - _Optional_ An object containing the optional arguments defined below. Defaults to `{}`.
  - `afterAll(elementsLoaded)` - _Optional_ A callback which is called when all elements have been processed. `elementsLoaded` is the total number of elements loaded. Defaults to `() => undefined`.
  - `afterEach(err, svg)` - _Optional_ A callback which is called when each element is processed. `svg` is the newly injected SVG DOM element. Defaults to `() => undefined`.
  - `beforeEach(svg)` - _Optional_ A callback which is called just before each SVG element is added to the DOM. `svg` is the SVG DOM element which is about to be injected. Defaults to `() => undefined`.
  - `cacheRequests` - _Optional_ Use request cache. Defaults to `true`.
  - `evalScripts` - _Optional_ Run any script blocks found in the SVG. One of `'always'`, `'once'`, or `'never'`. Defaults to `'never'`.
  - `httpRequestWithCredentials` - _Optional_ Boolean that indicates whether or not cross-site Access-Control requests should be made using credentials. Defaults to `false`.
  - `renumerateIRIElements` - _Optional_ Boolean indicating if SVG IRI addressable elements should be renumerated. Defaults to `true`. When enabled, IDs on IRI-addressable elements (`clipPath`, `linearGradient`, `mask`, `path`, etc.) are made unique, and all references to them - presentation attributes, `href`/`xlink:href`, inline `style` attributes, and `<style>` element text - are updated. Note: **all** matching element types are renumerated, not only those inside `<defs>`. Set to `false` if you need to query injected elements by their original IDs.

**Example**

```html
<div class="inject-me" data-src="icon-one.svg"></div>
<div class="inject-me" data-src="icon-two.svg"></div>
```

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('inject-me'), {
  afterAll(elementsLoaded) {
    console.log(`injected ${elementsLoaded} elements`)
  },
  afterEach(err, svg) {
    if (err) {
      throw err
    }
    console.log(`injected ${svg.outerHTML}`)
  },
  beforeEach(svg) {
    svg.setAttribute('stroke', 'red')
  },
  cacheRequests: false,
  evalScripts: 'once',
  httpRequestWithCredentials: false,
  renumerateIRIElements: false,
})
```

## Installation

> ⚠️This library uses [`Array.from()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/from), so if you're targeting [browsers that don't support that method](https://kangax.github.io/compat-table/es6/#test-Array_static_methods), you'll need to ensure an appropriate polyfill is included manually. See [this issue comment](https://github.com/tanem/svg-injector/issues/97#issuecomment-483365473) for further detail.

> ⚠️As of v11, this library is only tested against modern browsers (Chromium, Firefox, WebKit) via Playwright. IE and other legacy browsers are no longer supported. If you need IE support, pin `@tanem/svg-injector@^10`.

```
$ npm install @tanem/svg-injector
```

There are also UMD builds available via [unpkg](https://unpkg.com/):

- https://unpkg.com/@tanem/svg-injector/dist/svg-injector.umd.development.js
- https://unpkg.com/@tanem/svg-injector/dist/svg-injector.umd.production.js

## Credit

This is a fork of a [library](https://github.com/iconic/SVGInjector) originally developed by [Waybury](http://waybury.com/) for use in [iconic.js](https://useiconic.com/tools/iconic-js/), part of the [Iconic](https://useiconic.com/) icon system.

## License

MIT
