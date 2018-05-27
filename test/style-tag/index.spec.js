import SVGInjector from '../../src'
import injected from './injected'
import styleTag from './style-tag'

describe('ie style tag eval', () => {
  it('should render correctly', done => {
    expect.assertions(2)

    container.insertAdjacentHTML(
      'beforeend',
      '<img id="style-test-svg" src="style-tag-test.svg" class="inject-me">'
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

    requests[0].respond(200, {}, styleTag)
  })
})
