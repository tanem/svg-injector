import type { Page } from '@playwright/test'
import { expect, test } from './playwright/coverage'
import { setupPage, type SvgInjectorWindow } from './playwright/test-utils'

const thumbUpSvgRaw =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"/></svg>'

const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(thumbUpSvgRaw)

type Timing = {
  // Both are recorded from a flag set on the line after the `SVGInjector`
  // call, so `false` means the callback ran before that call returned.
  afterEachAfterReturn: boolean
  afterAllAfterReturn: boolean
  error: string | null
  injected: boolean
}

// Injects `url` once per entry in `runs`, each into its own element and each
// waiting for the previous one's `afterAll`, and reports when the callbacks
// fired relative to the `SVGInjector` call returning.
const measureTimings = (page: Page, url: string, runs: number) => {
  return page.evaluate(
    ({ url, runs }) => {
      const { SVGInjector } = (window as unknown as SvgInjectorWindow)
        .SVGInjector

      const measureOne = (done: (timing: Timing) => void) => {
        const container = document.createElement('div')
        const el = document.createElement('div')
        el.setAttribute('data-src', url)
        container.appendChild(el)
        document.body.appendChild(container)

        let returned = false
        let afterEachAfterReturn = false
        let error: string | null = null

        SVGInjector(el, {
          afterEach: (injectionError: Error | null) => {
            afterEachAfterReturn = returned
            error = injectionError ? injectionError.message : null
          },
          afterAll: () => {
            done({
              afterEachAfterReturn,
              afterAllAfterReturn: returned,
              error,
              injected: container.querySelector('svg') !== null,
            })
          },
        })

        returned = true
      }

      return new Promise<Timing[]>((resolve) => {
        const timings: Timing[] = []

        const next = () => {
          measureOne((timing) => {
            timings.push(timing)
            if (timings.length === runs) {
              resolve(timings)
              return
            }
            next()
          })
        }

        document.body.innerHTML = ''
        next()
      })
    },
    { url, runs },
  )
}

// The three completion paths -- a first load, a cache hit on an already
// loaded URL, and a data URL -- all reach the caller's callbacks the same
// way, so code that reads DOM state between `SVGInjector` and its callbacks
// behaves the same whatever the cache holds.
test.describe('callback timing', () => {
  test('a first load calls back after SVGInjector returns', async ({
    page,
  }) => {
    await setupPage(page)

    const [first] = await measureTimings(page, '/fixtures/thumb-up.svg', 1)

    expect(first!.error).toBe(null)
    expect(first!.injected).toBe(true)
    expect(first!.afterEachAfterReturn).toBe(true)
    expect(first!.afterAllAfterReturn).toBe(true)
  })

  test('a cache hit calls back after SVGInjector returns', async ({ page }) => {
    await setupPage(page)

    const [, second] = await measureTimings(page, '/fixtures/thumb-up.svg', 2)

    expect(second!.error).toBe(null)
    expect(second!.injected).toBe(true)
    expect(second!.afterEachAfterReturn).toBe(true)
    expect(second!.afterAllAfterReturn).toBe(true)
  })

  test('a data URL calls back after SVGInjector returns', async ({ page }) => {
    await setupPage(page)

    const [first] = await measureTimings(page, dataUrl, 1)

    expect(first!.error).toBe(null)
    expect(first!.injected).toBe(true)
    expect(first!.afterEachAfterReturn).toBe(true)
    expect(first!.afterAllAfterReturn).toBe(true)
  })

  test('an empty collection calls back after SVGInjector returns', async ({
    page,
  }) => {
    await setupPage(page)

    const timing = await page.evaluate(() => {
      return new Promise<{ afterAllAfterReturn: boolean; count: number }>(
        (resolve) => {
          const { SVGInjector } = (window as unknown as SvgInjectorWindow)
            .SVGInjector

          document.body.innerHTML = ''

          let returned = false

          SVGInjector(document.querySelectorAll('.nothing-matches'), {
            afterAll: (count: number) => {
              resolve({ afterAllAfterReturn: returned, count })
            },
          })

          returned = true
        },
      )
    })

    expect(timing.count).toBe(0)
    expect(timing.afterAllAfterReturn).toBe(true)
  })
})
