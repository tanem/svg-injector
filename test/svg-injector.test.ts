import SVGInjector from '../src/svg-injector'
import { AfterAll, BeforeEach, Errback } from '../src/types'
import * as uniqueId from '../src/unique-id'
import { cleanup, format, render } from './helpers/test-utils'

suite('SVGInjector', () => {
  let uniqueIdStub: sinon.SinonStub

  setup(() => {
    uniqueIdStub = window.sinon.stub(uniqueId, 'default').returns(1)
  })

  teardown(() => {
    uniqueIdStub.restore()
    cleanup()
  })

  test('single element', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up.svg"
      ></div>
    `)

    const afterEach = window.sinon.stub()

    const afterAll: AfterAll = (elementsLoaded) => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          height="8"
          viewBox="0 0 8 8"
          width="8"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      expect(afterEach.callCount).to.equal(1)
      expect(afterEach.firstCall.args).to.have.lengthOf(2)
      expect(afterEach.firstCall.args[0]).to.be.a('null')
      expect(format(afterEach.firstCall.args[1].outerHTML)).to.equal(actual)
      expect(elementsLoaded).to.equal(1)
      done()
    }

    SVGInjector(container.querySelector(`.inject-me`), {
      afterAll,
      afterEach,
    })
  })

  test('multiple elements', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up.svg"
      ></div>
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up.svg"
      ></div>
    `)

    const afterEach = window.sinon.stub()

    const afterAll: AfterAll = (elementsLoaded) => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          height="8"
          viewBox="0 0 8 8"
          width="8"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          height="8"
          viewBox="0 0 8 8"
          width="8"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      expect(afterEach.callCount).to.equal(2)
      expect(afterEach.firstCall.args).to.have.lengthOf(2)
      expect(afterEach.firstCall.args[0]).to.be.a('null')
      expect(format(afterEach.firstCall.args[1].outerHTML)).to.equal(
        format(container.getElementsByTagName('svg')[0].outerHTML)
      )
      expect(afterEach.secondCall.args).to.have.lengthOf(2)
      expect(afterEach.secondCall.args[0]).to.be.a('null')
      expect(format(afterEach.secondCall.args[1].outerHTML)).to.equal(
        format(container.getElementsByTagName('svg')[1].outerHTML)
      )
      expect(elementsLoaded).to.equal(2)
      done()
    }

    SVGInjector(container.querySelectorAll('.inject-me'), {
      afterAll,
      afterEach,
    })
  })

  test('null element', (done) => {
    const afterEach = window.sinon.stub()

    const afterAll: AfterAll = (elementsLoaded) => {
      expect(elementsLoaded).to.equal(0)
      expect(afterEach.callCount).to.equal(0)
      done()
    }

    SVGInjector(null, {
      afterAll,
      afterEach,
    })
  })

  test('injection in progress', () => {
    const fakeXHR: sinon.SinonFakeXMLHttpRequestStatic = window.sinon.useFakeXMLHttpRequest()
    const requests: sinon.SinonFakeXMLHttpRequest[] = []
    fakeXHR.onCreate = (xhr) => {
      requests.push(xhr)
    }

    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/in-progress.svg"
      ></div>
    `)

    SVGInjector(container.querySelector('.inject-me'))
    SVGInjector(container.querySelector('.inject-me'))

    fakeXHR.restore()
  })

  test('attributes', (done) => {
    const container = render(`
      <div
        class="svg-one svg-two"
        data-bar="bar"
        data-foo="foo"
        data-src="/fixtures/thumb-up.svg"
        height="100"
        id="thumb-up"
        src="/some/other/url.svg"
        style="height:20px;"
        title="thumb-up"
        width="100"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          class="injected-svg svg-one svg-two"
          data-bar="bar"
          data-foo="foo"
          data-src="/fixtures/thumb-up.svg"
          height="100"
          id="thumb-up"
          style="height:20px;"
          title="thumb-up"
          viewBox="0 0 8 8"
          width="100"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('#thumb-up'), { afterAll })
  })

  test('no class attribute', (done) => {
    const container = render(`
      <div
        id="thumb-up"
        src="/fixtures/thumb-up.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          class="injected-svg"
          data-src="/fixtures/thumb-up.svg"
          height="8"
          id="thumb-up"
          viewBox="0 0 8 8"
          width="8"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('#thumb-up'), { afterAll })
  })

  test('style tag', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/style-tag.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML, { usePrettier: false })
      const expected = format(
        `
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/style-tag.svg"
          height="150"
          viewBox="0 0 100 100"
          width="150"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <style>
    circle {
      fill: orange;
      stroke: black;
      stroke-width: 10px;
    }
  </style>
          <circle cx="50" cy="50" r="40"></circle>
        </svg>
      `,
        { usePrettier: false }
      )
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('cached success', (done) => {
    const containerOne = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up.svg"
      ></div>
    `)

    const afterEach = window.sinon.stub()

    SVGInjector(containerOne.querySelector('.inject-me'), {
      afterAll: (_) => {
        const containerTwo = render(`
          <div
            class="inject-me"
            data-src="/fixtures/thumb-up.svg"
          ></div>
        `)

        SVGInjector(containerTwo.querySelector('.inject-me'), {
          afterAll: () => {
            const actual = format(
              containerOne.innerHTML + containerTwo.innerHTML
            )
            const expected = format(`
              <svg
                class="injected-svg inject-me"
                data-src="/fixtures/thumb-up.svg"
                height="8"
                viewBox="0 0 8 8"
                width="8"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
              >
                <path
                  d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
                ></path>
              </svg>

              <svg
                class="injected-svg inject-me"
                data-src="/fixtures/thumb-up.svg"
                height="8"
                viewBox="0 0 8 8"
                width="8"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
              >
                <path
                  d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
                ></path>
              </svg>
            `)
            expect(actual).to.equal(expected)
            expect(afterEach.callCount).to.equal(2)
            expect(afterEach.firstCall.args).to.have.lengthOf(2)
            expect(afterEach.firstCall.args[0]).to.be.a('null')
            expect(format(afterEach.firstCall.args[1].outerHTML)).to.equal(
              format(containerOne.innerHTML)
            )
            expect(afterEach.secondCall.args).to.have.lengthOf(2)
            expect(afterEach.secondCall.args[0]).to.be.a('null')
            expect(format(afterEach.secondCall.args[1].outerHTML)).to.equal(
              format(containerTwo.innerHTML)
            )
            done()
          },
          afterEach,
        })
      },
      afterEach,
    })
  })

  test('cached error', (done) => {
    const fakeXHR: sinon.SinonFakeXMLHttpRequestStatic = window.sinon.useFakeXMLHttpRequest()
    const requests: sinon.SinonFakeXMLHttpRequest[] = []
    fakeXHR.onCreate = (xhr) => {
      requests.push(xhr)
    }

    const containerOne = render(`
      <div
        class="inject-me"
        data-src="/fixtures/not-found.svg"
      ></div>
    `)

    SVGInjector(containerOne.querySelector('.inject-me'), {
      afterAll: (_) => {
        const containerTwo = render(`
          <div
            class="inject-me"
            data-src="/fixtures/not-found.svg"
          ></div>
        `)

        SVGInjector(containerTwo.querySelector('.inject-me'), {
          afterAll: () => {
            fakeXHR.restore()
            done()
          },
          afterEach: (error) => {
            expect(error)
              .to.be.a('error')
              .with.property(
                'message',
                'Unable to load SVG file: /fixtures/not-found.svg'
              )
          },
        })
      },
    })
    requests[0].respond(404, {}, '')
  })

  test('svg not found error', (done) => {
    const fakeXHR: sinon.SinonFakeXMLHttpRequestStatic = window.sinon.useFakeXMLHttpRequest()
    const requests: sinon.SinonFakeXMLHttpRequest[] = []
    fakeXHR.onCreate = (xhr) => {
      requests.push(xhr)
    }

    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/not-found.svg"
      ></div>
    `)

    const afterAll: AfterAll = (elementsLoaded) => {
      expect(elementsLoaded).to.equal(1)
      fakeXHR.restore()
      done()
    }

    const afterEach: Errback = (error) => {
      expect(error)
        .to.be.a('error')
        .with.property(
          'message',
          'Unable to load SVG file: /fixtures/not-found.svg'
        )
    }

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll,
      afterEach,
    })

    requests[0].respond(404, {}, '')
  })

  test('non-svg error', (done) => {
    const container = render(`
        <div
          class="inject-me"
        ></div>
      `)

    const afterAll: AfterAll = (elementsLoaded) => {
      expect(elementsLoaded).to.equal(1)
      done()
    }

    const afterEach: Errback = (error) => {
      expect(error)
        .to.be.a('error')
        .with.property(
          'message',
          'Attempted to inject a file with a non-svg extension: null'
        )
    }

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll,
      afterEach,
    })
  })

  test('unknown exception', (done) => {
    const fakeXHR: sinon.SinonFakeXMLHttpRequestStatic = window.sinon.useFakeXMLHttpRequest()
    const requests: sinon.SinonFakeXMLHttpRequest[] = []
    fakeXHR.onCreate = (xhr) => {
      requests.push(xhr)
    }

    const container = render(`
        <div
          class="inject-me"
          data-src="/fixtures/thumb-up.svg"
        ></div>
      `)

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll: (_) => {
        fakeXHR.restore()
        done()
      },
      afterEach: (error) => {
        expect(error)
          .to.be.a('error')
          .with.property(
            'message',
            'There was a problem injecting the SVG: 500 Internal Server Error'
          )
      },
    })

    requests[0].respond(500, {}, '<svg></svg>')
  })

  test('default `afterAll` callback', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up.svg"
      ></div>
    `)

    const afterEach: Errback = () => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          height="8"
          viewBox="0 0 8 8"
          width="8"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector(`.inject-me`), {
      afterEach,
    })
  })

  test('modifying SVG in `beforeEach`', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up.svg"
      ></div>
    `)

    const beforeEach: BeforeEach = (svg) => {
      svg.setAttribute('stroke', 'red')
    }

    const afterEach: Errback = () => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          height="8"
          stroke="red"
          viewBox="0 0 8 8"
          width="8"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector(`.inject-me`), {
      afterEach,
      beforeEach,
    })
  })
})
