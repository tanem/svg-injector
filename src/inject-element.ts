import extractSymbol from './extract-symbol'
import loadSvgCached from './load-svg-cached'
import loadSvgUncached from './load-svg-uncached'
import type { BeforeEach, Errback, EvalScripts } from './types'
import uniqueId from './unique-id'

type ElementType = Element | HTMLElement | null

const injectedElements: ElementType[] = []
const ranScripts: Record<string, boolean> = {}
const svgNamespace = 'http://www.w3.org/2000/svg'
const xlinkNamespace = 'http://www.w3.org/1999/xlink'

const injectElement = (
  el: NonNullable<ElementType>,
  evalScripts: EvalScripts,
  renumerateIRIElements: boolean,
  cacheRequests: boolean,
  httpRequestWithCredentials: boolean,
  beforeEach: BeforeEach,
  callback: Errback,
) => {
  const elUrl = el.getAttribute('data-src') ?? el.getAttribute('src')

  if (!elUrl) {
    callback(new Error('Invalid data-src or src attribute'))
    return
  }

  // Make sure we aren't already in the process of injecting this element to
  // avoid a race condition if multiple injections for the same element are run.
  // :NOTE: Using indexOf() only _after_ we check for SVG support and bail, so
  // no need for IE8 indexOf() polyfill.
  if (injectedElements.indexOf(el) !== -1) {
    // TODO: Extract.
    injectedElements.splice(injectedElements.indexOf(el), 1)
    ;(el as ElementType) = null
    return
  }

  // Remember the request to inject this element, in case other injection calls
  // are also trying to replace this element before we finish.
  injectedElements.push(el)

  // Try to avoid loading the orginal image src if possible.
  el.setAttribute('src', '')

  // Strip fragment identifier for sprite support. The base URL is used for
  // loading/caching so all symbols from the same sprite share one request.
  const hashIndex = elUrl.indexOf('#')
  const baseUrl = hashIndex !== -1 ? elUrl.slice(0, hashIndex) : elUrl
  const symbolId = hashIndex !== -1 ? elUrl.slice(hashIndex + 1) : null

  const loadSvg = cacheRequests ? loadSvgCached : loadSvgUncached

  loadSvg(baseUrl, httpRequestWithCredentials, (error, loadedSvg) => {
    if (!loadedSvg) {
      // TODO: Extract.
      injectedElements.splice(injectedElements.indexOf(el), 1)
      ;(el as ElementType) = null
      callback(error)
      return
    }

    let svg = loadedSvg

    if (symbolId) {
      const symbolSvg = extractSymbol(loadedSvg, symbolId)

      if (!symbolSvg) {
        injectedElements.splice(injectedElements.indexOf(el), 1)
        ;(el as ElementType) = null
        callback(new Error(`Symbol "${symbolId}" not found in ${baseUrl}`))
        return
      }

      svg = symbolSvg
    }

    const elId = el.getAttribute('id')
    if (elId) {
      svg.setAttribute('id', elId)
    }

    const elTitle = el.getAttribute('title')
    if (elTitle) {
      svg.setAttribute('title', elTitle)
    }

    const elWidth = el.getAttribute('width')
    if (elWidth) {
      svg.setAttribute('width', elWidth)
    }

    const elHeight = el.getAttribute('height')
    if (elHeight) {
      svg.setAttribute('height', elHeight)
    }

    const mergedClasses = Array.from(
      new Set([
        ...(svg.getAttribute('class') ?? '').split(' '),
        'injected-svg',
        ...(el.getAttribute('class') ?? '').split(' '),
      ]),
    )
      .join(' ')
      .trim()
    svg.setAttribute('class', mergedClasses)

    const elStyle = el.getAttribute('style')
    if (elStyle) {
      svg.setAttribute('style', elStyle)
    }

    svg.setAttribute('data-src', elUrl)

    // Copy all the data elements to the svg.
    const elData: Attr[] = [].filter.call(el.attributes, (at: Attr) => {
      return /^data-\w[\w-]*$/.test(at.name)
    })

    Array.prototype.forEach.call(elData, (dataAttr: Attr) => {
      /* istanbul ignore else */
      if (dataAttr.name && dataAttr.value) {
        svg.setAttribute(dataAttr.name, dataAttr.value)
      }
    })

    if (renumerateIRIElements) {
      // Make sure any internally referenced clipPath ids and their clip-path
      // references are unique.
      //
      // This addresses the issue of having multiple instances of the same SVG
      // on a page and only the first clipPath id is referenced.
      //
      // Browsers often shortcut the SVG Spec and don't use clipPaths contained
      // in parent elements that are hidden, so if you hide the first SVG
      // instance on the page, then all other instances lose their clipping.
      // Reference: https://bugzilla.mozilla.org/show_bug.cgi?id=376027

      // Handle all defs elements that have iri capable attributes as defined by
      // w3c: http://www.w3.org/TR/SVG/linking.html#processingIRI. Mapping IRI
      // addressable elements to the properties that can reference them.
      const iriElementsAndProperties: Record<string, string[]> = {
        clipPath: ['clip-path'],
        'color-profile': ['color-profile'],
        cursor: ['cursor'],
        filter: ['filter'],
        linearGradient: ['fill', 'stroke'],
        marker: ['marker', 'marker-start', 'marker-mid', 'marker-end'],
        mask: ['mask'],
        path: [],
        pattern: ['fill', 'stroke'],
        radialGradient: ['fill', 'stroke'],
      }

      const replaceIriReferences = (
        value: string,
        iriIdMap: Record<string, string>,
      ) => {
        return value.replace(
          /url\((['"]?)\s*#([^\s'"\)]+)\s*\1\)/g,
          (match: string, _quote: string, iriId: string) => {
            const newId = iriIdMap[iriId]
            return newId ? `url(#${newId})` : match
          },
        )
      }

      const replaceHrefReference = (
        value: string,
        iriIdMap: Record<string, string>,
      ) => {
        if (!value.startsWith('#')) {
          return value
        }

        const iriId = value.slice(1)
        const newId = iriIdMap[iriId]
        return newId ? '#' + newId : value
      }

      let element: string
      let elements: NodeListOf<Element>
      let properties: string[]
      let currentId: string
      let newId: string

      const renumeratedElements: Array<{
        element: Element
        currentId: string
        newId: string
      }> = []
      const iriIdMap: Record<string, string> = {}

      Object.keys(iriElementsAndProperties).forEach((key) => {
        element = key
        elements = svg.querySelectorAll(element + '[id]')
        for (let a = 0, elementsLen = elements.length; a < elementsLen; a++) {
          const currentElement = elements[a]!
          currentId = currentElement.id
          newId = currentId + '-' + uniqueId()

          iriIdMap[currentId] = newId
          renumeratedElements.push({
            element: currentElement,
            currentId,
            newId,
          })
        }
      })

      Object.keys(iriElementsAndProperties).forEach((key) => {
        properties = iriElementsAndProperties[key]!

        // All of the properties that can reference this element type.
        let referencingElements: NodeListOf<Element>
        Array.prototype.forEach.call(properties, (property: string) => {
          referencingElements = svg.querySelectorAll('[' + property + ']')
          for (
            let b = 0, referencingElementLen = referencingElements.length;
            b < referencingElementLen;
            b++
          ) {
            const referencingElement = referencingElements[b]!
            const attrValue: string | null =
              referencingElement.getAttribute(property)
            /* istanbul ignore else */
            if (attrValue) {
              const nextValue = replaceIriReferences(attrValue, iriIdMap)
              if (nextValue !== attrValue) {
                referencingElement.setAttribute(property, nextValue)
              }
            }
          }
        })
      })

      const allLinks = svg.querySelectorAll('*')
      for (let c = 0, allLinksLen = allLinks.length; c < allLinksLen; c++) {
        const link = allLinks[c]!
        const href = link.getAttribute('href')
        if (href) {
          const nextHref = replaceHrefReference(href, iriIdMap)
          if (nextHref !== href) {
            link.setAttribute('href', nextHref)
          }
        }

        const xlinkHref = link.getAttributeNS(xlinkNamespace, 'href')
        if (xlinkHref) {
          const nextXlinkHref = replaceHrefReference(xlinkHref, iriIdMap)
          if (nextXlinkHref !== xlinkHref) {
            link.setAttributeNS(xlinkNamespace, 'href', nextXlinkHref)
          }
        }
      }

      const styleElements = svg.querySelectorAll('[style]')
      for (
        let d = 0, styleElementsLen = styleElements.length;
        d < styleElementsLen;
        d++
      ) {
        const styleElement = styleElements[d]!
        const styleValue = styleElement.getAttribute('style')
        /* istanbul ignore else */
        if (styleValue) {
          const nextStyleValue = replaceIriReferences(styleValue, iriIdMap)
          if (nextStyleValue !== styleValue) {
            styleElement.setAttribute('style', nextStyleValue)
          }
        }
      }

      const styleTagElements = svg.querySelectorAll('style')
      for (
        let e = 0, styleTagElementsLen = styleTagElements.length;
        e < styleTagElementsLen;
        e++
      ) {
        const styleTagElement = styleTagElements[e]!
        const textContent = styleTagElement.textContent
        /* istanbul ignore else */
        if (textContent) {
          const nextTextContent = replaceIriReferences(textContent, iriIdMap)
          if (nextTextContent !== textContent) {
            styleTagElement.textContent = nextTextContent
          }
        }
      }

      for (
        let f = 0, renumeratedElementsLen = renumeratedElements.length;
        f < renumeratedElementsLen;
        f++
      ) {
        renumeratedElements[f]!.element.id = renumeratedElements[f]!.newId
      }
    }

    // Remove any unwanted/invalid namespaces that might have been added by SVG
    // editing tools.
    svg.removeAttribute('xmlns:a')

    // Post page load injected SVGs don't automatically have their script
    // elements run, so we'll need to make that happen, if requested.

    // Find then prune the scripts.
    const scripts = svg.querySelectorAll('script')
    const scriptsToEval: string[] = []
    let script: string | null
    let scriptType: string | null

    for (let i = 0, scriptsLen = scripts.length; i < scriptsLen; i++) {
      const scriptElement = scripts[i]!
      scriptType = scriptElement.getAttribute('type')

      // Only process javascript types. SVG defaults to 'application/ecmascript'
      // for unset types.
      /* istanbul ignore else */
      if (
        !scriptType ||
        scriptType === 'application/ecmascript' ||
        scriptType === 'application/javascript' ||
        scriptType === 'text/javascript'
      ) {
        // innerText for IE, textContent for other browsers.
        script = scriptElement.innerText || scriptElement.textContent

        // Stash.
        /* istanbul ignore else */
        if (script) {
          scriptsToEval.push(script)
        }

        // Tidy up and remove the script element since we don't need it anymore.
        svg.removeChild(scriptElement)
      }
    }

    // Run/Eval the scripts if needed.
    if (
      scriptsToEval.length > 0 &&
      (evalScripts === 'always' ||
        (evalScripts === 'once' && !ranScripts[elUrl]))
    ) {
      for (
        let l = 0, scriptsToEvalLen = scriptsToEval.length;
        l < scriptsToEvalLen;
        l++
      ) {
        // :NOTE: Yup, this is a form of eval, but it is being used to eval code
        // the caller has explictely asked to be loaded, and the code is in a
        // caller defined SVG file... not raw user input.
        //
        // Also, the code is evaluated in a closure and not in the global scope.
        // If you need to put something in global scope, use 'window'.
        new Function(scriptsToEval[l]!)(window)
      }

      // Remember we already ran scripts for this svg.
      ranScripts[elUrl] = true
    }

    // :WORKAROUND: IE doesn't evaluate <style> tags in SVGs that are
    // dynamically added to the page. This trick will trigger IE to read and use
    // any existing SVG <style> tags.
    //
    // Reference: https://github.com/iconic/SVGInjector/issues/23.
    const styleTags = svg.querySelectorAll('style')
    Array.prototype.forEach.call(styleTags, (styleTag: HTMLStyleElement) => {
      styleTag.textContent += ''
    })

    svg.setAttribute('xmlns', svgNamespace)
    svg.setAttribute('xmlns:xlink', xlinkNamespace)

    beforeEach(svg)

    if (!el.parentNode) {
      injectedElements.splice(injectedElements.indexOf(el), 1)
      ;(el as ElementType) = null
      callback(new Error('Parent node is null'))
      return
    }

    // Replace the image with the svg.
    el.parentNode.replaceChild(svg, el)

    // Now that we no longer need it, drop references to the original element so
    // it can be GC'd.
    // TODO: Extract
    injectedElements.splice(injectedElements.indexOf(el), 1)
    ;(el as ElementType) = null

    callback(null, svg)
  })
}

export default injectElement
