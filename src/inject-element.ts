import defer from './defer'
import evalSvgScripts from './eval-svg-scripts'
import extractSymbol from './extract-symbol'
import loadSvgCached from './load-svg-cached'
import loadSvgUncached from './load-svg-uncached'
import parseDataUrl from './parse-data-url'
import renumerateSvgIriElements from './renumerate-svg-iri-elements'
import type { BeforeEach, Errback, EvalScripts } from './types'

// Tracks elements currently being injected. Prevents duplicate injection if
// SVGInjector is called with the same element twice before the first injection
// completes. Entries are removed by the completion and error paths of the
// injection that added them.
const elementsInFlight = new Set<Element>()
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
    defer(() => {
      callback(new Error('Invalid data-src or src attribute'))
    })
    return
  }

  if (elementsInFlight.has(el)) {
    // Leave the element marked: the injection that added it is still running
    // and owns the removal. Reporting an error keeps the `afterEach` and
    // `afterAll` accounting in `SVGInjector` correct.
    defer(() => {
      callback(new Error(`Injection already in progress: ${elUrl}`))
    })
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
    // The release is not deferred with the callback: a second call made in the
    // gap starts a fresh injection rather than hitting the in-flight guard,
    // which is how every asynchronous load error already behaves.
    elementsInFlight.delete(el)
    defer(() => {
      callback(dataUrlResult)
    })
    return
  }

  const handleLoadedSvg = (error: Error | null, loadedSvg?: SVGSVGElement) => {
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
      renumerateSvgIriElements(svg)
    }

    // Remove invalid namespaces that SVG editing tools may have added.
    svg.removeAttribute('xmlns:a')

    evalSvgScripts(svg, evalScripts, elUrl)

    // Some browsers don't evaluate <style> tags in SVGs that are dynamically
    // added to the page. This triggers a re-read. Reference:
    // https://github.com/iconic/SVGInjector/issues/23.
    for (const styleTag of svg.querySelectorAll('style')) {
      styleTag.textContent += ''
    }

    svg.setAttribute('xmlns', svgNamespace)
    svg.setAttribute('xmlns:xlink', xlinkNamespace)

    try {
      beforeEach(svg)
    } catch (error) {
      // A throwing `beforeEach` is a failed injection like any other: release
      // the guard so the element is retryable, leave the placeholder in the
      // DOM, and report through the element's callback so the accounting stays
      // exactly-once. The rethrow keeps the consumer's bug uncaught, which is
      // where it belongs; it escapes the task this runs in, so it costs the
      // other elements in the collection nothing.
      elementsInFlight.delete(el)
      callback(error instanceof Error ? error : new Error(String(error)))
      throw error
    }

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
    // Deferred to match the XHR path, per the callback timing note in
    // `svg-injector.ts`.
    defer(() => {
      handleLoadedSvg(null, dataUrlResult)
    })
    return
  }

  const loadSvg = cacheRequests ? loadSvgCached : loadSvgUncached

  loadSvg(baseUrl, httpRequestWithCredentials, handleLoadedSvg)
}

export default injectElement
