import shortid from 'shortid'
import SVGInjector from '../../src'

const svgName = shortid.generate()
const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><filter id="a"><feGaussianBlur in="SourceGraphic" stdDeviation="3"/></filter></defs><circle cx="32" cy="32" r="18" fill="olive" filter="url(#a)"/><circle cx="32" cy="32" r="10" fill="silver"/></svg>'
const injected = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" id="filter-two" class="injected-svg inject-me test-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><filter id="a-0"><feGaussianBlur in="SourceGraphic" stdDeviation="3"></feGaussianBlur></filter></defs><circle cx="32" cy="32" r="18" fill="olive" filter="url(#a-0)"></circle><circle cx="32" cy="32" r="10" fill="silver"></circle></svg>`

test('iri attribute defs: filter', done => {
  expect.assertions(2)

  container.insertAdjacentHTML(
    'beforeend',
    `<img id="filter-two" class="inject-me test-icon" data-src="${svgName}.svg">`
  )

  SVGInjector(
    document.querySelector('.inject-me'),
    {
      each: svg => {
        expect(svg.outerHTML).toBe(injected)
      }
    },
    totalSVGsInjected => {
      expect(totalSVGsInjected).toBe(1)
      done()
    }
  )

  requests[0].respond(200, {}, source)
})
