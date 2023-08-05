import injectElement from './inject-element'
import { AfterAll, BeforeEach, Errback, EvalScripts } from './types'

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
    let elementsLoaded = 0
    for (let i = 0, j = elements.length; i < j; i++) {
      injectElement(
        elements[i],
        evalScripts,
        renumerateIRIElements,
        cacheRequests,
        httpRequestWithCredentials,
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
        elements = null
      },
    )
  } else {
    afterAll(0)
  }
}

export default SVGInjector
