# Migration

Details relating to major changes that aren't presently in `CHANGELOG.md`, due to limitations with how that file is being generated.

## v12.0.0

**Added**

- The `elements` parameter accepts a plain array. Its type was `HTMLCollectionOf<Element> | NodeListOf<Element> | Element | null`, which rejected the `Element[]` the README has always documented, even though the runtime handled it. It is now also `readonly Element[]`, so `Array.from(...)` results, array literals and frozen arrays type-check without a cast. The type is exported as `Elements`.

**Breaking**

- Removed the UMD builds. `dist/svg-injector.umd.development.js` and `dist/svg-injector.umd.production.js` are no longer published, so a plain `<script src>` tag no longer defines `window.SVGInjector`. The CommonJS and ES module builds remain, under new filenames: see the packaging entry below.

  Script tag users have two options. Load the ES module build from an ESM CDN:

  ```html
  <script type="module">
    import { SVGInjector } from 'https://esm.sh/@tanem/svg-injector'

    SVGInjector(document.getElementById('inject-me'))
  </script>
  ```

  Or stay on v11, which keeps the UMD builds:

  ```html
  <script src="https://unpkg.com/@tanem/svg-injector@11/dist/svg-injector.umd.production.js"></script>
  ```

  The equivalent npm pin is `npm install @tanem/svg-injector@^11`.

