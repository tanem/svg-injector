import type { Page } from '@playwright/test'
import { expect, test } from './playwright/coverage'
import { setupPage, type SvgInjectorWindow } from './playwright/test-utils'

const thumbUpSvgRaw =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"/></svg>'

const dataUrl = 'data:image/svg+xml,' + encodeURIComponent(thumbUpSvgRaw)

// Same two URLs `callback-timing.test.ts` uses, and for the same reason: they
// are the shortest triggers for the two paths that fail before any request is
// made.
const unparseableDataUrl = 'data:image/svg+xml;charset=shift_jis,x'
const unparseableUrl = 'http://'

type ElementReport = {
  error: string | null
  // `id` of the element `afterEach` received. Read unguarded on purpose: the
  // argument is typed as always present, so an absent one should fail the test
  // rather than be quietly reported as "no element".
  elementId: string
  // Identity, not equality: the argument has to be the very element that was
  // passed in, not a copy of it and not the injected SVG. Checked in the page,
  // because `page.evaluate` only returns serialisable values and a DOM node is
  // not one.
  isSamePlaceholder: boolean
}

type InjectOptions = {
  cacheRequests?: boolean
}

// Builds `html` into a container, injects everything matching `.inject-me`,
// and reports one entry per `afterEach` call. Every placeholder needs an `id`
// for the report to name it.
const reportElements = (
  page: Page,
  html: string,
  options: InjectOptions = {},
) => {
  return page.evaluate(
    ({ html, options }) => {
      return new Promise<ElementReport[]>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        document.body.innerHTML = ''
        const container = document.createElement('div')
        container.innerHTML = html
        document.body.appendChild(container)

        // Snapshotted before the call: `getElementsByClassName` is live, so
        // each element that injects drops out as it is replaced.
        const placeholders = Array.from(
          container.getElementsByClassName('inject-me'),
        )

        const reports: ElementReport[] = []

        SVGInjector(placeholders, {
          afterEach: (error: Error | null, _svg, element) => {
            reports.push({
              error: error ? error.message : null,
              elementId: element.id,
              isSamePlaceholder: placeholders.includes(element),
            })
          },
          afterAll: () => {
            resolve(reports)
          },
          ...options,
        })
      })
    },
    { html, options },
  )
}

const placeholder = (id: string, url: string | null) => {
  const src = url === null ? '' : ` data-src="${url}"`
  return `<div id="${id}" class="inject-me"${src}></div>`
}

