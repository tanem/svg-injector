import { SVGInjector } from '@tanem/svg-injector'

SVGInjector(document.getElementsByClassName('inject-me'), {
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
  renumerateIRIElements: true,
})
