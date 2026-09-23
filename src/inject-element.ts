import defer from './defer'
import evalSvgScripts from './eval-svg-scripts'
import extractSymbol from './extract-symbol'
import loadSvgCached from './load-svg-cached'
import loadSvgUncached from './load-svg-uncached'
import parseDataUrl from './parse-data-url'
import renumerateSvgIriElements from './renumerate-svg-iri-elements'
import type { Errback, InjectOptions } from './types'

// Tracks elements currently being injected. Prevents duplicate injection if
// SVGInjector is called with the same element twice before the first injection
// completes. An entry is removed only by the settle of the injection that added
// it.
const elementsInFlight = new Set<Element>()
const svgNamespace = 'http://www.w3.org/2000/svg'
const xlinkNamespace = 'http://www.w3.org/1999/xlink'

const injectElement = (
  el: Element,
  {
    evalScripts,
    renumerateIRIElements,
    cacheRequests,
    httpRequestWithCredentials,
    beforeEach,
  }: InjectOptions,
  callback: Errback,
) => {
  // The single completion of an injection (Settle in CONTEXT.md). Every path
  // out of `injectElement` ends here, so calling back exactly once, never
  // before `SVGInjector` returns, and releasing the in-flight guard each have
  // one implementation. It always defers, so no path has to know whether it is
  // already running asynchronously. A second call is a no-op. The guard is
  // released only if this injection acquired it. The release happens before
  // the deferred callback runs on purpose: a call made in the gap, or from the
  // callback itself, starts a fresh injection rather than hitting the guard.
  let settled = false
  let acquired = false
  const settle: Errback = (error, svg) => {
    if (settled) return
    settled = true
    if (acquired) elementsInFlight.delete(el)
    defer(() => {
      callback(error, svg)
    })
  }

  const elUrl = el.getAttribute('data-src') ?? el.getAttribute('src')

  if (!elUrl) {
    settle(new Error('Invalid data-src or src attribute'))
    return
  }

  if (elementsInFlight.has(el)) {
    // `acquired` is still false, so settling leaves the element marked: the
    // injection that added it is still running and owns the removal.
    settle(new Error(`Injection already in progress: ${elUrl}`))
    return
  }

  elementsInFlight.add(el)
  acquired = true
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
    settle(dataUrlResult)
    return
  }

  const handleLoadedSvg = (error: Error | null, loadedSvg?: SVGSVGElement) => {
    if (!loadedSvg) {
      settle(error)
      return
    }

    let svg = loadedSvg

    if (symbolId) {
      const symbolSvg = extractSymbol(loadedSvg, symbolId)

      if (!symbolSvg) {
        settle(new Error(`Symbol "${symbolId}" not found in ${baseUrl}`))
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
      // A throwing `beforeEach` is a failed injection like any other: settle
      // with the error, which releases the guard so the element is retryable,
      // and leave the placeholder in the DOM. The rethrow keeps the consumer's
      // bug uncaught, which is where it belongs; it escapes the current task,
      // so it costs the other elements in the collection nothing. `afterEach`
      // sees the error afterwards, in the deferred settle task.
      settle(error instanceof Error ? error : new Error(String(error)))
      throw error
    }

    if (!el.parentNode) {
      settle(new Error('Parent node is null'))
      return
    }

    el.parentNode.replaceChild(svg, el)
    settle(null, svg)
  }

  // The transform runs consumer code (`beforeEach`, and SVG scripts under
  // `evalScripts`), so it gets a task of its own. A data URL and a cache hit
  // deliver synchronously, where running it inline would swap the DOM before
  // `SVGInjector` returns and let a throw escape the call, stopping the rest of
  // a collection. The XHR paths deliver from inside the `onreadystatechange`
  // try block in `make-ajax-request.ts`, which would catch the throw and report
  // it as a load failure.
  const onLoaded: Errback = (error, loadedSvg) => {
    defer(() => {
      handleLoadedSvg(error, loadedSvg)
    })
  }

  if (dataUrlResult) {
    onLoaded(null, dataUrlResult)
    return
  }

  const loadSvg = cacheRequests ? loadSvgCached : loadSvgUncached

  loadSvg(baseUrl, httpRequestWithCredentials, onLoaded)
}

export default injectElement
