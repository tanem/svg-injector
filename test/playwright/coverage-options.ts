import type { CoverageReportOptions } from 'monocart-coverage-reports'

// Only the unpublished IIFE bundle the suite loads. Everything else the page
// evaluates (Playwright's own init scripts, inline test scripts) is noise.
const entryFilter = '**/test/dist/svg-injector.iife.js'

// The bundle also carries the `content-type` dependency, and its source map
// unpacks those sources alongside ours. `src/index.ts` only re-exports and
// `src/types.ts` is type-only, matching the ignore list in `codecov.yml`.
const sourceFilter = {
  'src/index.ts': false,
  'src/types.ts': false,
  'src/**': true,
  '**': false,
}

const coverageOptions: CoverageReportOptions = {
  entryFilter,
  logging: 'error',
  name: '@tanem/svg-injector',
  outputDir: 'coverage',
  reports: [
    // `lcov.info` in `outputDir` is what the codecov action picks up.
    ['lcovonly'],
    [
      'console-details',
      { metrics: ['statements', 'branches', 'functions', 'lines'] },
    ],
  ],
  sourceFilter,
}

export default coverageOptions
