import shortid from 'shortid'
import SVGInjector from '../src'

const svgName = shortid.generate()
const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><clipPath id="a"><path fill="#fff" d="M16 16h32v32H16z"/></clipPath></defs><circle cx="32" cy="32" r="18" stroke="red" clip-path="url(#a)" fill="wheat"/></svg>'
const injected = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" id="clip-path-two" class="injected-svg inject-me test-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="a-0"><path fill="#fff" d="M16 16h32v32H16z"></path></clipPath></defs><circle cx="32" cy="32" r="18" stroke="red" clip-path="url(#a-0)" fill="wheat"></circle></svg>`

test('clip path', done => {
  expect.assertions(2)

  container.insertAdjacentHTML(
    'beforeend',
    `<img id="clip-path-two" class="inject-me test-icon" data-src="${svgName}.svg">`
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
