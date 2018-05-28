import shortid from 'shortid'
import SVGInjector from '../../src'

const svgName = shortid.generate()
const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><defs><marker id="a" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto"><path d="M1 1h5v5H1z"/></marker><marker id="b" markerWidth="13" markerHeight="13" refX="2" refY="7" orient="auto"><path d="M2 2v11l6-6-6-5"/></marker></defs><path d="M10 10h20v45h20" marker-start="url(#a)" marker-mid="url(#a)" marker-end="url(#b)" stroke="#00c" fill="none"/></svg>'
const injected = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" id="marker-two" class="injected-svg inject-me test-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><marker id="a-0" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto"><path d="M1 1h5v5H1z"></path></marker><marker id="b-0" markerWidth="13" markerHeight="13" refX="2" refY="7" orient="auto"><path d="M2 2v11l6-6-6-5"></path></marker></defs><path d="M10 10h20v45h20" marker-start="url(#a-0)" marker-mid="url(#a-0)" marker-end="url(#b-0)" stroke="#00c" fill="none"></path></svg>`

test('iri attribute defs: marker -> marker-start, marker-mid, marker-end', done => {
  expect.assertions(2)

  container.insertAdjacentHTML(
    'beforeend',
    `<img id="marker-two" class="inject-me test-icon" data-src="${svgName}.svg">`
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
