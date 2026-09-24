import defer from './defer'
import loadSvg from './load-svg'
import transformSvg from './transform-svg'
import type { Errback, InjectOptions } from './types'

// Tracks elements currently being injected. Prevents duplicate injection if
// SVGInjector is called with the same element twice before the first injection
// completes. An entry is removed only by the settle of the injection that added
// it.
const elementsInFlight = new Set<Element>()

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

  // Only a loaded element takes a task of its own, because only the transform
  // runs consumer code (`beforeEach`, and SVG scripts under `evalScripts`). An
  // error goes to `settle` directly, which already defers the callback. The
  // load path delivers a data URL and a cache hit synchronously, where running
  // the transform inline would swap the DOM before `SVGInjector` returns and
  // let a throw escape the call, stopping the rest of a collection. It delivers
  // an XHR load from inside the transport's event handler, which would catch
  // the throw and report it as a load failure.
  const onLoaded: Errback = (error, loadedSvg) => {
    if (!loadedSvg) {
      settle(error)
      return
    }
    defer(() => {
      const svg = transformSvg(loadedSvg, el, {
        evalScripts,
        renumerateIRIElements,
        url: elUrl,
        baseUrl,
        symbolId,
      })

      if (svg instanceof Error) {
        settle(svg)
        return
      }

      try {
        beforeEach(svg)
      } catch (error) {
        // A throwing `beforeEach` is a failed injection like any other: settle
        // with the error, which releases the guard so the element is
        // retryable, and leave the placeholder in the DOM. The rethrow keeps
        // the consumer's bug uncaught, which is where it belongs; it escapes
        // the current task, so it costs the other elements in the collection
        // nothing. `afterEach` sees the error afterwards, in the deferred
        // settle task.
        settle(error instanceof Error ? error : new Error(String(error)))
        throw error
      }

      if (!el.parentNode) {
        settle(new Error('Parent node is null'))
        return
      }

      el.parentNode.replaceChild(svg, el)
      settle(null, svg)
    })
  }

  loadSvg(baseUrl, { cacheRequests, httpRequestWithCredentials }, onLoaded)
}

export default injectElement
