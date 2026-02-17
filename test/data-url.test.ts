import { expect, test } from './playwright/coverage'
import { formatHtml, injectSvg, setupPage } from './playwright/test-utils'

const thumbUpPath =
  'M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z'
const thumbUpPathElement = `<path d="${thumbUpPath}"></path>`

const thumbUpSvgRaw =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"/></svg>'

const spriteRaw =
  '<svg xmlns="http://www.w3.org/2000/svg"><symbol id="icon-thumb-up" viewBox="0 0 8 8"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"/></symbol></svg>'

// URL-encoded data URL. Vite produces this format for SVGs without <text>.
const encodedDataUrl = 'data:image/svg+xml,' + encodeURIComponent(thumbUpSvgRaw)

// Base64-encoded data URL. Vite produces this format for SVGs containing
// <text>.
const base64DataUrl =
  'data:image/svg+xml;base64,' +
  Buffer.from(thumbUpSvgRaw, 'utf8').toString('base64')

// URL-encoded with explicit charset parameter (some tools emit this).
const charsetDataUrl =
  'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(thumbUpSvgRaw)

// Sprite as a URL-encoded data URL with a fragment identifier.
const spriteDataUrl =
  'data:image/svg+xml,' + encodeURIComponent(spriteRaw) + '#icon-thumb-up'

test.describe('data URL support', () => {
  test('URL-encoded data URL', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${encodedDataUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="${encodedDataUrl}" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('base64-encoded data URL', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${base64DataUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="${base64DataUrl}" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('data URL with explicit charset', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${charsetDataUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="${charsetDataUrl}" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('multiple data URL elements', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${encodedDataUrl}"
        ></div>
        <div
          class="inject-me"
          data-src="${base64DataUrl}"
        ></div>
      `,
      selector: '.inject-me',
      selectorAll: true,
    })

    expect(result.afterEachCalls).toHaveLength(2)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.afterEachCalls[1]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(2)
  })

  test('data URL with fragment identifier (sprite)', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${spriteDataUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg viewBox="0 0 8 8" class="injected-svg inject-me" data-src="${spriteDataUrl}" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('data URL with nonexistent symbol', async ({ page }) => {
    await setupPage(page)

    const spriteDataUrlBadSymbol =
      'data:image/svg+xml,' + encodeURIComponent(spriteRaw) + '#nonexistent'

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${spriteDataUrlBadSymbol}"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toContain(
      'Symbol "nonexistent" not found',
    )
    expect(result.elementsLoaded).toBe(1)
  })

  test('invalid SVG content in data URL', async ({ page }) => {
    await setupPage(page)

    const badDataUrl = 'data:image/svg+xml,' + encodeURIComponent('<not-svg/>')

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${badDataUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toContain(
      'Data URL did not contain a valid SVG element',
    )
    expect(result.elementsLoaded).toBe(1)
  })

  test('malformed base64 data URL', async ({ page }) => {
    await setupPage(page)

    const badBase64Url = 'data:image/svg+xml;base64,!!!not-base64!!!'

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${badBase64Url}"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBeTruthy()
    expect(result.elementsLoaded).toBe(1)
  })

  test('unsupported data URL format', async ({ page }) => {
    await setupPage(page)

    const badFormatUrl = 'data:image/svg+xml;charset=iso-8859-1,<svg/>'

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${badFormatUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toContain(
      'Unsupported data URL format',
    )
    expect(result.elementsLoaded).toBe(1)
  })

  test('attributes transferred from data URL element', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="my-icon"
          data-src="${encodedDataUrl}"
          id="my-svg"
          title="Thumb Up"
          width="24"
          height="24"
          style="color:red;"
          data-foo="bar"
        ></div>
      `,
      selector: '#my-svg',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 8 8" id="my-svg" title="Thumb Up" class="injected-svg my-icon" style="color:red;" data-src="${encodedDataUrl}" data-foo="bar" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
  })

  test('data URL with cacheRequests disabled', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${encodedDataUrl}"
        ></div>
      `,
      selector: '.inject-me',
      options: { cacheRequests: false },
    })

    const actual = formatHtml(result.html)
    const expected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="${encodedDataUrl}" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('invalid percent-encoding in URL-encoded data URL', async ({ page }) => {
    await setupPage(page)

    // %ZZ is not a valid percent-encoded sequence, so decodeURIComponent will
    // throw.
    const badEncodingUrl = 'data:image/svg+xml,%ZZ'

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${badEncodingUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toContain(
      'Invalid encoding in data URL',
    )
    expect(result.elementsLoaded).toBe(1)
  })

  test('invalid percent-encoding in charset data URL', async ({ page }) => {
    await setupPage(page)

    const badCharsetUrl = 'data:image/svg+xml;charset=utf-8,%ZZ'

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${badCharsetUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toContain(
      'Invalid encoding in data URL',
    )
    expect(result.elementsLoaded).toBe(1)
  })

  test('malformed XML in data URL triggers parse error', async ({ page }) => {
    await setupPage(page)

    // Unclosed tag produces a DOMParser parsererror, unlike <not-svg/> which
    // parses successfully but fails the SVGSVGElement check.
    const malformedXmlUrl = 'data:image/svg+xml,' + encodeURIComponent('<svg><')

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="${malformedXmlUrl}"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toContain(
      'Data URL SVG parse error',
    )
    expect(result.elementsLoaded).toBe(1)
  })
})
