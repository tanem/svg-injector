import htmlParser from 'prettier/parser-html'
import prettier from 'prettier/standalone'
import * as sinon from 'sinon'
import SVGInjector from '../src/svg-injector'
import { DoneCallback, Errback } from '../src/types'
import * as uniqueId from '../src/unique-id'

sinon.stub(uniqueId, 'default').returns(1)

const render = (name: string) => {
  document.body.insertAdjacentHTML(
    'beforeend',
    `<div id="container"><div class="div-one div-two" id="inject-me" data-src="/fixtures/${name}.svg" /></div>`
  )
}

const format = (svg: string) =>
  // @ts-ignore
  prettier.format(svg, { parser: 'html', plugins: [htmlParser] })

const cleanup = () => {
  document.body.removeChild(document.getElementById('container')!)
}

/*
interface IOptionalArgs {
  done?: (elementsLoaded: number) => void
  each?: Errback
  evalScripts?: 'always' | 'once' | 'never'
  pngFallback?: string
  renumerateIRIElements?: boolean
}
*/

describe('SVGInjector', () => {
  let logStub: sinon.SinonStub

  beforeEach(() => {
    logStub = sinon.stub(console, 'log')
  })

  afterEach(() => {
    logStub.restore()
  })

  it('handles single elements', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
      <div id="container">
        <div id="one" class="inject-me" data-src="/fixtures/thumb-up.svg" />
      </div>
    `
    )
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(each.callCount).to.equal(1)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(
        format(`
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" id="one" class="injected-svg inject-me" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path>
        </svg>
      `)
      )
      expect(elementsLoaded).to.equal(1)
      cleanup()
      done()
    }
    SVGInjector(document.querySelectorAll('.inject-me'), {
      done: injectorDone,
      each
    })
  })

  it('handles multiple elements', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
    <div id="container">
      <div id="one" class="inject-me" data-src="/fixtures/thumb-up.svg" />
      <div id="two" class="inject-me" data-src="/fixtures/thumb-up.svg" />
    </div>
    `
    )
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(each.callCount).to.equal(2)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(
        format(`
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" id="one" class="injected-svg inject-me" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path>
        </svg>
      `)
      )
      expect(each.secondCall.args).to.have.lengthOf(2)
      expect(each.secondCall.args[0]).to.be.a('null')
      expect(format(each.secondCall.args[1].outerHTML)).to.equal(
        format(`
        <svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8" id="two" class="injected-svg inject-me" data-src="/fixtures/thumb-up.svg" xmlns:xlink="http://www.w3.org/1999/xlink">
          <path d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"></path>
        </svg>
      `)
      )
      expect(elementsLoaded).to.equal(2)
      cleanup()
      done()
    }
    SVGInjector(document.querySelectorAll('.inject-me'), {
      done: injectorDone,
      each
    })
  })

  it('handles errors', done => {
    render('notfound')
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(elementsLoaded).to.equal(1)
      cleanup()
      done()
    }
    const each: Errback = error => {
      expect(error)
        .to.be.a('error')
        .with.property(
          'message',
          'Unable to load SVG file: /fixtures/notfound.svg'
        )
    }
    SVGInjector(document.getElementById('inject-me'), {
      done: injectorDone,
      each
    })
  })

  it('handles script execution: never', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
    <div id="container">
      <div id="one" class="inject-me" data-src="/fixtures/script.svg" />
    </div>
    `
    )
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(each.callCount).to.equal(1)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(
        format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          id="one"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle>
        </svg>
      `)
      )

      expect(elementsLoaded).to.equal(1)
      cleanup()
      done()
    }
    SVGInjector(document.querySelectorAll('.inject-me'), {
      done: injectorDone,
      each,
      evalScripts: 'never'
    })
  })

  it('handles script execution: once', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
    <div id="container">
      <div id="one" class="inject-me" data-src="/fixtures/script.svg" />
    </div>
    `
    )
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(each.callCount).to.equal(1)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(
        format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          id="one"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle>
        </svg>
      `)
      )

      expect(logStub.callCount).to.equal(1)
      expect(logStub.firstCall.args).to.deep.equal(['ran script'])

      expect(elementsLoaded).to.equal(1)

      cleanup()
      done()
    }
    SVGInjector(document.querySelectorAll('.inject-me'), {
      done: injectorDone,
      each,
      evalScripts: 'once'
    })
  })

  it('handles script execution: always', done => {
    document.body.insertAdjacentHTML(
      'beforeend',
      `
    <div id="container">
      <div id="one" class="inject-me" data-src="/fixtures/script.svg" />
      <div id="two" class="inject-me" data-src="/fixtures/script.svg" />
    </div>
    `
    )
    const each = sinon.stub()
    const injectorDone: DoneCallback = elementsLoaded => {
      expect(each.callCount).to.equal(2)
      expect(each.firstCall.args).to.have.lengthOf(2)
      expect(each.firstCall.args[0]).to.be.a('null')
      expect(format(each.firstCall.args[1].outerHTML)).to.equal(
        format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          id="one"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle>
        </svg>
      `)
      )
      expect(each.secondCall.args).to.have.lengthOf(2)
      expect(each.secondCall.args[0]).to.be.a('null')
      expect(format(each.secondCall.args[1].outerHTML)).to.equal(
        format(`
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          id="two"
          class="injected-svg inject-me"
          data-src="/fixtures/script.svg"
          xmlns:xlink="http://www.w3.org/1999/xlink"
        >
          <circle cx="50" cy="50" r="15" fill="green"></circle>
        </svg>
      `)
      )

      expect(logStub.callCount).to.equal(2)
      expect(logStub.firstCall.args).to.deep.equal(['ran script'])
      expect(logStub.secondCall.args).to.deep.equal(['ran script'])

      expect(elementsLoaded).to.equal(2)

      cleanup()
      done()
    }
    SVGInjector(document.querySelectorAll('.inject-me'), {
      done: injectorDone,
      each,
      evalScripts: 'always'
    })
  })

  /*
test('classes', done => {
  render('classes')
  const each = (error: Error | null) => {
    expect(error).to.be.a('null')
    // const actual = format(svg!.outerHTML)
    console.log(document.getElementById('inject-me'))
    // const expected = format(`
    //   <svg
    //     xmlns="http://www.w3.org/2000/svg"
    //     class="svg-one svg-two injected-svg div-one div-two"
    //     width="64"
    //     height="64"
    //     viewBox="0 0 64 64"
    //     id="inject-me"
    //     data-src="/fixtures/classes.svg"
    //     xmlns:xlink="http://www.w3.org/1999/xlink"
    //   >
    //     <defs>
    //       <clipPath id="clipPathTest-1">
    //         <rect x="16" y="16" width="32" height="32" style="fill:white;"></rect>
    //       </clipPath>
    //     </defs>
    //     <circle
    //       cx="32"
    //       cy="32"
    //       r="18"
    //       stroke="1"
    //       style="fill:wheat;stroke:red;"
    //       clip-path="url(#clipPathTest-1)"
    //     ></circle>
    //   </svg>
    // `)
    // expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('clip-path', done => {
  render('clip-path')
  const each = (error: Error | null, svg?: SVGSVGElement) => {
    expect(error).to.be.a('null')
    const actual = format(svg!.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        id="inject-me"
        class="injected-svg div-one div-two"
        data-src="/fixtures/clip-path.svg"
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
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('fill', done => {
  render('fill')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        id="inject-me"
        class="injected-svg"
        data-src="/fixtures/fill.svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <linearGradient id="linear-gradient-1">
            <stop offset="5%" stop-color="#F60"></stop>
            <stop offset="95%" stop-color="#FF6"></stop>
          </linearGradient>
          <radialGradient
            id="radial-gradient-1"
            gradientUnits="userSpaceOnUse"
            cx="32"
            cy="32"
            r="32"
          >
            <stop offset="0%" stop-color="SlateGray"></stop>
            <stop offset="50%" stop-color="blue"></stop>
            <stop offset="100%" stop-color="olive"></stop>
          </radialGradient>
          <pattern
            id="pattern-1"
            x="0"
            y="0"
            width="20"
            height="20"
            patternUnits="userSpaceOnUse"
          >
            <circle
              cx="10"
              cy="10"
              r="10"
              style="stroke: none; fill: #0000ff"
            ></circle>
          </pattern>
        </defs>
        <rect
          x="0"
          y="0"
          width="64"
          height="64"
          stroke-width="5"
          stroke="url(#linear-gradient-1)"
          fill="url(#radial-gradient-1)"
        ></rect>
        <circle
          cx="32"
          cy="32"
          r="18"
          stroke-width="4"
          stroke="url(#pattern-1)"
          fill="url(#linear-gradient-1)"
        ></circle>
      </svg>
    `)
    expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('filter', done => {
  render('filter')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        id="inject-me"
        class="injected-svg"
        data-src="/fixtures/filter.svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <filter id="blurFilter-1">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3"></feGaussianBlur>
          </filter>
        </defs>
        <circle
          cx="32"
          cy="32"
          r="18"
          stroke="none"
          fill="olive"
          filter="url(#blurFilter-1)"
        ></circle>
        <circle cx="32" cy="32" r="10" stroke="none" fill="silver"></circle>
      </svg>
    `)
    expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('marker', done => {
  render('marker')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        id="inject-me"
        class="injected-svg"
        data-src="/fixtures/marker.svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <defs>
          <marker
            id="markerSquare-1"
            markerWidth="7"
            markerHeight="7"
            refX="4"
            refY="4"
            orient="auto"
          >
            <rect
              x="1"
              y="1"
              width="5"
              height="5"
              style="stroke: none; fill:#000000;"
            ></rect>
          </marker>
          <marker
            id="markerArrow-1"
            markerWidth="13"
            markerHeight="13"
            refX="2"
            refY="7"
            orient="auto"
          >
            <path d="M2,2 L2,13 L8,7 L2,2" style="fill: #000000;"></path>
          </marker>
        </defs>
        <path
          d="M10,10 l20,0 0,45 l20,0"
          style="stroke: #0000cc; stroke-width: 1px; fill: none;"
          marker-start="url(#markerSquare-1)"
          marker-mid="url(#markerSquare-1)"
          marker-end="url(#markerArrow-1)"
        ></path>
      </svg>
    `)
    expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('mask', done => {
  render('mask')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="64"
        height="64"
        viewBox="0 0 64 64"
        id="inject-me"
        class="injected-svg"
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
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('thumb-up', done => {
  render('thumb-up')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="8"
        height="8"
        viewBox="0 0 8 8"
        id="inject-me"
        class="injected-svg"
        data-src="/fixtures/thumb-up.svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
      >
        <path
          d="M4.47 0c-.19.02-.37.15-.47.34-.13.26-1.09 2.19-1.28 2.38-.19.19-.44.28-.72.28v4h3.5c.21 0 .39-.13.47-.31 0 0 1.03-2.91 1.03-3.19 0-.28-.22-.5-.5-.5h-1.5c-.28 0-.5-.25-.5-.5s.39-1.58.47-1.84c.08-.26-.05-.54-.31-.63-.07-.02-.12-.04-.19-.03zm-4.47 3v4h1v-4h-1z"
        ></path>
      </svg>
    `)
    expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test.skip('style', done => {
  render('style')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        baseProfile="basic"
        width="223"
        height="222"
        id="inject-me"
        class="injected-svg"
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
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('dashboard', done => {
  render('dashboard')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        id="inject-me"
        class="injected-svg"
        data-src="/fixtures/dashboard.svg"
      >
        <defs>
          <path
            id="a-1"
            d="M0 10h8V0H0v10zm0 8h8v-6H0v6zm10 0h8V8h-8v10zm0-18v6h8V0h-8z"
          ></path>
        </defs>
        <g fill="none" fill-rule="evenodd">
          <path d="M0 0h24v24H0z"></path>
          <g transform="translate(3 3)">
            <mask id="b-1" fill="#fff"><use xlink:href="#a-1"></use></mask>
            <use fill="#000" fill-opacity=".7" xlink:href="#a-1"></use>
            <g mask="url(#b-1)">
              <path
                fill="#004876"
                fill-rule="nonzero"
                d="M-103-11535H-3v100h-100z"
              ></path>
            </g>
          </g>
        </g>
      </svg>
    `)
    expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('notifications', done => {
  render('notifications')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        id="inject-me"
        class="injected-svg"
        data-src="/fixtures/notifications.svg"
      >
        <defs>
          <path
            id="a-1"
            d="M8.5 20c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6.5-6V8.5c0-3.07-2.13-5.64-5-6.32V1.5C10 .67 9.33 0 8.5 0S7 .67 7 1.5v.68c-2.87.68-5 3.25-5 6.32V14l-2 2v1h17v-1l-2-2z"
          ></path>
        </defs>
        <g fill="none" fill-rule="evenodd">
          <path d="M0 0h24v24H0z"></path>
          <g transform="translate(3 2)">
            <mask id="b-1" fill="#fff"><use xlink:href="#a-1"></use></mask>
            <use fill="#000" fill-opacity=".7" xlink:href="#a-1"></use>
            <g mask="url(#b-1)">
              <path
                fill="#004876"
                fill-rule="nonzero"
                d="M-103-89406H-3v100h-100z"
              ></path>
            </g>
          </g>
        </g>
      </svg>
    `)
    expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})

test('poll', done => {
  render('poll')
  const each = (_, svg: SVGSVGElement) => {
    const actual = format(svg.outerHTML)
    const expected = format(`
      <svg
        xmlns="http://www.w3.org/2000/svg"
        xmlns:xlink="http://www.w3.org/1999/xlink"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        id="inject-me"
        class="injected-svg"
        data-src="/fixtures/poll.svg"
      >
        <defs>
          <path
            id="a-1"
            d="M16 0H2C.9 0 0 .9 0 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V2c0-1.1-.9-2-2-2zM6 14H4V7h2v7zm4 0H8V4h2v10zm4 0h-2v-4h2v4z"
          ></path>
        </defs>
        <g fill="none" fill-rule="evenodd">
          <path d="M0 0h24v24H0z"></path>
          <g transform="translate(3 3)">
            <mask id="b-1" fill="#fff"><use xlink:href="#a-1"></use></mask>
            <use fill="#000" fill-opacity=".7" xlink:href="#a-1"></use>
            <g mask="url(#b-1)">
              <path
                fill="#004876"
                fill-rule="nonzero"
                d="M-103-91019H-3v100h-100z"
              ></path>
            </g>
          </g>
        </g>
      </svg>
    `)
    expect(actual).to.equal(expected)
    cleanup()
    done()
  }
  SVGInjector(document.getElementById('inject-me'), { each })
})
*/
})
