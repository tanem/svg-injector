import * as isLocal from '../src/is-local'
import SVGInjector from '../src/svg-injector'
import { DoneCallback, Errback } from '../src/types'
import * as uniqueId from '../src/unique-id'
import {
  cleanup,
  ELEMENT_CLASS,
  format,
  getActual,
  getElements,
  render
} from './helpers'

suite('local', () => {
  let uniqueIdStub: sinon.SinonStub
  let isLocalStub: sinon.SinonStub

  suiteSetup(() => {
    uniqueIdStub = window.sinon.stub(uniqueId, 'default').returns(1)
    isLocalStub = window.sinon.stub(isLocal, 'default').returns(true)
  })

  suiteTeardown(() => {
    uniqueIdStub.restore()
    isLocalStub.restore()
  })

  teardown(() => {
    cleanup()
  })

  test('not found', done => {
    render(['local-not-found'])
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(elementsLoaded).to.equal(1)
      done()
    }
    const each: Errback = error => {
      expect(error)
        .to.be.a('error')
        .with.property(
          'message',
          'Note: SVG injection ajax calls do not work locally without adjusting security setting in your browser. Or consider using a local webserver.'
        )
    }
    SVGInjector(getElements(), {
      done: injectorDone,
      each
    })
  })

  test('ok', done => {
    const fakeXHR: sinon.SinonFakeXMLHttpRequestStatic = window.sinon.useFakeXMLHttpRequest()
    const requests: sinon.SinonFakeXMLHttpRequest[] = []
    fakeXHR.onCreate = xhr => {
      requests.push(xhr)
    }
    render(['thumb-up'])
    const each = window.sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      const actual = format(getActual())
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
      expect(each.callCount).to.equal(1)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(actual)
      expect(elementsLoaded).to.equal(1)
      fakeXHR.restore()
      done()
    }
    SVGInjector(document.querySelector(`.${ELEMENT_CLASS}`), {
      done: injectorDone,
      each
    })

    requests[0].respond(
      0,
      {},
      `
      <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8">
        <path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z" />
      </svg>
      `
    )
  })
})
