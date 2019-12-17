import { SVGInjector } from '@tanem/svg-injector'

document.body.insertAdjacentHTML(
  'beforeend',
  `
  <div class="api-usage" data-src="api-usage/icon-one.svg"></div>
  <div class="api-usage" data-src="api-usage/icon-two.svg"></div>
  `
)

SVGInjector(document.getElementsByClassName('api-usage'), {
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
  evalScripts: 'once',
  renumerateIRIElements: 'false'
})
