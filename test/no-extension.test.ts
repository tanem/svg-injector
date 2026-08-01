import { expect, test } from './playwright/coverage'
import {
  formatHtml,
  injectSvg,
  setupPage,
  type SvgInjectorWindow,
} from './playwright/test-utils'

test.describe('no extension', () => {
  // A rejected content type aborts the request, and `abort()` re-enters the
  // `readystatechange` handler with `readyState` 4 in Chromium and Firefox. The
  // failure the caller sees has to be the content-type one, reported once.
  test('reports a rejected content type once', async ({ page }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{
        afterEachErrors: Array<string | null>
        afterAllCalls: number[]
      }>((resolve, reject) => {
        document.body.innerHTML = ''
        const container = document.createElement('div')
        container.innerHTML = `
          <div
            class="inject-me"
            data-src="/fixtures/thumb-up?content-type=text%2Fhtml"
          ></div>
        `
        document.body.appendChild(container)

        const afterEachErrors: Array<string | null> = []
        const afterAllCalls: number[] = []

        const timeoutId = setTimeout(() => {
          reject(new Error('`afterAll` was not called'))
        }, 5000)

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(container.querySelector('.inject-me'), {
          // Uncached, so the cache cannot absorb a repeated callback.
          cacheRequests: false,
          afterEach: (error: Error | null) => {
            afterEachErrors.push(error ? error.message : null)
          },
          afterAll: (elementsLoaded: number) => {
            clearTimeout(timeoutId)
            afterAllCalls.push(elementsLoaded)
            // Defer so a repeated callback would be recorded too.
            setTimeout(() => {
              resolve({ afterEachErrors, afterAllCalls })
            }, 0)
          },
        })
      })
    })

    expect(result.afterEachErrors).toEqual(['Invalid content type: text/html'])
    expect(result.afterAllCalls).toEqual([1])
  })

  test('missing content type', async ({ page, browserName }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=missing"
        ></div>
      `,
      selector: '.inject-me',
    })

    // WebKit synthesises a default content type when the response header is
    // absent, so the content-type check in make-ajax-request.ts succeeds and
    // no error is returned. Chromium and Firefox surface the missing header.
    const expectedError =
      browserName === 'webkit' ? null : 'Content type not found'
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error ?? null).toBe(expectedError)
    if (browserName !== 'webkit') {
      expect(result.afterEachCalls[0]!.svg).toBe(null)
    }
    expect(result.elementsLoaded).toBe(1)
  })

  test('malformed media type', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=invalid"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(
      'Invalid content type: invalid',
    )
    expect(result.afterEachCalls[0]!.svg).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('empty media type', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=%3Bcharset%3Dutf-8"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe('Content type not found')
    expect(result.afterEachCalls[0]!.svg).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('invalid content type', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=text%2Fhtml"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(
      'Invalid content type: text/html',
    )
    expect(result.afterEachCalls[0]!.svg).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('image/svg+xml', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=image%2Fsvg%2Bxml"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up?content-type=image%2Fsvg%2Bxml" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg>'

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(actual)
    expect(result.elementsLoaded).toBe(1)
  })

  test('image/svg+xml with parameters', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=image%2Fsvg%2Bxml%3B%20charset%3Dutf-8"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.afterEachCalls[0]!.svg).not.toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('uppercase media type', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=IMAGE%2FSVG%2BXML"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.afterEachCalls[0]!.svg).not.toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('text/plain', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?content-type=text%2Fplain"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up?content-type=text%2Fplain" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg>'

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(actual)
    expect(result.elementsLoaded).toBe(1)
  })
})
