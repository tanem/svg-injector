import shortid from 'shortid'
import SVGInjector from '../../src'

const svgName = shortid.generate()
const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><mask id="a" x="0" y="0" width="100" height="100"><path fill="#fff" d="M0 0h64v32H0z"/></mask></defs><path fill="plum" d="M1 1h64v64H1z"/><path fill="gray" mask="url(#a)" d="M1 1h64v64H1z"/></svg>'
const injected = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" id="mask-two" class="injected-svg inject-me test-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><mask id="a-0" x="0" y="0" width="100" height="100"><path fill="#fff" d="M0 0h64v32H0z"></path></mask></defs><path fill="plum" d="M1 1h64v64H1z"></path><path fill="gray" mask="url(#a-0)" d="M1 1h64v64H1z"></path></svg>`

test('iri attribute defs: mask', done => {
  expect.assertions(2)

  container.insertAdjacentHTML(
    'beforeend',
    `<img id="mask-two" class="inject-me test-icon" data-src="${svgName}.svg">`
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
