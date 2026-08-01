import { test as base, expect } from '@playwright/test'
import { CoverageReport } from 'monocart-coverage-reports'
import coverageOptions from './coverage-options'

// `page.coverage` is Chromium-only. Coverage measures which lines the tests
// execute rather than how browsers behave, so collecting it from one project
// is enough: firefox and webkit still run the whole suite.
const test = base.extend<{ _collectCoverage: void }>({
  _collectCoverage: [
    async ({ browserName, page }, use) => {
      const collect = process.env.COVERAGE === '1' && browserName === 'chromium'

      if (collect) {
        // The suite navigates after installing the bundle, so the counters have
        // to survive navigation.
        await page.coverage.startJSCoverage({ resetOnNavigation: false })
      }

      await use()

      if (!collect) {
        return
      }

      const report = new CoverageReport(coverageOptions)
      // Drop the page's other scripts before caching: every entry carries its
      // own source, and `unique-id.test.ts` never loads a page at all, which
      // `add()` rejects as empty data.
      const entries = (await page.coverage.stopJSCoverage()).filter(
        report.getEntryFilter(),
      )

      if (entries.length === 0) {
        return
      }

      // Each worker appends to the shared cache under `coverage/.cache`, which
      // the global teardown merges into the report.
      await report.add(entries)
    },
    { auto: true },
  ],
})

export { expect, test }
