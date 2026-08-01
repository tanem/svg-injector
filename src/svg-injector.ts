import injectElement from './inject-element'
import type { AfterAll, BeforeEach, Errback, EvalScripts } from './types'

type Elements = HTMLCollectionOf<Element> | NodeListOf<Element> | Element | null

interface OptionalArgs {
  afterAll?: AfterAll
  afterEach?: Errback
  beforeEach?: BeforeEach
  cacheRequests?: boolean
  evalScripts?: EvalScripts
  httpRequestWithCredentials?: boolean
  renumerateIRIElements?: boolean
}

const SVGInjector = (
  elements: Elements,
  {
    afterAll = () => undefined,
    afterEach = () => undefined,
    beforeEach = () => undefined,
    cacheRequests = true,
    evalScripts = 'never',
    httpRequestWithCredentials = false,
    renumerateIRIElements = true,
  }: OptionalArgs = {},
) => {
  if (elements && 'length' in elements) {
    // Snapshot up front: a live `HTMLCollection` changes as elements are
    // replaced by their injected SVGs, and a cached URL is injected
    // synchronously, so iterating it directly would skip elements and leave
    // the completion count unreachable.
    const elementList = Array.from(elements)

    if (elementList.length === 0) {
      // Defer to match the async behaviour of the injection paths, so
      // `afterAll` never fires before `SVGInjector` returns.
      setTimeout(() => {
        afterAll(0)
      }, 0)
      return
    }

    let elementsLoaded = 0
    for (const element of elementList) {
      injectElement(
        element,
        evalScripts,
        renumerateIRIElements,
        cacheRequests,
        httpRequestWithCredentials,
        beforeEach,
        (error, svg) => {
          afterEach(error, svg)
          if (elementList.length === ++elementsLoaded) {
            afterAll(elementsLoaded)
          }
        },
      )
    }
  } else if (elements) {
    injectElement(
      elements,
      evalScripts,
      renumerateIRIElements,
      cacheRequests,
      httpRequestWithCredentials,
      beforeEach,
      (error, svg) => {
        afterEach(error, svg)
        afterAll(1)
      },
    )
  } else {
    afterAll(0)
  }
}

export default SVGInjector
