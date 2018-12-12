import injectElement from './inject-element'
import { DoneCallback, Errback } from './types'

interface IOptionalArgs {
  done?: DoneCallback
  each?: Errback
  evalScripts?: 'always' | 'once' | 'never'
  pngFallback?: string
  renumerateIRIElements?: boolean
}

/**
 * :NOTE: We are using get/setAttribute with SVG because the SVG DOM spec
 * differs from HTML DOM and can return other unexpected object types when
 * trying to directly access svg properties. ex: "className" returns a
 * SVGAnimatedString with the class value found in the "baseVal" property,
 * instead of simple string like with HTML Elements.
 */
const SVGInjector = (
  elements: HTMLCollectionOf<Element> | NodeListOf<Element> | Element | null,
  {
    done,
    each = () => undefined,
    evalScripts = 'never',
    pngFallback = '',
    renumerateIRIElements = true
  }: IOptionalArgs = {}
) => {
  if (elements && !(elements instanceof Element)) {
    let elementsLoaded = 0
    for (const element of elements) {
      injectElement(
        element,
        (error: Error | null, svg?: SVGSVGElement) => {
          each(error, svg)
          if (
            elements &&
            !(elements instanceof Element) &&
            elements.length === ++elementsLoaded
          ) {
            if (typeof done === 'function') {
              done(elementsLoaded)
            }
          }
        },
        {
          evalScripts,
          pngFallback,
          renumerateIRIElements
        }
      )
    }
    return
  }

  if (elements) {
    injectElement(
      elements,
      (error: Error | null, svg?: SVGSVGElement) => {
        each(error, svg)
        if (typeof done === 'function') {
          done(1)
        }
        elements = null
      },
      {
        evalScripts,
        pngFallback,
        renumerateIRIElements
      }
    )
    return
  }

  if (typeof done === 'function') {
    done(0)
  }
}

export default SVGInjector
