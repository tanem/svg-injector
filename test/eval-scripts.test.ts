import type { Page } from '@playwright/test'
import { expect, test } from './playwright/coverage'
import type { SvgInjectorWindow } from './playwright/test-utils'
import { formatHtml, injectSvg, setupPage } from './playwright/test-utils'

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

  // Replace window.alert with a counter. Playwright's default dialog handling
  // would auto-dismiss alerts without tracking them, so we need a controlled
  // way to verify how many times scripts in the injected SVGs call alert().
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

  test('non-JavaScript and empty script elements', async ({ page }) => {
    await setupPage(page, {
      fixtureOverrides: {
        '/fixtures/other-scripts.svg': {
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><script type="text/plain">alert(\'ran script\');</script><script></script><circle cx="5" cy="5" r="4"></circle></svg>',
        },
      },
    })
    await setupAlerts(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/other-scripts.svg"
        ></div>
      `,
      selector: '.inject-me',
      options: { evalScripts: 'always' },
    })

    const actual = formatHtml(result.html)

    // Only JavaScript types are extracted, so the text/plain block survives
    // injection untouched. The empty JavaScript block is removed but has
    // nothing to evaluate.
    expect(actual).toContain(
      '<script type="text/plain">alert(\'ran script\');</script>',
    )
    expect(actual).not.toContain('<script></script>')
    expect(await getAlertCount(page)).toBe(0)
  })

  // Scripts are collected with `querySelectorAll`, which matches at any depth,
  // so their removal has to work at any depth too.
  test('scripts nested inside containers', async ({ page }) => {
    await setupPage(page)
    await setupAlerts(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/nested-script.svg"
        ></div>
      `,
      selector: '.inject-me',
      options: { evalScripts: 'always' },
    })

    expect(result.elementsLoaded).toBe(1)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.html).not.toContain('<script')
    // One script at the root, one in `<defs>` and one in `<g>`.
    expect(await getAlertCount(page)).toBe(3)
  })

  // A failure while removing the nested scripts would leave the element in the
  // in-flight set, so every later call for it reports `Injection already in
  // progress` instead of running.
  test('the in-flight guard is released for scripts nested inside containers', async ({
    page,
  }) => {
    await setupPage(page)
    await setupAlerts(page)

    const errors = await page.evaluate(() => {
      return new Promise<Array<{ call: string; error: string | null }>>(
        (resolve) => {
          document.body.innerHTML = ''
          const container = document.createElement('div')
          container.innerHTML = `
            <div
              class="inject-me"
              data-src="/fixtures/nested-script.svg"
            ></div>
          `
          document.body.appendChild(container)

          const element = container.querySelector('.inject-me')!
          const errors: Array<{ call: string; error: string | null }> = []

          let secondStarted = false
          const startSecond = () => {
            if (secondStarted) {
              return
            }
            secondStarted = true

            const { SVGInjector } = (window as unknown as SvgInjectorWindow)
              .SVGInjector
            SVGInjector(element, {
              evalScripts: 'always',
              afterEach: (error) => {
                errors.push({
                  call: 'second',
                  error: error ? error.message : null,
                })
                resolve(errors)
              },
            })
          }

          const { SVGInjector } = (window as unknown as SvgInjectorWindow)
            .SVGInjector
          SVGInjector(element, {
            evalScripts: 'always',
            afterEach: (error) => {
              errors.push({
                call: 'first',
                error: error ? error.message : null,
              })
            },
            afterAll: startSecond,
          })

          // The first injection calling back is the signal to retry, but a
          // failure inside it means no callback at all, so arm the retry
          // independently as well.
          setTimeout(startSecond, 1000)
        },
      )
    })

    expect(errors).toEqual([
      { call: 'first', error: null },
      // The element left the DOM when its injected SVG replaced it, so the
      // retry cannot complete. The point is which error it reports: the guard
      // was released, so it got as far as the swap.
      { call: 'second', error: 'Parent node is null' },
    ])
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
