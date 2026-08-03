# Manual transport checks

`test/playwright/test-utils.ts` routes every request, so the Playwright suite
never talks to a server. Real-server and `file://` behaviour is simulated there,
which makes it the suite's blind spot: a change to `make-ajax-request.ts` or
`load-svg-cached.ts` is not under test until it has been run against a genuine
response.

These checks are that run. They are deliberately not wired into CI: their value
is that nothing is mocked, and automating them on a hosted runner would mean
mocking the parts that make them worth having.

Run them when you change either of those two files, and record the result in the
PR.

## HTTP

`server.mjs` is a plain node server on port 4180. It serves headers a static
server cannot be made to send: a missing `Content-Type`, a header with no media
type, a malformed one, a 302, a delayed response, and a `/hits` endpoint that
counts requests per path.

```
npm run build
node test/manual/server.mjs
open http://localhost:4180/
```

22 cases plus a refetch check, 23 rows. The page tabulates expected against
actual and prints a pass/fail summary. Expected values are derived from `src/make-ajax-request.ts` and
`src/load-svg-cached.ts`, so changing either deliberately means updating the
expectations here in the same commit.

Every case asserts the number of `afterEach` calls as well as the outcome.
Reporting twice is a failure mode the mocked suite is poorly placed to catch,
since it turns on real abort and readystate semantics. The cases worth
understanding:

| Case | Why it is here |
| --- | --- |
| `cacheRequests: false` with a rejected content type | Rejecting the header aborts the request, and the abort re-enters the readystate handler. Route interception does not reproduce that second event, so this is the only place the exactly-once accounting is really tested. |
| 200 with well-formed non-SVG XML | Reaches the non-SVG-root branch, which needs a body that parses cleanly. A lowercase `<!doctype` fails XML parsing outright and lands in the unparseable branch instead, so both bodies are served. |
| Same URL injected twice after a parse failure | That a failed load is not cached. Asserted by counting server hits, because nothing on the page distinguishes a refetch from a cache entry parked on the loading sentinel. |
| `.svg` only in the query string | The extension bypass matches the pathname, not the whole URL, against a genuine server header. |
| 500 with an unparseable body vs 500 with a valid SVG body | Two different branches. `responseXML === null` is tested before the status, so only a parseable body reaches `There was a problem injecting the SVG`. |

Run it in Chrome, Firefox and Safari. All three should report 23/23.

## file://

`file-protocol/index.html` covers what a local file load reports, which is the
only reason the status-0 allowance and the `.svg` extension bypass in
`make-ajax-request.ts` exist. Both look like dead code until Safari is tried.

The page loads `../../dist/svg-injector.iife.js` as a classic script, so it
always runs against the current build:

```
npm run build
```

Confirm the page reports `location.protocol` as `file:` before trusting any
result. Served over HTTP it passes for the wrong reason.

Every engine blocks `file://` → `file://` XHR at default settings, so the
browser has to be told to allow it or case 1 cannot pass. Stock Firefox has no
comparable switch, so use Chrome and Safari:

```
# Chrome. The separate profile matters: a running Chrome ignores the flag.
open -na "Google Chrome" --args --allow-file-access-from-files \
  --user-data-dir="$HOME/.chrome-file-check" \
  "file://$PWD/test/manual/file-protocol/index.html"

# Safari, after Develop -> Developer Settings -> Disable Local File Restrictions
open -a Safari test/manual/file-protocol/index.html
```

Three cases. Each asserts exactly one `afterEach`, and the table records the
status and `Content-Type` the transport reported, so the reason behind each
verdict is visible rather than inferred from one browser:

- `./icon.svg` injects, via the `.svg` extension bypass.
- `./icon-no-extension` resolves rather than hanging. Whether it injects or
  errors is engine-specific, because what a browser reports for a local file is:
  Chrome sniffs `text/plain` and injects, Firefox reports `text/xml` and
  rejects, Safari sends no header and rejects with `Content type not found`.
- `./does-not-exist.svg` reports an error rather than hanging.

Safari is the one that cannot be skipped. It is the only engine still reporting
status 0 with no `Content-Type`, so it is the only one where those two
allowances are load-bearing.

### Playwright pre-check

```
node test/manual/file-protocol/probe.mjs
node test/manual/file-protocol/readystate-probe.mjs
```

`probe.mjs` drives the page over a real `file://` load in all three Playwright
engines; `readystate-probe.mjs` traces the raw XHR behind it. Useful for a quick
signal, but not a substitute: Playwright's builds lag the stock browsers and set
their own preferences, its Firefox permits a local XHR that stock Firefox
blocks, and its webkit cannot lift the local file restriction at all, which is
the engine that matters here. The two runs that cannot lift it are labelled in
the output so their failures do not read as regressions.

## Last run

Recorded so a later run has something to compare against.

- 12.0.0, 2026-08-03, stock browsers: 23/23 HTTP in Chrome 151, Firefox 146 and
  Safari 26.5; 3/3 `file://` in Chrome 151 and Safari 26.5.
- 12.0.0, 2026-08-04, after the move to `test/manual/`: 23/23 HTTP in Chrome
  151 and in all three Playwright engines. `file://` re-run in the Playwright
  engines only: 3/3 in chromium with `--allow-file-access-from-files` and in
  firefox.
