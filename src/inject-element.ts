import extractSymbol from './extract-symbol'
import loadSvgCached from './load-svg-cached'
import loadSvgUncached from './load-svg-uncached'
import parseDataUrl from './parse-data-url'
import type { BeforeEach, Errback, EvalScripts } from './types'
import uniqueId from './unique-id'

type ElementType = Element | HTMLElement | null

// Tracks elements currently being injected. Prevents duplicate injection if
// SVGInjector is called with the same element twice before the first injection
// completes.
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

  if (injectedElements.indexOf(el) !== -1) {
    injectedElements.splice(injectedElements.indexOf(el), 1)
    // Release the DOM reference to allow GC. The cast is needed because the
    // parameter is typed as NonNullable.
    ;(el as ElementType) = null
    return
  }

  injectedElements.push(el)
  // Clear src to prevent the browser from fetching the original image URL while
  // the SVG load is in progress.
  el.setAttribute('src', '')

  // Strip fragment identifier for sprite support. The base URL is used for
  // loading/caching so all symbols from the same sprite share one request.
  const hashIndex = elUrl.indexOf('#')
  const baseUrl = hashIndex !== -1 ? elUrl.slice(0, hashIndex) : elUrl
  const symbolId = hashIndex !== -1 ? elUrl.slice(hashIndex + 1) : null

  // Data URLs already contain the SVG content, so parse them directly instead
  // of making a pointless XHR. This avoids CSP violations that occur when
  // browsers (or bundlers like Vite) inline SVGs as data URIs.
  const dataUrlResult = parseDataUrl(baseUrl)
  if (dataUrlResult instanceof Error) {
    injectedElements.splice(injectedElements.indexOf(el), 1)
    ;(el as ElementType) = null
    callback(dataUrlResult)
    return
  }

  const handleLoadedSvg = (error: Error | null, loadedSvg?: SVGSVGElement) => {
    if (!loadedSvg) {
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
      // Rewrite IRI element ids to be unique across injection instances.
      // Browsers skip clipPaths in hidden parent elements, so duplicate ids
      // cause all but the first instance to lose clipping. Reference:
      // https://bugzilla.mozilla.org/show_bug.cgi?id=376027.
      //
      // IRI-addressable elements mapped to referencing properties per the SVG
      // spec: http://www.w3.org/TR/SVG/linking.html#processingIRI.
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

    // Remove invalid namespaces that SVG editing tools may have added.
    svg.removeAttribute('xmlns:a')

    // Injected SVGs don't automatically run their script elements, so extract
    // and evaluate them manually if requested.

    const scripts = svg.querySelectorAll('script')
    const scriptsToEval: string[] = []
    let script: string | null
    let scriptType: string | null

    for (let i = 0, scriptsLen = scripts.length; i < scriptsLen; i++) {
      const scriptElement = scripts[i]!
      scriptType = scriptElement.getAttribute('type')

      // Only process JavaScript types. SVG defaults to 'application/ecmascript'
      // for unset types.
      /* istanbul ignore else */
      if (
        !scriptType ||
        scriptType === 'application/ecmascript' ||
        scriptType === 'application/javascript' ||
        scriptType === 'text/javascript'
      ) {
        script = scriptElement.innerText || scriptElement.textContent

        /* istanbul ignore else */
        if (script) {
          scriptsToEval.push(script)
        }

        svg.removeChild(scriptElement)
      }
    }

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
        // This is a form of eval, but only for code the caller has explicitly
        // asked to load from their own SVG files. The code runs in a closure,
        // not the global scope.
        new Function(scriptsToEval[l]!)(window)
      }

      ranScripts[elUrl] = true
    }

    // Some browsers don't evaluate <style> tags in SVGs that are dynamically
    // added to the page. This triggers a re-read. Reference:
    // https://github.com/iconic/SVGInjector/issues/23.
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

    el.parentNode.replaceChild(svg, el)
    injectedElements.splice(injectedElements.indexOf(el), 1)
    ;(el as ElementType) = null

    callback(null, svg)
  }

  if (dataUrlResult) {
    // Use setTimeout to match the async behaviour of the XHR path. Callers may
    // depend on injection being asynchronous (e.g. reading DOM state after
    // calling SVGInjector but before the callback fires).
    setTimeout(() => {
      handleLoadedSvg(null, dataUrlResult)
    }, 0)
    return
  }

  const loadSvg = cacheRequests ? loadSvgCached : loadSvgUncached

  loadSvg(baseUrl, httpRequestWithCredentials, handleLoadedSvg)
}

export default injectElement
