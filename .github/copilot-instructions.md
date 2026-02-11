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

Tests run in real browsers via **Playwright** (`@playwright/test`). Each test file uses Playwright's `test` / `test.describe` / `expect` APIs directly.

```bash
npm test                    # Full pipeline: check:types → lint → build → test:playwright
npm run test:playwright     # Run only browser tests (requires prior build)
npm run test:coverage       # Full pipeline with coverage: build:coverage → test → report
```

Key testing patterns:

- **`test/playwright/test-utils.ts`** provides `setupPage()` (creates a route-intercepted page serving a base HTML document and SVG fixtures), `injectSvg()` (injects SVG via the UMD bundle inside the page and returns serialised HTML + callback data), `addSvgInjector()` (adds the UMD bundle as an init script), and `formatHtml()` (normalises whitespace).
- Tests use `page.route()` to intercept fixture requests and serve files from `test/fixtures/` with configurable status codes, content types, and bodies — no dev server is needed.
- Tests compare serialised HTML strings and branch on `browserName` (firefox vs others) because browsers serialise SVG attributes in different orders. IE-specific branches have been removed.
- SVG fixtures live in `test/fixtures/`.
- Each test gets a fresh browser context automatically (Playwright's default isolation), so there is no manual cache/queue cleanup needed between tests.
- **`test/playwright/coverage.ts`** is imported as a side-effect in every test file (`import './playwright/coverage'`). It collects `window.__coverage__` after each test (when `COVERAGE=1`) and writes per-test JSON files to `.nyc_output/`.
- **Coverage**: Instrumented via `babel-plugin-istanbul` in the Rollup build (enabled when `COVERAGE=1`). After tests, `scripts/coverage-report.js` merges the per-test coverage JSON files, remaps through source maps, filters to `src/` only (excluding `src/index.ts` and `src/types.ts`), and outputs lcov to `coverage/`. No explicit threshold is enforced; coverage is uploaded to Codecov in CI.
- **`playwright.config.ts`** defines three projects: chromium, firefox, webkit. CI uses `retries: 1` and `workers: 2`.

## Dependency Management

This project follows strict versioning conventions for dependencies:

- **Runtime `dependencies`**: Use caret ranges (`^1.2.3`) to allow compatible updates. Install with `npm install --save package@version`.
- **`devDependencies`**: Use exact pinned versions (`1.2.3`, no caret) for reproducible builds. Install with `npm install --save-dev --save-exact package@version`.

**Current major versions:**

- **ESLint**: v9.x (not v10) — `@typescript-eslint` doesn't yet support ESLint v10. Update ESLint and @typescript-eslint together as a monorepo group.
- **TypeScript**: v5.x
- **Rollup**: v4.x
- **Playwright**: v1.x

**Updating dependencies:**

- Always verify changes with `npm test` (alias: `npmt`) after each update.
- Update related packages together (e.g., ESLint ecosystem, Rollup plugins, @typescript-eslint + ESLint).
- Check for formatting changes after updating prettier and run `npm run format` if needed.
- After updating @playwright/test, run `npx playwright install` to update browser binaries.
- Commit each logical group of updates separately with conventional commit messages matching Renovate's format: `Update dependency <name> to v<version>` or `Update <monorepo> monorepo to v<version>`.

## Code Conventions

- **One default export per module** — each `src/*.ts` file exports a single function or value as `export default`.
- **Types in `src/types.ts`** — shared callback types (`AfterAll`, `BeforeEach`, `Errback`, `EvalScripts`) live here, marked `/* istanbul ignore file */`.
- **`/* istanbul ignore else */`** comments are used in source to skip branches that only run in specific browsers.
- **No arrow function class methods** — this is a functional codebase with no classes.
- **Strict TypeScript** — `strict: true`, `noUnusedLocals`, `noUnusedParameters`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, and `skipLibCheck` in `tsconfig.base.json`. These strict options ensure maximum type safety.
- **Type safety practices**:
  - Never use `any` types. Use proper type annotations or `unknown` when the type is truly dynamic.
  - Use `Record<string, T>` instead of `{ [key: string]: T }` for index signatures.
  - Explicitly type all variables when their type isn't obvious from the initializer.
  - Use non-null assertions (`!`) only when you have runtime guarantees (e.g., array access within bounds-checked loops).
  - Handle potential `undefined` from index access operations (required by `noUncheckedIndexedAccess`).
  - Prefer nullish coalescing (`??`) over logical or (`||`) for providing default values.
  - Use optional chaining (`?.`) instead of `&&` chains for property access.
  - Always use `import type` for type-only imports to improve tree-shaking and build performance.
- **ESLint** uses flat config (`eslint.config.mjs`) with `@typescript-eslint/recommended` and `prettier`. Enforces strict type safety rules including:
  - `no-explicit-any`: Prevents `any` types
  - `no-unnecessary-condition`: Catches redundant conditions with strict null checks
  - `no-floating-promises`: Ensures promises are properly handled
  - `prefer-nullish-coalescing`: Enforces `??` over `||`
  - `prefer-optional-chain`: Enforces `?.` over `&&` chains
  - `consistent-type-imports`: Requires `import type` for type-only imports
  - `no-console`: Disallowed in src/ (allowed in tests, examples, and scripts)
  - `eqeqeq`: Always use strict equality
- **Formatting**: Prettier handles all JS/TS formatting. Run `npm run format` or check with `npm run check:format`.

## Working with This Codebase

- The public API surface is just `SVGInjector` and the types re-exported from `src/index.ts`.
- When modifying IRI renumeration logic in `inject-element.ts`, verify against `test/renumerate-iri-elements.test.ts` which has extensive expected-output strings.
- The `content-type` npm package is a runtime dependency used in `make-ajax-request.ts` for response validation.
- CI runs tests on Chromium, Firefox, and WebKit via Playwright. BrowserStack / IE testing has been removed.
- **When adding or removing dependencies**, always review `renovate.json` for obsolete package rules (version constraints, allowedVersions) and other config files (`codecov.yml`, CI workflows) that may reference removed tools or frameworks.

## Documentation

- Keep `.github/copilot-instructions.md`, `README.md`, and `MIGRATION.md` up to date when making changes that affect the public API, build pipeline, testing patterns, or code conventions.
- Use NZ English in documentation (e.g. "serialise", "normalise", "colour", "behaviour").
