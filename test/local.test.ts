import * as path from 'path'
import { pathToFileURL } from 'url'
import { expect, test } from './playwright/coverage'
import {
  addSvgInjector,
  formatHtml,
  injectSvg,
  scriptXhr,
} from './playwright/test-utils'

const fixturesDir = path.resolve(__dirname, 'fixtures')
const thumbUpPath =
  'M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z'
const thumbUpPathElement = `<path d="${thumbUpPath}"></path>`
const localSvgResponse = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">${thumbUpPathElement}</svg>`
const blankFileUrl = pathToFileURL(
  path.join(fixturesDir, 'blank.html'),
).toString()

test.describe('local', () => {
  // Lets the real XHR fail naturally on a file:// page. The browser's
  // cross-origin restrictions cause the request to fail, triggering the
  // local-specific error message in make-ajax-request.ts.
  test('not found', async ({ page }) => {
    await addSvgInjector(page)
    await page.goto(blankFileUrl)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="not-found.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.elementsLoaded).toBe(1)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(
      'Note: SVG injection ajax calls do not work locally without adjusting security settings in your browser. Or consider using a local webserver.',
    )
    expect(result.afterEachCalls[0]!.svg).toBe(null)
  })

  // Playwright browsers enforce cross-origin restrictions on file:// pages, so
  // a real XHR to a local SVG file would fail. The script plays back what a
  // successful local load looks like in WebKit: status 0 (not 200), no
  // Content-Type header, and a parseable body. This exercises the status 0
  // allowance in make-ajax-request.ts.
  test('ok', async ({ page }) => {
    await addSvgInjector(page)
    await page.goto(blankFileUrl)
    await scriptXhr(page, {
      steps: [{ readyState: 4, status: 0, body: localSvgResponse }],
    })

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="thumb-up.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(actual)
    expect(result.elementsLoaded).toBe(1)
  })
})
