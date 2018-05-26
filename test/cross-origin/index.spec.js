import SVGInjector from '../../src'
import injected from './injected'

describe('cross origin', () => {
  it('should render correctly', done => {
    expect.assertions(2)

    container.insertAdjacentHTML(
      'beforeend',
      `<img id="cross-origin" class="inject-me thumb-icon" data-src="http://support.useiconic.com/svginjector-cors-test/svg/thumb-up.svg" title="I like it!" alt="thumb up">`
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
  })
})
