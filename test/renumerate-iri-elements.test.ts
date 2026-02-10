import { expect, test } from '@playwright/test'
import { formatHtml, injectSvg, setupPage } from './playwright/test-utils'
import './playwright/coverage'

test.describe('renumerate iri elements', () => {
  test('renumerateIRIElements: false', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/clip-path.svg"
        ></div>
      `,
      selector: '.inject-me',
      options: { renumerateIRIElements: false },
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/clip-path.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="clipPathTest"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath><clipPath id="clipPathTest2"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath></defs><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest)"></circle><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest2)"></circle></svg>'

    expect(actual).toBe(expected)
  })

  test('clip-path', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/clip-path.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/clip-path.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="clipPathTest-1"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath><clipPath id="clipPathTest2-2"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath></defs><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest-1)"></circle><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest2-2)"></circle></svg>'

    expect(actual).toBe(expected)
  })

  test('fill', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/fill.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/fill.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="linear-gradient-1"><stop offset="5%" stop-color="#F60"></stop><stop offset="95%" stop-color="#FF6"></stop></linearGradient><radialGradient id="radial-gradient-3" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="32"><stop offset="0%" stop-color="SlateGray"></stop><stop offset="50%" stop-color="blue"></stop><stop offset="100%" stop-color="olive"></stop></radialGradient><pattern id="pattern-2" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="10" style="stroke: none; fill: #0000ff"></circle></pattern></defs><rect x="0" y="0" width="64" height="64" stroke-width="5" stroke="url(#linear-gradient-1)" fill="url(#radial-gradient-3)"></rect><circle cx="32" cy="32" r="18" stroke-width="4" stroke="url(#pattern-2)" fill="url(#linear-gradient-1)"></circle></svg>'

    expect(actual).toBe(expected)
  })

  test('filter', async ({ page, browserName }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/filter.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expectedFirefox =
      '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" data-src="/fixtures/filter.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><filter id="offset-1" width="180" height="180"><feOffset in="SourceGraphic" dx="60" dy="60"></feOffset></filter></defs><rect x="0" y="0" width="100" height="100" stroke="black" fill="green"></rect><rect x="0" y="0" width="100" height="100" stroke="black" fill="green" filter="url(#offset-1)"></rect></svg>'
    const expectedDefault =
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" class="injected-svg inject-me" data-src="/fixtures/filter.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><filter id="offset-1" width="180" height="180"><feOffset in="SourceGraphic" dx="60" dy="60"></feOffset></filter></defs><rect x="0" y="0" width="100" height="100" stroke="black" fill="green"></rect><rect x="0" y="0" width="100" height="100" stroke="black" fill="green" filter="url(#offset-1)"></rect></svg>'

    expect(actual).toBe(
      browserName === 'firefox' ? expectedFirefox : expectedDefault,
    )
  })

  test('marker', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/marker.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/marker.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><marker id="markerSquare-1" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto"><rect x="1" y="1" width="5" height="5" style="stroke: none; fill:#000000;"></rect></marker><marker id="markerArrow-2" markerWidth="13" markerHeight="13" refX="2" refY="7" orient="auto"><path d="M2,2 L2,13 L8,7 L2,2" style="fill: #000000;"></path></marker></defs><path d="M10,10 l20,0 0,45 l20,0" style="stroke: #0000cc; stroke-width: 1px; fill: none;" marker-start="url(#markerSquare-1)" marker-mid="url(#markerSquare-1)" marker-end="url(#markerArrow-2)"></path></svg>'

    expect(actual).toBe(expected)
  })

  test('mask', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/mask.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/mask.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><mask id="MaskTest-1" x="0" y="0" width="100" height="100"><rect x="0" y="0" width="64" height="32" style="stroke:none; fill:white"></rect></mask></defs><rect x="1" y="1" width="64" height="64" stroke="none" fill="plum"></rect><rect x="1" y="1" width="64" height="64" stroke="none" fill="gray" mask="url(#MaskTest-1)"></rect></svg>'

    expect(actual).toBe(expected)
  })

  test('xlink href', async ({ page }) => {
    await setupPage(page, {
      fixtureOverrides: {
        '/fixtures/xlink.svg': {
          body: '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10"><defs><path id="shape" d="M0 0h10v10z"></path></defs><use xlink:href="#shape"></use></svg>',
        },
      },
    })

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/xlink.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="10" height="10" class="injected-svg inject-me" data-src="/fixtures/xlink.svg"><defs><path id="shape-1" d="M0 0h10v10z"></path></defs><use xlink:href="#shape-1"></use></svg>'

    expect(actual).toBe(expected)
  })

  test('thumb-up', async ({ page }) => {
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
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg>'

    expect(actual).toBe(expected)
  })

  // TODO: Output for this fixture is unstable across browsers; revisit.
  test.skip('style', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/style.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    expect(actual).toBe('')
  })

  test('dashboard', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/dashboard.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" class="injected-svg inject-me" data-src="/fixtures/dashboard.svg"><defs><path id="a-2" d="M0 10h8V0H0v10zm0 8h8v-6H0v6zm10 0h8V8h-8v10zm0-18v6h8V0h-8z"></path></defs><g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"></path><g transform="translate(3 3)"><mask id="b-1" fill="#fff"><use xlink:href="#a-2"></use></mask><use fill="#000" fill-opacity=".7" xlink:href="#a-2"></use><g mask="url(#b-1)"><path fill="#004876" fill-rule="nonzero" d="M-103-11535H-3v100h-100z"></path></g></g></g></svg>'

    expect(actual).toBe(expected)
  })

  test('notifications', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/notifications.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" class="injected-svg inject-me" data-src="/fixtures/notifications.svg"><defs><path id="a-2" d="M8.5 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6.5-6V8.5c0-3.07-2.13-5.64-5-6.32V1.5C10 .67 9.33 0 8.5 0S7 .67 7 1.5v.68c-2.87.68-5 3.25-5 6.32V14l-2 2v1h17v-1l-2-2z"></path></defs><g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"></path><g transform="translate(3 2)"><mask id="b-1" fill="#fff"><use xlink:href="#a-2"></use></mask><use fill="#000" fill-opacity=".7" xlink:href="#a-2"></use><g mask="url(#b-1)"><path fill="#004876" fill-rule="nonzero" d="M-103-89406H-3v100h-100z"></path></g></g></g></svg>'

    expect(actual).toBe(expected)
  })

  test('poll', async ({ page, browserName }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/poll.svg"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expectedFirefox =
      '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="injected-svg inject-me" data-src="/fixtures/poll.svg"><defs><path d="M 16 0 H 2 C 0.9 0 0 0.9 0 2 v 14 c 0 1.1 0.9 2 2 2 h 14 c 1.1 0 2 -0.9 2 -2 V 2 c 0 -1.1 -0.9 -2 -2 -2 Z M 6 14 H 4 V 7 h 2 v 7 Z m 4 0 H 8 V 4 h 2 v 10 Z m 4 0 h -2 v -4 h 2 v 4 Z" id="a-2"></path></defs><g fill="none" fill-rule="evenodd"><path d="M 0 0 h 24 v 24 H 0 Z"></path><g transform="translate(3 3)"><mask fill="#fff" id="b-1"><use xlink:href="#a-2"></use></mask><use fill="#000" fill-opacity="0.7" xlink:href="#a-2"></use><g mask="url(#b-1)"><path d="M -103 -91019 H -3 v 100 h -100 Z" fill="#004876" fill-rule="nonzero"></path></g></g></g></svg>'
    const expectedDefault =
      '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="24" viewBox="0 0 24 24" width="24" class="injected-svg inject-me" data-src="/fixtures/poll.svg"><defs><path d="M 16 0 H 2 C 0.9 0 0 0.9 0 2 v 14 c 0 1.1 0.9 2 2 2 h 14 c 1.1 0 2 -0.9 2 -2 V 2 c 0 -1.1 -0.9 -2 -2 -2 Z M 6 14 H 4 V 7 h 2 v 7 Z m 4 0 H 8 V 4 h 2 v 10 Z m 4 0 h -2 v -4 h 2 v 4 Z" id="a-2"></path></defs><g fill="none" fill-rule="evenodd"><path d="M 0 0 h 24 v 24 H 0 Z"></path><g transform="translate(3 3)"><mask fill="#fff" id="b-1"><use xlink:href="#a-2"></use></mask><use fill="#000" fill-opacity="0.7" xlink:href="#a-2"></use><g mask="url(#b-1)"><path d="M -103 -91019 H -3 v 100 h -100 Z" fill="#004876" fill-rule="nonzero"></path></g></g></g></svg>'

    expect(actual).toBe(
      browserName === 'firefox' ? expectedFirefox : expectedDefault,
    )
  })
})
