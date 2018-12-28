import * as sinon from 'sinon'
import * as hasSvgSupport from '../src/has-svg-support'
import SVGInjector from '../src/svg-injector'
import { DoneCallback, Errback } from '../src/types'
import { cleanup, format, getActual, getElements } from './helpers'

suite('png fallback', () => {
  let hasSvgSupportStub: sinon.SinonStub

  suiteSetup(() => {
    // @ts-ignore
    hasSvgSupportStub = sinon.stub(hasSvgSupport, 'default').returns(false)
  })

  suiteTeardown(() => {
    hasSvgSupportStub.restore()
  })

  teardown(() => {
    cleanup()
  })

  test('data-fallback', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="container">
        <img id="one" class="inject-me" src="/fixtures/cursor.svg" data-fallback="/fixtures/cursor.png">
      </div>
      `
    )
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <img id="one" class="inject-me" src="/fixtures/cursor.png" data-fallback="/fixtures/cursor.png">
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), {
      done: injectorDone
    })
  })

  test('data-png', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="container">
        <img id="one" class="inject-me" src="/fixtures/cursor.svg" data-png="/fixtures/cursor.png">
      </div>
      `
    )
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <img id="one" class="inject-me" src="/fixtures/cursor.png" data-png="/fixtures/cursor.png">
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), {
      done: injectorDone
    })
  })

  test('pngFallback', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="container">
        <img id="one" class="inject-me" src="/fixtures/cursor.svg">
      </div>
      `
    )
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <img id="one" class="inject-me" src="/fixtures/cursor.png">
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), {
      done: injectorDone,
      pngFallback: '/fixtures'
    })
  })

  test('no fallback', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="container">
        <img id="one" class="inject-me" src="/fixtures/cursor.svg">
      </div>
      `
    )
    const injectorDone: DoneCallback = _ => done()
    const each: Errback = error => {
      expect(error)
        .to.be.a('error')
        .with.property(
          'message',
          'This browser does not support SVG and no PNG fallback was defined.'
        )
    }
    SVGInjector(getElements(), {
      done: injectorDone,
      each
    })
  })
})
