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

You can inject individual symbols from an SVG sprite sheet by appending a fragment identifier (e.g. `sprite.svg#icon-star`) to the `data-src` URL. See the [sprite usage example](https://github.com/tanem/svg-injector/tree/master/examples/sprite-usage) for full documentation and known limitations.

## Data URL Support

When a bundler like Vite inlines small SVGs as `data:image/svg+xml` URLs, the library parses the SVG content directly from the data URL without making a network request. This avoids Content Security Policy violations and unnecessary XHR overhead. See the [data URL usage example](https://github.com/tanem/svg-injector/tree/master/examples/data-url-usage) for supported formats and known limitations.

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
- Data URL Usage: [Source](https://github.com/tanem/svg-injector/tree/master/examples/data-url-usage) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/data-url-usage)
- Sprite Usage: [Source](https://github.com/tanem/svg-injector/tree/master/examples/sprite-usage) | [Sandbox](https://codesandbox.io/s/github/tanem/svg-injector/tree/master/examples/sprite-usage)

## API

**Arguments**

- `elements` - The elements to inject, each with a `src` or `data-src` attribute defined. Accepts a single `Element`, an `Element` array, a `NodeList` (e.g. from `querySelectorAll`), an `HTMLCollection` (e.g. from `getElementsByClassName`), or `null`. A `null` or empty argument injects nothing and calls `afterAll(0)`.
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

> ⚠️This library is tested against current Chromium, Firefox and WebKit via Playwright. A browser is supported if the suite covers it.

> ⚠️The published build is es2019, so the oldest browsers it runs in are Chrome 66, Firefox 58, Safari 11.1 and Edge 79. A polyfill cannot extend that: the syntax itself will not parse. v11 was published as es5 and reaches Chrome 45, Firefox 32 and Safari 9, and v10 is the last line that supports IE. Bundlers do not transpile `node_modules` by default, so a project targeting older browsers than these has to opt this package in: see [MIGRATION.md](MIGRATION.md#v1200).

> ⚠️This library targets browsers and uses APIs that [jsdom](https://github.com/jsdom/jsdom) does not provide, so a test suite running under jsdom (Jest's default environment) needs polyfills: [`CSS.escape`](https://developer.mozilla.org/en-US/docs/Web/API/CSS/escape_static) for sprite support, and [`TextDecoder`](https://developer.mozilla.org/en-US/docs/Web/API/TextDecoder) for base64 data URLs. In a Jest setup file:
>
> ```js
> import 'css.escape'
> import { TextDecoder } from 'node:util'
>
> globalThis.TextDecoder ??= TextDecoder
> ```

```
$ npm install @tanem/svg-injector
```

The package has no runtime dependencies.

## Credit

This is a fork of a [library](https://github.com/iconic/SVGInjector) originally developed by [Waybury](http://waybury.com/) for use in [iconic.js](https://useiconic.com/tools/iconic-js/), part of the [Iconic](https://useiconic.com/) icon system.

## Contributing

Issues and pull requests are welcome. `npm run test:playwright` is the development loop, run against a current `npm run build`; `npm test` runs the full gate.

Repo conventions that aren't visible in the code, such as the PR labels that drive releases, the fixture routing the Playwright suite relies on, and the library's known limitations, live in [AGENTS.md](AGENTS.md). Coding agents read it from the repo root, so keep it in sync when a change invalidates something it states.

## License

MIT
