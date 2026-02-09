# Copilot Instructions for @tanem/svg-injector

## Project Overview

A browser DOM library that replaces elements (with `data-src` or `src` attributes pointing to SVG files) with inline SVG markup via XMLHttpRequest. Published as `@tanem/svg-injector` to npm.

## Architecture

The injection pipeline flows through these modules in `src/`:

1. **`svg-injector.ts`** — Public API entry point. Accepts single element or element collections, iterates and delegates to `injectElement`.
2. **`inject-element.ts`** — Core orchestrator. Loads SVG (cached or uncached), transfers attributes from the original element to the SVG, renumerates IRI elements for uniqueness, handles script eval, calls `beforeEach` hook, then replaces the DOM element via `parentNode.replaceChild`.
3. **`load-svg-cached.ts`** / **`load-svg-uncached.ts`** — Two loading strategies. Cached path uses `cache.ts` (a `Map<string, SVGSVGElement | Error | undefined>`) and `request-queue.ts` to deduplicate concurrent requests for the same URL.
4. **`make-ajax-request.ts`** — XHR wrapper that validates content-type (`image/svg+xml` or `text/plain`) and handles local file protocol detection via `is-local.ts`.
5. **`unique-id.ts`** — Simple incrementing counter used to make IRI element IDs unique across multiple injected instances of the same SVG.

Key design decisions:
- SVG cloning (`clone-svg.ts`) uses `cloneNode(true)` to avoid mutating cached originals.
- Request queue callbacks are fired via `setTimeout(fn, 0)` to avoid blocking the renderer.
- The `injectedElements` array in `inject-element.ts` is module-level state that prevents duplicate injection of the same element.

## Build Pipeline

```
npm run build  →  clean → compile (tsc) → bundle (rollup)
```

- **`compile`**: TypeScript compiles `src/` → `compiled/` using `tsconfig.base.json` (target: ES5, module: ESNext).
- **`bundle`**: Rollup produces 5 outputs from `compiled/index.js`: CJS dev/prod, ESM, UMD dev/prod. See `rollup.config.mjs`.
- **`postbundle`**: Copies `index.js` (CJS env-switcher) into `dist/`.
- The root `index.js` is a CJS entry that selects dev/prod bundle based on `NODE_ENV`.

## Testing

Tests run in real browsers via **Karma** + **Mocha** (TDD interface: `suite`/`test`/`setup`/`teardown`) + **Chai** (`expect` style) + **Sinon** for stubs.

```bash
npm test           # Full pipeline: check:types → lint → build → test:karma
npm run test:karma # Run only browser tests (requires prior build)
```

Key testing patterns:
- **`test/index.ts`** uses Webpack `require.context` to auto-discover all `*.test.ts` files and include all `src/` files for coverage.
- **`test/helpers/test-utils.ts`** provides `render()` (creates a detached container with innerHTML), `cleanup()` (clears cache + request queue), `format()` (normalises whitespace), and `browser` detection.
- Tests stub `uniqueId.default` via `window.sinon.stub(uniqueId, 'default').returns(1)` to make IRI renumeration deterministic.
- Tests compare serialised HTML strings and branch on `browser` name (IE vs Firefox vs others) because browsers serialise SVG attributes in different orders.
- SVG fixtures live in `test/fixtures/`. Karma proxies `/fixtures/` to serve them over HTTP.
- Every `teardown` must call `cleanup()` to clear the module-level cache and request queue; omitting this causes test pollution.
- **Coverage**: Instrumented via `babel-plugin-istanbul` (applied to `src/` only, see `karma.conf.js` webpack rules). Reports output to `coverage/` in lcov format. No explicit threshold is enforced; coverage is uploaded to Codecov in CI.

## Code Conventions

- **One default export per module** — each `src/*.ts` file exports a single function or value as `export default`.
- **Types in `src/types.ts`** — shared callback types (`AfterAll`, `BeforeEach`, `Errback`, `EvalScripts`) live here, marked `/* istanbul ignore file */`.
- **`/* istanbul ignore else */`** comments are used extensively to skip branches that only run in specific browsers (IE edge cases).
- **No arrow function class methods** — this is a functional codebase with no classes.
- **Strict TypeScript** — `strict: true`, `noUnusedLocals`, `noUnusedParameters` in `tsconfig.base.json`.
- **ESLint** uses flat config (`eslint.config.mjs`) with `@typescript-eslint/recommended` + `prettier`. `explicit-module-boundary-types` is turned off.
- **Formatting**: Prettier handles all JS/TS formatting. Run `npm run format` or check with `npm run check:format`.

## Working with This Codebase

- The public API surface is just `SVGInjector` and the types re-exported from `src/index.ts`.
- When modifying IRI renumeration logic in `inject-element.ts`, verify against `test/renumerate-iri-elements.test.ts` which has extensive expected-output strings.
- The `content-type` npm package is a runtime dependency used in `make-ajax-request.ts` for response validation.
- Global type augmentation for `window.sinon` is in `types/globals.d.ts`.
- CI runs tests on BrowserStack (Chrome, Firefox, Safari, Edge, IE) — see `karma.conf.js` `customLaunchers`. Locally, tests typically run against Chrome only.

## Documentation

- Keep `.github/copilot-instructions.md`, `README.md`, and `MIGRATION.md` up to date when making changes that affect the public API, build pipeline, testing patterns, or code conventions.
- Use NZ English in documentation (e.g. "serialise", "normalise", "colour", "behaviour").
