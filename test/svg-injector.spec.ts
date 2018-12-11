import * as sinon from 'sinon'
import SVGInjector from '../src/svg-injector'
import { DoneCallback, Errback } from '../src/types'
import * as uniqueId from '../src/unique-id'
import {
  cleanup,
  CONTAINER_ID,
  ELEMENT_CLASS,
  format,
  getActual,
  getElements,
  render
} from './helpers'

suite('svg injector', () => {
  let uniqueIdStub: sinon.SinonStub

  suiteSetup(() => {
    uniqueIdStub = sinon.stub(uniqueId, 'default').returns(1)
  })

  suiteTeardown(() => {
    uniqueIdStub.restore()
  })

  teardown(() => {
    cleanup()
  })

  test('single element', done => {
    render(['thumb-up'])
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="8"
          viewBox="0 0 8 8"
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      expect(each.callCount).to.equal(1)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(actual)
      expect(elementsLoaded).to.equal(1)
      done()
    }
    SVGInjector(document.querySelector(`.${ELEMENT_CLASS}`), {
      done: injectorDone,
      each
    })
  })

  test('multiple elements', done => {
    render(['thumb-up', 'thumb-up'])
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="8"
          viewBox="0 0 8 8"
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path></svg
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="8"
          viewBox="0 0 8 8"
          class="injected-svg inject-me"
          data-src="/fixtures/thumb-up.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <path
            d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      expect(each.callCount).to.equal(2)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(
        format(document.getElementsByTagName('svg')[0].outerHTML)
      )
      expect(each.secondCall.args).to.have.lengthOf(2)
      expect(each.secondCall.args[0]).to.be.a('null')
      expect(format(each.secondCall.args[1].outerHTML)).to.equal(
        format(document.getElementsByTagName('svg')[1].outerHTML)
      )
      expect(elementsLoaded).to.equal(2)
      done()
    }
    SVGInjector(getElements(), {
      done: injectorDone,
      each
    })
  })

  test('svg not found', done => {
    render(['not-found'])
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(elementsLoaded).to.equal(1)
      done()
    }
    const each: Errback = error => {
      expect(error)
        .to.be.a('error')
        .with.property(
          'message',
          'Unable to load SVG file: /fixtures/not-found.svg'
        )
    }
    SVGInjector(getElements(), {
      done: injectorDone,
      each
    })
  })

  test('null element', done => {
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(elementsLoaded).to.equal(0)
      expect(each.callCount).to.equal(0)
      done()
    }
    SVGInjector(null, {
      done: injectorDone,
      each
    })
  })

  test('no img url', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="${CONTAINER_ID}">
        <div class="${ELEMENT_CLASS}"></div>
      </div>
      `
    )
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(elementsLoaded).to.equal(1)
      done()
    }
    const each: Errback = error => {
      expect(error)
        .to.be.a('error')
        .with.property(
          'message',
          'Attempted to inject a file with a non-svg extension: null'
        )
    }
    SVGInjector(getElements(), {
      done: injectorDone,
      each
    })
  })

  test('injection in progress', () => {
    const fakeXHR: sinon.SinonFakeXMLHttpRequestStatic = sinon.useFakeXMLHttpRequest()
    const requests: sinon.SinonFakeXMLHttpRequest[] = []
    fakeXHR.onCreate = xhr => {
      requests.push(xhr)
    }
    render(['in-progress'])
    SVGInjector(getElements())
    SVGInjector(getElements())
    fakeXHR.restore()
  })

  test('class handling', done => {
    render(['classes'])
    const injectorDone: DoneCallback = () => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          class="svg-one svg-two injected-svg inject-me"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          data-src="/fixtures/classes.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <clipPath id="clipPathTest-1">
              <rect x="16" y="16" width="32" height="32" style="fill:white;"></rect>
            </clipPath>
          </defs>
          <circle
            cx="32"
            cy="32"
            r="18"
            stroke="1"
            style="fill:wheat;stroke:red;"
            clip-path="url(#clipPathTest-1)"
          ></circle>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('attribute handling', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="${CONTAINER_ID}">
        <div
          data-bar="bar"
          data-foo="foo"
          id="thumb-up"
          src="/fixtures/thumb-up.svg"
          style="height:20px;"
          title="thumb-up"
        ></div>
      </div>
      `
    )
    const injectorDone: DoneCallback = () => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="8"
          height="8"
          viewBox="0 0 8 8"
          id="thumb-up"
          title="thumb-up"
          class="injected-svg"
          style="height:20px;"
          data-bar="bar"
          data-foo="foo"
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
    SVGInjector(document.querySelectorAll('#thumb-up'), { done: injectorDone })
  })

  test('style tag', done => {
    render(['style-tag'])
    const injectorDone: DoneCallback = () => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="150"
          height="150"
          viewBox="0 0 100 100"
          class="injected-svg inject-me"
          data-src="/fixtures/style-tag.svg"
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
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('cached errors', done => {
    const fakeXHR: sinon.SinonFakeXMLHttpRequestStatic = sinon.useFakeXMLHttpRequest()
    const requests: sinon.SinonFakeXMLHttpRequest[] = []
    fakeXHR.onCreate = xhr => {
      requests.push(xhr)
    }
    render(['not-found'])
    SVGInjector(getElements(), {
      done: _ => {
        render(['not-found'])
        SVGInjector(getElements(), {
          // tslint:disable-next-line:no-shadowed-variable
          done: _ => done(),
          each: error => {
            expect(error)
              .to.be.a('error')
              .with.property(
                'message',
                'Unable to load SVG file: /fixtures/not-found.svg'
              )
          }
        })
        fakeXHR.restore()
      }
    })
    requests[0].respond(404, {}, '')
  })
})
