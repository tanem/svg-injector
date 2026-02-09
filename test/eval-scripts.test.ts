import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'
import { formatHtml, injectSvg, setupPage } from './playwright/test-utils'
import './playwright/coverage'

const injectHtml = `
  <div
    class="inject-me"
    data-src="/fixtures/script.svg"
  ></div>
  <div
    class="inject-me"
    data-src="/fixtures/script.svg"
  ></div>
`

test.describe('eval scripts', () => {
  interface AlertWindow extends Window {
    __alertCount: number
  }
  const expectedFirefox =
    '<svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" data-src="/fixtures/script.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><circle cx="50" cy="50" r="15" fill="green"></circle></svg><svg width="100%" height="100%" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" data-src="/fixtures/script.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><circle cx="50" cy="50" r="15" fill="green"></circle></svg>'
  const expectedDefault =
    '<svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" class="injected-svg inject-me" data-src="/fixtures/script.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><circle cx="50" cy="50" r="15" fill="green"></circle></svg><svg xmlns="http://www.w3.org/2000/svg" width="100%" height="100%" viewBox="0 0 100 100" class="injected-svg inject-me" data-src="/fixtures/script.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><circle cx="50" cy="50" r="15" fill="green"></circle></svg>'

  const setupAlerts = async (page: Page) => {
    await page.evaluate(() => {
      ;(window as unknown as AlertWindow).__alertCount = 0
      window.alert = () => {
        ;(window as unknown as AlertWindow).__alertCount += 1
      }
    })
  }

  const getAlertCount = async (page: Page) => {
    return page.evaluate(() => (window as unknown as AlertWindow).__alertCount)
  }

  test('never', async ({ page, browserName }) => {
    await setupPage(page)
    await setupAlerts(page)

    const result = await injectSvg(page, {
      html: injectHtml,
      selector: '.inject-me',
      selectorAll: true,
      options: { evalScripts: 'never' },
    })

    const actual = formatHtml(result.html)
    const expected =
      browserName === 'firefox' ? expectedFirefox : expectedDefault

    expect(actual).toBe(expected)
    expect(await getAlertCount(page)).toBe(0)
  })

  test('once', async ({ page, browserName }) => {
    await setupPage(page)
    await setupAlerts(page)

    const result = await injectSvg(page, {
      html: injectHtml,
      selector: '.inject-me',
      selectorAll: true,
      options: { evalScripts: 'once' },
    })

    const actual = formatHtml(result.html)
    const expected =
      browserName === 'firefox' ? expectedFirefox : expectedDefault

    expect(actual).toBe(expected)
    expect(await getAlertCount(page)).toBe(4)
  })

  test('always', async ({ page, browserName }) => {
    await setupPage(page)
    await setupAlerts(page)

    const result = await injectSvg(page, {
      html: injectHtml,
      selector: '.inject-me',
      selectorAll: true,
      options: { evalScripts: 'always' },
    })

    const actual = formatHtml(result.html)
    const expected =
      browserName === 'firefox' ? expectedFirefox : expectedDefault

    expect(actual).toBe(expected)
    expect(await getAlertCount(page)).toBe(8)
  })
})