- Renamed the published build artefacts. The package is built with [tsdown](https://tsdown.dev) instead of TypeScript plus Rollup and Babel, and the output filenames changed to carry their module format in the extension:

  | v11                                    | v12                                                     |
  | -------------------------------------- | ------------------------------------------------------- |
  | `dist/index.js`                        | `dist/svg-injector.cjs`                                 |
  | `dist/svg-injector.cjs.development.js` | `dist/svg-injector.cjs`                                 |
  | `dist/svg-injector.cjs.production.js`  | `dist/svg-injector.cjs`                                 |
  | `dist/svg-injector.esm.js`             | `dist/svg-injector.mjs`                                 |
  | `dist/index.d.ts`                      | `dist/svg-injector.d.cts` and `dist/svg-injector.d.mts` |

  `.esm.js` could not be kept: the package declares `"type": "commonjs"`, under which Node parses any `.js` file as CommonJS.

  `main`, `module` and `types` still point at the new files, so webpack 4 and TypeScript `node10` resolution keep working. Anyone importing a `dist/` path directly has to update it.

- Added an `exports` map. Only the root entry and `./package.json` are importable; every other path inside the package is now private. Node ESM consumers get the ES module build rather than falling back to CommonJS.

- Removed the development/production build split. The `dist/index.js` shim that switched on `process.env.NODE_ENV` is gone, and the single CommonJS build is unminified. Nothing in the source branches on `NODE_ENV`, so the two builds only differed by minification, which bundlers apply themselves.

- Removed the `jsnext:main` field, superseded by `module` in 2017.

- Added `"sideEffects": false`. Bundlers can now drop the package entirely from a build that imports it without referencing `SVGInjector`.

- Removed the `@babel/runtime` and `tslib` runtime dependencies. Neither build emits helper imports any more.

- Removed the `content-type` runtime dependency. The `Content-Type` response header check now takes the media type as the text before the first `;`, trimmed and lowercased, instead of running a full RFC 7231 parse. A header carrying no media type (`; charset=utf-8`) now reports `Content type not found` rather than `invalid media type`, and a malformed header such as `invalid` reports `Invalid content type: invalid`. The same responses are accepted and rejected as before; only these two error messages changed. The package now has no runtime dependencies.

- Narrowed the `.svg` extension bypass. URLs ending in `.svg` skip the `Content-Type` response header check, which is what makes `file://` loads work: browsers send no `Content-Type` header for them. The extension used to be matched against the whole URL, so any URL merely containing `.svg` skipped the check, including `https://example.com/render?file=logo.svgz` and `https://foo.svg.example.com/render`. It is now matched against the end of the URL pathname, resolved against the document base URL. `https://example.com/icon.svg?v=2` still skips the check; a URL with `.svg` only in its query string or hostname now needs a valid `Content-Type`, and gets `Invalid content type: <type>` or `Content type not found` if the server sends something else.

- Base64 data URLs now require `TextDecoder`. The bytes `atob` returns are decoded as UTF-8 so multi-byte characters survive, where v11 used `atob` alone: see the data URL fix below. Every browser provides `TextDecoder`, but [jsdom](https://github.com/jsdom/jsdom) does not, so a consumer test suite running under it needs a polyfill. In a Jest setup file:

  ```js
  import { TextDecoder } from 'node:util'

  globalThis.TextDecoder ??= TextDecoder
  ```

  `CSS.escape`, used by the sprite path, was already missing from jsdom in v11 and needs the same treatment.

- Raised the compile target from `es5` to `es2019`. v11 already dropped explicit legacy browser support, so the es5 emit was overhead. The output stays parseable by webpack 4, which cannot handle ES2020 syntax such as `?.` and `??`.

  This reaches consumer builds. Bundlers do not transpile `node_modules` by default, so a project whose own browser targets are wider than es2019 used to receive es5 from this package and now receives arrow functions, `const`/`let`, template literals, `for...of` and optional catch binding. The oldest browsers that can run the v12 build are Chrome 66, Firefox 58, Safari 11.1 and Edge 79, against Chrome 45, Firefox 32 and Safari 9 for v11. Neither figure was ever a tested guarantee: the suite has run against current Chromium, Firefox and WebKit since v11, and v11's lower floor was a by-product of its Babel config.

  Vite needs no package-specific setting, because `build.target` applies to the whole output chunk, dependencies included. webpack with `babel-loader` does, since the conventional rule excludes `node_modules`:

  ```js
  {
    test: /\.m?js$/,
    exclude: /node_modules\/(?!@tanem\/svg-injector)/,
    use: 'babel-loader',
  }
  ```

  Next.js has a dedicated option:

  ```js
  module.exports = { transpilePackages: ['@tanem/svg-injector'] }
  ```

- `src` is now published alongside `dist`, so the declaration maps shipped with the build resolve to the original TypeScript sources.

**Fixed**

- `afterAll` is now called for an empty collection. The completion check lives in the per-element callback, so a zero-length `HTMLCollection` or `NodeList` never reached it and `afterAll` never fired at all. It is now called with `0`, deferred so it cannot fire before `SVGInjector` returns. Passing `null` already behaved this way.

- `afterAll` now reports the right count for a live collection. A live collection such as the result of `getElementsByTagName('div')` shrinks as each element is replaced by its injected SVG, and the completion check compared the number of elements done against the collection's current length. With two elements, `afterAll` fired with `1` after the first injection finished. The collection is now snapshotted before injection starts, so the count is taken from the elements that were passed in.

- Injecting the same element twice now reports an error instead of hanging. When a call named an element that already had an injection in flight, from the same element appearing twice in one collection or from a second `SVGInjector` call made before the first finished, the guard removed the element from its in-flight list and returned without calling back. That element's `afterEach` never ran, so `afterAll`'s count never completed. A further call then passed the guard and started a duplicate injection, and because the completion path then ran `indexOf` on an element that was no longer listed, it dropped whichever element was last in the list instead, so an unrelated element still being injected lost its guard and a later call for it started a second injection. The in-flight set is now keyed by element and released only by the injection that added it, and the duplicate is reported as `Injection already in progress: <url>` through `afterEach`.

- A response whose body parses but is not an SVG document is now reported as an error. A body that fails to parse at all was already reported as `Unable to load SVG file: <url>`, but one that parses into a document with some other root element was not: an error page that happens to be well-formed XML, or an XML document that is not SVG, served with a 200 at the SVG's URL. Neither loader called back, so there was no `afterEach`, no `afterAll` and no error. With `cacheRequests` left on, the URL also stayed on the sentinel the cache seeds before a request, so every later injection of it waited on a response that had already arrived, and no refetch was made. Both loaders now report `Unable to parse SVG from response: <url>`, and the cached loader drops the entry so the next injection refetches, matching how load errors have behaved since v10.

- An injection started from a callback no longer takes another injection's result. Callbacks waiting on an in-flight URL were held in a list the cache re-read as it dispatched, so an injection of that same URL started from one of those callbacks joined the list mid-dispatch. The callbacks that had not run yet were then handed its result rather than the one they were waiting on: two elements pointing at a URL that fails, with the first one's `afterEach` retrying it, reported success to the second element even though its own request had failed. The list is now detached before any of it is notified.

- A rejected `Content-Type` is now reported as itself when `cacheRequests` is `false`. Rejecting the header aborts the request, and the abort re-enters the request's `readystatechange` handler, which reported the aborted request as `Unable to load SVG file: <url>` in place of `Invalid content type: <type>` or `Content type not found`. The cached path already reported the content-type error.

- Data URL parameters are parsed per RFC 2397. Three exact strings were recognised after `data:image/svg+xml`: `,`, `;base64,` and `;charset=utf-8,`. Variants that real tools emit were rejected with `Unsupported data URL format`, among them `;charset=UTF-8` (differing only in case), `;charset=utf8` (without the hyphen) and `;charset=utf-8;base64` (carrying both parameters). The section between the media type and the first comma is now split on semicolons and matched case-insensitively. A charset naming anything other than UTF-8 is still rejected rather than decoded with the wrong encoding.

- Base64 data URLs decode as UTF-8. `atob` yields one character per byte, so multi-byte characters arrived mojibaked: `café 🎉` in a `<text>` element rendered as `cafÃ© ð`. The bytes are now decoded through `TextDecoder`, which is the new requirement noted above.

- IRI renumeration no longer rewrites references to ids that only `Object.prototype` defines. The map from old id to new id was a plain object, so a reference such as `url(#constructor)`, `url(#toString)` or `href="#valueOf"` found the inherited property and was rewritten with it, producing markup like `url(#function Object() { [native code] })`. Such a reference is left alone now, the same as any other reference to an id the file does not define.

**Unchanged**

- The public API. `SVGInjector(elements, options)` takes the same options with the same defaults, and the callbacks keep their signatures. The fixes above make `afterEach` and `afterAll` fire in cases where they previously did not fire at all; nothing was renamed or removed. Consumers need only the version bump.

- The transport. Requests still go through `XMLHttpRequest`, so `file://` loading keeps working: browsers report status 0 and send no `Content-Type` header for those, and both are handled. Moving to `fetch` would cost that for no capability this library needs.

- The browsers that are tested. The suite has run against current Chromium, Firefox and WebKit through Playwright since v11, and still does. The es2019 note above concerns the syntax floor of the published build, which is a different thing and was never a tested guarantee in either version.

## v11.0.0

**Breaking**

- Dropped explicit IE / legacy browser support. CI now tests on modern browsers only (Chromium, Firefox, WebKit) via Playwright. The library may still work in older browsers, but compatibility is no longer tested or guaranteed. If you need IE support, pin `@tanem/svg-injector@^10`.
- Removed Karma, Mocha, Chai, Sinon, and BrowserStack from the test infrastructure. Tests are now written with `@playwright/test`.

## v10.0.0

**Changed**

- Fetch errors are no longer cached (see #692).

## v8.0.0

**Added**

- `beforeEach` argument.

**Changed**

- `done` renamed to `afterAll`.
- `each` renamed to `afterEach`.
