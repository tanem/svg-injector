import SVGInjector from '../src/svg-injector'
import { DoneCallback } from '../src/types'
import * as uniqueId from '../src/unique-id'
import { cleanup, format, getActual, getElements, render } from './helpers'

suite('renumerate iri elements', () => {
  let uniqueIdStub: sinon.SinonStub

  setup(() => {
    uniqueIdStub = window.sinon.stub(uniqueId, 'default').returns(1)
  })

  teardown(() => {
    uniqueIdStub.restore()
    cleanup()
  })

  test('renumerateIRIElements: false', done => {
    render(['clip-path'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          class="injected-svg inject-me"
          data-src="/fixtures/clip-path.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <clipPath id="clipPathTest">
              <rect x="16" y="16" width="32" height="32" style="fill:white;"></rect>
            </clipPath>
            <clipPath id="clipPathTest2">
              <rect x="16" y="16" width="32" height="32" style="fill:white;"></rect>
            </clipPath>
          </defs>
          <circle
            cx="32"
            cy="32"
            r="18"
            stroke="1"
            style="fill:wheat;stroke:red;"
            clip-path="url(#clipPathTest)"
          ></circle>
          <circle
            cx="32"
            cy="32"
            r="18"
            stroke="1"
            style="fill:wheat;stroke:red;"
            clip-path="url(#clipPathTest2)"
          ></circle>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), {
      done: injectorDone,
      renumerateIRIElements: false
    })
  })

  test('clip-path', done => {
    render(['clip-path'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          class="injected-svg inject-me"
          data-src="/fixtures/clip-path.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <clipPath id="clipPathTest-1">
              <rect x="16" y="16" width="32" height="32" style="fill:white;"></rect>
            </clipPath>
            <clipPath id="clipPathTest2-1">
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
          <circle
            cx="32"
            cy="32"
            r="18"
            stroke="1"
            style="fill:wheat;stroke:red;"
            clip-path="url(#clipPathTest2-1)"
          ></circle>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('fill', done => {
    render(['fill'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/fill.svg"
          height="64"
          viewBox="0 0 64 64"
          width="64"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <linearGradient id="linear-gradient-1">
              <stop offset="5%" stop-color="#F60"></stop>
              <stop offset="95%" stop-color="#FF6"></stop>
            </linearGradient>
            <radialGradient
              cx="32"
              cy="32"
              gradientUnits="userSpaceOnUse"
              id="radial-gradient-1"
              r="32"
            >
              <stop offset="0%" stop-color="SlateGray"></stop>
              <stop offset="50%" stop-color="blue"></stop>
              <stop offset="100%" stop-color="olive"></stop>
            </radialGradient>
            <pattern
              height="20"
              id="pattern-1"
              patternUnits="userSpaceOnUse"
              width="20"
              x="0"
              y="0"
            >
              <circle cx="10" cy="10" r="10" style="stroke: none; fill: #0000ff"></circle>
            </pattern>
          </defs>
          <rect
            fill="url(#radial-gradient-1)"
            height="64"
            stroke="url(#linear-gradient-1)"
            stroke-width="5"
            width="64"
            x="0"
            y="0"
          ></rect>
          <circle
            cx="32"
            cy="32"
            fill="url(#linear-gradient-1)"
            r="18"
            stroke="url(#pattern-1)"
            stroke-width="4"
          ></circle>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('filter', done => {
    render(['filter'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/filter.svg"
          height="200"
          width="200"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <filter height="180" id="offset-1" width="180">
              <feOffset dx="60" dy="60" in="SourceGraphic"></feOffset>
            </filter>
          </defs>
          <rect fill="green" height="100" stroke="black" width="100" x="0" y="0"></rect>
          <rect
            fill="green"
            filter="url(#offset-1)"
            height="100"
            stroke="black"
            width="100"
            x="0"
            y="0"
          ></rect>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('marker', done => {
    render(['marker'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/marker.svg"
          height="64"
          viewBox="0 0 64 64"
          width="64"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <marker
              id="markerSquare-1"
              markerHeight="7"
              markerWidth="7"
              orient="auto"
              refX="4"
              refY="4"
            >
              <rect
                height="5"
                style="stroke: none; fill:#000000;"
                width="5"
                x="1"
                y="1"
              ></rect>
            </marker>
            <marker
              id="markerArrow-1"
              markerHeight="13"
              markerWidth="13"
              orient="auto"
              refX="2"
              refY="7"
            >
              <path d="M2,2 L2,13 L8,7 L2,2" style="fill: #000000;"></path>
            </marker>
          </defs>
          <path
            d="M10,10 l20,0 0,45 l20,0"
            marker-end="url(#markerArrow-1)"
            marker-mid="url(#markerSquare-1)"
            marker-start="url(#markerSquare-1)"
            style="stroke: #0000cc; stroke-width: 1px; fill: none;"
          ></path>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('mask', done => {
    render(['mask'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="64"
          height="64"
          viewBox="0 0 64 64"
          class="injected-svg inject-me"
          data-src="/fixtures/mask.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <mask id="MaskTest-1" x="0" y="0" width="100" height="100">
              <rect
                x="0"
                y="0"
                width="64"
                height="32"
                style="stroke:none; fill:white"
              ></rect>
            </mask>
          </defs>
          <rect x="1" y="1" width="64" height="64" stroke="none" fill="plum"></rect>
          <rect
            x="1"
            y="1"
            width="64"
            height="64"
            stroke="none"
            fill="gray"
            mask="url(#MaskTest-1)"
          ></rect>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('thumb-up', done => {
    render(['thumb-up'])
    const injectorDone: DoneCallback = _ => {
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
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test.skip('style', done => {
    render(['style'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          baseProfile="basic"
          width="223"
          height="222"
          class="injected-svg inject-me"
          data-src="/fixtures/style.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <linearGradient
              id="a-1"
              gradientUnits="userSpaceOnUse"
              x1="185.5"
              y1="145.75"
              x2="199.5"
              y2="145.75"
            >
              <stop offset="0%" stop-color="#FFF" stop-opacity="0"></stop>
              <stop offset="100%" stop-color="#FFF"></stop>
            </linearGradient>
          </defs>
          <g overflow="visible">
            <path fill="#3D91DF" d="M185.5 90.75v110h14v-110h-14z"></path>
            <path d="M199.5 200.75v-110h-14v110h14z" style="fill:url(#a-1)"></path>
          </g>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('dashboard', done => {
    render(['dashboard'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/dashboard.svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <path
              d="M0 10h8V0H0v10zm0 8h8v-6H0v6zm10 0h8V8h-8v10zm0-18v6h8V0h-8z"
              id="a-1"
            ></path>
          </defs>
          <g fill="none" fill-rule="evenodd">
            <path d="M0 0h24v24H0z"></path>
            <g transform="translate(3 3)">
              <mask fill="#fff" id="b-1">
                <use xlink:href="#a-1"></use>
              </mask>
              <use fill="#000" fill-opacity="0.7" xlink:href="#a-1"></use>
              <g mask="url(#b-1)">
                <path d="M-103-11535H-3v100h-100z" fill="#004876" fill-rule="nonzero"></path>
              </g>
            </g>
          </g>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('notifications', done => {
    render(['notifications'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/notifications.svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <path
              d="M8.5 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6.5-6V8.5c0-3.07-2.13-5.64-5-6.32V1.5C10 .67 9.33 0 8.5 0S7 .67 7 1.5v.68c-2.87.68-5 3.25-5 6.32V14l-2 2v1h17v-1l-2-2z"
              id="a-1"
            ></path>
          </defs>
          <g fill="none" fill-rule="evenodd">
            <path d="M0 0h24v24H0z"></path>
            <g transform="translate(3 2)">
              <mask fill="#fff" id="b-1">
                <use xlink:href="#a-1"></use>
              </mask>
              <use fill="#000" fill-opacity="0.7" xlink:href="#a-1"></use>
              <g mask="url(#b-1)">
                <path d="M-103-89406H-3v100h-100z" fill="#004876" fill-rule="nonzero"></path>
              </g>
            </g>
          </g>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })

  test('poll', done => {
    render(['poll'])
    const injectorDone: DoneCallback = _ => {
      const actual = format(getActual())
      const expected = format(`
        <svg
          class="injected-svg inject-me"
          data-src="/fixtures/poll.svg"
          height="24"
          viewBox="0 0 24 24"
          width="24"
          xmlns="http://www.w3.org/2000/svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <defs>
            <path
              d="M 16 0 H 2 C 0.9 0 0 0.9 0 2 v 14 c 0 1.1 0.9 2 2 2 h 14 c 1.1 0 2 -0.9 2 -2 V 2 c 0 -1.1 -0.9 -2 -2 -2 Z M 6 14 H 4 V 7 h 2 v 7 Z m 4 0 H 8 V 4 h 2 v 10 Z m 4 0 h -2 v -4 h 2 v 4 Z"
              id="a-1"
            ></path>
          </defs>
          <g fill="none" fill-rule="evenodd">
            <path d="M 0 0 h 24 v 24 H 0 Z"></path>
            <g transform="translate(3 3)">
              <mask fill="#fff" id="b-1">
                <use xlink:href="#a-1"></use>
              </mask>
              <use fill="#000" fill-opacity="0.7" xlink:href="#a-1"></use>
              <g mask="url(#b-1)">
                <path
                  d="M -103 -91019 H -3 v 100 h -100 Z"
                  fill="#004876"
                  fill-rule="nonzero"
                ></path>
              </g>
            </g>
          </g>
        </svg>
      `)
      expect(actual).to.equal(expected)
      done()
    }
    SVGInjector(getElements(), { done: injectorDone })
  })
})
