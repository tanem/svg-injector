import injectElement from './inject-element'
import type {
  AfterAll,
  BeforeEach,
  Elements,
  Errback,
  EvalScripts,
} from './types'

interface OptionalArgs {
  afterAll?: AfterAll
  afterEach?: Errback
  beforeEach?: BeforeEach
  cacheRequests?: boolean
  evalScripts?: EvalScripts
  httpRequestWithCredentials?: boolean
  renumerateIRIElements?: boolean
}

// Callback timing does not depend on cache state. Every element that reaches
// a load path -- a first request, a hit on an already-loaded URL, or a data
// URL -- has its callbacks deferred, so `afterEach` and `afterAll` never fire
// before `SVGInjector` returns and code that reads DOM state in between sees
// the same thing warm or cold. Arguments rejected before that point still
// report synchronously: a missing `data-src`, an injection already in flight,
// an unparseable data URL, and a null `elements`.
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
    // Snapshot up front: a live `HTMLCollection` shrinks as its elements are
    // replaced by their injected SVGs, so the completion count has to come
    // from what was passed in rather than from the collection itself.
    const elementList = Array.from(elements)

    if (elementList.length === 0) {
      // Deferred like the injection paths: an empty collection is a run that
      // completed, not an argument rejected up front.
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
