import injectElement from './inject-element'
import { AfterAll, BeforeEach, Errback, EvalScripts } from './types'

type Elements = HTMLCollectionOf<Element> | NodeListOf<Element> | Element | null

interface OptionalArgs {
  afterAll?: AfterAll
  afterEach?: Errback
  beforeEach?: BeforeEach
  cacheRequests?: boolean
  evalScripts?: EvalScripts
  renumerateIRIElements?: boolean
  httpRequestWithCredentials?: boolean
}

const SVGInjector = (
  elements: Elements,
  {
    afterAll = () => undefined,
    afterEach = () => undefined,
    beforeEach = () => undefined,
    cacheRequests = true,
    evalScripts = 'never',
    renumerateIRIElements = true,
    httpRequestWithCredentials = false,
  }: OptionalArgs = {}
) => {
  if (elements && 'length' in elements) {
    let elementsLoaded = 0
    for (let i = 0, j = elements.length; i < j; i++) {
      injectElement(
        elements[i],
        evalScripts,
        renumerateIRIElements,
        cacheRequests,
        beforeEach,
        (error, svg) => {
          afterEach(error, svg)
          if (
            elements &&
            'length' in elements &&
            elements.length === ++elementsLoaded
          ) {
            afterAll(elementsLoaded)
          }
        },
        httpRequestWithCredentials
      )
    }
  } else if (elements) {
    injectElement(
      elements,
      evalScripts,
      renumerateIRIElements,
      cacheRequests,
      beforeEach,
      (error, svg) => {
        afterEach(error, svg)
        afterAll(1)
        elements = null
      },
      httpRequestWithCredentials
    )
  } else {
    afterAll(0)
  }
}

export default SVGInjector
