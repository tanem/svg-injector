import type { Page } from '@playwright/test'
import { expect, test } from './playwright/coverage'
import { setupPage, type SvgInjectorWindow } from './playwright/test-utils'

const thumbUpSvgRaw =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"/></svg>'

const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(thumbUpSvgRaw)

// The shortest trigger for `Unsupported data URL format`: a charset naming
// anything other than UTF-8 is rejected rather than decoded wrongly.
const unparseableDataUrl = 'data:image/svg+xml;charset=shift_jis,x'

// A scheme with no host: every engine's URL parser rejects it, so
// `XMLHttpRequest.open` throws rather than starting a request. The message it
// throws with is browser-specific, so tests only assert that one arrived.
const unparseableUrl = 'http://'

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
// fired relative to the `SVGInjector` call returning. A `null` `url` leaves
// the element without a `data-src`, which is one of the argument-rejection
// paths.
const measureTimings = (page: Page, url: string | null, runs: number) => {
  return page.evaluate(
    ({ url, runs }) => {
      const { SVGInjector } = (window as unknown as SvgInjectorWindow)
        .SVGInjector

      const measureOne = (done: (timing: Timing) => void) => {
        const container = document.createElement('div')
        const el = document.createElement('div')
        if (url !== null) {
          el.setAttribute('data-src', url)
        }
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

// Every path out of `SVGInjector` -- the three completion paths, the four
// arguments rejected before loading starts, and an empty collection -- reaches
// the caller's callbacks the same way, so code that reads DOM state between
// `SVGInjector` and its callbacks behaves the same whatever it passed in and
// whatever the cache holds.
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

  test('an element with no data-src calls back after SVGInjector returns', async ({
    page,
  }) => {
    await setupPage(page)

    const [first] = await measureTimings(page, null, 1)

    expect(first!.error).toBe('Invalid data-src or src attribute')
    expect(first!.injected).toBe(false)
    expect(first!.afterEachAfterReturn).toBe(true)
    expect(first!.afterAllAfterReturn).toBe(true)
  })

  test('an unparseable data URL calls back after SVGInjector returns', async ({
    page,
  }) => {
    await setupPage(page)

    const [first] = await measureTimings(page, unparseableDataUrl, 1)

    expect(first!.error).toBe('Unsupported data URL format')
    expect(first!.injected).toBe(false)
    expect(first!.afterEachAfterReturn).toBe(true)
    expect(first!.afterAllAfterReturn).toBe(true)
  })

  // `open()` throws synchronously for a URL the parser rejects, which without
  // a catch escapes `SVGInjector` itself rather than reaching `afterEach`.
  test('an unparseable URL calls back after SVGInjector returns', async ({
    page,
  }) => {
    await setupPage(page)

    const [first] = await measureTimings(page, unparseableUrl, 1)

    expect(first!.error).not.toBe(null)
    expect(first!.injected).toBe(false)
    expect(first!.afterEachAfterReturn).toBe(true)
    expect(first!.afterAllAfterReturn).toBe(true)
  })

  test('an injection already in flight calls back after SVGInjector returns', async ({
    page,
  }) => {
    await setupPage(page)

    const timing = await page.evaluate(() => {
      return new Promise<Timing>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        document.body.innerHTML = ''
        const container = document.createElement('div')
        const el = document.createElement('div')
        el.setAttribute('data-src', '/fixtures/thumb-up.svg')
        container.appendChild(el)
        document.body.appendChild(container)

        let returned = false
        let afterEachAfterReturn = false
        let error: string | null = null

        // The first call marks the element in flight and owns it until its own
        // load finishes, so the second call hits the guard.
        SVGInjector(el)
        SVGInjector(el, {
          afterEach: (injectionError: Error | null) => {
            afterEachAfterReturn = returned
            error = injectionError ? injectionError.message : null
          },
          afterAll: () => {
            resolve({
              afterEachAfterReturn,
              afterAllAfterReturn: returned,
              error,
              injected: container.querySelector('svg') !== null,
            })
          },
        })

        returned = true
      })
    })

    expect(timing.error).toBe(
      'Injection already in progress: /fixtures/thumb-up.svg',
    )
    expect(timing.afterEachAfterReturn).toBe(true)
    expect(timing.afterAllAfterReturn).toBe(true)
  })

  test('a null elements argument calls back after SVGInjector returns', async ({
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

          SVGInjector(null, {
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

  // The point of the ticket: one timing for the whole run, not one per element
  // depending on which paths its elements took.
  test('a mixed collection calls back after SVGInjector returns', async ({
    page,
  }) => {
    await setupPage(page)

    const timing = await page.evaluate(() => {
      return new Promise<{
        afterEachAfterReturn: boolean[]
        afterAllAfterReturn: boolean
        errors: Array<string | null>
      }>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        document.body.innerHTML = ''
        const container = document.createElement('div')
        const valid = document.createElement('div')
        valid.setAttribute('data-src', '/fixtures/thumb-up.svg')
        const invalid = document.createElement('div')
        container.appendChild(valid)
        container.appendChild(invalid)
        document.body.appendChild(container)

        let returned = false
        const afterEachAfterReturn: boolean[] = []
        const errors: Array<string | null> = []

        SVGInjector(container.children, {
          afterEach: (injectionError: Error | null) => {
            afterEachAfterReturn.push(returned)
            errors.push(injectionError ? injectionError.message : null)
          },
          afterAll: () => {
            resolve({
              afterEachAfterReturn,
              afterAllAfterReturn: returned,
              errors,
            })
          },
        })

        returned = true
      })
    })

    expect(timing.errors).toEqual(
      expect.arrayContaining([null, 'Invalid data-src or src attribute']),
    )
    expect(timing.afterEachAfterReturn).toEqual([true, true])
    expect(timing.afterAllAfterReturn).toBe(true)
  })

  // Deferring the data-URL error moves the callback later while the in-flight
  // release stays where it is, so a second call made in the gap starts a fresh
  // injection rather than hitting the guard. That is how every asynchronous
  // load error already behaves; pinned here so it is not mistaken for a
  // regression later.
  test('a second call in the gap left by a deferred data URL error is accounted for', async ({
    page,
  }) => {
    await setupPage(page)

    const errors = await page.evaluate((url) => {
      return new Promise<Array<string | null>>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        document.body.innerHTML = ''
        const el = document.createElement('div')
        el.setAttribute('data-src', url)
        document.body.appendChild(el)

        const collected: Array<string | null> = []
        const afterEach = (injectionError: Error | null) => {
          collected.push(injectionError ? injectionError.message : null)
          if (collected.length === 2) {
            resolve(collected)
          }
        }

        SVGInjector(el, { afterEach })
        SVGInjector(el, { afterEach })
      })
    }, unparseableDataUrl)

    expect(errors).toEqual([
      'Unsupported data URL format',
      'Unsupported data URL format',
    ])
  })
})
