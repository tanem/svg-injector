import SVGInjector from '../src/svg-injector'
import { AfterAll } from '../src/types'
import * as uniqueId from '../src/unique-id'
import {
  browser,
  cleanup,
  format,
  getOuterHTML,
  render,
} from './helpers/test-utils'

suite('no extension', () => {
  let uniqueIdStub: sinon.SinonStub

  setup(() => {
    uniqueIdStub = window.sinon.stub(uniqueId, 'default').returns(1)
  })

  teardown(() => {
    uniqueIdStub.restore()
    cleanup()
  })

  test('missing content type', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up?content-type=missing"
      ></div>
    `)

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll: () => {
        done()
      },
      afterEach: (error) => {
        expect(error)
          .to.be.a('error')
          .with.property('message', 'Content type not found')
      },
    })
  })

  test('invalid media type', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up?content-type=invalid"
      ></div>
    `)

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll: () => {
        done()
      },
      afterEach: (error) => {
        expect(error)
          .to.be.a('error')
          .with.property('message', 'invalid media type')
      },
    })
  })

  test('invalid content type', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up?content-type=text%2Fhtml"
      ></div>
    `)

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll: () => {
        done()
      },
      afterEach: (error) => {
        expect(error)
          .to.be.a('error')
          .with.property('message', 'Invalid content type: text/html')
      },
    })
  })

  test('image/svg+xml', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up?content-type=image%2Fsvg%2Bxml"
      ></div>
    `)

    const afterEach = window.sinon.stub()

    const afterAll: AfterAll = (elementsLoaded) => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 8 8" width="8" height="8" data-src="/fixtures/thumb-up?content-type=image%2Fsvg%2Bxml" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M 4.47 0 c -0.19 0.02 -0.37 0.15 -0.47 0.34 c -0.13 0.26 -1.09 2.19 -1.28 2.38 c -0.19 0.19 -0.44 0.28 -0.72 0.28 v 4 h 3.5 c 0.21 0 0.39 -0.13 0.47 -0.31 c 0 0 1.03 -2.91 1.03 -3.19 c 0 -0.28 -0.22 -0.5 -0.5 -0.5 h -1.5 c -0.28 0 -0.5 -0.25 -0.5 -0.5 s 0.39 -1.58 0.47 -1.84 c 0.08 -0.26 -0.05 -0.54 -0.31 -0.63 c -0.07 -0.02 -0.12 -0.04 -0.19 -0.03 Z m -4.47 3 v 4 h 1 v -4 h -1 Z" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up?content-type=image%2Fsvg%2Bxml" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg>'
      expect(actual).to.equal(expected)
      expect(afterEach.callCount).to.equal(1)
      expect(afterEach.firstCall.args).to.have.lengthOf(2)
      expect(afterEach.firstCall.args[0]).to.be.a('null')
      expect(format(getOuterHTML(afterEach.firstCall.args[1]))).to.equal(actual)
      expect(elementsLoaded).to.equal(1)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll,
      afterEach,
    })
  })

  test('text/plain', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up?content-type=text%2Fplain"
      ></div>
    `)

    const afterEach = window.sinon.stub()

    const afterAll: AfterAll = (elementsLoaded) => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 8 8" width="8" height="8" data-src="/fixtures/thumb-up?content-type=text%2Fplain" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M 4.47 0 c -0.19 0.02 -0.37 0.15 -0.47 0.34 c -0.13 0.26 -1.09 2.19 -1.28 2.38 c -0.19 0.19 -0.44 0.28 -0.72 0.28 v 4 h 3.5 c 0.21 0 0.39 -0.13 0.47 -0.31 c 0 0 1.03 -2.91 1.03 -3.19 c 0 -0.28 -0.22 -0.5 -0.5 -0.5 h -1.5 c -0.28 0 -0.5 -0.25 -0.5 -0.5 s 0.39 -1.58 0.47 -1.84 c 0.08 -0.26 -0.05 -0.54 -0.31 -0.63 c -0.07 -0.02 -0.12 -0.04 -0.19 -0.03 Z m -4.47 3 v 4 h 1 v -4 h -1 Z" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up?content-type=text%2Fplain" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg>'
      expect(actual).to.equal(expected)
      expect(afterEach.callCount).to.equal(1)
      expect(afterEach.firstCall.args).to.have.lengthOf(2)
      expect(afterEach.firstCall.args[0]).to.be.a('null')
      expect(format(getOuterHTML(afterEach.firstCall.args[1]))).to.equal(actual)
      expect(elementsLoaded).to.equal(1)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll,
      afterEach,
    })
  })
})
