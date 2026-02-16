import { expect, test } from './playwright/coverage'
import {
  formatHtml,
  injectSvg,
  setupPage,
  type SvgInjectorWindow,
} from './playwright/test-utils'

const thumbUpPath =
  'M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z'
const thumbUpPathElement = `<path d="${thumbUpPath}"></path>`
const thumbUpSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

interface LegacyDocumentWindow extends Window {
  Document: typeof Document | (() => void)
}

test.describe('SVGInjector', () => {
  test('single element', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    expect(actual).toBe(thumbUpSvg)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(actual)
    expect(result.elementsLoaded).toBe(1)
  })

  test('multiple elements', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg"
        ></div>
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg"
        ></div>
      `,
      selector: '.inject-me',
      selectorAll: true,
    })

    const actual = formatHtml(result.html)
    const expected = `${thumbUpSvg}${thumbUpSvg}`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(2)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(thumbUpSvg)
    expect(result.afterEachCalls[1]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[1]!.svg ?? '')).toBe(thumbUpSvg)
    expect(result.elementsLoaded).toBe(2)
  })

  test('null element', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: '',
      selector: null,
    })

    expect(result.elementsLoaded).toBe(0)
    expect(result.afterEachCalls).toHaveLength(0)
  })

  test('injection in progress', async ({ page }) => {
    await setupPage(page)

    await page.evaluate(() => {
      document.body.innerHTML = ''
      const container = document.createElement('div')
      container.innerHTML = `
        <div
          class="inject-me"
          data-src="/fixtures/in-progress.svg"
        ></div>
      `
      document.body.appendChild(container)
      const { SVGInjector } = (window as unknown as SvgInjectorWindow)
        .SVGInjector
      const element = container.querySelector('.inject-me')
      SVGInjector(element)
      SVGInjector(element)
    })
  })

  test('attributes', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="svg-one svg-two"
          data-bar="bar"
          data-foo="foo"
          data-src="/fixtures/thumb-up.svg"
          height="100"
          id="thumb-up"
          src="/some/other/url.svg"
          style="height:20px;"
          title="thumb-up"
          width="100"
        ></div>
      `,
      selector: '#thumb-up',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 8 8" id="thumb-up" title="thumb-up" class="injected-svg svg-one svg-two" style="height:20px;" data-src="/fixtures/thumb-up.svg" data-bar="bar" data-foo="foo" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
  })

  test('no class attribute', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          id="thumb-up"
          src="/fixtures/thumb-up.svg"
        ></div>
      `,
      selector: '#thumb-up',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" id="thumb-up" class="injected-svg" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
  })

  test('style tag', async ({ page, browserName }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/style-tag.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expectedFirefox =
      '<svg width="150" height="150" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" data-src="/fixtures/style-tag.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style>circle {fill: orange;stroke: black;stroke-width: 10px;}</style><circle cx="50" cy="50" r="40"></circle></svg>'
    const expectedDefault =
      '<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150" viewBox="0 0 100 100" class="injected-svg inject-me" data-src="/fixtures/style-tag.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><style>circle {fill: orange;stroke: black;stroke-width: 10px;}</style><circle cx="50" cy="50" r="40"></circle></svg>'

    expect(actual).toBe(
      browserName === 'firefox' ? expectedFirefox : expectedDefault,
    )
  })

  test('cached success', async ({ page }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{
        html: string
        containerOneHtml: string
        containerTwoHtml: string
        afterEachCalls: Array<{ error: string | null; svg: string | null }>
      }>((resolve) => {
        document.body.innerHTML = ''

        const containerOne = document.createElement('div')
        containerOne.innerHTML = `
          <div
            class="inject-me"
            data-src="/fixtures/thumb-up.svg"
          ></div>
        `
        document.body.appendChild(containerOne)

        const containerTwo = document.createElement('div')
        containerTwo.innerHTML = `
          <div
            class="inject-me"
            data-src="/fixtures/thumb-up.svg"
          ></div>
        `
        document.body.appendChild(containerTwo)

        const afterEachCalls: Array<{
          error: string | null
          svg: string | null
        }> = []

        const afterEach = (error: Error | null, svg?: Element | null) => {
          const svgMarkup = svg
            ? svg.outerHTML || new XMLSerializer().serializeToString(svg)
            : null
          afterEachCalls.push({
            error: error ? error.message : null,
            svg: svgMarkup,
          })
        }

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        SVGInjector(containerOne.querySelector('.inject-me'), {
          afterEach,
          afterAll: () => {
            SVGInjector(containerTwo.querySelector('.inject-me'), {
              afterEach,
              afterAll: () => {
                resolve({
                  html: containerOne.innerHTML + containerTwo.innerHTML,
                  containerOneHtml: containerOne.innerHTML,
                  containerTwoHtml: containerTwo.innerHTML,
                  afterEachCalls,
                })
              },
            })
          },
        })
      })
    })

    const actual = formatHtml(result.html)
    const expected = `${thumbUpSvg}${thumbUpSvg}`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(2)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(
      formatHtml(result.containerOneHtml),
    )
    expect(result.afterEachCalls[1]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[1]!.svg ?? '')).toBe(
      formatHtml(result.containerTwoHtml),
    )
  })

  test('uncached requests fetch fresh data', async ({ page }) => {
    await setupPage(page)

    let requestCount = 0

    await page.unroute('**/fixtures/**')
    await page.route('**/fixtures/volatile.svg', async (route) => {
      requestCount += 1
      const body = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><text x="0" y="10">${requestCount}</text></svg>`

      await route.fulfill({
        status: 200,
        body,
        headers: {
          'content-type': 'image/svg+xml',
        },
      })
    })

    const result = await page.evaluate(() => {
      return new Promise<{ htmls: string[] }>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        const htmls: string[] = []

        const injectOnce = (done: () => void) => {
          const container = document.createElement('div')
          container.innerHTML = `
            <div
              class="inject-me"
              data-src="/fixtures/volatile.svg"
            ></div>
          `
          document.body.appendChild(container)

          SVGInjector(container.querySelector('.inject-me'), {
            cacheRequests: false,
            afterAll: () => {
              htmls.push(container.innerHTML)
              done()
            },
          })
        }

        document.body.innerHTML = ''
        injectOnce(() => {
          injectOnce(() => resolve({ htmls }))
        })
      })
    })

    const first = formatHtml(result.htmls[0] ?? '')
    const second = formatHtml(result.htmls[1] ?? '')

    expect(requestCount).toBe(2)
    expect(first).not.toBe(second)
    expect(first).toContain('>1</text>')
    expect(second).toContain('>2</text>')
  })

  test('errors should not be cached', async ({ page }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{ errors: Array<string | null> }>((resolve) => {
        document.body.innerHTML = ''

        const errors: Array<string | null> = []
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        const inject = (html: string, done: () => void) => {
          const container = document.createElement('div')
          container.innerHTML = html
          document.body.appendChild(container)
          SVGInjector(container.querySelector('.inject-me'), {
            afterEach: (error: Error | null) => {
              errors.push(error ? error.message : null)
            },
            afterAll: () => done(),
          })
        }

        inject(
          `
            <div
              class="inject-me"
              data-src="/fixtures/not-found.svg"
            ></div>
          `,
          () => {
            inject(
              `
                <div
                  class="inject-me"
                  data-src="/fixtures/still-not-found.svg"
                ></div>
              `,
              () => resolve({ errors }),
            )
          },
        )
      })
    })

    expect(result.errors).toHaveLength(2)
    expect(result.errors[1]).toBe(
      'Unable to load SVG file: /fixtures/still-not-found.svg',
    )
  })

  test('svg not found error', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/not-found.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.elementsLoaded).toBe(1)
    expect(result.afterEachCalls[0]?.error).toBe(
      'Unable to load SVG file: /fixtures/not-found.svg',
    )
  })

  test('invalid src error', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.elementsLoaded).toBe(1)
    expect(result.afterEachCalls[0]?.error).toBe(
      'Invalid data-src or src attribute',
    )
  })

  test('unknown exception', async ({ page }) => {
    await setupPage(page, {
      fixtureOverrides: {
        '/fixtures/thumb-up.svg': {
          status: 500,
          body: '<svg></svg>',
        },
      },
    })

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls[0]?.error).toBe(
      'There was a problem injecting the SVG: 500 Internal Server Error',
    )
  })

  test('default `afterAll` callback', async ({ page }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{ html: string }>((resolve) => {
        document.body.innerHTML = ''
        const container = document.createElement('div')
        container.innerHTML = `
          <div
            class="inject-me"
            data-src="/fixtures/thumb-up.svg"
          ></div>
        `
        document.body.appendChild(container)

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(container.querySelector('.inject-me'), {
          afterEach: () => {
            resolve({ html: container.innerHTML })
          },
        })
      })
    })

    const actual = formatHtml(result.html)
    expect(actual).toBe(thumbUpSvg)
  })

  test('modifying SVG in `beforeEach`', async ({ page }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{ html: string }>((resolve) => {
        document.body.innerHTML = ''
        const container = document.createElement('div')
        container.innerHTML = `
          <div
            class="inject-me"
            data-src="/fixtures/thumb-up.svg"
          ></div>
        `
        document.body.appendChild(container)

        const beforeEach = (svg: Element) => {
          svg.setAttribute('stroke', 'red')
        }

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(container.querySelector('.inject-me'), {
          beforeEach,
          afterEach: () => {
            resolve({ html: container.innerHTML })
          },
        })
      })
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink" stroke="red">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
  })

  test('single element without cache', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg"
        ></div>
      `,
      selector: '.inject-me',
      options: { cacheRequests: false },
    })

    const actual = formatHtml(result.html)
    expect(actual).toBe(thumbUpSvg)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(actual)
    expect(result.elementsLoaded).toBe(1)
  })

  test('single element unknown exception without cache', async ({ page }) => {
    await setupPage(page, {
      fixtureOverrides: {
        '/fixtures/thumb-up.svg': {
          status: 500,
          body: '<svg></svg>',
        },
      },
    })

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg"
        ></div>
      `,
      selector: '.inject-me',
      options: { cacheRequests: false },
    })

    expect(result.afterEachCalls[0]?.error).toBe(
      'There was a problem injecting the SVG: 500 Internal Server Error',
    )
  })

  test('returns an error when parent node is null', async ({ page }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{ error: string | null }>((resolve) => {
        const div = document.createElement('div')
        div.dataset.src = '/fixtures/thumb-up.svg'

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(div, {
          afterEach: (error: Error | null) => {
            resolve({ error: error ? error.message : null })
          },
        })
      })
    })

    expect(result.error).toBe('Parent node is null')
  })

  test('handles Document wrangling via old libs', async ({ page }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{ html: string }>((resolve) => {
        const originalDocument = (window as unknown as LegacyDocumentWindow)
          .Document
        ;(window as unknown as LegacyDocumentWindow).Document = function () {}

        document.body.innerHTML = ''
        const container = document.createElement('div')
        container.innerHTML = `
          <div
            class="inject-me"
            data-src="/fixtures/thumb-up.svg"
          ></div>
        `
        document.body.appendChild(container)

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(container.querySelector('.inject-me'), {
          afterEach: () => {
            ;(window as unknown as LegacyDocumentWindow).Document =
              originalDocument
            resolve({ html: container.innerHTML })
          },
        })
      })
    })

    const actual = formatHtml(result.html)
    expect(actual).toBe(thumbUpSvg)
  })
})
