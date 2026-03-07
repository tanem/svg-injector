import * as path from 'path'
import { expect, test } from '@playwright/test'

import type { Page } from '@playwright/test'

// Waits for SVG injection to complete by polling until the expected
// number of svg.injected-svg elements appear. The library adds the
// "injected-svg" class to each successfully injected SVG.
const waitForInjection = async (page: Page, expectedCount: number) => {
  await page.waitForFunction(
    (count) => document.querySelectorAll('svg.injected-svg').length >= count,
    expectedCount,
  )
}

// Parcel examples serve their build output from <example>/dist/.
const parcelExamples = [
  {
    name: 'basic-usage',
    expectedSvgCount: 1,
  },
  {
    name: 'api-usage',
    expectedSvgCount: 2,
  },
  {
    name: 'data-url-usage',
    expectedSvgCount: 2,
  },
  {
    name: 'iri-renumeration',
    expectedSvgCount: 3,
  },
  {
    name: 'sprite-usage',
    expectedSvgCount: 3,
  },
]

for (const example of parcelExamples) {
  test(`${example.name}: SVGs are injected`, async ({ page }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    await page.goto(`/${example.name}/dist/`)
    await waitForInjection(page, example.expectedSvgCount)

    const svgCount = await page.locator('svg').count()
    expect(svgCount).toBe(example.expectedSvgCount)

    // Every injected SVG should have child elements (not be empty).
    const svgs = page.locator('svg')
    for (let i = 0; i < svgCount; i++) {
      const children = await svgs.nth(i).evaluate((el) => el.children.length)
      expect(children).toBeGreaterThan(0)
    }

    expect(errors).toEqual([])
  })
}

test('api-usage: beforeEach applies stroke attribute', async ({ page }) => {
  await page.goto('/api-usage/dist/')
  await waitForInjection(page, 2)

  const svgs = page.locator('svg')
  const count = await svgs.count()
  for (let i = 0; i < count; i++) {
    await expect(svgs.nth(i)).toHaveAttribute('stroke', 'red')
  }
})

test('api-usage: afterAll logs element count', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })

  await page.goto('/api-usage/dist/')
  await waitForInjection(page, 2)

  expect(logs).toContainEqual('injected 2 elements')
})

test('iri-renumeration: afterAll logs element count', async ({ page }) => {
  const logs: string[] = []
  page.on('console', (msg) => {
    if (msg.type() === 'log') {
      logs.push(msg.text())
    }
  })

  await page.goto('/iri-renumeration/dist/')
  await waitForInjection(page, 3)

  expect(logs).toContainEqual('injected 3 elements')
})

// UMD examples are static HTML that load the library from unpkg. We
// intercept the CDN request and serve the local build instead.
const umdExamples = [
  {
    name: 'umd-dev',
    bundleFile: 'svg-injector.umd.development.js',
  },
  {
    name: 'umd-prod',
    bundleFile: 'svg-injector.umd.production.js',
  },
]

for (const example of umdExamples) {
  test(`${example.name}: SVG is injected with local build`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(err.message))

    const bundlePath = path.resolve(__dirname, '..', 'dist', example.bundleFile)

    // Intercept the unpkg CDN request and serve the local UMD bundle.
    await page.route('**/unpkg.com/**', async (route) => {
      await route.fulfill({ path: bundlePath })
    })

    await page.goto(`/${example.name}/`)
    await waitForInjection(page, 1)

    const svgCount = await page.locator('svg').count()
    expect(svgCount).toBe(1)

    const children = await page
      .locator('svg')
      .first()
      .evaluate((el) => el.children.length)
    expect(children).toBeGreaterThan(0)

    expect(errors).toEqual([])
  })
}
