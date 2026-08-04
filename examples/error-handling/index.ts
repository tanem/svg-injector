import { SVGInjector } from '@tanem/svg-injector'

const reported = document.getElementById('reported')!
const processed = document.getElementById('processed')!

let failed = 0

// The live `HTMLCollection` goes straight in: `SVGInjector` snapshots it before
// injecting anything, so it shrinking as its elements are replaced costs the
// accounting nothing.
SVGInjector(document.getElementsByClassName('inject-me'), {
  afterEach(error, _svg, element) {
    if (!error) {
      return
    }

    failed++

    // Reported rather than thrown: a throw from here escapes as an uncaught
    // exception and leaves the rest of the collection to finish without it.
    const item = document.createElement('li')
    item.textContent = error.message
    reported.append(item)

    // `element` is the placeholder this error belongs to. A failed injection
    // leaves it in the document, so the fallback goes straight in its place,
    // the moment it fails rather than once the whole collection has finished.
    const fallback = document.createElement('p')
    fallback.className = 'fallback'
    fallback.textContent = `Could not load ${element.getAttribute('data-src')}`
    element.replaceWith(fallback)
  },
  afterAll(elementsLoaded) {
    // `elementsLoaded` counts every element processed, the failures included,
    // so it is 3 here rather than the 1 that reached the page.
    processed.textContent = `afterAll(${elementsLoaded}): ${
      elementsLoaded - failed
    } injected, ${failed} failed`
  },
})
