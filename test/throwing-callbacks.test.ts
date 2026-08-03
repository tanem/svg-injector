import { expect, test } from './playwright/coverage'
import { setupPage, type SvgInjectorWindow } from './playwright/test-utils'

// The consumer's callbacks are consumer code, and `beforeInjection` /
// `afterInjection` in `@tanem/react-svg` pass user-supplied functions straight
// through. A throw from one of them is a bug in that code, and it still
// surfaces uncaught, but the library's own accounting -- the `afterAll` count
// and the in-flight guard -- must not depend on the callback returning.
test.describe('throwing consumer callbacks', () => {
  test('a throwing afterEach still lets afterAll fire for a collection', async ({
    page,
  }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{ afterEachCalls: number; elementsLoaded: number }>(
        (resolve, reject) => {
          document.body.innerHTML = ''
          const container = document.createElement('div')
          container.innerHTML = `
            <div class="inject-me" data-src="/fixtures/thumb-up.svg"></div>
            <div class="inject-me" data-src="/fixtures/thumb-up.svg"></div>
          `
          document.body.appendChild(container)

          let afterEachCalls = 0

          const timeoutId = setTimeout(() => {
            reject(
              new Error(
                `\`afterAll\` did not fire. \`afterEach\` calls so far: ${afterEachCalls}`,
              ),
            )
          }, 5000)

          const { SVGInjector } = (window as unknown as SvgInjectorWindow)
            .SVGInjector
          SVGInjector(container.querySelectorAll('.inject-me'), {
            afterEach: () => {
              afterEachCalls += 1
              if (afterEachCalls === 1) {
                throw new Error('afterEach boom')
              }
            },
            afterAll: (elementsLoaded: number) => {
              clearTimeout(timeoutId)
              resolve({ afterEachCalls, elementsLoaded })
            },
          })
        },
      )
    })

    // Each element's callback runs in its own task, so the throw is contained
    // to the element it came from: the other element still reports.
    expect(result.afterEachCalls).toBe(2)
    expect(result.elementsLoaded).toBe(2)
  })

  test('a throwing afterEach still lets afterAll fire for a single element', async ({
    page,
  }) => {
    await setupPage(page)

    const elementsLoaded = await page.evaluate(() => {
      return new Promise<number>((resolve, reject) => {
        document.body.innerHTML = ''
        const el = document.createElement('div')
        el.setAttribute('data-src', '/fixtures/thumb-up.svg')
        document.body.appendChild(el)

        const timeoutId = setTimeout(() => {
          reject(new Error('`afterAll` did not fire.'))
        }, 5000)

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(el, {
          afterEach: () => {
            throw new Error('afterEach boom')
          },
          afterAll: (count: number) => {
            clearTimeout(timeoutId)
            resolve(count)
          },
        })
      })
    })

    expect(elementsLoaded).toBe(1)
  })

  test('a throwing afterEach surfaces uncaught', async ({ page }) => {
    await setupPage(page)

    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        document.body.innerHTML = ''
        const el = document.createElement('div')
        el.setAttribute('data-src', '/fixtures/thumb-up.svg')
        document.body.appendChild(el)

        // Resolving on a timer as well as on `afterAll` keeps the assertion
        // about the uncaught error, rather than turning into a second copy of
        // the accounting tests above when `afterAll` is the thing that broke.
        setTimeout(resolve, 2000)

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(el, {
          afterEach: () => {
            throw new Error('afterEach boom')
          },
          afterAll: () => resolve(),
        })
      })
    })

    await expect.poll(() => pageErrors.join('\n')).toContain('afterEach boom')
  })

  test('a throwing beforeEach reports the error and leaves the placeholder', async ({
    page,
  }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{
        error: string | null
        html: string
        elementsLoaded: number
      }>((resolve, reject) => {
        document.body.innerHTML = ''
        const container = document.createElement('div')
        container.innerHTML =
          '<div class="inject-me" data-src="/fixtures/thumb-up.svg"></div>'
        document.body.appendChild(container)

        let error: string | null = null

        const timeoutId = setTimeout(() => {
          reject(new Error('`afterAll` did not fire.'))
        }, 5000)

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(container.querySelector('.inject-me'), {
          beforeEach: () => {
            throw new Error('beforeEach boom')
          },
          afterEach: (injectionError: Error | null) => {
            error = injectionError ? injectionError.message : null
          },
          afterAll: (elementsLoaded: number) => {
            clearTimeout(timeoutId)
            resolve({ error, html: container.innerHTML, elementsLoaded })
          },
        })
      })
    })

    expect(result.error).toBe('beforeEach boom')
    expect(result.elementsLoaded).toBe(1)
    // A failed injection leaves the DOM as it found it, so the placeholder is
    // still there to retry with.
    expect(result.html).toContain('class="inject-me"')
    expect(result.html).not.toContain('<svg')
  })

  test('an element whose beforeEach threw can be injected again', async ({
    page,
  }) => {
    await setupPage(page)

    const result = await page.evaluate(() => {
      return new Promise<{ errors: Array<string | null>; html: string }>(
        (resolve, reject) => {
          document.body.innerHTML = ''
          const container = document.createElement('div')
          container.innerHTML =
            '<div class="inject-me" data-src="/fixtures/thumb-up.svg"></div>'
          document.body.appendChild(container)
          const el = container.querySelector('.inject-me')

          const errors: Array<string | null> = []

          const timeoutId = setTimeout(() => {
            reject(
              new Error(
                `Both injections did not complete. Errors so far: ${JSON.stringify(
                  errors,
                )}`,
              ),
            )
          }, 5000)

          const { SVGInjector } = (window as unknown as SvgInjectorWindow)
            .SVGInjector

          const record = (injectionError: Error | null) => {
            errors.push(injectionError ? injectionError.message : null)
          }

          SVGInjector(el, {
            beforeEach: () => {
              throw new Error('beforeEach boom')
            },
            afterEach: record,
            afterAll: () => {
              SVGInjector(el, {
                afterEach: record,
                afterAll: () => {
                  clearTimeout(timeoutId)
                  resolve({ errors, html: container.innerHTML })
                },
              })
            },
          })
        },
      )
    })

    // The retry has to inject rather than report `Injection already in
    // progress`: the failed attempt released the guard it took.
    expect(result.errors).toEqual(['beforeEach boom', null])
    expect(result.html).toContain('<svg')
  })

  test('a throwing beforeEach surfaces uncaught', async ({ page }) => {
    await setupPage(page)

    const pageErrors: string[] = []
    page.on('pageerror', (error) => pageErrors.push(error.message))

    await page.evaluate(() => {
      return new Promise<void>((resolve) => {
        document.body.innerHTML = ''
        const el = document.createElement('div')
        el.setAttribute('data-src', '/fixtures/thumb-up.svg')
        document.body.appendChild(el)

        // See the note in the `afterEach` counterpart above.
        setTimeout(resolve, 2000)

        const { SVGInjector } = (window as unknown as SvgInjectorWindow)
          .SVGInjector
        SVGInjector(el, {
          beforeEach: () => {
            throw new Error('beforeEach boom')
          },
          afterAll: () => resolve(),
        })
      })
    })

    await expect.poll(() => pageErrors.join('\n')).toContain('beforeEach boom')
  })
})
