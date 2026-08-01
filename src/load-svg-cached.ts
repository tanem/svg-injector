import cloneSvg from './clone-svg'
import makeAjaxRequest from './make-ajax-request'
import type { Errback } from './types'

// A URL is either loading — with the callbacks waiting on the response — or
// loaded. Failures are removed rather than recorded, which is how "errors are
// always refetched" is implemented. The cache lasts for the lifetime of the
// page and is unbounded by design; consumers opt out with
// `cacheRequests: false`.
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
    // Deferred so a hit on an already-loaded entry, which comes through here
    // too, calls back no earlier than a first load does. Each waiter gets its
    // own clone so it can modify the SVG without affecting the cached
    // original.
    setTimeout(() => {
      waiter(error, svg ? cloneSvg(svg) : undefined)
    }, 0)
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

  makeAjaxRequest(url, httpRequestWithCredentials, (error, httpRequest) => {
    const documentElement = httpRequest.responseXML?.documentElement

    // Each branch replaces or removes the entry before notifying, which
    // detaches `waiters`: a request made from one of those callbacks starts a
    // fresh entry rather than joining the list being notified here.
    if (error) {
      cache.delete(url)
      notifyWaiters(waiters, error)
    } else if (documentElement instanceof SVGSVGElement) {
      cache.set(url, { state: 'loaded', svg: documentElement })
      notifyWaiters(waiters, null, documentElement)
    } else {
      // The request succeeded but the body is not an SVG document, e.g. an
      // HTML page served with a 200 at the SVG's URL.
      cache.delete(url)
      notifyWaiters(
        waiters,
        new Error(`Unable to parse SVG from response: ${url}`),
      )
    }
  })
}

export default loadSvgCached
