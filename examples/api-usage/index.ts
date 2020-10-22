import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('inject-me'), {
  afterAll(elementsLoaded) {
    console.log(`injected ${elementsLoaded} elements`)
  },
  afterEach(err, svg) {
    if (err) {
      throw err
    }
    console.log(`injected ${svg.outerHTML}`)
  },
  beforeEach(svg) {
    svg.setAttribute('stroke', 'red')
  },
  cacheRequests: false,
  evalScripts: 'once',
  renumerateIRIElements: false,
})
