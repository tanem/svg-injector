import { defineConfig } from '@playwright/test'

const examplesReportFolder = 'playwright-report-examples'

export default defineConfig({
  testDir: './test',
  testMatch: 'examples.test.ts',
  fullyParallel: true,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  timeout: 30_000,
  expect: {
    timeout: 5_000,
  },
  // A separate folder from the main suite's report: both suites run in the
  // same CI job, and the default folder would leave only the last one.
  reporter: process.env.CI
    ? [['dot'], ['html', { open: 'never', outputFolder: examplesReportFolder }]]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: examplesReportFolder }],
      ],
  use: {
    baseURL: 'http://localhost:4567',
    trace: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
  ],
  webServer: {
    command: 'npx serve examples -l 4567 --no-clipboard',
    port: 4567,
    reuseExistingServer: !process.env.CI,
  },
})
