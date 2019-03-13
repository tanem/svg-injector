import injectElement from './inject-element'
import { DoneCallback, Errback, EvalScripts } from './types'

type Elements = HTMLCollectionOf<Element> | NodeListOf<Element> | Element | null

interface OptionalArgs {
  done?: DoneCallback
  each?: Errback
  evalScripts?: EvalScripts
  renumerateIRIElements?: boolean
}

const SVGInjector = (
  elements: Elements,
  {
    done = () => undefined,
    each = () => undefined,
    evalScripts = EvalScripts.Never,
    renumerateIRIElements = true
  }: OptionalArgs = {}
) => {
  if (elements && 'length' in elements) {
    let elementsLoaded = 0
    for (let i = 0, j = elements.length; i < j; i++) {
      injectElement(
        elements[i],
        (error, svg) => {
          each(error, svg)
          if (
            elements &&
            'length' in elements &&
            elements.length === ++elementsLoaded
          ) {
            done(elementsLoaded)
          }
        },
        {
          evalScripts,
          renumerateIRIElements
        }
      )
    }
  } else if (elements) {
    injectElement(
      elements,
      (error, svg) => {
        each(error, svg)
        done(1)
        elements = null
      },
      {
        evalScripts,
        renumerateIRIElements
      }
    )
  } else {
    done(0)
  }
}

export default SVGInjector
