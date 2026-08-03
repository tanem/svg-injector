import { expect, test } from './playwright/coverage'
import { injectSvg, setupPage } from './playwright/test-utils'

// The `.svg` extension bypass in make-ajax-request.ts exists for file:// loads,
// where browsers send no Content-Type header. It has to key off the URL
// pathname: a `.svg` anywhere else in the URL is not an extension.
test.describe('svg extension', () => {
  test('skips content-type validation for a .svg pathname', async ({
    page,
  }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg?content-type=text%2Fhtml"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.afterEachCalls[0]!.svg).not.toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('validates the content type when .svg is in the query string', async ({
    page,
  }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up?file=logo.svgz&content-type=text%2Fhtml"
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

  test('validates the content type when .svg is in the hostname', async ({
    page,
  }) => {
    await setupPage(page, {
      // Cross-origin, so the response has to opt in before the browser exposes
      // its headers to the request.
      fixtureOverrides: {
        '/fixtures/thumb-up': {
          headers: { 'access-control-allow-origin': '*' },
        },
      },
    })

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="http://icon.svg.example.com/fixtures/thumb-up?content-type=text%2Fhtml"
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
})
