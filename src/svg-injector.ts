import injectElement from './inject-element'
import { AfterAll, BeforeEach, Errback, EvalScripts } from './types'

type Elements = HTMLCollectionOf<Element> | NodeListOf<Element> | Element | null

interface OptionalArgs {
  afterAll?: AfterAll
  afterEach?: Errback
  beforeEach?: BeforeEach
  evalScripts?: EvalScripts
  renumerateIRIElements?: boolean
}

const SVGInjector = (
  elements: Elements,
  {
    afterAll = () => undefined,
    afterEach = () => undefined,
    beforeEach = () => undefined,
    evalScripts = EvalScripts.Never,
    renumerateIRIElements = true
  }: OptionalArgs = {}
) => {
  if (elements && 'length' in elements) {
    let elementsLoaded = 0
    for (let i = 0, j = elements.length; i < j; i++) {
      injectElement(
        elements[i],
        evalScripts,
        renumerateIRIElements,
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
        }
      )
    }
  } else if (elements) {
    injectElement(
      elements,
      evalScripts,
      renumerateIRIElements,
      beforeEach,
      (error, svg) => {
        afterEach(error, svg)
        afterAll(1)
        elements = null
      }
    )
  } else {
    afterAll(0)
  }
}

export default SVGInjector
