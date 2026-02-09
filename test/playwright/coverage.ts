import { test } from '@playwright/test'
import * as fs from 'fs/promises'
import * as path from 'path'

const coverageDir = path.resolve(process.cwd(), '.nyc_output')

interface CoverageWindow extends Window {
  __coverage__?: Record<string, unknown>
}

const sanitize = (value: string) => {
  return value.replace(/[^a-zA-Z0-9_-]+/g, '_')
}

test.afterEach(async ({ page }, testInfo) => {
  if (process.env.COVERAGE !== '1') {
    return
  }

  try {
    const coverage = await page.evaluate(
      () => (window as unknown as CoverageWindow).__coverage__ ?? null,
    )

    if (!coverage) {
      return
    }

    await fs.mkdir(coverageDir, { recursive: true })

    const title = sanitize(testInfo.titlePath.join('-'))
    const fileName = `${testInfo.project.name}-${title}.json`
    const filePath = path.join(coverageDir, fileName)

    await fs.writeFile(filePath, JSON.stringify(coverage), 'utf8')
  } catch {
    // Ignore coverage collection failures to avoid masking test results.
  }
})
