# Migration

Details relating to major changes that aren't presently in `CHANGELOG.md`, due to limitations with how that file is being generated.

## v12.0.0

**Breaking**

- Removed the UMD builds. `dist/svg-injector.umd.development.js` and `dist/svg-injector.umd.production.js` are no longer published, so a plain `<script src>` tag no longer defines `window.SVGInjector`. The CommonJS and ES module builds are unchanged, so bundler and Node consumers need no changes.

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