// The gap this closes: on failure there is no SVG and no element, so a caller
// that passed a collection could not say which of its placeholders failed. The
// error message is not a way back either -- seven of the library's messages do
// not name their URL, and a URL is not an element in any case, since two
// placeholders sharing one `data-src` is the normal case for a sprite.
test.describe('the element afterEach receives', () => {
  test('is the placeholder on a successful injection', async ({ page }) => {
    await setupPage(page)

    const reports = await reportElements(
      page,
      placeholder('thumb-up', '/fixtures/thumb-up.svg'),
    )

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe(null)
    expect(reports[0]!.elementId).toBe('thumb-up')
    // The placeholder has been replaced by its SVG by now, so this also pins
    // that the argument is the detached original rather than the replacement.
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder on a cache hit', async ({ page }) => {
    await setupPage(page)

    await reportElements(page, placeholder('warm', '/fixtures/thumb-up.svg'))
    const reports = await reportElements(
      page,
      placeholder('cached', '/fixtures/thumb-up.svg'),
    )

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe(null)
    expect(reports[0]!.elementId).toBe('cached')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder for a data URL', async ({ page }) => {
    await setupPage(page)

    const reports = await reportElements(page, placeholder('inline', dataUrl))

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe(null)
    expect(reports[0]!.elementId).toBe('inline')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder when the load fails', async ({ page }) => {
    await setupPage(page, {
      fixtureOverrides: { '/fixtures/missing.svg': { status: 404 } },
    })

    const reports = await reportElements(
      page,
      placeholder('gone', '/fixtures/missing.svg'),
    )

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe(
      'Unable to load SVG file: /fixtures/missing.svg',
    )
    expect(reports[0]!.elementId).toBe('gone')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  // `Invalid content type` is one of the messages that does not name its URL,
  // so before this argument existed nothing in the callback identified the
  // element. `examples/error-handling` hit exactly this.
  test('is the placeholder when the content type is rejected', async ({
    page,
  }) => {
    await setupPage(page)

    // The extensionless fixture, because a pathname ending `.svg` bypasses the
    // content-type check entirely.
    const reports = await reportElements(
      page,
      placeholder('wrong-type', '/fixtures/thumb-up?content-type=text%2Fhtml'),
    )

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe('Invalid content type: text/html')
    expect(reports[0]!.elementId).toBe('wrong-type')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder when the data-src attribute is missing', async ({
    page,
  }) => {
    await setupPage(page)

    const reports = await reportElements(page, placeholder('no-src', null))

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe('Invalid data-src or src attribute')
    expect(reports[0]!.elementId).toBe('no-src')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder when the data URL is unparseable', async ({
    page,
  }) => {
    await setupPage(page)

    const reports = await reportElements(
      page,
      placeholder('bad-data-url', unparseableDataUrl),
    )

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe('Unsupported data URL format')
    expect(reports[0]!.elementId).toBe('bad-data-url')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  // The message here is the browser's own and varies by engine, which is
  // precisely why the element matters more than the string.
  test('is the placeholder when the URL is unparseable', async ({ page }) => {
    await setupPage(page)

    const reports = await reportElements(
      page,
      placeholder('bad-url', unparseableUrl),
    )

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).not.toBe(null)
    expect(reports[0]!.elementId).toBe('bad-url')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder when the symbol is not found', async ({ page }) => {
    await setupPage(page)

    const reports = await reportElements(
      page,
      placeholder('no-symbol', '/fixtures/sprite.svg#icon-missing'),
    )

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe(
      'Symbol "icon-missing" not found in /fixtures/sprite.svg',
    )
    expect(reports[0]!.elementId).toBe('no-symbol')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder when the injection is already in flight', async ({
    page,
  }) => {
    await setupPage(page)

    const reports = await page.evaluate(() => {
      return new Promise<ElementReport[]>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        document.body.innerHTML = ''
        const el = document.createElement('div')
        el.id = 'in-flight'
        el.setAttribute('data-src', '/fixtures/thumb-up.svg')
        document.body.appendChild(el)

        const reports: ElementReport[] = []

        // The first call marks the element in flight and owns it until its own
        // load finishes, so the second call hits the guard.
        SVGInjector(el)
        SVGInjector(el, {
          afterEach: (error: Error | null, _svg, element) => {
            reports.push({
              error: error ? error.message : null,
              elementId: element.id,
              isSamePlaceholder: element === el,
            })
          },
          afterAll: () => {
            resolve(reports)
          },
        })
      })
    })

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe(
      'Injection already in progress: /fixtures/thumb-up.svg',
    )
    expect(reports[0]!.elementId).toBe('in-flight')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  test('is the placeholder when the parent node is null', async ({ page }) => {
    await setupPage(page)

    const reports = await page.evaluate(() => {
      return new Promise<ElementReport[]>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        document.body.innerHTML = ''
        // Never appended, so the swap has nothing to replace into.
        const el = document.createElement('div')
        el.id = 'detached'
        el.setAttribute('data-src', '/fixtures/thumb-up.svg')

        const reports: ElementReport[] = []

        SVGInjector(el, {
          afterEach: (error: Error | null, _svg, element) => {
            reports.push({
              error: error ? error.message : null,
              elementId: element.id,
              isSamePlaceholder: element === el,
            })
          },
          afterAll: () => {
            resolve(reports)
          },
        })
      })
    })

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe('Parent node is null')
    expect(reports[0]!.elementId).toBe('detached')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })

  // The point of the ticket. Three placeholders fail three different ways and
  // one succeeds; each `afterEach` call has to pair its error with its own
  // element, whatever order the loads finish in.
  test('pairs each error with its own element in a mixed collection', async ({
    page,
  }) => {
    await setupPage(page, {
      fixtureOverrides: { '/fixtures/missing.svg': { status: 404 } },
    })

    const reports = await reportElements(
      page,
      [
        placeholder('ok', '/fixtures/thumb-up.svg'),
        placeholder('four-oh-four', '/fixtures/missing.svg'),
        placeholder('no-attribute', null),
        placeholder('bad-symbol', '/fixtures/sprite.svg#icon-missing'),
      ].join(''),
    )

    expect(reports).toHaveLength(4)
    expect(reports.every((report) => report.isSamePlaceholder)).toBe(true)

    // Sorted because completion order is load order, which is not the source
    // order and is not guaranteed to be stable across engines.
    const pairs = reports
      .map((report) => [report.elementId, report.error])
      .sort((a, b) => String(a[0]).localeCompare(String(b[0])))

    expect(pairs).toEqual([
      ['bad-symbol', 'Symbol "icon-missing" not found in /fixtures/sprite.svg'],
      ['four-oh-four', 'Unable to load SVG file: /fixtures/missing.svg'],
      ['no-attribute', 'Invalid data-src or src attribute'],
      ['ok', null],
    ])
  })

  // Two placeholders sharing one `data-src` is the normal case for a sprite,
  // and the reason the URL in an error message is not a substitute for the
  // element even when the message carries one.
  test('distinguishes two placeholders sharing one URL', async ({ page }) => {
    await setupPage(page, {
      fixtureOverrides: { '/fixtures/missing.svg': { status: 404 } },
    })

    const reports = await reportElements(
      page,
      [
        placeholder('first', '/fixtures/missing.svg'),
        placeholder('second', '/fixtures/missing.svg'),
      ].join(''),
    )

    expect(reports).toHaveLength(2)
    expect(reports.every((report) => report.isSamePlaceholder)).toBe(true)
    expect(reports.map((report) => report.elementId).sort()).toEqual([
      'first',
      'second',
    ])
  })

  // A single element takes the `nodeType` branch rather than the collection
  // one, so it is a separate call site and needs its own cover.
  test('is the element itself when a single element is passed', async ({
    page,
  }) => {
    await setupPage(page)

    const reports = await page.evaluate(() => {
      return new Promise<ElementReport[]>((resolve) => {
        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector

        document.body.innerHTML = ''
        const el = document.createElement('div')
        el.id = 'lone'
        el.setAttribute('data-src', '/fixtures/thumb-up.svg')
        document.body.appendChild(el)

        const reports: ElementReport[] = []

        SVGInjector(el, {
          afterEach: (error: Error | null, _svg, element) => {
            reports.push({
              error: error ? error.message : null,
              elementId: element.id,
              isSamePlaceholder: element === el,
            })
          },
          afterAll: () => {
            resolve(reports)
          },
        })
      })
    })

    expect(reports).toHaveLength(1)
    expect(reports[0]!.error).toBe(null)
    expect(reports[0]!.elementId).toBe('lone')
    expect(reports[0]!.isSamePlaceholder).toBe(true)
  })
})
