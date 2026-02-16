import * as path from 'path'
import { pathToFileURL } from 'url'
import { expect, test } from './playwright/coverage'
import { addSvgInjector, formatHtml, injectSvg } from './playwright/test-utils'

const fixturesDir = path.resolve(__dirname, 'fixtures')
const thumbUpPath =
  'M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z'
const thumbUpPathElement = `<path d="${thumbUpPath}"></path>`
const localSvgResponse = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">${thumbUpPathElement}</svg>`
const blankFileUrl = pathToFileURL(
  path.join(fixturesDir, 'blank.html'),
).toString()

interface LocalWindow extends Window {
  __originalXHR?: typeof XMLHttpRequest
}

test.describe('local', () => {
  // Lets the real XHR fail naturally on a file:// page. The browser's
  // cross-origin restrictions cause the request to fail, triggering the
  // local-specific error message via isLocal() in make-ajax-request.ts.
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
    expect(result.afterEachCalls[0]?.error).toBe(
      'Note: SVG injection ajax calls do not work locally without adjusting security settings in your browser. Or consider using a local webserver.',
    )
  })

  // Playwright browsers enforce cross-origin restrictions on file:// pages, so
  // a real XHR to a local SVG file would fail. The mock below simulates what a
  // successful local XHR looks like: status 0 (not 200), no Content-Type
  // header, and a populated responseXML. This exercises the `isLocal() &&
  // httpRequest.status === 0` success path in make-ajax-request.ts.
  test('ok', async ({ page }) => {
    await addSvgInjector(page)
    await page.goto(blankFileUrl)

    await page.evaluate(
      ({ svg }) => {
        const originalXHR = window.XMLHttpRequest

        class MockXHR {
          readyState = 0
          status = 0
          responseXML: Document | null = null
          responseText = ''
          onreadystatechange: (() => void) | null = null

          open() {
            this.readyState = 1
          }

          send() {
            this.responseText = svg
            this.responseXML = new DOMParser().parseFromString(
              svg,
              'image/svg+xml',
            )
            this.readyState = 4
            if (this.onreadystatechange) {
              this.onreadystatechange()
            }
          }

          abort() {}

          getResponseHeader() {
            return null
          }

          overrideMimeType() {}
        }

        ;(window as unknown as LocalWindow).__originalXHR = originalXHR
        window.XMLHttpRequest = MockXHR as unknown as typeof XMLHttpRequest
      },
      { svg: localSvgResponse },
    )

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

    await page.evaluate(() => {
      const localWindow = window as unknown as LocalWindow
      if (localWindow.__originalXHR) {
        window.XMLHttpRequest = localWindow.__originalXHR
      }
    })
  })
})
