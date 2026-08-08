# AGENTS.md

Rules for coding agents that the code and config don't already state. Keep it
that way: a constraint that can live in a comment next to the thing it
constrains belongs there, not here.

## Writing

- NZ English everywhere ("colour", "behaviour", "initialise").
- Match a document's length to what it needs. Cover the substance, then
  stop: no filler sections, restated summaries or boilerplate.
- Simple, direct technical language. No marketing speak.
- Commit subjects are one capitalised line, `git log --oneline` style. Add a
  body whenever the change had a reason the diff does not show: what it fixes,
  what it rules out, what constraint forced the shape it has. Mechanical
  changes need none.
- No conventional-commit prefixes (`feat:`, `fix:`, `chore(deps):`) in commit
  subjects or PR titles. Write a plain capitalised sentence. Nothing reads the
  prefix: the version bump comes from the PR label, and renovate is set to
  `semanticCommits: "disabled"` to match.
- PR titles are copied verbatim into the generated release notes, so write them
  as the changelog line you want readers to see.
- Hard-wrap commit message bodies at 72 columns; `git log` does not reflow
  them. Do not hard-wrap PR or issue descriptions: GitHub reflows markdown,
  and its web editor leaves wrapped source ragged once anyone edits it.
- `README.md` follows
  [standard-readme](https://github.com/RichardLitt/standard-readme). Per-feature
  detail belongs in `examples/*/README.md`, linked from there.
- `README.md` states current behaviour; `MIGRATION.md` states what changed and
  keeps the upgrade steps in full. Neither re-derives the other.
- Code comments record non-obvious behaviour, constraints and decisions, not
  what the line already says.

## Architecture

`SVGInjector` normalises its argument, then runs one pipeline per element:
split the sprite fragment off the URL, load, transform, swap.

- `svg-injector.ts` owns the `afterEach` and `afterAll` accounting. Every path
  out of `injectElement`, errors included, calls back exactly once. Add one
  that doesn't and `afterAll` silently never fires.
- `defer.ts` enforces the callback timing `svg-injector.ts` documents. A path
  already running inside an XHR event or a deferred task calls back directly,
  which is why `load-svg-uncached.ts` and the `handleLoadedSvg` error paths
  hold no `defer`.
- `inject-element.ts` is that per-element pipeline, and the only module that
  chooses a load path.
- `parse-data-url.ts` intercepts `data:image/svg+xml` before any request is
  made, so data URLs never reach the XHR layer.
- `load-svg-cached.ts` and `load-svg-uncached.ts` wrap `make-ajax-request.ts`.
  The cache key is the URL with the fragment stripped, so every symbol taken
  from one sprite shares a single request.
- `extract-symbol.ts`, `renumerate-svg-iri-elements.ts` and
  `eval-svg-scripts.ts` are the transform steps, applied in that order.

XHR is a decision, not leftover legacy. It carries the `file://` allowances
`make-ajax-request.ts` documents, and its content-type check runs at
`readyState` 2 so a rejected response aborts before its body arrives. fetch
does neither. Don't migrate it without new evidence. Safari is the engine that
decides anything `file://` and the only one those allowances are load-bearing
in; measured on Chrome 151, Safari 26.5 and Firefox 146.

## Known limitations

The consumer-facing ones are in `examples/sprite-usage/README.md`,
`examples/data-url-usage/README.md` and the `renumerateIRIElements` section of
`README.md` (background on that one:
[#14 (comment)](https://github.com/tanem/svg-injector/issues/14#issuecomment-457270023)).
These are the ones stated nowhere else, and they shape what can be built on
top.

### SVG sprites

- The fragment is matched verbatim against the symbol id, so a percent-encoded
  fragment (`sprite.svg#caf%C3%A9`) never matches the decoded id and fails with
  `Symbol "caf%C3%A9" not found in ...`. Browsers decode the fragment for a
  native `<use>`, so this diverges from platform behaviour. The literal form
  (`sprite.svg#café`) works.

### Data URLs

- The scheme and media type are matched case-sensitively, though RFC 2397 makes
  both case-insensitive, so `data:IMAGE/SVG+XML,...` falls through to XHR.
  Browsers fetch such a URL over XHR without complaint, so the only exposure is
  a context where a strict CSP blocks the request.
- `DOMParser` error detection is best effort: browsers embed a `<parsererror>`
  element rather than throwing, and its message format varies by browser.

### IRI renumeration

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

`test/manual/` covers what that mocking cannot; see its README for why it is
not in CI. Run it and record the result in the PR when you touch
`make-ajax-request.ts` or `load-svg-cached.ts`, and update its expected values
in the same commit as any deliberate change to either.

All three browser projects must pass. Coverage numbers come from chromium
alone, because Playwright's `page.coverage` is Chromium-only, but the whole
suite still runs in each.

Raising a `size-limit` budget in `package.json` is a decision, not a fix. Find
what grew first, and say why in the commit message.

## Releases

[`tanem/release-action`](https://github.com/tanem/release-action) runs on a
Monday cron against `master`. It takes the version bump from the labels on PRs
merged since the last tag, bumps `version` in `package.json` and
`package-lock.json` through `npm version`, tags, then publishes the GitHub
Release and the npm package.

- **Never leave `master` half-migrated.** The cron publishes whatever is sitting
  on it, so breaking work landing in pieces ships a partial major. Stage it on
  a long-lived version branch (`v12`, `v13`, ...) and merge in one PR. CI runs
  on `v*` branches, and the release workflow's
  `if: github.ref == 'refs/heads/master'` guard stops them self-publishing.
- Exactly one label per PR, not counting `safe to test`, which the action
  filters out before it counts. None, or more than one, throws and blocks the
  release for everything merged alongside it. `breaking` gives a major,
  `enhancement` a minor, `bug` / `documentation` / `internal` a patch. Tooling,
  CI and dependency work is `internal`.
- The changelog is
  [GitHub Releases](https://github.com/tanem/svg-injector/releases), generated
  from those same labels via `.github/release.yml`. `CHANGELOG.md` is closed at
  v12.1.0 — nothing appends to it and nothing should, including you. `AUTHORS`
  is stale for the same reason. Never hand-edit either `version` field.
- Breaking changes need a `MIGRATION.md` entry in the same PR: the generated
  release notes are only a list of PR titles.

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

`no-bundler` is the exception, and has to be: Vite bundles every
`<script type="module">` in `index.html`, `public/` included, so a Vite build
would replace the module import that is the whole point of it. Its `build.js`
copies the page and `dist/svg-injector.mjs` into `dist/` instead. All the
harness needs from an example is an `npm run build` that fills
`<example>/dist/`.

## Conventions

- One default export per module in `src/`, apart from `index.ts` (barrel) and
  `types.ts` (types only).
- Functions, not classes.
- Never `any`. Use `unknown` when the type is genuinely dynamic.
- Non-null assertions only where a runtime guarantee backs them.
- `//` comments, not `/* */`, except for eslint directives.
