import { expect, test } from '@playwright/test'
import { formatHtml, injectSvg, setupPage } from './playwright/test-utils'
import './playwright/coverage'

test.describe('no extension', () => {
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
    expect(result.afterEachCalls[0]?.error ?? null).toBe(expectedError)
  })

  test('invalid media type', async ({ page }) => {
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

    expect(result.afterEachCalls[0]?.error).toBe('invalid media type')
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

    expect(result.afterEachCalls[0]?.error).toBe(
      'Invalid content type: text/html',
    )
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
    expect(result.afterEachCalls[0].error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0].svg || '')).toBe(actual)
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
    expect(result.afterEachCalls[0].error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0].svg || '')).toBe(actual)
    expect(result.elementsLoaded).toBe(1)
  })
})
