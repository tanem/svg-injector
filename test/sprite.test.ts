import { expect, test } from '@playwright/test'
import { formatHtml, injectSvg, setupPage } from './playwright/test-utils'
import './playwright/coverage'

const thumbUpPath =
  'M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z'
const thumbUpPathElement = `<path d="${thumbUpPath}"></path>`
const starPoints = '5,0 6.5,3 10,3.5 7.5,6 8,10 5,8.5 2,10 2.5,6 0,3.5 3.5,3'
const starPolygonElement = `<polygon points="${starPoints}"></polygon>`
const heartPath =
  'M6 2C4.5.5 2 .5 1 2s-.5 3.5 1 5l4 4 4-4c1.5-1.5 2-3.5 1-5s-3.5-1.5-5 0z'
const heartPathElement = `<path d="${heartPath}"></path>`

test.describe('sprite support', () => {
  test('single symbol extraction', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/sprite.svg#icon-thumb-up"
        ></div>
      `,
      selector: '.inject-me',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/sprite.svg#icon-thumb-up" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(formatHtml(result.afterEachCalls[0]!.svg ?? '')).toBe(actual)
    expect(result.elementsLoaded).toBe(1)
  })

  test('different symbols from same sprite', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/sprite.svg#icon-thumb-up"
        ></div>
        <div
          class="inject-me"
          data-src="/fixtures/sprite.svg#icon-star"
        ></div>
      `,
      selector: '.inject-me',
      selectorAll: true,
    })

    const actual = formatHtml(result.html)
    const expectedThumbUp = `<svg viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/sprite.svg#icon-thumb-up" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`
    const expectedStar = `<svg viewBox="0 0 10 10" class="injected-svg inject-me" data-src="/fixtures/sprite.svg#icon-star" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${starPolygonElement}</svg>`

    expect(actual).toBe(`${expectedThumbUp}${expectedStar}`)
    expect(result.afterEachCalls).toHaveLength(2)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.afterEachCalls[1]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(2)
  })

  test('same symbol injected multiple times', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/sprite.svg#icon-heart"
        ></div>
        <div
          class="inject-me"
          data-src="/fixtures/sprite.svg#icon-heart"
        ></div>
      `,
      selector: '.inject-me',
      selectorAll: true,
    })

    const actual = formatHtml(result.html)
    const expectedHeart = `<svg viewBox="0 0 12 12" class="injected-svg inject-me" data-src="/fixtures/sprite.svg#icon-heart" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${heartPathElement}</svg>`

    expect(actual).toBe(`${expectedHeart}${expectedHeart}`)
    expect(result.afterEachCalls).toHaveLength(2)
    expect(result.elementsLoaded).toBe(2)
  })

  test('symbol not found', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/sprite.svg#nonexistent"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(
      'Symbol "nonexistent" not found in /fixtures/sprite.svg',
    )
    expect(result.elementsLoaded).toBe(1)
  })

  test('attributes transferred to extracted symbol', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="my-icon"
          data-src="/fixtures/sprite.svg#icon-thumb-up"
          id="my-thumb"
          title="Thumb Up"
          width="24"
          height="24"
          style="color:red;"
          data-foo="bar"
        ></div>
      `,
      selector: '#my-thumb',
    })

    const actual = formatHtml(result.html)
    const expected = `<svg viewBox="0 0 8 8" id="my-thumb" title="Thumb Up" width="24" height="24" class="injected-svg my-icon" style="color:red;" data-src="/fixtures/sprite.svg#icon-thumb-up" data-foo="bar" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${thumbUpPathElement}</svg>`

    expect(actual).toBe(expected)
  })

  test('uncached sprite requests', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/sprite.svg#icon-star"
        ></div>
      `,
      selector: '.inject-me',
      options: { cacheRequests: false },
    })

    const actual = formatHtml(result.html)
    const expected = `<svg viewBox="0 0 10 10" class="injected-svg inject-me" data-src="/fixtures/sprite.svg#icon-star" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">${starPolygonElement}</svg>`

    expect(actual).toBe(expected)
    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBe(null)
    expect(result.elementsLoaded).toBe(1)
  })

  test('sprite file not found', async ({ page }) => {
    await setupPage(page)

    const result = await injectSvg(page, {
      html: `
        <div
          class="inject-me"
          data-src="/fixtures/nonexistent-sprite.svg#icon-star"
        ></div>
      `,
      selector: '.inject-me',
    })

    expect(result.afterEachCalls).toHaveLength(1)
    expect(result.afterEachCalls[0]!.error).toBeTruthy()
    expect(result.elementsLoaded).toBe(1)
  })
})
