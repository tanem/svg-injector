import defer from './defer'
import injectElement from './inject-element'
import type {
  AfterAll,
  AfterEach,
  BeforeEach,
  Elements,
  EvalScripts,
} from './types'

interface OptionalArgs {
  afterAll?: AfterAll
  afterEach?: AfterEach
  beforeEach?: BeforeEach
  cacheRequests?: boolean
  evalScripts?: EvalScripts
  httpRequestWithCredentials?: boolean
  renumerateIRIElements?: boolean
}

// Callback timing does not depend on what was passed in or on cache state.
// Every path out of here defers, so `afterEach` and `afterAll` never fire
// before `SVGInjector` returns and code that reads DOM state in between sees
// the pre-injection DOM in every case. `grep defer src/` lists the places that
// enforce it.
//
// The completion accounting sits in a `finally` for the same reason: `afterEach`
// is consumer code, and a throw from it must not cost the collection its
// `afterAll`. The exception still propagates uncaught afterwards.
//
// The third `afterEach` argument is added here rather than in the pipeline
// because both branches below already hold the element in a closure, so
// `injectElement` and the load path under it stay per-URL and unchanged.
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
  // A single element is recognised before a collection is, because
  // `HTMLFormElement` and `HTMLSelectElement` carry a `length` property:
  // deciding on `length` first sends a lone form or select down the collection
  // path, which iterates its controls instead of injecting the element itself.
  // The test is `nodeType`, a property of the node, rather than
  // `instanceof Element`, which relies on the `Element` global: an element
  // belonging to another document's realm, or seen through an `Element` that
  // another library has replaced, fails `instanceof` and would be mistaken for
  // a collection.
  if (elements && 'nodeType' in elements) {
    injectElement(
      elements,
      evalScripts,
      renumerateIRIElements,
      cacheRequests,
      httpRequestWithCredentials,
      beforeEach,
      (error, svg) => {
        try {
          afterEach(error, svg, elements)
        } finally {
          afterAll(1)
        }
      },
    )
  } else if (elements) {
    // Snapshot up front: a live `HTMLCollection` shrinks as its elements are
    // replaced by their injected SVGs, so the completion count has to come
    // from what was passed in rather than from the collection itself.
    const elementList = Array.from(elements)

    if (elementList.length === 0) {
      defer(() => {
        afterAll(0)
      })
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
          try {
            afterEach(error, svg, element)
          } finally {
            if (elementList.length === ++elementsLoaded) {
              afterAll(elementsLoaded)
            }
          }
        },
      )
    }
  } else {
    defer(() => {
      afterAll(0)
    })
  }
}

export default SVGInjector
