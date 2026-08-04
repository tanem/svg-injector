import { SVGInjector } from '@tanem/svg-injector'

// Snapshotted before the call, because `getElementsByClassName` is live: each
// placeholder that injects is replaced by its SVG and drops out of the
// collection, so a later read would only see the failures.
const placeholders = Array.from(document.getElementsByClassName('inject-me'))

const reported = document.getElementById('reported')!
const processed = document.getElementById('processed')!

SVGInjector(placeholders, {
  afterEach(error) {
    if (!error) {
      return
    }

    // Reported rather than thrown: a throw from here escapes as an uncaught
    // exception and leaves the rest of the collection to finish without it.
    const item = document.createElement('li')
    item.textContent = error.message
    reported.append(item)
  },
  afterAll(elementsLoaded) {
    // `afterEach` names the failure but not the element it belongs to, so the
    // fallbacks are placed here instead: an element that injected has been
    // replaced by its SVG, which leaves the failures as the only placeholders
    // still in the document.
    const failed = placeholders.filter((el) => el.isConnected)

    for (const el of failed) {
      const fallback = document.createElement('p')
      fallback.className = 'fallback'
      fallback.textContent = `Could not load ${el.getAttribute('data-src')}`
      el.replaceWith(fallback)
    }

    // `elementsLoaded` counts every element processed, the failures included,
    // so it is 3 here rather than the 1 that reached the page.
    processed.textContent = `afterAll(${elementsLoaded}): ${
      elementsLoaded - failed.length
    } injected, ${failed.length} failed`
  },
})
