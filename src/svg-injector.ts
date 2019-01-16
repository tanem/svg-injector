import injectElement from './inject-element'
import { EvalScripts, IOptionalArgs } from './types'

const SVGInjector = (
  elements: HTMLCollectionOf<Element> | NodeListOf<Element> | Element | null,
  {
    done = () => undefined,
    each = () => undefined,
    evalScripts = EvalScripts.Never,
    renumerateIRIElements = true
  }: IOptionalArgs = {}
) => {
  if (elements && 'length' in elements) {
    let elementsLoaded = 0
    for (let i = 0, j = elements.length; i < j; i++) {
      injectElement(
        elements[i],
        (error: Error | null, svg?: Element) => {
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
      (error: Error | null, svg?: Element) => {
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
