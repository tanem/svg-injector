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

- Narrowed the `.svg` extension bypass. URLs ending in `.svg` skip the `Content-Type` response header check, which is what makes `file://` loads work — browsers send no `Content-Type` header for them. The extension used to be matched against the whole URL, so any URL merely containing `.svg` skipped the check, including `https://example.com/render?file=logo.svgz` and `https://foo.svg.example.com/render`. It is now matched against the end of the URL pathname, resolved against the document base URL. `https://example.com/icon.svg?v=2` still skips the check; a URL with `.svg` only in its query string or hostname now needs a valid `Content-Type`, and gets `Invalid content type: <type>` or `Content type not found` if the server sends something else.

- Raised the compile target from `es5` to `es2019`. v11 already dropped explicit legacy browser support, so the es5 emit was overhead. The output stays parseable by webpack 4, which cannot handle ES2020 syntax such as `?.` and `??`.

- `src` is now published alongside `dist`, so the declaration maps shipped with the build resolve to the original TypeScript sources.

**Fixed**

- A rejected `Content-Type` is now reported as itself when `cacheRequests` is `false`. Rejecting the header aborts the request, and the abort re-enters the request's `readystatechange` handler, which reported the aborted request as `Unable to load SVG file: <url>` in place of `Invalid content type: <type>` or `Content type not found`. The cached path already reported the content-type error.

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
