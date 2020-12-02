import { UAParser } from 'ua-parser-js'
import SVGInjector from '../src/svg-injector'
import { AfterAll } from '../src/types'
import * as uniqueId from '../src/unique-id'
import { cleanup, format, render } from './helpers/test-utils'

const parser = new UAParser()
const { name: browser } = parser.getBrowser()
if (!browser) {
  throw new Error('Unable to determine browser name')
}

suite('renumerate iri elements', () => {
  let uniqueIdStub: sinon.SinonStub

  setup(() => {
    uniqueIdStub = window.sinon.stub(uniqueId, 'default').returns(1)
  })

  teardown(() => {
    uniqueIdStub.restore()
    cleanup()
  })

  test('renumerateIRIElements: false', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/clip-path.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 64 64" width="64" height="64" data-src="/fixtures/clip-path.svg" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="clipPathTest"><rect style="fill: white;" x="16" y="16" width="32" height="32" /></clipPath><clipPath id="clipPathTest2"><rect style="fill: white;" x="16" y="16" width="32" height="32" /></clipPath></defs><circle style="fill: wheat; stroke: red;" clip-path="url(&quot;#clipPathTest&quot;)" stroke="1" cx="32" cy="32" r="18" /><circle style="fill: wheat; stroke: red;" clip-path="url(&quot;#clipPathTest2&quot;)" stroke="1" cx="32" cy="32" r="18" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/clip-path.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="clipPathTest"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath><clipPath id="clipPathTest2"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath></defs><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest)"></circle><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest2)"></circle></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), {
      afterAll,
      renumerateIRIElements: false,
    })
  })

  test('clip-path', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/clip-path.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 64 64" width="64" height="64" data-src="/fixtures/clip-path.svg" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="clipPathTest-1"><rect style="fill: white;" x="16" y="16" width="32" height="32" /></clipPath><clipPath id="clipPathTest2-1"><rect style="fill: white;" x="16" y="16" width="32" height="32" /></clipPath></defs><circle style="fill: wheat; stroke: red;" clip-path="url(&quot;#clipPathTest-1&quot;)" stroke="1" cx="32" cy="32" r="18" /><circle style="fill: wheat; stroke: red;" clip-path="url(&quot;#clipPathTest2-1&quot;)" stroke="1" cx="32" cy="32" r="18" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/clip-path.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><clipPath id="clipPathTest-1"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath><clipPath id="clipPathTest2-1"><rect x="16" y="16" width="32" height="32" style="fill:white;"></rect></clipPath></defs><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest-1)"></circle><circle cx="32" cy="32" r="18" stroke="1" style="fill:wheat;stroke:red;" clip-path="url(#clipPathTest2-1)"></circle></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('fill', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/fill.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 64 64" width="64" height="64" data-src="/fixtures/fill.svg" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="linear-gradient-1"><stop stop-color="#f60" offset="5%" /><stop stop-color="#ff6" offset="95%" /></linearGradient><radialGradient id="radial-gradient-1" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="32"><stop stop-color="slategray" offset="0%" /><stop stop-color="blue" offset="50%" /><stop stop-color="olive" offset="100%" /></radialGradient><pattern id="pattern-1" patternUnits="userSpaceOnUse" x="0" y="0" width="20" height="20"><circle style="fill: #0000ff; stroke: none;" cx="10" cy="10" r="10" /></pattern></defs><rect fill="url(#radial-gradient-1)" stroke="url(#linear-gradient-1)" stroke-width="5" x="0" y="0" width="64" height="64" /><circle fill="url(#linear-gradient-1)" stroke="url(#pattern-1)" stroke-width="4" cx="32" cy="32" r="18" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/fill.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><linearGradient id="linear-gradient-1"><stop offset="5%" stop-color="#F60"></stop><stop offset="95%" stop-color="#FF6"></stop></linearGradient><radialGradient id="radial-gradient-1" gradientUnits="userSpaceOnUse" cx="32" cy="32" r="32"><stop offset="0%" stop-color="SlateGray"></stop><stop offset="50%" stop-color="blue"></stop><stop offset="100%" stop-color="olive"></stop></radialGradient><pattern id="pattern-1" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse"><circle cx="10" cy="10" r="10" style="stroke: none; fill: #0000ff"></circle></pattern></defs><rect x="0" y="0" width="64" height="64" stroke-width="5" stroke="url(#linear-gradient-1)" fill="url(#radial-gradient-1)"></rect><circle cx="32" cy="32" r="18" stroke-width="4" stroke="url(#pattern-1)" fill="url(#linear-gradient-1)"></circle></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('filter', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/filter.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" width="200" height="200" data-src="/fixtures/filter.svg" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><defs><filter id="offset-1" width="180" height="180"><feOffset in="SourceGraphic" dx="60" dy="60" /></filter></defs><rect fill="green" stroke="black" x="0" y="0" width="100" height="100" /><rect filter="url(&quot;#offset-1&quot;)" fill="green" stroke="black" x="0" y="0" width="100" height="100" /></svg>'
          : browser === 'Firefox'
          ? '<svg width="200" height="200" xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" data-src="/fixtures/filter.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><filter id="offset-1" width="180" height="180"><feOffset in="SourceGraphic" dx="60" dy="60"></feOffset></filter></defs><rect x="0" y="0" width="100" height="100" stroke="black" fill="green"></rect><rect x="0" y="0" width="100" height="100" stroke="black" fill="green" filter="url(#offset-1)"></rect></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" class="injected-svg inject-me" data-src="/fixtures/filter.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><filter id="offset-1" width="180" height="180"><feOffset in="SourceGraphic" dx="60" dy="60"></feOffset></filter></defs><rect x="0" y="0" width="100" height="100" stroke="black" fill="green"></rect><rect x="0" y="0" width="100" height="100" stroke="black" fill="green" filter="url(#offset-1)"></rect></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('marker', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/marker.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 64 64" width="64" height="64" data-src="/fixtures/marker.svg" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><defs><marker id="markerSquare-1" refX="4" refY="4" markerWidth="7" markerHeight="7" orient="auto"><rect style="fill: #000000; stroke: none;" x="1" y="1" width="5" height="5" /></marker><marker id="markerArrow-1" refX="2" refY="7" markerWidth="13" markerHeight="13" orient="auto"><path style="fill: #000000;" d="M 2 2 L 2 13 L 8 7 L 2 2" /></marker></defs><path style="fill: none; stroke: #0000cc; stroke-width: 1px;" marker-end="url(&quot;#markerArrow-1&quot;)" marker-mid="url(&quot;#markerSquare-1&quot;)" marker-start="url(&quot;#markerSquare-1&quot;)" d="M 10 10 l 20 0 l 0 45 l 20 0" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/marker.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><marker id="markerSquare-1" markerWidth="7" markerHeight="7" refX="4" refY="4" orient="auto"><rect x="1" y="1" width="5" height="5" style="stroke: none; fill:#000000;"></rect></marker><marker id="markerArrow-1" markerWidth="13" markerHeight="13" refX="2" refY="7" orient="auto"><path d="M2,2 L2,13 L8,7 L2,2" style="fill: #000000;"></path></marker></defs><path d="M10,10 l20,0 0,45 l20,0" style="stroke: #0000cc; stroke-width: 1px; fill: none;" marker-start="url(#markerSquare-1)" marker-mid="url(#markerSquare-1)" marker-end="url(#markerArrow-1)"></path></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('mask', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/mask.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 64 64" width="64" height="64" data-src="/fixtures/mask.svg" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><defs><mask id="MaskTest-1" x="0" y="0" width="100" height="100"><rect style="fill: white; stroke: none;" x="0" y="0" width="64" height="32" /></mask></defs><rect fill="plum" stroke="none" x="1" y="1" width="64" height="64" /><rect fill="gray" mask="url(&quot;#MaskTest-1&quot;)" stroke="none" x="1" y="1" width="64" height="64" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" class="injected-svg inject-me" data-src="/fixtures/mask.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><defs><mask id="MaskTest-1" x="0" y="0" width="100" height="100"><rect x="0" y="0" width="64" height="32" style="stroke:none; fill:white"></rect></mask></defs><rect x="1" y="1" width="64" height="64" stroke="none" fill="plum"></rect><rect x="1" y="1" width="64" height="64" stroke="none" fill="gray" mask="url(#MaskTest-1)"></rect></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('thumb-up', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/thumb-up.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 8 8" width="8" height="8" data-src="/fixtures/thumb-up.svg" xmlns:NS1="" NS1:xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M 4.47 0 c -0.19 0.02 -0.37 0.15 -0.47 0.34 c -0.13 0.26 -1.09 2.19 -1.28 2.38 c -0.19 0.19 -0.44 0.28 -0.72 0.28 v 4 h 3.5 c 0.21 0 0.39 -0.13 0.47 -0.31 c 0 0 1.03 -2.91 1.03 -3.19 c 0 -0.28 -0.22 -0.5 -0.5 -0.5 h -1.5 c -0.28 0 -0.5 -0.25 -0.5 -0.5 s 0.39 -1.58 0.47 -1.84 c 0.08 -0.26 -0.05 -0.54 -0.31 -0.63 c -0.07 -0.02 -0.12 -0.04 -0.19 -0.03 Z m -4.47 3 v 4 h 1 v -4 h -1 Z" /></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" class="injected-svg inject-me" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink"><path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test.skip('style', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/style.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected = browser === 'IE' ? '' : ''
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('dashboard', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/dashboard.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 24 24" width="24" height="24" data-src="/fixtures/dashboard.svg"><defs><path id="a-1" d="M 0 10 h 8 V 0 H 0 v 10 Z m 0 8 h 8 v -6 H 0 v 6 Z m 10 0 h 8 V 8 h -8 v 10 Z m 0 -18 v 6 h 8 V 0 h -8 Z" /></defs><g fill="none" fill-rule="evenodd"><path d="M 0 0 h 24 v 24 H 0 Z" /><g transform="translate(3 3)"><mask id="b-1" fill="#fff"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#a-1" /></mask><use fill="#000" fill-opacity="0.7" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#a-1" /><g mask="url(&quot;#b-1&quot;)"><path fill="#004876" fill-rule="nonzero" d="M -103 -11535 H -3 v 100 h -100 Z" /></g></g></g></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" class="injected-svg inject-me" data-src="/fixtures/dashboard.svg"><defs><path id="a-1" d="M0 10h8V0H0v10zm0 8h8v-6H0v6zm10 0h8V8h-8v10zm0-18v6h8V0h-8z"></path></defs><g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"></path><g transform="translate(3 3)"><mask id="b-1" fill="#fff"><use xlink:href="#a-1"></use></mask><use fill="#000" fill-opacity=".7" xlink:href="#a-1"></use><g mask="url(#b-1)"><path fill="#004876" fill-rule="nonzero" d="M-103-11535H-3v100h-100z"></path></g></g></g></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('notifications', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/notifications.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 24 24" width="24" height="24" data-src="/fixtures/notifications.svg"><defs><path id="a-1" d="M 8.5 20 c 1.1 0 2 -0.9 2 -2 h -4 c 0 1.1 0.9 2 2 2 Z m 6.5 -6 V 8.5 c 0 -3.07 -2.13 -5.64 -5 -6.32 V 1.5 C 10 0.67 9.33 0 8.5 0 S 7 0.67 7 1.5 v 0.68 c -2.87 0.68 -5 3.25 -5 6.32 V 14 l -2 2 v 1 h 17 v -1 l -2 -2 Z" /></defs><g fill="none" fill-rule="evenodd"><path d="M 0 0 h 24 v 24 H 0 Z" /><g transform="translate(3 2)"><mask id="b-1" fill="#fff"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#a-1" /></mask><use fill="#000" fill-opacity="0.7" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#a-1" /><g mask="url(&quot;#b-1&quot;)"><path fill="#004876" fill-rule="nonzero" d="M -103 -89406 H -3 v 100 h -100 Z" /></g></g></g></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="24" height="24" viewBox="0 0 24 24" class="injected-svg inject-me" data-src="/fixtures/notifications.svg"><defs><path id="a-1" d="M8.5 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6.5-6V8.5c0-3.07-2.13-5.64-5-6.32V1.5C10 .67 9.33 0 8.5 0S7 .67 7 1.5v.68c-2.87.68-5 3.25-5 6.32V14l-2 2v1h17v-1l-2-2z"></path></defs><g fill="none" fill-rule="evenodd"><path d="M0 0h24v24H0z"></path><g transform="translate(3 2)"><mask id="b-1" fill="#fff"><use xlink:href="#a-1"></use></mask><use fill="#000" fill-opacity=".7" xlink:href="#a-1"></use><g mask="url(#b-1)"><path fill="#004876" fill-rule="nonzero" d="M-103-89406H-3v100h-100z"></path></g></g></g></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })

  test('poll', (done) => {
    const container = render(`
      <div
        class="inject-me"
        data-src="/fixtures/poll.svg"
      ></div>
    `)

    const afterAll: AfterAll = () => {
      const actual = format(container.innerHTML)
      const expected =
        browser === 'IE'
          ? '<svg xmlns="http://www.w3.org/2000/svg" class="injected-svg inject-me" viewBox="0 0 24 24" width="24" height="24" data-src="/fixtures/poll.svg"><defs><path id="a-1" d="M 16 0 H 2 C 0.9 0 0 0.9 0 2 v 14 c 0 1.1 0.9 2 2 2 h 14 c 1.1 0 2 -0.9 2 -2 V 2 c 0 -1.1 -0.9 -2 -2 -2 Z M 6 14 H 4 V 7 h 2 v 7 Z m 4 0 H 8 V 4 h 2 v 10 Z m 4 0 h -2 v -4 h 2 v 4 Z" /></defs><g fill="none" fill-rule="evenodd"><path d="M 0 0 h 24 v 24 H 0 Z" /><g transform="translate(3 3)"><mask id="b-1" fill="#fff"><use xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#a-1" /></mask><use fill="#000" fill-opacity="0.7" xmlns:xlink="http://www.w3.org/1999/xlink" xlink:href="#a-1" /><g mask="url(&quot;#b-1&quot;)"><path fill="#004876" fill-rule="nonzero" d="M -103 -91019 H -3 v 100 h -100 Z" /></g></g></g></svg>'
          : browser === 'Firefox'
          ? '<svg height="24" viewBox="0 0 24 24" width="24" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" class="injected-svg inject-me" data-src="/fixtures/poll.svg"><defs><path d="M 16 0 H 2 C 0.9 0 0 0.9 0 2 v 14 c 0 1.1 0.9 2 2 2 h 14 c 1.1 0 2 -0.9 2 -2 V 2 c 0 -1.1 -0.9 -2 -2 -2 Z M 6 14 H 4 V 7 h 2 v 7 Z m 4 0 H 8 V 4 h 2 v 10 Z m 4 0 h -2 v -4 h 2 v 4 Z" id="a-1"></path></defs><g fill="none" fill-rule="evenodd"><path d="M 0 0 h 24 v 24 H 0 Z"></path><g transform="translate(3 3)"><mask fill="#fff" id="b-1"><use xlink:href="#a-1"></use></mask><use fill="#000" fill-opacity="0.7" xlink:href="#a-1"></use><g mask="url(#b-1)"><path d="M -103 -91019 H -3 v 100 h -100 Z" fill="#004876" fill-rule="nonzero"></path></g></g></g></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" height="24" viewBox="0 0 24 24" width="24" class="injected-svg inject-me" data-src="/fixtures/poll.svg"><defs><path d="M 16 0 H 2 C 0.9 0 0 0.9 0 2 v 14 c 0 1.1 0.9 2 2 2 h 14 c 1.1 0 2 -0.9 2 -2 V 2 c 0 -1.1 -0.9 -2 -2 -2 Z M 6 14 H 4 V 7 h 2 v 7 Z m 4 0 H 8 V 4 h 2 v 10 Z m 4 0 h -2 v -4 h 2 v 4 Z" id="a-1"></path></defs><g fill="none" fill-rule="evenodd"><path d="M 0 0 h 24 v 24 H 0 Z"></path><g transform="translate(3 3)"><mask fill="#fff" id="b-1"><use xlink:href="#a-1"></use></mask><use fill="#000" fill-opacity="0.7" xlink:href="#a-1"></use><g mask="url(#b-1)"><path d="M -103 -91019 H -3 v 100 h -100 Z" fill="#004876" fill-rule="nonzero"></path></g></g></g></svg>'
      expect(actual).to.equal(expected)
      done()
    }

    SVGInjector(container.querySelector('.inject-me'), { afterAll })
  })
})
