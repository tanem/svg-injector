import makeAjaxRequest from './make-ajax-request'
import parseDataUrl from './parse-data-url'
import type { Errback, InjectOptions } from './types'

// The load path (Load path in CONTEXT.md): obtains the SVG document for one
// URL, fragment already stripped, and is the only module that chooses how.
// The callback receives an `SVGSVGElement` that nothing else references and
// the caller may mutate, or an `Error`. It may be called synchronously (a data
// URL, a cache hit, a synchronous `open()` failure) or from an XHR event;
// timing is the caller's concern (`settle` in `inject-element.ts`).

// A URL is either loading — with the callbacks waiting on the response — or
// loaded. Failures are removed rather than recorded, which is how "errors are
// always refetched" is implemented. The cache lasts for the lifetime of the
// page and is unbounded by design; consumers opt out with
// `cacheRequests: false`. The key is the URL with the fragment stripped, so
// every symbol taken from one sprite shares a single request.
type CacheEntry =
  | { state: 'loading'; waiters: Errback[] }
  | { state: 'loaded'; svg: SVGSVGElement }

const cache = new Map<string, CacheEntry>()

const notifyWaiters = (
  waiters: Errback[],
  error: Error | null,
  svg?: SVGSVGElement,
) => {
  for (const waiter of waiters) {
    // The cache retains the original, so each waiter gets its own deep clone
    // that it can modify (attribute transfer, IRI renumeration, script
    // removal) without affecting it or the other waiters. This is the only
    // clone in the package: every other path hands over a document nothing
    // else holds.
    waiter(error, svg ? (svg.cloneNode(true) as SVGSVGElement) : undefined)
  }
}

const loadSvgCached = (
  url: string,
  httpRequestWithCredentials: boolean,
  callback: Errback,
) => {
  const entry = cache.get(url)

  if (entry?.state === 'loaded') {
    notifyWaiters([callback], null, entry.svg)
    return
  }

  if (entry) {
    entry.waiters.push(callback)
    return
  }

  const waiters = [callback]
  cache.set(url, { state: 'loading', waiters })

  makeAjaxRequest(url, httpRequestWithCredentials, (error, svg) => {
    // Each branch replaces or removes the entry before notifying, which
    // detaches `waiters`: a request made from one of those callbacks starts a
    // fresh entry rather than joining the list being notified here.
    if (svg) {
      cache.set(url, { state: 'loaded', svg })
      notifyWaiters(waiters, null, svg)
    } else {
      cache.delete(url)
      notifyWaiters(waiters, error)
    }
  })
}

const loadSvg = (
  url: string,
  {
    cacheRequests,
    httpRequestWithCredentials,
  }: Pick<InjectOptions, 'cacheRequests' | 'httpRequestWithCredentials'>,
  callback: Errback,
) => {
  // Data URLs already contain the SVG content, so parse them directly instead
  // of making a pointless XHR. This avoids CSP violations that occur when
  // browsers (or bundlers like Vite) inline SVGs as data URIs. They never
  // enter the cache, whatever `cacheRequests` is.
  const dataUrlResult = parseDataUrl(url)
  if (dataUrlResult instanceof Error) {
    callback(dataUrlResult)
    return
  }
  if (dataUrlResult) {
    callback(null, dataUrlResult)
    return
  }

  if (cacheRequests) {
    loadSvgCached(url, httpRequestWithCredentials, callback)
    return
  }

  makeAjaxRequest(url, httpRequestWithCredentials, callback)
}

export default loadSvg
