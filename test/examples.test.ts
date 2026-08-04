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

// Examples serve their Vite build output from <example>/dist/.
const examples = [
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
    expectedSvgCount: 6,
  },
  {
    name: 'error-handling',
    expectedSvgCount: 1,
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

for (const example of examples) {
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

test('data-url-usage: multi-byte text decodes as UTF-8', async ({ page }) => {
  await page.goto('/data-url-usage/dist/')
  await waitForInjection(page, 6)

  await expect(page.locator('svg.label text')).toHaveText('café 🎉')
})

// The last icon's data-src is whatever Vite resolved an SVG import to, so
// this pins the parser against the bundler's actual output rather than
// against a hand-written copy of it. The injector carries the element's id
// and the resolved URL across onto the SVG it swaps in.
test('data-url-usage: the bundler-inlined icon is injected from a data URL', async ({
  page,
}) => {
  await page.goto('/data-url-usage/dist/')
  await waitForInjection(page, 6)

  const injected = page.locator('svg#inlined-by-vite')
  await expect(injected).toHaveAttribute(
    'data-src',
    /^data:image\/svg\+xml[,;]/,
  )
  await expect(injected.locator('path')).toHaveCount(1)
})

// The only example whose failures come from a real static server rather than
// from a fixture override or a Playwright route: `missing.svg` is absent from
// `public/`, and `markup.html` is an SVG document that any server sends as
// `text/html`. Both messages are asserted verbatim, so a change to either
// shows up here as well as in the library suite.
test('error-handling: failures report verbatim and render a fallback', async ({
  page,
}) => {
  const pageErrors: string[] = []
  page.on('pageerror', (err) => pageErrors.push(err.message))

  await page.goto('/error-handling/dist/')

  // Sorted, because the two requests fail in whichever order they finish.
  await expect
    .poll(async () =>
      (await page.locator('#reported li').allTextContents()).sort(),
    )
    .toEqual([
      'Invalid content type: text/html',
      'Unable to load SVG file: missing.svg',
    ])

  await expect(page.locator('.fallback')).toHaveText([
    'Could not load missing.svg',
    'Could not load markup.html',
  ])

  // The count covers processed elements, failures included.
  await expect(page.locator('#processed')).toHaveText(
    'afterAll(3): 1 injected, 2 failed',
  )
  await expect(page.locator('svg.injected-svg')).toHaveCount(1)

  expect(pageErrors).toEqual([])
})

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

// Examples are copied, so their afterEach has to model the recommended way to
// handle a failure: report it, and let the rest of the collection finish. Only
// the error path tells a reporting callback from a throwing one, and no example
// has a failing injection, so the failure is injected here. A throw from
// afterEach reaches the page as an uncaught exception, which is what the
// pageerror assertion catches.
for (const { name, asset } of [
  { name: 'api-usage', asset: 'icon-one.svg' },
  { name: 'iri-renumeration', asset: 'icon.svg' },
]) {
  test(`${name}: a failed injection is reported, not thrown`, async ({
    page,
  }) => {
    const pageErrors: string[] = []
    page.on('pageerror', (err) => pageErrors.push(err.message))
    const consoleErrors: string[] = []
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text())
      }
    })

    await page.route(`**/${name}/dist/${asset}`, (route) =>
      route.fulfill({ status: 404 }),
    )

    await page.goto(`/${name}/dist/`)
    await expect
      .poll(() => consoleErrors.join('\n'))
      .toContain(`Unable to load SVG file: ${asset}`)
    expect(pageErrors).toEqual([])
  })
}

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
