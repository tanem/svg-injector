import shortid from 'shortid'
import SVGInjector from '../../src'

const svgName = shortid.generate()
const source =
  '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z" /></svg>'
const injected = `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" id="thumb-up-one" title="I like it!" class="injected-svg inject-me-once thumb-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" id="thumb-up-two" title="I like it!" class="injected-svg inject-me-twice thumb-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg><svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" id="thumb-up-three" title="I like it!" class="injected-svg inject-me-three-times thumb-icon" data-src="${svgName}.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg>`

describe('race condition', () => {
  it('should render correctly', done => {
    expect.assertions(5)

    const secondDone = jest.fn()
    const thirdDone = jest.fn()
    container.insertAdjacentHTML(
      'beforeend',
      `<img id="thumb-up-one" class="inject-me-once thumb-icon" data-src="${svgName}.svg" title="I like it!" alt="thumb up"><img id="thumb-up-two" class="inject-me-twice thumb-icon" data-src="${svgName}.svg" title="I like it!" alt="thumb up"><img id="thumb-up-three" class="inject-me-three-times thumb-icon" data-src="${svgName}.svg" title="I like it!" alt="thumb up">`
    )

    SVGInjector(
      document.querySelectorAll(
        'img.inject-me-once, img.inject-me-twice, img.inject-me-three-times'
      ),
      {},
      totalSVGsInjected => {
        expect(container.innerHTML).toBe(injected)
        expect(totalSVGsInjected).toBe(3)
        expect(requests).toHaveLength(1)
        expect(secondDone).not.toHaveBeenCalled()
        expect(thirdDone).not.toHaveBeenCalled()
        done()
      }
    )

    // Trigger another injection of the second and third SVG in attempt to cause
    // a race condition. These should not trigger since ideally the previous
    // injection already did it (or is doing it).
    SVGInjector(
      document.querySelectorAll('.inject-me-twice, .inject-me-three-times'),
      {},
      secondDone
    )

    // Trigger yet another injection of the third SVG in attempt to cause a race
    // condition, this too should be skipped.
    SVGInjector(document.querySelector('.inject-me-three-times'), {}, thirdDone)

    requests[0].respond(200, {}, source)
  })
})
