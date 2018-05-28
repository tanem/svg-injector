import shortid from 'shortid'
import SVGInjector from '../../src'

const svgName = shortid.generate()
const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><linearGradient id="a"><stop offset="5%" stop-color="#F60"/><stop offset="95%" stop-color="#FF6"/></linearGradient><radialGradient id="b" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="32"><stop offset="0%" stop-color="#708090"/><stop offset="50%" stop-color="#00f"/><stop offset="100%" stop-color="olive"/></radialGradient><pattern id="c" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="10" fill="#00f"/></pattern></defs><path stroke-width="5" stroke="url(#a) black" fill="url(#b) CadetBlue" d="M0 0h64v64H0z"/><circle cx="32" cy="32" r="18" stroke-width="4" stroke="url(#c) white" fill="url(#a) coral"/></svg>'
const injected = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" id="clip-path-two" class="injected-svg inject-me test-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="a-0"><stop offset="5%" stop-color="#F60"></stop><stop offset="95%" stop-color="#FF6"></stop></linearGradient><radialGradient id="b-0" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="32"><stop offset="0%" stop-color="#708090"></stop><stop offset="50%" stop-color="#00f"></stop><stop offset="100%" stop-color="olive"></stop></radialGradient><pattern id="c-0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="10" fill="#00f"></circle></pattern></defs><path stroke-width="5" stroke="url(#a-0)" fill="url(#a-0)" d="M0 0h64v64H0z"></path><circle cx="32" cy="32" r="18" stroke-width="4" stroke="url(#c-0)" fill="url(#a-0)"></circle></svg>`

it('iri attribute defs: linearGradient, radialGradient, pattern -> fill, stroke', done => {
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
