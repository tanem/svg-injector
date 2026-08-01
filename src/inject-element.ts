import extractSymbol from './extract-symbol'
import loadSvgCached from './load-svg-cached'
import loadSvgUncached from './load-svg-uncached'
import parseDataUrl from './parse-data-url'
import type { BeforeEach, Errback, EvalScripts } from './types'
import uniqueId from './unique-id'

// Tracks elements currently being injected. Prevents duplicate injection if
// SVGInjector is called with the same element twice before the first injection
// completes. Entries are removed by the completion and error paths of the
// injection that added them.
const elementsInFlight = new Set<Element>()
const ranScripts = new Set<string>()
const svgNamespace = 'http://www.w3.org/2000/svg'
const xlinkNamespace = 'http://www.w3.org/1999/xlink'

const injectElement = (
  el: Element,
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

  if (elementsInFlight.has(el)) {
    // Leave the element marked: the injection that added it is still running
    // and owns the removal. Reporting an error keeps the `afterEach` and
    // `afterAll` accounting in `SVGInjector` correct.
    callback(new Error(`Injection already in progress: ${elUrl}`))
    return
  }

  elementsInFlight.add(el)
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
    elementsInFlight.delete(el)
    callback(dataUrlResult)
    return
  }

  // The request queue can dispatch a callback that has already run: a retry
  // queued from inside a callback lands in the array the queue is iterating,
  // which stops that array being cleared. Every branch below finishes the
  // injection, so ignore anything after the first, keeping `callback` to one
  // call per `injectElement`.
  let settled = false

  const handleLoadedSvg = (error: Error | null, loadedSvg?: SVGSVGElement) => {
    if (settled) {
      return
    }
    settled = true

    if (!loadedSvg) {
      elementsInFlight.delete(el)
      callback(error)
      return
    }

    let svg = loadedSvg

    if (symbolId) {
      const symbolSvg = extractSymbol(loadedSvg, symbolId)

      if (!symbolSvg) {
        elementsInFlight.delete(el)
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

    for (const attribute of el.attributes) {
      if (/^data-\w[\w-]*$/.test(attribute.name) && attribute.value) {
        svg.setAttribute(attribute.name, attribute.value)
      }
    }

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
        iriIdMap: Map<string, string>,
      ) => {
        return value.replace(
          /url\((['"]?)\s*#([^\s'"\)]+)\s*\1\)/g,
          (match: string, _quote: string, iriId: string) => {
            const newId = iriIdMap.get(iriId)
            return newId ? `url(#${newId})` : match
          },
        )
      }

      const replaceHrefReference = (
        value: string,
        iriIdMap: Map<string, string>,
      ) => {
        if (!value.startsWith('#')) {
          return value
        }

        const newId = iriIdMap.get(value.slice(1))
        return newId ? '#' + newId : value
      }

      // Collected up front and applied last: the reference rewrites below
      // still need to match the original ids.
      const renumeratedElements: Array<{ element: Element; newId: string }> = []
      const iriIdMap = new Map<string, string>()

      for (const tagName of Object.keys(iriElementsAndProperties)) {
        for (const element of svg.querySelectorAll(`${tagName}[id]`)) {
          const newId = `${element.id}-${uniqueId()}`
          iriIdMap.set(element.id, newId)
          renumeratedElements.push({ element, newId })
        }
      }

      // Several element types share referencing properties (`fill`, `stroke`),
      // so collapse the table to the distinct set of properties to look up.
      const referencingProperties = new Set(
        Object.values(iriElementsAndProperties).flat(),
      )

      for (const property of referencingProperties) {
        for (const referencingElement of svg.querySelectorAll(
          `[${property}]`,
        )) {
          const value = referencingElement.getAttribute(property)
          if (value) {
            const nextValue = replaceIriReferences(value, iriIdMap)
            if (nextValue !== value) {
              referencingElement.setAttribute(property, nextValue)
            }
          }
        }
      }

      for (const link of svg.querySelectorAll('*')) {
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

      for (const styleElement of svg.querySelectorAll('[style]')) {
        const styleValue = styleElement.getAttribute('style')
        if (styleValue) {
          const nextStyleValue = replaceIriReferences(styleValue, iriIdMap)
          if (nextStyleValue !== styleValue) {
            styleElement.setAttribute('style', nextStyleValue)
          }
        }
      }

      for (const styleTagElement of svg.querySelectorAll('style')) {
        const textContent = styleTagElement.textContent
        if (textContent) {
          const nextTextContent = replaceIriReferences(textContent, iriIdMap)
          if (nextTextContent !== textContent) {
            styleTagElement.textContent = nextTextContent
          }
        }
      }

      for (const { element, newId } of renumeratedElements) {
        element.id = newId
      }
    }

    // Remove invalid namespaces that SVG editing tools may have added.
    svg.removeAttribute('xmlns:a')

    // Injected SVGs don't automatically run their script elements, so extract
    // and evaluate them manually if requested.

    const scriptsToEval: string[] = []

    for (const scriptElement of svg.querySelectorAll('script')) {
      const scriptType = scriptElement.getAttribute('type')

      // Only process JavaScript types. SVG defaults to 'application/ecmascript'
      // for unset types.
      if (
        !scriptType ||
        scriptType === 'application/ecmascript' ||
        scriptType === 'application/javascript' ||
        scriptType === 'text/javascript'
      ) {
        const script = scriptElement.textContent

        if (script) {
          scriptsToEval.push(script)
        }

        svg.removeChild(scriptElement)
      }
    }

    if (
      scriptsToEval.length > 0 &&
      (evalScripts === 'always' ||
        (evalScripts === 'once' && !ranScripts.has(elUrl)))
    ) {
      for (const scriptToEval of scriptsToEval) {
        // This is a form of eval, but only for code the caller has explicitly
        // asked to load from their own SVG files. The code runs in a closure,
        // not the global scope.
        new Function(scriptToEval)(window)
      }

      ranScripts.add(elUrl)
    }

    // Some browsers don't evaluate <style> tags in SVGs that are dynamically
    // added to the page. This triggers a re-read. Reference:
    // https://github.com/iconic/SVGInjector/issues/23.
    for (const styleTag of svg.querySelectorAll('style')) {
      styleTag.textContent += ''
    }

    svg.setAttribute('xmlns', svgNamespace)
    svg.setAttribute('xmlns:xlink', xlinkNamespace)

    beforeEach(svg)

    if (!el.parentNode) {
      elementsInFlight.delete(el)
      callback(new Error('Parent node is null'))
      return
    }

    el.parentNode.replaceChild(svg, el)
    elementsInFlight.delete(el)

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
