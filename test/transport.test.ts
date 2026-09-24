import { expect, test } from './playwright/coverage'
import {
  getScriptedXhrLog,
  injectSvg,
  scriptXhr,
  setupPage,
} from './playwright/test-utils'

const svgBody =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><path d="M0 0h8v8H0z"></path></svg>'

test.describe('transport', () => {
  // Rejecting the header aborts the request, and the abort re-enters the
  // readystate handler at `readyState` 4. Route interception does not produce
  // that second event. One `afterEach` call alone proves nothing, because
  // `settle` absorbs a second callback. Without the transport's guard the
  // re-entry's `Unable to load SVG file` would reach `settle` first, so the
  // reported error is what shows the guard held, and the logged events show
  // the re-entry happened.
  test('a rejected content type calls back once despite the abort re-entry', async ({
    page,
  }) => {
    await setupPage(page)
    await scriptXhr(page, {
      steps: [
        {
          readyState: 2,
          status: 200,
          headers: { 'Content-Type': 'text/html' },
        },
        { readyState: 4, status: 200, body: svgBody },
      ],
    })

    const result = await injectSvg(page, {
      html: '<div class="inject-me" data-src="/fixtures/thumb-up"></div>',
      selector: '.inject-me',
      options: { cacheRequests: false },
    })

    expect(result.afterEachCalls).toEqual([
      { error: 'Invalid content type: text/html', svg: null },
    ])
    expect(result.elementsLoaded).toBe(1)
    expect(await getScriptedXhrLog(page)).toEqual([
      { url: '/fixtures/thumb-up', aborted: true, events: [2, 4] },
    ])
  })

  test('an error thrown by open() is reported and afterAll still fires', async ({
    page,
  }) => {
    await setupPage(page)
    await scriptXhr(page, { openThrows: 'Scripted open() failure' })

    const result = await injectSvg(page, {
      html: '<div class="inject-me" data-src="/fixtures/thumb-up.svg"></div>',
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toEqual([
      { error: 'Scripted open() failure', svg: null },
    ])
    expect(result.elementsLoaded).toBe(1)
  })
})
