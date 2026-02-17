# Copilot Instructions for @tanem/svg-injector

## Project Overview

A browser DOM library that replaces elements (with `data-src` or `src` attributes pointing to SVG files or data URLs) with inline SVG markup. Published as `@tanem/svg-injector` to npm.

## Known Limitations

These constraints are not expressed in the source code and affect how features should be used or extended.

### SVG Sprites

- **Self-contained symbols only.** Shared root-level `<defs>` (gradients, filters, clip paths referenced by multiple symbols) are not resolved into the extracted SVG. Symbols must contain all their own definitions or use individual SVG files.
- **Only `<symbol>` elements are supported.** The fragment ID must match the `id` attribute of a `<symbol>` element in the sprite. Other element types (e.g. `<g>`, `<svg>`) are not extracted.
- **`<use>` chains within symbols are not resolved.** If a symbol internally references another symbol via `<use>`, the reference will break after extraction.

### Data URLs

- **Only `data:image/svg+xml` MIME types are supported.** Other image data URLs (e.g. `data:image/png`) are not handled and will fall through to XHR (which will fail).
- **`DOMParser` error detection is best-effort.** Browsers embed a `<parsererror>` element in the returned document on invalid input; the library checks for this but the error message format varies by browser.

### IRI Renumeration

- **All matching element types are renumerated, not just those inside `<defs>`.** If an SVG has `<path id="TX">` outside `<defs>` (e.g. a US map), that ID will be rewritten. Users who need to query injected elements by their original IDs should set `renumerateIRIElements: false`. See [#14 (comment)](https://github.com/tanem/svg-injector/issues/14#issuecomment-457270023).
- **String references in `<script>` blocks are not updated.** If SVG scripts use `document.getElementById('oldId')`, those strings will not be rewritten.
- **CSS ID selectors in `<style>` elements are not updated.** Only `url(#id)` references within `<style>` text are rewritten. A rule like `#myId { fill: red }` will still reference the old ID.

## Dependency Management

- **Runtime `dependencies`**: caret ranges (`^1.2.3`). Install with `npm install --save package@version`.
- **`devDependencies`**: exact pinned versions (`1.2.3`, no caret). Install with `npm install --save-dev --save-exact package@version`.
- **ESLint and @typescript-eslint**: Update together to maintain compatibility.
- Always verify with `npm test` after each update.
- After updating @playwright/test, run `npx playwright install` to update browser binaries.
- Check for formatting changes after updating prettier and run `npm run format` if needed.
- When adding or removing dependencies, review `renovate.json` for obsolete package rules and other config files (`codecov.yml`, CI workflows) that may reference removed tools.
- Commit each logical group of updates separately: `Update dependency <name> to v<version>` or `Update <monorepo> monorepo to v<version>`.

## Code Conventions

- One default export per module in `src/`.
- Functional codebase, no classes.
- Never use `any`; use `unknown` when type is truly dynamic.
- Use non-null assertions (`!`) only with runtime guarantees (e.g. array access within bounds-checked loops).
- Use `//` comments, not `/* */` (except for istanbul/eslint directives).
- `/* istanbul ignore else */` marks branches that only run in specific browsers.

## Documentation and Writing Style

- Keep `.github/copilot-instructions.md`, `README.md`, and `MIGRATION.md` up to date when making changes that affect the public API, build pipeline, testing patterns, or code conventions.
- Use NZ English (e.g. "serialise", "normalise", "colour", "behaviour").
- Copilot instructions should only contain information that cannot be readily inferred from the source code.
- README structure follows [standard-readme](https://github.com/RichardLitt/standard-readme). Detailed feature documentation belongs in `examples/*/README.md`, linked from the main README.
- Use simple, direct technical language. No marketing speak.
- Do not use em dashes (`—`). Use colons, full stops, or other punctuation.
- Code comments should only document non-obvious behaviour, constraints, or design decisions.

## Commits

- Prefer single-line commit messages.
- Use a more detailed commit message only when the change is non-obvious.
