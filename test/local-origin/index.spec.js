import SVGInjector from '../../src'
import injected from './injected'
import thumbUp from './thumb-up'

describe('local origin', () => {
  it('should render correctly', done => {
    expect.assertions(2)

    container.insertAdjacentHTML(
      'beforeend',
      `<img id="local-origin" class="inject-me thumb-icon" data-src="thumb-up.svg" title="I like it!" alt="thumb up">`
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

    requests[0].respond(200, {}, thumbUp)
  })
})
