import SVGInjector from '../src/svg-injector'
import { AfterAll } from '../src/types'
import * as uniqueId from '../src/unique-id'
import { cleanup, format, render } from './helpers/test-utils'

suite('eval scripts', () => {
  let container: HTMLDivElement
  let logStub: sinon.SinonStub
  let uniqueIdStub: sinon.SinonStub

  setup(() => {
    uniqueIdStub = window.sinon.stub(uniqueId, 'default').returns(1)
    logStub = window.sinon.stub(console, 'log')
    container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/script.svg"
      ></div>
      <div
        class="inject-me"
        data-src="/fixtures/script.svg"
      ></div>
    `)
  })

  teardown(() => {
    uniqueIdStub.restore()
    logStub.restore()
    cleanup()
  })

  test('never', (done) => {
    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle></svg
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle></svg
        >
      `)
      expect(actual).to.equal(expected)
      expect(logStub.callCount).to.equal(0)
      done()
    }
    SVGInjector(container.querySelectorAll('.inject-me'), {
      afterAll,
      evalScripts: 'never',
    })
  })

  test('once', (done) => {
    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle></svg
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle></svg
        >
      `)
      expect(actual).to.equal(expected)
      expect(logStub.callCount).to.equal(4)
      done()
    }
    SVGInjector(container.querySelectorAll('.inject-me'), {
      afterAll,
      evalScripts: 'once',
    })
  })

  test('always', (done) => {
    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle></svg
        ><svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle></svg
        >
      `)
      expect(actual).to.equal(expected)
      expect(logStub.callCount).to.equal(8)
      done()
    }
    SVGInjector(container.querySelectorAll('.inject-me'), {
      afterAll,
      evalScripts: 'always',
    })
  })
})
