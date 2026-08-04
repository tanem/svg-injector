# svg-injector

[![npm version](https://img.shields.io/npm/v/@tanem/svg-injector.svg?style=flat-square)](https://www.npmjs.com/package/@tanem/svg-injector)
[![build status](https://img.shields.io/github/actions/workflow/status/tanem/svg-injector/ci.yml?branch=master&style=flat-square)](https://github.com/tanem/svg-injector/actions?query=workflow%3ACI)
[![coverage status](https://img.shields.io/codecov/c/github/tanem/svg-injector.svg?style=flat-square)](https://codecov.io/gh/tanem/svg-injector)
[![npm downloads](https://img.shields.io/npm/dm/@tanem/svg-injector.svg?style=flat-square)](https://www.npmjs.com/package/@tanem/svg-injector)
[![minzipped size](https://img.shields.io/bundlephobia/minzip/@tanem/svg-injector?style=flat-square)](https://bundlephobia.com/package/@tanem/svg-injector)

> A fast, caching, dynamic inline SVG DOM injection library.

[Background](#background) | [When To Use This](#when-to-use-this) | [Basic Usage](#basic-usage) | [SVG Sprite Support](#svg-sprite-support) | [Data URL Support](#data-url-support) | [API](#api) | [Live Examples](#live-examples) | [Installation](#installation) | [Security](#security) | [Credit](#credit) | [Contributing](#contributing) | [License](#license)

## Background

There are a number of ways to use SVG on a page (`object`, `embed`, `iframe`, `img`, CSS `background-image`) but to unlock the full potential of SVG, including full element-level CSS styling and evaluation of embedded JavaScript, the full SVG markup must be included directly in the DOM.

Wrangling and maintaining a bunch of inline SVG on your pages isn't anyone's idea of good time, so `SVGInjector` lets you work with simple tag elements and does the heavy lifting of swapping in the SVG markup inline for you.

## When To Use This

Injection costs a network request and a DOM swap, and it earns that cost in one case: the SVG's URL isn't known until the page runs, and the markup still has to be reachable by CSS and script. Everything cheaper either keeps the SVG out of your document or puts it there before the page loads.

- **You only need to display the image.** Use `<img src="icon.svg">`, or a CSS `background-image`. Neither lets the page style, animate or script the SVG's contents, and that is usually fine.
- **You want the SVG isolated from the page.** `<object>`, `<embed>` and `<iframe>` load it as a separate document, so your stylesheet doesn't reach inside it and its `<style>` elements don't reach out.
- **The SVGs live in your repo and are known at build time.** Inline the markup, or let the bundler do it: Vite's [`?raw` import](https://vite.dev/guide/assets.html#importing-asset-as-string), or your bundler's SVG loader. There's no runtime fetch, and nothing to wait for before the icon paints.
- **The URL is only known at runtime.** An icon set on a CDN, paths assembled from data, SVGs from a CMS or an API, user uploads. That's what this library is for.

## Basic Usage

```html
<div id="inject-me" data-src="icon.svg"></div>
```

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementById('inject-me'))
```

## SVG Sprite Support

You can inject individual symbols from an SVG sprite sheet by appending a fragment identifier (e.g. `sprite.svg#icon-star`) to the `data-src` URL. With [`cacheRequests`](#cacherequests) left on, the sprite is fetched once and every symbol taken from it shares that request. See the [sprite usage example](https://github.com/tanem/svg-injector/tree/master/examples/sprite-usage) for full documentation and known limitations.

## Data URL Support

When a bundler like Vite inlines small SVGs as `data:image/svg+xml` URLs, the library parses the SVG content directly from the data URL without making a network request. This avoids Content Security Policy violations and unnecessary XHR overhead. Both the URL-encoded and base64 forms are supported. See the [data URL usage example](https://github.com/tanem/svg-injector/tree/master/examples/data-url-usage) for supported formats and known limitations.

## API

### `SVGInjector(elements, options?)`

Injects each element and returns immediately. Everything else is reported through the callbacks in `options`: there is no return value and nothing to await.

### `elements`

The elements to inject. Each one needs the SVG's URL in a `data-src` or `src` attribute, and `data-src` wins if both are set. An element with neither is reported to `afterEach` as `Invalid data-src or src attribute`.

| Accepted                                | Example                                   |
| --------------------------------------- | ----------------------------------------- |
| A single `Element`                      | `document.getElementById('inject-me')`    |
| An `Element` array, `readonly` included | `[iconOne, iconTwo]`                      |
| A `NodeList`                            | `document.querySelectorAll('[data-src]')` |
| An `HTMLCollection`                     | `document.getElementsByClassName('icon')` |
| `null`                                  | injects nothing, calls `afterAll(0)`      |

An empty array, `NodeList` or `HTMLCollection` also injects nothing and calls `afterAll(0)`. The type is exported as `Elements`.

Collections are snapshotted before injection starts, so a live `HTMLCollection` that shrinks as its elements are replaced is still processed in full.

### Options

Every option is optional, and `options` itself defaults to `{}`.

| Option                                                      | Type                                                  | Default   |
| ----------------------------------------------------------- | ----------------------------------------------------- | --------- |
| [`afterAll`](#afterall)                                     | `(elementsLoaded: number) => void`                    | noop      |
| [`afterEach`](#aftereach)                                   | `(error: Error \| null, svg?: SVGSVGElement) => void` | noop      |
| [`beforeEach`](#beforeeach)                                 | `(svg: SVGSVGElement) => void`                        | noop      |
| [`cacheRequests`](#cacherequests)                           | `boolean`                                             | `true`    |
| [`evalScripts`](#evalscripts)                               | `'always' \| 'once' \| 'never'`                       | `'never'` |
| [`httpRequestWithCredentials`](#httprequestwithcredentials) | `boolean`                                             | `false`   |
| [`renumerateIRIElements`](#renumerateirielements)           | `boolean`                                             | `true`    |

#### `afterAll`

Called once per `SVGInjector` call, after every element has been processed. `elementsLoaded` is the number of elements processed, which includes any that failed, so it matches the number of `afterEach` calls rather than the number of SVGs that reached the page. Count the `afterEach` calls whose `error` is `null` for that.

`afterAll(0)` fires for `null` and for an empty collection. When it fires relative to the `SVGInjector` call is covered under [`afterEach`](#aftereach).

#### `afterEach`

Called once per element, after it has been injected or after its injection failed. On success `error` is `null` and `svg` is the injected SVG DOM element. On failure `error` is the `Error` and `svg` is `undefined`.

For every element and every argument, `afterEach` and `afterAll` fire after the `SVGInjector` call has returned. DOM reads placed between the call and the callbacks therefore always see the pre-injection DOM.

```js
SVGInjector(document.querySelectorAll('[data-src]'), {
  afterEach(error, svg) {
    if (error) {
      console.error(error)
      return
    }
    console.log(`injected ${svg.outerHTML}`)
  },
})
```

#### `beforeEach`

Called with the SVG DOM element just before it replaces the placeholder element, so this is where to restyle, class or sanitise it: see [Security](#security). It isn't called for an element whose load failed, since there is no SVG to hand it. Failures detected after it do still call it: a placeholder removed from the DOM between the `SVGInjector` call and the swap gets `beforeEach`, then `afterEach` with `Parent node is null`.

It runs after `evalScripts` has done its work, so removing `<script>` elements here does not stop them running. By this point they have already been evaluated, if the option asked for that, and stripped from the markup either way.

#### `cacheRequests`

Whether the request cache is used. With it on, repeated injections of the same URL share a single request, and each element gets its own clone of the result, so `beforeEach` changes don't leak between them. The cache key is the URL with any fragment identifier removed, which is what lets every symbol from one sprite share a request.

Failed loads are not cached, so a URL that errored is refetched next time. The cache lives as long as the page and is unbounded.

#### `evalScripts`

Whether to run script blocks found in the SVG: `'always'`, `'once'` or `'never'`. `'once'` runs a given URL's scripts on the first injection of that URL only. Leave it at `'never'` for SVGs you don't control: see [Security](#security).

Injected SVGs don't run their `<script>` elements on their own, which is why this option exists. Script elements carrying JavaScript are removed from the injected markup whichever setting is used; only whether they are evaluated on the way out changes. The [eval scripts example](https://github.com/tanem/svg-injector/tree/master/examples/eval-scripts) shows `'once'` and `'always'` side by side over repeated injections of the same file.

#### `httpRequestWithCredentials`

Whether cross-site Access-Control requests for the SVG are made using credentials.

#### `renumerateIRIElements`

Whether SVG IRI addressable elements are renumerated. When enabled, IDs on IRI-addressable elements (`clipPath`, `linearGradient`, `mask`, `path`, etc.) are made unique, and all references to them (presentation attributes, `href`/`xlink:href`, inline `style` attributes, and `url(#id)` references in `<style>` element text) are updated. This is what stops two injections of the same file fighting over one `id`.

All matching element types are renumerated, not only those inside `<defs>`. Set to `false` if you need to query injected elements by their original IDs.

### Injected markup

The placeholder element is replaced by the loaded `<svg>`, not wrapped in it, and some of its attributes carry across:

- `id`, `title`, `width`, `height` and `style` are copied when present on the placeholder.
- `class` becomes the SVG's own classes, then `injected-svg`, then the placeholder's classes, deduplicated. `injected-svg` is added on every injection, which makes it a stable selector.
- `data-*` attributes with a non-empty value are copied, and `data-src` is set to the URL that was injected, fragment included.
- `xmlns` and `xmlns:xlink` are set, and `xmlns:a`, which some SVG editors emit, is removed.

Given `<div id="icon" class="my-icon" data-src="icon.svg"></div>` and an `icon.svg` whose root carries `class="logo"`, the injected element is:

```html
<svg
  xmlns="http://www.w3.org/2000/svg"
  viewBox="0 0 24 24"
  class="logo injected-svg my-icon"
  id="icon"
  data-src="icon.svg"
  xmlns:xlink="http://www.w3.org/1999/xlink"
>
  ...
</svg>
```

### Example

```html
<div class="inject-me" data-src="icon-one.svg"></div>
<div class="inject-me" data-src="icon-two.svg"></div>
```

```js
import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('inject-me'), {
  afterAll(elementsLoaded) {
    console.log(`processed ${elementsLoaded} elements`)
  },
  afterEach(error, svg) {
    if (error) {
      console.error(error)
      return
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

## Live Examples

Each name links to the example source, and the sandbox column opens it on CodeSandbox.

| Example                                                                                         | Sandbox                                                                                                 |
| ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [API Usage](https://github.com/tanem/svg-injector/tree/master/examples/api-usage)               | [Open](https://codesandbox.io/p/devbox/github/tanem/svg-injector/tree/master/examples/api-usage)        |
| [Basic Usage](https://github.com/tanem/svg-injector/tree/master/examples/basic-usage)           | [Open](https://codesandbox.io/p/devbox/github/tanem/svg-injector/tree/master/examples/basic-usage)      |
| [Data URL Usage](https://github.com/tanem/svg-injector/tree/master/examples/data-url-usage)     | [Open](https://codesandbox.io/p/devbox/github/tanem/svg-injector/tree/master/examples/data-url-usage)   |
| [Error Handling](https://github.com/tanem/svg-injector/tree/master/examples/error-handling)     | [Open](https://codesandbox.io/p/devbox/github/tanem/svg-injector/tree/master/examples/error-handling)   |
| [Eval Scripts](https://github.com/tanem/svg-injector/tree/master/examples/eval-scripts)         | [Open](https://codesandbox.io/p/devbox/github/tanem/svg-injector/tree/master/examples/eval-scripts)     |
| [IRI Renumeration](https://github.com/tanem/svg-injector/tree/master/examples/iri-renumeration) | [Open](https://codesandbox.io/p/devbox/github/tanem/svg-injector/tree/master/examples/iri-renumeration) |
| [Sprite Usage](https://github.com/tanem/svg-injector/tree/master/examples/sprite-usage)         | [Open](https://codesandbox.io/p/devbox/github/tanem/svg-injector/tree/master/examples/sprite-usage)     |

## Installation

```
$ npm install @tanem/svg-injector
```

The package ships an ES module and a CommonJS build behind an `exports` map, with type declarations for each, and has no runtime dependencies.

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

## Security

Injected markup becomes part of your page, with the same privileges as anything else in it. That matters whenever `data-src` points at something you don't fully control: user uploads, a third-party host, a CMS anyone can write to. An SVG is an XML document that can carry scripts, event handlers and styles, not just shapes.

**Scripts are off by default.** `evalScripts` defaults to `'never'`, so `<script>` blocks inside a fetched SVG are not executed. Leave it that way for anything untrusted: `'always'` and `'once'` run whatever the file happens to contain, and they run it before `beforeEach` gets the chance to sanitise anything.

**Scripts aren't the only vector.** Event-handler attributes such as `onload` and `onclick`, and `href="javascript:..."` on `<a>` elements, are inert to `evalScripts` but live once injected. For untrusted sources, sanitise the SVG in `beforeEach`, which runs after the load and before the element reaches the DOM. The example below uses [DOMPurify](https://github.com/cure53/DOMPurify) to strip out attributes and tags that can execute arbitrary JavaScript. Note that this can alter the behaviour of the SVG.

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

**Validate the URL too.** A `javascript:` or `data:text/html` value should never reach `data-src`; check the scheme and origin before writing one onto an element.

**Injected content isn't isolated.** A `<style>` element inside an SVG applies to the whole page, so a fetched file can restyle your app through a generic class name like `.cls-1`. DOMPurify keeps `<style>` elements, so sanitising doesn't address this. Remove or rewrite them in `beforeEach` if the SVGs aren't yours. Note that `renumerateIRIElements` (on by default) makes `id` attributes unique, but does nothing for class names.

## Credit

This is a fork of a [library](https://github.com/iconic/SVGInjector) originally developed by [Waybury](http://waybury.com/) for use in [iconic.js](https://useiconic.com/tools/iconic-js/), part of the [Iconic](https://useiconic.com/) icon system.

## Contributing

Issues and pull requests are welcome. `npm run test:playwright` is the development loop, run against a current `npm run build`; `npm test` runs the full gate.

Repo conventions that aren't visible in the code, such as the PR labels that drive releases, the fixture routing the Playwright suite relies on, and the library's known limitations, live in [AGENTS.md](AGENTS.md). Coding agents read it from the repo root, so keep it in sync when a change invalidates something it states.

## License

MIT
