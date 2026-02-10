# Migration

Details relating to major changes that aren't presently in `CHANGELOG.md`, due to limitations with how that file is being generated.

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
