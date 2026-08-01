# AGENTS.md

Rules for coding agents that the code and config don't already state. Keep it
that way: a constraint that can live in a comment next to the thing it
constrains belongs there, not here.

## Writing

- NZ English everywhere ("colour", "behaviour", "initialise").
- Simple, direct technical language. No marketing speak.
- Single-line commit messages, `git log --oneline` style. Add a body only to
  explain why, and only for behaviour or type changes.
- No conventional-commit prefixes (`feat:`, `fix:`, `chore(deps):`) in commit
  subjects or PR titles. Write a plain capitalised sentence. Nothing reads the
  prefix: the version bump comes from the PR label, and renovate is set to
  `semanticCommits: "disabled"` to match.
- PR titles are copied verbatim into `CHANGELOG.md`, so write them as the
  changelog line you want readers to see.
- Hard-wrap commit message bodies at 72 columns; `git log` does not reflow
  them. Do not hard-wrap PR or issue descriptions: GitHub reflows markdown,
  and its web editor leaves wrapped source ragged once anyone edits it.
- `README.md` follows
  [standard-readme](https://github.com/RichardLitt/standard-readme). Per-feature
  detail belongs in `examples/*/README.md`, linked from there.
- Code comments record non-obvious behaviour, constraints and decisions, not
  what the line already says.

## Architecture

`SVGInjector` normalises its argument, then runs one pipeline per element:
split the sprite fragment off the URL, load, transform, swap.

- `svg-injector.ts` owns the `afterEach` and `afterAll` accounting. Every path
  out of `injectElement`, errors included, calls back exactly once. Add one
  that doesn't and `afterAll` silently never fires.
- `defer.ts` is how "no callback fires before `SVGInjector` returns" is
  enforced. Every callback goes through it, so a new path that calls back
  without it reintroduces the sometimes-synchronous timing v12 removed. `grep
  defer src/` lists the sites.
- `inject-element.ts` is that per-element pipeline, and the only module that
  chooses a load path.
- `parse-data-url.ts` intercepts `data:image/svg+xml` before any request is
  made, so data URLs never reach the XHR layer.
- `load-svg-cached.ts` and `load-svg-uncached.ts` wrap `make-ajax-request.ts`.
  The cache key is the URL with the fragment stripped, so every symbol taken
  from one sprite shares a single request.
- `extract-symbol.ts`, `renumerate-svg-iri-elements.ts` and
  `eval-svg-scripts.ts` are the transform steps, applied in that order.

XHR is a decision, not leftover legacy. `file://` loads report status 0 and
carry no `Content-Type`, and the content-type check runs at `readyState` 2 so a
rejected response aborts before its body arrives. fetch does neither. Don't
migrate it without new evidence.

## Known limitations

Not visible in the source, and they shape what can be built on top.

### SVG sprites

- Self-contained symbols only. Shared root-level `<defs>` (gradients, filters
  and clip paths referenced by several symbols) are not resolved into the
  extracted SVG.
- Only `<symbol>` elements are extracted. A fragment ID matching a `<g>` or a
  nested `<svg>` is not.
- `<use>` chains inside a symbol are not resolved, so a symbol that references
  another symbol breaks once extracted.

### Data URLs

- Only `data:image/svg+xml` is handled. Other image data URLs fall through to
  XHR, which then fails.
- `DOMParser` error detection is best effort: browsers embed a `<parsererror>`
  element rather than throwing, and its message format varies by browser.

### IRI renumeration

- All matching element types are renumerated, not only those inside `<defs>`.
  A `<path id="TX">` in the body of a US map is rewritten too. Consumers who
  query injected elements by their original IDs need
  `renumerateIRIElements: false`. See
  [#14 (comment)](https://github.com/tanem/svg-injector/issues/14#issuecomment-457270023).
- String references inside `<script>` blocks are not updated, so
  `document.getElementById('oldId')` keeps pointing at the old ID.
- CSS ID selectors in `<style>` elements are not updated. Only `url(#id)`
  references within the style text are rewritten, so a rule like
  `#myId { fill: red }` still references the old ID.

## Build & test

`npm run test:playwright` is the development loop, run against a current
`npm run build`: the suite loads the built IIFE bundle, so an unbuilt source
change is not under test. `npm test` is the full gate, and also builds and
verifies every example; `npm run test:examples` is the shorter loop for a
change confined to `examples/`. `npm run size` and the `package:*` checks read
`dist/` too; `postbuild` runs the latter.

Tests never reach the network. `test/playwright/test-utils.ts` routes
`**/fixtures/**` to `test/fixtures/`, so adding a fixture means adding a file
in that directory and nothing else. A `?content-type=` query on a fixture URL
overrides the response header, and `?content-type=missing` drops it. Responses
no fixture file can express, such as a 404, a non-SVG body or an extra header,
come from `setupPage(page, { fixtureOverrides })`, keyed by fixture path.

That mocking is the suite's blind spot: real-server and `file://` behaviour is
simulated, so a change to `make-ajax-request.ts` needs checking by hand against
an actual server or an actual `file://` load before it is believed.

All three browser projects must pass. Coverage numbers come from chromium
alone, because Playwright's `page.coverage` is Chromium-only, but the whole
suite still runs in each.

Raising a `size-limit` budget in `package.json` is a decision, not a fix. Find
what grew first, and say why in the commit message.

## Releases

`npm run release` runs on a Monday cron against `master`. It takes the version
bump from the labels on PRs merged since the last tag, then regenerates
`CHANGELOG.md` and `AUTHORS` and bumps `version` in `package.json` and
`package-lock.json`.

- **Never leave `master` half-migrated.** The cron publishes whatever is sitting
  on it, so breaking work landing in pieces ships a partial major. Stage it on
  a long-lived version branch (`v12`, `v13`, ...) and merge in one PR. CI runs
  on `v*` branches, and the release workflow's
  `if: github.ref == 'refs/heads/master'` guard stops them self-publishing.
- Exactly one label per PR. None, or more than one, throws and blocks the
  release for everything merged alongside it. `breaking` gives a major,
  `enhancement` a minor, `bug` / `documentation` / `internal` a patch. Tooling,
  CI and dependency work is `internal`.
- Never hand-edit `CHANGELOG.md`, `AUTHORS` or either `version` field.
- Breaking changes need a `MIGRATION.md` entry in the same PR: the generated
  changelog is only a list of PR titles.

## Support policy

Evergreen browsers only, which in practice means the Chromium, Firefox and
WebKit builds the pinned `@playwright/test` ships. There is no separate support
matrix and no browserslist config: a browser is supported if the suite covers
it. `v10` is the legacy line for anyone who still needs IE.

`@tanem/react-svg` is the primary consumer and accounts for almost all npm
traffic. Check anything risky against it before release: `npm pack` here,
install the tarball there, run its suite.

## Dependencies

Pin `devDependencies` to exact versions. Keep `dependencies` on caret ranges,
though there are none: the package ships zero runtime dependencies and should
stay that way. A bare specifier in `dist/svg-injector.mjs` would stop a browser
loading it directly as a module.

- Update `eslint` and `typescript-eslint` together.
- After updating `@playwright/test`, run `npx playwright install`.
- After updating `prettier`, run `npm run format`.
- When adding or removing a dependency, check `renovate.json`, `codecov.yml`
  and the CI workflows for rules that named it.
- One commit per logical group: `Update dependency <name> to v<version>`, or
  `Update <monorepo> monorepo to v<version>`.

## Examples

Renovate skips `examples/**`, so their dependencies are updated by hand.

They are Vite apps, built and verified by `test/examples.test.ts`. Adding,
renaming or removing one means editing the `examples` array in both that file
and `scripts/build-examples.js`; the script's copy is what gets the example
built against the local library first. Any SVG the injector fetches at runtime
has to live in `<example>/public/`, because `data-src` is an opaque string to
the bundler and nothing links it.

## Conventions

- One default export per module in `src/`, apart from `index.ts` (barrel) and
  `types.ts` (types only).
- Functions, not classes.
- Never `any`. Use `unknown` when the type is genuinely dynamic.
- Non-null assertions only where a runtime guarantee backs them.
- `//` comments, not `/* */`, except for eslint directives.
