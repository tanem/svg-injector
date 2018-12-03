import injectElement from './inject-element'

/**
 * :NOTE: We are using get/setAttribute with SVG because the SVG DOM spec
 * differs from HTML DOM and can return other unexpected object types when
 * trying to directly access svg properties. ex: "className" returns a
 * SVGAnimatedString with the class value found in the "baseVal" property,
 * instead of simple string like with HTML Elements.
 */
const SVGInjector = (
  elements,
  {
    evalScripts = 'always',
    pngFallback = '',
    each = () => undefined,
    renumerateIRIElements = true
  }: {
    evalScripts?: 'always' | 'once' | 'never'
    pngFallback?: string
    each?: (error: null | Error, svg?: SVGSVGElement) => void
    renumerateIRIElements?: boolean
  } = {},
  done: (elementsLoaded: number) => void = () => undefined
) => {
  if (elements.length !== undefined) {
    let elementsLoaded = 0
    Array.prototype.forEach.call(elements, element => {
      injectElement(
        element,
        evalScripts,
        pngFallback,
        renumerateIRIElements,
        (error, svg) => {
          each(error, svg)

          if (elements.length === ++elementsLoaded) {
            done(elementsLoaded)
          }
        }
      )
    })
  } else {
    if (elements) {
      injectElement(
        elements,
        evalScripts,
        pngFallback,
        renumerateIRIElements,
        (error, svg) => {
          each(error, svg)
          done(1)
          elements = null
        }
      )
    } else {
      done(0)
    }
  }
}

export default SVGInjector
