import { SVGInjector } from '@tanem/svg-injector'

// An array rather than the HTMLCollection the other examples pass: `elements`
// accepts a plain `readonly Element[]` as of v12.
SVGInjector(Array.from(document.getElementsByClassName('inject-me')), {
  afterAll(elementsLoaded) {
    console.log(`injected ${elementsLoaded} elements`)
  },
  afterEach(err, svg) {
    if (err) {
      console.error(err)
      return
    }
    console.log(`injected ${svg ? svg.outerHTML : ''}`)
  },
  beforeEach(svg) {
    svg.setAttribute('stroke', 'red')
  },
  cacheRequests: false,
  evalScripts: 'once',
  httpRequestWithCredentials: false,
  renumerateIRIElements: false,
})
