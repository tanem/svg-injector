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
    // Capture the length up front: a live `HTMLCollection` can change length
    // between this call and the callbacks below, as elements are replaced by
    // their injected SVGs.
    const elementsLength = elements.length

    if (elementsLength === 0) {
      // Defer to match the async behaviour of the injection paths, so
      // `afterAll` never fires before `SVGInjector` returns.
      setTimeout(() => {
        afterAll(0)
      }, 0)
      return
    }

    let elementsLoaded = 0
    for (let i = 0; i < elementsLength; i++) {
      const element = elements[i]
      if (!element) {
        continue
      }
      injectElement(
        element,
        evalScripts,
        renumerateIRIElements,
        cacheRequests,
        httpRequestWithCredentials,
        beforeEach,
        (error, svg) => {
          afterEach(error, svg)
          if (elementsLength === ++elementsLoaded) {
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
        // Release the DOM reference to allow GC.
        elements = null
      },
    )
  } else {
    afterAll(0)
  }
}

export default SVGInjector
