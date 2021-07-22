import cache from './cache'
import cloneSvg from './clone-svg'
import makeAjaxRequest from './make-ajax-request'
import { processRequestQueue, queueRequest } from './request-queue'
import { Errback } from './types'

const loadSvgCached = (
  url: string,
  httpRequestWithCredentials: boolean,
  callback: Errback
) => {
  if (cache.has(url)) {
    const cacheValue = cache.get(url)

    if (cacheValue === undefined) {
      queueRequest(url, callback)
      return
    }

    /* istanbul ignore else */
    if (cacheValue instanceof SVGSVGElement) {
      callback(null, cloneSvg(cacheValue))
      return
    }

    // Errors are always refetched.
  }

  // Seed the cache to indicate we are loading this URL.
  cache.set(url, undefined)
  queueRequest(url, callback)

  makeAjaxRequest(url, httpRequestWithCredentials, (error, httpRequest) => {
    /* istanbul ignore else */
    if (error) {
      cache.set(url, error)
    } else if (
      httpRequest.responseXML instanceof Document &&
      httpRequest.responseXML.documentElement &&
      httpRequest.responseXML.documentElement instanceof SVGSVGElement
    ) {
      cache.set(url, httpRequest.responseXML.documentElement)
    }
    processRequestQueue(url)
  })
}

export default loadSvgCached
